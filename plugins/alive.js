const os = require("os");
const { cmd } = require("../command");

const ALIVE_LOGO = "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/king-ranux-pro-main-logo.png";

cmd({
  pattern: "alive",
  react: "💗",
  desc: "Check bot status",
  category: "main",
  filename: __filename
}, async (bot, mek, m, { reply, pushname }) => {
  try {
    const start = Date.now();
    const senderName = pushname || "User";

    const now = new Date();
    const date = now.toLocaleDateString("en-GB");
    const time = now.toLocaleTimeString("en-GB");

    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
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
│ 🖥 OS : ${os.platform()}
│ 🌐 Host : ${os.hostname()}
│ ⏱ Uptime : ${days}d ${hours}h ${minutes}m ${seconds}s
│ 💾 Memory : ${usedMem}MB / ${totalMem}MB
╰─────────────────────╯

╭────── 𝓕𝓮𝓪𝓽𝓾𝓻𝓮𝓼 ─────╮
│ 🚮 Anti Delete : ON 💖
│ 👁 Auto Status : ON 💖
│ 📤 Auto Forward : ON 💖
╰─────────────────────╯

(づ｡◕‿‿◕｡)づ  Always here for you ♡  

> Powered by A.M. Ransara Devnath
`;

    await bot.sendMessage(
      m.chat,
      {
        image: { url: ALIVE_LOGO },
        caption: aliveMsg
      },
      { quoted: m }
    );

  } catch (e) {
    console.log("Alive Error:", e);
    reply("❌ Alive command crashed.");
  }
});