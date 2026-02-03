const { cmd } = require("../command");
const { instagram } = require("sadaslk-dlcore");

// Design Elements
const FOOTER = "> Powered by King RANUX PRO";

cmd({
    pattern: "insta",
    alias: ["ig", "instagram", "reel", "igdl"],
    desc: "Download Instagram Posts, Reels, and IGTV",
    category: "download",
    react: "📸",
    filename: __filename
},
async (bot, mek, m, { from, q, reply }) => {
    try {
        // 1. Validation
        if (!q || !q.includes("instagram.com")) {
            return reply(`*ℹ️ Please provide a valid Instagram link.*\n\n*Example:* .insta https://www.instagram.com/p/Cy8...`);
        }

        // 2. Status Update
        await reply(`*⏳ Fetching Instagram media... Please wait.*`);

        // 3. Fetch Data
        const data = await instagram(q);

        // 4. Check for Errors
        if (!data || !data.result || data.result.length === 0) {
            return reply(`*❌ Failed to fetch content.*\nMake sure the account is public and the link is correct.`);
        }

        // 5. Send Media (Handles Multiple Images/Videos)
        const totalFiles = data.result.length;

        for (let i = 0; i < totalFiles; i++) {
            let media = data.result[i];
            let fileType = media.type === "video" ? "Video 🎬" : "Image 🖼️";
            
            let caption = `
╭─「 📸 *INSTAGRAM DOWNLOAD* 」
│
│ 🔗 *Type:* ${fileType}
│ 🔢 *Count:* ${i + 1}/${totalFiles}
│
╰─「 *Enjoy!* 」

${FOOTER}`;

            await bot.sendMessage(from, {
                [media.type === "video" ? "video" : "image"]: { url: media.url },
                caption: caption.trim()
            }, { quoted: mek });
        }

    } catch (e) {
        console.error("IG ERROR:", e);
        reply(`*❌ An error occurred:* ${e.message}`);
    }
});