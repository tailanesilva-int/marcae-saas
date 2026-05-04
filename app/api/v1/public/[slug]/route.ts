import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  const empresa = await prisma.empresa.findUnique({
    where: { slug, ativo: true },
    include: {
      servicos: {
        where: { ativo: true, permiteAgendamentoOnline: true },
        orderBy: { ordem: 'asc' },
      },
      profissionais: {
        where: { ativo: true },
        orderBy: { ordem: 'asc' },
        include: { servicos: true },
      },
    },
  });

  if (!empresa) {
    return NextResponse.json(
      { error: 'Empresa não encontrada' },
      { status: 404 }
    );
  }

  return NextResponse.json(empresa);
}