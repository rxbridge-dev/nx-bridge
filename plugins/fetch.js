const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  name: "fetch",
  alias: ["grab", "getfile"],
  desc: "Download files from direct link / MediaFire / Google Drive / Dropbox",
  category: "tools",

  async run({ sock, m, args, reply }) {
    if (!args[0]) {
      return reply(
`❌ File URL එකක් දෙන්න!

Examples:
.fetch https://www.mediafire.com/file/xxx/file.mp4
.fetch https://drive.google.com/file/d/ID/view
.fetch https://example.com/bigfile.zip`
      );
    }

    const url = args[0];
    let finalUrl = url;
    let fileName = "file";

    try {
      // ================= MEDIAFIRE =================
      if (url.includes("mediafire.com")) {
        const res = await axios.get(url);
        const $ = cheerio.load(res.data);
        finalUrl = $("#downloadButton").attr("href");
        fileName = $(".filename").text().trim() || "mediafire_file";

        if (!finalUrl) {
          return reply("❌ MediaFire direct link not found.");
        }
      }

      // ================= GOOGLE DRIVE =================
      if (url.includes("drive.google.com")) {
        const idMatch = url.match(/\/d\/(.*?)\//);
        if (idMatch) {
          const fileId = idMatch[1];
          finalUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
      }

      // ================= DROPBOX =================
      if (url.includes("dropbox.com")) {
        finalUrl = url.replace("?dl=0", "?dl=1");
      }

      reply("📥 Downloading file...\nPlease wait...");

      const response = await axios({
        url: finalUrl,
        method: "GET",
        responseType: "stream",
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const contentType = response.headers["content-type"];
      const ext = contentType?.includes("/")
        ? "." + contentType.split("/")[1].split(";")[0]
        : "";

      fileName = fileName + ext;

      const tempDir = path.join(__dirname, "../temp");
      await fs.ensureDir(tempDir);

      const filePath = path.join(tempDir, fileName);
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

      await sock.sendMessage(
        m.chat,
        {
          document: { url: filePath },
          fileName: fileName,
          mimetype: contentType || "application/octet-stream",
          caption:
`📦 *File Downloaded Successfully*

📄 Name: ${fileName}
📊 Size: ${sizeMB} MB

👑 King RANUX PRO`
        },
        { quoted: m }
      );

      // cleanup
      setTimeout(() => {
        try { fs.unlinkSync(filePath); } catch {}
      }, 15000);

    } catch (err) {
      console.log("Fetch error:", err.message);
      reply("❌ Download failed. Link invalid, expired, or file too large.");
    }
  }
};