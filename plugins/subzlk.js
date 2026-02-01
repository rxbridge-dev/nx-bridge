const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const config = require("../config");

// Global Store for States
global.pendingSubzlk = global.pendingSubzlk || {};

// User-Agent Header (Site එකෙන් Block නොවී ඉන්න)
const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Referer": "https://subzlk.com/"
};

// ===================== 1. SEARCH COMMAND =====================
cmd({
    pattern: "subzlk",
    alias: ["slmovie", "subz"],
    desc: "Search and download movies from Subzlk.com",
    category: "download",
    react: "🇱🇰",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender }) => {
    if (!q) return reply("❌ *කරුණාකර නමක් ලබා දෙන්න.*\nExample: `.subzlk kgf`");

    // Clear previous sessions
    if (global.pendingSubzlk[sender]) delete global.pendingSubzlk[sender];

    try {
        await reply(`*🔎 Searching for "${q}" on Subzlk...*`);
        
        // 1. Search Request
        const searchUrl = `https://subzlk.com/?s=${encodeURIComponent(q)}`;
        const { data } = await axios.get(searchUrl, { headers });
        const $ = cheerio.load(data);

        let results = [];
        
        // Analyze Search Results (Based on provided HTML)
        $(".result-item article").each((i, el) => {
            const title = $(el).find(".details .title a").text().trim();
            const link = $(el).find(".details .title a").attr("href");
            const year = $(el).find(".meta .year").text().trim() || "N/A";
            const rating = $(el).find(".meta .rating").text().trim() || "N/A";
            
            if (title && link) {
                results.push({ title, link, year, rating });
            }
        });

        if (results.length === 0) return reply("❌ *කිසිදු චිත්‍රපටයක් හමු නොවීය.*");

        // Save State
        global.pendingSubzlk[sender] = { step: 1, results };

        // Build Message
        let msg = `🎥 *SUBZLK MOVIE SEARCH* 🎥\n\n`;
        results.forEach((r, i) => {
            msg += `*${i + 1}.* ${r.title}\n   📅 Year: ${r.year} | ⭐ ${r.rating}\n\n`;
        });
        msg += `*Reply with the number to select a movie.*`;

        await conn.sendMessage(from, { text: msg }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ *Search Error:* " + e.message);
    }
});

// ===================== 2. SELECT MOVIE (Get Qualities) =====================
cmd({
    on: "body"
},
async (conn, mek, m, { from, body, sender, reply }) => {
    const session = global.pendingSubzlk[sender];
    
    // Validate Session Step 1
    if (!session || session.step !== 1 || isNaN(body)) return;

    const index = parseInt(body) - 1;
    if (index < 0 || index >= session.results.length) return reply("❌ *Invalid Number.*");

    const selectedMovie = session.results[index];

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // 2. Fetch Movie Page
        const { data } = await axios.get(selectedMovie.link, { headers });
        const $ = cheerio.load(data);

        const links = [];
        
        // Scrape Links Table (Based on provided kgf.html)
        // Table structure: Options | Quality | Language | Size
        $(".links_table table tbody tr").each((i, el) => {
            const quality = $(el).find("strong.quality").text().trim() || "Unknown";
            const size = $(el).find("td:last-child").text().trim() || "N/A";
            const dlLink = $(el).find("a").attr("href");

            if (dlLink && dlLink.includes("subzlk.com/links/")) {
                links.push({ quality, size, url: dlLink });
            }
        });

        if (links.length === 0) {
            delete global.pendingSubzlk[sender];
            return reply("❌ *No download links found for this movie.*");
        }

        // Update Session
        session.step = 2;
        session.movie = selectedMovie;
        session.links = links;
        
        let msg = `🎞️ *${selectedMovie.title}*\n\nSelect Quality:\n`;
        links.forEach((l, i) => {
            msg += `*${i + 1}.* ${l.quality} [${l.size}]\n`;
        });
        msg += `\n*Reply with the number to download.*`;

        // Send Image + Caption
        const imgUrl = $(".poster img").attr("src");
        if (imgUrl) {
            await conn.sendMessage(from, { image: { url: imgUrl }, caption: msg }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { text: msg }, { quoted: mek });
        }

    } catch (e) {
        console.log(e);
        reply("❌ *Error fetching details.*");
        delete global.pendingSubzlk[sender];
    }
});

// ===================== 3. BYPASS & DOWNLOAD =====================
cmd({
    on: "body"
},
async (conn, mek, m, { from, body, sender, reply }) => {
    const session = global.pendingSubzlk[sender];
    
    // Validate Session Step 2
    if (!session || session.step !== 2 || isNaN(body)) return;

    const index = parseInt(body) - 1;
    if (index < 0 || index >= session.links.length) return reply("❌ *Invalid Quality Number.*");

    const selectedLink = session.links[index];
    const movieTitle = session.movie.title;

    // Clear session immediately to prevent loops
    delete global.pendingSubzlk[sender];

    try {
        await reply(`⬇️ *Processing ${selectedLink.quality}... Please wait!*`);
        
        // 3. Bypass Intermediate Page (Countdown Page)
        // We scrape the 'href' from the 'a#link' button directly.
        
        const { data } = await axios.get(selectedLink.url, { headers });
        const $ = cheerio.load(data);
        
        // Getting the Final GDrive Link from the button
        // Based on "count Down eka Yana page eka.html" -> <a id="link" href="...">
        const driveLink = $("a#link").attr("href");

        if (!driveLink) {
            return reply("❌ *Failed to bypass link. Try again.*");
        }

        const fileName = `${movieTitle} - ${selectedLink.quality}.mp4`;

        // Send Document
        await conn.sendMessage(from, {
            document: { url: driveLink },
            mimetype: "video/mp4",
            fileName: fileName,
            caption: `✅ *Subzlk Download*\n\n🎬 *Movie:* ${movieTitle}\n📊 *Quality:* ${selectedLink.quality}\n📦 *Size:* ${selectedLink.size}\n\n> 👑 Powered by King RANUX PRO`
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply(`❌ *Error sending file.*\n\nHere is the direct link:\n${selectedLink.url}`);
    }
});