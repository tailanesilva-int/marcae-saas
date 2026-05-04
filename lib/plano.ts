export type PlanoEmpresa = 'basico' | 'premium';

export type StatusAssinatura =
  | 'trial'
  | 'ativa'
  | 'vencida'
  | 'expirada'
  | 'cancelada';

type EmpresaPlanoInput = {
  plano?: string | null;
  trialAtivo?: boolean | null;
  trialExpiraEm?: Date | string | null;
  assinaturaStatus?: string | null;
  assinaturaExpiraEm?: Date | string | null;
};

export function normalizarPlano(plano?: string | null): PlanoEmpresa {
  return plano === 'premium' ? 'premium' : 'basico';
}

export function dataAindaValida(data?: Date | string | null): boolean {
  if (!data) return false;

  const dataComparar = data instanceof Date ? data : new Date(data);

  if (Number.isNaN(dataComparar.getTime())) {
    return false;
  }

  return dataComparar.getTime() >= Date.now();
}

export function trialEstaAtivo(empresa?: EmpresaPlanoInput | null): boolean {
  if (!empresa) return false;

  return Boolean(empresa.trialAtivo) && dataAindaValida(empresa.trialExpiraEm);
}

export function assinaturaEstaAtiva(
  empresa?: EmpresaPlanoInput | null
): boolean {
  if (!empresa) return false;

  if (empresa.assinaturaStatus !== 'ativa') {
    return false;
  }

  if (!empresa.assinaturaExpiraEm) {
    return false;
  }

  return dataAindaValida(empresa.assinaturaExpiraEm);
}

export function assinaturaEstaVencida(
  empresa?: EmpresaPlanoInput | null
): boolean {
  if (!empresa?.assinaturaExpiraEm) return false;

  return !dataAindaValida(empresa.assinaturaExpiraEm);
}

export function isPremium(plano?: string | null): boolean {
  return normalizarPlano(plano) === 'premium';
}

export function temAcessoPremium(
  empresa?: EmpresaPlanoInput | null
): boolean {
  if (!empresa) return false;

  return trialEstaAtivo(empresa) || assinaturaEstaAtiva(empresa);
}

export function premiumExpirado(
  empresa?: EmpresaPlanoInput | null
): boolean {
  if (!empresa) return false;

  return (
    isPremium(empresa.plano) &&
    !trialEstaAtivo(empresa) &&
    !assinaturaEstaAtiva(empresa)
  );
}

export function podeUsarPrePagamento(
  empresaOuPlano?: EmpresaPlanoInput | string | null
): boolean {
  if (typeof empresaOuPlano === 'string') {
    return false;
  }

  return temAcessoPremium(empresaOuPlano);
}

export function podeUsarWhatsappAutomatico(
  empresaOuPlano?: EmpresaPlanoInput | string | null
): boolean {
  if (typeof empresaOuPlano === 'string') {
    return false;
  }

  return temAcessoPremium(empresaOuPlano);
}

export function podeUsarLembreteAutomatico(
  empresaOuPlano?: EmpresaPlanoInput | string | null
): boolean {
  if (typeof empresaOuPlano === 'string') {
    return false;
  }

  return temAcessoPremium(empresaOuPlano);
}

export function getFeaturesPlano(empresa?: EmpresaPlanoInput | null) {
  const premium = temAcessoPremium(empresa);

  return {
    plano: normalizarPlano(empresa?.plano),
    isPremium: premium,
    planoPremiumCadastrado: isPremium(empresa?.plano),
    premiumExpirado: premiumExpirado(empresa),
    trialAtivo: trialEstaAtivo(empresa),
    assinaturaAtiva: assinaturaEstaAtiva(empresa),
    assinaturaVencida: assinaturaEstaVencida(empresa),
    prePagamento: premium,
    whatsappAutomatico: premium,
    lembreteAutomatico: premium,
    ia: premium,
    relatoriosAvancados: premium,
  };
}