/**
 * NormAI - Assistente Jurídico e Universitário Inteligente (Offline Interativo)
 * Navegação por números (1,2,3...) e "0" para voltar
 * Autor: Mendes Eduarda
 */

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { MessagingResponse } = require("twilio").twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// === Servir index.html e arquivos estáticos ===
app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// === Estado de cada usuário ===
const userContext = {};

// === MENUS ===
function menuPrincipal() {
  return {
    text: "👋 *Bem-vindo à NormAI!*\n\nEscolha o tipo de informação que deseja:\n1 - 📚 Leis e Regulamentos\n2 - 🎓 Universidade Kimpa Vita\n3 - 🚨 Infrações e Sanções",
  };
}

function menuLeis() {
  return {
    text: "📘 *Leis e Regulamentos (Lex.AO)*\nEscolha uma opção:\n1 - Constituição da República\n2 - Lei da Probidade Pública\n3 - Lei de Base da Educação\n4 - Lei do Investimento Privado\n5 - Lei de Imprensa\n6 - Lei da Família\n7 - Lei de Terras\n\n0 - Voltar",
  };
}

function menuUniversidade() {
  return {
    text: "🎓 *Universidade Kimpa Vita*\nEscolha uma opção:\n1 - Regulamento Académico\n2 - Cursos disponíveis\n3 - Processos de matrícula\n4 - Contactos e horários\n\n0 - Voltar",
  };
}

function menuInfracoes() {
  return {
    text: "🚨 *Infrações e Sanções Académicas*\nEscolha uma categoria:\n1 - Infrações leves\n2 - Infrações graves\n3 - Penalizações e recursos\n\n0 - Voltar",
  };
}

// === CONTEÚDOS ===
const conteudos = {
  "Constituição da República":
    "📘 *Constituição da República de Angola*\nPrincípios fundamentais do Estado, direitos e deveres dos cidadãos, organização dos poderes públicos.",
  "Lei da Probidade Pública":
    "📘 *Lei da Probidade Pública*\nRegula a conduta ética dos servidores públicos e combate à corrupção.",
  "Lei de Base da Educação":
    "📘 *Lei de Base da Educação*\nDefine princípios e objetivos do sistema nacional de ensino.",
  "Lei do Investimento Privado":
    "📘 *Lei do Investimento Privado*\nRegula o investimento nacional e estrangeiro e incentiva o desenvolvimento económico.",
  "Lei de Imprensa":
    "📘 *Lei de Imprensa*\nGarante a liberdade de expressão e regula a atividade jornalística.",
  "Lei da Família":
    "📘 *Lei da Família*\nDefine relações familiares, direitos, deveres e processos de casamento e tutela.",
  "Lei de Terras":
    "📘 *Lei de Terras*\nRegras sobre posse, uso e transmissão de terras.",
  "Regulamento Académico":
    "🎓 *Regulamento Académico da UNIKIV*\nRegras de frequência, avaliações e conduta dos estudantes.",
  "Cursos disponíveis":
    "🎓 *Cursos oferecidos*\nEngenharia Informática, Direito, Economia, e mais.",
  "Processos de matrícula":
    "📝 *Processos de matrícula*\nApresentar BI, certificado e comprovativo de pagamento.",
  "Contactos e horários":
    "📞 *Contactos da UNIKIV*\nEndereço: Uíge, Angola.\nAtendimento: 8h às 15h.\nEmail: info@unikiv.ao",
  "Infrações leves":
    "⚠️ *Infrações leves*\nFaltas leves, atrasos e comportamentos inapropriados.",
  "Infrações graves":
    "🚫 *Infrações graves*\nPlágio, agressão, falsificação de documentos ou fraude académica.",
  "Penalizações e recursos":
    "⚖️ *Penalizações e Recursos*\nAdvertência, suspensão ou expulsão, com direito a recurso.",
};

// === Função para gerar respostas WhatsApp ===
function gerarRespostaWhatsApp(texto) {
  const twiml = new MessagingResponse();
  twiml.message(texto);
  return twiml.toString();
}

// === Lógica principal ===
app.post("/whatsapp", (req, res) => {
  const from = req.body.From || "anon";
  const message = req.body.Body?.trim() || "";
  const estado = userContext[from] || "menu";

  console.log("📩 Mensagem recebida:", message);

  let resposta = {};

  // Voltar ao menu principal
  if (message === "0") {
    userContext[from] = "menu";
    resposta = menuPrincipal();
  } else if (estado === "menu") {
    if (message === "1") {
      userContext[from] = "leis";
      resposta = menuLeis();
    } else if (message === "2") {
      userContext[from] = "universidade";
      resposta = menuUniversidade();
    } else if (message === "3") {
      userContext[from] = "infracoes";
      resposta = menuInfracoes();
    } else {
      resposta = menuPrincipal();
    }
  } else if (
    estado === "leis" ||
    estado === "universidade" ||
    estado === "infracoes"
  ) {
    const opcaoMap = {
      leis: [
        "Constituição da República",
        "Lei da Probidade Pública",
        "Lei de Base da Educação",
        "Lei do Investimento Privado",
        "Lei de Imprensa",
        "Lei da Família",
        "Lei de Terras",
      ],
      universidade: [
        "Regulamento Académico",
        "Cursos disponíveis",
        "Processos de matrícula",
        "Contactos e horários",
      ],
      infracoes: [
        "Infrações leves",
        "Infrações graves",
        "Penalizações e recursos",
      ],
    };

    const escolha = opcaoMap[estado][parseInt(message) - 1];
    if (escolha && conteudos[escolha]) {
      resposta = { text: conteudos[escolha] + "\n\nDigite 0 para voltar." };
      userContext[from] = "submenu";
    } else {
      resposta = { text: "❌ Opção inválida. Digite 0 para voltar." };
    }
  } else if (estado === "submenu" && message === "0") {
    userContext[from] = "menu";
    resposta = menuPrincipal();
  }

  const xml = gerarRespostaWhatsApp(resposta.text || resposta);
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(xml);
});

// === Servidor ===
const PORT = process.env.PORT || 1000;
app.listen(PORT, () =>
  console.log(`🚀 NormAI ativo no Render na porta ${PORT}`)
);
