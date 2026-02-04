const { cmd } = require("../command");
const yts = require("yt-search");

// Design Elements
const FOOTER = "> 👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋɪɴɢ ʀᴀɴᴜx ᴘʀᴏ";
// High Quality YouTube Banner Image
const HEADER_IMG = "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/file_00000000d338720986013270eb1ecec5.png";

cmd(
  {
    pattern: "yts",
    alias: ["youtubesearch", "search", "ytsearch"],
    react: "🔎",
    desc: "Search YouTube videos",
    category: "search",
    filename: __filename,
  },
  async (ranuxPro, mek, m, { from, q, reply }) => {
    try {
      // 1. Validation
      if (!q) {
        return reply(`*ℹ️ Please provide a keyword to search.*\n\n*Example:* \`.yts Alan Walker\``);
      }

      // 2. Searching Message
      await reply(`*⏳ Searching YouTube for "${q}"... Please wait.*`);

      const search = await yts(q);

      // 3. Check Results
      if (!search || !search.all || search.all.length === 0) {
        return reply(`*❌ No results found matching your query.*`);
      }

      // 4. Format Results (Top 10)
      const results = search.videos.slice(0, 10);

      let caption = `
╭───〔 🔎 *𝐘𝐎𝐔𝐓𝐔𝐁𝐄 𝐒𝐄𝐀𝐑𝐂𝐇* 〕───┈
│
│ 🔍 *Search Results For:* "${q}"
│ 📹 *Found:* ${results.length} Videos
│
╰──────────────────────┈
`;

      results.forEach((v, i) => {
        caption += `
╭─〔 🎬 *RESULT ${i + 1}* 〕
│
│ 🏷️ *Title:* ${v.title}
│ ⏱️ *Duration:* ${v.timestamp}
│ 👀 *Views:* ${v.views.toLocaleString()}
│ 📅 *Uploaded:* ${v.ago}
│ 🔗 *Link:* ${v.url}
│
╰──────────────────────┈`;
      });

      caption += `\n${FOOTER}`;

      // 5. Send Result
      await ranuxPro.sendMessage(
        from,
        {
          image: { url: HEADER_IMG },
          caption: caption.trim(),
        },
        { quoted: mek }
      );

    } catch (err) {
      console.error("YTS ERROR:", err);
      reply(`*❌ An error occurred during the search.*\n\n${err.message}`);
    }
  }
);