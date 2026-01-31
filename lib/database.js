// --- START OF FILE lib/database.js ---

const axios = require('axios');
const config = require('../config');

// 🔥 ඔයා එවපු Firebase URL එක මෙතනට දැම්මා (අගට / අයින් කරලා)
const dbUrl = "https://king-ranux-pro-default-rtdb.firebaseio.com";

// 1. Database එකෙන් Settings අරගෙන Config එකට දාගන්න Function එක
async function syncSettings() {
    try {
        // Firebase වලින් Data ගන්නවා (GET Request)
        const { data } = await axios.get(`${dbUrl}/settings.json`);
        
        if (data) {
            // Database එකේ තියෙන දේවල් Config එකට Merge කරනවා
            Object.assign(config, data);
            console.log("✅ Database Synced Successfully!");
            console.log("⚙️ Loaded Settings:", Object.keys(data));
        } else {
            console.log("ℹ️ Database is empty. Using default config.");
            // Database එක හිස් නම් Default ටික Upload කරනවා
            await axios.put(`${dbUrl}/settings.json`, config);
        }
    } catch (e) {
        console.error("❌ Database Sync Error:", e.message);
        console.log("⚠️ Using default config due to error.");
    }
}

// 2. Setting එකක් Update කරන Function එක (settings.js එකට ඕන)
async function updateSetting(bot, key, value) {
    try {
        // Firebase එකට Data යවනවා (PUT Request)
        await axios.put(`${dbUrl}/settings/${key}.json`, JSON.stringify(value));
        
        // බොට් එකේ දැනට තියෙන Config එකත් Update කරනවා (Restart නොකර වැඩ කරන්න)
        config[key] = value;
        
        return true;
    } catch (e) {
        console.error("❌ Update Setting Error:", e.message);
        return false;
    }
}

// 3. Database එක Reset කරන Function එක
async function resetSettings(bot) {
    try {
        // සම්පූර්ණ settings node එකම මකලා දානවා (DELETE Request)
        await axios.delete(`${dbUrl}/settings.json`);
        
        console.log("✅ Database Reset Complete.");
        return true;
    } catch (e) {
        console.error("❌ Reset Error:", e.message);
        return false;
    }
}

module.exports = { 
    syncSettings, 
    updateSetting, 
    resetSettings 
};
