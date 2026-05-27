import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function normalizarEndereco(body: any) {
  let enderecoRecebido: any = {};

  if (body.endereco) {
    if (typeof body.endereco === 'string') {
      try {
        enderecoRecebido = JSON.parse(body.endereco);
      } catch {
        enderecoRecebido = {};
      }
    } else {
      enderecoRecebido = body.endereco;
    }
  }

  return {
  rua: enderecoRecebido.rua || body.rua || '',
  numero: enderecoRecebido.numero || body.numero || '',
  bairro: enderecoRecebido.bairro || body.bairro || '',
  cidade: enderecoRecebido.cidade || body.cidade || '',
  estado: enderecoRecebido.estado || body.estado || '',
  cep: enderecoRecebido.cep || body.cep || '',
  complemento: enderecoRecebido.complemento || body.complemento || '',
};
}

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

    const enderecoNormalizado = normalizarEndereco(body);

    const empresa = await prisma.empresa.update({
      where: {
        id: empresaId,
      },
      data: {
        nome: body.nome || '',
        whatsapp: body.whatsapp || body.telefone || '',
        telefone: body.whatsapp || body.telefone || '',
        instagram: body.instagram || '',
        responsavel: body.responsavel || '',
        logoUrl: body.logoUrl || '',
        instagramUrl: body.instagramUrl || '',

        endereco: JSON.stringify(enderecoNormalizado),

        corPrimaria: body.corPrimaria || '#7c3aed',
        corSecundaria: body.corSecundaria || '#a855f7',
        corSidebar: body.corSidebar || '#0f172a',

        solicitouIntegracaoMp: body.solicitouIntegracaoMp ?? undefined,

        mercadoPagoAtivo,
        mercadoPagoAccessToken,
        mercadoPagoPublicKey,
        mercadoPagoModo,
        mercadoPagoStatus: mercadoPagoAtivo ? 'configurado' : 'nao_configurado',
        mercadoPagoAtualizadoEm: new Date(),

        updatedAt: new Date(),
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