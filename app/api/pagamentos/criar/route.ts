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

      const empresaPagamento = agendamento.empresa as any;

      if (!podeUsarPrePagamento(agendamento.empresa)) {
        return NextResponse.json(
          {
            error:
              'Pré-pagamento disponível apenas para empresas com Premium ativo.',
          },
          { status: 403 }
        );
      }

      if (!empresaPagamento.mercadoPagoAtivo) {
        return NextResponse.json(
          {
            error:
              'Mercado Pago da empresa ainda não está ativo.',
          },
          { status: 400 }
        );
      }

      if (!empresaPagamento.mercadoPagoAccessToken) {
        return NextResponse.json(
          {
            error:
              'Access Token Mercado Pago da empresa não configurado.',
          },
          { status: 400 }
        );
      }

      const grupoAgendamentoId = agendamento.grupoAgendamentoId;

      const agendamentosGrupo = grupoAgendamentoId
        ? await prisma.agendamento.findMany({
            where: {
              grupoAgendamentoId,
            },
            include: {
              servico: true,
            },
          })
        : [agendamento];

      const valorTotalGrupo = agendamentosGrupo.reduce((total, item) => {
        const valorPrePago =
          Number(item.valorPrePago || 0);

        const valorTotal =
          Number(item.valorTotal || 0);

        return total + (valorPrePago > 0 ? valorPrePago : valorTotal);
      }, 0);

      if (!valorTotalGrupo || valorTotalGrupo <= 0) {
        return NextResponse.json(
          { error: 'Valor do pagamento inválido' },
          { status: 400 }
        );
      }

      const clientEmpresa = criarClienteMercadoPago(
        empresaPagamento.mercadoPagoAccessToken
      );

      const preference = new Preference(clientEmpresa);

      const notificationUrl =
        `${baseUrl}/api/webhook/mercadopago?tipo=agendamento&empresaId=${agendamento.empresaId}&grupoAgendamentoId=${grupoAgendamentoId}`;

      const response = await preference.create({
        body: {
          items: [
            {
              id: grupoAgendamentoId || agendamento.id,
              title:
                agendamentosGrupo.length > 1
                  ? `Agendamento com ${agendamentosGrupo.length} serviços`
                  : agendamento.servico?.nome || 'Agendamento',
              quantity: 1,
              unit_price: valorTotalGrupo,
            },
          ],

          payer: {
            name: agendamento.cliente?.nome || 'Cliente',
            email: 'test_user_3373866382@testuser.com',
          },

          external_reference:
            grupoAgendamentoId || agendamento.id,

          metadata: {
            tipo: 'agendamento',
            agendamentoId: agendamento.id,
            grupoAgendamentoId,
            empresaId: agendamento.empresaId,
          },

          notification_url: notificationUrl,

          back_urls: {
      success: `${baseUrl}/sucesso/${agendamento.id}`,
      failure: `${baseUrl}/erro/${agendamento.id}`,
      pending: `${baseUrl}/pendente/${agendamento.id}`,
    },
  },
});

      const linkPagamento = obterLinkPagamento(
        response,
        empresaPagamento.mercadoPagoModo
      );

      await prisma.pagamento.create({
        data: {
          empresaId: agendamento.empresaId,
          agendamentoId: agendamento.id,
          clienteId: agendamento.clienteId,
          valorTotal: valorTotalGrupo,
          valorPago: valorTotalGrupo,
          status: 'pendente',
          preferenceId: response.id,
          linkPagamento,
        },
      });

      return NextResponse.json({
        linkPagamento,
        preferenceId: response.id,
        grupoAgendamentoId,
        valorTotalGrupo,
        quantidadeServicos: agendamentosGrupo.length,
        notificationUrl,
        tipo: 'agendamento',
      });
    }

    return NextResponse.json(
      { error: 'tipo inválido.' },
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