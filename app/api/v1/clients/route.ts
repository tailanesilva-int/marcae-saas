import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const clientSchema = z.object({
  empresaId: z.string().uuid(),
  nome: z.string().min(3),
  cpf: z.string().optional(),
  whatsapp: z.string().min(10),
  dataNascimento: z.string().optional(),
});

const updateClientSchema = z.object({
  empresaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  nome: z.string().min(3),
  cpf: z.string().optional(),
  whatsapp: z.string().min(10),
  dataNascimento: z.string().optional().nullable(),
});

function numero(valor: any) {
  const convertido = Number(valor || 0);
  return Number.isNaN(convertido) ? 0 : convertido;
}

function pagamentoFoiRealizado(status?: string | null) {
  return status === 'pago' || status === 'aprovado' || status === 'confirmado';
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const empresaId = searchParams.get('empresaId');
  const clienteId = searchParams.get('clienteId');

  if (!empresaId) {
    return NextResponse.json(
      { error: 'empresaId obrigatório' },
      { status: 400 }
    );
  }

  if (clienteId) {
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        empresaId,
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado.' },
        { status: 404 }
      );
    }

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        empresaId,
        clienteId,
      },
      include: {
        servico: true,
        profissional: true,
        servicosAdicionais: {
          include: {
            servico: true,
            profissional: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        dataHoraInicio: 'desc',
      },
    });

    const historico = agendamentos.map((agendamento) => {
      const valorPrincipal = numero(
        agendamento.servico?.valor || agendamento.valorTotal
      );

      const principalPago = pagamentoFoiRealizado(agendamento.statusPagamento)
        ? valorPrincipal
        : 0;

      const adicionais = (agendamento.servicosAdicionais || []).map((item) => {
        const valor = numero(item.valor);

        return {
          id: item.id,
          nome: item.servico?.nome || 'Serviço adicional',
          profissional: item.profissional?.nome || 'Não informado',
          valor,
          statusPagamento: item.statusPagamento,
          formaPagamento: item.formaPagamento,
          observacao: item.observacao,
          pago: pagamentoFoiRealizado(item.statusPagamento),
        };
      });

      const totalAdicionais = adicionais.reduce(
        (total, item) => total + numero(item.valor),
        0
      );

      const totalPagoAdicionais = adicionais
        .filter((item) => item.pago)
        .reduce((total, item) => total + numero(item.valor), 0);

      const total = Math.max(
        numero(agendamento.valorTotal),
        valorPrincipal + totalAdicionais
      );

      const pago = principalPago + totalPagoAdicionais;
      const pendente = Math.max(total - pago, 0);

      return {
        id: agendamento.id,
        dataHoraInicio: agendamento.dataHoraInicio,
        dataHoraFim: agendamento.dataHoraFim,
        status: agendamento.status,
        statusPagamento: agendamento.statusPagamento,
        servico: agendamento.servico?.nome || 'Serviço não informado',
        profissional: agendamento.profissional?.nome || 'Não informado',
        valorPrincipal,
        total,
        pago,
        pendente,
        adicionais,
        pagamentos: [],
      };
    });

    return NextResponse.json({
      cliente,
      historico,
    });
  }

  const clientes = await prisma.cliente.findMany({
    where: { empresaId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ clientes });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = clientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const cliente = await prisma.cliente.upsert({
    where: {
      empresaId_whatsapp: {
        empresaId: data.empresaId,
        whatsapp: data.whatsapp,
      },
    },
    update: {
      nome: data.nome,
      cpf: data.cpf,
      dataNascimento: data.dataNascimento
        ? new Date(data.dataNascimento)
        : undefined,
    },
    create: {
      empresaId: data.empresaId,
      nome: data.nome,
      cpf: data.cpf,
      whatsapp: data.whatsapp,
      dataNascimento: data.dataNascimento
        ? new Date(data.dataNascimento)
        : undefined,
    },
  });

  return NextResponse.json(cliente, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = updateClientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const clienteAtual = await prisma.cliente.findFirst({
    where: {
      id: data.clienteId,
      empresaId: data.empresaId,
    },
  });

  if (!clienteAtual) {
    return NextResponse.json(
      { error: 'Cliente não encontrado.' },
      { status: 404 }
    );
  }

  if (data.whatsapp !== clienteAtual.whatsapp) {
    const clienteComWhatsapp = await prisma.cliente.findFirst({
      where: {
        empresaId: data.empresaId,
        whatsapp: data.whatsapp,
        id: {
          not: data.clienteId,
        },
      },
    });

    if (clienteComWhatsapp) {
      return NextResponse.json(
        { error: 'Já existe outro cliente com este WhatsApp.' },
        { status: 400 }
      );
    }
  }

  const cliente = await prisma.cliente.update({
    where: {
      id: data.clienteId,
    },
    data: {
      nome: data.nome,
      cpf: data.cpf || null,
      whatsapp: data.whatsapp,
      dataNascimento: data.dataNascimento
        ? new Date(data.dataNascimento)
        : null,
    },
  });

  await prisma.agendamento.updateMany({
    where: {
      empresaId: data.empresaId,
      clienteId: data.clienteId,
    },
    data: {
      clienteNome: cliente.nome,
      nomeCliente: cliente.nome,
      clienteCpf: cliente.cpf,
      clienteWhatsapp: cliente.whatsapp,
      telefoneCliente: cliente.whatsapp,
      clienteNascimento: cliente.dataNascimento
        ? cliente.dataNascimento.toISOString().slice(0, 10)
        : null,
    },
  });

  return NextResponse.json({
    success: true,
    cliente,
  });
}