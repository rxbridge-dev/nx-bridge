const { cmd } = require('../command');
const { downloadContentFromMessage, jidNormalizedUser } = require('@whiskeysockets/baileys');
// Use require('jimp') directly as it might be CommonJS or ESM based on version
const Jimp = require('jimp');

// Design Elements
const FOOTER = "> Powered by King RANUX PRO";

// ===============================================================
// HELPER: PROCESS IMAGE (SMART CROP & RESIZE)
// ===============================================================
async function generateProfilePicture(buffer) {
    // Read the image (Support both Jimp constructor and read method)
    const image = await (Jimp.read ? Jimp.read(buffer) : new Jimp(buffer));
    
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    // Select the largest dimension to make a perfect square
    const res = width > height ? width : height;
    
    // Create a new blank image with transparent/black background
    const finalImage = new Jimp(res, res, 0x00000000); 
    
    // Center the original image on the new square canvas
    await finalImage.composite(image, (res - width) / 2, (res - height) / 2);
    
    // Return the processed image buffer
    return await finalImage.getBufferAsync(Jimp.MIME_JPEG);
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
        // 1. Permission Check
        if (!isOwner) return reply("*❌ This command is for the Bot Owner only!*");

        // 2. Advanced Media Detection logic
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

        // 3. Download the Image Stream
        const stream = await downloadContentFromMessage(mediaMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 4. Process Image using JIMP
        const finalBuffer = await generateProfilePicture(buffer);

        // 5. Update Profile Picture
        const botJid = jidNormalizedUser(bot.user.id);
        await bot.updateProfilePicture(botJid, finalBuffer);

        await reply(`*✅ Full Profile Picture Updated Successfully!*\n\n${FOOTER}`);

    } catch (e) {
        console.error("FULL PP ERROR:", e);
        reply(`*❌ Failed to set profile picture.*\nReason: ${e.message}`);
    }
});