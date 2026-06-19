import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function limparCpf(cpf?: string | null) {
  return String(cpf || '').replace(/\D/g, '');
}

function formatarDataParaCampo(dataHora: Date) {
  const ano = dataHora.getFullYear();
  const mes = String(dataHora.getMonth() + 1).padStart(2, '0');
  const dia = String(dataHora.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function formatarHoraParaCampo(dataHora: Date) {
  const hora = String(dataHora.getHours()).padStart(2, '0');
  const minuto = String(dataHora.getMinutes()).padStart(2, '0');

  return `${hora}:${minuto}`;
}

function horasAteAtendimento(dataHoraInicio?: Date | string | null) {
  if (!dataHoraInicio) return 999999;

  const data = new Date(dataHoraInicio);

  if (Number.isNaN(data.getTime())) return 999999;

  return (data.getTime() - new Date().getTime()) / (1000 * 60 * 60);
}

function numero(valor: any) {
  if (valor === null || valor === undefined || valor === '') return 0;

  const convertido = Number(String(valor).replace(',', '.'));

  return Number.isNaN(convertido) ? 0 : convertido;
}

function inteiroPositivo(valor: any, padrao = 1) {
  const convertido = Number(valor);

  if (!Number.isFinite(convertido) || convertido < 1) {
    return padrao;
  }

  return Math.max(Math.floor(convertido), 1);
}

function clienteFazAniversarioNoMesAtual(cliente: any) {
  const dataNascimento = cliente?.dataNascimento || cliente?.clienteNascimento;

  if (!dataNascimento) return false;

  const nascimento = new Date(dataNascimento);

  if (Number.isNaN(nascimento.getTime())) return false;

  return nascimento.getMonth() === new Date().getMonth();
}

function promocaoEstaAtiva(promocao: any) {
  if (!promocao) return false;
  if (promocao.status !== 'ativa') return false;

  const agora = new Date();
  const inicio = promocao.dataInicio ? new Date(promocao.dataInicio) : null;
  const fim = promocao.dataFim ? new Date(promocao.dataFim) : null;

  if (inicio) {
    inicio.setHours(0, 0, 0, 0);
  }

  if (fim) {
    fim.setHours(23, 59, 59, 999);
  }

  if (inicio && agora < inicio) return false;
  if (fim && agora > fim) return false;

  return true;
}

function calcularValorComPromocao(valorOriginal: number, promocao: any) {
  const desconto = numero(promocao?.desconto);

  if (!promocao || desconto <= 0) return valorOriginal;

  if (promocao.tipoDesconto === 'percentual') {
    const percentual = Math.min(Math.max(desconto, 0), 100);
    return Math.max(valorOriginal - (valorOriginal * percentual) / 100, 0);
  }

  return Math.max(valorOriginal - desconto, 0);
}

function erroCapacidade(message?: string) {
  const erro = new Error(
    message ||
      'Este horário acabou de atingir o limite de atendimentos simultâneos para este serviço/profissional. Escolha outro horário.'
  );

  (erro as any).codigo = 'LIMITE_CAPACIDADE_HORARIO';

  return erro;
}

function erroReagendamentoDisponivel(agendamentoExistente: any) {
  const erro = new Error(
    'Você já possui um atendimento em aberto para este serviço. Deseja reagendar esse atendimento?'
  );

  (erro as any).codigo = 'REAGENDAMENTO_DISPONIVEL';
  (erro as any).agendamentoExistente = agendamentoExistente;

  return erro;
}

async function cpfJaUsouPromocao(promocao: any, cpfLimpo: string) {
  if (!promocao?.usoUnicoCpf || !cpfLimpo) return false;

  const usoExistente = await prisma.promocaoUso.findFirst({
    where: {
      promocaoId: promocao.id,
      cpf: cpfLimpo,
    },
    select: {
      id: true,
    },
  });

  return Boolean(usoExistente);
}

async function buscarPromocaoAtivaDoServico(
  empresaId: string,
  servicoId: string,
  clienteFinal: any
) {
  const cpfLimpo = limparCpf(clienteFinal?.cpf);

  const promocoes = await prisma.promocao.findMany({
    where: {
      empresaId,
      status: 'ativa',
      OR: [
        {
          tipo: 'servico',
          servicos: {
            some: {
              servicoId,
            },
          },
        },
        {
          tipo: 'aniversariantes',
        },
        {
          tipo: 'geral',
        },
      ],
    },
    include: {
      servicos: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const promocoesAtivas = promocoes.filter((promocao) => promocaoEstaAtiva(promocao));
  const promocoesServico = promocoesAtivas.filter((promocao) => promocao.tipo === 'servico');
  const promocoesAniversario = promocoesAtivas.filter((promocao) => promocao.tipo === 'aniversariantes');
  const promocoesGerais = promocoesAtivas.filter((promocao) => promocao.tipo === 'geral');

  const candidatos = [
    ...promocoesServico,
    ...(clienteFazAniversarioNoMesAtual(clienteFinal) ? promocoesAniversario : []),
    ...promocoesGerais,
  ];

  for (const promocao of candidatos) {
    const cpfBloqueado = await cpfJaUsouPromocao(promocao, cpfLimpo);

    if (!cpfBloqueado) {
      return promocao;
    }
  }

  return null;
}

async function validarCapacidadeAntesDeCriar(params: {
  tx: any;
  empresaId: string;
  servicoId: string;
  profissionalId?: string | null;
  clienteId: string;
  dataCampo: string;
  horaInicioCampo: string;
  capacidadeSimultanea: number;
}) {
  const capacidade = inteiroPositivo(params.capacidadeSimultanea, 1);
  const profissionalIdNormalizado = params.profissionalId || null;

  const agora = new Date();

const agendamentoAbertoDoCliente = await params.tx.agendamento.findFirst({
  where: {
    empresaId: params.empresaId,
    servicoId: params.servicoId,
    clienteId: params.clienteId,

    dataHoraInicio: {
      gte: agora,
    },

    status: {
      in: ['pendente', 'confirmado', 'em_atendimento'],
    },
  },
    include: {
      cliente: true,
      servico: true,
      profissional: true,
      empresa: true,
    },
    orderBy: {
      dataHoraInicio: 'asc',
    },
  });

  if (agendamentoAbertoDoCliente) {
    const horasRestantes = horasAteAtendimento(agendamentoAbertoDoCliente.dataHoraInicio);

    throw erroReagendamentoDisponivel({
      ...agendamentoAbertoDoCliente,
      podeReagendarPublico: horasRestantes >= 24,
      horasRestantes,
      motivoBloqueio:
        horasRestantes < 24
          ? 'O reagendamento pelo link público só é permitido com pelo menos 24h de antecedência.'
          : null,
    });
  }

  const quantidadeMesmoServicoNoHorario = await params.tx.agendamento.count({
    where: {
      empresaId: params.empresaId,
      profissionalId: profissionalIdNormalizado,
      servicoId: params.servicoId,
      data: params.dataCampo,
      horaInicio: params.horaInicioCampo,
      status: {
        not: 'cancelado',
      },
    },
  });

  if (quantidadeMesmoServicoNoHorario >= capacidade) {
    throw erroCapacidade(
      `Este horário já atingiu o limite de ${capacidade} atendimento(s) simultâneo(s) para este serviço e profissional.`
    );
  }

  return {
    quantidadeMesmoServicoNoHorario,
    capacidade,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      empresaId,
      servicoId,
      profissionalId,
      dataHoraInicio,
      clienteId,
      cliente,
      fichasRegistrosPorServico,
    } = body;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId obrigatório.' },
        { status: 400 }
      );
    }

    if (!servicoId) {
      return NextResponse.json(
        { success: false, error: 'servicoId obrigatório.' },
        { status: 400 }
      );
    }

    if (!dataHoraInicio) {
      return NextResponse.json(
        { success: false, error: 'dataHoraInicio obrigatório.' },
        { status: 400 }
      );
    }

    if (!cliente?.cpf && !clienteId) {
      return NextResponse.json(
        { success: false, error: 'CPF do cliente obrigatório.' },
        { status: 400 }
      );
    }

    const servico = await prisma.servico.findUnique({
      where: {
        id: servicoId,
      },
    });

    if (!servico) {
      return NextResponse.json(
        { success: false, error: 'Serviço não encontrado.' },
        { status: 404 }
      );
    }

    if (servico.empresaId !== empresaId) {
      return NextResponse.json(
        { success: false, error: 'Serviço não pertence à empresa informada.' },
        { status: 400 }
      );
    }

    let clienteFinal = null;

    if (clienteId) {
      clienteFinal = await prisma.cliente.findFirst({
        where: {
          id: clienteId,
          empresaId,
        },
      });
    }

    if (!clienteFinal && cliente?.cpf) {
      const cpfLimpo = limparCpf(cliente.cpf);

      const clientesDaEmpresa = await prisma.cliente.findMany({
        where: {
          empresaId,
        },
      });

      clienteFinal =
        clientesDaEmpresa.find((c) => limparCpf(c.cpf) === cpfLimpo) || null;
    }

    if (!clienteFinal) {
      if (!cliente?.nome || !cliente?.whatsapp) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Cliente não encontrado. Nome e WhatsApp são obrigatórios para novo cadastro.',
          },
          { status: 400 }
        );
      }

      clienteFinal = await prisma.cliente.create({
        data: {
          empresaId,
          nome: cliente.nome,
          whatsapp: cliente.whatsapp,
          cpf: cliente.cpf || null,
          dataNascimento: cliente.dataNascimento
            ? new Date(cliente.dataNascimento)
            : null,
        },
      });
    }

    const servicosRecebidos =
      Array.isArray(body.servicosCarrinho) && body.servicosCarrinho.length > 0
        ? body.servicosCarrinho
        : [
            {
              servicoId,
              profissionalId,
              dataHoraInicio,
            },
          ];

    const grupoAgendamentoId = crypto.randomUUID();

    const agendamentosCriados = [];
    const chavesCriadasNestaRequisicao = new Set<string>();

    for (const item of servicosRecebidos) {
      const servicoAtual = await prisma.servico.findUnique({
        where: {
          id: item.servicoId,
        },
      });

      if (!servicoAtual) {
        continue;
      }

      if (servicoAtual.empresaId !== empresaId) {
        continue;
      }

      const inicio = new Date(item.dataHoraInicio);

      if (Number.isNaN(inicio.getTime())) {
        continue;
      }

      const profissionalItemId = item.profissionalId || null;
      const dataCampo = formatarDataParaCampo(inicio);
      const horaInicioCampo = formatarHoraParaCampo(inicio);

      const chaveItem = `${item.servicoId}-${profissionalItemId || 'sem-profissional'}-${dataCampo}-${horaInicioCampo}`;

      if (chavesCriadasNestaRequisicao.has(chaveItem)) {
        continue;
      }

      chavesCriadasNestaRequisicao.add(chaveItem);

      const fim = new Date(inicio);

      fim.setMinutes(
        fim.getMinutes() + Number(servicoAtual.duracaoMin || 30)
      );

      const capacidadeSimultanea = inteiroPositivo(
        (servicoAtual as any).capacidadeSimultanea,
        1
      );

      const promocaoAtiva = await buscarPromocaoAtivaDoServico(
        empresaId,
        item.servicoId,
        clienteFinal
      );

      const valorOriginalServico = numero(servicoAtual.valor);
      const valorPromocionalServico = calcularValorComPromocao(
        valorOriginalServico,
        promocaoAtiva
      );

      const valorPrePagamentoOriginal = numero(servicoAtual.valorPrePagamento);
      const valorPrePagamentoPromocional = valorPrePagamentoOriginal > 0
        ? calcularValorComPromocao(valorPrePagamentoOriginal, promocaoAtiva)
        : null;

      const valorEconomizadoServico = Math.max(
        valorOriginalServico - valorPromocionalServico,
        0
      );

      const promocaoAplicada = promocaoAtiva && valorEconomizadoServico > 0;

      const novoAgendamento = await prisma.$transaction(async (tx) => {
        await validarCapacidadeAntesDeCriar({
          tx,
          empresaId,
          servicoId: item.servicoId,
          profissionalId: profissionalItemId,
          clienteId: clienteFinal.id,
          dataCampo,
          horaInicioCampo,
          capacidadeSimultanea,
        });

        return tx.agendamento.create({
          data: {
            empresaId,

            grupoAgendamentoId,

            servicoId: item.servicoId,

            profissionalId: profissionalItemId,

            clienteId: clienteFinal.id,

            data: dataCampo,

            horaInicio: horaInicioCampo,

            duracaoMin: Number(servicoAtual.duracaoMin || 30),

            clienteNome: clienteFinal.nome,

            clienteCpf: clienteFinal.cpf,

            clienteNascimento: clienteFinal.dataNascimento
              ? formatarDataParaCampo(clienteFinal.dataNascimento)
              : cliente?.dataNascimento || null,

            clienteWhatsapp: clienteFinal.whatsapp,

            nomeCliente: clienteFinal.nome,

            telefoneCliente: clienteFinal.whatsapp,

            dataHoraInicio: inicio,

            dataHoraFim: fim,

            valorTotal: valorPromocionalServico,

            valorPrePago: valorPrePagamentoPromocional,

            valorOriginalServico,

            valorComDesconto: valorPromocionalServico,

            valorEconomizado: valorEconomizadoServico,

            promocaoId: promocaoAplicada ? promocaoAtiva.id : null,

            promocaoTitulo: promocaoAplicada ? promocaoAtiva.titulo : null,

            promocaoDescricao: promocaoAplicada ? promocaoAtiva.descricao : null,

            promocaoTipo: promocaoAplicada ? promocaoAtiva.tipo : null,

            promocaoDesconto: promocaoAplicada ? promocaoAtiva.desconto : null,

            promocaoTipoDesconto: promocaoAplicada ? promocaoAtiva.tipoDesconto : null,

            promocaoUsoUnicoCpf: promocaoAplicada ? Boolean(promocaoAtiva.usoUnicoCpf) : false,

            status: servicoAtual.exigePrePagamento
              ? 'pendente'
              : 'confirmado',

            statusPagamento: servicoAtual.exigePrePagamento
              ? 'pendente'
              : 'sem_pagamento',

            origem: 'online',
          },

          include: {
            cliente: true,
            servico: true,
            profissional: true,
          },
        });
      });

      const fichaRegistroVinculada = Array.isArray(fichasRegistrosPorServico)
        ? fichasRegistrosPorServico.find(
            (ficha: any) =>
              ficha?.servicoId === item.servicoId && ficha?.registroId,
          )
        : item.fichaRegistroId
          ? { servicoId: item.servicoId, registroId: item.fichaRegistroId }
          : null;

      if (fichaRegistroVinculada?.registroId) {
        await prisma.fichaRegistro.updateMany({
          where: {
            id: fichaRegistroVinculada.registroId,
            empresaId,
            modelo: {
              servicos: {
                some: {
                  id: item.servicoId,
                },
              },
            },
          },
          data: {
            agendamentoId: novoAgendamento.id,
            clienteId: clienteFinal.id,
            status: 'preenchida',
          },
        });
      }

      if (promocaoAplicada && promocaoAtiva?.id) {
        const cpfLimpoPromocao = limparCpf(clienteFinal.cpf);

        if (cpfLimpoPromocao) {
          await prisma.promocaoUso.upsert({
            where: {
              promocaoId_cpf: {
                promocaoId: promocaoAtiva.id,
                cpf: cpfLimpoPromocao,
              },
            },
            update: {
              agendamentoId: novoAgendamento.id,
              clienteId: clienteFinal.id,
              usedAt: new Date(),
            },
            create: {
              empresaId,
              promocaoId: promocaoAtiva.id,
              clienteId: clienteFinal.id,
              agendamentoId: novoAgendamento.id,
              cpf: cpfLimpoPromocao,
            },
          });
        }
      }

      agendamentosCriados.push(novoAgendamento);
    }

    return NextResponse.json({
      success: true,
      grupoAgendamentoId,
      agendamentos: agendamentosCriados,
      agendamento: agendamentosCriados[0] || null,
    });
  } catch (error: any) {
    console.error('Erro ao criar agendamento:', error);

    if (error?.codigo === 'LIMITE_CAPACIDADE_HORARIO') {
      return NextResponse.json(
        {
          success: false,
          error:
            error?.message ||
            'Este horário atingiu o limite de atendimentos simultâneos.',
        },
        { status: 409 }
      );
    }

    if (error?.codigo === 'REAGENDAMENTO_DISPONIVEL') {
      return NextResponse.json(
        {
          success: false,
          reagendamentoDisponivel: true,
          agendamentoExistente: error?.agendamentoExistente || null,
          error:
            error?.message ||
            'Você já possui um atendimento em aberto para este serviço. Deseja reagendar esse atendimento?',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar agendamento.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
