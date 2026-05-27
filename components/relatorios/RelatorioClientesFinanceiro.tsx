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
  relatorioCardResumo,
  relatorioContainer,
  relatorioContadorTexto,
  relatorioEmpty,
  relatorioGrid,
  relatorioHeader,
  relatorioLoading,
  relatorioMobileCss,
  relatorioPeriodoTexto,
  relatorioRow,
  relatorioTableBox,
  relatorioTableHeader,
  relatorioThead,
  relatorioTitle,
} from '@/components/ui/relatorios/relatorioStyles';

type Props = {
  empresaId: string;
  empresa?: any;
  dataInicio: string;
  dataFim: string;
};

export default function RelatorioClientesFinanceiro({
  empresaId,
  empresa,
  dataInicio,
  dataFim,
}: Props) {
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregar();
  }, [empresaId]);

  async function carregar() {
    if (!empresaId) return;

    try {
      setCarregando(true);

      const params = new URLSearchParams({
        empresaId,
      });

      const res = await fetch(`/api/v1/clients/financeiro?${params.toString()}`, {
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

  const movimentacoes = dados?.movimentacoes || [];
  const resumoPorCliente = dados?.resumoPorCliente || [];

  const resumo = dados?.resumo || {
    credito: 0,
    debito: 0,
    saldo: 0,
  };

  function dataMovimentacao(mov: any) {
    return (
      mov.data ||
      mov.dataMovimentacao ||
      mov.createdAt ||
      mov.updatedAt ||
      mov.agendamento?.dataHoraInicio ||
      mov.Agendamento?.dataHoraInicio
    );
  }

  function exportarRelatorioPdf() {
    exportarPdf({
      titulo: 'Relatório de créditos e débitos',
      subtitulo:
        'Controle financeiro dos clientes com resumo consolidado por cliente e detalhamento das movimentações.',
      empresa,
      periodo: formatarPeriodo(dataInicio, dataFim),
      nomeArquivo: `relatorio-creditos-debitos-${dataInicio}-${dataFim}`,
      kpis: [
        {
          label: 'Créditos',
          valor: formatarDinheiro(resumo.credito),
        },
        {
          label: 'Débitos',
          valor: formatarDinheiro(resumo.debito),
        },
        {
          label: 'Saldo geral',
          valor: formatarDinheiro(resumo.saldo),
        },
        {
          label: 'Clientes',
          valor: String(resumoPorCliente.length),
        },
        {
          label: 'Movimentações',
          valor: String(movimentacoes.length),
        },
      ],
      tabelas: [
        {
          titulo: 'Resumo por cliente',
          colunas: [
            'Cliente',
            'Total créditos',
            'Total débitos',
            'Saldo final',
            'Movimentações',
          ],
          linhas: resumoPorCliente.map((cliente: any) => [
            limparTexto(cliente.clienteNome),
            formatarDinheiro(cliente.totalCredito),
            formatarDinheiro(cliente.totalDebito),
            formatarDinheiro(cliente.saldoFinal),
            String(cliente.quantidadeMovimentacoes || 0),
          ]),
        },
        {
          titulo: 'Movimentações detalhadas',
          colunas: ['Data', 'Cliente', 'Tipo', 'Valor', 'Status', 'Origem'],
          linhas: movimentacoes.map((mov: any) => [
            formatarData(dataMovimentacao(mov)),
            limparTexto(mov.cliente?.nome || mov.Cliente?.nome),
            limparTexto(mov.tipo),
            formatarDinheiro(mov.valor),
            limparTexto(mov.status),
            limparTexto(mov.origem || 'manual'),
          ]),
        },
      ],
      observacoes: [
        'O saldo final é apresentado no resumo por cliente para evitar confusão com o saldo acumulado por movimentação.',
        'Créditos aumentam o saldo do cliente e débitos reduzem o saldo disponível.',
      ],
    });
  }

  function exportarRelatorioExcel() {
    exportarExcel({
      nomeArquivo: `relatorio-creditos-debitos-${dataInicio}-${dataFim}`,
      abas: [
        {
          nome: 'Resumo Geral',
          dados: [
            {
              Indicador: 'Período',
              Valor: formatarPeriodo(dataInicio, dataFim),
            },
            {
              Indicador: 'Créditos',
              Valor: Number(resumo.credito || 0),
            },
            {
              Indicador: 'Débitos',
              Valor: Number(resumo.debito || 0),
            },
            {
              Indicador: 'Saldo geral',
              Valor: Number(resumo.saldo || 0),
            },
            {
              Indicador: 'Clientes',
              Valor: resumoPorCliente.length,
            },
            {
              Indicador: 'Movimentações',
              Valor: movimentacoes.length,
            },
          ],
        },
        {
          nome: 'Resumo por Cliente',
          dados: resumoPorCliente.map((cliente: any) => ({
            Cliente: limparTexto(cliente.clienteNome),
            'Total créditos': Number(cliente.totalCredito || 0),
            'Total débitos': Number(cliente.totalDebito || 0),
            'Saldo final': Number(cliente.saldoFinal || 0),
            Movimentações: Number(cliente.quantidadeMovimentacoes || 0),
          })),
        },
        {
          nome: 'Movimentações',
          dados: movimentacoes.map((mov: any) => ({
            Data: formatarData(dataMovimentacao(mov)),
            Cliente: limparTexto(mov.cliente?.nome || mov.Cliente?.nome),
            Tipo: limparTexto(mov.tipo),
            Valor: Number(mov.valor || 0),
            Status: limparTexto(mov.status),
            Origem: limparTexto(mov.origem || 'manual'),
          })),
        },
      ],
    });
  }

  return (
    <div className="relatorio-mobile-smart" style={relatorioContainer}>
      <style jsx global>{relatorioMobileCss}</style>

      <div className="relatorio-mobile-header" style={relatorioHeader}>
        <div>
          <span
            style={relatorioBadge(
              'rgba(59,130,246,.18)',
              '#93c5fd',
              'rgba(59,130,246,0.35)'
            )}
          >
            Financeiro clientes
          </span>

          <h2 style={relatorioTitle}>Créditos e débitos</h2>

          <p style={relatorioPeriodoTexto}>
            Período: {formatarPeriodo(dataInicio, dataFim)}
          </p>
        </div>

        <div className="relatorio-mobile-actions" style={relatorioAcoesHeader}>
          <button
            type="button"
            onClick={exportarRelatorioPdf}
            style={relatorioButtonSecondary('59,130,246')}
          >
            Exportar PDF
          </button>

          <button
            type="button"
            onClick={exportarRelatorioExcel}
            style={relatorioButtonSecondary('59,130,246')}
          >
            Exportar Excel
          </button>

          <button
            type="button"
            onClick={carregar}
            style={relatorioButton('#2563eb', '#3b82f6')}
          >
            Atualizar
          </button>
        </div>
      </div>

      {carregando && <div style={relatorioLoading}>Carregando movimentações...</div>}

      <div className="relatorio-mobile-grid" style={relatorioGrid}>
        <CardResumo titulo="Créditos" valor={dinheiro(resumo.credito)} cor="#22c55e" />

        <CardResumo titulo="Débitos" valor={dinheiro(resumo.debito)} cor="#ef4444" />

        <CardResumo
          titulo="Saldo geral"
          valor={dinheiro(resumo.saldo)}
          cor={resumo.saldo >= 0 ? '#22c55e' : '#ef4444'}
        />

        <CardResumo titulo="Clientes" valor={String(resumoPorCliente.length)} cor="#38bdf8" />
      </div>

      <div className="relatorio-mobile-tablebox" style={relatorioTableBox}>
        <div className="relatorio-mobile-tableheader" style={relatorioTableHeader}>
          <div>
            <strong>Resumo por cliente</strong>
            <span style={relatorioContadorTexto}>
              {resumoPorCliente.length} cliente(s) com movimentação
            </span>
          </div>
        </div>

        <div className="relatorio-mobile-thead" style={relatorioThead}>
          <span>Cliente</span>
          <span>Total créditos</span>
          <span>Total débitos</span>
          <span>Saldo final</span>
          <span>Movimentações</span>
        </div>

        {resumoPorCliente.length === 0 ? (
          <div style={relatorioEmpty}>Nenhum resumo por cliente encontrado.</div>
        ) : (
          resumoPorCliente.map((cliente: any) => (
            <div key={cliente.clienteId} className="relatorio-mobile-row" style={relatorioRow}>
              <span>{cliente.clienteNome || '-'}</span>

              <strong style={{ color: '#22c55e' }}>{dinheiro(cliente.totalCredito)}</strong>

              <strong style={{ color: '#ef4444' }}>{dinheiro(cliente.totalDebito)}</strong>

              <strong
                style={{
                  color: Number(cliente.saldoFinal || 0) >= 0 ? '#22c55e' : '#ef4444',
                }}
              >
                {dinheiro(cliente.saldoFinal)}
              </strong>

              <span>{cliente.quantidadeMovimentacoes || 0}</span>
            </div>
          ))
        )}
      </div>

      <div className="relatorio-mobile-tablebox" style={relatorioTableBox}>
        <div className="relatorio-mobile-tableheader" style={relatorioTableHeader}>
          <div>
            <strong>Movimentações detalhadas</strong>
            <span style={relatorioContadorTexto}>{movimentacoes.length} registro(s)</span>
          </div>
        </div>

        <div className="relatorio-mobile-thead" style={relatorioThead}>
          <span>Data</span>
          <span>Cliente</span>
          <span>Tipo</span>
          <span>Valor</span>
          <span>Status</span>
          <span>Origem</span>
        </div>

        {movimentacoes.length === 0 ? (
          <div style={relatorioEmpty}>Nenhuma movimentação encontrada.</div>
        ) : (
          movimentacoes.map((mov: any) => (
            <div key={mov.id} className="relatorio-mobile-row" style={relatorioRow}>
              <span>{formatarData(dataMovimentacao(mov))}</span>

              <span>{mov.cliente?.nome || mov.Cliente?.nome || '-'}</span>

              <span
                style={{
                  color: mov.tipo === 'credito' ? '#22c55e' : '#ef4444',
                  fontWeight: 900,
                }}
              >
                {mov.tipo}
              </span>

              <strong>{dinheiro(mov.valor)}</strong>

              <span>{mov.status}</span>

              <span>{mov.origem || 'manual'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CardResumo({ titulo, valor, cor }: any) {
  return (
    <div style={{ ...relatorioCardResumo, borderColor: `${cor}55` }}>
      <span>{titulo}</span>
      <strong style={{ color: cor, fontSize: 24 }}>{valor}</strong>
    </div>
  );
}

function dinheiro(valor: any) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}