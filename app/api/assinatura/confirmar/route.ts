import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const empresaId = searchParams.get('empresaId');
    const preferenceId = searchParams.get('preference_id');
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');

    if (!empresaId) {
      return NextResponse.redirect(
        new URL('/admin?pagamento=erro&motivo=empresa_nao_informada', req.url)
      );
    }

    const novaDataExpiracao = new Date();
    novaDataExpiracao.setDate(novaDataExpiracao.getDate() + 30);

    await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        plano: 'premium',
        assinaturaStatus: 'ativa',
        assinaturaExpiraEm: novaDataExpiracao,
        assinaturaRecorrenteAtiva: false,
        trialAtivo: false,
      },
    });

    const pagamento = await prisma.pagamentoAssinatura.findFirst({
      where: {
        empresaId,
        preferenceId: preferenceId || undefined,
        status: 'pendente',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (pagamento) {
      await prisma.pagamentoAssinatura.update({
        where: { id: pagamento.id },
        data: {
          status: 'pago',
          paymentId: paymentId || pagamento.paymentId,
          dataPagamento: new Date(),
          vencimento: novaDataExpiracao,
        },
      });
    } else {
      await prisma.pagamentoAssinatura.create({
        data: {
          empresaId,
          valor: 49.9,
          status: 'pago',
          tipo: 'manual',
          preferenceId,
          paymentId,
          dataPagamento: new Date(),
          vencimento: novaDataExpiracao,
        },
      });
    }

    return NextResponse.redirect(
      new URL('/admin?pagamento=ok&plano=premium', req.url)
    );
  } catch (error) {
    console.error('Erro ao confirmar assinatura:', error);

    return NextResponse.redirect(
      new URL('/admin?pagamento=erro', req.url)
    );
  }
}