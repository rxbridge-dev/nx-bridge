const os = require("os");
const config = require("../config");
const { cmd } = require("../command");

cmd({
  pattern: "alive",
  react: "💗",
  desc: "Check bot status",
  category: "main",
  filename: __filename
}, async (bot, mek, m, { reply, pushname }) => {
  try {
    const start = Date.now();

    // Fallback safe name
    const senderName = pushname || "User";

    const now = new Date();
    const date = now.toLocaleDateString("en-GB");
    const time = now.toLocaleTimeString("en-GB");

    const uptime = process.uptime();
    const days = Math.floor(uptime / (3600 * 24));
    const hours = Math.floor((uptime % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const usedMem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);

    const speed = Date.now() - start;

    const aliveMsg = `
(｡♥‿♥｡)  𝐇𝐞𝐥𝐥𝐨~ ${senderName} ♡  
✨ 𝙄'𝙢 𝘼𝙡𝙞𝙫𝙚 & 𝙍𝙚𝙖𝙙𝙮 ✨  

🌷 𝑲𝑰𝑵𝑮 𝑹𝑨𝑵𝑼𝑿 𝑷𝑹𝑶 🌷  
Your Cute Anime Assistant 💕

╭─────── 𝓣𝓲𝓶𝓮 ───────╮
│ 📅 Date : ${date}
│ ⏰ Time : ${time}
╰─────────────────────╯

╭────── 𝓢𝔂𝓼𝓽𝓮𝓶 ──────╮
│ 👤 User : ${senderName}
│ ⚡ Speed : ${speed} ms
│ 🔑 Prefix : ${config.PREFIX || "."}
│ 🧾 Version : ${config.VERSION || "1.0.0"}
│ 🖥 OS : ${os.platform()}
│ 🌐 Host : ${os.hostname()}
│ ⏱ Uptime : ${days}d ${hours}h ${minutes}m ${seconds}s
│ 💾 Memory : ${usedMem}MB / ${totalMem}MB
╰─────────────────────╯

╭────── 𝓕𝓮𝓪𝓽𝓾𝓻𝓮𝓼 ─────╮
│ 🚮 Anti Delete : ${config.ANTI_DELETE ? "ON 💖" : "OFF 💔"}
│ 👁 Auto Status : ${config.AUTO_STATUS_SEEN ? "ON 💖" : "OFF 💔"}
│ 📤 Auto Forward : ${config.AUTO_STATUS_FORWARD ? "ON 💖" : "OFF 💔"}
╰─────────────────────╯

(づ｡◕‿‿◕｡)づ  Always here for you ♡  

> Powered by A.M. Ransara Devnath
`;

    await bot.sendMessage(m.chat, { text: aliveMsg }, { quoted: m });

  } catch (err) {
    console.log("Alive Error:", err);
    reply("❌ Alive command error.");
  }
});