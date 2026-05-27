import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function limparNumero(numero?: string | null) {
  return String(numero || '').replace(/\D/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const { login, codigo, novaSenha } =
      await req.json();

    const loginInformado = String(login || '').trim();

    const numeroLimpo =
      limparNumero(loginInformado);

    const codigoInformado = String(
      codigo || ''
    ).replace(/\D/g, '');

    const senhaFinal = String(
      novaSenha || ''
    ).trim();

    if (
      !loginInformado ||
      !codigoInformado ||
      !senhaFinal
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Usuário, código e senha são obrigatórios.',
        },
        { status: 400 }
      );
    }

    const usuario =
      await prisma.usuarioEmpresa.findFirst({
        where: {
          OR: [
            {
              email: loginInformado,
            },
            {
              whatsapp: numeroLimpo,
            },
          ],
        },
      });

    if (!usuario) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não encontrado.',
        },
        { status: 404 }
      );
    }

    const codigoSalvo = String(
      (usuario as any).codigoRecuperacao || ''
    );

    const expiraEm = (usuario as any)
      .codigoRecuperacaoExpiraEm
      ? new Date(
          (usuario as any)
            .codigoRecuperacaoExpiraEm
        )
      : null;

    if (!codigoSalvo || !expiraEm) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Nenhum código solicitado.',
        },
        { status: 400 }
      );
    }

    if (expiraEm.getTime() < Date.now()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Código expirado. Solicite novamente.',
        },
        { status: 400 }
      );
    }

    if (codigoSalvo !== codigoInformado) {
      return NextResponse.json(
        {
          success: false,
          error: 'Código inválido.',
        },
        { status: 401 }
      );
    }

    await prisma.usuarioEmpresa.update({
      where: {
        id: usuario.id,
      },
      data: {
        senhaHash: senhaFinal,
        codigoRecuperacao: null,
        codigoRecuperacaoExpiraEm: null,
      } as any,
    });

    return NextResponse.json({
      success: true,
      message:
        'Senha redefinida com sucesso.',
    });
  } catch (error) {
    console.error(
      'Erro ao redefinir senha:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          'Erro ao redefinir senha.',
      },
      { status: 500 }
    );
  }
}