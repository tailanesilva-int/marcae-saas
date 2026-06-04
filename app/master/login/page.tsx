'use client';

import { useEffect, useState } from 'react';

export default function MasterLoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [redirect, setRedirect] = useState('/master');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const destino = params.get('redirect') || '/master';

    if (destino.startsWith('/master/login')) {
      setRedirect('/master');
    } else if (destino.startsWith('/master')) {
      setRedirect(destino);
    } else {
      setRedirect('/master');
    }

    const verificarTela = () => {
      setMobile(window.innerWidth <= 900);
    };

    verificarTela();
    window.addEventListener('resize', verificarTela);

    return () => window.removeEventListener('resize', verificarTela);
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCarregando(true);
      setErro('');

      const res = await fetch('/api/master/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setErro(data?.error || 'E-mail ou senha inválidos.');
        return;
      }

      window.location.href = redirect || '/master';
    } catch (error) {
      console.error('Erro ao entrar no Master:', error);
      setErro('Erro ao realizar login master.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main style={container}>
      <div style={{ ...backgroundGlow, top: '-180px', left: '-180px' }} />
      <div style={{ ...backgroundGlow, bottom: '-220px', right: '-220px' }} />

      <section
        style={{
          ...wrapper,
          flexDirection: mobile ? 'column' : 'row',
        }}
      >
        <div
          style={{
            ...left,
            borderRight: mobile ? 'none' : '1px solid rgba(139,92,246,0.20)',
          }}
        >
          <div style={brandBadge}>Acesso restrito</div>

          <h1
            style={{
              ...logo,
              fontSize: mobile ? '46px' : '62px',
            }}
          >
            Marca<span style={{ color: '#A855F7' }}>ê</span> Master
          </h1>

          <div style={logoGlow} />

          <p style={description}>
            Área exclusiva para gestão central do SaaS: empresas, planos,
            integrações, avisos oficiais, bloqueios e configurações comerciais.
          </p>

          <div style={securityBox}>
            <strong>Proteção ativa</strong>
            <span>
              O painel Master agora usa autenticação separada, cookie seguro e
              redirecionamento automático quando a sessão expira.
            </span>
          </div>

          <div style={features}>
            <div style={feature}>✦ Controle central das empresas</div>
            <div style={feature}>✦ Gestão de planos e inadimplência</div>
            <div style={feature}>✦ Comunicação oficial Marcaê</div>
            <div style={feature}>✦ Configurações sensíveis protegidas</div>
          </div>
        </div>

        <div style={right}>
          <div style={card}>
            <div style={topBadge}>Painel Master</div>

            <h2 style={title}>Entrar no Master</h2>

            <p style={subtitle}>
              Use suas credenciais administrativas para acessar a gestão central
              do Marcaê.
            </p>

            <form onSubmit={handleLogin} style={form}>
              <input
                type="email"
                placeholder="E-mail master"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={input}
                autoComplete="email"
                required
              />

              <input
                type="password"
                placeholder="Senha master"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                style={input}
                autoComplete="current-password"
                required
              />

              {erro && <div style={erroBox}>{erro}</div>}

              <button
                type="submit"
                style={{
                  ...button,
                  opacity: carregando ? 0.7 : 1,
                  cursor: carregando ? 'not-allowed' : 'pointer',
                }}
                disabled={carregando}
              >
                {carregando ? 'Validando acesso...' : 'Entrar no Master'}
              </button>
            </form>

            <div style={footerNote}>
              Sessão protegida por cookie HTTP-only. Não compartilhe este acesso.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const container = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    'radial-gradient(circle at top left, rgba(139,92,246,0.25), transparent 30%), linear-gradient(135deg, #050816 0%, #090B1A 45%, #140B2D 100%)',
  position: 'relative' as const,
  overflow: 'hidden',
  padding: '24px',
};

const backgroundGlow = {
  position: 'absolute' as const,
  width: '520px',
  height: '520px',
  borderRadius: '999px',
  background: 'radial-gradient(circle, rgba(168,85,247,0.35), transparent 70%)',
  filter: 'blur(40px)',
};

const wrapper = {
  width: '100%',
  maxWidth: '1150px',
  minHeight: '680px',
  borderRadius: '34px',
  overflow: 'hidden',
  display: 'flex',
  background: 'rgba(8, 11, 27, 0.82)',
  border: '1px solid rgba(139,92,246,0.20)',
  backdropFilter: 'blur(18px)',
  boxShadow: '0 0 80px rgba(139,92,246,0.18), 0 30px 90px rgba(0,0,0,0.65)',
  position: 'relative' as const,
  zIndex: 2,
};

const left = {
  flex: 1,
  padding: '70px',
  position: 'relative' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  background: 'linear-gradient(180deg, rgba(139,92,246,0.10), rgba(0,0,0,0))',
};

const brandBadge = {
  width: 'fit-content',
  padding: '10px 18px',
  borderRadius: '999px',
  border: '1px solid rgba(168,85,247,0.35)',
  background: 'rgba(168,85,247,0.10)',
  color: '#C084FC',
  fontSize: '13px',
  fontWeight: 700,
  marginBottom: '28px',
};

const logo = {
  color: '#fff',
  fontWeight: 900,
  lineHeight: 1,
  marginBottom: '20px',
  position: 'relative' as const,
  zIndex: 2,
};

const logoGlow = {
  width: '210px',
  height: '6px',
  borderRadius: '999px',
  background: 'linear-gradient(90deg, #A855F7, rgba(168,85,247,0))',
  marginBottom: '36px',
  boxShadow: '0 0 25px rgba(168,85,247,0.8)',
};

const description = {
  color: 'rgba(255,255,255,0.82)',
  lineHeight: 1.8,
  maxWidth: '520px',
  marginBottom: '28px',
  fontSize: '16px',
};

const securityBox = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '8px',
  padding: '18px',
  borderRadius: '20px',
  background: 'rgba(34,197,94,0.09)',
  border: '1px solid rgba(34,197,94,0.18)',
  color: '#BBF7D0',
  lineHeight: 1.6,
  marginBottom: '30px',
};

