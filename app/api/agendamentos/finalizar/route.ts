import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function numero(valor: any) {
  if (valor === null || valor === undefined || valor === '') return 0;

  if (typeof valor === 'number') {
    return Number.isNaN(valor) ? 0 : valor;
  }

  const textoOriginal = String(valor).trim();

  if (!textoOriginal) return 0;

  const somenteNumero = textoOriginal.replace(/[^0-9,.-]/g, '');
  const temVirgula = somenteNumero.includes(',');
  const temPonto = somenteNumero.includes('.');

  let normalizado = somenteNumero;

  if (temVirgula && temPonto) {
    const ultimoSeparadorVirgula = somenteNumero.lastIndexOf(',');
    const ultimoSeparadorPonto = somenteNumero.lastIndexOf('.');

    if (ultimoSeparadorVirgula > ultimoSeparadorPonto) {
      normalizado = somenteNumero.replace(/\./g, '').replace(',', '.');
    } else {
      normalizado = somenteNumero.replace(/,/g, '');
    }
  } else if (temVirgula) {
    normalizado = somenteNumero.replace(',', '.');
  } else {
    normalizado = somenteNumero;
  }

  const convertido = Number(normalizado || 0);

  return Number.isNaN(convertido) ? 0 : convertido;
}

function calcularAjusteFechamento(params: {
  valorInformado: any;
  tipo: any;
  base: number;
}) {
  const valorInformado = numero(params.valorInformado);
  const tipo = String(params.tipo || 'valor').toLowerCase();

  if (valorInformado <= 0) return 0;

  if (tipo === 'percentual' || tipo === 'porcentagem' || tipo === '%') {
    return (params.base * valorInformado) / 100;
  }

  return valorInformado;
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

  const profissional = await prisma.profissional.findUnique({
    where: {
      id: profissionalId,
    },
  });

  if (!profissional) return;

  const existeComissao = await prisma.comissao.findFirst({
    where: {
      empresaId: empresa.id,
      agendamentoId: agendamento.id,
      profissionalId,
      agendamentoServicoId: agendamentoServicoId || null,
    },
  });

  if (existeComissao) return;

  let tipoComissao = (profissional as any)?.tipoComissao || 'fixo';

  let valorConfigurado = numero((profissional as any)?.valorComissao);

  if (servicoId) {
    const servico = await prisma.servico.findUnique({
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
      valorConfigurado = numero(servicoComissao.valorComissao);
    }
  }

  let valorBase = valorServico;

  if (empresa.tipoCalculoComissao === 'valor_recebido') {
    valorBase = valorServico;
  }

  let valorComissao = 0;

  if (tipoComissao === 'percentual') {
    valorComissao = (valorBase * valorConfigurado) / 100;
  }

  if (tipoComissao === 'fixo') {
    valorComissao = valorConfigurado;
  }

  await prisma.comissao.create({
    data: {
      empresaId: empresa.id,
      agendamentoId: agendamento.id,
      profissionalId,
      agendamentoServicoId: agendamentoServicoId || null,
      origemServico,
      valorServico,
      valorBaseRecebido: valorBase,
      percentualAplicado:
        tipoComissao === 'percentual' ? valorConfigurado : null,
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
      pagamentos = [],
      observacao,
      valorDescontoAtendimento = 0,
      tipoDescontoAtendimento = 'valor',
      valorAcrescimoAtendimento = 0,
      tipoAcrescimoAtendimento = 'valor',
      observacaoAjusteAtendimento,
      usarCreditoCliente = false,
      gerarDebitoCliente = false,
      valorDebitoCliente = 0,
      observacaoDebitoCliente,
      gerarCreditoCliente = false,
      valorCreditoCliente = 0,
      observacaoCreditoCliente,
      abaterDebitoCliente = false,
      valorAbatimentoDebitoCliente = 0,
      observacaoAbatimentoDebitoCliente,
    } = body;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId obrigatório.' },
        { status: 400 }
      );
    }

    if (!agendamentoId) {
      return NextResponse.json(
        { success: false, error: 'agendamentoId obrigatório.' },
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

    const agendamento = await prisma.agendamento.findFirst({
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
        { success: false, error: 'Atendimento não encontrado.' },
        { status: 404 }
      );
    }

    if (agendamento.status === 'cancelado') {
      return NextResponse.json(
        { success: false, error: 'Atendimento cancelado não pode ser finalizado.' },
        { status: 400 }
      );
    }

    if (!agendamento.dataHoraInicio) {
      return NextResponse.json(
        { success: false, error: 'Data do atendimento não encontrada.' },
        { status: 400 }
      );
    }

    const agora = new Date();
    const dataAtendimento = new Date(agendamento.dataHoraInicio);

    const mesmaDataAtendimento =
  dataAtendimento.getFullYear() === agora.getFullYear() &&
  dataAtendimento.getMonth() === agora.getMonth() &&
  dataAtendimento.getDate() === agora.getDate();

const atendimentoEmAndamento =
  agendamento.status === 'em_atendimento';

if (
  dataAtendimento.getTime() > agora.getTime() &&
  !(mesmaDataAtendimento && atendimentoEmAndamento)
) {
      return NextResponse.json(
        { success: false, error: 'Atendimentos futuros não podem ser finalizados.' },
        { status: 400 }
      );
    }

    const clienteId = agendamento.clienteId || agendamento.cliente?.id || null;

    const servicoPrincipal = agendamento.servico as any;
    const valorPrincipal = numero(servicoPrincipal?.valor || agendamento.valorTotal);
    const principalPago = pagamentoFoiRealizado(agendamento.statusPagamento);

    let totalPagoInicial = principalPago ? valorPrincipal : 0;
    let totalPendenteInicial = principalPago ? 0 : valorPrincipal;

    const servicosAdicionais = ((agendamento as any).servicosAdicionais || []) as any[];

    for (const item of servicosAdicionais) {
      const valor = numero(item?.valor);

      if (pagamentoFoiRealizado(item?.statusPagamento)) {
        totalPagoInicial += valor;
      } else {
        totalPendenteInicial += valor;
      }
    }

    const totalAtendimento = Math.max(
      numero(agendamento.valorTotal),
      valorPrincipal + servicosAdicionais.reduce((total, item) => total + numero(item?.valor), 0)
    );

    const valorDescontoCalculado = calcularAjusteFechamento({
      valorInformado: valorDescontoAtendimento,
      tipo: tipoDescontoAtendimento,
      base: totalPendenteInicial,
    });

    const valorAcrescimoCalculado = calcularAjusteFechamento({
      valorInformado: valorAcrescimoAtendimento,
      tipo: tipoAcrescimoAtendimento,
      base: totalPendenteInicial,
    });

    if (valorDescontoCalculado < 0 || valorAcrescimoCalculado < 0) {
      return NextResponse.json(
        { success: false, error: 'Desconto e acréscimo não podem ser negativos.' },
        { status: 400 }
      );
    }

    const limiteDescontoFechamento = totalAtendimento + valorAcrescimoCalculado;

    if (valorDescontoCalculado > limiteDescontoFechamento) {
      return NextResponse.json(
        {
          success: false,
          error: 'O desconto não pode ser maior que o valor total ajustado do atendimento.',
        },
        { status: 400 }
      );
    }

    const totalAtendimentoAjustado = Math.max(
      totalAtendimento - valorDescontoCalculado + valorAcrescimoCalculado,
      0
    );

    const totalPendenteAjustadoInicial = Math.max(
      totalAtendimentoAjustado - totalPagoInicial,
      0
    );

    const totalPagamentosInformados = (pagamentos || []).reduce(
      (total: number, pagamento: any) => total + numero(pagamento?.valor),
      0
    );

    let creditoAplicado = 0;
    let debitoAbatido = 0;
    let totalPendenteAposPagamentos = Math.max(
      totalPendenteAjustadoInicial - totalPagamentosInformados,
      0
    );

    const excedentePagamento = Math.max(totalPagamentosInformados - totalPendenteAjustadoInicial, 0);
    const valorAbatimentoManual = numero(valorAbatimentoDebitoCliente);

    if (abaterDebitoCliente && excedentePagamento > 0) {
      if (!clienteId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Não foi possível abater débito porque o atendimento não possui cliente vinculado.',
          },
          { status: 400 }
        );
      }

      if (valorAbatimentoManual <= 0) {
        return NextResponse.json(
          { success: false, error: 'Informe o valor que será abatido dos débitos do cliente.' },
          { status: 400 }
        );
      }

      if (valorAbatimentoManual > excedentePagamento) {
        return NextResponse.json(
          { success: false, error: 'O abatimento não pode ser maior que o valor excedente recebido.' },
          { status: 400 }
        );
      }

      const debitosAtivos = await prisma.clienteMovimentacaoFinanceira.findMany({
        where: {
          empresaId,
          clienteId,
          tipo: 'debito',
          status: 'ativo',
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const totalDebitoAberto = debitosAtivos.reduce(
        (total, debito) => total + numero((debito as any).valor),
        0
      );

      if (valorAbatimentoManual > totalDebitoAberto) {
        return NextResponse.json(
          { success: false, error: 'O abatimento não pode ser maior que o débito aberto do cliente.' },
          { status: 400 }
        );
      }

      let restanteParaAbater = valorAbatimentoManual;

      for (const debito of debitosAtivos) {
        if (restanteParaAbater <= 0) break;

        const valorDebito = numero((debito as any).valor);
        const valorUsado = Math.min(valorDebito, restanteParaAbater);

        if (valorUsado <= 0) continue;

        await prisma.clienteMovimentacaoFinanceira.update({
          where: { id: debito.id },
          data: {
            status: 'usado',
            usadoEmAgendamentoId: agendamento.id,
            observacao: `${debito.observacao || 'Débito abatido.'} | Abatido ${valorUsado.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })} no atendimento ${agendamento.id}.`,
          },
        });

        if (valorDebito > valorUsado) {
          await prisma.clienteMovimentacaoFinanceira.create({
            data: {
              empresaId,
              clienteId,
              agendamentoId: debito.agendamentoId || null,
              tipo: 'debito',
              valor: valorDebito - valorUsado,
              origem: 'saldo_debito_restante',
              status: 'ativo',
              observacao: `Saldo restante de débito após abatimento parcial no atendimento ${agendamento.id}.`,
            },
          });
        }

        debitoAbatido += valorUsado;
        restanteParaAbater -= valorUsado;
      }

      if (debitoAbatido > 0) {
        await prisma.clienteMovimentacaoFinanceira.create({
          data: {
            empresaId,
            clienteId,
            agendamentoId: agendamento.id,
            tipo: 'credito',
            valor: debitoAbatido,
            origem: 'abatimento_debito_no_fechamento',
            status: 'usado',
            usadoEmAgendamentoId: agendamento.id,
            observacao:
              observacaoAbatimentoDebitoCliente ||
              `Valor excedente do fechamento usado para abater débito do cliente.`,
          },
        });
      }
    }

    if (usarCreditoCliente && clienteId && totalPendenteAposPagamentos > 0) {
      const creditosAtivos = await prisma.clienteMovimentacaoFinanceira.findMany({
        where: {
          empresaId,
          clienteId,
          tipo: 'credito',
          status: 'ativo',
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      let restanteParaAbater = totalPendenteAposPagamentos;

      for (const credito of creditosAtivos) {
        if (restanteParaAbater <= 0) break;

        const valorCredito = numero((credito as any).valor);
        const valorUsado = Math.min(valorCredito, restanteParaAbater);

        if (valorUsado <= 0) continue;

        await prisma.clienteMovimentacaoFinanceira.update({
          where: { id: credito.id },
          data: {
            status: 'usado',
            usadoEmAgendamentoId: agendamento.id,
            observacao: `${credito.observacao || 'Crédito utilizado.'} | Usado ${valorUsado.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })} no atendimento ${agendamento.id}.`,
          },
        });

        if (valorCredito > valorUsado) {
          await prisma.clienteMovimentacaoFinanceira.create({
            data: {
              empresaId,
              clienteId,
              agendamentoId: agendamento.id,
              tipo: 'credito',
              valor: valorCredito - valorUsado,
              origem: 'saldo_credito_restante',
              status: 'ativo',
              observacao: `Saldo restante de crédito após uso parcial no atendimento ${agendamento.id}.`,
            },
          });
        }

        creditoAplicado += valorUsado;
        restanteParaAbater -= valorUsado;
      }

      totalPendenteAposPagamentos = Math.max(
        totalPendenteAposPagamentos - creditoAplicado,
        0
      );
    }

    let totalPendente = totalPendenteAposPagamentos;
    let totalPago = Math.min(
      totalAtendimentoAjustado,
      totalPagoInicial + totalPagamentosInformados + creditoAplicado
    );

    if (totalPendente <= 0) {
      await prisma.agendamento.update({
        where: { id: agendamento.id },
        data: { statusPagamento: 'pago' },
      });

      await (prisma as any).agendamentoServico.updateMany({
        where: {
          agendamentoId: agendamento.id,
          statusPagamento: { not: 'pago' },
        },
        data: {
          statusPagamento: 'pago',
          formaPagamento:
            pagamentos?.map((p: any) => p.forma).join(', ') ||
            (creditoAplicado > 0 ? 'credito_cliente' : null),
          pagoEm: new Date(),
        },
      });

      totalPago = totalAtendimentoAjustado;
      totalPendente = 0;
    }

if (
  totalPendente > 0 &&
  !gerarDebitoCliente
) {
  return NextResponse.json(
    {
      success: false,
      error:
        'Existe valor pendente no atendimento. Informe uma forma de pagamento, utilize crédito do cliente ou gere um débito para finalizar.',
    },
    { status: 400 }
  );
}

    const valorDebitoManual = numero(valorDebitoCliente);

    if (totalPendente > 0 && gerarDebitoCliente) {
      if (!clienteId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Não foi possível gerar débito porque o atendimento não possui cliente vinculado.',
          },
          { status: 400 }
        );
      }

      if (valorDebitoManual <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Informe o valor do débito do cliente.',
          },
          { status: 400 }
        );
      }

      if (valorDebitoManual > totalPendente) {
        return NextResponse.json(
          {
            success: false,
            error: 'O débito informado não pode ser maior que o valor pendente do atendimento.',
          },
          { status: 400 }
        );
      }

      const debitoExistente = await prisma.clienteMovimentacaoFinanceira.findFirst({
        where: {
          empresaId,
          clienteId,
          agendamentoId: agendamento.id,
          tipo: 'debito',
          origem: 'atendimento_finalizado',
          status: 'ativo',
        },
      });

      if (!debitoExistente) {
        await prisma.clienteMovimentacaoFinanceira.create({
          data: {
            empresaId,
            clienteId,
            agendamentoId: agendamento.id,
            tipo: 'debito',
            valor: valorDebitoManual,
            origem: 'atendimento_finalizado',
            status: 'ativo',
            observacao:
              observacaoDebitoCliente ||
              observacao ||
              `Débito registrado no fechamento do atendimento no valor de ${valorDebitoManual.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}. Pendência total do atendimento: ${totalPendente.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}.`,
          },
        });
      }
    }

    const valorCreditoManual = numero(valorCreditoCliente);

    if (gerarCreditoCliente && valorCreditoManual > 0) {
      if (!clienteId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Não foi possível gerar crédito porque o atendimento não possui cliente vinculado.',
          },
          { status: 400 }
        );
      }

      await prisma.clienteMovimentacaoFinanceira.create({
        data: {
          empresaId,
          clienteId,
          agendamentoId: agendamento.id,
          tipo: 'credito',
          valor: valorCreditoManual,
          origem: 'credito_no_fechamento',
          status: 'ativo',
          observacao:
            observacaoCreditoCliente ||
            observacao ||
            'Crédito gerado no fechamento do atendimento.',
        },
      });
    }

    const pagamentoExistente = await prisma.pagamento.findFirst({
      where: {
        agendamentoId: agendamento.id,
        status: 'pago',
      },
    });

    const metodosPagamento = [
      ...(pagamentos || []).map(
        (p: any) => `${p.forma}: R$ ${numero(p.valor).toFixed(2)}`
      ),
      ...(valorDescontoCalculado > 0
        ? [
            `desconto_${tipoDescontoAtendimento}: R$ ${valorDescontoCalculado.toFixed(2)}`,
          ]
        : []),
      ...(valorAcrescimoCalculado > 0
        ? [
            `acrescimo_${tipoAcrescimoAtendimento}: R$ ${valorAcrescimoCalculado.toFixed(2)}`,
          ]
        : []),
      ...(observacaoAjusteAtendimento
        ? [`observacao_ajuste: ${String(observacaoAjusteAtendimento)}`]
        : []),
      ...(creditoAplicado > 0
        ? [`credito_cliente: R$ ${creditoAplicado.toFixed(2)}`]
        : []),
      ...(debitoAbatido > 0
        ? [`abatimento_debito_cliente: R$ ${debitoAbatido.toFixed(2)}`]
        : []),
    ];

    if (!pagamentoExistente) {
      await prisma.pagamento.create({
        data: {
          empresaId,
          agendamentoId: agendamento.id,
          clienteId,
          valorTotal: totalAtendimentoAjustado,
          valorPago: totalPago,
          metodoPagamento: metodosPagamento.join(' | ') || 'não informado',
          status: totalPendente > 0 ? 'parcial' : 'pago',
          paidAt: totalPendente > 0 ? null : new Date(),
        } as any,
      });
    }

    await gerarComissaoIndividual({
      empresa,
      agendamento,
      profissionalId: agendamento.profissionalId,
      servicoId: agendamento.servicoId,
      valorServico: valorPrincipal,
      origemServico: 'principal',
    });

    for (const adicional of servicosAdicionais) {
      await gerarComissaoIndividual({
        empresa,
        agendamento,
        profissionalId: adicional.profissionalId,
        servicoId: adicional.servicoId,
        agendamentoServicoId: adicional.id,
        valorServico: numero(adicional.valor),
        origemServico: 'adicional',
      });
    }

    const atendimentoFinalizado = await prisma.agendamento.update({
      where: { id: agendamento.id },
      data: {
        status: 'concluido',
        statusPagamento: totalPendente > 0 ? 'pendente' : 'pago',
        valorTotal: totalAtendimentoAjustado,
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
      atendimento: atendimentoFinalizado,
      financeiro: {
        totalPago,
        totalPendente,
        totalOriginal: totalAtendimento,
        totalAjustado: totalAtendimentoAjustado,
        descontoAplicado: valorDescontoCalculado,
        acrescimoAplicado: valorAcrescimoCalculado,
        creditoAplicado,
        debitoAbatido,
        debitoGerado: totalPendente > 0 && gerarDebitoCliente ? valorDebitoManual : 0,
        creditoGerado: gerarCreditoCliente ? valorCreditoManual : 0,
      },
      message:
        totalPendente > 0
          ? gerarDebitoCliente
            ? 'Atendimento finalizado e débito registrado no cadastro do cliente.'
            : 'Atendimento finalizado com pendência financeira sem débito registrado.'
          : debitoAbatido > 0
            ? 'Atendimento finalizado com abatimento de débito do cliente.'
            : creditoAplicado > 0
              ? 'Atendimento finalizado com uso de crédito do cliente.'
              : 'Atendimento finalizado com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao finalizar atendimento:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao finalizar atendimento.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
