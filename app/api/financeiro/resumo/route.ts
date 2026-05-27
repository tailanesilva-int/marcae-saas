import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function numero(valor: any) {
  const convertido = Number(valor || 0);
  return Number.isNaN(convertido) ? 0 : convertido;
}

function inicioDoDia(data: string) {
  const base = data ? new Date(`${data}T00:00:00`) : new Date();
  base.setHours(0, 0, 0, 0);
  return base;
}

function fimDoDia(data: string) {
  const base = data ? new Date(`${data}T23:59:59.999`) : new Date();
  base.setHours(23, 59, 59, 999);
  return base;
}

function formatarDataInput(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function pagamentoConfirmado(status?: string | null) {
  return status === 'pago' || status === 'confirmado' || status === 'aprovado';
}

function normalizarFormaPagamento(valor?: string | null) {
  const texto = String(valor || '').toLowerCase();

  if (texto.includes('pix')) return 'Pix';
  if (texto.includes('dinheiro')) return 'Dinheiro';
  if (texto.includes('credito') || texto.includes('crédito')) return 'Cartão crédito';
  if (texto.includes('debito') || texto.includes('débito')) return 'Cartão débito';
  if (texto.includes('mercado')) return 'Mercado Pago';
  if (texto.includes('link')) return 'Link de pagamento';
  if (texto.includes('credito_cliente')) return 'Crédito cliente';

  return valor || 'Não informado';
}

function adicionarForma(mapa: Record<string, number>, forma: string, valor: number) {
  const nome = normalizarFormaPagamento(forma);
  mapa[nome] = numero(mapa[nome]) + numero(valor);
}

function extrairFormasPagamento(
  metodoPagamento: string | null | undefined,
  valorPago: number
) {
  const texto = String(metodoPagamento || '').trim();

  if (!texto) {
    return [{ forma: 'Não informado', valor: valorPago }];
  }

  const partes = texto
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

  if (partes.length <= 1 && !texto.includes(':')) {
    return [{ forma: texto, valor: valorPago }];
  }

  const resultados = partes.map((parte) => {
    const [formaBruta, valorBruto] = parte.split(':');

    let valorTexto = String(valorBruto || '')
      .replace('R$', '')
      .replace(/\s/g, '');

    // Se vier no padrão brasileiro
    if (valorTexto.includes(',')) {
      valorTexto = valorTexto.replace(/\./g, '').replace(',', '.');
    }

    const valor = Number(valorTexto);

    return {
      forma: formaBruta || 'Não informado',
      valor: Number.isFinite(valor) ? valor : 0,
    };
  });

  const somaExtraida = resultados.reduce(
    (total, item) => total + item.valor,
    0
  );

  if (somaExtraida <= 0) {
    return [{ forma: texto, valor: valorPago }];
  }

  return resultados;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get('empresaId') || '';
    const dataInicioParam = searchParams.get('dataInicio') || formatarDataInput(new Date());
    const dataFimParam = searchParams.get('dataFim') || dataInicioParam;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId obrigatório.' },
        { status: 400 }
      );
    }

    const inicio = inicioDoDia(dataInicioParam);
    const fim = fimDoDia(dataFimParam);

    const hoje = new Date();
    const dataHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const [
      empresa,
      agendamentos,
      pagamentos,
      movimentacoesCliente,
      comissoesPendentes,
      caixaHoje,
      caixaAberto,
      movimentacoesCaixa,
ultimoCaixaFechado,
] = await Promise.all([
      prisma.empresa.findUnique({
        where: { id: empresaId },
        select: {
          id: true,
          nome: true,
          plano: true,
          corPrimaria: true,
          corSecundaria: true,
          corSidebar: true,
          logoUrl: true,
        },
      }),
      prisma.agendamento.findMany({
        where: {
          empresaId,
          dataHoraInicio: {
            gte: inicio,
            lte: fim,
          },
          status: {
            not: 'cancelado',
          },
        },
        include: {
          cliente: true,
          servico: true,
          profissional: true,
          servicosAdicionais: true,
        },
        orderBy: {
          dataHoraInicio: 'desc',
        },
      }),
      prisma.pagamento.findMany({
        where: {
          empresaId,
          OR: [
            {
              paidAt: {
                gte: inicio,
                lte: fim,
              },
            },
            {
              paidAt: null,
              createdAt: {
                gte: inicio,
                lte: fim,
              },
            },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.clienteMovimentacaoFinanceira.findMany({
        where: {
          empresaId,
          status: 'ativo',
        },
      }),
      prisma.comissao.findMany({
        where: {
          empresaId,
          status: 'pendente',
        },
      }),
      (prisma as any).caixaDiario?.findUnique
        ? (prisma as any).caixaDiario.findFirst({
  where: {
    empresaId,
    data: dataHoje,
  },
  orderBy: {
    createdAt: 'desc',
  },
            include: {
              movimentacoes: {
                orderBy: {
                  createdAt: 'desc',
                },
                take: 20,
              },
            },
          })
        : Promise.resolve(null),
      (prisma as any).caixaDiario?.findFirst
        ? (prisma as any).caixaDiario.findFirst({
  where: {
    empresaId,
    status: 'aberto',
    data: dataHoje,
  },
  orderBy: {
    abertoEm: 'desc',
  },
            include: {
              movimentacoes: {
                orderBy: {
                  createdAt: 'desc',
                },
                take: 20,
              },
            },
          })
        : Promise.resolve(null),
      (prisma as any).caixaMovimentacao?.findMany
  ? (prisma as any).caixaMovimentacao.findMany({
      where: {
        empresaId,
        createdAt: {
          gte: inicio,
          lte: fim,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  : Promise.resolve([]),

(prisma as any).caixaDiario?.findFirst
  ? (prisma as any).caixaDiario.findFirst({
      where: {
        empresaId,
        status: 'fechado',
      },
      orderBy: {
        fechadoEm: 'desc',
      },
    })
  : Promise.resolve(null),

]);

    if (!empresa) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada.' },
        { status: 404 }
      );
    }

    let totalAgendado = 0;
    let totalPagoOperacional = 0;
    let totalPendenteOperacional = 0;
    let atendimentosConcluidos = 0;
    let atendimentosPendentes = 0;
    let atendimentosEmAberto = 0;

    const servicosRentaveisMapa: Record<string, { nome: string; valor: number; quantidade: number }> = {};
    const profissionaisMapa: Record<string, { nome: string; valor: number; quantidade: number }> = {};

    for (const agendamento of agendamentos as any[]) {
      const valorPrincipal = numero(
        agendamento.valorTotal ||
          agendamento.valorServicoPrincipal ||
          agendamento.servico?.valor
      );

      const adicionais = (agendamento.servicosAdicionais || []) as any[];

      const totalAdicionais = adicionais.reduce(
        (total, item) => total + numero(item.valor),
        0
      );

      const pagoAdicionais = adicionais.reduce(
        (total, item) => total + (pagamentoConfirmado(item.statusPagamento) ? numero(item.valor) : 0),
        0
      );

      const totalAtendimento = Math.max(numero(agendamento.valorTotal), valorPrincipal + totalAdicionais);
      const principalPago = pagamentoConfirmado(agendamento.statusPagamento) ? valorPrincipal : 0;
      const pago = principalPago + pagoAdicionais;
      const pendente = Math.max(totalAtendimento - pago, 0);

      totalAgendado += totalAtendimento;
      totalPagoOperacional += pago;
      totalPendenteOperacional += pendente;

      if (agendamento.status === 'concluido') atendimentosConcluidos += 1;
      if (pendente > 0) atendimentosPendentes += 1;
      if (agendamento.status !== 'concluido') atendimentosEmAberto += 1;

      const nomeServico = agendamento.servico?.nome || agendamento.servicoNome || 'Serviço não informado';
      if (!servicosRentaveisMapa[nomeServico]) {
        servicosRentaveisMapa[nomeServico] = { nome: nomeServico, valor: 0, quantidade: 0 };
      }
      servicosRentaveisMapa[nomeServico].valor += totalAtendimento;
      servicosRentaveisMapa[nomeServico].quantidade += 1;

      const nomeProfissional = agendamento.profissional?.nome || agendamento.profissionalNome || 'Profissional não informado';
      if (!profissionaisMapa[nomeProfissional]) {
        profissionaisMapa[nomeProfissional] = { nome: nomeProfissional, valor: 0, quantidade: 0 };
      }
      profissionaisMapa[nomeProfissional].valor += totalAtendimento;
      profissionaisMapa[nomeProfissional].quantidade += 1;
    }

    const formasPagamentoMapa: Record<string, number> = {};
    let recebidoPeriodo = 0;

    for (const pagamento of pagamentos as any[]) {
      const valorPago = numero(pagamento.valorPago || pagamento.valorTotal);

      if (pagamento.status === 'pago' || pagamento.status === 'parcial' || pagamento.status === 'approved') {
        recebidoPeriodo += valorPago;

        const formas = extrairFormasPagamento(pagamento.metodoPagamento, valorPago);

        for (const forma of formas) {
          adicionarForma(formasPagamentoMapa, forma.forma, forma.valor || valorPago);
        }
      }
    }

    const creditoClientes = movimentacoesCliente
      .filter((item: any) => item.tipo === 'credito')
      .reduce((total: number, item: any) => total + numero(item.valor), 0);

    const debitoClientes = movimentacoesCliente
      .filter((item: any) => item.tipo === 'debito')
      .reduce((total: number, item: any) => total + numero(item.valor), 0);

    const comissoesPendentesTotal = comissoesPendentes.reduce(
      (total: number, item: any) => total + numero((item as any).valorComissao),
      0
    );

    const entradasManuais = (movimentacoesCaixa || [])
      .filter((item: any) => item.tipo === 'entrada' || item.tipo === 'reforco')
      .reduce((total: number, item: any) => total + numero(item.valor), 0);

    const saidasManuais = (movimentacoesCaixa || [])
      .filter((item: any) => item.tipo === 'saida' || item.tipo === 'sangria')
      .reduce((total: number, item: any) => total + numero(item.valor), 0);

    const caixaBase = caixaAberto || caixaHoje;

    const saldoPorForma: Record<string, number> = {
  dinheiro: numero(caixaBase?.saldoInicial),
  pix: 0,
  debito: 0,
  credito: 0,
  outro: 0,
};

for (const pagamento of pagamentos as any[]) {
  const valorPago = numero(pagamento.valorPago || pagamento.valorTotal);

  if (
    pagamento.status === 'pago' ||
    pagamento.status === 'parcial' ||
    pagamento.status === 'approved'
  ) {
    const forma = normalizarFormaPagamento(pagamento.metodoPagamento);

    if (forma === 'Dinheiro') saldoPorForma.dinheiro += valorPago;
    else if (forma === 'Pix') saldoPorForma.pix += valorPago;
    else if (forma === 'Cartão débito') saldoPorForma.debito += valorPago;
    else if (forma === 'Cartão crédito') saldoPorForma.credito += valorPago;
    else saldoPorForma.outro += valorPago;
  }
}

for (const movimento of movimentacoesCaixa || []) {
  const valorMovimento = numero(movimento.valor);
  const forma = normalizarFormaPagamento(movimento.formaPagamento);

  const sinal =
    movimento.tipo === 'saida' || movimento.tipo === 'sangria'
      ? -1
      : 1;

  if (forma === 'Dinheiro') saldoPorForma.dinheiro += valorMovimento * sinal;
  else if (forma === 'Pix') saldoPorForma.pix += valorMovimento * sinal;
  else if (forma === 'Cartão débito') saldoPorForma.debito += valorMovimento * sinal;
  else if (forma === 'Cartão crédito') saldoPorForma.credito += valorMovimento * sinal;
  else saldoPorForma.outro += valorMovimento * sinal;
}

const saldoCaixaSistema =
  saldoPorForma.dinheiro +
  saldoPorForma.pix +
  saldoPorForma.debito +
  saldoPorForma.credito +
  saldoPorForma.outro;

if (caixaBase?.id && (prisma as any).caixaDiario?.update) {
  await (prisma as any).caixaDiario.update({
    where: {
      id: caixaBase.id,
    },
    data: {
      saldoSistema: saldoCaixaSistema,
      saldoDinheiroSistema: saldoPorForma.dinheiro,
      saldoPixSistema: saldoPorForma.pix,
      saldoDebitoSistema: saldoPorForma.debito,
      saldoCreditoSistema: saldoPorForma.credito,
      saldoOutroSistema: saldoPorForma.outro,
    },
  });
}

    const formasPagamento = Object.entries(formasPagamentoMapa)
      .map(([forma, valor]) => ({
        forma,
        valor,
      }))
      .sort((a, b) => b.valor - a.valor);

    const servicosMaisRentaveis = Object.values(servicosRentaveisMapa)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);

    const profissionaisMaisRentaveis = Object.values(profissionaisMapa)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);

    const movimentacoesRecentes = [
      ...pagamentos
        .filter((pagamento: any) => pagamento.status === 'pago' || pagamento.status === 'parcial' || pagamento.status === 'approved')
        .map((pagamento: any) => ({
          id: pagamento.id,
          tipo: 'entrada',
          origem: 'pagamento',
          descricao: `Pagamento de atendimento · ${pagamento.metodoPagamento || 'forma não informada'}`,
          valor: numero(pagamento.valorPago || pagamento.valorTotal),
          data: pagamento.paidAt || pagamento.createdAt,
        })),
      ...(movimentacoesCaixa || []).map((mov: any) => ({
        id: mov.id,
        tipo: mov.tipo,
        origem: mov.origem,
        descricao: mov.descricao,
        valor: numero(mov.valor),
        data: mov.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 12);

    return NextResponse.json({
      success: true,
      empresa,
      periodo: {
        dataInicio: dataInicioParam,
        dataFim: dataFimParam,
      },
      resumo: {
        recebidoPeriodo,
        recebidoOperacional: totalPagoOperacional,
        pendenteOperacional: totalPendenteOperacional,
        totalAgendado,
        creditoClientes,
        debitoClientes,
        saldoClientes: creditoClientes - debitoClientes,
        comissoesPendentes: comissoesPendentesTotal,
        atendimentos: agendamentos.length,
        atendimentosConcluidos,
        atendimentosPendentes,
        atendimentosEmAberto,
        entradasManuais,
        saidasManuais,
        saldoCaixaSistema,
      },
      caixa: caixaBase
  ? {
      ...caixaBase,
      saldoSistema: saldoCaixaSistema,
      saldoDinheiroSistema: saldoPorForma.dinheiro,
      saldoPixSistema: saldoPorForma.pix,
      saldoDebitoSistema: saldoPorForma.debito,
      saldoCreditoSistema: saldoPorForma.credito,
      saldoOutroSistema: saldoPorForma.outro,
    }
  : null,
      formasPagamento,
      servicosMaisRentaveis,
      profissionaisMaisRentaveis,
      movimentacoesRecentes,
    });
  } catch (error: any) {
    console.error('Erro no resumo financeiro:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar resumo financeiro.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
