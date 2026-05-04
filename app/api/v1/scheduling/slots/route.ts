import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function toMinutes(hora: string) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function toHora(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addDays(date: Date, days: number) {
  const nova = new Date(date);
  nova.setDate(nova.getDate() + days);
  return nova;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const empresaId = searchParams.get('empresaId');
    const servicoId = searchParams.get('servicoId');
    const profissionalId = searchParams.get('profissionalId');
    const date = searchParams.get('date');

    if (!empresaId || !servicoId || !profissionalId || !date) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      );
    }

    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
    });

    if (!servico) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    const dataSelecionada = new Date(`${date}T00:00:00`);
    const diaSemana = dataSelecionada.getDay();

    const disponibilidade = await prisma.disponibilidade.findFirst({
      where: {
        empresaId,
        profissionalId,
        diaSemana,
      },
    });

    if (!disponibilidade) {
      return NextResponse.json({ slots: [] });
    }

    const inicio = toMinutes(disponibilidade.horaInicio);
    const fim = toMinutes(disponibilidade.horaFim);
    const duracao = servico.duracaoMin || 30;

    const inicioDoDia = new Date(`${date}T00:00:00`);
    const fimDoDia = addDays(inicioDoDia, 1);

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        empresaId,
        profissionalId,
        dataHoraInicio: {
          gte: inicioDoDia,
          lt: fimDoDia,
        },
      },
      select: {
        dataHoraInicio: true,
      },
    });

    const horariosOcupados = new Set(
      agendamentos
        .filter((a) => Boolean(a.dataHoraInicio))
        .map((a) => {
          const dataHoraInicio = a.dataHoraInicio as Date;
          const h = dataHoraInicio.getHours();
          const m = dataHoraInicio.getMinutes();

          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        })
    );

    const slots: string[] = [];

    for (let atual = inicio; atual + duracao <= fim; atual += duracao) {
      const horario = toHora(atual);

      if (!horariosOcupados.has(horario)) {
        slots.push(horario);
      }
    }

    return NextResponse.json({ slots });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erro ao buscar horários',
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}