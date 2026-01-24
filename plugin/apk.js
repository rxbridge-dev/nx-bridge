const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "apk",
    alias: ["android", "af"],
    react: "📦",
    desc: "Download your favourite Android APK",
    category: "download",
    filename: __filename,
  },
  async (test, mek, m, { q, reply, from }) => {
    try {
      if (!q) {
        return reply(
          "📱 *APK Downloader*\n\n" +
          "❗ App name එකක් දාන්න ඔනේ.\n" +
          "උදාහරණයක්:\n" +
          "`.apk WhatsApp`\n\n" +
          "> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱"
        );
      }

      await test.sendMessage(from, {
        react: { text: "⏳", key: mek.key },
      });

      const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(
        q
      )}/limit=1`;

      const { data } = await axios.get(apiUrl);

      if (!data?.datalist?.list?.length) {
        return reply(
          "⚠️ *APK not found*\n\n" +
          "ඔයා search කරපු app එක හමු නොවුණා.\n" +
          "නම වෙනස් කරලා try කරන්න.\n\n" +
          "> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱"
        );
      }

      const app = data.datalist.list[0];
      const appSize = app.size
        ? (app.size / 1048576).toFixed(2)
        : "Unknown";

      const caption =
        "📦 *APK DOWNLOADER*\n\n" +
        `📱 *App:* ${app.name}\n` +
        `🏷️ *Package:* ${app.package}\n` +
        `📊 *Size:* ${appSize} MB\n\n` +
        "📥 *Downloading APK...*\n\n" +
        "> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱";

      await test.sendMessage(
        from,
        {
          image: { url: app.icon },
          caption: caption,
        },
        { quoted: mek }
      );

      await test.sendMessage(
        from,
        {
          document: { url: app.file.path_alt },
          fileName: `${app.name}.apk`,
          mimetype: "application/vnd.android.package-archive",
        },
        { quoted: mek }
      );

      await test.sendMessage(from, {
        react: { text: "✅", key: mek.key },
      });
    } catch (err) {
      console.error("❌ APK Downloader Error:", err);
      reply(
        "❌ *APK download failed*\n\n" +
        "Server issue එකක් හෝ temporary error එකක්.\n" +
        "පස්සේ try කරන්න.\n\n" +
        "> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱"
      );
    }
  }
);