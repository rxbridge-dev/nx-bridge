const { cmd } = require("../command");

/*
 👑 King RANUX PRO – Current JID Finder
 🎯 Works in: Groups, Private Chats, AND Channels (Newsletter)
 ⚙️ Logic: Detects the 'remoteJid' of the current context directly.
*/

cmd({
    pattern: "jid",
    alias: ["id"],
    desc: "Get the JID of the current Chat/Group/Channel",
    category: "tools",
    react: "🆔",
    filename: __filename
}, async (bot, mek, m, { from, reply }) => {
    try {
        // 1. JID එක කොහොමද කියලා හඳුනා ගැනීම
        let chatType = "Private Chat 👤";
        
        if (from.endsWith("@g.us")) {
            chatType = "Group Chat 👥";
        } else if (from.endsWith("@newsletter")) {
            chatType = "Channel (Newsletter) 📢";
        }

        // 2. මැසේජ් එක හැදීම
        const msg = `🆔 *CURRENT JID INFO*\n\n` +
                    `📂 *Type:* ${chatType}\n` +
                    `🔗 *JID:* \`${from}\`\n\n` +
                    `> 👑 𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 ᴾʳᵒ`;

        // 3. යැවීම (Channel වලදී Quoted වැඩ නොකරන්න පුළුවන් නිසා කෙලින්ම යවනවා)
        await bot.sendMessage(from, { 
            text: msg,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: mek });

    } catch (e) {
        console.log("JID ERROR:", e);
        reply("❌ Error getting JID.");
    }
});
