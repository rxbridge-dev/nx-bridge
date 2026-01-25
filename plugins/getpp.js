const { cmd } = require("../command");

cmd({
  pattern: "getpp",
  alias: ["getdp"],
  desc: "Get user profile picture",
  category: "tools",
  react: "🖼️",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {

  try {
    let jid;

    if (mek.quoted) jid = mek.quoted.sender;
    else if (mek.mentionedJid?.length) jid = mek.mentionedJid[0];
    else jid = mek.sender;

    const pp = await conn.profilePictureUrl(jid, "image");

    await conn.sendMessage(from, {
      image: { url: pp },
      caption: `🖼️ *Profile Picture*\n\n👤 JID:\n${jid}`
    }, { quoted: mek });

  } catch {
    reply("❌ Profile picture not found or private.");
  }
});