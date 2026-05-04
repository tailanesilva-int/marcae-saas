import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { prisma } from '@/app/lib/prisma';
import { podeUsarPrePagamento } from '@/lib/plano';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

function getBaseUrl() {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NGROK_URL ||
    'https://return-encircle-efficient.ngrok-free.dev';

  return url.replace(/\/$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { agendamentoId, empresaId, tipo } = body;

    const baseUrl = getBaseUrl();
    const notificationUrl = `${baseUrl}/api/webhook/mercadopago`;

    const preference = new Preference(client);

    if (tipo === 'agendamento') {
      if (!agendamentoId) {
        return NextResponse.json(
          { error: 'agendamentoId é obrigatório' },
          { status: 400 }
        );
      }

      const agendamento = await prisma.agendamento.findUnique({
        where: { id: agendamentoId },
        include: {
          cliente: true,
          servico: true,
          empresa: true,
        },
      });

      if (!agendamento) {
        return NextResponse.json(
          { error: 'Agendamento não encontrado' },
          { status: 404 }
        );
      }

      if (!podeUsarPrePagamento(agendamento.empresa)) {
        return NextResponse.json(
          {
            error:
              'Pré-pagamento disponível apenas para empresas com Premium ativo.',
            planoAtual: agendamento.empresa.plano || 'basico',
            assinaturaStatus:
              agendamento.empresa.assinaturaStatus || 'vencida',
            assinaturaExpiraEm: agendamento.empresa.assinaturaExpiraEm,
          },
          { status: 403 }
        );
      }

      const valorPrePago = Number(agendamento.valorPrePago || 0);
      const valorTotal = Number(agendamento.valorTotal || 0);
      const valor = valorPrePago > 0 ? valorPrePago : valorTotal;

      if (!valor || valor <= 0) {
        return NextResponse.json(
          { error: 'Valor do pagamento inválido' },
          { status: 400 }
        );
      }

      const response = await preference.create({
        body: {
          items: [
  {
    id: agendamento.id,
    title: agendamento.servico?.nome || 'Agendamento',
    quantity: 1,
    unit_price: valor,
  },
],
          payer: {
            name: agendamento.cliente?.nome || 'Cliente',
            email: 'test_user_3373866382@testuser.com',
          },
          external_reference: agendamento.id,
          metadata: {
            tipo: 'agendamento',
            agendamentoId: agendamento.id,
            empresaId: agendamento.empresaId,
          },
          notification_url: notificationUrl,
          back_urls: {
            success: `${baseUrl}/sucesso/${agendamento.id}`,
            failure: `${baseUrl}/erro/${agendamento.id}`,
            pending: `${baseUrl}/pendente/${agendamento.id}`,
          },
          auto_return: 'approved',
        },
      });

      const linkPagamento = response.init_point || response.sandbox_init_point;

      await prisma.pagamento.create({
        data: {
          empresaId: agendamento.empresaId,
          agendamentoId: agendamento.id,
          clienteId: agendamento.clienteId,
          valorTotal: agendamento.valorTotal,
          valorPago: valor,
          status: 'pendente',
          preferenceId: response.id,
          linkPagamento,
        },
      });

      return NextResponse.json({
        linkPagamento,
        preferenceId: response.id,
        notificationUrl,
        tipo: 'agendamento',
      });
    }

    if (tipo === 'assinatura') {
      if (!empresaId) {
        return NextResponse.json(
          { error: 'empresaId é obrigatório' },
          { status: 400 }
        );
      }

      const empresa = await prisma.empresa.findUnique({
        where: { id: empresaId },
      });

      if (!empresa) {
        return NextResponse.json(
          { error: 'Empresa não encontrada' },
          { status: 404 }
        );
      }

      const valorPlano = 49.9;

      const response = await preference.create({
        body: {
          items: [
  {
    id: `assinatura-${empresa.id}`,
    title: `Assinatura Premium - ${empresa.nome}`,
    quantity: 1,
    unit_price: valorPlano,
  },
],
          payer: {
            email: 'test_user_3373866382@testuser.com',
          },
          external_reference: empresa.id,
          metadata: {
            tipo: 'assinatura',
            empresaId: empresa.id,
          },
          notification_url: notificationUrl,
          back_urls: {
            success: `${baseUrl}/api/assinatura/confirmar?empresaId=${empresa.id}`,
            failure: `${baseUrl}/admin?pagamento=erro`,
            pending: `${baseUrl}/admin?pagamento=pendente`,
          },
          auto_return: 'approved',
        },
      });

      const linkPagamento = response.init_point || response.sandbox_init_point;

      await prisma.pagamentoAssinatura.create({
        data: {
          empresaId: empresa.id,
          valor: valorPlano,
          status: 'pendente',
          preferenceId: response.id,
          linkPagamento,
          tipo: 'manual',
        },
      });

      return NextResponse.json({
        linkPagamento,
        preferenceId: response.id,
        notificationUrl,
        tipo: 'assinatura',
      });
    }

    return NextResponse.json(
      { error: 'tipo inválido. Use agendamento ou assinatura.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao criar pagamento:', error);

    return NextResponse.json(
      {
        error: 'Erro ao criar pagamento',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}