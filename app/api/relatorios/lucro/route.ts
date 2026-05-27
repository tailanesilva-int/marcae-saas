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

function normalizarTexto(valor?: string | null) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
}

function categoriaEhComissaoManual(categoria?: string | null) {
  const normalizada = normalizarTexto(categoria);

  return (
    normalizada.includes('comissao_manual') ||
    normalizada.includes('comissao')
  );
}

function tipoEhSaidaOperacional(tipo?: string | null) {
  const normalizado = normalizarTexto(tipo);

  return normalizado === 'saida' || normalizado === 'sangria';
}

function pagamentoConfirmado(status?: string | null) {
  const normalizado = normalizarTexto(status);

  return (
    normalizado === 'pago' ||
    normalizado === 'aprovado' ||
    normalizado === 'approved' ||
    normalizado === 'confirmado'
  );
}

function obterNomeServico(agendamento: any) {
  return (
    agendamento?.servico?.nome ||
    agendamento?.Servico?.nome ||
    agendamento?.servicoNome ||
    'Serviço não informado'
  );
}

function obterTextoPagamentos(agendamento: any) {
  const pagamentos =
    agendamento?.pagamentos ||
    agendamento?.Pagamento ||
    agendamento?.pagamento ||
    agendamento?.Pagamentos ||
    [];

  if (Array.isArray(pagamentos)) {
    return pagamentos
      .map(
        (pagamento: any) =>
          pagamento?.metodoPagamento ||
          pagamento?.formaPagamento ||
          pagamento?.observacao ||
          ''
      )
      .filter(Boolean)
      .join(' | ');
  }

  return String(
    pagamentos?.metodoPagamento ||
      pagamentos?.formaPagamento ||
      pagamentos?.observacao ||
      agendamento?.metodoPagamento ||
      ''
  );
}

function extrairValorAjusteDoTexto(texto: string, chave: string) {
  if (!texto) return 0;

  const regex = new RegExp(`${chave}_[^:|]*:\\s*R\\$\\s*([0-9.,]+)`, 'i');
  const match = texto.match(regex);

  if (!match?.[1]) return 0;

  return numero(match[1]);
}

function calcularValoresAgendamento(agendamento: any) {
  const valorOriginal =
    numero(agendamento?.valorOriginalServico) ||
    numero(agendamento?.valorServicoOriginal) ||
    numero(agendamento?.servico?.valor) ||
    numero(agendamento?.Servico?.valor) ||
    numero(agendamento?.valorTotal);

  const receitaLiquida = numero(agendamento?.valorTotal);

  const descontoPromocao =
    numero(agendamento?.valorEconomizado) ||
    Math.max(valorOriginal - receitaLiquida, 0);

  const textoPagamentos = obterTextoPagamentos(agendamento);

  const descontoManual =
    numero(agendamento?.descontoAplicado) ||
    numero(agendamento?.valorDescontoAtendimento) ||
    numero(agendamento?.descontoFechamento) ||
    extrairValorAjusteDoTexto(textoPagamentos, 'desconto');

  const acrescimoManual =
    numero(agendamento?.acrescimoAplicado) ||
    numero(agendamento?.valorAcrescimoAtendimento) ||
    numero(agendamento?.acrescimoFechamento) ||
    extrairValorAjusteDoTexto(textoPagamentos, 'acrescimo');

  const comissoes = Array.isArray(agendamento?.comissoes)
    ? agendamento.comissoes.reduce(
        (total: number, comissao: any) =>
          total + numero(comissao.valorComissao),
        0
      )
    : numero(agendamento?.valorComissao);

  const custoServicoPrincipal =
    numero(agendamento?.servico?.custo) ||
    numero(agendamento?.Servico?.custo) ||
    numero(agendamento?.custoServico) ||
    0;

  const servicosAdicionais =
    agendamento?.servicosAdicionais ||
    agendamento?.agendamentoServicos ||
    [];

  const adicionais = Array.isArray(servicosAdicionais)
    ? servicosAdicionais.reduce(
        (acc: any, adicional: any) => {
          const valorAdicional = numero(adicional.valor);
          const custoAdicional =
            numero(adicional.custo) ||
            numero(adicional.servico?.custo) ||
            0;

          const comissaoAdicional = Array.isArray(adicional.comissoes)
            ? adicional.comissoes.reduce(
                (total: number, comissao: any) =>
                  total + numero(comissao.valorComissao),
                0
              )
            : 0;

          acc.receita += pagamentoConfirmado(adicional.statusPagamento)
            ? valorAdicional
            : 0;
          acc.custo += custoAdicional;
          acc.comissao += comissaoAdicional;

          return acc;
        },
        {
          receita: 0,
          custo: 0,
          comissao: 0,
        }
      )
    : {
        receita: 0,
        custo: 0,
        comissao: 0,
      };

  return {
    valorOriginal,
    receitaLiquida: receitaLiquida + adicionais.receita,
    descontoPromocao,
    descontoManual,
    acrescimoManual,
    comissoes: comissoes + adicionais.comissao,
    custosServicos: custoServicoPrincipal + adicionais.custo,
  };
}

