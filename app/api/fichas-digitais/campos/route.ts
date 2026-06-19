import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

const TIPOS_PERMITIDOS = new Set([
  "texto",
  "textarea",
  "numero",
  "data",
  "sim_nao",
  "selecao",
  "multiselecao",
  "foto",
  "assinatura",
  "termo_lgpd",
]);

function respostaErro(mensagem: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: mensagem,
    },
    { status },
  );
}

function normalizarInteiro(valor: any, padrao = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function normalizarRespondidoPor(valor: any) {
  return valor === "profissional" ? "profissional" : "cliente";
}

function normalizarOpcoes(valor: any) {
  if (!valor) return null;

  if (Array.isArray(valor)) {
    return valor
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof valor === "string") {
    return valor
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return valor;
}

async function buscarModelo(modeloId: string, empresaId: string) {
  return prisma.fichaModelo.findFirst({
    where: {
      id: modeloId,
      empresaId,
    },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get("empresaId");
    const modeloId = searchParams.get("modeloId");
    const incluirInativos = searchParams.get("incluirInativos") === "true";
    const respondidoPor = searchParams.get("respondidoPor");

    if (!empresaId) {
      return respostaErro("empresaId obrigatório.");
    }

    if (!modeloId) {
      return respostaErro("modeloId obrigatório.");
    }

    const modelo = await buscarModelo(modeloId, empresaId);

    if (!modelo) {
      return respostaErro("Modelo de ficha digital não encontrado.", 404);
    }

    const campos = await prisma.fichaCampo.findMany({
      where: {
        empresaId,
        modeloId,
        ...(incluirInativos ? {} : { ativo: true }),
        ...(respondidoPor === "cliente" || respondidoPor === "profissional"
          ? { respondidoPor }
          : {}),
      },
      orderBy: [
        {
          ordem: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      campos,
    });
  } catch (error) {
    console.error("Erro ao listar campos da ficha digital:", error);

    return respostaErro("Erro ao listar campos da ficha digital.", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const empresaId = body.empresaId;
    const modeloId = body.modeloId;
    const titulo = String(body.titulo || "").trim();
    const tipo = body.tipo || "texto";

    if (!empresaId) {
      return respostaErro("empresaId obrigatório.");
    }

    if (!modeloId) {
      return respostaErro("modeloId obrigatório.");
    }

    if (!titulo) {
      return respostaErro("Informe o título do campo.");
    }

    if (!TIPOS_PERMITIDOS.has(tipo)) {
      return respostaErro("Tipo de campo inválido.");
    }

    const modelo = await buscarModelo(modeloId, empresaId);

    if (!modelo) {
      return respostaErro("Modelo de ficha digital não encontrado.", 404);
    }

    const campo = await prisma.fichaCampo.create({
      data: {
        empresaId,
        modeloId,
        titulo,
        descricao: body.descricao ? String(body.descricao).trim() : null,
        tipo,
        obrigatorio: Boolean(body.obrigatorio),
        respondidoPor: normalizarRespondidoPor(body.respondidoPor),
        opcoes: normalizarOpcoes(body.opcoes),
        placeholder: body.placeholder
          ? String(body.placeholder).trim()
          : null,
        ordem: normalizarInteiro(body.ordem, 0),
        ativo: body.ativo === undefined ? true : Boolean(body.ativo),
      },
    });

    return NextResponse.json({
      success: true,
      campo,
    });
  } catch (error) {
    console.error("Erro ao criar campo da ficha digital:", error);

    return respostaErro("Erro ao criar campo da ficha digital.", 500);
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

    const campoAtual = await prisma.fichaCampo.findFirst({
      where: {
        id,
        empresaId,
      },
    });

    if (!campoAtual) {
      return respostaErro("Campo da ficha digital não encontrado.", 404);
    }

    if (body.tipo !== undefined && !TIPOS_PERMITIDOS.has(body.tipo)) {
      return respostaErro("Tipo de campo inválido.");
    }

    const campo = await prisma.fichaCampo.update({
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
        ...(body.tipo !== undefined ? { tipo: body.tipo } : {}),
        ...(body.obrigatorio !== undefined
          ? { obrigatorio: Boolean(body.obrigatorio) }
          : {}),
        ...(body.respondidoPor !== undefined
          ? { respondidoPor: normalizarRespondidoPor(body.respondidoPor) }
          : {}),
        ...(body.opcoes !== undefined
          ? { opcoes: normalizarOpcoes(body.opcoes) }
          : {}),
        ...(body.placeholder !== undefined
          ? {
              placeholder: body.placeholder
                ? String(body.placeholder).trim()
                : null,
            }
          : {}),
        ...(body.ordem !== undefined
          ? { ordem: normalizarInteiro(body.ordem, campoAtual.ordem || 0) }
          : {}),
        ...(body.ativo !== undefined ? { ativo: Boolean(body.ativo) } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      campo,
    });
  } catch (error) {
    console.error("Erro ao atualizar campo da ficha digital:", error);

    return respostaErro("Erro ao atualizar campo da ficha digital.", 500);
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

    const campo = await prisma.fichaCampo.findFirst({
      where: {
        id,
        empresaId,
      },
    });

    if (!campo) {
      return respostaErro("Campo da ficha digital não encontrado.", 404);
    }

    const campoAtualizado = await prisma.fichaCampo.update({
      where: {
        id,
      },
      data: {
        ativo: false,
      },
    });

    return NextResponse.json({
      success: true,
      campo: campoAtualizado,
      message: "Campo inativado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao inativar campo da ficha digital:", error);

    return respostaErro("Erro ao inativar campo da ficha digital.", 500);
  }
}
