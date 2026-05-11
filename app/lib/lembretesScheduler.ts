import { getPublicBaseUrl } from '@/lib/links';

let iniciado = false;
let financeiroIniciado = false;

export function iniciarScheduler() {
  if (iniciado) return;

  iniciado = true;

  console.log('⏰ Scheduler de lembretes iniciado (1 minuto)');

  setInterval(async () => {
    try {
      const baseUrl = getPublicBaseUrl();

      const res = await fetch(`${baseUrl}/api/lembretes/whatsapp`);
      const data = await res.json();

      console.log('🔁 Execução automática lembretes:', data);
    } catch (error) {
      console.error('❌ Erro no scheduler de lembretes:', error);
    }
  }, 60 * 1000);

  iniciarSchedulerFinanceiro();
}

export function iniciarSchedulerFinanceiro() {
  if (financeiroIniciado) return;

  financeiroIniciado = true;

  console.log('💰 Scheduler financeiro iniciado (6 horas)');

  const executarVerificacaoFinanceira = async () => {
    try {
      const baseUrl = getPublicBaseUrl();

      const headers: Record<string, string> = {};

      if (process.env.CRON_SECRET) {
        headers.Authorization = `Bearer ${process.env.CRON_SECRET}`;
      }

      const res = await fetch(`${baseUrl}/api/financeiro/verificar-assinaturas`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      const data = await res.json().catch(() => null);

      console.log('💰 Execução automática financeiro:', data);
    } catch (error) {
      console.error('❌ Erro no scheduler financeiro:', error);
    }
  };

  setTimeout(executarVerificacaoFinanceira, 30 * 1000);
  setInterval(executarVerificacaoFinanceira, 6 * 60 * 60 * 1000);
}
