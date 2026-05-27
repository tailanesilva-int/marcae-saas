import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get('empresaId');
    const ultimoCheck = searchParams.get('ultimoCheck');

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId obrigatório.' },
        { status: 400 }
      );
    }

    const serverNow = new Date();

    const ultimoAgendamento = await prisma.agendamento.findFirst({
      where: {
        empresaId,
        status: {
          not: 'cancelado',
        },
      },
      include: {
        cliente: true,
        servico: true,
        profissional: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!ultimoCheck) {
      return NextResponse.json({
        success: true,
        temNovo: false,
        quantidadeNovos: 0,
        serverNow: serverNow.toISOString(),
        ultimoAgendamentoId: ultimoAgendamento?.id || null,
        ultimoAgendamento: ultimoAgendamento || null,
        novosAgendamentos: [],
      });
    }

    const dataUltimoCheck = new Date(ultimoCheck);

    if (Number.isNaN(dataUltimoCheck.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'ultimoCheck inválido.',
        },
        { status: 400 }
      );
    }

    const novosAgendamentos = await prisma.agendamento.findMany({
      where: {
        empresaId,
        status: {
          not: 'cancelado',
        },
        createdAt: {
          gt: dataUltimoCheck,
          lte: serverNow,
        },
      },
      include: {
        cliente: true,
        servico: true,
        profissional: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 12,
    });

    return NextResponse.json({
      success: true,
      temNovo: novosAgendamentos.length > 0,
      quantidadeNovos: novosAgendamentos.length,
      serverNow: serverNow.toISOString(),
      ultimoAgendamentoId: ultimoAgendamento?.id || null,
      ultimoAgendamento: ultimoAgendamento || null,
      novosAgendamentos,
    });
  } catch (error: any) {
    console.error('Erro ao buscar notificações de agendamentos:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar notificações de agendamentos.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
