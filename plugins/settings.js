const { cmd } = require("../command");
const config = require("../config");
const { updateSetting, resetSettings } = require("../lib/database");

const settingsList = [
    { id: 1, key: "AUTO_STATUS_SEEN", label: "Auto Status Seen", type: "boolean" },
    { id: 2, key: "AUTO_STATUS_REACT", label: "Auto Status React", type: "boolean" },
    { id: 3, key: "AUTO_STATUS_FORWARD", label: "Auto Status Forward", type: "boolean" },
    { id: 4, key: "ANTI_DELETE", label: "Anti Delete System", type: "boolean" },
    { id: 5, key: "MODE", label: "Bot Mode", type: "select", options: ["public", "private", "group", "inbox"] },
    { id: 6, key: "MOVIE_FOOTER_TEXT", label: "Movie Footer", type: "text" }
];

const MENU_TITLE = "⚙️ *KING RANUX PRO SETTINGS* ⚙️";

cmd({
    pattern: "settings",
    alias: ["setting", "config"],
    desc: "Manage bot settings via UI",
    category: "owner",
    react: "⚙️",
    filename: __filename
}, async (bot, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("❌ You are not the owner!");

    let msg = MENU_TITLE + "\n\n";
    msg += "👋 _Reply with the number to change setting._\n\n";

    settingsList.forEach((s) => {
        let currentValue = config[s.key];
        let status = "";

        if (s.type === "boolean") {
            status = currentValue ? "✅ [ON]" : "❌ [OFF]";
        } else if (s.type === "select") {
            status = "🔄 [" + currentValue.toUpperCase() + "]";
        } else {
            status = "📝 [TEXT]";
        }

        msg += "*" + s.id + ".* " + s.label + "\n👉 Status: " + status + "\n\n";
    });

    msg += "*0.* 🔄 Reset All Settings\n";
    msg += "\n━━━━━━━━━━━━━━━━━━━━━━";

    await reply(msg);
});

// 🔥 HANDLER FIXED (With Filter Logic)
cmd({
    on: "body",
    // 🛠️ THIS FILTER IS IMPORTANT (Tells the bot when to run this code)
    filter: (body, { message }) => {
        const quoted = message.quoted || {};
        const quotedMsg = quoted.msg || {};
        const text = quotedMsg.caption || quotedMsg.text || quotedMsg.conversation || "";
        // Only run if the user is replying to Our Settings Menu
        return text.includes("KING RANUX PRO SETTINGS");
    }
}, async (bot, mek, m, { from, body, isOwner, reply }) => {
    
    // Safety check again inside (Double security)
    if (!isOwner || !m.quoted) return;

    const input = body.trim();
    const number = parseInt(input.split(" ")[0]); 
    if (isNaN(number)) return;

    // Handle Reset
    if (number === 0) {
        await resetSettings(bot);
        return reply("✅ *Database Reset Successfully!* \nRestarting bot to apply defaults...");
    }

    // Handle Setting Update
    const setting = settingsList.find(s => s.id === number);
    if (!setting) return reply("❌ Invalid number! Check the list again.");

    let newValue;
    
    if (setting.type === "boolean") {
        newValue = !config[setting.key];
    } 
    
    else if (setting.type === "select") {
        const currentIndex = setting.options.indexOf(config[setting.key]);
        const nextIndex = (currentIndex + 1) % setting.options.length;
        newValue = setting.options[nextIndex];
    } 
    
    else if (setting.type === "text") {
        const textData = body.trim().split(" ").slice(1).join(" ");
        if (!textData) return reply("✏️ Please type the number and value.\nExample: *" + setting.id + " New Footer Text*");
        newValue = textData;
    }

    const success = await updateSetting(bot, setting.key, newValue);

    if (success) {
        await reply("✅ *Updated Successfully!*\n\n🔧 " + setting.label + " ➔ " + newValue);
    } else {
        reply("❌ Failed to update database.");
    }
});

cmd({
    pattern: "resetdb",
    desc: "Reset all settings to default",
    category: "owner",
    filename: __filename
}, async (bot, mek, m, { reply, isOwner }) => {
    if (!isOwner) return;
    await resetSettings(bot);
    reply("🔄 Database cleared. Please restart bot.");
});
