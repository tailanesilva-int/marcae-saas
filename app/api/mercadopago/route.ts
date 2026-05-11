import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { prisma } from '@/app/lib/prisma';

async function criarClientMercadoPago(
  empresaId?: string | null,
  tipo?: string | null
) {
  // Assinatura do SaaS → usa token do Marcaê
  if (tipo === 'assinatura') {
    return new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
    });
  }

  // Pagamento de agendamento → usa token da empresa
  if (empresaId) {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    const empresaPagamento = empresa as any;

    if (empresaPagamento?.mercadoPagoAccessToken) {
      return new MercadoPagoConfig({
        accessToken: empresaPagamento.mercadoPagoAccessToken,
      });
    }
  }

  // fallback segurança
  return new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const url = new URL(req.url);

    const type = body?.type || url.searchParams.get('type');
    const topic = url.searchParams.get('topic');

    // 🚫 Ignora eventos que não são pagamento
    if (type !== 'payment' && topic !== 'payment') {
      console.log('Ignorado:', { type, topic });
      return new Response('ok', { status: 200 });
    }

    const paymentId =
      body?.data?.id ||
      body?.id ||
      url.searchParams.get('id');

    if (!paymentId) {
      return new Response('Payment ID não encontrado', { status: 400 });
    }

    console.log('💳 Payment ID:', paymentId);

    const empresaId =
      body?.empresaId ||
      url.searchParams.get('empresaId');

    const tipoPagamento =
      body?.tipo ||
      url.searchParams.get('tipo');

    const client = await criarClientMercadoPago(
      empresaId,
      tipoPagamento
    );

    const payment = new Payment(client);

    const pagamentoMP = (await payment.get({
      id: paymentId,
    })) as any;

    console.log('📦 Dados MP:', pagamentoMP);

    const agendamentoId =
      pagamentoMP.external_reference ||
      pagamentoMP.metadata?.agendamentoId;

    console.log('🔗 Agendamento ID:', agendamentoId);

    if (!agendamentoId) {
      return NextResponse.json(
        { error: 'agendamentoId não encontrado' },
        { status: 400 }
      );
    }

    const statusMP = pagamentoMP.status;

    console.log('📌 Status MP:', statusMP);

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
        statusPagamento:
          statusMP === 'approved' ? 'pago' : statusPagamento,
      },
    });

    console.log('✅ Atualizado com sucesso');

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Erro webhook Mercado Pago:', error);

    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}