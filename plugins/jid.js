const { cmd } = require("../command");

/*
 👑 King RANUX PRO – Advanced JID Fetcher
 🔍 Supports: Private, Group, Quoted, Mentions & Newsletter (Channels)
*/

const FOOTER = `\n\n> 👑 𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 ᴾʳᵒ`;

cmd({
    pattern: "jid",
    alias: ["id", "getjid"],
    desc: "Get JID of User, Group, or Channel",
    category: "tools",
    react: "🆔",
    filename: __filename
}, async (bot, mek, m, { from, reply, sender, isGroup }) => {
    try {
        let msg = `🆔 *WHATSAPP JID INFO* 🆔\n\n`;

        // 1. Basic Info (Sender & Current Chat)
        msg += `👤 *Sender:* \`${sender}\`\n`;
        if (isGroup) {
            msg += `👥 *Group:* \`${from}\`\n`;
        }

        // 2. Quoted User JID (Reply කරලා නම්)
        if (m.quoted) {
            msg += `\n↩️ *Quoted User:* \`${m.quoted.sender}\`\n`;
        }

        // 3. Mentioned Users (Mention කරලා නම්)
        const mentions = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentions && mentions.length > 0) {
            msg += `\n🏷️ *Mentions:*\n`;
            mentions.forEach(jid => {
                msg += `> \`${jid}\`\n`;
            });
        }

        // 4. Channel JID Scanner (වැදගත්ම කොටස)
        // මේකෙන් බලනවා මැසේජ් එක Channel එකකින් Forward වෙලාද කියලා
        const context = m.quoted ? m.quoted.message?.extendedTextMessage?.contextInfo : mek.message?.extendedTextMessage?.contextInfo;
        
        if (context?.forwardedNewsletterMessageInfo) {
            const newsJid = context.forwardedNewsletterMessageInfo.newsletterJid;
            const newsName = context.forwardedNewsletterMessageInfo.newsletterName;
            
            msg += `\n📢 *Channel Detected!*\n`;
            msg += `📛 Name: ${newsName}\n`;
            msg += `🆔 JID: \`${newsJid}\`\n`;
        }

        msg += FOOTER;

        // Send Result
        await bot.sendMessage(from, { 
            text: msg,
            contextInfo: {
                mentionJid: [sender],
                forwardingScore: 999,
                isForwarded: true
            } 
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ *Error getting JID.*");
    }
});