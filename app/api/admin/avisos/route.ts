import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const empresaId = req.nextUrl.searchParams.get("empresaId");
    const agora = new Date();

    const avisos = await prisma.avisoSistema.findMany({
      where: {
        ativo: true,
        dataInicio: {
          lte: agora,
        },
        OR: [
          {
            dataFim: null,
          },
          {
            dataFim: {
              gte: agora,
            },
          },
          {
            empresaId: null,
          },
          ...(empresaId ? [{ empresaId }] : []),
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      avisos,
    });
  } catch (error: any) {
    console.error("Erro ao carregar avisos para o painel admin:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao carregar avisos do sistema.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}