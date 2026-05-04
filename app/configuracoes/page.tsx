'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type PermissoesUsuario = {
  dashboard: boolean;
  agenda: boolean;
  servicos: boolean;
  profissionais: boolean;
  promocoes: boolean;
  configuracoes: boolean;
  visualizarFinanceiro: boolean;
};

type UsuarioSistema = {
  id: string;
  nome: string;
  email: string;
  perfil: string | null;
  ativo: boolean | null;
  permissoes: any;
};

const permissoesPadrao: PermissoesUsuario = {
  dashboard: false,
  agenda: false,
  servicos: false,
  profissionais: false,
  promocoes: false,
  configuracoes: false,
  visualizarFinanceiro: false,
};

export default function ConfiguracoesPage() {
  const router = useRouter();

  const [empresaId, setEmpresaId] = useState('');
  const [recorrente, setRecorrente] = useState(false);
  const [tipoCobranca, setTipoCobranca] = useState('cartao');
  const [salvando, setSalvando] = useState(false);
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false);

  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [usuarioEditandoId, setUsuarioEditandoId] = useState('');

  const [nomeUsuario, setNomeUsuario] = useState('');
  const [loginUsuario, setLoginUsuario] = useState('');
  const [senhaUsuario, setSenhaUsuario] = useState('');
  const [perfilUsuario, setPerfilUsuario] = useState('usuario');
  const [ativoUsuario, setAtivoUsuario] = useState(true);
  const [permissoes, setPermissoes] = useState<PermissoesUsuario>(permissoesPadrao);
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);

  useEffect(() => {
    const empresaIdLocal = localStorage.getItem('empresaId');
    const empresaLogadaRaw = localStorage.getItem('empresaLogada');
    const empresaLogada = empresaLogadaRaw ? JSON.parse(empresaLogadaRaw) : null;

    setEmpresaId(empresaIdLocal || empresaLogada?.id || '');
  }, []);

  useEffect(() => {
    if (empresaId) {
      carregarUsuarios();
    }
  }, [empresaId]);

  async function carregarUsuarios() {
    try {
      const res = await fetch(`/api/admin/empresas/${empresaId}/usuarios`);
      const data = await res.json();

      if (data.success) {
        setUsuarios(data.usuarios);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }

  function alterarPermissao(chave: keyof PermissoesUsuario) {
    setPermissoes((atual) => ({
      ...atual,
      [chave]: !atual[chave],
    }));
  }

  function limparFormularioUsuario() {
    setUsuarioEditandoId('');
    setNomeUsuario('');
    setLoginUsuario('');
    setSenhaUsuario('');
    setPerfilUsuario('usuario');
    setAtivoUsuario(true);
    setPermissoes(permissoesPadrao);
  }

  function editarUsuario(usuario: UsuarioSistema) {
    setMostrarUsuarios(true);
    setUsuarioEditandoId(usuario.id);
    setNomeUsuario(usuario.nome || '');
    setLoginUsuario(usuario.email || '');
    setSenhaUsuario('');
    setPerfilUsuario(usuario.perfil || 'usuario');
    setAtivoUsuario(usuario.ativo !== false);
    setPermissoes({
      ...permissoesPadrao,
      ...(usuario.permissoes || {}),
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function salvarConfigPagamento() {
    if (!empresaId) {
      alert('Empresa não encontrada. Faça login novamente.');
      return;
    }

    try {
      setSalvando(true);

      const res = await fetch(`/api/admin/empresas/${empresaId}/config-pagamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recorrente, tipoCobranca }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Configuração salva!');
      } else {
        alert(data.error || 'Erro ao salvar configuração.');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração.');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarUsuario() {
    if (!empresaId) {
      alert('Empresa não encontrada. Faça login novamente.');
      return;
    }

    if (!nomeUsuario || !loginUsuario) {
      alert('Preencha nome e usuário.');
      return;
    }

    if (!usuarioEditandoId && !senhaUsuario) {
      alert('Preencha a senha.');
      return;
    }

    try {
      setSalvandoUsuario(true);

      const res = await fetch(`/api/admin/empresas/${empresaId}/usuarios`, {
        method: usuarioEditandoId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: usuarioEditandoId,
          nome: nomeUsuario,
          email: loginUsuario,
          senha: senhaUsuario,
          perfil: perfilUsuario,
          ativo: ativoUsuario,
          permissoes: perfilUsuario === 'admin' ? null : permissoes,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || 'Erro ao salvar usuário.');
        return;
      }

      alert(usuarioEditandoId ? 'Usuário atualizado com sucesso!' : 'Usuário salvo com sucesso!');

      limparFormularioUsuario();
      await carregarUsuarios();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário.');
    } finally {
      setSalvandoUsuario(false);
    }
  }

  return (
    <div style={page}>
      <div style={header}>
        <div style={headerTop}>
          <div>
            <p style={eyebrow}>Painel administrativo</p>
            <h1 style={title}>Configurações</h1>
            <p style={subtitle}>
              Gerencie cobranças, usuários e permissões de acesso do Marcaê.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push('/admin')}
            style={backButton}
          >
            ← Voltar para o painel
          </button>
        </div>
      </div>

      <div style={grid}>
        <section style={card}>
          <div style={cardHeader}>
            <div>
              <h2 style={cardTitle}>Pagamento</h2>
              <p style={cardDescription}>
                Configure a forma de cobrança da mensalidade.
              </p>
            </div>

            <span style={badge}>Assinatura</span>
          </div>

          <label style={checkboxRow}>
            <input
              type="checkbox"
              checked={recorrente}
              onChange={(e) => setRecorrente(e.target.checked)}
            />
            <span>Cobrança automática mensal</span>
          </label>

          <div style={field}>
            <label style={label}>Tipo de cobrança</label>
            <select
              value={tipoCobranca}
              onChange={(e) => setTipoCobranca(e.target.value)}
              style={select}
            >
              <option value="cartao">Cartão</option>
              <option value="saldo">Saldo</option>
              <option value="pix">Pix</option>
            </select>
          </div>

          <button
            onClick={salvarConfigPagamento}
            disabled={salvando}
            style={{
              ...primaryButton,
              opacity: salvando ? 0.7 : 1,
              cursor: salvando ? 'not-allowed' : 'pointer',
            }}
          >
            {salvando ? 'Salvando...' : 'Salvar pagamento'}
          </button>
        </section>

        <section style={card}>
          <div style={cardHeader}>
            <div>
              <h2 style={cardTitle}>Usuários e permissões</h2>
              <p style={cardDescription}>
                Cadastre usuários e controle o acesso aos módulos do sistema.
              </p>
            </div>

            <span style={badge}>Admin</span>
          </div>

          <div style={permissionGrid}>
            <div style={permissionItem}>
              <strong>Administrador</strong>
              <span>Acesso total ao sistema.</span>
            </div>

            <div style={permissionItem}>
              <strong>Usuário comum</strong>
              <span>Acesso limitado por permissões.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMostrarUsuarios(!mostrarUsuarios)}
            style={primaryButton}
          >
            {mostrarUsuarios ? 'Ocultar cadastro' : 'Gerenciar usuários'}
          </button>
        </section>
      </div>

      {mostrarUsuarios && (
        <section style={cardWide}>
          <div style={cardHeader}>
            <div>
              <h2 style={cardTitle}>
                {usuarioEditandoId ? 'Editar usuário' : 'Novo usuário'}
              </h2>
              <p style={cardDescription}>
                Cadastre ou edite o acesso de um usuário da empresa.
              </p>
            </div>

            {usuarioEditandoId && (
              <button type="button" onClick={limparFormularioUsuario} style={smallButton}>
                Novo usuário
              </button>
            )}
          </div>

          <div style={formGrid}>
            <div style={field}>
              <label style={label}>Nome</label>
              <input
                value={nomeUsuario}
                onChange={(e) => setNomeUsuario(e.target.value)}
                placeholder="Nome do usuário"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>Usuário/Login</label>
              <input
                value={loginUsuario}
                onChange={(e) => setLoginUsuario(e.target.value)}
                placeholder="Ex: nane, recepcao01, admin"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>
                Senha {usuarioEditandoId ? '(preencha somente se quiser alterar)' : ''}
              </label>
              <input
                type="password"
                value={senhaUsuario}
                onChange={(e) => setSenhaUsuario(e.target.value)}
                placeholder="Senha de acesso"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>Perfil</label>
              <select
                value={perfilUsuario}
                onChange={(e) => setPerfilUsuario(e.target.value)}
                style={select}
              >
                <option value="admin">Administrador</option>
                <option value="usuario">Usuário comum</option>
              </select>
            </div>
          </div>

          <label style={checkboxRow}>
            <input
              type="checkbox"
              checked={ativoUsuario}
              onChange={(e) => setAtivoUsuario(e.target.checked)}
            />
            <span>Usuário ativo</span>
          </label>

          {perfilUsuario === 'usuario' && (
            <div style={permissionsBox}>
              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={permissoes.dashboard}
                  onChange={() => alterarPermissao('dashboard')}
                />
                Dashboard
              </label>

              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={permissoes.agenda}
                  onChange={() => alterarPermissao('agenda')}
                />
                Agenda
              </label>

              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={permissoes.servicos}
                  onChange={() => alterarPermissao('servicos')}
                />
                Serviços
              </label>

              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={permissoes.profissionais}
                  onChange={() => alterarPermissao('profissionais')}
                />
                Profissionais
              </label>

              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={permissoes.promocoes}
                  onChange={() => alterarPermissao('promocoes')}
                />
                Promoções
              </label>

              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={permissoes.configuracoes}
                  onChange={() => alterarPermissao('configuracoes')}
                />
                Configurações
              </label>

              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={permissoes.visualizarFinanceiro}
                  onChange={() => alterarPermissao('visualizarFinanceiro')}
                />
                Visualizar valores financeiros
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={salvarUsuario}
            disabled={salvandoUsuario}
            style={{
              ...primaryButton,
              opacity: salvandoUsuario ? 0.7 : 1,
              cursor: salvandoUsuario ? 'not-allowed' : 'pointer',
            }}
          >
            {salvandoUsuario
              ? 'Salvando usuário...'
              : usuarioEditandoId
                ? 'Atualizar usuário'
                : 'Salvar usuário'}
          </button>
        </section>
      )}

      <section style={cardWide}>
        <h2 style={cardTitle}>Usuários cadastrados</h2>
        <p style={cardDescription}>Gerencie login, senha, status e permissões.</p>

        <div style={usersList}>
          {usuarios.length === 0 ? (
            <div style={emptyBox}>Nenhum usuário cadastrado ainda.</div>
          ) : (
            usuarios.map((usuario) => (
              <div key={usuario.id} style={userRow}>
                <div>
                  <strong>{usuario.nome}</strong>
                  <p style={userText}>Login: {usuario.email}</p>
                  <p style={userText}>
                    Perfil: {usuario.perfil || 'usuario'} •{' '}
                    {usuario.ativo === false ? 'Inativo' : 'Ativo'}
                  </p>
                </div>

                <button type="button" onClick={() => editarUsuario(usuario)} style={editButton}>
                  Editar
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

const page = {
  minHeight: '100vh',
  background: '#f4f6fb',
  padding: '32px',
};

const header = {
  background: 'linear-gradient(135deg, #111827, #312e81)',
  color: '#fff',
  padding: '32px',
  borderRadius: '24px',
  marginBottom: '28px',
};

const headerTop = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '20px',
};

const backButton = {
  padding: '11px 16px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.25)',
  background: 'rgba(255,255,255,0.12)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const eyebrow = {
  fontSize: '13px',
  opacity: 0.75,
  marginBottom: '8px',
};

const title = {
  fontSize: '34px',
  fontWeight: 800,
  margin: 0,
};

const subtitle = {
  fontSize: '15px',
  opacity: 0.85,
  marginTop: '10px',
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '24px',
};

const card = {
  background: '#fff',
  padding: '26px',
  borderRadius: '22px',
  boxShadow: '0 12px 35px rgba(15, 23, 42, 0.08)',
  border: '1px solid #eef2ff',
};

const cardWide = {
  ...card,
  marginTop: '24px',
};

const cardHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  marginBottom: '22px',
};

const cardTitle = {
  fontSize: '21px',
  fontWeight: 800,
  margin: 0,
};

const cardDescription = {
  fontSize: '14px',
  color: '#64748b',
  marginTop: '6px',
};

const badge = {
  height: 'fit-content',
  background: '#eef2ff',
  color: '#4f46e5',
  padding: '7px 12px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 700,
};

const checkboxRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '14px',
  color: '#334155',
  marginBottom: '12px',
};

const field = {
  marginBottom: '18px',
};

const label = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 700,
  color: '#475569',
  marginBottom: '8px',
};

const input = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
};

const select = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  background: '#fff',
};

const primaryButton = {
  width: '100%',
  padding: '13px',
  borderRadius: '14px',
  border: 'none',
  background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const smallButton = {
  padding: '10px 14px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#334155',
  fontWeight: 800,
  cursor: 'pointer',
};

const permissionGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '16px',
  marginBottom: '22px',
};

const permissionItem = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '18px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '8px',
  color: '#475569',
  fontSize: '14px',
};

const formGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '18px',
};

const permissionsBox = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '10px',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '18px',
  marginBottom: '20px',
};

const usersList = {
  marginTop: '18px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '12px',
};

const emptyBox = {
  padding: '18px',
  borderRadius: '14px',
  background: '#f8fafc',
  border: '1px dashed #cbd5e1',
  color: '#64748b',
};

const userRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
  borderRadius: '14px',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
};

const userText = {
  fontSize: '13px',
  color: '#64748b',
  margin: '4px 0 0 0',
};

const editButton = {
  padding: '10px 14px',
  borderRadius: '10px',
  border: 'none',
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};