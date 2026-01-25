module.exports = {
  name: "join",
  alias: ["joingroup"],
  desc: "Join a group via invite link",
  category: "tools",

  async run({ sock, m, args, reply }) {
    if (!args[0]) {
      return reply("❌ Group link එකක් දෙන්න.\n\nExample:\n.join https://chat.whatsapp.com/xxxx");
    }

    try {
      const link = args[0];
      const match = link.match(/chat\.whatsapp\.com\/([0-9A-Za-z]+)/);

      if (!match) {
        return reply("❌ Invalid group link!");
      }

      const inviteCode = match[1];
      const res = await sock.groupAcceptInvite(inviteCode);

      reply(`✅ Successfully joined group!\n\nGroup JID:\n${res}`);

    } catch (e) {
      console.log("Join error:", e);
      reply("❌ Failed to join group.\nMaybe link expired or bot is banned.");
    }
  }
};