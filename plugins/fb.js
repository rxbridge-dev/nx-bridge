const { cmd } = require("../command");
const getFbVideoInfo = require("@xaviabot/fb-downloader");

// 🔥 GLOBAL FOOTER
const FOOTER = "> 👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋɪɴɢ ʀᴀɴᴜx ᴘʀᴏ";

cmd(
  {
    pattern: "fb",
    alias: ["facebook", "fbdl"],
    react: "📘",
    desc: "Download Facebook Videos",
    category: "download",
    filename: __filename,
  },
  async (ranuxPro, mek, m, { q, reply, from }) => {
    try {
      // 1. Validation: No URL
      if (!q || !q.includes("facebook.com") && !q.includes("fb.watch")) {
        return reply(
          "❌ *Please provide a valid Facebook URL!*\n\n" +
          "✨ *Example:* `.fb https://www.facebook.com/watch/?v=...`"
        );
      }

      // 2. Processing Message (Reaction)
      await ranuxPro.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      // 3. Fetch Video Data
      const result = await getFbVideoInfo(q);

      // 4. Validation: No Result
      if (!result || (!result.sd && !result.hd)) {
        return reply("😕 *Failed to fetch video!* Please check the link or privacy settings.");
      }

      // 5. Extract Details
      const title = result.title || "Facebook Video";
      const bestQualityUrl = result.hd || result.sd;
      const qualityText = result.hd ? "HD Quality" : "SD Quality";
      const thumbnail = result.thumbnail || "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/file_00000000b5647209867894812e26b0e9.png";

      // 6. 🔥 BUILD STYLISH CAPTION
      let caption = `✨ *𝐊𝐈𝐍𝐆 𝐑𝐀𝐍𝐔𝐗 𝐏𝐑𝐎 𝐅𝐁 𝐃𝐋* ✨\n\n`;
      caption += `👋 𝐇𝐞𝐲, 𝐇𝐞𝐫𝐞 𝐢𝐬 𝐲𝐨𝐮𝐫 𝐅𝐁 𝐕𝐢𝐝𝐞𝐨!\n\n`;

      caption += `╭───〔 📘 *𝐕𝐈𝐃𝐄𝐎 𝐈𝐍𝐅𝐎* 〕───┈\n`;
      caption += `│\n`;
      caption += `│ 🎬 *𝐓𝐢𝐭𝐥𝐞* : ${title}\n`;
      caption += `│ 🎞️ *𝐐𝐮𝐚𝐥𝐢𝐭𝐲* : ${qualityText}\n`;
      caption += `│ 🔗 *𝐔𝐫𝐥* : Facebook.com\n`;
      caption += `│\n`;
      caption += `╰────────────────────┈\n\n`;

      caption += `> ⬇️ *Downloading Video...*\n`;
      caption += `${FOOTER}`;

      // 7. Send Image + Caption
      await ranuxPro.sendMessage(
        from,
        {
          image: { url: thumbnail },
          caption: caption,
        },
        { quoted: mek }
      );

      // 8. Send Video
      await ranuxPro.sendMessage(
        from,
        {
          video: { url: bestQualityUrl },
          caption: `✅ *Facebook Video Downloaded!*`,
          mimetype: "video/mp4"
        },
        { quoted: mek }
      );

      // 9. Success Reaction
      await ranuxPro.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error(e);
      reply("❌ *Download Error!* Please try again later.");
    }
  }
);