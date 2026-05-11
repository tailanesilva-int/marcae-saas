import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function numero(valor: any) {
  const convertido = Number(valor || 0);
  return Number.isNaN(convertido) ? 0 : convertido;
}

function pagamentoFoiRealizado(status?: string | null) {
  return status === 'pago' || status === 'confirmado' || status === 'aprovado';
}

async function recalcularValorTotalAgendamento(agendamentoId: string) {
  const agendamento = await prisma.agendamento.findUnique({
    where: { id: agendamentoId },
    include: {
      servico: true,
      servicosAdicionais: true,
    },
  });

  if (!agendamento) return null;

  const servicoPrincipal = (agendamento as any).servico;
  const servicosAdicionais = ((agendamento as any).servicosAdicionais || []) as any[];

  const valorServicoPrincipal = numero(
    servicoPrincipal?.valor || (agendamento as any).valorTotal
  );

  const totalAdicionais = servicosAdicionais.reduce(
    (total: number, item: any) => total + numero(item.valor),
    0
  );

  const valorTotal = valorServicoPrincipal + totalAdicionais;

  return prisma.agendamento.update({
    where: { id: agendamentoId },
    data: { valorTotal },
    include: {
      cliente: true,
      servico: true,
      profissional: true,
      empresa: true,
      servicosAdicionais: {
        include: {
          servico: true,
          profissional: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');
    const agendamentoId = searchParams.get('agendamentoId');

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId é obrigatório.' },
        { status: 400 }
      );
    }

    if (!agendamentoId) {
      return NextResponse.json(
        { success: false, error: 'agendamentoId é obrigatório.' },
        { status: 400 }
      );
    }

    const itens = await (prisma as any).agendamentoServico.findMany({
      where: {
        empresaId,
        agendamentoId,
      },
      include: {
        servico: true,
        profissional: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const total = itens.reduce((soma: number, item: any) => soma + numero(item.valor), 0);
    const totalPago = itens
      .filter((item: any) => pagamentoFoiRealizado(item.statusPagamento))
      .reduce((soma: number, item: any) => soma + numero(item.valor), 0);

    return NextResponse.json({
      success: true,
      itens,
      resumo: {
        total,
        totalPago,
        totalPendente: total - totalPago,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar serviços adicionais:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar serviços adicionais.',
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
      empresaId,
      agendamentoId,
      servicoId,
      profissionalId,
      valor,
      statusPagamento,
      formaPagamento,
      observacao,
    } = body;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId é obrigatório.' },
        { status: 400 }
      );
    }

    if (!agendamentoId) {
      return NextResponse.json(
        { success: false, error: 'agendamentoId é obrigatório.' },
        { status: 400 }
      );
    }

    if (!servicoId) {
      return NextResponse.json(
        { success: false, error: 'servicoId é obrigatório.' },
        { status: 400 }
      );
    }

    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id: agendamentoId,
        empresaId,
      },
    });

    if (!agendamento) {
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado para esta empresa.' },
        { status: 404 }
      );
    }

    if (agendamento.status === 'cancelado') {
      return NextResponse.json(
        { success: false, error: 'Não é possível adicionar serviço em atendimento cancelado.' },
        { status: 400 }
      );
    }

    const servico = await prisma.servico.findFirst({
      where: {
        id: servicoId,
        empresaId,
      },
    });

    if (!servico) {
      return NextResponse.json(
        { success: false, error: 'Serviço não encontrado para esta empresa.' },
        { status: 404 }
      );
    }

    let profissionalFinalId = profissionalId || null;

    if (profissionalFinalId) {
      const profissional = await prisma.profissional.findFirst({
        where: {
          id: profissionalFinalId,
          empresaId,
        },
      });

      if (!profissional) {
        return NextResponse.json(
          { success: false, error: 'Profissional não encontrado para esta empresa.' },
          { status: 404 }
        );
      }
    }

    const statusFinal = statusPagamento || 'pendente';

    const item = await (prisma as any).agendamentoServico.create({
      data: {
        empresaId,
        agendamentoId,
        servicoId,
        profissionalId: profissionalFinalId,
        nomeServico: servico.nome,
        valor: valor !== undefined && valor !== null && valor !== '' ? numero(valor) : servico.valor,
        statusPagamento: statusFinal,
        formaPagamento: formaPagamento || null,
        observacao: observacao?.trim() || null,
        origem: 'painel',
        pagoEm: pagamentoFoiRealizado(statusFinal) ? new Date() : null,
      },
      include: {
        servico: true,
        profissional: true,
      },
    });

    const agendamentoAtualizado = await recalcularValorTotalAgendamento(agendamentoId);

    return NextResponse.json({
      success: true,
      item,
      agendamento: agendamentoAtualizado,
      message: 'Serviço adicionado ao atendimento com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao adicionar serviço ao atendimento:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao adicionar serviço ao atendimento.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const {
      id,
      empresaId,
      statusPagamento,
      formaPagamento,
      observacao,
      valor,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id do item é obrigatório.' },
        { status: 400 }
      );
    }

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId é obrigatório.' },
        { status: 400 }
      );
    }

    const itemAtual = await (prisma as any).agendamentoServico.findFirst({
      where: {
        id,
        empresaId,
      },
    });

    if (!itemAtual) {
      return NextResponse.json(
        { success: false, error: 'Serviço adicional não encontrado.' },
        { status: 404 }
      );
    }

    const statusFinal = statusPagamento ?? itemAtual.statusPagamento;

    const item = await (prisma as any).agendamentoServico.update({
      where: { id },
      data: {
        statusPagamento: statusFinal,
        formaPagamento: formaPagamento !== undefined ? formaPagamento || null : itemAtual.formaPagamento,
        observacao: observacao !== undefined ? observacao?.trim() || null : itemAtual.observacao,
        valor: valor !== undefined && valor !== null && valor !== '' ? numero(valor) : itemAtual.valor,
        pagoEm: pagamentoFoiRealizado(statusFinal) ? itemAtual.pagoEm || new Date() : null,
      },
      include: {
        servico: true,
        profissional: true,
      },
    });

    const agendamentoAtualizado = await recalcularValorTotalAgendamento(item.agendamentoId);

    return NextResponse.json({
      success: true,
      item,
      agendamento: agendamentoAtualizado,
      message: 'Serviço adicional atualizado com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao atualizar serviço adicional:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar serviço adicional.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, empresaId } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id do item é obrigatório.' },
        { status: 400 }
      );
    }

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId é obrigatório.' },
        { status: 400 }
      );
    }

    const item = await (prisma as any).agendamentoServico.findFirst({
      where: {
        id,
        empresaId,
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Serviço adicional não encontrado.' },
        { status: 404 }
      );
    }

    await (prisma as any).agendamentoServico.delete({
      where: { id },
    });

    const agendamentoAtualizado = await recalcularValorTotalAgendamento(item.agendamentoId);

    return NextResponse.json({
      success: true,
      agendamento: agendamentoAtualizado,
      message: 'Serviço adicional removido com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao remover serviço adicional:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao remover serviço adicional.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}