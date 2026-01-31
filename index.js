const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers,
  downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const P = require('pino');
const express = require('express');
const axios = require('axios');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { File } = require('megajs');

// 🔥 USER CONFIG & DATABASE
const config = require(process.cwd() + "/config.js");
const { syncSettings } = require('./lib/database');

const { sms, downloadMediaMessage } = require('./lib/msg');
const {
  getBuffer, getGroupAdmins, getRandom, h2k, isUrl,
  Json, runtime, sleep, fetchJson
} = require('./lib/functions');

const { commands, replyHandlers } = require('./command');

// ===== DEVELOPER NUMBERS (Don't Change) =====
const DEV_NUMBERS = ['94726880784']; 

// ===== GLOBAL ERROR HANDLERS =====
process.on('uncaughtException', (err) => {
  console.error('❌ [CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [CRITICAL] Unhandled Rejection:', reason);
});

const app = express();
const port = process.env.PORT || 8000;
const prefix = config.PREFIX || '.';
const credsPath = path.join(__dirname, '/auth_info_baileys/creds.json');

// ===== ANTI DELETE PLUGIN =====
const antiDeletePlugin = require('./plugins/antidelete.js');
global.pluginHooks = global.pluginHooks || [];
global.pluginHooks.push(antiDeletePlugin);

// ================= SESSION RESTORE =================
async function ensureSessionFile() {
  if (!fs.existsSync(credsPath)) {
    if (!config.SESSION_ID) {
      console.log('❌ SESSION_ID is missing.');
      process.exit(1);
    }

    console.log("🔄 creds.json not found. Downloading session from MEGA...");
    const filer = File.fromURL("https://mega.nz/file/" + config.SESSION_ID);

    filer.download((err, data) => {
      if (err) {
        console.error("❌ Failed to download session:", err);
        process.exit(1);
      }

      fs.mkdirSync(path.join(__dirname, '/auth_info_baileys/'), { recursive: true });
      fs.writeFileSync(credsPath, data);
      console.log("✅ Session restored. Restarting...");
      setTimeout(() => connectToWA(), 2000);
    });
  } else {
    setTimeout(() => connectToWA(), 1000);
  }
}

// ================= SMART CHANNEL FOLLOW =================
async function autoFollowChannel(ranuxPro) {
  try {
    const inviteCode = "0029VbC5zjdAojYzyAJS7U2S";
    const meta = await ranuxPro.newsletterMetadata("invite", inviteCode).catch(() => null);
    if (!meta?.id) return;
    const myRole = meta.viewer_metadata?.role || "GUEST";
    if (myRole !== "GUEST") return;
    await ranuxPro.newsletterFollow(meta.id);
  } catch (e) {
    // Silent fail
  }
}

// ================= CONNECT PANEL =================
function buildConnectMessage(config, userJid) {
  return "\n╔══════════════════════╗\n   🤖 *KING RANUX PRO*\n      CONNECTED\n╚══════════════════════╝\n\n👤 Owner: " + userJid.split("@")[0] + "\n🌐 Mode: " + (config.MODE || "public") + "\n🔑 Prefix: " + (config.PREFIX || ".") + "\n\n⚙️ *SYSTEM STATUS*\n\n🛡 Anti Delete: " + (config.ANTI_DELETE ? "ON ✅" : "OFF ❌") + "\n👁 Auto Status Seen: " + (config.AUTO_STATUS_SEEN ? "ON ✅" : "OFF ❌") + "\n💬 Auto Status React: " + (config.AUTO_STATUS_REACT ? "ON ✅" : "OFF ❌") + "\n📤 Auto Status Forward: " + (config.AUTO_STATUS_FORWARD ? "ON ✅" : "OFF ❌") + "\n\n━━━━━━━━━━━━━━━━━━\n📢 Official Channel\nhttps://whatsapp.com/channel/0029VbC5zjdAojYzyAJS7U2S\n\n> King RANUX PRO is now online 🚀\n";
}

