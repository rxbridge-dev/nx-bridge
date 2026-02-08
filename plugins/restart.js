--- START OF FILE restart.js ---

const config = require('../config');
const { cmd, commands } = require('../command');
const { sleep } = require('../lib/functions');

cmd({
  pattern: "restart",
  alias: ["reboot"],
  react: '♻️',
  desc: "Restart the bot system",
  category: "owner",
  filename: __filename
}, async (conn, mek, m, { from, isOwner, reply }) => {
  try {
    // 1. Check Permission (Uses the isOwner variable passed from index.js)
    if (!isOwner) {
      return reply("❌ *Access Denied:* This command is for the Bot Owner only!");
    }

    // 2. Send Restart Message
    await reply("♻️ *Restarting King RANUX PRO...*\nPlease wait a moment.");

    // 3. Small delay to ensure message is sent
    await sleep(2000);

    // 4. Force Kill Process (Server will auto-restart it)
    console.log("Restarting via process.exit()...");
    process.exit(0);

  } catch (e) {
    console.error("Restart Error:", e);
    reply("❌ *Failed to restart:* " + e.message);
  }
});