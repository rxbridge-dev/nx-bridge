const { cmd } = require("../command");
const { ytmp3, ytmp4, tiktok } = require("sadaslk-dlcore");
const yts = require("yt-search");
const axios = require("axios");

// Design Elements
const FOOTER = "> Powered by King RANUX PRO";

// Helper function to get YouTube info
async function getYoutube(query) {
  try {
    const isUrl = /(youtube\.com|youtu\.be)/i.test(query);
    if (isUrl) {
      const id = query.split("v=")[1] || query.split("/").pop();
      const info = await yts({ videoId: id });
      return info;
    }
    const search = await yts(query);
    return search.videos.length > 0 ? search.videos[0] : null;
  } catch (e) {
    return null;
  }
}

// ===============================================================
// 🎵 SONG / MP3 DOWNLOADER
// ===============================================================
cmd({
  pattern: "song",
  alias: ["ytmp3", "yta"],
  desc: "Download YouTube song (MP3)",
  category: "download",
  react: "🎵",
  filename: __filename,
}, async (bot, mek, m, { from, q, reply }) => {
  if (!q) return reply(`*ℹ️ Please provide a song name or YouTube link.*\n\n*Example:* \`.song faded\``);

  try {
    await reply(`*⏳ Searching for "${q}" on YouTube...*`);

    const video = await getYoutube(q);
    if (!video) return reply(`*❌ No results found for "${q}".*`);

    const caption = `
╭─「 🎵 *SONG DOWNLOADER* 」
│
│  🎼 *Title:* ${video.title}
│  👤 *Channel:* ${video.author?.name || "Unknown"}
│  🕒 *Duration:* ${video.timestamp}
│  👀 *Views:* ${video.views.toLocaleString()}
│
├─「 📥 *DOWNLOADING MP3...* 」
│
╰─「 *Please wait a moment* 」`;

    await bot.sendMessage(from, { image: { url: video.thumbnail }, caption: caption.trim() }, { quoted: mek });

    const data = await ytmp3(video.url);
    if (!data?.url) return reply("*❌ Failed to get the download link.*");

    // Send the audio file
    await bot.sendMessage(from, { 
      audio: { url: data.url }, 
      mimetype: "audio/mpeg",
      fileName: `${video.title}.mp3`
    }, { quoted: mek });

  } catch (e) {
    console.error("SONG ERROR:", e);
    reply(`*⚠️ An error occurred during download:* ${e.message}`);
  }
});

// ===============================================================
// 🎥 YOUTUBE VIDEO DOWNLOADER (DIRECT)
// ===============================================================
cmd({
  pattern: "video",
  alias: ["ytv", "ytmp4"],
  desc: "Download YouTube video (MP4)",
  category: "download",
  react: "🎥",
  filename: __filename
}, async (bot, mek, m, { from, q, reply }) => {
  if (!q) return reply(`*ℹ️ Please provide a video name or YouTube link.*\n\n*Example:* \`.video nature documentary\``);

  try {
    await reply(`*⏳ Searching for "${q}" on YouTube...*`);

    const video = await getYoutube(q);
    if (!video) return reply(`*❌ No results found for "${q}".*`);

    const caption = `
╭─「 🎥 *VIDEO DOWNLOADER* 」
│
│  🎬 *Title:* ${video.title}
│  👤 *Channel:* ${video.author?.name || "Unknown"}
│  🕒 *Duration:* ${video.timestamp}
│  📅 *Uploaded:* ${video.ago || "N/A"}
│
├─「 📥 *DOWNLOADING VIDEO...* 」
│
╰─「 *Please wait a moment* 」`;

    await bot.sendMessage(from, { image: { url: video.thumbnail }, caption: caption.trim() }, { quoted: mek });

    // DEFAULT QUALITY DOWNLOAD (Like Old System)
    const data = await ytmp4(video.url, { format: "mp4", videoQuality: "360" });
    if (!data?.url) return reply("*❌ Failed to get the download link.*");

    // Buffering Fix
    const response = await axios.get(data.url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    const finalCaption = `
╭─「 ✅ *DOWNLOAD COMPLETE* 」
│
│  🎬 *Title:* ${video.title}
│  👤 *Channel:* ${video.author.name}
│
╰─「 *Enjoy your video!* 」

${FOOTER}`;

    await bot.sendMessage(from, {
      video: buffer,
      mimetype: "video/mp4",
      fileName: `${video.title}.mp4`,
      caption: finalCaption.trim()
    }, { quoted: mek });

  } catch (e) {
    console.error("VIDEO ERROR:", e);
    reply(`*⚠️ An error occurred during download:* ${e.message}`);
  }
});

// ===============================================================
// 🎬 TIKTOK DOWNLOADER
// ===============================================================
cmd({
  pattern: "tiktok",
  alias: ["tt"],
  desc: "Download TikTok video",
  category: "download",
  react: "🕺",
  filename: __filename,
}, async (bot, mek, m, { from, q, reply }) => {
  if (!q || !q.includes("tiktok.com")) return reply(`*ℹ️ Please provide a valid TikTok video link.*`);

  try {
    await reply("*⏳ Fetching TikTok video... Please wait.*");

    const data = await tiktok(q);
    if (!data?.no_watermark) return reply("*❌ Failed to download this TikTok video.*");

    const caption = `
╭─「 🕺 *TIKTOK DOWNLOADER* 」
│
│  👤 *Author:* @${data.author || "Unknown"}
│  🎵 *Sound:* ${data.title || "Original Sound"}
│
╰─「 *Video sent without watermark* 」

${FOOTER}`;

    await bot.sendMessage(from, { 
      video: { url: data.no_watermark }, 
      caption: caption.trim() 
    }, { quoted: mek });

  } catch (e) {
    console.error("TIKTOK ERROR:", e);
    reply(`*⚠️ An error occurred:* ${e.message}`);
  }
});