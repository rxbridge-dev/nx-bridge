const axios = require('axios');
const config = require('../config');

const B64_DB_URL = "aHR0cHM6Ly9raW5nLXJhbnV4LXByby1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20=";
const B64_API_KEY = "QUl6YVN5QVFUUG4tWVVsMW9ZUDJOeENaLWhEVmp3Q1Jfc3IwZnI4";

const decode = (str) => Buffer.from(str, 'base64').toString('utf-8');

const DB_URL = decode(B64_DB_URL);
const API_KEY = decode(B64_API_KEY);

const getDbId = (ranuxPro) => {
try {
const userJid = ranuxPro.user.id.split(":")[0];
return userJid;
} catch (e) {
return null;
}
};

async function syncSettings(ranuxPro) {
try {
const userId = getDbId(ranuxPro);
if (!userId) return;


const url = `${DB_URL}/users/${userId}/settings.json?auth=${API_KEY}`;
    const { data } = await axios.get(url);

    if (data) {
        Object.keys(data).forEach(key => {
            if (key !== 'ALIVE_MSG') { 
                config[key] = data[key];
            }
        });
    } 
} catch (e) {
    console.error(e.message);
}

}

async function updateSetting(ranuxPro, key, value) {
try {
const userId = getDbId(ranuxPro);
if (!userId) return false;


const url = `${DB_URL}/users/${userId}/settings.json?auth=${API_KEY}`;
    
    config[key] = value;

    await axios.patch(url, { [key]: value });
    
    return true;
} catch (e) {
    return false;
}

}

async function resetSettings(ranuxPro) {
try {
const userId = getDbId(ranuxPro);
if (!userId) return false;


const url = `${DB_URL}/users/${userId}/settings.json?auth=${API_KEY}`;
    
    await axios.delete(url);
    return true;
} catch (e) {
    return false;
}

}

module.exports = { syncSettings, updateSetting, resetSettings };