const { cmd } = require("../command");
const { ytmp3, ytmp4, tiktok } = require("sadaslk-dlcore");
const yts = require("yt-search");
const axios = require("axios"); // For video buffering

// State Management for the interactive .video command
global.pendingVideo = global.pendingVideo || {};

// Design Elements
const FOOTER = "> Powered by King RANUX PRO";

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

    // Search Logic (unchanged)
    let videoInfo = null;
    const isUrl = /(youtube\.com|youtu\.be)/i.test(q);
    if (isUrl) {
      const id = q.split("v=")[1] || q.split("/").pop();
      videoInfo = await yts({ videoId: id });
    } else {
      const search = await yts(q);
      if (search.videos.length > 0) videoInfo = search.videos[0];
    }

    if (!videoInfo) return reply(`*❌ No results found for "${q}".*`);

    const caption = `
╭─「 🎵 *YOUTUBE AUDIO* 」
│
│  ርዕስ: ${videoInfo.title}
│  ቻናል: ${videoInfo.author?.name || "Unknown"}
│  ጊዜ: ${videoInfo.timestamp}
│  እይታዎች: ${videoInfo.views.toLocaleString()}
│
├─「 📥 *DOWNLOADING MP3...* 」
│
╰─「 *Please wait a moment* 」`;

    await bot.sendMessage(from, { image: { url: videoInfo.thumbnail }, caption: caption.trim() }, { quoted: mek });

    const data = await ytmp3(videoInfo.url);
    if (!data?.url) return reply("*❌ Failed to get the download link.*");

    // Send the audio file
    await bot.sendMessage(from, { 
      audio: { url: data.url }, 
      mimetype: "audio/mpeg",
      fileName: `${videoInfo.title}.mp3`
    }, { quoted: mek });

  } catch (e) {
    console.error("SONG ERROR:", e);
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

// ===============================================================
// 🎥 YOUTUBE VIDEO DOWNLOADER (INTERACTIVE)
// ===============================================================

// Step 1: Search and list videos
cmd({
  pattern: "video",
  alias: ["ytv", "ytmp4"],
  desc: "Search and download YouTube videos (Interactive)",
  category: "download",
  react: "🎥",
  filename: __filename
}, async (bot, mek, m, { from, q, reply, sender }) => {
  if (!q) return reply(`*ℹ️ Please provide a video name to search.*\n\n*Example:* \`.video nature documentary\``);
  
  // 🛡️ CLASH FIX: Clear other interactive states
  if (global.pendingMenu) delete global.pendingMenu[sender];
  if (global.pendingMovie) delete global.pendingMovie[sender];

  await reply(`*⏳ Searching for videos matching "${q}"...*`);

  try {
    const search = await yts(q);
    const videos = search.videos.slice(0, 5); // Top 5 results

    if (!videos.length) return reply(`*❌ No videos found for "${q}".*`);

    // Save state for this user with a specific type
    global.pendingVideo[sender] = {
      type: "VIDEO_SELECT",
      results: videos,
      timestamp: Date.now()
    };

    let msg = `
╭─「 🎥 *YOUTUBE SEARCH* 」
│
│ 💬 *Query:* "${q}"
├─
`;
    videos.forEach((v, i) => {
      msg += `│ *${i + 1}*. ${v.title}\n│    └─ ⏱️ ${v.timestamp} | 👤 ${v.author.name}\n`;
    });
    msg += `│
╰─「 *Reply with a number to select* 」`;

    await bot.sendMessage(from, { text: msg.trim() }, { quoted: mek });

  } catch (e) {
    console.error("VIDEO SEARCH ERROR:", e);
    reply(`*⚠️ Search Error:* ${e.message}`);
  }
});

// Step 2: Select video, show qualities
cmd({
  filter: (text, { sender }) =>
    global.pendingVideo[sender] &&
    global.pendingVideo[sender].type === "VIDEO_SELECT" &&
    /^\d+$/.test(text.trim())
}, async (bot, mek, m, { from, body, sender, reply }) => {
  const index = parseInt(body.trim()) - 1;
  const { results } = global.pendingVideo[sender];

  if (index < 0 || index >= results.length) return;
  
  const selectedVideo = results[index];

  // Update state to the next step
  global.pendingVideo[sender].type = "QUALITY_SELECT";
  global.pendingVideo[sender].selectedVideo = selectedVideo;

  const qualities = [
    { label: "360p (SD)" },
    { label: "480p (SD)" },
    { label: "720p (HD)" },
    { label: "1080p (FHD)" }
  ];

  let qMsg = `
╭─「 📥 *SELECT QUALITY* 」
│
│  🎬 *Video:* ${selectedVideo.title}
├─
`;
  qualities.forEach((q, i) => {
    qMsg += `│ *${i + 1}*. ${q.label}\n`;
  });
  qMsg += `│
╰─「 *Reply with a number* 」`;
  
  await bot.sendMessage(from, { image: { url: selectedVideo.thumbnail }, caption: qMsg.trim() }, { quoted: mek });
});

// Step 3: Download and send video
cmd({
  filter: (text, { sender }) =>
    global.pendingVideo[sender] &&
    global.pendingVideo[sender].type === "QUALITY_SELECT" &&
    /^[1-4]$/.test(text.trim()) // Only allow 1, 2, 3, 4
}, async (bot, mek, m, { from, body, sender, reply }) => {
  const { selectedVideo } = global.pendingVideo[sender];
  const qualityMap = { "1": "360", "2": "480", "3": "720", "4": "1080" };
  const selectedQuality = qualityMap[body.trim()];

  // Clear session immediately
  delete global.pendingVideo[sender];

  await reply(`*🚀 Preparing your download for "${selectedVideo.title}" (${selectedQuality}p)...*`);

  try {
    const data = await ytmp4(selectedVideo.url, { quality: selectedQuality });
    if (!data.url) return reply("*❌ Download Error: Could not retrieve the video link.*");

    // Buffering fix (unchanged logic)
    const response = await axios.get(data.url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    const caption = `
╭─「 ✅ *DOWNLOAD COMPLETE* 」
│
│  🎬 *Title:* ${selectedVideo.title}
│  📊 *Quality:* ${selectedQuality}p
│  👤 *Channel:* ${selectedVideo.author.name}
│
╰─「 *Enjoy your video!* 」

${FOOTER}`;

    await bot.sendMessage(from, {
      video: buffer,
      mimetype: "video/mp4",
      fileName: `${selectedVideo.title}.mp4`,
      caption: caption.trim()
    }, { quoted: mek });

  } catch (e) {
    console.error("VIDEO DOWNLOAD ERROR:", e);
    reply(`*❌ Download Error:* ${e.message}`);
  }
});

// Auto-cleanup for abandoned sessions
setInterval(() => {
  const now = Date.now();
  for (const sender in global.pendingVideo) {
    if (now - (global.pendingVideo[sender].timestamp || 0) > 300000) { // 5 mins
      delete global.pendingVideo[sender];
    }
  }
}, 60000);