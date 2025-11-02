import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/whatsapp", (req, res) => {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();
  const msg = req.body.Body.toLowerCase();

  let resposta = "👋 Olá! Eu sou o *NormAI*, seu assistente virtual.\n\n";
  resposta += "Escolha uma opção:\n";
  resposta += "1️⃣ Férias\n";
  resposta += "2️⃣ Salário\n";
  resposta += "3️⃣ Contato humano";

  if (msg.includes("1"))
    resposta =
      "📘 Segundo o Decreto nº 10/20, o período de férias é de 30 dias.";
  else if (msg.includes("2"))
    resposta = "💰 O Decreto nº 12/21 define o salário mínimo nacional.";
  else if (msg.includes("3"))
    resposta = "📞 Um agente humano entrará em contato em breve.";

  twiml.message(resposta);
  res.type("text/xml").send(twiml.toString());
});

app.listen(3000, () => console.log("✅ NormAI ativo no WhatsApp via Twilio"));
