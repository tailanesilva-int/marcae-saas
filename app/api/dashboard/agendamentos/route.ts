import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function numero(valor: any) {
  const convertido = Number(valor || 0);
  return Number.isNaN(convertido) ? 0 : convertido;
}

function pagamentoFoiRealizado(status?: string | null) {
  const s = String(status || '').toLowerCase();
  return s === 'pago' || s === 'aprovado' || s === 'confirmado';
}

function chaveUnicaAgendamento(agendamento: any) {
  if (agendamento.id) return agendamento.id;

  const clienteId = agendamento.clienteId || agendamento.cliente?.id || '';
  const servicoId = agendamento.servicoId || agendamento.servico?.id || '';
  const profissionalId = agendamento.profissionalId || agendamento.profissional?.id || '';

  const dataHora = agendamento.dataHoraInicio
    ? new Date(agendamento.dataHoraInicio).toISOString()
    : '';

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
  const status = String(agendamento.status || '').toLowerCase();

  if (status !== 'concluido' && status !== 'em_atendimento') {
    return 0;
  }

  if (!pagamentoFoiRealizado(agendamento.statusPagamento)) {
    return 0;
  }

  return numero(agendamento.valorTotal);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get('empresaId');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    if (!empresaId) {
      return NextResponse.json(
        { error: 'empresaId não informado' },
        { status: 400 }
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
            createdAt: 'asc',
          },
        },
      },
      orderBy: { dataHoraInicio: 'asc' },
    });

    const agendamentos = removerAgendamentosDuplicados(agendamentosBrutos as any[]);

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
      const data = dataAgendamento.toISOString().split('T')[0];
      const dataFutura = dataAgendamento.getTime() > hoje.getTime();

      const cancelado = ag.status === 'cancelado';

      if (!mapaAgendamentos[data]) mapaAgendamentos[data] = 0;
      mapaAgendamentos[data]++;

      const status = ag.status || 'indefinido';
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
            adicional.custo || adicional.servico?.custo
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

    const lucroLiquido = faturamentoTotal - custoOperacionalTotal - totalComissoes;
    const ticketMedio = totalPagos > 0 ? faturamentoTotal / totalPagos : 0;

    const graficoFaturamento = Object.entries(mapaFaturamento).map(
      ([data, total]) => ({ data, total })
    );

    const graficoAgendamentos = Object.entries(mapaAgendamentos).map(
      ([data, total]) => ({ data, total })
    );

    const graficoStatus = Object.entries(mapaStatus).map(
      ([status, total]) => ({ status, total })
    );

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
    });
  } catch (error: any) {
    console.error('Erro dashboard:', error);

    return NextResponse.json(
      {
        error: 'Erro ao buscar dados do dashboard',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}