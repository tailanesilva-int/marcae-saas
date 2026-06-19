// app/relatorios/page.tsx

'use client';

import RelatorioCaixa from '@/components/relatorios/RelatorioCaixa';
import PremiumLayout from '@/components/layout/PremiumLayout';
import { gerarTemaEmpresa } from '@/app/lib/theme';
import { obterStatusLicencaEmpresa } from '@/app/lib/licencaEmpresa';
import { useEffect, useMemo, useState } from 'react';
import RelatorioClientesFinanceiro from '@/components/relatorios/RelatorioClientesFinanceiro';
import RelatorioComissoes from '@/components/relatorios/RelatorioComissoes';
import RelatorioLucro from '@/components/relatorios/RelatorioLucro';
import RelatorioPrePagamentos from '@/components/relatorios/RelatorioPrePagamentos';
import RelatorioPromocoes from '@/components/relatorios/RelatorioPromocoes';

export default function RelatoriosPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);

  const hoje = formatarDataInput(new Date());

  const [dataInicio, setDataInicio] = useState(hoje);
  const [dataFim, setDataFim] = useState(hoje);

  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [relatorioAtivo, setRelatorioAtivo] = useState('caixa');
  const [isMobile, setIsMobile] = useState(false);

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

    const empresaParse = JSON.parse(empresaStorage);
    const usuarioParse = JSON.parse(usuarioStorage);

    setEmpresa(empresaParse);
    setUsuario(usuarioParse);

    carregarRelatorios(
      empresaParse.id,
      hoje,
      hoje
    );
  }, []);

  async function carregarRelatorios(
    empresaId: string,
    inicio: string,
    fim: string
  ) {
    try {
      setCarregando(true);

      const params = new URLSearchParams({
        empresaId,
        dataInicio: inicio,
        dataFim: fim,
      });

      const res = await fetch(
        `/api/dashboard/agendamentos?${params.toString()}`,
        {
          cache: 'no-store',
        }
      );

      const data = await res.json();

      if (!data.success) {
        setAgendamentos([]);
        return;
      }

      setAgendamentos(data.agendamentos || []);
    } catch (error) {
      console.error(error);
      setAgendamentos([]);
    } finally {
      setCarregando(false);
    }
  }

  function aplicarFiltro() {
    if (!empresa?.id) return;

    carregarRelatorios(
      empresa.id,
      dataInicio,
      dataFim
    );
  }

  function filtrarHoje() {
    if (!empresa?.id) return;

    const hoje = formatarDataInput(new Date());

    setDataInicio(hoje);
    setDataFim(hoje);

    carregarRelatorios(
      empresa.id,
      hoje,
      hoje
    );
  }

  function filtrarUltimosDias(dias: number) {
    if (!empresa?.id) return;

    const fim = new Date();
    const inicio = new Date();

    inicio.setDate(fim.getDate() - dias + 1);

    const dataInicioFormatada = formatarDataInput(inicio);
    const dataFimFormatada = formatarDataInput(fim);

    setDataInicio(dataInicioFormatada);
    setDataFim(dataFimFormatada);

    carregarRelatorios(
      empresa.id,
      dataInicioFormatada,
      dataFimFormatada
    );
  }

  const temaEmpresa = gerarTemaEmpresa(empresa);

