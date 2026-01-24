const { cmd } = require("../command");
const { ytmp3, ytmp4, tiktok } = require("sadaslk-dlcore");
const yts = require("yt-search");

/*
 👑 King RANUX PRO – Media Downloader Plugin
 🔒 Owner base compatible
 ⚙️ Core system unchanged
 ✨ UI / messages only enhanced (Unicode + Emoji)
*/

const FOOTER = `\n\n> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱`;

/* -------------------- YOUTUBE SEARCH -------------------- */
async function getYoutube(query) {
  const isUrl = /(youtube\.com|youtu\.be)/i.test(query);
  if (isUrl) {
    const id = query.split("v=")[1] || query.split("/").pop();
    return await yts({ videoId: id });
  }

  const search = await yts(query);
  if (!search.videos || !search.videos.length) return null;
  return search.videos[0];
}

/* ==================== SONG / MP3 ==================== */
cmd(
  {
    pattern: "song",
    alias: ["ytmp3", "yta"],
    desc: "Download YouTube song (MP3)",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q)
        return reply(
          "🎧 *Song name* හෝ *YouTube link* එකක් දාන්න 😊" + FOOTER
        );

      await reply("🔎 *YouTube එකේ search වෙනවා… පොඩ්ඩක් wait කරන්න* ⏳");

      const video = await getYoutube(q);
      if (!video)
        return reply(
          "❌ *Result එකක් හම්බුනේ නෑ* 😔 වෙන එකක් try කරන්න." +
            FOOTER
        );

      const caption =
        `🎵 *${video.title}*\n\n` +
        `👤 Channel : ${video.author?.name || "Unknown"}\n` +
        `⏱ Duration : ${video.timestamp}\n` +
        `👀 Views    : ${video.views.toLocaleString()}\n` +
        `🔗 ${video.url}` +
        FOOTER;

      await bot.sendMessage(
        from,
        { image: { url: video.thumbnail }, caption },
        { quoted: mek }
      );

      await reply("⬇️ *MP3 download වෙනවා…* 🎶 Poddak wait karanna");

      const data = await ytmp3(video.url);
      if (!data?.url)
        return reply(
          "❌ *MP3 download fail උනා* 😕 නැවත try කරන්න." + FOOTER
        );

      await bot.sendMessage(
        from,
        { audio: { url: data.url }, mimetype: "audio/mpeg" },
        { quoted: mek }
      );
    } catch (e) {
      console.log("SONG ERROR:", e);
      reply(
        "⚠️ *Song download එකේ error එකක් ආවා* 😢 පස්සේ try කරන්න." +
          FOOTER
      );
    }
  }
);

/* ==================== YOUTUBE VIDEO ==================== */
cmd(
  {
    pattern: "video",
    alias: ["ytmp4", "ytv"],
    desc: "Download YouTube video (MP4)",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q)
        return reply(
          "🎬 *YouTube video link* හෝ *name* එකක් දාන්න 📽️" +
            FOOTER
        );

      await reply("🔎 *Video search වෙනවා…* ⏳");

      const video = await getYoutube(q);
      if (!video)
        return reply(
          "❌ *Video එක හොයාගන්න බැරි උනා* 😔" + FOOTER
        );

      const caption =
        `🎬 *${video.title}*\n\n` +
        `👤 Channel : ${video.author?.name || "Unknown"}\n` +
        `⏱ Duration : ${video.timestamp}\n` +
        `👀 Views    : ${video.views.toLocaleString()}\n` +
        `📅 Uploaded : ${video.ago}\n` +
        `🔗 ${video.url}` +
        FOOTER;

      await bot.sendMessage(
        from,
        { image: { url: video.thumbnail }, caption },
        { quoted: mek }
      );

      await reply(
        "⬇️ *Video (360p) download වෙනවා…* 🎥 Poddak wait karanna"
      );

      const data = await ytmp4(video.url, {
        format: "mp4",
        videoQuality: "360",
      });

      if (!data?.url)
        return reply(
          "❌ *Video download fail උනා* 😕 නැවත try කරන්න." +
            FOOTER
        );

      await bot.sendMessage(
        from,
        {
          video: { url: data.url },
          mimetype: "video/mp4",
          fileName: data.filename || "youtube_video.mp4",
          caption: "✅ *YouTube Video Ready!* 🎉 Enjoy!" + FOOTER,
        },
        { quoted: mek }
      );
    } catch (e) {
      console.log("VIDEO ERROR:", e);
      reply(
        "⚠️ *Video download එකේ error එකක් ආවා* 😢" + FOOTER
      );
    }
  }
);

/* ==================== TIKTOK ==================== */
cmd(
  {
    pattern: "tiktok",
    alias: ["tt"],
    desc: "Download TikTok video (No watermark)",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q)
        return reply(
          "📱 *TikTok link* එකක් දාන්න 🙌" + FOOTER
        );

      await reply("⬇️ *TikTok video download වෙනවා…* 🎶");

      const data = await tiktok(q);
      if (!data?.no_watermark)
        return reply(
          "❌ *TikTok download fail උනා* 😕" + FOOTER
        );

      const caption =
        `🎵 *${data.title || "TikTok Video"}*\n\n` +
        `👤 Author : ${data.author || "Unknown"}\n` +
        `⏱ Duration : ${data.runtime || "?"}s` +
        FOOTER;

      await bot.sendMessage(
        from,
        { video: { url: data.no_watermark }, caption },
        { quoted: mek }
      );
    } catch (e) {
      console.log("TIKTOK ERROR:", e);
      reply(
        "⚠️ *TikTok download එකේ error එකක් ආවා* 😢" + FOOTER
      );
    }
  }
);
