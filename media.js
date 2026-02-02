const { cmd } = require("../command");
const { ytmp3, ytmp4, tiktok, instagram, facebook, twitter } = require("sadaslk-dlcore");
const yts = require("yt-search");
const axios = require("axios");

// Design Elements
const FOOTER = "> 👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋɪɴɢ ʀᴀɴᴜx ᴘʀᴏ";

// Helper: Get YouTube Info
async function getYoutube(query) {
  try {
    const isUrl = /(youtube\.com|youtu\.be)/i.test(query);
    if (isUrl) {
      const id = query.split("v=")[1] || query.split("/").pop();
      return await yts({ videoId: id });
    }
    const search = await yts(query);
    return search.videos.length > 0 ? search.videos[0] : null;
  } catch (e) { return null; }
}

// Helper: Buffer Fetcher
async function getBuffer(url) {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(res.data);
    } catch (e) { return null; }
}

// ===============================================================
// 🎵 SONG DOWNLOADER (Spotify Style UI)
// ===============================================================
cmd({
  pattern: "song",
  alias: ["ytmp3", "play"],
  desc: "Download Song",
  category: "download",
  react: "🎧",
  filename: __filename,
}, async (bot, mek, m, { from, q, reply }) => {
  if (!q) return reply("*ℹ️ Please provide a song name or link.*");

  try {
    await reply("🔎 *Searching for song...*");
    const video = await getYoutube(q);
    if (!video) return reply("*❌ Song not found!*");

    // 1. Send Info Card
    let infoMsg = `
╭─「 🎧 *SONG FOUND* 」
│
│ 🎵 *Title:* ${video.title}
│ 👤 *Artist:* ${video.author.name}
│ ⏱️ *Duration:* ${video.timestamp}
│ 👁️ *Views:* ${video.views.toLocaleString()}
│
╰─「 *Downloading...* 」`;

    await bot.sendMessage(from, { image: { url: video.thumbnail }, caption: infoMsg.trim() }, { quoted: mek });

    // 2. Download
    const data = await ytmp3(video.url);
    if (!data?.url) return reply("*❌ Download Failed.*");

    // 3. Send Audio with Context Info (Beautiful View)
    await bot.sendMessage(from, {
        audio: { url: data.url },
        mimetype: "audio/mpeg",
        fileName: `${video.title}.mp3`,
        contextInfo: {
            externalAdReply: {
                title: video.title,
                body: "King RANUX PRO Music",
                thumbnailUrl: video.thumbnail,
                sourceUrl: video.url,
                mediaType: 1,
                showAdAttribution: true,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply(`*❌ Error:* ${e.message}`);
  }
});

// ===============================================================
// 🎥 VIDEO DOWNLOADER (Direct Download)
// ===============================================================
cmd({
  pattern: "video",
  alias: ["ytmp4", "ytv"],
  desc: "Download Video",
  category: "download",
  react: "🎬",
  filename: __filename,
}, async (bot, mek, m, { from, q, reply }) => {
  if (!q) return reply("*ℹ️ Please provide a video name or link.*");

  try {
    await reply("🔎 *Searching for video...*");
    const video = await getYoutube(q);
    if (!video) return reply("*❌ Video not found!*");

    let infoMsg = `
╭─「 🎬 *VIDEO FOUND* 」
│
│ 📺 *Title:* ${video.title}
│ 👤 *Channel:* ${video.author.name}
│ ⏱️ *Duration:* ${video.timestamp}
│
╰─「 *Downloading...* 」`;

    await bot.sendMessage(from, { image: { url: video.thumbnail }, caption: infoMsg.trim() }, { quoted: mek });

    const data = await ytmp4(video.url, { format: "mp4", videoQuality: "360" });
    if (!data?.url) return reply("*❌ Download Failed.*");

    // Buffer to prevent corruption
    const videoBuffer = await getBuffer(data.url);

    await bot.sendMessage(from, {
        video: videoBuffer,
        mimetype: "video/mp4",
        caption: `✅ *${video.title}*\n${FOOTER}`
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply(`*❌ Error:* ${e.message}`);
  }
});

// ===============================================================
// 📸 INSTAGRAM DOWNLOADER
// ===============================================================
cmd({
  pattern: "instagram",
  alias: ["ig", "insta"],
  desc: "Download Instagram Media",
  category: "download",
  react: "📸",
  filename: __filename,
}, async (bot, mek, m, { from, q, reply }) => {
  if (!q || !q.includes("instagram.com")) return reply("*ℹ️ Please provide a valid Instagram link.*");

  try {
    await reply("🔄 *Downloading Instagram Media...*");
    
    const data = await instagram(q);
    if (!data || !data.result || data.result.length === 0) return reply("*❌ Failed to fetch content.*");

    for (let media of data.result) {
        await bot.sendMessage(from, {
            [media.type === "video" ? "video" : "image"]: { url: media.url },
            caption: `📸 *INSTAGRAM DOWNLOAD*\n${FOOTER}`
        }, { quoted: mek });
    }

  } catch (e) {
    console.log(e);
    reply("*❌ Error fetching Instagram media.*");
  }
});

// ===============================================================
// 📘 FACEBOOK DOWNLOADER
// ===============================================================
cmd({
  pattern: "fetchfb",
  alias: ["videofb", "fbook"],
  desc: "Download Facebook 2Video",
  category: "download",
  react: "📘",
  filename: __filename,
}, async (bot, mek, m, { from, q, reply }) => {
  if (!q || !q.includes("facebook.com") && !q.includes("fb.watch")) return reply("*ℹ️ Please provide a valid Facebook link.*");

  try {
    await reply("🔄 *Downloading Facebook Video...*");
    
    const data = await facebook(q);
    if (!data || !data.result) return reply("*❌ Failed to fetch video.*");

    // Prefer HD, fallback to SD
    const videoUrl = data.result.hd || data.result.sd;
    if (!videoUrl) return reply("*❌ Video not found.*");

    await bot.sendMessage(from, {
        video: { url: videoUrl },
        caption: `📘 *FACEBOOK DOWNLOAD*\n${FOOTER}`
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply("*❌ Error fetching Facebook video.*");
  }
});

// ===============================================================
// 🕺 TIKTOK DOWNLOADER
// ===============================================================
cmd({
  pattern: "tiktok",
  alias: ["tt"],
  desc: "Download TikTok Video",
  category: "download",
  react: "🕺",
  filename: __filename,
}, async (bot, mek, m, { from, q, reply }) => {
  if (!q || !q.includes("tiktok.com")) return reply("*ℹ️ Please provide a valid TikTok link.*");

  try {
    await reply("🔄 *Downloading TikTok...*");
    
    const data = await tiktok(q);
    if (!data?.no_watermark) return reply("*❌ Failed to fetch video.*");

    let msg = `
╭─「 🕺 *TIKTOK DOWNLOAD* 」
│
│ 👤 *Author:* ${data.author || "Unknown"}
│ 🎵 *Title:* ${data.title || "TikTok Video"}
│
╰─「 *King RANUX PRO* 」`;

    await bot.sendMessage(from, {
        video: { url: data.no_watermark },
        caption: msg.trim()
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply("*❌ Error fetching TikTok video.*");
  }
});

// ===============================================================
// 🐦 TWITTER / X DOWNLOADER
// ===============================================================
cmd({
  pattern: "twitter",
  alias: ["tw", "x"],
  desc: "Download Twitter Video",
  category: "download",
  react: "🐦",
  filename: __filename,
}, async (bot, mek, m, { from, q, reply }) => {
  if (!q || (!q.includes("twitter.com") && !q.includes("x.com"))) return reply("*ℹ️ Please provide a valid Twitter/X link.*");

  try {
    await reply("🔄 *Downloading Twitter Media...*");
    
    const data = await twitter(q);
    if (!data || !data.result) return reply("*❌ Failed to fetch content.*");

    // Twitter usually returns an array of media
    const mediaUrl = Array.isArray(data.result) ? data.result[0].url : data.result.url;

    if (!mediaUrl) return reply("*❌ Media not found.*");

    await bot.sendMessage(from, {
        video: { url: mediaUrl },
        caption: `🐦 *TWITTER DOWNLOAD*\n${FOOTER}`
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply("*❌ Error fetching Twitter media.*");
  }
});