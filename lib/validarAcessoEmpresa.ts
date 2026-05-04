import { prisma } from "@/lib/prisma";

export type PlanoEmpresa = "basico" | "plus" | "premium" | "trial";

export type RecursoEmpresa =
  | "dashboard"
  | "agenda"
  | "servicos"
  | "profissionais"
  | "financeiro"
  | "pagamentos"
  | "whatsapp"
  | "lembretes"
  | "promocoes"
  | "comissoes"
  | "dashboardAvancado"
  | "configuracoes";

type ValidarAcessoParams = {
  empresaId?: string | null;
  empresaSlug?: string | null;
  recurso?: RecursoEmpresa;
};

type ResultadoAcesso = {
  permitido: boolean;
  motivo?: string;
  codigo:
    | "OK"
    | "EMPRESA_NAO_INFORMADA"
    | "EMPRESA_NAO_ENCONTRADA"
    | "EMPRESA_INATIVA"
    | "INADIMPLENTE"
    | "TRIAL_EXPIRADO"
    | "ASSINATURA_EXPIRADA"
    | "PLANO_SEM_PERMISSAO";
  empresa?: any;
  plano?: PlanoEmpresa;
};

const recursosPorPlano: Record<PlanoEmpresa, RecursoEmpresa[]> = {
  basico: [
    "dashboard",
    "agenda",
    "servicos",
    "profissionais",
    "configuracoes",
  ],

  plus: [
    "dashboard",
    "agenda",
    "servicos",
    "profissionais",
    "financeiro",
    "pagamentos",
    "whatsapp",
    "lembretes",
    "configuracoes",
  ],

  premium: [
    "dashboard",
    "agenda",
    "servicos",
    "profissionais",
    "financeiro",
    "pagamentos",
    "whatsapp",
    "lembretes",
    "promocoes",
    "comissoes",
    "dashboardAvancado",
    "configuracoes",
  ],

  trial: [
    "dashboard",
    "agenda",
    "servicos",
    "profissionais",
    "financeiro",
    "pagamentos",
    "whatsapp",
    "lembretes",
    "promocoes",
    "comissoes",
    "dashboardAvancado",
    "configuracoes",
  ],
};

function normalizarPlano(plano?: string | null): PlanoEmpresa {
  if (plano === "plus") return "plus";
  if (plano === "premium") return "premium";
  if (plano === "trial") return "trial";
  return "basico";
}

function dataExpirada(data?: Date | string | null) {
  if (!data) return false;

  const dataConvertida = new Date(data);
  const agora = new Date();

  return dataConvertida.getTime() < agora.getTime();
}

export async function validarAcessoEmpresa({
  empresaId,
  empresaSlug,
  recurso,
}: ValidarAcessoParams): Promise<ResultadoAcesso> {
  if (!empresaId && !empresaSlug) {
    return {
      permitido: false,
      codigo: "EMPRESA_NAO_INFORMADA",
      motivo: "Empresa não informada.",
    };
  }

  const empresa = await prisma.empresa.findFirst({
    where: {
      OR: [
        empresaId ? { id: empresaId } : undefined,
        empresaSlug ? { slug: empresaSlug } : undefined,
      ].filter(Boolean) as any,
    },
  });

  if (!empresa) {
    return {
      permitido: false,
      codigo: "EMPRESA_NAO_ENCONTRADA",
      motivo: "Empresa não encontrada.",
    };
  }

  const plano = normalizarPlano((empresa as any).plano);

  if ((empresa as any).ativo === false) {
    return {
      permitido: false,
      codigo: "EMPRESA_INATIVA",
      motivo: "Empresa inativa. Entre em contato com o suporte.",
      empresa,
      plano,
    };
  }

  const statusFinanceiro = String((empresa as any).statusFinanceiro || "").toLowerCase();

  if (
    statusFinanceiro === "inadimplente" ||
    statusFinanceiro === "bloqueado" ||
    statusFinanceiro === "em_atraso"
  ) {
    return {
      permitido: false,
      codigo: "INADIMPLENTE",
      motivo: "Acesso bloqueado por inadimplência.",
      empresa,
      plano,
    };
  }

  if (plano === "trial") {
    const trialExpirado =
      dataExpirada((empresa as any).trialExpiraEm) ||
      dataExpirada((empresa as any).assinaturaExpiraEm);

    if (trialExpirado) {
      return {
        permitido: false,
        codigo: "TRIAL_EXPIRADO",
        motivo: "Trial expirado. Escolha um plano para continuar usando o AgendeAi.",
        empresa,
        plano,
      };
    }
  }

  if (plano !== "trial") {
    const assinaturaExpirada = dataExpirada((empresa as any).assinaturaExpiraEm);

    if (assinaturaExpirada) {
      return {
        permitido: false,
        codigo: "ASSINATURA_EXPIRADA",
        motivo: "Assinatura expirada. Regularize o plano para continuar usando o AgendeAi.",
        empresa,
        plano,
      };
    }
  }

  if (recurso) {
    const recursosLiberados = recursosPorPlano[plano] || recursosPorPlano.basico;

    if (!recursosLiberados.includes(recurso)) {
      return {
        permitido: false,
        codigo: "PLANO_SEM_PERMISSAO",
        motivo:
          plano === "basico"
            ? "Ative o plano Plus ou Premium para liberar este recurso 🔥🚀"
            : "Ative o plano Premium para liberar este recurso 🚀🔥",
        empresa,
        plano,
      };
    }
  }

  return {
    permitido: true,
    codigo: "OK",
    empresa,
    plano,
  };
}

export function planoTemAcesso(
  planoRecebido: string | null | undefined,
  recurso: RecursoEmpresa
) {
  const plano = normalizarPlano(planoRecebido);
  return recursosPorPlano[plano].includes(recurso);
}

export function mensagemBloqueioPorRecurso(
  planoRecebido: string | null | undefined,
  recurso: RecursoEmpresa
) {
  const plano = normalizarPlano(planoRecebido);

  if (planoTemAcesso(plano, recurso)) {
    return null;
  }

  if (plano === "basico") {
    return "Ative o plano Plus ou Premium para liberar este recurso 🔥🚀";
  }

  return "Ative o plano Premium para liberar este recurso 🚀🔥";
}

export { recursosPorPlano };