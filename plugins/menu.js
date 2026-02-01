--- START OF FILE menu.js ---

const { cmd, commands } = require("../command");
const os = require("os");
const config = require("../config");

// State management
const pendingMenu = {};

// Stylish Number Emojis for Categories
const numEmojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

// Header Image
const HEADER_IMG = "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/king-ranux-pro-main-logo.png";

// Design Elements
const FOOTER = "> 👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋɪɴɢ ʀᴀɴᴜx ᴘʀᴏ";

cmd({
  pattern: "menu",
  alias: ["panel", "list", "commands", "help"],
  react: "🔮",
  desc: "Show command menu",
  category: "main",
  filename: __filename
}, async (ranuxPro, mek, m, { from, sender, pushname }) => {

  // 🛡️ CLASH FIX (IMPORTANT)
  // Clear all other interactive states to prevent number mix-ups
  global.pendingSearch = global.pendingSearch || {};
  global.pendingVideo = global.pendingVideo || {};
  global.pendingMovie = global.pendingMovie || {};
  
  if (global.pendingSearch[sender]) delete global.pendingSearch[sender];
  if (global.pendingVideo[sender]) delete global.pendingVideo[sender];
  if (global.pendingMovie[sender]) delete global.pendingMovie[sender];

  // Organize commands
  const commandMap = {};
  for (const command of commands) {
    if (command.dontAddCommandList) continue;
    const category = (command.category || "misc").toUpperCase();
    if (!commandMap[category]) commandMap[category] = [];
    commandMap[category].push(command);
  }

  const categories = Object.keys(commandMap).sort();
  const date = new Date().toLocaleDateString("en-GB");
  const time = new Date().toLocaleTimeString("en-GB");
  const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

  // ✨ ULTRA PREMIUM MENU DESIGN
  let menuText = `
╔══════════════════════╗
   🔮 *𝐊𝐈𝐍𝐆 𝐑𝐀𝐍𝐔𝐗 𝐏𝐑𝐎*
╚══════════════════════╝

👋 *Hi,* ${pushname || 'User'}
📅 *Date:* ${date}
⏰ *Time:* ${time}
💾 *Ram:* ${ramUsage}MB
🤖 *Prefix:* [ ${config.PREFIX || '.'} ]

👇 *SELECT A CATEGORY*
━━━━━━━━━━━━━━━━━━━━━━
`;

  categories.forEach((cat, i) => {
    // Select Emoji based on index (1-10)
    const emoji = numEmojis[i + 1] || `${i + 1}️⃣`; 
    menuText += `${emoji} ➜ ${cat} (${commandMap[cat].length})\n`;
  });

  menuText += `━━━━━━━━━━━━━━━━━━━━━━
🔢 *Reply with the number to open!*
${FOOTER}`;

  await ranuxPro.sendMessage(from, {
    image: { url: HEADER_IMG },
    caption: menuText.trim()
  }, { quoted: mek });

  // Save State (Specific Type to avoid conflict)
  pendingMenu[sender] = { type: "CATEGORY_SELECT", commandMap, categories };
});

// 🔄 REPLY HANDLER
cmd({
  filter: (text, { sender }) =>
    pendingMenu[sender] &&
    pendingMenu[sender].type === "CATEGORY_SELECT" && // Check context explicitly
    /^\d+$/.test(text.trim())
}, async (ranuxPro, mek, m, { from, body, sender }) => {

  const { commandMap, categories } = pendingMenu[sender];
  const index = parseInt(body.trim()) - 1;

  if (index < 0 || index >= categories.length) {
    return ranuxPro.sendMessage(from, { text: "❌ *Invalid Number! Please check the list.*" }, { quoted: mek });
  }

  await ranuxPro.sendMessage(from, { react: { text: "📂", key: mek.key } });

  const selectedCategory = categories[index];
  const cmdsInCategory = commandMap[selectedCategory];

  // ✨ SUB-MENU DESIGN (TREE STYLE)
  let cmdText = `
╭─── 📂 *${selectedCategory}* ───
│
`;

  cmdsInCategory.forEach((c) => {
    const patterns = [c.pattern, ...(c.alias || [])]
      .filter(Boolean)
      .map(p => `.${p}`)
      .join(", ");

    cmdText += `│ 🔹 *${patterns}*
│ ╰─ ${c.desc || "No description"}
│\n`;
  });

  cmdText += `╰───────────────────●
${FOOTER}`;

  await ranuxPro.sendMessage(from, {
    image: { url: HEADER_IMG },
    caption: cmdText.trim()
  }, { quoted: mek });

  // Clear state after showing commands
  delete pendingMenu[sender];
});