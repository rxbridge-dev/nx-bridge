const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

// Session handling
const pendingSearch = {};
const pendingQuality = {};

/* 
 👑 King RANUX PRO – Cinesubz Downloader (Fixed for Popup & New Tabs)
 ⚙️ Fixes: 
    - Targets '#google-alert' button specifically.
    - Captures links opened in New Tabs.
    - Handles 'Download Anyway' confirmation.
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

// --- 4. SONIC CLOUD AUTOMATION (Fixed for Popup & New Tab) ---
async function getFinalGDrive(sonicUrl) {
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-popup-blocking"]
    });
    const page = await browser.newPage();
    let finalUrl = null;

    try {
        console.log("🚀 Puppeteer: Visiting SonicCloud...");
        
        // 1. Setup Request Interception (For current page redirects)
        await page.setRequestInterception(true);
        page.on('request', request => {
            const url = request.url();
            if (url.includes("drive.google.com") || url.includes("googleusercontent.com") || url.includes("export=download")) {
                finalUrl = url;
                request.abort();
            } else {
                request.continue();
            }
        });

        // 2. Setup New Target Listener (For New Tabs)
        browser.on('targetcreated', async (target) => {
            const url = target.url();
            if (url.includes("drive.google.com") || url.includes("googleusercontent.com")) {
                finalUrl = url;
                console.log("🎉 Captured Link from New Tab:", url);
                const newPage = await target.page();
                if (newPage) await newPage.close(); // Close the new tab
            }
        });

        await page.goto(sonicUrl, { waitUntil: "networkidle2", timeout: 60000 });

        // 3. Wait for Loading Screen to disappear (from Source Code)
        try {
            await page.waitForSelector('#loading-screen', { hidden: true, timeout: 5000 });
        } catch (e) {}

        // 4. Click Main "Google Download" Button
        // Source code implies buttons are in #dl-links
        await page.waitForSelector('#dl-links button', { timeout: 10000 });
        const clickedMain = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("#dl-links button, #dl-links a"));
            const target = buttons.find(b => b.innerText.includes("Google"));
            if (target) {
                target.click();
                return true;
            }
            return false;
        });

        if (!clickedMain) console.log("⚠️ Main button not found, trying generic click...");

        // 5. Wait for Popup (#custom-alert-google)
        await new Promise(r => setTimeout(r, 2000));

        // 6. Click The Popup "Download" Button (ID: google-alert)
        console.log("🔄 Clicking Popup Button (#google-alert)...");
        await page.evaluate(() => {
            const btn = document.getElementById("google-alert");
            if (btn) btn.click();
        });

        // 7. Wait for Link Capture
        // Wait longer because new tabs might take a moment to initialize
        for (let i = 0; i < 10; i++) {
            if (finalUrl) break;
            await new Promise(r => setTimeout(r, 1000));
        }

    } catch (e) {
        console.log("Puppeteer Error:", e.message);
    } finally {
        await browser.close();
    }

    return finalUrl;
}

// --- 5. GDRIVE PROCESSOR ---
async function processGDriveLink(gDriveUrl) {
    try {
        if (!gDriveUrl) return null;
        if (gDriveUrl.includes("googleusercontent.com")) return gDriveUrl;

        const { data } = await axios.get(gDriveUrl, { headers: { "User-Agent": "Mozilla/5.0" } });

        if (data.includes("download_warning")) {
            const match = data.match(/confirm=([a-zA-Z0-9_]+)/);
            if (match) {
                return gDriveUrl.includes("?") 
                    ? `${gDriveUrl}&confirm=${match[1]}`
                    : `${gDriveUrl}?confirm=${match[1]}`;
            }
        }
        return gDriveUrl;
    } catch (e) {
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
        reply("❌ Error fetching details.");
    }
});

cmd({
    filter: (text, { sender }) => pendingQuality[sender] && !isNaN(text) && parseInt(text) > 0 && parseInt(text) <= pendingQuality[sender].info.links.length
}, async (bot, mek, m, { body, sender, reply, from }) => {
    
    const index = parseInt(body.trim()) - 1;
    const { info } = pendingQuality[sender];
    const linkData = info.links[index];
    delete pendingQuality[sender];

    await reply(`🚀 *Processing...* (Bypassing Systems)\nMovie: ${info.title}\nQuality: ${linkData.quality}`);

    try {
        // Step 1
        const sonicLink = await bypassApiPage(linkData.link);
        if (!sonicLink) return reply("❌ Failed to bypass API page.");

        // Step 2
        const gDriveRaw = await getFinalGDrive(sonicLink);
        if (!gDriveRaw) return reply("❌ Failed to grab GDrive link from SonicCloud.");

        // Step 3
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
        reply("❌ Upload Error. (File >2GB or Server busy).");
    }
});
