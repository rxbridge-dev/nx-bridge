const { cmd } = require("../command");

cmd({
    pattern: "checkjid",
    desc: "Get JID from a forwarded channel message (Fixed)",
    category: "tools",
    filename: __filename
},
async (bot, mek, m, { from, reply }) => {
    try {
        // 1. Check if user quoted a message
        if (!m.quoted) return reply("⚠️ Please reply to a forwarded Channel Message.");

        // 2. Access the Raw Quoted Message directly
        // We look inside the message you sent (.checkjid), find the quoted part, and dig in.
        const rawQuoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!rawQuoted) return reply("❌ Message data read error.");

        // 3. Find the message type (Text, Image, Video, etc.)
        // It could be extendedTextMessage, imageMessage, videoMessage, etc.
        const msgType = Object.keys(rawQuoted)[0];
        const msgContent = rawQuoted[msgType];

        // 4. Extract Newsletter Info
        // The path is: QuotedMessage -> MessageContent -> contextInfo -> forwardedNewsletterMessageInfo
        const newsletterInfo = msgContent?.contextInfo?.forwardedNewsletterMessageInfo;

        if (newsletterInfo && newsletterInfo.newsletterJid) {
            const jid = newsletterInfo.newsletterJid;
            const name = newsletterInfo.newsletterName || "Unknown";
            const serverId = newsletterInfo.serverMessageId || "N/A";

            let msg = `📢 *CHANNEL INFO FOUND* 📢\n\n`;
            msg += `📛 *Name:* ${name}\n`;
            msg += `🆔 *JID:* \`${jid}\`\n`; // Backticks for easy copy
            msg += `🔢 *Msg ID:* ${serverId}\n\n`;
            
            msg += `👇 *Code for index.js:*\n`;
            msg += `const channelJid = "${jid}";`;

            return reply(msg);

        } else {
            console.log("RAW QUOTED OBJECT:", JSON.stringify(rawQuoted, null, 2)); // Debugging log
            return reply("❌ මෙය Channel එකකින් Forward කළ Message එකක් බව පෙනෙන්නට නැත.\n(Metadata not found in quote).");
        }

    } catch (e) {
        console.log("CHECKJID ERROR:", e);
        reply("⚠️ Error: " + e.message);
    }
});
