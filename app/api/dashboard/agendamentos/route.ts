import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function numero(valor: any) {
  const convertido = Number(valor || 0);
  return Number.isNaN(convertido) ? 0 : convertido;
}

function pagamentoFoiRealizado(status?: string | null) {
  return (
    status === 'pago' ||
    status === 'aprovado' ||
    status === 'confirmado'
  );
}

function obterValorPago(agendamento: any) {
  return Number(
    agendamento.valorPrePago ||
      agendamento.valorTotal ||
      0
  );
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

    const agendamentos = await prisma.agendamento.findMany({
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

    let faturamentoTotal = 0;
    let totalPagos = 0;
    let custoOperacionalTotal = 0;
    let totalComissoes = 0;

    const mapaFaturamento: Record<string, number> = {};
    const mapaAgendamentos: Record<string, number> = {};
    const mapaStatus: Record<string, number> = {};

    agendamentos.forEach((agendamentoBase) => {
      const ag = agendamentoBase as any;

      if (!ag.dataHoraInicio) return;

      const data = ag.dataHoraInicio.toISOString().split('T')[0];
      const valorPago = obterValorPago(ag);

      const estaPago = pagamentoFoiRealizado(ag.statusPagamento);

      if (estaPago) {
        faturamentoTotal += valorPago;
        totalPagos++;

        custoOperacionalTotal += numero((ag.servico as any)?.custo);

        if (!mapaFaturamento[data]) mapaFaturamento[data] = 0;
        mapaFaturamento[data] += valorPago;
      }

      const servicosAdicionais = (ag.servicosAdicionais || []) as any[];

      for (const adicional of servicosAdicionais) {
        if (pagamentoFoiRealizado(adicional.statusPagamento)) {
          faturamentoTotal += numero(adicional.valor);
          custoOperacionalTotal += numero(
            adicional.custo || adicional.servico?.custo
          );

          if (!mapaFaturamento[data]) mapaFaturamento[data] = 0;
          mapaFaturamento[data] += numero(adicional.valor);
        }
      }

      const comissoes = (ag.comissoes || []) as any[];

      for (const comissao of comissoes) {
        totalComissoes += numero(comissao.valorComissao);
      }

      if (!mapaAgendamentos[data]) mapaAgendamentos[data] = 0;
      mapaAgendamentos[data]++;

      const status = ag.status || 'indefinido';
      if (!mapaStatus[status]) mapaStatus[status] = 0;
      mapaStatus[status]++;
    });

    const lucroLiquido =
      faturamentoTotal - custoOperacionalTotal - totalComissoes;

    const ticketMedio =
      totalPagos > 0 ? faturamentoTotal / totalPagos : 0;

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