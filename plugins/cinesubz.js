const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

// Session handling
const pendingSearch = {};
const pendingQuality = {};

/* 
 👑 King RANUX PRO – Cinesubz Downloader (Final Fixed)
 ⚙️ Engine: Axios (Search) + Logic (API Bypass) + Puppeteer (SonicCloud)
 🛠️ Fixes: Corrected CSS Selectors based on provided HTML source
*/

// --- 1. SEARCH FUNCTION (Fixed Selectors) ---
async function searchCinesubz(query) {
    try {
        const searchUrl = `https://cinesubz.net/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
            }
        });

        const $ = cheerio.load(data);
        const results = [];

        // Correct Selector based on your HTML source: .display-item
        $(".display-item").each((i, el) => {
            const title = $(el).find(".item-box a").attr("title") || $(el).find("h3").text();
            const url = $(el).find(".item-box a").attr("href");
            const thumb = $(el).find("img").attr("src") || $(el).find("img").attr("data-original");
            const imdb = $(el).find(".imdb-score").text().trim();
            const year = $(el).find(".movie-date").text().trim();

            if (title && url) {
                results.push({
                    id: i + 1,
                    title: title.trim(),
                    url: url,
                    thumb: thumb,
                    imdb: imdb,
                    year: year
                });
            }
        });

        return results.slice(0, 10);
    } catch (e) {
        console.log("Search Error:", e);
        return [];
    }
}

// --- 2. MOVIE DETAILS (Fixed Selectors) ---
async function getMovieInfo(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
            }
        });
        
        const $ = cheerio.load(data);
        
        const title = $(".details-title h3").text().trim() || "Unknown";
        const image = $(".content-poster img").attr("src");
        const desc = $(".details-desc p").first().text().trim();
        const imdb = $(".data-imdb").text().replace("IMDb:", "").trim();

        // Extract Links from .movie-download-button
        const links = [];
        $(".movie-download-link-item").each((i, el) => {
            const a = $(el).find("a.movie-download-button");
            const link = a.attr("href");
            
            // Extract Quality info from .movie-download-meta
            const metaInfo = $(el).find(".movie-download-meta").text().trim(); // e.g., "WEB-DL 480p • 700 MB • Tamil"
            
            // Guess quality from meta info
            let quality = "Unknown";
            if (metaInfo.includes("1080p")) quality = "1080p (FHD)";
            else if (metaInfo.includes("720p")) quality = "720p (HD)";
            else if (metaInfo.includes("480p")) quality = "480p (SD)";

            if (link && link.includes("cinesubz.lk/api")) {
                links.push({
                    quality: quality,
                    size: metaInfo.split("•")[1]?.trim() || "N/A", // Extract size
                    link: link
                });
            }
        });

        return { title, image, desc, imdb, links };

    } catch (e) {
        console.log("Info Error:", e);
        throw new Error("Failed to fetch movie details.");
    }
}

// --- 3. BYPASSING THE API PAGE (Logic from Source) ---
async function resolveApiLink(apiLink) {
    try {
        // Step 1: Fetch the API page HTML
        const { data } = await axios.get(apiLink, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        // Step 2: Extract the fake 'google.com' link
        const fakeLinkMatch = data.match(/href="(https:\/\/google\.com\/[^"]+)"/);
        if (!fakeLinkMatch) throw new Error("Base link not found in API page");
        
        let targetUrl = fakeLinkMatch[1];

        // Step 3: Apply the JS replacement logic (Replicating the script in your HTML)
        // Mapping: google.com/server21 -> bot2.sonic-cloud.online/server2
        
        const replacements = [
            { s: "server11", r: "server1" }, { s: "server12", r: "server1" }, { s: "server13", r: "server1" },
            { s: "server21", r: "server2" }, { s: "server22", r: "server2" }, { s: "server23", r: "server2" },
            { s: "server3", r: "server3" }, { s: "server4", r: "server4" }, { s: "server5", r: "server5" }, { s: "server6", r: "server6" }
        ];

        let replaced = false;
        for (const map of replacements) {
            if (targetUrl.includes(map.s + "/1:/")) {
                targetUrl = targetUrl.replace("google.com/" + map.s + "/1:/", "bot2.sonic-cloud.online/" + map.r + "/");
                replaced = true;
                break;
            }
        }

        // Fix extensions as per script
        if (targetUrl.includes(".mp4")) targetUrl = targetUrl.replace(".mp4", "?ext=mp4");
        
        console.log("✅ Resolved SonicCloud URL:", targetUrl);
        return targetUrl;

    } catch (e) {
        console.log("API Resolve Error:", e.message);
        return null;
    }
}

// --- 4. SONIC CLOUD -> GDRIVE (Puppeteer) ---
async function getFinalGDrive(sonicUrl) {
    const browser = await puppeteer.launch({ 
        headless: true, // Server friendly
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-popup-blocking"]
    });
    const page = await browser.newPage();
    let finalUrl = null;

    try {
        console.log("🚀 Puppeteer: Navigating to SonicCloud...");
        
        // Setup Interception
        await page.setRequestInterception(true);
        page.on('request', request => {
            const url = request.url();
            // Google Drive or Google User Content
            if (url.includes("drive.google.com") || url.includes("googleusercontent.com")) {
                finalUrl = url;
                console.log("🎉 Captured GDrive Link!");
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.goto(sonicUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

        // Click "Google Download" button
        // Based on screenshot, it's a purple button or similar
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("button, a"));
            // Find button with 'Google' text
            const btn = buttons.find(b => b.innerText.toLowerCase().includes("google"));
            if (btn) btn.click();
        });

        // Wait for popup "Download"
        await new Promise(r => setTimeout(r, 2000));
        
        await page.evaluate(() => {
            // Click "Download" inside the modal
            const btns = Array.from(document.querySelectorAll("button"));
            const dl = btns.find(b => b.innerText.trim() === "Download");
            if (dl) dl.click();
        });

        // Wait for capture
        await new Promise(r => setTimeout(r, 8000));

    } catch (e) {
        console.log("Puppeteer Error:", e.message);
    } finally {
        await browser.close();
    }

    return finalUrl;
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

// Select Movie
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

// Select Quality & Download
cmd({
    filter: (text, { sender }) => pendingQuality[sender] && !isNaN(text) && parseInt(text) > 0 && parseInt(text) <= pendingQuality[sender].info.links.length
}, async (bot, mek, m, { body, sender, reply, from }) => {
    
    const index = parseInt(body.trim()) - 1;
    const { info } = pendingQuality[sender];
    const linkData = info.links[index];
    delete pendingQuality[sender];

    await reply(`🚀 *Processing Link...* (Auto-Bypassing)\nQuality: ${linkData.quality}`);

    try {
        // 1. Resolve API Link -> Sonic Cloud Link (Using Logic)
        const sonicLink = await resolveApiLink(linkData.link);
        
        if (!sonicLink) return reply("❌ Failed to resolve API link.");

        // 2. Sonic Cloud -> Google Drive (Using Puppeteer)
        const gDriveLink = await getFinalGDrive(sonicLink);

        if (!gDriveLink) return reply("❌ Failed to grab GDrive link from SonicCloud.");

        await reply("✅ *Uploading Movie...* 📤");

        await bot.sendMessage(from, {
            document: { url: gDriveLink },
            mimetype: "video/mp4",
            fileName: `${info.title} - ${linkData.quality}.mp4`,
            caption: `🎬 *${info.title}*\n📊 ${linkData.quality}\n📦 ${linkData.size}\n\n👑 King RANUX PRO`
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ Upload Error. (File might be too big).");
    }
});
