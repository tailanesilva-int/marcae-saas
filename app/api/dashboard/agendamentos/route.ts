import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

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
      },
      orderBy: { dataHoraInicio: 'asc' },
    });

    let faturamentoTotal = 0;
    let totalPagos = 0;

    const mapaFaturamento: Record<string, number> = {};
    const mapaAgendamentos: Record<string, number> = {};
    const mapaStatus: Record<string, number> = {};

    agendamentos.forEach((ag) => {
      if (!ag.dataHoraInicio) return;

      const data = ag.dataHoraInicio.toISOString().split('T')[0];
      const valorPago = obterValorPago(ag);

      const estaPago =
        ag.statusPagamento === 'pago' ||
        ag.statusPagamento === 'aprovado' ||
        ag.statusPagamento === 'confirmado';

      if (estaPago) {
        faturamentoTotal += valorPago;
        totalPagos++;

        if (!mapaFaturamento[data]) mapaFaturamento[data] = 0;
        mapaFaturamento[data] += valorPago;
      }

      if (!mapaAgendamentos[data]) mapaAgendamentos[data] = 0;
      mapaAgendamentos[data]++;

      const status = ag.status || 'indefinido';
      if (!mapaStatus[status]) mapaStatus[status] = 0;
      mapaStatus[status]++;
    });

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
        totalPagos,
        ticketMedio,
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