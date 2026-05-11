import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function normalizarValor(valor: any, fallback: number) {
  if (valor === undefined || valor === null || valor === '') {
    return fallback;
  }

  const numero = Number(
    String(valor)
      .replace('R$', '')
      .replace('.', '')
      .replace(',', '.')
      .trim()
  );

  if (Number.isNaN(numero) || numero < 0) {
    return fallback;
  }

  return numero;
}

async function buscarOuCriarConfiguracao() {
  const existente = await (prisma as any).configuracaoSaas.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (existente) {
    return existente;
  }

  return (prisma as any).configuracaoSaas.create({
    data: {
      valorPlanoBasico: 49.9,
      valorPlanoPlus: 99.9,
      valorPlanoPremium: 149.9,
    },
  });
}

export async function GET() {
  try {
    const configuracao = await buscarOuCriarConfiguracao();

    return NextResponse.json({
      success: true,
      configuracao,
    });
  } catch (error) {
    console.error('Erro ao carregar configuração dos planos:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar configuração dos planos.',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const atual = await buscarOuCriarConfiguracao();

    const configuracao = await (prisma as any).configuracaoSaas.update({
      where: { id: atual.id },
      data: {
        valorPlanoBasico: normalizarValor(
          body.valorPlanoBasico,
          Number(atual.valorPlanoBasico)
        ),
        valorPlanoPlus: normalizarValor(
          body.valorPlanoPlus,
          Number(atual.valorPlanoPlus)
        ),
        valorPlanoPremium: normalizarValor(
          body.valorPlanoPremium,
          Number(atual.valorPlanoPremium)
        ),
      },
    });

    return NextResponse.json({
      success: true,
      configuracao,
    });
  } catch (error) {
    console.error('Erro ao salvar configuração dos planos:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao salvar configuração dos planos.',
      },
      { status: 500 }
    );
  }
}