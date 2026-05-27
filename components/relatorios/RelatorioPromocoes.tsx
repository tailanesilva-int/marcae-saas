'use client';

import type { CSSProperties } from 'react';
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
  relatorioMuted,
  relatorioPeriodoTexto,
  relatorioRankingBox,
  relatorioRankingHeader,
  relatorioRankingRow,
  relatorioRow,
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

export default function RelatorioPromocoes({
  empresaId,
  dataInicio,
  dataFim,
  empresa,
}: Props) {
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState<any>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  useEffect(() => {
    carregar();
  }, [empresaId, dataInicio, dataFim]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [itensPorPagina]);

  async function carregar() {
    try {
      setCarregando(true);

      const params = new URLSearchParams({
        empresaId,
        dataInicio,
        dataFim,
      });

      const response = await fetch(
        `/api/relatorios/promocoes?${params.toString()}`,
        {
          cache: 'no-store',
        }
      );

      const json = await response.json();

      if (!json.success) {
        setDados(null);
        return;
      }

      setDados(json);
      setPaginaAtual(1);
    } catch (error) {
      console.error(error);
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }

  const registros = dados?.registros || [];
  const resumo = dados?.resumo || {};
  const rankingPromocoes = dados?.rankingPromocoes || [];
  const rankingServicos = dados?.rankingServicos || [];
  const rankingClientes = dados?.rankingClientes || [];

  const totalPaginas = Math.max(
    1,
    Math.ceil(registros.length / itensPorPagina)
  );

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const listaPaginada = registros.slice(inicio, fim);

  const faturamentoPromocional = registros.reduce(
    (total: number, item: any) =>
      total +
      Number(
        item.valorFinal ||
          item.valorComDesconto ||
          0
      ),
    0
  );

  const economiaTotal = registros.reduce(
    (total: number, item: any) =>
      total + Number(item.valorEconomizado || 0),
    0
  );

  const ticketPromocional =
    registros.length > 0
      ? faturamentoPromocional / registros.length
      : 0;

  function exportarRelatorioPdf() {
    exportarPdf({
      titulo: 'Relatório de promoções',
      subtitulo:
        'Desempenho das promoções, descontos concedidos, faturamento promocional e campanhas mais utilizadas.',
      empresa,
      periodo: formatarPeriodo(dataInicio, dataFim),
      nomeArquivo: `relatorio-promocoes-${dataInicio}-${dataFim}`,
      kpis: [
        {
          label: 'Promoções utilizadas',
          valor: String(resumo.totalUsos || 0),
        },
        {
          label: 'Economia total',
          valor: formatarDinheiro(economiaTotal),
        },
        {
          label: 'Faturamento promocional',
          valor: formatarDinheiro(faturamentoPromocional),
        },
        {
          label: 'Ticket promocional',
          valor: formatarDinheiro(ticketPromocional),
        },
        {
          label: 'Desconto médio',
          valor: `${Number(resumo.percentualDescontoMedio || 0).toFixed(1)}%`,
        },
        {
          label: 'Campanhas',
          valor: String(rankingPromocoes.length),
        },
      ],
      tabelas: [
        {
          titulo: 'Promoções aplicadas',
          colunas: [
            'Data',
            'Cliente',
            'Promoção',
            'Serviço',
            'Economia',
            'Valor final',
          ],
          linhas: registros.map((item: any) => [
            formatarData(item.dataUso),
            limparTexto(item.clienteNome),
            limparTexto(item.promocaoTitulo),
            limparTexto(item.servicoNome),
            formatarDinheiro(item.valorEconomizado),
            formatarDinheiro(item.valorFinal || item.valorComDesconto),
          ]),
        },
        {
          titulo: 'Promoções mais usadas',
          colunas: ['Promoção', 'Usos', 'Economia'],
          linhas: rankingPromocoes.map((item: any) => [
            limparTexto(item.nome),
            String(item.quantidade || 0),
            formatarDinheiro(item.valorEconomizado),
          ]),
        },
        {
          titulo: 'Serviços mais impactados',
          colunas: ['Serviço', 'Usos', 'Economia'],
          linhas: rankingServicos.map((item: any) => [
            limparTexto(item.nome),
            String(item.quantidade || 0),
            formatarDinheiro(item.valorEconomizado),
          ]),
        },
        {
          titulo: 'Clientes que mais usam promoções',
          colunas: ['Cliente', 'Usos', 'Economia'],
          linhas: rankingClientes.map((item: any) => [
            limparTexto(item.nome),
            String(item.quantidade || 0),
            formatarDinheiro(item.valorEconomizado),
          ]),
        },
      ],
      observacoes: [
        'O relatório considera agendamentos com promoção aplicada via promocaoId, promocaoTitulo ou tabela promocaoUso.',
        'Os dados utilizam dataHoraInicio do agendamento como referência de período.',
      ],
    });
  }

  function exportarRelatorioExcel() {
    exportarExcel({
      nomeArquivo: `relatorio-promocoes-${dataInicio}-${dataFim}`,
      abas: [
        {
          nome: 'Resumo',
          dados: [
            {
              Indicador: 'Período',
              Valor: formatarPeriodo(dataInicio, dataFim),
            },
            {
              Indicador: 'Promoções utilizadas',
              Valor: Number(resumo.totalUsos || 0),
            },
            {
              Indicador: 'Economia total',
              Valor: Number(economiaTotal || 0),
            },
            {
              Indicador: 'Faturamento promocional',
              Valor: Number(faturamentoPromocional || 0),
            },
            {
              Indicador: 'Ticket promocional',
              Valor: Number(ticketPromocional || 0),
            },
            {
              Indicador: 'Desconto médio',
              Valor: `${Number(resumo.percentualDescontoMedio || 0).toFixed(1)}%`,
            },
          ],
        },
        {
          nome: 'Promoções aplicadas',
          dados: registros.map((item: any) => ({
            Data: formatarData(item.dataUso),
            Cliente: limparTexto(item.clienteNome),
            Promoção: limparTexto(item.promocaoTitulo),
            Serviço: limparTexto(item.servicoNome),
            Economia: Number(item.valorEconomizado || 0),
            'Valor final': Number(
              item.valorFinal ||
                item.valorComDesconto ||
                0
            ),
          })),
        },
        {
          nome: 'Ranking Promoções',
          dados: rankingPromocoes.map((item: any) => ({
            Promoção: limparTexto(item.nome),
            Usos: Number(item.quantidade || 0),
            Economia: Number(item.valorEconomizado || 0),
          })),
        },
        {
          nome: 'Ranking Serviços',
          dados: rankingServicos.map((item: any) => ({
            Serviço: limparTexto(item.nome),
            Usos: Number(item.quantidade || 0),
            Economia: Number(item.valorEconomizado || 0),
          })),
        },
        {
          nome: 'Ranking Clientes',
          dados: rankingClientes.map((item: any) => ({
            Cliente: limparTexto(item.nome),
            Usos: Number(item.quantidade || 0),
            Economia: Number(item.valorEconomizado || 0),
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
          <span style={relatorioBadge()}>
            Marketing e campanhas
          </span>

          <h2 style={relatorioTitle}>
            Relatório de promoções
          </h2>

          <p style={relatorioDescription}>
            Performance real das campanhas, descontos e promoções utilizadas pelos clientes.
          </p>

          <p style={relatorioPeriodoTexto}>
            Período: {formatarPeriodo(dataInicio, dataFim)}
          </p>
        </div>

        <div className="relatorio-mobile-actions" style={relatorioAcoesHeader}>
          <button
            type="button"
            style={relatorioButtonSecondary('59,130,246')}
            onClick={exportarRelatorioPdf}
          >
            Exportar PDF
          </button>

          <button
            type="button"
            style={relatorioButtonSecondary('59,130,246')}
            onClick={exportarRelatorioExcel}
          >
            Exportar Excel
          </button>

          <button
            type="button"
            style={relatorioButton('#8b5cf6', '#7c3aed')}
            onClick={carregar}
          >
            Atualizar
          </button>
        </div>
      </div>

      {carregando && (
        <div style={relatorioLoading}>
          Carregando relatório...
        </div>
      )}

      <div className="relatorio-mobile-grid" style={relatorioGrid}>
        <Card
          titulo="Promoções utilizadas"
          valor={String(resumo.totalUsos || 0)}
          cor="#a855f7"
        />

        <Card
          titulo="Economia total"
          valor={dinheiro(economiaTotal)}
          cor="#22c55e"
        />

        <Card
          titulo="Faturamento promocional"
          valor={dinheiro(faturamentoPromocional)}
          cor="#38bdf8"
        />

        <Card
          titulo="Ticket promocional"
          valor={dinheiro(ticketPromocional)}
          cor="#f59e0b"
        />
      </div>

      <div className="relatorio-mobile-grid" style={relatorioGridComMargem}>
        <Card
          titulo="Desconto médio"
          valor={`${Number(resumo.percentualDescontoMedio || 0).toFixed(1)}%`}
          cor="#fb7185"
        />

        <Card
          titulo="Campanhas"
          valor={String(rankingPromocoes.length)}
          cor="#14b8a6"
        />
      </div>

      <div className="relatorio-mobile-tablebox" style={relatorioTableBox}>
        <div className="relatorio-mobile-tableheader" style={relatorioTableHeader}>
          <div>
            <strong>
              Promoções aplicadas
            </strong>

            <span style={relatorioContadorTexto}>
              {registros.length === 0
                ? 'Nenhum registro'
                : `Exibindo ${inicio + 1}–${Math.min(fim, registros.length)} de ${registros.length} registros`}
            </span>
          </div>

          <div style={paginacaoTopo}>
            <label style={labelMini}>
              Por página
            </label>

            <select
              value={itensPorPagina}
              onChange={(e) =>
                setItensPorPagina(Number(e.target.value))
              }
              style={select}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {registros.length === 0 ? (
          <div style={relatorioEmpty}>
            Nenhuma promoção encontrada no período.
          </div>
        ) : (
          <>
            <div className="relatorio-mobile-table" style={relatorioTable}>
              <div className="relatorio-mobile-thead" style={relatorioThead}>
                <span>Data</span>
                <span>Cliente</span>
                <span>Promoção</span>
                <span>Serviço</span>
                <span>Economia</span>
                <span>Valor final</span>
              </div>

              {listaPaginada.map((item: any) => (
                <div
                  key={item.id}
                  className="relatorio-mobile-row"
                  style={relatorioRow}
                >
                  <span>
                    {formatarData(item.dataUso)}
                  </span>

                  <span>
                    {item.clienteNome}
                  </span>

                  <span>
                    {item.promocaoTitulo}
                  </span>

                  <span>
                    {item.servicoNome}
                  </span>

                  <strong style={{ color: '#22c55e' }}>
                    {dinheiro(item.valorEconomizado)}
                  </strong>

                  <strong>
                    {dinheiro(item.valorFinal || item.valorComDesconto)}
                  </strong>
                </div>
              ))}
            </div>

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
                  opacity: paginaAtual <= 1 ? 0.45 : 1,
                }}
              >
                ← Anterior
              </button>

              <span style={paginaTexto}>
                Página {paginaAtual} de {totalPaginas}
              </span>

              <button
                type="button"
                disabled={paginaAtual >= totalPaginas}
                onClick={() =>
                  setPaginaAtual((pagina) =>
                    Math.min(totalPaginas, pagina + 1)
                  )
                }
                style={{
                  ...botaoPagina,
                  opacity: paginaAtual >= totalPaginas ? 0.45 : 1,
                }}
              >
                Próxima →
              </button>
            </div>
          </>
        )}
      </div>

      <div style={rankingGrid}>
        <RankingBox
          titulo="Promoções mais usadas"
          dados={rankingPromocoes}
        />

        <RankingBox
          titulo="Serviços impactados"
          dados={rankingServicos}
        />

        <RankingBox
          titulo="Clientes que mais usam"
          dados={rankingClientes}
        />
      </div>
    </section>
  );
}

function RankingBox({
  titulo,
  dados,
}: any) {
  return (
    <div style={relatorioRankingBox}>
      <div style={relatorioRankingHeader}>
        <strong>{titulo}</strong>
      </div>

      {dados.length === 0 ? (
        <div style={relatorioEmpty}>
          Nenhum dado encontrado.
        </div>
      ) : (
        dados.map((item: any) => (
          <div
            key={item.nome}
            className="relatorio-mobile-ranking-row"
            style={relatorioRankingRow}
          >
            <div>
              <strong>
                {item.nome}
              </strong>

              <div style={relatorioMuted}>
                {item.quantidade} uso(s)
              </div>
            </div>

            <strong>
              {dinheiro(item.valorEconomizado)}
            </strong>
          </div>
        ))
      )}
    </div>
  );
}

function Card({
  titulo,
  valor,
  cor,
}: any) {
  return (
    <div
      style={{
        ...relatorioCard,
        borderColor: `${cor}55`,
      }}
    >
      <span>{titulo}</span>

      <strong
        style={{
          color: cor,
        }}
      >
        {valor}
      </strong>
    </div>
  );
}

function dinheiro(valor: any) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

const paginacaoTopo: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const labelMini: CSSProperties = {
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 800,
};

const select: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  padding: '10px 12px',
  background: 'rgba(15,23,42,0.95)',
  color: '#fff',
  fontWeight: 800,
  outline: 'none',
};

const paginacaoRodape: CSSProperties = {
  padding: 16,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 14,
  borderTop: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
};

const botaoPagina: CSSProperties = {
  border: '1px solid rgba(168,85,247,0.45)',
  borderRadius: 12,
  padding: '10px 14px',
  background: 'rgba(168,85,247,0.18)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const paginaTexto: CSSProperties = {
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 800,
};

const rankingGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
  gap: 14,
  marginTop: 24,
  width: '100%',
  maxWidth: '100%',
};