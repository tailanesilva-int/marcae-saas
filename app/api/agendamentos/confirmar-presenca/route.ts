import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.empresaId || !body.agendamentoId) {
      return NextResponse.json(
        { success: false, error: 'empresaId e agendamentoId são obrigatórios.' },
        { status: 400 }
      );
    }

    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id: body.agendamentoId,
        empresaId: body.empresaId,
      },
    });

    if (!agendamento) {
      return NextResponse.json(
        { success: false, error: 'Atendimento não encontrado.' },
        { status: 404 }
      );
    }

    if (agendamento.status === 'cancelado') {
      return NextResponse.json(
        { success: false, error: 'Atendimento cancelado não pode ter presença confirmada.' },
        { status: 400 }
      );
    }

    if (agendamento.status === 'concluido') {
      return NextResponse.json(
        { success: false, error: 'Atendimento já finalizado.' },
        { status: 400 }
      );
    }

    const atualizado = await prisma.agendamento.update({
      where: {
        id: body.agendamentoId,
      },
      data: {
        status: 'em_atendimento',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Presença confirmada com sucesso.',
      agendamento: atualizado,
    });
  } catch (error) {
    console.error('Erro ao confirmar presença:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao confirmar presença.' },
      { status: 500 }
    );
  }
}