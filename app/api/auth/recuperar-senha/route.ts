import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { enviarWhatsapp } from '@/lib/whatsapp';

function limparNumero(numero?: string | null) {
  return String(numero || '').replace(/\D/g, '');
}

function mascararWhatsapp(numero?: string | null) {
  const limpo = limparNumero(numero);

  if (limpo.length <= 4) {
    return 'WhatsApp cadastrado';
  }

  const final = limpo.slice(-4);

  return `WhatsApp final ${final}`;
}

function gerarCodigoRecuperacao() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  try {
    const { login } = await req.json();

    const loginInformado = String(login || '').trim();
    const numeroLimpo = limparNumero(loginInformado);

    if (!loginInformado) {
      return NextResponse.json(
        {
          success: false,
          error: 'Informe o usuário ou WhatsApp.',
        },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuarioEmpresa.findFirst({
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
      include: {
        empresa: true,
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

    if (!usuario.ativo) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Usuário inativo. Procure o administrador.',
        },
        { status: 403 }
      );
    }

    const whatsappUsuario = limparNumero(
      (usuario as any).whatsapp
    );

    if (!whatsappUsuario) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Este usuário não possui WhatsApp cadastrado.',
        },
        { status: 400 }
      );
    }

    const instance =
      usuario.empresa?.whatsappInstance ||
      process.env.EVOLUTION_INSTANCE ||
      '';

    if (!instance) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Instância WhatsApp não configurada.',
        },
        { status: 500 }
      );
    }

    const codigo = gerarCodigoRecuperacao();

    const expiraEm = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await prisma.usuarioEmpresa.update({
      where: {
        id: usuario.id,
      },
      data: {
        codigoRecuperacao: codigo,
        codigoRecuperacaoExpiraEm: expiraEm,
      } as any,
    });

    const mensagem = `Olá, ${usuario.nome}! 🔐

Seu código de recuperação Marcaê é:

*${codigo}*

Esse código expira em 10 minutos.

Se você não solicitou a recuperação, ignore esta mensagem.`;

    await enviarWhatsapp({
      instance,
      numero: whatsappUsuario,
      mensagem,
    });

    return NextResponse.json({
      success: true,
      message:
        'Código enviado para o WhatsApp cadastrado.',
      whatsappDestino:
        mascararWhatsapp(whatsappUsuario),
    });
  } catch (error) {
    console.error(
  'Erro ao recuperar senha COMPLETO:',
  error
);

if (error instanceof Error) {
  console.error(error.message);
}

    return NextResponse.json(
      {
        success: false,
        error:
          'Erro ao enviar código de recuperação.',
      },
      { status: 500 }
    );
  }
}