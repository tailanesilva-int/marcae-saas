export const TEMA_PADRAO_MARCAE = {
  primary: '#7c3aed',
  secondary: '#a855f7',
  sidebar: '#0f172a',
};

export function corHexValida(cor: any) {
  if (!cor || typeof cor !== 'string') return false;
  return /^#([0-9A-F]{3}){1,2}$/i.test(cor.trim());
}

export function normalizarCor(cor: any, fallback: string) {
  return corHexValida(cor) ? String(cor).trim() : fallback;
}

export function hexParaRgb(cor: string) {
  const hex = cor.replace('#', '');

  const normalizado =
    hex.length === 3
      ? hex
          .split('')
          .map((item) => item + item)
          .join('')
      : hex;

  const numero = parseInt(normalizado, 16);

  return {
    r: (numero >> 16) & 255,
    g: (numero >> 8) & 255,
    b: numero & 255,
  };
}

export function rgba(cor: string, alpha: number) {
  const rgb = hexParaRgb(cor);

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function gerarTemaEmpresa(empresa: any) {
  const primary = normalizarCor(
    empresa?.corPrimaria || empresa?.corPrincipal || empresa?.primaryColor,
    TEMA_PADRAO_MARCAE.primary
  );

  const secondary = normalizarCor(
    empresa?.corSecundaria || empresa?.secondaryColor,
    TEMA_PADRAO_MARCAE.secondary
  );

  const sidebar = normalizarCor(
    empresa?.corSidebar || empresa?.sidebarColor,
    TEMA_PADRAO_MARCAE.sidebar
  );

  return {
    primary,
    secondary,
    sidebar,

    primarySoft: rgba(primary, 0.16),
    primaryMedium: rgba(primary, 0.32),
    primaryStrong: rgba(primary, 0.55),

    secondarySoft: rgba(secondary, 0.14),
    secondaryMedium: rgba(secondary, 0.28),
    secondaryStrong: rgba(secondary, 0.48),

    sidebarSoft: rgba(sidebar, 0.88),
    sidebarMedium: rgba(sidebar, 0.72),

    bg: '#06111f',
    bgSoft: '#0f172a',
    card: 'rgba(15, 23, 42, 0.86)',
    cardStrong: 'rgba(15, 23, 42, 0.96)',
    border: 'rgba(148, 163, 184, 0.18)',
    text: '#f8fafc',
    muted: '#94a3b8',

    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',

    gradient: `linear-gradient(135deg, ${primary}, ${secondary})`,
    gradientSoft: `linear-gradient(135deg, ${rgba(primary, 0.22)}, ${rgba(
      secondary,
      0.18
    )})`,
    glow: `0 24px 70px ${rgba(primary, 0.24)}`,
  };
}

export function aplicarTemaNoDocumento(empresa: any) {
  if (typeof document === 'undefined') return;

  const tema = gerarTemaEmpresa(empresa);

  const root = document.documentElement;

  root.style.setProperty('--marcae-primary', tema.primary);
  root.style.setProperty('--marcae-primary-soft', tema.primarySoft);
  root.style.setProperty('--marcae-primary-medium', tema.primaryMedium);
  root.style.setProperty('--marcae-primary-strong', tema.primaryStrong);

  root.style.setProperty('--marcae-secondary', tema.secondary);
  root.style.setProperty('--marcae-secondary-soft', tema.secondarySoft);
  root.style.setProperty('--marcae-secondary-medium', tema.secondaryMedium);
  root.style.setProperty('--marcae-secondary-strong', tema.secondaryStrong);

  root.style.setProperty('--marcae-sidebar', tema.sidebar);
  root.style.setProperty('--marcae-sidebar-soft', tema.sidebarSoft);
  root.style.setProperty('--marcae-sidebar-medium', tema.sidebarMedium);

  root.style.setProperty('--marcae-bg', tema.bg);
  root.style.setProperty('--marcae-bg-soft', tema.bgSoft);
  root.style.setProperty('--marcae-card', tema.card);
  root.style.setProperty('--marcae-card-strong', tema.cardStrong);
  root.style.setProperty('--marcae-border', tema.border);
  root.style.setProperty('--marcae-text', tema.text);
  root.style.setProperty('--marcae-muted', tema.muted);

  root.style.setProperty('--marcae-success', tema.success);
  root.style.setProperty('--marcae-danger', tema.danger);
  root.style.setProperty('--marcae-warning', tema.warning);

  root.style.setProperty('--marcae-gradient', tema.gradient);
  root.style.setProperty('--marcae-gradient-soft', tema.gradientSoft);
  root.style.setProperty('--marcae-glow', tema.glow);
}