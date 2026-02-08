const { cmd } = require("../command");
const axios = require("axios");

// Design Elements
const FOOTER = "> 👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋɪɴɢ ʀᴀɴᴜx ᴘʀᴏ";

// Helper: Get Data from API
async function getJSON(url) {
    try {
        const res = await axios.get(url);
        return res.data;
    } catch (e) {
        return null;
    }
}

// ===============================================================
// 🎴 RANDOM ANIME IMAGES (Waifu, Neko, etc.)
// ===============================================================
const waifuEndpoints = {
    waifu: "https://api.waifu.pics/sfw/waifu",
    husbando: "https://api.waifu.pics/sfw/husbando",
    neko: "https://api.waifu.pics/sfw/neko",
    shinobu: "https://api.waifu.pics/sfw/shinobu",
    megumin: "https://api.waifu.pics/sfw/megumin",
    kitsune: "https://api.waifu.pics/sfw/kitsune"
};

for (const [cmdName, url] of Object.entries(waifuEndpoints)) {
    cmd({
        pattern: cmdName,
        react: "💮",
        desc: `Get random ${cmdName} image`,
        category: "anime",
        filename: __filename
    }, async (bot, mek, m, { from, reply }) => {
        const data = await getJSON(url);
        if (!data || !data.url) return reply("❌ *Failed to fetch image.*");

        await bot.sendMessage(from, { 
            image: { url: data.url }, 
            caption: `╭───〔 ⛩️ *${cmdName.toUpperCase()}* 〕───┈\n│\n│ 🌸 *Category:* Anime Art\n│ 🔗 *Source:* WaifuPics\n│\n╰──────────────────────┈\n${FOOTER}`
        }, { quoted: mek });
    });
}

// ===============================================================
// 📺 ANIME SEARCH (Jikan API v4)
// ===============================================================
cmd({
    pattern: "anime",
    alias: ["anisearch"],
    react: "📺",
    desc: "Search anime details",
    category: "anime",
    filename: __filename
}, async (bot, mek, m, { from, q, reply }) => {
    if (!q) return reply("*ℹ️ Please provide an anime name.*\n*Example:* .anime Naruto");

    try {
        const data = await getJSON(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`);
        if (!data || !data.data || data.data.length === 0) return reply("❌ *Anime not found!*");

        const anime = data.data[0];
        let info = `
╭───〔 ⛩️ *𝐀𝐍𝐈𝐌𝐄 𝐈𝐍𝐅𝐎* 〕───┈
│
│ 🏷️ *Title:* ${anime.title}
│ 🇯🇵 *Japanese:* ${anime.title_japanese || "N/A"}
│ 🎭 *Type:* ${anime.type || "N/A"}
│ 📺 *Status:* ${anime.status || "N/A"}
│ 📝 *Episodes:* ${anime.episodes || "?"}
│ ⭐ *Rating:* ${anime.score || "?"}
│ 🧬 *Genres:* ${anime.genres.map(g => g.name).join(", ")}
│
├─〔 📜 *𝐒𝐘𝐍𝐎𝐏𝐒𝐈𝐒* 〕───┈
│
│ ${anime.synopsis ? anime.synopsis.slice(0, 300) + "..." : "No synopsis available."}
│
╰──────────────────────┈
${FOOTER}`;

        await bot.sendMessage(from, { image: { url: anime.images.jpg.large_image_url }, caption: info }, { quoted: mek });

    } catch (e) {
        reply("❌ *Error fetching anime data.*");
    }
});

// ===============================================================
// 📖 MANGA SEARCH
// ===============================================================
cmd({
    pattern: "manga",
    react: "📖",
    desc: "Search manga details",
    category: "anime",
    filename: __filename
}, async (bot, mek, m, { from, q, reply }) => {
    if (!q) return reply("*ℹ️ Please provide a manga name.*");

    try {
        const data = await getJSON(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(q)}&limit=1`);
        if (!data || !data.data || data.data.length === 0) return reply("❌ *Manga not found!*");

        const manga = data.data[0];
        let info = `
╭───〔 📖 *𝐌𝐀𝐍𝐆𝐀 𝐈𝐍𝐅𝐎* 〕───┈
│
│ 🏷️ *Title:* ${manga.title}
│ 📑 *Chapters:* ${manga.chapters || "?"}
│ 📚 *Volumes:* ${manga.volumes || "?"}
│ ⭐ *Rating:* ${manga.score || "?"}
│ 🧬 *Genres:* ${manga.genres.map(g => g.name).join(", ")}
│
╰──────────────────────┈
${FOOTER}`;

        await bot.sendMessage(from, { image: { url: manga.images.jpg.large_image_url }, caption: info }, { quoted: mek });

    } catch (e) {
        reply("❌ *Error fetching manga data.*");
    }
});

