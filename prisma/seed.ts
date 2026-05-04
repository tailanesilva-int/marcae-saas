import { prisma } from '../lib/prisma';

async function main() {
  const empresa = await prisma.empresa.upsert({
    where: { slug: 'demo-studio' },
    update: {},
    create: {
      slug: 'demo-studio',
      nome: 'Demo Studio',
      descricao: 'Empresa de demonstração do AgendeAi',
      whatsapp: '5575999999999',
      endereco: 'Rua Exemplo, 123',
    },
  });

  const servico = await prisma.servico.create({
    data: {
      empresaId: empresa.id,
      nome: 'Corte feminino',
      descricao: 'Serviço de exemplo',
      duracaoMin: 60,
      valor: 100,
      exigePrePagamento: true,
      tipoPrePagamento: 'fixo',
      valorPrePagamento: 30,
    },
  });

  const profissional = await prisma.profissional.create({
    data: { empresaId: empresa.id, nome: 'Ana Profissional', bio: 'Especialista em atendimento personalizado.' },
  });

  await prisma.profissionalServico.create({ data: { empresaId: empresa.id, profissionalId: profissional.id, servicoId: servico.id } });

  for (const diaSemana of [1,2,3,4,5]) {
    await prisma.disponibilidade.create({
      data: { empresaId: empresa.id, profissionalId: profissional.id, tipo: 'profissional', diaSemana, horaInicio: '08:00', horaFim: '18:00', intervaloMin: 30 },
    });
  }

  console.log('Seed criado: /demo-studio');
}

main().finally(() => prisma.$disconnect());
