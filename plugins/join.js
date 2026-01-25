const { cmd } = require("../command");

cmd({
  pattern: "join",
  alias: ["joingroup"],
  desc: "Join group via invite link",
  category: "tools",
  react: "👥",
  filename: __filename
}, async (conn, mek, m, { args, reply }) => {

  if (!args[0]) {
    return reply("❌ Group link එකක් දෙන්න.");
  }

  try {
    const link = args[0];
    const code = link.split("chat.whatsapp.com/")[1];
    if (!code) return reply("❌ Invalid group link.");

    const res = await conn.groupAcceptInvite(code);
    reply(`✅ Joined group!\n\nJID:\n${res}`);

  } catch {
    reply("❌ Failed to join group.");
  }
});