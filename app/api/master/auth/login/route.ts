import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

const MASTER_COOKIE_NAME = 'marcae_master_token';
const TEMPO_SESSAO_MS = 1000 * 60 * 60 * 8;

function normalizarEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

function hashSenha(senha: string, salt: string) {
  return crypto
    .createHash('sha256')
    .update(`${senha}:${salt}`)
    .digest('hex');
}

function base64Url(value: string) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function assinar(payloadBase64: string, secret: string) {
  return crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function criarTokenMaster(usuario: { id: string; nome: string; email: string }) {
  const secret = process.env.MASTER_SESSION_SECRET;

  if (!secret) {
    throw new Error('MASTER_SESSION_SECRET não configurado.');
  }

  const payload = {
    tipo: 'master',
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    exp: Date.now() + TEMPO_SESSAO_MS,
  };

  const payloadBase64 = base64Url(JSON.stringify(payload));
  const assinatura = assinar(payloadBase64, secret);

  return `${payloadBase64}.${assinatura}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = normalizarEmail(body?.email || body?.usuario || '');
    const senha = String(body?.senha || '');

    if (!email || !senha) {
      return NextResponse.json(
        { success: false, error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuarioMaster.findUnique({
      where: { email },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuário master não encontrado.' },
        { status: 404 }
      );
    }

    if (!usuario.ativo) {
      return NextResponse.json(
        { success: false, error: 'Usuário master inativo.' },
        { status: 403 }
      );
    }

    const senhaHash = hashSenha(senha, usuario.senhaSalt);

    if (senhaHash !== usuario.senhaHash) {
      return NextResponse.json(
        { success: false, error: 'Senha inválida.' },
        { status: 401 }
      );
    }

    await prisma.usuarioMaster.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    const token = criarTokenMaster({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    });

    const response = NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    });

    response.cookies.set(MASTER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(TEMPO_SESSAO_MS / 1000),
    });

    return response;
  } catch (error: any) {
    console.error('Erro login master:', error);

    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao realizar login master.' },
      { status: 500 }
    );
  }
}
