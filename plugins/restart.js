const config = require('../config');
const { cmd, commands } = require('../command');
const { sleep } = require('../lib/functions');

cmd({
  pattern: "restart",
  alias: ["reboot", "reset"],
  react: '♻️',
  desc: "Restart the bot system",
  category: "owner",
  filename: __filename
}, async (conn, mek, m, { from, isOwner, reply }) => {
  try {
    // 1. Permission Check
    if (!isOwner) {
      return reply("❌ *Access Denied:* This command is for the Bot Owner only!");
    }

    // 2. Send Restart Message
    await reply("♻️ *Restarting King RANUX PRO...*\n\n_System is rebooting. Please wait 10-30 seconds._");

    // 3. Small delay to ensure the message is sent before killing the process
    await sleep(2000);

    // 4. Universal Restart Method
    // This kills the current process.
    // - On Heroku/Render/Railway: The server manager detects the crash and auto-restarts.
    // - On PM2 (VPS): PM2 auto-restarts the process.
    // - On GitHub Actions: Stops the current workflow step.
    console.log("♻️ Restart command received. Exiting process...");
    process.exit(0);

  } catch (e) {
    console.error("Restart Error:", e);
    reply("❌ *Failed to restart:* " + e.message);
  }
});