const { cmd } = require("../command");
const puppeteer = require("puppeteer");
const axios = require("axios");
const cheerio = require("cheerio");

// Session handling
const pendingSearch = {};
const pendingQuality = {};

/* 
 👑 King RANUX PRO – Cinesubz Downloader (Fixed)
 ⚙️ Tech: Axios/Cheerio (Search) + Puppeteer (Bypass)
 🚀 Fixes: "No results found" error & Faster Scraping
*/

// --- 1. SEARCH FUNCTION (Updated to Axios + Cheerio) ---
async function searchCinesubz(query) {
    try {
        const searchUrl = `https://cinesubz.net/?s=${encodeURIComponent(query)}`;
        // User-Agent දානවා Browser එකක් වගේ පෙන්නන්න
        const { data } = await axios.get(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
            }
        });

        const $ = cheerio.load(data);
        const results = [];

        // Cinesubz Structure එකේ ෆිල්ම් තියෙන තැන් ස්කෑන් කරනවා
        // (.result-item, article, .item කියන class තුනම check කරනවා)
        $(".result-item, article, .item").each((i, el) => {
            const title = $(el).find(".title, .entry-title").text().trim();
            const url = $(el).find("a").attr("href");
            const thumb = $(el).find("img").attr("src");

            if (title && url) {
                results.push({
                    id: i + 1,
                    title: title,
                    url: url,
                    thumb: thumb || "",
                    type: "Movie"
                });
            }
        });

        return results.slice(0, 10); // Top 10 results
    } catch (e) {
        console.log("Search Error:", e);
        return [];
    }
}

// --- 2. METADATA & LINK EXTRACTOR (Axios + Cheerio) ---
async function getMovieInfo(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
            }
        });
        
        const $ = cheerio.load(data);
        
        const title = $(".entry-title").text().trim() || "Unknown Title";
        const imdb = $(".imdb-rating").text().trim() || "N/A";
        const image = $(".entry-content img").first().attr("src") || "";
        const desc = $(".entry-content p").first().text().trim().substring(0, 200) + "...";

        // Download Links සොයා ගැනීම
        const links = [];
        $("a").each((i, el) => {
            const href = $(el).attr("href");
            const text = $(el).text().toUpperCase();

            // Link එක API එකට හෝ Sonic Cloud එකට යනවද බලනවා
            if (href && (href.includes("cinesubz.lk/api") || href.includes("sonic-cloud"))) {
                let quality = "SD";
                if (text.includes("1080")) quality = "1080p (FHD)";
                else if (text.includes("720")) quality = "720p (HD)";
                else if (text.includes("480")) quality = "480p (SD)";
                
                links.push({ quality, link: href });
            }
        });

        // Duplicates ඉවත් කිරීම
        const uniqueLinks = [];
        const seen = new Set();
        links.forEach(l => {
            if (!seen.has(l.link)) {
                uniqueLinks.push(l);
                seen.add(l.link);
            }
        });

        return { title, imdb, image, desc, links: uniqueLinks };

    } catch (e) {
        console.log("Info Error:", e);
        throw new Error("Failed to fetch movie details.");
    }
}

// --- 3. LINK BYPASS (Puppeteer - Only used here) ---
async function getFinalGoogleDriveLink(initialLink) {
    const browser = await puppeteer.launch({ 
        headless: true, // Server එකේ run වෙන්න "new" හෝ true දාන්න
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-popup-blocking"]
    });
    const page = await browser.newPage();
    let finalUrl = null;

    try {
        console.log("🔄 Bypassing: Visiting API Link...");
        await page.goto(initialLink, { waitUntil: "networkidle2", timeout: 60000 });

        // --- STEP 1: Cinesubz API Page ---
        // Wait for potential timer
        await new Promise(r => setTimeout(r, 4000));

        // Find SonicCloud Link
        const sonicUrl = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll("a"));
            const target = anchors.find(a => a.href.includes("sonic-cloud"));
            return target ? target.href : null;
        });

        if (!sonicUrl) throw new Error("SonicCloud redirect link not found.");

        console.log("🔄 Bypassing: Visiting SonicCloud...");
        await page.goto(sonicUrl, { waitUntil: "domcontentloaded" });

        // --- STEP 2: Sonic Cloud ---
        // Setup Request Interception to catch GDrive Link
        await page.setRequestInterception(true);
        page.on('request', request => {
            const url = request.url();
            // Google Drive Link එකක් දැක්ක ගමන් අල්ලගන්නවා
            if (url.includes("drive.google.com") || url.includes("googleusercontent.com")) {
                finalUrl = url;
                console.log("✅ Final Link Captured:", url);
                request.abort();
            } else {
                request.continue();
            }
        });

        // Click Logic (Generic Text Matching)
        await page.evaluate(() => {
            // Find "Google Download 1" or any "Google" button
            const buttons = Array.from(document.querySelectorAll("button, a, div"));
            const gButton = buttons.find(b => b.textContent.toLowerCase().includes("google download"));
            if (gButton) gButton.click();
        });

        // Wait for popup
        await new Promise(r => setTimeout(r, 2000));

        await page.evaluate(() => {
            // Click "Download" in popup
            const allBtns = Array.from(document.querySelectorAll("button, a"));
            const dlBtn = allBtns.find(b => b.textContent.trim() === "Download");
            if (dlBtn) dlBtn.click();
        });

        // Wait for interceptor
        await new Promise(r => setTimeout(r, 8000));

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

    if (!results.length) return reply("❌ *No results found.* (Try checking spelling)");

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
    delete pendingSearch[sender]; 

    await reply(`🔄 *Fetching Data for:*\n${selectedMovie.title}...`);

    try {
        const metadata = await getMovieInfo(selectedMovie.url);
        
        if (!metadata.links.length) return reply("❌ Download links not found.");

        pendingQuality[sender] = { metadata, timestamp: Date.now() };

        let msg = `🎬 *${metadata.title}*\n\n`;
        msg += `⭐ IMDb: ${metadata.imdb}\n`;
        msg += `📝 Desc: ${metadata.desc}\n\n`;
        msg += `⬇️ *Select Quality:*\n`;

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
    
    delete pendingQuality[sender]; 

    await reply(`🚀 *Bypassing Links...* (This may take 10-20s)\nSelected: ${selectedLink.quality}`);

    try {
        const finalUrl = await getFinalGoogleDriveLink(selectedLink.link);

        if (!finalUrl) {
            return reply("❌ *Failed to extract Direct Drive Link.*\n(Site structure might have changed).");
        }

        await reply("✅ *Link Extracted! Uploading...*");

        await bot.sendMessage(from, {
            document: { url: finalUrl },
            mimetype: "video/mp4",
            fileName: `${metadata.title} - ${selectedLink.quality}.mp4`,
            caption: `🎬 *${metadata.title}*\n📊 ${selectedLink.quality}\n\n👑 King RANUX PRO`
        }, { quoted: mek });

    } catch (e) {
        console.log("Download Error:", e);
        reply("❌ *Upload Failed.*\nGoogle Drive Limit exceeded or File too large.");
    }
});

// Cleanup Sessions
setInterval(() => {
    const now = Date.now();
    for (const s in pendingSearch) if (now - pendingSearch[s].timestamp > 600000) delete pendingSearch[s];
    for (const s in pendingQuality) if (now - pendingQuality[s].timestamp > 600000) delete pendingQuality[s];
}, 60000);
