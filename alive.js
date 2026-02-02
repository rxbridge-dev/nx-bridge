const { cmd } = require("../command");
const os = require("os");
const config = require("../config");

// 🔥 NEW RESOURCES
const LOGO_URL = "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/king-ranux-pro-main-logo.png";
// Using a highly compatible audio format for WhatsApp PTT
const ALIVE_VOICE = "https://files.catbox.moe/0bvbbv.mp3"; 

cmd({
    pattern: "alive",
    desc: "Check bot status",
    category: "main",
    react: "👋",
    filename: __filename
},
async (ranuxPro, mek, m, { from, pushname, reply }) => {
    try {
        // --- 1. DATA COLLECTION ---
        const senderName = pushname || "User";
        const botOwnerName = config.OWNER_NAME || "Ransara Devnath";
        
        // Time & Date (Asia/Colombo)
        const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });
        const date = new Date(now).toLocaleDateString("en-GB");
        const time = new Date(now).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

        // Uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / (3600 * 24));
        const hours = Math.floor((uptime % (3600 * 24)) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        // System Stats
        const usedMem = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
        
        // Ping
        const start = Date.now();
        await ranuxPro.sendMessage(from, { react: { text: "⚡", key: mek.key } });
        const end = Date.now();
        const ping = end - start;

        // Greeting
        const curHour = new Date().getHours();
        let greeting = "ɢᴏᴏᴅ ɴɪɢʜᴛ 🌙";
        if (curHour < 12) greeting = "ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ ⛅";
        else if (curHour < 18) greeting = "ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ 🌞";
        else greeting = "ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ 🌆";

        // --- 2. THE ULTRA PREMIUM CAPTION ---
        const aliveMsg = `
${greeting} ${senderName} 👋

╭─「 👑 *𝐊𝐈𝐍𝐆 𝐑𝐀𝐍𝐔𝐗 𝐏𝐑𝐎* 」
│
│ 🧑‍💻 *Status:* Online & Active
│ 🚀 *Speed:* ${ping}ms
│ 📅 *Date:* ${date}
│ ⏰ *Time:* ${time}
│
├─「 👤 *USER INFO* 」
│
│ ◈ *User:* ${senderName}
│ ◈ *Mode:* ${config.MODE || "Public"}
│
├─「 🤖 *SYSTEM INFO* 」
│
│ ◈ *Ram:* ${usedMem}MB / ${totalMem}MB
│ ◈ *Uptime:* ${days}d ${hours}h ${minutes}m ${seconds}s
│ ◈ *Platform:* ${os.platform().toUpperCase()}
│ ◈ *Owner:* ${botOwnerName}
│
╰─「 *Stay Connected!* 」

📢 *Official Channel:*
https://whatsapp.com/channel/0029VbC5zjdAojYzyAJS7U2S

> 👨‍💻 *Powered By MR.Ransara Devnath*
`;

        // --- 3. SEND MESSAGE SEQUENCE ---

        // Step 1: Send Voice Note (Fixed Mimetype)
        await ranuxPro.sendMessage(from, {
            audio: { url: ALIVE_VOICE },
            mimetype: 'audio/mp4', // Changed to mp4/audio for better compatibility
            ptt: true
        }, { quoted: mek });

        // Step 2: Send Image & Caption
        await ranuxPro.sendMessage(from, { 
            image: { url: LOGO_URL },
            caption: aliveMsg.trim()
        }, { quoted: mek });

    } catch (e) {
        console.error("Alive Error:", e);
        reply("❌ Alive status unavailable.");
    }
});