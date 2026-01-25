const { cmd } = require("../command");

cmd({
  pattern: "follow",
  alias: ["channelfollow"],
  desc: "Follow WhatsApp channel",
  category: "tools",
  react: "📢",
  filename: __filename
}, async (conn, mek, m, { args, reply }) => {

  if (!args[0]) {
    return reply("❌ Channel URL එකක් දෙන්න.");
  }

  try {
    const url = args[0];
    const code = url.split("channel/")[1];
    if (!code) return reply("❌ Invalid channel link.");

    const jid = `120${code}@newsletter`;
    await conn.newsletterFollow(jid);

    reply(`✅ Channel followed!\n\nJID:\n${jid}`);

  } catch {
    reply("❌ Failed to follow channel.");
  }
});