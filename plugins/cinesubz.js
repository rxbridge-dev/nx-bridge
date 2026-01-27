const { cmd } = require("../command");
const puppeteer = require("puppeteer");
const config = require("../config");

// Session handling
const pendingSearch = {};
const pendingQuality = {};

/* 
 👑 King RANUX PRO – Cinesubz Downloader
 🌐 Scrapes: Cinesubz -> API -> SonicCloud -> Google Drive
 ⚙️ Features: Automated Link Bypassing & Direct GDrive Extraction
*/

// --- 1. SEARCH FUNCTION ---
async function searchCinesubz(query) {
    const searchUrl = `https://cinesubz.net/?s=${encodeURIComponent(query)}`;
    
    // Launch Browser
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ["--no-sandbox", "--disable-setuid-sandbox"] 
    });
    const page = await browser.newPage();
    
    try {
        await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

        // Scrape Search Results
        const results = await page.evaluate(() => {
            const items = [];
            // Select common article structures in Cinesubz theme
            document.querySelectorAll("article, .result-item").forEach((box, index) => {
                const a = box.querySelector("a");
                const img = box.querySelector("img");
                const title = box.querySelector(".entry-title, .title")?.textContent || "";
                
                if (a && title) {
                    items.push({
                        id: index + 1,
                        title: title.trim(),
                        url: a.href,
                        thumb: img ? img.src : "",
                        type: "Movie"
                    });
                }
            });
            return items.slice(0, 10); // Return top 10
        });

        await browser.close();
        return results;
    } catch (e) {
        await browser.close();
        console.log("Search Error:", e);
        return [];
    }
}

// --- 2. METADATA & LINK EXTRACTOR ---
async function getMovieInfo(url) {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    
    try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

        // Scrape Details & Initial Links
        const data = await page.evaluate(() => {
            const title = document.querySelector(".entry-title")?.textContent.trim() || "Unknown Title";
            const imdb = document.querySelector(".imdb-rating")?.textContent.trim() || "N/A";
            const image = document.querySelector(".entry-content img")?.src || "";
            const desc = document.querySelector(".entry-content p")?.textContent.trim().substring(0, 200) + "...";

            // Extract Download Buttons (Looking for buttons that point to cinesubz.lk/api)
            const links = [];
            document.querySelectorAll("a").forEach(a => {
                if (a.href.includes("cinesubz.lk/api") || a.textContent.includes("Download")) {
                    // Try to guess quality from text
                    let quality = "SD";
                    const text = a.textContent.toUpperCase();
                    if (text.includes("1080")) quality = "1080p (FHD)";
                    else if (text.includes("720")) quality = "720p (HD)";
                    else if (text.includes("480")) quality = "480p (SD)";
                    
                    // Only add if it looks like a download link
                    if (a.href.includes("api") || a.href.includes("sonic-cloud")) {
                        links.push({
                            quality: quality,
                            link: a.href
                        });
                    }
                }
            });

            // Remove duplicates
            const uniqueLinks = [];
            const seen = new Set();
            links.forEach(l => {
                if (!seen.has(l.link)) {
                    uniqueLinks.push(l);
                    seen.add(l.link);
                }
            });

            return { title, imdb, image, desc, links: uniqueLinks };
        });

        await browser.close();
        return data;

    } catch (e) {
        await browser.close();
        throw e;
    }
}

// --- 3. COMPLEX LINK BYPASS (The Hard Part) ---
async function getFinalGoogleDriveLink(initialLink) {
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ["--no-sandbox", "--disable-popup-blocking"] // Allow popups to catch GDrive
    });
    const page = await browser.newPage();
    let finalUrl = null;

    try {
        console.log("🔄 Step 1: Visiting API Link...");
        await page.goto(initialLink, { waitUntil: "networkidle2", timeout: 60000 });

        // --- STEP 1: API Page (cinesubz.lk/api...) ---
        // Wait for countdown (usually 1-3 seconds)
        await new Promise(r => setTimeout(r, 4000));
        
        // Find and click the link to Sonic Cloud
        // Usually it's an anchor tag that appears after timer
        const sonicUrl = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll("a"));
            // Look for link containing sonic-cloud
            const target = anchors.find(a => a.href.includes("sonic-cloud"));
            return target ? target.href : null;
        });

        if (!sonicUrl) throw new Error("SonicCloud link not found in API page.");
        
        console.log("🔄 Step 2: Visiting SonicCloud...");
        await page.goto(sonicUrl, { waitUntil: "networkidle2" });

        // --- STEP 2: Sonic Cloud (sonic-cloud.online) ---
        // Need to click "Google Download 1" (Purple Button)
        // Then handle the popup "Google Server" -> "Download"

        // We will intercept the request instead of fighting with popups
        // The "Download" button inside the popup usually triggers a navigation to GDrive
        
        // Setup Request Interception to catch the GDrive Link
        await page.setRequestInterception(true);
        page.on('request', request => {
            const url = request.url();
            // If we see a Google Drive link, capture it!
            if (url.includes("drive.google.com") || url.includes("googleusercontent.com")) {
                finalUrl = url;
                console.log("✅ Final Link Captured:", url);
                request.abort(); // Stop loading, we got what we need
            } else {
                request.continue();
            }
        });

        // Trigger the clicks via DOM evaluation
        await page.evaluate(() => {
            // 1. Find "Google Download 1" button
            const buttons = Array.from(document.querySelectorAll("button, a"));
            const gButton = buttons.find(b => b.textContent.includes("Google Download 1"));
            if (gButton) gButton.click();
        });

        // Wait for the Modal/Popup to appear
        await new Promise(r => setTimeout(r, 2000));

        await page.evaluate(() => {
            // 2. Find "Download" or "Close" inside the popup.
            // Based on screenshot: "Download" and "Close" buttons.
            const modals = document.querySelectorAll(".modal, .popup, div"); // Generic selector
            // Search deeply for the specific Download button in the popup
            const allBtns = Array.from(document.querySelectorAll("button"));
            const dlBtn = allBtns.find(b => b.textContent.trim() === "Download");
            if (dlBtn) dlBtn.click();
        });

        // Wait a bit for the request interceptor to catch the URL
        await new Promise(r => setTimeout(r, 5000));

    } catch (e) {
        console.log("Bypass Error:", e.message);
    } finally {
        await browser.close();
    }

    return finalUrl;
}

