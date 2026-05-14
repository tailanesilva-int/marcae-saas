import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { empresaId, servicoId, profissionalId, date, horaInicio, cliente } = body;

    if (!empresaId || !servicoId || !profissionalId || !date || !horaInicio || !cliente?.nome || !cliente?.whatsapp) {
      return NextResponse.json({ error: 'Dados obrigatórios faltando' }, { status: 400 });
    }

    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
    });

    if (!servico) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    const dataHoraInicio = new Date(`${date}T${horaInicio}:00`);
    const dataHoraFim = addMinutes(dataHoraInicio, servico.duracaoMin);

    const cpfLimpo = String(cliente.cpf || '').replace(/\D/g, '');

let clienteRegistro = null;

if (cpfLimpo) {
  const clientesDaEmpresa = await prisma.cliente.findMany({
    where: {
      empresaId,
    },
  });

  clienteRegistro =
    clientesDaEmpresa.find(
      (item) => String(item.cpf || '').replace(/\D/g, '') === cpfLimpo
    ) || null;
}

if (clienteRegistro) {
  clienteRegistro = await prisma.cliente.update({
    where: {
      id: clienteRegistro.id,
    },
    data: {
      nome: cliente.nome,
      cpf: cpfLimpo || null,
      whatsapp: cliente.whatsapp,
      dataNascimento: cliente.dataNascimento
        ? new Date(`${cliente.dataNascimento}T00:00:00`)
        : null,
    },
  });
} else {
  clienteRegistro = await prisma.cliente.create({
    data: {
      empresaId,
      nome: cliente.nome,
      whatsapp: cliente.whatsapp,
      cpf: cpfLimpo || null,
      dataNascimento: cliente.dataNascimento
        ? new Date(`${cliente.dataNascimento}T00:00:00`)
        : null,
    },
  });
}

    const existente = await prisma.agendamento.findFirst({
      where: {
        empresaId,
        profissionalId,
        dataHoraInicio,
      },
    });

    if (existente) {
      return NextResponse.json({ error: 'Esse horário já está ocupado.' }, { status: 409 });
    }

    const agendamento = await prisma.agendamento.create({
      data: {
        empresaId,
        servicoId,
        profissionalId,
        clienteId: clienteRegistro.id,
        dataHoraInicio,
        dataHoraFim,
        duracaoMin: servico.duracaoMin,
        valorTotal: servico.valor,
        valorPrePago: servico.valorPrePagamento ?? null,
        status: 'pendente',
        statusPagamento: 'pendente',
        origem: 'online',
      },
    });

    return NextResponse.json({ success: true, agendamento });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erro ao criar agendamento',
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}