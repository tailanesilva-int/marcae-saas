import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

const EMPRESA_COOKIE_NAME = 'marcae_empresa_token';

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

function base64UrlToText(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64').toString('utf8');
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

async function lerTokenEmpresa(token?: string): Promise<EmpresaSessionPayload | null> {
  try {
    if (!token) return null;

    const secret = obterSegredoSessaoEmpresa();
    if (!secret) return null;

    const partes = token.split('.');
    if (partes.length !== 2) return null;

    const [payloadBase64, assinaturaRecebida] = partes;
    const assinaturaEsperada = await criarAssinatura(payloadBase64, secret);

    if (assinaturaRecebida !== assinaturaEsperada) return null;

    const payload = JSON.parse(base64UrlToText(payloadBase64));

    if (!payload?.id || !payload?.email || !payload?.empresaId || payload?.tipo !== 'empresa') {
      return null;
    }

    if (!payload?.exp || Date.now() > Number(payload.exp)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(EMPRESA_COOKIE_NAME)?.value;
    const payload = await lerTokenEmpresa(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Sessão expirada ou inexistente.' },
        { status: 401 }
      );
    }

    const usuario = await prisma.usuarioEmpresa.findFirst({
      where: {
        id: payload.id,
        empresaId: payload.empresaId,
        ativo: true,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado ou inativo.' },
        { status: 401 }
      );
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: payload.empresaId },
    });

    if (!empresa) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada.' },
        { status: 401 }
      );
    }

    const perfil = usuario.perfil || 'admin';
    const acessoTotal = perfil === 'admin';

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil,
        acessoTotal,
        permissoes: acessoTotal ? null : usuario.permissoes,
      },
      empresa,
    });
  } catch (error) {
    console.error('Erro ao validar sessão da empresa:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao validar sessão.' },
      { status: 500 }
    );
  }
}
