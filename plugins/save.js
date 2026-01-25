const { cmd } = require("../command");
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');

/*
 👑 King RANUX PRO – ViewOnce Recovery Plugin
 🔒 Bypass WhatsApp One-Time View restriction
 ⚙️ Baileys Native Downloader (No external API needed)
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
      // 1. Permission Check (Group එකක් නම් Admin/Owner ට විතරයි - ඕන නම් අයින් කරන්න)
      if (isGroup && !isAdmin && !isOwner && !isSudo) {
        return reply(
          "❌ *Permission Denied*\n\n" +
          "මෙම command එක භාවිතා කළ හැක්කේ Group Admins ලාට පමණි." + FOOTER
        );
      }

      // 2. Validate Quoted Message
      if (!m.quoted) {
        return reply(
          "⚠️ *ViewOnce Message එකකට Reply කරන්න!* \n\n" +
          "ViewOnce photo හෝ video එකක් select කරලා `.vv` කියලා ගහන්න." + FOOTER
        );
      }

      // 3. Detect ViewOnce Message Type
      // ViewOnce messages come wrapped in 'viewOnceMessageV2' or 'viewOnceMessage'
      let viewOnceMsg = m.quoted.message?.viewOnceMessageV2?.message || 
                        m.quoted.message?.viewOnceMessage?.message || 
                        m.quoted.message; // Fallback

      let msgType = Object.keys(viewOnceMsg)[0]; // imageMessage or videoMessage
      let mediaMsg = viewOnceMsg[msgType];
      let finalType;

      if (msgType === "imageMessage") {
        finalType = "image";
      } else if (msgType === "videoMessage") {
        finalType = "video";
      } else {
        return reply(
          "❌ *මෙය ViewOnce Media එකක් නොවේ.* 😒\n" +
          "කරුණාකර One-Time View Image/Video එකකට reply කරන්න." + FOOTER
        );
      }

      await reply("🔓 *ViewOnce Media Recover කරමින් පවතී...* ⏳");

      // 4. Download the Media Stream (Baileys Native)
      const stream = await downloadContentFromMessage(mediaMsg, finalType);
      let buffer = Buffer.from([]);
      
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // 5. Send the Recovered Media
      const caption = 
        `🔓 *VIEWONCE RECOVERED*\n\n` +
        `👤 *Sender:* @${m.quoted.sender.split("@")[0]}\n` +
        `📁 *Type:* ${finalType.toUpperCase()}\n` +
        `📦 *Saved:* 安全 (Secure)\n` +
        FOOTER;

      await bot.sendMessage(
        from,
        {
          [finalType]: buffer, // image or video key dynamically
          caption: caption,
          mentions: [m.quoted.sender]
        },
        { quoted: mek }
      );

    } catch (e) {
      console.log("VIEWONCE ERROR:", e);
      reply(
        "❌ *Recover කිරීම අසාර්ථක විය.* 😢\n" +
        "Message එක කල් ඉකුත් වී හෝ දැනටමත් delete කර තිබිය හැක." + FOOTER
      );
    }
  }
);
