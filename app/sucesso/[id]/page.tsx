import type { CSSProperties } from 'react';
import { prisma } from '@/lib/prisma';
import EnviarComprovanteWhatsAppButton from './EnviarComprovanteWhatsAppButton';

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

function obterValorPrePagamento(item: any) {
  const percentual =
    Number(item?.servico?.percentualPrePagamento || 0);

  const valorFixo =
    Number(item?.servico?.valorPrePagamento || 0);

  const valorServico = Number(obterValorServico(item));

  if (valorFixo > 0) {
    return valorFixo;
  }

  if (percentual > 0) {
    return (valorServico * percentual) / 100;
  }

  return 0;
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

  const totalPrePagamento = agendamentos.reduce(
    (total: number, item: any) => {
      return total + Number(obterValorPrePagamento(item));
    },
    0
  );

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

  if (!agendamento) {
    return (
      <main className="page">
        <div className="backgroundGrid" />
        <section className="emptyState">
          <div className="emptyIcon">!</div>
          <h1>Comprovante não encontrado</h1>
          <p>Não conseguimos carregar os detalhes deste agendamento.</p>
          <strong>Marc<span>aê</span></strong>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="backgroundGrid" />
      <div className="orb orbOne" />
      <div className="orb orbTwo" />
      <div className="orb orbThree" />

      <section className="receiptShell">
        <aside className="heroPanel">
          <div className="brandPill">
            <span>✦</span>
            Marc<span>aê</span>
          </div>

          <div className="companyMark">
            {agendamento?.empresa?.logoUrl ? (
              <img src={agendamento.empresa.logoUrl} alt={nomeEmpresa} />
            ) : (
              <strong>{String(nomeEmpresa || 'M').charAt(0).toUpperCase()}</strong>
            )}
          </div>

          <div className="heroCopy">
            <div className={agendamentoConfirmado ? 'statusBadge confirmed' : 'statusBadge pending'}>
              <span>{agendamentoConfirmado ? '✓' : '•'}</span>
              {statusAgendamento}
            </div>

            <h1>
              {agendamentoConfirmado
                ? 'Reserva confirmada.'
                : 'Reserva recebida.'}
            </h1>

            <p>
              {agendamentoConfirmado
                ? `Seu atendimento em ${nomeEmpresa} está garantido.`
                : 'Seu atendimento foi criado e aguarda confirmação automática do pagamento.'}
            </p>
          </div>

          <div className="heroStats">
            <div>
              <span>Serviços</span>
              <strong>{agendamentos.length}</strong>
            </div>

            <div>
              <span>Total</span>
              <strong>{formatarMoeda(totalGeral)}</strong>
            </div>

            <div>
              <span>Pagamento</span>
              <strong>{statusPagamento}</strong>
            </div>
          </div>

          <div className="heroFooter">
            <span>Comprovante digital</span>
            <strong>{nomeEmpresa}</strong>
          </div>
        </aside>

        <section className="contentPanel">
          <header className="contentHeader">
            <div>
              <span className="eyebrow">
                {agendamentos.length > 1
                  ? 'Agendamento multi-serviço'
                  : 'Agendamento online'}
              </span>

              <h2>
                {agendamentos.length > 1
                  ? `${agendamentos.length} serviços agendados`
                  : servico}
              </h2>

              <p>
                Olá, <strong>{nomeCliente}</strong>. Confira abaixo todos os detalhes da sua reserva.
              </p>
            </div>

            <div className={agendamentoConfirmado ? 'headerSeal confirmed' : 'headerSeal pending'}>
              {agendamentoConfirmado ? 'Confirmado' : 'Pendente'}
            </div>
          </header>

          <section className="summaryRibbon">
            <div>
              <span>Total dos serviços</span>
              <strong>{formatarMoeda(totalGeral)}</strong>
            </div>

            {existePrePagamento && (
              <div>
                <span>Valor pago agora</span>
                <strong>{formatarMoeda(totalPrePagamento)}</strong>
              </div>
            )}

            <div>
              <span>Status geral</span>
              <strong>{statusPagamento}</strong>
            </div>
          </section>

          <section className="timelineSection">
            <div className="sectionHeading">
              <span>Agenda</span>
              <strong>Serviços reservados</strong>
            </div>

            <div className="serviceTimeline">
              {agendamentos.map((item: any, index: number) => {
                const exigePrePagamentoItem = Boolean(item?.servico?.exigePrePagamento);
                const statusPagamentoItem = textoPagamento(
                  item?.statusPagamento,
                  exigePrePagamentoItem
                );
                const valorServicoItem = obterValorServico(item);
                const valorPrePagamentoItem = obterValorPrePagamento(item);

                return (
                  <article key={item.id} className="serviceCard">
                    <div className="timelineDot">
                      <span>{index + 1}</span>
                    </div>

                    <div className="serviceBody">
                      <div className="serviceTop">
                        <div>
                          <span className="serviceTag">Serviço {index + 1}</span>
                          <h3>{item?.servico?.nome || 'Serviço'}</h3>
                          <p>{formatarData(item?.dataHoraInicio)} às {formatarHora(item?.dataHoraInicio)}</p>
                        </div>

                        <strong className="servicePrice">{formatarMoeda(valorServicoItem)}</strong>
                      </div>

                      <div className="detailGrid">
                        <div className="detailCard">
                          <span className="detailIcon">👤</span>
                          <div>
                            <small>Profissional</small>
                            <strong>{item?.profissional?.nome || 'Profissional'}</strong>
                          </div>
                        </div>

                        <div className="detailCard">
                          <span className="detailIcon">⏱</span>
                          <div>
                            <small>Duração</small>
                            <strong>{item?.duracaoMin || item?.servico?.duracaoMin || 30} minutos</strong>
                          </div>
                        </div>

                        <div className="detailCard">
                          <span className="detailIcon">💳</span>
                          <div>
                            <small>Pagamento</small>
                            <strong>{statusPagamentoItem}</strong>
                          </div>
                        </div>

                        {exigePrePagamentoItem && (
                          <div className="detailCard">
                            <span className="detailIcon">◆</span>
                            <div>
                              <small>Pré-pagamento</small>
                              <strong>{formatarMoeda(valorPrePagamentoItem)}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      {exigePrePagamentoItem && (
                        <div className="policyNotice">
                          <strong>Política de pré-pagamento</strong>
                          <span>
                            O valor pago não é reembolsável em caso de falta no dia do atendimento
                            ou se o cancelamento/reagendamento não for solicitado com pelo menos
                            24 horas de antecedência.
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="infoGrid">
            <div className="infoTile">
              <span>Cliente</span>
              <strong>{nomeCliente}</strong>
            </div>

            <div className="infoTile">
              <span>Empresa</span>
              <strong>{nomeEmpresa}</strong>
            </div>

            <div className="infoTile">
              <span>Primeiro horário</span>
              <strong>{data}</strong>
            </div>

            <div className="infoTile">
              <span>Início</span>
              <strong>{hora}</strong>
            </div>

            {telefoneEmpresa && (
  <div className="infoTile">
    <span>WhatsApp da empresa</span>
    <strong>{telefoneEmpresa}</strong>
  </div>
)}

            {enderecoEmpresa && (
              <div className="infoTile wide">
                <span>Endereço</span>
                <strong>{enderecoEmpresa}</strong>
              </div>
            )}
          </section>

          <section className="actions">
            <EnviarComprovanteWhatsAppButton
              agendamentoId={id}
              ids={ids.join(',')}
            />

            {linkGoogleAgenda && (
              <a
                href={linkGoogleAgenda}
                target="_blank"
                rel="noopener noreferrer"
                className="actionButton calendar"
              >
                Adicionar ao Google Agenda
              </a>
            )}
          </section>

          <section className="socialCard">
            <div>
              <span>Experiência premium</span>
              <strong>Gostou da experiência?</strong>
              <p>Acompanhe a empresa ou fale direto pelo WhatsApp quando precisar.</p>
            </div>

            <div className="socialActions">
              {instagramLink && (
                <a href={instagramLink} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              )}

              {linkWhatsappEmpresa && (
                <a href={linkWhatsappEmpresa} target="_blank" rel="noopener noreferrer">
                  WhatsApp da empresa
                </a>
              )}
            </div>
          </section>

          <footer className="poweredBy">
            <span>Agendado por</span>
            <strong>Marc<span>aê</span></strong>
          </footer>
        </section>
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(circle at 15% 8%, rgba(123, 58, 237, 0.35), transparent 30%),
            radial-gradient(circle at 88% 18%, rgba(183, 107, 255, 0.22), transparent 28%),
            radial-gradient(circle at 50% 100%, rgba(123, 58, 237, 0.22), transparent 34%),
            linear-gradient(135deg, #080b0f 0%, #0d1020 44%, #111425 100%);
          color: #f8fafc;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 28px;
          font-family: Arial, sans-serif;
        }

        .backgroundGrid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(237, 233, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(237, 233, 255, 0.04) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(circle at center, black 0%, transparent 72%);
          pointer-events: none;
        }

        .orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(22px);
          opacity: 0.72;
          pointer-events: none;
        }

        .orbOne {
          width: 280px;
          height: 280px;
          background: rgba(123, 58, 237, 0.28);
          top: 8%;
          left: 6%;
        }

        .orbTwo {
          width: 240px;
          height: 240px;
          background: rgba(183, 107, 255, 0.18);
          right: 8%;
          top: 18%;
        }

        .orbThree {
          width: 360px;
          height: 360px;
          background: rgba(123, 58, 237, 0.16);
          bottom: -120px;
          left: 42%;
        }

        .receiptShell {
          position: relative;
          z-index: 1;
          width: min(1180px, 100%);
          display: grid;
          grid-template-columns: 0.95fr 1.35fr;
          gap: 20px;
          align-items: stretch;
        }

        .heroPanel,
        .contentPanel,
        .emptyState {
          border: 1px solid rgba(237, 233, 255, 0.12);
          background: linear-gradient(145deg, rgba(17, 20, 37, 0.86), rgba(8, 11, 15, 0.86));
          box-shadow: 0 34px 90px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(22px);
        }

        .heroPanel {
          min-height: 720px;
          border-radius: 38px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          position: sticky;
          top: 28px;
        }

        .heroPanel::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 10%, rgba(183, 107, 255, 0.24), transparent 35%),
            radial-gradient(circle at 75% 60%, rgba(123, 58, 237, 0.18), transparent 36%);
          pointer-events: none;
        }

        .brandPill,
        .heroCopy,
        .companyMark,
        .heroStats,
        .heroFooter {
          position: relative;
          z-index: 1;
        }

        .brandPill {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(237, 233, 255, 0.08);
          border: 1px solid rgba(237, 233, 255, 0.12);
          color: #ede9ff;
          font-size: 14px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .brandPill span:last-child,
        .poweredBy strong span {
          color: #b76bff;
        }

        .companyMark {
          width: 118px;
          height: 118px;
          border-radius: 34px;
          background:
            linear-gradient(#111425, #111425) padding-box,
            linear-gradient(135deg, rgba(183, 107, 255, 0.8), rgba(123, 58, 237, 0.18)) border-box;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(123, 58, 237, 0.28);
        }

        .companyMark img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .companyMark strong {
          font-size: 52px;
          color: #b76bff;
        }

        .statusBadge {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 18px;
        }

        .statusBadge.confirmed,
        .headerSeal.confirmed {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.24);
          color: #bbf7d0;
        }

        .statusBadge.pending,
        .headerSeal.pending {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.24);
          color: #fde68a;
        }

        .heroCopy h1 {
          margin: 0;
          max-width: 420px;
          font-size: clamp(48px, 5.8vw, 84px);
          line-height: 0.9;
          letter-spacing: -0.085em;
          color: #ffffff;
        }

        .heroCopy p {
          max-width: 390px;
          margin: 20px 0 0;
          color: #a7b0c5;
          font-size: 16px;
          line-height: 1.7;
        }

        .heroStats {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: 30px;
        }

        .heroStats div {
          padding: 15px;
          border-radius: 22px;
          background: rgba(237, 233, 255, 0.07);
          border: 1px solid rgba(237, 233, 255, 0.1);
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
        }

        .heroStats span,
        .heroFooter span,
        .eyebrow,
        .sectionHeading span,
        .summaryRibbon span,
        .infoTile span,
        .socialCard span,
        .detailCard small {
          color: #a7b0c5;
          font-size: 11px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.09em;
        }

        .heroStats strong {
          color: #f8fafc;
          text-align: right;
          font-size: 14px;
        }

        .heroFooter {
          padding-top: 22px;
          border-top: 1px solid rgba(237, 233, 255, 0.1);
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .heroFooter strong {
          font-size: 18px;
          color: #ede9ff;
        }

        .contentPanel {
          border-radius: 38px;
          padding: 28px;
        }

        .contentHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .contentHeader h2 {
          margin: 8px 0 8px;
          font-size: clamp(32px, 4vw, 52px);
          line-height: 0.95;
          letter-spacing: -0.07em;
        }

        .contentHeader p {
          margin: 0;
          color: #a7b0c5;
          font-size: 15px;
          line-height: 1.6;
        }

        .contentHeader p strong {
          color: #fff;
        }

        .headerSeal {
          white-space: nowrap;
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 950;
        }

        .summaryRibbon {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .summaryRibbon div {
          padding: 18px;
          border-radius: 26px;
          background:
            linear-gradient(145deg, rgba(123, 58, 237, 0.18), rgba(237, 233, 255, 0.06));
          border: 1px solid rgba(183, 107, 255, 0.18);
        }

        .summaryRibbon strong {
          display: block;
          margin-top: 7px;
          color: #fff;
          font-size: 20px;
          letter-spacing: -0.04em;
        }

        .timelineSection,
        .infoGrid,
        .actions,
        .socialCard {
          margin-top: 20px;
        }

        .sectionHeading {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 14px;
        }

        .sectionHeading strong {
          font-size: 20px;
          color: #fff;
        }

        .serviceTimeline {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .serviceTimeline::before {
          content: '';
          position: absolute;
          left: 22px;
          top: 18px;
          bottom: 18px;
          width: 1px;
          background: linear-gradient(180deg, rgba(183, 107, 255, 0.7), rgba(183, 107, 255, 0.04));
        }

        .serviceCard {
          position: relative;
          display: grid;
          grid-template-columns: 46px 1fr;
          gap: 14px;
        }

        .timelineDot {
          position: relative;
          z-index: 1;
          width: 46px;
          height: 46px;
          border-radius: 18px;
          background: linear-gradient(135deg, #7b3aed, #b76bff);
          box-shadow: 0 18px 40px rgba(123, 58, 237, 0.32);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 950;
        }

        .serviceBody {
          padding: 18px;
          border-radius: 28px;
          background: rgba(237, 233, 255, 0.06);
          border: 1px solid rgba(237, 233, 255, 0.12);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
        }

        .serviceTop {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .serviceTag {
          display: inline-flex;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(183, 107, 255, 0.14);
          color: #ede9ff;
          font-size: 11px;
          font-weight: 950;
          margin-bottom: 10px;
        }

        .serviceTop h3 {
          margin: 0 0 5px;
          color: #fff;
          font-size: 20px;
          letter-spacing: -0.04em;
        }

        .serviceTop p {
          margin: 0;
          color: #a7b0c5;
          font-size: 14px;
          line-height: 1.4;
        }

        .servicePrice {
          white-space: nowrap;
          color: #fff;
          font-size: 16px;
        }

        .detailGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
        }

        .detailCard {
          min-height: 72px;
          border-radius: 20px;
          background: rgba(8, 11, 15, 0.38);
          border: 1px solid rgba(237, 233, 255, 0.1);
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .detailIcon {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 14px;
          background: rgba(183, 107, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .detailCard strong {
          display: block;
          color: #f8fafc;
          font-size: 13px;
          margin-top: 4px;
          line-height: 1.25;
        }

        .policyNotice {
          margin-top: 12px;
          border-radius: 18px;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.22);
          color: #fed7aa;
          padding: 13px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          line-height: 1.45;
        }

        .policyNotice strong {
          color: #ffedd5;
        }

        .infoGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .infoTile {
          padding: 16px;
          border-radius: 22px;
          background: rgba(237, 233, 255, 0.05);
          border: 1px solid rgba(237, 233, 255, 0.1);
        }

        .infoTile.wide {
          grid-column: 1 / -1;
        }

        .infoTile strong {
          display: block;
          color: #fff;
          margin-top: 7px;
          font-size: 14px;
          line-height: 1.45;
        }

        .actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .actionButton,
        .socialActions a {
          min-height: 54px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-weight: 950;
          color: #fff;
          text-align: center;
          padding: 14px;
          transition: transform 0.2s ease, filter 0.2s ease;
        }

        .actionButton:hover,
        .socialActions a:hover {
          transform: translateY(-2px);
          filter: brightness(1.05);
        }

        .actionButton.whatsapp {
          background: linear-gradient(135deg, #16a34a, #22c55e);
          box-shadow: 0 18px 36px rgba(34, 197, 94, 0.18);
        }

        .actionButton.calendar {
          background: linear-gradient(135deg, #7b3aed, #b76bff);
          box-shadow: 0 18px 36px rgba(123, 58, 237, 0.22);
        }

        .socialCard {
          border-radius: 28px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background:
            radial-gradient(circle at right, rgba(183, 107, 255, 0.16), transparent 34%),
            rgba(237, 233, 255, 0.06);
          border: 1px solid rgba(183, 107, 255, 0.18);
        }

        .socialCard strong {
          display: block;
          color: #fff;
          margin-top: 6px;
          font-size: 20px;
        }

        .socialCard p {
          color: #a7b0c5;
          margin: 7px 0 0;
          font-size: 14px;
          line-height: 1.5;
        }

        .socialActions {
          min-width: 190px;
          display: grid;
          gap: 10px;
        }

        .socialActions a {
          min-height: 46px;
          background: rgba(237, 233, 255, 0.08);
          border: 1px solid rgba(237, 233, 255, 0.12);
          font-size: 13px;
        }

        .poweredBy {
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #a7b0c5;
          font-size: 13px;
        }

        .poweredBy strong {
          color: #fff;
          font-size: 16px;
          letter-spacing: -0.04em;
        }

        .emptyState {
          position: relative;
          z-index: 1;
          max-width: 460px;
          width: 100%;
          border-radius: 34px;
          padding: 34px;
          text-align: center;
        }

        .emptyIcon {
          width: 70px;
          height: 70px;
          margin: 0 auto 18px;
          border-radius: 24px;
          background: rgba(183, 107, 255, 0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #b76bff;
          font-size: 28px;
          font-weight: 950;
        }

        .emptyState h1 {
          color: #fff;
          margin: 0 0 10px;
          letter-spacing: -0.05em;
        }

        .emptyState p {
          color: #a7b0c5;
          margin: 0 0 20px;
          line-height: 1.5;
        }

        .emptyState strong {
          color: #fff;
          letter-spacing: -0.04em;
        }

        .emptyState strong span {
          color: #b76bff;
        }

        @media (max-width: 980px) {
          .page {
            align-items: flex-start;
            padding: 18px;
          }

          .receiptShell {
            grid-template-columns: 1fr;
          }

          .heroPanel {
            position: relative;
            top: 0;
            min-height: auto;
            gap: 30px;
          }

          .heroStats {
            grid-template-columns: repeat(3, 1fr);
          }

          .heroStats div {
            flex-direction: column;
            align-items: flex-start;
          }

          .heroStats strong {
            text-align: left;
          }
        }

        @media (max-width: 640px) {
          .page {
            padding: 12px;
          }

          .heroPanel,
          .contentPanel {
            border-radius: 28px;
            padding: 20px;
          }

          .companyMark {
            width: 92px;
            height: 92px;
            border-radius: 28px;
          }

          .companyMark strong {
            font-size: 40px;
          }

          .heroCopy h1 {
            font-size: 48px;
          }

          .heroStats,
          .summaryRibbon,
          .infoGrid,
          .actions {
            grid-template-columns: 1fr;
          }

          .contentHeader {
            flex-direction: column;
          }

          .headerSeal {
            width: fit-content;
          }

          .serviceCard {
            grid-template-columns: 1fr;
          }

          .serviceTimeline::before {
            display: none;
          }

          .timelineDot {
            width: 42px;
            height: 42px;
            border-radius: 16px;
          }

          .serviceTop {
            flex-direction: column;
          }

          .socialCard {
            flex-direction: column;
            align-items: stretch;
          }

          .socialActions {
            min-width: 0;
          }
        }
      `}</style>
    </main>
  );
}
