import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function numero(valor: any) {
  const convertido = Number(valor || 0);
  return Number.isNaN(convertido) ? 0 : convertido;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      empresaId,
      profissionalId,
      dataInicio,
      dataFim,
      observacao,
    } = body;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId obrigatório.' },
        { status: 400 }
      );
    }

    if (!profissionalId) {
      return NextResponse.json(
        { success: false, error: 'profissionalId obrigatório.' },
        { status: 400 }
      );
    }

    if (!dataInicio || !dataFim) {
      return NextResponse.json(
        { success: false, error: 'Informe o período do fechamento.' },
        { status: 400 }
      );
    }

    const inicio = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T23:59:59`);

    const comissoesPendentes = await prisma.comissao.findMany({
      where: {
        empresaId,
        profissionalId,
        status: {
          not: 'pago',
        },
        createdAt: {
          gte: inicio,
          lte: fim,
        },
      },
    });

    if (comissoesPendentes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhuma comissão pendente encontrada para este profissional no período.',
        },
        { status: 400 }
      );
    }

    const valorPago = comissoesPendentes.reduce(
      (total, comissao) => total + numero(comissao.valorComissao),
      0
    );

    const fechamento = await prisma.comissaoPagamento.create({
      data: {
        empresaId,
        profissionalId,
        valorPago,
        dataInicio: inicio,
        dataFim: fim,
        observacao: observacao?.trim() || null,
      },
    });

    await prisma.comissao.updateMany({
      where: {
        id: {
          in: comissoesPendentes.map((comissao) => comissao.id),
        },
      },
      data: {
        status: 'pago',
        pagamentoId: fechamento.id,
        dataPagamento: new Date(),
        pagoEm: new Date(),
        repasseObservacao: observacao?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      fechamento,
      totalComissoes: comissoesPendentes.length,
      valorPago,
      message: 'Fechamento de comissão realizado com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao fechar comissões:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao fechar comissões.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}