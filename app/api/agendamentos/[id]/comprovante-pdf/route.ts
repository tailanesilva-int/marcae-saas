import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const agendamentoInclude = {
  cliente: true,
  servico: true,
  profissional: true,
  empresa: true,
};

async function buscarAgendamento(id: string) {
  return prisma.agendamento.findUnique({
    where: {
      id,
    },
    include: agendamentoInclude,
  });
}

async function buscarAgendamentosPorIds(ids: string[]) {
  if (ids.length === 0) return [];

  return prisma.agendamento.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    include: agendamentoInclude,
    orderBy: [
      {
        dataHoraInicio: 'asc',
      },
      {
        createdAt: 'asc',
      },
    ],
  });
}

async function buscarAgendamentosDoComprovante(id: string, ids: string[]) {
  if (ids.length > 1) return buscarAgendamentosPorIds(ids);

  const agendamentoPrincipal = await buscarAgendamento(id);

  if (!agendamentoPrincipal) return [];
  if (!agendamentoPrincipal.grupoAgendamentoId) return [agendamentoPrincipal];

  return prisma.agendamento.findMany({
    where: {
      grupoAgendamentoId: agendamentoPrincipal.grupoAgendamentoId,
      empresaId: agendamentoPrincipal.empresaId,
    },
    include: agendamentoInclude,
    orderBy: [
      {
        dataHoraInicio: 'asc',
      },
      {
        createdAt: 'asc',
      },
    ],
  });
}

function formatarData(data?: string | Date | null) {
  if (!data) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
  }).format(new Date(data));
}

function formatarHora(data?: string | Date | null) {
  if (!data) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data));
}

function formatarMoeda(valor?: number | string | null) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarEndereco(endereco: any) {
  if (!endereco) return '';

  try {
    const dados =
      typeof endereco === 'string'
        ? JSON.parse(endereco)
        : endereco;

    const partes = [
      dados?.rua,
      dados?.numero,
      dados?.complemento,
    ].filter(Boolean);

    const cidadeEstado = [
      dados?.cidade,
      dados?.estado,
    ]
      .filter(Boolean)
      .join('/');

    return [
      partes.join(', '),
      cidadeEstado,
    ]
      .filter(Boolean)
      .join(' - ');
  } catch {
    return String(endereco);
  }
}

function textoPagamento(status?: string | null, exigePrePagamento?: boolean) {
  if (!exigePrePagamento) return 'Sem pré-pagamento';
  if (!status) return 'Pendente';

  const mapa: Record<string, string> = {
    pendente: 'Pendente',
    aguardando: 'Aguardando pagamento',
    aprovado: 'Pago',
    pago: 'Pago',
    confirmado: 'Confirmado',
    sem_pagamento: 'Sem pré-pagamento',
    recusado: 'Recusado',
    cancelado: 'Cancelado',
  };

  return mapa[status] || status;
}

function pagamentoFoiAprovado(status?: string | null) {
  return status === 'aprovado' || status === 'pago' || status === 'confirmado';
}

function obterValorServico(item: any) {
  return (
    item?.valorTotal ||
    item?.servico?.valor ||
    item?.servico?.preco ||
    item?.servico?.valorTotal ||
    0
  );
}

function obterValorPrePagamento(item: any) {
  const percentual = Number(item?.servico?.percentualPrePagamento || 0);
  const valorFixo = Number(item?.servico?.valorPrePagamento || 0);
  const valorServico = Number(obterValorServico(item));

  if (valorFixo > 0) return valorFixo;
  if (percentual > 0) return (valorServico * percentual) / 100;

  return 0;
}

