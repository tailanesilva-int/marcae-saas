'use client';

import { useState } from 'react';

export default function BookingWidget({ empresa }: { empresa: any }) {
  const hoje = new Date().toISOString().split('T')[0];

  const [servicoId, setServicoId] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [slotSelecionado, setSlotSelecionado] = useState('');
  const [msg, setMsg] = useState('');
  const [agendamentoConfirmado, setAgendamentoConfirmado] = useState<any>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteValidado, setClienteValidado] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(false);

  const [cliente, setCliente] = useState({
    nome: '',
    cpf: '',
    whatsapp: '',
    dataNascimento: '',
  });

  const servicoSelecionado = empresa?.servicos?.find(
    (s: any) => s.id === servicoId
  );

  const profissionalSelecionado = empresa?.profissionais?.find(
    (p: any) => p.id === profissionalId
  );

  function limparCpf(cpf: string) {
    return cpf.replace(/\D/g, '');
  }

  function formatarDataParaInput(data: string) {
    if (!data) return '';

    if (/^\d{4}-\d{2}-\d{2}/.test(data)) {
      return data.slice(0, 10);
    }

    const partesDataBrasil = data.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

    if (partesDataBrasil) {
      const [, dia, mes, ano] = partesDataBrasil;
      return `${ano}-${mes}-${dia}`;
    }

    const dataObj = new Date(data);

    if (isNaN(dataObj.getTime())) return '';

    return dataObj.toISOString().split('T')[0];
  }

  function alterarCpf(valor: string) {
    setCliente({
      nome: '',
      cpf: valor,
      whatsapp: '',
      dataNascimento: '',
    });

    setClienteValidado(false);
    setClienteEncontrado(false);
    setMsg('');
  }

  async function buscarClientePorCpf() {
    setMsg('');
    setBuscandoCliente(true);
    setClienteValidado(false);
    setClienteEncontrado(false);

    const cpfLimpo = limparCpf(cliente.cpf);

    if (!cpfLimpo) {
      setBuscandoCliente(false);
      setMsg('Informe o CPF para continuar.');
      return;
    }

    if (cpfLimpo.length !== 11) {
      setBuscandoCliente(false);
      setMsg('Informe um CPF válido com 11 números.');
      return;
    }

    try {
      const params = new URLSearchParams({
        empresaId: empresa.id,
        cpf: cpfLimpo,
      });

      const res = await fetch(`/api/v1/customers/by-cpf?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || 'Erro ao buscar cliente pelo CPF.');
        return;
      }

      if (data.cliente) {
        setCliente({
          nome: data.cliente.nome || '',
          cpf: data.cliente.cpf || cpfLimpo,
          whatsapp: data.cliente.whatsapp || '',
          dataNascimento: formatarDataParaInput(
            data.cliente.dataNascimento || ''
          ),
        });

        setClienteEncontrado(true);
        setClienteValidado(true);
        setMsg('Cliente encontrado! Conferimos seus dados para continuar.');
        return;
      }

      setCliente({
        nome: '',
        cpf: cpfLimpo,
        whatsapp: '',
        dataNascimento: '',
      });

      setClienteEncontrado(false);
      setClienteValidado(true);
      setMsg(
        'Não encontramos cadastro com esse CPF. Preencha seus dados para continuar.'
      );
    } catch {
      setMsg('Erro ao conectar com a API de clientes.');
    } finally {
      setBuscandoCliente(false);
    }
  }

  async function buscarHorarios() {
    setMsg('');
    setSlots([]);
    setSlotSelecionado('');
    setClienteValidado(false);
    setClienteEncontrado(false);
    setCliente({
      nome: '',
      cpf: '',
      whatsapp: '',
      dataNascimento: '',
    });

    if (!servicoId) return setMsg('Selecione um serviço.');
    if (!profissionalId) return setMsg('Selecione um profissional.');
    if (!date) return setMsg('Escolha a data de agendamento.');

    if (date < hoje) {
      setMsg('Não é possível escolher uma data anterior a hoje.');
      setDate(hoje);
      return;
    }

    try {
      const params = new URLSearchParams({
        profissionalId,
        servicoId,
        data: date,
      });

      const res = await fetch(`/api/horarios-disponiveis?${params.toString()}`);
      const dataRes = await res.json();

      if (!res.ok) {
        setMsg(dataRes.error || 'Erro ao buscar horários.');
        return;
      }

      if (!dataRes.horarios || dataRes.horarios.length === 0) {
        setMsg('Nenhum horário disponível para essa data.');
        return;
      }

      setSlots(dataRes.horarios);
    } catch {
      setMsg('Erro ao conectar com a API de horários.');
    }
  }

  async function confirmarAgendamento() {
    setMsg('');

    const cpfLimpo = limparCpf(cliente.cpf);

    if (!servicoId || !profissionalId || !date || !slotSelecionado) {
      setMsg('Selecione serviço, profissional, data e horário.');
      return;
    }

    if (!clienteValidado) {
      setMsg('Valide o CPF antes de confirmar o agendamento.');
      return;
    }

    if (!cliente.nome || !cpfLimpo || !cliente.whatsapp) {
      setMsg('Preencha os dados obrigatórios.');
      return;
    }

    try {
      const res = await fetch('/api/v1/scheduling/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresa.id,
          servicoId,
          profissionalId,
          date,
          horaInicio: slotSelecionado,
          cliente: {
            ...cliente,
            cpf: cpfLimpo,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || 'Erro ao criar agendamento.');
        return;
      }

      setAgendamentoConfirmado({
        cliente: {
          ...cliente,
          cpf: cpfLimpo,
        },
        empresa,
        servico: servicoSelecionado,
        profissional: profissionalSelecionado,
        date,
        horaInicio: slotSelecionado,
        total: servicoSelecionado?.valor,
      });
    } catch {
      setMsg('Erro ao criar agendamento.');
    }
  }

  if (agendamentoConfirmado) {
    return (
      <section style={styles.successCard}>
        {empresa.logoUrl ? (
          <img
            src={empresa.logoUrl}
            alt={empresa.nome}
            style={styles.successLogo}
          />
        ) : (
          <div style={styles.successLogoPlaceholder} />
        )}

        <h2 style={styles.successTitle}>Agendamento realizado com sucesso!</h2>

        <p style={styles.successText}>
          Obrigado, {agendamentoConfirmado.cliente.nome}. Seu horário foi
          reservado.
        </p>

        <div style={styles.resumoBox}>
          <h3 style={styles.resumoTitle}>Resumo do agendamento</h3>

          <p>
            <strong>Empresa:</strong> {empresa.nome}
          </p>

          <p>
            <strong>Serviço:</strong> {agendamentoConfirmado.servico?.nome}
          </p>

          <p>
            <strong>Profissional:</strong>{' '}
            {agendamentoConfirmado.profissional?.nome}
          </p>

          <p>
            <strong>Data:</strong> {agendamentoConfirmado.date}
          </p>

          <p>
            <strong>Horário:</strong> {agendamentoConfirmado.horaInicio}
          </p>

          <p>
            <strong>Total:</strong> R$ {agendamentoConfirmado.total}
          </p>

          <p>
            <strong>Cliente:</strong> {agendamentoConfirmado.cliente.nome}
          </p>

          <p>
            <strong>WhatsApp:</strong> {agendamentoConfirmado.cliente.whatsapp}
          </p>
        </div>

        <button
          type="button"
          style={styles.primaryButton}
          onClick={async () => {
            const texto = `✅ Agendamento confirmado!

Empresa: ${empresa.nome}
Serviço: ${agendamentoConfirmado.servico?.nome}
Profissional: ${agendamentoConfirmado.profissional?.nome}
Data: ${agendamentoConfirmado.date}
Horário: ${agendamentoConfirmado.horaInicio}
Total: R$ ${agendamentoConfirmado.total}

Cliente: ${agendamentoConfirmado.cliente.nome}
WhatsApp: ${agendamentoConfirmado.cliente.whatsapp}`;

            if (navigator.share) {
              await navigator.share({
                title: 'Confirmação de agendamento',
                text: texto,
              });
            } else {
              await navigator.clipboard.writeText(texto);
              alert('Confirmação copiada para a área de transferência!');
            }
          }}
        >
          Compartilhar confirmação
        </button>
      </section>
    );
  }

  return (
    <section style={styles.card}>
      <h2 style={styles.title}>Agendar agora</h2>

      <label style={styles.label}>Serviço</label>
      <select
        style={styles.input}
        value={servicoId}
        onChange={(e) => {
          setServicoId(e.target.value);
          setSlots([]);
          setSlotSelecionado('');
          setMsg('');
        }}
      >
        <option value="">Selecione um serviço</option>

        {empresa.servicos.map((s: any) => (
          <option key={s.id} value={s.id}>
            {s.nome} - R$ {s.valor}
          </option>
        ))}
      </select>

      {servicoSelecionado && (
        <div style={styles.totalBox}>
          <span>Total</span>
          <strong>R$ {servicoSelecionado.valor}</strong>
        </div>
      )}

      <label style={styles.label}>Escolha o profissional</label>

      <div style={styles.profissionalGrid}>
        {empresa.profissionais.map((p: any) => {
          const selecionado = profissionalId === p.id;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProfissionalId(p.id);
                setSlots([]);
                setSlotSelecionado('');
                setMsg('');
              }}
              style={{
                ...styles.profissionalCard,
                borderColor: selecionado ? '#4f46e5' : '#e5e7eb',
                background: selecionado ? '#eef2ff' : '#fff',
              }}
            >
              <img
                src={p.fotoUrl || 'https://via.placeholder.com/80'}
                alt={p.nome}
                style={styles.foto}
              />

              <div style={styles.profissionalInfo}>
                <strong style={styles.nomeProfissional}>{p.nome}</strong>
                {p.bio && <p style={styles.bio}>{p.bio}</p>}
              </div>

              <span
                style={{
                  ...styles.statusProfissional,
                  background: selecionado ? '#4f46e5' : '#f3f4f6',
                  color: selecionado ? '#fff' : '#374151',
                }}
              >
                {selecionado ? 'Selecionado' : 'Selecionar'}
              </span>
            </button>
          );
        })}
      </div>

      <label style={styles.label}>Escolha data de agendamento</label>

      <input
        style={styles.input}
        type="date"
        min={hoje}
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          setSlots([]);
          setSlotSelecionado('');
          setMsg('');
        }}
      />

      <button type="button" style={styles.primaryButton} onClick={buscarHorarios}>
        Ver horários
      </button>

      {msg && <p style={styles.message}>{msg}</p>}

      {slots.length > 0 && (
        <>
          <h3 style={styles.subtitle}>Horários disponíveis</h3>

          <div style={styles.slotsGrid}>
            {slots.map((slot) => {
              const selecionado = slotSelecionado === slot;

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    setSlotSelecionado(slot);
                    setMsg('');
                    setClienteValidado(false);
                    setClienteEncontrado(false);
                    setCliente({
                      nome: '',
                      cpf: '',
                      whatsapp: '',
                      dataNascimento: '',
                    });
                  }}
                  style={{
                    ...styles.slotButton,
                    background: selecionado ? '#111827' : '#4f46e5',
                  }}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </>
      )}

      {slotSelecionado && (
        <div style={styles.dadosBox}>
          <h3 style={styles.subtitle}>Identificação do cliente</h3>

          <label style={styles.label}>Informe seu CPF para continuar</label>

          <input
            style={styles.input}
            placeholder="CPF"
            value={cliente.cpf}
            onChange={(e) => alterarCpf(e.target.value)}
          />

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={buscarClientePorCpf}
            disabled={buscandoCliente}
          >
            {buscandoCliente ? 'Buscando...' : 'Continuar'}
          </button>

          {clienteValidado && (
            <>
              <h3 style={styles.subtitle}>
                {clienteEncontrado
                  ? 'Confirme seus dados'
                  : 'Complete seu cadastro'}
              </h3>

              <input
                style={styles.input}
                placeholder="Nome"
                value={cliente.nome}
                onChange={(e) =>
                  setCliente({ ...cliente, nome: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="WhatsApp"
                value={cliente.whatsapp}
                onChange={(e) =>
                  setCliente({ ...cliente, whatsapp: e.target.value })
                }
              />

              <label style={styles.label}>Sua data de nascimento</label>

              <input
                style={styles.input}
                type="date"
                max={hoje}
                value={cliente.dataNascimento}
                onChange={(e) =>
                  setCliente({
                    ...cliente,
                    dataNascimento: e.target.value,
                  })
                }
              />

              <button
                type="button"
                style={styles.primaryButton}
                onClick={confirmarAgendamento}
              >
                Confirmar agendamento
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    borderRadius: 18,
    padding: 28,
    boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
  },
  successCard: {
    background: '#fff',
    borderRadius: 18,
    padding: 32,
    textAlign: 'center',
    boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
  },
  successLogo: {
    width: 90,
    height: 90,
    borderRadius: 18,
    objectFit: 'cover',
    margin: '0 auto 18px',
  },
  successLogoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 18,
    background: '#e5e7eb',
    margin: '0 auto 18px',
  },
  successTitle: {
    fontSize: 28,
    marginBottom: 10,
  },
  successText: {
    fontSize: 16,
    color: '#4b5563',
  },
  resumoBox: {
    marginTop: 24,
    padding: 20,
    borderRadius: 14,
    background: '#f9fafb',
    textAlign: 'left',
  },
  resumoTitle: {
    marginTop: 0,
  },
  successHint: {
    marginTop: 18,
    color: '#4b5563',
    fontWeight: 600,
  },
  title: {
    fontSize: 26,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 22,
    marginTop: 24,
    marginBottom: 14,
  },
  label: {
    display: 'block',
    fontWeight: 600,
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 46,
    border: '1px solid #d1d5db',
    borderRadius: 10,
    padding: '0 14px',
    fontSize: 15,
    marginBottom: 12,
    background: '#fff',
  },
  totalBox: {
    display: 'flex',
    justifyContent: 'space-between',
    background: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    marginBottom: 18,
    fontSize: 16,
  },
  profissionalGrid: {
    display: 'grid',
    gap: 12,
  },
  profissionalCard: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    cursor: 'pointer',
    textAlign: 'left',
  },
  foto: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
  },
  profissionalInfo: {
    flex: 1,
  },
  nomeProfissional: {
    display: 'block',
    fontSize: 17,
    marginBottom: 4,
  },
  bio: {
    margin: 0,
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 1.4,
  },
  statusProfissional: {
    padding: '10px 14px',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 13,
  },
  primaryButton: {
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '12px 18px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
  },
  secondaryButton: {
    background: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '12px 18px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 0,
    marginBottom: 8,
  },
  message: {
    fontWeight: 700,
    marginTop: 14,
  },
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: 10,
  },
  slotButton: {
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '13px 10px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  dadosBox: {
    marginTop: 24,
  },
};