'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [visivel, setVisivel] = useState(true);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    const iniciarSaida = window.setTimeout(() => {
      setSaindo(true);
    }, 2600);

    const removerSplash = window.setTimeout(() => {
      setVisivel(false);
    }, 3100);

    return () => {
      window.clearTimeout(iniciarSaida);
      window.clearTimeout(removerSplash);
    };
  }, []);

  if (!visivel) return null;

  return (
    <div style={{ ...container, opacity: saindo ? 0 : 1 }}>
      <div style={glowPrincipal} />
      <div style={glowSecundario} />

      <div style={conteudo}>
        <div style={iconeWrap}>
          <img src="/icons/icon-192.png" alt="Marcaê" style={icone} />
        </div>

        <h1 style={titulo}>Marcaê</h1>

        <div style={frases}>
          <span>Agendar.</span>
          <span>Organizar.</span>
          <span>Alcançar.</span>
        </div>
      </div>
    </div>
  );
}

const container: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 99999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  background:
    'radial-gradient(circle at 50% 35%, rgba(109,40,217,0.22), transparent 34%), linear-gradient(180deg, #03050B 0%, #080B16 52%, #09090B 100%)',
  color: '#fff',
  transition: 'opacity 0.48s ease',
  paddingTop: 'env(safe-area-inset-top)',
  paddingBottom: 'env(safe-area-inset-bottom)',
};

const glowPrincipal: React.CSSProperties = {
  position: 'absolute',
  width: 460,
  height: 460,
  borderRadius: '50%',
  background: 'rgba(124, 58, 237, 0.34)',
  filter: 'blur(110px)',
  animation: 'marcaeSplashGlow 2.8s ease-in-out infinite alternate',
};

const glowSecundario: React.CSSProperties = {
  position: 'absolute',
  bottom: -160,
  width: 520,
  height: 260,
  borderRadius: '50%',
  background: 'rgba(168, 85, 247, 0.16)',
  filter: 'blur(90px)',
};

const conteudo: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  animation: 'marcaeSplashContent 0.9s ease-out',
};

const iconeWrap: React.CSSProperties = {
  width: 116,
  height: 116,
  borderRadius: 34,
  padding: 7,
  background:
    'linear-gradient(145deg, rgba(124,58,237,0.95), rgba(168,85,247,0.85))',
  boxShadow:
    '0 26px 80px rgba(124, 58, 237, 0.48), inset 0 1px 0 rgba(255,255,255,0.22)',
};

const icone: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
  borderRadius: 28,
};

const titulo: React.CSSProperties = {
  margin: '24px 0 14px',
  fontSize: 42,
  fontWeight: 900,
  letterSpacing: '-0.06em',
};

const frases: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  color: '#e9d5ff',
  fontSize: 18,
  fontWeight: 800,
  lineHeight: 1.12,
  letterSpacing: '-0.03em',
};