import type { CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { gerarTemaEmpresa } from "@/app/lib/theme";

export const dynamic = "force-dynamic";

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
        dataHoraInicio: "asc",
      },
      {
        createdAt: "asc",
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
        dataHoraInicio: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
}

function formatarData(data?: string | Date | null) {
  if (!data) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
  }).format(new Date(data));
}

function formatarHora(data?: string | Date | null) {
  if (!data) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data));
}

function formatarMoeda(valor?: number | string | null) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function limparTelefone(telefone?: string | null) {
  return String(telefone || "").replace(/\D/g, "");
}

function formatarEndereco(empresaOuEndereco: any) {
  if (!empresaOuEndereco) return "";

  try {
    const dados =
      typeof empresaOuEndereco === "string"
        ? JSON.parse(empresaOuEndereco)
        : empresaOuEndereco?.endereco
          ? typeof empresaOuEndereco.endereco === "string"
            ? JSON.parse(empresaOuEndereco.endereco)
            : empresaOuEndereco.endereco
          : empresaOuEndereco;

    const rua = dados?.rua || empresaOuEndereco?.rua || "";
    const numero = dados?.numero || empresaOuEndereco?.numero || "";
    const complemento =
      dados?.complemento || empresaOuEndereco?.complemento || "";
    const cidade = dados?.cidade || empresaOuEndereco?.cidade || "";
    const estado = dados?.estado || empresaOuEndereco?.estado || "";
    const bairro = dados?.bairro || empresaOuEndereco?.bairro || "";
    const cep = dados?.cep || empresaOuEndereco?.cep || "";

    const partes = [rua, numero, bairro, complemento].filter(Boolean);
    const cidadeEstado = [cidade, estado].filter(Boolean).join(" - ");

    return [partes.join(", "), cidadeEstado, cep ? `CEP: ${cep}` : ""]
      .filter(Boolean)
      .join(" • ");
  } catch {
    return "";
  }
}

