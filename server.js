const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// ID do teu chatbot Chatling (atualizado)
const CHATLING_ID = "7673951164";

app.post("/whatsapp", async (req, res) => {
  const twiml = new MessagingResponse();
  const message = req.body.Body;

  console.log("Mensagem recebida do WhatsApp:", message);

  try {
    const response = await axios.post(
      `https://api.chatling.ai/chat/${CHATLING_ID}`,
      { message }
      // Se houver API Key, adicione aqui:
      // , { headers: { 'Authorization': 'Bearer SUA_API_KEY_AQUI' } }
    );

    console.log("Resposta do Chatling:", response.data);

    twiml.message(response.data.response || "Desculpa, não consegui entender.");
  } catch (err) {
    console.error(
      "Erro ao contactar o Chatling:",
      err.response?.data || err.message
    );
    twiml.message("Ocorreu um erro ao contactar o assistente.");
  }

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// Porta dinâmica para Render ou fallback local
const PORT = process.env.PORT || 1000;
app.listen(PORT, () => console.log(`Servidor ativo na porta ${PORT}`));
