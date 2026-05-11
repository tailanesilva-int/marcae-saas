'use client';

import { useEffect, useMemo, useState } from 'react';

export default function ClientesPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [historicoCliente, setHistoricoCliente] = useState<any[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    whatsapp: '',
    cpf: '',
    dataNascimento: '',
  });

  const [formEdicao, setFormEdicao] = useState({
    nome: '',
    whatsapp: '',
    cpf: '',
    dataNascimento: '',
  });

  useEffect(() => {
    const empresaStorage = localStorage.getItem('empresaLogada');

    if (!empresaStorage) {
      window.location.href = '/login';
      return;
    }

    const emp = JSON.parse(empresaStorage);
    setEmpresa(emp);
    carregarClientes(emp.id);
  }, []);

  function somenteNumeros(valor: string) {
    return String(valor || '').replace(/\D/g, '');
  }

  function formatarCpf(valor: string) {
    const numeros = somenteNumeros(valor).slice(0, 11);

    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function formatarWhatsapp(valor: string) {
    const numeros = somenteNumeros(valor).slice(0, 11);

    if (numeros.length <= 10) {
      return numeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  function dinheiro(valor: number) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function formatarData(data?: string | null) {
    if (!data) return 'Não informada';

    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatarDataHora(data?: string | null) {
    if (!data) return 'Não informado';

    return new Date(data).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  function dataInput(data?: string | null) {
    if (!data) return '';
    return new Date(data).toISOString().slice(0, 10);
  }

  function textoStatus(status?: string | null) {
    if (status === 'concluido') return 'Concluído';
    if (status === 'confirmado') return 'Confirmado';
    if (status === 'cancelado') return 'Cancelado';
    if (status === 'pendente') return 'Pendente';
    return status || 'Não informado';
  }

  function textoPagamento(status?: string | null) {
    if (status === 'pago') return 'Pago';
    if (status === 'aprovado') return 'Pago';
    if (status === 'confirmado') return 'Confirmado';
    if (status === 'pendente') return 'Pendente';
    if (status === 'sem_pagamento') return 'Sem pagamento';
    return status || 'Não informado';
  }

  async function carregarClientes(empresaId: string) {
    try {
      setCarregando(true);

      const res = await fetch(`/api/v1/clients?empresaId=${empresaId}`, {
        cache: 'no-store',
      });

      const data = await res.json();

      setClientes(data.clientes || []);
    } catch (error) {
      alert('Erro ao carregar clientes.');
    } finally {
      setCarregando(false);
    }
  }

  async function salvarCliente() {
    if (!empresa?.id) return;

    if (!form.nome.trim()) return alert('Informe o nome do cliente.');
    if (somenteNumeros(form.whatsapp).length < 10) {
      return alert('Informe um WhatsApp válido.');
    }

    if (form.cpf && somenteNumeros(form.cpf).length !== 11) {
      return alert('Informe um CPF válido com 11 dígitos.');
    }

    try {
      setSalvando(true);

      const res = await fetch('/api/v1/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresa.id,
          nome: form.nome.trim(),
          whatsapp: somenteNumeros(form.whatsapp),
          cpf: somenteNumeros(form.cpf),
          dataNascimento: form.dataNascimento || undefined,
        }),
      });

      if (!res.ok) {
        const erro = await res.json();
        alert(erro.error || 'Erro ao salvar cliente.');
        return;
      }

      setForm({
        nome: '',
        whatsapp: '',
        cpf: '',
        dataNascimento: '',
      });

      await carregarClientes(empresa.id);
      alert('Cliente salvo com sucesso!');
    } catch (error) {
      alert('Erro ao salvar cliente.');
    } finally {
      setSalvando(false);
    }
  }

  function abrirEditar(cliente: any) {
    setClienteSelecionado(cliente);
    setFormEdicao({
      nome: cliente.nome || '',
      whatsapp: formatarWhatsapp(cliente.whatsapp || ''),
      cpf: formatarCpf(cliente.cpf || ''),
      dataNascimento: dataInput(cliente.dataNascimento),
    });
    setModalEditarAberto(true);
  }

  function fecharEditar() {
    setModalEditarAberto(false);
    setClienteSelecionado(null);
    setFormEdicao({
      nome: '',
      whatsapp: '',
      cpf: '',
      dataNascimento: '',
    });
  }

  async function salvarEdicaoCliente() {
    if (!empresa?.id || !clienteSelecionado?.id) return;

    if (!formEdicao.nome.trim()) return alert('Informe o nome do cliente.');
    if (somenteNumeros(formEdicao.whatsapp).length < 10) {
      return alert('Informe um WhatsApp válido.');
    }

    if (formEdicao.cpf && somenteNumeros(formEdicao.cpf).length !== 11) {
      return alert('Informe um CPF válido com 11 dígitos.');
    }

    try {
      setSalvandoEdicao(true);

      const res = await fetch('/api/v1/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresa.id,
          clienteId: clienteSelecionado.id,
          nome: formEdicao.nome.trim(),
          whatsapp: somenteNumeros(formEdicao.whatsapp),
          cpf: somenteNumeros(formEdicao.cpf),
          dataNascimento: formEdicao.dataNascimento || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || 'Erro ao editar cliente.');
        return;
      }

      await carregarClientes(empresa.id);
      fecharEditar();
      alert('Cliente atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao editar cliente.');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function abrirHistorico(cliente: any) {
    if (!empresa?.id) return;

    try {
      setClienteSelecionado(cliente);
      setModalHistoricoAberto(true);
      setCarregandoHistorico(true);
      setHistoricoCliente([]);

      const res = await fetch(
        `/api/v1/clients?empresaId=${empresa.id}&clienteId=${cliente.id}`,
        { cache: 'no-store' }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Erro ao buscar histórico.');
        return;
      }

      setHistoricoCliente(data.historico || []);
    } catch (error) {
      alert('Erro ao buscar histórico.');
    } finally {
      setCarregandoHistorico(false);
    }
  }

  function fecharHistorico() {
    setModalHistoricoAberto(false);
    setClienteSelecionado(null);
    setHistoricoCliente([]);
  }

  function iniciarAgendamento(cliente: any) {
    window.location.href = `/agendar/${empresa.slug}?clienteId=${cliente.id}`;
  }

  function voltarDashboard() {
    window.location.href = '/dashboard';
  }

  function voltarAdmin() {
    window.location.href = '/admin';
  }

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const termoNumerico = somenteNumeros(busca);

    if (!termo && !termoNumerico) return clientes;

    return clientes.filter((cliente) => {
      const nome = String(cliente.nome || '').toLowerCase();
      const whatsapp = somenteNumeros(cliente.whatsapp || '');
      const cpf = somenteNumeros(cliente.cpf || '');

      return (
        nome.includes(termo) ||
        whatsapp.includes(termoNumerico) ||
        cpf.includes(termoNumerico)
      );
    });
  }, [busca, clientes]);

  if (!empresa) {
    return (
      <main style={page}>
        <div style={loadingCard}>Carregando clientes...</div>
      </main>
    );
  }

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
      <span style={badgeBoasVindas}>CRM de clientes</span>

      <h1 style={tituloHeader}>Clientes</h1>

      <p style={subtituloHeader}>
        Cadastre, encontre, edite e acompanhe o histórico dos clientes.
      </p>

      <div style={linhaBadgesHeader}>
        <span style={badgeEmpresa}>🏢 {empresa?.nome || 'Meu Estúdio'}</span>
        <span style={badgeModulo}>👤 CRM</span>
        <span style={badgeStatusHeader}>✅ Ativo</span>
      </div>
    </div>
  </div>

  <div style={acoesHeader}>
    <button onClick={voltarAdmin} style={botaoHeaderClaro}>
      Admin
    </button>

    <button onClick={voltarDashboard} style={botaoHeaderRoxo}>
      Dashboard
    </button>
  </div>
</header>

        <section style={gridResumo}>
          <Resumo titulo="Total de clientes" valor={clientes.length} />
          <Resumo titulo="Clientes encontrados" valor={clientesFiltrados.length} />
          <Resumo titulo="Empresa" valor={empresa.nome} />
        </section>

        <section style={cardPrincipal}>
          <div style={sectionHeader}>
            <div>
              <h2 style={sectionTitle}>Cadastrar cliente</h2>
              <p style={sectionText}>
                Use para clientes que entram em contato direto pelo WhatsApp ou balcão.
              </p>
            </div>
          </div>

          <div style={gridFormulario}>
            <Campo
              label="Nome completo"
              placeholder="Ex: Maria Silva"
              value={form.nome}
              onChange={(value: string) => setForm({ ...form, nome: value })}
            />

            <Campo
              label="WhatsApp"
              placeholder="(00) 00000-0000"
              value={form.whatsapp}
              onChange={(value: string) =>
                setForm({ ...form, whatsapp: formatarWhatsapp(value) })
              }
            />

            <Campo
              label="CPF"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(value: string) =>
                setForm({ ...form, cpf: formatarCpf(value) })
              }
            />

            <div>
              <label style={label}>Data de nascimento</label>
              <input
                type="date"
                value={form.dataNascimento}
                onChange={(e) =>
                  setForm({ ...form, dataNascimento: e.target.value })
                }
                style={input}
              />
            </div>
          </div>

          <button onClick={salvarCliente} disabled={salvando} style={botaoPrincipal}>
            {salvando ? 'Salvando cliente...' : 'Salvar cliente'}
          </button>
        </section>

        <section style={cardPrincipal}>
          <div style={sectionHeader}>
            <div>
              <h2 style={sectionTitle}>Lista de clientes</h2>
              <p style={sectionText}>
                Pesquise por nome, WhatsApp ou CPF, edite dados e veja o histórico.
              </p>
            </div>

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cliente..."
              style={inputBusca}
            />
          </div>

          {carregando ? (
            <div style={emptyBox}>Carregando clientes...</div>
          ) : clientesFiltrados.length === 0 ? (
            <div style={emptyBox}>Nenhum cliente encontrado.</div>
          ) : (
            <div style={listaClientes}>
              {clientesFiltrados.map((cliente) => (
                <div key={cliente.id} style={clienteCard}>
                  <div style={avatar}>
                    {String(cliente.nome || 'C').charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1 }}>
                    <strong style={clienteNome}>{cliente.nome}</strong>

                    <div style={clienteInfo}>
                      <span>📲 {formatarWhatsapp(cliente.whatsapp || '')}</span>
                      <span>🪪 {cliente.cpf ? formatarCpf(cliente.cpf) : 'CPF não informado'}</span>
                      <span>🎂 {formatarData(cliente.dataNascimento)}</span>
                    </div>
                  </div>

                  <div style={botoesCliente}>
                    <button
                      onClick={() => abrirEditar(cliente)}
                      style={botaoEditar}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => abrirHistorico(cliente)}
                      style={botaoHistorico}
                    >
                      Histórico
                    </button>

                    <button
                      onClick={() => iniciarAgendamento(cliente)}
                      style={botaoAgendar}
                    >
                      Agendar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {modalEditarAberto && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={modalHeader}>
              <div>
                <h2 style={modalTitle}>Editar cliente</h2>
                <p style={modalSubtitle}>
                  Atualize os dados do cliente sem perder o histórico.
                </p>
              </div>

              <button onClick={fecharEditar} style={botaoFechar}>
                ×
              </button>
            </div>

            <div style={gridFormularioModal}>
              <Campo
                label="Nome completo"
                placeholder="Nome do cliente"
                value={formEdicao.nome}
                onChange={(value: string) =>
                  setFormEdicao({ ...formEdicao, nome: value })
                }
              />

              <Campo
                label="WhatsApp"
                placeholder="(00) 00000-0000"
                value={formEdicao.whatsapp}
                onChange={(value: string) =>
                  setFormEdicao({
                    ...formEdicao,
                    whatsapp: formatarWhatsapp(value),
                  })
                }
              />

              <Campo
                label="CPF"
                placeholder="000.000.000-00"
                value={formEdicao.cpf}
                onChange={(value: string) =>
                  setFormEdicao({ ...formEdicao, cpf: formatarCpf(value) })
                }
              />

              <div>
                <label style={label}>Data de nascimento</label>
                <input
                  type="date"
                  value={formEdicao.dataNascimento}
                  onChange={(e) =>
                    setFormEdicao({
                      ...formEdicao,
                      dataNascimento: e.target.value,
                    })
                  }
                  style={input}
                />
              </div>
            </div>

            <div style={modalActions}>
              <button onClick={fecharEditar} style={botaoCancelar}>
                Cancelar
              </button>

              <button
                onClick={salvarEdicaoCliente}
                disabled={salvandoEdicao}
                style={botaoSalvarModal}
              >
                {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalHistoricoAberto && (
        <div style={modalOverlay}>
          <div style={modalHistorico}>
            <div style={modalHeader}>
              <div>
                <h2 style={modalTitle}>Histórico do cliente</h2>
                <p style={modalSubtitle}>
                  {clienteSelecionado?.nome} · {formatarWhatsapp(clienteSelecionado?.whatsapp || '')}
                </p>
              </div>

              <button onClick={fecharHistorico} style={botaoFechar}>
                ×
              </button>
            </div>

            {carregandoHistorico ? (
              <div style={emptyBox}>Carregando histórico...</div>
            ) : historicoCliente.length === 0 ? (
              <div style={emptyBox}>Este cliente ainda não possui atendimentos.</div>
            ) : (
              <div style={listaHistorico}>
                {historicoCliente.map((item) => (
                  <div key={item.id} style={historicoCard}>
                    <div style={historicoTopo}>
                      <div>
                        <strong style={historicoServico}>{item.servico}</strong>
                        <p style={historicoTexto}>
                          {item.profissional} · {formatarDataHora(item.dataHoraInicio)}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={badgeStatus(item.status)}>
                          {textoStatus(item.status)}
                        </span>
                        <p style={historicoTexto}>
                          Pagamento: {textoPagamento(item.statusPagamento)}
                        </p>
                      </div>
                    </div>

                    <div style={financeiroGrid}>
                      <ResumoFinanceiro label="Total" valor={dinheiro(item.total)} />
                      <ResumoFinanceiro label="Pago" valor={dinheiro(item.pago)} />
                      <ResumoFinanceiro label="Pendente" valor={dinheiro(item.pendente)} />
                    </div>

                    {item.adicionais?.length > 0 && (
                      <div style={adicionaisBox}>
                        <strong>Serviços adicionais</strong>

                        {item.adicionais.map((adicional: any) => (
                          <div key={adicional.id} style={adicionalLinha}>
                            <span>
                              {adicional.nome} · {adicional.profissional}
                            </span>
                            <strong>{dinheiro(adicional.valor)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Campo({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={input}
      />
    </div>
  );
}

function Resumo({ titulo, valor }: any) {
  return (
    <div style={resumoCard}>
      <span style={resumoTitulo}>{titulo}</span>
      <strong style={resumoValor}>{valor}</strong>
    </div>
  );
}

function ResumoFinanceiro({ label, valor }: any) {
  return (
    <div style={resumoFinanceiroCard}>
      <span>{label}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function badgeStatus(status?: string | null): React.CSSProperties {
  if (status === 'concluido') {
    return { ...badgeBase, background: '#dcfce7', color: '#166534' };
  }

  if (status === 'confirmado') {
    return { ...badgeBase, background: '#dbeafe', color: '#1d4ed8' };
  }

  if (status === 'cancelado') {
    return { ...badgeBase, background: '#fee2e2', color: '#991b1b' };
  }

  return { ...badgeBase, background: '#fef3c7', color: '#92400e' };
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at 15% 10%, rgba(124,58,237,0.18), transparent 28%), radial-gradient(circle at 85% 5%, rgba(219,39,119,0.16), transparent 28%), #f1f5f9',
  padding: 30,
  color: '#0f172a',
};

const container: React.CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
};

const header: React.CSSProperties = {
  background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
  borderRadius: 26,
  padding: 30,
  color: '#fff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 20,
  boxShadow: '0 24px 60px rgba(79,70,229,0.25)',
};

const tag: React.CSSProperties = {
  display: 'inline-flex',
  background: 'rgba(255,255,255,0.16)',
  border: '1px solid rgba(255,255,255,0.22)',
  borderRadius: 999,
  padding: '7px 12px',
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 12,
};

const titulo: React.CSSProperties = {
  margin: 0,
  fontSize: 42,
  letterSpacing: '-0.05em',
};

const subtitulo: React.CSSProperties = {
  margin: '8px 0 0',
  opacity: 0.9,
  maxWidth: 640,
  lineHeight: 1.5,
};

const acoesHeader: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const botaoClaro: React.CSSProperties = {
  border: 0,
  borderRadius: 14,
  background: '#fff',
  color: '#4f46e5',
  padding: '12px 16px',
  fontWeight: 900,
  cursor: 'pointer',
};

const gridResumo: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 16,
  marginTop: 20,
};

const resumoCard: React.CSSProperties = {
  background: '#fff',
  borderRadius: 22,
  padding: 20,
  border: '1px solid #e2e8f0',
  boxShadow: '0 18px 45px rgba(15,23,42,0.07)',
};

const resumoTitulo: React.CSSProperties = {
  display: 'block',
  color: '#64748b',
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 8,
};

const resumoValor: React.CSSProperties = {
  fontSize: 24,
  color: '#0f172a',
};

const cardPrincipal: React.CSSProperties = {
  background: 'rgba(255,255,255,0.96)',
  borderRadius: 26,
  padding: 24,
  marginTop: 20,
  border: '1px solid #e2e8f0',
  boxShadow: '0 20px 50px rgba(15,23,42,0.08)',
};

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
  marginBottom: 18,
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  letterSpacing: '-0.03em',
};

const sectionText: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#64748b',
};

const gridFormulario: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 14,
};

const gridFormularioModal: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 14,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 900,
  color: '#475569',
  marginBottom: 6,
};

const label = labelStyle;

const input: React.CSSProperties = {
  width: '100%',
  height: 48,
  borderRadius: 15,
  border: '1px solid #cbd5e1',
  padding: '0 14px',
  outline: 'none',
  fontSize: 14,
  background: '#fff',
};

const inputBusca: React.CSSProperties = {
  ...input,
  maxWidth: 320,
};

const botaoPrincipal: React.CSSProperties = {
  marginTop: 18,
  width: '100%',
  height: 52,
  border: 0,
  borderRadius: 16,
  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
  boxShadow: '0 18px 35px rgba(79,70,229,0.24)',
};

const listaClientes: React.CSSProperties = {
  display: 'grid',
  gap: 12,
};

const clienteCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 16,
};

const avatar: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 16,
  background: 'linear-gradient(135deg, #7c3aed, #db2777)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 950,
  fontSize: 20,
};

const clienteNome: React.CSSProperties = {
  display: 'block',
  fontSize: 16,
  color: '#0f172a',
  marginBottom: 7,
};

const clienteInfo: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700,
};

const botoesCliente: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const botaoAgendar: React.CSSProperties = {
  border: 0,
  borderRadius: 14,
  background: '#0f172a',
  color: '#fff',
  padding: '12px 14px',
  fontWeight: 900,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const botaoEditar: React.CSSProperties = {
  ...botaoAgendar,
  background: '#4f46e5',
};

const botaoHistorico: React.CSSProperties = {
  ...botaoAgendar,
  background: '#7c3aed',
};

const emptyBox: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 18,
  padding: 20,
  textAlign: 'center',
  color: '#64748b',
  background: '#f8fafc',
};

const loadingCard: React.CSSProperties = {
  maxWidth: 360,
  margin: '120px auto',
  background: '#fff',
  borderRadius: 24,
  padding: 28,
  textAlign: 'center',
  fontWeight: 900,
};

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,0.55)',
  zIndex: 999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const modalBox: React.CSSProperties = {
  width: '100%',
  maxWidth: 760,
  background: '#fff',
  borderRadius: 26,
  padding: 24,
  boxShadow: '0 30px 90px rgba(15,23,42,0.35)',
};

const modalHistorico: React.CSSProperties = {
  ...modalBox,
  maxWidth: 980,
  maxHeight: '90vh',
  overflowY: 'auto',
};

const modalHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 18,
};

const modalTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 26,
  color: '#0f172a',
};

const modalSubtitle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#64748b',
};

const botaoFechar: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 999,
  border: 0,
  background: '#f1f5f9',
  fontSize: 22,
  fontWeight: 900,
  cursor: 'pointer',
};

const modalActions: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  marginTop: 20,
};

const botaoCancelar: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  background: '#fff',
  color: '#334155',
  padding: '12px 16px',
  fontWeight: 900,
  cursor: 'pointer',
};

const botaoSalvarModal: React.CSSProperties = {
  border: 0,
  borderRadius: 14,
  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
  color: '#fff',
  padding: '12px 18px',
  fontWeight: 900,
  cursor: 'pointer',
};

const listaHistorico: React.CSSProperties = {
  display: 'grid',
  gap: 14,
};

const historicoCard: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  borderRadius: 20,
  padding: 16,
};

const historicoTopo: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 14,
  marginBottom: 12,
};

const historicoServico: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 17,
};

const historicoTexto: React.CSSProperties = {
  margin: '5px 0 0',
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700,
};

const badgeBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 900,
};

const financeiroGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 10,
  marginTop: 12,
};

const resumoFinanceiroCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 12,
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 13,
  fontWeight: 900,
};

const adicionaisBox: React.CSSProperties = {
  marginTop: 12,
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 12,
};

const adicionalLinha: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  marginTop: 8,
  color: '#475569',
  fontSize: 13,
  fontWeight: 800,
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
  background: '#ffedd5',
  color: '#f97316',
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