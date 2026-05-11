import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ empresaId: string }> }
) {
  try {
    const { empresaId } = await context.params;
    const body = await req.json();

    const mercadoPagoAtivo = Boolean(body.mercadoPagoAtivo);
    const mercadoPagoAccessToken = body.mercadoPagoAccessToken
      ? String(body.mercadoPagoAccessToken).trim()
      : null;
    const mercadoPagoPublicKey = body.mercadoPagoPublicKey
      ? String(body.mercadoPagoPublicKey).trim()
      : null;
    const mercadoPagoModo =
      body.mercadoPagoModo === 'producao' ? 'producao' : 'sandbox';

    if (mercadoPagoAtivo && !mercadoPagoAccessToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Informe o Access Token do Mercado Pago para ativar o recebimento online.',
        },
        { status: 400 }
      );
    }

    const empresa = await prisma.empresa.update({
      where: {
        id: empresaId,
      },
      data: {
        nome: body.nome,
        endereco: body.endereco || null,
        telefone: body.telefone || null,
        responsavel: body.responsavel || null,
        logoUrl: body.logoUrl || null,
        instagramUrl: body.instagramUrl || null,

        solicitouIntegracaoMp:
          body.solicitouIntegracaoMp ?? undefined,

        mercadoPagoAtivo,
        mercadoPagoAccessToken,
        mercadoPagoPublicKey,
        mercadoPagoModo,
        mercadoPagoStatus: mercadoPagoAtivo
          ? 'configurado'
          : 'nao_configurado',
        mercadoPagoAtualizadoEm: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      empresa,
    });
  } catch (error) {
    console.error('Erro ao atualizar dados da empresa:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar dados da empresa.' },
      { status: 500 }
    );
  }
}