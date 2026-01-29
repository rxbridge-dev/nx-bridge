const { cmd } = require("../command");
const axios = require("axios");

/*
 👑 King RANUX PRO – Temp Mail Plugin
 📧 Uses 1secmail API (No Key Needed)
*/

const FOOTER = `\n\n> 👑 𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 ᴾʳᵒ`;

// 1. Generate Temp Mail
cmd({
    pattern: "tempmail",
    alias: ["tm", "mail"],
    react: "📧",
    desc: "Generate a temporary email address",
    category: "tools",
    filename: __filename
}, async (bot, mek, m, { from, reply }) => {
    try {
        await reply("🔄 *Generating Temp Mail...*");

        const { data } = await axios.get("https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1");
        const email = data[0];

        let msg = `📧 *TEMP MAIL GENERATED*\n\n`;
        msg += `📬 *Email:* \`${email}\`\n\n`;
        msg += `⚠️ *සැළකිය යුතුයි:*\n`;
        msg += `මෙම ඊමේල් ලිපිනයට එන පණිවිඩ බැලීමට පහත විධානය භාවිතා කරන්න.\n\n`;
        msg += `👉 \`.checkmail ${email}\``;
        msg += FOOTER;

        await bot.sendMessage(from, { text: msg }, { quoted: mek });

    } catch (e) {
        reply("❌ *Error generating email.*");
    }
});

// 2. Check Inbox
cmd({
    pattern: "checkmail",
    alias: ["readmail", "inbox"],
    react: "bj",
    desc: "Check inbox of a temp email",
    category: "tools",
    filename: __filename
}, async (bot, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("ℹ️ කරුණාකර `.tempmail` මගින් ලබාගත් ඊමේල් ලිපිනය ලබා දෙන්න.\nඋදා: `.checkmail abc@1secmail.com`");

        const email = q.trim();
        const [login, domain] = email.split("@");

        if (!login || !domain) return reply("❌ වැරදි ඊමේල් ලිපිනයකි.");

        await reply("🔄 *Checking Inbox...* ⏳");

        // Get Messages List
        const { data: messages } = await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`);

        if (messages.length === 0) {
            return reply(`📭 *Inbox is Empty!*\n\nමෙම ලිපිනයට (${email}) තාම මැසේජ් ලැබී නැත.`);
        }

        let msg = `📬 *INBOX MESSAGES (${messages.length})*\n\n`;
        
        for (const message of messages) {
            msg += `-----------------------------\n`;
            msg += `🆔 *ID:* ${message.id}\n`;
            msg += `👤 *From:* ${message.from}\n`;
            msg += `📌 *Subject:* ${message.subject}\n`;
            msg += `📅 *Date:* ${message.date}\n`;
            
            // Fetch Full Message Content
            const { data: fullMsg } = await axios.get(`https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${message.id}`);
            msg += `📝 *Content:* ${fullMsg.textBody || "No Text Content"}\n`;
        }

        msg += FOOTER;

        await bot.sendMessage(from, { text: msg }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ *Error checking inbox.*");
    }
});