export async function GET(req: NextRequest) {
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

    const inicio = dataInicio
      ? new Date(`${dataInicio}T00:00:00`)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const fim = dataFim ? new Date(`${dataFim}T23:59:59`) : new Date();

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        empresaId,
        status: {
          not: 'cancelado',
        },
        dataHoraInicio: {
          gte: inicio,
          lte: fim,
        },
      },
      include: {
        cliente: true,
        servico: true,
        profissional: true,
        comissoes: true,
        servicosAdicionais: {
          include: {
            servico: true,
            profissional: true,
            comissoes: true,
          },
        },
      },
      orderBy: {
        dataHoraInicio: 'asc',
      },
    });

    const caixas = await (prisma as any).caixaDiario.findMany({
      where: {
        empresaId,
        data: {
          gte: inicio,
          lte: fim,
        },
      },
      include: {
        movimentacoes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        data: 'asc',
      },
    });

    const despesasOperacionais: any[] = [];

    for (const caixa of caixas as any[]) {
      for (const movimento of caixa.movimentacoes || []) {
        const tipo = movimento.tipo;
        const categoria = movimento.categoria;

        if (!tipoEhSaidaOperacional(tipo)) continue;
        if (categoriaEhComissaoManual(categoria)) continue;

        despesasOperacionais.push({
          id: movimento.id,
          caixaId: caixa.id,
          data: caixa.data,
          tipo: movimento.tipo,
          categoria: movimento.categoria || 'operacional',
          formaPagamento: movimento.formaPagamento || 'dinheiro',
          valor: numero(movimento.valor),
          descricao: movimento.descricao || '',
          usuarioNome: movimento.usuarioNome || '',
          createdAt: movimento.createdAt,
        });
      }
    }

    const resumo = {
      valorOriginal: 0,
      descontoPromocao: 0,
      descontoManual: 0,
      acrescimoManual: 0,
      receitaLiquida: 0,
      comissoes: 0,
      custosServicos: 0,
      despesasOperacionais: 0,
      lucroEstimado: 0,
      margem: 0,
      totalAtendimentos: agendamentos.length,
    };

    const servicosMap: Record<string, any> = {};

    for (const agendamento of agendamentos as any[]) {
      const valores = calcularValoresAgendamento(agendamento);
      const nomeServico = obterNomeServico(agendamento);

      resumo.valorOriginal += valores.valorOriginal;
      resumo.descontoPromocao += valores.descontoPromocao;
      resumo.descontoManual += valores.descontoManual;
      resumo.acrescimoManual += valores.acrescimoManual;
      resumo.receitaLiquida += valores.receitaLiquida;
      resumo.comissoes += valores.comissoes;
      resumo.custosServicos += valores.custosServicos;

      if (!servicosMap[nomeServico]) {
        servicosMap[nomeServico] = {
          nome: nomeServico,
          quantidade: 0,
          valorOriginal: 0,
          descontos: 0,
          acrescimos: 0,
          receitaLiquida: 0,
          custos: 0,
          comissoes: 0,
          despesasOperacionais: 0,
          lucro: 0,
        };
      }

      servicosMap[nomeServico].quantidade += 1;
      servicosMap[nomeServico].valorOriginal += valores.valorOriginal;
      servicosMap[nomeServico].descontos +=
        valores.descontoPromocao + valores.descontoManual;
      servicosMap[nomeServico].acrescimos += valores.acrescimoManual;
      servicosMap[nomeServico].receitaLiquida += valores.receitaLiquida;
      servicosMap[nomeServico].custos += valores.custosServicos;
      servicosMap[nomeServico].comissoes += valores.comissoes;
      servicosMap[nomeServico].lucro +=
        valores.receitaLiquida -
        valores.custosServicos -
        valores.comissoes;
    }

    resumo.despesasOperacionais = despesasOperacionais.reduce(
      (total, item) => total + numero(item.valor),
      0
    );

    resumo.lucroEstimado =
      resumo.receitaLiquida -
      resumo.custosServicos -
      resumo.comissoes -
      resumo.despesasOperacionais;

    resumo.margem =
      resumo.receitaLiquida > 0
        ? (resumo.lucroEstimado / resumo.receitaLiquida) * 100
        : 0;

    const rankingServicos = Object.values(servicosMap)
      .map((item: any) => ({
        ...item,
        lucro:
          item.receitaLiquida -
          item.custos -
          item.comissoes,
      }))
      .sort((a: any, b: any) => b.lucro - a.lucro);

    const despesasPorCategoriaMap: Record<string, number> = {};

    despesasOperacionais.forEach((item) => {
      const categoria = item.categoria || 'operacional';
      despesasPorCategoriaMap[categoria] =
        numero(despesasPorCategoriaMap[categoria]) + numero(item.valor);
    });

    const despesasPorCategoria = Object.entries(despesasPorCategoriaMap)
      .map(([categoria, valor]) => ({
        categoria,
        valor,
      }))
      .sort((a, b) => b.valor - a.valor);

    return NextResponse.json({
      success: true,
      periodo: {
        inicio,
        fim,
      },
      resumo,
      rankingServicos,
      despesasOperacionais,
      despesasPorCategoria,
    });
  } catch (error: any) {
    console.error('Erro ao gerar relatório de lucro:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao gerar relatório de lucro.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}