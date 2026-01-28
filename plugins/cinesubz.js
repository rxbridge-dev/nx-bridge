const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

// Session handling
const pendingSearch = {};
const pendingQuality = {};

/* 
 👑 King RANUX PRO – Cinesubz (Human-Like Mode)
 🕵️‍♂️ Bypass: SonicCloud Anti-Bot & JS Injection
 🚀 Logic: Stealth Puppeteer + API URL Calculation
*/

// --- 1. SEARCH FUNCTION ---
async function searchCinesubz(query) {
    try {
        const searchUrl = `https://cinesubz.net/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36" }
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
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36" }
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

// --- 3. BYPASS API PAGE (Pure Logic) ---
async function bypassApiPage(apiLink) {
    try {
        const { data } = await axios.get(apiLink, { headers: { "User-Agent": "Mozilla/5.0" } });
        const fakeLinkMatch = data.match(/href="(https:\/\/google\.com\/[^"]+)"/);
        if (!fakeLinkMatch) return null;
        
        let targetUrl = fakeLinkMatch[1];
        // Based on the HTML you provided, these are the server mappings
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

// --- 4. SONIC CLOUD STEALTH CLICKER (The Strong Part) ---
async function getFinalGDrive(sonicUrl) {
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: [
            "--no-sandbox", 
            "--disable-setuid-sandbox", 
            "--disable-blink-features=AutomationControlled", // Hides that it is controlled by automation
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process"
        ]
    });
    const page = await browser.newPage();
    let finalUrl = null;

    try {
        // --- 4.1 Masking as Human ---
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        await page.evaluateOnNewDocument(() => {
            // Remove 'navigator.webdriver' property to trick anti-bot scripts
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        console.log("🚀 Stealth Mode: Visiting SonicCloud...");
        
        // --- 4.2 Network Interceptor ---
        await page.setRequestInterception(true);
        page.on('request', request => {
            const url = request.url();
            if (url.includes("drive.google.com") || url.includes("googleusercontent.com") || url.includes("export=download")) {
                finalUrl = url;
                console.log("🔥 Captured GDrive Link:", url);
                request.abort();
            } else {
                request.continue();
            }
        });

        // --- 4.3 Load Page & Wait for JS ---
        // waitUntil: 'networkidle2' waits until the JS has finished fetching the buttons
        await page.goto(sonicUrl, { waitUntil: "networkidle2", timeout: 60000 });

        // Wait specifically for the buttons to be injected into #dl-links
        // If this times out, it means the site detected the bot or JS failed
        try {
            await page.waitForSelector('#dl-links a, #dl-links button', { timeout: 15000 });
        } catch (e) {
            console.log("⚠️ Button selector timeout. Attempting to click blindly...");
        }

        // --- 4.4 Find & Click "Google Download" ---
        const clickedMain = await page.evaluate(() => {
            // Get all buttons on the page
            const buttons = Array.from(document.querySelectorAll("button, a, div.button"));
            // Find the one that has "Google" in text
            const target = buttons.find(b => b.innerText && b.innerText.toLowerCase().includes("google"));
            if (target) {
                target.click();
                return true;
            }
            return false;
        });

        if (!clickedMain) console.log("⚠️ Could not find 'Google' button via text.");

        // --- 4.5 Handle Popup ---
        // Wait for popup container to appear
        await new Promise(r => setTimeout(r, 2500));

        await page.evaluate(() => {
            // Try to find the specific popup button by ID (from your source code)
            const specificBtn = document.getElementById("google-alert");
            if (specificBtn) {
                specificBtn.click();
            } else {
                // Fallback: Find any button that says "Download" inside a modal
                const btns = Array.from(document.querySelectorAll(".custom-alert button, .modal button"));
                const dlBtn = btns.find(b => b.innerText.trim() === "Download");
                if (dlBtn) dlBtn.click();
            }
        });

        // --- 4.6 Wait for Link Capture ---
        await new Promise(r => setTimeout(r, 8000));

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

    await reply(`🚀 *Generating Link...* \n(Auto-Bypassing SonicCloud...)\n\n🎬 Movie: ${info.title}\n📊 Quality: ${linkData.quality}`);

    try {
        // Step 1: Instant Bypass API Page
        const sonicLink = await bypassApiPage(linkData.link);
        if (!sonicLink) return reply("❌ Failed to resolve SonicCloud link.");

        // Step 2: Stealth Puppeteer SonicCloud -> GDrive
        const gDriveRaw = await getFinalGDrive(sonicLink);
        if (!gDriveRaw) return reply("❌ Failed to grab GDrive link from SonicCloud (Detection or Timeout).");

        // Step 3: GDrive "Download Anyway" Bypass
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
