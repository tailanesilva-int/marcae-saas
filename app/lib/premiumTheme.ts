import type { CSSProperties } from 'react';

export const premiumPage: CSSProperties = {
  minHeight: '100vh',
  background:
    'linear-gradient(180deg, var(--marcae-bg) 0%, var(--marcae-bg-soft) 100%)',
  padding: 32,
  position: 'relative',
  overflow: 'hidden',
};

export const premiumContainer: CSSProperties = {
  width: '100%',
  maxWidth: 1600,
  margin: '0 auto',
  position: 'relative',
  zIndex: 1,
};

export const premiumGlowPrimary: CSSProperties = {
  position: 'fixed',
  width: 500,
  height: 500,
  borderRadius: '50%',
  background: 'var(--marcae-primary-soft)',
  filter: 'blur(120px)',
  top: -120,
  right: -100,
  zIndex: 0,
};

export const premiumGlowSecondary: CSSProperties = {
  position: 'fixed',
  width: 420,
  height: 420,
  borderRadius: '50%',
  background: 'var(--marcae-secondary-soft)',
  filter: 'blur(120px)',
  bottom: -120,
  left: -80,
  zIndex: 0,
};

export const premiumHero: CSSProperties = {
  width: '100%',
  background:
    'linear-gradient(135deg, var(--marcae-primary) 0%, var(--marcae-secondary) 36%, var(--marcae-bg-soft) 72%, var(--marcae-bg) 100%)',
  borderRadius: 32,
  padding: 34,
  marginBottom: 30,
  border: '1px solid var(--marcae-border)',
  boxShadow: 'var(--marcae-glow)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 28,
  flexWrap: 'wrap',
  position: 'relative',
  overflow: 'hidden',
};

export const premiumCard: CSSProperties = {
  background: 'var(--marcae-card)',
  border: '1px solid var(--marcae-border)',
  borderRadius: 30,
  padding: 28,
  backdropFilter: 'blur(16px)',
  boxShadow: 'var(--marcae-shadow)',
};

export const premiumPanel: CSSProperties = {
  background: 'var(--marcae-card)',
  border: '1px solid var(--marcae-border)',
  borderRadius: 34,
  padding: 34,
  marginBottom: 30,
  backdropFilter: 'blur(16px)',
  boxShadow: 'var(--marcae-shadow)',
};

export const premiumInput: CSSProperties = {
  height: 54,
  borderRadius: 16,
  border: '1px solid var(--marcae-border)',
  background: 'var(--marcae-card-strong)',
  color: 'var(--marcae-text)',
  padding: '0 16px',
  outline: 'none',
};

export const premiumButton: CSSProperties = {
  height: 54,
  borderRadius: 18,
  border: 'none',
  background: 'var(--marcae-gradient)',
  color: '#fff',
  fontWeight: 900,
  fontSize: 14,
  cursor: 'pointer',
  boxShadow: 'var(--marcae-glow)',
};

export const premiumButtonGhost: CSSProperties = {
  height: 54,
  padding: '0 22px',
  borderRadius: 18,
  border: '1px solid var(--marcae-border)',
  background: 'rgba(255,255,255,.08)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
  backdropFilter: 'blur(14px)',
  fontSize: 14,
};

export const premiumButtonWhite: CSSProperties = {
  height: 54,
  padding: '0 24px',
  borderRadius: 18,
  border: 'none',
  background: '#fff',
  color: 'var(--marcae-primary)',
  fontWeight: 900,
  cursor: 'pointer',
  fontSize: 14,
  boxShadow: '0 18px 40px rgba(255,255,255,.14)',
};

export const premiumBadge: CSSProperties = {
  background: 'rgba(255,255,255,.12)',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,.08)',
};

export const premiumBadgeAccent: CSSProperties = {
  background: 'var(--marcae-secondary-soft)',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  border: '1px solid var(--marcae-secondary-medium)',
};

export const premiumBadgeSuccess: CSSProperties = {
  background: 'rgba(34,197,94,.16)',
  color: '#bbf7d0',
  padding: '10px 16px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  border: '1px solid rgba(34,197,94,.28)',
};

export const premiumSectionEyebrow: CSSProperties = {
  color: 'var(--marcae-secondary)',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
};

export const premiumSectionTitle: CSSProperties = {
  margin: '8px 0 0',
  color: 'var(--marcae-text)',
  fontSize: 28,
  fontWeight: 900,
};

export const premiumSectionDescription: CSSProperties = {
  margin: '10px 0 0',
  color: 'var(--marcae-muted)',
  fontSize: 14,
  lineHeight: 1.7,
};

export const premiumLabel: CSSProperties = {
  color: '#cbd5e1',
  fontWeight: 800,
  fontSize: 13,
};

export const premiumMetricCard: CSSProperties = {
  background: 'var(--marcae-card)',
  border: '1px solid var(--marcae-border)',
  borderRadius: 28,
  padding: 24,
  backdropFilter: 'blur(16px)',
};

export const premiumIconBox: CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: 18,
  background: 'var(--marcae-primary-soft)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 24,
};

export const premiumEmptyBox: CSSProperties = {
  border: '1px dashed var(--marcae-border)',
  background: 'rgba(2,6,23,.28)',
  borderRadius: 22,
  padding: 26,
  textAlign: 'center',
  color: 'var(--marcae-muted)',
  fontWeight: 700,
};