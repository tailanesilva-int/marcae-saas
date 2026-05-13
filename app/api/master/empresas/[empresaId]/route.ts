import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function adicionarDias(data: Date, dias: number) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + dias);
  return novaData;
}

function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function planoEhValido(plano: string) {
  return ["basico", "plus", "premium", "trial"].includes(plano);
}

function permissoesPorPlano(plano: string) {
  const planoNormalizado = String(plano || "basico").toLowerCase();

  if (planoNormalizado === "trial" || planoNormalizado === "premium") {
    return {
      dashboard: true,
      agenda: true,
      servicos: true,
      profissionais: true,
      promocoes: true,
      configuracoes: true,
      financeiro: true,
      comissoes: true,
    };
  }

  if (planoNormalizado === "plus") {
    return {
      dashboard: true,
      agenda: true,
      servicos: true,
      profissionais: true,
      promocoes: false,
      configuracoes: true,
      financeiro: true,
      comissoes: false,
    };
  }

  return {
    dashboard: true,
    agenda: true,
    servicos: true,
    profissionais: true,
    promocoes: false,
    configuracoes: true,
    financeiro: false,
    comissoes: false,
  };
}

function montarEndereco(body: any) {
  const rua = String(body?.rua || "").trim();
  const numero = String(body?.numero || "").trim();
  const estado = String(body?.estado || "").trim();
  const cidade = String(body?.cidade || "").trim();
  const complemento = String(body?.complemento || "").trim();

  return JSON.stringify({
    rua,
    numero,
    estado,
    cidade,
    complemento,
  });
}

async function registrarLogEmpresa(
  tx: any,
  empresaId: string,
  tipo: string,
  motivo: string
) {
  await tx.empresaLog.create({
    data: {
      empresaId,
      tipo,
      motivo,
    },
  });
}

