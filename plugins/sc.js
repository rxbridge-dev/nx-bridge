const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

/* 
 👑 King RANUX PRO – Website Source Code Scraper
 🌐 Fetches HTML/JSON from any URL and sends as a file.
 🛡️ Includes User-Agent headers to bypass basic firewalls.
*/

const FOOTER = `\n\n> 👑 𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 ᴾʳᵒ`;

cmd({
    pattern: "getsource",
    alias: ["sc", "source", "html", "inspect"],
    desc: "Download the source code of any website",
    category: "tools",
    react: "🌐",
    filename: __filename
}, async (bot, mek, m, { from, q, reply }) => {
    try {
        // 1. Validation
        if (!q) return reply("ℹ️ *URL එකක් ලබා දෙන්න.*\n\nExample:\n`.sc https://google.com`" + FOOTER);
        
        if (!q.startsWith("http")) {
            return reply("❌ *කරුණාකර valid URL එකක් ලබා දෙන්න.* (http:// හෝ https:// තිබිය යුතුය)." + FOOTER);
        }

        await reply("🔄 *Source Code එක ලබා ගනිමින් පවතී...* ⏳");

        // 2. Request Data (Adding Headers to look like a Real Browser)
        const response = await axios.get(q, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            }
        });

        // 3. Process Content
        // If content is JSON object, stringify it. If string (HTML), keep it.
        const content = typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data;

        // 4. Create File Name based on Domain
        // e.g., https://google.com -> google.com_source.html
        const domain = q.replace(/^https?:\/\//, '').split('/')[0];
        const fileName = `${domain.replace(/[^a-zA-Z0-9]/g, '_')}_source.html`;
        const filePath = path.join(__dirname, fileName);

        // 5. Save File
        fs.writeFileSync(filePath, content);

        // 6. Send File
        await bot.sendMessage(from, {
            document: fs.readFileSync(filePath),
            mimetype: "text/html",
            fileName: fileName,
            caption: `🌐 *WEBSITE SOURCE CODE*\n\n🔗 *URL:* ${q}\n📦 *Size:* ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB\n\n${FOOTER}`
        }, { quoted: mek });

        // 7. Cleanup (Delete file after sending)
        fs.unlinkSync(filePath);

    } catch (e) {
        console.log("SC ERROR:", e);
        
        // Handle specific errors
        if (e.response && e.response.status === 403) {
            return reply("❌ *Access Denied (403)*\nමෙම වෙබ් අඩවිය Bots ලාට අවසර නොදේ." + FOOTER);
        } else if (e.response && e.response.status === 404) {
            return reply("❌ *Page Not Found (404)*\nඔබ ලබා දුන් ලින්ක් එක වැඩ කරන්නේ නැත." + FOOTER);
        } else {
            return reply("❌ *Error:* Source Code ලබා ගැනීමට නොහැක.\nReason: " + e.message + FOOTER);
        }
    }
});
