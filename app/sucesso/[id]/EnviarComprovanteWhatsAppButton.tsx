'use client';

import { useState } from 'react';

type Props = {
  agendamentoId: string;
  ids?: string;
};

export default function EnviarComprovanteWhatsAppButton({
  agendamentoId,
  ids,
}: Props) {
  const [enviando, setEnviando] = useState(false);

  async function enviarComprovante() {
    if (enviando) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
    }, 30000);

    try {
      setEnviando(true);

      const params = ids ? `?ids=${encodeURIComponent(ids)}` : '';

      const res = await fetch(
        `/api/agendamentos/${agendamentoId}/enviar-comprovante-whatsapp${params}`,
        {
          method: 'POST',
          signal: controller.signal,
        }
      );

      const text = await res.text();

      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = {
          success: false,
          error: text || 'Resposta inválida do servidor.',
        };
      }

      if (!res.ok || !data?.success) {
        alert(data?.error || `Erro ao enviar comprovante. Status: ${res.status}`);
        return;
      }

      alert('Comprovante enviado com sucesso pelo WhatsApp.');
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        alert(
          'Tempo esgotado ao enviar o comprovante. A Evolution API demorou mais de 30 segundos para responder.'
        );
        return;
      }

      console.error(error);
      alert('Erro ao enviar comprovante pelo WhatsApp.');
    } finally {
      window.clearTimeout(timeout);
      setEnviando(false);
    }
  }

  return (
    <button
      type="button"
      className="actionButton whatsapp"
      onClick={enviarComprovante}
      disabled={enviando}
      style={{
        border: 0,
        cursor: enviando ? 'not-allowed' : 'pointer',
        opacity: enviando ? 0.72 : 1,
      }}
    >
      {enviando
        ? 'Enviando comprovante...'
        : 'Enviar comprovante em PDF no WhatsApp'}
    </button>
  );
}