const styles = StyleSheet.create({
  page: {
    padding: 34,
    backgroundColor: '#080B0F',
    color: '#F8FAFC',
    fontFamily: 'Helvetica',
  },
  header: {
    borderRadius: 22,
    padding: 24,
    backgroundColor: '#111425',
    border: '1px solid #2B3150',
    marginBottom: 18,
  },
  brand: {
    fontSize: 14,
    color: '#B76BFF',
    fontWeight: 700,
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    lineHeight: 1.1,
    fontWeight: 700,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#A7B0C5',
    lineHeight: 1.5,
  },
  statusRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#17251F',
    color: '#BBF7D0',
    fontSize: 10,
    fontWeight: 700,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#111425',
    border: '1px solid #2B3150',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 9,
    color: '#B76BFF',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 700,
    marginBottom: 12,
  },
  serviceCard: {
    borderRadius: 16,
    padding: 15,
    backgroundColor: '#15182A',
    border: '1px solid #2B3150',
    marginBottom: 10,
  },
  serviceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: 700,
    marginBottom: 4,
  },
  muted: {
    color: '#A7B0C5',
    fontSize: 10,
    lineHeight: 1.45,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 700,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  detail: {
    width: '31.8%',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#0D1020',
    border: '1px solid #2B3150',
  },
  detailLabel: {
    color: '#A7B0C5',
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  policy: {
    marginTop: 10,
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#251A12',
    border: '1px solid #9A5A18',
  },
  policyTitle: {
    color: '#FED7AA',
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 4,
  },
  policyText: {
    color: '#FDBA74',
    fontSize: 9,
    lineHeight: 1.4,
  },
  totals: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#7B3AED',
    marginBottom: 14,
  },
  totalLabel: {
    color: '#EDE9FF',
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  totalValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoBox: {
    width: '48.5%',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#15182A',
    border: '1px solid #2B3150',
  },
  infoBoxWide: {
    width: '100%',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#15182A',
    border: '1px solid #2B3150',
  },
  footer: {
    marginTop: 12,
    paddingTop: 14,
    borderTop: '1px solid #2B3150',
    color: '#A7B0C5',
    fontSize: 9,
    textAlign: 'center',
  },
});

const h = React.createElement;