const features = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '16px',
};

const feature = {
  color: '#E9D5FF',
  fontSize: '15px',
  fontWeight: 500,
  letterSpacing: '0.2px',
};

const right = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px',
};

const card = {
  width: '100%',
  maxWidth: '430px',
};

const topBadge = {
  width: 'fit-content',
  padding: '8px 14px',
  borderRadius: '999px',
  background: 'rgba(168,85,247,0.12)',
  border: '1px solid rgba(168,85,247,0.20)',
  color: '#C084FC',
  fontSize: '12px',
  fontWeight: 700,
  marginBottom: '24px',
};

const title = {
  fontSize: '44px',
  fontWeight: 900,
  color: '#fff',
  marginBottom: '14px',
  lineHeight: 1.1,
};

const subtitle = {
  color: 'rgba(255,255,255,0.68)',
  lineHeight: 1.8,
  marginBottom: '34px',
  fontSize: '15px',
};

const form = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '18px',
};

const input = {
  width: '100%',
  padding: '18px',
  borderRadius: '18px',
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.03)',
  color: '#fff',
  fontSize: '15px',
  outline: 'none',
  backdropFilter: 'blur(8px)',
  boxSizing: 'border-box' as const,
};

const button = {
  height: '58px',
  borderRadius: '18px',
  border: 'none',
  background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
  color: '#fff',
  fontWeight: 800,
  fontSize: '16px',
  boxShadow: '0 10px 35px rgba(124,58,237,0.45)',
};

const erroBox = {
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(239,68,68,0.20)',
  color: '#FCA5A5',
  padding: '14px',
  borderRadius: '14px',
  fontSize: '13px',
};

const footerNote = {
  marginTop: '22px',
  color: 'rgba(255,255,255,0.42)',
  fontSize: '12px',
  lineHeight: 1.6,
};
