const { cmd } = require("../command");
const { ytmp3, ytmp4, tiktok } = require("sadaslk-dlcore");
const yts = require("yt-search");
const axios = require("axios"); // Video Buffer කිරීම සඳහා

/*
 👑 King RANUX PRO – Media Downloader Plugin (Advanced)
 🔒 Owner base compatible
 ⚙️ Features:
    - Song & TikTok: Direct Download
    - Video: Menu Based Selection + Quality Select + Buffer Fix
*/

const FOOTER = `\n\n> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱`;

// Session Object to track video selection state
const pendingVideo = {}; 

/* ==================== SONG / MP3 (Direct) ==================== */
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
      if (!q) return reply("🎧 *Song name* හෝ *YouTube link* එකක් දාන්න 😊" + FOOTER);

      await reply("🔎 *YouTube Audio search වෙනවා…* ⏳");

      // Search Logic
      let videoInfo = null;
      const isUrl = /(youtube\.com|youtu\.be)/i.test(q);
      
      if (isUrl) {
        const id = q.split("v=")[1] || q.split("/").pop();
        const search = await yts({ videoId: id });
        videoInfo = search;
      } else {
        const search = await yts(q);
        if (search.videos.length > 0) videoInfo = search.videos[0];
      }

      if (!videoInfo) return reply("❌ *Result එකක් හම්බුනේ නෑ* 😔" + FOOTER);

      const caption =
        `🎵 *${videoInfo.title}*\n\n` +
        `👤 Channel : ${videoInfo.author?.name || "Unknown"}\n` +
        `⏱ Duration : ${videoInfo.timestamp}\n` +
        `👀 Views    : ${videoInfo.views.toLocaleString()}\n` +
        `🔗 ${videoInfo.url}` +
        FOOTER;

      await bot.sendMessage(from, { image: { url: videoInfo.thumbnail }, caption }, { quoted: mek });

      await reply("⬇️ *MP3 download වෙනවා…* 🎶 Poddak wait karanna");

      const data = await ytmp3(videoInfo.url);
      if (!data?.url) return reply("❌ *MP3 download fail උනා* 😕" + FOOTER);

      await bot.sendMessage(
        from,
        { audio: { url: data.url }, mimetype: "audio/mpeg" },
        { quoted: mek }
      );
    } catch (e) {
      console.log("SONG ERROR:", e);
      reply("⚠️ *Song download Error:* " + e.message + FOOTER);
    }
  }
);

/* ==================== TIKTOK (Direct) ==================== */
cmd(
  {
    pattern: "tiktok",
    alias: ["tt"],
    desc: "Download TikTok video",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("📱 *TikTok link* එකක් දාන්න 🙌" + FOOTER);

      await reply("⬇️ *TikTok video download වෙනවා…* 🎶");

      const data = await tiktok(q);
      if (!data?.no_watermark) return reply("❌ *TikTok download fail උනා* 😕" + FOOTER);

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
      reply("⚠️ *TikTok Error:* " + e.message + FOOTER);
    }
  }
);

/* ==================== YOUTUBE VIDEO (Menu Based) ==================== */

// 1️⃣ Step 1: Search & List
cmd(
    {
        pattern: "video",
        alias: ["ytv", "ytmp4"],
        desc: "Search and download YouTube videos (Interactive)",
        category: "download",
        filename: __filename
    },
    async (bot, mek, m, { from, q, reply, sender }) => {
        try {
            if (!q) return reply("🎥 *Video Name* හෝ *Link* එකක් ලබා දෙන්න.\nඋදා: .video avengers trailer" + FOOTER);

            await reply("🔎 *YouTube Video Search කරමින් පවතී...* ⏳");

            const search = await yts(q);
            const videos = search.videos.slice(0, 10); // Top 10 results

            if (!videos.length) return reply("❌ *කිසිදු වීඩියෝවක් හමු නොවීය.*" + FOOTER);

            // Save State specifically for Video command
            pendingVideo[sender] = {
                step: "select_video",
                results: videos,
                timestamp: Date.now()
            };

            let msg = "🎥 *YOUTUBE SEARCH RESULTS*\n\n";
            videos.forEach((v, i) => {
                msg += `*${i + 1}.* ${v.title}\n`;
                msg += `   ⏱️ ${v.timestamp} | 👀 ${v.views.toLocaleString()}\n`;
                msg += `   👤 ${v.author.name}\n\n`;
            });

            msg += `🔢 *කැමති වීඩියෝවේ අංකය Reply කරන්න (1-${videos.length})*`;
            msg += FOOTER;

            await bot.sendMessage(from, { image: { url: videos[0].thumbnail }, caption: msg }, { quoted: mek });

        } catch (e) {
            console.log(e);
            reply("❌ *Search Error:* " + e.message);
        }
    }
);