function textoStatus(status?: string | null) {
  if (!status) return "Pendente";

  const mapa: Record<string, string> = {
    pendente: "Pendente",
    confirmado: "Confirmado",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  return mapa[status] || status;
}

function textoPagamento(status?: string | null, exigePrePagamento?: boolean) {
  if (!exigePrePagamento) return "Sem pré-pagamento";
  if (!status) return "Pendente";

  const mapa: Record<string, string> = {
    pendente: "Pendente",
    aguardando: "Aguardando pagamento",
    aprovado: "Pago",
    pago: "Pago",
    confirmado: "Confirmado",
    sem_pagamento: "Sem pré-pagamento",
    recusado: "Recusado",
    cancelado: "Cancelado",
  };

  return mapa[status] || status;
}

function pagamentoFoiAprovado(status?: string | null) {
  return status === "aprovado" || status === "pago" || status === "confirmado";
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
  const percentual = Number(item?.servico?.percentualPrePagamento || 0);

  const valorFixo = Number(item?.servico?.valorPrePagamento || 0);

  const valorServico = Number(obterValorServico(item));

  if (valorFixo > 0) {
    return valorFixo;
  }

  if (percentual > 0) {
    return (valorServico * percentual) / 100;
  }

  return 0;
}

function promocaoFoiAplicada(item: any) {
  return Boolean(
    item?.promocaoId ||
    item?.promocaoTitulo ||
    Number(item?.valorEconomizado || 0) > 0,
  );
}

function formatarTipoPromocao(tipo?: string | null) {
  if (tipo === "servico") return "Desconto por serviço";
  if (tipo === "aniversariantes") return "Promoção de aniversário";
  if (tipo === "geral") return "Promoção geral";

  return "Promoção aplicada";
}

function formatarDescontoPromocao(item: any) {
  const desconto = Number(item?.promocaoDesconto || 0);

  if (!desconto) return "";

  if (item?.promocaoTipoDesconto === "valor") {
    return formatarMoeda(desconto);
  }

  return `${desconto}%`;
}

export default async function SucessoDetalhesPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  const ids = query?.ids
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) || [id];

  const agendamentos = await buscarAgendamentosDoComprovante(id, ids);
  const agendamento = agendamentos[0];

  const nomeCliente =
    agendamento?.cliente?.nome || agendamento?.clienteNome || "Cliente";
  const telefoneCliente =
    agendamento?.cliente?.whatsapp ||
    agendamento?.clienteWhatsapp ||
    agendamento?.telefoneCliente ||
    "";

  const servico = agendamento?.servico?.nome || "serviço";
  const nomeEmpresa = agendamento?.empresa?.nome || "Empresa";
  const telefoneEmpresa =
    agendamento?.empresa?.telefone || agendamento?.empresa?.whatsapp || "";
  const enderecoEmpresa = formatarEndereco(agendamento?.empresa);

  const data = agendamento?.dataHoraInicio
    ? formatarData(agendamento.dataHoraInicio)
    : "";

  const hora = agendamento?.dataHoraInicio
    ? formatarHora(agendamento.dataHoraInicio)
    : "";

  const existePrePagamento = agendamentos.some((item: any) =>
    Boolean(item?.servico?.exigePrePagamento),
  );

  const todosPagamentosAprovados = agendamentos.every((item: any) => {
    const exigePrePagamentoItem = Boolean(item?.servico?.exigePrePagamento);

    if (!exigePrePagamentoItem) return true;

    return pagamentoFoiAprovado(item?.statusPagamento);
  });

  const agendamentoConfirmado = !existePrePagamento || todosPagamentosAprovados;

  const statusAgendamento = agendamentoConfirmado
    ? "Confirmado"
    : textoStatus(agendamento?.status);

  const statusPagamento = existePrePagamento
    ? todosPagamentosAprovados
      ? "Pago"
      : "Aguardando pagamento"
    : "Sem pré-pagamento";

  const totalGeral = agendamentos.reduce((total: number, item: any) => {
    return total + Number(obterValorServico(item));
  }, 0);

  const totalPrePagamento = agendamentos.reduce((total: number, item: any) => {
    return total + Number(obterValorPrePagamento(item));
  }, 0);

  const linhasServicosWhatsapp = agendamentos
    .map((item: any, index: number) => {
      const nomeServico = item?.servico?.nome || "Serviço";
      const nomeProfissional = item?.profissional?.nome || "Profissional";
      const dataItem = item?.dataHoraInicio
        ? formatarData(item.dataHoraInicio)
        : "Data não informada";
      const horaItem = item?.dataHoraInicio
        ? formatarHora(item.dataHoraInicio)
        : "Horário não informado";
      const pagamentoItem = textoPagamento(
        item?.statusPagamento,
        Boolean(item?.servico?.exigePrePagamento),
      );
      const promocaoItem = promocaoFoiAplicada(item)
        ? `\n🎁 Promoção: ${item.promocaoTitulo || formatarTipoPromocao(item.promocaoTipo)}${item.promocaoUsoUnicoCpf ? " (1x por CPF)" : ""}`
        : "";

      return (
        `${index + 1}. *${nomeServico}*\n` +
        `👤 Profissional: ${nomeProfissional}\n` +
        `📅 Data: ${dataItem}\n` +
        `⏰ Horário: ${horaItem}\n` +
        `💳 Pagamento: ${pagamentoItem}` +
        promocaoItem
      );
    })
    .join("\n\n");

  const mensagemWhatsapp = encodeURIComponent(
    `✨ *${nomeEmpresa}* confirma seu agendamento!\n\n` +
      `Olá, *${nomeCliente}*! Tudo certo? 💜\n\n` +
      `Seu atendimento foi reservado com sucesso:\n\n` +
      `${linhasServicosWhatsapp}\n\n` +
      `💰 *Total:* ${formatarMoeda(totalGeral)}\n` +
      `💳 *Status geral:* ${statusPagamento}\n\n` +
      (enderecoEmpresa ? `📍 ${enderecoEmpresa}\n` : "") +
      (telefoneEmpresa ? `📞 ${telefoneEmpresa}\n` : "") +
      `\nQualquer dúvida, é só responder por aqui 😉\n\n` +
      `A gente te espera! ✨`,
  );

  const telefoneLimpo = limparTelefone(telefoneCliente);
  const linkWhatsapp = telefoneLimpo
    ? `https://wa.me/55${telefoneLimpo}?text=${mensagemWhatsapp}`
    : `https://wa.me/?text=${mensagemWhatsapp}`;

  const googleAgendaTexto = encodeURIComponent(
    agendamentos.length > 1
      ? `${agendamentos.length} serviços - ${nomeEmpresa}`
      : `${servico} - ${nomeEmpresa}`,
  );

  const googleAgendaDetalhes = encodeURIComponent(
    `Agendamento confirmado.\n\n` +
      `Cliente: ${nomeCliente}\n` +
      `Empresa: ${nomeEmpresa}\n` +
      (telefoneEmpresa ? `Telefone: ${telefoneEmpresa}\n` : "") +
      (enderecoEmpresa ? `Endereço: ${enderecoEmpresa}\n` : "") +
      `\nServiços:\n` +
      agendamentos
        .map((item: any, index: number) => {
          return `${index + 1}. ${item?.servico?.nome || "Serviço"} - ${item?.profissional?.nome || "Profissional"} - ${formatarData(item?.dataHoraInicio)} às ${formatarHora(item?.dataHoraInicio)}`;
        })
        .join("\n") +
      `\n\nPagamento: ${statusPagamento}`,
  );

  const primeiroInicio = agendamentos[0]?.dataHoraInicio;
  const ultimoFim = agendamentos[agendamentos.length - 1]?.dataHoraFim;

  const inicioGoogle = primeiroInicio
    ? new Date(primeiroInicio).toISOString().replace(/-|:|\.\d{3}/g, "")
    : "";

  const fimGoogle = ultimoFim
    ? new Date(ultimoFim).toISOString().replace(/-|:|\.\d{3}/g, "")
    : "";

  const linkGoogleAgenda =
    inicioGoogle && fimGoogle
      ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${googleAgendaTexto}&details=${googleAgendaDetalhes}&dates=${inicioGoogle}/${fimGoogle}`
      : "";

  const instagramEmpresa =
    agendamento?.empresa?.instagramUrl || agendamento?.empresa?.instagram || "";

  const instagramLink = instagramEmpresa
    ? instagramEmpresa.startsWith("http")
      ? instagramEmpresa
      : `https://instagram.com/${instagramEmpresa.replace("@", "")}`
    : "";

  const telefoneEmpresaLimpo = limparTelefone(telefoneEmpresa);

  const linkWhatsappEmpresa = telefoneEmpresaLimpo
    ? `https://wa.me/55${telefoneEmpresaLimpo}`
    : "";

  if (!agendamento) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#070b16",
          color: "#f8fafc",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <section
          style={{
            width: "min(420px, 100%)",
            borderRadius: 28,
            padding: 28,
            background: "rgba(15, 23, 42, 0.92)",
            border: "1px solid rgba(148, 163, 184, 0.22)",
            textAlign: "center",
            boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              display: "grid",
              placeItems: "center",
              margin: "0 auto 14px",
              background: "rgba(168, 85, 247, 0.18)",
              color: "#c084fc",
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            !
          </div>

          <h1 style={{ margin: "0 0 8px", fontSize: 24 }}>
            Comprovante não encontrado
          </h1>
          <p style={{ margin: "0 0 18px", color: "#cbd5e1", lineHeight: 1.5 }}>
            O reagendamento pode ter sido salvo, mas não conseguimos carregar o
            comprovante por este link.
          </p>
          <strong>
            Marc<span style={{ color: "#a855f7" }}>aê</span>
          </strong>
        </section>
      </main>
    );
  }

  const tema = gerarTemaEmpresa(agendamento?.empresa);

  return (
    <main
      id="comprovante"
      className="sucessoPage"
      style={
        {
          "--marcae-primary": tema.primary,
          "--marcae-secondary": tema.secondary,
          "--marcae-sidebar": tema.sidebar,
          "--marcae-primary-soft": tema.primarySoft,
          "--marcae-secondary-soft": tema.secondarySoft,
          "--marcae-primary-medium": tema.primaryMedium,
          "--marcae-secondary-medium": tema.secondaryMedium,
          "--marcae-gradient": tema.gradient,
          "--marcae-bg": tema.bg,
          "--marcae-bg-soft": tema.bgSoft,
          "--marcae-card": tema.card,
          "--marcae-card-strong": tema.cardStrong,
          "--marcae-border": tema.border,
          "--marcae-text": tema.text,
          "--marcae-muted": tema.muted,
          "--marcae-glow": tema.glow,
        } as CSSProperties
      }
    >
      <div className="sucessoScrollArea">
        <div className="backgroundGrid" />
        <div className="orb orbOne" />
        <div className="orb orbTwo" />
        <div className="orb orbThree" />

        <section className="receiptShell" data-receipt-shell="true">
          <aside className="heroPanel">
            <div className="brandPill">
              <span>✦</span>
              Marc<span>aê</span>
            </div>

            <div className="companyMark">
              {agendamento?.empresa?.logoUrl ? (
                <img src={agendamento.empresa.logoUrl} alt={nomeEmpresa} />
              ) : (
                <strong>
                  {String(nomeEmpresa || "M")
                    .charAt(0)
                    .toUpperCase()}
                </strong>
              )}
            </div>

            <div className="heroCopy">
              <div
                className={
                  agendamentoConfirmado
                    ? "statusBadge confirmed"
                    : "statusBadge pending"
                }
              >
                <span>{agendamentoConfirmado ? "✓" : "•"}</span>
                {statusAgendamento}
              </div>

              <h1>
                {agendamentoConfirmado
                  ? "Reserva confirmada."
                  : "Reserva recebida."}
              </h1>

              <p>
                {agendamentoConfirmado
                  ? `Seu atendimento em ${nomeEmpresa} está garantido.`
                  : "Seu atendimento foi criado e aguarda confirmação automática do pagamento."}
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
                    ? "Agendamento multi-serviço"
                    : "Agendamento online"}
                </span>

                <h2>
                  {agendamentos.length > 1
                    ? `${agendamentos.length} serviços agendados`
                    : servico}
                </h2>

                <p>
                  Olá, <strong>{nomeCliente}</strong>. Confira abaixo todos os
                  detalhes da sua reserva.
                </p>
              </div>

              <div
                className={
                  agendamentoConfirmado
                    ? "headerSeal confirmed"
                    : "headerSeal pending"
                }
              >
                {agendamentoConfirmado ? "Confirmado" : "Pendente"}
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
                  const exigePrePagamentoItem = Boolean(
                    item?.servico?.exigePrePagamento,
                  );
                  const statusPagamentoItem = textoPagamento(
                    item?.statusPagamento,
                    exigePrePagamentoItem,
                  );
                  const valorServicoItem = obterValorServico(item);
                  const valorPrePagamentoItem = obterValorPrePagamento(item);
                  const possuiPromocaoAplicada = promocaoFoiAplicada(item);
                  const valorOriginalItem = Number(
                    item?.valorOriginalServico ||
                      item?.servico?.valor ||
                      item?.servico?.preco ||
                      valorServicoItem ||
                      0,
                  );
                  const valorEconomizadoItem = Number(
                    item?.valorEconomizado ||
                      Math.max(valorOriginalItem - valorServicoItem, 0),
                  );
                  const descontoPromocaoItem = formatarDescontoPromocao(item);

                  return (
                    <article key={item.id} className="serviceCard">
                      <div className="timelineDot">
                        <span>{index + 1}</span>
                      </div>

                      <div className="serviceBody">
                        <div className="serviceTop">
                          <div>
                            <span className="serviceTag">
                              Serviço {index + 1}
                            </span>
                            <h3>{item?.servico?.nome || "Serviço"}</h3>
                            <p>
                              {formatarData(item?.dataHoraInicio)} às{" "}
                              {formatarHora(item?.dataHoraInicio)}
                            </p>
                          </div>

                          <div className="servicePriceBlock">
                            {possuiPromocaoAplicada &&
                              valorOriginalItem > valorServicoItem && (
                                <small>
                                  {formatarMoeda(valorOriginalItem)}
                                </small>
                              )}
                            <strong className="servicePrice">
                              {formatarMoeda(valorServicoItem)}
                            </strong>
                          </div>
                        </div>

                        <div className="detailGrid">
                          <div className="detailCard">
                            <span className="detailIcon">👤</span>
                            <div>
                              <small>Profissional</small>
                              <strong>
                                {item?.profissional?.nome || "Profissional"}
                              </strong>
                            </div>
                          </div>

                          <div className="detailCard">
                            <span className="detailIcon">⏱</span>
                            <div>
                              <small>Duração</small>
                              <strong>
                                {item?.duracaoMin ||
                                  item?.servico?.duracaoMin ||
                                  30}{" "}
                                minutos
                              </strong>
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
                                <strong>
                                  {formatarMoeda(valorPrePagamentoItem)}
                                </strong>
                              </div>
                            </div>
                          )}
                        </div>

                        {possuiPromocaoAplicada && (
                          <div className="promoNotice">
                            <div className="promoNoticeHeader">
                              <span>🎁 Promoção aplicada</span>
                              <strong>
                                {item?.promocaoTitulo ||
                                  formatarTipoPromocao(item?.promocaoTipo)}
                              </strong>
                            </div>

                            {item?.promocaoDescricao && (
                              <p>{item.promocaoDescricao}</p>
                            )}

                            <div className="promoNoticeGrid">
                              <div>
                                <small>Tipo</small>
                                <strong>
                                  {formatarTipoPromocao(item?.promocaoTipo)}
                                </strong>
                              </div>

                              {descontoPromocaoItem && (
                                <div>
                                  <small>Desconto</small>
                                  <strong>{descontoPromocaoItem}</strong>
                                </div>
                              )}

                              <div>
                                <small>Economia</small>
                                <strong>
                                  {formatarMoeda(valorEconomizadoItem)}
                                </strong>
                              </div>
                            </div>

                            {item?.promocaoUsoUnicoCpf && (
                              <div className="promoUsoUnico">
                                🔒 Promoção válida apenas 1 vez por CPF.
                              </div>
                            )}
                          </div>
                        )}

                        {exigePrePagamentoItem && (
                          <div className="policyNotice">
                            <strong>Política de pré-pagamento</strong>
                            <span>
                              O valor pago não é reembolsável em caso de falta
                              no dia do atendimento ou se o
                              cancelamento/reagendamento não for solicitado com
                              pelo menos 24 horas de antecedência.
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
                <div className="infoTile">
                  <span>Local do atendimento</span>

                  <strong>{enderecoEmpresa}</strong>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoEmpresa)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mapsButton"
                  >
                    📍 Abrir rota
                  </a>
                </div>
              )}
            </section>

            <section className="actions">
              <a
                href={linkWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="actionButton whatsapp"
              >
                Enviar confirmação no WhatsApp
              </a>

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
                <p>
                  Acompanhe a empresa ou fale direto pelo WhatsApp quando
                  precisar.
                </p>
              </div>

              <div className="socialActions">
                {instagramLink && (
                  <a
                    href={instagramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram
                  </a>
                )}

                {linkWhatsappEmpresa && (
                  <a
                    href={linkWhatsappEmpresa}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp da empresa
                  </a>
                )}
              </div>
            </section>

            <footer className="poweredBy">
              <span>Agendado por</span>
              <strong>
                Marc<span>aê</span>
              </strong>
            </footer>
          </section>
        </section>
      </div>

      <style>{`
        :global(html) {
          scroll-behavior: auto !important;
          background: #070b16;
        }

        :global(body) {
          margin: 0;
          background: #070b16;
          overflow-x: hidden;
          overflow-y: auto;
          scroll-behavior: auto !important;
        }

        * {
          box-sizing: border-box;
        }

        .sucessoPage {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;

  background:
    radial-gradient(circle at 15% 8%, var(--marcae-primary-soft), transparent 30%),
    radial-gradient(circle at 88% 18%, var(--marcae-secondary-soft), transparent 28%),
    radial-gradient(circle at 50% 100%, var(--marcae-primary-soft), transparent 34%),
    linear-gradient(
      135deg,
      var(--marcae-bg) 0%,
      var(--marcae-bg-soft) 44%,
      var(--marcae-sidebar) 100%
    );

  color: var(--marcae-text);
  font-family: Arial, sans-serif;
}

        .sucessoScrollArea {
  position: relative;
  width: 100%;
  min-height: 100vh;
          width: 100%;
          height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 28px 20px 40px;
          scroll-behavior: auto;
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
          opacity: 0.72;
          pointer-events: none;
        }

        .orbOne {
          width: 280px;
          height: 280px;
          background: var(--marcae-primary-soft);
          top: 8%;
          left: 6%;
        }

        .orbTwo {
          width: 240px;
          height: 240px;
          background: var(--marcae-secondary-soft);
          right: 8%;
          top: 18%;
        }

        .orbThree {
          width: 360px;
          height: 360px;
          background: var(--marcae-primary-soft);
          bottom: -120px;
          left: 42%;
        }

        .receiptShell {
          position: relative;
          z-index: 1;
          width: min(940px, 100%);
          display: grid;
          grid-template-columns: 0.82fr 1fr;
          gap: 16px;
          align-items: stretch;
        }

        .receiptShell,
        .heroPanel,
        .contentPanel {
          visibility: visible !important;
          opacity: 1 !important;
        }

        .receiptShell {
          margin: 0 auto;
        }

        .heroPanel,
.contentPanel,
.emptyState {
  border: 1px solid rgba(237, 233, 255, 0.12);
  background: rgba(17, 20, 37, 0.96);
  box-shadow: 0 34px 90px rgba(0, 0, 0, 0.5);
}

        .heroPanel {
          min-height: auto;
          border-radius: 38px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          position: relative;
        }

        .heroPanel::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 10%, var(--marcae-secondary-soft), transparent 35%),
            radial-gradient(circle at 75% 60%, var(--marcae-primary-soft), transparent 36%);
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
          color: var(--marcae-text);
          font-size: 14px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .brandPill span:last-child,
        .poweredBy strong span {
          color: var(--marcae-secondary);
        }

        .companyMark {
          width: 118px;
          height: 118px;
          border-radius: 34px;
          background:
            linear-gradient(var(--marcae-sidebar), var(--marcae-sidebar)) padding-box,
            linear-gradient(135deg, var(--marcae-secondary-soft), var(--marcae-primary-soft)) border-box;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 30px 80px var(--marcae-primary-soft);
        }

        .companyMark img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .companyMark strong {
          font-size: 52px;
          color: var(--marcae-secondary);
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
          color: var(--marcae-muted);
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
          color: var(--marcae-muted);
          font-size: 11px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.09em;
        }

        .heroStats strong {
          color: var(--marcae-text);
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
          color: var(--marcae-text);
        }

        .contentPanel {
          border-radius: 38px;
          padding: 24px;
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
          color: var(--marcae-muted);
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
            linear-gradient(145deg, var(--marcae-primary-soft), rgba(237, 233, 255, 0.06));
          border: 1px solid var(--marcae-secondary-soft);
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
          background: linear-gradient(180deg, var(--marcae-secondary-soft), var(--marcae-secondary-soft));
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
          background: linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary));
          box-shadow: 0 18px 40px var(--marcae-primary-soft);
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
          background: var(--marcae-secondary-soft);
          color: var(--marcae-text);
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
          color: var(--marcae-muted);
          font-size: 14px;
          line-height: 1.4;
        }

        .servicePrice {
          white-space: nowrap;
          color: #fff;
          font-size: 16px;
        }


        .servicePriceBlock {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .servicePriceBlock small {
          color: var(--marcae-muted);
          font-size: 12px;
          font-weight: 800;
          text-decoration: line-through;
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
          background: var(--marcae-secondary-soft);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .detailCard strong {
          display: block;
          color: var(--marcae-text);
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


        .promoNotice {
          margin-top: 16px;
          border-radius: 22px;
          padding: 18px;
          background:
            radial-gradient(circle at top left, rgba(168, 85, 247, 0.22), transparent 42%),
            rgba(88, 28, 135, 0.16);
          border: 1px solid rgba(196, 181, 253, 0.22);
          color: var(--marcae-text);
        }

        .promoNoticeHeader {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .promoNoticeHeader span {
          color: var(--marcae-text);
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .promoNoticeHeader strong {
          color: #fff;
          font-size: 16px;
          font-weight: 950;
          text-align: right;
        }

        .promoNotice p {
          margin: 10px 0 0;
          color: var(--marcae-secondary);
          line-height: 1.6;
          font-weight: 700;
        }

        .promoNoticeGrid {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .promoNoticeGrid div {
          border-radius: 16px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .promoNoticeGrid small {
          color: var(--marcae-secondary);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .promoNoticeGrid strong {
          color: #fff;
          font-size: 13px;
          font-weight: 950;
        }

        .promoUsoUnico {
          margin-top: 12px;
          border-radius: 14px;
          padding: 11px 12px;
          background: rgba(34, 197, 94, 0.10);
          border: 1px solid rgba(34, 197, 94, 0.18);
          color: #bbf7d0;
          font-size: 13px;
          font-weight: 900;
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

.mapsButton {
  margin-top: 12px;
  min-height: 42px;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    var(--marcae-primary),
    var(--marcae-secondary)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #fff;
  font-size: 13px;
  font-weight: 900;
  transition: all 0.2s ease;
  box-shadow: 0 14px 28px var(--marcae-primary-soft);
}

.mapsButton:hover {
  transform: translateY(-2px);
  filter: brightness(1.06);
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
          background: linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary));
          box-shadow: 0 18px 36px var(--marcae-primary-soft);
        }

        .socialCard {
          border-radius: 28px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background:
            radial-gradient(circle at right, var(--marcae-secondary-soft), transparent 34%),
            rgba(237, 233, 255, 0.06);
          border: 1px solid var(--marcae-secondary-soft);
        }

        .socialCard strong {
          display: block;
          color: #fff;
          margin-top: 6px;
          font-size: 20px;
        }

        .socialCard p {
          color: var(--marcae-muted);
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
          color: var(--marcae-muted);
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
          background: var(--marcae-secondary-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--marcae-secondary);
          font-size: 28px;
          font-weight: 950;
        }

        .emptyState h1 {
          color: #fff;
          margin: 0 0 10px;
          letter-spacing: -0.05em;
        }

        .emptyState p {
          color: var(--marcae-muted);
          margin: 0 0 20px;
          line-height: 1.5;
        }

        .emptyState strong {
          color: #fff;
          letter-spacing: -0.04em;
        }

        .emptyState strong span {
          color: var(--marcae-secondary);
        }

                @media (min-width: 981px) {
  .sucessoScrollArea {
    justify-content: center;
    align-items: flex-start;
    padding: 28px 20px 40px;
  }

  .receiptShell {
  width: min(940px, 100%);
  grid-template-columns: 0.82fr 1fr;
  gap: 16px;
  margin-left: auto;
  margin-right: auto;
}

  .heroPanel {
    min-height: 660px;
  }
}

        @media (max-width: 980px) {
          .sucessoScrollArea {
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
          .sucessoScrollArea {
            align-items: flex-start;
            justify-content: flex-start;
            padding: 12px;
          }

          .receiptShell {
            width: 100%;
          }

          .heroPanel,
          .contentPanel {
            border-radius: 28px;
            padding: 20px;
          }

          .heroCopy h1 {
            font-size: 48px;
          }

          .heroStats,
          .summaryRibbon,
          .infoGrid,
          .actions,
          .promoNoticeGrid {
            grid-template-columns: 1fr;
          }

          .contentHeader,
          .serviceTop,
          .socialCard {
            flex-direction: column;
          }

          .serviceCard {
            grid-template-columns: 1fr;
          }

          .serviceTimeline::before {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
