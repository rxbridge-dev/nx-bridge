const { cmd } = require("../command");
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

/*
 👑 King RANUX PRO – ViewOnce Recovery (Premium UI)
 🔒 Bypasses "m.quoted" helper limitations
 ⚙️ Accesses Raw Message Context directly
*/

const FOOTER = "> Powered by King RANUX PRO";

cmd(
  {
    pattern: "vv",
    alias: ["viewonce", "recover", "vo", "saveviewonce"],
    desc: "Recover ViewOnce (One-Time) images/videos",
    category: "tools",
    react: "🔓",
    filename: __filename,
  },
  async (bot, mek, m, { from, reply, isGroup, isAdmin, isOwner, isSudo }) => {
    try {
      // 1. Permission Check
      if (isGroup && !isAdmin && !isOwner && !isSudo) {
        return reply(`*❌ Permission Denied*\n\nThis command is reserved for Group Admins and Owners for privacy reasons.`);
      }

      // 2. Validate Quoted Message
      if (!mek.message.extendedTextMessage || !mek.message.extendedTextMessage.contextInfo.quotedMessage) {
        return reply(`*ℹ️ Please reply to a ViewOnce image or video to recover it.*`);
      }

      // 3. Access RAW Quoted Message
      const rawQuoted = mek.message.extendedTextMessage.contextInfo.quotedMessage;

      // 4. Find ViewOnce Data (Supports V1, V2, and V2Extension)
      let viewOnceMsg = rawQuoted.viewOnceMessageV2?.message || 
                        rawQuoted.viewOnceMessage?.message || 
                        rawQuoted.viewOnceMessageV2Extension?.message ||
                        rawQuoted; 

      // 5. Detect Media Type & Caption
      const isImage = viewOnceMsg.imageMessage;
      const isVideo = viewOnceMsg.videoMessage;

      if (!isImage && !isVideo) {
        return reply(`*❌ Error: Could not detect any ViewOnce media.*`);
      }

      const mediaMsg = isImage || isVideo;
      const finalType = isImage ? 'image' : 'video';
      const originalCaption = mediaMsg.caption || "No Caption";

      await reply(`*🔓 Decrypting ViewOnce media... Please wait.*`);

      // 6. Download Stream
      const stream = await downloadContentFromMessage(mediaMsg, finalType);
      let buffer = Buffer.from([]);
      
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // 7. Generate Premium Caption
      const sender = m.quoted.sender.split("@")[0];
      const caption = `
╭─「 🔓 *RECOVERED MEDIA* 」
│
│  👤 *From:* @${sender}
│  📁 *Type:* ${finalType.toUpperCase()}
│  📝 *Caption:* ${originalCaption}
│
╰─「 *Saved successfully* 」

${FOOTER}`;

      // 8. Send Recovered Media
      await bot.sendMessage(
        from,
        {
          [finalType]: buffer,
          caption: caption.trim(),
          mentions: [m.quoted.sender]
        },
        { quoted: mek }
      );

    } catch (e) {
      console.error("VIEWONCE ERROR:", e);
      reply(
        `*❌ Recovery Failed*\n\n` +
        `The message might be too old, or the media key has expired because it was already opened on your phone.`
      );
    }
  }
);