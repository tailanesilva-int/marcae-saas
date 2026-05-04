import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { enviarWhatsapp } from '@/lib/whatsapp';

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

    for (const cliente of clientes) {
      try {
        let numero = String(cliente.whatsapp || '').replace(/\D/g, '');

        if (!numero) {
          erros++;
          continue;
        }

        if (!numero.startsWith('55')) {
          numero = `55${numero}`;
        }

        const mensagemBase = mensagemWhatsapp
          .replaceAll('{nome}', cliente.nome || 'cliente')
          .replaceAll('{empresa}', empresa.nome || '')
          .replaceAll('{titulo}', titulo || '')
          .replaceAll('{descricao}', descricao || '');

        const mensagemFinal = `${mensagemBase}

━━━━━━━━━━━━━━
🏢 ${empresa.nome}
📍 ${empresa.endereco || 'Endereço não informado'}
📞 ${empresa.telefone || empresa.whatsapp || 'Telefone não informado'}`;

        await enviarWhatsapp({
          instance: empresa.whatsappInstance,
          numero,
          mensagem: mensagemFinal,
        });

        enviados++;
      } catch (error) {
        console.error(`Erro ao enviar para ${cliente.nome}:`, error);
        erros++;
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
    });
  } catch (error) {
    console.error('Erro ao enviar promoção:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao enviar promoção.' },
      { status: 500 }
    );
  }
}