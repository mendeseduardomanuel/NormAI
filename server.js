/**
 * NormAI - Assistente Jurídico e Universitário Inteligente
 * Com suporte a PDFs (leis, regulamentos e documentos acadêmicos)
 * Integração com WhatsApp via Twilio
 */

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const pdfParse = require("pdf-parse"); // ✅ CORRIGIDO
const { MessagingResponse } = require("twilio").twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // ✅ CORRIGIDO

// Cache simples em memória
const cache = {};

// Caminho da pasta onde vais colocar os PDFs
const PDF_DIR = path.join(__dirname, "pdfs");

// Função para ler todos os PDFs da pasta e juntar o conteúdo
async function lerPDFs() {
  const arquivos = fs.existsSync(PDF_DIR) ? fs.readdirSync(PDF_DIR) : [];
  let textoTotal = "";

  for (const arquivo of arquivos) {
    if (arquivo.endsWith(".pdf")) {
      try {
        const dataBuffer = fs.readFileSync(path.join(PDF_DIR, arquivo));
        const texto = (await pdfParse(dataBuffer)).text; // ✅ CORRIGIDO
        textoTotal += `\n\n[${arquivo}]\n${texto}`;
      } catch (erro) {
        console.error(`Erro ao ler PDF ${arquivo}: ${erro.message}`);
      }
    }
  }

  return textoTotal;
}

// Busca conteúdo em sites e PDFs
async function buscarConteudo(fonte, termo) {
  try {
    const termoLower = termo.toLowerCase();

    // Cache de fonte
    if (cache[fonte] && Date.now() - cache[fonte].time < 1000 * 60 * 30) {
      console.log("🧠 Usando cache para:", fonte);
      return filtrarConteudo(cache[fonte].data, termoLower);
    }

    console.log("🌐 Buscando conteúdo da fonte:", fonte);

    const response = await axios.get(fonte, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    const texto = $("body").text();

    cache[fonte] = { data: texto, time: Date.now() };

    return filtrarConteudo(texto, termoLower);
  } catch (error) {
    console.error("Erro ao buscar conteúdo:", error.message);
    return ""; // ✅ EVITA FALHA COMPLETA
  }
}

// Função para filtrar o trecho mais relevante
function filtrarConteudo(texto, termo) {
  const linhas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  const relevantes = linhas.filter((l) => l.toLowerCase().includes(termo));

  if (relevantes.length === 0) return null;

  const resposta = relevantes.slice(0, 3).join(" ");
  return resposta.length > 600 ? resposta.slice(0, 600) + "..." : resposta;
}

// Função principal
async function responderPergunta(pergunta) {
  const termo = pergunta.toLowerCase();
  const fontes = ["https://lex.ao/docs/intro"]; // ✅ EVITAR DOMÍNIO INVÁLIDO

  // 1️⃣ Busca nos sites
  for (const fonte of fontes) {
    const resultado = await buscarConteudo(fonte, termo);
    if (resultado) {
      return `${resultado}\n\n📚 Fonte: Lex.AO / Universidade Kimpa Vita`;
    }
  }

  // 2️⃣ Busca nos PDFs locais
  const textoPDFs = await lerPDFs();
  const respostaPDF = filtrarConteudo(textoPDFs, termo);
  if (respostaPDF) {
    return `${respostaPDF}\n\n📄 Fonte: Documentos PDF da Universidade Kimpa Vita.`;
  }

  return "Ainda não encontrei esta informação no Lex.AO ou nos documentos PDF, mas estou aprendendo. 📚";
}

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Página principal
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

// Porta dinâmica (para Render)
const PORT = process.env.PORT || 1000;
app.listen(PORT, () =>
  console.log(`🚀 NormAI com suporte a PDFs ativo na porta ${PORT}`)
);
