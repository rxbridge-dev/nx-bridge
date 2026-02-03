const { cmd } = require("../command");
const os = require("os");
const config = require("../config");

const LOGO_URL =
  "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/king-ranux-pro-main-logo.png";

cmd(
  {
    pattern: "alive",
    desc: "Check bot status",
    category: "main",
    react: "💖",
    filename: __filename,
  },
  async (ranuxPro, mek, m, { from, pushname, reply, sender }) => {
    try {
      const senderName = pushname || "User";

      // === TIME (Sri Lanka) ===
      const now = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Colombo",
      });
      const date = new Date(now).toLocaleDateString("en-GB");
      const time = new Date(now).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // === UPTIME ===
      const uptime = process.uptime();
      const days = Math.floor(uptime / (3600 * 24));
      const hours = Math.floor((uptime % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      // === MEMORY ===
      const usedMem = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
      const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);

      // === BOT NUMBER (OWNER AUTO) ===
      const botJid = ranuxPro.user?.id || "";
      const botNumber = botJid.split(":")[0].replace(/\D/g, "");
      const senderNumber = sender.replace(/\D/g, "");
      const isOwner = senderNumber === botNumber;

      const ownerName = isOwner
        ? senderName
        : config.OWNER_NAME || "Owner";

      // === PING ===
      const start = Date.now();
      await ranuxPro.sendMessage(from, {
        react: { text: "💫", key: mek.key },
      });
      const ping = Date.now() - start;

      // === GREETING ===
      const curHour = new Date().getHours();
      let greeting = "ɢᴏᴏᴅ ɴɪɢʜᴛ 🌙";
      if (curHour < 12) greeting = "ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ 🌸";
      else if (curHour < 18) greeting = "ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ ☀️";
      else greeting = "ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ 🌆";

      const aliveMsg = `
(｡♥‿♥｡)  ${greeting} ${senderName} ♡  
✨ I'm Alive & Ready ✨  

🌸✨ 𝑲𝑰𝑵𝑮 𝑹𝑨𝑵𝑼𝑿 𝑷𝑹𝑶 ✨🌸  
Your Cute Anime Assistant 💕

╭─────── 𝓣𝓲𝓶𝓮 ───────╮
│ 📅 Date : ${date}
│ ⏰ Time : ${time}
╰─────────────────────╯

╭────── 𝓢𝔂𝓼𝓽𝓮𝓶 ──────╮
│ 👤 User : ${senderName}
│ 👑 Owner : ${ownerName}
│ 🚀 Speed : ${ping} ms
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

🌷 Official Channel  
https://whatsapp.com/channel/0029VbC5zjdAojYzyAJS7U2S  

(づ｡◕‿‿◕｡)づ Always here for you 💕

— 𝓟𝓸𝔀𝓮𝓻𝓮𝓭 𝓑𝔂 —  
𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱
`;

      await ranuxPro.sendMessage(
        from,
        {
          image: { url: LOGO_URL },
          caption: aliveMsg.trim(),
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error("Alive Error:", e);
      reply("❌ Alive status unavailable.");
    }
  }
);