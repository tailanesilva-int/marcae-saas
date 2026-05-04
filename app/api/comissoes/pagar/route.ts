import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import {
  empresaTemRecurso,
  respostaPlanoBloqueado,
} from '@/app/lib/planos';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { comissaoId, observacao } = body;

    if (!comissaoId) {
      return NextResponse.json(
        { success: false, error: 'comissaoId obrigatório.' },
        { status: 400 }
      );
    }

    const comissao = await prisma.comissao.findUnique({
      where: {
        id: comissaoId,
      },
      include: {
        empresa: true,
      },
    });

    if (!comissao) {
      return NextResponse.json(
        { success: false, error: 'Comissão não encontrada.' },
        { status: 404 }
      );
    }

    if (!empresaTemRecurso(comissao.empresa, 'repasse_comissoes')) {
      return NextResponse.json(respostaPlanoBloqueado('repasse_comissoes'), {
        status: 403,
      });
    }

    if (comissao.status === 'pago') {
      return NextResponse.json({
        success: true,
        message: 'Comissão já estava marcada como paga.',
        comissao,
      });
    }

    const comissaoAtualizada = await prisma.comissao.update({
      where: {
        id: comissaoId,
      },
      data: {
        status: 'pago',
        dataPagamento: new Date(),
        observacao: observacao || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Comissão marcada como paga com sucesso.',
      comissao: comissaoAtualizada,
    });
  } catch (error: any) {
    console.error('Erro ao marcar comissão como paga:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao marcar comissão como paga.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}