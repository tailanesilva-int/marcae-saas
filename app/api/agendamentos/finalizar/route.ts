import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function numero(valor: any) {
  const convertido = Number(valor || 0);
  return Number.isNaN(convertido) ? 0 : convertido;
}

function pagamentoFoiRealizado(status?: string | null) {
  return (
    status === 'pago' ||
    status === 'confirmado' ||
    status === 'aprovado'
  );
}

async function gerarComissaoIndividual(params: {
  empresa: any;
  agendamento: any;
  profissionalId?: string | null;
  valorServico: number;
  servicoId?: string | null;
  agendamentoServicoId?: string | null;
  origemServico: 'principal' | 'adicional';
}) {
  const {
    empresa,
    agendamento,
    profissionalId,
    valorServico,
    servicoId,
    agendamentoServicoId,
    origemServico,
  } = params;

  if (!profissionalId) return;

  const profissional =
    await prisma.profissional.findUnique({
      where: {
        id: profissionalId,
      },
    });

  if (!profissional) return;

  const existeComissao =
    await prisma.comissao.findFirst({
      where: {
        empresaId: empresa.id,
        agendamentoId: agendamento.id,
        profissionalId,
        agendamentoServicoId:
          agendamentoServicoId || null,
      },
    });

  if (existeComissao) return;

  let tipoComissao =
    (profissional as any).tipoComissao || 'fixo';

  let valorConfigurado =
    numero((profissional as any).valorComissao);

  if (servicoId) {
    const servico =
      await prisma.servico.findUnique({
        where: {
          id: servicoId,
        },
      });

    const servicoComissao = servico as any;

    if (servicoComissao?.tipoComissao) {
      tipoComissao = servicoComissao.tipoComissao;
    }

    if (
      servicoComissao?.valorComissao !== undefined &&
      servicoComissao?.valorComissao !== null
    ) {
      valorConfigurado = numero(
        servicoComissao.valorComissao
      );
    }
  }

  let valorBase = valorServico;

  if (
    empresa.tipoCalculoComissao ===
    'valor_recebido'
  ) {
    valorBase = valorServico;
  }

  let valorComissao = 0;

  if (tipoComissao === 'percentual') {
    valorComissao =
      (valorBase * valorConfigurado) / 100;
  }

  if (tipoComissao === 'fixo') {
    valorComissao = valorConfigurado;
  }

  await prisma.comissao.create({
    data: {
      empresaId: empresa.id,
      agendamentoId: agendamento.id,
      profissionalId,
      agendamentoServicoId:
        agendamentoServicoId || null,

      origemServico,

      valorServico: valorServico,

      valorBaseRecebido: valorBase,

      percentualAplicado:
        tipoComissao === 'percentual'
          ? valorConfigurado
          : null,

      valorComissao,

      tipoComissao,

      status: 'pendente',

      observacao:
        origemServico === 'principal'
          ? 'Comissão do serviço principal.'
          : 'Comissão de serviço adicional.',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      empresaId,
      agendamentoId,
      quitarPendencias,
      pagamentos = [],
    } = body;

    if (!empresaId) {
      return NextResponse.json(
        {
          success: false,
          error: 'empresaId obrigatório.',
        },
        { status: 400 }
      );
    }

    if (!agendamentoId) {
      return NextResponse.json(
        {
          success: false,
          error: 'agendamentoId obrigatório.',
        },
        { status: 400 }
      );
    }

    const empresa =
      await prisma.empresa.findUnique({
        where: {
          id: empresaId,
        },
      });

    if (!empresa) {
      return NextResponse.json(
        {
          success: false,
          error: 'Empresa não encontrada.',
        },
        { status: 404 }
      );
    }

    const agendamento =
      await prisma.agendamento.findFirst({
        where: {
          id: agendamentoId,
          empresaId,
        },
        include: {
          cliente: true,
          servico: true,
          profissional: true,

          servicosAdicionais: {
            include: {
              servico: true,
              profissional: true,
            },
          },
        },
      });

    if (!agendamento) {
      return NextResponse.json(
        {
          success: false,
          error: 'Atendimento não encontrado.',
        },
        { status: 404 }
      );
    }

    if (agendamento.status === 'cancelado') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Atendimento cancelado não pode ser finalizado.',
        },
        { status: 400 }
      );
    }

    /*
    =========================================
    BLOQUEAR FINALIZAÇÃO FUTURA
    =========================================
    */

    const agora = new Date();

    if (!agendamento.dataHoraInicio) {
  return NextResponse.json(
    {
      success: false,
      error: 'Data do atendimento não encontrada.',
    },
    { status: 400 }
  );
}

