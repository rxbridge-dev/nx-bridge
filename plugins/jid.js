const { cmd } = require("../command");

cmd({
  pattern: "jid",
  react: "🆔",
  desc: "Get JID (user / group / channel)",
  category: "main",
  filename: __filename
}, async (ranuxPro, mek, m, { from, sender, isGroup }) => {

  let result = "";
  let title = "";

  const context = mek.message?.extendedTextMessage?.contextInfo;

  // 1️⃣ Reply case (REAL fix)
  if (context?.participant) {
    result = context.participant;
    title = "👤 Replied User JID";
  }

  // 2️⃣ Mention case
  else if (context?.mentionedJid?.length > 0) {
    result = context.mentionedJid.join("\n");
    title = "👥 Mentioned User JID(s)";
  }

  // 3️⃣ Group JID
  else if (isGroup) {
    result = from;
    title = "👨‍👩‍👧‍👦 Group JID";
  }

  // 4️⃣ Channel JID
  else if (from.endsWith("@newsletter")) {
    result = from;
    title = "📢 Channel JID";
  }

  // 5️⃣ Private chat user JID
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