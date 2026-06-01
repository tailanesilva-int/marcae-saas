import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TIMEZONE_OFFSET_BRASIL = '-03:00';

function limparCpf(cpf?: string | null) {
  return String(cpf || '').replace(/\D/g, '');
}

function criarDataBrasil(data: string, horario: string) {
  return new Date(`${data}T${horario}:00${TIMEZONE_OFFSET_BRASIL}`);
}

function hojeBrasilFormatoInput() {
  const agora = new Date();

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora);
}

function formatarHorario(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function formatarDataParaCampoBrasil(data: string) {
  return data;
}

function inteiroPositivo(valor: any, padrao = 1) {
  const convertido = Number(valor);

  if (!Number.isFinite(convertido) || convertido < 1) {
    return padrao;
  }

  return Math.max(Math.floor(convertido), 1);
}

function minutosServico(valor: any) {
  const convertido = Number(valor);

  if (!Number.isFinite(convertido) || convertido < 5) {
    return 30;
  }

  return Math.max(Math.floor(convertido), 5);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get('empresaId');
    const profissionalId = searchParams.get('profissionalId');
    const servicoId = searchParams.get('servicoId');
    const data = searchParams.get('data');
    const clienteId = searchParams.get('clienteId');
    const cpfCliente = limparCpf(searchParams.get('cpf'));

    if (!profissionalId || !servicoId || !data) {
      return NextResponse.json(
        { error: 'Dados obrigatórios' },
        { status: 400 }
      );
    }

    const dataSelecionada = criarDataBrasil(data, '12:00');
    const diaSemana = dataSelecionada.getDay();

    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
    });

    if (!servico) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    const duracaoServicoMin = minutosServico((servico as any).duracaoMin);

    const disponibilidades = await prisma.disponibilidade.findMany({
      where: {
        profissionalId,
        diaSemana,
        ativo: true,
        OR: [
          {
            disponibilidadeServicos: {
              none: {},
            },
          },
          {
            disponibilidadeServicos: {
              some: {
                servicoId,
              },
            },
          },
        ],
      },
      include: {
        disponibilidadeServicos: true,
      },
      orderBy: {
        horaInicio: 'asc',
      },
    });

    if (!disponibilidades.length) {
      return NextResponse.json({
        horarios: [],
        duracaoServicoMin,
        intervaloAplicadoMin: duracaoServicoMin,
      });
    }

    const dataCampo = formatarDataParaCampoBrasil(data);
    const capacidadeSimultanea = inteiroPositivo(
      (servico as any).capacidadeSimultanea,
      1
    );

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        ...(empresaId ? { empresaId } : {}),
        profissionalId,
        servicoId,
        data: dataCampo,
        status: {
          not: 'cancelado',
        },
      },
      select: {
        id: true,
        servicoId: true,
        data: true,
        horaInicio: true,
        clienteId: true,
        clienteCpf: true,
      },
    });

    const horarios: string[] = [];

    const agora = new Date();
    const hojeBrasil = hojeBrasilFormatoInput();
    const mesmaData = data === hojeBrasil;

    for (const disponibilidade of disponibilidades) {
      const [horaIni, minIni] = String(disponibilidade.horaInicio || '00:00')
        .split(':')
        .map(Number);

      const [horaFim, minFim] = String(disponibilidade.horaFim || '00:00')
        .split(':')
        .map(Number);

      let atual = criarDataBrasil(
        data,
        `${String(horaIni).padStart(2, '0')}:${String(minIni).padStart(2, '0')}`
      );

      const fim = criarDataBrasil(
        data,
        `${String(horaFim).padStart(2, '0')}:${String(minFim).padStart(2, '0')}`
      );

      while (true) {
        const fimAtendimento = new Date(atual);
        fimAtendimento.setMinutes(fimAtendimento.getMinutes() + duracaoServicoMin);

        if (fimAtendimento > fim) break;

        const horarioPassado = mesmaData && atual <= agora;
        const horarioFormatado = formatarHorario(atual);

        const agendamentosMesmoHorario = agendamentos.filter(
          (agendamento) =>
            agendamento.data === dataCampo &&
            agendamento.horaInicio === horarioFormatado
        );

        const clienteJaTemEsseHorario = agendamentosMesmoHorario.some((agendamento) => {
          const mesmoClienteId =
            Boolean(clienteId) && agendamento.clienteId === clienteId;

          const mesmoCpf =
            Boolean(cpfCliente) &&
            limparCpf(agendamento.clienteCpf) === cpfCliente;

          return mesmoClienteId || mesmoCpf;
        });

        const quantidadeMesmoServicoNoHorario = agendamentosMesmoHorario.length;

        const ocupado =
          clienteJaTemEsseHorario ||
          quantidadeMesmoServicoNoHorario >= capacidadeSimultanea;

        if (!ocupado && !horarioPassado && !horarios.includes(horarioFormatado)) {
          horarios.push(horarioFormatado);
        }

        atual = new Date(atual.getTime() + duracaoServicoMin * 60000);
      }
    }

    return NextResponse.json({
      horarios,
      duracaoServicoMin,
      intervaloAplicadoMin: duracaoServicoMin,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}
