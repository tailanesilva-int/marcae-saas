'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisivel(false);
    }, 900);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visivel) return null;

  return (
    <div style={container}>
      <div style={glow} />

      <div style={conteudo}>
        <img src="/icons/icon-192.png" alt="Marcaê" style={icone} />
        <h1 style={titulo}>Marcaê</h1>
        <p style={subtitulo}>Organize. Agende. Cresça.</p>
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
  background: 'linear-gradient(160deg, #080B16 0%, #111827 55%, #1e1b4b 100%)',
  color: '#fff',
};

const glow: React.CSSProperties = {
  position: 'absolute',
  width: 420,
  height: 420,
  borderRadius: '50%',
  background: 'rgba(124, 58, 237, 0.35)',
  filter: 'blur(90px)',
};

const conteudo: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  animation: 'marcaeSplash 0.75s ease-out',
};

const icone: React.CSSProperties = {
  width: 112,
  height: 112,
  borderRadius: 28,
  boxShadow: '0 28px 80px rgba(124, 58, 237, 0.45)',
};

const titulo: React.CSSProperties = {
  margin: '22px 0 6px',
  fontSize: 40,
  letterSpacing: '-0.04em',
};

const subtitulo: React.CSSProperties = {
  margin: 0,
  color: '#cbd5e1',
  fontSize: 15,
};