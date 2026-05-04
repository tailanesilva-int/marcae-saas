import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const clientSchema = z.object({
  empresaId: z.string().uuid(),
  nome: z.string().min(3),
  cpf: z.string().optional(),
  whatsapp: z.string().min(10),
  dataNascimento: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = clientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const cliente = await prisma.cliente.upsert({
    where: {
      empresaId_whatsapp: {
        empresaId: data.empresaId,
        whatsapp: data.whatsapp,
      },
    },
    update: {
      nome: data.nome,
      cpf: data.cpf,
      dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : undefined,
    },
    create: {
      empresaId: data.empresaId,
      nome: data.nome,
      cpf: data.cpf,
      whatsapp: data.whatsapp,
      dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : undefined,
    },
  });

  return NextResponse.json(cliente, { status: 201 });
}
