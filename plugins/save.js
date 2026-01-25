const { cmd } = require("../command");

// simple in-memory rate limit
const rateLimit = new Map();
const LIMIT = 5; // uses
const WINDOW = 60 * 1000; // 60 seconds

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
  if (data.count > LIMIT) return true;
  return false;
}

cmd(
  {
    pattern: "viewonce",
    alias: ["vov", "once"],
    desc: "Download one-time view image or video",
    category: "tools",
    react: "👁️",
    filename: __filename,
  },
  async (bot, mek, m, { from, reply, isGroup, isAdmin, isOwner, isSudo }) => {
    try {
      // privacy check
      if (isGroup && !isAdmin && !isOwner && !isSudo) {
        return reply(
          "❌ *Permission Denied*\n\n" +
          "මෙම command එක භාවිතා කළ හැක්කේ\n" +
          "Group Admins / Bot Owner / Sudo Users පමණි."
        );
      }

      // rate limit check
      if (isRateLimited(m.sender)) {
        return reply(
          "⏳ *Rate Limit Exceeded*\n\n" +
          "You can only use `.viewonce` 5 times per minute.\n" +
          "කරුණාකර මිනිත්තු 1ක් බලා නැවත උත්සාහ කරන්න."
        );
      }

      if (!m.quoted) {
        return reply(
          "👁️ *ONE-TIME VIEW DOWNLOADER*\n\n" +
          "One-time view photo/video එකකට reply කරලා\n" +
          "`.viewonce` කියලා දාන්න.\n\n" +
          "උදාහරණය:\nReply media → .viewonce"
        );
      }

      const qmsg = m.quoted.message;

      // extract one-time view media
      let media =
        qmsg?.viewOnceMessageV2?.message?.imageMessage ||
        qmsg?.viewOnceMessageV2?.message?.videoMessage ||
        qmsg?.viewOnceMessage?.message?.imageMessage ||
        qmsg?.viewOnceMessage?.message?.videoMessage;

      if (!media) {
        return reply(
          "❌ This is not a one-time view media.\n" +
          "මෙය One-Time View media එකක් නොවේ."
        );
      }

      await bot.sendMessage(from, {
        react: { text: "⏳", key: mek.key },
      });

      // download decrypted buffer
      const buffer = await bot.downloadMediaMessage({
        key: m.quoted.key,
        message: qmsg,
      });

      const isVideo = media.mimetype?.includes("video");

      const fileName = isVideo
        ? `viewonce_video_${Date.now()}.mp4`
        : `viewonce_image_${Date.now()}.jpg`;

      // send as document
      await bot.sendMessage(
        from,
        {
          document: buffer,
          fileName: fileName,
          mimetype: media.mimetype || "application/octet-stream",
          caption:
            "👁️ *ONE-TIME VIEW RECOVERED*\n" +
            "🔓 Media unlocked successfully\n\n" +
            "👁️ *එක් වරක් පමණක් බැලිය හැකි Media එක Recover කර ඇත*\n" +
            "📦 Document ලෙස (no compression) ලබා දී ඇත\n\n" +
            "👑 King RANUX PRO",
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