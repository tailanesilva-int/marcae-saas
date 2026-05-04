'use client';

import { useEffect, useState } from 'react';

export default function ServicosPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [servicos, setServicos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    duracaoMin: 30,
    valor: '',
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

  async function salvar() {
    if (!form.nome || !form.valor) {
      alert('Preencha nome e valor.');
      return;
    }

    const res = await fetch('/api/servicos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresaId: empresa.id,
        ...form,
      }),
    });

    const data = await res.json();

    if (res.status !== 200) {
      alert(data.error);
      return;
    }

    alert('Serviço criado!');
    carregarServicos(empresa.id);

    setForm({
      nome: '',
      descricao: '',
      duracaoMin: 30,
      valor: '',
      exigePrePagamento: false,
      valorPrePagamento: '',
    });
  }

  if (!empresa) {
    return <p style={{ padding: 40 }}>Carregando...</p>;
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', padding: 30 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* HEADER */}
        <header style={header}>
          <div>
            <h1 style={{ margin: 0 }}>Serviços</h1>
            <p style={{ marginTop: 6 }}>
              Gerencie valores, duração e pré-pagamento
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <a href="/admin">
              <button style={botaoSecundario}>Admin</button>
            </a>

            <a href="/dashboard">
              <button style={botaoSecundario}>Dashboard</button>
            </a>
          </div>
        </header>

        {/* FORM */}
        <section style={box}>
          <h2>Novo serviço</h2>

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
              />
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
            Salvar serviço
          </button>
        </section>

        {/* LISTA */}
        <section style={box}>
          <h2>Lista de serviços</h2>

          {carregando && <p>Carregando...</p>}

          {!carregando && servicos.length === 0 && (
            <p style={{ color: '#64748b' }}>
              Nenhum serviço cadastrado.
            </p>
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
                    ⏱ {s.duracaoMin} min — 💰 R$ {s.valor}
                  </div>

                  {s.exigePrePagamento && (
                    <span style={badge}>
                      Pré: R$ {s.valorPrePagamento}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

/* estilos */

const header = {
  background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
  color: '#fff',
  borderRadius: 20,
  padding: 24,
  marginBottom: 20,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

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