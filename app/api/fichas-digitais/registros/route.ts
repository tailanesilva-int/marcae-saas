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

function normalizarValorNumero(valor: any) {
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = Number(String(valor).replace(",", "."));

  return Number.isFinite(numero) ? numero : null;
}

function normalizarData(valor: any) {
  if (!valor) return null;

  const data = new Date(valor);

  return Number.isNaN(data.getTime()) ? null : data;
}

function normalizarValorTexto(valor: any) {
  if (valor === null || valor === undefined) return null;

  if (typeof valor === "object") return null;

  return String(valor);
}

function normalizarValorJson(valor: any) {
  if (valor === null || valor === undefined || valor === "") return null;

  if (typeof valor === "object") return valor;

  return null;
}

function capturarIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

async function montarRespostasParaCriacao(
  empresaId: string,
  registroId: string,
  respostas: any[],
) {
  if (!Array.isArray(respostas) || respostas.length === 0) {
    return [];
  }

  const camposIds = respostas
    .map((item) => item.campoId)
    .filter(Boolean);

  const campos = camposIds.length
    ? await prisma.fichaCampo.findMany({
        where: {
          empresaId,
          id: {
            in: camposIds,
          },
        },
      })
    : [];

  const camposPorId = new Map(campos.map((campo) => [campo.id, campo]));

  return respostas.map((item, index) => {
    const campo = item.campoId ? camposPorId.get(item.campoId) : null;
    const campoTipo = item.campoTipo || campo?.tipo || "texto";
    const valor = item.valor ?? item.valorTexto ?? item.valorJson ?? null;

    return {
      empresaId,
      registroId,
      campoId: campo?.id || null,
      campoTitulo:
        item.campoTitulo ||
        campo?.titulo ||
        `Campo ${String(index + 1).padStart(2, "0")}`,
      campoTipo,
      valorTexto:
        item.valorTexto !== undefined
          ? normalizarValorTexto(item.valorTexto)
          : campoTipo === "texto" ||
              campoTipo === "textarea" ||
              campoTipo === "sim_nao" ||
              campoTipo === "selecao" ||
              campoTipo === "assinatura" ||
              campoTipo === "termo_lgpd"
            ? normalizarValorTexto(valor)
            : null,
      valorNumero:
        item.valorNumero !== undefined
          ? normalizarValorNumero(item.valorNumero)
          : campoTipo === "numero"
            ? normalizarValorNumero(valor)
            : null,
      valorData:
        item.valorData !== undefined
          ? normalizarData(item.valorData)
          : campoTipo === "data"
            ? normalizarData(valor)
            : null,
      valorJson:
        item.valorJson !== undefined
          ? normalizarValorJson(item.valorJson)
          : campoTipo === "multiselecao" || campoTipo === "foto"
            ? normalizarValorJson(valor)
            : null,
      ordem: Number.isFinite(Number(item.ordem)) ? Number(item.ordem) : index,
    };
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get("empresaId");
    const id = searchParams.get("id");
    const modeloId = searchParams.get("modeloId");
    const clienteId = searchParams.get("clienteId");
    const agendamentoId = searchParams.get("agendamentoId");
    const status = searchParams.get("status");

    if (!empresaId) {
      return respostaErro("empresaId obrigatório.");
    }

    if (id) {
      const registro = await prisma.fichaRegistro.findFirst({
        where: {
          id,
          empresaId,
        },
        include: {
          modelo: {
            include: {
              campos: {
                where: {
                  ativo: true,
                },
                orderBy: [
                  {
                    ordem: "asc",
                  },
                  {
                    createdAt: "asc",
                  },
                ],
              },
            },
          },
          cliente: true,
          agendamento: {
            include: {
              servico: true,
              profissional: true,
            },
          },
          respostas: {
            orderBy: {
              ordem: "asc",
            },
          },
          arquivos: {
            orderBy: [
              {
                ordem: "asc",
              },
              {
                createdAt: "asc",
              },
            ],
          },
        },
      });

      if (!registro) {
        return respostaErro("Ficha digital preenchida não encontrada.", 404);
      }

      return NextResponse.json({
        success: true,
        registro,
      });
    }

    const registros = await prisma.fichaRegistro.findMany({
      where: {
        empresaId,
        ...(modeloId ? { modeloId } : {}),
        ...(clienteId ? { clienteId } : {}),
        ...(agendamentoId ? { agendamentoId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        modelo: true,
        cliente: true,
        _count: {
          select: {
            respostas: true,
            arquivos: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      registros,
    });
  } catch (error) {
    console.error("Erro ao listar fichas digitais preenchidas:", error);

    return respostaErro("Erro ao listar fichas digitais preenchidas.", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const empresaId = body.empresaId;
    const modeloId = body.modeloId;

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

    if (body.clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: {
          id: body.clienteId,
          empresaId,
        },
      });

      if (!cliente) {
        return respostaErro("Cliente não encontrado para esta empresa.", 404);
      }
    }

    if (body.agendamentoId) {
      const agendamento = await prisma.agendamento.findFirst({
        where: {
          id: body.agendamentoId,
          empresaId,
        },
      });

      if (!agendamento) {
        return respostaErro("Agendamento não encontrado para esta empresa.", 404);
      }
    }

    const registro = await prisma.$transaction(async (tx) => {
      const registroCriado = await tx.fichaRegistro.create({
        data: {
          empresaId,
          modeloId,
          clienteId: body.clienteId || null,
          agendamentoId: body.agendamentoId || null,
          tituloSnapshot: modelo.titulo,
          status: body.status || "preenchida",
          origem: body.origem || "painel",
          preenchidoPorTipo: body.preenchidoPorTipo || null,
          preenchidoPorNome: body.preenchidoPorNome || null,
          preenchidoPorUsuarioId: body.preenchidoPorUsuarioId || null,
          assinado: Boolean(body.assinado),
          assinaturaImagemUrl: body.assinaturaImagemUrl || null,
          assinaturaNome: body.assinaturaNome || null,
          assinaturaCpf: body.assinaturaCpf || null,
          assinadoEm: body.assinado ? new Date() : null,
          aceiteLgpd: Boolean(body.aceiteLgpd),
          aceiteLgpdTexto: body.aceiteLgpdTexto || null,
          aceiteLgpdEm: body.aceiteLgpd ? new Date() : null,
          ip: body.ip || capturarIp(req),
          userAgent: body.userAgent || req.headers.get("user-agent") || null,
          observacaoInterna: body.observacaoInterna || null,
        },
      });

      const respostasPreparadas = await montarRespostasParaCriacao(
        empresaId,
        registroCriado.id,
        Array.isArray(body.respostas) ? body.respostas : [],
      );

      if (respostasPreparadas.length > 0) {
        await tx.fichaResposta.createMany({
          data: respostasPreparadas,
        });
      }

      if (Array.isArray(body.arquivos) && body.arquivos.length > 0) {
        await tx.fichaArquivo.createMany({
          data: body.arquivos
            .filter((arquivo: any) => arquivo?.url)
            .map((arquivo: any, index: number) => ({
              empresaId,
              registroId: registroCriado.id,
              tipo: arquivo.tipo || "foto",
              categoria: arquivo.categoria || null,
              url: arquivo.url,
              nomeArquivo: arquivo.nomeArquivo || null,
              mimeType: arquivo.mimeType || null,
              tamanhoBytes: arquivo.tamanhoBytes
                ? Number(arquivo.tamanhoBytes)
                : null,
              descricao: arquivo.descricao || null,
              ordem: Number.isFinite(Number(arquivo.ordem))
                ? Number(arquivo.ordem)
                : index,
            })),
        });
      }

      return tx.fichaRegistro.findUnique({
        where: {
          id: registroCriado.id,
        },
        include: {
          modelo: {
            include: {
              campos: {
                where: {
                  ativo: true,
                },
                orderBy: [
                  {
                    ordem: "asc",
                  },
                  {
                    createdAt: "asc",
                  },
                ],
              },
            },
          },
          cliente: true,
          respostas: {
            orderBy: {
              ordem: "asc",
            },
          },
          arquivos: {
            orderBy: [
              {
                ordem: "asc",
              },
              {
                createdAt: "asc",
              },
            ],
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      registro,
    });
  } catch (error) {
    console.error("Erro ao salvar ficha digital preenchida:", error);

    return respostaErro("Erro ao salvar ficha digital preenchida.", 500);
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

    const registroAtual = await prisma.fichaRegistro.findFirst({
      where: {
        id,
        empresaId,
      },
    });

    if (!registroAtual) {
      return respostaErro("Ficha digital preenchida não encontrada.", 404);
    }

    const registro = await prisma.$transaction(async (tx) => {
      const registroAtualizado = await tx.fichaRegistro.update({
        where: {
          id,
        },
        data: {
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.clienteId !== undefined
            ? { clienteId: body.clienteId || null }
            : {}),
          ...(body.agendamentoId !== undefined
            ? { agendamentoId: body.agendamentoId || null }
            : {}),
          ...(body.preenchidoPorTipo !== undefined
            ? { preenchidoPorTipo: body.preenchidoPorTipo || null }
            : {}),
          ...(body.preenchidoPorNome !== undefined
            ? { preenchidoPorNome: body.preenchidoPorNome || null }
            : {}),
          ...(body.preenchidoPorUsuarioId !== undefined
            ? { preenchidoPorUsuarioId: body.preenchidoPorUsuarioId || null }
            : {}),
          ...(body.assinado !== undefined
            ? {
                assinado: Boolean(body.assinado),
                assinadoEm: body.assinado
                  ? registroAtual.assinadoEm || new Date()
                  : null,
              }
            : {}),
          ...(body.assinaturaImagemUrl !== undefined
            ? { assinaturaImagemUrl: body.assinaturaImagemUrl || null }
            : {}),
          ...(body.assinaturaNome !== undefined
            ? { assinaturaNome: body.assinaturaNome || null }
            : {}),
          ...(body.assinaturaCpf !== undefined
            ? { assinaturaCpf: body.assinaturaCpf || null }
            : {}),
          ...(body.aceiteLgpd !== undefined
            ? {
                aceiteLgpd: Boolean(body.aceiteLgpd),
                aceiteLgpdEm: body.aceiteLgpd
                  ? registroAtual.aceiteLgpdEm || new Date()
                  : null,
              }
            : {}),
          ...(body.aceiteLgpdTexto !== undefined
            ? { aceiteLgpdTexto: body.aceiteLgpdTexto || null }
            : {}),
          ...(body.observacaoInterna !== undefined
            ? { observacaoInterna: body.observacaoInterna || null }
            : {}),
        },
      });

      if (Array.isArray(body.respostas)) {
        await tx.fichaResposta.deleteMany({
          where: {
            registroId: id,
            empresaId,
          },
        });

        const respostasPreparadas = await montarRespostasParaCriacao(
          empresaId,
          id,
          body.respostas,
        );

        if (respostasPreparadas.length > 0) {
          await tx.fichaResposta.createMany({
            data: respostasPreparadas,
          });
        }
      }

      if (Array.isArray(body.arquivos)) {
        await tx.fichaArquivo.deleteMany({
          where: {
            registroId: id,
            empresaId,
          },
        });

        const arquivos = body.arquivos
          .filter((arquivo: any) => arquivo?.url)
          .map((arquivo: any, index: number) => ({
            empresaId,
            registroId: id,
            tipo: arquivo.tipo || "foto",
            categoria: arquivo.categoria || null,
            url: arquivo.url,
            nomeArquivo: arquivo.nomeArquivo || null,
            mimeType: arquivo.mimeType || null,
            tamanhoBytes: arquivo.tamanhoBytes
              ? Number(arquivo.tamanhoBytes)
              : null,
            descricao: arquivo.descricao || null,
            ordem: Number.isFinite(Number(arquivo.ordem))
              ? Number(arquivo.ordem)
              : index,
          }));

        if (arquivos.length > 0) {
          await tx.fichaArquivo.createMany({
            data: arquivos,
          });
        }
      }

      return tx.fichaRegistro.findUnique({
        where: {
          id: registroAtualizado.id,
        },
        include: {
          modelo: {
            include: {
              campos: {
                where: {
                  ativo: true,
                },
                orderBy: [
                  {
                    ordem: "asc",
                  },
                  {
                    createdAt: "asc",
                  },
                ],
              },
            },
          },
          cliente: true,
          respostas: {
            orderBy: {
              ordem: "asc",
            },
          },
          arquivos: {
            orderBy: [
              {
                ordem: "asc",
              },
              {
                createdAt: "asc",
              },
            ],
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      registro,
    });
  } catch (error) {
    console.error("Erro ao atualizar ficha digital preenchida:", error);

    return respostaErro("Erro ao atualizar ficha digital preenchida.", 500);
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

    const registro = await prisma.fichaRegistro.findFirst({
      where: {
        id,
        empresaId,
      },
    });

    if (!registro) {
      return respostaErro("Ficha digital preenchida não encontrada.", 404);
    }

    const registroAtualizado = await prisma.fichaRegistro.update({
      where: {
        id,
      },
      data: {
        status: "arquivada",
      },
    });

    return NextResponse.json({
      success: true,
      registro: registroAtualizado,
      message: "Ficha digital arquivada com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao arquivar ficha digital:", error);

    return respostaErro("Erro ao arquivar ficha digital.", 500);
  }
}