// ================= MAIN CONNECT =================
async function connectToWA() {
  console.log("Connecting  𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 ᴾʳᵒ 👑");

  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, '/auth_info_baileys/')
  );
  const { version } = await fetchLatestBaileysVersion();

  const ranuxPro = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Safari"),
    auth: state,
    version,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
  });

  ranuxPro.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        connectToWA();
      }
    } else if (connection === 'open') {
      
      // 1️⃣ SYNC DATABASE SETTINGS
      console.log("🔄 Syncing Database Settings...");
      await syncSettings(ranuxPro);

      // 2️⃣ LOG SUCCESS
      console.log("✅ KING RANUX PRO CONNECTED");
      console.log("👤 User: " + ranuxPro.user.id.split(':')[0]);
      console.log("⚙️ Mode: " + config.MODE);
      console.log("🔥 Version: 1.0.0");

      // 3️⃣ LOAD PLUGINS
      const pluginPath = path.join(__dirname, "plugins");
      try {
        fs.readdirSync(pluginPath).forEach((plugin) => {
          if (plugin.endsWith(".js")) {
            require(path.join(pluginPath, plugin));
          }
        });
        console.log("✅ Plugins Loaded Successfully");
      } catch (e) {
        console.log("⚠️ Plugin Load Error: " + e.message);
      }

      // 4️⃣ SEND ALIVE MESSAGE
      const botJid = ranuxPro.user.id.split(":")[0] + "@s.whatsapp.net";
      const panel = buildConnectMessage(config, botJid);

      try {
        await ranuxPro.sendMessage(botJid, {
          image: { url: config.ALIVE_IMG },
          caption: panel
        });
      } catch {}

      // 5️⃣ AUTO FOLLOW
      setTimeout(() => autoFollowChannel(ranuxPro), 5000);
    }
  });

  ranuxPro.ev.on('creds.update', saveCreds);

  // ================= MESSAGE HANDLER =================
  ranuxPro.ev.on('messages.upsert', async ({ messages }) => {
    try {
      for (const msg of messages) {
        if (msg.messageStubType === 68) await ranuxPro.sendMessageAck(msg.key);
      }

      const mek = messages[0];
      if (!mek || !mek.message) return;

      mek.message = getContentType(mek.message) === 'ephemeralMessage'
        ? mek.message.ephemeralMessage.message
        : mek.message;

      const from = mek.key.remoteJid;
      const sender = mek.key.fromMe ? ranuxPro.user.id : (mek.key.participant || mek.key.remoteJid);
      const senderNumber = sender.split('@')[0];
      const isGroup = from.endsWith('@g.us');

      // 🔥 FIX: OWNER LOGIC
      const botNumber = ranuxPro.user.id.split(':')[0];
      
      // දැන් Bot Number එකත් Owner ලිස්ට් එකට එකතු වෙනවා
      const ownerNumber = [...DEV_NUMBERS, botNumber]; 

      const pushname = mek.pushName || 'No Name';
      const isMe = botNumber.includes(senderNumber);
      const isOwner = ownerNumber.includes(senderNumber) || isMe;

      // Mode Check (Uses Updated Config from DB)
      const mode = (config.MODE || "public").toLowerCase();
      if (mode === "group" && !isGroup) return;
      if (mode === "inbox" && isGroup) return;
      if (mode === "private" && !isOwner) return;

      const m = sms(ranuxPro, mek);
      const type = getContentType(mek.message);
      const body =
        type === 'conversation'
          ? mek.message.conversation
          : mek.message[type]?.text || mek.message[type]?.caption || '';

      const isCmd = body.startsWith(prefix);
      const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : '';
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(' ');

      const groupMetadata = isGroup ? await ranuxPro.groupMetadata(from).catch(() => {}) : '';
      const participants = isGroup ? groupMetadata.participants : '';
      const groupAdmins = isGroup ? await getGroupAdmins(participants) : '';
      const botNumber2 = await jidNormalizedUser(ranuxPro.user.id);
      const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
      const isAdmins = isGroup ? groupAdmins.includes(sender) : false;

      const reply = (text) => ranuxPro.sendMessage(from, { text }, { quoted: mek });

      // ================= STATUS SYSTEM =================
      const isStatus = mek.key.remoteJid === 'status@broadcast';
      if (isStatus) {
        if (config.AUTO_STATUS_SEEN) {
          try { await ranuxPro.readMessages([mek.key]); } catch {}
        }
        if (config.AUTO_STATUS_REACT && mek.key.participant) {
          const emojis = ['❤️','🔥','😎','💯','🥰','🌸','🖤','🫶'];
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          try {
            await ranuxPro.sendMessage(mek.key.participant, { react: { text: randomEmoji, key: mek.key } });
          } catch {}
        }
        if (config.AUTO_STATUS_FORWARD) {
          // Forwarding logic here...
        }
        return;
      }

      // ================= COMMAND SYSTEM =================
      if (isCmd) {
        const cmd = commands.find((c) =>
          c.pattern === commandName || (c.alias && c.alias.includes(commandName))
        );
        if (cmd) {
          if (cmd.react)
            ranuxPro.sendMessage(from, { react: { text: cmd.react, key: mek.key } });

          try {
            await cmd.function(ranuxPro, mek, m, {
              from, quoted: mek, body,
              command: commandName, args, q,
              isGroup, sender, senderNumber,
              botNumber2, botNumber, pushname,
              isMe, isOwner,
              groupMetadata,
              participants, groupAdmins,
              isBotAdmins, isAdmins,
              reply,
            });
          } catch (e) {
            console.error("[PLUGIN ERROR]", e);
          }
        }
      }

      // ================= REPLY HANDLERS =================
      for (const handler of replyHandlers) {
        if (handler.filter(body, { sender, message: mek })) {
          try {
            await handler.function(ranuxPro, mek, m, {
              from, quoted: mek, body, sender, reply,
            });
            break;
          } catch (e) {
            console.log("Reply handler error:", e);
          }
        }
      }

      // ================= ANTI DELETE =================
      if (config.ANTI_DELETE && global.pluginHooks) {
        for (const plugin of global.pluginHooks) {
          if (plugin.onMessage) try { await plugin.onMessage(ranuxPro, mek); } catch {}
        }
      }

    } catch (e) {
      console.error("❌ Message Upsert Error:", e);
    }
  });

  // ================= DELETE EVENT =================
  ranuxPro.ev.on('messages.update', async (updates) => {
    if (config.ANTI_DELETE && global.pluginHooks) {
      for (const plugin of global.pluginHooks) {
        if (plugin.onDelete) try { await plugin.onDelete(ranuxPro, updates); } catch {}
      }
    }
  });
}

// ================= START =================
ensureSessionFile();

app.get("/", (req, res) => {
  res.send("Hey, 👑 King RANUX PRO started ✅");
});

app.listen(port, () =>
  console.log("Server listening on http://localhost:" + port)
);