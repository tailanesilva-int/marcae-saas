import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const agendamento = await prisma.agendamento.findUnique({
      where: {
        id,
      },
      include: {
        cliente: true,
        servico: true,
        profissional: true,
        empresa: true,
      },
    });

    if (!agendamento) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado', id },
        { status: 404 }
      );
    }

    return NextResponse.json({ agendamento });
  } catch (error: any) {
    console.error('Erro ao buscar agendamento:', error);

    return NextResponse.json(
      {
        error: 'Erro ao buscar agendamento',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}