import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import {
  enviarWhatsapp,
  montarMensagemAvisoBloqueioAutomatico,
  montarMensagemBloqueioAutomatico,
  montarMensagemLembreteFinanceiro,
  montarMensagemPagamentoAprovadoFinanceiro,
  montarMensagemPagamentoRecusado,
} from '@/lib/whatsapp';

type ResultadoEmpresa = {
  empresaId: string;
  empresa: string;
  status: string;
  acao: string;
  whatsappEnviado: boolean;
  detalhe?: string;
};

function inicioDoDia(data: Date) {
  const novaData = new Date(data);
  novaData.setHours(0, 0, 0, 0);

  return novaData;
}

function calcularDiasEntreDatas(dataBase: Date, dataComparacao: Date) {
  const base = inicioDoDia(dataBase).getTime();
  const comparacao = inicioDoDia(dataComparacao).getTime();

  return Math.ceil((comparacao - base) / (1000 * 60 * 60 * 24));
}

function formatarData(data?: Date | string | null) {
  if (!data) return null;

  const dataObj = data instanceof Date ? data : new Date(data);

  if (Number.isNaN(dataObj.getTime())) return null;

  return dataObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function mesmoDia(dataA?: Date | string | null, dataB: Date = new Date()) {
  if (!dataA) return false;

  const a = dataA instanceof Date ? dataA : new Date(dataA);

  if (Number.isNaN(a.getTime())) return false;

  return inicioDoDia(a).getTime() === inicioDoDia(dataB).getTime();
}

function normalizarPlano(plano?: string | null) {
  const normalizado = String(plano || '').toLowerCase();

  if (normalizado === 'basico') return 'basico';
  if (normalizado === 'plus') return 'plus';
  if (normalizado === 'premium') return 'premium';
  if (normalizado === 'trial') return 'trial';

  return normalizado || 'premium';
}

function obterValorEmpresa(empresa: any, pagamentoAssinatura: any) {
  const valorPersonalizado = empresa?.valorMensalPersonalizado;
  const valorPagamento = pagamentoAssinatura?.valor;

  if (valorPersonalizado !== undefined && valorPersonalizado !== null) {
    return Number(valorPersonalizado);
  }

  if (valorPagamento !== undefined && valorPagamento !== null) {
    return Number(valorPagamento);
  }

  return null;
}

function obterNumeroFinanceiroEmpresa(empresa: any) {
  return empresa?.whatsapp || empresa?.telefone || null;
}

function podeEnviarWhatsappFinanceiro(empresa: any) {
  const numero = obterNumeroFinanceiroEmpresa(empresa);

  return Boolean(empresa?.whatsappAtivo && empresa?.whatsappInstance && numero);
}

async function enviarMensagemFinanceira({
  empresa,
  mensagem,
}: {
  empresa: any;
  mensagem: string;
}) {
  const numero = obterNumeroFinanceiroEmpresa(empresa);

  if (!podeEnviarWhatsappFinanceiro(empresa) || !numero) {
    return false;
  }

  await enviarWhatsapp({
    instance: empresa.whatsappInstance,
    numero,
    mensagem,
  });

  return true;
}

async function buscarUltimaAssinaturaEmpresa(empresaId: string) {
  return prisma.pagamentoAssinatura.findFirst({
    where: {
      empresaId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async function registrarLogEmpresa({
  empresaId,
  tipo,
  motivo,
}: {
  empresaId: string;
  tipo: string;
  motivo: string;
}) {
  try {
    await prisma.empresaLog.create({
      data: {
        empresaId,
        tipo,
        motivo,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar log financeiro da empresa:', error);
  }
}

async function processarEmpresaFinanceiro(empresa: any) {
  const agora = new Date();
  const ultimaAssinatura = await buscarUltimaAssinaturaEmpresa(empresa.id);
  const plano = normalizarPlano(empresa.plano);
  const valor = obterValorEmpresa(empresa, ultimaAssinatura);
  const linkPagamento = ultimaAssinatura?.linkPagamento || null;

  const dataReferencia =
    empresa.assinaturaProximaCobrancaEm ||
    empresa.assinaturaExpiraEm ||
    ultimaAssinatura?.vencimento ||
    null;

  const assinaturaStatus = String(empresa.assinaturaStatus || '').toLowerCase();
  const statusFinanceiro = String(empresa.statusFinanceiro || '').toLowerCase();
  const pagamentoAssinaturaStatus = String(ultimaAssinatura?.status || '').toLowerCase();

  const pagamentoRecusado =
    assinaturaStatus === 'pagamento_recusado' ||
    pagamentoAssinaturaStatus === 'recusado' ||
    pagamentoAssinaturaStatus === 'rejected';

  const pagamentoAprovadoHoje =
    empresa.ultimoPagamentoEm &&
    mesmoDia(empresa.ultimoPagamentoEm, agora) &&
    !mesmoDia(empresa.ultimoAvisoPagamentoAprovadoEm, agora);

  if (pagamentoAprovadoHoje && statusFinanceiro === 'em_dia') {
    const whatsappEnviado = await enviarMensagemFinanceira({
      empresa,
      mensagem: montarMensagemPagamentoAprovadoFinanceiro({
        nomeEmpresa: empresa.nome,
        plano,
        valor,
        vencimento: formatarData(dataReferencia),
      }),
    });

    await prisma.empresa.update({
      where: {
        id: empresa.id,
      },
      data: {
        ultimoAvisoPagamentoAprovadoEm: agora,
        diasInadimplente: 0,
        bloqueadoPorInadimplencia: false,
        statusFinanceiro: 'em_dia',
      } as any,
    });

    return {
      empresaId: empresa.id,
      empresa: empresa.nome,
      status: 'em_dia',
      acao: 'pagamento_aprovado_notificado',
      whatsappEnviado,
    } satisfies ResultadoEmpresa;
  }

  if (pagamentoRecusado) {
    let whatsappEnviado = false;

    if (!mesmoDia(empresa.ultimoAvisoPagamentoRecusadoEm, agora)) {
      whatsappEnviado = await enviarMensagemFinanceira({
        empresa,
        mensagem: montarMensagemPagamentoRecusado({
          nomeEmpresa: empresa.nome,
          plano,
          valor,
          vencimento: formatarData(dataReferencia),
          linkPagamento,
        }),
      });
    }

    await prisma.empresa.update({
      where: {
        id: empresa.id,
      },
      data: {
        assinaturaStatus: 'pagamento_recusado',
        statusFinanceiro: 'inadimplente',
        bloqueadoPorInadimplencia: true,
        ultimoAvisoPagamentoRecusadoEm: agora,
        diasInadimplente: empresa.diasInadimplente || 1,
      } as any,
    });

    await registrarLogEmpresa({
      empresaId: empresa.id,
      tipo: 'pagamento_recusado',
      motivo: 'Pagamento da assinatura recusado pelo Mercado Pago.',
    });

    return {
      empresaId: empresa.id,
      empresa: empresa.nome,
      status: 'pagamento_recusado',
      acao: 'bloqueado_por_pagamento_recusado',
      whatsappEnviado,
    } satisfies ResultadoEmpresa;
  }

  if (!dataReferencia) {
    return {
      empresaId: empresa.id,
      empresa: empresa.nome,
      status: statusFinanceiro || 'sem_vencimento',
      acao: 'ignorado_sem_data_referencia',
      whatsappEnviado: false,
    } satisfies ResultadoEmpresa;
  }

  const diasAteVencimento = calcularDiasEntreDatas(agora, new Date(dataReferencia));
  const diasAtraso = Math.max(0, diasAteVencimento * -1);

  if (diasAteVencimento >= 0) {
    const deveEnviarLembrete = [5, 3, 1, 0].includes(diasAteVencimento);

    if (deveEnviarLembrete && !mesmoDia(empresa.ultimoLembreteFinanceiroEnviadoEm, agora)) {
      const whatsappEnviado = await enviarMensagemFinanceira({
        empresa,
        mensagem: montarMensagemLembreteFinanceiro({
          nomeEmpresa: empresa.nome,
          plano,
          valor,
          vencimento: formatarData(dataReferencia),
          linkPagamento,
        }),
      });

      await prisma.empresa.update({
        where: {
          id: empresa.id,
        },
        data: {
          ultimoLembreteFinanceiroEnviadoEm: agora,
          diasInadimplente: 0,
          statusFinanceiro: 'em_dia',
          bloqueadoPorInadimplencia: false,
        } as any,
      });

      return {
        empresaId: empresa.id,
        empresa: empresa.nome,
        status: 'em_dia',
        acao: `lembrete_vencimento_${diasAteVencimento}_dias`,
        whatsappEnviado,
      } satisfies ResultadoEmpresa;
    }

    if (empresa.bloqueadoPorInadimplencia || statusFinanceiro !== 'em_dia') {
      await prisma.empresa.update({
        where: {
          id: empresa.id,
        },
        data: {
          statusFinanceiro: 'em_dia',
          bloqueadoPorInadimplencia: false,
          diasInadimplente: 0,
        } as any,
      });

      return {
        empresaId: empresa.id,
        empresa: empresa.nome,
        status: 'em_dia',
        acao: 'regularizado_por_vencimento_futuro',
        whatsappEnviado: false,
      } satisfies ResultadoEmpresa;
    }

    return {
      empresaId: empresa.id,
      empresa: empresa.nome,
      status: 'em_dia',
      acao: 'nenhuma_acao',
      whatsappEnviado: false,
    } satisfies ResultadoEmpresa;
  }

  if (diasAtraso >= 5) {
    let whatsappEnviado = false;

    if (!mesmoDia(empresa.ultimoAvisoBloqueioEnviadoEm, agora)) {
      whatsappEnviado = await enviarMensagemFinanceira({
        empresa,
        mensagem: montarMensagemBloqueioAutomatico({
          nomeEmpresa: empresa.nome,
          plano,
          valor,
          vencimento: formatarData(dataReferencia),
          diasAtraso,
          linkPagamento,
        }),
      });
    }

    await prisma.empresa.update({
      where: {
        id: empresa.id,
      },
      data: {
  assinaturaStatus: 'inadimplente',
  statusFinanceiro: 'inadimplente',
  bloqueadoPorInadimplencia: true,
  ultimoAvisoBloqueioEnviadoEm: agora,
  diasInadimplente: diasAtraso,
} as any,
    });

    await registrarLogEmpresa({
      empresaId: empresa.id,
      tipo: 'bloqueio_automatico_financeiro',
      motivo: `Empresa bloqueada automaticamente após ${diasAtraso} dia(s) de atraso.`,
    });

    return {
      empresaId: empresa.id,
      empresa: empresa.nome,
      status: 'inadimplente',
      acao: 'bloqueado_automaticamente',
      whatsappEnviado,
    } satisfies ResultadoEmpresa;
  }

  let whatsappEnviado = false;

  if (!mesmoDia(empresa.ultimoAvisoBloqueioEnviadoEm, agora)) {
    whatsappEnviado = await enviarMensagemFinanceira({
      empresa,
      mensagem: montarMensagemAvisoBloqueioAutomatico({
        nomeEmpresa: empresa.nome,
        plano,
        valor,
        vencimento: formatarData(dataReferencia),
        diasAtraso,
        linkPagamento,
      }),
    });
  }

  await prisma.empresa.update({
    where: {
      id: empresa.id,
    },
    data: {
      assinaturaStatus: 'inadimplente',
      statusFinanceiro: 'inadimplente',
      bloqueadoPorInadimplencia: false,
      ultimoAvisoBloqueioEnviadoEm: agora,
      diasInadimplente: diasAtraso,
    } as any,
  });

  await registrarLogEmpresa({
    empresaId: empresa.id,
    tipo: 'aviso_inadimplencia_financeira',
    motivo: `Aviso financeiro enviado após ${diasAtraso} dia(s) de atraso.`,
  });

  return {
    empresaId: empresa.id,
    empresa: empresa.nome,
    status: 'inadimplente',
    acao: 'aviso_inadimplencia_enviado',
    whatsappEnviado,
  } satisfies ResultadoEmpresa;
}

function validarCronSecret(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return true;

  const authHeader = req.headers.get('authorization');
  const tokenHeader = req.headers.get('x-cron-secret');

  return authHeader === `Bearer ${cronSecret}` || tokenHeader === cronSecret;
}

export async function GET(req: NextRequest) {
  try {
    if (!validarCronSecret(req)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não autorizado.',
        },
        { status: 401 }
      );
    }

    const empresas = await prisma.empresa.findMany({
      where: {
        ativo: true,
        OR: [
          {
            assinaturaExpiraEm: {
              not: null,
            },
          },
          {
            assinaturaProximaCobrancaEm: {
              not: null,
            },
          },
          {
            assinaturaStatus: {
              in: ['ativa', 'vencida', 'pagamento_recusado', 'pendente'],
            },
          },
          {
            statusFinanceiro: {
              in: ['em_dia', 'pendente', 'inadimplente'],
            },
          },
        ],
      },
      orderBy: {
        nome: 'asc',
      },
    });

    const resultados: ResultadoEmpresa[] = [];

    for (const empresa of empresas) {
      try {
        const resultado = await processarEmpresaFinanceiro(empresa as any);
        resultados.push(resultado);
      } catch (error: any) {
        console.error(`Erro ao verificar financeiro da empresa ${empresa.id}:`, error);

        resultados.push({
          empresaId: empresa.id,
          empresa: empresa.nome,
          status: 'erro',
          acao: 'erro_processamento',
          whatsappEnviado: false,
          detalhe: error?.message || String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      executadoEm: new Date().toISOString(),
      totalEmpresas: empresas.length,
      totalWhatsappEnviado: resultados.filter((item) => item.whatsappEnviado).length,
      resultados,
    });
  } catch (error: any) {
    console.error('Erro ao verificar assinaturas:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao verificar assinaturas.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
