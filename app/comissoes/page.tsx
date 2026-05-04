'use client';

import { useEffect, useState } from 'react';

export default function ComissoesPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [mostrarFinanceiro, setMostrarFinanceiro] = useState(false);

  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [dataInicio, setDataInicio] = useState(
    primeiroDiaMes.toISOString().slice(0, 10)
  );
  const [dataFim, setDataFim] = useState(hoje.toISOString().slice(0, 10));

  useEffect(() => {
    const empresaStorage = localStorage.getItem('empresaLogada');
    const usuarioStorage = localStorage.getItem('usuarioEmpresa');

    if (!empresaStorage || !usuarioStorage) {
      window.location.href = '/login';
      return;
    }

    const emp = JSON.parse(empresaStorage);
    const user = JSON.parse(usuarioStorage);

    setEmpresa(emp);
    setUsuario(user);

    carregar(emp.id, dataInicio, dataFim);
  }, []);

  function podeAcessarComissoes(user: any) {
    if (!user) return false;
    if (user.acessoTotal === true) return true;
    if (user.perfil === 'admin') return true;
    return user.permissoes?.comissoes === true;
  }

  function usuarioPodeVerFinanceiro() {
    if (!usuario) return false;
    if (usuario.acessoTotal === true) return true;
    if (usuario.perfil === 'admin') return true;
    if (usuario.permissoes?.visualizarFinanceiro === true) return true;

    return false;
  }

  function alternarFinanceiro() {
    if (usuarioPodeVerFinanceiro()) {
      setMostrarFinanceiro(!mostrarFinanceiro);
      return;
    }

    alert(
      'Usuário sem permissão para visualizar valores financeiros. Solicite acesso a um administrador.'
    );
  }

  function dinheiro(valor: number) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function valorFinanceiro(valor: number) {
    if (!mostrarFinanceiro) return '••••••';
    return dinheiro(valor);
  }

  function formatarData(data: string) {
    if (!data) return '-';

    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  async function carregar(empresaId: string, inicio: string, fim: string) {
    try {
      setCarregando(true);

      const res = await fetch(
        `/api/comissoes?empresaId=${empresaId}&dataInicio=${inicio}&dataFim=${fim}`
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao carregar comissões.');
        return;
      }

      setProfissionais(data.profissionais || []);
    } catch (error) {
      console.error('Erro ao carregar comissões:', error);
      alert('Erro ao carregar comissões.');
    } finally {
      setCarregando(false);
    }
  }

  function filtrar() {
    if (!empresa?.id) return;
    carregar(empresa.id, dataInicio, dataFim);
  }

  if (!empresa || !usuario) {
    return <p style={{ padding: 40 }}>Carregando...</p>;
  }

  if (!podeAcessarComissoes(usuario)) {
    return (
      <main style={page}>
        <div style={container}>
          <section style={box}>
            <h1>Acesso bloqueado</h1>
            <p style={{ color: '#64748b' }}>
              Você não tem permissão para acessar o módulo de comissões.
            </p>

            <a href="/admin">
              <button style={botaoPrincipal}>Voltar para o painel</button>
            </a>
          </section>
        </div>
      </main>
    );
  }

  const totalFaturado = profissionais.reduce(
    (total, p) => total + Number(p.totalFaturado || 0),
    0
  );

  const totalComissoes = profissionais.reduce(
    (total, p) => total + Number(p.totalComissao || 0),
    0
  );

  const totalServicos = profissionais.reduce(
    (total, p) => total + Number(p.totalServicos || 0),
    0
  );

  return (
    <main style={page}>
      <div style={container}>
        <header style={header}>
          <div>
            <h1 style={{ margin: 0 }}>Comissões</h1>
            <p style={{ marginTop: 6, color: '#475569' }}>
              Acompanhe comissões por profissional, período e serviços realizados.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={alternarFinanceiro} style={botaoSecundario}>
              {mostrarFinanceiro ? '🙈 Ocultar valores' : '👁 Ver valores'}
            </button>

            <a href="/admin">
              <button style={botaoSecundario}>Admin</button>
            </a>

            <a href="/dashboard">
              <button style={botaoSecundario}>Dashboard</button>
            </a>
          </div>
        </header>

        <section style={box}>
          <h2 style={{ marginTop: 0 }}>Filtro por período</h2>

          <div style={gridFiltro}>
            <div style={campo}>
              <label>Data inicial</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                style={input}
              />
            </div>

            <div style={campo}>
              <label>Data final</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                style={input}
              />
            </div>

            <button onClick={filtrar} style={botaoPrincipal}>
              {carregando ? 'Carregando...' : 'Filtrar'}
            </button>
          </div>
        </section>

        <section style={gridCards}>
          <Card titulo="Total faturado" valor={valorFinanceiro(totalFaturado)} />
          <Card titulo="Total comissões" valor={valorFinanceiro(totalComissoes)} />
          <Card titulo="Serviços realizados" valor={totalServicos} />
          <Card titulo="Profissionais" valor={profissionais.length} />
        </section>

        <section style={box}>
          <h2 style={{ marginTop: 0 }}>Comissões por profissional</h2>

          {carregando && <p>Carregando comissões...</p>}

          {!carregando && profissionais.length === 0 && (
            <div style={emptyBox}>
              Nenhum serviço pago encontrado no período selecionado.
            </div>
          )}

          <div style={{ display: 'grid', gap: 18 }}>
            {profissionais.map((profissional) => (
              <div key={profissional.profissionalId} style={profissionalBox}>
                <div style={profissionalHeader}>
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {profissional.profissionalNome}
                    </h3>

                    <p style={{ margin: '6px 0 0', color: '#64748b' }}>
                      {profissional.tipoComissao === 'nao_configurada' ? (
                        <span style={avisoComissao}>
                          Sem comissão configurada — clique em profissionais para definir
                        </span>
                      ) : (
                        <>
                          Comissão:{' '}
                          {profissional.tipoComissao === 'percentual'
                            ? `${profissional.valorComissao}%`
                            : dinheiro(profissional.valorComissao)}
                        </>
                      )}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: 22 }}>
                      {valorFinanceiro(profissional.totalComissao)}
                    </strong>
                    <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                      comissão total
                    </p>
                  </div>
                </div>

                <div style={miniCards}>
                  <Resumo titulo="Serviços" valor={profissional.totalServicos} />
                  <Resumo
                    titulo="Faturado"
                    valor={valorFinanceiro(profissional.totalFaturado)}
                  />
                  <Resumo
                    titulo="Comissão"
                    valor={valorFinanceiro(profissional.totalComissao)}
                  />
                </div>

                <div style={{ marginTop: 16 }}>
                  <h4>Serviços realizados</h4>

                  <div style={{ display: 'grid', gap: 10 }}>
                    {profissional.servicos.map((servico: any) => (
                      <div key={servico.agendamentoId} style={linhaServico}>
                        <div>
                          <strong>{servico.servico}</strong>
                          <p style={textoPequeno}>
                            {formatarData(servico.data)} · {servico.cliente}
                          </p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <strong>{valorFinanceiro(servico.valorServico)}</strong>
                          <p style={textoPequeno}>
                            Comissão: {valorFinanceiro(servico.comissaoCalculada)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {profissional.tipoComissao === 'nao_configurada' && (
                  <a href="/profissionais">
                    <button style={botaoAviso}>
                      Configurar comissão deste profissional
                    </button>
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ titulo, valor }: any) {
  return (
    <div style={card}>
      <div style={{ color: '#64748b', fontSize: 13 }}>{titulo}</div>
      <strong style={{ fontSize: 24 }}>{valor}</strong>
    </div>
  );
}

function Resumo({ titulo, valor }: any) {
  return (
    <div style={resumoBox}>
      <div style={{ color: '#64748b', fontSize: 13 }}>{titulo}</div>
      <strong>{valor}</strong>
    </div>
  );
}

const page = {
  minHeight: '100vh',
  background: '#f1f5f9',
  padding: 30,
};

const container = {
  maxWidth: 1100,
  margin: '0 auto',
};

const header = {
  background: '#fff',
  borderRadius: 22,
  padding: 24,
  marginBottom: 22,
  boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const box = {
  background: '#fff',
  padding: 24,
  borderRadius: 22,
  marginBottom: 22,
  boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
};

const gridFiltro = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 180px',
  gap: 14,
  alignItems: 'end',
};

const campo = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 6,
  fontWeight: 700,
};

const input = {
  padding: 12,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  outline: 'none',
};

const gridCards = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 16,
  marginBottom: 22,
};

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 18,
  boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
};

const profissionalBox = {
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 18,
  background: '#f8fafc',
};

const profissionalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'center',
};

const miniCards = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
  marginTop: 16,
};

const resumoBox = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
};

const linhaServico = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
};

const textoPequeno = {
  margin: '4px 0 0',
  color: '#64748b',
  fontSize: 13,
};

const emptyBox = {
  background: '#f8fafc',
  border: '1px dashed #cbd5e1',
  color: '#64748b',
  borderRadius: 14,
  padding: 18,
  textAlign: 'center' as const,
};

const avisoComissao = {
  color: '#b45309',
  fontWeight: 800,
};

const botaoAviso = {
  width: '100%',
  marginTop: 16,
  padding: 12,
  borderRadius: 12,
  border: '1px solid #f59e0b',
  background: '#fef3c7',
  color: '#92400e',
  fontWeight: 800,
  cursor: 'pointer',
};

const botaoPrincipal = {
  padding: '12px 18px',
  borderRadius: 12,
  border: 'none',
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const botaoSecundario = {
  padding: '12px 18px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 700,
  cursor: 'pointer',
};