import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function adicionarDias(data: Date, dias: number) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + dias);

  return novaData;
}

function normalizarPlano(plano?: string | null) {
  const normalizado = String(plano || '').toLowerCase();

  if (normalizado === 'basico') return 'basico';
  if (normalizado === 'plus') return 'plus';
  if (normalizado === 'premium') return 'premium';

  return 'premium';
}

function extrairEmpresaEPlano(externalReference?: string | null) {
  const partes = String(externalReference || '').split(':');

  return {
    empresaId: partes[0] || null,
    plano: partes[1] || null,
  };
}

async function consultarPreapprovalMercadoPago(preapprovalId: string) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error('Token Mercado Pago do Marcaê não configurado.');
  }

  const response = await fetch(
    `https://api.mercadopago.com/preapproval/${preapprovalId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error('Erro ao consultar assinatura Mercado Pago:', data);

    throw new Error(
      data?.message ||
        data?.error ||
        'Erro ao consultar assinatura no Mercado Pago.'
    );
  }

  return data;
}

async function buscarPlanoPorAssinatura(preapprovalId: string) {
  const pagamentoAssinatura = await prisma.pagamentoAssinatura.findFirst({
    where: {
      mercadoPagoAssinaturaId: preapprovalId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const tipo = String((pagamentoAssinatura as any)?.tipo || '');
  const plano = tipo.replace('recorrente_', '');

  return normalizarPlano(plano);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const empresaIdBody = body?.empresaId ? String(body.empresaId) : null;
    const preapprovalIdBody = body?.mercadoPagoAssinaturaId
      ? String(body.mercadoPagoAssinaturaId)
      : null;

    let empresa = null;

    if (empresaIdBody) {
      empresa = await prisma.empresa.findUnique({
        where: {
          id: empresaIdBody,
        },
      });
    }

    if (!empresa && preapprovalIdBody) {
      empresa = await prisma.empresa.findFirst({
        where: {
          mercadoPagoAssinaturaId: preapprovalIdBody,
        },
      });
    }

    if (!empresa) {
      return NextResponse.json(
        {
          success: false,
          error: 'Empresa não encontrada para sincronizar assinatura.',
        },
        { status: 404 }
      );
    }

    const preapprovalId =
      preapprovalIdBody || String((empresa as any).mercadoPagoAssinaturaId || '');

    if (!preapprovalId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Empresa não possui assinatura recorrente vinculada.',
        },
        { status: 400 }
      );
    }

    const assinaturaMP = await consultarPreapprovalMercadoPago(preapprovalId);

    const { plano: planoExternalReference } = extrairEmpresaEPlano(
      assinaturaMP.external_reference
    );

    const planoPeloHistorico = await buscarPlanoPorAssinatura(preapprovalId);
    const planoFinal = normalizarPlano(planoExternalReference || planoPeloHistorico);

    const status = String(assinaturaMP.status || '').toLowerCase();
    const agora = new Date();

    const proximaCobranca = assinaturaMP.next_payment_date
      ? new Date(assinaturaMP.next_payment_date)
      : adicionarDias(agora, 30);

    await prisma.pagamentoAssinatura.updateMany({
      where: {
        mercadoPagoAssinaturaId: preapprovalId,
      },
      data: {
        status:
          status === 'authorized'
            ? 'ativa'
            : status === 'cancelled'
            ? 'cancelada'
            : status === 'paused'
            ? 'pausada'
            : status || 'pendente',
        vencimento: status === 'authorized' ? proximaCobranca : undefined,
        dataPagamento: status === 'authorized' ? agora : undefined,
      },
    });

    let empresaAtualizada = empresa;

    if (status === 'authorized') {
      empresaAtualizada = await prisma.empresa.update({
        where: {
          id: empresa.id,
        },
        data: {
          plano: planoFinal,
          assinaturaStatus: 'ativa',
          assinaturaExpiraEm: proximaCobranca,
          assinaturaProximaCobrancaEm: proximaCobranca,
          assinaturaRecorrenteAtiva: true,
          mercadoPagoAssinaturaId: preapprovalId,
          ultimoPagamentoEm: agora,
          modoPagamentoAssinatura: 'recorrente',
          formaPagamentoAssinatura: 'cartao',
          statusFinanceiro: 'em_dia',
          bloqueadoPorInadimplencia: false,
          trialAtivo: false,
        } as any,
      });
    }

    if (status === 'paused' || status === 'cancelled') {
      empresaAtualizada = await prisma.empresa.update({
        where: {
          id: empresa.id,
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
      success: true,
      status,
      plano: planoFinal,
      mercadoPagoAssinaturaId: preapprovalId,
      assinaturaMP,
      empresa: empresaAtualizada,
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar assinatura recorrente:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao sincronizar assinatura recorrente.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
