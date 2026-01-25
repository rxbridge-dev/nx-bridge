const { cmd } = require("../command");

/*
 👑 King RANUX PRO – Get Profile Picture (Fixed & Enhanced)
 🔒 Uses Baileys native functions (No extra NPM needed)
 ⚙️ Features: Rate Limit + Admin Check + Reply/Mention Target
*/

// --- RATE LIMIT SYSTEM ---
const rateLimit = new Map();
const LIMIT = 5; // විනාඩියකට උපරිම 5 පාරයි
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

const FOOTER = `\n\n> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱`;

cmd(
  {
    pattern: "getpp",
    alias: ["getdp", "pp", "jid"],
    desc: "Download user profile picture (Target Only)",
    category: "tools",
    react: "🖼️",
    filename: __filename,
  },
  async (bot, mek, m, { from, reply, isGroup, isAdmin, isOwner, isSudo }) => {
    try {
      // 1. Privacy Check (Group නම් Admin/Owner ට විතරයි - අවශ්‍ය නම් මෙය මකන්න)
      if (isGroup && !isAdmin && !isOwner && !isSudo) {
        return reply(
          "❌ *Permission Denied*\n\n" +
          "මෙම command එක භාවිතා කළ හැක්කේ Group Admins ලාට පමණි." + FOOTER
        );
      }

      // 2. Rate Limit Check
      if (isRateLimited(m.sender)) {
        return reply(
          "⏳ *Rate Limit Exceeded*\n\n" +
          "ඔයා විනාඩියක් ඇතුලත ඕනවට වඩා try කරා. පොඩ්ඩක් ඉන්න." + FOOTER
        );
      }

      // 3. Target Selection (වැදගත්ම කොටස)
      let targetJid;
      
      if (m.quoted) {
        // Reply කරපු කෙනාගේ JID එක
        targetJid = m.quoted.sender;
      } else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        // Mention කරපු කෙනාගේ JID එක
        targetJid = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else {
        // කාවවත් select කරලා නැත්නම් Error එකක්
        return reply(
          "⚠️ *වැරදියි!* \n\n" +
          "Please *Reply* to a user or *Mention* (@tag) someone to get their DP.\n" +
          "(තමන්ගේ DP එක ලබා ගැනීමට මෙය භාවිතා කළ නොහැක)." + FOOTER
        );
      }

      await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      // 4. Get Profile Picture URL
      let ppUrl;
      try {
        ppUrl = await bot.profilePictureUrl(targetJid, "image");
      } catch (e) {
        // Privacy settings නිසා හෝ DP නැත්නම්
        await bot.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(
          "❌ *Profile Picture Not Found*\n\n" +
          "එයාගේ DP එක Private දාලා හෝ ඉවත් කරලා තියෙන්නේ." + FOOTER
        );
      }

      // 5. Get User Bio/Status
      let about = "🔒 Private / No Bio";
      try {
        const statusData = await bot.fetchStatus(targetJid);
        if (statusData?.status) about = statusData.status;
      } catch (e) {
        // Status ගන්න බැරි නම් අවුලක් නෑ, default එක තියමු
      }

      // 6. Send Result
      const caption =
        `🖼️ *PROFILE PICTURE DOWNLOADED*\n\n` +
        `👤 *User:* @${targetJid.split("@")[0]}\n` +
        `📝 *Bio:* ${about}\n` +
        `🔗 *JID:* \`${targetJid}\`\n` +
        FOOTER;

      await bot.sendMessage(
        from,
        {
          image: { url: ppUrl },
          caption: caption,
          mentions: [targetJid]
        },
        { quoted: mek }
      );

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
      console.log("GETPP ERROR:", err);
      reply(
        "❌ *System Error*\n\nCommand එක ක්‍රියාත්මක වීමේදී දෝෂයක් ඇති විය." + FOOTER
      );
    }
  }
);
