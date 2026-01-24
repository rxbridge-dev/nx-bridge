module.exports = {
  name: "forward",
  alias: ["fwd"],
  desc: "Reply & forward any message",
  category: "tools",
  async run({ m, reply, args, bot }) {

    const panel = (text) => reply(
`╔══════════════════════╗
   🔁 *KING RANUX PRO*
      FORWARD PANEL
╚══════════════════════╝

${text}

━━━━━━━━━━━━━━━━━━
Usage:
Reply to a message and type:

.forward JID

Examples:
.forward 94726880784@s.whatsapp.net
.forward 9477xxxxxx-12345@g.us
.forward 120363405950699484@newsletter
━━━━━━━━━━━━━━━━━━`
    );

    if (!m.quoted) {
      return panel("❌ *No message selected!*\n\nPlease reply to a message you want to forward.");
    }

    if (!args[0]) {
      return panel("❌ *No target JID given!*\n\nPlease provide a target JID.");
    }

    const target = args[0].trim();

    try {
      await bot.forwardMessage(
        target,
        m.quoted,
        { force: true }
      );

      reply(
`╔══════════════════════╗
   ✅ *FORWARD SUCCESS*
╚══════════════════════╝

📤 Forwarded To:
${target}

📦 Message Type:
${m.quoted.mtype || "unknown"}

👑 King RANUX PRO`
      );

    } catch (e) {
      console.log("Forward error:", e);
      reply(
`╔══════════════════════╗
   ❌ *FORWARD FAILED*
╚══════════════════════╝

Reason:
${e.message || "Unknown error"}

👑 King RANUX PRO`
      );
    }
  }
};