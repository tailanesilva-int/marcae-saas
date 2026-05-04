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

    if (!empresaTemRecurso(empresa, 'relatorio_financeiro')) {
      return NextResponse.json(respostaPlanoBloqueado('relatorio_financeiro'), {
        status: 403,
      });
    }

    const inicio = dataInicio
      ? new Date(`${dataInicio}T00:00:00`)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const fim = dataFim ? new Date(`${dataFim}T23:59:59`) : new Date();

    const pagamentos = await prisma.pagamento.findMany({
      where: {
        empresaId,
        status: 'pago',
        paidAt: {
          gte: inicio,
          lte: fim,
        },
      },
      include: {
        agendamento: {
          include: {
            servico: true,
            profissional: true,
            cliente: true,
          },
        },
      },
      orderBy: {
        paidAt: 'asc',
      },
    });

    const agendamentosConcluidos = await prisma.agendamento.findMany({
      where: {
        empresaId,
        status: 'concluido',
        dataHoraInicio: {
          gte: inicio,
          lte: fim,
        },
      },
      include: {
        servico: true,
        profissional: true,
        cliente: true,
        pagamento: true,
      },
      orderBy: {
        dataHoraInicio: 'asc',
      },
    });

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
            servico: true,
            cliente: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const faturamentoPagamentos = pagamentos.reduce(
      (total, pagamento) =>
        total + Number(pagamento.valorPago || pagamento.valorTotal || 0),
      0
    );

    const idsAgendamentosComPagamentoPago = new Set(
      pagamentos.map((pagamento) => pagamento.agendamentoId)
    );

    const agendamentosSemPagamentoPago = agendamentosConcluidos.filter(
      (agendamento) => !idsAgendamentosComPagamentoPago.has(agendamento.id)
    );

    const faturamentoAtendimentosSemPagamento =
      agendamentosSemPagamentoPago.reduce(
        (total, agendamento) => total + Number(agendamento.valorTotal || 0),
        0
      );

    const faturamentoBruto =
      faturamentoPagamentos + faturamentoAtendimentosSemPagamento;

    const totalComissoes = comissoes.reduce(
      (total, comissao) => total + Number(comissao.valorComissao || 0),
      0
    );

    const comissoesPagas = comissoes
      .filter((comissao) => comissao.status === 'pago')
      .reduce(
        (total, comissao) => total + Number(comissao.valorComissao || 0),
        0
      );

    const comissoesPendentes = comissoes
      .filter((comissao) => comissao.status !== 'pago')
      .reduce(
        (total, comissao) => total + Number(comissao.valorComissao || 0),
        0
      );

    const liquidoEstimado = faturamentoBruto - totalComissoes;

    const totalAtendimentosFinanceiros =
      pagamentos.length + agendamentosSemPagamentoPago.length;

    const ticketMedio =
      totalAtendimentosFinanceiros > 0
        ? faturamentoBruto / totalAtendimentosFinanceiros
        : 0;

    const pagamentosPorMetodo: Record<string, number> = {};
    const servicosMap: Record<string, any> = {};
    const profissionaisMap: Record<string, any> = {};

    for (const pagamento of pagamentos) {
      const metodo = pagamento.metodoPagamento || 'não informado';

      pagamentosPorMetodo[metodo] =
        (pagamentosPorMetodo[metodo] || 0) +
        Number(pagamento.valorPago || pagamento.valorTotal || 0);
    }

    if (faturamentoAtendimentosSemPagamento > 0) {
      pagamentosPorMetodo['atendimento sem pagamento vinculado'] =
        faturamentoAtendimentosSemPagamento;
    }

    for (const agendamento of agendamentosConcluidos) {
      const valor = Number(agendamento.valorTotal || 0);

      const servicoId = agendamento.servicoId;
      const servicoNome = agendamento.servico?.nome || 'Serviço não informado';

      if (!servicosMap[servicoId]) {
        servicosMap[servicoId] = {
          servicoId,
          nome: servicoNome,
          quantidade: 0,
          totalFaturado: 0,
        };
      }

      servicosMap[servicoId].quantidade += 1;
      servicosMap[servicoId].totalFaturado += valor;

      if (agendamento.profissionalId) {
        const profissionalId = agendamento.profissionalId;
        const profissionalNome =
          agendamento.profissional?.nome || 'Profissional não informado';

        if (!profissionaisMap[profissionalId]) {
          profissionaisMap[profissionalId] = {
            profissionalId,
            nome: profissionalNome,
            quantidade: 0,
            totalFaturado: 0,
            totalComissao: 0,
            comissaoPaga: 0,
            comissaoPendente: 0,
          };
        }

        profissionaisMap[profissionalId].quantidade += 1;
        profissionaisMap[profissionalId].totalFaturado += valor;
      }
    }

    for (const comissao of comissoes) {
      const profissionalId = comissao.profissionalId;

      if (!profissionaisMap[profissionalId]) {
        profissionaisMap[profissionalId] = {
          profissionalId,
          nome: comissao.profissional?.nome || 'Profissional não informado',
          quantidade: 0,
          totalFaturado: 0,
          totalComissao: 0,
          comissaoPaga: 0,
          comissaoPendente: 0,
        };
      }

      const valorComissao = Number(comissao.valorComissao || 0);

      profissionaisMap[profissionalId].totalComissao += valorComissao;

      if (comissao.status === 'pago') {
        profissionaisMap[profissionalId].comissaoPaga += valorComissao;
      } else {
        profissionaisMap[profissionalId].comissaoPendente += valorComissao;
      }
    }

    return NextResponse.json({
      success: true,
      periodo: {
        inicio,
        fim,
      },
      resumo: {
        faturamentoBruto,
        faturamentoPagamentos,
        faturamentoAtendimentosSemPagamento,
        totalComissoes,
        comissoesPagas,
        comissoesPendentes,
        liquidoEstimado,
        ticketMedio,
        totalPagamentos: pagamentos.length,
        totalAgendamentosConcluidos: agendamentosConcluidos.length,
        totalAtendimentosSemPagamentoPago: agendamentosSemPagamentoPago.length,
      },
      pagamentosPorMetodo,
      servicos: Object.values(servicosMap),
      profissionais: Object.values(profissionaisMap),
      pagamentos: pagamentos.map((pagamento) => ({
        id: pagamento.id,
        agendamentoId: pagamento.agendamentoId,
        valorTotal: Number(pagamento.valorTotal || 0),
        valorPago: Number(pagamento.valorPago || 0),
        status: pagamento.status,
        metodoPagamento: pagamento.metodoPagamento || 'não informado',
        paidAt: pagamento.paidAt,
        cliente:
          pagamento.agendamento?.cliente?.nome ||
          pagamento.agendamento?.nomeCliente ||
          pagamento.agendamento?.clienteNome ||
          'Cliente não informado',
        servico: pagamento.agendamento?.servico?.nome || 'Serviço não informado',
        profissional:
          pagamento.agendamento?.profissional?.nome ||
          'Profissional não informado',
      })),
      atendimentosSemPagamentoPago: agendamentosSemPagamentoPago.map(
        (agendamento) => ({
          id: agendamento.id,
          valorTotal: Number(agendamento.valorTotal || 0),
          status: agendamento.status,
          statusPagamento: agendamento.statusPagamento,
          dataHoraInicio: agendamento.dataHoraInicio,
          cliente:
            agendamento.cliente?.nome ||
            agendamento.nomeCliente ||
            agendamento.clienteNome ||
            'Cliente não informado',
          servico: agendamento.servico?.nome || 'Serviço não informado',
          profissional:
            agendamento.profissional?.nome || 'Profissional não informado',
        })
      ),
      comissoes: comissoes.map((comissao) => ({
        id: comissao.id,
        agendamentoId: comissao.agendamentoId,
        profissionalId: comissao.profissionalId,
        profissional: comissao.profissional?.nome || 'Profissional não informado',
        cliente:
          comissao.agendamento?.cliente?.nome ||
          comissao.agendamento?.nomeCliente ||
          comissao.agendamento?.clienteNome ||
          'Cliente não informado',
        servico: comissao.agendamento?.servico?.nome || 'Serviço não informado',
        valorServico: Number(comissao.valorServico || 0),
        valorComissao: Number(comissao.valorComissao || 0),
        status: comissao.status,
        dataPagamento: comissao.dataPagamento,
        observacao: comissao.observacao,
        createdAt: comissao.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Erro ao gerar relatório financeiro:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao gerar relatório financeiro.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}