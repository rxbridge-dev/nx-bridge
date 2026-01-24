const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "wall",
    alias: ["wallpaper"],
    react: "🖼️",
    desc: "Download HD Wallpapers",
    category: "download",
    filename: __filename,
  },
  async (
    conn,
    mek,
    m,
    {
      from,
      q,
      reply,
    }
  ) => {
    try {
      if (!q) {
        return reply(
          "🖼️ *HD Wallpaper Downloader*\n\n" +
          "කරුණාකර wallpaper search කරන්න keyword එකක් type කරන්න.\n\n" +
          "_Example:_ `.wall anime`\n\n" +
          "> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱"
        );
      }

      await reply(
        "🔍 *Searching HD Wallpapers...*\n" +
        "Please wait a moment ⏳\n\n" +
        "> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱"
      );

      const res = await axios.get(
        `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(
          q
        )}&sorting=random&resolutions=1920x1080,2560x1440,3840x2160`
      );

      const wallpapers = res.data.data;

      if (!wallpapers || wallpapers.length === 0) {
        return reply(
          "❌ *No HD wallpapers found!*\n\n" +
          "Try a different keyword.\n\n" +
          "> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱"
        );
      }

      const selected = wallpapers.slice(0, 5);

      await conn.sendMessage(
        from,
        {
          image: {
            url: "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/file_0000000053d472089dec2fa0af565d4d.png",
          },
          caption:
            "🖼️ *KING RANUX PRO – WALLPAPER DOWNLOADER*\n\n" +
            `🔎 Keyword: *${q}*\n` +
            `📂 Results: *${selected.length} HD Wallpapers*\n\n` +
            "> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱",
        },
        { quoted: mek }
      );

      for (const wallpaper of selected) {
        const caption =
          "🖼️ *HD Wallpaper*\n\n" +
          `📐 Resolution: *${wallpaper.resolution}*\n` +
          `🔗 Source: ${wallpaper.url}\n\n` +
          "> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱";

        await conn.sendMessage(
          from,
          {
            image: { url: wallpaper.path },
            caption,
          },
          { quoted: mek }
        );
      }
    } catch (e) {
      console.error(e);
      reply(
        "❌ *Wallpaper download failed!*\n\n" +
        "Please try again later.\n\n" +
        "> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱"
      );
    }
  }
);