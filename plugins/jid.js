const { cmd } = require("../command");

cmd({
  pattern: "jid",
  react: "🆔",
  desc: "Get JID (user / group / channel)",
  category: "main",
  filename: __filename
}, async (ranuxPro, mek, m, { from, sender, isGroup, quoted }) => {

  let result = "";
  let title = "";

  // 1️⃣ Reply case
  if (quoted && quoted.sender) {
    result = quoted.sender;
    title = "👤 Replied User JID";
  }

  // 2️⃣ Mention case (support multiple)
  else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
    const list = mek.message.extendedTextMessage.contextInfo.mentionedJid;
    result = list.join("\n");
    title = "👥 Mentioned User JID(s)";
  }

  // 3️⃣ Group
  else if (isGroup) {
    result = from;
    title = "👨‍👩‍👧‍👦 Group JID";
  }

  // 4️⃣ Channel
  else if (from.endsWith("@newsletter")) {
    result = from;
    title = "📢 Channel JID";
  }

  // 5️⃣ Private chat
  else {
    result = sender;
    title = "🧑 Your JID";
  }

  const text = `
╔══════════════════════╗
   🆔 *KING RANUX PRO*
        JID PANEL
╚══════════════════════╝

${title}

📄 JID:
${result}

━━━━━━━━━━━━━━━━━━
Tips:
• Reply → get replied user JID
• Mention → get mentioned JID(s)
• Group → shows group JID
• Channel → shows channel JID
━━━━━━━━━━━━━━━━━━

> King RANUX PRO
`;

  await ranuxPro.sendMessage(from, { text }, { quoted: mek });
});