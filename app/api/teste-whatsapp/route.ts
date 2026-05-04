import { NextResponse } from 'next/server';
import { enviarWhatsapp } from '@/lib/whatsapp';

export async function GET() {
  try {
    const numero = '5575992922527'; // com 55
    const mensagem = '🚀 Teste Marcaê funcionando com sucesso!';

    const response = await enviarWhatsapp({
      instance: process.env.EVOLUTION_INSTANCE!,
      numero,
      mensagem,
    });

    console.log('Resposta Evolution:', response);

    return NextResponse.json({
      ok: true,
      message: 'Mensagem enviada com sucesso',
      response,
    });
  } catch (error: any) {
    console.error('Erro no teste WhatsApp:', error);

    return NextResponse.json(
      {
        ok: false,
        message: 'Erro ao enviar WhatsApp',
        error,
      },
      { status: 500 }
    );
  }
}