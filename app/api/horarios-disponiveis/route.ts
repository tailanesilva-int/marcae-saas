import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TIMEZONE_OFFSET_BRASIL = '-03:00';

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const profissionalId = searchParams.get('profissionalId');
    const servicoId = searchParams.get('servicoId');
    const data = searchParams.get('data');

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

    const disponibilidade = await prisma.disponibilidade.findFirst({
      where: {
        profissionalId,
        diaSemana,
        ativo: true,
      },
    });

    if (!disponibilidade) {
      return NextResponse.json({ horarios: [] });
    }

    const inicioDia = criarDataBrasil(data, '00:00');
    const fimDia = criarDataBrasil(data, '23:59');

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        profissionalId,
        status: {
          not: 'cancelado',
        },
        dataHoraInicio: {
          gte: inicioDia,
          lte: fimDia,
        },
      },
    });

    const horarios: string[] = [];

    const [horaIni, minIni] = disponibilidade.horaInicio
      .split(':')
      .map(Number);

    const [horaFim, minFim] = disponibilidade.horaFim
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

    const agora = new Date();
    const hojeBrasil = hojeBrasilFormatoInput();
    const mesmaData = data === hojeBrasil;

    while (true) {
      const proximo = new Date(atual);
      proximo.setMinutes(proximo.getMinutes() + servico.duracaoMin);

      if (proximo > fim) break;

      const horarioPassado = mesmaData && atual <= agora;

      const ocupado = agendamentos.some((ag) => {
        if (!ag.dataHoraInicio || !ag.dataHoraFim) {
          return false;
        }

        return (
          atual < new Date(ag.dataHoraFim) &&
          proximo > new Date(ag.dataHoraInicio)
        );
      });

      if (!ocupado && !horarioPassado) {
        horarios.push(formatarHorario(atual));
      }

      atual = proximo;
    }

    return NextResponse.json({ horarios });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}