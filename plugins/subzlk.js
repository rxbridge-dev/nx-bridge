const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const config = require("../config");

// Global State (Movie.js එකේ වගේමයි)
global.pendingSubzlk = global.pendingSubzlk || {};

// Browser එකක් වගේ පෙන්නන්න Headers
const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Referer": "https://subzlk.com/"
};

// ===================== 1. SEARCH COMMAND =====================
cmd({
    pattern: "subzlk",
    alias: ["slmovie", "subz"], // උඹේ screenshot එකේ තිබුන .slmovie alias එක දැම්මා
    desc: "Search movies from Subzlk.com",
    category: "download",
    react: "🔎",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender }) => {
    if (!q) return reply("❌ *Please provide a movie name.*\nExample: `.slmovie kgf`");

    // Clear previous sessions
    if (global.pendingSubzlk[sender]) delete global.pendingSubzlk[sender];

    try {
        await reply(`*🔎 Searching for "${q}" on Subzlk...*`);
        
        // Search Request
        const searchUrl = `https://subzlk.com/?s=${encodeURIComponent(q)}`;
        const { data } = await axios.get(searchUrl, { headers });
        const $ = cheerio.load(data);

        let results = [];
        
        // Search Page HTML එකෙන් Data ගන්න විදිය
        $(".result-item article").each((i, el) => {
            const title = $(el).find(".details .title a").text().trim();
            const link = $(el).find(".details .title a").attr("href");
            const year = $(el).find(".meta .year").text().trim() || "N/A";
            const rating = $(el).find(".meta .rating").text().trim() || "N/A";
            
            if (title && link) {
                results.push({ title, link, year, rating });
            }
        });

        if (results.length === 0) return reply("❌ *No movies found matching your query!*");

        // Save State (Step 1)
        global.pendingSubzlk[sender] = { step: 1, results };

        // උඹේ Movie.js එකේ Style එකටම Message එක හැදුවා
        let text = `*❖═════╝ 🎬 ╚═════❖*
   *SUBZLK MOVIE SEARCH*
*❖═════╗ 🎬 ╔═════❖*

*Found ${results.length} results for "${q}"*\n\n`;

        results.forEach((r, i) => {
            text += `*${i + 1}.* ${r.title}\n📅 Year: ${r.year} | ⭐ ${r.rating}\n\n`;
        });
        text += `*Reply with the corresponding number to select a movie.*`;

        await conn.sendMessage(from, { text: text }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ *Search Error:* " + e.message);
    }
});

// ===================== 2. MOVIE DETAILS (Reply Handler) =====================
cmd({
    on: "body"
},
async (conn, mek, m, { from, body, sender, reply }) => {
    const session = global.pendingSubzlk[sender];
    
    // Check Step 1 validity
    if (!session || session.step !== 1 || isNaN(body)) return;

    const index = parseInt(body.trim()) - 1;
    if (index < 0 || index >= session.results.length) return reply("❌ *Invalid number. Please select from the list.*");

    const selectedMovie = session.results[index];

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Fetch Movie Page
        const { data } = await axios.get(selectedMovie.link, { headers });
        const $ = cheerio.load(data);

        // Metadata ගැනීම (Based on kgf.html)
        const title = $("div.data h1").text().trim();
        const imdb = $(".dt_rating_vgs").text().trim() || "N/A";
        const date = $(".date").text().trim() || "N/A";
        const runtime = $(".runtime").text().trim() || "N/A";
        const genres = $(".sgeneros a").map((i, el) => $(el).text()).get().join(", ");
        const director = $(".person[itemprop='director'] .name a").text().trim() || "N/A";
        const imgUrl = $(".poster img").attr("src");

        // Download Links ගැනීම
        const links = [];
        $(".links_table table tbody tr").each((i, el) => {
            const quality = $(el).find("strong.quality").text().trim() || "Unknown";
            const size = $(el).find("td:last-child").text().trim() || "N/A";
            const dlLink = $(el).find("a").attr("href"); // මේක තමයි "Links Page" URL එක

            if (dlLink && dlLink.includes("subzlk.com/links/")) {
                links.push({ quality, size, url: dlLink });
            }
        });

        if (links.length === 0) {
            delete global.pendingSubzlk[sender];
            return reply("❌ *No download links found!*");
        }

        // Update Session to Step 2
        // lastMsgId එක save කරනවා double reply නොවෙන්න
        global.pendingSubzlk[sender] = { 
            step: 2, 
            movie: { title, imgUrl },
            links,
            lastMsgId: mek.key.id 
        };

        // Message Caption (Movie.js Style)
        let msg = `
╭─「 🎬 *${title}* 」
│
│  ⭐ *IMDb:* ${imdb}
│  📅 *Date:* ${date}
│  🕒 *Duration:* ${runtime}
│  🎭 *Genre:* ${genres}
│  👤 *Director:* ${director}
│
├─「 📥 *AVAILABLE QUALITIES* 」
│
`;
        links.forEach((l, i) => {
            msg += `│ *${i + 1}.* ${l.quality} [${l.size}]\n`;
        });
        msg += `│
╰─「 *Reply with a number to download* 」`;

        if (imgUrl) {
            await conn.sendMessage(from, { image: { url: imgUrl }, caption: msg.trim() }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { text: msg.trim() }, { quoted: mek });
        }

    } catch (e) {
        console.log(e);
        reply("❌ *Error fetching details.*");
        delete global.pendingSubzlk[sender];
    }
});

// ===================== 3. DOWNLOAD HANDLER (Reply Handler) =====================
cmd({
    on: "body"
},
async (conn, mek, m, { from, body, sender, reply }) => {
    const session = global.pendingSubzlk[sender];
    
    // Check Step 2 validity & Prevent Double Trigger
    if (!session || session.step !== 2 || mek.key.id === session.lastMsgId || isNaN(body)) return;

    const index = parseInt(body.trim()) - 1;
    if (index < 0 || index >= session.links.length) return reply("❌ *Invalid quality selection.*");

    const selectedLink = session.links[index];
    const movieTitle = session.movie.title;

    // Clear session immediately
    delete global.pendingSubzlk[sender];

    try {
        await reply(`*🚀 Download initiated for "${movieTitle}" (${selectedLink.quality}). Please wait...*`);

        // 1. Go to the "Links Page" (Countdown Page)
        const { data } = await axios.get(selectedLink.url, { headers });
        const $ = cheerio.load(data);
        
        // 2. Bypass Countdown: කෙලින්ම Button එකේ ලින්ක් එක ගන්නවා
        // (Based on "count Down eka Yana page eka.html")
        // <a id="link" href="...">
        const finalDriveUrl = $("a#link").attr("href");

        if (!finalDriveUrl) {
            return reply("❌ *Failed to extract Google Drive link.*");
        }

        // File Name Format
        const fileName = `${movieTitle} - ${selectedLink.quality}.mp4`.replace(/[^\w\s.-]/gi, '');

        // Caption (Movie.js Style)
        const caption = `
╭─「 ✅ *DOWNLOAD COMPLETE* 」
│
│  🎬 *Movie:* ${movieTitle}
│  📊 *Quality:* ${selectedLink.quality}
│  💾 *Size:* ${selectedLink.size}
│
╰─「 *Enjoy the movie!* 」

> ${config.MOVIE_FOOTER_TEXT || "Powered by King RANUX PRO"}`;

        // Send Document
        await conn.sendMessage(from, {
            document: { url: finalDriveUrl },
            mimetype: "video/mp4",
            fileName: fileName,
            caption: caption.trim()
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply(`❌ *Upload Error:* ${e.message}\n\nLink: ${selectedLink.url}`);
    }
});