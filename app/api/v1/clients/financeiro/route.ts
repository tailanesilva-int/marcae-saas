import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const movimentacaoSchema = z.object({
  empresaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  agendamentoId: z.string().uuid().optional().nullable(),
  tipo: z.enum(['credito', 'debito']),
  valor: z.union([z.string(), z.number()]),
  origem: z.string().optional(),
  observacao: z.string().optional().nullable(),
});

const atualizarMovimentacaoSchema = z.object({
  empresaId: z.string().uuid(),
  movimentacaoId: z.string(),
  status: z.enum(['ativo', 'usado', 'cancelado']),
  observacao: z.string().optional().nullable(),
  usadoEmAgendamentoId: z.string().uuid().optional().nullable(),
});

function numero(valor: any) {
  const convertido = Number(String(valor || 0).replace(',', '.'));
  return Number.isNaN(convertido) ? 0 : convertido;
}

function calcularResumo(movimentacoes: any[]) {
  const ativas = (movimentacoes || []).filter((item) => item.status === 'ativo');

  const credito = ativas
    .filter((item) => item.tipo === 'credito')
    .reduce((total, item) => total + numero(item.valor), 0);

  const debito = ativas
    .filter((item) => item.tipo === 'debito')
    .reduce((total, item) => total + numero(item.valor), 0);

  return {
    credito,
    debito,
    saldo: credito - debito,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const empresaId = searchParams.get('empresaId');
  const clienteId = searchParams.get('clienteId');

  if (!empresaId) {
    return NextResponse.json(
      { success: false, error: 'Empresa obrigatória.' },
      { status: 400 }
    );
  }

  const movimentacoesBase =
  await prisma.clienteMovimentacaoFinanceira.findMany({
    where: {
      empresaId,
      ...(clienteId
        ? { clienteId }
        : {}),
    },
    include: {
      cliente: {
        select: {
          id: true,
          nome: true,
          whatsapp: true,
          cpf: true,
        },
      },
      agendamento: {
        select: {
          id: true,
          dataHoraInicio: true,
          status: true,
          statusPagamento: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

const saldoClientes:
  Record<string, number> = {};

const movimentacoes =
  movimentacoesBase.map(
    (movimentacao) => {
      const clienteIdAtual =
        movimentacao.clienteId;

      if (
        !saldoClientes[
          clienteIdAtual
        ]
      ) {
        saldoClientes[
          clienteIdAtual
        ] = 0;
      }

      const valor =
        numero(
          movimentacao.valor
        );

      if (
        movimentacao.tipo ===
        'credito'
      ) {
        saldoClientes[
          clienteIdAtual
        ] += valor;
      } else {
        saldoClientes[
          clienteIdAtual
        ] -= valor;
      }

      return {
        ...movimentacao,
        saldoFinalCliente:
          saldoClientes[
            clienteIdAtual
          ],
      };
    }
  ).reverse();

const resumoPorClienteMap =
  new Map();

movimentacoes.forEach(
  (movimentacao) => {
    const clienteIdAtual =
      movimentacao.clienteId;

    const nomeCliente =
      movimentacao.cliente
        ?.nome || 'Cliente';

    if (
      !resumoPorClienteMap.has(
        clienteIdAtual
      )
    ) {
      resumoPorClienteMap.set(
        clienteIdAtual,
        {
          clienteId:
            clienteIdAtual,

          clienteNome:
            nomeCliente,

          totalCredito: 0,

          totalDebito: 0,

          saldoFinal: 0,

          quantidadeMovimentacoes: 0,
        }
      );
    }

    const resumoCliente =
      resumoPorClienteMap.get(
        clienteIdAtual
      );

    const valor =
      numero(
        movimentacao.valor
      );

    if (
      movimentacao.tipo ===
      'credito'
    ) {
      resumoCliente.totalCredito +=
        valor;
    } else {
      resumoCliente.totalDebito +=
        valor;
    }

    resumoCliente.saldoFinal =
      resumoCliente.totalCredito -
      resumoCliente.totalDebito;

    resumoCliente.quantidadeMovimentacoes +=
      1;
  }
);

const resumoPorCliente =
  Array.from(
    resumoPorClienteMap.values()
  ).sort(
    (a: any, b: any) =>
      b.saldoFinal -
      a.saldoFinal
  );

  return NextResponse.json({
  success: true,

  resumo:
    calcularResumo(
      movimentacoes
    ),

  movimentacoes,

  resumoPorCliente,
});
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = movimentacaoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Dados inválidos.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const valor = numero(data.valor);

  if (valor <= 0) {
    return NextResponse.json(
      { success: false, error: 'Informe um valor maior que zero.' },
      { status: 400 }
    );
  }

  const cliente = await prisma.cliente.findFirst({
    where: {
      id: data.clienteId,
      empresaId: data.empresaId,
    },
  });

  if (!cliente) {
    return NextResponse.json(
      { success: false, error: 'Cliente não encontrado.' },
      { status: 404 }
    );
  }

  if (data.agendamentoId) {
    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id: data.agendamentoId,
        empresaId: data.empresaId,
        clienteId: data.clienteId,
      },
    });

    if (!agendamento) {
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado para este cliente.' },
        { status: 404 }
      );
    }
  }

  const movimentacao = await prisma.clienteMovimentacaoFinanceira.create({
    data: {
      empresaId: data.empresaId,
      clienteId: data.clienteId,
      agendamentoId: data.agendamentoId || null,
      tipo: data.tipo,
      valor,
      origem: data.origem || 'ajuste_manual',
      observacao: data.observacao || null,
      status: 'ativo',
    },
  });

  const movimentacoes = await prisma.clienteMovimentacaoFinanceira.findMany({
    where: {
      empresaId: data.empresaId,
      clienteId: data.clienteId,
    },
  });

  return NextResponse.json({
    success: true,
    movimentacao,
    resumo: calcularResumo(movimentacoes),
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = atualizarMovimentacaoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Dados inválidos.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const movimentacaoAtual = await prisma.clienteMovimentacaoFinanceira.findFirst({
    where: {
      id: data.movimentacaoId,
      empresaId: data.empresaId,
    },
  });

  if (!movimentacaoAtual) {
    return NextResponse.json(
      { success: false, error: 'Movimentação não encontrada.' },
      { status: 404 }
    );
  }

  const movimentacao = await prisma.clienteMovimentacaoFinanceira.update({
    where: {
      id: data.movimentacaoId,
    },
    data: {
      status: data.status,
      observacao: data.observacao ?? movimentacaoAtual.observacao,
      usadoEmAgendamentoId: data.usadoEmAgendamentoId || null,
    },
  });

  const movimentacoes = await prisma.clienteMovimentacaoFinanceira.findMany({
    where: {
      empresaId: data.empresaId,
      clienteId: movimentacao.clienteId,
    },
  });

  return NextResponse.json({
    success: true,
    movimentacao,
    resumo: calcularResumo(movimentacoes),
  });
}
