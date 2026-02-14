/**
 * ------------------------------------------------------------
 * KING RANUX PRO BOT — ANIME SCRAPER MODULE
 * Version: v1.0.0
 * ------------------------------------------------------------
 *
 * Copyright (c) 2026 A.M. Ransara Devnath
 * All Rights Reserved.
 *
 * This module is a FREE scraper component designed for
 * KING RANUX PRO WhatsApp Bot.
 *
 * Redistribution, resale, or commercial distribution of this
 * scraper module (in original or modified form) is prohibited.
 *
 * Allowed:
 *  - Personal use
 *  - Private bot deployments
 *  - UI text customization
 *  - Branding text changes
 *
 * Not Allowed:
 *  - Selling this scraper
 *  - Re-uploading to public repositories
 *  - Modifying core scraper logic
 *  - Modifying downloader logic
 *
 * Always use the latest version of this module.
 *
 * Author  : A.M. Ransara Devnath
 * Project : KING RANUX PRO BOT
 * Contact : +94 72 688 0784
 * ------------------------------------------------------------
 */
 
const { cmd } = require("../command");
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const config = require("../config");

const { GoogleDriveDownloader } = require('@raphaelvserafim/google-drive-downloader');

global.pendingAnime = global.pendingAnime || {};

const SITE_URL = "https://animeclub2.com";
const LOGO_URL = "https://raw.githubusercontent.com/ransara-devnath-ofc/-Bot-Accent-/refs/heads/main/King%20RANUX%20PRO%20Bot%20Images/king-ranux-pro-main-logo.png";
const FOOTER = "> 👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋɪɴɢ ʀᴀɴᴜx ᴘʀᴏ";

