'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePwa } from './PwaProvider';

type PlataformaMobile = 'android' | 'ios' | 'desktop' | 'outro';

function detectarPlataforma(): PlataformaMobile {
  if (typeof window === 'undefined') return 'outro';

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  if (/windows|macintosh|linux/.test(userAgent)) return 'desktop';

  return 'outro';
}

function estaEmStandalone() {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export default function InstallPrompt() {
  const { podeInstalar, instalado, instalar } = usePwa();

  const [fechado, setFechado] = useState(true);
  const [plataforma, setPlataforma] = useState<PlataformaMobile>('outro');
  const [instalando, setInstalando] = useState(false);

  useEffect(() => {
    const plataformaAtual = detectarPlataforma();
    const instaladoComoApp = estaEmStandalone();

    setPlataforma(plataformaAtual);

    if (instaladoComoApp || instalado) {
      setFechado(true);
      return;
    }

    const fechadoAte = localStorage.getItem('marcae_install_prompt_fechado_ate');

    if (fechadoAte && new Date(fechadoAte).getTime() > Date.now()) {
      setFechado(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setFechado(false);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [instalado]);

  const deveExibir = useMemo(() => {
    if (fechado || instalado || estaEmStandalone()) return false;

    if (plataforma === 'ios') return true;

    return podeInstalar;
  }, [fechado, instalado, plataforma, podeInstalar]);

  function lembrarDepois() {
    const data = new Date();
    data.setDate(data.getDate() + 7);

    localStorage.setItem(
      'marcae_install_prompt_fechado_ate',
      data.toISOString()
    );

    setFechado(true);
  }

  async function instalarApp() {
    try {
      setInstalando(true);
      await instalar();
      setFechado(true);
    } finally {
      setInstalando(false);
    }
  }

  if (!deveExibir) return null;

  const ehIos = plataforma === 'ios';

  return (
    <div style={overlay}>
      <div style={card}>
        <button
          type="button"
          onClick={lembrarDepois}
          style={closeButton}
          aria-label="Fechar aviso de instalação"
        >
          ×
        </button>

        <div style={iconWrap}>
          <img src="/icons/icon-192.png" alt="Marcaê" style={icon} />
        </div>

        <div style={content}>
          <span style={badge}>Aplicativo oficial</span>

          <h3 style={title}>Instale o Marcaê no seu celular</h3>

          <p style={description}>
            Tenha acesso mais rápido ao painel, agenda, clientes, financeiro e
            notificações direto da tela inicial.
          </p>

          {ehIos ? (
            <div style={stepsBox}>
              <strong style={stepsTitle}>No iPhone:</strong>

              <ol style={stepsList}>
                <li>Toque no botão de compartilhar do Safari.</li>
                <li>Escolha “Adicionar à Tela de Início”.</li>
                <li>Confirme em “Adicionar”.</li>
              </ol>
            </div>
          ) : (
            <button
              type="button"
              onClick={instalarApp}
              disabled={instalando}
              style={{
                ...primaryButton,
                opacity: instalando ? 0.75 : 1,
                cursor: instalando ? 'not-allowed' : 'pointer',
              }}
            >
              {instalando ? 'Abrindo instalação...' : 'Instalar aplicativo'}
            </button>
          )}

          <button type="button" onClick={lembrarDepois} style={secondaryButton}>
            Lembrar depois
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 99998,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: 16,
  pointerEvents: 'none',
};

const card: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: 430,
  pointerEvents: 'auto',
  display: 'flex',
  gap: 14,
  padding: 16,
  borderRadius: 28,
  color: '#fff',
  background:
    'linear-gradient(145deg, rgba(8,11,22,0.98), rgba(17,24,39,0.98))',
  border: '1px solid rgba(168, 85, 247, 0.38)',
  boxShadow: '0 28px 90px rgba(0,0,0,0.58)',
  backdropFilter: 'blur(20px)',
};

const closeButton: React.CSSProperties = {
  position: 'absolute',
  top: 10,
  right: 12,
  width: 30,
  height: 30,
  border: 0,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.08)',
  color: '#cbd5e1',
  fontSize: 22,
  lineHeight: '26px',
  cursor: 'pointer',
};

const iconWrap: React.CSSProperties = {
  flex: '0 0 auto',
  width: 64,
  height: 64,
  borderRadius: 20,
  padding: 6,
  background: 'linear-gradient(135deg, #6D28D9, #A855F7)',
  boxShadow: '0 18px 50px rgba(124,58,237,0.45)',
};

const icon: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: 16,
  display: 'block',
};

const content: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  paddingRight: 18,
};

const badge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  marginBottom: 7,
  padding: '5px 9px',
  borderRadius: 999,
  background: 'rgba(124,58,237,0.16)',
  border: '1px solid rgba(168,85,247,0.28)',
  color: '#d8b4fe',
  fontSize: 11,
  fontWeight: 800,
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 17,
  lineHeight: 1.15,
  letterSpacing: '-0.03em',
};

const description: React.CSSProperties = {
  margin: '8px 0 12px',
  color: '#cbd5e1',
  fontSize: 13,
  lineHeight: 1.45,
};

const primaryButton: React.CSSProperties = {
  width: '100%',
  border: 0,
  borderRadius: 999,
  padding: '12px 14px',
  background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 900,
  boxShadow: '0 14px 34px rgba(124,58,237,0.35)',
};

const secondaryButton: React.CSSProperties = {
  width: '100%',
  marginTop: 8,
  border: 0,
  borderRadius: 999,
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.06)',
  color: '#cbd5e1',
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
};

const stepsBox: React.CSSProperties = {
  padding: 12,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const stepsTitle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 13,
};

const stepsList: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: '#cbd5e1',
  fontSize: 12,
  lineHeight: 1.55,
};