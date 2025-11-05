/**
 * NormAI - Assistente Jurídico e Universitário Inteligente
 * Responde via WhatsApp (Twilio) com base nos conteúdos do Lex.AO e da Universidade Kimpa Vita
 */

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const { MessagingResponse } = require("twilio").twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Cache em memória simples
const cache = {};

// Função genérica de scraping
async function buscarConteudo(fonte, termo) {
  try {
    const termoLower = termo.toLowerCase();

    // Verifica cache
    if (cache[fonte] && Date.now() - cache[fonte].time < 1000 * 60 * 30) {
      console.log("🧠 Usando cache para:", fonte);
      return filtrarConteudo(cache[fonte].data, termoLower);
    }

    console.log("🌐 Buscando conteúdo da fonte:", fonte);

    const response = await axios.get(fonte);
    const $ = cheerio.load(response.data);
    const texto = $("body").text();

    // Guarda no cache
    cache[fonte] = { data: texto, time: Date.now() };

    return filtrarConteudo(texto, termoLower);
  } catch (error) {
    console.error("Erro ao buscar conteúdo:", error.message);
    return null;
  }
}

// Função para extrair o trecho mais relevante do texto
function filtrarConteudo(texto, termo) {
  const linhas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  const relevantes = linhas.filter((l) => l.toLowerCase().includes(termo));

  if (relevantes.length === 0) return null;

  // Junta 2 ou 3 frases próximas ao termo
  const resposta = relevantes.slice(0, 3).join(" ");
  return resposta.length > 600 ? resposta.slice(0, 600) + "..." : resposta;
}

// Função principal para processar perguntas
async function responderPergunta(pergunta) {
  const fontes = ["https://lex.ao/docs/intro", "https://unikivi.ed.ao"];

  for (const fonte of fontes) {
    const resultado = await buscarConteudo(fonte, pergunta);
    if (resultado) {
      return `${resultado}\n\n📚 Fonte: NormAI — baseado em Lex.AO e Universidade Kimpa Vita.`;
    }
  }

  return "Ainda não encontrei esta informação no Lex.AO ou no site da Universidade Kimpa Vita, mas estou aprendendo. 📚";
}

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rota raiz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint WhatsApp (Twilio)
app.post("/whatsapp", async (req, res) => {
  const twiml = new MessagingResponse();
  const message = req.body.Body?.trim() || "";

  console.log("📩 Mensagem recebida:", message);

  let resposta;

  if (!message) {
    resposta =
      "Olá! Envie uma pergunta sobre leis ou sobre a Universidade Kimpa Vita.";
  } else if (
    ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite"].includes(
      message.toLowerCase()
    )
  ) {
    resposta =
      "👋 Olá! Eu sou a NormAI, assistente jurídica e universitária. Pergunte-me sobre leis angolanas ou regulamentos da Universidade Kimpa Vita!";
  } else {
    resposta = await responderPergunta(message);
  }

  twiml.message(resposta);
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// Porta dinâmica para Render
const PORT = process.env.PORT || 1000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor NormAI ativo na porta ${PORT}`)
);
