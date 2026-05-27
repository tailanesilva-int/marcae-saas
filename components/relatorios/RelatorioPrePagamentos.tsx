'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';

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
  relatorioButtonSecondary,
  relatorioCard,
  relatorioContainer,
  relatorioContadorTexto,
  relatorioDescription,
  relatorioEmpty,
  relatorioGrid,
  relatorioGridComMargem,
  relatorioHeader,
  relatorioMobileCss,
  relatorioPeriodoTexto,
  relatorioRow,
  relatorioTable,
  relatorioTableBox,
  relatorioTableHeader,
  relatorioThead,
  relatorioTitle,
} from '@/components/ui/relatorios/relatorioStyles';

type Props = {
  agendamentos: any[];
  empresa?: any;
  dataInicio: string;
  dataFim: string;
};

export default function RelatorioPrePagamentos({
  agendamentos,
  empresa,
  dataInicio,
  dataFim,
}: Props) {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [filtroStatus, setFiltroStatus] = useState('pagos');

  const lista = useMemo(() => {
    const base = (agendamentos || []).filter(
      (item) => Number(item.valorPrePago || 0) > 0
    );

    if (filtroStatus === 'todos') {
      return base;
    }

    if (filtroStatus === 'pagos') {
      return base.filter((item) =>
        pagamentoConfirmado(item.statusPagamento)
      );
    }

    return base.filter(
      (item) => !pagamentoConfirmado(item.statusPagamento)
    );
  }, [agendamentos, filtroStatus]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [agendamentos, itensPorPagina, filtroStatus]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(lista.length / itensPorPagina)
  );

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const listaPaginada = lista.slice(inicio, fim);

  const totalPrePago = lista.reduce(
    (total, item) => total + Number(item.valorPrePago || 0),
    0
  );

  const pagos = lista.filter((item) =>
    pagamentoConfirmado(item.statusPagamento)
  );

  const pendentes = lista.filter(
    (item) => !pagamentoConfirmado(item.statusPagamento)
  );

  const totalPago = pagos.reduce(
    (total, item) => total + Number(item.valorPrePago || 0),
    0
  );

  const totalPendente = pendentes.reduce(
    (total, item) => total + Number(item.valorPrePago || 0),
    0
  );

  const valorRestante = lista.reduce((total, item) => {
    const valorServico = Number(item.valorTotal || 0);
    const valorPrePago = Number(item.valorPrePago || 0);

    return total + Math.max(valorServico - valorPrePago, 0);
  }, 0);

  const taxaConversao =
    totalPrePago > 0
      ? ((totalPago / totalPrePago) * 100).toFixed(1)
      : '0.0';

  function exportarRelatorioPdf() {
    exportarPdf({
      titulo: 'Relatório de pré-pagamentos',
      subtitulo:
        'Controle de entradas antecipadas, pagamentos confirmados, pendências e saldo restante dos atendimentos.',
      empresa,
      periodo: formatarPeriodo(dataInicio, dataFim),
      nomeArquivo: `relatorio-prepagamentos-${dataInicio}-${dataFim}`,
      kpis: [
        {
          label: 'Total previsto',
          valor: formatarDinheiro(totalPrePago),
        },
        {
          label: 'Recebido',
          valor: formatarDinheiro(totalPago),
        },
        {
          label: 'Pendente',
          valor: formatarDinheiro(totalPendente),
        },
        {
          label: 'Valor restante',
          valor: formatarDinheiro(valorRestante),
        },
        {
          label: 'Conversão',
          valor: `${taxaConversao}%`,
        },
        {
          label: 'Agendamentos',
          valor: String(lista.length),
        },
      ],
      tabelas: [
        {
          titulo: 'Pré-pagamentos detalhados',
          colunas: [
            'Data',
            'Cliente',
            'Profissional',
            'Serviço',
            'Valor serviço',
            'Pré-pago',
            'Restante',
            'Pagamento',
            'Agenda',
          ],
          linhas: lista.map((item) => [
            formatarData(item.dataHoraInicio),
            nomeCliente(item),
            nomeProfissional(item),
            nomeServico(item),
            formatarDinheiro(item.valorTotal),
            formatarDinheiro(item.valorPrePago),
            formatarDinheiro(
              Math.max(
                Number(item.valorTotal || 0) -
                  Number(item.valorPrePago || 0),
                0
              )
            ),
            limparTexto(item.statusPagamento),
            limparTexto(item.status),
          ]),
        },
      ],
      observacoes: [
        `Filtro aplicado: ${filtroStatus}.`,
        'O relatório considera todos os agendamentos com valor pré-pago maior que zero.',
      ],
    });
  }

  function exportarRelatorioExcel() {
    exportarExcel({
      nomeArquivo: `relatorio-prepagamentos-${dataInicio}-${dataFim}`,
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
              Valor: filtroStatus,
            },
            {
              Indicador: 'Total previsto',
              Valor: totalPrePago,
            },
            {
              Indicador: 'Recebido',
              Valor: totalPago,
            },
            {
              Indicador: 'Pendente',
              Valor: totalPendente,
            },
            {
              Indicador: 'Valor restante',
              Valor: valorRestante,
            },
            {
              Indicador: 'Conversão',
              Valor: `${taxaConversao}%`,
            },
            {
              Indicador: 'Agendamentos',
              Valor: lista.length,
            },
          ],
        },
        {
          nome: 'Pré-pagamentos',
          dados: lista.map((item) => ({
            Data: formatarData(item.dataHoraInicio),
            Cliente: nomeCliente(item),
            Profissional: nomeProfissional(item),
            Serviço: nomeServico(item),
            'Valor serviço': Number(item.valorTotal || 0),
            'Valor pré-pago': Number(item.valorPrePago || 0),
            Restante: Math.max(
              Number(item.valorTotal || 0) -
                Number(item.valorPrePago || 0),
              0
            ),
            'Status pagamento': limparTexto(item.statusPagamento),
            'Status agenda': limparTexto(item.status),
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
            Entradas antecipadas
          </span>

          <h2 style={relatorioTitle}>
            Pré-pagamentos
          </h2>

          <p style={relatorioDescription}>
            Controle dos valores pagos antecipadamente pelos clientes no período filtrado.
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
        </div>
      </div>

      <div className="relatorio-mobile-grid" style={relatorioGrid}>
        <Card
          titulo="Total previsto"
          valor={dinheiro(totalPrePago)}
          cor="#a855f7"
        />

        <Card
          titulo="Recebido"
          valor={dinheiro(totalPago)}
          cor="#22c55e"
        />

        <Card
          titulo="Pendente"
          valor={dinheiro(totalPendente)}
          cor="#f59e0b"
        />

        <Card
          titulo="Valor restante"
          valor={dinheiro(valorRestante)}
          cor="#ef4444"
        />
      </div>

      <div className="relatorio-mobile-grid" style={relatorioGridComMargem}>
        <Card
          titulo="Conversão"
          valor={`${taxaConversao}%`}
          cor="#38bdf8"
        />

        <Card
          titulo="Agendamentos"
          valor={String(lista.length)}
          cor="#14b8a6"
        />
      </div>

      <div className="relatorio-mobile-tablebox" style={relatorioTableBox}>
        <div className="relatorio-mobile-tableheader" style={relatorioTableHeader}>
          <div>
            <strong>
              Agendamentos com pré-pagamento
            </strong>

            <span style={relatorioContadorTexto}>
              {lista.length === 0
                ? 'Nenhum registro'
                : `Exibindo ${inicio + 1}–${Math.min(
                    fim,
                    lista.length
                  )} de ${lista.length} registros`}
            </span>
          </div>

          <div style={controlesHeader}>
            <div style={filtroWrapper}>
              <label style={labelMini}>
                Status
              </label>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                style={select}
              >
                <option value="pagos">Pagos</option>
                <option value="pendentes">Pendentes</option>
                <option value="todos">Todos</option>
              </select>
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
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {lista.length === 0 ? (
          <div style={relatorioEmpty}>
            Nenhum pré-pagamento encontrado no período.
          </div>
        ) : (
          <>
            <div className="relatorio-mobile-table" style={relatorioTable}>
              <div className="relatorio-mobile-thead" style={relatorioThead}>
                <span>Data</span>
                <span>Cliente</span>
                <span>Profissional</span>
                <span>Serviço</span>
                <span>Pré-pago</span>
                <span>Restante</span>
                <span>Pagamento</span>
                <span>Agenda</span>
              </div>

              {listaPaginada.map((item) => (
                <div
                  key={item.id}
                  className="relatorio-mobile-row"
                  style={relatorioRow}
                >
                  <span>
                    {formatarData(item.dataHoraInicio)}
                  </span>

                  <span>
                    {nomeCliente(item)}
                  </span>

                  <span>
                    {nomeProfissional(item)}
                  </span>

                  <span>
                    {nomeServico(item)}
                  </span>

                  <strong>
                    {dinheiro(item.valorPrePago)}
                  </strong>

                  <strong style={{ color: '#ef4444' }}>
                    {dinheiro(
                      Math.max(
                        Number(item.valorTotal || 0) -
                          Number(item.valorPrePago || 0),
                        0
                      )
                    )}
                  </strong>

                  <span style={badgeStatusPagamento(item.statusPagamento)}>
                    {item.statusPagamento || '-'}
                  </span>

                  <span>
                    {item.status || '-'}
                  </span>
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
    </section>
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

      <strong style={{ color: cor }}>
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

function nomeCliente(item: any) {
  return (
    item.cliente?.nome ||
    item.Cliente?.nome ||
    item.nomeCliente ||
    item.clienteNome ||
    '-'
  );
}

function nomeServico(item: any) {
  return (
    item.servico?.nome ||
    item.Servico?.nome ||
    item.servicoNome ||
    '-'
  );
}

function nomeProfissional(item: any) {
  return (
    item.profissional?.nome ||
    item.Profissional?.nome ||
    item.profissionalNome ||
    '-'
  );
}

function pagamentoConfirmado(status: any) {
  return ['pago', 'aprovado', 'confirmado'].includes(
    String(status || '').toLowerCase()
  );
}

function badgeStatusPagamento(status: any): CSSProperties {
  const confirmado = pagamentoConfirmado(status);

  return {
    display: 'inline-flex',
    width: 'fit-content',
    padding: '6px 10px',
    borderRadius: 999,
    background: confirmado
      ? 'rgba(34,197,94,.16)'
      : 'rgba(245,158,11,.16)',
    color: confirmado ? '#22c55e' : '#f59e0b',
    border: confirmado
      ? '1px solid rgba(34,197,94,.35)'
      : '1px solid rgba(245,158,11,.35)',
    fontSize: 12,
    fontWeight: 900,
    textTransform: 'capitalize',
  };
}

const controlesHeader: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'end',
  flexWrap: 'wrap',
};

const filtroWrapper: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 120,
};

const labelMini: CSSProperties = {
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 900,
};

const select: CSSProperties = {
  width: '100%',
  minHeight: 44,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(2,6,23,0.65)',
  color: '#fff',
  padding: '0 12px',
  outline: 'none',
};

const paginacaoTopo: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 120,
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