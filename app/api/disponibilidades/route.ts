import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profissionalId = searchParams.get('profissionalId');

    if (!profissionalId) {
      return NextResponse.json(
        { success: false, error: 'profissionalId obrigatório' },
        { status: 400 }
      );
    }

    const disponibilidades = await prisma.disponibilidade.findMany({
      where: { profissionalId },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });

    const disponibilidadesIds = disponibilidades.map((item) => item.id);

    const servicosDisponibilidade =
      disponibilidadesIds.length > 0
        ? await prisma.disponibilidadeServico.findMany({
            where: {
              disponibilidadeId: {
                in: disponibilidadesIds,
              },
            },
          })
        : [];

    const disponibilidadesComServicos = disponibilidades.map((item) => {
      const servicosIds = servicosDisponibilidade
        .filter((servico) => servico.disponibilidadeId === item.id)
        .map((servico) => servico.servicoId);

      return {
        ...item,
        servicosIds,
        servicos: servicosIds.map((servicoId) => ({
          servicoId,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      disponibilidades: disponibilidadesComServicos,
    });
  } catch (error) {
    console.error('Erro ao buscar disponibilidades:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao buscar disponibilidades' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { empresaId, profissionalId, disponibilidades } = body;

    if (!empresaId || !profissionalId) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios não informados' },
        { status: 400 }
      );
    }

    if (!Array.isArray(disponibilidades)) {
      return NextResponse.json(
        { success: false, error: 'Disponibilidades inválidas' },
        { status: 400 }
      );
    }

    const disponibilidadesNormalizadas = disponibilidades.flatMap((dia: any) => {
      if (!dia?.ativo) return [];
      if (!Array.isArray(dia.blocos)) return [];

      return dia.blocos
        .filter((bloco: any) => bloco?.horaInicio && bloco?.horaFim)
        .map((bloco: any) => ({
          empresaId,
          profissionalId,
          diaSemana: Number(dia.diaSemana),
          horaInicio: bloco.horaInicio,
          horaFim: bloco.horaFim,
          ativo: true,
          intervaloMin: Number(bloco.intervaloMin || dia.intervaloMin || 30),
          tipo: bloco.tipo || 'trabalho',
          servicosIds: Array.isArray(bloco.servicosIds)
            ? bloco.servicosIds.filter(Boolean)
            : [],
        }));
    });

    for (const item of disponibilidadesNormalizadas) {
      if (item.horaInicio >= item.horaFim) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Existe um bloco de horário inválido. O horário inicial precisa ser menor que o horário final.',
          },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.disponibilidade.deleteMany({
        where: { profissionalId },
      });

      for (const item of disponibilidadesNormalizadas) {
        const disponibilidadeCriada = await tx.disponibilidade.create({
          data: {
            empresaId: item.empresaId,
            profissionalId: item.profissionalId,
            diaSemana: item.diaSemana,
            horaInicio: item.horaInicio,
            horaFim: item.horaFim,
            ativo: item.ativo,
            intervaloMin: item.intervaloMin,
            tipo: item.tipo,
          },
        });

        if (item.servicosIds.length > 0) {
          await tx.disponibilidadeServico.createMany({
            data: item.servicosIds.map((servicoId: string) => ({
              disponibilidadeId: disponibilidadeCriada.id,
              servicoId,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Erro ao salvar disponibilidade:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao salvar disponibilidade' },
      { status: 500 }
    );
  }
}