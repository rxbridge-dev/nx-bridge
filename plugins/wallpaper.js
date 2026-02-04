--- START OF FILE wallpaper.js ---

const { cmd } = require("../command");
const axios = require("axios");

// Design Elements
const FOOTER = "> 👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋɪɴɢ ʀᴀɴᴜx ᴘʀᴏ";
const HEADER_IMG = "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/file_0000000053d472089dec2fa0af565d4d.png";

cmd(
  {
    pattern: "wall",
    alias: ["wallpaper", "wp", "img"],
    react: "🫟",
    desc: "Download HD Wallpapers",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      // 1. Input Validation
      if (!q) {
        return reply(`*ℹ️ Please provide a keyword.*\n\n*Example:* \`.wall anime girl\``);
      }

      await reply(`*⏳ Searching for "${q}"... Please wait.*`);

      // 2. Fetch Data (Wallhaven API)
      const res = await axios.get(
        `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(
          q
        )}&sorting=random&resolutions=1920x1080,2560x1440,3840x2160`
      );

      const wallpapers = res.data.data;

      // 3. Check Results
      if (!wallpapers || wallpapers.length === 0) {
        return reply(`*❌ No HD wallpapers found for "${q}".*`);
      }

      const selected = wallpapers.slice(0, 5); // Get Top 5

      // 4. Send Summary Message
      let summaryMsg = `
╭─「 🎨 *WALLPAPER SEARCH* 」
│
│ 🔎 *Keyword:* ${q}
│ 📸 *Found:* ${selected.length} Premium Images
│
╰─「 *Sending files...* 」`;

      await conn.sendMessage(
        from,
        {
          image: { url: HEADER_IMG },
          caption: summaryMsg.trim(),
        },
        { quoted: mek }
      );

      // 5. Send Images Loop
      for (const wallpaper of selected) {
        const caption = `
╭─「 🖼️ *HD WALLPAPER* 」
│
│ 📐 *Res:* ${wallpaper.resolution}
│ 📁 *Category:* ${wallpaper.category}
│ 🔗 *Source:* Wallhaven
│
╰─「 *King RANUX PRO* 」

${FOOTER}`;

        await conn.sendMessage(
          from,
          {
            image: { url: wallpaper.path },
            caption: caption.trim(),
          },
          { quoted: mek }
        );
      }

    } catch (e) {
      console.error("WALLPAPER ERROR:", e);
      reply(`*❌ An error occurred during the search.*\n\n${e.message}`);
    }
  }
);