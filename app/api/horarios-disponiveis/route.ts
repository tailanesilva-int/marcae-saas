import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const profissionalId = searchParams.get('profissionalId');
    const servicoId = searchParams.get('servicoId');
    const data = searchParams.get('data');

    if (!profissionalId || !servicoId || !data) {
      return NextResponse.json({ error: 'Dados obrigatórios' }, { status: 400 });
    }

    const dataSelecionada = new Date(data + 'T00:00:00');
    const diaSemana = dataSelecionada.getDay();

    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
    });

    if (!servico) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
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

    const inicioDia = new Date(data + 'T00:00:00');
    const fimDia = new Date(data + 'T23:59:59');

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        profissionalId,
        dataHoraInicio: {
          gte: inicioDia,
          lte: fimDia,
        },
      },
    });

    const horarios: string[] = [];

    const [horaIni, minIni] = disponibilidade.horaInicio.split(':').map(Number);
    const [horaFim, minFim] = disponibilidade.horaFim.split(':').map(Number);

    let atual = new Date(data);
    atual.setHours(horaIni, minIni, 0, 0);

    const fim = new Date(data);
    fim.setHours(horaFim, minFim, 0, 0);

    while (true) {
      const proximo = new Date(atual);
      proximo.setMinutes(proximo.getMinutes() + servico.duracaoMin);

      if (proximo > fim) break;

      const ocupado = agendamentos.some((ag) => {
        if (!ag.dataHoraInicio || !ag.dataHoraFim) return false;

        return (
          atual < new Date(ag.dataHoraFim) &&
          proximo > new Date(ag.dataHoraInicio)
        );
      });

      if (!ocupado) {
        horarios.push(atual.toTimeString().slice(0, 5));
      }

      atual = proximo;
    }

    return NextResponse.json({ horarios });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}