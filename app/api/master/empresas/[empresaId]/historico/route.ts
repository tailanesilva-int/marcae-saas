import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, context: any) {
  try {
    const params = await context.params;
    const empresaId = String(params?.empresaId || "");

    if (!empresaId || empresaId === "undefined" || empresaId === "null") {
      return NextResponse.json(
        { error: "Empresa não informada." },
        { status: 400 }
      );
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        nome: true,
        slug: true,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada." },
        { status: 404 }
      );
    }

    const logs = await prisma.empresaLog.findMany({
      where: { empresaId },
      orderBy: {
        criadoEm: "desc",
      },
    });

    const pagamentos = await prisma.empresaPagamento.findMany({
      where: { empresaId },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return NextResponse.json({
      empresa,
      logs,
      pagamentos,
    });
  } catch (error) {
    console.error("Erro ao buscar histórico da empresa:", error);

    return NextResponse.json(
      { error: "Erro interno ao buscar histórico da empresa." },
      { status: 500 }
    );
  }
}