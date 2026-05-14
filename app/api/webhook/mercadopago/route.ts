import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { prisma } from '@/app/lib/prisma';

function criarClienteMercadoPagoComToken(accessToken?: string | null) {
  const token = String(accessToken || '').trim();

  if (!token) {
    throw new Error('Access Token Mercado Pago não configurado.');
  }

  return new MercadoPagoConfig({
    accessToken: token,
  });
}

async function criarClientMercadoPago(
  empresaId?: string | null,
  tipo?: string | null
) {
  if (tipo === 'assinatura' || tipo === 'assinatura_recorrente') {
    return criarClienteMercadoPagoComToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);
  }

  if (empresaId) {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    const empresaPagamento = empresa as any;

    if (empresaPagamento?.mercadoPagoAccessToken) {
      return criarClienteMercadoPagoComToken(
        empresaPagamento.mercadoPagoAccessToken
      );
    }
  }

  return criarClienteMercadoPagoComToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);
}

async function mercadoPagoGet(path: string) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error('Token Mercado Pago do Marcaê não configurado.');
  }

  const response = await fetch(`https://api.mercadopago.com${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error('Erro Mercado Pago GET:', path, data);
    throw new Error(data?.message || data?.error || 'Erro ao consultar Mercado Pago.');
  }

  return data;
}

function adicionarDias(data: Date, dias: number) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + dias);

  return novaData;
}

function extrairEmpresaEPlano(externalReference?: string | null) {
  const partes = String(externalReference || '').split(':');

  return {
    empresaId: partes[0] || null,
    plano: partes[1] || null,
  };
}

function normalizarPlano(plano?: string | null) {
  const normalizado = String(plano || '').toLowerCase();

  if (normalizado === 'basico') return 'basico';
  if (normalizado === 'plus') return 'plus';
  if (normalizado === 'premium') return 'premium';

  return 'premium';
}

async function buscarPlanoPendentePorAssinatura(mercadoPagoAssinaturaId: string) {
  const pagamentoAssinatura = await prisma.pagamentoAssinatura.findFirst({
    where: {
      mercadoPagoAssinaturaId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const tipo = String((pagamentoAssinatura as any)?.tipo || '');
  const plano = tipo.replace('recorrente_', '');

  return {
    pagamentoAssinatura,
    plano: normalizarPlano(plano),
  };
}

async function processarWebhookPreapproval(preapprovalId: string) {
  const assinaturaMP = await mercadoPagoGet(`/preapproval/${preapprovalId}`);

  console.log('📦 Dados assinatura MP:', assinaturaMP);

  const { empresaId, plano } = extrairEmpresaEPlano(
    assinaturaMP.external_reference
  );

  let empresaIdFinal = empresaId;
  let planoFinal = normalizarPlano(plano);

  if (!empresaIdFinal) {
    const empresa = await prisma.empresa.findFirst({
      where: {
        mercadoPagoAssinaturaId: String(preapprovalId),
      },
    });

    empresaIdFinal = empresa?.id || null;
  }

  if (!empresaIdFinal) {
    return NextResponse.json(
      { error: 'Empresa não encontrada para assinatura recorrente.' },
      { status: 404 }
    );
  }

  if (!plano) {
    const dadosPagamento = await buscarPlanoPendentePorAssinatura(
      String(preapprovalId)
    );

    planoFinal = dadosPagamento.plano;
  }

  const status = String(assinaturaMP.status || '').toLowerCase();
  const agora = new Date();

  const proximaCobranca = assinaturaMP.next_payment_date
    ? new Date(assinaturaMP.next_payment_date)
    : adicionarDias(agora, 30);

  await prisma.pagamentoAssinatura.updateMany({
    where: {
      mercadoPagoAssinaturaId: String(preapprovalId),
    },
    data: {
      status:
        status === 'authorized'
          ? 'ativa'
          : status === 'cancelled'
          ? 'cancelada'
          : status || 'pendente',
      vencimento: status === 'authorized' ? proximaCobranca : undefined,
      dataPagamento: status === 'authorized' ? agora : undefined,
    },
  });

  if (status === 'authorized') {
    await prisma.empresa.update({
      where: {
        id: empresaIdFinal,
      },
      data: {
        plano: planoFinal,
        assinaturaStatus: 'ativa',
        assinaturaExpiraEm: proximaCobranca,
        assinaturaProximaCobrancaEm: proximaCobranca,
        assinaturaRecorrenteAtiva: true,
        mercadoPagoAssinaturaId: String(preapprovalId),
        modoPagamentoAssinatura: 'recorrente',
        formaPagamentoAssinatura: 'cartao',
        statusFinanceiro: 'em_dia',
        bloqueadoPorInadimplencia: false,
        trialAtivo: false,
      } as any,
    });
  }

  if (['cancelled', 'paused'].includes(status)) {
    await prisma.empresa.update({
      where: {
        id: empresaIdFinal,
      },
      data: {
        assinaturaStatus: status === 'paused' ? 'pausada' : 'cancelada',
        assinaturaRecorrenteAtiva: false,
        statusFinanceiro: status === 'cancelled' ? 'inadimplente' : 'pendente',
        bloqueadoPorInadimplencia: status === 'cancelled',
      } as any,
    });
  }

  return NextResponse.json({
    received: true,
    tipo: 'assinatura_recorrente',
    mercadoPagoAssinaturaId: String(preapprovalId),
    empresaId: empresaIdFinal,
    status,
  });
}

async function processarPagamentoRecorrente(paymentId: string, pagamentoMP: any) {
  const preapprovalId =
    pagamentoMP.preapproval_id ||
    pagamentoMP.preapproval?.id ||
    pagamentoMP.metadata?.preapproval_id ||
    pagamentoMP.metadata?.mercadoPagoAssinaturaId ||
    null;

  if (!preapprovalId) {
    return false;
  }

  const empresa = await prisma.empresa.findFirst({
    where: {
      mercadoPagoAssinaturaId: String(preapprovalId),
    },
  });

  if (!empresa) {
    return false;
  }

  const dadosPagamento = await buscarPlanoPendentePorAssinatura(
    String(preapprovalId)
  );

  const statusMP = pagamentoMP.status;
  const agora = new Date();
  const vencimento = adicionarDias(agora, 30);

  let statusAssinatura = 'pendente';

  if (statusMP === 'approved') {
    statusAssinatura = 'aprovado';
  }

  if (statusMP === 'rejected') {
    statusAssinatura = 'recusado';
  }

  if (statusMP === 'cancelled') {
    statusAssinatura = 'cancelado';
  }

  await prisma.pagamentoAssinatura.updateMany({
    where: {
      mercadoPagoAssinaturaId: String(preapprovalId),
    },
    data: {
      status: statusAssinatura,
      paymentId: String(paymentId),
      dataPagamento: statusMP === 'approved' ? agora : undefined,
      vencimento: statusMP === 'approved' ? vencimento : undefined,
    },
  });

  if (statusMP === 'approved') {
    await prisma.empresa.update({
      where: {
        id: empresa.id,
      },
      data: {
        plano: dadosPagamento.plano,
        assinaturaStatus: 'ativa',
        assinaturaExpiraEm: vencimento,
        assinaturaProximaCobrancaEm: vencimento,
        assinaturaRecorrenteAtiva: true,
        ultimoPagamentoEm: agora,
        modoPagamentoAssinatura: 'recorrente',
        formaPagamentoAssinatura: 'cartao',
        statusFinanceiro: 'em_dia',
        bloqueadoPorInadimplencia: false,
        trialAtivo: false,
      } as any,
    });
  }

  if (statusMP === 'rejected' || statusMP === 'cancelled') {
    await prisma.empresa.update({
      where: {
        id: empresa.id,
      },
      data: {
        assinaturaStatus: statusMP === 'rejected' ? 'pagamento_recusado' : 'cancelada',
        assinaturaRecorrenteAtiva: false,
        statusFinanceiro: 'inadimplente',
        bloqueadoPorInadimplencia: true,
      } as any,
    });
  }

  console.log('✅ Pagamento recorrente processado com sucesso');

  return true;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const url = new URL(req.url);

    const type = body?.type || url.searchParams.get('type');
    const topic = url.searchParams.get('topic');
    const action = body?.action || url.searchParams.get('action');

    const recursoWebhook = String(type || topic || action || '').toLowerCase();

    const preapprovalId =
      body?.data?.id ||
      body?.id ||
      url.searchParams.get('id') ||
      url.searchParams.get('preapproval_id');

    if (
      recursoWebhook.includes('preapproval') ||
      recursoWebhook.includes('subscription')
    ) {
      if (!preapprovalId) {
        return new Response('Preapproval ID não encontrado', { status: 400 });
      }

      return processarWebhookPreapproval(String(preapprovalId));
    }

    if (type !== 'payment' && topic !== 'payment') {
      console.log('Ignorado:', { type, topic, action });
      return new Response('ok', { status: 200 });
    }

    const paymentId = body?.data?.id || body?.id || url.searchParams.get('id');

    if (!paymentId) {
      return new Response('Payment ID não encontrado', { status: 400 });
    }

    const empresaIdUrl = body?.empresaId || url.searchParams.get('empresaId');
    const tipoUrl = body?.tipo || url.searchParams.get('tipo');

    console.log('💳 Payment ID:', paymentId);
    console.log('🏢 Empresa ID URL:', empresaIdUrl);
    console.log('📌 Tipo URL:', tipoUrl);

    const client = await criarClientMercadoPago(empresaIdUrl, tipoUrl);
    const payment = new Payment(client);

    const pagamentoMP = (await payment.get({
      id: paymentId,
    })) as any;

    console.log('📦 Dados MP:', pagamentoMP);

    const pagamentoRecorrenteProcessado = await processarPagamentoRecorrente(
      String(paymentId),
      pagamentoMP
    );

    if (pagamentoRecorrenteProcessado) {
      return NextResponse.json({
        received: true,
        tipo: 'assinatura_recorrente',
        paymentId: String(paymentId),
      });
    }

    const metadata = (pagamentoMP.metadata || {}) as any;

    const tipoPagamento = tipoUrl || metadata.tipo || null;
    const empresaId = empresaIdUrl || metadata.empresaId || null;

    const grupoAgendamentoId =
      metadata.grupoAgendamentoId ||
      metadata.grupo_agendamento_id ||
      url.searchParams.get('grupoAgendamentoId') ||
      null;

    const agendamentoId =
      metadata.agendamentoId ||
      pagamentoMP.external_reference ||
      url.searchParams.get('agendamentoId');

    const statusMP = pagamentoMP.status;

    console.log('📌 Status MP:', statusMP);
    console.log('📌 Tipo pagamento:', tipoPagamento);
    console.log('🏢 Empresa ID final:', empresaId);
    console.log('🔗 Agendamento ID:', agendamentoId);
    console.log('🧩 Grupo agendamento ID:', grupoAgendamentoId);

    if (tipoPagamento === 'assinatura') {
      if (!empresaId) {
        return NextResponse.json(
          { error: 'empresaId não encontrado para assinatura' },
          { status: 400 }
        );
      }

      let statusAssinatura = 'pendente';

      if (statusMP === 'approved') {
        statusAssinatura = 'aprovado';
      }

      if (statusMP === 'rejected') {
        statusAssinatura = 'recusado';
      }

      if (statusMP === 'cancelled') {
        statusAssinatura = 'cancelado';
      }

      const agora = new Date();
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 30);

      await (prisma as any).pagamentoAssinatura.updateMany({
        where: {
          empresaId,
          preferenceId: pagamentoMP.preference_id
            ? String(pagamentoMP.preference_id)
            : undefined,
        },
        data: {
          status: statusAssinatura,
          paymentId: String(paymentId),
          dataPagamento: statusMP === 'approved' ? agora : undefined,
          vencimento: statusMP === 'approved' ? vencimento : undefined,
        },
      });

      if (statusMP === 'approved') {
        await prisma.empresa.update({
          where: { id: empresaId },
          data: {
            plano: 'premium',
            assinaturaStatus: 'ativa',
            assinaturaExpiraEm: vencimento,
            trialAtivo: false,
          } as any,
        });
      }

      console.log('✅ Assinatura manual atualizada com sucesso');

      return NextResponse.json({
        received: true,
        tipo: 'assinatura',
        empresaId,
      });
    }

    if (!agendamentoId && !grupoAgendamentoId) {
      return NextResponse.json(
        { error: 'agendamentoId ou grupoAgendamentoId não encontrado' },
        { status: 400 }
      );
    }

    let statusPagamento = 'pendente';
    let statusAgendamento = 'aguardando_pagamento';

    if (statusMP === 'approved') {
      statusPagamento = 'aprovado';
      statusAgendamento = 'confirmado';
    }

    if (statusMP === 'rejected') {
      statusPagamento = 'recusado';
    }

    if (statusMP === 'cancelled') {
      statusPagamento = 'cancelado';
      statusAgendamento = 'cancelado';
    }

    const pagamento = await prisma.pagamento.findFirst({
  where: {
    OR: [
      {
        externalId:
          grupoAgendamentoId || agendamentoId || undefined,
      },

      {
        preferenceId:
          pagamentoMP.preference_id
            ? String(pagamentoMP.preference_id)
            : undefined,
      },

      agendamentoId
        ? {
            agendamentoId,
          }
        : {},

      grupoAgendamentoId
        ? {
            agendamento: {
              grupoAgendamentoId,
            },
          }
        : {},
    ],
  },
});

    if (!pagamento) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado no banco' },
        { status: 404 }
      );
    }

    await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: {
        externalId: String(paymentId),
        status: statusPagamento,
        metodoPagamento: pagamentoMP.payment_method_id || null,
        paidAt: statusMP === 'approved' ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    if (grupoAgendamentoId) {
      await prisma.agendamento.updateMany({
        where: {
          grupoAgendamentoId,
        },
        data: {
          status: statusAgendamento,
          statusPagamento: statusMP === 'approved' ? 'pago' : statusPagamento,
        },
      });

      console.log('✅ Grupo de agendamentos atualizado com sucesso');
    } else if (agendamentoId) {
      await prisma.agendamento.update({
        where: { id: agendamentoId },
        data: {
          status: statusAgendamento,
          statusPagamento: statusMP === 'approved' ? 'pago' : statusPagamento,
        },
      });

      console.log('✅ Agendamento atualizado com sucesso');
    }

    return NextResponse.json({
      received: true,
      tipo: 'agendamento',
      agendamentoId,
      grupoAgendamentoId,
    });
  } catch (error) {
    console.error('❌ Erro webhook Mercado Pago:', error);

    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}