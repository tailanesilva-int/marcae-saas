import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getAppUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL

  if (!url) {
    throw new Error('NEXT_PUBLIC_APP_URL não configurado no .env')
  }

  if (!url.startsWith('https://')) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL precisa ser uma URL HTTPS pública, exemplo: https://seu-ngrok.ngrok-free.app'
    )
  }

  return url.replace(/\/$/, '')
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { empresaId, email } = body

    if (!empresaId || !email) {
      return NextResponse.json(
        { error: 'empresaId e email são obrigatórios' },
        { status: 400 }
      )
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    })

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    const appUrl = getAppUrl()

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: `Assinatura AgendeAi - ${empresa.nome}`,
        payer_email: email,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 50,
          currency_id: 'BRL',
        },
        back_url: `${appUrl}/admin`,
        status: 'pending',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro Mercado Pago:', data)

      return NextResponse.json(
        {
          error: 'Erro ao criar assinatura no Mercado Pago',
          detalhe: data,
        },
        { status: 400 }
      )
    }

    await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        mercadoPagoAssinaturaId: data.id,
        assinaturaRecorrenteAtiva: false,
        modoPagamentoAssinatura: 'recorrente',
      },
    })

    return NextResponse.json({
      success: true,
      assinaturaId: data.id,
      url: data.init_point || data.sandbox_init_point,
    })
  } catch (error: any) {
    console.error('Erro ao criar assinatura:', error)

    return NextResponse.json(
      {
        error: 'Erro ao criar assinatura',
        detalhe: error.message,
      },
      { status: 500 }
    )
  }
}