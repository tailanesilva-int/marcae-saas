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
  relatorioDescription,
  relatorioEmpty,
  relatorioGrid,
  relatorioGridComMargem,
  relatorioHeader,
  relatorioLoading,
  relatorioMobileCss,
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

export default function RelatorioCaixa({
  empresaId,
  dataInicio,
  dataFim,
  empresa,
}: Props) {
  const [carregando, setCarregando] = useState(false);
  const [resumo, setResumo] = useState<any>(null);
  const [caixas, setCaixas] = useState<any[]>([]);

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

      const res = await fetch(`/api/relatorios/caixa?${params.toString()}`, {
        cache: 'no-store',
      });

      const data = await res.json();

      if (!data.success) {
        setResumo(null);
        setCaixas([]);
        return;
      }

      setResumo(data.resumo);
      setCaixas(data.caixas || []);
    } catch (error) {
      setResumo(null);
      setCaixas([]);
    } finally {
      setCarregando(false);
    }
  }

  function exportarRelatorioPdf() {
    exportarPdf({
      titulo: 'Relatório de fechamento de caixa',
      subtitulo:
        'Relatório operacional de caixas abertos, fechados, aprovados, divergências e saldos por forma de pagamento.',
      empresa,
      periodo: formatarPeriodo(dataInicio, dataFim),
      nomeArquivo: `relatorio-caixa-${dataInicio}-${dataFim}`,
      kpis: [
        {
          label: 'Caixas',
          valor: String(resumo?.totalCaixas || 0),
        },
        {
          label: 'Fechados',
          valor: String(resumo?.fechados || 0),
        },
        {
          label: 'Aprovados',
          valor: String(resumo?.aprovados || 0),
        },
        {
          label: 'Pendentes',
          valor: String(resumo?.pendentesConferencia || 0),
        },
        {
          label: 'Saldo inicial',
          valor: formatarDinheiro(resumo?.saldoInicial),
        },
        {
          label: 'Saldo sistema',
          valor: formatarDinheiro(resumo?.saldoSistema),
        },
        {
          label: 'Saldo informado',
          valor: formatarDinheiro(resumo?.saldoInformado),
        },
        {
          label: 'Diferença',
          valor: formatarDinheiro(resumo?.diferenca),
        },
      ],
      tabelas: [
        {
          titulo: 'Caixas do período',
          colunas: [
            'Data',
            'Status',
            'Conferência',
            'Saldo sistema',
            'Saldo informado',
            'Diferença',
          ],
          linhas: caixas.map((caixa) => [
            formatarData(caixa.data),
            limparTexto(caixa.status),
            limparTexto(caixa.conferenciaStatus || 'sem conferência'),
            formatarDinheiro(caixa.saldoSistema),
            formatarDinheiro(caixa.saldoInformado),
            formatarDinheiro(caixa.diferenca),
          ]),
        },
      ],
      observacoes: [
        'Os valores apresentados seguem o período filtrado na tela.',
        'Diferenças representam divergência entre saldo do sistema e saldo informado no fechamento.',
      ],
    });
  }

  function exportarRelatorioExcel() {
    exportarExcel({
      nomeArquivo: `relatorio-caixa-${dataInicio}-${dataFim}`,
      abas: [
        {
          nome: 'Resumo',
          dados: [
            {
              Indicador: 'Caixas',
              Valor: resumo?.totalCaixas || 0,
            },
            {
              Indicador: 'Fechados',
              Valor: resumo?.fechados || 0,
            },
            {
              Indicador: 'Aprovados',
              Valor: resumo?.aprovados || 0,
            },
            {
              Indicador: 'Pendentes',
              Valor: resumo?.pendentesConferencia || 0,
            },
            {
              Indicador: 'Saldo inicial',
              Valor: Number(resumo?.saldoInicial || 0),
            },
            {
              Indicador: 'Saldo sistema',
              Valor: Number(resumo?.saldoSistema || 0),
            },
            {
              Indicador: 'Saldo informado',
              Valor: Number(resumo?.saldoInformado || 0),
            },
            {
              Indicador: 'Diferença',
              Valor: Number(resumo?.diferenca || 0),
            },
            {
              Indicador: 'Dinheiro',
              Valor: Number(resumo?.dinheiroSistema || 0),
            },
            {
              Indicador: 'Pix',
              Valor: Number(resumo?.pixSistema || 0),
            },
            {
              Indicador: 'Débito',
              Valor: Number(resumo?.debitoSistema || 0),
            },
            {
              Indicador: 'Crédito',
              Valor: Number(resumo?.creditoSistema || 0),
            },
          ],
        },
        {
          nome: 'Caixas',
          dados: caixas.map((caixa) => ({
            Data: formatarData(caixa.data),
            Status: limparTexto(caixa.status),
            Conferência: limparTexto(caixa.conferenciaStatus || 'sem conferência'),
            'Saldo sistema': Number(caixa.saldoSistema || 0),
            'Saldo informado': Number(caixa.saldoInformado || 0),
            Diferença: Number(caixa.diferenca || 0),
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
          <span style={relatorioBadge()}>Relatório operacional</span>

          <h2 style={relatorioTitle}>Fechamento de caixa</h2>

          <p style={relatorioDescription}>
            Consulte caixas abertos, fechados, aprovados, divergências e saldos por forma de pagamento.
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
          Carregando relatório de caixa...
        </div>
      )}

      {resumo && (
        <>
          <div className="relatorio-mobile-grid" style={relatorioGrid}>
            <Kpi label="Caixas" value={resumo.totalCaixas} />
            <Kpi label="Fechados" value={resumo.fechados} />
            <Kpi label="Aprovados" value={resumo.aprovados} />
            <Kpi label="Pendentes" value={resumo.pendentesConferencia} />
          </div>

          <div className="relatorio-mobile-grid" style={relatorioGridComMargem}>
            <ResumoFinanceiro label="Saldo inicial" value={dinheiro(resumo.saldoInicial)} />
            <ResumoFinanceiro label="Saldo sistema" value={dinheiro(resumo.saldoSistema)} />
            <ResumoFinanceiro label="Saldo informado" value={dinheiro(resumo.saldoInformado)} />
            <ResumoFinanceiro
              label="Diferença"
              value={dinheiro(resumo.diferenca)}
              danger={Number(resumo.diferenca || 0) !== 0}
            />
          </div>

          <div className="relatorio-mobile-grid" style={relatorioGridComMargem}>
            <ResumoFinanceiro label="Dinheiro" value={dinheiro(resumo.dinheiroSistema)} />
            <ResumoFinanceiro label="Pix" value={dinheiro(resumo.pixSistema)} />
            <ResumoFinanceiro label="Débito" value={dinheiro(resumo.debitoSistema)} />
            <ResumoFinanceiro label="Crédito" value={dinheiro(resumo.creditoSistema)} />
          </div>
        </>
      )}

      <div className="relatorio-mobile-tablebox" style={relatorioTableBox}>
        <div className="relatorio-mobile-tableheader" style={relatorioTableHeader}>
          <strong>Caixas do período</strong>
          <span>{caixas.length} registro(s)</span>
        </div>

        {caixas.length === 0 ? (
          <div style={relatorioEmpty}>Nenhum caixa encontrado no período.</div>
        ) : (
          <div className="relatorio-mobile-table" style={relatorioTable}>
            <div className="relatorio-mobile-thead" style={relatorioThead}>
              <span>Data</span>
              <span>Status</span>
              <span>Conferência</span>
              <span>Sistema</span>
              <span>Informado</span>
              <span>Diferença</span>
            </div>

            {caixas.map((caixa) => (
              <div key={caixa.id} className="relatorio-mobile-row" style={relatorioRow}>
                <span>{dinheiroFormatarData(caixa.data)}</span>

                <span style={relatorioStatusBadge(caixa.status === 'aberto' ? '#f59e0b' : '#22c55e')}>
                  {caixa.status || '-'}
                </span>

                <span style={relatorioStatusBadge(caixa.conferenciaStatus === 'aprovado' ? '#22c55e' : '#f59e0b')}>
                  {caixa.conferenciaStatus || 'sem conferência'}
                </span>

                <strong>{dinheiro(caixa.saldoSistema)}</strong>

                <strong>{dinheiro(caixa.saldoInformado)}</strong>

                <strong
                  style={{
                    color: Number(caixa.diferenca || 0) === 0 ? '#22c55e' : '#ef4444',
                  }}
                >
                  {dinheiro(caixa.diferenca)}
                </strong>
              </div>
            ))}
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

function ResumoFinanceiro({ label, value, danger }: any) {
  return (
    <div style={relatorioCard}>
      <span>{label}</span>
      <strong style={{ color: danger ? '#ef4444' : '#fff' }}>{value}</strong>
    </div>
  );
}

function dinheiro(valor: any) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function dinheiroFormatarData(data: any) {
  if (!data) return '-';

  return new Date(data).toLocaleDateString('pt-BR');
}