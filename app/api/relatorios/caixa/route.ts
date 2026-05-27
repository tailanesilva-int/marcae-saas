import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function numero(valor: any) {
  const convertido = Number(valor || 0);
  return Number.isNaN(convertido) ? 0 : convertido;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get('empresaId');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId obrigatório.' },
        { status: 400 }
      );
    }

    const inicio = dataInicio
      ? new Date(`${dataInicio}T00:00:00`)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const fim = dataFim
      ? new Date(`${dataFim}T23:59:59`)
      : new Date();

    const caixas = await (prisma as any).caixaDiario.findMany({
      where: {
        empresaId,
        data: {
          gte: inicio,
          lte: fim,
        },
      },
      include: {
        movimentacoes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        data: 'desc',
      },
    });

    const resumo = caixas.reduce(
      (acc: any, caixa: any) => {
        acc.totalCaixas += 1;

        if (caixa.status === 'aberto') {
          acc.abertos += 1;
        }

        if (caixa.status === 'fechado') {
          acc.fechados += 1;
        }

        if (caixa.conferenciaStatus === 'aprovado') {
          acc.aprovados += 1;
        }

        if (caixa.conferenciaStatus === 'pendente') {
          acc.pendentesConferencia += 1;
        }

        acc.saldoInicial += numero(caixa.saldoInicial);
        acc.saldoSistema += numero(caixa.saldoSistema);
        acc.saldoInformado += numero(caixa.saldoInformado);
        acc.diferenca += numero(caixa.diferenca);

        acc.dinheiroSistema += numero(caixa.saldoDinheiroSistema);
        acc.pixSistema += numero(caixa.saldoPixSistema);
        acc.debitoSistema += numero(caixa.saldoDebitoSistema);
        acc.creditoSistema += numero(caixa.saldoCreditoSistema);
        acc.outroSistema += numero(caixa.saldoOutroSistema);

        return acc;
      },
      {
        totalCaixas: 0,
        abertos: 0,
        fechados: 0,
        aprovados: 0,
        pendentesConferencia: 0,
        saldoInicial: 0,
        saldoSistema: 0,
        saldoInformado: 0,
        diferenca: 0,
        dinheiroSistema: 0,
        pixSistema: 0,
        debitoSistema: 0,
        creditoSistema: 0,
        outroSistema: 0,
      }
    );

    return NextResponse.json({
      success: true,
      periodo: {
        inicio,
        fim,
      },
      resumo,
      caixas,
    });
  } catch (error: any) {
    console.error('Erro ao gerar relatório de caixa:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao gerar relatório de caixa.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}