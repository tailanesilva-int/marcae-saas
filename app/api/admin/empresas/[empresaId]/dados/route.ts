import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ empresaId: string }> }
) {
  try {
    const { empresaId } = await context.params;
    const body = await req.json();

    const empresa = await prisma.empresa.update({
      where: {
        id: empresaId,
      },
      data: {
        nome: body.nome,
        endereco: body.endereco || null,
        telefone: body.telefone || null,
        responsavel: body.responsavel || null,
      },
    });

    return NextResponse.json({
      success: true,
      empresa,
    });
  } catch (error) {
    console.error('Erro ao atualizar dados da empresa:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar dados da empresa.' },
      { status: 500 }
    );
  }
}