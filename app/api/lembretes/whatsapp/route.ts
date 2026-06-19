import '@/app/lib/initScheduler';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { enviarWhatsapp } from '@/lib/whatsapp';
import { podeUsarLembreteAutomatico } from '@/lib/plano';
import { montarLinkAgendamento } from '@/lib/links';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');

    if (process.env.VERCEL_CRON_SECRET) {
  if (
    authHeader !==
    `Bearer ${process.env.VERCEL_CRON_SECRET}`
  ) {
        return NextResponse.json(
          { success: false, error: 'Acesso não autorizado.' },
          { status: 401 }
        );
      }
    }

    const agora = new Date();
    const inicioJanela = new Date(agora.getTime() + 55 * 60 * 1000);
    const fimJanela = new Date(agora.getTime() + 65 * 60 * 1000);

    console.log('⏰ Buscando agendamentos para lembrete WhatsApp...', {
      agora: agora.toISOString(),
      inicioJanela: inicioJanela.toISOString(),
      fimJanela: fimJanela.toISOString(),
    });

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        status: 'confirmado',
        lembreteWhatsappEnviado: false,
        dataHoraInicio: {
          gte: inicioJanela,
          lte: fimJanela,
        },
      },
      include: {
        cliente: true,
        servico: true,
        empresa: true,
        profissional: true,
      },
      orderBy: {
        dataHoraInicio: 'asc',
      },
      take: 80,
    });

    console.log(`📋 Encontrados ${agendamentos.length} agendamentos`);

    let enviados = 0;
    let erros = 0;
    let bloqueadosPorPlano = 0;
    let ignoradosSemWhatsapp = 0;
    let ignoradosSemConfiguracao = 0;

    for (const agendamento of agendamentos) {
      try {
        if (!agendamento.dataHoraInicio) {
          console.log('⚠️ Agendamento sem data/hora de início');
          continue;
        }

        if (!podeUsarLembreteAutomatico(agendamento.empresa)) {
          bloqueadosPorPlano++;
          console.log(
            `⚠️ Lembrete bloqueado - Premium inativo ou expirado (${agendamento.empresa.nome})`
          );
          continue;
        }

        if (
          !agendamento.empresa.whatsappAtivo ||
          !agendamento.empresa.whatsappInstance
        ) {
          ignoradosSemConfiguracao++;
          console.log(
            `⚠️ Empresa sem WhatsApp configurado (${agendamento.empresa.nome})`
          );
          continue;
        }

        if (!agendamento.cliente?.whatsapp) {
          ignoradosSemWhatsapp++;
          console.log(`⚠️ Cliente sem WhatsApp (${agendamento.cliente?.nome})`);
          continue;
        }

        const data = new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'full',
          timeZone: 'America/Bahia',
        }).format(agendamento.dataHoraInicio);

        const horario = new Intl.DateTimeFormat('pt-BR', {
          timeStyle: 'short',
          timeZone: 'America/Bahia',
        }).format(agendamento.dataHoraInicio);

        const linkAgendamento = montarLinkAgendamento(agendamento.empresa.slug);

        const mensagem = `✨ *${agendamento.empresa.nome}* te espera!

Olá, *${agendamento.cliente.nome}*! Tudo certo? 💜

⏰ *Falta 1 hora para o seu atendimento!*

Confira os detalhes do seu agendamento:

🧾 *Serviço:* ${agendamento.servico.nome}
${
  agendamento.profissional?.nome
    ? `👤 *Profissional:* ${agendamento.profissional.nome}\n`
    : ''
}📅 *Data:* ${data}
⏰ *Horário:* ${horario}

${
  agendamento.empresa.endereco
    ? `📍 ${agendamento.empresa.endereco}\n`
    : ''
}${
  agendamento.empresa.whatsapp || agendamento.empresa.telefone
    ? `📞 ${
        agendamento.empresa.whatsapp ||
        agendamento.empresa.telefone
      }\n`
    : ''
}

Se precisar reagendar ou tiver qualquer dúvida, é só falar com a gente 😉

🔗 Agendar novamente:
${linkAgendamento}

Te esperamos! ✨`;

        await enviarWhatsapp({
          instance: agendamento.empresa.whatsappInstance,
          numero: agendamento.cliente.whatsapp,
          mensagem,
          tentativas: 3,
          timeoutMs: 15000,
        });

        await prisma.agendamento.update({
          where: { id: agendamento.id },
          data: {
            lembreteWhatsappEnviado: true,
            lembreteWhatsappEnviadoAt: new Date(),
          },
        });

        enviados++;

        console.log(`✅ Lembrete enviado para ${agendamento.cliente.nome}`);
      } catch (err) {
        erros++;
        console.error('❌ Erro ao enviar lembrete:', {
          agendamentoId: agendamento.id,
          cliente: agendamento.cliente?.nome,
          erro: err,
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: agendamentos.length,
      enviados,
      erros,
      bloqueadosPorPlano,
      ignoradosSemWhatsapp,
      ignoradosSemConfiguracao,
      janela: {
        inicio: inicioJanela.toISOString(),
        fim: fimJanela.toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Erro geral lembretes:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao processar lembretes' },
      { status: 500 }
    );
  }
}