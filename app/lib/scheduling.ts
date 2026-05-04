import { prisma } from './prisma';

export async function gerarHorariosDisponiveis({
  data,
  empresaId,
  servicoId,
  profissionalId,
}: {
  data: Date;
  empresaId: string;
  servicoId: string;
  profissionalId?: string;
}) {
  const diaSemana = data.getDay(); // 0 = domingo, 1 = segunda...

  // Buscar disponibilidade
  const disponibilidades = await prisma.disponibilidade.findMany({
    where: {
      empresaId,
      profissionalId: profissionalId || undefined,
      diaSemana,
    },
  });

  if (!disponibilidades.length) return [];

  // Buscar duração do serviço
  const servico = await prisma.servico.findUnique({
    where: { id: servicoId },
  });

  if (!servico) return [];

  const duracao = servico.duracaoMin;

  const horarios: string[] = [];

  for (const d of disponibilidades) {
    let hora = parseInt(d.horaInicio.split(':')[0]);
    const fim = parseInt(d.horaFim.split(':')[0]);

    while (hora + duracao / 60 <= fim) {
      horarios.push(`${String(hora).padStart(2, '0')}:00`);
      hora += duracao / 60;
    }
  }

  return horarios;
}