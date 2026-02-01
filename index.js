const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers,
  downloadContentFromMessage,
  makeInMemoryStore
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const P = require('pino');
const express = require('express');
const axios = require('axios');
const path = require('path');
const os = require('os');
const { File } = require('megajs');

// 🔥 USER CONFIG & LIBS
const config = require(process.cwd() + "/config.js");
const { sms, downloadMediaMessage } = require('./lib/msg');
const {
  getBuffer, getGroupAdmins, getRandom, h2k, isUrl,
  Json, runtime, sleep, fetchJson
} = require('./lib/functions');

// Import Command System
const { commands, replyHandlers } = require('./command');

// ===== GLOBAL ERROR HANDLING (CRASH PROTECTION) =====
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});

// ===== SYSTEM CONSTANTS =====
const app = express();
const port = process.env.PORT || 8000;
const credsPath = path.join(__dirname, '/auth_info_baileys/creds.json');

// Dynamic Owner Setup
let ownerConfig = config.OWNER_NUMBER || '94726880784';
const ownerNumber = Array.isArray(ownerConfig) ? ownerConfig : [ownerConfig];
const MASTER_SUDO = ownerNumber; 

// ===== ANTI DELETE & PLUGIN HOOKS =====
const antiDeletePlugin = require('./plugins/antidelete.js');
global.pluginHooks = global.pluginHooks || [];
global.pluginHooks.push(antiDeletePlugin);

// ================= SESSION RESTORE (BASE64 + MEGA FALLBACK) =================
async function ensureSessionFile() {
  if (!fs.existsSync(credsPath)) {
    if (!config.SESSION_ID) {
      console.error('❌ SESSION_ID is missing in config.js');
      process.exit(1);
    }

    try {
        let sessionData = config.SESSION_ID;
        const prefixes = ["King RANUX PRO ~", "𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 ᴾʳᵒ ~"];
        for (const prefix of prefixes) {
            if (sessionData.startsWith(prefix)) {
                sessionData = sessionData.replace(prefix, "");
                break;
            }
        }

        if (!sessionData.includes("mega.nz")) {
            console.log("🔄 Detecting Base64 Session...");
            const credsBuffer = Buffer.from(sessionData, 'base64');
            fs.mkdirSync(path.join(__dirname, '/auth_info_baileys/'), { recursive: true });
            fs.writeFileSync(credsPath, credsBuffer);
            console.log("✅ Session restored from Base64! Starting Bot...");
            setTimeout(() => connectToWA(), 2000);
            return;
        }
    } catch (e) {
        console.log("⚠️ Base64 restore failed, trying MEGA...");
    }

    console.log("🔄 Downloading session from MEGA...");
    try {
      const filer = File.fromURL(`https://mega.nz/file/${config.SESSION_ID}`);
      filer.download((err, data) => {
        if (err) {
          console.error("❌ Failed to download session:", err);
          process.exit(1);
        }
        fs.mkdirSync(path.join(__dirname, '/auth_info_baileys/'), { recursive: true });
        fs.writeFileSync(credsPath, data);
        console.log("✅ Session restored from MEGA. Starting Bot...");
        setTimeout(() => connectToWA(), 2000);
      });
    } catch (e) {
      console.error("❌ Invalid Session ID format.");
      process.exit(1);
    }
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
    console.log("➕ Auto Follow: Joining official channel...");
    await ranuxPro.newsletterFollow(meta.id);
    console.log("✅ Auto Follow: Success!");
  } catch (e) {}
}

// ================= CONNECT PANEL INFO =================
function buildConnectMessage(config, userJid) {
  const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const totalRam = (os.totalmem() / 1024 / 1024).toFixed(0);
  const user = userJid ? userJid.split("@")[0] : "Unknown";
  
  return `
╔════════════════════════╗
   🔮 *KING RANUX PRO*
      *SYSTEM ONLINE*
╚════════════════════════╝

👋 *Welcome Back, Commander!*
👤 *User:* @${user}
🌐 *Mode:* ${config.MODE || "public"}
🔑 *Prefix:* [ ${config.PREFIX || "."} ]

📊 *SYSTEM DIAGNOSTICS*
💾 *RAM:* ${ramUsage}MB / ${totalRam}MB
🛡️ *Anti-Delete:* ${config.ANTI_DELETE ? "Active ✅" : "Disabled ❌"}
👁️ *Auto Read:* ${config.AUTO_STATUS_SEEN ? "Active ✅" : "Disabled ❌"}

> 🚀 System is ready to serve.
`;
}

