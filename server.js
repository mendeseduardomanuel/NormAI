/**
 * NormAI - Assistente Jurídico e Universitário Inteligente
 * Integra WhatsApp (Twilio), Lex.AO e Universidade Kimpa Vita
 */

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const { MessagingResponse } = require("twilio").twiml;

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname)));

const cache = {}; // cache em memória

// 🔍 Função de busca genérica (Lex.AO e Kimpa Vita)
async function buscarConteudo(fonte, termo) {
  try {
    const termoLower = termo.toLowerCase();

    // Cache de 30 min
    if (cache[fonte] && Date.now() - cache[fonte].time < 1800000) {
      console.log("🧠 Cache usado:", fonte);
      return filtrarConteudo(cache[fonte].data, termoLower);
    }

    console.log("🌐 Buscando conteúdo de:", fonte);
    const { data } = await axios.get(fonte);
    const $ = cheerio.load(data);
    const texto = $("body").text();

    cache[fonte] = { data: texto, time: Date.now() };
    return filtrarConteudo(texto, termoLower);
  } catch (err) {
    console.error("⚠️ Erro ao buscar:", fonte, err.message);
    return null;
  }
}

// 📖 Filtra o trecho mais relevante
function filtrarConteudo(texto, termo) {
  const linhas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  const relevantes = linhas.filter((l) => l.toLowerCase().includes(termo));

  if (!relevantes.length) return null;
  const resposta = relevantes.slice(0, 3).join(" ");
  return resposta.length > 600 ? resposta.slice(0, 600) + "..." : resposta;
}

// 🤖 Lógica do agente NormAI
async function responderPergunta(pergunta) {
  const fontes = ["https://lex.ao/docs/intro", "https://unikivi.ed.ao"];

  for (const fonte of fontes) {
    const resultado = await buscarConteudo(fonte, pergunta);
    if (resultado) {
      return `${resultado}\n\n📚 Fonte: NormAI — baseado em Lex.AO e Universidade Kimpa Vita.`;
    }
  }

  return "❌ Não encontrei esta informação no Lex.AO nem no site da Universidade Kimpa Vita. Tente reformular a pergunta. 📘";
}

// 🧾 Endpoint WhatsApp (Twilio)
app.post("/whatsapp", async (req, res) => {
  const twiml = new MessagingResponse();
  const message = req.body.Body?.trim() || "";
  console.log("📩 Mensagem recebida:", message);

  let resposta;

  if (!message) {
    resposta =
      "👋 Olá! Eu sou a NormAI. Pergunte-me sobre leis de Angola ou regulamentos da Universidade Kimpa Vita.";
  } else if (
    ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite"].includes(
      message.toLowerCase()
    )
  ) {
    resposta =
      "👋 Olá! Eu sou a NormAI, assistente jurídica e universitária. Pergunte-me sobre leis ou regulamentos académicos.";
  } else {
    resposta = await responderPergunta(message);
  }

  twiml.message(resposta);
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// 🧾 Endpoint para diplomas
app.get("/api/diplomas", async (req, res) => {
  try {
    const { data } = await axios.get("https://lex.ao/docs/intro");
    const $ = cheerio.load(data);
    const diplomas = [];

    // Captura flexível (mesmo que classes mudem)
    $("a[href*='/docs/']").each((i, el) => {
      if (i < 8) {
        diplomas.push({
          titulo: $(el).text().trim().slice(0, 120),
          link: "https://lex.ao" + $(el).attr("href"),
        });
      }
    });

    res.json(diplomas);
  } catch (error) {
    console.error("Erro ao buscar diplomas:", error.message);
    res.status(500).json({ erro: "Falha ao obter diplomas." });
  }
});

// 🌍 Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🚀 Porta
const PORT = process.env.PORT || 1000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor NormAI ativo na porta ${PORT}`)
);
