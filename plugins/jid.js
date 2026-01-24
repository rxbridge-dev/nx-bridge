const { cmd } = require("../command");

cmd({
  pattern: "jid",
  react: "🆔",
  desc: "Get JID (user / group / channel)",
  category: "main",
  filename: __filename
}, async (ranuxPro, mek, m, { from, sender, isGroup, quoted }) => {

  let targetJid = "";
  let title = "";

  // Reply කරලා තියෙනවනම්
  if (quoted && quoted.sender) {
    targetJid = quoted.sender;
    title = "👤 Replied User JID";
  }
  // Mention කරලා තියෙනවනම්
  else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
    targetJid = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
    title = "👥 Mentioned User JID";
  }
  // Group එකක් ඇතුලේ නම්
  else if (isGroup) {
    targetJid = from;
    title = "👨‍👩‍👧‍👦 Group JID";
  }
  // Channel / broadcast
  else if (from === "status@broadcast") {
    targetJid = from;
    title = "📢 Channel JID";
  }
  // Private chat
  else {
    targetJid = sender;
    title = "🧑 Your JID";
  }

  const text = `
🆔 𝗝𝗜𝗗 𝗜𝗡𝗙𝗢
━━━━━━━━━━━━━━
${title}

📄 ${targetJid}
━━━━━━━━━━━━━━
`;

  await ranuxPro.sendMessage(from, {
    text: text.trim()
  }, { quoted: mek });

});