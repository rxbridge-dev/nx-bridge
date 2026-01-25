const { cmd } = require("../command");

cmd({
    pattern: "checkjid",
    desc: "Scan and extract Channel JID from any forwarded message",
    category: "tools",
    filename: __filename
},
async (bot, mek, m, { from, reply }) => {
    try {
        if (!m.quoted) return reply("⚠️ Please reply to a forwarded Channel Message.");

        // 1. Raw Quoted Message එක ගන්නවා
        const rawQuoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // Debugging: සම්පූර්ණ දත්ත ටික Console එකට ගහමු (වැඩේ ගැස්සුනොත් බලන්න)
        console.log("🔍 INSPECTING MESSAGE DATA:", JSON.stringify(rawQuoted));

        // 2. Data එක String එකක් බවට හරවලා JID එක Scan කරනවා (Regex Method)
        // මේකෙන් Data Structure එක මොකක් උනත් JID එක අල්ලගන්න පුළුවන්.
        const msgString = JSON.stringify(rawQuoted);
        const jidMatch = msgString.match(/([0-9]{10,30}@newsletter)/);

        if (jidMatch) {
            const foundedJid = jidMatch[0];
            
            // නම හොයාගන්න ට්‍රයි එකක් (Optional)
            const nameMatch = msgString.match(/"newsletterName":"(.*?)"/);
            const channelName = nameMatch ? nameMatch[1] : "Unknown Channel";

            let msg = `📢 *CHANNEL FOUND!* (Scanner Mode)\n\n`;
            msg += `📛 *Name:* ${channelName}\n`;
            msg += `🆔 *JID:* \`${foundedJid}\`\n\n`;
            msg += `👇 *Code for index.js:*\n`;
            msg += `const channelJid = "${foundedJid}";`;

            return reply(msg);

        } else {
            return reply("❌ JID එක හමු නොවිය.\nConsole එකේ logs බලන්න.");
        }

    } catch (e) {
        console.log("SCANNER ERROR:", e);
        reply("⚠️ Error: " + e.message);
    }
});
