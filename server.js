const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require("express");
const app = express();

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const botToken = process.env.BOT_TOKEN;
const stringSession = new StringSession(""); 

const domain = "fileeetobot.onrender.com";

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({ botAuthToken: botToken });
  console.log("✅ fileeetobot വീണ്ടും പവർ ആയി മുത്തേ!");

  client.addEventHandler(async (event) => {
    const message = event.message;
    const text = message.message;

    // --- 1. സ്റ്റാർട്ട് കമാൻഡ് (/start) ---
    if (text === "/start") {
      await client.sendMessage(message.peerId, {
        message: "ഹലോ മുത്തേ! 🎬\n\nഞാൻ നിന്റെ **Cinema Zone** ആപ്പിലേക്കുള്ള ഫയൽ ലിങ്ക് ജനറേറ്റർ ബോട്ടാണ്. നീ ഏതെങ്കിലും ഒരു വീഡിയോ ഫയൽ ഇങ്ങോട്ട് അയച്ചാൽ ഞാൻ നിനക്ക് അതിന്റെ സ്ട്രീമിംഗ് ലിങ്ക് തരാം.",
      });
      return;
    }

    // --- 2. ഫയൽ ലിങ്ക് ജനറേറ്റർ (Media) ---
    if (message.media) {
      const msgId = message.id;
      const chatId = message.peerId.userId || message.peerId.chatId || message.peerId.channelId;
      
      const streamLink = `https://${domain}/stream/${chatId}/${msgId}`;
      
      await client.sendMessage(message.peerId, {
        message: `🎬 **നിന്റെ വീഡിയോ ലിങ്ക് റെഡി!** \n\n🔗 Link: ${streamLink}\n\nഈ ലിങ്ക് കോപ്പി ചെയ്ത് നിന്റെ ആപ്പിൽ പേസ്റ്റ് ചെയ്തോ!`,
        replyTo: msgId
      });
    }
  });

  // സ്ട്രീമിംഗ് ലോജിക്
  app.get("/stream/:chatId/:msgId", async (req, res) => {
    try {
      const { chatId, msgId } = req.params;
      const messages = await client.getMessages(chatId, { ids: [parseInt(msgId)] });
      
      if (!messages || !messages[0].media) return res.status(404).send("File Not Found");

      const media = messages[0].media;
      const fileSize = media.document ? media.document.size : (media.photo ? media.photo.sizes.pop().size : 0);

      res.writeHead(200, {
        "Content-Type": "video/mp4",
        "Content-Length": fileSize,
        "Accept-Ranges": "bytes",
      });

      const buffer = await client.downloadMedia(media, { workers: 4 });
      res.end(buffer);
    } catch (e) {
      res.status(500).send("Error");
    }
  });

})();

app.listen(process.env.PORT || 3000);
