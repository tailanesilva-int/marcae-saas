export type PlanoAgendeAi = 'basico' | 'premium';

export type RecursoPlano =
  | 'agenda'
  | 'servicos'
  | 'profissionais'
  | 'usuarios_basico'
  | 'whatsapp_manual'
  | 'google_agenda'
  | 'pre_pagamento'
  | 'whatsapp_automatico'
  | 'lembrete_whatsapp'
  | 'dashboard_basico'
  | 'comissoes'
  | 'repasse_comissoes'
  | 'relatorio_financeiro'
  | 'dashboard_premium'
  | 'promocoes'
  | 'usuarios_avancado';

export const PLANOS = {
  basico: {
    nome: 'Básico',
    descricao:
      'Agenda online com WhatsApp automático para gestão essencial do negócio.',

    recursos: [
      'agenda',
      'servicos',
      'profissionais',
      'usuarios_basico',
      'whatsapp_manual',
      'google_agenda',

      // NOVO BÁSICO
      'whatsapp_automatico',
      'lembrete_whatsapp',
      'dashboard_basico',
    ],
  },

  premium: {
    nome: 'Premium',

    descricao:
      'Sistema completo com financeiro, pré-pagamento, comissões, relatórios e promoções.',

    recursos: [
      'agenda',
      'servicos',
      'profissionais',

      'usuarios_basico',
      'usuarios_avancado',

      'whatsapp_manual',
      'google_agenda',

      'whatsapp_automatico',
      'lembrete_whatsapp',

      'dashboard_basico',
      'dashboard_premium',

      'pre_pagamento',

      'comissoes',
      'repasse_comissoes',

      'relatorio_financeiro',

      'promocoes',
    ],
  },
} as const;

type EmpresaPlano = {
  plano?: string | null;
  trialExpiraEm?: Date | string | null;
  assinaturaStatus?: string | null;
  assinaturaExpiraEm?: Date | string | null;
};

export function normalizarPlano(plano?: string | null): PlanoAgendeAi {
  const planoNormalizado = String(plano || '').toLowerCase();

  // Compatibilidade com registros antigos
  if (planoNormalizado === 'plus') {
    return 'premium';
  }

  if (planoNormalizado === 'premium') {
    return 'premium';
  }

  return 'basico';
}

export function planoTemRecurso(
  plano: string | null | undefined,
  recurso: RecursoPlano
) {
  const planoNormalizado = normalizarPlano(plano);

  return (PLANOS[planoNormalizado].recursos as readonly string[]).includes(
    recurso
  );
}

export function dataValidaPlano(data?: Date | string | null) {
  if (!data) return false;

  return new Date(data).getTime() >= Date.now();
}

export function empresaEmTrial(empresa?: EmpresaPlano | null) {
  if (!empresa) return false;

  return dataValidaPlano(empresa.trialExpiraEm);
}

export function empresaComAssinaturaAtiva(
  empresa?: EmpresaPlano | null
) {
  if (!empresa) return false;

  return (
    empresa.assinaturaStatus === 'ativa' &&
    dataValidaPlano(empresa.assinaturaExpiraEm)
  );
}

export function empresaComLicencaAtiva(
  empresa?: EmpresaPlano | null
) {
  if (!empresa) return false;

  return (
    empresaEmTrial(empresa) ||
    empresaComAssinaturaAtiva(empresa)
  );
}

export function empresaTemRecurso(
  empresa: EmpresaPlano | null | undefined,
  recurso: RecursoPlano
) {
  if (!empresa) return false;

  if (!empresaComLicencaAtiva(empresa)) {
    return false;
  }

  // Trial libera experiência completa
  if (empresaEmTrial(empresa)) {
    return true;
  }

  return planoTemRecurso(empresa.plano, recurso);
}

export function respostaPlanoBloqueado(
  recurso: RecursoPlano
) {
  return {
    success: false,
    error: 'Recurso indisponível para o plano atual.',
    recurso,
    code: 'PLANO_NAO_PERMITE_RECURSO',
  };
}

export function nomePlano(plano?: string | null) {
  return PLANOS[normalizarPlano(plano)].nome;
}

export function descricaoPlanoPorTipo(
  plano?: string | null
) {
  return PLANOS[normalizarPlano(plano)].descricao;
}

export function planoEhBasico(plano?: string | null) {
  return normalizarPlano(plano) === 'basico';
}

export function planoEhPremium(plano?: string | null) {
  return normalizarPlano(plano) === 'premium';
}