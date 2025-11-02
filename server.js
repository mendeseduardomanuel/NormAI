const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// ID do teu chatbot Chatling
const CHATLING_ID = "4371483852";

app.post("/whatsapp", async (req, res) => {
  const twiml = new MessagingResponse();
  const message = req.body.Body;

  try {
    const response = await axios.post(
      `https://api.chatling.ai/chat/${CHATLING_ID}`,
      {
        message,
      }
    );

    twiml.message(response.data.response || "Desculpa, não consegui entender.");
  } catch (err) {
    twiml.message("Ocorreu um erro ao contactar o assistente.");
  }

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

app.listen(1000, () => console.log("Servidor ativo na porta 1000"));
