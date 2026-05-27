import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function numero(valor: any) {
  if (valor === null || valor === undefined || valor === '') return 0;

  if (typeof valor === 'number') {
    return Number.isNaN(valor) ? 0 : valor;
  }

  const convertido = Number(String(valor).replace(',', '.'));
  return Number.isNaN(convertido) ? 0 : convertido;
}

function dataCaixa(data?: string | null) {
  const base = data ? new Date(`${data}T00:00:00`) : new Date();
  return new Date(base.getFullYear(), base.getMonth(), base.getDate());
}

function dataHojeInput() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function normalizarFormaPagamento(forma?: string | null) {
  const valor = String(forma || 'dinheiro')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');

  if (valor.includes('pix')) return 'pix';
  if (valor.includes('dinheiro') || valor.includes('cash')) return 'dinheiro';
  if (valor.includes('debito') || valor.includes('debit')) return 'debito';
  if (valor.includes('credito') || valor.includes('credit')) return 'credito';

  return 'outro';
}

function somarNaForma(
  saldos: Record<string, number>,
  forma: string,
  valor: number
) {
  const chave = normalizarFormaPagamento(forma);
  saldos[chave] = numero(saldos[chave]) + numero(valor);
}

async function recalcularSaldoSistema(params: {
  empresaId: string;
  caixaId: string;
}) {
  const caixa = await (prisma as any).caixaDiario.findUnique({
    where: {
      id: params.caixaId,
    },
    include: {
      movimentacoes: true,
    },
  });

  if (!caixa) return null;

  const dataInicio = new Date(caixa.data);
  dataInicio.setHours(0, 0, 0, 0);

  const dataFim = new Date(caixa.data);
  dataFim.setHours(23, 59, 59, 999);

  const saldosPorForma: Record<string, number> = {
    dinheiro: numero(caixa.saldoInicial),
    pix: 0,
    debito: 0,
    credito: 0,
    outro: 0,
  };

  const pagamentos = await prisma.pagamento.findMany({
    where: {
      empresaId: params.empresaId,
      OR: [
        {
          paidAt: {
            gte: dataInicio,
            lte: dataFim,
          },
        },
        {
          paidAt: null,
          createdAt: {
            gte: dataInicio,
            lte: dataFim,
          },
        },
      ],
      status: {
        in: ['pago', 'parcial', 'approved'],
      },
    },
  });

  pagamentos.forEach((pagamento: any) => {
    const valorPagamento = numero(
      pagamento.valorPago || pagamento.valorTotal
    );

    somarNaForma(
      saldosPorForma,
      pagamento.metodoPagamento || 'outro',
      valorPagamento
    );
  });

  (caixa.movimentacoes || []).forEach((movimento: any) => {
    const valorMovimento = numero(movimento.valor);
    const forma = movimento.formaPagamento || 'dinheiro';

    if (movimento.tipo === 'entrada' || movimento.tipo === 'reforco') {
      somarNaForma(saldosPorForma, forma, valorMovimento);
    }

    if (movimento.tipo === 'saida' || movimento.tipo === 'sangria') {
      somarNaForma(saldosPorForma, forma, -valorMovimento);
    }
  });

  const saldoSistema =
    numero(saldosPorForma.dinheiro) +
    numero(saldosPorForma.pix) +
    numero(saldosPorForma.debito) +
    numero(saldosPorForma.credito) +
    numero(saldosPorForma.outro);

  return (prisma as any).caixaDiario.update({
    where: {
      id: caixa.id,
    },
    data: {
      saldoSistema,
      saldoDinheiroSistema: numero(saldosPorForma.dinheiro),
      saldoPixSistema: numero(saldosPorForma.pix),
      saldoDebitoSistema: numero(saldosPorForma.debito),
      saldoCreditoSistema: numero(saldosPorForma.credito),
      saldoOutroSistema: numero(saldosPorForma.outro),
    },
    include: {
      movimentacoes: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get('empresaId') || '';
    const dataParam = searchParams.get('data') || dataHojeInput();

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId obrigatório.' },
        { status: 400 }
      );
    }

    const data = dataCaixa(dataParam);

    const caixa = await (prisma as any).caixaDiario.findFirst({
      where: {
        empresaId,
        data,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        movimentacoes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    const ultimoCaixaFechado = await (prisma as any).caixaDiario.findFirst({
      where: {
        empresaId,
        status: 'fechado',
      },
      orderBy: {
        fechadoEm: 'desc',
      },
    });

    const caixaAtualizado =
      caixa?.status === 'aberto'
        ? await recalcularSaldoSistema({
            empresaId,
            caixaId: caixa.id,
          })
        : caixa;

    return NextResponse.json({
      success: true,
      caixa: caixaAtualizado,
      ultimoCaixaFechado,
    });
  } catch (error: any) {
    console.error('Erro ao buscar caixa:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar caixa.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      empresaId,
      data,
      acao,
      saldoInicial,
      saldoInformado,
      saldoDinheiroInformado,
      saldoPixInformado,
      saldoDebitoInformado,
      saldoCreditoInformado,
      saldoOutroInformado,
      tipo,
      categoria,
      formaPagamento,
      valor,
      descricao,
      observacao,
      caixaId,
      usuarioId,
      usuarioNome,
      observacaoConferencia,
    } = body;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId obrigatório.' },
        { status: 400 }
      );
    }

    const dataReferencia = dataCaixa(data || dataHojeInput());

    if (acao === 'abrir') {
      const caixaAberto = await (prisma as any).caixaDiario.findFirst({
        where: {
          empresaId,
          data: dataReferencia,
          status: 'aberto',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (caixaAberto) {
        return NextResponse.json({
          success: true,
          caixa: caixaAberto,
          message: 'Caixa já estava aberto.',
        });
      }

      const saldoInicialNumerico = numero(saldoInicial);

      const caixa = await (prisma as any).caixaDiario.create({
        data: {
          empresaId,
          data: dataReferencia,
          status: 'aberto',
          saldoInicial: saldoInicialNumerico,
          saldoSistema: saldoInicialNumerico,
          saldoDinheiroSistema: saldoInicialNumerico,
          saldoPixSistema: 0,
          saldoDebitoSistema: 0,
          saldoCreditoSistema: 0,
          saldoOutroSistema: 0,
          abertoPorUsuarioId: usuarioId || null,
          abertoPorNome: usuarioNome || null,
          observacaoAbertura: observacao || null,
        },
      });

      return NextResponse.json({
        success: true,
        caixa,
        message: 'Caixa aberto com sucesso.',
      });
    }

    if (acao === 'aprovar_conferencia') {
      const caixaFechado = caixaId
        ? await (prisma as any).caixaDiario.findFirst({
            where: {
              id: caixaId,
              empresaId,
              status: 'fechado',
              conferenciaStatus: 'pendente',
            },
          })
        : await (prisma as any).caixaDiario.findFirst({
            where: {
              empresaId,
              data: dataReferencia,
              status: 'fechado',
              conferenciaStatus: 'pendente',
            },
            orderBy: {
              fechadoEm: 'desc',
            },
          });

      if (!caixaFechado) {
        return NextResponse.json(
          {
            success: false,
            error: caixaId
              ? 'Caixa pendente de conferência não encontrado.'
              : 'Nenhum caixa pendente de conferência.',
          },
          { status: 400 }
        );
      }

      const caixaConferido = await (prisma as any).caixaDiario.update({
        where: {
          id: caixaFechado.id,
        },
        data: {
          conferenciaStatus: 'aprovado',
          conferidoEm: new Date(),
          conferidoPorUsuarioId: usuarioId || null,
          conferidoPorNome: usuarioNome || null,
          observacaoConferencia:
            observacaoConferencia || observacao || null,
        },
        include: {
          movimentacoes: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        caixa: caixaConferido,
        message: 'Conferência do caixa aprovada com sucesso.',
      });
    }

    const caixa = await (prisma as any).caixaDiario.findFirst({
      where: {
        empresaId,
        data: dataReferencia,
        status: 'aberto',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!caixa) {
      return NextResponse.json(
        {
          success: false,
          error: 'Abra o caixa antes de registrar movimentações.',
        },
        { status: 400 }
      );
    }

    if (acao === 'movimentacao') {
      const valorMovimento = numero(valor);

      if (valorMovimento <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Informe um valor maior que zero.',
          },
          { status: 400 }
        );
      }

      if (!tipo) {
        return NextResponse.json(
          {
            success: false,
            error: 'Informe o tipo da movimentação.',
          },
          { status: 400 }
        );
      }

      const tiposPermitidos = ['entrada', 'saida', 'sangria', 'reforco'];

      if (!tiposPermitidos.includes(tipo)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Tipo de movimentação inválido.',
          },
          { status: 400 }
        );
      }

      await (prisma as any).caixaMovimentacao.create({
        data: {
          empresaId,
          caixaId: caixa.id,
          tipo,
          categoria: categoria || 'operacional',
          formaPagamento: formaPagamento || 'dinheiro',
          valor: valorMovimento,
          descricao: descricao || 'Movimentação manual',
          origem: 'manual',
          usuarioId: usuarioId || null,
          usuarioNome: usuarioNome || null,
        },
      });

      const caixaAtualizado = await recalcularSaldoSistema({
        empresaId,
        caixaId: caixa.id,
      });

      return NextResponse.json({
        success: true,
        caixa: caixaAtualizado,
        message: 'Movimentação registrada com sucesso.',
      });
    }

    if (acao === 'fechar') {
      const caixaAtual = await recalcularSaldoSistema({
        empresaId,
        caixaId: caixa.id,
      });

      const informadoDinheiro = numero(
        saldoDinheiroInformado !== undefined
          ? saldoDinheiroInformado
          : saldoInformado
      );

      const informadoPix = numero(saldoPixInformado);
      const informadoDebito = numero(saldoDebitoInformado);
      const informadoCredito = numero(saldoCreditoInformado);
      const informadoOutro = numero(saldoOutroInformado);

      const sistemaDinheiro = numero(caixaAtual?.saldoDinheiroSistema);
      const sistemaPix = numero(caixaAtual?.saldoPixSistema);
      const sistemaDebito = numero(caixaAtual?.saldoDebitoSistema);
      const sistemaCredito = numero(caixaAtual?.saldoCreditoSistema);
      const sistemaOutro = numero(caixaAtual?.saldoOutroSistema);

      const saldoSistema = numero(caixaAtual?.saldoSistema);

      const saldoFinalInformado =
        informadoDinheiro +
        informadoPix +
        informadoDebito +
        informadoCredito +
        informadoOutro;

      const diferencaDinheiro = informadoDinheiro - sistemaDinheiro;
      const diferencaPix = informadoPix - sistemaPix;
      const diferencaDebito = informadoDebito - sistemaDebito;
      const diferencaCredito = informadoCredito - sistemaCredito;
      const diferencaOutro = informadoOutro - sistemaOutro;
      const diferenca = saldoFinalInformado - saldoSistema;

      const caixaFechado = await (prisma as any).caixaDiario.update({
        where: {
          id: caixa.id,
        },
        data: {
          status: 'fechado',
          saldoSistema,
          saldoInformado: saldoFinalInformado,
          saldoDinheiroInformado: informadoDinheiro,
          saldoPixInformado: informadoPix,
          saldoDebitoInformado: informadoDebito,
          saldoCreditoInformado: informadoCredito,
          saldoOutroInformado: informadoOutro,
          diferenca,
          diferencaDinheiro,
          diferencaPix,
          diferencaDebito,
          diferencaCredito,
          diferencaOutro,
          fechadoEm: new Date(),
          fechadoPorUsuarioId: usuarioId || null,
          fechadoPorNome: usuarioNome || null,
          conferenciaStatus: 'pendente',
          observacaoFechamento: observacao || null,
        },
      });

      return NextResponse.json({
        success: true,
        caixa: caixaFechado,
        message:
          Math.abs(diferenca) > 0.009
            ? 'Caixa fechado com divergência registrada.'
            : 'Caixa fechado sem divergência.',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Ação inválida.',
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Erro ao atualizar caixa:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar caixa.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}