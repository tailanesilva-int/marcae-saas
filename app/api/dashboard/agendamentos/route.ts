import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function numero(valor: any) {
  const convertido = Number(valor || 0);
  return Number.isNaN(convertido) ? 0 : convertido;
}

function pagamentoFoiRealizado(status?: string | null) {
  const s = String(status || "").toLowerCase();
  return s === "pago" || s === "aprovado" || s === "confirmado";
}

function chaveUnicaAgendamento(agendamento: any) {
  if (agendamento.id) return agendamento.id;

  const clienteId = agendamento.clienteId || agendamento.cliente?.id || "";
  const servicoId = agendamento.servicoId || agendamento.servico?.id || "";
  const profissionalId =
    agendamento.profissionalId || agendamento.profissional?.id || "";

  const dataHora = agendamento.dataHoraInicio
    ? new Date(agendamento.dataHoraInicio).toISOString()
    : "";

  return `${clienteId}-${servicoId}-${profissionalId}-${dataHora}`;
}

function removerAgendamentosDuplicados(lista: any[]) {
  const mapa = new Map<string, any>();

  lista.forEach((agendamento) => {
    const chave = chaveUnicaAgendamento(agendamento);
    const existente = mapa.get(chave);

    if (!existente) {
      mapa.set(chave, agendamento);
      return;
    }

    const dataAtual = new Date(agendamento.dataHoraInicio).getTime();
    const dataExistente = new Date(existente.dataHoraInicio).getTime();

    if (dataAtual > dataExistente) {
      mapa.set(chave, agendamento);
    }
  });

  return Array.from(mapa.values());
}

function obterValorRecebido(agendamento: any) {
  const status = String(agendamento.status || "").toLowerCase();

  if (status !== "concluido" && status !== "em_atendimento") {
    return 0;
  }

  if (!pagamentoFoiRealizado(agendamento.statusPagamento)) {
    return 0;
  }

  return numero(agendamento.valorTotal);
}

function obterNomeClienteRanking(agendamento: any) {
  return (
    agendamento?.cliente?.nome ||
    agendamento?.clienteNome ||
    agendamento?.nomeCliente ||
    "Cliente não informado"
  );
}

function obterIdClienteRanking(agendamento: any) {
  return agendamento?.clienteId || agendamento?.cliente?.id || "";
}

function obterNomeServicoRanking(agendamento: any) {
  return (
    agendamento?.servico?.nome ||
    agendamento?.servicoNome ||
    "Serviço não informado"
  );
}

function obterIdServicoRanking(agendamento: any) {
  return agendamento?.servicoId || agendamento?.servico?.id || "";
}

function obterNomeProfissionalRanking(agendamento: any) {
  return (
    agendamento?.profissional?.nome ||
    agendamento?.profissionalNome ||
    "Profissional não informado"
  );
}

function obterIdProfissionalRanking(agendamento: any) {
  return agendamento?.profissionalId || agendamento?.profissional?.id || "";
}

function incrementarRanking(mapa: Record<string, number>, chave: string) {
  if (!chave) return;
  mapa[chave] = (mapa[chave] || 0) + 1;
}

function obterMaisFrequente(mapa: Record<string, number>) {
  const ordenado = Object.entries(mapa).sort((a, b) => b[1] - a[1]);

  if (ordenado.length === 0) {
    return {
      nome: "",
      quantidade: 0,
    };
  }

  return {
    nome: ordenado[0][0],
    quantidade: ordenado[0][1],
  };
}

