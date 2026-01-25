const { cmd } = require("../command");

cmd({
    pattern: "checkjid",
    desc: "Get real JID and debug channel",
    category: "main",
    filename: __filename
},
async (bot, mek, m, { from, reply }) => {
    if (!m.quoted) return reply("Please reply to a forwarded Channel Message.");

    try {
        const context = mek.message?.extendedTextMessage?.contextInfo;
        const forwardedJid = context?.forwardedNewsletterMessageInfo?.newsletterJid;
        const name = context?.forwardedNewsletterMessageInfo?.newsletterName;

        if (forwardedJid) {
            let msg = `📢 *CHANNEL FOUND!*\n\n`;
            msg += `📛 Name: ${name}\n`;
            msg += `🆔 Real JID: \`${forwardedJid}\`\n\n`;
            
            // Try to fetch metadata live
            try {
                const meta = await bot.newsletterMetadata("jid", forwardedJid);
                msg += `✅ Bot can see this channel!\n`;
                msg += `Role: ${meta.viewer_metadata.role}\n`;
            } catch (e) {
                msg += `❌ Bot CANNOT see this channel.\n`;
                msg += `Error: ${e.message}\n`;
            }

            return reply(msg);
        } else {
            reply("❌ මෙය Channel Message එකක් නොවේ.");
        }
    } catch (e) {
        console.log(e);
        reply("Unknown Error");
    }
});
