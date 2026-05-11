import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function formatarDataLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function inicioDoDia(data: Date) {
  const nova = new Date(data);
  nova.setHours(0, 0, 0, 0);
  return nova;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId obrigatório.' },
        { status: 400 }
      );
    }

    const hoje = inicioDoDia(new Date());

    const primeiraComissaoPendente = await prisma.comissao.findFirst({
      where: {
        empresaId,
        status: {
          not: 'pago',
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (primeiraComissaoPendente) {
      const inicio = inicioDoDia(new Date(primeiraComissaoPendente.createdAt));

      return NextResponse.json({
        success: true,
        dataInicio: formatarDataLocal(inicio),
        dataFim: formatarDataLocal(hoje),
        origem: 'pendencias',
      });
    }

    const ultimoFechamento = await (prisma as any).comissaoPagamento.findFirst({
      where: {
        empresaId,
      },
      orderBy: {
        dataFim: 'desc',
      },
    });

    if (!ultimoFechamento?.dataFim) {
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      return NextResponse.json({
        success: true,
        dataInicio: formatarDataLocal(primeiroDiaMes),
        dataFim: formatarDataLocal(hoje),
        origem: 'inicio_mes',
      });
    }

    const proximoDia = inicioDoDia(new Date(ultimoFechamento.dataFim));
    proximoDia.setDate(proximoDia.getDate() + 1);

    const dataInicioFinal = proximoDia > hoje ? hoje : proximoDia;

    return NextResponse.json({
      success: true,
      dataInicio: formatarDataLocal(dataInicioFinal),
      dataFim: formatarDataLocal(hoje),
      origem: 'ultimo_fechamento',
    });
  } catch (error: any) {
    console.error('Erro ao calcular período aberto:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao calcular período aberto.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}