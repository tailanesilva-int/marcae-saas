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
  comissoes: boolean;
  visualizarFinanceiro: boolean;
  finalizarAtendimento: boolean;
  reagendarAtendimento: boolean;
  cancelarAtendimento: boolean;
  fecharComissao: boolean;
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
  comissoes: false,
  visualizarFinanceiro: false,
  finalizarAtendimento: false,
  reagendarAtendimento: false,
  cancelarAtendimento: false,
  fecharComissao: false,
};

export default function ConfiguracoesPage() {
  const router = useRouter();

  const [empresaId, setEmpresaId] = useState('');
  const [recorrente, setRecorrente] = useState(false);
  const [tipoCobranca, setTipoCobranca] = useState('cartao');
  const [salvando, setSalvando] = useState(false);
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false);

  const [dadosEmpresa, setDadosEmpresa] = useState({
  nome: '',

  endereco: {
    rua: '',
    numero: '',
    cidade: '',
    estado: '',
    complemento: '',
  },
  telefone: '',
  responsavel: '',
  logoUrl: '',
  instagramUrl: '',
  /*
  =========================================
  MERCADO PAGO
  =========================================
  */

  mercadoPagoAtivo: false,
  mercadoPagoAccessToken: '',
  mercadoPagoPublicKey: '',
  mercadoPagoModo: 'sandbox',
});

  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);

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

  const id = empresaIdLocal || empresaLogada?.id || '';

  setEmpresaId(id);

  if (empresaLogada) {
    setDadosEmpresa({
      nome: empresaLogada.nome || '',
      endereco:
  typeof empresaLogada.endereco === 'string'
    ? (() => {
        try {
          return JSON.parse(empresaLogada.endereco);
        } catch {
          return {
            rua: '',
            numero: '',
            cidade: '',
            estado: '',
            complemento: '',
          };
        }
      })()
    : empresaLogada.endereco || {
        rua: '',
        numero: '',
        cidade: '',
        estado: '',
        complemento: '',
      },
      telefone: empresaLogada.telefone || empresaLogada.whatsapp || '',
      responsavel: empresaLogada.responsavel || '',
      logoUrl: empresaLogada.logoUrl || '',
      instagramUrl: empresaLogada.instagramUrl || '',

      mercadoPagoAtivo:
        empresaLogada.mercadoPagoAtivo || false,

      mercadoPagoAccessToken:
        empresaLogada.mercadoPagoAccessToken || '',

      mercadoPagoPublicKey:
        empresaLogada.mercadoPagoPublicKey || '',

      mercadoPagoModo:
        empresaLogada.mercadoPagoModo || 'sandbox',
    });
  }
}, []);

  useEffect(() => {
    if (empresaId) {
      carregarEmpresa();
      carregarUsuarios();
    }
  }, [empresaId]);

  async function carregarEmpresa() {
    try {
      const res = await fetch(`/api/admin/empresas/${empresaId}`, {
        cache: 'no-store',
      });

      const data = await res.json();

      if (data.success && data.empresa) {
        setDadosEmpresa({
  nome: data.empresa.nome || '',
  endereco: data.empresa.endereco || '',
  telefone: data.empresa.telefone || data.empresa.whatsapp || '',
  responsavel: data.empresa.responsavel || '',
  logoUrl: data.empresa.logoUrl || '',
  instagramUrl: data.empresa.instagramUrl || '',

  mercadoPagoAtivo:
    data.empresa.mercadoPagoAtivo || false,

  mercadoPagoAccessToken:
    data.empresa.mercadoPagoAccessToken || '',

  mercadoPagoPublicKey:
    data.empresa.mercadoPagoPublicKey || '',

  mercadoPagoModo:
    data.empresa.mercadoPagoModo || 'sandbox',
});

        localStorage.setItem('empresaLogada', JSON.stringify(data.empresa));
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    }
  }

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

  function selecionarLogo(arquivo?: File | null) {
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setDadosEmpresa((atual) => ({
        ...atual,
        logoUrl: String(reader.result || ''),
      }));
    };

    reader.readAsDataURL(arquivo);
  }

  async function salvarDadosEmpresa() {
    if (!empresaId) {
      alert('Empresa não encontrada. Faça login novamente.');
      return;
    }

    if (!dadosEmpresa.nome) {
      alert('Informe o nome da empresa.');
      return;
    }

    try {
      setSalvandoEmpresa(true);

      const res = await fetch(`/api/admin/empresas/${empresaId}/dados`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosEmpresa),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao salvar dados da empresa.');
        return;
      }

      localStorage.setItem('empresaLogada', JSON.stringify(data.empresa));

      alert('Dados da empresa atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error);
      alert('Erro ao salvar dados da empresa.');
    } finally {
      setSalvandoEmpresa(false);
    }
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
              Gerencie dados da empresa, logo, cobranças, usuários e permissões de acesso do Marcaê.
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

      <section style={cardWideSemMargem}>
        <div style={cardHeader}>
          <div>
            <h2 style={cardTitle}>Dados da empresa</h2>
            <p style={cardDescription}>
              Esses dados aparecem no agendador público, QR Code e mensagens enviadas pelo WhatsApp.
            </p>
          </div>

          <span style={badge}>Empresa</span>
        </div>

        <div style={empresaGrid}>
          <div style={field}>
            <label style={label}>Nome</label>
            <input
              value={dadosEmpresa.nome}
              onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, nome: e.target.value })}
              placeholder="Nome da empresa"
              style={input}
            />
          </div>

          <div style={field}>
            <label style={label}>Telefone/WhatsApp</label>
            <input
              value={dadosEmpresa.telefone}
              onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, telefone: e.target.value })}
              placeholder="Telefone da empresa"
              style={input}
            />
          </div>

          <div style={field}>
            <label style={label}>Responsável</label>
