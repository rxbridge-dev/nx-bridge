const { cmd } = require("../command");

cmd({
  pattern: "ping",
  react: "⚡",
  desc: "Check response time",
  category: "main",
  filename: __filename
}, async (ranuxPro, mek, m, { from }) => {

  const start = Date.now();

  // send temp message
  const temp = await ranuxPro.sendMessage(from, {
    text: "⚡ Checking ping..."
  }, { quoted: mek });

  const end = Date.now();
  const latency = end - start;

  // 🔁 Fake Edit (replace same message)
  await ranuxPro.sendMessage(from, {
    text: `🏓 Pong! ${latency} ms`,
    edit: temp.key   // 👈 THIS is the magic
  });
});