const tema = {
  gradientHeader: {
    background:
      'linear-gradient(145deg, rgba(15,23,42,0.94), rgba(17,24,39,0.86))',
    color: '#fff',
    borderRadius: 24,
    padding: 26,
    boxShadow: '0 18px 46px rgba(0,0,0,0.18)',
    border: '1px solid rgba(148,163,184,0.14)',
  },
  cardDark: {
    background:
      'linear-gradient(145deg, rgba(15,23,42,0.76), rgba(15,23,42,0.58))',
    border: '1px solid rgba(148,163,184,0.16)',
    borderRadius: 22,
    padding: 20,
    color: '#fff',
    boxShadow: '0 14px 38px rgba(0,0,0,0.16)',
  },
  badge: {
    display: 'inline-flex',
    width: 'fit-content',
    background: 'rgba(15,23,42,0.66)',
    color: '#c4b5fd',
    border: '1px solid rgba(168,85,247,0.20)',
    padding: '7px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
  },
  input: {
    width: '100%',
    padding: '12px 13px',
    borderRadius: 14,
    border: '1px solid rgba(148,163,184,0.22)',
    background: 'rgba(15,23,42,0.78)',
    color: '#f8fafc',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    colorScheme: 'dark' as const,
  },
  buttonPrimary: {
    border: '1px solid rgba(168,85,247,0.40)',
    borderRadius: 14,
    padding: '12px 16px',
    background:
      'linear-gradient(135deg, rgba(124,58,237,0.92), rgba(168,85,247,0.78))',
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 10px 24px rgba(124,58,237,0.18)',
  },
  buttonSecondary: {
    border: '1px solid rgba(148,163,184,0.20)',
    borderRadius: 14,
    padding: '11px 14px',
    background: 'rgba(15,23,42,0.52)',
    color: '#e2e8f0',
    fontWeight: 900,
    cursor: 'pointer',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
    gap: isMobile ? 14 : 20,
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
    gap: isMobile ? 14 : 20,
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))',
    gap: isMobile ? 14 : 20,
  },
};

  const relatorio = useMemo(() => {
    const validos = agendamentos.filter(
      (item) => item.status !== 'cancelado'
    );

    const concluidos = agendamentos.filter(
      (item) => item.status === 'concluido'
    );

    const cancelados = agendamentos.filter(
      (item) => item.status === 'cancelado'
    );

    const emAtendimento = agendamentos.filter(
      (item) => item.status === 'em_atendimento'
    );

    const faturamento = validos.reduce(
      (total, item) =>
        total + Number(item.valorTotal || 0),
      0
    );

    const ticketMedio =
      validos.length > 0
        ? faturamento / validos.length
        : 0;

    const clientesUnicos = new Set(
      validos.map(
        (item) =>
          item.clienteId ||
          item.cliente?.id ||
          item.nomeCliente
      )
    ).size;

    const servicos = agrupar(
      validos,
      (item) =>
        item.servico?.nome ||
        item.Servico?.nome ||
        'Serviço'
    );

    const profissionais = agrupar(
      validos,
      (item) =>
        item.profissional?.nome ||
        item.Profissional?.nome ||
        'Profissional'
    );

    return {
      faturamento,
      ticketMedio,
      clientesUnicos,
      totalAtendimentos: validos.length,
      concluidos: concluidos.length,
      cancelados: cancelados.length,
      emAtendimento: emAtendimento.length,
      servicos,
      profissionais,
    };
  }, [agendamentos]);

  if (!empresa || !usuario) {
    return null;
  }

  const licencaEmpresa = obterStatusLicencaEmpresa(empresa);

  if (licencaEmpresa.bloquearRelatorios) {
    return <LicencaBloqueada empresa={empresa} usuario={usuario} modulo="Relatórios" />;
  }

  return (
    <PremiumLayout empresa={empresa} usuario={usuario}>
      <div style={{ ...page, ...(isMobile ? pageMobile : {}) }}>
        <div
          style={{
            ...tema.gradientHeader,
            ...(isMobile ? headerMobile : {}),
            marginBottom: isMobile ? 14 : 20,
          }}
        >
          <span style={tema.badge}>
            📊 Central de relatórios
          </span>

          <h1
            style={{
              marginTop: 16,
              fontSize: isMobile ? 28 : 38,
              lineHeight: 1.05,
              fontWeight: 900,
              marginBottom: 10,
              letterSpacing: '-0.045em',
            }}
          >
            Relatórios Marcaê
          </h1>

          <p
            style={{
              margin: 0,
              color: '#cbd5e1',
              lineHeight: isMobile ? 1.48 : 1.65,
              maxWidth: 760,
              fontSize: isMobile ? 14 : 15,
              fontWeight: 600,
            }}
          >
            Visão financeira, operacional,
            atendimentos, serviços e desempenho
            estratégico do negócio.
          </p>
        </div>

        <div
          style={{
            ...tema.cardDark,
            ...(isMobile ? cardDarkMobile : {}),
            marginBottom: isMobile ? 14 : 20,
          }}
        >
          <div style={periodoHeader}>
            <strong style={periodoTitulo}>
              Período
            </strong>

            <span style={periodoHint}>
              Filtre a visão dos relatórios
            </span>
          </div>

          <div style={{ ...datasGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
            <div>
              <label style={label}>
                Data inicial
              </label>

              <input
                type="date"
                value={dataInicio}
                onChange={(e) =>
                  setDataInicio(e.target.value)
                }
                style={tema.input}
              />
            </div>

            <div>
              <label style={label}>
                Data final
              </label>

              <input
                type="date"
                value={dataFim}
                onChange={(e) =>
                  setDataFim(e.target.value)
                }
                style={tema.input}
              />
            </div>
          </div>

          <button
            style={{
              ...tema.buttonPrimary,
              width: '100%',
              marginTop: 14,
            }}
            onClick={aplicarFiltro}
          >
            🔎 Buscar período
          </button>

          <div style={quickFiltersArea}>
            <span style={quickFiltersTitle}>
              Filtros rápidos
            </span>

            <div style={quickFiltersGrid}>
              <button
                style={tema.buttonSecondary}
                onClick={filtrarHoje}
              >
                Hoje
              </button>

              <button
                style={tema.buttonSecondary}
                onClick={() =>
                  filtrarUltimosDias(7)
                }
              >
                7 dias
              </button>

              <button
                style={tema.buttonSecondary}
                onClick={() =>
                  filtrarUltimosDias(30)
                }
              >
                30 dias
              </button>
            </div>
          </div>
        </div>

        <div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
    marginTop: 0,
  }}
>
  <KpiCard
    titulo="Receita"
    valor={dinheiro(
      relatorio.faturamento
    )}
  />

  <KpiCard
    titulo="Clientes"
    valor={String(
      relatorio.clientesUnicos
    )}
  />

  <KpiCard
    titulo="Ticket médio"
    valor={dinheiro(
      relatorio.ticketMedio
    )}
  />

  <KpiCard
    titulo="Atendimentos"
    valor={String(
      relatorio.totalAtendimentos
    )}
  />
</div>

        <div
          style={{
            ...tema.grid2,
            marginTop: isMobile ? 14 : 20,
          }}
        >
          <RelatorioCard
            titulo="Financeiro"
            itens={[
              {
                label: 'Receita total',
                valor: dinheiro(
                  relatorio.faturamento
                ),
              },
              {
                label: 'Ticket médio',
                valor: dinheiro(
                  relatorio.ticketMedio
                ),
              },
              {
                label: 'Clientes atendidos',
                valor: String(
                  relatorio.clientesUnicos
                ),
              },
            ]}
          />

          <RelatorioCard
            titulo="Atendimentos"
            itens={[
              {
                label: 'Concluídos',
                valor: String(
                  relatorio.concluidos
                ),
              },
              {
                label: 'Cancelados',
                valor: String(
                  relatorio.cancelados
                ),
              },
              {
                label: 'Em atendimento',
                valor: String(
                  relatorio.emAtendimento
                ),
              },
            ]}
          />
        </div>

        <div
          style={{
            ...tema.grid2,
            marginTop: isMobile ? 14 : 20,
          }}
        >
          <RankingCard
            titulo="Serviços mais realizados"
            dados={relatorio.servicos}
          />

          <RankingCard
            titulo="Profissionais destaque"
            dados={relatorio.profissionais}
          />
        </div>

        <div
          style={{
            marginTop: isMobile ? 14 : 20,
            marginBottom: isMobile ? 10 : 12,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: '#fff',
              fontSize: isMobile ? 18 : 22,
              fontWeight: 900,
              letterSpacing: '-0.03em',
            }}
          >
            Relatórios disponíveis
          </h2>

          <p
            style={{
              margin: '6px 0 0',
              color: '#94a3b8',
              fontSize: isMobile ? 12 : 14,
              lineHeight: 1.45,
            }}
          >
            Selecione uma visão para abrir abaixo.
          </p>
        </div>

        <div
          style={{
            ...relatoriosGrid,
            gridTemplateColumns: isMobile
              ? '1fr'
              : 'repeat(3, minmax(0, 1fr))',
          }}
        >
          <FeatureCard
            icone="🧾"
            titulo="Fechamento de caixa"
            descricao="Caixas aprovados por período."
            ativo={relatorioAtivo === 'caixa'}
            onClick={() => setRelatorioAtivo('caixa')}
          />

          <FeatureCard
            icone="💳"
            titulo="Créditos e débitos"
            descricao="Histórico financeiro dos clientes."
            ativo={relatorioAtivo === 'clientes'}
            onClick={() => setRelatorioAtivo('clientes')}
          />

          <FeatureCard
            icone="📊"
            titulo="Relatório de lucro"
            descricao="Custos, comissão e margem."
            ativo={relatorioAtivo === 'lucro'}
            onClick={() => setRelatorioAtivo('lucro')}
          />

          <FeatureCard
            icone="％"
            titulo="Comissões"
            descricao="Comissão por profissional."
            ativo={relatorioAtivo === 'comissoes'}
            onClick={() => setRelatorioAtivo('comissoes')}
          />

          <FeatureCard
            icone="💰"
            titulo="Pré-pagamentos"
            descricao="Entradas antecipadas."
            ativo={relatorioAtivo === 'prepagamentos'}
            onClick={() => setRelatorioAtivo('prepagamentos')}
          />

          <FeatureCard
            icone="🏷️"
            titulo="Promoções"
            descricao="Campanhas e descontos."
            ativo={relatorioAtivo === 'promocoes'}
            onClick={() => setRelatorioAtivo('promocoes')}
          />
        </div>

{relatorioAtivo === 'caixa' && (
  <RelatorioCaixa
  empresaId={empresa.id}
  dataInicio={dataInicio}
  dataFim={dataFim}
  empresa={empresa}
/>
)}

{relatorioAtivo === 'clientes' && (
  <RelatorioClientesFinanceiro
  empresaId={empresa.id}
  empresa={empresa}
  dataInicio={dataInicio}
  dataFim={dataFim}
/>
)}

{relatorioAtivo === 'comissoes' && (
  <RelatorioComissoes
  empresaId={empresa.id}
  dataInicio={dataInicio}
  dataFim={dataFim}
  empresa={empresa}
/>
)}

{relatorioAtivo === 'lucro' && (
  <RelatorioLucro
    empresaId={empresa.id}
    dataInicio={dataInicio}
    dataFim={dataFim}
    empresa={empresa}
  />
)}

{relatorioAtivo === 'prepagamentos' && (
  <RelatorioPrePagamentos
    agendamentos={agendamentos}
    empresa={empresa}
    dataInicio={dataInicio}
    dataFim={dataFim}
  />
)}

{relatorioAtivo === 'promocoes' && (
  <RelatorioPromocoes
  empresaId={empresa.id}
  dataInicio={dataInicio}
  dataFim={dataFim}
  empresa={empresa}
/>
)}

        {carregando && (
          <div
            style={{
              marginTop: 24,
              color: '#94a3b8',
            }}
          >
            Carregando relatórios...
          </div>
        )}
      </div>
    </PremiumLayout>
  );
}

