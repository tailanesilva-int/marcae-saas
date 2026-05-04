import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profissionalId = searchParams.get('profissionalId');

    if (!profissionalId) {
      return NextResponse.json(
        { error: 'profissionalId obrigatório' },
        { status: 400 }
      );
    }

    const disponibilidades = await prisma.disponibilidade.findMany({
      where: { profissionalId },
      orderBy: { diaSemana: 'asc' },
    });

    return NextResponse.json({
      success: true,
      disponibilidades,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao buscar disponibilidades' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      empresaId,
      profissionalId,
      disponibilidades,
    } = body;

    if (!empresaId || !profissionalId) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não informados' },
        { status: 400 }
      );
    }

    // apaga tudo antes
    await prisma.disponibilidade.deleteMany({
      where: { profissionalId },
    });

    // recria
    await prisma.disponibilidade.createMany({
      data: disponibilidades.map((d: any) => ({
        empresaId,
        profissionalId,
        diaSemana: d.diaSemana,
        horaInicio: d.horaInicio,
        horaFim: d.horaFim,
        ativo: d.ativo,
      })),
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao salvar disponibilidade' },
      { status: 500 }
    );
  }
}