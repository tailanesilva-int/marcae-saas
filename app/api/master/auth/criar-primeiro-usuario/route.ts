import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function normalizarEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

function hashSenha(senha: string, salt: string) {
  return crypto
    .createHash('sha256')
    .update(`${senha}:${salt}`)
    .digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const setupToken = req.headers.get('x-master-setup-token') || '';

    if (!process.env.MASTER_SETUP_TOKEN || setupToken !== process.env.MASTER_SETUP_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Token de configuração inválido.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const nome = String(body?.nome || 'Administrador Master').trim();
    const email = normalizarEmail(body?.email || '');
    const senha = String(body?.senha || '');

    if (!email || !senha) {
      return NextResponse.json(
        { success: false, error: 'Nome, e-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha precisa ter pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const jaExiste = await prisma.usuarioMaster.findUnique({
      where: { email },
    });

    if (jaExiste) {
      return NextResponse.json(
        { success: false, error: 'Já existe um usuário master com este e-mail.' },
        { status: 409 }
      );
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const senhaHash = hashSenha(senha, salt);

    const usuario = await prisma.usuarioMaster.create({
      data: {
        nome,
        email,
        senhaSalt: salt,
        senhaHash,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      usuario,
    });
  } catch (error) {
    console.error('Erro ao criar usuário master:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao criar usuário master.' },
      { status: 500 }
    );
  }
}
