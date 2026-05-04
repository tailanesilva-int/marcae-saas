import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const empresaId = searchParams.get('empresaId');

  if (!empresaId) {
    return NextResponse.json({ error: 'empresaId obrigatório' }, { status: 400 });
  }

  const servicos = await prisma.servico.findMany({
    where: { empresaId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ servicos });
}

export async function POST(req: Request) {
  const body = await req.json();

  const {
    empresaId,
    nome,
    descricao,
    duracaoMin,
    valor,
    exigePrePagamento,
    valorPrePagamento,
  } = body;

  // 🔥 BLOQUEIO POR PLANO
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
  });

  if (exigePrePagamento && empresa?.plano === 'basico') {
    return NextResponse.json(
      { error: 'Pré-pagamento disponível apenas no plano premium' },
      { status: 403 }
    );
  }

  const servico = await prisma.servico.create({
    data: {
      empresaId,
      nome,
      descricao,
      duracaoMin: Number(duracaoMin),
      valor: Number(valor),
      exigePrePagamento: exigePrePagamento || false,
      valorPrePagamento: valorPrePagamento
        ? Number(valorPrePagamento)
        : null,
    },
  });

  return NextResponse.json({ servico });
}