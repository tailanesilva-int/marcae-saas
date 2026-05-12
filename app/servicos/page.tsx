'use client';

import { useEffect, useState } from 'react';

export default function ServicosPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [servicos, setServicos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState('');

  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    duracaoMin: 30,
    valor: '',
    custo: '',
    exigePrePagamento: false,
    valorPrePagamento: '',
  });

  useEffect(() => {
    const empresaStorage = localStorage.getItem('empresaLogada');

    if (!empresaStorage) {
      window.location.href = '/login';
      return;
    }

    const emp = JSON.parse(empresaStorage);
    setEmpresa(emp);

    carregarServicos(emp.id);
  }, []);

  async function carregarServicos(empresaId: string) {
    setCarregando(true);

    const res = await fetch(`/api/servicos?empresaId=${empresaId}`);
    const data = await res.json();

    setServicos(data.servicos || []);
    setCarregando(false);
  }

  function dinheiro(valor: any) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function limparFormulario() {
    setEditandoId('');
    setForm({
      nome: '',
      descricao: '',
      duracaoMin: 30,
      valor: '',
      custo: '',
      exigePrePagamento: false,
      valorPrePagamento: '',
    });
  }

  function iniciarEdicao(servico: any) {
    setEditandoId(servico.id);

    setForm({
      nome: servico.nome || '',
      descricao: servico.descricao || '',
      duracaoMin: servico.duracaoMin || 30,
      valor: String(servico.valor || ''),
      custo: String(servico.custo || ''),
      exigePrePagamento: servico.exigePrePagamento || false,
      valorPrePagamento: String(servico.valorPrePagamento || ''),
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  async function salvar() {
    if (!form.nome || !form.valor) {
      alert('Preencha nome e valor.');
      return;
    }

    const res = await fetch('/api/servicos', {
      method: editandoId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editandoId,
        empresaId: empresa.id,
        ...form,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Erro ao salvar serviço.');
      return;
    }

    alert(editandoId ? 'Serviço atualizado!' : 'Serviço criado!');

    await carregarServicos(empresa.id);
    limparFormulario();
  }

  if (!empresa) {
    return <p style={{ padding: 40 }}>Carregando...</p>;
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', padding: 30 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={headerPremium}>
          <div style={headerConteudo}>
            <div style={logoHeader}>
              {empresa?.logoUrl || empresa?.logo || empresa?.imagemUrl ? (
                <img
                  src={empresa.logoUrl || empresa.logo || empresa.imagemUrl}
                  alt={empresa.nome}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <span>{empresa?.nome?.charAt(0)?.toUpperCase() || 'M'}</span>
              )}
            </div>

            <div>
              <span style={badgeBoasVindas}>✂️ Gestão operacional</span>

              <h1 style={tituloHeader}>Serviços</h1>

              <p style={subtituloHeader}>
                Gerencie preços, duração, custos operacionais e pré-pagamentos.
              </p>

              <div style={linhaBadgesHeader}>
                <span style={badgeEmpresa}>
                  🏢 {empresa?.nome || 'Meu Estúdio'}
                </span>

                <span style={badgeModulo}>✂️ Operacional</span>

                <span style={badgeStatusHeader}>✅ Ativo</span>
              </div>
            </div>
          </div>

          <div style={acoesHeader}>
            <a href="/admin">
              <button style={botaoHeaderClaro}>Admin</button>
            </a>

            <a href="/dashboard">
              <button style={botaoHeaderRoxo}>Dashboard</button>
            </a>
          </div>
        </header>

        <section style={box}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <h2>{editandoId ? 'Editar serviço' : 'Novo serviço'}</h2>

            {editandoId && (
              <button onClick={limparFormulario} style={botaoSecundario}>
                Cancelar edição
              </button>
            )}
          </div>

          <div style={grid}>
            <div style={campo}>
              <label>Nome *</label>
              <input
                style={input}
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>

            <div style={campo}>
              <label>Valor *</label>
              <input
                style={input}
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                placeholder="Ex: 150,00"
              />
            </div>

            <div style={campo}>
              <label>Custo do serviço (opcional)</label>
              <input
                style={input}
                value={form.custo}
                onChange={(e) => setForm({ ...form, custo: e.target.value })}
                placeholder="Ex: 20,00"
              />
              <span style={hint}>
                Use para custo de material/produto. Esse valor entra no cálculo do lucro.
              </span>
            </div>

            <div style={campo}>
              <label>Duração (min)</label>
              <input
                type="number"
                style={input}
                value={form.duracaoMin}
                onChange={(e) =>
                  setForm({ ...form, duracaoMin: Number(e.target.value) })
                }
              />
            </div>

            <div style={{ ...campo, gridColumn: '1 / -1' }}>
              <label>Descrição</label>
              <textarea
                style={{ ...input, minHeight: 80 }}
                value={form.descricao}
                onChange={(e) =>
                  setForm({ ...form, descricao: e.target.value })
                }
              />
            </div>

            <label style={{ display: 'flex', gap: 8 }}>
              <input
                type="checkbox"
                checked={form.exigePrePagamento}
                onChange={(e) =>
                  setForm({
                    ...form,
                    exigePrePagamento: e.target.checked,
                  })
                }
              />
              Exige pré-pagamento
            </label>

            {form.exigePrePagamento && (
              <div style={campo}>
                <label>Valor pré-pago</label>
                <input
                  style={input}
                  value={form.valorPrePagamento}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      valorPrePagamento: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>

          <button onClick={salvar} style={botaoPrincipal}>
            {editandoId ? 'Atualizar serviço' : 'Salvar serviço'}
          </button>
        </section>

        <section style={box}>
          <h2>Lista de serviços</h2>

          {carregando && <p>Carregando...</p>}

          {!carregando && servicos.length === 0 && (
            <p style={{ color: '#64748b' }}>Nenhum serviço cadastrado.</p>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            {servicos.map((s) => (
              <div key={s.id} style={card}>
                <div>
                  <strong>{s.nome}</strong>

                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    {s.descricao || 'Sem descrição'}
                  </div>

                  <div style={{ marginTop: 6 }}>
                    ⏱ {s.duracaoMin} min — 💰 {dinheiro(s.valor)}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      color: '#64748b',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Custo operacional:{' '}
                    {Number(s.custo || 0) > 0
                      ? dinheiro(s.custo)
                      : 'Não informado'}
                  </div>

                  {s.exigePrePagamento && (
                    <span style={badge}>
                      Pré: {dinheiro(s.valorPrePagamento)}
                    </span>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      marginTop: 14,
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      onClick={() => iniciarEdicao(s)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#4f46e5',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ✏️ Editar serviço
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const box = {
  background: '#fff',
  padding: 24,
  borderRadius: 20,
  marginBottom: 20,
  boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
};

const grid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
  marginBottom: 20,
};

const campo = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 6,
  fontWeight: 600,
};

const input = {
  padding: 12,
  borderRadius: 10,
  border: '1px solid #cbd5e1',
};

const hint = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 500,
};

const card = {
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 16,
  background: '#f8fafc',
};

const badge = {
  display: 'inline-block',
  marginTop: 8,
  padding: '4px 8px',
  background: '#dcfce7',
  borderRadius: 999,
  fontSize: 12,
};

const botaoPrincipal = {
  padding: '12px 20px',
  borderRadius: 12,
  border: 'none',
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const botaoSecundario = {
  padding: '10px 16px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  background: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const headerPremium: React.CSSProperties = {
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
  flexWrap: 'wrap',
};

const headerConteudo: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 20,
};

const logoHeader: React.CSSProperties = {
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

const badgeBoasVindas: React.CSSProperties = {
  display: 'inline-block',
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 10,
};

const tituloHeader: React.CSSProperties = {
  margin: 0,
  fontSize: 38,
  fontWeight: 950,
  color: '#fff',
  lineHeight: 1,
};

const subtituloHeader: React.CSSProperties = {
  margin: '10px 0 0',
  color: 'rgba(255,255,255,0.84)',
  fontSize: 15,
  fontWeight: 600,
};

const linhaBadgesHeader: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 16,
};

const badgeEmpresa: React.CSSProperties = {
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  padding: '8px 13px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const badgeModulo: React.CSSProperties = {
  background: '#fef3c7',
  color: '#f59e0b',
  padding: '8px 13px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const badgeStatusHeader: React.CSSProperties = {
  background: '#22c55e',
  color: '#fff',
  padding: '8px 13px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const acoesHeader: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
};

const botaoHeaderClaro: React.CSSProperties = {
  padding: '13px 18px',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const botaoHeaderRoxo: React.CSSProperties = {
  padding: '13px 18px',
  borderRadius: 14,
  border: 'none',
  background: '#fff',
  color: '#6d28d9',
  fontWeight: 900,
  cursor: 'pointer',
};