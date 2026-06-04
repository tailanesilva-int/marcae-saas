import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function obterConfiguracaoSaas() {
  const existente = await prisma.configuracaoSaas.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existente) {
    return existente;
  }

  return prisma.configuracaoSaas.create({
    data: {},
  });
}

export async function GET() {
  try {
    const configuracao = await obterConfiguracaoSaas();

    return NextResponse.json({
      success: true,
      configuracao,
    });
  } catch (error) {
    console.error("Erro ao carregar configuração Marcaê:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao carregar configuração Marcaê.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const configuracao = await obterConfiguracaoSaas();

    const whatsappSuporte = String(body?.whatsappSuporte || "")
      .replace(/\D/g, "")
      .trim();

    const atualizada = await prisma.configuracaoSaas.update({
      where: {
        id: configuracao.id,
      },
      data: {
        whatsappSuporte,
      },
    });

    return NextResponse.json({
      success: true,
      configuracao: atualizada,
    });
  } catch (error) {
    console.error("Erro ao salvar configuração Marcaê:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao salvar configuração Marcaê.",
      },
      { status: 500 }
    );
  }
}
