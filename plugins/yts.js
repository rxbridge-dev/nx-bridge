const { cmd } = require("../command");
const yts = require("yt-search");

const FOOTER = "\n\n> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱";

cmd(
  {
    pattern: "yts",
    alias: ["yts", "youtubesearch"],
    react: "🔎",
    desc: "Search YouTube videos",
    category: "search",
    filename: __filename,
  },
  async (
    ranuxPro,
    mek,
    m,
    {
      from,
      quoted,
      q,
      reply,
    }
  ) => {
    try {
      // ❌ No search query
      if (!q) {
        return reply(
          "🔎 *YouTube සෙවීමට keyword එකක් දාන්න!*\n" +
          "✨ *Example:* `yts Alan Walker`" +
          FOOTER
        );
      }

      // ⌛ Searching message
      await reply(
        "🔍 *YouTube එකේ හොයමින්…*\n" +
        "⏳ *ඔයාට හොඳම results ටික අරගෙන එනවා*" +
        FOOTER
      );

      const search = await yts(q);

      // ❌ No results
      if (!search || !search.all || search.all.length === 0) {
        return reply(
          "😕 *YouTube එකේ results හමු වුණේ නැහැ!*\n" +
          "👉 *වෙන keyword එකක් try කරලා බලන්න*" +
          FOOTER
        );
      }

      const results = search.videos.slice(0, 10);

      const formattedResults = results
        .map(
          (v, i) =>
            `🎬 *${i + 1}. ${v.title}*\n` +
            `⏱️ Duration: ${v.timestamp} | 👁️ Views: ${v.views.toLocaleString()}\n` +
            `📅 Uploaded: ${v.ago}\n` +
            `🔗 Watch: ${v.url}`
        )
        .join("\n\n");

      const caption =
`👑 *King RANUX PRO — YouTube Search Results*
─────────────────────────
🔎 *Search Query:* ${q}

${formattedResults}
${FOOTER}
`;

      await ranuxPro.sendMessage(
        from,
        {
          image: {
            url: "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/file_00000000d338720986013270eb1ecec5.png",
          },
          caption,
        },
        { quoted: mek }
      );
    } catch (err) {
      console.error(err);
      reply(
        "❌ *YouTube search එකේ දෝෂයක් ඇතිවුණා!*\n" +
        "🔁 *කරුණාකර ටික වෙලාවකට පස්සේ නැවත try කරන්න*" +
        FOOTER
      );
    }
  }
);
