const { cmd } = require("../command");
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

/*
 👑 King RANUX PRO – ViewOnce Recovery (Advanced Method)
 🔒 Bypasses "m.quoted" helper limitations
 ⚙️ Accesses Raw Message Context directly
*/

const FOOTER = `\n\n> 𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱`;

cmd(
  {
    pattern: "vv",
    alias: ["viewonce", "recover", "vo"],
    desc: "Recover ViewOnce (One-Time) images/videos",
    category: "tools",
    filename: __filename,
  },
  async (bot, mek, m, { from, reply, isGroup, isAdmin, isOwner, isSudo }) => {
    try {
      // 1. Check Permissions (Optional - Remove if not needed)
      if (isGroup && !isAdmin && !isOwner && !isSudo) {
        return reply("❌ *Permission Denied*\nAdmin/Owner only." + FOOTER);
      }

      // 2. Check if quoted
      if (!mek.message.extendedTextMessage || !mek.message.extendedTextMessage.contextInfo.quotedMessage) {
        return reply("⚠️ *ViewOnce එකකට Reply කරන්න!*" + FOOTER);
      }

      // 3. Access RAW Quoted Message (Bypassing helpers)
      const rawQuoted = mek.message.extendedTextMessage.contextInfo.quotedMessage;

      // 4. Find ViewOnce Data (Support V1, V2, and V2Extension)
      let viewOnceMsg = rawQuoted.viewOnceMessageV2?.message || 
                        rawQuoted.viewOnceMessage?.message || 
                        rawQuoted.viewOnceMessageV2Extension?.message ||
                        rawQuoted; // Fallback

      // 5. Detect Type (Image or Video)
      let msgType = Object.keys(viewOnceMsg).find(key => key === 'imageMessage' || key === 'videoMessage');

      if (!msgType) {
        return reply("❌ *Media එක සොයාගත නොහැක.* \n(මෙය ViewOnce එකක් නොවේ ද?)" + FOOTER);
      }

      const mediaMsg = viewOnceMsg[msgType];
      const finalType = msgType === 'imageMessage' ? 'image' : 'video';

      await reply("🔓 *Recovering ViewOnce Media...* ⏳");

      // 6. Download Stream (Baileys Native)
      const stream = await downloadContentFromMessage(mediaMsg, finalType);
      let buffer = Buffer.from([]);
      
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // 7. Send Back
      const caption = 
        `🔓 *VIEWONCE RECOVERED*\n\n` +
        `👤 *From:* @${m.quoted.sender.split("@")[0]}\n` +
        `📁 *Type:* ${finalType.toUpperCase()}\n` +
        FOOTER;

      await bot.sendMessage(
        from,
        {
          [finalType]: buffer,
          caption: caption,
          mentions: [m.quoted.sender]
        },
        { quoted: mek }
      );

    } catch (e) {
      console.log("VIEWONCE ERROR:", e);
      reply(
        "❌ *Recover කිරීම අසාර්ථක විය.* 😢\n" +
        "හේතුව: Message එක පරණ වැඩි නිසා හෝ දැනටමත් phone එකෙන් open කර ඇති නිසා media key එක expire වී ඇත." + FOOTER
      );
    }
  }
);
