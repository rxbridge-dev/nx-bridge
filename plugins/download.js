const { cmd } = require("../command");
const axios = require("axios");
const path = require("path");

const FOOTER = `\n\n> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱`;

cmd(
  {
    pattern: "download",
    alias: ["downurl", "dl"],
    react: "📦",
    desc: "Download any size file via direct link",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q)
        return reply(
          "📦 *DIRECT FILE DOWNLOADER*\n\n" +
          "🔗 Direct download link එකක් දාන්න!\n\n" +
          "උදාහරණයක්:\n" +
          "`.direct https://example.com/movie.mkv`" +
          FOOTER
        );

      // React loading
      await bot.sendMessage(from, {
        react: { text: "⏳", key: mek.key },
      });

      // Filename from URL
      let fileName = path.basename(new URL(q).pathname);

      // HEAD request -> size
      const head = await axios.head(q);
      const size = parseInt(head.headers["content-length"] || 0);
      const sizeMB = (size / 1024 / 1024).toFixed(2);

      let caption =
        "📦 *KING RANUX PRO – DIRECT DOWNLOADER*\n\n" +
        `📄 *File Name:* ${fileName}\n` +
        `📊 *File Size:* ${sizeMB} MB\n\n`;

      // If file > 2.1GB
      if (sizeMB > 2100) {
        caption +=
          "⚠️ *File එක 2GBට වැඩි නිසා WhatsApp upload කරන්න බැහැ!*\n\n" +
          "⬇️ *Direct Download Link:*\n" +
          `${q}\n\n` +
          "💡 *Tip:* ADM / IDM / Browser එකෙන් download කරන්න." +
          FOOTER;

        await reply(caption);

        // React done
        await bot.sendMessage(from, {
          react: { text: "🔗", key: mek.key },
        });

      } else {
        caption +=
          "⬇️ *File WhatsApp එකෙන් send වෙනවා…* 🚀\n\n" +
          "Please wait..." +
          FOOTER;

        await bot.sendMessage(
          from,
          {
            document: { url: q },
            fileName: fileName,
            mimetype: "application/octet-stream",
            caption: caption,
          },
          { quoted: mek }
        );

        // React success
        await bot.sendMessage(from, {
          react: { text: "✅", key: mek.key },
        });
      }

    } catch (err) {
      console.error("DIRECT ERROR:", err);
      reply(
        "❌ *Direct download fail උනා!*\n\n" +
        "Link එක valid ද කියලා check කරන්න." +
        FOOTER
      );
    }
  }
);
