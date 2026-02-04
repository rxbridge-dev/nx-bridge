const { cmd } = require('../command');
const { downloadContentFromMessage, jidNormalizedUser } = require('@whiskeysockets/baileys');
const { Jimp } = require('jimp'); // Destructure Jimp class correctly

// Design Elements
const FOOTER = "> 👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋɪɴɢ ʀᴀɴᴜx ᴘʀᴏO";

// ===============================================================
// HELPER: PROCESS IMAGE (SMART CROP & RESIZE)
// ===============================================================
async function generateProfilePicture(buffer) {
    // Read the image
    const image = await Jimp.read(buffer);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    // Select the largest dimension
    const res = Math.max(width, height);
    
    // Create new blank image (black background)
    const finalImage = new Jimp({ width: res, height: res, color: 0x00000000 });
    
    // Center the original image
    const x = Math.floor((res - width) / 2);
    const y = Math.floor((res - height) / 2);
    
    finalImage.composite(image, x, y);
    
    // Return processed buffer
    return await finalImage.getBuffer("image/jpeg");
}

// ===============================================================
// COMMAND: SET FULL PROFILE PICTURE
// ===============================================================
cmd({
    pattern: "setfullpp",
    alias: ["fullpp", "setbotpp", "ppfull"],
    desc: "Set full screen profile picture for the bot without cropping",
    category: "owner",
    react: "🖼️",
    filename: __filename
},
async (bot, mek, m, { from, isOwner, reply }) => {
    try {
        if (!isOwner) return reply("*❌ This command is for the Bot Owner only!*");

        let mediaMessage = null;
        if (mek.message.imageMessage) {
            mediaMessage = mek.message.imageMessage;
        } else if (mek.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
            mediaMessage = mek.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
        }

        if (!mediaMessage) {
            return reply("*ℹ️ Please reply to an image or send an image with the caption .setfullpp*");
        }

        await reply("*🔄 Processing full profile picture... Please wait.*");

        const stream = await downloadContentFromMessage(mediaMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const finalBuffer = await generateProfilePicture(buffer);
        const botJid = jidNormalizedUser(bot.user.id);
        
        await bot.updateProfilePicture(botJid, finalBuffer);

        await reply(`*✅ Full Profile Picture Updated Successfully!*\n\n${FOOTER}`);

    } catch (e) {
        console.error("FULL PP ERROR:", e);
        reply(`*❌ Failed to set profile picture.*\nReason: ${e.message}`);
    }
});