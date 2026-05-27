export function criarPremiumTheme(empresa?: any) {
  const primary = empresa?.corPrimaria || '#7c3aed';
  const secondary = empresa?.corSecundaria || '#a855f7';
  const sidebar = empresa?.corSidebar || '#0f172a';

  return {
    primary,
    secondary,
    sidebar,

    page: {
      minHeight: '100vh',
      color: '#0f172a',
    },

    card: {
      background: 'rgba(255, 255, 255, 0.94)',
      border: '1px solid rgba(226, 232, 240, 0.9)',
      borderRadius: 24,
      padding: 24,
      boxShadow: `0 24px 70px ${primary}14`,
      backdropFilter: 'blur(18px)',
    },

    cardDark: {
      background: 'rgba(15, 23, 42, 0.78)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: 24,
      padding: 24,
      boxShadow: `0 24px 70px ${primary}24`,
      backdropFilter: 'blur(18px)',
      color: '#fff',
    },

    gradientHeader: {
      background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
      color: '#fff',
      borderRadius: 28,
      padding: 32,
      boxShadow: `0 28px 80px ${primary}33`,
      border: '1px solid rgba(255,255,255,0.16)',
    },

    buttonPrimary: {
      border: 'none',
      borderRadius: 14,
      padding: '12px 16px',
      background: `linear-gradient(135deg, ${primary}, ${secondary})`,
      color: '#fff',
      fontWeight: 900,
      cursor: 'pointer',
      boxShadow: `0 18px 40px ${primary}35`,
    },

    buttonSecondary: {
      border: '1px solid rgba(203, 213, 225, 0.9)',
      borderRadius: 14,
      padding: '12px 16px',
      background: '#fff',
      color: '#0f172a',
      fontWeight: 900,
      cursor: 'pointer',
    },

    input: {
      width: '100%',
      padding: '13px 14px',
      borderRadius: 14,
      border: '1px solid #cbd5e1',
      background: '#fff',
      color: '#0f172a',
      fontSize: 14,
      outline: 'none',
      boxSizing: 'border-box' as const,
    },

    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      width: 'fit-content',
      background: `${primary}14`,
      color: primary,
      border: `1px solid ${primary}30`,
      padding: '7px 12px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
    },

    muted: {
      color: '#64748b',
      fontSize: 14,
    },

    grid2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 20,
    },

    grid3: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: 20,
    },

    grid4: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      gap: 20,
    },
  };
}