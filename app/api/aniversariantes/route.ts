import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function diasRestantes(dataNascimento: Date) {
  const hoje = new Date();

  const aniversario = new Date(
    hoje.getFullYear(),
    dataNascimento.getMonth(),
    dataNascimento.getDate()
  );

  if (aniversario < hoje) {
    aniversario.setFullYear(hoje.getFullYear() + 1);
  }

  const diff =
    aniversario.getTime() - hoje.getTime();

  return Math.ceil(
    diff / (1000 * 60 * 60 * 24)
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId =
      searchParams.get('empresaId');

    if (!empresaId) {
      return NextResponse.json(
        {
          success: false,
          error: 'empresaId obrigatório.',
        },
        { status: 400 }
      );
    }

    const clientes = await prisma.cliente.findMany({
      where: {
        empresaId,
        dataNascimento: {
          not: null,
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });

    const aniversariantesSemana = clientes
      .map((cliente) => {
        const dias = diasRestantes(
          new Date(cliente.dataNascimento!)
        );

        return {
          ...cliente,
          diasRestantes: dias,
        };
      })
      .filter(
        (cliente) =>
          cliente.diasRestantes >= 0 &&
          cliente.diasRestantes <= 7
      )
      .sort(
        (a, b) =>
          a.diasRestantes -
          b.diasRestantes
      );

    return NextResponse.json({
      success: true,
      total: aniversariantesSemana.length,
      aniversariantes:
        aniversariantesSemana,
    });
  } catch (error) {
    console.error(
      'Erro ao buscar aniversariantes:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          'Erro ao buscar aniversariantes.',
      },
      { status: 500 }
    );
  }
}