const dataAtendimento = new Date(
  agendamento.dataHoraInicio
);

    if (
      dataAtendimento.getTime() >
      agora.getTime()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Atendimentos futuros não podem ser finalizados.',
        },
        { status: 400 }
      );
    }

    const servicoPrincipal = agendamento.servico as any;

    const valorPrincipal = numero(
      servicoPrincipal?.valor ||
        agendamento.valorTotal
    );

    const principalPago =
      pagamentoFoiRealizado(
        agendamento.statusPagamento
      );

    let totalPago = principalPago
      ? valorPrincipal
      : 0;

    let totalPendente = principalPago
      ? 0
      : valorPrincipal;

    for (const item of agendamento.servicosAdicionais) {
      const valor = numero((item as any).valor);

      if (
        pagamentoFoiRealizado(
          (item as any).statusPagamento
        )
      ) {
        totalPago += valor;
      } else {
        totalPendente += valor;
      }
    }

    if (quitarPendencias) {
      await prisma.agendamento.update({
        where: {
          id: agendamento.id,
        },
        data: {
          statusPagamento: 'pago',
        },
      });

      await prisma.agendamentoServico.updateMany({
        where: {
          agendamentoId: agendamento.id,
          statusPagamento: {
            not: 'pago',
          },
        },
        data: {
          statusPagamento: 'pago',

          formaPagamento:
            pagamentos
              ?.map(
                (p: any) => p.forma
              )
              .join(', ') || null,

          pagoEm: new Date(),
        },
      });

      totalPago = numero(
        agendamento.valorTotal
      );

      totalPendente = 0;
    }

    const pagamentoExistente =
      await prisma.pagamento.findFirst({
        where: {
          agendamentoId: agendamento.id,
          status: 'pago',
        },
      });

    if (!pagamentoExistente) {
      await prisma.pagamento.create({
        data: {
          empresaId,

          agendamentoId:
            agendamento.id,

          valorTotal: numero(
            agendamento.valorTotal
          ),

          valorPago: totalPago,

          metodoPagamento:
            pagamentos
              ?.map(
                (p: any) =>
                  `${p.forma}: R$ ${Number(
                    p.valor || 0
                  ).toFixed(2)}`
              )
              .join(' | ') ||
            'não informado',

          status:
            totalPendente > 0
              ? 'parcial'
              : 'pago',

          paidAt:
            totalPendente > 0
              ? null
              : new Date(),
        },
      });
    }

    /*
    =========================================
    COMISSÃO SERVIÇO PRINCIPAL
    =========================================
    */

    await gerarComissaoIndividual({
      empresa,

      agendamento,

      profissionalId:
        agendamento.profissionalId,

      servicoId:
        agendamento.servicoId,

      valorServico:
        valorPrincipal,

      origemServico:
        'principal',
    });

    /*
    =========================================
    COMISSÃO SERVIÇOS ADICIONAIS
    =========================================
    */

    for (const adicional of agendamento.servicosAdicionais) {
      await gerarComissaoIndividual({
        empresa,

        agendamento,

        profissionalId:
          adicional.profissionalId,

        servicoId:
          adicional.servicoId,

        agendamentoServicoId:
          adicional.id,

        valorServico: numero(
          (adicional as any).valor
        ),

        origemServico:
          'adicional',
      });
    }

    const atendimentoFinalizado =
      await prisma.agendamento.update({
        where: {
          id: agendamento.id,
        },

        data: {
          status: 'concluido',
        },

        include: {
          cliente: true,
          servico: true,
          profissional: true,
          servicosAdicionais: true,
        },
      });

    return NextResponse.json({
      success: true,

      atendimento:
        atendimentoFinalizado,

      financeiro: {
        totalPago,
        totalPendente,
      },

      message:
        totalPendente > 0
          ? 'Atendimento finalizado com pendência financeira.'
          : 'Atendimento finalizado com sucesso.',
    });
  } catch (error: any) {
    console.error(
      'Erro ao finalizar atendimento:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          'Erro ao finalizar atendimento.',

        detalhe:
          error?.message ||
          String(error),
      },
      { status: 500 }
    );
  }
}