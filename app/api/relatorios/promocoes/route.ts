import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function numero(valor: any) {
  if (valor === null || valor === undefined || valor === '') return 0;
  if (typeof valor === 'number') return Number.isNaN(valor) ? 0 : valor;

  const convertido = Number(String(valor).replace(',', '.'));
  return Number.isNaN(convertido) ? 0 : convertido;
}

function montarRegistro(agendamento: any, uso?: any) {
  const valorOriginal = numero(
    agendamento?.valorOriginalServico ||
      agendamento?.servico?.valor ||
      agendamento?.valorTotal
  );

  const valorFinal = numero(
    agendamento?.valorComDesconto ||
      agendamento?.valorTotal
  );

  const valorEconomizado = numero(
    agendamento?.valorEconomizado ||
      Math.max(valorOriginal - valorFinal, 0)
  );

  return {
    id: agendamento.id,
    promocaoId: agendamento.promocaoId || uso?.promocaoId || null,
    agendamentoId: agendamento.id,
    clienteId: agendamento.clienteId || uso?.clienteId || null,
    dataUso: agendamento.dataHoraInicio || uso?.usedAt,
    promocaoTitulo:
      agendamento.promocaoTitulo ||
      uso?.promocao?.titulo ||
      'Promoção não identificada',
    promocaoTipo:
      agendamento.promocaoTipo ||
      uso?.promocao?.tipo ||
      'não informado',
    promocaoTipoDesconto:
      agendamento.promocaoTipoDesconto ||
      uso?.promocao?.tipoDesconto ||
      null,
    promocaoDesconto:
      agendamento.promocaoDesconto ||
      uso?.promocao?.desconto ||
      0,
    clienteNome:
      agendamento.cliente?.nome ||
      agendamento.nomeCliente ||
      agendamento.clienteNome ||
      uso?.cliente?.nome ||
      'Cliente não informado',
    servicoNome:
      agendamento.servico?.nome ||
      'Serviço não informado',
    profissionalNome:
      agendamento.profissional?.nome ||
      'Profissional não informado',
    statusAgendamento: agendamento.status || '-',
    statusPagamento: agendamento.statusPagamento || '-',
    valorOriginal,
    valorFinal,
    valorEconomizado,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get('empresaId');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId obrigatório.' },
        { status: 400 }
      );
    }

    const inicio = dataInicio
      ? new Date(`${dataInicio}T00:00:00`)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const fim = dataFim ? new Date(`${dataFim}T23:59:59`) : new Date();

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        empresaId,
        dataHoraInicio: {
          gte: inicio,
          lte: fim,
        },

        OR: [
          { promocaoId: { not: null } },
          { promocaoTitulo: { not: null } },
          { valorEconomizado: { gt: 0 } },
        ],
      },
      include: {
        cliente: true,
        servico: true,
        profissional: true,
      },
      orderBy: {
        dataHoraInicio: 'desc',
      },
    });

    const usos = await prisma.promocaoUso.findMany({
  where: {
    empresaId,

    agendamento: {
      dataHoraInicio: {
        gte: inicio,
        lte: fim,
      },
    },
  },
  include: {
    promocao: true,
    cliente: true,
    agendamento: {
      include: {
        cliente: true,
        servico: true,
        profissional: true,
      },
    },
  },
  orderBy: {
    usedAt: 'desc',
  },
});

    const mapa = new Map<string, any>();

    agendamentos.forEach((agendamento: any) => {
      mapa.set(agendamento.id, montarRegistro(agendamento));
    });

    usos.forEach((uso: any) => {
      if (uso.agendamento?.id && !mapa.has(uso.agendamento.id)) {
        mapa.set(uso.agendamento.id, montarRegistro(uso.agendamento, uso));
      }
    });

    const registros = Array.from(mapa.values());

    const resumo = registros.reduce(
      (acc: any, item: any) => {
        acc.totalUsos += 1;
        acc.valorOriginal += numero(item.valorOriginal);
        acc.valorFinal += numero(item.valorFinal);
        acc.valorEconomizado += numero(item.valorEconomizado);
        return acc;
      },
      {
        totalUsos: 0,
        valorOriginal: 0,
        valorFinal: 0,
        valorEconomizado: 0,
      }
    );

    resumo.ticketMedioPromocional =
      resumo.totalUsos > 0 ? resumo.valorFinal / resumo.totalUsos : 0;

    resumo.descontoMedio =
      resumo.totalUsos > 0 ? resumo.valorEconomizado / resumo.totalUsos : 0;

    resumo.percentualDescontoMedio =
      resumo.valorOriginal > 0
        ? (resumo.valorEconomizado / resumo.valorOriginal) * 100
        : 0;

    function ranking(chave: string) {
      const map: Record<string, any> = {};

      registros.forEach((item: any) => {
        const nome = item[chave] || 'Não informado';

        if (!map[nome]) {
          map[nome] = {
            nome,
            quantidade: 0,
            valorEconomizado: 0,
            valorFinal: 0,
          };
        }

        map[nome].quantidade += 1;
        map[nome].valorEconomizado += numero(item.valorEconomizado);
        map[nome].valorFinal += numero(item.valorFinal);
      });

      return Object.values(map).sort(
        (a: any, b: any) => b.quantidade - a.quantidade
      );
    }

    return NextResponse.json({
      success: true,
      periodo: { inicio, fim },
      resumo,
      registros,
      rankingPromocoes: ranking('promocaoTitulo'),
      rankingServicos: ranking('servicoNome'),
      rankingClientes: ranking('clienteNome'),
    });
  } catch (error: any) {
    console.error('Erro ao gerar relatório de promoções:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao gerar relatório de promoções.',
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}