'use client';

import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [empresaSlug, setEmpresaSlug] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const empresa = params.get('empresa') || '';
    setEmpresaSlug(empresa);

    const verificarTela = () => {
      setMobile(window.innerWidth <= 768);
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
      <div
        style={{
          ...wrapper,
          flexDirection: mobile ? 'column' : 'row',
          width: mobile ? '100%' : '100%',
          margin: mobile ? '20px' : '0',
        }}
      >
        <div
          style={{
            ...left,
            padding: mobile ? '32px 24px' : '50px',
          }}
        >
          <h1
            style={{
              ...logo,
              fontSize: mobile ? '38px' : '42px',
            }}
          >
            Marca<span style={{ color: '#A5B4FC' }}>ê</span>
          </h1>

          <p
            style={{
              ...description,
              fontSize: mobile ? '15px' : '16px',
            }}
          >
            Plataforma profissional de agendamentos com pagamentos,
            WhatsApp automático e controle de clientes.
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
          <div
            style={{
              ...card,
              padding: mobile ? '28px 22px' : '40px',
            }}
          >
            <h2 style={title}>Entrar no painel</h2>

            <p style={subtitle}>
              Acesse sua conta para gerenciar agenda, serviços e
              profissionais.
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

              <button
                type="submit"
                style={button}
                disabled={carregando}
              >
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>

              <button
                type="button"
                style={secondaryButton}
                onClick={() =>
                  alert(
                    'Recuperação de senha será implementada na próxima etapa.'
                  )
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
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0F172A, #312E81)',
  padding: '20px',
};

const wrapper = {
  display: 'flex',
  width: '100%',
  maxWidth: '1100px',
  borderRadius: '24px',
  overflow: 'hidden',
  boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
  background: '#fff',
};

const left = {
  flex: 1,
  color: '#fff',
  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
};

const logo = {
  fontWeight: 'bold',
  marginBottom: '20px',
};

const description = {
  opacity: 0.9,
  marginBottom: '24px',
  lineHeight: 1.6,
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
  opacity: 0.95,
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
  maxWidth: '420px',
};

const title = {
  fontSize: '30px',
  fontWeight: 'bold',
  marginBottom: '6px',
  color: '#111827',
};

const subtitle = {
  color: '#6B7280',
  marginBottom: '26px',
  lineHeight: 1.5,
};

const form = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '15px',
};

const input = {
  padding: '14px',
  borderRadius: '12px',
  border: '1px solid #D1D5DB',
  fontSize: '15px',
  outline: 'none',
};

const button = {
  padding: '14px',
  borderRadius: '12px',
  border: 'none',
  background: '#6366F1',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '15px',
};

const secondaryButton = {
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
  background: '#fff',
  cursor: 'pointer',
  fontSize: '14px',
};

const erroBox = {
  background: '#FEE2E2',
  color: '#991B1B',
  padding: '12px',
  borderRadius: '10px',
  fontSize: '13px',
};