import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const agendamentoInclude = {
  cliente: true,
  servico: true,
  profissional: true,
  empresa: true,
};

async function buscarAgendamento(id: string) {
  return prisma.agendamento.findUnique({
    where: {
      id,
    },
    include: agendamentoInclude,
  });
}

async function buscarAgendamentosPorIds(ids: string[]) {
  if (ids.length === 0) return [];

  return prisma.agendamento.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    include: agendamentoInclude,
    orderBy: [
      {
        dataHoraInicio: 'asc',
      },
      {
        createdAt: 'asc',
      },
    ],
  });
}

async function buscarAgendamentosDoComprovante(id: string, ids: string[]) {
  if (ids.length > 1) return buscarAgendamentosPorIds(ids);

  const agendamentoPrincipal = await buscarAgendamento(id);

  if (!agendamentoPrincipal) return [];
  if (!agendamentoPrincipal.grupoAgendamentoId) return [agendamentoPrincipal];

  return prisma.agendamento.findMany({
    where: {
      grupoAgendamentoId: agendamentoPrincipal.grupoAgendamentoId,
      empresaId: agendamentoPrincipal.empresaId,
    },
    include: agendamentoInclude,
    orderBy: [
      {
        dataHoraInicio: 'asc',
      },
      {
        createdAt: 'asc',
      },
    ],
  });
}

function limparTelefone(telefone?: string | null) {
  return String(telefone || '').replace(/\D/g, '');
}

function normalizarTelefoneBrasil(telefone?: string | null) {
  const limpo = limparTelefone(telefone);

  if (!limpo) return '';
  if (limpo.startsWith('55')) return limpo;
  if (limpo.length === 10 || limpo.length === 11) return `55${limpo}`;

  return limpo;
}

function formatarData(data?: string | Date | null) {
  if (!data) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
  }).format(new Date(data));
}

function formatarHora(data?: string | Date | null) {
  if (!data) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data));
}

function getBaseUrl(request: NextRequest) {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    '';

  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  const protocol =
    request.headers.get('x-forwarded-proto') || 'http';

  const host = request.headers.get('host');

  return `${protocol}://${host}`;
}

async function fetchComTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 30000
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function enviarDocumentoEvolution({
  number,
  caption,
}: {
  number: string;
  caption: string;
}) {
  const apiUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance =
    process.env.EVOLUTION_INSTANCE ||
    process.env.EVOLUTION_INSTANCE_NAME;

  const endpoint = `${apiUrl}/message/sendMedia/${instance}`;

  const payload = {
  number,
  mediatype: 'image',
  media:
    'https://upload.wikimedia.org/wikipedia/commons/3/3f/Placeholder_view_vector.svg',
  caption,
};

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey || '',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.text();

  console.log(data);

  return data;
}

export async function POST(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const { id } = await params;
    const idsParam = request.nextUrl.searchParams.get('ids');

    const ids =
      idsParam
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean) || [id];

    const agendamentos = await buscarAgendamentosDoComprovante(id, ids);

    if (!agendamentos.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agendamento não encontrado.',
        },
        {
          status: 404,
        }
      );
    }

    const agendamento = agendamentos[0];

    const telefoneCliente =
      agendamento?.cliente?.whatsapp ||
      agendamento?.clienteWhatsapp ||
      agendamento?.telefoneCliente ||
      '';

    const numeroDestino = normalizarTelefoneBrasil(telefoneCliente);

    if (!numeroDestino) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cliente não possui WhatsApp cadastrado.',
        },
        {
          status: 400,
        }
      );
    }

    const nomeCliente =
      agendamento?.cliente?.nome ||
      agendamento?.clienteNome ||
      'Cliente';

    const nomeEmpresa = agendamento?.empresa?.nome || 'Empresa';

    const primeiroHorario = agendamentos[0]?.dataHoraInicio;

    const caption =
      `Olá, ${nomeCliente}! Segue seu comprovante de agendamento em ${nomeEmpresa}.\n\n` +
      (primeiroHorario
        ? `Primeiro horário: ${formatarData(primeiroHorario)} às ${formatarHora(primeiroHorario)}\n`
        : '') +
      `\nQualquer dúvida, é só responder por aqui.`;

const evolutionResponse = await enviarDocumentoEvolution({
  number: numeroDestino,
  caption,
});

    return NextResponse.json({
      success: true,
      message: 'Comprovante enviado com sucesso pelo WhatsApp.',
      evolutionResponse,
    });
  } catch (error: any) {
    console.error('Erro ao enviar comprovante por WhatsApp:', error);

    const mensagem =
      error?.name === 'AbortError'
        ? 'Tempo esgotado ao conectar com a Evolution API. Verifique se a Evolution está ligada, se o ngrok aponta para localhost:8080 e se a instância está conectada.'
        : error?.message || 'Erro ao enviar comprovante pelo WhatsApp.';

    return NextResponse.json(
      {
        success: false,
        error: mensagem,
      },
      {
        status: 500,
      }
    );
  }
}
