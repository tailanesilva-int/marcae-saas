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

    const clientes = await prisma.cliente.findMany({
      where: {
        empresaId,
      },
      select: {
        id: true,
        nome: true,
        cpf: true,
        whatsapp: true,
        dataNascimento: true,
      },
    });

    const cliente = clientes.find(
      (c) => limparCpf(c.cpf || '') === cpfLimpo
    );

    return NextResponse.json({
      cliente: cliente || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erro ao buscar cliente',
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}