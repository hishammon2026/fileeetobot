const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require("express");
const app = express();

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const botToken = process.env.BOT_TOKEN;
const stringSession = new StringSession(""); 

const domain = "fileeetobot.onrender.com";

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });
  await client.start({ botAuthToken: botToken });
  console.log("✅ fileeetobot Live ആയി മുത്തേ!");

  client.addEventHandler(async (event) => {
    const message = event.message;
    if (message.message === "/start") {
      await client.sendMessage(message.peerId, { message: "വീഡിയോ അയക്കൂ മുത്തേ!" });
    } else if (message.media) {
      // ലളിതമായ ID എടുക്കുന്ന രീതി
      const msgId = message.id;
      const peerId = await client.getPeerId(message.peerId);
      
      const streamLink = `https://${domain}/stream/${peerId}/${msgId}`;
      
      await client.sendMessage(message.peerId, {
        message: `🎬 **ലിങ്ക് റെഡി!** \n\n🔗 Link: ${streamLink}`,
        replyTo: msgId
      });
    }
  });

  app.get("/stream/:peerId/:msgId", async (req, res) => {
    try {
      const { peerId, msgId } = req.params;
      
      // മെസ്സേജ് തിരയുന്നു
      const messages = await client.getMessages(peerId, { ids: [parseInt(msgId)] });
      
      if (!messages || messages.length === 0 || !messages[0].media) {
        return res.status(404).send("ഫയൽ കണ്ടെത്താനായില്ല മുത്തേ!");
      }

      const media = messages[0].media;
      
      res.writeHead(200, {
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
      });

      const stream = client.iterDownload({
        file: media,
        requestSize: 1024 * 512,
      });

      for await (const chunk of stream) {
        res.write(chunk);
      }
      res.end();

    } catch (e) {
      console.error(e);
      res.status(500).send("Streaming Error");
    }
  });
})();

app.listen(process.env.PORT || 3000);
