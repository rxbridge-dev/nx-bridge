module.exports = {
  name: "follow",
  alias: ["channelfollow"],
  desc: "Follow a WhatsApp channel",
  category: "tools",

  async run({ sock, m, args, reply }) {
    if (!args[0]) {
      return reply("❌ Channel URL එකක් දෙන්න.\n\nExample:\n.follow https://whatsapp.com/channel/xxxx");
    }

    try {
      const url = args[0];
      const match = url.match(/channel\/([0-9A-Za-z]+)/);

      if (!match) {
        return reply("❌ Invalid channel link!");
      }

      const channelCode = match[1];
      const channelJid = `120${channelCode}@newsletter`;

      await sock.newsletterFollow(channelJid);

      reply(`✅ Successfully followed channel!\n\nJID:\n${channelJid}`);

    } catch (e) {
      console.log("Follow error:", e);
      reply("❌ Failed to follow channel.");
    }
  }
};