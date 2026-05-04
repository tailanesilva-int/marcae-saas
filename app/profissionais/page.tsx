'use client';

import { useEffect, useState } from 'react';

const diasSemana = [
  { label: 'Domingo', value: 0 },
  { label: 'Segunda', value: 1 },
  { label: 'Terça', value: 2 },
  { label: 'Quarta', value: 3 },
  { label: 'Quinta', value: 4 },
  { label: 'Sexta', value: 5 },
  { label: 'Sábado', value: 6 },
];

export default function ProfissionaisPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: '',
    bio: '',
    fotoUrl: '',
    ativo: true,
    servicosIds: [] as string[],
    tipoComissao: 'percentual',
    valorComissao: '',
  });

  const [disponibilidade, setDisponibilidade] = useState(
    diasSemana.map((d) => ({
      diaSemana: d.value,
      horaInicio: '08:00',
      horaFim: '18:00',
      ativo: false,
    }))
  );

  useEffect(() => {
    const empresaStorage = localStorage.getItem('empresaLogada');

    if (!empresaStorage) {
      window.location.href = '/login';
      return;
    }

    const emp = JSON.parse(empresaStorage);
    setEmpresa(emp);
    carregarTudo(emp.id);
  }, []);

  async function carregarTudo(empresaId: string) {
    setCarregando(true);

    const [resProfissionais, resServicos] = await Promise.all([
      fetch(`/api/profissionais?empresaId=${empresaId}`),
      fetch(`/api/servicos?empresaId=${empresaId}`),
    ]);

    const dataProfissionais = await resProfissionais.json();
    const dataServicos = await resServicos.json();

    if (dataProfissionais.success) {
      setProfissionais(dataProfissionais.profissionais || []);
    }

    setServicos(dataServicos.servicos || []);
    setCarregando(false);
  }

  async function carregarDisponibilidade(profissionalId: string) {
    const res = await fetch(`/api/disponibilidades?profissionalId=${profissionalId}`);
    const data = await res.json();

    if (data.success && data.disponibilidades?.length > 0) {
      setDisponibilidade(
        diasSemana.map((dia) => {
          const existente = data.disponibilidades.find(
            (d: any) => d.diaSemana === dia.value
          );

          return {
            diaSemana: dia.value,
            horaInicio: existente?.horaInicio || '08:00',
            horaFim: existente?.horaFim || '18:00',
            ativo: existente?.ativo || false,
          };
        })
      );
    } else {
      resetarDisponibilidade();
    }
  }

  function resetarDisponibilidade() {
    setDisponibilidade(
      diasSemana.map((d) => ({
        diaSemana: d.value,
        horaInicio: '08:00',
        horaFim: '18:00',
        ativo: false,
      }))
    );
  }

  function alternarServico(servicoId: string) {
    const jaSelecionado = form.servicosIds.includes(servicoId);

    setForm({
      ...form,
      servicosIds: jaSelecionado
        ? form.servicosIds.filter((id) => id !== servicoId)
        : [...form.servicosIds, servicoId],
    });
  }

  function atualizarDia(index: number, campo: string, valor: any) {
    const nova: any = [...disponibilidade];
    nova[index][campo] = valor;
    setDisponibilidade(nova);
  }

  function selecionarFoto(event: any) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onloadend = () => {
      setForm({
        ...form,
        fotoUrl: String(leitor.result),
      });
    };

    leitor.readAsDataURL(arquivo);
  }

  function formatarComissao(profissional: any) {
    if (!profissional.tipoComissao || profissional.valorComissao === null || profissional.valorComissao === undefined) {
      return 'Comissão não configurada';
    }

    if (profissional.tipoComissao === 'percentual') {
      return `${Number(profissional.valorComissao || 0)}% por serviço realizado`;
    }

    return `R$ ${Number(profissional.valorComissao || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} por serviço realizado`;
  }

  async function salvar() {
    if (!form.nome.trim()) {
      alert('Informe o nome do profissional.');
      return;
    }

    const res = await fetch('/api/profissionais', {
      method: editandoId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editandoId,
        empresaId: empresa.id,
        ...form,
        valorComissao:
          form.valorComissao !== ''
            ? Number(String(form.valorComissao).replace(',', '.'))
            : null,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error || 'Erro ao salvar profissional.');
      return;
    }

    const profissionalId = data.profissional.id;

    await fetch('/api/disponibilidades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresaId: empresa.id,
        profissionalId,
        disponibilidades: disponibilidade,
      }),
    });

    alert(editandoId ? 'Profissional atualizado!' : 'Profissional cadastrado!');

    limparFormulario();
    carregarTudo(empresa.id);
  }

  async function editar(profissional: any) {
    const servicosIds =
      profissional.servicos?.map((item: any) => item.servicoId) || [];

    setEditandoId(profissional.id);

    setForm({
      nome: profissional.nome || '',
      bio: profissional.bio || '',
      fotoUrl: profissional.fotoUrl || '',
      ativo: profissional.ativo ?? true,
      servicosIds,
      tipoComissao: profissional.tipoComissao || 'percentual',
      valorComissao:
        profissional.valorComissao !== null &&
        profissional.valorComissao !== undefined
          ? String(profissional.valorComissao)
          : '',
    });

    await carregarDisponibilidade(profissional.id);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function limparFormulario() {
    setEditandoId(null);

    setForm({
      nome: '',
      bio: '',
      fotoUrl: '',
      ativo: true,
      servicosIds: [],
      tipoComissao: 'percentual',
      valorComissao: '',
    });

    resetarDisponibilidade();
  }

  if (!empresa) {
    return <p style={{ padding: 40 }}>Carregando...</p>;
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', padding: 30 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={header}>
          <div>
            <h1 style={{ margin: 0 }}>Profissionais</h1>
            <p style={{ marginTop: 6, color: '#475569' }}>
              Cadastre profissionais, vincule serviços, configure agenda semanal e comissão.
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

        <section style={box}>
          <h2 style={{ marginTop: 0 }}>
            {editandoId ? 'Editar profissional' : 'Novo profissional'}
          </h2>

          <div style={gridForm}>
            <div style={campo}>
              <label>Nome *</label>
              <input
                style={input}
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>

            <div style={campo}>
              <label>Foto do profissional</label>
              <input
                type="file"
                accept="image/*"
                style={input}
                onChange={selecionarFoto}
              />

              {form.fotoUrl && (
                <img
                  src={form.fotoUrl}
                  alt="Prévia"
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 999,
                    objectFit: 'cover',
                    border: '2px solid #e2e8f0',
                    marginTop: 8,
                  }}
                />
              )}
            </div>

            <div style={{ ...campo, gridColumn: '1 / -1' }}>
              <label>Bio / descrição</label>
              <textarea
                style={{ ...input, minHeight: 90, resize: 'vertical' }}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Ex: Especialista em cortes femininos..."
              />
            </div>

            <label style={checkLinha}>
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              />
              Profissional ativo
            </label>

            <div style={{ ...campo, gridColumn: '1 / -1', marginTop: 8 }}>
              <h3 style={{ marginBottom: 4 }}>Comissão do profissional</h3>
              <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 13 }}>
                Informe se a comissão será calculada por percentual do serviço ou por valor fixo.
              </p>

              <div style={comissaoGrid}>
                <div style={campo}>
                  <label>Tipo de comissão</label>
                  <select
                    style={input}
                    value={form.tipoComissao}
                    onChange={(e) =>
                      setForm({ ...form, tipoComissao: e.target.value })
                    }
                  >
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Valor fixo (R$)</option>
                  </select>
                </div>

                <div style={campo}>
                  <label>
                    {form.tipoComissao === 'percentual'
                      ? 'Percentual da comissão'
                      : 'Valor fixo da comissão'}
                  </label>
                  <input
                    style={input}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={
                      form.tipoComissao === 'percentual'
                        ? 'Ex: 40'
                        : 'Ex: 25,00'
                    }
                    value={form.valorComissao}
                    onChange={(e) =>
                      setForm({ ...form, valorComissao: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 26 }}>
            <h3>Serviços que este profissional realiza</h3>

            {servicos.length === 0 ? (
              <p style={{ color: '#64748b' }}>
                Nenhum serviço cadastrado. Cadastre serviços primeiro.
              </p>
            ) : (
              <div style={servicosGrid}>
                {servicos.map((servico) => (
                  <label key={servico.id} style={checkboxCard}>
                    <input
                      type="checkbox"
                      checked={form.servicosIds.includes(servico.id)}
                      onChange={() => alternarServico(servico.id)}
                    />

                    <div>
                      <strong>{servico.nome}</strong>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {servico.duracaoMin} min · R$ {servico.valor}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 28 }}>
            <h3>Agenda semanal</h3>

            <div style={agendaGrid}>
              {diasSemana.map((dia, index) => (
                <div key={dia.value} style={diaCard}>
                  <label style={diaTitulo}>
                    <input
                      type="checkbox"
                      checked={disponibilidade[index].ativo}
                      onChange={(e) =>
                        atualizarDia(index, 'ativo', e.target.checked)
                      }
                    />
                    {dia.label}
                  </label>

                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <input
                      type="time"
                      value={disponibilidade[index].horaInicio}
                      onChange={(e) =>
                        atualizarDia(index, 'horaInicio', e.target.value)
                      }
                      style={input}
                    />

                    <input
                      type="time"
                      value={disponibilidade[index].horaFim}
                      onChange={(e) =>
                        atualizarDia(index, 'horaFim', e.target.value)
                      }
                      style={input}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button onClick={salvar} style={botaoPrincipal}>
              {editandoId ? 'Salvar alterações' : 'Cadastrar profissional'}
            </button>

            {editandoId && (
              <button onClick={limparFormulario} style={botaoSecundario}>
                Cancelar edição
              </button>
            )}
          </div>
        </section>

        <section style={box}>
          <h2 style={{ marginTop: 0 }}>Lista de profissionais</h2>

          {carregando && <p>Carregando profissionais...</p>}

          {!carregando && profissionais.length === 0 && (
            <p style={{ color: '#64748b' }}>
              Nenhum profissional cadastrado ainda.
            </p>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            {profissionais.map((p) => (
              <div key={p.id} style={cardProfissional}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={avatar}>
                    {p.fotoUrl ? (
                      <img
                        src={p.fotoUrl}
                        alt={p.nome}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      p.nome?.charAt(0)?.toUpperCase()
                    )}
                  </div>

                  <div>
                    <strong>{p.nome}</strong>

                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
                      {p.bio || 'Sem descrição'}
                    </div>

                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {p.servicos?.length > 0 ? (
                        p.servicos.map((item: any) => (
                          <span key={item.id} style={badgeServico}>
                            {item.servico?.nome}
                          </span>
                        ))
                      ) : (
                        <span style={badgeCinza}>Sem serviços vinculados</span>
                      )}

                      <span style={badgeComissao}>
                        {formatarComissao(p)}
                      </span>
                    </div>

                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        padding: '4px 8px',
                        borderRadius: 999,
                        fontSize: 12,
                        background: p.ativo ? '#dcfce7' : '#fee2e2',
                        color: p.ativo ? '#166534' : '#991b1b',
                      }}
                    >
                      {p.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>

                <button onClick={() => editar(p)} style={botaoSecundario}>
                  Editar
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

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

const gridForm = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
};

const campo = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 6,
  fontWeight: 600,
};

const input = {
  padding: 12,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  outline: 'none',
};

const checkLinha = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 600,
};

const comissaoGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};

const servicosGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 10,
};

const checkboxCard = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  padding: 12,
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  cursor: 'pointer',
};

const agendaGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
};

const diaCard = {
  padding: 14,
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
};

const diaTitulo = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  fontWeight: 700,
};

const cardProfissional = {
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 16,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: '#f8fafc',
};

const avatar = {
  width: 54,
  height: 54,
  borderRadius: 999,
  background: '#e0e7ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  color: '#4f46e5',
  overflow: 'hidden',
};

const badgeServico = {
  padding: '4px 8px',
  borderRadius: 999,
  fontSize: 12,
  background: '#e0e7ff',
  color: '#3730a3',
  fontWeight: 600,
};

const badgeComissao = {
  padding: '4px 8px',
  borderRadius: 999,
  fontSize: 12,
  background: '#ecfdf5',
  color: '#166534',
  fontWeight: 700,
};

const badgeCinza = {
  padding: '4px 8px',
  borderRadius: 999,
  fontSize: 12,
  background: '#e2e8f0',
  color: '#475569',
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