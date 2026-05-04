import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, context: any) {
  try {
    const params = await context.params;
    const slug = String(params?.slug || "").trim();

    if (!slug) {
      return NextResponse.json(
        { error: "Slug não informado." },
        { status: 400 }
      );
    }

    const empresa = await prisma.empresa.findFirst({
      where: {
        slug,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        slug: true,
        telefone: true,
        whatsapp: true,
        endereco: true,
        logoUrl: true,
        descricao: true,
        tipoMidia: true,
        midiaUrl: true,
        plano: true,
        trialAtivo: true,
        assinaturaExpiraEm: true,
        statusFinanceiro: true,
        bloqueadoPorInadimplencia: true,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada ou inativa." },
        { status: 404 }
      );
    }

    if (empresa.bloqueadoPorInadimplencia || empresa.statusFinanceiro === "inadimplente") {
      return NextResponse.json(
        { error: "Agenda temporariamente indisponível." },
        { status: 403 }
      );
    }

    return NextResponse.json({ empresa });
  } catch (error) {
    console.error("Erro ao buscar empresa pelo slug:", error);

    return NextResponse.json(
      { error: "Erro interno ao buscar empresa." },
      { status: 500 }
    );
  }
}