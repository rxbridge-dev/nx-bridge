const { getSetting } = require("../lib/settings");

// Settings session store (reply isolation)
global.settingsSession = global.settingsSession || {};

module.exports = {
  name: "settings",
  alias: ["config", "panel"],
  desc: "Open King RANUX PRO Settings Panel",
  category: "system",
  async run({ m, reply }) {

    // Open settings session for this user
    settingsSession[m.sender] = true;

    const anti = await getSetting(m.sender, "ANTI_DELETE");
    const status = await getSetting(m.sender, "AUTO_STATUS_SEEN");
    const mode = await getSetting(m.sender, "MODE");
    const prefix = await getSetting(m.sender, "PREFIX");

    const on = "🟢 ON";
    const off = "🔴 OFF";

    let msg = 
`╔══════════════════════╗
   👑 *KING RANUX PRO*
      SETTINGS PANEL
╚══════════════════════╝

⚙️ *Current Settings*

1️⃣ Anti Delete     : ${anti ? on : off}
2️⃣ Status Seen     : ${status ? on : off}
3️⃣ Bot Mode        : ${mode.toUpperCase()}
4️⃣ Command Prefix  : ${prefix}

────────────────────────
🛠 *Change Settings*

Reply with:

• 1 on / 1 off
• 2 on / 2 off
• 3 public / private / group / inbox
• 4 !  or  4 .  or  4 ?

────────────────────────
♻️ Reset all settings:
.resetdb

💡 Example:
4 !
────────────────────────

> King RANUX PRO Control Panel
`;

    reply(msg);
  }
};