// ================= MAIN CONNECTION LOGIC =================
async function connectToWA() {
  console.log("Connecting 𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 ᴾʳᵒ 👑...");

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
    getMessage: async (key) => {
        return { conversation: "King RANUX PRO" };
    }
  });

  // 🔥 CORE OVERRIDE: FORCE CHANNEL FORWARD ON ALL MESSAGES 🔥
  // This ensures EVERY message (Image/Text/Video) sent by the bot gets the channel context
  const originalSendMessage = ranuxPro.sendMessage;
  ranuxPro.sendMessage = async (jid, content, options = {}) => {
      // Define Channel Context
      const newsletterContext = {
          newsletterJid: "120363405950699484@newsletter",
          newsletterName: "👑 𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 ᴾʳᵒ",
          serverMessageId: 143 // Mock ID
      };

      // Ensure content is an object and inject context
      if (typeof content === 'object' && content !== null) {
          if (!content.contextInfo) content.contextInfo = {};
          
          content.contextInfo.forwardingScore = 999;
          content.contextInfo.isForwarded = true;
          content.contextInfo.forwardedNewsletterMessageInfo = newsletterContext;
      }

      // Call Original Function with modified content
      return await originalSendMessage.call(ranuxPro, jid, content, options);
  };

  // ===== CONNECTION EVENTS =====
  ranuxPro.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("⚠️ Connection lost. Reconnecting...");
        connectToWA();
      } else {
        console.log("❌ Session logged out. Please rescan.");
        process.exit(1);
      }
    } else if (connection === 'open') {
      console.log('✅ King RANUX PRO Connected!');

      let botJid = ranuxPro.user?.id ? jidNormalizedUser(ranuxPro.user.id) : null;
      
      if (botJid) {
        await ranuxPro.sendMessage(botJid, {
          image: { url: config.ALIVE_IMG },
          caption: buildConnectMessage(config, botJid)
        }).catch(() => {});
      }

      setTimeout(() => autoFollowChannel(ranuxPro), 5000);

      const pluginPath = path.join(__dirname, "plugins");
      if (fs.existsSync(pluginPath)) {
        fs.readdirSync(pluginPath).forEach((plugin) => {
          if (plugin.endsWith(".js")) {
            try {
              require(path.join(pluginPath, plugin));
            } catch (e) {
              console.error(`❌ Failed to load plugin: ${plugin}`, e.message);
            }
          }
        });
        console.log("🧩 Plugins Loaded Successfully.");
      }
    }
  });

  ranuxPro.ev.on('creds.update', saveCreds);

  // ================= MESSAGE HANDLER =================
  ranuxPro.ev.on('messages.upsert', async ({ messages }) => {
    try {
      for (const msg of messages) {
         if (msg.messageStubType === 68) {
            await ranuxPro.sendMessageAck(msg.key);
         }
      }

      const mek = messages[0];
      if (!mek || !mek.message) return;
      if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return; 

      mek.message = getContentType(mek.message) === 'ephemeralMessage'
        ? mek.message.ephemeralMessage.message
        : mek.message;

      const from = mek.key.remoteJid;
      const isGroup = from.endsWith('@g.us');
      
      const botJid = ranuxPro.user?.id ? jidNormalizedUser(ranuxPro.user.id) : null;
      const botNumber = botJid ? botJid.split(':')[0] : "unknown";

      const sender = mek.key.fromMe 
        ? (botJid || from)
        : (mek.key.participant || mek.key.remoteJid);
      const senderNumber = sender.split('@')[0];
      const pushname = mek.pushName || 'User';

      const isMe = botNumber.includes(senderNumber);
      const isOwner = ownerNumber.includes(senderNumber) || isMe;
      const isSudo = MASTER_SUDO.includes(senderNumber);

      // ================= ANTI DELETE & HOOKS =================
      if (config.ANTI_DELETE && global.pluginHooks) {
        for (const plugin of global.pluginHooks) {
          if (plugin.onMessage) try { await plugin.onMessage(ranuxPro, mek); } catch {}
        }
      }

      // Mode Firewall
      const mode = (config.MODE || "public").toLowerCase();
      if (mode === "group" && !isGroup) return;
      if (mode === "inbox" && isGroup) return;
      if (mode === "private" && !isOwner && !isSudo) return;

      const m = sms(ranuxPro, mek);
      
      const type = getContentType(mek.message);
      const body = type === 'conversation' ? mek.message.conversation
                 : type === 'extendedTextMessage' ? mek.message.extendedTextMessage.text
                 : type === 'imageMessage' ? mek.message.imageMessage.caption
                 : type === 'videoMessage' ? mek.message.videoMessage.caption
                 : '';

      const prefix = config.PREFIX || '.';
      const isCmd = body.startsWith(prefix);
      const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : '';
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(' ');

      // Default reply (Now automatically enhanced by override)
      const reply = (text) => ranuxPro.sendMessage(from, { text }, { quoted: mek });

      // Group Metadata
      let groupMetadata = null;
      let participants = [];
      let groupAdmins = [];
      let isBotAdmins = false;
      let isAdmins = false;

      if (isGroup && botJid) {
         try {
            groupMetadata = await ranuxPro.groupMetadata(from).catch(() => null);
            if (groupMetadata) {
                participants = groupMetadata.participants;
                groupAdmins = await getGroupAdmins(participants);
                isBotAdmins = groupAdmins.includes(botJid);
                isAdmins = groupAdmins.includes(sender);
            }
         } catch {}
      }

      // ================= STATUS FEATURES =================
      if (mek.key.remoteJid === 'status@broadcast') {
        if (config.AUTO_STATUS_SEEN) await ranuxPro.readMessages([mek.key]);
        if (config.AUTO_STATUS_REACT) {
          const emojis = ['🔥', '😎', '💜', '⚡', '💯'];
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          try {
             // Bypass override for status react to avoid errors
             await originalSendMessage.call(ranuxPro, mek.key.participant, { 
                react: { text: randomEmoji, key: mek.key } 
             });
          } catch {}
        }
        
        if (config.AUTO_STATUS_FORWARD && botJid) {
            if (mek.message?.imageMessage || mek.message?.videoMessage) {
              const msgType = mek.message.imageMessage ? "imageMessage" : "videoMessage";
              const mediaMsg = mek.message[msgType];
              const stream = await downloadContentFromMessage(mediaMsg, msgType === "imageMessage" ? "image" : "video");
              let buffer = Buffer.from([]);
              for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
              
              await ranuxPro.sendMessage(botJid, {
                [msgType === "imageMessage" ? "image" : "video"]: buffer,
                caption: `📥 Forwarded Status from @${senderNumber}`,
                mentions: [senderNumber + "@s.whatsapp.net"]
              });
            }
        }
        return;
      }

      // ================= EXECUTE COMMANDS =================
      if (isCmd) {
        const cmd = commands.find((c) => c.pattern === commandName || (c.alias && c.alias.includes(commandName)));
        
        if (cmd) {
          if (cmd.react) await originalSendMessage.call(ranuxPro, from, { react: { text: cmd.react, key: mek.key } });

          try {
            await cmd.function(ranuxPro, mek, m, {
              from, quoted: mek, body, isCmd, command: commandName, args, q,
              isGroup, sender, senderNumber, botNumber, pushname,
              isMe, isOwner, isSudo,
              groupMetadata, participants, groupAdmins, isBotAdmins, isAdmins,
              reply
            });
          } catch (e) {
            console.error(`❌ Error executing ${commandName}:`, e);
            reply("❌ Command Error: " + e.message);
          }
        }
      }

      // ================= REPLY HANDLERS =================
      for (const handler of replyHandlers) {
        if (handler.filter && handler.filter(body, { sender, message: mek })) {
          try {
             await handler.function(ranuxPro, mek, m, {
               from, body, sender, reply, args, q,
               isGroup, isAdmins, isOwner
             });
          } catch (e) {
            console.error("Reply Handler Error:", e);
          }
        }
      }

    } catch (err) {
      console.error("Main Loop Error:", err);
    }
  });

  // ================= MESSAGE UPDATE/DELETE EVENTS =================
  ranuxPro.ev.on('messages.update', async (updates) => {
    if (config.ANTI_DELETE && global.pluginHooks) {
      for (const plugin of global.pluginHooks) {
        if (plugin.onDelete) {
            try { await plugin.onDelete(ranuxPro, updates); } catch {}
        }
      }
    }
  });
}

// ================= EXPRESS SERVER =================
app.get("/", (req, res) => res.send("👑 King RANUX PRO Active ✅"));
app.listen(port, () => console.log(`🌍 Server running on port ${port}`));

// ================= START BOT =================
ensureSessionFile();