// --- COMMAND HANDLERS ---

cmd({
    pattern: "cinesubz",
    alias: ["cine", "movie2"],
    react: "🎬",
    desc: "Search movies on Cinesubz.net",
    category: "download",
    filename: __filename
}, async (bot, mek, m, { from, q, reply, sender }) => {
    
    if (!q) return reply("ℹ️ *Search Name එකක් දෙන්න.*\nඋදා: .cine Varisu");

    await reply("🔎 *Searching on Cinesubz...*");
    const results = await searchCinesubz(q);

    if (!results.length) return reply("❌ *No results found.*");

    pendingSearch[sender] = { results, timestamp: Date.now() };

    let msg = "🎬 *CINESUBZ SEARCH RESULTS*\n\n";
    results.forEach((r, i) => {
        msg += `*${i + 1}.* ${r.title}\n`;
    });
    msg += `\n🔢 *Reply with the number (1-${results.length})*`;

    // Send with the thumb of the first result
    await bot.sendMessage(from, { image: { url: results[0].thumb }, caption: msg }, { quoted: mek });
});

// HANDLER 1: SELECT MOVIE
cmd({
    filter: (text, { sender }) => pendingSearch[sender] && !isNaN(text) && parseInt(text) > 0 && parseInt(text) <= pendingSearch[sender].results.length
}, async (bot, mek, m, { body, sender, reply, from }) => {
    
    await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    const index = parseInt(body.trim()) - 1;
    const selectedMovie = pendingSearch[sender].results[index];
    delete pendingSearch[sender]; // Clear search session

    await reply(`🔄 *Fetching Data for:*\n${selectedMovie.title}...`);

    try {
        const metadata = await getMovieInfo(selectedMovie.url);
        
        pendingQuality[sender] = { metadata, timestamp: Date.now() };

        let msg = `🎬 *${metadata.title}*\n\n`;
        msg += `⭐ IMDb: ${metadata.imdb}\n`;
        msg += `📝 Desc: ${metadata.desc}\n\n`;
        msg += `⬇️ *Select Quality:*\n`;

        if (!metadata.links.length) return reply("❌ Download links not found.");

        metadata.links.forEach((l, i) => {
            msg += `*${i + 1}.* ${l.quality}\n`;
        });
        msg += `\n🔢 *Reply with quality number.*`;

        if (metadata.image) {
            await bot.sendMessage(from, { image: { url: metadata.image }, caption: msg }, { quoted: mek });
        } else {
            await bot.sendMessage(from, { text: msg }, { quoted: mek });
        }

    } catch (e) {
        console.log(e);
        reply("❌ Error fetching details.");
    }
});

// HANDLER 2: SELECT QUALITY & DOWNLOAD
cmd({
    filter: (text, { sender }) => pendingQuality[sender] && !isNaN(text) && parseInt(text) > 0 && parseInt(text) <= pendingQuality[sender].metadata.links.length
}, async (bot, mek, m, { body, sender, reply, from }) => {
    
    await bot.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

    const index = parseInt(body.trim()) - 1;
    const { metadata } = pendingQuality[sender];
    const selectedLink = metadata.links[index];
    
    delete pendingQuality[sender]; // Clear quality session

    await reply(`🚀 *Bypassing Links...* (This may take 10-20s)\nSelected: ${selectedLink.quality}`);

    try {
        // Run the complex bypasser
        const finalUrl = await getFinalGoogleDriveLink(selectedLink.link);

        if (!finalUrl) {
            return reply("❌ *Failed to extract Direct Drive Link.*\n(Site structure might have changed).");
        }

        await reply("✅ *Link Extracted! Uploading...*");

        // Send Document
        await bot.sendMessage(from, {
            document: { url: finalUrl },
            mimetype: "video/mp4",
            fileName: `${metadata.title} - ${selectedLink.quality}.mp4`,
            caption: `🎬 *${metadata.title}*\n📊 ${selectedLink.quality}\n\n👑 King RANUX PRO`
        }, { quoted: mek });

    } catch (e) {
        console.log("Download Error:", e);
        reply("❌ *Upload Failed.*\nReason: File might be too large for WhatsApp Bot or Google Drive Limit exceeded.\n\n🔗 *Direct Link:* " + (e.finalUrl || "N/A"));
    }
});

// Cleanup Sessions
setInterval(() => {
    const now = Date.now();
    for (const s in pendingSearch) if (now - pendingSearch[s].timestamp > 600000) delete pendingSearch[s];
    for (const s in pendingQuality) if (now - pendingQuality[s].timestamp > 600000) delete pendingQuality[s];
}, 60000);