<div style={field}>
  <label style={label}>Instagram da empresa</label>

  <input
    value={dadosEmpresa.instagramUrl}
    onChange={(e) =>
      setDadosEmpresa({
        ...dadosEmpresa,
        instagramUrl: e.target.value,
      })
    }
    placeholder="@meuestudio ou link do Instagram"
    style={input}
  />
</div>
            <input
              value={dadosEmpresa.responsavel}
              onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, responsavel: e.target.value })}
              placeholder="Responsável pela empresa"
              style={input}
            />
          </div>

          <div style={field}>
            <label style={label}>Logo da empresa</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => selecionarLogo(e.target.files?.[0])}
              style={input}
            />
          </div>

          <div style={{ ...field, gridColumn: '1 / -1' }}>
            <div style={{ ...field, gridColumn: '1 / -1' }}>
  <label style={label}>Rua</label>

  <input
    value={dadosEmpresa.endereco?.rua || ''}
    onChange={(e) =>
      setDadosEmpresa({
        ...dadosEmpresa,
        endereco: {
          ...dadosEmpresa.endereco,
          rua: e.target.value,
        },
      })
    }
    placeholder="Rua da empresa"
    style={input}
  />
</div>

<div style={field}>
  <label style={label}>Número</label>

  <input
    value={dadosEmpresa.endereco?.numero || ''}
    onChange={(e) =>
      setDadosEmpresa({
        ...dadosEmpresa,
        endereco: {
          ...dadosEmpresa.endereco,
          numero: e.target.value,
        },
      })
    }
    placeholder="Número"
    style={input}
  />
</div>

<div style={field}>
  <label style={label}>Cidade</label>

  <input
    value={dadosEmpresa.endereco?.cidade || ''}
    onChange={(e) =>
      setDadosEmpresa({
        ...dadosEmpresa,
        endereco: {
          ...dadosEmpresa.endereco,
          cidade: e.target.value,
        },
      })
    }
    placeholder="Cidade"
    style={input}
  />
</div>

<div style={field}>
  <label style={label}>Estado</label>

  <input
    value={dadosEmpresa.endereco?.estado || ''}
    onChange={(e) =>
      setDadosEmpresa({
        ...dadosEmpresa,
        endereco: {
          ...dadosEmpresa.endereco,
          estado: e.target.value,
        },
      })
    }
    placeholder="Estado"
    style={input}
  />
</div>

<div style={field}>
  <label style={label}>Complemento</label>

  <input
    value={dadosEmpresa.endereco?.complemento || ''}
    onChange={(e) =>
      setDadosEmpresa({
        ...dadosEmpresa,
        endereco: {
          ...dadosEmpresa.endereco,
          complemento: e.target.value,
        },
      })
    }
    placeholder="Complemento"
    style={input}
  />
