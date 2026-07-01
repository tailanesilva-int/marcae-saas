import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

const EMPRESA_COOKIE_NAME = 'marcae_empresa_token';
const EMPRESA_SESSION_DURATION = 1000 * 60 * 60 * 24 * 30;

type EmpresaSessionPayload = {
  id: string;
  email: string;
  empresaId: string;
  tipo: 'empresa';
  exp: number;
};

function obterSegredoSessaoEmpresa() {
  return process.env.EMPRESA_SESSION_SECRET || process.env.MASTER_SESSION_SECRET || '';
}

function textToBase64Url(value: string) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function criarAssinatura(payloadBase64: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadBase64));
  const bytes = Array.from(new Uint8Array(signature));
  const binary = bytes.map((byte) => String.fromCharCode(byte)).join('');

  return Buffer.from(binary, 'binary')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function gerarTokenEmpresa(payload: EmpresaSessionPayload) {
  const secret = obterSegredoSessaoEmpresa();

  if (!secret) {
    throw new Error('EMPRESA_SESSION_SECRET não configurado.');
  }

  const payloadBase64 = textToBase64Url(JSON.stringify(payload));
  const assinatura = await criarAssinatura(payloadBase64, secret);

  return `${payloadBase64}.${assinatura}`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();

    if (!email || !senha) {
      return NextResponse.json(
        { success: false, error: 'Usuário e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuarioEmpresa.findFirst({
      where: {
        email: String(email).trim(),
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    if (usuario.senhaHash !== senha) {
      return NextResponse.json(
        { success: false, error: 'Senha inválida.' },
        { status: 401 }
      );
    }

    if (!usuario.ativo) {
      return NextResponse.json(
        { success: false, error: 'Usuário inativo.' },
        { status: 403 }
      );
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: usuario.empresaId },
    });

    if (!empresa) {
      return NextResponse.json(
        { success: false, error: 'Empresa vinculada ao usuário não encontrada.' },
        { status: 404 }
      );
    }

    const perfil = usuario.perfil || 'admin';
    const acessoTotal = perfil === 'admin';

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null;

    const agora = new Date();

    await prisma.$transaction([
      prisma.usuarioEmpresa.update({
        where: { id: usuario.id },
        data: {
          ultimoLoginEm: agora,
          ultimoLoginIp: ip,
        } as any,
      }),
      prisma.empresa.update({
        where: { id: empresa.id },
        data: {
          ultimoLoginEm: agora,
          ultimoLoginIp: ip,
          ultimoLoginUsuarioId: usuario.id,
          ultimoLoginUsuarioNome: usuario.nome,
          ultimoLoginUsuarioEmail: usuario.email,
        } as any,
      }),
    ]);

    const empresaAtualizada = {
      ...empresa,
      ultimoLoginEm: agora,
      ultimoLoginIp: ip,
      ultimoLoginUsuarioId: usuario.id,
      ultimoLoginUsuarioNome: usuario.nome,
      ultimoLoginUsuarioEmail: usuario.email,
    };

    const token = await gerarTokenEmpresa({
      id: usuario.id,
      email: usuario.email,
      empresaId: empresa.id,
      tipo: 'empresa',
      exp: Date.now() + EMPRESA_SESSION_DURATION,
    });

    const response = NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil,
        acessoTotal,
        permissoes: acessoTotal ? null : usuario.permissoes,
      },
      empresa: empresaAtualizada,
    });

    response.cookies.set(EMPRESA_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(EMPRESA_SESSION_DURATION / 1000),
    });

    return response;
  } catch (error) {
    console.error('Erro login:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao realizar login.' },
      { status: 500 }
    );
  }
}
