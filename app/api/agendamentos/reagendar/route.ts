import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function limparCpf(cpf?: string | null) {
  return String(cpf || '').replace(/\D/g, '');
}

function formatarDataParaCampo(dataHora: Date) {
  const ano = dataHora.getFullYear();
  const mes = String(dataHora.getMonth() + 1).padStart(2, '0');
  const dia = String(dataHora.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function formatarHoraParaCampo(dataHora: Date) {
  const hora = String(dataHora.getHours()).padStart(2, '0');
  const minuto = String(dataHora.getMinutes()).padStart(2, '0');

  return `${hora}:${minuto}`;
}

function horasAteAtendimento(dataHoraInicio: Date) {
  const agora = new Date();
  return (dataHoraInicio.getTime() - agora.getTime()) / (1000 * 60 * 60);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get('empresaId');
    const cpf = searchParams.get('cpf');

    if (!empresaId || !cpf) {
      return NextResponse.json(
        { success: false, error: 'empresaId e cpf são obrigatórios.' },
        { status: 400 }
      );
    }

    const cpfLimpo = limparCpf(cpf);

    const clientes = await prisma.cliente.findMany({
      where: {
        empresaId,
      },
    });

    const cliente = clientes.find((c) => limparCpf(c.cpf) === cpfLimpo);

    if (!cliente) {
      return NextResponse.json({
        success: true,
        cliente: null,
        agendamentos: [],
      });
    }

    const agora = new Date();

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        empresaId,
        clienteId: cliente.id,
        status: {
          in: ['confirmado', 'pendente'],
        },
        statusPagamento: {
          in: ['pago', 'confirmado', 'aprovado'],
        },
        dataHoraInicio: {
          gte: agora,
        },
      },
      include: {
        cliente: true,
        servico: true,
        profissional: true,
        empresa: true,
      },
      orderBy: {
        dataHoraInicio: 'asc',
      },
    });

    const agendamentosFormatados = agendamentos
      .filter((agendamento) => Boolean(agendamento.dataHoraInicio))
      .map((agendamento) => {
        const dataHoraInicio = agendamento.dataHoraInicio as Date;
        const horasRestantes = horasAteAtendimento(dataHoraInicio);

        return {
          ...agendamento,
          podeReagendarPublico: horasRestantes >= 24,
          horasRestantes,
          motivoBloqueio:
            horasRestantes < 24
              ? 'O reagendamento pelo link público só é permitido com pelo menos 24h de antecedência.'
              : null,
        };
      });

    return NextResponse.json({
      success: true,
      cliente,
      agendamentos: agendamentosFormatados,
    });
  } catch (error: any) {
    console.error('Erro ao buscar agendamentos para reagendamento:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar agendamentos para reagendamento.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      agendamentoId,
      dataHoraInicio,
      servicoId,
      profissionalId,
      permitirMenosDe24h,
    } = body;

    if (!agendamentoId) {
      return NextResponse.json(
        { success: false, error: 'agendamentoId é obrigatório.' },
        { status: 400 }
      );
    }

    if (!dataHoraInicio) {
      return NextResponse.json(
        { success: false, error: 'dataHoraInicio é obrigatório.' },
        { status: 400 }
      );
    }

    const agendamento = await prisma.agendamento.findUnique({
      where: {
        id: agendamentoId,
      },
      include: {
        cliente: true,
        servico: true,
        profissional: true,
        empresa: true,
      },
    });

    if (!agendamento) {
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado.' },
        { status: 404 }
      );
    }

    if (!agendamento.dataHoraInicio) {
      return NextResponse.json(
        {
          success: false,
          error: 'Este agendamento não possui data/hora de início válida.',
        },
        { status: 400 }
      );
    }

    if (agendamento.status === 'cancelado') {
      return NextResponse.json(
        {
          success: false,
          error: 'Este agendamento está cancelado e não pode ser reagendado.',
        },
        { status: 400 }
      );
    }

    const pagamentoConfirmado =
      agendamento.statusPagamento === 'pago' ||
      agendamento.statusPagamento === 'confirmado' ||
      agendamento.statusPagamento === 'aprovado';

    if (!permitirMenosDe24h && !pagamentoConfirmado) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Este agendamento ainda não possui pagamento confirmado para reagendamento sem nova cobrança.',
        },
        { status: 400 }
      );
    }

    const horasRestantes = horasAteAtendimento(agendamento.dataHoraInicio);

    if (!permitirMenosDe24h && horasRestantes < 24) {
      return NextResponse.json(
        {
          success: false,
          error:
            'O reagendamento pelo link público só é permitido com pelo menos 24h de antecedência.',
        },
        { status: 403 }
      );
    }

    const novoInicio = new Date(dataHoraInicio);

    if (Number.isNaN(novoInicio.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Nova data/hora inválida.' },
        { status: 400 }
      );
    }

    const agora = new Date();

    if (novoInicio < agora) {
      return NextResponse.json(
        {
          success: false,
          error: 'A nova data do atendimento não pode ser anterior ao dia atual.',
        },
        { status: 400 }
      );
    }

    const servicoFinalId = servicoId || agendamento.servicoId;

    const servico = await prisma.servico.findUnique({
      where: {
        id: servicoFinalId,
      },
    });

    if (!servico) {
      return NextResponse.json(
        { success: false, error: 'Serviço não encontrado.' },
        { status: 404 }
      );
    }

    if (servico.empresaId !== agendamento.empresaId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Serviço não pertence à empresa do agendamento.',
        },
        { status: 400 }
      );
    }

    const novoFim = new Date(novoInicio);
    novoFim.setMinutes(novoFim.getMinutes() + Number(servico.duracaoMin || 30));

    const agendamentoAtualizado = await prisma.agendamento.update({
      where: {
        id: agendamento.id,
      },
      data: {
        servicoId: servicoFinalId,
        profissionalId: profissionalId || agendamento.profissionalId || null,

        data: formatarDataParaCampo(novoInicio),
        horaInicio: formatarHoraParaCampo(novoInicio),
        duracaoMin: Number(servico.duracaoMin || 30),

        dataHoraInicio: novoInicio,
        dataHoraFim: novoFim,

        valorTotal: servico.valor || agendamento.valorTotal,
        valorPrePago: agendamento.valorPrePago,

        status: agendamento.status === 'pendente' ? 'pendente' : 'confirmado',
        statusPagamento: agendamento.statusPagamento,

        lembreteWhatsappEnviado: false,
        lembreteWhatsappEnviadoAt: null,
      },
      include: {
        cliente: true,
        servico: true,
        profissional: true,
        empresa: true,
      },
    });

    return NextResponse.json({
      success: true,
      agendamento: agendamentoAtualizado,
      message: 'Agendamento reagendado com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao reagendar atendimento:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao reagendar atendimento.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { agendamentoId, motivoCancelamento } = body;

    if (!agendamentoId) {
      return NextResponse.json(
        { success: false, error: 'agendamentoId é obrigatório.' },
        { status: 400 }
      );
    }

    const agendamento = await prisma.agendamento.findUnique({
      where: {
        id: agendamentoId,
      },
    });

    if (!agendamento) {
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado.' },
        { status: 404 }
      );
    }

    const agendamentoCancelado = await prisma.agendamento.update({
      where: {
        id: agendamentoId,
      },
      data: {
        status: 'cancelado',
        motivoCancelamento: motivoCancelamento?.trim() || null,
        canceladoEm: new Date(),
        lembreteWhatsappEnviado: true,
        lembreteWhatsappEnviadoAt: new Date(),
      },
      include: {
        cliente: true,
        servico: true,
        profissional: true,
        empresa: true,
      },
    });

    return NextResponse.json({
      success: true,
      agendamento: agendamentoCancelado,
      message: 'Agendamento cancelado com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao cancelar atendimento:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao cancelar atendimento.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}