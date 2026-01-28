const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

// Session handling
const pendingSearch = {};
const pendingQuality = {};

/* 
 👑 King RANUX PRO – Cinesubz Downloader (Final Complete)
 ⚙️ Logic: 
    1. Search & Info (Axios)
    2. API Bypass (NodeJS Logic)
    3. Sonic Cloud Popup Handling (Puppeteer)
    4. Google Drive Virus Scan Bypass (Axios)
*/

// --- 1. SEARCH FUNCTION ---
async function searchCinesubz(query) {
    try {
        const searchUrl = `https://cinesubz.net/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const $ = cheerio.load(data);
        const results = [];

        $(".display-item").each((i, el) => {
            const title = $(el).find(".item-box a").attr("title") || $(el).find("h3").text();
            const url = $(el).find(".item-box a").attr("href");
            const thumb = $(el).find("img").attr("src") || $(el).find("img").attr("data-original");
            const imdb = $(el).find(".imdb-score").text().trim();

            if (title && url) {
                results.push({ id: i + 1, title: title.trim(), url, thumb, imdb });
            }
        });
        return results.slice(0, 10);
    } catch (e) {
        console.log("Search Error:", e);
        return [];
    }
}

// --- 2. MOVIE DETAILS ---
async function getMovieInfo(url) {
    try {
        const { data } = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const $ = cheerio.load(data);
        const title = $(".details-title h3").text().trim() || "Unknown";
        const image = $(".content-poster img").attr("src");
        const desc = $(".details-desc p").first().text().trim();
        
        const links = [];
        $(".movie-download-link-item").each((i, el) => {
            const a = $(el).find("a.movie-download-button");
            const link = a.attr("href");
            const metaInfo = $(el).find(".movie-download-meta").text().trim();
            
            let quality = "SD";
            if (metaInfo.includes("1080p")) quality = "1080p (FHD)";
            else if (metaInfo.includes("720p")) quality = "720p (HD)";
            else if (metaInfo.includes("480p")) quality = "480p (SD)";

            if (link && link.includes("cinesubz.lk/api")) {
                links.push({ quality, size: metaInfo.split("•")[1]?.trim() || "N/A", link });
            }
        });
        return { title, image, desc, links };
    } catch (e) {
        throw new Error("Failed to fetch movie details.");
    }
}

// --- 3. BYPASS API PAGE ---
async function bypassApiPage(apiLink) {
    try {
        const { data } = await axios.get(apiLink, { headers: { "User-Agent": "Mozilla/5.0" } });
        const fakeLinkMatch = data.match(/href="(https:\/\/google\.com\/[^"]+)"/);
        if (!fakeLinkMatch) return null;
        
        let targetUrl = fakeLinkMatch[1];
        const mappings = [
            { s: "server11", r: "server1" }, { s: "server12", r: "server1" }, { s: "server13", r: "server1" },
            { s: "server21", r: "server2" }, { s: "server22", r: "server2" }, { s: "server23", r: "server2" },
            { s: "server3", r: "server3" }, { s: "server4", r: "server4" }, { s: "server5", r: "server5" }, { s: "server6", r: "server6" }
        ];

        for (const map of mappings) {
            if (targetUrl.includes(`google.com/${map.s}/1:/`)) {
                targetUrl = targetUrl.replace(`google.com/${map.s}/1:/`, `bot2.sonic-cloud.online/${map.r}/`);
                break; 
            }
        }
        if (targetUrl.includes(".mp4") && !targetUrl.includes("?ext=")) targetUrl = targetUrl.replace(".mp4", "?ext=mp4");
        return targetUrl;
    } catch (e) {
        return null;
    }
}

// --- 4. SONIC CLOUD AUTOMATION (Puppeteer) ---
async function getFinalGDrive(sonicUrl) {
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-popup-blocking"]
    });
    const page = await browser.newPage();
    let capturedLink = null;

    try {
        console.log("🚀 Visiting SonicCloud:", sonicUrl);
        
        // Intercept the GDrive Link when the popup button is clicked
        await page.setRequestInterception(true);
        page.on('request', request => {
            const url = request.url();
            if (url.includes("drive.google.com") || url.includes("googleusercontent.com")) {
                capturedLink = url;
                console.log("🔥 Captured GDrive Link:", url);
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.goto(sonicUrl, { waitUntil: "networkidle2", timeout: 60000 });

        // 1. Click "Google Download" (The Purple Button)
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("button, a"));
            const gButton = buttons.find(b => b.innerText && b.innerText.toLowerCase().includes("google download"));
            if (gButton) gButton.click();
        });

        // 2. Wait for the Modal (The Popup you showed)
        // We wait for the modal container to be visible
        await new Promise(r => setTimeout(r, 2000));

        // 3. Click "Download" INSIDE the Modal
        await page.evaluate(() => {
            // Find all buttons
            const buttons = Array.from(document.querySelectorAll("button"));
            // Filter for the one that says exactly "Download" inside the popup structure
            const dlBtn = buttons.find(b => b.innerText && b.innerText.trim() === "Download");
            if (dlBtn) dlBtn.click();
        });

        // 4. Wait for the link capture
        await new Promise(r => setTimeout(r, 8000));

    } catch (e) {
        console.log("Puppeteer Error:", e.message);
    } finally {
        await browser.close();
    }

    return capturedLink;
}

// --- 5. GDRIVE "DOWNLOAD ANYWAY" BYPASS ---
async function processGDriveLink(gDriveUrl) {
    try {
        // If it's already a direct usercontent link, return it
        if (gDriveUrl.includes("googleusercontent.com")) return gDriveUrl;

        // Fetch the GDrive page to check for "Virus Scan / Download Anyway"
        const { data, headers } = await axios.get(gDriveUrl, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        // If it returns a file directly (check content-type), return the URL
        if (headers['content-type'] && headers['content-type'].includes("video")) {
            return gDriveUrl;
        }

        // Check for "Download anyway" confirm token
        if (data.includes("download_warning")) {
            const match = data.match(/confirm=([a-zA-Z0-9_]+)/);
            if (match) {
                const confirmCode = match[1];
                // Construct the final download link
                const finalUrl = gDriveUrl.includes("?") 
                    ? `${gDriveUrl}&confirm=${confirmCode}`
                    : `${gDriveUrl}?confirm=${confirmCode}`;
                return finalUrl;
            }
        }
        
        return gDriveUrl; // Return original if no warning found
    } catch (e) {
        console.log("GDrive Process Error:", e.message);
        return gDriveUrl;
    }
}

// --- COMMANDS ---

cmd({
    pattern: "cinesubz",
    alias: ["cine"],
    react: "🎬",
    desc: "Download movies from Cinesubz",
    category: "download",
    filename: __filename
}, async (bot, mek, m, { from, q, reply, sender }) => {
    
    if (!q) return reply("ℹ️ *Movie Name එකක් දෙන්න.*");

    await reply("🔎 *Searching Cinesubz...*");
    const results = await searchCinesubz(q);

    if (!results.length) return reply("❌ *No results found.*");

    pendingSearch[sender] = { results, timestamp: Date.now() };

    let msg = "🎬 *CINESUBZ MOVIES*\n\n";
    results.forEach((r, i) => {
        msg += `*${i + 1}.* ${r.title}\n`;
        msg += `   ⭐️ IMDb: ${r.imdb}\n`;
    });
    msg += `\n🔢 *Reply with number (1-${results.length})*`;

    await bot.sendMessage(from, { image: { url: results[0].thumb }, caption: msg }, { quoted: mek });
});

cmd({
    filter: (text, { sender }) => pendingSearch[sender] && !isNaN(text) && parseInt(text) > 0 && parseInt(text) <= pendingSearch[sender].results.length
}, async (bot, mek, m, { body, sender, reply, from }) => {
    
    await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    const index = parseInt(body.trim()) - 1;
    const movie = pendingSearch[sender].results[index];
    delete pendingSearch[sender];

    try {
        const info = await getMovieInfo(movie.url);
        
        if (!info.links.length) return reply("❌ Download links not available.");

        pendingQuality[sender] = { info, timestamp: Date.now() };

        let msg = `🎬 *${info.title}*\n\n`;
        msg += `📜 ${info.desc}\n\n`;
        msg += `⬇️ *Select Quality:*\n`;

        info.links.forEach((l, i) => {
            msg += `*${i + 1}.* ${l.quality} [${l.size}]\n`;
        });

        await bot.sendMessage(from, { image: { url: info.image }, caption: msg }, { quoted: mek });

    } catch (e) {
        reply("❌ Error fetching movie details.");
    }
});

cmd({
    filter: (text, { sender }) => pendingQuality[sender] && !isNaN(text) && parseInt(text) > 0 && parseInt(text) <= pendingQuality[sender].info.links.length
}, async (bot, mek, m, { body, sender, reply, from }) => {
    
    const index = parseInt(body.trim()) - 1;
    const { info } = pendingQuality[sender];
    const linkData = info.links[index];
    delete pendingQuality[sender];

    await reply(`🚀 *Generating Link...* \n(Please wait ~30s)\n\n🎬 Movie: ${info.title}\n📊 Quality: ${linkData.quality}`);

    try {
        // 1. API Page Bypass
        const sonicLink = await bypassApiPage(linkData.link);
        if (!sonicLink) return reply("❌ Failed to resolve SonicCloud link.");

        // 2. Sonic Cloud -> GDrive (Puppeteer Popup Clicker)
        const gDriveRaw = await getFinalGDrive(sonicLink);
        if (!gDriveRaw) return reply("❌ Failed to grab GDrive link from SonicCloud.");

        // 3. GDrive "Download Anyway" Bypass
        const finalDirectLink = await processGDriveLink(gDriveRaw);

        await reply("✅ *Uploading Movie...* 📤");

        await bot.sendMessage(from, {
            document: { url: finalDirectLink },
            mimetype: "video/mp4",
            fileName: `${info.title} - ${linkData.quality}.mp4`,
            caption: `🎬 *${info.title}*\n📊 ${linkData.quality}\n📦 ${linkData.size}\n\n👑 King RANUX PRO`
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ Upload Error. File might be too large (>2GB) or connection failed.");
    }
});
