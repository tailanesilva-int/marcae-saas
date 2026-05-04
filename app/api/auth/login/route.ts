import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

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
    console.error('Erro login:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao realizar login.' },
      { status: 500 }
    );
  }
}