</div>
              onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, endereco: e.target.value })}
              placeholder="Endereço da empresa"
              style={input}
            />
          </div>
        </div>

        <div style={logoPreviewBox}>
          {dadosEmpresa.logoUrl ? (
            <img src={dadosEmpresa.logoUrl} alt="Logo da empresa" style={logoPreview} />
          ) : (
            <div style={logoVazio}>Sem logo cadastrada</div>
          )}

          <div>
            <strong>Logo no agendador</strong>
            <p style={cardDescription}>
              Essa imagem será usada como identidade visual da empresa no link público de agendamento.
            </p>
          </div>
        </div>

        <button
          onClick={salvarDadosEmpresa}
          disabled={salvandoEmpresa}
          style={{
            ...primaryButton,
            opacity: salvandoEmpresa ? 0.7 : 1,
            cursor: salvandoEmpresa ? 'not-allowed' : 'pointer',
          }}
        >
          {salvandoEmpresa ? 'Salvando dados...' : 'Salvar dados da empresa'}
        </button>
      </section>

      <div style={grid}>
        <section style={card}>
  <div style={cardHeader}>
    <div>
      <section style={card}>
  <div style={cardHeader}>
    <div>
      <h2 style={cardTitle}>
        Recebimento online
      </h2>

      <p style={cardDescription}>
        Integração financeira via
        Mercado Pago.
      </p>
    </div>

    <span style={badge}>
      Mercado Pago
    </span>
  </div>

  {dadosEmpresa.mercadoPagoAtivo ? (
    <div
      style={{
        background: '#ecfdf5',
        border: '1px solid #10b981',
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#065f46',
          marginBottom: 10,
        }}
      >
        Mercado Pago configurado
      </div>

      <div
        style={{
          color: '#065f46',
          fontSize: 14,
        }}
      >
        Sua empresa já pode receber
        pagamentos online dos clientes.
      </div>
    </div>
  ) : (
    <div
      style={{
        background: '#fff7ed',
        border: '1px solid #fb923c',
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#9a3412',
          marginBottom: 10,
        }}
      >
        Integração Mercado Pago pendente
      </div>

      <div
        style={{
          color: '#9a3412',
          fontSize: 14,
          marginBottom: 18,
        }}
      >
        O recebimento online ainda
        não foi configurado pelo
        Marcaê.
      </div>

      <button
        style={primaryButton}
        onClick={async () => {
          try {
            await fetch(
              `/api/admin/empresas/${empresaId}/dados`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type':
                    'application/json',
                },
                body: JSON.stringify({
                  solicitouIntegracaoMp: true,
                }),
              }
            );

            alert(
              'Solicitação enviada ao Marcaê.'
            );

            carregarEmpresa();
          } catch (error) {
            alert(
              'Erro ao solicitar integração.'
            );
          }
        }}
      >
        Solicitar integração Mercado Pago
      </button>
    </div>
  )}
</section>

      <p style={cardDescription}>
        Configure como sua empresa receberá os pagamentos online dos clientes via Mercado Pago.
      </p>
    </div>

    <span style={badge}>Mercado Pago</span>
  </div>

</section>

        <section style={card}>
          <div style={cardHeader}>
            <div>
              <h2 style={cardTitle}>Usuários e permissões</h2>
              <p style={cardDescription}>
                Cadastre usuários e controle o acesso aos módulos e ações sensíveis.
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
              <PermissaoCheck label="Dashboard" checked={permissoes.dashboard} onChange={() => alterarPermissao('dashboard')} />
              <PermissaoCheck label="Agenda" checked={permissoes.agenda} onChange={() => alterarPermissao('agenda')} />
              <PermissaoCheck label="Serviços" checked={permissoes.servicos} onChange={() => alterarPermissao('servicos')} />
              <PermissaoCheck label="Profissionais" checked={permissoes.profissionais} onChange={() => alterarPermissao('profissionais')} />
              <PermissaoCheck label="Promoções" checked={permissoes.promocoes} onChange={() => alterarPermissao('promocoes')} />
              <PermissaoCheck label="Configurações" checked={permissoes.configuracoes} onChange={() => alterarPermissao('configuracoes')} />
              <PermissaoCheck label="Comissões" checked={permissoes.comissoes} onChange={() => alterarPermissao('comissoes')} />
              <PermissaoCheck label="Visualizar valores financeiros" checked={permissoes.visualizarFinanceiro} onChange={() => alterarPermissao('visualizarFinanceiro')} />
              <PermissaoCheck label="Finalizar atendimento/venda" checked={permissoes.finalizarAtendimento} onChange={() => alterarPermissao('finalizarAtendimento')} />
              <PermissaoCheck label="Reagendar atendimento" checked={permissoes.reagendarAtendimento} onChange={() => alterarPermissao('reagendarAtendimento')} />
              <PermissaoCheck label="Cancelar atendimento" checked={permissoes.cancelarAtendimento} onChange={() => alterarPermissao('cancelarAtendimento')} />
              <PermissaoCheck label="Fechar comissão" checked={permissoes.fecharComissao} onChange={() => alterarPermissao('fecharComissao')} />
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

function PermissaoCheck({ label, checked, onChange }: any) {
  return (
    <label style={checkboxRow}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
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

const cardWideSemMargem = {
  ...card,
  marginBottom: '24px',
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
  boxSizing: 'border-box' as const,
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

const empresaGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
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

const logoPreviewBox = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 16,
  marginBottom: 18,
};

const logoPreview = {
  width: 72,
  height: 72,
  borderRadius: 18,
  objectFit: 'cover' as const,
  background: '#fff',
  border: '1px solid #e2e8f0',
};

const logoVazio = {
  width: 72,
  height: 72,
  borderRadius: 18,
  background: '#eef2ff',
  color: '#4f46e5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center' as const,
  fontSize: 11,
  fontWeight: 800,
  border: '1px solid #c7d2fe',
};
