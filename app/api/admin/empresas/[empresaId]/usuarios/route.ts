import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> }
) {
  try {
    const { empresaId } = await params;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'Empresa não informada.' },
        { status: 400 }
      );
    }

    const usuarios = await prisma.usuarioEmpresa.findMany({
      where: { empresaId },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        permissoes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      usuarios,
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao buscar usuários.' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> }
) {
  try {
    const { empresaId } = await params;
    const { nome, email, senha, perfil, permissoes } = await req.json();

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'Empresa não informada.' },
        { status: 400 }
      );
    }

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { success: false, error: 'Nome, usuário e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const loginUsuario = String(email).trim();

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada.' },
        { status: 404 }
      );
    }

    const usuarioExistente = await prisma.usuarioEmpresa.findFirst({
      where: {
        email: loginUsuario,
      },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { success: false, error: 'Já existe um usuário com este login.' },
        { status: 409 }
      );
    }

    const perfilFinal = perfil === 'admin' ? 'admin' : 'usuario';

    const novoUsuario = await prisma.usuarioEmpresa.create({
      data: {
        empresaId,
        nome,
        email: loginUsuario,
        senhaHash: senha,
        perfil: perfilFinal,
        ativo: true,
        permissoes: perfilFinal === 'admin' ? null : permissoes || {},
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        permissoes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      usuario: novoUsuario,
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao criar usuário.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> }
) {
  try {
    const { empresaId } = await params;
    const { id, nome, email, senha, perfil, permissoes, ativo } = await req.json();

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'Empresa não informada.' },
        { status: 400 }
      );
    }

    if (!id || !nome || !email) {
      return NextResponse.json(
        { success: false, error: 'ID, nome e usuário são obrigatórios.' },
        { status: 400 }
      );
    }

    const loginUsuario = String(email).trim();

    const usuarioAtual = await prisma.usuarioEmpresa.findFirst({
      where: {
        id,
        empresaId,
      },
    });

    if (!usuarioAtual) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    const usuarioComMesmoLogin = await prisma.usuarioEmpresa.findFirst({
      where: {
        email: loginUsuario,
        NOT: {
          id,
        },
      },
    });

    if (usuarioComMesmoLogin) {
      return NextResponse.json(
        { success: false, error: 'Já existe outro usuário com este login.' },
        { status: 409 }
      );
    }

    const perfilFinal = perfil === 'admin' ? 'admin' : 'usuario';

    const usuarioAtualizado = await prisma.usuarioEmpresa.update({
      where: {
        id,
      },
      data: {
        nome,
        email: loginUsuario,
        perfil: perfilFinal,
        ativo: ativo === false ? false : true,
        permissoes: perfilFinal === 'admin' ? null : permissoes || {},
        ...(senha ? { senhaHash: senha } : {}),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        permissoes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      usuario: usuarioAtualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar usuário.' },
      { status: 500 }
    );
  }
}