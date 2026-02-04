const { cmd, commands } = require("../command");
const os = require("os");
const config = require("../config");

// ✅ GLOBAL STATE (To prevent clashes)
global.pendingMenu = global.pendingMenu || {};

// Cute Number Emojis
const numEmojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

// Header Image
const HEADER_IMG = "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/king-ranux-pro-main-logo.png";

// Design Elements
const FOOTER = "> 👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋɪɴɢ ʀᴀɴᴜx ᴘʀᴏ";

// Helper for Uptime
const getUptime = () => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
};

cmd({
  pattern: "menu",
  alias: ["panel", "list", "commands", "help"],
  react: "📝", // Cute reaction
  desc: "Show command menu",
  category: "main",
  filename: __filename
}, async (ranuxPro, mek, m, { from, sender, pushname }) => {

  // 🛡️ CLASH FIX: Clear ALL other interactive states
  if (global.pendingSearch) delete global.pendingSearch[sender];
  if (global.pendingVideo) delete global.pendingVideo[sender];
  if (global.pendingMovie) delete global.pendingMovie[sender];
  if (global.pendingQuality) delete global.pendingQuality[sender];

  // Organize commands
  const commandMap = {};
  for (const command of commands) {
    if (command.dontAddCommandList) continue;
    const category = (command.category || "misc").toUpperCase();
    if (!commandMap[category]) commandMap[category] = [];
    commandMap[category].push(command);
  }

  const categories = Object.keys(commandMap).sort();

  // 🕒 Time & Info
  const now = new Date();
  const date = now.toLocaleDateString("en-US", { timeZone: "Asia/Colombo" });
  const time = now.toLocaleTimeString("en-US", { timeZone: "Asia/Colombo", hour: '2-digit', minute: '2-digit', hour12: true });
  const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

  // 🌸 CUTE & PREMIUM MENU UI
  let menuText = `
╭───〔 🌸 𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 ᴾʳᵒ 🌸 〕───┈
│ 
│ 🎀 𝐇𝐢, *${pushname || 'Cutie'}* ( ｡ • ̀ ω • ́ ｡ )
│ 
│ 📅 *Date:* ${date}
│ ⏰ *Time:* ${time}
│ ⏳ *Uptime:* ${getUptime()}
│ 💾 *Ram:* ${ramUsage}MB
│ 🤖 *Prefix:* [ ${config.PREFIX || '.'} ]
│ 
╰──────────────────────┈

╭───〔 📂 𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐘 𝐋𝐈𝐒𝐓 〕───┈
│
`;

  categories.forEach((cat, i) => {
    // Determine Emoji based on number (1-10)
    const emoji = numEmojis[i + 1] || `${i + 1}️⃣`; 
    menuText += `│ ${emoji} ➻ *${cat}* (${commandMap[cat].length})\n`;
  });

  menuText += `│
╰──────────────────────┈
│ 🔢 *Reply with a number to open!*
╰──────────────────────┈
${FOOTER}`;

  await ranuxPro.sendMessage(from, {
    image: { url: HEADER_IMG },
    caption: menuText.trim()
  }, { quoted: mek });

  // Save State
  global.pendingMenu[sender] = { type: "CATEGORY_SELECT", commandMap, categories };
});

// 🔄 REPLY HANDLER
cmd({
  filter: (text, { sender }) =>
    global.pendingMenu[sender] &&
    global.pendingMenu[sender].type === "CATEGORY_SELECT" &&
    /^\d+$/.test(text.trim())
}, async (ranuxPro, mek, m, { from, body, sender }) => {

  const { commandMap, categories } = global.pendingMenu[sender];
  const index = parseInt(body.trim()) - 1;

  if (index < 0 || index >= categories.length) {
    return ranuxPro.sendMessage(from, { text: "❌ *Invalid Number! Please check the list.*" }, { quoted: mek });
  }

  await ranuxPro.sendMessage(from, { react: { text: "🍭", key: mek.key } });

  const selectedCategory = categories[index];
  const cmdsInCategory = commandMap[selectedCategory];

  // ✨ SUB-MENU DESIGN (Tree Style)
  let cmdText = `
╭───〔 🌸 *${selectedCategory}* 〕───┈
│
`;

  cmdsInCategory.forEach((c) => {
    const patterns = [c.pattern, ...(c.alias || [])]
      .filter(Boolean)
      .map(p => `.${p}`)
      .join(", ");

    cmdText += `│ 🍡 *${patterns}*
│ ╰─ ${c.desc || "No description"}
│\n`;
  });

  cmdText += `╰──────────────────────┈
${FOOTER}`;

  await ranuxPro.sendMessage(from, {
    image: { url: HEADER_IMG },
    caption: cmdText.trim()
  }, { quoted: mek });

  // Clear state after showing commands
  delete global.pendingMenu[sender];
});