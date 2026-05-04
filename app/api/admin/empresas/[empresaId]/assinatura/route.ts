import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

const PLANOS_VALIDOS = ['basico', 'plus', 'premium'];

function planoValido(plano: string) {
  return PLANOS_VALIDOS.includes(plano);
}

function planoEhSuperiorOuIgual(planoAtual: string, novoPlano: string) {
  const ordem: Record<string, number> = {
    basico: 1,
    plus: 2,
    premium: 3,
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

    const planoAtual = empresa.plano || 'basico';
    let dataUpdate: any = {};

    const agora = new Date();

    const trialAtivo =
      Boolean(empresa.trialExpiraEm) &&
      new Date(empresa.trialExpiraEm as any) >= agora;

    const assinaturaAtiva =
      empresa.assinaturaStatus === 'ativa' &&
      Boolean(empresa.assinaturaExpiraEm) &&
      new Date(empresa.assinaturaExpiraEm as any) >= agora;

    // =========================
    // 🔄 ALTERAÇÃO DE PLANO
    // =========================
    if (body.plano) {
      const novoPlano = String(body.plano);

      if (!planoValido(novoPlano)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Plano inválido.',
          },
          { status: 400 }
        );
      }

      // Premium não pode regredir
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

      // Plus não pode voltar para básico
      if (planoAtual === 'plus' && novoPlano === 'basico') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Empresa no Plano Plus não pode regredir para o Plano Básico pelo painel.',
          },
          { status: 400 }
        );
      }

      // Só permite upgrade ou manter o plano atual
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

    // =========================
    // 🟡 ATIVAR TRIAL
    // =========================
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

        // IMPORTANTE:
        // Trial NÃO altera o plano real da empresa.
        // Ele só libera temporariamente os recursos.
        trialAtivo: true,
        trialExpiraEm: expiraEm,
        assinaturaStatus: 'trial',
        assinaturaExpiraEm: expiraEm,
      };
    }

    // =========================
    // 🟠 ENCERRAR TRIAL
    // =========================
    if (body.acao === 'encerrar_trial') {
      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 30);

      dataUpdate = {
        ...dataUpdate,

        // Mantém o plano real atual.
        // Exemplo:
        // - se era básico, volta para básico
        // - se era plus, volta para plus
        // - se era premium, continua premium
        trialAtivo: false,
        trialExpiraEm: null,
        assinaturaStatus: 'ativa',
        assinaturaExpiraEm: expiraEm,
      };
    }

    // =========================
    // 💳 ATIVAR ASSINATURA
    // =========================
    if (body.acao === 'ativar_assinatura') {
      const planoAssinatura = body.plano
        ? String(body.plano)
        : planoAtual === 'basico'
        ? 'plus'
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