function KpiCard({
  titulo,
  valor,
}: any) {
  return (
    <div style={kpiCard}>
      <span style={kpiTitulo}>
        {titulo}
      </span>

      <strong style={kpiValor}>
        {valor}
      </strong>
    </div>
  );
}

function RelatorioCard({
  titulo,
  itens,
}: any) {
  return (
    <div style={card}>
      <div style={cardHeader}>
        <h2 style={cardTitulo}>
          {titulo}
        </h2>
      </div>

      <div style={lista}>
        {itens.map((item: any) => (
          <div
            key={item.label}
            style={linha}
          >
            <span style={linhaLabel}>
              {item.label}
            </span>

            <strong style={linhaValor}>
              {item.valor}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingCard({
  titulo,
  dados,
}: any) {
  return (
    <div style={rankingCard}>
      <div style={cardHeader}>
        <h2 style={cardTitulo}>
          {titulo}
        </h2>

        <span style={rankingBadge}>
          Top {dados.length || 0}
        </span>
      </div>

      {dados.length > 0 ? (
        <div style={lista}>
          {dados.map((item: any) => (
            <div
              key={item.nome}
              style={linha}
            >
              <span style={linhaLabel}>
                {item.nome}
              </span>

              <strong style={linhaValor}>
                {item.quantidade}
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <p style={emptyRanking}>
          Sem dados no período.
        </p>
      )}
    </div>
  );
}

function FeatureCard({
  icone,
  titulo,
  descricao,
  ativo,
  onClick,
}: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...featureCard,
        borderColor: ativo
          ? 'rgba(168,85,247,0.72)'
          : 'rgba(148,163,184,0.14)',
        background: ativo
          ? 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(15,23,42,0.86))'
          : 'rgba(15,23,42,0.66)',
        boxShadow: ativo
          ? '0 0 0 1px rgba(168,85,247,0.22), 0 14px 34px rgba(168,85,247,0.12)'
          : '0 10px 26px rgba(0,0,0,0.12)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={featureIcone}>
        {icone}
      </span>

      <span style={featureTextos}>
        <strong style={featureTitulo}>
          {titulo}
        </strong>

        <small style={featureDescricao}>
          {descricao}
        </small>
      </span>

      <span
        style={{
          ...featureSeta,
          opacity: ativo ? 1 : 0.58,
        }}
      >
        ›
      </span>
    </button>
  );
}

function agrupar(
  lista: any[],
  obterNome: (item: any) => string
) {
  const mapa: Record<string, number> = {};

  lista.forEach((item) => {
    const nome = obterNome(item);

    mapa[nome] =
      (mapa[nome] || 0) + 1;
  });

  return Object.entries(mapa)
    .map(([nome, quantidade]) => ({
      nome,
      quantidade,
    }))
    .sort(
      (a, b) =>
        b.quantidade - a.quantidade
    )
    .slice(0, 8);
}

function dinheiro(valor: number) {
  return Number(valor || 0).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    }
  );
}

function formatarDataInput(data: Date) {
  const ano = data.getFullYear();
  const mes = String(
    data.getMonth() + 1
  ).padStart(2, '0');
  const dia = String(
    data.getDate()
  ).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

const page: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  width: '100%',
};

const pageMobile: React.CSSProperties = {
  paddingBottom: 112,
  overflowX: 'hidden',
};

const headerMobile: React.CSSProperties = {
  padding: 22,
  borderRadius: 24,
};

const cardDarkMobile: React.CSSProperties = {
  padding: 18,
  borderRadius: 22,
};

const filtroGridMobile: React.CSSProperties = {
  gridTemplateColumns: '1fr',
  gap: 14,
};

const filtroGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
  gap: 16,
  alignItems: 'end',
};

const periodoHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 14,
  paddingBottom: 12,
  borderBottom: '1px solid rgba(148,163,184,0.12)',
};

const periodoTitulo: React.CSSProperties = {
  color: '#f8fafc',
  fontSize: 18,
  fontWeight: 900,
  letterSpacing: '-0.03em',
};

const periodoHint: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.35,
  textAlign: 'right',
};

const datasGrid: React.CSSProperties = {
  display: 'grid',
  gap: 12,
};

const quickFiltersArea: React.CSSProperties = {
  marginTop: 14,
  paddingTop: 14,
  borderTop: '1px solid rgba(148,163,184,0.12)',
};

const quickFiltersTitle: React.CSSProperties = {
  display: 'block',
  marginBottom: 10,
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 900,
};

const quickFiltersGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 10,
};

