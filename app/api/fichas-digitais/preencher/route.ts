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

function limparCpf(valor?: string | null) {
  return String(valor || "").replace(/\D/g, "");
}

function numero(valor: any) {
  if (valor === null || valor === undefined || valor === "") return null;

  const convertido = Number(String(valor).replace(",", "."));

  return Number.isFinite(convertido) ? convertido : null;
}

function normalizarValorTexto(valor: any) {
  if (valor === null || valor === undefined) return null;

  if (Array.isArray(valor) || typeof valor === "object") {
    return JSON.stringify(valor);
  }

  return String(valor);
}

function normalizarData(valor: any) {
  if (!valor) return null;

  const data = new Date(`${String(valor).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(data.getTime())) return null;

  return data;
}

async function localizarCliente(empresaId: string, clienteId?: string | null, cpf?: string | null) {
  if (clienteId) {
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        empresaId,
      },
      select: {
        id: true,
        nome: true,
        cpf: true,
      },
    });

    if (cliente) return cliente;
  }

  const cpfLimpo = limparCpf(cpf);

  if (!cpfLimpo) return null;

  const clientes = await prisma.cliente.findMany({
    where: {
      empresaId,
    },
    select: {
      id: true,
      nome: true,
      cpf: true,
    },
  });

  return clientes.find((cliente) => limparCpf(cliente.cpf) === cpfLimpo) || null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const empresaId = body.empresaId;
    const modeloId = body.modeloId;
    const respostasRecebidas = Array.isArray(body.respostas)
      ? body.respostas
      : [];

    if (!empresaId) {
      return respostaErro("empresaId obrigatório.");
    }

    if (!modeloId) {
      return respostaErro("modeloId obrigatório.");
    }

    const modelo = await prisma.fichaModelo.findFirst({
      where: {
        id: modeloId,
        empresaId,
        status: {
          not: "inativo",
        },
      },
      include: {
        campos: {
          where: {
            ativo: true,
          },
          orderBy: {
            ordem: "asc",
          },
        },
      },
    });

    if (!modelo) {
      return respostaErro("Modelo de ficha digital não encontrado.", 404);
    }

    const cliente = await localizarCliente(
      empresaId,
      body.clienteId || null,
      body.clienteCpf || body.assinaturaCpf || null,
    );

    const camposObrigatorios = modelo.campos.filter((campo) => campo.obrigatorio);

    for (const campo of camposObrigatorios) {
      const resposta = respostasRecebidas.find((item: any) => item.campoId === campo.id);
      const valor = resposta?.valor;

      const vazio =
        valor === null ||
        valor === undefined ||
        valor === "" ||
        (Array.isArray(valor) && valor.length === 0) ||
        (campo.tipo === "termo_lgpd" && !Boolean(valor));

      if (vazio) {
        return respostaErro(`Responda a pergunta obrigatória: ${campo.titulo}`);
      }
    }

    const aceiteLgpd = Boolean(body.aceiteLgpd);
    const assinaturaNome = body.assinaturaNome || body.clienteNome || cliente?.nome || null;
    const assinaturaCpf = limparCpf(body.assinaturaCpf || body.clienteCpf || cliente?.cpf || "");

    const registro = await prisma.$transaction(async (tx) => {
      const fichaRegistro = await tx.fichaRegistro.create({
        data: {
          empresaId,
          modeloId,
          clienteId: cliente?.id || null,
          agendamentoId: body.agendamentoId || null,
          tituloSnapshot: modelo.titulo,
          status: "preenchida",
          origem: body.origem || "agendador",
          preenchidoPorTipo: body.preenchidoPorTipo || "cliente",
          preenchidoPorNome: body.preenchidoPorNome || assinaturaNome,
          preenchidoPorUsuarioId: body.preenchidoPorUsuarioId || null,
          assinado: Boolean(modelo.exigeAssinatura && assinaturaNome),
          assinaturaImagemUrl: body.assinaturaImagemUrl || null,
          assinaturaNome,
          assinaturaCpf: assinaturaCpf || null,
          assinadoEm: modelo.exigeAssinatura && assinaturaNome ? new Date() : null,
          aceiteLgpd,
          aceiteLgpdTexto: body.aceiteLgpdTexto || null,
          aceiteLgpdEm: aceiteLgpd ? new Date() : null,
          ip: req.headers.get("x-forwarded-for") || null,
          userAgent: req.headers.get("user-agent") || null,
          observacaoInterna: body.observacaoInterna || null,
        },
      });

      for (const [index, resposta] of respostasRecebidas.entries()) {
        const campo = modelo.campos.find((item) => item.id === resposta.campoId);

        if (!campo) continue;

        const valor = resposta.valor;
        const valorNumero = campo.tipo === "numero" ? numero(valor) : null;
        const valorData = campo.tipo === "data" ? normalizarData(valor) : null;
        const valorJson =
          campo.tipo === "multiselecao" || Array.isArray(valor) || typeof valor === "object"
            ? valor
            : null;

        await tx.fichaResposta.create({
          data: {
            empresaId,
            registroId: fichaRegistro.id,
            campoId: campo.id,
            campoTitulo: campo.titulo,
            campoTipo: campo.tipo,
            valorTexto:
              valorJson || valorNumero !== null || valorData
                ? null
                : normalizarValorTexto(valor),
            valorNumero,
            valorData,
            valorJson,
            ordem: campo.ordem ?? resposta.ordem ?? index,
          },
        });
      }

      return fichaRegistro;
    });

    return NextResponse.json({
      success: true,
      registro,
    });
  } catch (error) {
    console.error("Erro ao preencher ficha digital:", error);

    return respostaErro("Erro ao preencher ficha digital.", 500);
  }
}
