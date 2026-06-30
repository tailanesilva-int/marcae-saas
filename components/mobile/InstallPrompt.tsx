'use client';

import { useEffect, useState } from 'react';
import { usePwa } from './PwaProvider';

export default function InstallPrompt() {
  const { podeInstalar, instalado, instalar } = usePwa();
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    const oculto = localStorage.getItem('marcae_install_prompt_fechado');
    setFechado(oculto === 'true');
  }, []);

  function fechar() {
    localStorage.setItem('marcae_install_prompt_fechado', 'true');
    setFechado(true);
  }

  if (!podeInstalar || instalado || fechado) return null;

  return (
    <div style={container}>
      <div style={icone}>📱</div>

      <div style={{ flex: 1 }}>
        <strong style={titulo}>Instale o Marcaê</strong>
        <p style={texto}>Acesse mais rápido direto da tela inicial do celular.</p>
      </div>

      <button type="button" onClick={instalar} style={botao}>
        Instalar
      </button>

      <button type="button" onClick={fechar} style={fecharBotao}>
        ×
      </button>
    </div>
  );
}

const container: React.CSSProperties = {
  position: 'fixed',
  left: 16,
  right: 16,
  bottom: 16,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: 14,
  borderRadius: 20,
  background: 'rgba(8, 11, 22, 0.96)',
  border: '1px solid rgba(168, 85, 247, 0.35)',
  boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
  color: '#fff',
  backdropFilter: 'blur(18px)',
};

const icone: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #6D28D9, #A855F7)',
};

const titulo: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
};

const texto: React.CSSProperties = {
  margin: '3px 0 0',
  fontSize: 12,
  color: '#cbd5e1',
};

const botao: React.CSSProperties = {
  border: 0,
  borderRadius: 999,
  padding: '9px 13px',
  background: '#7c3aed',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const fecharBotao: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  color: '#94a3b8',
  fontSize: 22,
  cursor: 'pointer',
};