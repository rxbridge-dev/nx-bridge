const { cmd } = require("../command");
const axios = require("axios");
const config = require("../config");

// Global State
global.pendingPh = global.pendingPh || {};

// User-Agent & Headers (Site එකට Browser එකක් වගේ පෙන්නන්න)
const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://pornhubfans.com/",
    "Origin": "https://pornhubfans.com",
    "Content-Type": "application/json"
};

// ===================== 1. FETCH COMMAND =====================
cmd({
    pattern: "phdl",
    alias: ["porn", "ph"],
    desc: "Download Pornhub Videos via PornhubFans",
    category: "download",
    react: "🔞",
    filename: __filename
},
async (ranuxPro, mek, m, { from, q, reply, sender }) => {
    try {
        // 1. Validate URL
        if (!q || !q.includes("pornhub.com")) {
            return reply("❌ *Please provide a valid Pornhub link!*\n\nExample: `.phdl https://www.pornhub.com/view_video.php?viewkey=...`");
        }

        // Clear previous sessions
        if (global.pendingPh[sender]) delete global.pendingPh[sender];

        await ranuxPro.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        await reply("🔍 *Analyzing Link... Please wait!*");

        // 2. Call API (Based on your HTML analysis)
        const apiUrl = "https://pornhubfans.com/resolve";
        const payload = {
            url: q,
            source: "phfans"
        };

        const { data } = await axios.post(apiUrl, payload, { headers });

        // 3. Validate Response
        if (!data || !data.video || data.video.length === 0) {
            return reply("❌ *Failed to fetch video details!* The link might be invalid or protected.");
        }

        // 4. Store Data in State
        global.pendingPh[sender] = {
            step: 1,
            title: data.title,
            thumbnail: `${data.endpoint}/image?token=${data.thumbnail}`, // Construct Thumb URL
            endpoint: data.endpoint, // e.g., https://aws03.vidpig.net
            qualities: data.video // Array of {quality, token, file_size}
        };

        // 5. Build Quality Selection Message
        let msg = `🔞 *PH VIDEO DOWNLOADER* 🔞\n\n`;
        msg += `🎬 *Title:* ${data.title}\n`;
        msg += `───────────────────────\n\n`;
        msg += `👇 *Select Quality:*\n`;

        data.video.forEach((v, i) => {
            const sizeMB = (v.file_size / 1024 / 1024).toFixed(2);
            msg += `*${i + 1}.* 📹 ${v.quality}p  [📦 ${sizeMB} MB]\n`;
        });

        msg += `\n> *Reply with the number to download.*`;

        // Send Message with Thumbnail
        await ranuxPro.sendMessage(from, { 
            image: { url: global.pendingPh[sender].thumbnail },
            caption: msg 
        }, { quoted: mek });

    } catch (e) {
        console.error("PHDL Error:", e);
        reply("❌ *API Error:* Failed to connect to PornhubFans.");
    }
});

// ===================== 2. DOWNLOAD HANDLER =====================
cmd({
    on: "body"
},
async (ranuxPro, mek, m, { from, body, sender, reply }) => {
    const session = global.pendingPh[sender];

    // Validate Session
    if (!session || session.step !== 1 || isNaN(body)) return;

    const index = parseInt(body.trim()) - 1;
    if (index < 0 || index >= session.qualities.length) {
        return reply("❌ *Invalid number! Please select from the list.*");
    }

    const selectedQuality = session.qualities[index];
    
    // Clear session to prevent loops
    delete global.pendingPh[sender];

    try {
        await reply(`⬇️ *Downloading ${selectedQuality.quality}p video...*`);
        await ranuxPro.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

        // 6. Construct Final Download Link
        // Based on script: v(e,t,n){return t.endpoint+`/${e}?token=`+n}
        // e = "video", t = session data, n = token
        const downloadUrl = `${session.endpoint}/video?token=${selectedQuality.token}`;

        // 7. Send Video
        await ranuxPro.sendMessage(from, {
            video: { url: downloadUrl },
            caption: `🔞 *${session.title}*\n\n📊 *Quality:* ${selectedQuality.quality}p\n\n> 👑 Powered by King RANUX PRO`,
            mimetype: "video/mp4"
        }, { quoted: mek });

        await ranuxPro.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("PHDL Send Error:", e);
        reply(`❌ *Upload Failed!*\n\n🔗 *Direct Link:* ${session.endpoint}/video?token=${selectedQuality.token}`);
    }
});