const label: React.CSSProperties = {
  display: 'block',
  marginBottom: 7,
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 800,
};

const card: React.CSSProperties = {
  background:
    'rgba(15,23,42,0.66)',
  border:
    '1px solid rgba(148,163,184,0.14)',
  borderRadius: 20,
  padding: 16,
  color: '#fff',
  overflow: 'hidden',
  boxShadow: '0 12px 30px rgba(0,0,0,0.14)',
};

const rankingCard: React.CSSProperties = {
  ...card,
  padding: '14px 16px',
  minHeight: 84,
};

const rankingBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 42,
  padding: '5px 9px',
  borderRadius: 999,
  background: 'rgba(124,58,237,0.18)',
  border: '1px solid rgba(168,85,247,0.22)',
  color: '#c4b5fd',
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: 'nowrap',
};

const emptyRanking: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: 13,
  lineHeight: 1.35,
};

const relatoriosGrid: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 0,
};

const featureCard: React.CSSProperties = {
  border:
    '1px solid rgba(148,163,184,0.14)',
  borderRadius: 18,
  padding: '12px 14px',
  color: '#fff',
  minHeight: 64,
  width: '100%',
  display: 'grid',
  gridTemplateColumns: '38px minmax(0, 1fr) 18px',
  alignItems: 'center',
  gap: 10,
  overflow: 'hidden',
};

