const { cmd } = require("../command");
const axios = require("axios");

// Global State to store video details
global.pendingPh = global.pendingPh || {};

// 🔥 GLOBAL FOOTER
const FOOTER = "> 👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋɪɴɢ ʀᴀɴᴜx ᴘʀᴏ";

// ===================== 1. FETCH DETAILS =====================
cmd({
    pattern: "phdl",
    alias: ["porn", "ph"],
    desc: "Download Pornhub Videos (Direct)",
    category: "download",
    react: "🔞",
    filename: __filename
},
async (ranuxPro, mek, m, { from, q, reply, sender }) => {
    try {
        // 1. Validation
        if (!q || !q.includes("pornhub.com")) {
            return reply("❌ *Please provide a valid Pornhub link!*\n\nExample: `.phdl https://www.pornhub.com/view_video.php?viewkey=...`");
        }

        // Clear previous session
        if (global.pendingPh[sender]) delete global.pendingPh[sender];

        await ranuxPro.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // 2. Fetch from Stable API (Scrapes Direct MP4)
        // මේ API එකෙන් කෙලින්ම source code එකෙන් data ඇදලා දෙනවා 1DM වගේ.
        const apiUrl = `https://api.maher-zubair.tech/download/phub?url=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        // 3. Check Data
        if (!data || data.status !== 200 || !data.result) {
            return reply("❌ *Unable to fetch video!* Try again later or check the link.");
        }

        const result = data.result;
        
        // 4. Store Data
        global.pendingPh[sender] = {
            title: result.title || "PH Video",
            downloadUrl: result.data[0].url, // Best Quality Link
            quality: result.data[0].quality || "HD",
            thumbnail: result.thumbnail
        };

        // 5. Build Stylish Message (Pro Card Design)
        let msg = `🔞 *𝐏𝐇 𝐕𝐈𝐃𝐄𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑* 🔞\n\n`;
        
        msg += `╭───〔 🎬 *𝐕𝐈𝐃𝐄𝐎 𝐈𝐍𝐅𝐎* 〕───┈\n`;
        msg += `│\n`;
        msg += `│ 🏷️ *𝐓𝐢𝐭𝐥𝐞* : ${result.title}\n`;
        msg += `│ 👁️ *𝐕𝐢𝐞𝐰𝐬* : ${result.views_count}\n`;
        msg += `│ ⏱️ *𝐃𝐮𝐫𝐚𝐭𝐢𝐨𝐧* : ${result.duration}\n`;
        msg += `│ 📤 *𝐔𝐩𝐥𝐨𝐚𝐝𝐞𝐫* : ${result.uploader}\n`;
        msg += `│\n`;
        msg += `╰────────────────────┈\n\n`;

        msg += `🔗 *Quality Available:* ${result.data[0].quality}\n`;
        msg += `\n> *Reply with "1" to Download Video*`;
        msg += `\n${FOOTER}`;

        // 6. Send Message
        await ranuxPro.sendMessage(from, { 
            image: { url: result.thumbnail },
            caption: msg 
        }, { quoted: mek });

    } catch (e) {
        console.error("PHDL Error:", e);
        reply("❌ *API Error!* Please try again later.");
    }
});

// ===================== 2. DOWNLOAD HANDLER =====================
cmd({
    on: "body"
},
async (ranuxPro, mek, m, { from, body, sender, reply }) => {
    const session = global.pendingPh[sender];

    // Validate Session
    if (!session || body.trim() !== "1") return;

    // Clear session
    delete global.pendingPh[sender];

    // 🔥 REACT IMMEDIATELY
    await ranuxPro.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

    try {
        await reply(`⬇️ *Downloading "${session.title}"... Please wait!*`);

        // 🔥 BUFFER DOWNLOAD METHOD (No 500 Errors)
        const videoBuffer = await axios.get(session.downloadUrl, { responseType: 'arraybuffer' });

        await ranuxPro.sendMessage(from, {
            video: videoBuffer.data,
            caption: `🔞 *${session.title}*\n\n✅ *Downloaded via King RANUX PRO*`,
            mimetype: "video/mp4"
        }, { quoted: mek });

        await ranuxPro.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Download Error:", e);
        // Fallback: Send direct link if upload fails
        reply(`❌ *Upload Failed!* (File might be too large)\n\n🔗 *Direct Link:* ${session.downloadUrl}`);
    }
});