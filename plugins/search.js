const { cmd } = require("../command");
const google = require("google-it");

/*
 👑 King RANUX PRO – Google Search Plugin
 🔍 Uses 'google-it' to scrape results
*/

const FOOTER = `\n\n> 👑 𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 ᴾʳᵒ`;

cmd({
    pattern: "google",
    alias: ["gsearch", "find"],
    react: "🔍",
    desc: "Search on Google",
    category: "search",
    filename: __filename
}, async (bot, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("🔍 *කරුණාකර Search කිරීමට අවශ්‍ය දෙය ලබා දෙන්න.* \n\nඋදා: `.google King RANUX Bot`");

        await reply("🌍 *Google හි සොයමින් පවතී...* ⏳");

        const results = await google({ query: q });

        if (!results || results.length === 0) {
            return reply("❌ *කිසිදු ප්‍රතිඵලයක් හමු නොවීය.*");
        }

        let msg = `🌍 *GOOGLE SEARCH RESULTS*\n\n`;
        msg += `🔍 *Query:* ${q}\n\n`;

        // Top 7 results පෙන්වයි
        results.slice(0, 7).forEach((result, i) => {
            msg += `*${i + 1}. ${result.title}*\n`;
            msg += `🔗 ${result.link}\n`;
            msg += `📝 ${result.snippet}\n\n`;
        });

        msg += FOOTER;

        await bot.sendMessage(from, {
            image: { url: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" },
            caption: msg
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ *Google Search දෝෂයක්.*");
    }
});