function montarRankingsDashboard(agendamentos: any[]) {
  const clientes = new Map<string, any>();
  const servicos = new Map<string, any>();
  const profissionais = new Map<string, any>();

  agendamentos.forEach((agendamento) => {
    if (!agendamento?.dataHoraInicio) return;
    if (agendamento?.status === "cancelado") return;

    const clienteId = obterIdClienteRanking(agendamento);
    const clienteNome = obterNomeClienteRanking(agendamento);
    const chaveCliente = clienteId || clienteNome;
    const servicoId = obterIdServicoRanking(agendamento);
    const servicoNome = obterNomeServicoRanking(agendamento);
    const chaveServico = servicoId || servicoNome;
    const profissionalId = obterIdProfissionalRanking(agendamento);
    const profissionalNome = obterNomeProfissionalRanking(agendamento);
    const chaveProfissional = profissionalId || profissionalNome;
    const valorAgendamento = numero(
      agendamento?.valorTotal ||
        agendamento?.servico?.valor ||
        agendamento?.servico?.preco ||
        0,
    );
    const dataAtendimento = new Date(agendamento.dataHoraInicio);

    if (!clientes.has(chaveCliente)) {
      clientes.set(chaveCliente, {
        clienteId,
        nome: clienteNome,
        quantidadeAgendamentos: 0,
        valorTotal: 0,
        ticketMedio: 0,
        ultimoAtendimento: null,
        servicos: {},
        profissionais: {},
      });
    }

    const clienteRanking = clientes.get(chaveCliente);
    clienteRanking.quantidadeAgendamentos += 1;
    clienteRanking.valorTotal += valorAgendamento;

    if (
      !clienteRanking.ultimoAtendimento ||
      dataAtendimento.getTime() >
        new Date(clienteRanking.ultimoAtendimento).getTime()
    ) {
      clienteRanking.ultimoAtendimento = agendamento.dataHoraInicio;
    }

    incrementarRanking(clienteRanking.servicos, servicoNome);
    incrementarRanking(clienteRanking.profissionais, profissionalNome);

    if (!servicos.has(chaveServico)) {
      servicos.set(chaveServico, {
        servicoId,
        nome: servicoNome,
        quantidade: 0,
        faturamento: 0,
        ticketMedio: 0,
        profissionais: {},
      });
    }

    const servicoRanking = servicos.get(chaveServico);
    servicoRanking.quantidade += 1;
    servicoRanking.faturamento += valorAgendamento;
    incrementarRanking(servicoRanking.profissionais, profissionalNome);

    if (!profissionais.has(chaveProfissional)) {
      profissionais.set(chaveProfissional, {
        profissionalId,
        nome: profissionalNome,
        atendimentos: 0,
        faturamento: 0,
        comissao: 0,
        ticketMedio: 0,
        servicos: {},
      });
    }

    const profissionalRanking = profissionais.get(chaveProfissional);
    profissionalRanking.atendimentos += 1;
    profissionalRanking.faturamento += valorAgendamento;

    const comissoes = Array.isArray(agendamento?.comissoes)
      ? agendamento.comissoes
      : [];
    profissionalRanking.comissao += comissoes.reduce(
      (total: number, comissao: any) => total + numero(comissao?.valorComissao),
      0,
    );

    incrementarRanking(profissionalRanking.servicos, servicoNome);
  });

  const rankingClientes = Array.from(clientes.values())
    .map((cliente) => {
      const servicoMaisRealizado = obterMaisFrequente(cliente.servicos);
      const profissionalMaisEscolhido = obterMaisFrequente(
        cliente.profissionais,
      );

      return {
        clienteId: cliente.clienteId,
        nome: cliente.nome,
        quantidadeAgendamentos: cliente.quantidadeAgendamentos,
        valorTotal: cliente.valorTotal,
        ticketMedio:
          cliente.quantidadeAgendamentos > 0
            ? cliente.valorTotal / cliente.quantidadeAgendamentos
            : 0,
        ultimoAtendimento: cliente.ultimoAtendimento,
        servicoMaisRealizado: servicoMaisRealizado.nome,
        quantidadeServico: servicoMaisRealizado.quantidade,
        profissionalMaisEscolhido: profissionalMaisEscolhido.nome,
        quantidadeProfissional: profissionalMaisEscolhido.quantidade,
      };
    })
    .sort((a, b) => {
      if (b.quantidadeAgendamentos !== a.quantidadeAgendamentos) {
        return b.quantidadeAgendamentos - a.quantidadeAgendamentos;
      }

      if (b.valorTotal !== a.valorTotal) {
        return b.valorTotal - a.valorTotal;
      }

      return (
        new Date(b.ultimoAtendimento || 0).getTime() -
        new Date(a.ultimoAtendimento || 0).getTime()
      );
    });

  const rankingServicos = Array.from(servicos.values())
    .map((servico) => {
      const profissionalMaisExecutou = obterMaisFrequente(
        servico.profissionais,
      );

      return {
        servicoId: servico.servicoId,
        nome: servico.nome,
        quantidade: servico.quantidade,
        faturamento: servico.faturamento,
        ticketMedio:
          servico.quantidade > 0 ? servico.faturamento / servico.quantidade : 0,
        profissionalMaisExecutou: profissionalMaisExecutou.nome,
        quantidadeProfissional: profissionalMaisExecutou.quantidade,
      };
    })
    .sort((a, b) => {
      if (b.quantidade !== a.quantidade) return b.quantidade - a.quantidade;
      return b.faturamento - a.faturamento;
    });

  const rankingProfissionais = Array.from(profissionais.values())
    .map((profissional) => {
      const servicoMaisRealizado = obterMaisFrequente(profissional.servicos);

      return {
        profissionalId: profissional.profissionalId,
        nome: profissional.nome,
        atendimentos: profissional.atendimentos,
        faturamento: profissional.faturamento,
        comissao: profissional.comissao,
        ticketMedio:
          profissional.atendimentos > 0
            ? profissional.faturamento / profissional.atendimentos
            : 0,
        servicoMaisRealizado: servicoMaisRealizado.nome,
        quantidadeServico: servicoMaisRealizado.quantidade,
      };
    })
    .sort((a, b) => {
      if (b.atendimentos !== a.atendimentos)
        return b.atendimentos - a.atendimentos;
      return b.faturamento - a.faturamento;
    });

  return {
    clientes: rankingClientes,
    servicos: rankingServicos,
    profissionais: rankingProfissionais,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get("empresaId");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresaId não informado" },
        { status: 400 },
      );
    }

    const where: any = { empresaId };

    if (dataInicio && dataFim) {
      where.dataHoraInicio = {
        gte: new Date(`${dataInicio}T00:00:00`),
        lte: new Date(`${dataFim}T23:59:59`),
      };
    }

    const agendamentosBrutos = await prisma.agendamento.findMany({
      where,
      include: {
        cliente: true,
        servico: true,
        profissional: true,
        empresa: true,
        comissoes: true,
        servicosAdicionais: {
          include: {
            servico: true,
            profissional: true,
            comissoes: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: { dataHoraInicio: "asc" },
    });

    const agendamentos = removerAgendamentosDuplicados(
      agendamentosBrutos as any[],
    );

    let faturamentoTotal = 0;
    let totalPagos = 0;
    let custoOperacionalTotal = 0;
    let totalComissoes = 0;

    const mapaFaturamento: Record<string, number> = {};
    const mapaAgendamentos: Record<string, number> = {};
    const mapaStatus: Record<string, number> = {};

    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    agendamentos.forEach((agendamentoBase) => {
      const ag = agendamentoBase as any;

      if (!ag.dataHoraInicio) return;

      const dataAgendamento = new Date(ag.dataHoraInicio);
      const data = dataAgendamento.toISOString().split("T")[0];
      const dataFutura = dataAgendamento.getTime() > hoje.getTime();

      const cancelado = ag.status === "cancelado";

      if (!mapaAgendamentos[data]) mapaAgendamentos[data] = 0;
      mapaAgendamentos[data]++;

      const status = ag.status || "indefinido";
      if (!mapaStatus[status]) mapaStatus[status] = 0;
      mapaStatus[status]++;

      if (cancelado) return;

      const valorRecebido = obterValorRecebido(ag);

      if (valorRecebido > 0) {
        faturamentoTotal += valorRecebido;
        totalPagos++;

        custoOperacionalTotal += numero((ag.servico as any)?.custo);

        if (!dataFutura) {
          if (!mapaFaturamento[data]) mapaFaturamento[data] = 0;
          mapaFaturamento[data] += valorRecebido;
        }
      }

      const servicosAdicionais = (ag.servicosAdicionais || []) as any[];

      for (const adicional of servicosAdicionais) {
        if (pagamentoFoiRealizado(adicional.statusPagamento)) {
          const valorAdicional = numero(adicional.valor);

          faturamentoTotal += valorAdicional;
          custoOperacionalTotal += numero(
            adicional.custo || adicional.servico?.custo,
          );

          if (!dataFutura) {
            if (!mapaFaturamento[data]) mapaFaturamento[data] = 0;
            mapaFaturamento[data] += valorAdicional;
          }
        }
      }

      const comissoes = (ag.comissoes || []) as any[];

      for (const comissao of comissoes) {
        totalComissoes += numero(comissao.valorComissao);
      }
    });

    const lucroLiquido =
      faturamentoTotal - custoOperacionalTotal - totalComissoes;
    const ticketMedio = totalPagos > 0 ? faturamentoTotal / totalPagos : 0;

    const graficoFaturamento = Object.entries(mapaFaturamento).map(
      ([data, total]) => ({ data, total }),
    );

    const graficoAgendamentos = Object.entries(mapaAgendamentos).map(
      ([data, total]) => ({ data, total }),
    );

    const graficoStatus = Object.entries(mapaStatus).map(([status, total]) => ({
      status,
      total,
    }));

    const ranking = montarRankingsDashboard(agendamentos as any[]);

    return NextResponse.json({
      success: true,
      total: agendamentos.length,
      agendamentos,
      resumo: {
        faturamentoTotal,
        faturamentoBruto: faturamentoTotal,
        totalPagos,
        ticketMedio,
        custoOperacionalTotal,
        totalComissoes,
        lucroLiquido,
        liquidoEstimado: lucroLiquido,
      },
      graficoFaturamento,
      graficoAgendamentos,
      graficoStatus,
      ranking,
    });
  } catch (error: any) {
    console.error("Erro dashboard:", error);

    return NextResponse.json(
      {
        error: "Erro ao buscar dados do dashboard",
        detalhe: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}
