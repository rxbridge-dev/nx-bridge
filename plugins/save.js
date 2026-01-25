const { cmd } = require("../command");

const rateLimit = new Map();
const LIMIT = 5;
const WINDOW = 60 * 1000;

function isRateLimited(jid) {
  const now = Date.now();
  if (!rateLimit.has(jid)) {
    rateLimit.set(jid, { count: 1, start: now });
    return false;
  }
  const data = rateLimit.get(jid);
  if (now - data.start > WINDOW) {
    rateLimit.set(jid, { count: 1, start: now });
    return false;
  }
  data.count++;
  return data.count > LIMIT;
}

cmd(
  {
    pattern: "viewonce",
    alias: ["once", "vov"],
    desc: "Recover one-time view image/video",
    category: "tools",
    react: "👁️",
    filename: __filename,
  },
  async (bot, mek, m, { from, reply, isGroup, isAdmin, isOwner, isSudo }) => {
    try {
      if (isGroup && !isAdmin && !isOwner && !isSudo) {
        return reply(
          "❌ *Permission Denied*\n\n" +
          "මෙම command එක භාවිතා කළ හැක්කේ\n" +
          "Group Admins / Bot Owner / Sudo Users පමණි."
        );
      }

      if (isRateLimited(m.sender)) {
        return reply(
          "⏳ *Rate Limit Exceeded*\n\n" +
          "You can only use this command 5 times per minute.\n" +
          "මිනිත්තු 1ක් බලා නැවත උත්සාහ කරන්න."
        );
      }

      if (!m.quoted) {
        return reply(
          "👁️ *ONE-TIME VIEW DOWNLOADER*\n\n" +
          "One-time view photo/video එකකට reply කරලා\n" +
          "`.once` හෝ `.viewonce` කියලා දාන්න."
        );
      }

      const qmsg = m.quoted.message;

      const viewOnce =
        qmsg?.viewOnceMessageV2?.message ||
        qmsg?.viewOnceMessageV2Extension?.message ||
        qmsg?.viewOnceMessage?.message;

      if (!viewOnce) {
        return reply(
          "❌ *Not One-Time View Media*\n\n" +
          "මෙය One-Time View media එකක් නොවේ."
        );
      }

      const media =
        viewOnce.imageMessage ||
        viewOnce.videoMessage;

      if (!media) {
        return reply("❌ Media type not supported.");
      }

      await bot.sendMessage(from, {
        react: { text: "⏳", key: mek.key },
      });

      const buffer = await bot.downloadMediaMessage({
        key: m.quoted.key,
        message: qmsg,
      });

      const isVideo = media.mimetype.includes("video");
      const fileName = isVideo
        ? `viewonce_${Date.now()}.mp4`
        : `viewonce_${Date.now()}.jpg`;

      await bot.sendMessage(
        from,
        {
          document: buffer,
          fileName,
          mimetype: media.mimetype,
          caption:
            "👁️ *ONE-TIME VIEW RECOVERED*\n" +
            "━━━━━━━━━━━━━━━━━━\n" +
            "🔓 Media unlocked successfully\n" +
            "📦 Document ලෙස (no compression)\n\n" +
            "👁️ One-Time View media එක recover කර ඇත\n" +
            "⚡ King RANUX PRO",
        },
        { quoted: mek }
      );

      await bot.sendMessage(from, {
        react: { text: "✅", key: mek.key },
      });

    } catch (err) {
      console.log("VIEWONCE ERROR:", err);
      reply(
        "❌ Failed to recover one-time view media.\n" +
        "Media recover කිරීම අසාර්ථක විය."
      );
    }
  }
);