const featureIcone: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 12,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(124,58,237,0.20)',
  border: '1px solid rgba(255,255,255,0.08)',
  fontSize: 17,
  flexShrink: 0,
};

const featureTextos: React.CSSProperties = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

const featureTitulo: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  lineHeight: 1.2,
  fontWeight: 900,
  color: '#f8fafc',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const featureDescricao: React.CSSProperties = {
  display: 'block',
  margin: 0,
  fontSize: 12,
  lineHeight: 1.35,
  color: '#94a3b8',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const featureSeta: React.CSSProperties = {
  color: '#f8fafc',
  fontSize: 25,
  lineHeight: 1,
  fontWeight: 300,
  justifySelf: 'end',
};

const cardHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  marginBottom: 12,
};

const cardTitulo: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  lineHeight: 1.15,
  fontWeight: 900,
  letterSpacing: '-0.03em',
};

const lista: React.CSSProperties = {
  display: 'grid',
  gap: 8,
};

const linha: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  paddingBottom: 8,
  borderBottom:
    '1px solid rgba(148,163,184,0.10)',
  minWidth: 0,
};

const linhaLabel: React.CSSProperties = {
  color: '#e2e8f0',
  fontSize: 14,
  lineHeight: 1.25,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const linhaValor: React.CSSProperties = {
  color: '#f8fafc',
  fontSize: 14,
  fontWeight: 900,
  whiteSpace: 'nowrap',
};

const kpiCard: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(124,58,237,.24), rgba(168,85,247,.18))',
  border:
    '1px solid rgba(255,255,255,0.08)',
  borderRadius: 22,
  padding: 18,
  color: '#fff',
  overflow: 'hidden',
  minHeight: 110,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

