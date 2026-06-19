import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function respostaErro(mensagem: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: mensagem,
    },
    { status },
  );
}

function normalizarBoolean(valor: any, padrao = false) {
  if (valor === undefined || valor === null) return padrao;
  return Boolean(valor);
}

function normalizarInteiro(valor: any, padrao = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get("empresaId");
    const status = searchParams.get("status");
    const categoria = searchParams.get("categoria");
    const includeCampos = searchParams.get("includeCampos") === "true";

    if (!empresaId) {
      return respostaErro("empresaId obrigatório.");
    }

    const modelos = await prisma.fichaModelo.findMany({
      where: {
        empresaId,
        ...(status ? { status } : {}),
        ...(categoria ? { categoria } : {}),
      },
      include: {
        campos: includeCampos
          ? {
              where: {
                ativo: true,
              },
              orderBy: {
                ordem: "asc",
              },
            }
          : false,
        _count: {
          select: {
            campos: true,
            registros: true,
          },
        },
      },
      orderBy: [
        {
          ordem: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      modelos,
    });
  } catch (error) {
    console.error("Erro ao listar modelos de ficha digital:", error);

    return respostaErro("Erro ao listar modelos de ficha digital.", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const empresaId = body.empresaId;
    const titulo = String(body.titulo || "").trim();

    if (!empresaId) {
      return respostaErro("empresaId obrigatório.");
    }

    if (!titulo) {
      return respostaErro("Informe o título da ficha digital.");
    }

    const modelo = await prisma.fichaModelo.create({
      data: {
        empresaId,
        titulo,
        descricao: body.descricao ? String(body.descricao).trim() : null,
        categoria: body.categoria || "geral",
        status: body.status || "ativo",
        exigeAssinatura: normalizarBoolean(body.exigeAssinatura, false),
        exigeAceiteLgpd: normalizarBoolean(body.exigeAceiteLgpd, true),
        permitirFotos: normalizarBoolean(body.permitirFotos, false),
        preencherNoAgendador: normalizarBoolean(
          body.preencherNoAgendador,
          false,
        ),
        ordem: normalizarInteiro(body.ordem, 0),
        criadoPorUsuarioId: body.criadoPorUsuarioId || null,
        criadoPorNome: body.criadoPorNome || null,
      },
    });

    return NextResponse.json({
      success: true,
      modelo,
    });
  } catch (error) {
    console.error("Erro ao criar modelo de ficha digital:", error);

    return respostaErro("Erro ao criar modelo de ficha digital.", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const id = body.id;
    const empresaId = body.empresaId;

    if (!id) {
      return respostaErro("id obrigatório.");
    }

    if (!empresaId) {
      return respostaErro("empresaId obrigatório.");
    }

    const modeloAtual = await prisma.fichaModelo.findFirst({
      where: {
        id,
        empresaId,
      },
    });

    if (!modeloAtual) {
      return respostaErro("Modelo de ficha digital não encontrado.", 404);
    }

    const modelo = await prisma.fichaModelo.update({
      where: {
        id,
      },
      data: {
        ...(body.titulo !== undefined
          ? { titulo: String(body.titulo || "").trim() }
          : {}),
        ...(body.descricao !== undefined
          ? {
              descricao: body.descricao
                ? String(body.descricao).trim()
                : null,
            }
          : {}),
        ...(body.categoria !== undefined ? { categoria: body.categoria } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.exigeAssinatura !== undefined
          ? { exigeAssinatura: Boolean(body.exigeAssinatura) }
          : {}),
        ...(body.exigeAceiteLgpd !== undefined
          ? { exigeAceiteLgpd: Boolean(body.exigeAceiteLgpd) }
          : {}),
        ...(body.permitirFotos !== undefined
          ? { permitirFotos: Boolean(body.permitirFotos) }
          : {}),
        ...(body.preencherNoAgendador !== undefined
          ? { preencherNoAgendador: Boolean(body.preencherNoAgendador) }
          : {}),
        ...(body.ordem !== undefined
          ? { ordem: normalizarInteiro(body.ordem, modeloAtual.ordem || 0) }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      modelo,
    });
  } catch (error) {
    console.error("Erro ao atualizar modelo de ficha digital:", error);

    return respostaErro("Erro ao atualizar modelo de ficha digital.", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    const empresaId = searchParams.get("empresaId");

    if (!id) {
      return respostaErro("id obrigatório.");
    }

    if (!empresaId) {
      return respostaErro("empresaId obrigatório.");
    }

    const modelo = await prisma.fichaModelo.findFirst({
      where: {
        id,
        empresaId,
      },
    });

    if (!modelo) {
      return respostaErro("Modelo de ficha digital não encontrado.", 404);
    }

    const modeloAtualizado = await prisma.fichaModelo.update({
      where: {
        id,
      },
      data: {
        status: "inativo",
      },
    });

    return NextResponse.json({
      success: true,
      modelo: modeloAtualizado,
      message: "Modelo inativado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao inativar modelo de ficha digital:", error);

    return respostaErro("Erro ao inativar modelo de ficha digital.", 500);
  }
}
