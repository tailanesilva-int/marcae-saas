# AgendeAi MVP

Base MVP em Next.js + Prisma + PostgreSQL/Supabase.

## Rodar local

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Acesse: `http://localhost:3000/demo-studio`

## Rotas principais

- `GET /api/v1/public/[slug]` dados públicos da empresa
- `GET /api/v1/scheduling/slots?empresaId=&servicoId=&date=YYYY-MM-DD&profissionalId=` horários disponíveis
- `POST /api/v1/clients` cria/atualiza cliente
- `POST /api/v1/scheduling/appointments` cria agendamento
- `POST /api/v1/whatsapp/send` gera link WhatsApp manual
