const { cmd } = require("../command");
const translate = require("@vitalets/google-translate-api");

cmd(
  {
    pattern: "tr",
    alias: ["translate"],
    react: "🌐",
    desc: "Translate text to target language",
    category: "tools",
    filename: __filename,
  },
  async (
    ranuxPro,
    mek,
    m,
    {
      from,
      quoted,
      body,
      isCmd,
      command,
      args,
      q,
      reply,
    }
  ) => {
    try {
      if (!q) return reply("*Please provide text and target language code!*\n\n_Example: .tr en ඔබට කෙසේද?_ 🌍");

      const [lang, ...textArray] = q.trim().split(" ");
      if (!lang || textArray.length === 0) {
        return reply("*Invalid format!*\n_Use:_ *.tr en ඔබට කෙසේද?_ ✨");
      }

      const text = textArray.join(" ");
      const result = await translate(text, { to: lang });

      const response = `
🌐 *TRANSLATION RESULT* 🌐
────────────────────
📤 *Original*: ${text}
📥 *Translated (${lang})*: ${result.text}
🔄 *Detected Lang*: ${result.from.language.iso}
      `;

      return reply(response);
    } catch (error) {
      console.error(error);
      reply("*Translation failed! Please check your input or try again later.* ❌");
    }
  }
);