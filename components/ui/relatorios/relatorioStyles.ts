import type { CSSProperties } from 'react';

export const relatorioMobileCss = `
  @media (max-width: 760px) {
    .relatorio-mobile-smart {
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
      padding: 18px !important;
      border-radius: 26px !important;
    }

    .relatorio-mobile-smart * {
      box-sizing: border-box !important;
    }

    .relatorio-mobile-header {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 16px !important;
    }

    .relatorio-mobile-actions {
      display: grid !important;
      grid-template-columns: 1fr !important;
      width: 100% !important;
      gap: 10px !important;
    }

    .relatorio-mobile-actions button,
    .relatorio-mobile-actions select {
      width: 100% !important;
      min-height: 46px !important;
    }

    .relatorio-mobile-grid {
      display: grid !important;
      grid-template-columns: 1fr !important;
      gap: 12px !important;
      width: 100% !important;
      max-width: 100% !important;
    }

    .relatorio-mobile-tablebox {
      width: 100% !important;
      max-width: 100% !important;
      overflow: hidden !important;
      border-radius: 24px !important;
    }

    .relatorio-mobile-tableheader {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 12px !important;
    }

    .relatorio-mobile-table {
      display: grid !important;
      gap: 12px !important;
      overflow: visible !important;
      padding: 12px !important;
    }

    .relatorio-mobile-thead {
      display: none !important;
    }

    .relatorio-mobile-row {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 8px !important;
      min-width: 0 !important;
      width: 100% !important;
      padding: 14px !important;
      border-radius: 18px !important;
      background: rgba(2, 6, 23, 0.42) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
    }

    .relatorio-mobile-row > span,
    .relatorio-mobile-row > strong,
    .relatorio-mobile-row > div {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
      text-align: left !important;
    }

    .relatorio-mobile-smart strong {
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
    }

    .relatorio-mobile-smart h2 {
      font-size: 28px !important;
      line-height: 1.05 !important;
    }

    .relatorio-mobile-panel-grid {
      grid-template-columns: 1fr !important;
    }

    .relatorio-mobile-panel-header {
      flex-direction: column !important;
      align-items: flex-start !important;
    }

    .relatorio-mobile-ranking-row {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 8px !important;
    }

    .relatorio-mobile-ranking-row > div {
      width: 100% !important;
      text-align: left !important;
    }
  }
`;

export const relatorioContainer: CSSProperties = {
  marginTop: 24,
  padding: 24,
  borderRadius: 28,
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.78))',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#fff',
  boxShadow: '0 24px 80px rgba(0,0,0,0.30)',
  backdropFilter: 'blur(18px)',
};

export const relatorioHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 20,
  alignItems: 'flex-start',
  marginBottom: 22,
};

export const relatorioAcoesHeader: CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  minWidth: 0,
};

export const relatorioTitle: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 900,
  letterSpacing: '-0.04em',
};

export const relatorioDescription: CSSProperties = {
  margin: '8px 0 0',
  color: '#94a3b8',
  lineHeight: 1.6,
};

export const relatorioPeriodoTexto: CSSProperties = {
  margin: '8px 0 0',
  color: '#94a3b8',
  fontSize: 13,
  fontWeight: 700,
};

export const relatorioLoading: CSSProperties = {
  marginBottom: 16,
  color: '#c4b5fd',
  fontWeight: 900,
};

export const relatorioGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
  gap: 14,
  width: '100%',
  maxWidth: '100%',
};

export const relatorioGridComMargem: CSSProperties = {
  ...relatorioGrid,
  marginTop: 16,
};

export const relatorioCard: CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.88), rgba(30,41,59,0.66))',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 20,
  padding: 16,
  color: '#fff',
  minWidth: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  boxShadow: '0 14px 40px rgba(0,0,0,0.18)',
};

export const relatorioCardResumo: CSSProperties = {
  padding: 20,
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.10)',
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))',
  display: 'grid',
  gap: 10,
  minWidth: 0,
  overflow: 'hidden',
  boxShadow: '0 14px 40px rgba(0,0,0,0.16)',
};

