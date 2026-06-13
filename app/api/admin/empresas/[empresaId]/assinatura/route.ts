import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

const PLANOS_VALIDOS = ['basico', 'premium'];

function normalizarPlano(plano?: string | null) {
  const planoNormalizado = String(plano || 'basico').toLowerCase();

  if (planoNormalizado === 'plus') return 'premium';
  if (planoNormalizado === 'premium') return 'premium';

  return 'basico';
}

function planoValido(plano: string) {
  return PLANOS_VALIDOS.includes(plano);
}

function planoEhSuperiorOuIgual(planoAtual: string, novoPlano: string) {
  const ordem: Record<string, number> = {
    basico: 1,
    premium: 2,
  };

  return ordem[novoPlano] >= ordem[planoAtual];
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ empresaId: string }> }
) {
  try {
    const { empresaId } = await context.params;
    const body = await req.json();

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'ID da empresa não informado.' },
        { status: 400 }
      );
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada.' },
        { status: 404 }
      );
    }

    const planoAtual = normalizarPlano(empresa.plano || 'basico');
    let dataUpdate: any = {};

    const agora = new Date();

    const trialAtivo =
      Boolean(empresa.trialExpiraEm) &&
      new Date(empresa.trialExpiraEm as any) >= agora;

    const assinaturaAtiva =
      empresa.assinaturaStatus === 'ativa' &&
      Boolean(empresa.assinaturaExpiraEm) &&
      new Date(empresa.assinaturaExpiraEm as any) >= agora;

    if (body.plano) {
      const novoPlano = normalizarPlano(String(body.plano));

      if (!planoValido(novoPlano)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Plano inválido.',
          },
          { status: 400 }
        );
      }

      if (planoAtual === 'premium' && novoPlano !== 'premium') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Empresa no Plano Premium não pode regredir para plano inferior pelo painel.',
          },
          { status: 400 }
        );
      }

      if (!planoEhSuperiorOuIgual(planoAtual, novoPlano)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Só é permitido fazer upgrade de plano pelo painel.',
          },
          { status: 400 }
        );
      }

      dataUpdate.plano = novoPlano;
    }

    if (body.acao === 'ativar_trial') {
      if (assinaturaAtiva && planoAtual === 'premium') {
        return NextResponse.json(
          {
            success: false,
            error: 'Empresa com Premium ativo não precisa ativar trial.',
          },
          { status: 400 }
        );
      }

      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 7);

      dataUpdate = {
        ...dataUpdate,
        trialAtivo: true,
        trialExpiraEm: expiraEm,
        assinaturaStatus: 'trial',
        assinaturaExpiraEm: expiraEm,
      };
    }

    if (body.acao === 'encerrar_trial') {
      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 30);

      dataUpdate = {
        ...dataUpdate,
        trialAtivo: false,
        trialExpiraEm: null,
        assinaturaStatus: 'ativa',
        assinaturaExpiraEm: expiraEm,
      };
    }

    if (body.acao === 'ativar_assinatura') {
      const planoAssinatura = body.plano
        ? normalizarPlano(String(body.plano))
        : planoAtual === 'basico'
        ? 'premium'
        : planoAtual;

      if (!planoValido(planoAssinatura)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Plano de assinatura inválido.',
          },
          { status: 400 }
        );
      }

      if (!planoEhSuperiorOuIgual(planoAtual, planoAssinatura)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Não é permitido ativar assinatura de plano inferior.',
          },
          { status: 400 }
        );
      }

      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 30);

      dataUpdate = {
        ...dataUpdate,
        plano: planoAssinatura,
        assinaturaStatus: 'ativa',
        assinaturaExpiraEm: expiraEm,
        trialAtivo: false,
        trialExpiraEm: null,
      };
    }

    if (Object.keys(dataUpdate).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhuma alteração informada.',
        },
        { status: 400 }
      );
    }

    const empresaAtualizada = await prisma.empresa.update({
      where: { id: empresaId },
      data: dataUpdate,
    });

    return NextResponse.json({
      success: true,
      empresa: empresaAtualizada,
    });
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar assinatura.' },
      { status: 500 }
    );
  }
}