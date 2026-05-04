'use client';

import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

const locales = { 'pt-BR': ptBR };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function AgendaPage() {
  const [empresaId, setEmpresaId] = useState('');
  const [eventos, setEventos] = useState<any[]>([]);
  const [eventosFiltrados, setEventosFiltrados] = useState<any[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<any>(null);
  const [pesquisa, setPesquisa] = useState('');

  const [modoReagendamento, setModoReagendamento] = useState(false);
  const [novaDataReagendamento, setNovaDataReagendamento] = useState('');
  const [horariosReagendamento, setHorariosReagendamento] = useState<string[]>([]);
  const [horarioReagendamento, setHorarioReagendamento] = useState('');
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  const [reagendando, setReagendando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    const empresaStorage = localStorage.getItem('empresaLogada');

    if (!empresaStorage) {
      window.location.href = '/login';
      return;
    }

    const empresa = JSON.parse(empresaStorage);
    setEmpresaId(empresa.id);
    carregarAgenda(empresa.id);
  }, []);

  useEffect(() => {
    filtrarEventos();
  }, [pesquisa, eventos]);

  async function carregarAgenda(idEmpresa: string) {
    const res = await fetch(`/api/dashboard/agendamentos?empresaId=${idEmpresa}`);
    const data = await res.json();

    if (data.success) {
      const eventosFormatados = data.agendamentos.map((a: any) => ({
        id: a.id,
        title: `${a.cliente?.nome || 'Cliente'} - ${a.servico?.nome || 'Serviço'}`,
        start: new Date(a.dataHoraInicio),
        end: new Date(a.dataHoraFim || a.dataHoraInicio),
        resource: a,
      }));

      setEventos(eventosFormatados);
      setEventosFiltrados(eventosFormatados);
    }
  }

  function filtrarEventos() {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) {
      setEventosFiltrados(eventos);
      return;
    }

    const termoNumerico = termo.replace(/\D/g, '');

    const filtrados = eventos.filter((evento) => {
      const a = evento.resource;

      const nomeCliente = String(a.cliente?.nome || '').toLowerCase();
      const nomeServico = String(a.servico?.nome || '').toLowerCase();
      const whatsapp = String(a.cliente?.whatsapp || '').replace(/\D/g, '');
      const cpf = String(a.cliente?.cpf || '').replace(/\D/g, '');

      return (
        nomeCliente.includes(termo) ||
        nomeServico.includes(termo) ||
        whatsapp.includes(termoNumerico) ||
        cpf.includes(termoNumerico)
      );
    });

    setEventosFiltrados(filtrados);
  }

  function dinheiro(valor: number) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  function formatarHora(data: string) {
    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function hojeFormatoInput() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  function valorPago(a: any) {
    const pagamento = a.pagamentos?.[0];

    return Number(
      pagamento?.valor ||
        pagamento?.valorPago ||
        pagamento?.transactionAmount ||
        pagamento?.amount ||
        pagamento?.valorTotal ||
        a.valorPrePago ||
        a.valorTotal ||
        0
    );
  }

  function formatarMetodoPagamento(a: any) {
    const pagamento = a.pagamentos?.[0];

    const metodo =
      pagamento?.metodoPagamento ||
      pagamento?.paymentMethodId ||
      pagamento?.payment_method_id ||
      pagamento?.payment_type_id ||
      'Não informado';

    const metodos: Record<string, string> = {
      account_money: 'Saldo Mercado Pago',
      pix: 'Pix',
      credit_card: 'Cartão de crédito',
      debit_card: 'Cartão de débito',
      ticket: 'Boleto',
      boleto: 'Boleto',
    };

    return metodos[metodo] || metodo;
  }

  function formatarCanceladoEm(data?: string | null) {
    if (!data) return 'Não informado';

    return new Date(data).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  function textoStatus(status?: string | null) {
    if (status === 'cancelado') return 'Cancelado';
    if (status === 'confirmado') return 'Confirmado';
    if (status === 'pendente') return 'Pendente';
    if (status === 'concluido') return 'Concluído';

    return status || 'Não informado';
  }

  function telefoneCliente(a: any) {
    return (
      a.cliente?.whatsapp ||
      a.cliente?.telefone ||
      a.whatsapp ||
      ''
    );
  }

  function abrirWhatsApp(a: any) {
    const telefone = telefoneCliente(a).replace(/\D/g, '');

    if (!telefone) {
      alert('Este cliente não possui WhatsApp cadastrado.');
      return;
    }

    const mensagem = `Olá, ${a.cliente?.nome || ''}! Tudo bem? Seu agendamento para ${a.servico?.nome || 'serviço'} está marcado para ${formatarData(a.dataHoraInicio)}.`;

    window.open(
      `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`,
      '_blank'
    );
  }

  function iniciarReagendamento() {
    if (!eventoSelecionado) return;

    setModoReagendamento(true);
    setNovaDataReagendamento('');
    setHorariosReagendamento([]);
    setHorarioReagendamento('');
  }

  function cancelarReagendamento() {
    setModoReagendamento(false);
    setNovaDataReagendamento('');
    setHorariosReagendamento([]);
    setHorarioReagendamento('');
  }

  async function buscarHorariosReagendamento() {
    if (!eventoSelecionado) return;

    if (!novaDataReagendamento) {
      alert('Selecione a nova data.');
      return;
    }

    if (novaDataReagendamento < hojeFormatoInput()) {
      alert('A nova data não pode ser anterior ao dia atual.');
      setNovaDataReagendamento('');
      setHorariosReagendamento([]);
      setHorarioReagendamento('');
      return;
    }

    const servicoId = eventoSelecionado.servicoId;
    const profissionalId = eventoSelecionado.profissionalId;

    if (!servicoId || !profissionalId) {
      alert('Este agendamento não possui serviço ou profissional vinculado.');
      return;
    }

    try {
      setBuscandoHorarios(true);

      const res = await fetch(
        `/api/horarios-disponiveis?profissionalId=${profissionalId}&servicoId=${servicoId}&data=${novaDataReagendamento}`
      );

      const data = await res.json();

      setHorariosReagendamento(data.horarios || []);
      setHorarioReagendamento('');
    } catch (error) {
      alert('Erro ao buscar horários disponíveis.');
    } finally {
      setBuscandoHorarios(false);
    }
  }

  async function confirmarReagendamento() {
    if (!eventoSelecionado) return;

    if (!novaDataReagendamento) {
      alert('Selecione a nova data.');
      return;
    }

    if (!horarioReagendamento) {
      alert('Selecione o novo horário.');
      return;
    }

    try {
      setReagendando(true);

      const novaDataHora = new Date(`${novaDataReagendamento}T${horarioReagendamento}`);

      const res = await fetch('/api/agendamentos/reagendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamentoId: eventoSelecionado.id,
          dataHoraInicio: novaDataHora,
          servicoId: eventoSelecionado.servicoId,
          profissionalId: eventoSelecionado.profissionalId,
          permitirMenosDe24h: true,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao reagendar atendimento.');
        return;
      }

      alert('Atendimento reagendado com sucesso!');

      setEventoSelecionado(data.agendamento);
      setModoReagendamento(false);
      setNovaDataReagendamento('');
      setHorariosReagendamento([]);
      setHorarioReagendamento('');

      if (empresaId) {
        carregarAgenda(empresaId);
      }
    } catch (error) {
      alert('Erro ao reagendar atendimento.');
    } finally {
      setReagendando(false);
    }
  }

  async function cancelarAgendamento() {
    if (!eventoSelecionado) return;

    if (eventoSelecionado.status === 'cancelado') {
      alert('Este atendimento já está cancelado.');
      return;
    }

    const motivoCancelamento =
      window.prompt('Motivo do cancelamento (opcional):') || '';

    const confirmar = window.confirm(
      `Tem certeza que deseja cancelar o atendimento de ${
        eventoSelecionado.cliente?.nome || 'cliente'
      }? O registro continuará na agenda como cancelado e o horário ficará disponível para novos agendamentos.`
    );

    if (!confirmar) return;

    try {
      setCancelando(true);

      const res = await fetch('/api/agendamentos/reagendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamentoId: eventoSelecionado.id,
          motivoCancelamento,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao cancelar atendimento.');
        return;
      }

      alert('Atendimento cancelado com sucesso!');

      setEventoSelecionado(data.agendamento);
      setModoReagendamento(false);
      setNovaDataReagendamento('');
      setHorariosReagendamento([]);
      setHorarioReagendamento('');

      if (empresaId) {
        carregarAgenda(empresaId);
      }
    } catch (error) {
      alert('Erro ao cancelar atendimento.');
    } finally {
      setCancelando(false);
    }
  }

  function corEvento(event: any) {
    const a = event.resource;

    if (a.status === 'cancelado') {
      return {
        style: {
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          color: '#fff',
          borderRadius: 10,
          fontSize: 13,
          padding: 6,
          minHeight: 54,
          lineHeight: 1.2,
        },
      };
    }

    if (a.statusPagamento === 'pago') {
      return {
        style: {
          backgroundColor: '#16a34a',
          borderColor: '#15803d',
          color: '#fff',
          borderRadius: 10,
          fontSize: 13,
          padding: 6,
          minHeight: 54,
          lineHeight: 1.2,
        },
      };
    }

    if (a.status === 'confirmado') {
      return {
        style: {
          backgroundColor: '#2563eb',
          borderColor: '#1d4ed8',
          color: '#fff',
          borderRadius: 10,
          fontSize: 13,
          padding: 6,
          minHeight: 54,
          lineHeight: 1.2,
        },
      };
    }

    return {
      style: {
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        color: '#fff',
        borderRadius: 10,
        fontSize: 13,
        padding: 6,
        minHeight: 54,
        lineHeight: 1.2,
      },
    };
  }

  function EventoCalendario({ event }: any) {
    const a = event.resource;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          lineHeight: 1.2,
          overflow: 'hidden',
        }}
      >
        <strong
          style={{
            fontSize: 13,
            fontWeight: 900,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {a.cliente?.nome || a.nomeCliente || a.clienteNome || 'Cliente'}
        </strong>

        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            opacity: 0.95,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {a.servico?.nome || a.servicoNome || 'Serviço'}
        </span>

        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            opacity: 0.85,
          }}
        >
          {formatarHora(a.dataHoraInicio)}
        </span>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', padding: 24 }}>
      <div
        style={{
          maxWidth: 1500,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>Agenda</h1>
            <p style={{ marginTop: 6, color: '#64748b' }}>
              Visualização semanal dos agendamentos
            </p>
          </div>

          <button
            onClick={() => (window.location.href = '/dashboard')}
            style={{
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              padding: '12px 18px',
              borderRadius: 12,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ← Voltar para Dashboard
          </button>
        </header>

        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar agendamentos por nome, serviço, WhatsApp ou CPF"
            style={{
              width: '100%',
              height: 46,
              borderRadius: 14,
              border: '1px solid #cbd5e1',
              padding: '0 14px',
              outline: 'none',
              fontSize: 14,
              background: '#f8fafc',
            }}
          />

          {pesquisa && (
            <button
              onClick={() => setPesquisa('')}
              style={{
                height: 46,
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                background: '#fff',
                padding: '0 14px',
                cursor: 'pointer',
                fontWeight: 700,
                color: '#334155',
              }}
            >
              Limpar
            </button>
          )}
        </div>

        <div style={{ height: '85vh' }}>
          <Calendar
            localizer={localizer}
            events={eventosFiltrados}
            startAccessor="start"
            endAccessor="end"
            defaultView={Views.WEEK}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            step={30}
            timeslots={2}
            style={{ height: '100%' }}
            eventPropGetter={corEvento}
            components={{
              event: EventoCalendario,
            }}
            messages={{
              today: 'Hoje',
              previous: 'Anterior',
              next: 'Próximo',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia',
              agenda: 'Agenda',
              date: 'Data',
              time: 'Hora',
              event: 'Agendamento',
              noEventsInRange: 'Nenhum agendamento neste período.',
            }}
            onSelectEvent={(event: any) => {
              setEventoSelecionado(event.resource);
              setModoReagendamento(false);
              setNovaDataReagendamento('');
              setHorariosReagendamento([]);
              setHorarioReagendamento('');
            }}
          />
        </div>
      </div>

      {eventoSelecionado && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.35)',
            zIndex: 999,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setEventoSelecionado(null)}
        >
          <aside
            style={{
              width: 430,
              height: '100vh',
              background: '#fff',
              padding: 28,
              boxShadow: '-20px 0 50px rgba(15, 23, 42, 0.2)',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 24,
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Detalhes</h2>
                <p style={{ marginTop: 6, color: '#64748b' }}>
                  Informações do agendamento
                </p>
              </div>

              <button
                onClick={() => setEventoSelecionado(null)}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                ×
              </button>
            </div>

            <div style={cardInfo}>
              <span style={label}>Cliente</span>
              <strong>{eventoSelecionado.cliente?.nome || 'Não informado'}</strong>
            </div>

            <div style={cardInfo}>
              <span style={label}>Serviço</span>
              <strong>{eventoSelecionado.servico?.nome || 'Não informado'}</strong>
            </div>

            <div style={cardInfo}>
              <span style={label}>Profissional</span>
              <strong>{eventoSelecionado.profissional?.nome || 'Não informado'}</strong>
            </div>

            <div style={cardInfo}>
              <span style={label}>Data e horário</span>
              <strong>{formatarData(eventoSelecionado.dataHoraInicio)}</strong>
            </div>

            <div style={cardInfo}>
              <span style={label}>Status</span>
              <strong style={{ color: eventoSelecionado.status === 'cancelado' ? '#dc2626' : '#0f172a' }}>
                {textoStatus(eventoSelecionado.status)}
              </strong>
            </div>

            {eventoSelecionado.status === 'cancelado' && (
              <>
                <div style={cardInfoCancelado}>
                  <span style={labelCancelado}>Motivo do cancelamento</span>
                  <strong>
                    {eventoSelecionado.motivoCancelamento || 'Não informado'}
                  </strong>
                </div>

                <div style={cardInfoCancelado}>
                  <span style={labelCancelado}>Cancelado em</span>
                  <strong>{formatarCanceladoEm(eventoSelecionado.canceladoEm)}</strong>
                </div>
              </>
            )}

            <div style={cardInfo}>
              <span style={label}>Pagamento</span>
              <strong>
                {eventoSelecionado.statusPagamento === 'pago'
                  ? 'Pago'
                  : eventoSelecionado.statusPagamento || 'Não informado'}
              </strong>
            </div>

            <div style={cardInfo}>
              <span style={label}>Valor pago</span>
              <strong>{dinheiro(valorPago(eventoSelecionado))}</strong>
            </div>

            <div style={cardInfo}>
              <span style={label}>Forma de pagamento</span>
              <strong>{formatarMetodoPagamento(eventoSelecionado)}</strong>
            </div>

            <button
              onClick={() => abrirWhatsApp(eventoSelecionado)}
              style={{
                width: '100%',
                marginTop: 24,
                padding: 14,
                borderRadius: 14,
                border: 'none',
                background: '#16a34a',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Enviar WhatsApp
            </button>

            {eventoSelecionado.status !== 'cancelado' && (
              <>
                <button
                  onClick={iniciarReagendamento}
                  style={{
                    width: '100%',
                    marginTop: 10,
                    padding: 14,
                    borderRadius: 14,
                    border: 'none',
                    background: '#7c3aed',
                    color: '#fff',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Reagendar atendimento
                </button>

                <button
                  onClick={cancelarAgendamento}
                  disabled={cancelando}
                  style={{
                    width: '100%',
                    marginTop: 10,
                    padding: 14,
                    borderRadius: 14,
                    border: 'none',
                    background: '#dc2626',
                    color: '#fff',
                    fontWeight: 900,
                    cursor: cancelando ? 'not-allowed' : 'pointer',
                    opacity: cancelando ? 0.65 : 1,
                  }}
                >
                  {cancelando ? 'Cancelando...' : 'Cancelar atendimento'}
                </button>
              </>
            )}

            {modoReagendamento && eventoSelecionado.status !== 'cancelado' && (
              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  borderRadius: 16,
                  border: '1px solid #ddd6fe',
                  background: '#faf5ff',
                }}
              >
                <h3 style={{ margin: '0 0 10px', color: '#4c1d95' }}>
                  Reagendar atendimento
                </h3>

                <p style={{ margin: '0 0 12px', color: '#6b21a8', fontSize: 13 }}>
                  No painel administrativo, a empresa pode reagendar mesmo com menos
                  de 24h de antecedência.
                </p>

                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#334155',
                    marginBottom: 6,
                  }}
                >
                  Nova data
                </label>

                <input
                  type="date"
                  min={hojeFormatoInput()}
                  value={novaDataReagendamento}
                  onChange={(e) => {
                    setNovaDataReagendamento(e.target.value);
                    setHorariosReagendamento([]);
                    setHorarioReagendamento('');
                  }}
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 12,
                    border: '1px solid #cbd5e1',
                    padding: '0 12px',
                    marginBottom: 10,
                  }}
                />

                <button
                  onClick={buscarHorariosReagendamento}
                  disabled={buscandoHorarios}
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 12,
                    border: 'none',
                    background: '#0f172a',
                    color: '#fff',
                    fontWeight: 800,
                    cursor: buscandoHorarios ? 'not-allowed' : 'pointer',
                    opacity: buscandoHorarios ? 0.65 : 1,
                  }}
                >
                  {buscandoHorarios ? 'Buscando horários...' : 'Buscar horários disponíveis'}
                </button>

                <div style={{ marginTop: 12 }}>
                  {horariosReagendamento.length === 0 ? (
                    <div
                      style={{
                        border: '1px dashed #c4b5fd',
                        color: '#6b21a8',
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 13,
                        textAlign: 'center',
                      }}
                    >
                      Selecione uma data e busque os horários disponíveis.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      {horariosReagendamento.map((h) => (
                        <button
                          key={h}
                          onClick={() => setHorarioReagendamento(h)}
                          style={{
                            minWidth: 72,
                            height: 38,
                            borderRadius: 12,
                            border:
                              horarioReagendamento === h
                                ? '1px solid transparent'
                                : '1px solid #cbd5e1',
                            background:
                              horarioReagendamento === h
                                ? 'linear-gradient(135deg, #7c3aed, #db2777)'
                                : '#fff',
                            color: horarioReagendamento === h ? '#fff' : '#0f172a',
                            cursor: 'pointer',
                            fontWeight: 800,
                          }}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={confirmarReagendamento}
                  disabled={reagendando}
                  style={{
                    width: '100%',
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 14,
                    border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                    color: '#fff',
                    fontWeight: 900,
                    cursor: reagendando ? 'not-allowed' : 'pointer',
                    opacity: reagendando ? 0.65 : 1,
                  }}
                >
                  {reagendando ? 'Reagendando...' : 'Confirmar reagendamento'}
                </button>

                <button
                  onClick={cancelarReagendamento}
                  style={{
                    width: '100%',
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    color: '#0f172a',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar reagendamento
                </button>
              </div>
            )}

            <button
              onClick={() => setEventoSelecionado(null)}
              style={{
                width: '100%',
                marginTop: 10,
                padding: 14,
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                background: '#fff',
                color: '#0f172a',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}

const cardInfo = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  padding: 14,
  borderRadius: 14,
  marginBottom: 12,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 4,
};

const label = {
  fontSize: 12,
  color: '#64748b',
};

const cardInfoCancelado = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  padding: 14,
  borderRadius: 14,
  marginBottom: 12,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 4,
};

const labelCancelado = {
  fontSize: 12,
  color: '#991b1b',
};