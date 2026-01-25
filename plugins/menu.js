const { cmd, commands } = require("../command");

const pendingMenu = {};
const numberEmojis = ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];

const HEADER_IMG = "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/king-ranux-pro-main-logo.png";

const FOOTER = `
━━━━━━━━━━━━━━━━━━━━━━
👑 King RANUX PRO
𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱
━━━━━━━━━━━━━━━━━━━━━━
`;

cmd({
  pattern: "menu",
  react: "✨",
  desc: "Show command menu",
  category: "main",
  filename: __filename
}, async (ranuxPro, mek, m, { from, sender }) => {

  await ranuxPro.sendMessage(from, { react: { text: "✨", key: mek.key } });

  const commandMap = {};

  for (const command of commands) {
    if (command.dontAddCommandList) continue;
    const category = (command.category || "misc").toUpperCase();
    if (!commandMap[category]) commandMap[category] = [];
    commandMap[category].push(command);
  }

  const categories = Object.keys(commandMap);

  let menuText = `
👑 KING RANUX PRO
━━━━━━━━━━━━━━━━━━━━━━
✨ PREMIUM COMMAND MENU
⚡ Fast • Stable • Powerful
━━━━━━━━━━━━━━━━━━━━━━

📂 CATEGORIES
`;

  categories.forEach((cat, i) => {
    const emojiIndex = (i + 1).toString().split("").map(n => numberEmojis[n]).join("");
    menuText += `
╭──────────────────────╮
│ ${emojiIndex}  ${cat}
│ Commands : ${commandMap[cat].length}
╰──────────────────────╯
`;
  });

  menuText += `
━━━━━━━━━━━━━━━━━━━━━━
📝 HOW TO USE
Reply with category number

Example:
1
2
3

💡 Tip:
TOOLS = utility commands
MEDIA = download commands
GROUP = group controls
AI = smart features
${FOOTER}
`;

  await ranuxPro.sendMessage(from, {
    image: { url: HEADER_IMG },
    caption: menuText.trim()
  }, { quoted: mek });

  pendingMenu[sender] = { step: "category", commandMap, categories };
});

cmd({
  filter: (text, { sender }) =>
    pendingMenu[sender] &&
    pendingMenu[sender].step === "category" &&
    /^[1-9][0-9]*$/.test(text.trim())
}, async (ranuxPro, mek, m, { from, body, sender }) => {

  await ranuxPro.sendMessage(from, { react: { text: "✅", key: mek.key } });

  const { commandMap, categories } = pendingMenu[sender];
  const index = parseInt(body.trim()) - 1;

  if (index < 0 || index >= categories.length) {
    return ranuxPro.sendMessage(from, { text: "❌ Invalid category number!" }, { quoted: mek });
  }

  const selectedCategory = categories[index];
  const cmdsInCategory = commandMap[selectedCategory];

  let cmdText = `
📂 ${selectedCategory} COMMANDS
━━━━━━━━━━━━━━━━━━━━━━
`;

  cmdsInCategory.forEach((c, i) => {
    const emojiIndex = (i + 1).toString().split("").map(n => numberEmojis[n]).join("");
    const patterns = [c.pattern, ...(c.alias || [])]
      .filter(Boolean)
      .map(p => `.${p}`)
      .join(", ");

    cmdText += `
╭──────────────────────╮
│ ${emojiIndex}  ${patterns}
│ ${c.desc || "No description"}
╰──────────────────────╯
`;
  });

  cmdText += `
━━━━━━━━━━━━━━━━━━━━━━
Total Commands : ${cmdsInCategory.length}

Type .menu to go back
${FOOTER}
`;

  await ranuxPro.sendMessage(from, {
    image: { url: HEADER_IMG },
    caption: cmdText.trim()
  }, { quoted: mek });

  delete pendingMenu[sender];
});