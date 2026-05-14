import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function limparCpf(cpf?: string | null) {
  return String(cpf || '').replace(/\D/g, '');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const empresaId = searchParams.get('empresaId');
    const cpf = searchParams.get('cpf');

    if (!empresaId || !cpf) {
      return NextResponse.json(
        { error: 'empresaId e cpf são obrigatórios' },
        { status: 400 }
      );
    }

    const cpfLimpo = limparCpf(cpf);

    const clientes = await prisma.cliente.findMany({
      where: {
        empresaId,
      },
      select: {
        id: true,
        nome: true,
        cpf: true,
        whatsapp: true,
        dataNascimento: true,
      },
    });

    const cliente = clientes.find(
      (c) => limparCpf(c.cpf) === cpfLimpo
    );

    if (cliente) {
      return NextResponse.json({
        cliente,
        origem: 'cliente',
      });
    }

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        empresaId,
      },
      orderBy: {
        dataHoraInicio: 'desc',
      },
      select: {
        clienteId: true,
        clienteNome: true,
        clienteCpf: true,
        clienteWhatsapp: true,
        clienteNascimento: true,
        nomeCliente: true,
        telefoneCliente: true,
        dataHoraInicio: true,
      },
    });

    const agendamento = agendamentos.find(
      (item) => limparCpf(item.clienteCpf) === cpfLimpo
    );

    if (!agendamento) {
      return NextResponse.json({
        cliente: null,
        origem: null,
      });
    }

    if (agendamento.clienteId) {
      const clienteVinculado = await prisma.cliente.findFirst({
        where: {
          id: agendamento.clienteId,
          empresaId,
        },
        select: {
          id: true,
          nome: true,
          cpf: true,
          whatsapp: true,
          dataNascimento: true,
        },
      });

      if (clienteVinculado) {
        return NextResponse.json({
          cliente: clienteVinculado,
          origem: 'agendamento_cliente_vinculado',
        });
      }
    }

    const clienteRecuperado = {
      id: null,
      nome:
        agendamento.clienteNome ||
        agendamento.nomeCliente ||
        '',
      cpf: agendamento.clienteCpf || cpfLimpo,
      whatsapp:
        agendamento.clienteWhatsapp ||
        agendamento.telefoneCliente ||
        '',
      dataNascimento:
        agendamento.clienteNascimento || null,
    };

    return NextResponse.json({
      cliente: clienteRecuperado,
      origem: 'agendamento_historico',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erro ao buscar cliente',
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}