'use client';

import { useEffect, useState } from 'react';

export default function FechamentosComissaoPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [fechamentos, setFechamentos] = useState<any[]>([]);
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

  function podeVerFinanceiro(user: any) {
    if (!user) return false;
    if (user.acessoTotal === true) return true;
    if (user.perfil === 'admin') return true;
    if (user.permissoes?.visualizarFinanceiro === true) return true;
    return false;
  }

  function alternarFinanceiro() {
    if (!podeVerFinanceiro(usuario)) {
      alert(
        'Usuário sem permissão para visualizar valores financeiros. Solicite acesso a um administrador.'
      );
      return;
    }

    setMostrarFinanceiro(!mostrarFinanceiro);
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

  function formatarDataHora(data: string) {
    if (!data) return '-';

    return new Date(data).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  async function carregar(empresaId: string, inicio: string, fim: string) {
    try {
      setCarregando(true);

      const res = await fetch(
        `/api/comissoes/fechamentos?empresaId=${empresaId}&dataInicio=${inicio}&dataFim=${fim}`,
        { cache: 'no-store' }
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao carregar fechamentos.');
        return;
      }

      setFechamentos(data.fechamentos || []);
    } catch (error) {
      alert('Erro ao carregar fechamentos.');
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

  const totalPago = fechamentos.reduce(
    (total, item) => total + Number(item.valorPago || 0),
    0
  );

  const totalFechamentos = fechamentos.length;

  const profissionais = new Set(
    fechamentos.map((item) => item.profissionalId)
  ).size;

  return (
    <main style={page}>
      <div style={container}>
        <header style={header}>
          <div>
            <h1 style={{ margin: 0 }}>Fechamentos de comissão</h1>
            <p style={{ marginTop: 6, color: '#475569' }}>
              Consulte os repasses já realizados por profissional e período.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={alternarFinanceiro} style={botaoSecundario}>
              {mostrarFinanceiro ? '🙈 Ocultar valores' : '👁 Ver valores'}
            </button>

            <a href="/comissoes">
              <button style={botaoSecundario}>Comissões</button>
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
          <Card titulo="Total repassado" valor={valorFinanceiro(totalPago)} />
          <Card titulo="Fechamentos" valor={totalFechamentos} />
          <Card titulo="Profissionais pagos" valor={profissionais} />
          <Card titulo="Período" valor={`${formatarData(dataInicio)} até ${formatarData(dataFim)}`} />
        </section>

        <section style={box}>
          <h2 style={{ marginTop: 0 }}>Histórico de fechamentos</h2>

          {carregando && <p>Carregando fechamentos...</p>}

          {!carregando && fechamentos.length === 0 && (
            <div style={emptyBox}>
              Nenhum fechamento encontrado no período selecionado.
            </div>
          )}

          <div style={{ display: 'grid', gap: 14 }}>
            {fechamentos.map((fechamento) => (
              <div key={fechamento.id} style={fechamentoCard}>
                <div>
                  <strong style={{ fontSize: 18 }}>
                    {fechamento.profissional?.nome ||
                      fechamento.profissionalNome ||
                      'Profissional não informado'}
                  </strong>

                  <p style={textoPequeno}>
                    Período:{' '}
                    <strong>
                      {formatarData(String(fechamento.dataInicio).slice(0, 10))} até{' '}
                      {formatarData(String(fechamento.dataFim).slice(0, 10))}
                    </strong>
                  </p>

                  <p style={textoPequeno}>
                    Pago em: {formatarDataHora(fechamento.createdAt)}
                  </p>

                  {fechamento.observacao && (
                    <p style={observacaoBox}>
                      {fechamento.observacao}
                    </p>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: 24, color: '#16a34a' }}>
                    {valorFinanceiro(fechamento.valorPago)}
                  </strong>

                  <p style={badgePago}>Repasse pago</p>

                  <p style={textoPequeno}>
                    {fechamento.totalComissoes || fechamento.comissoes?.length || 0}{' '}
                    comissões
                  </p>
                </div>
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

const fechamentoCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderLeft: '6px solid #f97316',
  borderRadius: 18,
  padding: 18,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
};

const textoPequeno = {
  margin: '6px 0 0',
  color: '#64748b',
  fontSize: 13,
};

const observacaoBox = {
  marginTop: 10,
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 10,
  color: '#475569',
  fontSize: 13,
};

const badgePago = {
  display: 'inline-flex',
  margin: '8px 0 0',
  background: '#dcfce7',
  color: '#166534',
  border: '1px solid #bbf7d0',
  borderRadius: 999,
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: 900,
};

const emptyBox = {
  background: '#f8fafc',
  border: '1px dashed #cbd5e1',
  color: '#64748b',
  borderRadius: 14,
  padding: 18,
  textAlign: 'center' as const,
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