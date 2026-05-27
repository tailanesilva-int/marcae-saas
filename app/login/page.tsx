'use client';

import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [empresaSlug, setEmpresaSlug] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mobile, setMobile] = useState(false);

  const [abrirRecuperacao, setAbrirRecuperacao] = useState(false);
  const [etapaRecuperacao, setEtapaRecuperacao] = useState(1);
  const [loginRecuperacao, setLoginRecuperacao] = useState('');
  const [codigoRecuperacao, setCodigoRecuperacao] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [carregandoRecuperacao, setCarregandoRecuperacao] = useState(false);
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState('');
  const [erroRecuperacao, setErroRecuperacao] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const empresa = params.get('empresa') || '';
    setEmpresaSlug(empresa);

    const verificarTela = () => {
      setMobile(window.innerWidth <= 900);
    };

    verificarTela();

    window.addEventListener('resize', verificarTela);

    return () => {
      window.removeEventListener('resize', verificarTela);
    };
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCarregando(true);
      setErro('');

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: usuario, senha }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErro(data.error || 'Usuário ou senha inválidos.');
        return;
      }

      localStorage.setItem('usuarioEmpresa', JSON.stringify(data.usuario));
      localStorage.setItem('empresaLogada', JSON.stringify(data.empresa));

      if (data.empresa?.id) {
        localStorage.setItem('empresaId', data.empresa.id);
      }

      if (empresaSlug) {
        localStorage.setItem('empresaSlugAcesso', empresaSlug);
      }

      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setErro('Erro ao realizar login.');
    } finally {
      setCarregando(false);
    }
  }

  function limparModalRecuperacao() {
    setAbrirRecuperacao(false);
    setEtapaRecuperacao(1);
    setLoginRecuperacao('');
    setCodigoRecuperacao('');
    setNovaSenha('');
    setConfirmarNovaSenha('');
    setMensagemRecuperacao('');
    setErroRecuperacao('');
    setCarregandoRecuperacao(false);
  }

  async function solicitarCodigoRecuperacao() {
    try {
      setCarregandoRecuperacao(true);
      setErroRecuperacao('');
      setMensagemRecuperacao('');

      if (!loginRecuperacao.trim()) {
        setErroRecuperacao('Informe seu usuário ou e-mail.');
        return;
      }

      const res = await fetch('/api/auth/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginRecuperacao }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErroRecuperacao(data.error || 'Erro ao enviar código.');
        return;
      }

      setMensagemRecuperacao('Código enviado para o WhatsApp cadastrado.');
      setEtapaRecuperacao(2);
    } catch (error) {
      console.error('Erro ao solicitar recuperação:', error);
      setErroRecuperacao('Erro ao solicitar recuperação.');
    } finally {
      setCarregandoRecuperacao(false);
    }
  }

  async function redefinirSenha() {
    try {
      setCarregandoRecuperacao(true);
      setErroRecuperacao('');
      setMensagemRecuperacao('');

      if (!codigoRecuperacao.trim()) {
        setErroRecuperacao('Informe o código recebido no WhatsApp.');
        return;
      }

      if (!novaSenha.trim()) {
        setErroRecuperacao('Informe a nova senha.');
        return;
      }

      if (novaSenha.length < 4) {
        setErroRecuperacao('A nova senha deve ter pelo menos 4 caracteres.');
        return;
      }

      if (novaSenha !== confirmarNovaSenha) {
        setErroRecuperacao('As senhas não coincidem.');
        return;
      }

      const res = await fetch('/api/auth/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: loginRecuperacao,
          codigo: codigoRecuperacao,
          novaSenha,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErroRecuperacao(data.error || 'Erro ao redefinir senha.');
        return;
      }

      setMensagemRecuperacao('Senha redefinida com sucesso! Você já pode entrar.');

      setTimeout(() => {
        limparModalRecuperacao();
        setUsuario(loginRecuperacao);
      }, 1800);
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      setErroRecuperacao('Erro ao redefinir senha.');
    } finally {
      setCarregandoRecuperacao(false);
    }
  }

  return (
    <div style={container}>
      <div style={{ ...backgroundGlow, top: '-180px', left: '-180px' }} />

      <div style={{ ...backgroundGlow, bottom: '-220px', right: '-220px' }} />

      <div
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
          <div style={brandBadge}>Plataforma SaaS Premium</div>

          <h1
            style={{
              ...logo,
              fontSize: mobile ? '48px' : '64px',
            }}
          >
            Marca<span style={{ color: '#A855F7' }}>ê</span>
          </h1>

          <div style={logoGlow} />

          <p
            style={{
              ...description,
              fontSize: mobile ? '15px' : '17px',
            }}
          >
            Plataforma profissional para gestão completa de agendamentos,
            financeiro, comissões e automações via WhatsApp.
          </p>

          {empresaSlug && (
            <div style={empresaBox}>
              <span style={{ opacity: 0.7 }}>Acessando empresa</span>

              <strong style={{ display: 'block', marginTop: 6, fontSize: '15px' }}>
                {empresaSlug}
              </strong>
            </div>
          )}

          <div style={features}>
            <div style={feature}>✦ Controle automático de comissões</div>
            <div style={feature}>✦ Promoções e campanhas via WhatsApp</div>
            <div style={feature}>✦ Gestão completa de agenda e clientes</div>
            <div style={feature}>✦ Plataforma SaaS premium multiempresa</div>
          </div>
        </div>

        <div style={right}>
          <div style={card}>
            <div style={topBadge}>Painel Administrativo</div>

            <h2 style={title}>Entrar no painel</h2>

            <p style={subtitle}>
              Acesse sua conta para gerenciar serviços, profissionais, financeiro
              e automações.
            </p>

            <form onSubmit={handleLogin} style={form}>
              <input
                type="text"
                placeholder="Usuário ou WhatsApp"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                style={input}
                required
              />

              <input
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={input}
                required
              />

              {erro && <div style={erroBox}>{erro}</div>}

              <button
                type="submit"
                style={{
                  ...button,
                  opacity: carregando ? 0.7 : 1,
                }}
                disabled={carregando}
              >
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>

              <div style={divider}>
                <div style={dividerLine} />
                <span>ou</span>
                <div style={dividerLine} />
              </div>

              <button
                type="button"
                style={secondaryButton}
                onClick={() => {
                  setAbrirRecuperacao(true);
                  setEtapaRecuperacao(1);
                  setLoginRecuperacao(usuario || '');
                  setCodigoRecuperacao('');
                  setNovaSenha('');
                  setConfirmarNovaSenha('');
                  setMensagemRecuperacao('');
                  setErroRecuperacao('');
                }}
              >
                Esqueci minha senha
              </button>
            </form>
          </div>
        </div>
      </div>

      {abrirRecuperacao && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <button
              type="button"
              style={modalClose}
              onClick={limparModalRecuperacao}
            >
              ×
            </button>

            <div style={modalBadge}>
              Recuperação via WhatsApp
            </div>

            <h2 style={modalTitle}>Recuperar senha</h2>

            <p style={modalDescription}>
              {etapaRecuperacao === 1
                ? 'Informe seu usuário ou WhatsApp cadastrado. Enviaremos um código para o WhatsApp cadastrado.'
                : 'Digite o código recebido no WhatsApp e cadastre uma nova senha.'}
            </p>

            <div style={modalSteps}>
              <div
                style={{
                  ...modalStep,
                  background: etapaRecuperacao === 1 ? '#7C3AED' : 'rgba(255,255,255,0.08)',
                  color: etapaRecuperacao === 1 ? '#fff' : '#C4B5FD',
                }}
              >
                1
              </div>

              <div style={modalStepLine} />

              <div
                style={{
                  ...modalStep,
                  background: etapaRecuperacao === 2 ? '#7C3AED' : 'rgba(255,255,255,0.08)',
                  color: etapaRecuperacao === 2 ? '#fff' : '#C4B5FD',
                }}
              >
                2
              </div>
            </div>

            <div style={modalForm}>
              {etapaRecuperacao === 1 && (
                <>
                  <input
                    type="text"
                    placeholder="Usuário ou e-mail"
                    value={loginRecuperacao}
                    onChange={(e) => setLoginRecuperacao(e.target.value)}
                    style={input}
                  />

                  <button
                    type="button"
                    onClick={solicitarCodigoRecuperacao}
                    style={{
                      ...button,
                      opacity: carregandoRecuperacao ? 0.7 : 1,
                    }}
                    disabled={carregandoRecuperacao}
                  >
                    {carregandoRecuperacao ? 'Enviando...' : 'Enviar código pelo WhatsApp'}
                  </button>
                </>
              )}

              {etapaRecuperacao === 2 && (
                <>
                  <input
                    type="text"
                    placeholder="Código recebido"
                    value={codigoRecuperacao}
                    onChange={(e) => setCodigoRecuperacao(e.target.value)}
                    style={input}
                  />

                  <input
                    type="password"
                    placeholder="Nova senha"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    style={input}
                  />

                  <input
                    type="password"
                    placeholder="Confirmar nova senha"
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    style={input}
                  />

                  <button
                    type="button"
                    onClick={redefinirSenha}
                    style={{
                      ...button,
                      opacity: carregandoRecuperacao ? 0.7 : 1,
                    }}
                    disabled={carregandoRecuperacao}
                  >
                    {carregandoRecuperacao ? 'Salvando...' : 'Redefinir senha'}
                  </button>

                  <button
                    type="button"
                    style={modalBackButton}
                    onClick={() => {
                      setEtapaRecuperacao(1);
                      setCodigoRecuperacao('');
                      setNovaSenha('');
                      setConfirmarNovaSenha('');
                      setMensagemRecuperacao('');
                      setErroRecuperacao('');
                    }}
                  >
                    Voltar e reenviar código
                  </button>
                </>
              )}

              {erroRecuperacao && <div style={erroBox}>{erroRecuperacao}</div>}

              {mensagemRecuperacao && (
                <div style={successBox}>{mensagemRecuperacao}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
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
  fontWeight: 600,
  marginBottom: '28px',
};

const logo = {
  color: '#fff',
  fontWeight: 800,
  lineHeight: 1,
  marginBottom: '20px',
  position: 'relative' as const,
  zIndex: 2,
};

const logoGlow = {
  width: '180px',
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
  marginBottom: '32px',
};

const empresaBox = {
  width: 'fit-content',
  padding: '16px 20px',
  borderRadius: '18px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#fff',
  marginBottom: '34px',
  backdropFilter: 'blur(10px)',
};

const features = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '18px',
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
  fontWeight: 600,
  marginBottom: '24px',
};

const title = {
  fontSize: '46px',
  fontWeight: 800,
  color: '#fff',
  marginBottom: '14px',
  lineHeight: 1.1,
};

const subtitle = {
  color: 'rgba(255,255,255,0.68)',
  lineHeight: 1.8,
  marginBottom: '36px',
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
  fontWeight: 700,
  fontSize: '16px',
  cursor: 'pointer',
  boxShadow: '0 10px 35px rgba(124,58,237,0.45)',
  transition: 'all .2s ease',
};

const divider = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  color: 'rgba(255,255,255,0.35)',
  fontSize: '13px',
  marginTop: '4px',
};

const dividerLine = {
  flex: 1,
  height: '1px',
  background: 'rgba(255,255,255,0.08)',
};

const secondaryButton = {
  height: '56px',
  borderRadius: '18px',
  border: '1px solid rgba(168,85,247,0.30)',
  background: 'rgba(255,255,255,0.02)',
  color: '#E9D5FF',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  backdropFilter: 'blur(10px)',
};

const erroBox = {
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(239,68,68,0.20)',
  color: '#FCA5A5',
  padding: '14px',
  borderRadius: '14px',
  fontSize: '13px',
};

const successBox = {
  background: 'rgba(16,185,129,0.12)',
  border: '1px solid rgba(16,185,129,0.22)',
  color: '#86EFAC',
  padding: '14px',
  borderRadius: '14px',
  fontSize: '13px',
};

const modalOverlay = {
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(2,6,23,0.74)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  zIndex: 50,
};

const modalCard = {
  width: '100%',
  maxWidth: '480px',
  borderRadius: '30px',
  padding: '34px',
  background: 'rgba(8, 11, 27, 0.96)',
  border: '1px solid rgba(168,85,247,0.24)',
  boxShadow: '0 0 70px rgba(139,92,246,0.28), 0 28px 80px rgba(0,0,0,0.70)',
  position: 'relative' as const,
};

const modalClose = {
  position: 'absolute' as const,
  top: '18px',
  right: '18px',
  width: '36px',
  height: '36px',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  fontSize: '24px',
  lineHeight: 1,
  cursor: 'pointer',
};

const modalBadge = {
  width: 'fit-content',
  padding: '8px 14px',
  borderRadius: '999px',
  background: 'rgba(168,85,247,0.12)',
  border: '1px solid rgba(168,85,247,0.24)',
  color: '#C084FC',
  fontSize: '12px',
  fontWeight: 700,
  marginBottom: '18px',
};

const modalTitle = {
  color: '#fff',
  fontSize: '34px',
  fontWeight: 800,
  margin: '0 0 12px',
  lineHeight: 1.1,
};

const modalDescription = {
  color: 'rgba(255,255,255,0.68)',
  fontSize: '14px',
  lineHeight: 1.7,
  margin: '0 0 24px',
};

const modalSteps = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '24px',
};

const modalStep = {
  width: '34px',
  height: '34px',
  borderRadius: '999px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  fontWeight: 800,
  boxShadow: '0 8px 22px rgba(124,58,237,0.20)',
};

const modalStepLine = {
  flex: 1,
  height: '1px',
  background: 'rgba(255,255,255,0.10)',
};

const modalForm = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '16px',
};

const modalBackButton = {
  height: '52px',
  borderRadius: '16px',
  border: '1px solid rgba(168,85,247,0.24)',
  background: 'rgba(255,255,255,0.03)',
  color: '#E9D5FF',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
};