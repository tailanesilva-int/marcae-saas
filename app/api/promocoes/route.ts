import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId é obrigatório.' },
        { status: 400 }
      );
    }

    const promocoes = await prisma.promocao.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, promocoes });
  } catch (error) {
    console.error('Erro ao listar promoções:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao listar promoções.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId é obrigatório.' },
        { status: 400 }
      );
    }

    if (!body.titulo) {
      return NextResponse.json(
        { success: false, error: 'Título é obrigatório.' },
        { status: 400 }
      );
    }

    const promocao = await prisma.promocao.create({
      data: {
        empresaId: body.empresaId,
        tipo: body.tipoPromocao || 'geral',
        titulo: body.titulo,
        descricao: body.descricao || null,
        mensagemWhatsapp: body.mensagemWhatsapp || null,
        dataInicio: body.dataInicio ? new Date(body.dataInicio) : null,
        dataFim: body.dataFim ? new Date(body.dataFim) : null,
        tipoDesconto: body.tipoDesconto || null,
        desconto: body.desconto
          ? Number(String(body.desconto).replace(',', '.'))
          : null,
        status: body.status || 'ativa',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, promocao });
  } catch (error) {
    console.error('Erro ao salvar promoção:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao salvar promoção.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'id da promoção é obrigatório.' },
        { status: 400 }
      );
    }

    const promocao = await prisma.promocao.update({
      where: { id: body.id },
      data: {
        tipo: body.tipoPromocao || 'geral',
        titulo: body.titulo,
        descricao: body.descricao || null,
        mensagemWhatsapp: body.mensagemWhatsapp || null,
        dataInicio: body.dataInicio ? new Date(body.dataInicio) : null,
        dataFim: body.dataFim ? new Date(body.dataFim) : null,
        tipoDesconto: body.tipoDesconto || null,
        desconto: body.desconto
          ? Number(String(body.desconto).replace(',', '.'))
          : null,
        status: body.status || 'ativa',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, promocao });
  } catch (error) {
    console.error('Erro ao editar promoção:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao editar promoção.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id é obrigatório.' },
        { status: 400 }
      );
    }

    await prisma.promocao.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir promoção:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao excluir promoção.' },
      { status: 500 }
    );
  }
}