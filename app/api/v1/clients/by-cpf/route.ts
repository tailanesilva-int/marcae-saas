import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function limparCpf(cpf: string) {
  return cpf.replace(/\D/g, '');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const empresaId = searchParams.get('empresaId');
    const cpf = searchParams.get('cpf');

    if (!empresaId || !cpf) {
      return NextResponse.json(
        { error: 'empresaId e cpf são obrigatórios' },
        { status: 400 }
      );
    }

    const cpfLimpo = limparCpf(cpf);

    const cliente = await prisma.cliente.findFirst({
  where: {
    empresaId,
    cpf: {
      contains: cpfLimpo,
    },
  },
  select: {
    id: true,
    nome: true,
    cpf: true,
    whatsapp: true,
    dataNascimento: true,
  },
});
