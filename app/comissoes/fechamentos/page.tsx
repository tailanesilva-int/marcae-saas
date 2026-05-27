'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import PremiumLayout from '@/components/layout/PremiumLayout';

export default function FechamentosComissaoPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [fechamentos, setFechamentos] = useState<any[]>([]);
  const [mostrarFinanceiro, setMostrarFinanceiro] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [buscaProfissional, setBuscaProfissional] = useState('');

  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [dataInicio, setDataInicio] = useState(
    primeiroDiaMes.toISOString().slice(0, 10)
  );
  const [dataFim, setDataFim] = useState(hoje.toISOString().slice(0, 10));

  useEffect(() => {
    function atualizarMobile() {
      setIsMobile(window.innerWidth <= 760);
    }

    atualizarMobile();
    window.addEventListener('resize', atualizarMobile);

    return () => window.removeEventListener('resize', atualizarMobile);
  }, []);

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

  const fechamentosFiltrados = useMemo(() => {
    const termo = buscaProfissional.trim().toLowerCase();

    if (!termo) return fechamentos;

    return fechamentos.filter((item) => {
      const nome = String(
        item.profissional?.nome || item.profissionalNome || ''
      ).toLowerCase();

      const observacao = String(item.observacao || '').toLowerCase();
      const periodo = `${formatarData(String(item.dataInicio).slice(0, 10))} ${formatarData(
        String(item.dataFim).slice(0, 10)
      )}`.toLowerCase();

      return nome.includes(termo) || observacao.includes(termo) || periodo.includes(termo);
    });
  }, [fechamentos, buscaProfissional]);

  if (!empresa || !usuario) {
    return <p style={{ padding: 40 }}>Carregando...</p>;
  }

  const totalPago = fechamentosFiltrados.reduce(
    (total, item) => total + Number(item.valorPago || 0),
    0
  );

  const totalFechamentos = fechamentosFiltrados.length;

  const profissionais = new Set(
    fechamentosFiltrados.map((item) => item.profissionalId)
  ).size;

  return (
    <PremiumLayout empresa={empresa} usuario={usuario}>
      <main style={{ ...page, ...(isMobile ? pageMobile : {}) }}>
        <div style={{ ...container, ...(isMobile ? containerMobile : {}) }}>
          <header style={{ ...headerCompact, ...(isMobile ? headerCompactMobile : {}) }}>
            <div style={headerTitleRow}>
              <div style={headerIcon}>✅</div>

              <div style={headerTitleWrap}>
                <span style={headerEyebrow}>Histórico financeiro</span>
                <h1 style={{ ...tituloHeader, ...(isMobile ? tituloHeaderMobile : {}) }}>
                  Fechamentos
                </h1>
                <p style={{ ...subtituloHeader, ...(isMobile ? subtituloHeaderMobile : {}) }}>
                  Repasses pagos, períodos fechados e histórico por profissional.
                </p>
              </div>
            </div>

            <div style={{ ...headerRight, ...(isMobile ? headerRightMobile : {}) }}>
              <div style={headerStats}>
                <MiniStat label="Repassado" valor={valorFinanceiro(totalPago)} />
                <MiniStat label="Fechamentos" valor={totalFechamentos} />
                <MiniStat label="Profissionais" valor={profissionais} />
              </div>

              <div style={{ ...headerButtons, ...(isMobile ? headerButtonsMobile : {}) }}>
                <button onClick={alternarFinanceiro} style={botaoHeaderGlass}>
                  {mostrarFinanceiro ? '🙈 Ocultar' : '👁 Valores'}
                </button>

                <Link href="/comissoes" style={linkSemDecoracao}>
                  <button style={botaoHeaderGlass}>💰 Comissões</button>
                </Link>
              </div>
            </div>
          </header>

          <section style={{ ...toolbarBox, ...(isMobile ? toolbarBoxMobile : {}) }}>
            <div style={toolbarHeader}>
              <div>
                <span style={sectionEyebrow}>Filtros</span>
                <h2 style={sectionTitle}>Pesquisar fechamentos</h2>
              </div>

              <span style={{ ...periodoPill, ...(isMobile ? periodoPillMobile : {}) }}>
                {formatarData(dataInicio)} até {formatarData(dataFim)}
              </span>
            </div>

            <div style={{ ...gridFiltro, ...(isMobile ? gridFiltroMobile : {}) }}>
              <div style={campo}>
                <label style={label}>Data inicial</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  style={input}
                />
              </div>

              <div style={campo}>
                <label style={label}>Data final</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  style={input}
                />
              </div>

              <div style={campo}>
                <label style={label}>Profissional</label>
                <input
                  type="text"
                  value={buscaProfissional}
                  onChange={(e) => setBuscaProfissional(e.target.value)}
                  placeholder="Buscar profissional"
                  style={input}
                />
              </div>

              <button onClick={filtrar} style={botaoPrincipal}>
                {carregando ? 'Buscando...' : 'Filtrar'}
              </button>
            </div>
          </section>

          <section style={{ ...gridCards, ...(isMobile ? gridCardsMobile : {}) }}>
            <Card titulo="Total repassado" valor={valorFinanceiro(totalPago)} detalhe="Pago no período" />
            <Card titulo="Fechamentos" valor={totalFechamentos} detalhe="Registros encontrados" />
            <Card titulo="Profissionais" valor={profissionais} detalhe="Com repasse pago" />
            <Card titulo="Período" valor={`${formatarData(dataInicio)} até ${formatarData(dataFim)}`} detalhe="Filtro atual" />
          </section>

          <section style={{ ...box, ...(isMobile ? boxMobile : {}) }}>
            <div style={{ ...sectionHeader, ...(isMobile ? sectionHeaderMobile : {}) }}>
              <div>
                <span style={sectionEyebrow}>Histórico de fechamentos</span>
                <h2 style={sectionTitle}>Repasses concluídos</h2>
              </div>

              <span style={quantidadePill}>{fechamentosFiltrados.length} registro(s)</span>
            </div>

            {carregando && <div style={emptyBox}>Carregando fechamentos...</div>}

            {!carregando && fechamentosFiltrados.length === 0 && (
              <div style={emptyBox}>Nenhum fechamento encontrado no período selecionado.</div>
            )}

            <div style={fechamentosGrid}>
              {fechamentosFiltrados.map((fechamento) => (
                <div
                  key={fechamento.id}
                  style={{ ...fechamentoCard, ...(isMobile ? fechamentoCardMobile : {}) }}
                >
                  <div style={fechamentoInfo}>
                    <div style={profissionalLinha}>
                      <div style={avatarFechamento}>
                        {String(
                          fechamento.profissional?.nome || fechamento.profissionalNome || 'P'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <strong style={nomeProfissional}>
                          {fechamento.profissional?.nome ||
                            fechamento.profissionalNome ||
                            'Profissional não informado'}
                        </strong>

                        <p style={textoPequeno}>
                          {formatarData(String(fechamento.dataInicio).slice(0, 10))} até{' '}
                          {formatarData(String(fechamento.dataFim).slice(0, 10))}
                        </p>
                      </div>
                    </div>

                    <div style={fechamentoMetaGrid}>
                      <div style={metaItem}>
                        <span>Pago em</span>
                        <strong>{formatarDataHora(fechamento.createdAt)}</strong>
                      </div>

                      <div style={metaItem}>
                        <span>Comissões</span>
                        <strong>
                          {fechamento.totalComissoes || fechamento.comissoes?.length || 0}
                        </strong>
                      </div>
                    </div>

                    {fechamento.observacao && (
                      <p style={observacaoBox}>{fechamento.observacao}</p>
                    )}
                  </div>

                  <div style={isMobile ? fechamentoValorBoxMobile : fechamentoValorBox}>
                    <span style={valorLabel}>Valor pago</span>
                    <strong style={valorFechamento}>{valorFinanceiro(fechamento.valorPago)}</strong>
                    <span style={badgePago}>Repasse pago</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </PremiumLayout>
  );
}

function MiniStat({ label, valor }: any) {
  return (
    <div style={headerStat}>
      <strong style={headerStatValue}>{valor}</strong>
      <span style={headerStatLabel}>{label}</span>
    </div>
  );
}

function Card({ titulo, valor, detalhe }: any) {
  return (
    <div style={card}>
      <span style={cardTitulo}>{titulo}</span>
      <strong style={cardValor}>{valor}</strong>
      <p style={cardDetalhe}>{detalhe}</p>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
  padding: 24,
  overflowX: 'hidden',
};

const pageMobile: CSSProperties = {
  padding: 12,
  paddingBottom: 118,
};

const container: CSSProperties = {
  maxWidth: 1600,
  margin: '0 auto',
};

const containerMobile: CSSProperties = {
  maxWidth: '100%',
};

const linkSemDecoracao: CSSProperties = {
  textDecoration: 'none',
};

const headerCompact: CSSProperties = {
  width: '100%',
  background: 'rgba(15,23,42,.78)',
  borderRadius: 24,
  padding: 18,
  marginBottom: 16,
  border: '1px solid rgba(255,255,255,.08)',
  boxShadow: '0 14px 42px rgba(0,0,0,.24)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  backdropFilter: 'blur(16px)',
};

const headerCompactMobile: CSSProperties = {
  padding: 14,
  borderRadius: 22,
  marginBottom: 14,
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 12,
};

const headerTitleRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
};

const headerTitleWrap: CSSProperties = {
  minWidth: 0,
};

const headerIcon: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 16,
  background: 'linear-gradient(135deg,#22c55e,#16a34a)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
  boxShadow: '0 12px 28px rgba(34,197,94,.18)',
  flexShrink: 0,
};

const headerEyebrow: CSSProperties = {
  display: 'block',
  color: '#86efac',
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: 0.9,
  textTransform: 'uppercase',
  marginBottom: 5,
};

const tituloHeader: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 28,
  fontWeight: 950,
  lineHeight: 1,
  letterSpacing: '-0.9px',
};

const tituloHeaderMobile: CSSProperties = {
  fontSize: 25,
};

const subtituloHeader: CSSProperties = {
  margin: '6px 0 0',
  color: '#94a3b8',
  maxWidth: 560,
  fontSize: 13,
  lineHeight: 1.45,
  fontWeight: 700,
};

const subtituloHeaderMobile: CSSProperties = {
  fontSize: 12,
};

const headerRight: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const headerRightMobile: CSSProperties = {
  width: '100%',
  justifyContent: 'stretch',
  flexDirection: 'column',
  alignItems: 'stretch',
};

const headerStats: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8,
  minWidth: 310,
};

const headerStat: CSSProperties = {
  background: 'rgba(255,255,255,.045)',
  border: '1px solid rgba(255,255,255,.07)',
  borderRadius: 15,
  padding: '9px 10px',
  display: 'grid',
  gap: 3,
  minWidth: 0,
};

const headerStatValue: CSSProperties = {
  color: '#fff',
  fontSize: 15,
  fontWeight: 950,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const headerStatLabel: CSSProperties = {
  color: '#94a3b8',
  fontSize: 10,
  fontWeight: 800,
};

const headerButtons: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const headerButtonsMobile: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  width: '100%',
  gap: 8,
};

const botaoHeaderGlass: CSSProperties = {
  height: 38,
  padding: '0 13px',
  borderRadius: 13,
  border: '1px solid rgba(255,255,255,.10)',
  background: 'rgba(255,255,255,.06)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
  backdropFilter: 'blur(14px)',
  fontSize: 12,
  width: '100%',
};

const toolbarBox: CSSProperties = {
  background: 'rgba(15,23,42,.74)',
  border: '1px solid rgba(255,255,255,.08)',
  padding: 18,
  borderRadius: 22,
  marginBottom: 16,
  boxShadow: '0 14px 40px rgba(0,0,0,.20)',
};

const toolbarBoxMobile: CSSProperties = {
  padding: 14,
  borderRadius: 20,
};

const toolbarHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
};

const sectionHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 16,
};

const sectionHeaderMobile: CSSProperties = {
  alignItems: 'stretch',
};

const sectionEyebrow: CSSProperties = {
  color: '#a78bfa',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
};

const sectionTitle: CSSProperties = {
  margin: '5px 0 0',
  color: '#fff',
  fontSize: 22,
  fontWeight: 950,
};

const periodoPill: CSSProperties = {
  padding: '8px 11px',
  borderRadius: 999,
  background: 'rgba(124,58,237,.16)',
  border: '1px solid rgba(124,58,237,.30)',
  color: '#fff',
  fontWeight: 900,
  fontSize: 12,
};

const periodoPillMobile: CSSProperties = {
  width: '100%',
  textAlign: 'center',
  borderRadius: 16,
};

const gridFiltro: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.1fr) 140px',
  gap: 10,
  alignItems: 'end',
  marginTop: 14,
};

const gridFiltroMobile: CSSProperties = {
  gridTemplateColumns: '1fr',
  gap: 10,
};

const campo: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const label: CSSProperties = {
  color: '#cbd5e1',
  fontWeight: 800,
  fontSize: 12,
};

const input: CSSProperties = {
  height: 42,
  borderRadius: 13,
  border: '1px solid rgba(255,255,255,.10)',
  background: 'rgba(2,6,23,.58)',
  color: '#fff',
  padding: '0 12px',
  outline: 'none',
  colorScheme: 'dark',
  fontWeight: 800,
};

