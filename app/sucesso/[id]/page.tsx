import type { CSSProperties } from 'react';
import { prisma } from '@/lib/prisma';

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    ids?: string;
  }>;
};

const agendamentoInclude = {
  cliente: true,
  servico: true,
  profissional: true,
  empresa: true,
};

async function buscarAgendamento(id: string) {
  return prisma.agendamento.findUnique({
    where: {
      id,
    },
    include: agendamentoInclude,
  });
}

async function buscarAgendamentosPorIds(ids: string[]) {
  if (ids.length === 0) return [];

  return prisma.agendamento.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    include: agendamentoInclude,
    orderBy: [
      {
        dataHoraInicio: 'asc',
      },
      {
        createdAt: 'asc',
      },
    ],
  });
}

async function buscarAgendamentosDoComprovante(id: string, ids: string[]) {
  if (ids.length > 1) {
    return buscarAgendamentosPorIds(ids);
  }

  const agendamentoPrincipal = await buscarAgendamento(id);

  if (!agendamentoPrincipal) {
    return [];
  }

  if (!agendamentoPrincipal.grupoAgendamentoId) {
    return [agendamentoPrincipal];
  }

  return prisma.agendamento.findMany({
    where: {
      grupoAgendamentoId: agendamentoPrincipal.grupoAgendamentoId,
      empresaId: agendamentoPrincipal.empresaId,
    },
    include: agendamentoInclude,
    orderBy: [
      {
        dataHoraInicio: 'asc',
      },
      {
        createdAt: 'asc',
      },
    ],
  });
}

function formatarData(data?: string | Date | null) {
  if (!data) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
  }).format(new Date(data));
}

function formatarHora(data?: string | Date | null) {
  if (!data) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data));
}

function formatarMoeda(valor?: number | string | null) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function limparTelefone(telefone?: string | null) {
  return String(telefone || '').replace(/\D/g, '');
}

