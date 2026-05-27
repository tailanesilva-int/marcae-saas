'use client';

import { useEffect, useState } from 'react';

import { exportarExcel } from '@/app/lib/exportacao/excel';
import { exportarPdf } from '@/app/lib/exportacao/pdf';

import {
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
  relatorioDescription,
  relatorioEmpty,
  relatorioFormulaBox,
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
  relatorioRankingValores,
  relatorioTitle,
} from '@/components/ui/relatorios/relatorioStyles';

type Props = {
  empresaId: string;
  dataInicio: string;
  dataFim: string;
  empresa?: any;
};

export default function RelatorioLucro({
  empresaId,
  dataInicio,
  dataFim,
  empresa,
}: Props) {
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState<any>(null);

  useEffect(() => {
    carregar();
  }, [empresaId, dataInicio, dataFim]);

  async function carregar() {
    if (!empresaId) return;

    try {
      setCarregando(true);

      const params = new URLSearchParams({
        empresaId,
        dataInicio,
        dataFim,
      });

      const res = await fetch(`/api/relatorios/lucro?${params.toString()}`, {
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
    valorOriginal: 0,
    descontoPromocao: 0,
    descontoManual: 0,
    acrescimoManual: 0,
    receitaLiquida: 0,
    comissoes: 0,
    custosServicos: 0,
    despesasOperacionais: 0,
    lucroEstimado: 0,
    margem: 0,
    totalAtendimentos: 0,
  };

  const ranking = dados?.rankingServicos || [];
  const despesasPorCategoria = dados?.despesasPorCategoria || [];

  function exportarRelatorioPdf() {
    exportarPdf({
      titulo: 'Relatório de lucro',
      subtitulo:
        'Análise estratégica financeira considerando descontos, acréscimos, comissões, custos operacionais e margem estimada.',
      empresa,
      periodo: formatarPeriodo(dataInicio, dataFim),
      nomeArquivo: `relatorio-lucro-${dataInicio}-${dataFim}`,

      kpis: [
        {
          label: 'Valor original',
          valor: formatarDinheiro(resumo.valorOriginal),
        },
        {
          label: 'Receita líquida',
          valor: formatarDinheiro(resumo.receitaLiquida),
        },
        {
          label: 'Lucro estimado',
          valor: formatarDinheiro(resumo.lucroEstimado),
        },
        {
          label: 'Margem',
          valor: `${Number(resumo.margem || 0).toFixed(1)}%`,
        },
        {
          label: 'Comissões',
          valor: formatarDinheiro(resumo.comissoes),
        },
        {
          label: 'Custos serviços',
          valor: formatarDinheiro(resumo.custosServicos),
        },
        {
          label: 'Despesas operacionais',
          valor: formatarDinheiro(resumo.despesasOperacionais),
        },
        {
          label: 'Atendimentos',
          valor: String(resumo.totalAtendimentos || 0),
        },
      ],

      tabelas: [
        {
          titulo: 'Resumo financeiro',
          colunas: ['Indicador', 'Valor'],
          linhas: [
            ['Valor original', formatarDinheiro(resumo.valorOriginal)],
            ['Receita líquida', formatarDinheiro(resumo.receitaLiquida)],
            ['Desconto promoção', formatarDinheiro(resumo.descontoPromocao)],
            ['Desconto manual', formatarDinheiro(resumo.descontoManual)],
            ['Acréscimos', formatarDinheiro(resumo.acrescimoManual)],
            ['Comissões', formatarDinheiro(resumo.comissoes)],
            ['Custos serviços', formatarDinheiro(resumo.custosServicos)],
            ['Despesas operacionais', formatarDinheiro(resumo.despesasOperacionais)],
            ['Lucro estimado', formatarDinheiro(resumo.lucroEstimado)],
            ['Margem', `${Number(resumo.margem || 0).toFixed(1)}%`],
          ],
        },

        {
          titulo: 'Despesas por categoria',
          colunas: ['Categoria', 'Valor'],
          linhas: despesasPorCategoria.map((item: any) => [
            formatarCategoria(item.categoria),
            formatarDinheiro(item.valor),
          ]),
        },

        {
          titulo: 'Serviços mais lucrativos',
          colunas: [
            'Serviço',
            'Qtd',
            'Receita líquida',
            'Descontos',
            'Acréscimos',
            'Lucro',
          ],

          linhas: ranking.map((item: any) => [
            limparTexto(item.nome),
            String(item.quantidade || 0),
            formatarDinheiro(item.receitaLiquida),
            formatarDinheiro(item.descontos),
            formatarDinheiro(item.acrescimos),
            formatarDinheiro(item.lucro),
          ]),
        },
      ],

      observacoes: [
        'A categoria “Comissão manual” é ignorada nas despesas operacionais para evitar duplicidade no cálculo.',
        'Lucro estimado considera descontos promocionais, descontos manuais, acréscimos, comissões e saídas operacionais.',
      ],
    });
  }

  function exportarRelatorioExcel() {
    exportarExcel({
      nomeArquivo: `relatorio-lucro-${dataInicio}-${dataFim}`,

      abas: [
        {
          nome: 'Resumo',
          dados: [
            {
              Indicador: 'Período',
              Valor: formatarPeriodo(dataInicio, dataFim),
            },
            {
              Indicador: 'Valor original',
              Valor: Number(resumo.valorOriginal || 0),
            },
            {
              Indicador: 'Receita líquida',
              Valor: Number(resumo.receitaLiquida || 0),
            },
            {
              Indicador: 'Desconto promoção',
              Valor: Number(resumo.descontoPromocao || 0),
            },
            {
              Indicador: 'Desconto manual',
              Valor: Number(resumo.descontoManual || 0),
            },
            {
              Indicador: 'Acréscimos',
              Valor: Number(resumo.acrescimoManual || 0),
            },
            {
              Indicador: 'Comissões',
              Valor: Number(resumo.comissoes || 0),
            },
            {
              Indicador: 'Custos serviços',
              Valor: Number(resumo.custosServicos || 0),
            },
            {
              Indicador: 'Despesas operacionais',
              Valor: Number(resumo.despesasOperacionais || 0),
            },
            {
              Indicador: 'Lucro estimado',
              Valor: Number(resumo.lucroEstimado || 0),
            },
            {
              Indicador: 'Margem',
              Valor: `${Number(resumo.margem || 0).toFixed(1)}%`,
            },
          ],
        },

        {
          nome: 'Despesas',
          dados: despesasPorCategoria.map((item: any) => ({
            Categoria: formatarCategoria(item.categoria),
            Valor: Number(item.valor || 0),
          })),
        },

        {
          nome: 'Serviços lucrativos',
          dados: ranking.map((item: any) => ({
            Serviço: limparTexto(item.nome),
            Quantidade: Number(item.quantidade || 0),
            'Receita líquida': Number(item.receitaLiquida || 0),
            Descontos: Number(item.descontos || 0),
            Acréscimos: Number(item.acrescimos || 0),
            Lucro: Number(item.lucro || 0),
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
            Financeiro estratégico
          </span>

          <h2 style={relatorioTitle}>Relatório de lucro</h2>

          <p style={relatorioDescription}>
            Considera descontos, acréscimos, comissões, custos dos serviços e saídas operacionais do caixa, ignorando comissão manual.
          </p>

          <p style={relatorioPeriodoTexto}>
            Período: {formatarPeriodo(dataInicio, dataFim)}
          </p>
        </div>

        <div className="relatorio-mobile-actions" style={relatorioAcoesHeader}>
          <button
            type="button"
            style={relatorioButtonSecondary()}
            onClick={exportarRelatorioPdf}
          >
            Exportar PDF
          </button>

          <button
            type="button"
            style={relatorioButtonSecondary()}
            onClick={exportarRelatorioExcel}
          >
            Exportar Excel
          </button>

          <button
            type="button"
            style={relatorioButton()}
            onClick={carregar}
          >
            Atualizar
          </button>
        </div>
      </div>

      {carregando && (
        <div style={relatorioLoading}>
          Carregando relatório de lucro...
        </div>
      )}

      <div className="relatorio-mobile-grid" style={relatorioGrid}>
        <Card
          titulo="Valor original"
          valor={dinheiro(resumo.valorOriginal)}
          cor="#93c5fd"
        />

        <Card
          titulo="Receita líquida"
          valor={dinheiro(resumo.receitaLiquida)}
          cor="#22c55e"
        />

        <Card
          titulo="Descontos totais"
          valor={dinheiro(
            Number(resumo.descontoPromocao || 0) +
              Number(resumo.descontoManual || 0)
          )}
          cor="#ef4444"
        />

        <Card
          titulo="Acréscimos"
          valor={dinheiro(resumo.acrescimoManual)}
          cor="#14b8a6"
        />
      </div>

      <div className="relatorio-mobile-grid" style={relatorioGridComMargem}>
        <Card
          titulo="Desconto promoção"
          valor={dinheiro(resumo.descontoPromocao)}
          cor="#fb7185"
        />

        <Card
          titulo="Desconto manual"
          valor={dinheiro(resumo.descontoManual)}
          cor="#f97316"
        />

        <Card
          titulo="Comissões"
          valor={dinheiro(resumo.comissoes)}
          cor="#f59e0b"
        />

        <Card
          titulo="Saídas operacionais"
          valor={dinheiro(resumo.despesasOperacionais)}
          cor="#ef4444"
        />
      </div>

      <div className="relatorio-mobile-grid" style={relatorioGridComMargem}>
        <Card
          titulo="Lucro estimado"
          valor={dinheiro(resumo.lucroEstimado)}
          cor="#a855f7"
        />

        <Card
          titulo="Margem de lucro"
          valor={`${Number(resumo.margem || 0).toFixed(1)}%`}
          cor="#3b82f6"
        />

        <Card
          titulo="Atendimentos"
          valor={String(resumo.totalAtendimentos || 0)}
          cor="#14b8a6"
        />
      </div>

      <div style={relatorioFormulaBox}>
        <strong>Fórmula aplicada</strong>

        <span>
          Receita líquida - custos dos serviços - comissões calculadas - saídas operacionais válidas = lucro estimado.
        </span>

        <small>
          A categoria “Comissão manual” das saídas do caixa é ignorada para evitar comissão duplicada.
        </small>
      </div>

      <div style={relatorioRankingBox}>
        <div className="relatorio-mobile-panel-header" style={relatorioRankingHeader}>
          <strong>Despesas por categoria</strong>

          <span>
            {despesasPorCategoria.length} categoria(s)
          </span>
        </div>

        {despesasPorCategoria.length === 0 ? (
          <div style={relatorioEmpty}>
            Nenhuma saída operacional encontrada no período.
          </div>
        ) : (
          despesasPorCategoria.map((item: any) => (
            <div
              key={item.categoria}
              className="relatorio-mobile-ranking-row"
              style={relatorioRankingRow}
            >
              <span>
                {formatarCategoria(item.categoria)}
              </span>

              <strong style={{ color: '#ef4444' }}>
                {dinheiro(item.valor)}
              </strong>
            </div>
          ))
        )}
      </div>

      <div style={relatorioRankingBox}>
        <div className="relatorio-mobile-panel-header" style={relatorioRankingHeader}>
          <strong>Serviços mais lucrativos</strong>

          <span>{ranking.length} serviço(s)</span>
        </div>

        {ranking.length === 0 ? (
          <div style={relatorioEmpty}>
            Nenhum serviço encontrado no período.
          </div>
        ) : (
          ranking.map((item: any) => (
            <div
              key={item.nome}
              className="relatorio-mobile-ranking-row"
              style={relatorioRankingRow}
            >
              <div>
                <strong>{item.nome}</strong>

                <span style={relatorioMuted}>
                  {item.quantidade} atendimento(s)
                </span>
              </div>

              <div style={relatorioRankingValores}>
                <span>
                  Receita:{' '}
                  {dinheiro(item.receitaLiquida)}
                </span>

                <span>
                  Descontos:{' '}
                  {dinheiro(item.descontos)}
                </span>

                <span>
                  Acréscimos:{' '}
                  {dinheiro(item.acrescimos)}
                </span>

                <strong style={{ color: '#22c55e' }}>
                  Lucro:{' '}
                  {dinheiro(item.lucro)}
                </strong>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Card({ titulo, valor, cor }: any) {
  return (
    <div
      style={{
        ...relatorioCard,
        borderColor: `${cor}55`,
      }}
    >
      <span>{titulo}</span>

      <strong style={{ color: cor }}>
        {valor}
      </strong>
    </div>
  );
}

function dinheiro(valor: any) {
  return Number(valor || 0).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    }
  );
}

function formatarCategoria(categoria: string) {
  return String(categoria || 'operacional')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letra) =>
      letra.toUpperCase()
    );
}