import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

type PlanoAssinatura = 'basico' | 'plus' | 'premium';

function getBaseUrl() {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'https://www.marcaeapp.com.br';

  return url.replace(/\/$/, '');
}

function normalizarPlano(plano?: string | null): PlanoAssinatura {
  const normalizado = String(plano || '').toLowerCase();

  if (normalizado === 'basico') return 'basico';
  if (normalizado === 'plus') return 'plus';
  if (normalizado === 'premium') return 'premium';

  return 'premium';
}

function nomePlano(plano: PlanoAssinatura) {
  if (plano === 'premium') return 'Premium';
  if (plano === 'plus') return 'Plus';
  return 'Básico';
}

function obterValorPlano(configuracao: any, empresa: any, plano: PlanoAssinatura) {
  if (plano === 'basico') {
    return Number(configuracao?.valorPlanoBasico || 0);
  }

  if (plano === 'plus') {
    return Number(configuracao?.valorPlanoPlus || 0);
  }

  return Number(
    configuracao?.valorPlanoPremium ||
      empresa?.valorMensalPersonalizado ||
      0
  );
}

function gerarEmailAssinante(empresa: any) {
  const emailTeste =
    process.env.MERCADO_PAGO_TEST_PAYER_EMAIL ||
    process.env.MERCADO_PAGO_PAYER_EMAIL ||
    '';

  if (emailTeste.trim()) {
    return emailTeste.trim();
  }

  const usuarioAdmin = empresa?.usuarios?.find((usuario: any) => {
    return usuario?.email && usuario?.ativo !== false;
  });

  if (usuarioAdmin?.email) {
    return usuarioAdmin.email;
  }

  return `${empresa.slug || empresa.id}@cliente.marcaeapp.com.br`;
}

function getLinkPagamentoMercadoPago(response: any) {
  return response?.init_point || response?.sandbox_init_point || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const empresaId = body?.empresaId;
    const plano = normalizarPlano(body?.plano);

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId é obrigatório.' },
        { status: 400 }
      );
    }

    const tokenMarcae = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!tokenMarcae) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token Mercado Pago do Marcaê não configurado no ambiente.',
        },
        { status: 500 }
      );
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      include: {
        usuarios: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada.' },
        { status: 404 }
      );
    }

    const configuracao = await (prisma as any).configuracaoSaas.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
    });

    const valorPlano = obterValorPlano(configuracao, empresa, plano);

    if (!valorPlano || valorPlano <= 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Valor do plano inválido. Configure os preços no painel master antes de ativar a recorrência.',
        },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl();
    const payerEmail = gerarEmailAssinante(empresa);
    const externalReference = `${empresa.id}:${plano}`;

    const inicioRecorrencia = new Date(Date.now() + 5 * 60 * 1000);

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenMarcae}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: `Assinatura Marcaê ${nomePlano(plano)} - ${empresa.nome}`,
        external_reference: externalReference,
        payer_email: payerEmail,
        back_url: `${baseUrl}/admin?assinatura=recorrente`,
        status: 'pending',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          start_date: inicioRecorrencia.toISOString(),
          transaction_amount: valorPlano,
          currency_id: 'BRL',
        },
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('Erro Mercado Pago preapproval:', data);

      const mensagemMercadoPago =
        data?.message ||
        data?.error ||
        'Erro ao criar assinatura recorrente no Mercado Pago.';

      const mensagemAmigavel =
        String(mensagemMercadoPago).includes('Both payer and collector')
          ? 'Mercado Pago exige que pagador e recebedor sejam ambos usuários reais ou ambos usuários de teste. Configure MERCADO_PAGO_TEST_PAYER_EMAIL no .env com o e-mail de um comprador de teste diferente da conta recebedora.'
          : mensagemMercadoPago;

      return NextResponse.json(
        {
          success: false,
          error: mensagemAmigavel,
          detalhe: data,
        },
        { status: response.status }
      );
    }

    const linkPagamento = getLinkPagamentoMercadoPago(data);

    if (!data?.id || !linkPagamento) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mercado Pago não retornou o link da assinatura.',
          detalhe: data,
        },
        { status: 500 }
      );
    }

    await prisma.pagamentoAssinatura.create({
      data: {
        empresaId: empresa.id,
        valor: valorPlano,
        status: 'pendente',
        linkPagamento,
        mercadoPagoAssinaturaId: String(data.id),
        tipo: `recorrente_${plano}`,
      },
    });

    await prisma.empresa.update({
      where: { id: empresa.id },
      data: {
        mercadoPagoAssinaturaId: String(data.id),
        assinaturaRecorrenteAtiva: false,
        modoPagamentoAssinatura: 'recorrente',
        formaPagamentoAssinatura: 'cartao',
      } as any,
    });

    return NextResponse.json({
      success: true,
      tipo: 'assinatura_recorrente',
      plano,
      valor: valorPlano,
      linkPagamento,
      mercadoPagoAssinaturaId: String(data.id),
    });
  } catch (error: any) {
    console.error('Erro ao criar assinatura recorrente:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar assinatura recorrente.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
