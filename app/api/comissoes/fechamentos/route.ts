import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: Request) {
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

    const where: any = {
      empresaId,
    };

    if (dataInicio && dataFim) {
      where.createdAt = {
        gte: new Date(`${dataInicio}T00:00:00`),
        lte: new Date(`${dataFim}T23:59:59`),
      };
    }

    const fechamentos = await (prisma as any).comissaoPagamento.findMany({
      where,
      include: {
        profissional: true,
        comissoes: {
          select: {
            id: true,
            valorComissao: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      fechamentos: fechamentos.map((item: any) => ({
        id: item.id,
        empresaId: item.empresaId,
        profissionalId: item.profissionalId,
        profissionalNome: item.profissional?.nome || 'Profissional não informado',
        valorPago: Number(item.valorPago || 0),
        dataInicio: item.dataInicio,
        dataFim: item.dataFim,
        observacao: item.observacao,
        createdAt: item.createdAt,
        totalComissoes: item.comissoes.length,
      })),
    });
  } catch (error: any) {
    console.error('Erro ao buscar fechamentos:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar fechamentos.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}