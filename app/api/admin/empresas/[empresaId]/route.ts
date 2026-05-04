import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> }
) {
  try {
    const { empresaId } = await params;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'ID da empresa é obrigatório.' },
        { status: 400 }
      );
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      empresa,
    });
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao buscar empresa.' },
      { status: 500 }
    );
  }
}