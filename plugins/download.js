const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

const FOOTER = `

━━━━━━━━━━━━━━━━━━━━━━
👑 King RANUX PRO
𝓜𝓪𝓭𝓮 𝓑𝔂 𝓜𝓡. 𝓡𝓪𝓷𝓼𝓪𝓻𝓪 𝓓𝓮𝓿𝓷𝓪𝓽𝓱
━━━━━━━━━━━━━━━━━━━━━━
`;

cmd({
  pattern: "fetch",
  alias: ["download", "downurl", "gdrive", "mediafire"],
  desc: "Universal file downloader (Direct / MediaFire / Google Drive)",
  category: "tools",
  react: "📥",
  filename: __filename
}, async (bot, mek, m, { from, args, q, reply }) => {

  const url = q || args[0];
  if (!url) {
    return reply(
`📦 *KING RANUX PRO – UNIVERSAL DOWNLOADER*

Supported:
.fetch / .download / .downurl
.gdrive / .mediafire

Example:
.fetch https://example.com/file.zip
.mediafire https://mediafire.com/file/xxx
.gdrive https://drive.google.com/file/d/ID/view
${FOOTER}`
    );
  }

  let finalUrl = url;
  let fileName = "file";

  try {
    // ================= MEDIAFIRE =================
    if (url.includes("mediafire.com")) {
      const res = await axios.get(url);
      const $ = cheerio.load(res.data);
      finalUrl = $("#downloadButton").attr("href");
      fileName = $(".filename").text().trim() || "mediafire_file";
    }

    // ================= GOOGLE DRIVE =================
    if (url.includes("drive.google.com")) {
      const idMatch = url.match(/\/d\/(.*?)\//);
      if (idMatch) {
        const fileId = idMatch[1];
        finalUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        fileName = "gdrive_file";
      }
    }

    await bot.sendMessage(from, {
      react: { text: "⏳", key: mek.key }
    });

    // ================= FILE SIZE + REAL NAME =================
    let sizeMB = null;
    try {
      const head = await axios.head(finalUrl);
      const size = parseInt(head.headers["content-length"] || 0);
      sizeMB = (size / 1024 / 1024).toFixed(2);

      // real filename from header
      const disposition = head.headers["content-disposition"];
      if (disposition && disposition.includes("filename=")) {
        fileName = disposition
          .split("filename=")[1]
          .replace(/"/g, "")
          .trim();
      } else {
        // fallback from URL
        try {
          fileName = path.basename(new URL(finalUrl).pathname) || fileName;
        } catch {}
      }

    } catch {}

    // ================= TOO LARGE =================
    if (sizeMB && sizeMB > 2100) {
      return reply(
`⚠️ *FILE TOO LARGE*

📊 Size: ${sizeMB} MB
WhatsApp limit exceeded!

⬇️ Direct Link:
${finalUrl}

💡 Use IDM / ADM / Browser
${FOOTER}`
      );
    }

    // ================= DOWNLOAD STREAM =================
    const response = await axios({
      url: finalUrl,
      method: "GET",
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const contentType = response.headers["content-type"];
    const ext = contentType?.includes("/")
      ? "." + contentType.split("/")[1].split(";")[0]
      : "";

    if (!fileName.endsWith(ext)) {
      fileName = fileName + ext;
    }

    const tempDir = path.join(__dirname, "../temp");
    await fs.ensureDir(tempDir);

    const filePath = path.join(tempDir, fileName);
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((res, rej) => {
      writer.on("finish", res);
      writer.on("error", rej);
    });

    await bot.sendMessage(
      from,
      {
        document: { url: filePath },
        fileName,
        mimetype: contentType || "application/octet-stream",
        caption:
`📦 *File Downloaded Successfully*

📄 Name: ${fileName}
📊 Size: ${sizeMB || "Unknown"} MB
🚀 Sent via WhatsApp

${FOOTER}`
      },
      { quoted: mek }
    );

    await bot.sendMessage(from, {
      react: { text: "✅", key: mek.key }
    });

    // cleanup
    setTimeout(() => {
      try { fs.unlinkSync(filePath); } catch {}
    }, 15000);

  } catch (err) {
    console.log("SUPDL ERROR:", err.message);
    reply(
`❌ *Download Failed*

Possible reasons:
• Invalid link
• Expired link
• Server blocked

${FOOTER}`
    );
  }
});
