import { getPublicBaseUrl } from '@/lib/links';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function buscarAgendamento(id: string) {
  const baseUrl = getPublicBaseUrl();

  const response = await fetch(`${baseUrl}/api/agendamentos/${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.agendamento;
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
  }).format(new Date(data));
}

function formatarHora(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data));
}

function limparTelefone(telefone?: string | null) {
  return String(telefone || '').replace(/\D/g, '');
}

function textoStatus(status?: string | null) {
  if (!status) return 'Pendente';

  const mapa: Record<string, string> = {
    pendente: 'Pendente',
    confirmado: 'Confirmado',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  };

  return mapa[status] || status;
}

function textoPagamento(status?: string | null, exigePrePagamento?: boolean) {
  if (!exigePrePagamento) return 'Sem pré-pagamento';
  if (!status) return 'Pendente';

  const mapa: Record<string, string> = {
    pendente: 'Pendente',
    aguardando: 'Aguardando pagamento',
    aprovado: 'Pago',
    pago: 'Pago',
    confirmado: 'Confirmado',
    sem_pagamento: 'Sem pré-pagamento',
    recusado: 'Recusado',
    cancelado: 'Cancelado',
  };

  return mapa[status] || status;
}

export default async function SucessoDetalhesPage({ params }: PageProps) {
  const { id } = await params;
  const agendamento = await buscarAgendamento(id);

  const nomeCliente = agendamento?.cliente?.nome || agendamento?.clienteNome || 'Cliente';
  const telefoneCliente =
    agendamento?.cliente?.whatsapp || agendamento?.clienteWhatsapp || agendamento?.telefoneCliente || '';

  const servico = agendamento?.servico?.nome || 'serviço';
  const profissional = agendamento?.profissional?.nome || '';

  const nomeEmpresa = agendamento?.empresa?.nome || 'Empresa';
  const telefoneEmpresa = agendamento?.empresa?.telefone || agendamento?.empresa?.whatsapp || '';
  const enderecoEmpresa = agendamento?.empresa?.endereco || '';

  const data = agendamento?.dataHoraInicio
    ? formatarData(agendamento.dataHoraInicio)
    : '';

  const hora = agendamento?.dataHoraInicio
    ? formatarHora(agendamento.dataHoraInicio)
    : '';

  const exigePrePagamento = Boolean(agendamento?.servico?.exigePrePagamento);

  const pagamentoAprovado =
    agendamento?.statusPagamento === 'aprovado' ||
    agendamento?.statusPagamento === 'pago' ||
    agendamento?.statusPagamento === 'confirmado';

  const agendamentoConfirmado = !exigePrePagamento || pagamentoAprovado;

  const statusAgendamento = agendamentoConfirmado
    ? 'Confirmado'
    : textoStatus(agendamento?.status);

  const statusPagamento = textoPagamento(
    agendamento?.statusPagamento,
    exigePrePagamento
  );

  const mensagemWhatsapp = encodeURIComponent(
    `✨ *${nomeEmpresa}* confirma seu agendamento!\n\n` +
      `Olá, *${nomeCliente}*! Tudo certo? 💜\n\n` +
      `Seu horário foi reservado com sucesso:\n\n` +
      `🧾 *Serviço:* ${servico}\n` +
      (profissional ? `👤 *Profissional:* ${profissional}\n` : '') +
      `📅 *Data:* ${data}\n` +
      `⏰ *Horário:* ${hora}\n` +
      `💳 *Pagamento:* ${statusPagamento}\n\n` +
      (enderecoEmpresa ? `📍 ${enderecoEmpresa}\n` : '') +
      (telefoneEmpresa ? `📞 ${telefoneEmpresa}\n` : '') +
      `\nQualquer dúvida, é só responder por aqui 😉\n\n` +
      `A gente te espera! ✨`
  );

  const telefoneLimpo = limparTelefone(telefoneCliente);
  const linkWhatsapp = telefoneLimpo
    ? `https://wa.me/55${telefoneLimpo}?text=${mensagemWhatsapp}`
    : `https://wa.me/?text=${mensagemWhatsapp}`;

  const googleAgendaTexto = encodeURIComponent(`${servico} - ${nomeEmpresa}`);
  const googleAgendaDetalhes = encodeURIComponent(
    `Agendamento confirmado.\n\n` +
      `Cliente: ${nomeCliente}\n` +
      `Empresa: ${nomeEmpresa}\n` +
      (telefoneEmpresa ? `Telefone: ${telefoneEmpresa}\n` : '') +
      (enderecoEmpresa ? `Endereço: ${enderecoEmpresa}\n` : '') +
      `Serviço: ${servico}\n` +
      (profissional ? `Profissional: ${profissional}\n` : '') +
      `Pagamento: ${statusPagamento}`
  );

  const inicioGoogle = agendamento?.dataHoraInicio
    ? new Date(agendamento.dataHoraInicio).toISOString().replace(/-|:|\.\d{3}/g, '')
    : '';

  const fimGoogle = agendamento?.dataHoraFim
    ? new Date(agendamento.dataHoraFim).toISOString().replace(/-|:|\.\d{3}/g, '')
    : '';

  const linkGoogleAgenda =
    inicioGoogle && fimGoogle
      ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${googleAgendaTexto}&details=${googleAgendaDetalhes}&dates=${inicioGoogle}/${fimGoogle}`
      : '';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f8fafc 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: '100%',
          background: '#fff',
          borderRadius: 24,
          padding: 32,
          textAlign: 'center',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
        }}
      >
        <div
          style={{
            width: 78,
            height: 78,
            borderRadius: '50%',
            background: agendamentoConfirmado ? '#16a34a' : '#f59e0b',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 22px',
            fontSize: 40,
            fontWeight: 'bold',
          }}
        >
          {agendamentoConfirmado ? '✓' : '⌛'}
        </div>

        <h1 style={{ fontSize: 28, marginBottom: 10, color: '#111827' }}>
          {agendamentoConfirmado ? 'Agendamento confirmado!' : 'Agendamento recebido!'}
        </h1>

        <p style={{ color: '#4b5563', fontSize: 16, lineHeight: 1.6 }}>
          {agendamentoConfirmado
            ? 'Seu horário foi reservado com sucesso. Confira abaixo os detalhes do atendimento.'
            : 'Seu agendamento foi criado. Estamos aguardando a confirmação automática do pagamento.'}
        </p>

        {agendamento ? (
          <>
            <div
              style={{
                marginTop: 26,
                padding: 20,
                borderRadius: 18,
                background: '#f9fafb',
                textAlign: 'left',
                border: '1px solid #e5e7eb',
              }}
            >
              <p><strong>Cliente:</strong> {nomeCliente}</p>
              <p><strong>Empresa:</strong> {nomeEmpresa}</p>
              {telefoneEmpresa && <p><strong>Telefone:</strong> {telefoneEmpresa}</p>}
              {enderecoEmpresa && <p><strong>Endereço:</strong> {enderecoEmpresa}</p>}
              <p><strong>Serviço:</strong> {servico}</p>
              {profissional && <p><strong>Profissional:</strong> {profissional}</p>}
              <p><strong>Data:</strong> {data}</p>
              <p><strong>Horário:</strong> {hora}</p>
              <p><strong>Status:</strong> {statusAgendamento}</p>
              <p><strong>Pagamento:</strong> {statusPagamento}</p>
            </div>

            <a
              href={linkWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                marginTop: 24,
                background: '#22c55e',
                color: '#fff',
                padding: '15px 20px',
                borderRadius: 14,
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 'bold',
                boxShadow: '0 10px 20px rgba(34, 197, 94, 0.25)',
              }}
            >
              Enviar confirmação no WhatsApp
            </a>

            {linkGoogleAgenda && (
              <a
                href={linkGoogleAgenda}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  marginTop: 12,
                  background: '#111827',
                  color: '#fff',
                  padding: '15px 20px',
                  borderRadius: 14,
                  textDecoration: 'none',
                  fontSize: 16,
                  fontWeight: 'bold',
                }}
              >
                Adicionar ao Google Agenda
              </a>
            )}
          </>
        ) : (
          <p style={{ color: '#777', fontSize: 14, marginTop: 18 }}>
            Não conseguimos carregar os detalhes do agendamento.
          </p>
        )}
      </div>
    </main>
  );
}