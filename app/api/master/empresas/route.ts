import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function gerarUsuarioPadrao(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function planoEhValido(plano: string) {
  return ["basico", "plus", "premium", "trial"].includes(plano);
}

function normalizarValorMonetario(valor: any) {
  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  const texto = String(valor)
    .replace("R$", "")
    .replace(/\s/g, "")
    .trim();

  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;

  const numero = Number(normalizado);

  return Number.isFinite(numero) && numero >= 0 ? numero : 0;
}

async function obterValorPadraoPlano(plano: string) {
  const planoNormalizado = String(plano || "basico").toLowerCase();

  const configuracao = await (prisma as any).configuracaoSaas.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (planoNormalizado === "trial") {
    return 0;
  }

  if (planoNormalizado === "plus") {
    return normalizarValorMonetario(configuracao?.valorPlanoPlus);
  }

  if (planoNormalizado === "premium") {
    return normalizarValorMonetario(configuracao?.valorPlanoPremium);
  }

  return normalizarValorMonetario(configuracao?.valorPlanoBasico);
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const plano = searchParams.get("plano");

    const where: any = {};

    if (status) {
      if (status === "inadimplente") {
        where.OR = [
          { statusFinanceiro: "inadimplente" },
          { bloqueadoPorInadimplencia: true },
        ];
      } else if (status === "ativo") {
        where.ativo = true;
      } else if (status === "inativo") {
        where.ativo = false;
      } else if (status === "trial") {
        where.trialAtivo = true;
      }
    }

    if (plano) {
      where.plano = plano;
    }

    const empresas = await prisma.empresa.findMany({
      where,
      include: {
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: true,
            ativo: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalEmpresas = await prisma.empresa.count();

    const empresasAtivas = await prisma.empresa.count({
      where: { ativo: true },
    });

    const inadimplentes = await prisma.empresa.count({
      where: {
        OR: [
          { statusFinanceiro: "inadimplente" },
          { bloqueadoPorInadimplencia: true },
        ],
      },
    });

    const emTrial = await prisma.empresa.count({
      where: { trialAtivo: true },
    });

    return NextResponse.json({
      empresas,
      resumo: {
        totalEmpresas,
        empresasAtivas,
        inadimplentes,
        emTrial,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar empresas master:", error);

    return NextResponse.json(
      { error: "Erro interno ao buscar empresas." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nome = String(body?.nome || "").trim();
    const slugRecebido = String(body?.slug || "").trim();
    const whatsapp = String(body?.whatsapp || "").trim();
    const responsavel = String(body?.responsavel || "").trim();
    const observacoesInternas = String(body?.observacoesInternas || "").trim();
    const plano = String(body?.plano || "basico").trim().toLowerCase();
    const valorRecebido = normalizarValorMonetario(body?.valorMensalPersonalizado);
    const valorPadraoPlano = await obterValorPadraoPlano(plano);
    const valorMensalPersonalizado =
      plano === "trial" ? 0 : valorRecebido > 0 ? valorRecebido : valorPadraoPlano;
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
        { error: "Não foi possível gerar o slug da empresa." },
        { status: 400 }
      );
    }

    if (!planoEhValido(plano)) {
      return NextResponse.json(
        { error: "Plano inválido. Use basico, plus, premium ou trial." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(valorMensalPersonalizado) || valorMensalPersonalizado < 0) {
      return NextResponse.json(
        { error: "Valor mensal inválido." },
        { status: 400 }
      );
    }

    const empresaExistente = await prisma.empresa.findUnique({
      where: { slug },
    });

    if (empresaExistente) {
      return NextResponse.json(
        { error: "Já existe uma empresa cadastrada com esse slug." },
        { status: 400 }
      );
    }

    const usuarioBase = gerarUsuarioPadrao(nome);

    if (!usuarioBase) {
      return NextResponse.json(
        { error: "Não foi possível gerar o usuário padrão da empresa." },
        { status: 400 }
      );
    }

    let emailUsuarioPadrao = `${usuarioBase}@marcae.local`;
    let tentativaUsuario = 1;

    while (
      await prisma.usuarioEmpresa.findUnique({
        where: { email: emailUsuarioPadrao },
      })
    ) {
      tentativaUsuario += 1;
      emailUsuarioPadrao = `${usuarioBase}${tentativaUsuario}@marcae.local`;
    }

    const hoje = new Date();

    const trialAtivo = plano === "trial";

    const trialExpiraEm = new Date(hoje);
    trialExpiraEm.setDate(trialExpiraEm.getDate() + 7);

    const assinaturaExpiraEm = new Date(hoje);
    assinaturaExpiraEm.setDate(
      assinaturaExpiraEm.getDate() + (trialAtivo ? 7 : 30)
    );

    const resultado = await prisma.$transaction(async (tx) => {
      const empresa = await tx.empresa.create({
        data: {
          nome,
          slug,
          telefone: whatsapp || null,
          whatsapp: whatsapp || null,
          endereco,
          responsavel: responsavel || null,
          observacoesInternas: observacoesInternas || null,

          plano,
          ativo: true,

          trialAtivo,
          trialExpiraEm: trialAtivo ? trialExpiraEm : null,

          assinaturaStatus: trialAtivo ? "trial" : "ativa",
          assinaturaExpiraEm,
          assinaturaProximaCobrancaEm: assinaturaExpiraEm,

          valorMensalPersonalizado,
          statusFinanceiro: trialAtivo ? "trial" : "em_dia",
          bloqueadoPorInadimplencia: false,

          modoPagamentoAssinatura: "manual",
          formaPagamentoAssinatura: "pix",
          whatsappAtivo: false,
          tipoMidia: "imagem",
        },
      });

      const usuario = await tx.usuarioEmpresa.create({
        data: {
          empresaId: empresa.id,
          nome: responsavel || nome,
          email: emailUsuarioPadrao,
          senhaHash: "123456",
          perfil: "admin",
          ativo: true,
          permissoes: permissoesPorPlano(plano),
        },
      });

      return { empresa, usuario };
    });

    return NextResponse.json(
      {
        empresa: resultado.empresa,
        usuarioPadrao: {
          login: usuarioBase,
          email: emailUsuarioPadrao,
          senha: "123456",
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao cadastrar empresa master:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro interno ao cadastrar empresa.",
        detalhe: String(error),
      },
      { status: 500 }
    );
  }
}