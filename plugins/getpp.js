const { cmd } = require("../command");

/*
 👑 King RANUX PRO – Get Profile Picture (UI Enhanced)
 🔒 Logic & System remains 100% unchanged
 🎨 UI upgraded to Premium Standard
*/

// --- RATE LIMIT SYSTEM (UNCHANGED) ---
const rateLimit = new Map();
const LIMIT = 5; // Max 5 requests per minute
const WINDOW = 60 * 1000; // 1 Minute

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

const FOOTER = "> Powered by King RANUX PRO";

cmd(
  {
    pattern: "getpp",
    alias: ["getdp", "pp", "profile"],
    desc: "Download user profile picture (Target Only)",
    category: "tools",
    react: "👤",
    filename: __filename,
  },
  async (bot, mek, m, { from, reply, isGroup, isAdmin, isOwner, isSudo }) => {
    try {
      // 1. Privacy Check (Logic Unchanged)
      if (isGroup && !isAdmin && !isOwner && !isSudo) {
        return reply(`*❌ Permission Denied*\n\n*This command is restricted to Group Admins.*`);
      }

      // 2. Rate Limit Check (Logic Unchanged)
      if (isRateLimited(m.sender)) {
        return reply(`*⏳ Whoa! Slow down...*\n\n*Please wait a moment before using this command again.*`);
      }

      // 3. Target Selection (Logic Unchanged)
      let targetJid;
      
      if (m.quoted) {
        targetJid = m.quoted.sender;
      } else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        targetJid = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else {
        return reply(`*ℹ️ Please reply to a user or tag them (@mention) to get their profile picture.*`);
      }

      await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      // 4. Get Profile Picture URL
      let ppUrl;
      try {
        ppUrl = await bot.profilePictureUrl(targetJid, "image");
      } catch (e) {
        await bot.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`*❌ Profile Picture Not Found!*\n\n*The user might have set their privacy to 'Nobody' or removed their photo.*`);
      }

      // 5. Get User Bio/Status
      let about = "🔒 Private / No Bio";
      try {
        const statusData = await bot.fetchStatus(targetJid);
        if (statusData?.status) about = statusData.status;
      } catch (e) {}

      // 6. Send Result (Premium UI)
      const username = targetJid.split("@")[0];
      
      const caption = `
╭─「 👤 *USER PROFILE* 」
│
│  📛 *User:* @${username}
│  📝 *Bio:* ${about}
│  🆔 *JID:* ${targetJid}
│
╰─「 *King RANUX PRO* 」

${FOOTER}`;

      await bot.sendMessage(
        from,
        {
          image: { url: ppUrl },
          caption: caption.trim(),
          mentions: [targetJid]
        },
        { quoted: mek }
      );

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
      console.log("GETPP ERROR:", err);
      reply(`*❌ An error occurred while fetching the profile picture.*`);
    }
  }
);