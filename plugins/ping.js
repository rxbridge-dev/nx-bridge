const { cmd } = require("../command");

cmd({
  pattern: "ping",
  react: "⚡",
  desc: "Check response time",
  category: "main",
  filename: __filename
}, async (ranuxPro, mek, m, { from }) => {
  const start = Date.now();

  // send a tiny temp message
  await ranuxPro.sendMessage(from, {
    text: "⚡ Checking ping..."
  }, { quoted: mek });

  const end = Date.now();
  const latency = end - start;

  await ranuxPro.sendMessage(from, {
    text: `🏓 Pong! ${latency} ms`
  }, { quoted: mek });
});