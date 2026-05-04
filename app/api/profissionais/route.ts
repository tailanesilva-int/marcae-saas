import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');

    if (!empresaId) {
      return NextResponse.json(
        { error: 'empresaId obrigatório' },
        { status: 400 }
      );
    }

    const profissionais = await prisma.profissional.findMany({
      where: { empresaId },
      include: {
        servicos: {
          include: {
            servico: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      profissionais,
    });
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);

    return NextResponse.json(
      { error: 'Erro ao buscar profissionais' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      empresaId,
      nome,
      bio,
      fotoUrl,
      ativo,
      servicosIds = [],
      tipoComissao,
      valorComissao,
    } = body;

    if (!empresaId || !nome) {
      return NextResponse.json(
        { error: 'empresaId e nome são obrigatórios' },
        { status: 400 }
      );
    }

    const profissional = await prisma.profissional.create({
      data: {
        empresaId,
        nome,
        bio: bio || null,
        fotoUrl: fotoUrl || null,
        ativo: ativo ?? true,
        tipoComissao: tipoComissao || null,
        valorComissao:
          valorComissao !== undefined &&
          valorComissao !== null &&
          valorComissao !== ''
            ? Number(valorComissao)
            : null,
      },
    });

    if (Array.isArray(servicosIds) && servicosIds.length > 0) {
      await prisma.profissionalServico.createMany({
        data: servicosIds.map((servicoId: string) => ({
          empresaId,
          profissionalId: profissional.id,
          servicoId,
        })),
        skipDuplicates: true,
      });
    }

    const profissionalCompleto = await prisma.profissional.findUnique({
      where: { id: profissional.id },
      include: {
        servicos: {
          include: {
            servico: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      profissional: profissionalCompleto,
    });
  } catch (error) {
    console.error('Erro ao criar profissional:', error);

    return NextResponse.json(
      { error: 'Erro ao criar profissional' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const {
      id,
      empresaId,
      nome,
      bio,
      fotoUrl,
      ativo,
      servicosIds = [],
      tipoComissao,
      valorComissao,
    } = body;

    if (!id || !empresaId) {
      return NextResponse.json(
        { error: 'id e empresaId são obrigatórios' },
        { status: 400 }
      );
    }

    await prisma.profissional.update({
      where: { id },
      data: {
        nome,
        bio: bio || null,
        fotoUrl: fotoUrl || null,
        ativo,
        tipoComissao: tipoComissao || null,
        valorComissao:
          valorComissao !== undefined &&
          valorComissao !== null &&
          valorComissao !== ''
            ? Number(valorComissao)
            : null,
      },
    });

    await prisma.profissionalServico.deleteMany({
      where: {
        profissionalId: id,
      },
    });

    if (Array.isArray(servicosIds) && servicosIds.length > 0) {
      await prisma.profissionalServico.createMany({
        data: servicosIds.map((servicoId: string) => ({
          empresaId,
          profissionalId: id,
          servicoId,
        })),
        skipDuplicates: true,
      });
    }

    const profissionalCompleto = await prisma.profissional.findUnique({
      where: { id },
      include: {
        servicos: {
          include: {
            servico: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      profissional: profissionalCompleto,
    });
  } catch (error) {
    console.error('Erro ao atualizar profissional:', error);

    return NextResponse.json(
      { error: 'Erro ao atualizar profissional' },
      { status: 500 }
    );
  }
}