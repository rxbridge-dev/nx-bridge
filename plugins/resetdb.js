const { resetUser } = require("../lib/settings");

module.exports = {
  name: "resetdb",
  alias: ["restdb", "reset"],
  desc: "Reset all your settings to default",
  category: "system",
  async run({ m, reply }) {
    await resetUser(m.sender);
    reply(
`♻️ *SETTINGS RESET SUCCESSFUL!*

ඔයාගේ සියලු settings
Firebase cloud එකෙන් clear කරලා
config.js default වලට
ආපසු ගියා ✅

🔁 Now using:
• Default Prefix
• Default Mode
• Default Anti Delete
• Default Status Settings

> King RANUX PRO`
    );
  }
};