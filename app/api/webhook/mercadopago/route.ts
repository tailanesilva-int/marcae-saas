import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import {
  enviarWhatsapp,
  montarMensagemConfirmacao,
} from '@/lib/whatsapp';

async function buscarTokenMercadoPago(params: {
  tipoPagamento?: string | null;
  empresaId?: string | null;
}) {
  const { tipoPagamento, empresaId } = params;

  /*
  =========================================
  ASSINATURA DO SAAS
  =========================================
  */

  if (tipoPagamento === 'assinatura') {
    return process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
  }

  /*
  =========================================
  PAGAMENTO DE AGENDAMENTO
  =========================================
  */

  if (empresaId) {
    const empresa = await prisma.empresa.findUnique({
      where: {
        id: empresaId,
      },
      select: {
        mercadoPagoAtivo: true,
        mercadoPagoAccessToken: true,
      },
    });

    if (
      empresa?.mercadoPagoAtivo &&
      empresa?.mercadoPagoAccessToken
    ) {
      return empresa.mercadoPagoAccessToken;
    }
  }

  /*
  =========================================
  FALLBACK
  =========================================
  */

  return process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const searchParams = req.nextUrl.searchParams;

    console.log('📩 Webhook recebido:', body);

    const tipoEvento =
      body.type || searchParams.get('type');

    const paymentId =
      body.data?.id ||
      searchParams.get('data.id') ||
      searchParams.get('id');

    if (
      tipoEvento !== 'payment' ||
      !paymentId
    ) {
      return NextResponse.json({
        received: true,
      });
    }

    /*
    =========================================
    BUSCAR METADATA INICIAL
    =========================================
    */

    const pagamentoLocal =
      await prisma.pagamento.findFirst({
        where: {
          OR: [
            {
              externalId: String(paymentId),
            },
          ],
        },
      });

    const pagamentoAssinatura =
      await prisma.pagamentoAssinatura.findFirst({
        where: {
          OR: [
            {
              paymentId: String(paymentId),
            },
          ],
        },
      });

    let empresaId: string | null = null;
    let tipoPagamento: string | null = null;

    if (pagamentoAssinatura) {
      empresaId =
        pagamentoAssinatura.empresaId;
      tipoPagamento = 'assinatura';
    }

    if (pagamentoLocal) {
      empresaId = pagamentoLocal.empresaId;
      tipoPagamento = 'agendamento';
    }

    /*
    =========================================
    TOKEN DINÂMICO
    =========================================
    */

    const accessToken =
      await buscarTokenMercadoPago({
        tipoPagamento,
        empresaId,
      });

    if (!accessToken) {
      console.log(
        '❌ Token Mercado Pago não encontrado.'
      );

      return NextResponse.json({
        received: true,
      });
    }

    /*
    =========================================
    CONSULTAR PAGAMENTO
    =========================================
    */

    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const payment = await res.json();

    console.log(
      '💰 Pagamento Mercado Pago:',
      payment
    );

    if (!res.ok) {
      console.log(
        '⚠️ Pagamento não encontrado'
      );

      return NextResponse.json({
        received: true,
      });
    }

    if (payment.status !== 'approved') {
      console.log(
        '⏳ Ainda não aprovado:',
        payment.status
      );

      return NextResponse.json({
        received: true,
      });
    }

    const metadata = payment.metadata || {};

    tipoPagamento =
      metadata.tipo || metadata.type;

    const preferenceId =
      payment.preference_id ||
      metadata.preferenceId ||
      metadata.preference_id ||
      null;

    const agendamentoId =
      metadata.agendamentoId ||
      metadata.agendamento_id ||
      payment.external_reference;

    empresaId =
      metadata.empresaId ||
      metadata.empresa_id ||
      empresaId ||
      null;

    /*
    =========================================
    ASSINATURA
    =========================================
    */

    if (
      tipoPagamento === 'assinatura' &&
      empresaId
    ) {
      const novaDataExpiracao =
        new Date();

      novaDataExpiracao.setDate(
        novaDataExpiracao.getDate() + 30
      );

      await prisma.empresa.update({
        where: {
          id: empresaId,
        },
        data: {
          plano: 'premium',
          assinaturaStatus: 'ativa',
          assinaturaExpiraEm:
            novaDataExpiracao,
          assinaturaRecorrenteAtiva:
            false,
          trialAtivo: false,
        },
      });

      const pagamentoAssinaturaExistente =
        preferenceId
          ? await prisma.pagamentoAssinatura.findFirst(
              {
                where: {
                  preferenceId:
                    String(
                      preferenceId
                    ),
                },
              }
            )
          : null;

      if (
        pagamentoAssinaturaExistente
      ) {
        await prisma.pagamentoAssinatura.update(
          {
            where: {
              id: pagamentoAssinaturaExistente.id,
            },
            data: {
              status: 'pago',
              paymentId: String(
                payment.id
              ),
              valor:
                payment.transaction_amount ||
                0,
              dataPagamento:
                new Date(),
              vencimento:
                novaDataExpiracao,
            },
          }
        );
      } else {
        await prisma.pagamentoAssinatura.create(
          {
            data: {
              empresaId,
              valor:
                payment.transaction_amount ||
                0,
              status: 'pago',
              tipo: 'manual',
              paymentId: String(
                payment.id
              ),
              preferenceId:
                preferenceId
                  ? String(
                      preferenceId
                    )
                  : null,
              dataPagamento:
                new Date(),
              vencimento:
                novaDataExpiracao,
            },
          }
        );
      }

      console.log(
        '✅ Assinatura confirmada:',
        empresaId
      );

      return NextResponse.json({
        received: true,
      });
    }

    /*
    =========================================
    AGENDAMENTO
    =========================================
    */

    if (agendamentoId) {
      console.log(
        '🎯 Atualizando agendamento:',
        agendamentoId
      );

      await prisma.pagamento.updateMany(
        {
          where: {
            OR: [
              {
                agendamentoId,
              },

              ...(preferenceId
                ? [
                    {
                      preferenceId:
                        String(
                          preferenceId
                        ),
                    },
                  ]
                : []),
            ],
          },

          data: {
            status: 'pago',
            externalId: String(
              payment.id
            ),
            metodoPagamento:
              payment.payment_method_id ||
              null,
            valorPago:
              payment.transaction_amount ||
              0,
            paidAt: new Date(),
          },
        }
      );

      const agendamento =
        await prisma.agendamento.update(
          {
            where: {
              id: agendamentoId,
            },

            data: {
              status: 'confirmado',
              statusPagamento: 'pago',
            },

            include: {
              cliente: true,
              servico: true,
              profissional: true,
              empresa: true,
            },
          }
        );

      console.log(
        '✅ Agendamento confirmado:',
        agendamentoId
      );

      /*
      =========================================
      WHATSAPP AUTOMÁTICO
      =========================================
      */

      const planoEmpresa =
        agendamento.empresa?.plano;

      const isTrial =
        agendamento.empresa?.trialAtivo;

      const podeEnviarWhatsapp =
        planoEmpresa !== 'basico' ||
        isTrial;

      if (!podeEnviarWhatsapp) {
        console.log(
          '🚫 Plano básico - não envia WhatsApp automático'
        );

        return NextResponse.json({
          received: true,
        });
      }

      if (
        !agendamento.dataHoraInicio
      ) {
        console.log(
          '⚠️ Agendamento sem data/hora - WhatsApp não enviado'
        );

        return NextResponse.json({
          received: true,
        });
      }

      try {
        const mensagem =
          montarMensagemConfirmacao(
            {
              nomeCliente:
                agendamento.cliente
                  ?.nome || 'Cliente',

              nomeServico:
                agendamento.servico
                  ?.nome || 'Serviço',

              nomeEmpresa:
                agendamento.empresa
                  ?.nome || 'Empresa',

              data:
                new Intl.DateTimeFormat(
                  'pt-BR'
                ).format(
                  agendamento.dataHoraInicio
                ),

              horario:
                new Intl.DateTimeFormat(
                  'pt-BR',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                ).format(
                  agendamento.dataHoraInicio
                ),

              valorPago:
                payment.transaction_amount,

              slugEmpresa:
                agendamento.empresa
                  ?.slug,

              whatsappEmpresa:
                agendamento.empresa
                  ?.whatsapp,

              enderecoEmpresa:
                agendamento.empresa
                  ?.endereco,
            }
          );

        await enviarWhatsapp({
          instance:
            process.env
              .EVOLUTION_INSTANCE!,
          numero:
            agendamento.cliente
              ?.whatsapp || '',
          mensagem,
        });

        console.log(
          '📲 WhatsApp automático enviado'
        );
      } catch (err) {
        console.error(
          '❌ Erro ao enviar WhatsApp:',
          err
        );
      }
    } else {
      console.log(
        '⚠️ Não encontrou agendamentoId'
      );
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      '❌ Erro no webhook:',
      error
    );

    return NextResponse.json({
      received: true,
    });
  }
}