const botaoPrincipal: CSSProperties = {
  height: 42,
  borderRadius: 13,
  border: 'none',
  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
  boxShadow: '0 12px 28px rgba(124,58,237,.20)',
};

const gridCards: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 10,
  marginBottom: 16,
};

const gridCardsMobile: CSSProperties = {
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
};

const card: CSSProperties = {
  background: 'rgba(15,23,42,.74)',
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,.08)',
  color: '#fff',
  minWidth: 0,
};

const cardTitulo: CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 800,
};

const cardValor: CSSProperties = {
  display: 'block',
  marginTop: 4,
  fontSize: 18,
  fontWeight: 950,
  lineHeight: 1.1,
  overflowWrap: 'anywhere',
};

const cardDetalhe: CSSProperties = {
  margin: '7px 0 0',
  color: '#64748b',
  fontSize: 11,
  lineHeight: 1.3,
  fontWeight: 700,
};

const box: CSSProperties = {
  background: 'rgba(15,23,42,.74)',
  border: '1px solid rgba(255,255,255,.08)',
  padding: 18,
  borderRadius: 22,
};

const boxMobile: CSSProperties = {
  padding: 14,
  borderRadius: 22,
};

const quantidadePill: CSSProperties = {
  padding: '8px 11px',
  borderRadius: 999,
  color: '#cbd5e1',
  border: '1px solid rgba(255,255,255,.08)',
  background: 'rgba(255,255,255,.05)',
  fontSize: 12,
  fontWeight: 900,
};