function formatarEndereco(endereco: any) {
  if (!endereco) return '';

  try {
    const dados =
      typeof endereco === 'string'
        ? JSON.parse(endereco)
        : endereco;

    const partes = [
      dados?.rua,
      dados?.numero,
      dados?.complemento,
    ].filter(Boolean);

    const cidadeEstado = [
      dados?.cidade,
      dados?.estado,
    ]
      .filter(Boolean)
      .join('/');

    return [
      partes.join(', '),
      cidadeEstado,
    ]
      .filter(Boolean)
      .join(' - ');
  } catch {
    return String(endereco);
  }
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

function pagamentoFoiAprovado(status?: string | null) {
  return (
    status === 'aprovado' ||
    status === 'pago' ||
    status === 'confirmado'
  );
}

function obterValorServico(item: any) {
  return (
    item?.valorTotal ||
    item?.servico?.valor ||
    item?.servico?.preco ||
    item?.servico?.valorTotal ||
    0
  );
}

export default async function SucessoDetalhesPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  const ids =
    query?.ids
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean) || [id];

  const agendamentos = await buscarAgendamentosDoComprovante(id, ids);
  const agendamento = agendamentos[0];

  const nomeCliente = agendamento?.cliente?.nome || agendamento?.clienteNome || 'Cliente';
  const telefoneCliente =
    agendamento?.cliente?.whatsapp || agendamento?.clienteWhatsapp || agendamento?.telefoneCliente || '';

  const servico = agendamento?.servico?.nome || 'serviço';
  const profissional = agendamento?.profissional?.nome || '';

  const nomeEmpresa = agendamento?.empresa?.nome || 'Empresa';
  const telefoneEmpresa = agendamento?.empresa?.telefone || agendamento?.empresa?.whatsapp || '';
  const enderecoEmpresa = formatarEndereco(agendamento?.empresa?.endereco);

  const data = agendamento?.dataHoraInicio
    ? formatarData(agendamento.dataHoraInicio)
    : '';

  const hora = agendamento?.dataHoraInicio
    ? formatarHora(agendamento.dataHoraInicio)
    : '';

  const existePrePagamento = agendamentos.some((item: any) =>
    Boolean(item?.servico?.exigePrePagamento)
  );

  const todosPagamentosAprovados = agendamentos.every((item: any) => {
    const exigePrePagamentoItem = Boolean(item?.servico?.exigePrePagamento);

    if (!exigePrePagamentoItem) return true;

    return pagamentoFoiAprovado(item?.statusPagamento);
  });

  const agendamentoConfirmado = !existePrePagamento || todosPagamentosAprovados;

  const statusAgendamento = agendamentoConfirmado
    ? 'Confirmado'
    : textoStatus(agendamento?.status);

  const statusPagamento = existePrePagamento
    ? todosPagamentosAprovados
      ? 'Pago'
      : 'Aguardando pagamento'
    : 'Sem pré-pagamento';

  const totalGeral = agendamentos.reduce((total: number, item: any) => {
    return total + Number(obterValorServico(item));
  }, 0);

  const linhasServicosWhatsapp = agendamentos
    .map((item: any, index: number) => {
      const nomeServico = item?.servico?.nome || 'Serviço';
      const nomeProfissional = item?.profissional?.nome || 'Profissional';
      const dataItem = item?.dataHoraInicio ? formatarData(item.dataHoraInicio) : 'Data não informada';
      const horaItem = item?.dataHoraInicio ? formatarHora(item.dataHoraInicio) : 'Horário não informado';
      const pagamentoItem = textoPagamento(
        item?.statusPagamento,
        Boolean(item?.servico?.exigePrePagamento)
      );

      return (
        `${index + 1}. *${nomeServico}*\n` +
        `👤 Profissional: ${nomeProfissional}\n` +
        `📅 Data: ${dataItem}\n` +
        `⏰ Horário: ${horaItem}\n` +
        `💳 Pagamento: ${pagamentoItem}`
      );
    })
    .join('\n\n');

  const mensagemWhatsapp = encodeURIComponent(
    `✨ *${nomeEmpresa}* confirma seu agendamento!\n\n` +
      `Olá, *${nomeCliente}*! Tudo certo? 💜\n\n` +
      `Seu atendimento foi reservado com sucesso:\n\n` +
      `${linhasServicosWhatsapp}\n\n` +
      `💰 *Total:* ${formatarMoeda(totalGeral)}\n` +
      `💳 *Status geral:* ${statusPagamento}\n\n` +
      (enderecoEmpresa ? `📍 ${enderecoEmpresa}\n` : '') +
      (telefoneEmpresa ? `📞 ${telefoneEmpresa}\n` : '') +
      `\nQualquer dúvida, é só responder por aqui 😉\n\n` +
      `A gente te espera! ✨`
  );

  const telefoneLimpo = limparTelefone(telefoneCliente);
  const linkWhatsapp = telefoneLimpo
    ? `https://wa.me/55${telefoneLimpo}?text=${mensagemWhatsapp}`
    : `https://wa.me/?text=${mensagemWhatsapp}`;

  const googleAgendaTexto = encodeURIComponent(
    agendamentos.length > 1
      ? `${agendamentos.length} serviços - ${nomeEmpresa}`
      : `${servico} - ${nomeEmpresa}`
  );

  const googleAgendaDetalhes = encodeURIComponent(
    `Agendamento confirmado.\n\n` +
      `Cliente: ${nomeCliente}\n` +
      `Empresa: ${nomeEmpresa}\n` +
      (telefoneEmpresa ? `Telefone: ${telefoneEmpresa}\n` : '') +
      (enderecoEmpresa ? `Endereço: ${enderecoEmpresa}\n` : '') +
      `\nServiços:\n` +
      agendamentos
        .map((item: any, index: number) => {
          return `${index + 1}. ${item?.servico?.nome || 'Serviço'} - ${item?.profissional?.nome || 'Profissional'} - ${formatarData(item?.dataHoraInicio)} às ${formatarHora(item?.dataHoraInicio)}`;
        })
        .join('\n') +
      `\n\nPagamento: ${statusPagamento}`
  );

  const primeiroInicio = agendamentos[0]?.dataHoraInicio;
  const ultimoFim = agendamentos[agendamentos.length - 1]?.dataHoraFim;

  const inicioGoogle = primeiroInicio
    ? new Date(primeiroInicio).toISOString().replace(/-|:|\.\d{3}/g, '')
    : '';

  const fimGoogle = ultimoFim
    ? new Date(ultimoFim).toISOString().replace(/-|:|\.\d{3}/g, '')
    : '';

  const linkGoogleAgenda =
    inicioGoogle && fimGoogle
      ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${googleAgendaTexto}&details=${googleAgendaDetalhes}&dates=${inicioGoogle}/${fimGoogle}`
      : '';

  const infoCardStyle: CSSProperties = {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 20,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  };

  const iconStyle: CSSProperties = {
    width: 42,
    height: 42,
    minWidth: 42,
    borderRadius: 16,
    background:
      'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(219,39,119,0.12))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  };

  const labelStyle: CSSProperties = {
    display: 'block',
    color: '#64748b',
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: '0.05em',
  };

  const valueStyle: CSSProperties = {
    color: '#0f172a',
    fontSize: 14,
    lineHeight: 1.45,
  };

  const instagramEmpresa =
    agendamento?.empresa?.instagramUrl ||
    agendamento?.empresa?.instagram ||
    '';

  const instagramLink = instagramEmpresa
    ? instagramEmpresa.startsWith('http')
      ? instagramEmpresa
      : `https://instagram.com/${instagramEmpresa.replace('@', '')}`
    : '';

  const telefoneEmpresaLimpo = limparTelefone(telefoneEmpresa);

  const linkWhatsappEmpresa = telefoneEmpresaLimpo
    ? `https://wa.me/55${telefoneEmpresaLimpo}`
    : '';

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(124,58,237,0.18), transparent 28%), radial-gradient(circle at top right, rgba(219,39,119,0.18), transparent 28%), linear-gradient(180deg, #fff7fb 0%, #f8fafc 52%, #eef2ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 760,
          width: '100%',
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(18px)',
          borderRadius: 34,
          padding: 34,
          textAlign: 'center',
          boxShadow: '0 30px 80px rgba(15,23,42,0.14)',
          border: '1px solid rgba(255,255,255,0.92)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(124,58,237,0.1)',
              color: '#6d28d9',
              borderRadius: 999,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 900,
              marginBottom: 22,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#7c3aed,#db2777)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
              }}
            >
              ✓
            </span>

            {agendamentos.length > 1
              ? 'Agendamento online multi-serviço'
              : 'Agendamento online confirmado'}
          </div>

          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 30,
              overflow: 'hidden',
              background: '#fff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 45px rgba(15,23,42,0.10)',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {agendamento?.empresa?.logoUrl ? (
              <img
                src={agendamento.empresa.logoUrl}
                alt={nomeEmpresa}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  color: '#7c3aed',
                }}
              >
                {String(nomeEmpresa || 'M').charAt(0)}
              </div>
            )}
          </div>

          <h1
            style={{
              fontSize: 42,
              lineHeight: 0.95,
              letterSpacing: '-0.06em',
              marginBottom: 12,
              color: '#0f172a',
            }}
          >
            {agendamentoConfirmado
              ? 'Seu horário foi confirmado ✨'
              : 'Seu agendamento foi recebido ✨'}
          </h1>

          <p
            style={{
              maxWidth: 560,
              color: '#475569',
              fontSize: 17,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {agendamentoConfirmado
              ? `Seu atendimento em ${nomeEmpresa} foi reservado com sucesso.`
              : 'Seu agendamento foi criado e estamos aguardando a confirmação automática do pagamento.'}
          </p>

          <div
            style={{
              marginTop: 28,
              width: '100%',
              borderRadius: 24,
              padding: 20,
              background:
                'radial-gradient(circle at right, rgba(219,39,119,0.10), transparent 30%), linear-gradient(135deg, rgba(250,245,255,0.95), rgba(255,255,255,0.92))',
              border: '1px solid #e9d5ff',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                minWidth: 58,
                width: 58,
                height: 58,
                borderRadius: 20,
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                boxShadow: '0 14px 28px rgba(124,58,237,0.12)',
              }}
            >
              📅
            </div>

            <div>
              <strong
                style={{
                  display: 'block',
                  color: '#0f172a',
                  fontSize: 17,
                  marginBottom: 4,
                }}
              >
                Agilidade que você sente, cuidado que você merece.
              </strong>

              <span
                style={{
                  color: '#64748b',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                Seu horário já está reservado e organizado para você 💜
              </span>
            </div>
          </div>
        </div>

        {agendamento ? (
          <>
            <div
              style={{
                marginTop: 30,
                borderRadius: 30,
                padding: 24,
                background: 'rgba(255,255,255,0.78)',
                border: '1px solid #eef2ff',
                boxShadow: '0 24px 60px rgba(15,23,42,0.08)',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 22,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'block',
                      color: '#a855f7',
                      fontSize: 12,
                      fontWeight: 900,
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Resumo do atendimento
                  </span>

                  <h2
                    style={{
                      margin: 0,
                      color: '#0f172a',
                      fontSize: 24,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {agendamentos.length > 1
                      ? `${agendamentos.length} serviços agendados`
                      : servico}
                  </h2>
                </div>

                <div
                  style={{
                    borderRadius: 999,
                    padding: '10px 14px',
                    background: agendamentoConfirmado
                      ? 'rgba(22,163,74,0.12)'
                      : 'rgba(245,158,11,0.12)',
                    color: agendamentoConfirmado
                      ? '#166534'
                      : '#92400e',
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  {statusAgendamento}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
                {agendamentos.map((item: any, index: number) => {
                  const exigePrePagamentoItem = Boolean(item?.servico?.exigePrePagamento);

                  const statusPagamentoItem = textoPagamento(
                    item?.statusPagamento,
                    exigePrePagamentoItem
                  );

                  const valorServicoItem = obterValorServico(item);

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: 18,
                        borderRadius: 24,
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 14px 32px rgba(15,23,42,0.05)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 12,
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display: 'inline-flex',
                              borderRadius: 999,
                              padding: '6px 10px',
                              background: '#ede9fe',
                              color: '#5b21b6',
                              fontSize: 11,
                              fontWeight: 900,
                              marginBottom: 8,
                            }}
                          >
                            Serviço {index + 1}
                          </span>

                          <strong
                            style={{
                              color: '#0f172a',
                              fontSize: 18,
                              display: 'block',
                              marginBottom: 4,
                            }}
                          >
                            {item?.servico?.nome || 'Serviço'}
                          </strong>

                          <span
                            style={{
                              display: 'block',
                              color: '#64748b',
                              fontSize: 14,
                              lineHeight: 1.5,
                            }}
                          >
                            {formatarData(item?.dataHoraInicio)} às {formatarHora(item?.dataHoraInicio)}
                          </span>
                        </div>

                        <strong
                          style={{
                            color: '#0f172a',
                            fontSize: 16,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatarMoeda(valorServicoItem)}
                        </strong>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))',
                          gap: 10,
                        }}
                      >
                        <div style={infoCardStyle}>
                          <span style={iconStyle}>👤</span>

                          <div>
                            <small style={labelStyle}>Profissional</small>
                            <strong style={valueStyle}>{item?.profissional?.nome || 'Profissional'}</strong>
                          </div>
                        </div>

                        <div style={infoCardStyle}>
                          <span style={iconStyle}>⏱️</span>

                          <div>
                            <small style={labelStyle}>Duração</small>
                            <strong style={valueStyle}>{item?.duracaoMin || item?.servico?.duracaoMin || 30} minutos</strong>
                          </div>
                        </div>

                        <div style={infoCardStyle}>
                          <span style={iconStyle}>💳</span>

                          <div>
                            <small style={labelStyle}>Pagamento</small>
                            <strong style={valueStyle}>{statusPagamentoItem}</strong>
                          </div>
                        </div>
                      </div>

                      {exigePrePagamentoItem && (
                        <div
                          style={{
                            marginTop: 12,
                            padding: 12,
                            borderRadius: 16,
                            background: '#fff7ed',
                            border: '1px solid #fed7aa',
                            color: '#9a3412',
                            fontSize: 13,
                            lineHeight: 1.45,
                          }}
                        >
                          <strong style={{ display: 'block', marginBottom: 4 }}>
                            Política de pré-pagamento
                          </strong>
                          O valor pago não é reembolsável em caso de falta no dia do atendimento
                          ou se o cancelamento/reagendamento não for solicitado com pelo menos
                          24 horas de antecedência.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  marginBottom: 18,
                  padding: 18,
                  borderRadius: 24,
                  background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 900,
                      opacity: 0.85,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 4,
                    }}
                  >
                    Total geral
                  </span>

                  <strong style={{ fontSize: 26, letterSpacing: '-0.04em' }}>
                    {formatarMoeda(totalGeral)}
                  </strong>
                </div>

                <div
                  style={{
                    borderRadius: 999,
                    padding: '9px 12px',
                    background: 'rgba(255,255,255,0.16)',
                    border: '1px solid rgba(255,255,255,0.24)',
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  {statusPagamento}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))',
                  gap: 14,
                }}
              >
                <div style={infoCardStyle}>
                  <span style={iconStyle}>👤</span>

                  <div>
                    <small style={labelStyle}>Cliente</small>
                    <strong style={valueStyle}>{nomeCliente}</strong>
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <span style={iconStyle}>🏢</span>

                  <div>
                    <small style={labelStyle}>Empresa</small>
                    <strong style={valueStyle}>{nomeEmpresa}</strong>
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <span style={iconStyle}>📅</span>

                  <div>
                    <small style={labelStyle}>Primeiro horário</small>
                    <strong style={valueStyle}>{data}</strong>
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <span style={iconStyle}>⏰</span>

                  <div>
                    <small style={labelStyle}>Início</small>
                    <strong style={valueStyle}>{hora}</strong>
                  </div>
                </div>

                {telefoneEmpresa && (
                  <div style={infoCardStyle}>
                    <span style={iconStyle}>📞</span>

                    <div>
                      <small style={labelStyle}>Contato</small>
                      <strong style={valueStyle}>{telefoneEmpresa}</strong>
                    </div>
                  </div>
                )}

                {enderecoEmpresa && (
                  <div style={infoCardStyle}>
                    <span style={iconStyle}>📍</span>

                    <div>
                      <small style={labelStyle}>Endereço</small>
                      <strong style={valueStyle}>{enderecoEmpresa}</strong>
                    </div>
                  </div>
                )}
              </div>
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

            <div
              style={{
                marginTop: 22,
                borderRadius: 26,
                padding: 22,
                background:
                  'linear-gradient(135deg, rgba(250,245,255,0.96), rgba(255,255,255,0.92))',
                border: '1px solid #e9d5ff',
                textAlign: 'center',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  color: '#0f172a',
                  fontSize: 18,
                  marginBottom: 6,
                }}
              >
                Gostou da experiência? 💜
              </strong>

              <p
                style={{
                  margin: '0 0 16px',
                  color: '#64748b',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                Acompanhe a empresa e fale direto pelo WhatsApp quando precisar.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 10,
                }}
              >
                {instagramLink && (
                  <a
                    href={instagramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      background: 'linear-gradient(135deg, #db2777, #7c3aed)',
                      color: '#fff',
                      padding: '14px 18px',
                      borderRadius: 16,
                      textDecoration: 'none',
                      fontSize: 15,
                      fontWeight: 900,
                    }}
                  >
                    📸 Me siga no Instagram
                  </a>
                )}

                {linkWhatsappEmpresa && (
                  <a
                    href={linkWhatsappEmpresa}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      background: '#16a34a',
                      color: '#fff',
                      padding: '14px 18px',
                      borderRadius: 16,
                      textDecoration: 'none',
                      fontSize: 15,
                      fontWeight: 900,
                    }}
                  >
                    📲 Fale conosco no WhatsApp
                  </a>
                )}
              </div>

              <div
                style={{
                  marginTop: 18,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                <span>✨</span>
                <span>Agendado por</span>
                <strong style={{ color: '#0f172a', fontSize: 16 }}>
                  Marc<span style={{ color: '#db2777' }}>aê</span>
                </strong>
              </div>
            </div>
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
