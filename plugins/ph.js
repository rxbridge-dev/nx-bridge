const { cmd } = require("../command");
const axios = require("axios");

// Global State
global.pendingPh = global.pendingPh || {};

// 🔥 GLOBAL FOOTER
const FOOTER = "> 👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋɪɴɢ ʀᴀɴᴜx ᴘʀᴏ";

// ===================== 1. FETCH & DOWNLOAD COMMAND =====================
cmd({
    pattern: "phdl",
    alias: ["porn", "ph"],
    desc: "Download Pornhub Videos (Agatz API)",
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

        // 🔥 IMMEDIATE REACTION (User Request)
        await ranuxPro.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        // Inform User
        await reply("🔄 *Processing Request...*");

        // 2. Fetch Video Details (Using Agatz API - Currently Working)
        const apiUrl = `https://api.agatz.xyz/api/phdl?url=${q}`;
        const { data } = await axios.get(apiUrl);

        // 3. Check API Response
        if (!data || data.status !== 200 || !data.data) {
            return reply("❌ *API Error!* Unable to fetch video details.");
        }

        const videoData = data.data;
        const videoTitle = videoData.video_title || "PH Video";
        const videoUrl = videoData.videoUrl; // High Quality Link
        const format = videoData.format || "mp4";

        // 4. Update React to Downloading
        await ranuxPro.sendMessage(from, { react: { text: "⬇️", key: mek.key } });
        
        // 5. Build Info Message
        let infoMsg = `🔞 *𝐏𝐇 𝐕𝐈𝐃𝐄𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑* 🔞\n\n`;
        infoMsg += `🎬 *Title:* ${videoTitle}\n`;
        infoMsg += `📼 *Quality:* High (Auto)\n`;
        infoMsg += `⏳ *Status:* Downloading & Uploading...\n`;
        infoMsg += `\n${FOOTER}`;

        // Send Info Image
        await ranuxPro.sendMessage(from, { 
            image: { url: "https://pomf2.lain.la/f/p753265n.jpg" }, // Default PH Image or scrape if avail
            caption: infoMsg 
        }, { quoted: mek });

        // 6. DOWNLOAD VIDEO BUFFER (Fix for Stream Errors)
        // කෙලින්ම URL එක දෙන්නේ නැතුව Bot එකට Download කරලා යවනවා.
        const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });

        // 7. Send Video File
        await ranuxPro.sendMessage(from, {
            video: response.data,
            caption: `✅ *Downloaded via King RANUX PRO*`,
            mimetype: "video/mp4"
        }, { quoted: mek });

        // Final Success React
        await ranuxPro.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("PHDL Error:", e);
        // Error Handling
        if (e.code === 'ERR_BAD_REQUEST' || e.response?.status === 404) {
             reply("❌ *Video Not Found!* Check the link.");
        } else {
             reply("❌ *Download Failed!* The file might be too large for WhatsApp.");
        }
    }
});
