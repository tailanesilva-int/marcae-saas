import { addMinutes, endOfDay, format, isBefore, parse, startOfDay } from 'date-fns';
import { prisma } from '@/lib/prisma';

export async function gerarHorariosDisponiveis(params: {
  data: Date;
  empresaId: string;
  servicoId: string;
  profissionalId?: string;
}) {
  const { data, empresaId, servicoId, profissionalId } = params;
  const diaSemana = data.getDay();

  const servico = await prisma.servico.findFirst({
    where: { id: servicoId, empresaId, ativo: true, permiteAgendamentoOnline: true },
  });

  if (!servico) return [];

  if (profissionalId) {
    const profissionalAtende = await prisma.profissionalServico.findFirst({
      where: { empresaId, profissionalId, servicoId },
    });

    if (!profissionalAtende) return [];
  }

  let disponibilidade = await prisma.disponibilidade.findFirst({
    where: {
      empresaId,
      profissionalId: profissionalId ?? null,
      diaSemana,
      ativo: true,
    },
    orderBy: { horaInicio: 'asc' },
  });

  if (!disponibilidade && profissionalId) {
    disponibilidade = await prisma.disponibilidade.findFirst({
      where: { empresaId, profissionalId: null, diaSemana, ativo: true },
      orderBy: { horaInicio: 'asc' },
    });
  }

  if (!disponibilidade) return [];

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      empresaId,
      ...(profissionalId ? { profissionalId } : {}),
      dataHoraInicio: { gte: startOfDay(data) },
      dataHoraFim: { lte: endOfDay(data) },
      status: { in: ['pendente', 'pendente_pagamento', 'confirmado'] },
    },
    select: { dataHoraInicio: true, dataHoraFim: true },
  });

  const slots: string[] = [];
  let atual = parse(disponibilidade.horaInicio, 'HH:mm', data);
  const limite = parse(disponibilidade.horaFim, 'HH:mm', data);

  while (!isBefore(limite, addMinutes(atual, Number(servico.duracaoMin)))) {
    const slotInicio = atual;
    const slotFim = addMinutes(atual, Number(servico.duracaoMin));

    const ocupado = agendamentos.some((a) => {
      if (!a.dataHoraInicio || !a.dataHoraFim) return false;

      return slotInicio < a.dataHoraFim && slotFim > a.dataHoraInicio;
    });

    const passado = isBefore(slotInicio, new Date());

    if (!ocupado && !passado) {
      slots.push(format(slotInicio, 'HH:mm'));
    }

    atual = addMinutes(atual, disponibilidade.intervaloMin);
  }

  return slots;
}

export function calcularPrePagamento(servico: {
  exigePrePagamento: boolean;
  valor: unknown;
  tipoPrePagamento?: string | null;
  valorPrePagamento?: unknown;
}) {
  if (!servico.exigePrePagamento) return 0;

  const valorServico = Number(servico.valor);
  const valorConfig = Number(servico.valorPrePagamento ?? 0);

  if (servico.tipoPrePagamento === 'percentual') {
    return valorServico * (valorConfig / 100);
  }

  return valorConfig;
}