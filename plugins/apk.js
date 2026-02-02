const { cmd } = require("../command");
const axios = require("axios");

// 🔥 GLOBAL FOOTER
const FOOTER = "> 👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋɪɴɢ ʀᴀɴᴜx ᴘʀᴏ";

cmd(
  {
    pattern: "apk",
    alias: ["android", "app", "playstore"],
    react: "📱",
    desc: "Download Android APKs",
    category: "download",
    filename: __filename,
  },
  async (ranuxPro, mek, m, { q, reply, from }) => {
    try {
      // 1. Validation: No Query
      if (!q) {
        return reply(
          "❌ *Please provide an App Name!*\n\n" +
          "✨ *Example:* `.apk WhatsApp`"
        );
      }

      // 2. Searching Reaction
      await ranuxPro.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // 3. Search API (Aptoide)
      const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(q)}/limit=1`;
      const { data } = await axios.get(apiUrl);

      // 4. Validation: No Results
      if (!data?.datalist?.list?.length) {
        return reply("😕 *App not found!* Please check the name and try again.");
      }

      const app = data.datalist.list[0];
      
      // 5. Format Data
      const appSize = app.size ? (app.size / 1048576).toFixed(2) : "Unknown"; // Convert bytes to MB
      const downloads = app.stats?.downloads ? app.stats.downloads.toLocaleString() : "Unknown";
      const version = app.vername || "Latest";
      const updateDate = app.updated || "Unknown";

      // 6. 🔥 BUILD STYLISH CAPTION
      let caption = `✨ *𝐊𝐈𝐍𝐆 𝐑𝐀𝐍𝐔𝐗 𝐏𝐑𝐎 𝐀𝐏𝐊 𝐃𝐋* ✨\n\n`;
      caption += `👋 𝐇𝐞𝐲, 𝐈 𝐟𝐨𝐮𝐧𝐝 𝐲𝐨𝐮𝐫 𝐀𝐩𝐩!\n\n`;
      
      caption += `╭───〔 📱 *𝐀𝐏𝐏 𝐈𝐍𝐅𝐎* 〕───┈\n`;
      caption += `│\n`;
      caption += `│ 🏷️ *𝐍𝐚𝐦𝐞* : ${app.name}\n`;
      caption += `│ 📦 *𝐏𝐚𝐜𝐤𝐚𝐠𝐞* : ${app.package}\n`;
      caption += `│ 🔄 *𝐕𝐞𝐫𝐬𝐢𝐨𝐧* : ${version}\n`;
      caption += `│ ⚖️ *𝐒𝐢𝐳𝐞* : ${appSize} MB\n`;
      caption += `│ 📥 *𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐬* : ${downloads}\n`;
      caption += `│\n`;
      caption += `╰────────────────────┈\n\n`;
      
      caption += `> ⬇️ *Downloading File...*\n`;
      caption += `${FOOTER}`;

      // 7. Send Image + Caption
      await ranuxPro.sendMessage(
        from,
        {
          image: { url: app.icon },
          caption: caption,
        },
        { quoted: mek }
      );

      // 8. Send APK Document
      await ranuxPro.sendMessage(
        from,
        {
          document: { url: app.file.path_alt },
          fileName: `${app.name} v${version}.apk`,
          mimetype: "application/vnd.android.package-archive",
          caption: `✅ *${app.name} Downloaded!*`
        },
        { quoted: mek }
      );

      // 9. Success Reaction
      await ranuxPro.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
      console.error("APK Error:", err);
      reply("❌ *Download Failed!* The file might be too large or unavailable.");
    }
  }
);