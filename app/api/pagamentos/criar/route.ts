import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { prisma } from '@/app/lib/prisma';
import { podeUsarPrePagamento } from '@/lib/plano';

function criarClienteMercadoPago(accessToken?: string | null) {
  const token = String(accessToken || '').trim();

  if (!token) {
    throw new Error('Access Token Mercado Pago não configurado.');
  }

  return new MercadoPagoConfig({
    accessToken: token,
  });
}

function getBaseUrl() {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'https://www.marcaeapp.com.br';

  return url.replace(/\/$/, '');
}

function obterLinkPagamento(response: any, modo?: string | null) {
  if (modo === 'sandbox') {
    return response.sandbox_init_point || response.init_point;
  }

  return response.init_point || response.sandbox_init_point;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { agendamentoId, empresaId, tipo } = body;

    const baseUrl = getBaseUrl();

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

      if (!agendamento.empresa.mercadoPagoAtivo) {
        return NextResponse.json(
          {
            error:
              'Mercado Pago da empresa ainda não está ativo. Configure o recebimento online em Configurações.',
          },
          { status: 400 }
        );
      }

      if (!agendamento.empresa.mercadoPagoAccessToken) {
        return NextResponse.json(
          {
            error:
              'Access Token Mercado Pago da empresa não configurado. Configure o recebimento online em Configurações.',
          },
          { status: 400 }
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

      const clientEmpresa = criarClienteMercadoPago(
        agendamento.empresa.mercadoPagoAccessToken
      );

      const preference = new Preference(clientEmpresa);

      const notificationUrl = `${baseUrl}/api/webhook/mercadopago?tipo=agendamento&empresaId=${agendamento.empresaId}&agendamentoId=${agendamento.id}`;

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

      const linkPagamento = obterLinkPagamento(
        response,
        agendamento.empresa.mercadoPagoModo
      );

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
        recebedor: 'empresa',
        mercadoPagoModo: agendamento.empresa.mercadoPagoModo || 'sandbox',
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

      const tokenMarcae = process.env.MERCADO_PAGO_ACCESS_TOKEN;

      if (!tokenMarcae) {
        return NextResponse.json(
          {
            error:
              'Token Mercado Pago do Marcaê não configurado no ambiente.',
          },
          { status: 500 }
        );
      }

      const clientMarcae = criarClienteMercadoPago(tokenMarcae);
      const preference = new Preference(clientMarcae);

      const notificationUrl = `${baseUrl}/api/webhook/mercadopago?tipo=assinatura&empresaId=${empresa.id}`;

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

      const linkPagamento = obterLinkPagamento(response, 'producao');

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
        recebedor: 'marcae',
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
