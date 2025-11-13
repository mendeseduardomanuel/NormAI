/**
 * NormAI - Assistente Jurídico e Universitário Inteligente (Botões Interativos)
 * Autor: Mendes Eduarda
 * Pronto para Render + index.html
 */

const express = require("express");
const bodyParser = require("body-parser");
const { MessagingResponse } = require("twilio").twiml;
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// === Estado de cada usuário ===
const userContext = {};

// === MENUS ===
function menuPrincipal() {
  return {
    text: "👋 *Bem-vindo à NormAI!*\nEscolha o tipo de informação:",
    buttons: [
      { id: "leis", title: "📚 Leis e Regulamentos" },
      { id: "universidade", title: "🎓 Universidade Kimpa Vita" },
      { id: "infracoes", title: "🚨 Infrações e Sanções" },
    ],
  };
}

function menuLeis() {
  return {
    text: "📘 *Leis e Regulamentos*\nSelecione um diploma:",
    buttons: [
      { id: "Constituição da República", title: "Constituição da República" },
      { id: "Lei da Probidade Pública", title: "Lei da Probidade Pública" },
      { id: "Lei de Base da Educação", title: "Lei de Base da Educação" },
      { id: "Lei do Investimento Privado", title: "Lei do Investimento Privado" },
      { id: "⬅️ Voltar", title: "⬅️ Voltar" },
    ],
  };
}

function menuUniversidade() {
  return {
    text: "🎓 *Universidade Kimpa Vita*\nEscolha uma opção:",
    buttons: [
      { id: "Regulamento Académico", title: "Regulamento Académico" },
      { id: "Cursos disponíveis", title: "Cursos disponíveis" },
      { id: "Processos de matrícula", title: "Processos de matrícula" },
      { id: "Contactos e horários", title: "Contactos e horários" },
      { id: "⬅️ Voltar", title: "⬅️ Voltar" },
    ],
  };
}

function menuInfracoes() {
  return {
    text: "🚨 *Infrações e Sanções Académicas*\nSelecione uma categoria:",
    buttons: [
      { id: "Infrações leves", title: "Infrações leves" },
      { id: "Infrações graves", title: "Infrações graves" },
      { id: "Penalizações e recursos", title: "Penalizações e recursos" },
      { id: "⬅️ Voltar", title: "⬅️ Voltar" },
    ],
  };
}

// === CONTEÚDOS ===
const conteudos = {
  "Constituição da República":
    "📘 *Constituição da República de Angola*\nPrincípios fundamentais do Estado, direitos e deveres dos cidadãos, e organização dos poderes públicos.",
  "Lei da Probidade Pública":
    "📘 *Lei da Probidade Pública*\nRegula conduta ética e combate à corrupção.",
  "Lei de Base da Educação":
    "📘 *Lei de Base da Educação*\nDefine princípios e objetivos do sistema nacional de ensino.",
  "Lei do Investimento Privado":
    "📘 *Lei do Investimento Privado*\nRegula investimentos nacionais e estrangeiros.",
  "Regulamento Académico":
    "🎓 *Regulamento Académico UNIKIV*\nRegras de frequência, avaliações e conduta dos estudantes.",
  "Cursos disponíveis":
    "🎓 *Cursos oferecidos*\nEngenharia Informática, Direito, Economia, Enfermagem, Psicologia, Educação e mais.",
  "Processos de matrícula":
    "📝 *Processos de matrícula*\nDocumentos necessários: BI, certificado de habilitações e comprovativo de pagamento.",
  "Contactos e horários":
    "📞 *Contactos da Universidade Kimpa Vita*\nEndereço: Uíge, Angola\nAtendimento: 8h às 15h\nEmail: info@unikiv.ao",
  "Infrações leves":
    "⚠️ *Infrações leves*\nFaltas leves, atrasos, comportamentos inapropriados.",
  "Infrações graves":
    "🚫 *Infrações graves*\nPlágio, agressão, falsificação de documentos.",
  "Penalizações e recursos":
    "⚖️ *Penalizações*\nDe advertência até expulsão, com direito a recurso.",
};

// === Função para gerar resposta com botões interativos ===
function gerarRespostaWhatsApp(menu) {
  const twiml = new MessagingResponse();

  const message = twiml.message();
  message.body(menu.text);

  if (menu.buttons && menu.buttons.length > 0) {
    const interactive = {
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: menu.text },
        action: {
          buttons: menu.buttons.map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    };
    message.addChild("Message", {}, interactive);
  }

  return twiml.toString();
}

// === Endpoint WhatsApp ===
app.post("/whatsapp", (req, res) => {
  const from = req.body.From || "anon";
  const message = req.body.Body?.trim() || "";
  const estado = userContext[from] || "menu";

  console.log("📩 Mensagem recebida:", message);

  let resposta;

  if (message === "⬅️ Voltar" || message === "menu") {
    userContext[from] = "menu";
    resposta = menuPrincipal();
  } else if (estado === "menu") {
    if (message === "leis") {
      userContext[from] = "leis";
      resposta = menuLeis();
    } else if (message === "universidade") {
      userContext[from] = "universidade";
      resposta = menuUniversidade();
    } else if (message === "infracoes") {
      userContext[from] = "infracoes";
      resposta = menuInfracoes();
    } else {
      resposta = menuPrincipal();
    }
  } else if (estado === "leis" || estado === "universidade" || estado === "infracoes") {
    if (message === "⬅️ Voltar") {
      userContext[from] = "menu";
      resposta = menuPrincipal();
    } else if (conteudos[message]) {
      userContext[from] = "submenu";
      resposta = { text: conteudos[message] + "\n\nClique em '⬅️ Voltar' para voltar ao menu." };
    } else {
      resposta = { text: "❓ Opção inválida. Clique em '⬅️ Voltar'." };
    }
  } else if (estado === "submenu" && message === "⬅️ Voltar") {
    userContext[from] = "menu";
    resposta = menuPrincipal();
  }

  const xml = gerarRespostaWhatsApp(resposta);
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(xml);
});

// === Servir index.html e arquivos estáticos ===
app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
// === Servidor ===
const PORT = process.env.PORT || 1000;
app.listen(PORT, () =>
  console.log(`🚀 NormAI com botões interativos ativo no Render na porta ${PORT}`)
);
