const { cmd } = require("../command");
const os = require("os");
const config = require("../config");

// 🔥 HARDCODED LOGO URL
const LOGO_URL = "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/king-ranux-pro-main-logo.png";

cmd({
    pattern: "alive",
    desc: "Check bot status",
    category: "main",
    react: "⚜️",
    filename: __filename
},
async (ranuxPro, mek, m, { from, reply }) => {
    try {
        // 1. React Command
        await ranuxPro.sendMessage(from, { react: { text: "⚜️", key: mek.key } });

        // 2. System Calculations
        const uptimeSec = process.uptime();
        const hrs = Math.floor(uptimeSec / 3600);
        const mins = Math.floor((uptimeSec % 3600) / 60);
        const secs = Math.floor(uptimeSec % 60);
        
        const used = process.memoryUsage().rss / 1024 / 1024;
        const total = os.totalmem() / 1024 / 1024;
        
        const mode = (config.MODE || "public").toUpperCase();
        const prefix = (config.PREFIX || ".");

        // 3. HARDCODED ALIVE MESSAGE (Using Double Quotes for Copy-Paste Safety)
        const aliveText = 
        "\n╭─⬣「 𝗞𝗜𝗡𝗚 𝗥𝗔𝗡𝗨𝗫 𝗣𝗥𝗢 」⬣─╮\n" +
        "│\n" +
        "│  🟢 Status  : Online & Active ✨\n" +
        "│  ⚙️ Mode    : " + mode + "\n" +
        "│  🔧 Prefix  : " + prefix + "\n" +
        "│\n" +
        "├─⬣「 𝗦𝗬𝗦𝗧𝗘𝗠 𝗦𝗧𝗔𝗧𝗦 」\n" +
        "│\n" +
        "│  🕒 Uptime  : " + hrs + "h " + mins + "m " + secs + "s\n" +
        "│  💾 RAM     : " + used.toFixed(2) + "MB / " + total.toFixed(0) + "MB\n" +
        "│  💻 Platform: " + os.platform() + "\n" +
        "│\n" +
        "╰─⬣「 ᴹᵃᵈᵉ ᵇʸ ᴹᴿ. ᴿᵃⁿˢᵃʳᵃ ᴰᵉᵛⁿᵃᵗʰ 」⬣─╯\n";

        // 4. Send Message
        await ranuxPro.sendMessage(from, { 
            image: { url: LOGO_URL },
            caption: aliveText 
        }, { quoted: mek });

    } catch (e) {
        console.error("Alive Error:", e);
        reply("❌ Alive status unavailable.");
    }
});