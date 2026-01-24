const { cmd, commands } = require("../command");
const getFbVideoInfo = require("@xaviabot/fb-downloader");

const FOOTER = "\n\n> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱";

cmd(
  {
    pattern: "fb",
    alias: ["facebook"],
    react: "📘",
    desc: "Download Facebook Video",
    category: "download",
    filename: __filename,
  },
  async (
    ranuxPro,
    mek,
    m,
    {
      from,
      quoted,
      body,
      isCmd,
      command,
      args,
      q,
      isGroup,
      sender,
      senderNumber,
      botNumber2,
      botNumber,
      pushname,
      isMe,
      isOwner,
      groupMetadata,
      groupName,
      participants,
      groupAdmins,
      isBotAdmins,
      isAdmins,
      reply,
    }
  ) => {
    try {
      // ❌ No URL
      if (!q) {
        return reply(
          "📘 *Facebook video download කිරීමට valid link එකක් දාන්න!*\n" +
          "✨ *Example:* `fb https://www.facebook.com/...`" +
          FOOTER
        );
      }

      const fbRegex = /(https?:\/\/)?(www\.)?(facebook|fb)\.com\/.+/;
      if (!fbRegex.test(q)) {
        return reply(
          "❌ *Invalid Facebook URL!*\n" +
          "👉 *කරුණාකර හරි link එකක් check කරලා නැවත try කරන්න*" +
          FOOTER
        );
      }

      // ⏳ Downloading message
      await reply(
        "⬇️ *Facebook video download වෙමින් පවතිනවා…*\n" +
        "⏳ *කරුණාකර ටිකක් රැඳී සිටින්න*" +
        FOOTER
      );

      const result = await getFbVideoInfo(q);
      if (!result || (!result.sd && !result.hd)) {
        return reply(
          "😕 *Video download කරන්න බැරි වුණා!*\n" +
          "🔁 *කරුණාකර ටික වෙලාවකට පස්සේ නැවත try කරන්න*" +
          FOOTER
        );
      }

      const { title, sd, hd } = result;
      const bestQualityUrl = hd || sd;
      const qualityText = hd ? "HD" : "SD";

      const desc =
`👑 *King RANUX PRO — FB Video Downloader*
─────────────────────────
🎬 *Title:* ${title || "Unknown"}
🎥 *Quality:* ${qualityText}
🔗 *Source:* Facebook
${FOOTER}
`;

      await ranuxPro.sendMessage(
        from,
        {
          image: {
            url: "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/file_00000000b5647209867894812e26b0e9.png",
          },
          caption: desc,
        },
        { quoted: mek }
      );

      await ranuxPro.sendMessage(
        from,
        {
          video: { url: bestQualityUrl },
          caption: `📥 *Downloaded in ${qualityText} quality*` + FOOTER,
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error(e);
      reply(
        "❌ *Facebook video download කිරීමේදී දෝෂයක් ඇතිවුණා!*\n" +
        "🔁 *කරුණාකර ටික වෙලාවකට පස්සේ නැවත try කරන්න*" +
        FOOTER
      );
    }
  }
);