function ComprovantePdf({
  agendamentos,
}: {
  agendamentos: any[];
}) {
  const agendamento = agendamentos[0];

  const nomeCliente = agendamento?.cliente?.nome || agendamento?.clienteNome || 'Cliente';
  const nomeEmpresa = agendamento?.empresa?.nome || 'Empresa';
  const telefoneEmpresa = agendamento?.empresa?.telefone || agendamento?.empresa?.whatsapp || '';
  const enderecoEmpresa = formatarEndereco(agendamento?.empresa?.endereco);

  const existePrePagamento = agendamentos.some((item: any) =>
    Boolean(item?.servico?.exigePrePagamento)
  );

  const todosPagamentosAprovados = agendamentos.every((item: any) => {
    const exigePrePagamentoItem = Boolean(item?.servico?.exigePrePagamento);
    if (!exigePrePagamentoItem) return true;
    return pagamentoFoiAprovado(item?.statusPagamento);
  });

  const agendamentoConfirmado = !existePrePagamento || todosPagamentosAprovados;

  const statusPagamento = existePrePagamento
    ? todosPagamentosAprovados
      ? 'Pago'
      : 'Aguardando pagamento'
    : 'Sem pré-pagamento';

  const totalGeral = agendamentos.reduce((total: number, item: any) => {
    return total + Number(obterValorServico(item));
  }, 0);

  const totalPrePagamento = agendamentos.reduce(
    (total: number, item: any) => total + Number(obterValorPrePagamento(item)),
    0
  );

  const servicos = agendamentos.map((item: any, index: number) => {
    const exigePrePagamentoItem = Boolean(item?.servico?.exigePrePagamento);
    const statusPagamentoItem = textoPagamento(
      item?.statusPagamento,
      exigePrePagamentoItem
    );
    const valorServicoItem = obterValorServico(item);
    const valorPrePagamentoItem = obterValorPrePagamento(item);

    return h(
      View,
      {
        key: item.id,
        style: styles.serviceCard,
      },
      h(
        View,
        {
          style: styles.serviceTop,
        },
        h(
          View,
          null,
          h(Text, { style: styles.muted }, `Serviço ${index + 1}`),
          h(Text, { style: styles.serviceName }, item?.servico?.nome || 'Serviço'),
          h(
            Text,
            { style: styles.muted },
            `${formatarData(item?.dataHoraInicio)} às ${formatarHora(item?.dataHoraInicio)}`
          )
        ),
        h(Text, { style: styles.price }, formatarMoeda(valorServicoItem))
      ),
      h(
        View,
        {
          style: styles.detailGrid,
        },
        h(
          View,
          { style: styles.detail },
          h(Text, { style: styles.detailLabel }, 'Profissional'),
          h(Text, { style: styles.detailValue }, item?.profissional?.nome || 'Profissional')
        ),
        h(
          View,
          { style: styles.detail },
          h(Text, { style: styles.detailLabel }, 'Duração'),
          h(Text, { style: styles.detailValue }, `${item?.duracaoMin || item?.servico?.duracaoMin || 30} minutos`)
        ),
        h(
          View,
          { style: styles.detail },
          h(Text, { style: styles.detailLabel }, 'Pagamento'),
          h(Text, { style: styles.detailValue }, statusPagamentoItem)
        )
      ),
      exigePrePagamentoItem
        ? h(
            View,
            { style: styles.policy },
            h(Text, { style: styles.policyTitle }, `Pré-pagamento: ${formatarMoeda(valorPrePagamentoItem)}`),
            h(
              Text,
              { style: styles.policyText },
              'O valor pago não é reembolsável em caso de falta no dia do atendimento ou se o cancelamento/reagendamento não for solicitado com pelo menos 24 horas de antecedência.'
            )
          )
        : null
    );
  });

  return h(
    Document,
    {
      title: `Comprovante de agendamento - ${nomeEmpresa}`,
      author: 'Marcaê',
      subject: 'Comprovante de agendamento',
    },
    h(
      Page,
      {
        size: 'A4',
        style: styles.page,
      },
      h(
        View,
        { style: styles.header },
        h(Text, { style: styles.brand }, 'Marcaê • Comprovante digital'),
        h(
          Text,
          { style: styles.title },
          agendamentoConfirmado ? 'Reserva confirmada' : 'Reserva recebida'
        ),
        h(
          Text,
          { style: styles.subtitle },
          `Olá, ${nomeCliente}. Confira abaixo os detalhes do seu atendimento em ${nomeEmpresa}.`
        ),
        h(
          View,
          { style: styles.statusRow },
          h(
            Text,
            { style: styles.statusPill },
            agendamentoConfirmado ? 'CONFIRMADO' : 'PENDENTE'
          ),
          h(Text, { style: styles.statusPill }, statusPagamento)
        )
      ),
      h(
        View,
        { style: styles.card },
        h(Text, { style: styles.sectionLabel }, 'Resumo do atendimento'),
        h(
          Text,
          { style: styles.sectionTitle },
          `${agendamentos.length} ${agendamentos.length === 1 ? 'serviço agendado' : 'serviços agendados'}`
        ),
        ...servicos
      ),
      h(
        View,
        { style: styles.totals },
        h(Text, { style: styles.totalLabel }, 'Total dos serviços'),
        h(Text, { style: styles.totalValue }, formatarMoeda(totalGeral)),
        existePrePagamento
          ? h(
              React.Fragment,
              null,
              h(Text, { style: styles.totalLabel }, 'Valor pago agora'),
              h(Text, { style: styles.totalValue }, formatarMoeda(totalPrePagamento))
            )
          : null,
        h(Text, { style: styles.totalLabel }, 'Status geral'),
        h(Text, { style: styles.totalValue }, statusPagamento)
      ),
      h(
        View,
        { style: styles.card },
        h(Text, { style: styles.sectionLabel }, 'Dados do atendimento'),
        h(
          View,
          { style: styles.infoGrid },
          h(
            View,
            { style: styles.infoBox },
            h(Text, { style: styles.detailLabel }, 'Cliente'),
            h(Text, { style: styles.detailValue }, nomeCliente)
          ),
          h(
            View,
            { style: styles.infoBox },
            h(Text, { style: styles.detailLabel }, 'Empresa'),
            h(Text, { style: styles.detailValue }, nomeEmpresa)
          ),
          telefoneEmpresa
            ? h(
                View,
                { style: styles.infoBox },
                h(Text, { style: styles.detailLabel }, 'Contato'),
                h(Text, { style: styles.detailValue }, telefoneEmpresa)
              )
            : null,
          enderecoEmpresa
            ? h(
                View,
                { style: styles.infoBoxWide },
                h(Text, { style: styles.detailLabel }, 'Endereço'),
                h(Text, { style: styles.detailValue }, enderecoEmpresa)
              )
            : null
        )
      ),
      h(
        Text,
        { style: styles.footer },
        'Gerado automaticamente pelo Marcaê. Guarde este comprovante para consulta.'
      )
    )
  );
}

export async function GET(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const { id } = await params;
    const idsParam = request.nextUrl.searchParams.get('ids');

    const ids =
      idsParam
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean) || [id];

    const agendamentos = await buscarAgendamentosDoComprovante(id, ids);

    if (!agendamentos.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agendamento não encontrado.',
        },
        {
          status: 404,
        }
      );
    }

    const pdfDocument = ComprovantePdf({
      agendamentos,
    }) as any;

    const buffer = await renderToBuffer(pdfDocument);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="comprovante-${id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar comprovante PDF:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao gerar comprovante PDF.',
      },
      {
        status: 500,
      }
    );
  }
}
