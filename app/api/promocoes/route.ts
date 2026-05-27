import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function limparCpf(cpf?: string | null) {
  return String(cpf || '').replace(/\D/g, '');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');
    const cpf = limparCpf(searchParams.get('cpf'));

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId é obrigatório.' },
        { status: 400 }
      );
    }

    const promocoes = await prisma.promocao.findMany({
  where: { empresaId },
  include: {
    servicos: {
      include: {
        servico: true,
      },
    },
    usos: cpf
      ? {
          where: {
            cpf,
          },
        }
      : false,
  },
  orderBy: { createdAt: 'desc' },
});

const agora = new Date();

    const promocoesAtualizadas = await Promise.all(
      promocoes.map(async (promocao: any) => {
        const dataFim = promocao.dataFim ? new Date(promocao.dataFim) : null;

        let promocaoFinal = promocao;

        if (promocao.status === 'ativa' && dataFim && dataFim < agora) {
          promocaoFinal = await prisma.promocao.update({
            where: {
              id: promocao.id,
            },
            data: {
              status: 'inativa',
              updatedAt: new Date(),
            },
            include: {
              servicos: {
                include: {
                  servico: true,
                },
              },
              usos: cpf
                ? {
                    where: {
                      cpf,
                    },
                  }
                : false,
            },
          });
        }

        const usosCpf = Array.isArray(promocaoFinal.usos)
          ? promocaoFinal.usos
          : [];

        return {
          ...promocaoFinal,
          usadoPorCpf: cpf ? usosCpf.length > 0 : false,
          usoCpfBloqueado:
            Boolean(cpf) && Boolean(promocaoFinal.usoUnicoCpf)
              ? usosCpf.length > 0
              : false,
        };
      })
    );

    return NextResponse.json({
      success: true,
      promocoes: promocoesAtualizadas,
    });
  } catch (error) {
    console.error('Erro ao listar promoções:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao listar promoções.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId é obrigatório.' },
        { status: 400 }
      );
    }

    if (!body.titulo) {
      return NextResponse.json(
        { success: false, error: 'Título é obrigatório.' },
        { status: 400 }
      );
    }

    if (!body.dataInicio || !body.dataFim) {
      return NextResponse.json(
        {
          success: false,
          error: 'Informe a data de início e a data final da promoção.',
        },
        { status: 400 }
      );
    }

    const promocao = await prisma.promocao.create({
      data: {
        empresaId: body.empresaId,
        tipo: body.tipoPromocao || 'geral',
        titulo: body.titulo,
        descricao: body.descricao || null,
        mensagemWhatsapp: body.mensagemWhatsapp || null,
        dataInicio: new Date(`${body.dataInicio}T00:00:00`),
        dataFim: new Date(`${body.dataFim}T23:59:59`),
        tipoDesconto: body.tipoDesconto || null,
        desconto: body.desconto
          ? Number(String(body.desconto).replace(',', '.'))
          : null,
        status: body.status || 'ativa',
        usoUnicoCpf: Boolean(body.usoUnicoCpf),
        updatedAt: new Date(),
      },
    });

    if (
      (body.tipoPromocao === 'servico' ||
        body.tipoPromocao === 'aniversariantes') &&
      Array.isArray(body.servicosIds) &&
      body.servicosIds.length > 0
    ) {
      await prisma.promocaoServico.createMany({
        data: body.servicosIds.map((servicoId: string) => ({
          promocaoId: promocao.id,
          servicoId,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ success: true, promocao });
  } catch (error) {
    console.error('Erro ao salvar promoção:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao salvar promoção.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'id da promoção é obrigatório.' },
        { status: 400 }
      );
    }

if (body.alterarSomenteStatus) {
  const promocao = await prisma.promocao.update({
    where: {
      id: body.id,
    },
    data: {
      status:
        body.status === 'ativa'
          ? 'ativa'
          : 'inativa',

      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    promocao,
  });
}

    if (!body.dataInicio || !body.dataFim) {
      return NextResponse.json(
        {
          success: false,
          error: 'Informe a data de início e a data final da promoção.',
        },
        { status: 400 }
      );
    }

    const promocao = await prisma.promocao.update({
      where: { id: body.id },
      data: {
        tipo: body.tipoPromocao || 'geral',
        titulo: body.titulo,
        descricao: body.descricao || null,
        mensagemWhatsapp: body.mensagemWhatsapp || null,
        dataInicio: new Date(`${body.dataInicio}T00:00:00`),
        dataFim: new Date(`${body.dataFim}T23:59:59`),
        tipoDesconto: body.tipoDesconto || null,
        desconto: body.desconto
          ? Number(String(body.desconto).replace(',', '.'))
          : null,
        status: body.status || 'ativa',
        usoUnicoCpf: Boolean(body.usoUnicoCpf),
        updatedAt: new Date(),
      },
    });

    await prisma.promocaoServico.deleteMany({
      where: {
        promocaoId: promocao.id,
      },
    });

    if (
      (body.tipoPromocao === 'servico' ||
        body.tipoPromocao === 'aniversariantes') &&
      Array.isArray(body.servicosIds) &&
      body.servicosIds.length > 0
    ) {
      await prisma.promocaoServico.createMany({
        data: body.servicosIds.map((servicoId: string) => ({
          promocaoId: promocao.id,
          servicoId,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ success: true, promocao });
  } catch (error) {
    console.error('Erro ao editar promoção:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao editar promoção.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id é obrigatório.' },
        { status: 400 }
      );
    }

    await prisma.promocaoUso.deleteMany({
      where: {
        promocaoId: id,
      },
    });

    await prisma.promocaoServico.deleteMany({
      where: {
        promocaoId: id,
      },
    });

    await prisma.promocao.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir promoção:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao excluir promoção.' },
      { status: 500 }
    );
  }
}