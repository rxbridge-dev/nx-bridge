const { cmd } = require("../command");

// Rate limit system
const rateLimit = new Map();
const LIMIT = 5; // 5 per minute
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
  if (data.count > LIMIT) return true;
  return false;
}

cmd(
  {
    pattern: "getpp",
    alias: ["getdp", "pp"],
    desc: "Download user profile picture",
    category: "tools",
    react: "🖼️",
    filename: __filename,
  },
  async (bot, mek, m, { from, reply, isGroup, isAdmins, isOwner, isSudo }) => {
    try {
      // Group privacy
      if (isGroup && !isAdmins && !isOwner && !isSudo) {
        return reply(
          "❌ *Permission Denied*\n\n" +
          "Group එකක `.getpp` භාවිතා කළ හැක්කේ\n" +
          "Admins / Owner / Sudo පමණි."
        );
      }

      // Rate limit
      if (isRateLimited(m.sender)) {
        return reply(
          "⏳ *Rate Limit Exceeded*\n\n" +
          "5 per minute only.\n" +
          "මිනිත්තු 1ක් පසු නැවත උත්සාහ කරන්න."
        );
      }

      const targetJid = m.sender;

      await bot.sendMessage(from, {
        react: { text: "⏳", key: mek.key },
      });

      let ppUrl;
      try {
        ppUrl = await bot.profilePictureUrl(targetJid, "image");
      } catch (e) {
        return reply(
          "❌ *Profile picture not available.*\n" +
          "මෙම userගේ DP private හෝ නැත."
        );
      }

      // Name (fallback safe)
      let name = targetJid.split("@")[0];
      try {
        const contact = await bot.onWhatsApp(targetJid);
        if (contact?.[0]?.notify) name = contact[0].notify;
      } catch {}

      // About / status
      let about = "Not available";
      try {
        const status = await bot.fetchStatus(targetJid);
        if (status?.status) about = status.status;
      } catch {}

      await bot.sendMessage(
        from,
        {
          image: { url: ppUrl },
          caption:
            "🖼️ *PROFILE PICTURE RECOVERED*\n\n" +
            "👤 Name: " + name + "\n" +
            "🆔 JID: " + targetJid + "\n" +
            "💬 About: " + about + "\n\n" +
            "📥 *Userගේ DP එක download කරන ලදී*\n\n" +
            "👑 King RANUX PRO",
        },
        { quoted: mek }
      );

      await bot.sendMessage(from, {
        react: { text: "✅", key: mek.key },
      });

    } catch (err) {
      console.log("GETPP ERROR:", err);
      reply(
        "❌ Failed to get profile picture.\n" +
        "Profile picture ලබා ගැනීම අසාර්ථක විය."
      );
    }
  }
);
