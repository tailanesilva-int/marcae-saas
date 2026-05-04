import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ empresaId: string }> }
) {
  try {
    const { empresaId } = await context.params;
    const body = await req.json();

    const { modoPagamento, recorrente } = body;

    await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        modoPagamentoAssinatura: modoPagamento,
        assinaturaRecorrenteAtiva: recorrente,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao salvar configuração" },
      { status: 500 }
    );
  }
}