// ===============================================================
// 👤 CHARACTER SEARCH
// ===============================================================
cmd({
    pattern: "character",
    alias: ["anichar"],
    react: "👤",
    desc: "Search anime character details",
    category: "anime",
    filename: __filename
}, async (bot, mek, m, { from, q, reply }) => {
    if (!q) return reply("*ℹ️ Please provide a character name.*");

    try {
        const data = await getJSON(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(q)}&limit=1`);
        if (!data || !data.data || data.data.length === 0) return reply("❌ *Character not found!*");

        const char = data.data[0];
        let info = `
╭───〔 👤 *𝐂𝐇𝐀𝐑𝐀𝐂𝐓𝐄𝐑* 〕───┈
│
│ 🏷️ *Name:* ${char.name}
│ 🇯🇵 *Nicknames:* ${char.nicknames.join(", ") || "None"}
│ 💖 *Anime:* ${char.anime.map(a => a.anime.title).slice(0, 3).join(", ")}
│
├─〔 📜 *𝐀𝐁𝐎𝐔𝐓* 〕───┈
│
│ ${char.about ? char.about.slice(0, 300) + "..." : "No info available."}
│
╰──────────────────────┈
${FOOTER}`;

        await bot.sendMessage(from, { image: { url: char.images.jpg.image_url }, caption: info }, { quoted: mek });

    } catch (e) {
        reply("❌ *Error fetching character data.*");
    }
});

// ===============================================================
// 🤔 ANIME QUOTE & FACTS
// ===============================================================
cmd({
    pattern: "animequote",
    react: "💬",
    desc: "Get a random anime quote",
    category: "anime",
    filename: __filename
}, async (bot, mek, m, { from, reply }) => {
    // Note: AnimeChan API is often down, using a fallback method
    try {
        const data = await getJSON("https://animechan.xyz/api/random");
        if (!data || !data.quote) return reply("❌ *Could not fetch quote right now.*");

        let msg = `
╭───〔 💬 *𝐀𝐍𝐈𝐌𝐄 𝐐𝐔𝐎𝐓𝐄* 〕───┈
│
│ 🎙️ *Character:* ${data.character}
│ 📺 *Anime:* ${data.anime}
│
├─〔 📜 *𝐐𝐔𝐎𝐓𝐄* 〕───┈
│
│ "${data.quote}"
│
╰──────────────────────┈
${FOOTER}`;
        await reply(msg);
    } catch (e) {
        reply("❌ *API Error.*");
    }
});

cmd({
    pattern: "animefact",
    react: "💡",
    desc: "Random anime fact",
    category: "anime",
    filename: __filename
}, async (bot, mek, m, { from }) => {
    const facts = [
        "Naruto’s Naruto Ramen is based on a real Japanese dish.",
        "Attack on Titan’s Titans were inspired by nightmares.",
        "One Piece has been running for over 25 years.",
        "Spirited Away was the first anime to win an Oscar.",
        "Dragon Ball was inspired by the Chinese novel 'Journey to the West'.",
        "Your Name is the highest-grossing anime film of all time."
    ];
    const fact = facts[Math.floor(Math.random() * facts.length)];
    await bot.sendMessage(from, { text: `╭───〔 💡 *𝐀𝐍𝐈𝐌𝐄 𝐅𝐀𝐂𝐓* 〕───┈\n│\n│ ◈ ${fact}\n│\n╰──────────────────────┈\n${FOOTER}` }, { quoted: mek });
});