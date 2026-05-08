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
  if (tipo === 'assinatura') {
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const url = new URL(req.url);

    const type = body?.type || url.searchParams.get('type');
    const topic = url.searchParams.get('topic');

    if (type !== 'payment' && topic !== 'payment') {
      console.log('Ignorado:', { type, topic });
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

    const metadata = (pagamentoMP.metadata || {}) as any;

    const tipoPagamento = tipoUrl || metadata.tipo || null;
    const empresaId = empresaIdUrl || metadata.empresaId || null;

    const agendamentoId =
      metadata.agendamentoId ||
      pagamentoMP.external_reference ||
      url.searchParams.get('agendamentoId');

    const statusMP = pagamentoMP.status;

    console.log('📌 Status MP:', statusMP);
    console.log('📌 Tipo pagamento:', tipoPagamento);
    console.log('🏢 Empresa ID final:', empresaId);
    console.log('🔗 Agendamento ID:', agendamentoId);

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

      console.log('✅ Assinatura atualizada com sucesso');

      return NextResponse.json({
        received: true,
        tipo: 'assinatura',
        empresaId,
      });
    }

    if (!agendamentoId) {
      return NextResponse.json(
        { error: 'agendamentoId não encontrado' },
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
      where: { agendamentoId },
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

    await prisma.agendamento.update({
      where: { id: agendamentoId },
      data: {
        status: statusAgendamento,
        statusPagamento: statusMP === 'approved' ? 'pago' : statusPagamento,
      },
    });

    console.log('✅ Agendamento atualizado com sucesso');

    return NextResponse.json({
      received: true,
      tipo: 'agendamento',
      agendamentoId,
    });
  } catch (error) {
    console.error('❌ Erro webhook Mercado Pago:', error);

    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}