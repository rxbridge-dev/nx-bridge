const { cmd } = require("../command");
const config = require("../config");
const { updateSetting, resetSettings } = require("../lib/database");

// Available Settings List for Validation
const settingsList = [
    { key: "AUTO_STATUS_SEEN", label: "Auto Status Seen" },
    { key: "AUTO_STATUS_REACT", label: "Auto Status React" },
    { key: "AUTO_STATUS_FORWARD", label: "Auto Status Forward" },
    { key: "ANTI_DELETE", label: "Anti Delete System" },
    { key: "MODE", label: "Bot Mode" },
    { key: "MOVIE_FOOTER_TEXT", label: "Movie Footer" }
];

// 1️⃣ VIEW SETTINGS (Menu Only)
cmd({
    pattern: "settings",
    alias: ["setting", "config"],
    desc: "View bot settings",
    category: "owner",
    react: "⚙️",
    filename: __filename
}, async (bot, mek, m, { from, isOwner, reply, prefix }) => {
    if (!isOwner) return reply("❌ You are not the owner!");

    let msg = "⚙️ *KING RANUX PRO SETTINGS* ⚙️\n\n";

    settingsList.forEach((s, index) => {
        let currentValue = config[s.key];
        
        // Format Boolean Values
        if (typeof currentValue === "boolean") {
            currentValue = currentValue ? "✅ [ON]" : "❌ [OFF]";
        } 
        // Format Others
        else {
            currentValue = "[" + String(currentValue).toUpperCase() + "]";
        }

        msg += "*" + (index + 1) + ". " + s.key + "*\n👉 " + currentValue + "\n\n";
    });

    msg += "━━━━━━━━━━━━━━━━━━━━━━\n";
    msg += "📝 *HOW TO CHANGE?*\n";
    msg += "Use " + prefix + "update <KEY> <VALUE>\n\n";
    msg += "*Examples:*\n";
    msg += "▶ " + prefix + "update AUTO_STATUS_SEEN on\n";
    msg += "▶ " + prefix + "update MODE private\n";
    msg += "▶ " + prefix + "update MOVIE_FOOTER_TEXT My Bot\n";

    await reply(msg);
});

// 2️⃣ UPDATE COMMAND (Change Settings)
cmd({
    pattern: "update",
    alias: ["set"],
    desc: "Update a setting",
    category: "owner",
    filename: __filename
}, async (bot, mek, m, { from, isOwner, reply, args, q }) => {
    if (!isOwner) return reply("❌ You are not the owner!");

    if (!q || args.length < 2) {
        return reply("❌ *Incorrect Format!*\nUse: .update <KEY> <VALUE>\nExample: .update ANTI_DELETE on");
    }

    // 1. Get Key and Value
    const targetKey = args[0].toUpperCase();
    let value = q.replace(targetKey, "").trim();

    // 2. Validate Key
    const validKeys = settingsList.map(s => s.key);
    if (!validKeys.includes(targetKey)) {
        return reply("❌ Invalid Setting Key!\nUse .settings to check available keys.");
    }

    // 3. Format Booleans (on/off/true/false)
    if (["ON", "TRUE", "ENABLE"].includes(value.toUpperCase())) {
        value = true;
    } else if (["OFF", "FALSE", "DISABLE"].includes(value.toUpperCase())) {
        value = false;
    }

    // 4. Update Database & RAM
    const success = await updateSetting(bot, targetKey, value);

    if (success) {
        return reply("✅ *Settings Updated!*\n\n🔧 " + targetKey + " ➔ " + value);
    } else {
        return reply("❌ Database Error! Failed to update.");
    }
});

// 3️⃣ RESET DATABASE
cmd({
    pattern: "resetdb",
    desc: "Reset all settings to default",
    category: "owner",
    filename: __filename
}, async (bot, mek, m, { reply, isOwner }) => {
    if (!isOwner) return;
    await resetSettings(bot);
    reply("🔄 Database cleared. Restarting bot is recommended.");
});
