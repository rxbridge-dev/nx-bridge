const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers,
  downloadContentFromMessage,
  makeInMemoryStore,
  delay
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

// ===== CONFIGURATIONS =====
const WELCOME_TARGET_NUMBER = "94726880784"; // Owner Number for Connect Msg

// ===== GLOBAL ERROR HANDLING =====
const logFilter = (err) => {
    const msg = String(err);
    if (msg.includes("pending-key") || 
        msg.includes("rate-overlimit") || 
        msg.includes("Conflict") ||
        msg.includes("not-authorized") ||
        msg.includes("Socket connection timeout") ||
        msg.includes("Stream Errored")) {
        return true; 
    }
    return false;
};

process.on("uncaughtException", (err) => {
  if (!logFilter(err)) console.error("❌ Uncaught Exception:", err);
});
process.on("unhandledRejection", (err) => {
  if (!logFilter(err)) console.error("❌ Unhandled Rejection:", err);
});

// ===== SYSTEM CONSTANTS =====
const app = express();
const port = process.env.PORT || 8000;
const credsPath = path.join(__dirname, '/auth_info_baileys/creds.json');

// Dynamic Owner Setup
let ownerConfig = config.OWNER_NUMBER || '94726880784';
const ownerNumber = Array.isArray(ownerConfig) ? ownerConfig : [ownerConfig];
const MASTER_SUDO = ownerNumber; 

// ===== ANTI DELETE PLUGIN SETUP =====
const antiDeletePlugin = require('./plugins/antidelete.js');
global.pluginHooks = global.pluginHooks || [];
global.pluginHooks.push(antiDeletePlugin);

