'use client';

import { useEffect, useState } from 'react';

import { exportarExcel } from '@/app/lib/exportacao/excel';
import { exportarPdf } from '@/app/lib/exportacao/pdf';

import {
  formatarData,
  formatarDinheiro,
  formatarPeriodo,
  limparTexto,
} from '@/app/lib/exportacao/formatadores';

import {
  relatorioAcoesHeader,
  relatorioBadge,
  relatorioButton,
  relatorioButtonSecondary,
  relatorioCard,
  relatorioContainer,
  relatorioContadorTexto,
  relatorioDescription,
  relatorioEmpty,
  relatorioGrid,
  relatorioGridComMargem,
  relatorioHeader,
  relatorioLoading,
  relatorioMobileCss,
  relatorioPeriodoTexto,
  relatorioRankingRow,
  relatorioRow,
  relatorioStatusBadge,
  relatorioTable,
  relatorioTableBox,
  relatorioTableHeader,
  relatorioThead,
  relatorioTitle,
} from '@/components/ui/relatorios/relatorioStyles';

type Props = {
  empresaId: string;
  dataInicio: string;
  dataFim: string;
  empresa?: any;
};

export default function RelatorioComissoes({
  empresaId,
  dataInicio,
  dataFim,
  empresa,
}: Props) {
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState<any>(null);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  useEffect(() => {
    carregar();
  }, [empresaId, dataInicio, dataFim]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroStatus, itensPorPagina]);

  async function carregar() {
    if (!empresaId) return;

    try {
      setCarregando(true);

      const params = new URLSearchParams({
        empresaId,
        dataInicio,
        dataFim,
      });

      const res = await fetch(`/api/comissoes?${params.toString()}`, {
        cache: 'no-store',
      });

      const data = await res.json();

      if (!data.success) {
        setDados(null);
        return;
      }

      setDados(data);
    } catch (error) {
      console.error(error);
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }

  const resumo = dados?.resumo || {
    totalFaturado: 0,
    totalComissoes: 0,
    totalServicos: 0,
    totalProfissionais: 0,
    totalPago: 0,
    totalPendente: 0,
  };

  const profissionais = dados?.profissionais || [];
  const comissoesOriginais = dados?.comissoes || [];

  const comissoes =
    filtroStatus === 'todos'
      ? comissoesOriginais
      : comissoesOriginais.filter((item: any) => {
          const status = String(item.status || '').toLowerCase();

          if (filtroStatus === 'pendente') {
            return status !== 'pago';
          }

          if (filtroStatus === 'pago') {
            return status === 'pago';
          }

          return true;
        });

  const totalPaginas = Math.max(
    1,
    Math.ceil(comissoes.length / itensPorPagina)
  );

  const inicio =
    (paginaAtual - 1) *
    itensPorPagina;

  const fim = inicio + itensPorPagina;

  const comissoesPaginadas =
    comissoes.slice(inicio, fim);

  function labelFiltroStatus() {
    if (filtroStatus === 'pendente') return 'Abertas / Pendentes';
    if (filtroStatus === 'pago') return 'Fechadas / Pagas';
    return 'Todas';
  }

  function exportarRelatorioPdf() {
    exportarPdf({
      titulo: 'Relatório de comissões',
      subtitulo:
        'Acompanhamento de valores faturados, comissões geradas, pagas, pendentes e ranking por profissional.',
      empresa,
      periodo: formatarPeriodo(dataInicio, dataFim),
      nomeArquivo: `relatorio-comissoes-${dataInicio}-${dataFim}`,
      kpis: [
        {
          label: 'Faturado',
          valor: formatarDinheiro(resumo.totalFaturado),
        },
        {
          label: 'Comissões',
          valor: formatarDinheiro(resumo.totalComissoes),
        },
        {
          label: 'Pagas',
          valor: formatarDinheiro(resumo.totalPago),
        },
        {
          label: 'Pendentes',
          valor: formatarDinheiro(resumo.totalPendente),
        },
        {
          label: 'Serviços',
          valor: String(resumo.totalServicos || 0),
        },
        {
          label: 'Profissionais',
          valor: String(resumo.totalProfissionais || 0),
        },
        {
          label: 'Média comissão',
          valor: formatarDinheiro(
            resumo.totalServicos > 0
              ? resumo.totalComissoes / resumo.totalServicos
              : 0
          ),
        },
        {
          label: 'Percentual médio',
          valor: `${
            resumo.totalFaturado > 0
              ? ((resumo.totalComissoes / resumo.totalFaturado) * 100).toFixed(1)
              : '0.0'
          }%`,
        },
      ],
      tabelas: [
        {
          titulo: 'Ranking por profissional',
          colunas: ['Profissional', 'Serviços', 'Faturado', 'Comissão'],
          linhas: profissionais.map((prof: any) => [
            limparTexto(prof.profissionalNome),
            String(prof.totalServicos || 0),
            formatarDinheiro(prof.totalFaturado),
            formatarDinheiro(prof.totalComissao),
          ]),
        },
        {
          titulo: `Comissões detalhadas — ${labelFiltroStatus()}`,
          colunas: [
            'Data',
            'Profissional',
            'Cliente',
            'Serviço',
            'Valor serviço',
            'Comissão',
            'Status',
          ],
          linhas: comissoes.map((item: any) => [
            formatarData(item.data || item.createdAt),
            limparTexto(item.profissionalNome),
            limparTexto(item.cliente),
            limparTexto(item.servico),
            formatarDinheiro(item.valorServico),
            formatarDinheiro(item.valorComissao),
            limparTexto(item.status || 'pendente'),
          ]),
        },
      ],
      observacoes: [
        `Filtro aplicado: ${labelFiltroStatus()}.`,
        'O relatório exporta todos os registros do filtro atual, não apenas registros visíveis na tela.',
      ],
    });
  }

  function exportarRelatorioExcel() {
    exportarExcel({
      nomeArquivo: `relatorio-comissoes-${dataInicio}-${dataFim}`,
      abas: [
        {
          nome: 'Resumo',
          dados: [
            {
              Indicador: 'Período',
              Valor: formatarPeriodo(dataInicio, dataFim),
            },
            {
              Indicador: 'Filtro',
              Valor: labelFiltroStatus(),
            },
            {
              Indicador: 'Faturado',
              Valor: Number(resumo.totalFaturado || 0),
            },
            {
              Indicador: 'Comissões',
              Valor: Number(resumo.totalComissoes || 0),
            },
            {
              Indicador: 'Pagas',
              Valor: Number(resumo.totalPago || 0),
            },
            {
              Indicador: 'Pendentes',
              Valor: Number(resumo.totalPendente || 0),
            },
            {
              Indicador: 'Serviços com comissão',
              Valor: Number(resumo.totalServicos || 0),
            },
            {
              Indicador: 'Profissionais',
              Valor: Number(resumo.totalProfissionais || 0),
            },
          ],
        },
        {
          nome: 'Ranking Profissionais',
          dados: profissionais.map((prof: any) => ({
            Profissional: limparTexto(prof.profissionalNome),
            Serviços: Number(prof.totalServicos || 0),
            Faturado: Number(prof.totalFaturado || 0),
            Comissão: Number(prof.totalComissao || 0),
          })),
        },
        {
          nome: 'Comissões',
          dados: comissoes.map((item: any) => ({
            Data: formatarData(item.data || item.createdAt),
            Profissional: limparTexto(item.profissionalNome),
            Cliente: limparTexto(item.cliente),
            Serviço: limparTexto(item.servico),
            'Valor serviço': Number(item.valorServico || 0),
            Comissão: Number(item.valorComissao || 0),
            Status: limparTexto(item.status || 'pendente'),
          })),
        },
      ],
    });
  }

  return (
    <section className="relatorio-mobile-smart" style={relatorioContainer}>
      <style jsx global>{relatorioMobileCss}</style>

      <div className="relatorio-mobile-header" style={relatorioHeader}>
        <div>
          <span
            style={relatorioBadge(
              'rgba(34,197,94,0.16)',
              '#86efac',
              'rgba(34,197,94,0.32)'
            )}
          >
            Relatório premium
          </span>

          <h2 style={relatorioTitle}>Comissões</h2>

          <p style={relatorioDescription}>
            Acompanhe valores gerados, comissões pagas, pendentes e desempenho por profissional.
          </p>

          <p style={relatorioPeriodoTexto}>
            Período: {formatarPeriodo(dataInicio, dataFim)}
          </p>
        </div>

        <div className="relatorio-mobile-actions" style={relatorioAcoesHeader}>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            style={selectFiltro}
          >
            <option value="todos">Todas</option>
            <option value="pendente">Abertas / Pendentes</option>
            <option value="pago">Fechadas / Pagas</option>
          </select>

          <button
            type="button"
            style={relatorioButtonSecondary('34,197,94')}
            onClick={exportarRelatorioPdf}
          >
            Exportar PDF
          </button>

          <button
            type="button"
            style={relatorioButtonSecondary('34,197,94')}
            onClick={exportarRelatorioExcel}
          >
            Exportar Excel
          </button>

          <button
            type="button"
            style={relatorioButton('#16a34a', '#22c55e')}
            onClick={carregar}
          >
            Atualizar
          </button>
        </div>
      </div>

      {carregando && (
        <div style={relatorioLoading}>
          Carregando relatório de comissões...
        </div>
      )}

      <div className="relatorio-mobile-grid" style={relatorioGrid}>
        <Kpi label="Faturado" value={dinheiro(resumo.totalFaturado)} />
        <Kpi label="Comissões" value={dinheiro(resumo.totalComissoes)} />
        <Kpi label="Pagas" value={dinheiro(resumo.totalPago)} />
        <Kpi label="Pendentes" value={dinheiro(resumo.totalPendente)} />
      </div>

      <div className="relatorio-mobile-grid" style={relatorioGridComMargem}>
        <Kpi label="Serviços com comissão" value={resumo.totalServicos} />
        <Kpi label="Profissionais" value={resumo.totalProfissionais} />
        <Kpi
          label="Média comissão"
          value={dinheiro(
            resumo.totalServicos > 0
              ? resumo.totalComissoes / resumo.totalServicos
              : 0
          )}
        />
        <Kpi
          label="Percentual médio"
          value={`${
            resumo.totalFaturado > 0
              ? ((resumo.totalComissoes / resumo.totalFaturado) * 100).toFixed(1)
              : '0.0'
          }%`}
        />
      </div>

      <div
        className="relatorio-mobile-panel-grid"
        style={sectionGrid}
      >
        <div style={panel}>
          <div
            className="relatorio-mobile-panel-header"
            style={panelHeader}
          >
            <strong>Ranking por profissional</strong>
            <span>{profissionais.length} profissional(is)</span>
          </div>

          {profissionais.length === 0 ? (
            <div style={relatorioEmpty}>
              Nenhuma comissão encontrada no período.
            </div>
          ) : (
            <div style={list}>
              {profissionais.map((prof: any) => (
                <div
                  key={prof.profissionalId}
                  className="relatorio-mobile-ranking-row"
                  style={relatorioRankingRow}
                >
                  <div>
                    <strong>{prof.profissionalNome}</strong>
                    <span>{prof.totalServicos} serviço(s)</span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#22c55e' }}>
                      {dinheiro(prof.totalComissao)}
                    </strong>

                    <span>
                      {dinheiro(prof.totalFaturado)} faturado
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={panel}>
          <div
            className="relatorio-mobile-panel-header"
            style={panelHeader}
          >
            <strong>Resumo de pagamento</strong>
            <span>Status financeiro</span>
          </div>

          <div style={statusBox}>
            <ResumoLinha
              label="Total pago"
              value={dinheiro(resumo.totalPago)}
              color="#22c55e"
            />

            <ResumoLinha
              label="Total pendente"
              value={dinheiro(resumo.totalPendente)}
              color="#f59e0b"
            />

            <ResumoLinha
              label="Total geral"
              value={dinheiro(resumo.totalComissoes)}
              color="#a78bfa"
            />
          </div>
        </div>
      </div>

      <div
        className="relatorio-mobile-tablebox"
        style={relatorioTableBox}
      >
        <div
          className="relatorio-mobile-tableheader"
          style={relatorioTableHeader}
        >
          <div>
            <strong>
              Comissões detalhadas
            </strong>

            <span style={relatorioContadorTexto}>
              {comissoes.length === 0
                ? 'Nenhum registro'
                : `Exibindo ${
                    inicio + 1
                  }–${Math.min(
                    fim,
                    comissoes.length
                  )} de ${
                    comissoes.length
                  } registros`}
            </span>
          </div>

          <div style={controlesTabela}>
            <div style={paginacaoTopo}>
              <label style={labelMini}>
                Por página
              </label>

              <select
                value={itensPorPagina}
                onChange={(e) =>
                  setItensPorPagina(
                    Number(e.target.value)
                  )
                }
                style={selectPaginacao}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <span>
              {comissoes.length} registro(s)
            </span>
          </div>
        </div>

        {comissoes.length === 0 ? (
          <div style={relatorioEmpty}>
            Nenhuma comissão detalhada encontrada no período.
          </div>
        ) : (
          <div
            className="relatorio-mobile-table"
            style={relatorioTable}
          >
            <div
              className="relatorio-mobile-thead"
              style={relatorioThead}
            >
              <span>Data</span>
              <span>Profissional</span>
              <span>Cliente</span>
              <span>Serviço</span>
              <span>Valor serviço</span>
              <span>Comissão</span>
              <span>Status</span>
            </div>

            {comissoesPaginadas.map((item: any) => (
              <div
                key={item.id}
                className="relatorio-mobile-row"
                style={relatorioRow}
              >
                <span>{formatarData(item.data || item.createdAt)}</span>

                <span>{item.profissionalNome || '-'}</span>

                <span>{item.cliente || '-'}</span>

                <span>{item.servico || '-'}</span>

                <strong>{dinheiro(item.valorServico)}</strong>

                <strong style={{ color: '#22c55e' }}>
                  {dinheiro(item.valorComissao)}
                </strong>

                <span
                  style={relatorioStatusBadge(
                    item.status === 'pago'
                      ? '#22c55e'
                      : '#f59e0b'
                  )}
                >
                  {item.status || 'pendente'}
                </span>
              </div>
            ))}
          </div>
        )}

        {comissoes.length > 0 && (
          <div style={paginacaoRodape}>
            <button
              type="button"
              disabled={paginaAtual <= 1}
              onClick={() =>
                setPaginaAtual((pagina) =>
                  Math.max(1, pagina - 1)
                )
              }
              style={{
                ...botaoPagina,
                opacity:
                  paginaAtual <= 1
                    ? 0.45
                    : 1,
              }}
            >
              ← Anterior
            </button>

            <span style={paginaTexto}>
              Página {paginaAtual} de{' '}
              {totalPaginas}
            </span>

            <button
              type="button"
              disabled={
                paginaAtual >= totalPaginas
              }
              onClick={() =>
                setPaginaAtual((pagina) =>
                  Math.min(
                    totalPaginas,
                    pagina + 1
                  )
                )
              }
              style={{
                ...botaoPagina,
                opacity:
                  paginaAtual >=
                  totalPaginas
                    ? 0.45
                    : 1,
              }}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Kpi({ label, value }: any) {
  return (
    <div style={relatorioCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ResumoLinha({ label, value, color }: any) {
  return (
    <div style={resumoLinha}>
      <span>{label}</span>
      <strong style={{ color }}>{value}</strong>
    </div>
  );
}

function dinheiro(valor: any) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

const selectFiltro: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 14,
  padding: '12px 14px',
  background: 'rgba(15,23,42,0.95)',
  color: '#fff',
  fontWeight: 700,
  outline: 'none',
  minWidth: 210,
};

const sectionGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
  gap: 16,
  marginTop: 18,
};

const panel: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid rgba(255,255,255,0.08)',
  overflow: 'hidden',
  background: 'rgba(2,6,23,0.35)',
};

const panelHeader: React.CSSProperties = {
  padding: 16,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  background: 'rgba(255,255,255,0.04)',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  color: '#fff',
};

const list: React.CSSProperties = {
  display: 'grid',
};

const statusBox: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  padding: 16,
};

const resumoLinha: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  paddingBottom: 10,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const controlesTabela: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
};

const paginacaoTopo: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const labelMini: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 800,
};

const selectPaginacao: React.CSSProperties = {
  border:
    '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  padding: '10px 12px',
  background:
    'rgba(15,23,42,0.95)',
  color: '#fff',
  fontWeight: 800,
  outline: 'none',
};

const paginacaoRodape: React.CSSProperties = {
  padding: 16,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 14,
  borderTop:
    '1px solid rgba(255,255,255,0.08)',
  background:
    'rgba(255,255,255,0.03)',
};

const botaoPagina: React.CSSProperties = {
  border:
    '1px solid rgba(34,197,94,0.45)',
  borderRadius: 12,
  padding: '10px 14px',
  background:
    'rgba(34,197,94,0.18)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const paginaTexto: React.CSSProperties = {
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 800,
};