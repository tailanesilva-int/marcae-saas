'use client';

import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [empresaSlug, setEmpresaSlug] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const empresa = params.get('empresa') || '';
    setEmpresaSlug(empresa);
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

      window.location.href = '/admin';
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setErro('Erro ao fazer login.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={container}>
      <div style={wrapper}>
        <div style={left}>
          <h1 style={logo}>
            Marca<span style={{ color: '#A5B4FC' }}>ê</span>
          </h1>

          <p style={description}>
            Plataforma profissional de agendamentos com pagamentos, WhatsApp
            automático e controle de clientes.
          </p>

          {empresaSlug && (
            <div style={empresaBox}>
              Acessando empresa:
              <strong style={{ display: 'block', marginTop: 4 }}>
                {empresaSlug}
              </strong>
            </div>
          )}

          <div style={features}>
            <div style={feature}>✓ Agenda inteligente</div>
            <div style={feature}>✓ Pagamento online (Pix)</div>
            <div style={feature}>✓ Confirmação via WhatsApp</div>
            <div style={feature}>✓ Sistema SaaS multiempresa</div>
          </div>
        </div>

        <div style={right}>
          <div style={card}>
            <h2 style={title}>Entrar no painel</h2>
            <p style={subtitle}>
              Acesse sua conta para gerenciar agenda, serviços e profissionais.
            </p>

            <form onSubmit={handleLogin} style={form}>
              <input
                type="text"
                placeholder="Usuário ou e-mail"
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

              <button type="submit" style={button} disabled={carregando}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>

              <button
                type="button"
                style={secondaryButton}
                onClick={() =>
                  alert('Recuperação de senha será implementada na próxima etapa.')
                }
              >
                Esqueci minha senha
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const container = {
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0F172A, #312E81)',
};

const wrapper = {
  display: 'flex',
  width: '100%',
  maxWidth: '1100px',
  borderRadius: '20px',
  overflow: 'hidden',
  boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
};

const left = {
  flex: 1,
  padding: '50px',
  color: '#fff',
  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
};

const logo = {
  fontSize: '42px',
  fontWeight: 'bold',
  marginBottom: '20px',
};

const description = {
  fontSize: '16px',
  opacity: 0.9,
  marginBottom: '24px',
};

const empresaBox = {
  background: 'rgba(255,255,255,0.14)',
  border: '1px solid rgba(255,255,255,0.22)',
  padding: '14px',
  borderRadius: '14px',
  marginBottom: '24px',
  fontSize: '14px',
};

const features = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '10px',
};

const feature = {
  fontSize: '14px',
  opacity: 0.9,
};

const right = {
  flex: 1,
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const card = {
  width: '100%',
  maxWidth: '400px',
  padding: '40px',
};

const title = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '5px',
};

const subtitle = {
  color: '#666',
  marginBottom: '25px',
};

const form = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '15px',
};

const input = {
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #ddd',
  fontSize: '14px',
};

const button = {
  padding: '12px',
  borderRadius: '10px',
  border: 'none',
  background: '#6366F1',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const secondaryButton = {
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid #ddd',
  background: '#fff',
  cursor: 'pointer',
};

const erroBox = {
  background: '#FEE2E2',
  color: '#991B1B',
  padding: '10px',
  borderRadius: '8px',
  fontSize: '13px',
};