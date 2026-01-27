const { cmd } = require("../command");

cmd({
    pattern: "forward",
    alias: ["fwd"],
    desc: "Forward any quoted message to a target JID",
    category: "tools",
    react: "⏩",
    filename: __filename
}, async (bot, mek, m, { from, args, reply }) => {
    try {
        // 1. මැසේජ් එකකට Reply කරලා තියෙනවද බලනවා
        if (!m.quoted) {
            return reply("⚠️ *කරුණාකර Forward කිරීමට අවශ්‍ය මැසේජ් එකට Reply කරන්න.*");
        }

        // 2. Target Number/JID එක ලබා ගැනීම
        if (!args[0]) {
            return reply(
                "⚠️ *Target Number/JID එකක් ලබා දෙන්න.*\n\n" +
                "උදාහරණ:\n" +
                "1️⃣ `.fwd 94712345678` (Private)\n" +
                "2️⃣ `.fwd 12345678@g.us` (Group)\n" +
                "3️⃣ `.fwd 12345@newsletter` (Channel)"
            );
        }

        let targetJid = args[0].trim();

        // නිකන්ම නම්බර් එක ගැහුවොත්, අගට @s.whatsapp.net එකතු කරනවා
        if (!targetJid.includes("@")) {
            targetJid += "@s.whatsapp.net";
        }

        // 3. Forward කිරීමට අවශ්‍ය මැසේජ් එක සකසා ගැනීම
        // m.quoted එක කෙලින්ම යවන්න බැරි නිසා, අපි Raw Message Data එක ගන්නවා
        const context = mek.message?.extendedTextMessage?.contextInfo;
        
        if (!context || !context.quotedMessage) {
            return reply("❌ Message content එක කියවීමට නොහැක.");
        }

        // Forward Object එක හැදීම
        const msgToForward = {
            key: {
                remoteJid: from,
                fromMe: false,
                id: context.stanzaId,
                participant: context.participant
            },
            message: context.quotedMessage
        };

        // 4. මැසේජ් එක යැවීම (Baileys Standard Method)
        await bot.sendMessage(targetJid, { 
            forward: msgToForward, 
            force: true 
        });

        // 5. Success Message
        await reply(`✅ *Forwarded Successfully!* \n\n📤 To: \`${targetJid}\``);

    } catch (e) {
        console.log("FORWARD ERROR:", e);
        reply("❌ *Forward Failed*\n\nReason: " + e.message);
    }
});
