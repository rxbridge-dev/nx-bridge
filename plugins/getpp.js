module.exports = {
  name: "getpp",
  alias: ["getdp"],
  desc: "Get user's profile picture",
  category: "tools",

  async run({ sock, m }) {
    try {
      let jid;

      if (m.quoted) {
        jid = m.quoted.sender;
      } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        jid = m.mentionedJid[0];
      } else {
        jid = m.sender;
      }

      const ppUrl = await sock.profilePictureUrl(jid, "image");

      await sock.sendMessage(
        m.chat,
        {
          image: { url: ppUrl },
          caption: "🖼️ *User Profile Picture*\n\n👤 JID:\n" + jid
        },
        { quoted: m }
      );

    } catch (err) {
      await sock.sendMessage(
        m.chat,
        {
          text: "❌ Profile picture not found or user has private DP."
        },
        { quoted: m }
      );
    }
  }
};