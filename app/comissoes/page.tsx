'use client';

import { useEffect, useState } from 'react';

export default function ComissoesPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [mostrarFinanceiro, setMostrarFinanceiro] = useState(false);
const [fechandoComissao, setFechandoComissao] = useState(false);
const [modalFechamento, setModalFechamento] = useState<any>(null);
const [observacaoFechamento, setObservacaoFechamento] = useState('');

  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [dataInicio, setDataInicio] = useState(
    primeiroDiaMes.toISOString().slice(0, 10)
  );
  const [dataFim, setDataFim] = useState(hoje.toISOString().slice(0, 10));

  useEffect(() => {
  async function iniciar() {
    const empresaStorage =
      localStorage.getItem(
        'empresaLogada'
      );

    const usuarioStorage =
      localStorage.getItem(
        'usuarioEmpresa'
      );

    if (
      !empresaStorage ||
      !usuarioStorage
    ) {
      window.location.href = '/login';
      return;
    }

    const emp = JSON.parse(
      empresaStorage
    );

    const user = JSON.parse(
      usuarioStorage
    );

    setEmpresa(emp);
    setUsuario(user);

    const periodo =
      await carregarPeriodoAutomatico(
        emp.id
      );

    if (periodo) {
      setDataInicio(
        periodo.dataInicio
      );

      setDataFim(periodo.dataFim);

      await carregar(
        emp.id,
        periodo.dataInicio,
        periodo.dataFim
      );

      return;
    }

    await carregar(
      emp.id,
      dataInicio,
      dataFim
    );
  }

  iniciar();
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
    if (usuario.permissoes?.financeiro === true) return true;

    return false;
  }

  function usuarioPodeFecharComissao() {
    if (!usuario) return false;
    if (usuario.acessoTotal === true) return true;
    if (usuario.perfil === 'admin') return true;

    return usuario.permissoes?.fecharComissao === true;
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

  function textoComissaoProfissional(profissional: any) {
  const tipo = profissional.tipoComissao;
  const valor = Number(profissional.valorComissaoConfigurado || 0);

  if (!tipo || valor <= 0) {
    return 'Comissão conforme serviços executados';
  }

  if (tipo === 'percentual') {
    return `Comissão padrão: ${valor}%`;
  }

  if (tipo === 'fixo') {
    return `Comissão padrão: ${dinheiro(valor)}`;
  }

  return 'Comissão configurada por serviço';
}

function corProfissional(index: number) {
  const cores = [
    { fundo: '#eef2ff', borda: '#6366f1', texto: '#3730a3' },
    { fundo: '#ecfdf5', borda: '#16a34a', texto: '#166534' },
    { fundo: '#fff7ed', borda: '#f97316', texto: '#9a3412' },
    { fundo: '#fdf2f8', borda: '#db2777', texto: '#9d174d' },
    { fundo: '#f0f9ff', borda: '#0284c7', texto: '#075985' },
  ];

  return cores[index % cores.length];
}

function valorComissaoServico(servico: any) {
  return Number(servico.valorComissao || servico.comissaoCalculada || 0);
}

  function formatarData(data: string) {
  if (!data) return '-';

  if (String(data).includes('-') && String(data).length === 10) {
    const [ano, mes, dia] = String(data).split('-');
    return `${dia}/${mes}/${ano}`;
  }

  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

async function carregarPeriodoAutomatico(
  empresaId: string
) {
  try {
    const res = await fetch(
      `/api/comissoes/periodo-aberto?empresaId=${empresaId}`,
      {
        cache: 'no-store',
      }
    );

    const data = await res.json();

    if (!data.success) return null;

    return {
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
    };
  } catch (error) {
    console.error(
      'Erro ao buscar período automático:',
      error
    );

    return null;
  }
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

async function fecharComissao(profissional: any) {
  if (!empresa?.id) return;

  if (!usuarioPodeFecharComissao()) {
    alert('Você não tem permissão para fechar comissão.');
    return;
  }

  const confirmar = window.confirm(
    `Deseja fechar as comissões pendentes de ${profissional.profissionalNome} no período selecionado?`
  );

  if (!confirmar) return;

  try {
    setFechandoComissao(true);

    const res = await fetch('/api/comissoes/fechar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresaId: empresa.id,
        profissionalId: profissional.profissionalId,
        dataInicio,
        dataFim,
        observacao: observacaoFechamento,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error || 'Erro ao fechar comissão.');
      return;
    }

    alert(data.message || 'Comissão fechada com sucesso.');

    setModalFechamento(null);
    setObservacaoFechamento('');

    await carregar(empresa.id, dataInicio, dataFim);
  } catch (error) {
    alert('Erro ao fechar comissão.');
  } finally {
    setFechandoComissao(false);
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
        <header style={headerPremium}>
  <div style={headerConteudo}>
    <div style={logoHeader}>
      {empresa?.logoUrl || empresa?.logo || empresa?.imagemUrl ? (
        <img
          src={empresa.logoUrl || empresa.logo || empresa.imagemUrl}
          alt={empresa.nome}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span>{empresa?.nome?.charAt(0)?.toUpperCase() || 'M'}</span>
      )}
    </div>

    <div>
      <span style={badgeBoasVindas}>
        Financeiro e repasses
      </span>

      <h1 style={tituloHeader}>Comissões</h1>

      <p style={subtituloHeader}>
        Acompanhe comissões por profissional, período e serviços realizados.
      </p>

      <div style={linhaBadgesHeader}>
        <span style={badgeEmpresa}>🏢 {empresa?.nome || 'Meu Estúdio'}</span>
        <span style={badgeModulo}>💰 Gestão financeira</span>
        <span style={badgeStatus}>✅ Ativo</span>
      </div>
    </div>
  </div>

  <div style={acoesHeader}>
    <button onClick={alternarFinanceiro} style={botaoHeaderClaro}>
      {mostrarFinanceiro ? '🙈 Ocultar valores' : '👁 Ver valores'}
    </button>

    <a href="/admin">
      <button style={botaoHeaderClaro}>Admin</button>
    </a>

    <a href="/dashboard">
      <button style={botaoHeaderRoxo}>Dashboard</button>
    </a>
  </div>
</header>

<a href="/comissoes/fechamentos">
  <button
  style={{
    ...botaoSecundario,
    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
    color: '#fff',
    border: 'none',
    fontWeight: 800,
  }}
>
  Ver fechamentos
</button>
</a>

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
  {profissionais.map((profissional, index) => {
    const cor = corProfissional(index);

    return (
      <div
        key={profissional.profissionalId}
        style={{
          ...profissionalBox,
          borderLeft: `6px solid ${cor.borda}`,
          background: cor.fundo,
        }}
      >
        <div style={profissionalHeader}>
          <div>
            <h3 style={{ margin: 0, color: cor.texto }}>
              {profissional.profissionalNome}
            </h3>

            <p style={{ margin: '6px 0 0', color: cor.texto, fontWeight: 800 }}>
              {textoComissaoProfissional(profissional)}
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

{Number(profissional.totalPendente || 0) > 0 && (
  <button
    onClick={() => setModalFechamento(profissional)}
    style={botaoFecharComissao}
  >
    Fechar comissão pendente
  </button>
)}

        <div style={{ marginTop: 16 }}>
          <h4>Serviços realizados</h4>

          <div style={{ display: 'grid', gap: 10 }}>
            {profissional.servicos.map((servico: any) => (
              <div key={servico.comissaoId || servico.agendamentoId} style={linhaServico}>
                <div>
                  <strong>{servico.servico}</strong>
                  <p style={textoPequeno}>
                    {formatarData(servico.data)} · {servico.cliente}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong>{valorFinanceiro(servico.valorServico)}</strong>
                  <p style={textoPequeno}>
                    Comissão: {valorFinanceiro(valorComissaoServico(servico))}
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
    );
  })}
</div>
        </section>
      </div>

{modalFechamento && (
  <div style={modalOverlay}>
    <div style={modalBox}>
      <h2 style={{ marginTop: 0 }}>
        Fechar comissão
      </h2>

      <p style={{ color: '#64748b' }}>
        Profissional:{' '}
        <strong>
          {modalFechamento.profissionalNome}
        </strong>
      </p>

      <div style={resumoFechamento}>
        <Resumo
          titulo="Pendente"
          valor={valorFinanceiro(
            modalFechamento.totalPendente
          )}
        />

        <Resumo
          titulo="Período"
          valor={`${formatarData(
            dataInicio
          )} até ${formatarData(dataFim)}`}
        />
      </div>

      <label style={campo}>
        Observação do repasse

        <textarea
          value={observacaoFechamento}
          onChange={(e) =>
            setObservacaoFechamento(
              e.target.value
            )
          }
          placeholder="Ex: Comissão paga via Pix."
          style={textarea}
        />
      </label>

      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: 16,
        }}
      >
        <button
          onClick={() => {
            setModalFechamento(null);
            setObservacaoFechamento('');
          }}
          style={botaoCancelar}
        >
          Cancelar
        </button>

        <button
          onClick={() =>
            fecharComissao(
              modalFechamento
            )
          }
          disabled={fechandoComissao}
          style={botaoConfirmar}
        >
          {fechandoComissao
            ? 'Fechando...'
            : 'Confirmar fechamento'}
        </button>
      </div>
    </div>
  </div>
)}

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

const botaoFecharComissao = {
  width: '100%',
  marginTop: 16,
  padding: 13,
  borderRadius: 12,
  border: 'none',
  background:
    'linear-gradient(135deg, #16a34a, #22c55e)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const modalOverlay = {
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(15,23,42,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  zIndex: 999,
};

const modalBox = {
  width: '100%',
  maxWidth: 520,
  background: '#fff',
  borderRadius: 22,
  padding: 24,
  boxShadow:
    '0 30px 80px rgba(15,23,42,0.25)',
};

const resumoFechamento = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  margin: '16px 0',
};

const textarea = {
  width: '100%',
  minHeight: 90,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  padding: 12,
  marginTop: 8,
};

const botaoCancelar = {
  flex: 1,
  padding: 13,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const botaoConfirmar = {
  flex: 1,
  padding: 13,
  borderRadius: 12,
  border: 'none',
  background: '#16a34a',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const headerPremium = {
  background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
  color: '#fff',
  borderRadius: 28,
  padding: 34,
  marginBottom: 24,
  boxShadow: '0 20px 40px rgba(79,70,229,0.24)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 24,
  flexWrap: 'wrap' as const,
};

const headerConteudo = {
  display: 'flex',
  alignItems: 'center',
  gap: 20,
};

const logoHeader = {
  width: 82,
  height: 82,
  borderRadius: 24,
  overflow: 'hidden',
  background: 'rgba(255,255,255,0.14)',
  border: '2px solid rgba(255,255,255,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 32,
  fontWeight: 900,
  color: '#fff',
};

const badgeBoasVindas = {
  display: 'inline-block',
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 10,
};

const tituloHeader = {
  margin: 0,
  fontSize: 38,
  fontWeight: 950,
  color: '#fff',
  lineHeight: 1,
};

const subtituloHeader = {
  margin: '10px 0 0',
  color: 'rgba(255,255,255,0.84)',
  fontSize: 15,
  fontWeight: 600,
};

const linhaBadgesHeader = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap' as const,
  marginTop: 16,
};

const badgeEmpresa = {
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  padding: '8px 13px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const badgeModulo = {
  background: '#cffafe',
  color: '#0891b2',
  padding: '8px 13px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const badgeStatus = {
  background: '#22c55e',
  color: '#fff',
  padding: '8px 13px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const acoesHeader = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap' as const,
};

const botaoHeaderClaro = {
  padding: '13px 18px',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const botaoHeaderRoxo = {
  padding: '13px 18px',
  borderRadius: 14,
  border: 'none',
  background: '#fff',
  color: '#6d28d9',
  fontWeight: 900,
  cursor: 'pointer',
};