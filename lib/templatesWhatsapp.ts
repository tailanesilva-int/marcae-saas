import { montarLinkAgendamento } from "@/lib/links";

export function montarMensagemConviteAgendamento({
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
  const linkAgendamento = montarLinkAgendamento(slugEmpresa);

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