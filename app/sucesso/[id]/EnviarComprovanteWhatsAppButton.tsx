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
    try {
      setEnviando(true);

      const params = ids ? `?ids=${encodeURIComponent(ids)}` : '';

      const res = await fetch(
        `/api/agendamentos/${agendamentoId}/enviar-comprovante-whatsapp${params}`,
        { method: 'POST' }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || 'Erro ao enviar comprovante.');
        return;
      }

      alert('Comprovante enviado com sucesso pelo WhatsApp.');
    } catch {
      alert('Erro ao enviar comprovante pelo WhatsApp.');
    } finally {
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
        opacity: enviando ? 0.7 : 1,
      }}
    >
      {enviando ? 'Enviando comprovante...' : 'Enviar comprovante em PDF no WhatsApp'}
    </button>
  );
}