export const relatorioTableBox: CSSProperties = {
  marginTop: 24,
  borderRadius: 22,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.09)',
  background: 'rgba(2,6,23,0.28)',
  boxShadow: '0 18px 55px rgba(0,0,0,0.20)',
};

export const relatorioTableHeader: CSSProperties = {
  padding: 16,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'center',
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
};

export const relatorioTable: CSSProperties = {
  width: '100%',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
};

export const relatorioThead: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: 10,
  minWidth: 720,
  padding: '12px 16px',
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 900,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(15,23,42,0.42)',
};

export const relatorioRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: 10,
  minWidth: 720,
  padding: '14px 16px',
  alignItems: 'center',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  color: '#e2e8f0',
};

export const relatorioEmpty: CSSProperties = {
  padding: 20,
  color: '#94a3b8',
  background: 'rgba(255,255,255,0.025)',
};

export const relatorioContadorTexto: CSSProperties = {
  display: 'block',
  marginTop: 6,
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 700,
};

export const relatorioRankingBox: CSSProperties = {
  marginTop: 24,
  borderRadius: 22,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.09)',
  background: 'rgba(2,6,23,0.28)',
  boxShadow: '0 18px 55px rgba(0,0,0,0.18)',
};

export const relatorioRankingHeader: CSSProperties = {
  padding: 16,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
};

export const relatorioRankingRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  padding: 16,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

export const relatorioRankingValores: CSSProperties = {
  display: 'grid',
  gap: 4,
  textAlign: 'right',
  color: '#94a3b8',
  fontSize: 13,
};

export const relatorioMuted: CSSProperties = {
  display: 'block',
  marginTop: 4,
  color: '#94a3b8',
  fontSize: 12,
};

export const relatorioFormulaBox: CSSProperties = {
  marginTop: 22,
  padding: 18,
  borderRadius: 20,
  background:
    'linear-gradient(135deg, rgba(168,85,247,0.14), rgba(59,130,246,0.08))',
  border: '1px solid rgba(168,85,247,0.25)',
  display: 'grid',
  gap: 8,
  color: '#e9d5ff',
  boxShadow: '0 16px 45px rgba(88,28,135,0.18)',
};

export function relatorioButton(
  corPrimaria = '#7c3aed',
  corSecundaria = '#a855f7'
): CSSProperties {
  return {
    border: 'none',
    borderRadius: 14,
    padding: '12px 16px',
    background: `linear-gradient(135deg,${corPrimaria},${corSecundaria})`,
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: `0 12px 34px ${corPrimaria}55`,
    minHeight: 44,
  };
}

export function relatorioButtonSecondary(cor = '168,85,247'): CSSProperties {
  return {
    border: `1px solid rgba(${cor},0.45)`,
    borderRadius: 14,
    padding: '12px 16px',
    background: `linear-gradient(135deg, rgba(${cor},0.18), rgba(${cor},0.08))`,
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer',
    minHeight: 44,
    boxShadow: `0 10px 30px rgba(${cor},0.12)`,
  };
}

export function relatorioBadge(
  background = 'rgba(168,85,247,0.18)',
  color = '#e9d5ff',
  border = 'rgba(168,85,247,0.35)'
): CSSProperties {
  return {
    display: 'inline-flex',
    width: 'fit-content',
    padding: '7px 12px',
    borderRadius: 999,
    background,
    color,
    border: `1px solid ${border}`,
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 10,
    boxShadow: '0 10px 30px rgba(0,0,0,0.16)',
  };
}

export function relatorioStatusBadge(cor: string): CSSProperties {
  return {
    display: 'inline-flex',
    width: 'fit-content',
    padding: '6px 10px',
    borderRadius: 999,
    background: `${cor}22`,
    color: cor,
    border: `1px solid ${cor}55`,
    fontSize: 12,
    fontWeight: 900,
    textTransform: 'capitalize',
  };
}