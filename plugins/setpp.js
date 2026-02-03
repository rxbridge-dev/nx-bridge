const { cmd } = require('../command');
const jimp = require('jimp');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');

// Design Elements
const FOOTER = "> Powered by King RANUX PRO";

// Helper function to resize image (Adding Padding)
async function generateProfilePicture(buffer) {
    const image = await jimp.read(buffer);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    // Select the largest dimension to make a perfect square
    const res = width > height ? width : height;
    
    // Create a new image with transparent/black background
    const finalImage = await new jimp(res, res, 0x00000000); 
    
    // Center the original image on the new square canvas
    // x = (target_width - image_width) / 2
    // y = (target_height - image_height) / 2
    await finalImage.composite(image, (res - width) / 2, (res - height) / 2);
    
    // Get the buffer back
    return await finalImage.getBufferAsync(jimp.MIME_JPEG);
}

cmd({
    pattern: "setfullpp",
    alias: ["fullpp", "setbotpp"],
    desc: "Set full screen profile picture for the bot without cropping",
    category: "owner",
    react: "🖼️",
    filename: __filename
},
async (bot, mek, m, { from, isOwner, reply }) => {
    try {
        // 1. Permission Check
        if (!isOwner) return reply("*❌ This command is for the Bot Owner only!*");

        // 2. Check for Quoted Image
        if (!mek.message.extendedTextMessage || !mek.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage) {
            return reply("*ℹ️ Please reply to an image to set as Full PP.*");
        }

        await reply("*🔄 Processing image... Please wait.*");

        // 3. Download the Image
        const media = mek.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
        const stream = await downloadContentFromMessage(media, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 4. Process the Image (Make it Square)
        const finalBuffer = await generateProfilePicture(buffer);

        // 5. Update Profile Picture
        // We use the bot's own JID to update its DP
        await bot.updateProfilePicture(bot.user.id, finalBuffer);

        await reply(`*✅ Full Profile Picture Updated Successfully!*\n\n${FOOTER}`);

    } catch (e) {
        console.error("FULL PP ERROR:", e);
        reply(`*❌ Failed to set profile picture.*\nReason: ${e.message}`);
    }
});