const kpiTitulo: React.CSSProperties = {
  display: 'block',
  marginBottom: 12,
  color: '#cbd5e1',
  fontWeight: 700,
};

const kpiValor: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 900,
  wordBreak: 'break-word',
};

function LicencaBloqueada({ empresa, usuario, modulo }: any) {
  return (
    <PremiumLayout empresa={empresa} usuario={usuario}>
      <main style={{ minHeight: '100vh', padding: 24, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #020617, #0f172a)' }}>
        <section style={{ width: 'min(560px, 100%)', borderRadius: 28, padding: 28, background: 'linear-gradient(145deg, rgba(15,23,42,0.96), rgba(30,41,59,0.88))', border: '1px solid rgba(248,113,113,0.24)', boxShadow: '0 24px 70px rgba(0,0,0,0.36)', color: '#fff', textAlign: 'center' }}>
          <div style={{ width: 58, height: 58, margin: '0 auto 14px', borderRadius: 20, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #f97316, #7c3aed)', fontSize: 26 }}>🔒</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 28, letterSpacing: '-0.04em' }}>{modulo} bloqueado temporariamente</h1>
          <p style={{ margin: '0 0 18px', color: '#cbd5e1', lineHeight: 1.6, fontWeight: 700 }}>
            Este recurso foi bloqueado devido ao atraso da assinatura. Regularize sua mensalidade para liberar novamente este módulo.
          </p>
          <a href="/planos" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, padding: '0 18px', borderRadius: 16, background: 'linear-gradient(135deg, #f97316, #7c3aed)', color: '#fff', textDecoration: 'none', fontWeight: 950 }}>
            Regularizar pagamento
          </a>
        </section>
      </main>
    </PremiumLayout>
  );
}
