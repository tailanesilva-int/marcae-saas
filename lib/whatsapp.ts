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
   💰 WHATSAPP FINANCEIRO SAAS
========================= */
type DadosMensagemFinanceira = {
  nomeEmpresa: string;
  plano?: string | null;
  valor?: number | null;
  vencimento?: string | null;
  diasAtraso?: number | null;
  linkPagamento?: string | null;
};

function formatarPlano(plano?: string | null) {
  const normalizado = String(plano || '').toLowerCase();

  if (normalizado === 'basico') return 'Básico';
  if (normalizado === 'plus') return 'Plus';
  if (normalizado === 'premium') return 'Premium';
  if (normalizado === 'trial') return 'Trial';

  return plano || 'Plano Marcaê';
}

function formatarValor(valor?: number | null) {
  if (valor === undefined || valor === null || Number.isNaN(Number(valor))) {
    return null;
  }

  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function montarRodapeFinanceiro(linkPagamento?: string | null) {
  const baseUrl = getPublicBaseUrl();
  const linkAdmin = `${baseUrl}/admin`;

  if (linkPagamento) {
    return `💳 *Regularizar agora:*
${linkPagamento}`;
  }

  return `🔗 *Acesse seu painel:*
${linkAdmin}`;
}

export function montarMensagemLembreteFinanceiro({
  nomeEmpresa,
  plano,
  valor,
  vencimento,
  linkPagamento,
}: DadosMensagemFinanceira) {
  const valorFormatado = formatarValor(valor);

  return `Olá! 😊

💜 *Lembrete financeiro Marcaê*

A assinatura da empresa *${nomeEmpresa}* está próxima do vencimento.

📌 *Plano:* ${formatarPlano(plano)}
${valorFormatado ? `💰 *Valor:* ${valorFormatado}\n` : ''}📅 *Vencimento:* ${vencimento || 'Não informado'}

${montarRodapeFinanceiro(linkPagamento)}

Se o pagamento já foi realizado ou a cobrança recorrente estiver ativa, pode desconsiderar esta mensagem.

Equipe Marcaê 🚀`;
}

export function montarMensagemPagamentoRecusado({
  nomeEmpresa,
  plano,
  valor,
  vencimento,
  linkPagamento,
}: DadosMensagemFinanceira) {
  const valorFormatado = formatarValor(valor);

  return `Olá! 😊

⚠️ *Pagamento não aprovado*

Não conseguimos confirmar a cobrança da assinatura da empresa *${nomeEmpresa}*.

📌 *Plano:* ${formatarPlano(plano)}
${valorFormatado ? `💰 *Valor:* ${valorFormatado}\n` : ''}📅 *Vencimento:* ${vencimento || 'Não informado'}

Para evitar bloqueio de acesso, regularize sua assinatura:

${montarRodapeFinanceiro(linkPagamento)}

Se precisar de ajuda, fale com o suporte do Marcaê. 💜`;
}

export function montarMensagemAvisoBloqueioAutomatico({
  nomeEmpresa,
  plano,
  valor,
  vencimento,
  diasAtraso,
  linkPagamento,
}: DadosMensagemFinanceira) {
  const valorFormatado = formatarValor(valor);

  return `Olá! 😊

🚨 *Aviso de pendência financeira*

A assinatura da empresa *${nomeEmpresa}* está com pagamento pendente.

📌 *Plano:* ${formatarPlano(plano)}
${valorFormatado ? `💰 *Valor:* ${valorFormatado}\n` : ''}📅 *Vencimento:* ${vencimento || 'Não informado'}
⏳ *Dias em atraso:* ${diasAtraso || 0}

Para manter o acesso ao sistema ativo, regularize sua assinatura:

${montarRodapeFinanceiro(linkPagamento)}

Equipe Marcaê 💜`;
}

export function montarMensagemBloqueioAutomatico({
  nomeEmpresa,
  plano,
  valor,
  vencimento,
  diasAtraso,
  linkPagamento,
}: DadosMensagemFinanceira) {
  const valorFormatado = formatarValor(valor);

  return `Olá! 😊

🔒 *Acesso bloqueado temporariamente*

A empresa *${nomeEmpresa}* foi bloqueada automaticamente por pendência financeira.

📌 *Plano:* ${formatarPlano(plano)}
${valorFormatado ? `💰 *Valor:* ${valorFormatado}\n` : ''}📅 *Vencimento:* ${vencimento || 'Não informado'}
⏳ *Dias em atraso:* ${diasAtraso || 0}

Após a regularização, o sistema poderá ser reativado automaticamente pelo financeiro do Marcaê.

${montarRodapeFinanceiro(linkPagamento)}

Equipe Marcaê 💜`;
}

export function montarMensagemPagamentoAprovadoFinanceiro({
  nomeEmpresa,
  plano,
  valor,
  vencimento,
}: DadosMensagemFinanceira) {
  const valorFormatado = formatarValor(valor);

  return `Olá! 😊

✅ *Pagamento confirmado com sucesso!*

A assinatura da empresa *${nomeEmpresa}* foi regularizada.

📌 *Plano:* ${formatarPlano(plano)}
${valorFormatado ? `💰 *Valor:* ${valorFormatado}\n` : ''}📅 *Próxima cobrança:* ${vencimento || 'Não informado'}

Seu acesso segue ativo normalmente. Bora vender muito com o Marcaê! 🚀💜`;
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