export async function PATCH(req: Request, context: any) {
  try {
    const params = await context.params;
    const empresaId = String(params?.empresaId || "");
    const body = await req.json();

    const acao = body?.acao;

    if (!empresaId || empresaId === "undefined" || empresaId === "null") {
      return NextResponse.json(
        { error: "Empresa não informada." },
        { status: 400 }
      );
    }

    const empresaAtual = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresaAtual) {
      return NextResponse.json(
        { error: "Empresa não encontrada." },
        { status: 404 }
      );
    }

    if (acao === "editarCadastro") {
      const nome = String(body?.nome || "").trim();
      const slugRecebido = String(body?.slug || "").trim();
      const whatsapp = String(body?.whatsapp || "").trim();
      const responsavel = String(body?.responsavel || "").trim();
      const observacoesInternas = String(body?.observacoesInternas || "").trim();
      const plano = String(body?.plano || "basico").trim().toLowerCase();
      const valorMensalPersonalizado = Number(
        body?.valorMensalPersonalizado || 0
      );
      const endereco = montarEndereco(body);

      if (!nome) {
        return NextResponse.json(
          { error: "Nome da empresa é obrigatório." },
          { status: 400 }
        );
      }

      const slug = gerarSlug(slugRecebido || nome);

      if (!slug) {
        return NextResponse.json(
          { error: "Slug da empresa é obrigatório." },
          { status: 400 }
        );
      }

      if (!planoEhValido(plano)) {
        return NextResponse.json(
          { error: "Plano inválido. Use basico, plus, premium ou trial." },
          { status: 400 }
        );
      }

      if (
        Number.isNaN(valorMensalPersonalizado) ||
        valorMensalPersonalizado < 0
      ) {
        return NextResponse.json(
          { error: "Valor mensal inválido." },
          { status: 400 }
        );
      }

      const empresaComMesmoSlug = await prisma.empresa.findUnique({
        where: { slug },
      });

      if (empresaComMesmoSlug && empresaComMesmoSlug.id !== empresaId) {
        return NextResponse.json(
          { error: "Já existe outra empresa usando esse slug." },
          { status: 400 }
        );
      }

      const trialAtivo = plano === "trial";
      const hoje = new Date();

      const trialExpiraEm = new Date(hoje);
      trialExpiraEm.setDate(trialExpiraEm.getDate() + 7);

      const assinaturaExpiraEmAtual =
        empresaAtual.assinaturaExpiraEm &&
        new Date(empresaAtual.assinaturaExpiraEm) > hoje
          ? new Date(empresaAtual.assinaturaExpiraEm)
          : hoje;

      const novaAssinaturaExpiraEm = trialAtivo
        ? trialExpiraEm
        : adicionarDias(assinaturaExpiraEmAtual, 0);

      const empresa = await prisma.$transaction(async (tx) => {
        const atualizada = await tx.empresa.update({
          where: { id: empresaId },
          data: {
            nome,
            slug,
            telefone: whatsapp || null,
            whatsapp: whatsapp || null,
            endereco,
            responsavel: responsavel || null,
            observacoesInternas: observacoesInternas || null,

            plano,
            valorMensalPersonalizado,

            trialAtivo,
            trialExpiraEm: trialAtivo ? trialExpiraEm : null,

            assinaturaStatus: trialAtivo ? "trial" : "ativa",
            assinaturaExpiraEm: novaAssinaturaExpiraEm,
            assinaturaProximaCobrancaEm: novaAssinaturaExpiraEm,

            statusFinanceiro: trialAtivo ? "trial" : "em_dia",
            bloqueadoPorInadimplencia: false,
          },
        });

        await tx.usuarioEmpresa.updateMany({
          where: { empresaId },
          data: {
            permissoes: permissoesPorPlano(plano),
          },
        });

        return atualizada;
      });

      return NextResponse.json({ empresa });
    }

    if (acao === "ativar") {
      const motivo = String(body?.motivo || "Empresa ativada pelo painel master.").trim();

      const empresa = await prisma.$transaction(async (tx) => {
        const atualizada = await tx.empresa.update({
          where: { id: empresaId },
          data: {
            ativo: true,
            bloqueadoPorInadimplencia: false,
            statusFinanceiro:
              empresaAtual.plano === "trial" || empresaAtual.trialAtivo
                ? "trial"
                : "em_dia",
          },
        });

        await registrarLogEmpresa(tx, empresaId, "ativar", motivo);

        return atualizada;
      });

      return NextResponse.json({ empresa });
    }

    if (acao === "inativar") {
      const motivo = String(body?.motivo || "").trim();

      if (!motivo) {
        return NextResponse.json(
          { error: "Informe o motivo da inativação." },
          { status: 400 }
        );
      }

      const empresa = await prisma.$transaction(async (tx) => {
        const atualizada = await tx.empresa.update({
          where: { id: empresaId },
          data: {
            ativo: false,
          },
        });

        await registrarLogEmpresa(tx, empresaId, "inativar", motivo);

        return atualizada;
      });

      return NextResponse.json({ empresa });
    }

    if (acao === "bloquear") {
      const motivo = String(body?.motivo || "").trim();

      if (!motivo) {
        return NextResponse.json(
          { error: "Informe o motivo do bloqueio." },
          { status: 400 }
        );
      }

      const empresa = await prisma.$transaction(async (tx) => {
        const atualizada = await tx.empresa.update({
          where: { id: empresaId },
          data: {
            bloqueadoPorInadimplencia: true,
            statusFinanceiro: "inadimplente",
          },
        });

        await registrarLogEmpresa(tx, empresaId, "bloquear", motivo);

        return atualizada;
      });

      return NextResponse.json({ empresa });
    }

    if (acao === "desbloquear") {
      const motivo = String(
        body?.motivo || "Empresa desbloqueada pelo painel master."
      ).trim();

      const empresa = await prisma.$transaction(async (tx) => {
        const atualizada = await tx.empresa.update({
          where: { id: empresaId },
          data: {
            bloqueadoPorInadimplencia: false,
            statusFinanceiro:
              empresaAtual.plano === "trial" || empresaAtual.trialAtivo
                ? "trial"
                : "em_dia",
          },
        });

        await registrarLogEmpresa(tx, empresaId, "desbloquear", motivo);

        return atualizada;
      });

      return NextResponse.json({ empresa });
    }

    if (acao === "renovar30") {
      const base =
        empresaAtual.assinaturaExpiraEm &&
        new Date(empresaAtual.assinaturaExpiraEm) > new Date()
          ? new Date(empresaAtual.assinaturaExpiraEm)
          : new Date();

      const novaData = adicionarDias(base, 30);

      const planoAtual =
        empresaAtual.plano === "trial" ? "basico" : empresaAtual.plano || "basico";

      const valorPagamento = Number(empresaAtual.valorMensalPersonalizado || 0);

      const empresa = await prisma.$transaction(async (tx) => {
        const atualizada = await tx.empresa.update({
          where: { id: empresaId },
          data: {
            plano: planoAtual,
            ativo: true,
            trialAtivo: false,
            trialExpiraEm: null,
            assinaturaStatus: "ativa",
            assinaturaExpiraEm: novaData,
            assinaturaProximaCobrancaEm: novaData,
            statusFinanceiro: "em_dia",
            bloqueadoPorInadimplencia: false,
            ultimoPagamentoEm: new Date(),
          },
        });

        await tx.usuarioEmpresa.updateMany({
          where: { empresaId },
          data: {
            permissoes: permissoesPorPlano(planoAtual),
          },
        });

        await tx.empresaPagamento.create({
          data: {
            empresaId,
            valor: valorPagamento,
            status: "pago",
            descricao: `Renovação manual +30 dias - Plano ${planoAtual}`,
          },
        });

        await registrarLogEmpresa(
          tx,
          empresaId,
          "renovar30",
          `Renovação manual por mais 30 dias. Valor: R$ ${valorPagamento.toFixed(
            2
          )}.`
        );

        return atualizada;
      });

      return NextResponse.json({ empresa });
    }

    if (acao === "alterarPlano") {
      const plano = String(body?.plano || "").toLowerCase();

      if (!planoEhValido(plano)) {
        return NextResponse.json(
          { error: "Plano inválido." },
          { status: 400 }
        );
      }

      const trialAtivo = plano === "trial";
      const hoje = new Date();

      const trialExpiraEm = new Date(hoje);
      trialExpiraEm.setDate(trialExpiraEm.getDate() + 7);

      const assinaturaExpiraEm = trialAtivo
        ? trialExpiraEm
        : empresaAtual.assinaturaExpiraEm || adicionarDias(hoje, 30);

      const empresa = await prisma.$transaction(async (tx) => {
        const atualizada = await tx.empresa.update({
          where: { id: empresaId },
          data: {
            plano,
            trialAtivo,
            trialExpiraEm: trialAtivo ? trialExpiraEm : null,
            assinaturaStatus: trialAtivo ? "trial" : "ativa",
            assinaturaExpiraEm,
            assinaturaProximaCobrancaEm: assinaturaExpiraEm,
            statusFinanceiro: trialAtivo ? "trial" : "em_dia",
            bloqueadoPorInadimplencia: false,
          },
        });

        await tx.usuarioEmpresa.updateMany({
          where: { empresaId },
          data: {
            permissoes: permissoesPorPlano(plano),
          },
        });

        await registrarLogEmpresa(
          tx,
          empresaId,
          "alterarPlano",
          `Plano alterado para ${plano}.`
        );

        return atualizada;
      });

      return NextResponse.json({ empresa });
    }

if (acao === "mercadoPago") {
  const mercadoPagoAtivo =
    Boolean(body?.mercadoPagoAtivo);

  const mercadoPagoAccessToken = String(
    body?.mercadoPagoAccessToken || ""
  ).trim();

  const mercadoPagoPublicKey = String(
    body?.mercadoPagoPublicKey || ""
  ).trim();

  const mercadoPagoModo = String(
    body?.mercadoPagoModo || "sandbox"
  ).trim();

  if (
    mercadoPagoAtivo &&
    !mercadoPagoAccessToken
  ) {
    return NextResponse.json(
      {
        error:
          "Access Token Mercado Pago é obrigatório.",
      },
      { status: 400 }
    );
  }

  const empresa = await prisma.$transaction(
    async (tx) => {
      const atualizada = await tx.empresa.update({
        where: {
          id: empresaId,
        },

        data: {
          mercadoPagoAtivo,

          mercadoPagoAccessToken:
            mercadoPagoAccessToken || null,

          mercadoPagoPublicKey:
            mercadoPagoPublicKey || null,

          mercadoPagoModo:
            mercadoPagoModo || "sandbox",
        } as any,
      });

      await registrarLogEmpresa(
        tx,
        empresaId,
        "mercadoPago",
        mercadoPagoAtivo
          ? `Integração Mercado Pago ativada (${mercadoPagoModo}).`
          : "Integração Mercado Pago desativada."
      );

      return atualizada;
    }
  );

  return NextResponse.json({
    empresa,
  });
}

    if (acao === "alterarValor") {
      const valor = Number(body?.valorMensalPersonalizado || 0);

      if (Number.isNaN(valor) || valor < 0) {
        return NextResponse.json(
          { error: "Valor mensal inválido." },
          { status: 400 }
        );
      }

      const empresa = await prisma.$transaction(async (tx) => {
        const atualizada = await tx.empresa.update({
          where: { id: empresaId },
          data: {
            valorMensalPersonalizado: valor,
          },
        });

        await registrarLogEmpresa(
          tx,
          empresaId,
          "alterarValor",
          `Valor mensal alterado para R$ ${valor.toFixed(2)}.`
        );

        return atualizada;
      });

      return NextResponse.json({ empresa });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    console.error("Erro na ação master da empresa:", error);

    return NextResponse.json(
      { error: "Erro interno ao atualizar empresa." },
      { status: 500 }
    );
  }
}