const fechamentosGrid: CSSProperties = {
  display: 'grid',
  gap: 10,
};

const fechamentoCard: CSSProperties = {
  background: 'linear-gradient(135deg, rgba(30,41,59,.82), rgba(15,23,42,.92))',
  border: '1px solid rgba(255,255,255,.08)',
  borderLeft: '4px solid #22c55e',
  borderRadius: 18,
  padding: 14,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 14,
  color: '#fff',
  alignItems: 'center',
};

const fechamentoCardMobile: CSSProperties = {
  flexDirection: 'column',
  alignItems: 'stretch',
  borderRadius: 18,
  gap: 12,
};

const fechamentoInfo: CSSProperties = {
  display: 'grid',
  gap: 10,
  minWidth: 0,
};

const profissionalLinha: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
};

const avatarFechamento: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(34,197,94,.13)',
  border: '1px solid rgba(34,197,94,.25)',
  color: '#bbf7d0',
  fontWeight: 950,
  flexShrink: 0,
};

const nomeProfissional: CSSProperties = {
  display: 'block',
  fontSize: 15,
  fontWeight: 950,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const fechamentoMetaGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
};

const metaItem: CSSProperties = {
  background: 'rgba(2,6,23,.34)',
  border: '1px solid rgba(255,255,255,.07)',
  borderRadius: 13,
  padding: 10,
  display: 'grid',
  gap: 4,
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 800,
};

const textoPequeno: CSSProperties = {
  margin: '4px 0 0',
  color: '#94a3b8',
  fontSize: 11,
  lineHeight: 1.35,
};

const observacaoBox: CSSProperties = {
  margin: 0,
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.06)',
  borderRadius: 13,
  padding: 10,
  color: '#cbd5e1',
  fontSize: 12,
};

const fechamentoValorBox: CSSProperties = {
  textAlign: 'right',
  minWidth: 150,
  display: 'grid',
  gap: 6,
  justifyItems: 'end',
};

const fechamentoValorBoxMobile: CSSProperties = {
  textAlign: 'left',
  padding: 12,
  borderRadius: 16,
  background: 'rgba(34,197,94,.08)',
  border: '1px solid rgba(34,197,94,.16)',
  display: 'grid',
  gap: 6,
};

const valorLabel: CSSProperties = {
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 900,
};

const valorFechamento: CSSProperties = {
  color: '#22c55e',
  fontSize: 21,
  fontWeight: 950,
  lineHeight: 1.1,
};

const badgePago: CSSProperties = {
  display: 'inline-flex',
  width: 'fit-content',
  background: 'rgba(34,197,94,.14)',
  color: '#4ade80',
  border: '1px solid rgba(34,197,94,.24)',
  borderRadius: 999,
  padding: '7px 10px',
  fontSize: 11,
  fontWeight: 900,
};

const emptyBox: CSSProperties = {
  background: 'rgba(2,6,23,.45)',
  border: '1px dashed rgba(148,163,184,.24)',
  color: '#94a3b8',
  borderRadius: 18,
  padding: 22,
  textAlign: 'center',
  fontWeight: 800,
};
