import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agendamentoId } = body;

    if (!agendamentoId) {
      return NextResponse.json(
        { success: false, error: 'agendamentoId obrigatório.' },
        { status: 400 }
      );
    }

    const agendamento = await prisma.agendamento.findUnique({
      where: { id: agendamentoId },
      include: {
        profissional: true,
        servico: true,
        cliente: true,
      },
    });

    if (!agendamento) {
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado.' },
        { status: 404 }
      );
    }

    if (agendamento.comissaoGerada) {
      return NextResponse.json({
        success: true,
        message: 'Atendimento já finalizado e comissão já gerada.',
      });
    }

    if (!agendamento.profissionalId || !agendamento.profissional) {
      await prisma.agendamento.update({
        where: { id: agendamento.id },
        data: {
          status: 'concluido',
          comissaoGerada: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Atendimento finalizado, mas sem profissional vinculado para gerar comissão.',
      });
    }

    const profissional = agendamento.profissional;

    const valorServico = Number(agendamento.valorTotal || 0);
    const tipoComissao = profissional.tipoComissao || null;
    const valorComissaoConfig = Number(profissional.valorComissao || 0);

    let valorComissaoCalculada = 0;

    if (tipoComissao === 'percentual') {
      valorComissaoCalculada = (valorServico * valorComissaoConfig) / 100;
    }

    if (tipoComissao === 'fixo') {
      valorComissaoCalculada = valorComissaoConfig;
    }

    await prisma.$transaction(async (tx) => {
      if (valorComissaoCalculada > 0 && tipoComissao) {
        await tx.comissao.create({
          data: {
            empresaId: agendamento.empresaId,
            agendamentoId: agendamento.id,
            profissionalId: profissional.id,
            valorServico,
            valorComissao: valorComissaoCalculada,
            tipoComissao,
            status: 'pendente',
          },
        });
      }

      await tx.agendamento.update({
        where: { id: agendamento.id },
        data: {
          status: 'concluido',
          comissaoGerada: valorComissaoCalculada > 0,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Atendimento finalizado com sucesso.',
      comissaoGerada: valorComissaoCalculada > 0,
      valorServico,
      valorComissao: valorComissaoCalculada,
    });
  } catch (error: any) {
    console.error('Erro ao finalizar atendimento:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao finalizar atendimento.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}