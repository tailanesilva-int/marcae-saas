import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import {
  empresaTemRecurso,
  respostaPlanoBloqueado,
} from '@/app/lib/planos';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get('empresaId');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId obrigatório.' },
        { status: 400 }
      );
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada.' },
        { status: 404 }
      );
    }

    if (!empresaTemRecurso(empresa, 'comissoes')) {
      return NextResponse.json(respostaPlanoBloqueado('comissoes'), {
        status: 403,
      });
    }

    const inicio = dataInicio
      ? new Date(`${dataInicio}T00:00:00`)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const fim = dataFim ? new Date(`${dataFim}T23:59:59`) : new Date();

    const comissoes = await prisma.comissao.findMany({
      where: {
        empresaId,
        createdAt: {
          gte: inicio,
          lte: fim,
        },
      },
      include: {
        profissional: true,
        agendamento: {
          include: {
            cliente: true,
            servico: true,
          },
        },
        agendamentoServico: {
          include: {
            servico: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const profissionaisMap: Record<string, any> = {};

    let totalFaturadoGeral = 0;
    let totalComissaoGeral = 0;
    let totalServicosGeral = 0;
    let totalPago = 0;
    let totalPendente = 0;

    for (const comissao of comissoes) {
      const profissional = comissao.profissional;
      const agendamento = comissao.agendamento;

      if (!profissional) continue;

      const valorServico = Number(comissao.valorServico || 0);
      const valorComissao = Number(comissao.valorComissao || 0);
      const custoServico = Number(
        comissao.agendamentoServico?.custo ||
          comissao.agendamentoServico?.servico?.custo ||
          comissao.agendamento?.servico?.custo ||
          0
      );
      const lucroEstimado = valorServico - custoServico - valorComissao;

      totalFaturadoGeral += valorServico;
      totalComissaoGeral += valorComissao;
      totalServicosGeral += 1;

      if (comissao.status === 'pago') {
        totalPago += valorComissao;
      } else {
        totalPendente += valorComissao;
      }

      if (!profissionaisMap[profissional.id]) {
        profissionaisMap[profissional.id] = {
  profissionalId: profissional.id,
  profissionalNome: profissional.nome,

  tipoComissao:
    profissional.tipoComissao || 'percentual',

  valorComissaoConfigurado:
    Number(profissional.valorComissao || 0),

  totalServicos: 0,
  totalFaturado: 0,
  totalComissao: 0,
  totalPago: 0,
  totalPendente: 0,

  servicos: [],
};
      }

      profissionaisMap[profissional.id].totalServicos += 1;
      profissionaisMap[profissional.id].totalFaturado += valorServico;
      profissionaisMap[profissional.id].totalComissao += valorComissao;

      if (comissao.status === 'pago') {
        profissionaisMap[profissional.id].totalPago += valorComissao;
      } else {
        profissionaisMap[profissional.id].totalPendente += valorComissao;
      }

      profissionaisMap[profissional.id].servicos.push({
        comissaoId: comissao.id,
        agendamentoId: comissao.agendamentoId,
        data: agendamento?.dataHoraInicio || comissao.createdAt,
        cliente:
          agendamento?.cliente?.nome ||
          agendamento?.nomeCliente ||
          agendamento?.clienteNome ||
          'Cliente não informado',
        servico: agendamento?.servico?.nome || 'Serviço não informado',
        profissional: profissional.nome,
        valorServico,
        custoServico,
        valorComissao,
        lucroEstimado,
        tipoComissao: comissao.tipoComissao || 'não informado',
        status: comissao.status,
        dataPagamento: comissao.dataPagamento,
        observacao: comissao.observacao,
        createdAt: comissao.createdAt,
      });
    }

    return NextResponse.json({
      success: true,
      periodo: {
        inicio,
        fim,
      },
      resumo: {
        totalFaturado: totalFaturadoGeral,
        totalComissoes: totalComissaoGeral,
        totalServicos: totalServicosGeral,
        totalProfissionais: Object.keys(profissionaisMap).length,
        totalPago,
        totalPendente,
      },
      profissionais: Object.values(profissionaisMap),
      comissoes: comissoes.map((comissao) => ({
        id: comissao.id,
        empresaId: comissao.empresaId,
        agendamentoId: comissao.agendamentoId,
        profissionalId: comissao.profissionalId,
        profissionalNome:
          comissao.profissional?.nome || 'Profissional não informado',
        cliente:
          comissao.agendamento?.cliente?.nome ||
          comissao.agendamento?.nomeCliente ||
          comissao.agendamento?.clienteNome ||
          'Cliente não informado',
        servico: comissao.agendamento?.servico?.nome || 'Serviço não informado',
        valorServico: Number(comissao.valorServico || 0),
        custoServico: Number(
          comissao.agendamentoServico?.custo ||
            comissao.agendamentoServico?.servico?.custo ||
            comissao.agendamento?.servico?.custo ||
            0
        ),
        valorComissao: Number(comissao.valorComissao || 0),
        tipoComissao: comissao.tipoComissao || 'não informado',
        status: comissao.status,
        dataPagamento: comissao.dataPagamento,
        observacao: comissao.observacao,
        data: comissao.agendamento?.dataHoraInicio || comissao.createdAt,
        createdAt: comissao.createdAt,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de comissões:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar histórico de comissões.',
        detalhe: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}