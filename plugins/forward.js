const { cmd } = require("../command");

cmd({
  pattern: "forward",
  alias: ["fwd"],
  desc: "Reply & forward any message",
  category: "tools",
  react: "🔁",
  filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {

  if (!m.quoted) {
    return reply("❌ Forward කරන්න message එකකට reply කරන්න.");
  }

  if (!args[0]) {
    return reply(
`❌ Target JID එකක් දෙන්න

Examples:
.forward 94726880784@s.whatsapp.net
.forward 9477xxxxxx-12345@g.us
.forward 120363405950699484@newsletter`
    );
  }

  try {
    const target = args[0].trim();
    await conn.forwardMessage(target, m.quoted, { force: true });

    reply(
`✅ *FORWARD SUCCESS*

📤 To: ${target}
📦 Type: ${m.quoted.mtype || "unknown"}

👑 King RANUX PRO`
    );

  } catch (e) {
    console.log(e);
    reply("❌ Forward failed.");
  }
});