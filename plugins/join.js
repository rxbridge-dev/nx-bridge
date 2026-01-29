const { cmd } = require("../command");

cmd({
    pattern: "join",
    alias: ["joingroup", "gjoin"],
    desc: "Join a WhatsApp Group via Link",
    category: "tools",
    react: "👥",
    filename: __filename
}, async (bot, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) return reply("❌ *Group Link එකක් ලබා දෙන්න.*");

        const link = args[0];
        // Regex මගින් Link එකෙන් Code එක වෙන් කර ගැනීම (More accurate)
        const result = link.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/);

        if (!result || !result[1]) {
            return reply("❌ *වැරදි Group Link එකකි.*");
        }

        const inviteCode = result[1];

        await reply("🔄 *Joining Group...*");
        
        // Join Request
        const res = await bot.groupAcceptInvite(inviteCode);
        
        if (!res) return reply("❌ Join වීමට නොහැක. (Link Revoked හෝ Bot Remove කර ඇත).");

        reply("✅ *සාර්ථකව Group එකට Join විය!* 🎉");

    } catch (e) {
        console.log(e);
        if (e.message.includes('401')) return reply("❌ *Link එක Expire වී හෝ Reset කර ඇත.*");
        reply("❌ *Error:* " + e.message);
    }
});