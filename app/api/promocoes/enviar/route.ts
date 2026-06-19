import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { enviarWhatsapp } from '@/lib/whatsapp';

const TAMANHO_LOTE = 10;
const INTERVALO_ENTRE_LOTES_MS = 1200;

function aguardar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizarNumero(numero: string) {
  let numeroLimpo = String(numero || '').replace(/\D/g, '');

  if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
    numeroLimpo = `55${numeroLimpo}`;
  }

  return numeroLimpo;
}

function montarMensagemPromocao({
  mensagemWhatsapp,
  cliente,
  empresa,
  titulo,
  descricao,
}: {
  mensagemWhatsapp: string;
  cliente: any;
  empresa: any;
  titulo?: string | null;
  descricao?: string | null;
}) {
  const mensagemBase = mensagemWhatsapp
    .replaceAll('{nome}', cliente.nome || 'cliente')
    .replaceAll('{empresa}', empresa.nome || '')
    .replaceAll('{titulo}', titulo || '')
    .replaceAll('{descricao}', descricao || '');

  return `${mensagemBase}

━━━━━━━━━━━━━━
🏢 ${empresa.nome}
📍 ${empresa.endereco || 'Endereço não informado'}
📞 ${empresa.telefone || empresa.whatsapp || 'Telefone não informado'}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      promocaoId,
      empresaId,
      tipoPromocao,
      titulo,
      descricao,
      mensagemWhatsapp,
    } = body;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId é obrigatório.' },
        { status: 400 }
      );
    }

    if (!mensagemWhatsapp) {
      return NextResponse.json(
        { success: false, error: 'Mensagem do WhatsApp é obrigatória.' },
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

    if (!empresa.whatsappAtivo || !empresa.whatsappInstance) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp da empresa não está configurado.',
        },
        { status: 400 }
      );
    }

    let clientes = await prisma.cliente.findMany({
      where: {
        empresaId,
        whatsapp: {
          not: '',
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });

    clientes = clientes.filter((cliente) => !!cliente.whatsapp);

    if (tipoPromocao === 'aniversariantes') {
      const mesAtual = new Date().getMonth();

      clientes = clientes.filter((cliente) => {
        if (!cliente.dataNascimento) return false;
        return new Date(cliente.dataNascimento).getMonth() === mesAtual;
      });
    }

    if (clientes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum cliente encontrado para envio.',
      });
    }

    let enviados = 0;
    let erros = 0;
    const detalhesErros: Array<{
      clienteId: string;
      clienteNome: string;
      motivo: string;
    }> = [];

    for (let i = 0; i < clientes.length; i += TAMANHO_LOTE) {
      const lote = clientes.slice(i, i + TAMANHO_LOTE);

      const resultados = await Promise.allSettled(
        lote.map(async (cliente) => {
          const numero = normalizarNumero(cliente.whatsapp || '');

          if (!numero) {
            throw new Error('Número de WhatsApp inválido.');
          }

          const mensagemFinal = montarMensagemPromocao({
            mensagemWhatsapp,
            cliente,
            empresa,
            titulo,
            descricao,
          });

          await enviarWhatsapp({
            instance: empresa.whatsappInstance,
            numero,
            mensagem: mensagemFinal,
            tentativas: 3,
            timeoutMs: 15000,
          });

          return cliente;
        })
      );

      resultados.forEach((resultado, index) => {
        const cliente = lote[index];

        if (resultado.status === 'fulfilled') {
          enviados++;
          return;
        }

        erros++;

        const motivo =
          resultado.reason instanceof Error
            ? resultado.reason.message
            : 'Erro desconhecido ao enviar promoção.';

        detalhesErros.push({
          clienteId: cliente.id,
          clienteNome: cliente.nome || 'Cliente sem nome',
          motivo,
        });

        console.error(`Erro ao enviar promoção para ${cliente.nome}:`, motivo);
      });

      const aindaTemProximoLote = i + TAMANHO_LOTE < clientes.length;

      if (aindaTemProximoLote) {
        await aguardar(INTERVALO_ENTRE_LOTES_MS);
      }
    }

    if (promocaoId) {
      await prisma.promocao.update({
        where: { id: promocaoId },
        data: {
          whatsappEnviadoAt: new Date(),
          whatsappTotalEnviados: enviados,
          whatsappTotalErros: erros,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      totalClientes: clientes.length,
      enviados,
      erros,
      detalhesErros: detalhesErros.slice(0, 20),
    });
  } catch (error) {
    console.error('Erro ao enviar promoção:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao enviar promoção.' },
      { status: 500 }
    );
  }
}