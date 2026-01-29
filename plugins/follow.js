const { cmd } = require("../command");

cmd({
    pattern: "follow",
    alias: ["channelfollow", "cf"],
    desc: "Follow a WhatsApp Channel via Link",
    category: "tools",
    react: "📢",
    filename: __filename
}, async (bot, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) return reply("❌ *Channel Link එකක් ලබා දෙන්න.*");

        const link = args[0];
        // Regex මගින් Code එක ගැනීම
        const result = link.match(/whatsapp\.com\/channel\/([0-9A-Za-z]{20,24})/);

        if (!result || !result[1]) {
            return reply("❌ *වැරදි Channel Link එකකි.*");
        }

        const inviteCode = result[1];

        await reply("🔄 *Channel එකේ විස්තර සොයමින්...* ⏳");

        // 1. Get Channel Metadata (JID එක හොයාගන්න)
        const metadata = await bot.newsletterMetadata("invite", inviteCode).catch(e => null);

        if (!metadata) {
            return reply("❌ *Channel එක සොයාගත නොහැක.* (Link එක Expire වී තිබිය හැක).");
        }

        // 2. Check Role (Already followed da kiyala)
        const myRole = metadata.viewer_metadata?.role || "GUEST";
        
        if (myRole !== "GUEST") {
            return reply(`✅ *දැනටමත් මෙම Channel එක Follow කර ඇත.* (${metadata.name})`);
        }

        // 3. Follow Action
        await bot.newsletterFollow(metadata.id);

        let msg = `✅ *SUCCESSFULLY FOLLOWED!* 🎉\n\n`;
        msg += `📛 *Name:* ${metadata.name}\n`;
        msg += `👥 *Subscribers:* ${metadata.subscribers}\n`;
        msg += `🆔 *JID:* \`${metadata.id}\`\n\n`;
        msg += `> 👑 𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 ᴾʳᵒ`;

        await bot.sendMessage(from, { 
            image: { url: metadata.preview ? metadata.preview : "" }, 
            caption: msg 
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ *Follow කිරීම අසාර්ථකයි.* (සමහර විට ඔබ මෙම Channel එකේ Admin කෙනෙක් විය හැක).");
    }
});