const { cmd } = require("../command");
const os = require("os");
const config = require("../config");

// 🔥 BOT LOGO URL
const LOGO_URL = "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/king-ranux-pro-main-logo.png";

cmd({
    pattern: "alive",
    desc: "Check bot status",
    category: "main",
    react: "👋",
    filename: __filename
},
async (ranuxPro, mek, m, { from, pushname, reply }) => {
    try {
        // 1. Get Sender Name (To say Hi)
        const senderName = pushname || "User";

        // 2. Calculate Uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / (3600 * 24));
        const hours = Math.floor((uptime % (3600 * 24)) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        // 3. System Stats
        const usedMem = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
        
        // 4. Date & Time
        const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });
        const date = new Date(now).toLocaleDateString("en-GB");
        const time = new Date(now).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        // 5. Config Data
        const prefix = config.PREFIX || ".";
        const mode = (config.MODE || "public").toUpperCase();

        // 6. 🔥 ULTRA BEAUTIFUL DESIGN (No Link Preview)
        const aliveMsg = `
✨ *𝐊𝐈𝐍𝐆 𝐑𝐀𝐍𝐔𝐗 𝐏𝐑𝐎 𝐕𝟐* ✨

👋 𝐇𝐢 ${senderName}, 𝐈'𝐦 𝐀𝐥𝐢𝐯𝐞 𝐍𝐨𝐰 🧬

╭───〔 👤 *𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎* 〕───┈
│
│ 👤 *Name* : ${senderName}
│ ⚡ *Mode* : ${mode}
│ 🔮 *Prefix* : [ ${prefix} ]
│
╰────────────────────┈

╭───〔 💾 *𝐒𝐘𝐒𝐓𝐄𝐌 𝐒𝐓𝐀𝐓𝐒* 〕───┈
│
│ 🆙 *Uptime* : ${days}D ${hours}H ${minutes}M ${seconds}S
│ 📟 *Ram* : ${usedMem}MB / ${totalMem}MB
│ ⚙️ *Platform* : ${os.platform()}
│
╰────────────────────┈

╭───〔 📅 *𝐃𝐀𝐓𝐄 𝐈𝐍𝐅𝐎* 〕───┈
│
│ 📆 *Date* : ${date}
│ ⌚ *Time* : ${time}
│
╰────────────────────┈

> 👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋɪɴɢ ʀᴀɴᴜx ᴘʀᴏ
`;

        // 7. Send Message (Only Image + Text)
        // contextInfo අයින් කරාම අර උඩින් එන Link Card එක එන්නේ නෑ.
        await ranuxPro.sendMessage(from, { 
            image: { url: LOGO_URL },
            caption: aliveMsg
        }, { quoted: mek });

    } catch (e) {
        console.error("Alive Error:", e);
        reply("❌ Alive status unavailable.");
    }
});