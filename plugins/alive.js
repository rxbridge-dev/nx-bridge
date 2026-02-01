const { cmd } = require("../command");
const os = require("os");
const config = require("../config");

// 🔥 BOT LOGO (Change if needed)
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
        // 1. Get Bot Owner's Name (Auto Detect)
        // ranuxPro.user.name = The WhatsApp name of the number running the bot
        const botOwnerName = ranuxPro.user.name || config.OWNER_NUMBER || "Unknown User";

        // 2. Calculate Uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / (3600 * 24));
        const hours = Math.floor((uptime % (3600 * 24)) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        // 3. Memory & System Info
        const usedMem = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
        const hostname = os.hostname();

        // 4. Date & Time (Sri Lanka)
        const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });
        const date = new Date(now).toLocaleDateString("en-GB");
        const time = new Date(now).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        // 5. Config Data
        const prefix = config.PREFIX || ".";
        const mode = (config.MODE || "public").toUpperCase();

        // 6. 🔥 ULTRA PREMIUM ALIVE MESSAGE DESIGN
        const aliveMsg = `
✨ *𝐊𝐈𝐍𝐆 𝐑𝐀𝐍𝐔𝐗 𝐏𝐑𝐎 𝐒𝐘𝐒𝐓𝐄𝐌 𝐎𝐍𝐋𝐈𝐍𝐄* ✨

👋 ʜᴇʟʟᴏ *${pushname}*, ɪ ᴀᴍ ᴀᴄᴛɪᴠᴇ ɴᴏᴡ!

╭━━「 *👤 𝐇𝐎𝐒𝐓 𝐈𝐍𝐅𝐎* 」━━━●
┃
┃ 👑 *Bot Owner* : ${botOwnerName}
┃ 🧬 *Prefix* : [ ${prefix} ]
┃ ⚙️ *Mode* : ${mode}
┃
╰━━━━━━━━━━━━━━━━●

╭━━「 *📟 𝐒𝐘𝐒𝐓𝐄𝐌 𝐒𝐓𝐀𝐓𝐒* 」━━●
┃
┃ ⏰ *Uptime* : ${days}D ${hours}H ${minutes}M ${seconds}S
┃ 💾 *Ram* : ${usedMem}MB / ${totalMem}MB
┃ 🖥️ *Host* : ${hostname}
┃
╰━━━━━━━━━━━━━━━━●

╭━━「 *📅 𝐃𝐀𝐓𝐄 & 𝐓𝐈𝐌𝐄* 」━━━●
┃
┃ 📆 *Date* : ${date}
┃ ⌚ *Time* : ${time}
┃
╰━━━━━━━━━━━━━━━━●

> 🚀 *Advanced, Fast & Secure WhatsApp Bot*
> *© 2026 King RANUX PRO Inc.*
`;

        // 7. Send Message with AdReply (Card View)
        await ranuxPro.sendMessage(from, { 
            image: { url: LOGO_URL },
            caption: aliveMsg,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterName: '🚀 𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 𝐍𝐞𝐰𝐬 🚀',
                    newsletterJid: "120363405950699484@newsletter",
                },
                externalAdReply: {
                    title: `👋 𝐇𝐢 ${botOwnerName}, 𝐈'𝐦 𝐀𝐥𝐢𝐯𝐞!`,
                    body: "ᴄʟɪᴄᴋ ʜᴇʀᴇ ᴛᴏ ᴊᴏɪɴ ᴏᴜʀ ᴄʜᴀɴɴᴇʟ",
                    thumbnailUrl: LOGO_URL,
                    sourceUrl: "https://whatsapp.com/channel/0029VbC5zjdAojYzyAJS7U2S",
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Alive Error:", e);
        reply("❌ Alive status unavailable.");
    }
});