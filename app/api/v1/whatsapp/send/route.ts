import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  empresaId: z.string().uuid(),
  clienteId: z.string().uuid().optional(),
  telefoneDestino: z.string().min(10),
  mensagem: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    const phone = parsed.data.telefoneDestino.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(
      parsed.data.mensagem
    )}`;

    let mensagemSalva = null;

    const prismaAny = prisma as any;

    if (prismaAny.mensagemWhatsapp?.create) {
      mensagemSalva = await prismaAny.mensagemWhatsapp.create({
        data: parsed.data,
      });
    }

    return NextResponse.json({
      success: true,
      mensagem: mensagemSalva,
      whatsappUrl: url,
    });
  } catch (error: any) {
    console.error('Erro ao gerar envio de WhatsApp:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao gerar envio de WhatsApp',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}