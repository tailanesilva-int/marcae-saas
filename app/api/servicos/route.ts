import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function numero(valor: any) {
  if (valor === null || valor === undefined || valor === '') return 0;
  const convertido = Number(String(valor).replace(',', '.'));
  return Number.isNaN(convertido) ? 0 : convertido;
}

function inteiroPositivo(valor: any, padrao = 1) {
  const convertido = Number(valor);

  if (!Number.isFinite(convertido) || convertido < 1) {
    return padrao;
  }

  return Math.floor(convertido);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const empresaId = searchParams.get('empresaId');

  if (!empresaId) {
    return NextResponse.json({ error: 'empresaId obrigatório' }, { status: 400 });
  }

  const servicos = await prisma.servico.findMany({
    where: { empresaId },
    include: {
      fichaModelo: {
        select: {
          id: true,
          titulo: true,
          status: true,
          categoria: true,
        },
      },
      profissionais: {
        include: {
          profissional: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ servicos });
}

export async function POST(req: Request) {
  const body = await req.json();

  const {
    empresaId,
    nome,
    descricao,
    recomendacoesPreAtendimento,
    duracaoMin,
    capacidadeSimultanea,
    valor,
    custo,
    exigePrePagamento,
    valorPrePagamento,
    imagemUrl1,
    imagemUrl2,
    imagemUrl3,
    fichaModeloId,
  } = body;

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
  });

  if (exigePrePagamento && empresa?.plano === 'basico') {
    return NextResponse.json(
      { error: 'Pré-pagamento disponível apenas no plano premium' },
      { status: 403 }
    );
  }

  const fichaModeloIdNormalizado = fichaModeloId ? String(fichaModeloId) : null;

  if (fichaModeloIdNormalizado) {
    const fichaModelo = await prisma.fichaModelo.findFirst({
      where: {
        id: fichaModeloIdNormalizado,
        empresaId,
        status: 'ativo',
      },
    });

    if (!fichaModelo) {
      return NextResponse.json(
        { error: 'Ficha digital vinculada não encontrada ou inativa.' },
        { status: 404 }
      );
    }
  }

  const servico = await prisma.servico.create({
    data: {
      empresaId,
      nome,
      descricao,
      recomendacoesPreAtendimento: recomendacoesPreAtendimento || null,
      duracaoMin: Math.max(Number(duracaoMin || 30), 5),
      capacidadeSimultanea: inteiroPositivo(capacidadeSimultanea, 1),
      valor: numero(valor),
      custo: custo ? numero(custo) : null,
      exigePrePagamento: exigePrePagamento || false,
      valorPrePagamento: valorPrePagamento ? numero(valorPrePagamento) : null,
      imagemUrl1: imagemUrl1 || null,
      imagemUrl2: imagemUrl2 || null,
      imagemUrl3: imagemUrl3 || null,
      fichaModeloId: fichaModeloIdNormalizado,
    },
  });

  return NextResponse.json({ servico });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const {
      id,
      empresaId,
      nome,
      descricao,
      recomendacoesPreAtendimento,
      duracaoMin,
      capacidadeSimultanea,
      valor,
      custo,
      exigePrePagamento,
      valorPrePagamento,
      ativo,
      imagemUrl1,
      imagemUrl2,
      imagemUrl3,
      fichaModeloId,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do serviço obrigatório.' },
        { status: 400 }
      );
    }

    const servicoExistente = await prisma.servico.findFirst({
      where: {
        id,
        empresaId,
      },
    });

    if (!servicoExistente) {
      return NextResponse.json(
        { error: 'Serviço não encontrado.' },
        { status: 404 }
      );
    }

    const empresa = await prisma.empresa.findUnique({
      where: {
        id: empresaId,
      },
    });

    if (exigePrePagamento && empresa?.plano === 'basico') {
      return NextResponse.json(
        { error: 'Pré-pagamento disponível apenas no plano premium' },
        { status: 403 }
      );
    }

    const fichaModeloIdNormalizado = fichaModeloId ? String(fichaModeloId) : null;

    if (fichaModeloIdNormalizado) {
      const fichaModelo = await prisma.fichaModelo.findFirst({
        where: {
          id: fichaModeloIdNormalizado,
          empresaId,
          status: 'ativo',
        },
      });

      if (!fichaModelo) {
        return NextResponse.json(
          { error: 'Ficha digital vinculada não encontrada ou inativa.' },
          { status: 404 }
        );
      }
    }

    const servico = await prisma.servico.update({
      where: {
        id,
      },
      data: {
        nome,
        descricao,
        recomendacoesPreAtendimento: recomendacoesPreAtendimento || null,
        duracaoMin: Math.max(Number(duracaoMin || 30), 5),
        capacidadeSimultanea: inteiroPositivo(capacidadeSimultanea, 1),
        valor: numero(valor),
        custo: custo ? numero(custo) : null,
        exigePrePagamento: exigePrePagamento || false,
        valorPrePagamento: valorPrePagamento ? numero(valorPrePagamento) : null,
        imagemUrl1: imagemUrl1 || null,
        imagemUrl2: imagemUrl2 || null,
        imagemUrl3: imagemUrl3 || null,
        ativo: ativo === undefined ? servicoExistente.ativo : ativo,
        fichaModeloId: fichaModeloIdNormalizado,
      },
    });

    return NextResponse.json({
      success: true,
      servico,
    });
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);

    return NextResponse.json(
      {
        error: 'Erro ao atualizar serviço.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, empresaId } = body;

    if (!id || !empresaId) {
      return NextResponse.json(
        { error: 'ID do serviço e empresaId são obrigatórios.' },
        { status: 400 },
      );
    }

    const servicoExistente = await prisma.servico.findFirst({
      where: {
        id,
        empresaId,
      },
    });

    if (!servicoExistente) {
      return NextResponse.json(
        { error: 'Serviço não encontrado.' },
        { status: 404 },
      );
    }

    const totalAgendamentos = await prisma.agendamento.count({
      where: {
        empresaId,
        servicoId: id,
      },
    });

    if (totalAgendamentos > 0) {
      return NextResponse.json(
        {
          success: false,
          bloqueadoPorMovimentacao: true,
          error:
            'Este serviço possui movimentações e não pode ser excluído. Inative o serviço para ocultá-lo do sistema sem perder o histórico.',
        },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const banco = tx as any;

      if (banco.profissionalServico?.deleteMany) {
        await banco.profissionalServico.deleteMany({
          where: {
            servicoId: id,
          },
        });
      }

      if (banco.disponibilidadeServico?.deleteMany) {
        await banco.disponibilidadeServico.deleteMany({
          where: {
            servicoId: id,
          },
        });
      }

      if (banco.servicoProfissional?.deleteMany) {
        await banco.servicoProfissional.deleteMany({
          where: {
            servicoId: id,
          },
        });
      }

      await banco.servico.delete({
        where: {
          id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Serviço excluído com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao excluir serviço:', error);

    if (error?.code === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          bloqueadoPorMovimentacao: true,
          error:
            'Este serviço possui vínculos ou movimentações e não pode ser excluído. Inative o serviço para ocultá-lo do sistema sem perder o histórico.',
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao excluir serviço.',
      },
      { status: 500 },
    );
  }
}
