import '@/app/lib/initScheduler';
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { enviarWhatsapp } from '@/lib/whatsapp';
import { podeUsarLembreteAutomatico } from '@/lib/plano';
import { montarLinkAgendamento } from '@/lib/links';

export async function GET() {
  try {
    const agora = new Date();
    const daqui1h = new Date(agora.getTime() + 60 * 60 * 1000);

    console.log('⏰ Buscando agendamentos para lembrete...');

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        status: 'confirmado',
        lembreteWhatsappEnviado: false,
        dataHoraInicio: {
          gte: agora,
          lte: daqui1h,
        },
      },
      include: {
        cliente: true,
        servico: true,
        empresa: true,
        profissional: true,
      },
    });

    console.log(`📋 Encontrados ${agendamentos.length} agendamentos`);

    let enviados = 0;
    let bloqueadosPorPlano = 0;

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
          console.log('⚠️ Empresa sem WhatsApp configurado');
          continue;
        }

        if (!agendamento.cliente?.whatsapp) {
          console.log('⚠️ Cliente sem WhatsApp');
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
        console.error('❌ Erro ao enviar lembrete:', err);
      }
    }

    return NextResponse.json({
      success: true,
      total: agendamentos.length,
      enviados,
      bloqueadosPorPlano,
    });
  } catch (error) {
    console.error('❌ Erro geral lembretes:', error);

    return NextResponse.json(
      { error: 'Erro ao processar lembretes' },
      { status: 500 }
    );
  }
}