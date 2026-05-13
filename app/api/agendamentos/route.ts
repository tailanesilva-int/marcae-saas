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

      clienteFinal = await prisma.cliente.upsert({
        where: {
          empresaId_whatsapp: {
            empresaId,
            whatsapp: cliente.whatsapp,
          },
        },
        update: {
          nome: cliente.nome,
          cpf: cliente.cpf || null,
          dataNascimento: cliente.dataNascimento
            ? new Date(cliente.dataNascimento)
            : null,
        },
        create: {
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

      const fim = new Date(inicio);

      fim.setMinutes(
        fim.getMinutes() + Number(servicoAtual.duracaoMin || 30)
      );

      const novoAgendamento = await prisma.agendamento.create({
        data: {
          empresaId,

          grupoAgendamentoId,

          servicoId: item.servicoId,

          profissionalId: item.profissionalId || null,

          clienteId: clienteFinal.id,

          data: formatarDataParaCampo(inicio),

          horaInicio: formatarHoraParaCampo(inicio),

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

          valorTotal: servicoAtual.valor || 0,

          valorPrePago: servicoAtual.valorPrePagamento || null,

          status: 'pendente',

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