// ================= SESSION RESTORE (STABLE HYBRID METHOD) =================
async function ensureSessionFile() {
  if (!fs.existsSync(credsPath)) {
    if (!config.SESSION_ID) {
      console.error('❌ SESSION_ID is missing in config.js');
      process.exit(1);
    }

    // 1. Try Base64 Decoding First (Most Stable)
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

    // 2. Fallback to MEGA (Test Bot Method)
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
    await ranuxPro.newsletterFollow(meta.id);
  } catch (e) {}
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

  // ===== CONNECTION EVENTS =====
  ranuxPro.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        connectToWA();
      } else {
        console.log("❌ Session logged out. Please rescan.");
        process.exit(1);
      }
    } else if (connection === 'open') {
      console.log('✅ King RANUX PRO Connected!');

      // --- 1. SEND WELCOME MESSAGE (Test Bot Style) ---
      const botJid = jidNormalizedUser(ranuxPro.user.id);
      const targetJid = WELCOME_TARGET_NUMBER + "@s.whatsapp.net";
      
      const upMsg = `👑 *King RANUX PRO Connected* ✅\n\nPrefix: ${config.PREFIX || "."}\nMode: ${config.MODE || "Public"}`;
      
      await ranuxPro.sendMessage(targetJid, {
        image: { url: config.ALIVE_IMG },
        caption: upMsg
      }).catch((e) => console.log("⚠️ Welcome Msg Error:", e.message));

      // --- 2. LOAD PLUGINS (Test Bot Style) ---
      const pluginPath = path.join(__dirname, "plugins");
      if (fs.existsSync(pluginPath)) {
        fs.readdirSync(pluginPath).forEach((plugin) => {
          if (plugin.endsWith(".js")) {
            try {
              require(path.join(pluginPath, plugin));
            } catch (e) {
              console.error(`❌ Plugin Error: ${plugin}`, e.message);
            }
          }
        });
        console.log("🧩 Plugins Loaded Successfully.");
      }

      // --- 3. AUTO FOLLOW ---
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
      if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return; 

      mek.message = getContentType(mek.message) === 'ephemeralMessage'
        ? mek.message.ephemeralMessage.message
        : mek.message;

      // Basic Info Extraction
      const from = mek.key.remoteJid;
      const isGroup = from.endsWith('@g.us');
      const botJid = jidNormalizedUser(ranuxPro.user.id);
      const botNumber = botJid.split(':')[0];
      
      const sender = mek.key.fromMe ? botJid : (mek.key.participant || mek.key.remoteJid);
      const senderNumber = sender.split('@')[0];
      const pushname = mek.pushName || 'User';

      const isMe = botNumber.includes(senderNumber);
      const isOwner = ownerNumber.includes(senderNumber) || isMe;
      const isSudo = MASTER_SUDO.includes(senderNumber);

      // ================= PLUGIN HOOKS (Anti-Delete) =================
      if (global.pluginHooks) {
        for (const plugin of global.pluginHooks) {
          if (plugin.onMessage) try { await plugin.onMessage(ranuxPro, mek); } catch {}
        }
      }

      // ================= STATUS HANDLER (FROM TEST BOT - STABLE) =================
      if (mek.key.remoteJid === 'status@broadcast') {
          const participant = mek.key.participant || mek.key.remoteJid;
          
          // 1. Auto Seen
          if (config.AUTO_STATUS_SEEN) {
              try { await ranuxPro.readMessages([mek.key]); } catch {}
          }

          // 2. Auto React
          if (config.AUTO_STATUS_REACT) {
              const emojis = ['❤️', '🔥', '😎', '💯', '🥰', '🌸', '🕊️', '✨'];
              const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
              try {
                  await ranuxPro.sendMessage(participant, {
                      react: { text: randomEmoji, key: mek.key }
                  });
              } catch {}
          }

          // 3. Auto Forward (Split Logic from Test Bot)
          if (config.AUTO_STATUS_FORWARD && botJid) {
              // Text Status
              if (mek.message?.extendedTextMessage && !mek.message.imageMessage && !mek.message.videoMessage) {
                  const text = mek.message.extendedTextMessage.text || "";
                  if (text.trim().length > 0) {
                      await ranuxPro.sendMessage(botJid, {
                          text: `📝 *Text Status*\n👤 From: @${participant.split("@")[0]}\n\n${text}`,
                          mentions: [participant]
                      });
                  }
              }
              // Media Status
              else if (mek.message?.imageMessage || mek.message?.videoMessage) {
                  const msgType = mek.message.imageMessage ? "imageMessage" : "videoMessage";
                  const mediaMsg = mek.message[msgType];
                  const stream = await downloadContentFromMessage(mediaMsg, msgType === "imageMessage" ? "image" : "video");
                  let buffer = Buffer.from([]);
                  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                  
                  const caption = mediaMsg.caption || "";
                  await ranuxPro.sendMessage(botJid, {
                      [msgType === "imageMessage" ? "image" : "video"]: buffer,
                      caption: `📥 *Forwarded Status*\n👤 From: @${participant.split("@")[0]}\n\n${caption}`,
                      mentions: [participant]
                  });
              }
          }
          return;
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

      // ================= EXECUTE COMMANDS =================
      if (isCmd) {
        const cmd = commands.find((c) => c.pattern === commandName || (c.alias && c.alias.includes(commandName)));
        
        if (cmd) {
          if (cmd.react) await ranuxPro.sendMessage(from, { react: { text: cmd.react, key: mek.key } });

          try {
            await cmd.function(ranuxPro, mek, m, {
              from, quoted: mek, body, isCmd, command: commandName, args, q,
              isGroup, sender, senderNumber, botNumber, pushname,
              isMe, isOwner, isSudo,
              groupMetadata, participants, groupAdmins, isBotAdmins, isAdmins,
              reply
            });
          } catch (e) {
            console.error(`❌ Error executing ${commandName}:`, e.message);
            reply("❌ Command Error: " + e.message);
          }
        }
      }

      // ================= REPLY HANDLERS (FROM TEST BOT - NUMBER REPLY) =================
      for (const handler of replyHandlers) {
        if (handler.filter && handler.filter(body, { sender, message: mek })) {
          try {
             await handler.function(ranuxPro, mek, m, {
               from, body, sender, reply, args, q,
               isGroup, isAdmins, isOwner
             });
             break; // Stop loop once handled (Standard practice)
          } catch (e) {
            console.error("Reply Handler Error:", e);
          }
        }
      }

    } catch (err) {}
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