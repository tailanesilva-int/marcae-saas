import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

type ConfiguracaoPlanos = {
  id: string;
  valorPlanoBasico: any;
  valorPlanoPlus: any;
  valorPlanoPremium: any;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function normalizarValor(valor: any, fallback: number) {
  if (valor === undefined || valor === null || valor === '') {
    return fallback;
  }

  const texto = String(valor)
    .replace('R$', '')
    .replace(/\s/g, '')
    .trim();

  const normalizado = texto.includes(',')
    ? texto.replace(/\./g, '').replace(',', '.')
    : texto;

  const numero = Number(normalizado);

  if (Number.isNaN(numero) || numero < 0) {
    return fallback;
  }

  return numero;
}

async function buscarConfiguracaoPorSql() {
  const registros = await prisma.$queryRaw<ConfiguracaoPlanos[]>`
    SELECT
      id,
      "valorPlanoBasico",
      "valorPlanoPlus",
      "valorPlanoPremium",
      "createdAt",
      "updatedAt"
    FROM "ConfiguracaoSaas"
    ORDER BY "createdAt" ASC
    LIMIT 1
  `;

  return registros?.[0] || null;
}

async function criarConfiguracaoPorSql() {
  const id = randomUUID();
  const agora = new Date();

  const registros = await prisma.$queryRaw<ConfiguracaoPlanos[]>`
    INSERT INTO "ConfiguracaoSaas" (
      id,
      "valorPlanoBasico",
      "valorPlanoPlus",
      "valorPlanoPremium",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${id},
      ${49.9},
      ${99.9},
      ${149.9},
      ${agora},
      ${agora}
    )
    RETURNING
      id,
      "valorPlanoBasico",
      "valorPlanoPlus",
      "valorPlanoPremium",
      "createdAt",
      "updatedAt"
  `;

  return registros?.[0];
}

async function atualizarConfiguracaoPorSql({
  id,
  valorPlanoBasico,
  valorPlanoPlus,
  valorPlanoPremium,
}: {
  id: string;
  valorPlanoBasico: number;
  valorPlanoPlus: number;
  valorPlanoPremium: number;
}) {
  const agora = new Date();

  const registros = await prisma.$queryRaw<ConfiguracaoPlanos[]>`
    UPDATE "ConfiguracaoSaas"
    SET
      "valorPlanoBasico" = ${valorPlanoBasico},
      "valorPlanoPlus" = ${valorPlanoPlus},
      "valorPlanoPremium" = ${valorPlanoPremium},
      "updatedAt" = ${agora}
    WHERE id = ${id}
    RETURNING
      id,
      "valorPlanoBasico",
      "valorPlanoPlus",
      "valorPlanoPremium",
      "createdAt",
      "updatedAt"
  `;

  return registros?.[0];
}

async function buscarOuCriarConfiguracao() {
  const existente = await buscarConfiguracaoPorSql();

  if (existente) {
    return existente;
  }

  return criarConfiguracaoPorSql();
}

export async function GET() {
  try {
    const configuracao = await buscarOuCriarConfiguracao();

    return NextResponse.json({
      success: true,
      configuracao,
    });
  } catch (error: any) {
    console.error('Erro ao carregar configuração dos planos:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar configuração dos planos.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const atual = await buscarOuCriarConfiguracao();

    const valorPlanoBasico = normalizarValor(
      body.valorPlanoBasico,
      Number(atual.valorPlanoBasico)
    );

    const valorPlanoPlus = normalizarValor(
      body.valorPlanoPlus,
      Number(atual.valorPlanoPlus)
    );

    const valorPlanoPremium = normalizarValor(
      body.valorPlanoPremium,
      Number(atual.valorPlanoPremium)
    );

    const configuracao = await atualizarConfiguracaoPorSql({
      id: atual.id,
      valorPlanoBasico,
      valorPlanoPlus,
      valorPlanoPremium,
    });

    return NextResponse.json({
      success: true,
      configuracao,
    });
  } catch (error: any) {
    console.error('Erro ao salvar configuração dos planos:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao salvar configuração dos planos.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}