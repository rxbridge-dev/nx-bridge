const { cmd } = require("../command");
const os = require("os");
const config = require("../config");

// 🔥 RESOURCES
const LOGO_URL = "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/king-ranux-pro-main-logo.png";
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
        
        // Sender (Command ගහන කෙනා)
        const senderName = pushname || "User";

        // Bot Owner (Bot එක Run වෙන නම්බර් එකේ නම)
        // ranuxPro.user.name එකෙන් WhatsApp Display Name එක ගන්නවා.
        const botOwnerName = ranuxPro.user.name || config.OWNER_NAME || "Ransara Devnath";
        
        // Time & Date
        const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });
        const date = new Date(now).toLocaleDateString("en-GB");
        const time = new Date(now).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        // Uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / (3600 * 24));
        const hours = Math.floor((uptime % (3600 * 24)) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);

        // System Stats
        const usedMem = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
        
        // Speed (Ping)
        const startTime = Date.now();
        const speed = startTime - mek.messageTimestamp * 1000;

        // Greeting Logic
        const curHour = new Date().getHours();
        let greeting = "ɢᴏᴏᴅ ɴɪɢʜᴛ 🌙";
        if (curHour < 12) greeting = "ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ ⛅";
        else if (curHour < 18) greeting = "ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ 🌞";
        else greeting = "ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ 🌆";

        // --- 2. THE PREMIUM CAPTION DESIGN ---
        const aliveMsg = `
${greeting} ${senderName} 👋

❖ ── ✦ ⌈ 🟢 *𝐎𝐍𝐋𝐈𝐍𝐄* ⌋ ✦ ── ❖

      ⏱️ *${time}*   |   📅 *${date}*
         🚀 *${speed}ms Speed*

╭─〔 👤 *𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎* 〕───┈
│
│ ◈ *𝐍𝐚𝐦𝐞*   : ${senderName}
│ ◈ *𝐌𝐨𝐝𝐞*   : ${config.MODE || "Public"}
│ ◈ *𝐑𝐨𝐥𝐞*   : User
│
╰─────────────────┈

╭─〔 🤖 *𝐁𝐎𝐓 𝐈𝐍𝐅𝐎* 〕───┈
│
│ ◈ *𝐏𝐫𝐞𝐟𝐢𝐱* : [ ${config.PREFIX || "."} ]
│ ◈ *𝐕𝐞𝐫𝐬*   : 2.0.0 Pro
│ ◈ *𝐎𝐰𝐧𝐞𝐫*  : ${botOwnerName}
│
╰─────────────────┈

╭─〔 💻 *𝐒𝐘𝐒𝐓𝐄𝐌* 〕───┈
│
│ ◈ *𝐑𝐀𝐌*    : ${usedMem}MB / ${totalMem}MB
│ ◈ *𝐔𝐩𝐭𝐢𝐦𝐞* : ${days}D ${hours}H ${minutes}M
│ ◈ *𝐇𝐨𝐬𝐭*   : ${os.platform().toUpperCase()}
│
╰─────────────────┈

> 👑 *𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 𝐏𝐑𝐎*
> 👨‍💻 *𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐌𝐑.𝐑𝐚𝐧𝐬𝐚𝐫𝐚 𝐃𝐞𝐯𝐧𝐚𝐭𝐡*
`;

        // --- 3. SEND MESSAGE SEQUENCE ---

        // Step 1: Send Voice Note FIRST (PTT)
        await ranuxPro.sendMessage(from, {
            audio: { url: ALIVE_VOICE },
            mimetype: 'audio/mpeg',
            ptt: true
        }, { quoted: mek });

        // Step 2: Send Image & Caption SECOND
        await ranuxPro.sendMessage(from, { 
            image: { url: LOGO_URL },
            caption: aliveMsg
        }, { quoted: mek });

    } catch (e) {
        console.error("Alive Error:", e);
        reply("❌ Alive status unavailable.");
    }
});