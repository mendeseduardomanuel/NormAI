const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// ID do chatbot (não usado sem API Key, mas mantido para referência)
const CHATLING_ID = "7673951164";

// Serve arquivos estáticos (index.html, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Rota raiz para garantir que index.html abra
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint do WhatsApp (simulado)
app.post("/whatsapp", (req, res) => {
  const twiml = new MessagingResponse();
  const message = req.body.Body;

  console.log("Mensagem recebida do WhatsApp:", message);

  // Como não há API Key, simulamos a resposta
  let resposta;
  if (
    message.toLowerCase().includes("oi") ||
    message.toLowerCase().includes("olá")
  ) {
    resposta =
      "Olá! Ainda não temos integração completa com Chatling sem API Key, mas seu bot está ativo!";
  } else {
    resposta =
      "Recebi sua mensagem: '" +
      message +
      "'. Em breve, respostas reais estarão disponíveis.";
  }

  twiml.message(resposta);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// Porta dinâmica para Render
const PORT = process.env.PORT || 1000;
app.listen(PORT, () => console.log(`Servidor ativo na porta ${PORT}`));
