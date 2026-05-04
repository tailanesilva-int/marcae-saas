import { getPublicBaseUrl } from "@/lib/links";

type DadosMensagemWhatsapp = {
  nomeCliente: string;
  nomeServico: string;
  nomeEmpresa: string;
  data: string;
  horario: string;
  valorPago?: number | null;

  slugEmpresa: string;
  whatsappEmpresa?: string | null;
  enderecoEmpresa?: string | null;
};

export function montarMensagemConfirmacao({
  nomeCliente,
  nomeServico,
  nomeEmpresa,
  data,
  horario,
  valorPago,
  slugEmpresa,
  whatsappEmpresa,
  enderecoEmpresa,
}: DadosMensagemWhatsapp) {
  const valorFormatado =
    valorPago !== undefined && valorPago !== null
      ? valorPago.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      : null;

  // 🔥 AGORA DINÂMICO (domínio central)
  const baseUrl = getPublicBaseUrl();
  const linkAgendamento = `${baseUrl}/agendar/${slugEmpresa}`;

  return `Olá, ${nomeCliente}! 😊

✨ *Seu agendamento foi confirmado com sucesso!*

📌 *Serviço:* ${nomeServico}
🏢 *Empresa:* ${nomeEmpresa}
📅 *Data:* ${data}
⏰ *Horário:* ${horario}
${valorFormatado ? `💳 *Valor pago:* ${valorFormatado}\n` : ""}

🔗 *Agende novamente de forma rápida:*
${linkAgendamento}

📍 *Endereço:* ${enderecoEmpresa || "Não informado"}
📲 *WhatsApp:* ${whatsappEmpresa || "Não informado"}

💬 Qualquer dúvida, estamos à disposição!

Obrigado pela preferência 💜
Até breve! 🚀`;
}

/* =========================
   🔔 LEMBRETE AUTOMÁTICO
========================= */
export function montarMensagemLembrete({
  nomeCliente,
  nomeServico,
  nomeEmpresa,
  data,
  horario,
  slugEmpresa,
}: DadosMensagemWhatsapp) {
  const baseUrl = getPublicBaseUrl();
  const linkAgendamento = `${baseUrl}/agendar/${slugEmpresa}`;

  return `Olá, ${nomeCliente}! 😊

⏰ *Lembrete do seu agendamento*

Você tem um horário agendado hoje:

📌 *Serviço:* ${nomeServico}
🏢 *Empresa:* ${nomeEmpresa}
📅 *Data:* ${data}
⏰ *Horário:* ${horario}

🔗 Precisa reagendar? Acesse:
${linkAgendamento}

Nos vemos em breve! 💜`;
}

/* =========================
   📢 MENSAGEM PADRÃO (LINK)
========================= */
export function montarMensagemConvite({
  nomeEmpresa,
  slugEmpresa,
  whatsappEmpresa,
  enderecoEmpresa,
}: {
  nomeEmpresa: string;
  slugEmpresa: string;
  whatsappEmpresa?: string | null;
  enderecoEmpresa?: string | null;
}) {
  const baseUrl = getPublicBaseUrl();
  const linkAgendamento = `${baseUrl}/agendar/${slugEmpresa}`;

  return `Olá! 😊

✨ *Agende seu horário online agora mesmo!*

🏢 *${nomeEmpresa}*

🔗 Clique no link para agendar:
${linkAgendamento}

📍 *Endereço:* ${enderecoEmpresa || "Não informado"}
📲 *WhatsApp:* ${whatsappEmpresa || "Não informado"}

⚡ Rápido, prático e online!

Esperamos você 💜`;
}

/* =========================
   🚀 ENVIO WHATSAPP
========================= */
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

type EnviarWhatsappParams = {
  instance: string;
  numero: string;
  mensagem: string;
};

export async function enviarWhatsapp({
  instance,
  numero,
  mensagem,
}: EnviarWhatsappParams) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    throw new Error("Configuração da Evolution API ausente.");
  }

  if (!instance) {
    throw new Error("Instância do WhatsApp não informada.");
  }

  const numeroLimpo = numero.replace(/\D/g, "");

  const response = await fetch(
    `${EVOLUTION_API_URL}/message/sendText/${instance}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: numeroLimpo,
        text: mensagem,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro Evolution API:", data);
    throw new Error("Erro ao enviar WhatsApp.");
  }

  return data;
}