import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function numero(valor: any) {
  if (valor === null || valor === undefined || valor === '') return 0;
  const convertido = Number(String(valor).replace(',', '.'));
  return Number.isNaN(convertido) ? 0 : convertido;
}

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
    custo,
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
      valor: numero(valor),
      custo: custo ? numero(custo) : null,
      exigePrePagamento: exigePrePagamento || false,
      valorPrePagamento: valorPrePagamento
        ? numero(valorPrePagamento)
        : null,
    },
  });

  return NextResponse.json({ servico });
}
