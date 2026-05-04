type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function buscarAgendamento(id: string) {
  const response = await fetch(`http://localhost:3000/api/agendamentos/${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.agendamento;
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
  }).format(new Date(data));
}

function formatarHora(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data));
}

function limparTelefone(telefone: string) {
  return telefone.replace(/\D/g, '');
}

export default async function SucessoDetalhesPage({ params }: PageProps) {
  const { id } = await params;
  const agendamento = await buscarAgendamento(id);

  const nomeCliente = agendamento?.cliente?.nome || 'Cliente';
  const telefoneCliente = agendamento?.cliente?.whatsapp || '';
  const servico = agendamento?.servico?.nome || 'serviço';
  const data = agendamento?.dataHoraInicio
    ? formatarData(agendamento.dataHoraInicio)
    : '';
  const hora = agendamento?.dataHoraInicio
    ? formatarHora(agendamento.dataHoraInicio)
    : '';

  const mensagemWhatsapp = encodeURIComponent(
    `Olá, ${nomeCliente}! Seu agendamento foi confirmado com sucesso.\n\n` +
      `Serviço: ${servico}\n` +
      `Data: ${data}\n` +
      `Horário: ${hora}\n\n` +
      `Obrigado por agendar conosco!`
  );

  const telefoneLimpo = limparTelefone(telefoneCliente);
  const linkWhatsapp = telefoneLimpo
    ? `https://wa.me/55${telefoneLimpo}?text=${mensagemWhatsapp}`
    : `https://wa.me/?text=${mensagemWhatsapp}`;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f8fafc 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          background: '#fff',
          borderRadius: 24,
          padding: 32,
          textAlign: 'center',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
        }}
      >
        <div
          style={{
            width: 78,
            height: 78,
            borderRadius: '50%',
            background: '#16a34a',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 22px',
            fontSize: 40,
            fontWeight: 'bold',
          }}
        >
          ✓
        </div>

        <h1 style={{ fontSize: 28, marginBottom: 10, color: '#111827' }}>
          Agendamento confirmado!
        </h1>

        <p style={{ color: '#4b5563', fontSize: 16, lineHeight: 1.6 }}>
          Seu pagamento foi aprovado e o agendamento foi confirmado com sucesso.
        </p>

        {agendamento ? (
          <>
            <div
              style={{
                marginTop: 26,
                padding: 20,
                borderRadius: 18,
                background: '#f9fafb',
                textAlign: 'left',
                border: '1px solid #e5e7eb',
              }}
            >
              <p><strong>Cliente:</strong> {nomeCliente}</p>
              <p><strong>Serviço:</strong> {servico}</p>
              <p><strong>Data:</strong> {data}</p>
              <p><strong>Horário:</strong> {hora}</p>
              <p><strong>Status:</strong> {agendamento.status}</p>
              <p><strong>Pagamento:</strong> {agendamento.statusPagamento}</p>
            </div>

            <a
              href={linkWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                marginTop: 24,
                background: '#22c55e',
                color: '#fff',
                padding: '15px 20px',
                borderRadius: 14,
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 'bold',
                boxShadow: '0 10px 20px rgba(34, 197, 94, 0.25)',
              }}
            >
              Enviar confirmação no WhatsApp
            </a>
          </>
        ) : (
          <p style={{ color: '#777', fontSize: 14, marginTop: 18 }}>
            Não conseguimos carregar os detalhes do agendamento.
          </p>
        )}
      </div>
    </main>
  );
}