async function downloadAndSend(conn, from, url, fileName, mek) {
    try {
        await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

        console.log(`[AnimeTV] Processing URL: ${url}`);

        let finalFileName = fileName.replace(/[^\w\s.-]/gi, '').trim(); 
        if (!finalFileName.endsWith(".mp4") && !finalFileName.endsWith(".mkv")) finalFileName += ".mp4";

        const tempDir = path.join(__dirname, "../temp");
        await fs.ensureDir(tempDir);
        const destinationPath = path.join(tempDir, finalFileName);

        const downloader = new GoogleDriveDownloader();

        console.log("[AnimeTV] Starting Download Stream...");
        
        const result = await downloader.downloadAsStream(url);

        if (result.success && result.file && result.file.stream) {
            
            const writeStream = fs.createWriteStream(destinationPath);
            
            result.file.stream.pipe(writeStream);

            await new Promise((resolve, reject) => {
                writeStream.on('finish', () => {
                    console.log('✅ Large file downloaded successfully!');
                    resolve();
                });
                writeStream.on('error', (err) => {
                    console.error('Stream writing error:', err);
                    reject(err);
                });
            });

        } else {
            throw new Error("Failed to establish download stream. Link might be private, broken, or not a valid Drive link.");
        }

        const stats = await fs.stat(destinationPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        if (sizeMB > 2000) {
            await fs.unlink(destinationPath);
            return conn.sendMessage(from, { 
                text: `⚠️ *File Too Large!* (${sizeMB}MB)\nWhatsApp upload limit is 2GB.\n\n🔗 *Link:* ${url}` 
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "⬆️", key: mek.key } });

        await conn.sendMessage(from, {
            document: { url: destinationPath },
            mimetype: "video/mp4",
            fileName: finalFileName,
            caption: `╭───〔 ✅ *𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐃* 〕───┈\n│\n│ 🎬 *File:* ${finalFileName}\n│ 📦 *Size:* ${sizeMB} MB\n│\n╰──────────────────────┈\n${FOOTER}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        setTimeout(() => { 
            if (fs.existsSync(destinationPath)) {
                fs.unlinkSync(destinationPath); 
            }
        }, 60000); 

    } catch (e) {
        console.error("[AnimeTV] Error:", e);
        await conn.sendMessage(from, { 
            text: `❌ *Download Failed!* \nThe file might be broken or private.\n\n🔗 *Manual Link:* ${url}` 
        }, { quoted: mek });
    }
}


async function searchAnime(query) {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.goto(`${SITE_URL}/?s=${encodeURIComponent(query)}`, { waitUntil: "domcontentloaded", timeout: 60000 });

    const results = await page.evaluate(() => {
        const items = document.querySelectorAll(".result-item article");
        return Array.from(items).slice(0, 10).map(item => {
            const titleEl = item.querySelector(".title a");
            const imgEl = item.querySelector(".thumbnail img");
            const yearEl = item.querySelector(".meta .year");
            return {
                title: titleEl ? titleEl.innerText.trim() : "Unknown",
                link: titleEl ? titleEl.href : "",
                image: imgEl ? imgEl.src : "",
                year: yearEl ? yearEl.innerText.trim() : ""
            };
        });
    });
    await browser.close();
    return results;
}

async function getAnimeDetails(url) {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    const data = await page.evaluate(() => {
        const title = document.querySelector(".data h1")?.innerText.trim() || "Anime";
        const desc = document.querySelector(".wp-content p")?.innerText.trim().substring(0, 150) + "...";
        const image = document.querySelector(".poster img")?.src || "";
        const episodes = Array.from(document.querySelectorAll("#seasons .episodios li")).map(ep => ({
            title: ep.querySelector(".episodiotitle a")?.innerText.trim() || "Episode",
            url: ep.querySelector(".episodiotitle a")?.href || "",
            date: ep.querySelector(".date")?.innerText.trim() || ""
        }));
        return { title, desc, image, episodes };
    });
    await browser.close();
    return data;
}

async function getEpisodeLinks(url) {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    const links = await page.evaluate(() => {
        const rows = document.querySelectorAll(".links_table table tbody tr");
        return Array.from(rows).map(row => {
            const serverName = row.querySelector("td:nth-child(1) a")?.innerText.trim() || "Link";
            const serverUrl = row.querySelector("td:nth-child(1) a")?.href || "";
            const quality = row.querySelector("td:nth-child(2) strong")?.innerText.trim() || "Unknown";
            return { serverName, serverUrl, quality };
        }).filter(l => l.serverUrl);
    });
    await browser.close();
    return links;
}

async function bypassLink(url) {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const finalLink = await page.evaluate(() => {
        const btn = document.getElementById("link");
        return btn ? btn.href : null;
    });
    await browser.close();
    return finalLink;
}


cmd({
    pattern: "anime",
    alias: ["ac", "animeclub"],
    desc: "Download Anime from AnimeClub2",
    category: "download",
    react: "⛩️",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    if (!q) return reply("*ℹ️ Please provide an anime name.*");
    delete global.pendingAnime[sender];

    await reply(`*⏳ Searching for "${q}"...*`);
    try {
        const results = await searchAnime(q);
        if (!results.length) return reply("❌ *No results found!*");

        global.pendingAnime[sender] = { step: "SELECT_ANIME", results };

        let msg = `╭───〔 🌸 *𝐀𝐍𝐈𝐌𝐄 𝐒𝐄𝐀𝐑𝐂𝐇* 〕───┈\n│\n`;
        results.forEach((item, i) => msg += `│ *${i + 1}* ➻ ${item.title} (${item.year})\n`);
        msg += `│\n╰──────────────────────┈\n│ 🔢 *Reply with a number!*`;

        await conn.sendMessage(from, { image: { url: results[0].image || LOGO_URL }, caption: msg }, { quoted: mek });
    } catch (e) { console.error(e); reply("❌ Search Error."); }
});

cmd({
    filter: (text, { sender }) => global.pendingAnime[sender]?.step === "SELECT_ANIME" && /^\d+$/.test(text)
}, async (conn, mek, m, { body, sender, reply, from }) => {
    const index = parseInt(body) - 1;
    const { results } = global.pendingAnime[sender];
    if (!results[index]) return reply("❌ *Invalid number.*");

    await reply(`*⏳ Fetching episodes...*`);
    try {
        const details = await getAnimeDetails(results[index].link);
        if (!details.episodes.length) return reply("❌ *No episodes found!*");

        global.pendingAnime[sender] = { step: "SELECT_EPISODE", details };

        let msg = `╭───〔 📺 *𝐀𝐍𝐈𝐌𝐄 𝐈𝐍𝐅𝐎* 〕───┈\n│\n│ 🏷️ *Title:* ${details.title}\n│ 📝 *Desc:* ${details.desc}\n│\n╰──────────────────────┈\n\n╭───〔 📂 *𝐄𝐏𝐈𝐒𝐎𝐃𝐄 𝐋𝐈𝐒𝐓* 〕───┈\n│\n`;
        details.episodes.forEach((ep, i) => msg += `│ *${i + 1}* ➻ ${ep.title}\n`);
        msg += `│\n╰──────────────────────┈\n│ 🔢 *Reply with episode number!*`;

        await conn.sendMessage(from, { image: { url: details.image || LOGO_URL }, caption: msg }, { quoted: mek });
    } catch (e) { console.error(e); reply("❌ Error getting episodes."); }
});

cmd({
    filter: (text, { sender }) => global.pendingAnime[sender]?.step === "SELECT_EPISODE" && /^\d+$/.test(text)
}, async (conn, mek, m, { body, sender, reply, from }) => {
    const index = parseInt(body) - 1;
    const { details } = global.pendingAnime[sender];
    if (!details.episodes[index]) return reply("❌ *Invalid episode.*");

    await reply(`*⏳ Fetching download links...*`);
    try {
        const selectedEp = details.episodes[index];
        const links = await getEpisodeLinks(selectedEp.url);
        if (!links.length) return reply("❌ *No links found!*");

        global.pendingAnime[sender] = { step: "SELECT_QUALITY", links, epName: selectedEp.title };

        let msg = `╭───〔 ⬇️ *𝐒𝐄𝐋𝐄𝐂𝐓 𝐐𝐔𝐀𝐋𝐈𝐓𝐘* 〕───┈\n│\n│ 🎬 *Episode:* ${selectedEp.title}\n│\n`;
        links.forEach((link, i) => {
            let type = link.serverName.toLowerCase().includes("telegram") ? "✈️ TG" : "🛑 Drive";
            msg += `│ *${i + 1}* ➻ ${type} [${link.quality}]\n`;
        });
        msg += `│\n╰──────────────────────┈\n│ 🔢 *Reply with number!*`;

        await conn.sendMessage(from, { text: msg }, { quoted: mek });
    } catch (e) { console.error(e); reply("❌ Error getting links."); }
});

cmd({
    filter: (text, { sender }) => global.pendingAnime[sender]?.step === "SELECT_QUALITY" && /^\d+$/.test(text)
}, async (conn, mek, m, { body, sender, reply, from }) => {
    const index = parseInt(body) - 1;
    const { links, epName } = global.pendingAnime[sender];
    if (!links[index]) return reply("❌ *Invalid selection.*");

    const selectedLink = links[index];
    delete global.pendingAnime[sender];

    if (selectedLink.serverName.toLowerCase().includes("telegram")) {
        return conn.sendMessage(from, { text: `✈️ *Telegram Link*\n\n🔗 ${selectedLink.serverUrl}` }, { quoted: mek });
    }

    await reply(`*🚀 Bypassing countdown for "${epName}"...*`);

    try {
        const finalUrl = await bypassLink(selectedLink.serverUrl);
        if (!finalUrl) return reply("❌ *Failed to generate link.*");

        if (finalUrl.includes("drive.google.com")) {
            await downloadAndSend(conn, from, finalUrl, `${epName} - ${selectedLink.quality}`, mek);
        } else {
            await conn.sendMessage(from, { text: `✅ *Link Generated:*\n\n🔗 ${finalUrl}\n\n(Not a Google Drive link, cannot auto-download)` }, { quoted: mek });
        }
    } catch (e) {
        console.error(e);
        reply("❌ *Error processing download.*");
    }
});

/**
 * ------------------------------------------------------------
 * END OF ANIME SCRAPER MODULE
 * KING RANUX PRO BOT
 * ------------------------------------------------------------
 *
 * AnimeClub Scraper + Google Drive Downloader
 * Developed by A.M. Ransara Devnath
 *
 * Module Version : v1.0.0
 * Year           : 2026
 *
 * Thank you for using KING RANUX PRO modules.
 * ------------------------------------------------------------
 */