// 2️⃣ Step 2: Select Video -> Show Qualities
cmd({
    filter: (text, { sender }) => 
        pendingVideo[sender] && 
        pendingVideo[sender].step === "select_video" && 
        !isNaN(text) && 
        parseInt(text) > 0 && 
        parseInt(text) <= pendingVideo[sender].results.length
}, async (bot, mek, m, { from, body, sender, reply }) => {
    
    const index = parseInt(body.trim()) - 1;
    const selectedVideo = pendingVideo[sender].results[index];

    // Update State
    pendingVideo[sender].step = "select_quality";
    pendingVideo[sender].selectedVideo = selectedVideo;

    const qualities = [
        { label: "360p (SD)", val: "360" },
        { label: "480p (SD)", val: "480" },
        { label: "720p (HD)", val: "720" },
        { label: "1080p (FHD)", val: "1080" }
    ];

    let qMsg = `🎬 *SELECTED:* ${selectedVideo.title}\n\n`;
    qMsg += `⬇️ *Quality එකක් තෝරන්න (Reply Number):*\n\n`;

    qualities.forEach((q, i) => {
        qMsg += `*${i + 1}.* ${q.label}\n`;
    });
    qMsg += FOOTER;

    await bot.sendMessage(from, { 
        image: { url: selectedVideo.thumbnail }, 
        caption: qMsg 
    }, { quoted: mek });
});

// 3️⃣ Step 3: Download & Send (Buffer Fix)
cmd({
    filter: (text, { sender }) => 
        pendingVideo[sender] && 
        pendingVideo[sender].step === "select_quality" && 
        ["1", "2", "3", "4"].includes(text.trim())
}, async (bot, mek, m, { from, body, sender, reply }) => {

    const { selectedVideo } = pendingVideo[sender];
    const qualityMap = { "1": "360", "2": "480", "3": "720", "4": "1080" };
    const selectedQuality = qualityMap[body.trim()];

    // Clear session immediately
    delete pendingVideo[sender];

    await reply(`⬇️ *Video එක (${selectedQuality}p) Download වෙමින් පවතී...* 📥\n(Buffer ක්‍රමය මගින් යවන බැවින් මද වේලාවක් ගත විය හැක)`);

    try {
        const data = await ytmp4(selectedVideo.url, { quality: selectedQuality });
        if (!data.url) return reply("❌ *Download Error:* Link එක ලබාගැනීමට නොහැකි විය.");

        // 🔥 BUFFER FIX: වීඩියෝ එක කෙලින්ම server එකට අරන් යැවීම
        const response = await axios.get(data.url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        await bot.sendMessage(from, {
            video: buffer,
            mimetype: "video/mp4",
            fileName: `${selectedVideo.title}.mp4`,
            caption: `🎬 *${selectedVideo.title}*\n\n` +
                     `📊 Quality: ${selectedQuality}p\n` +
                     `👤 Channel: ${selectedVideo.author.name}\n` +
                     `🔗 URL: ${selectedVideo.url}` + 
                     FOOTER
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ *Download Error:* " + e.message);
    }
});

// 🗑️ Cleanup Interval (Every 5 mins)
setInterval(() => {
    const now = Date.now();
    for (const sender in pendingVideo) {
        if (now - pendingVideo[sender].timestamp > 300000) { // 5 mins
            delete pendingVideo[sender];
        }
    }
}, 60000);
