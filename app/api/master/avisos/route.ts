import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizarData(data?: string | null, finalDoDia = false) {
  if (!data) return null;

  const dataNormalizada = new Date(data);

  if (Number.isNaN(dataNormalizada.getTime())) {
    return null;
  }

  if (finalDoDia) {
    dataNormalizada.setHours(23, 59, 59, 999);
  } else {
    dataNormalizada.setHours(0, 0, 0, 0);
  }

  return dataNormalizada;
}

export async function GET() {
  try {
    const avisos = await prisma.avisoSistema.findMany({
      orderBy: [{ ativo: "desc" }, { createdAt: "desc" }],
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      avisos,
    });
  } catch (error) {
    console.error("Erro ao carregar avisos do sistema:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao carregar avisos do sistema.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const titulo = String(body?.titulo || "").trim();
    const mensagem = String(body?.mensagem || "").trim();
    const tipo = String(body?.tipo || "informativo").trim() || "informativo";
    const empresaId = body?.empresaId ? String(body.empresaId) : null;

    if (!titulo) {
      return NextResponse.json(
        {
          success: false,
          error: "Informe o título do aviso.",
        },
        { status: 400 }
      );
    }

    if (!mensagem) {
      return NextResponse.json(
        {
          success: false,
          error: "Informe a mensagem do aviso.",
        },
        { status: 400 }
      );
    }

    const aviso = await prisma.avisoSistema.create({
      data: {
        titulo,
        mensagem,
        tipo,
        ativo: body?.ativo !== false,
        empresaId,
        dataInicio: normalizarData(body?.dataInicio) || new Date(),
        dataFim: normalizarData(body?.dataFim, true),
      },
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      aviso,
    });
  } catch (error) {
    console.error("Erro ao criar aviso do sistema:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao criar aviso do sistema.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    const id = String(body?.id || "").trim();
    const titulo = String(body?.titulo || "").trim();
    const mensagem = String(body?.mensagem || "").trim();
    const tipo = String(body?.tipo || "informativo").trim() || "informativo";
    const empresaId = body?.empresaId ? String(body.empresaId) : null;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Aviso não informado.",
        },
        { status: 400 }
      );
    }

    if (!titulo) {
      return NextResponse.json(
        {
          success: false,
          error: "Informe o título do aviso.",
        },
        { status: 400 }
      );
    }

    if (!mensagem) {
      return NextResponse.json(
        {
          success: false,
          error: "Informe a mensagem do aviso.",
        },
        { status: 400 }
      );
    }

    const aviso = await prisma.avisoSistema.update({
      where: {
        id,
      },
      data: {
        titulo,
        mensagem,
        tipo,
        ativo: body?.ativo !== false,
        empresaId,
        dataInicio: normalizarData(body?.dataInicio) || new Date(),
        dataFim: normalizarData(body?.dataFim, true),
      },
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      aviso,
    });
  } catch (error) {
    console.error("Erro ao atualizar aviso do sistema:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao atualizar aviso do sistema.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Aviso não informado.",
        },
        { status: 400 }
      );
    }

    await prisma.avisoSistema.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao excluir aviso do sistema:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao excluir aviso do sistema.",
      },
      { status: 500 }
    );
  }
}
