import { getPublicBaseUrl } from '@/lib/links';

let iniciado = false;

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
}