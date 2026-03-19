const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require("express");
const app = express();

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const botToken = process.env.BOT_TOKEN;
const stringSession = new StringSession(""); // Empty session for bot

// നിന്റെ റെൻഡർ ഡൊമെയ്ൻ
const domain = "https://fileeetobot.onrender.com";

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({ botAuthToken: botToken });
  console.log("✅ fileeetobot Live ആയി മുത്തേ!");

  // ബോട്ട് മെസ്സേജ് കൈകാര്യം ചെയ്യാൻ
  client.addEventHandler(async (event) => {
    const message = event.message;
    if (message.media) {
      const msgId = message.id;
      const chatId = message.peerId.userId || message.peerId.chatId || message.peerId.channelId;
      
      // ഡയറക്ട് സ്ട്രീം ലിങ്ക് നിർമ്മിക്കുന്നു
      const streamLink = `${domain}/stream/${chatId}/${msgId}`;
      
      await client.sendMessage(message.peerId, {
        message: `🎬 **നിന്റെ ഫയൽ ലിങ്ക് റെഡി!** \n\n🔗 Link: ${streamLink}\n\nഈ ലിങ്ക് നിന്റെ Cinema Zone ആപ്പിൽ പേസ്റ്റ് ചെയ്താൽ മതി.`,
        replyTo: msgId
      });
    }
  });

  // സ്ട്രീമിംഗ് എൻഡ് പോയിന്റ്
  app.get("/stream/:chatId/:msgId", async (req, res) => {
    try {
      const { chatId, msgId } = req.params;
      const messages = await client.getMessages(chatId, { ids: [parseInt(msgId)] });
      
      if (!messages || !messages[0].media) return res.status(404).send("File Not Found");

      const media = messages[0].media;
      const fileSize = media.document ? media.document.size : (media.photo ? media.photo.sizes.pop().size : 0);

      // ബ്രൗസറിന് വീഡിയോ ആണെന്ന് മനസ്സിലാക്കി കൊടുക്കാൻ
      res.writeHead(200, {
        "Content-Type": "video/mp4",
        "Content-Length": fileSize,
        "Accept-Ranges": "bytes",
      });

      // ഫയൽ സ്ട്രീം ചെയ്യുന്നു
      const buffer = await client.downloadMedia(media, {
        workers: 4,
      });
      res.end(buffer);

    } catch (e) {
      console.log(e);
      res.status(500).send("Error streaming file");
    }
  });

})();

app.listen(process.env.PORT || 3000);
