'use client';

import PremiumLayout from '@/components/layout/PremiumLayout';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
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
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [empresaId, setEmpresaId] = useState('');
  const [eventos, setEventos] = useState<any[]>([]);
  const [eventosFiltrados, setEventosFiltrados] = useState<any[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<any>(null);
  const [pesquisa, setPesquisa] = useState('');
  const [dataFiltroAgenda, setDataFiltroAgenda] = useState('');
  const [mostrarSemanaMobile, setMostrarSemanaMobile] = useState(false);

  const [modoReagendamento, setModoReagendamento] = useState(false);
  const [novaDataReagendamento, setNovaDataReagendamento] = useState('');
  const [horariosReagendamento, setHorariosReagendamento] = useState<string[]>([]);
  const [horarioReagendamento, setHorarioReagendamento] = useState('');
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  const [reagendando, setReagendando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const inputDataMobileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const empresaStorage = localStorage.getItem('empresaLogada');
    const usuarioStorage = localStorage.getItem('usuarioEmpresa');

    if (!empresaStorage) {
      window.location.href = '/login';
      return;
    }

    const emp = JSON.parse(empresaStorage);
    setEmpresa(emp);
    setUsuario(usuarioStorage ? JSON.parse(usuarioStorage) : null);
    setEmpresaId(emp.id);
    setDataFiltroAgenda(hojeFormatoInput());
    carregarAgenda(emp.id);
  }, []);

  useEffect(() => {
    filtrarEventos();
  }, [pesquisa, eventos]);

  function nomeClienteAgenda(agendamento: any) {
    return agendamento.cliente?.nome || agendamento.nomeCliente || agendamento.clienteNome || 'Cliente';
  }

  function nomeServicoAgenda(agendamento: any) {
    return agendamento.servico?.nome || agendamento.servicoNome || 'Serviço';
  }

  function chaveUnicaAgendamentoAgenda(agendamento: any) {
  if (agendamento.id) return agendamento.id;

  const clienteId =
    agendamento.clienteId ||
    agendamento.cliente?.id ||
    nomeClienteAgenda(agendamento);

  const servicoId =
    agendamento.servicoId ||
    agendamento.servico?.id ||
    nomeServicoAgenda(agendamento);

  const profissionalId =
    agendamento.profissionalId ||
    agendamento.profissional?.id ||
    agendamento.profissionalNome ||
    '';

  const dataHora = agendamento.dataHoraInicio
    ? new Date(agendamento.dataHoraInicio).toISOString()
    : '';

  return `${clienteId}-${servicoId}-${profissionalId}-${dataHora}`;
}

function removerAgendamentosDuplicadosAgenda(lista: any[]) {
  const mapa = new Map<string, any>();

  lista.forEach((agendamento) => {
    const chave = chaveUnicaAgendamentoAgenda(agendamento);
    const existente = mapa.get(chave);

    if (!existente) {
      mapa.set(chave, agendamento);
      return;
    }

    const dataAtual = new Date(agendamento.dataHoraInicio).getTime();
    const dataExistente = new Date(existente.dataHoraInicio).getTime();

    if (dataAtual > dataExistente) {
      mapa.set(chave, {
        ...agendamento,
        reagendadoVisual: true,
      });

      return;
    }

    if (
      (prioridadeStatus[agendamento.status] || 0) >
      (prioridadeStatus[existente.status] || 0)
    ) {
      mapa.set(chave, {
        ...agendamento,
        reagendadoVisual: true,
      });

      return;
    }

    mapa.set(chave, {
      ...existente,
      reagendadoVisual: true,
    });
  });

  return Array.from(mapa.values());
}

      const prioridadeStatus: Record<string, number> = {
        concluido: 5,
        em_atendimento: 4,
        confirmado: 3,
        pendente: 2,
        cancelado: 1,
      };

  async function carregarAgenda(idEmpresa: string) {
    const res = await fetch(`/api/dashboard/agendamentos?empresaId=${idEmpresa}`);
    const data = await res.json();

    if (data.success) {
      const agendamentosUnicos = removerAgendamentosDuplicadosAgenda(data.agendamentos || []);

      const eventosFormatados = agendamentosUnicos.map((a: any) => ({
        id: a.id,
        title: `${nomeClienteAgenda(a)} - ${nomeServicoAgenda(a)}`,
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

  function criarDataLocalDeInput(valor: string) {
    const [ano, mes, dia] = valor.split('-').map(Number);

    if (!ano || !mes || !dia) {
      return new Date(valor);
    }

    return new Date(ano, mes - 1, dia, 0, 0, 0, 0);
  }

  function normalizarDataLocal(data: string | Date) {
    if (data instanceof Date) {
      return data;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return criarDataLocalDeInput(data);
    }

    return new Date(data);
  }

  function formatarDataCurta(data: string | Date) {
    return normalizarDataLocal(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  function formatarDataFiltro(data: Date) {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function dataInputParaDate(valor?: string | null) {
    if (!valor) return new Date();

    return criarDataLocalDeInput(valor);
  }

  function dataParaInput(data: Date) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  function hojeFormatoInput() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  function mesmoDia(dataA: Date, dataB: Date) {
    return (
      dataA.getFullYear() === dataB.getFullYear() &&
      dataA.getMonth() === dataB.getMonth() &&
      dataA.getDate() === dataB.getDate()
    );
  }

  function statusPagamentoConfirmado(status?: string | null) {
    const statusNormalizado = String(status || '').trim().toLowerCase();

    return [
      'pago',
      'aprovado',
      'approved',
      'confirmado',
      'paid',
      'accredited',
    ].includes(statusNormalizado);
  }

  function valorPagamentoRegistro(pagamento: any) {
    return Number(
      pagamento?.valor ||
        pagamento?.valorPago ||
        pagamento?.transactionAmount ||
        pagamento?.transaction_amount ||
        pagamento?.amount ||
        pagamento?.valorTotal ||
        pagamento?.total ||
        0
    );
  }

  function valorPago(a: any) {
    const pagamentos = Array.isArray(a.pagamentos) ? a.pagamentos : [];

    const totalPagamentosConfirmados = pagamentos.reduce(
      (total: number, pagamento: any) => {
        const statusPagamento =
          pagamento.status ||
          pagamento.statusPagamento ||
          pagamento.paymentStatus ||
          pagamento.status_detail ||
          pagamento.situacao ||
          '';

        if (!statusPagamentoConfirmado(statusPagamento)) {
          return total;
        }

        return total + valorPagamentoRegistro(pagamento);
      },
      0,
    );

    if (totalPagamentosConfirmados > 0) {
      return totalPagamentosConfirmados;
    }

    if (statusPagamentoConfirmado(a.statusPagamento)) {
      return Number(a.valorTotal || a.valor || 0);
    }

    return Number(a.valorPrePago || 0);
  }

  function pagamentoConfirmadoAgenda(a: any) {
    if (statusPagamentoConfirmado(a.statusPagamento)) {
      return true;
    }

    const totalPago = valorPago(a);
    const valorTotal = Number(a.valorTotal || a.valor || 0);

    if (valorTotal > 0 && totalPago >= valorTotal) {
      return true;
    }

    return false;
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
    if (status === 'em_atendimento') return 'Em atendimento';

    return status || 'Não informado';
  }


  function promocaoFoiAplicada(a: any) {
    return Boolean(a?.promocaoId || a?.promocaoTitulo || Number(a?.valorEconomizado || 0) > 0);
  }

  function formatarTipoPromocao(tipo?: string | null) {
    if (tipo === 'servico') return 'Desconto por serviço';
    if (tipo === 'aniversariantes') return 'Promoção de aniversário';
    if (tipo === 'geral') return 'Promoção geral';

    return 'Promoção aplicada';
  }

  function formatarDescontoPromocao(a: any) {
    const desconto = Number(a?.promocaoDesconto || 0);

    if (!desconto) return '';

    if (a?.promocaoTipoDesconto === 'valor') {
      return dinheiro(desconto);
    }

    return `${desconto}%`;
  }

  function telefoneCliente(a: any) {
    return a.cliente?.whatsapp || a.cliente?.telefone || a.whatsapp || '';
  }

  function abrirWhatsApp(a: any) {
    const telefone = telefoneCliente(a).replace(/\D/g, '');

    if (!telefone) {
      alert('Este cliente não possui WhatsApp cadastrado.');
      return;
    }

    const mensagem = `Olá, ${a.cliente?.nome || ''}! Tudo bem? Seu agendamento para ${
      a.servico?.nome || 'serviço'
    } está marcado para ${formatarData(a.dataHoraInicio)}.`;

    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank');
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

    const motivoCancelamento = window.prompt('Motivo do cancelamento (opcional):') || '';

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

  const metricas = useMemo(() => {
    const hoje = new Date();
    const dataBase = dataInputParaDate(dataFiltroAgenda);
    const inicioSemana = startOfWeek(dataBase, { weekStartsOn: 0 });
    const fimSemana = new Date(
      inicioSemana.getFullYear(),
      inicioSemana.getMonth(),
      inicioSemana.getDate() + 6,
      23,
      59,
      59,
      999,
    );

    const eventosHoje = eventos.filter((e) =>
      mesmoDia(new Date(e.start), hoje),
    );

    const eventosSemana = eventos.filter((evento) => {
      const dataEvento = new Date(evento.start);

      return dataEvento >= inicioSemana && dataEvento <= fimSemana;
    });

    const concluidos = eventosSemana.filter(
      (e) => e.resource?.status === 'concluido',
    ).length;

    const cancelados = eventosSemana.filter(
      (e) => e.resource?.status === 'cancelado',
    ).length;

    const faturamento = eventosSemana.reduce((acc, item) => {
      const agendamento = item.resource;
      const totalPago = valorPago(agendamento);

      if (totalPago > 0) {
        return acc + totalPago;
      }

      return acc;
    }, 0);

    return {
      hoje: eventosHoje.length,
      concluidos,
      cancelados,
      faturamento,
    };
  }, [eventos, dataFiltroAgenda]);

  const eventosMobileSemana = useMemo(() => {
    const dataBase = dataInputParaDate(dataFiltroAgenda);
    const inicioSemana = startOfWeek(dataBase, { weekStartsOn: 0 });
    const fimSemana = new Date(
      inicioSemana.getFullYear(),
      inicioSemana.getMonth(),
      inicioSemana.getDate() + 6,
      23,
      59,
      59,
      999,
    );

    return eventosFiltrados
      .filter((evento) => {
        const dataEvento = new Date(evento.start);

        return dataEvento >= inicioSemana && dataEvento <= fimSemana;
      })
      .sort(
        (a, b) =>
          new Date(a.start).getTime() - new Date(b.start).getTime(),
      );
  }, [eventosFiltrados, dataFiltroAgenda]);

  const eventosMobileDiaSelecionado = useMemo(() => {
    const dataSelecionada = dataInputParaDate(dataFiltroAgenda);

    return eventosFiltrados
      .filter((evento) => mesmoDia(new Date(evento.start), dataSelecionada))
      .sort(
        (a, b) =>
          new Date(a.start).getTime() - new Date(b.start).getTime(),
      );
  }, [eventosFiltrados, dataFiltroAgenda]);

  const metricasMobileDiaSelecionado = useMemo(() => {
    const finalizados = eventosMobileDiaSelecionado.filter(
      (evento) => evento.resource?.status === 'concluido',
    ).length;

    const faturamento = eventosMobileDiaSelecionado.reduce((acc, item) => {
      const agendamento = item.resource;
      const totalPago = valorPago(agendamento);

      if (totalPago > 0) {
        return acc + totalPago;
      }

      return acc;
    }, 0);

    return {
      agendamentos: eventosMobileDiaSelecionado.length,
      finalizados,
      faturamento,
    };
  }, [eventosMobileDiaSelecionado]);

  function corEvento(event: any) {
    const a = event.resource;

    if (a.status === 'cancelado') {
      return {
        style: {
          background:
            'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(127,29,29,0.95))',
          border: '1px solid rgba(252,165,165,0.18)',
          color: '#fff',
          borderRadius: 18,
          padding: 8,
          boxShadow: '0 12px 24px rgba(239,68,68,0.22)',
        },
      };
    }

    if (a.statusPagamento === 'pago') {
      return {
        style: {
          background:
            'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))',
          border: '1px solid rgba(167,243,208,0.18)',
          color: '#fff',
          borderRadius: 18,
          padding: 8,
          boxShadow: '0 12px 24px rgba(16,185,129,0.22)',
        },
      };
    }

    if (a.status === 'confirmado') {
      return {
        style: {
          background:
            'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(37,99,235,0.95))',
          border: '1px solid rgba(191,219,254,0.18)',
          color: '#fff',
          borderRadius: 18,
          padding: 8,
          boxShadow: '0 12px 24px rgba(59,130,246,0.22)',
        },
      };
    }

    return {
      style: {
        background:
          'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(217,119,6,0.95))',
        border: '1px solid rgba(253,224,71,0.18)',
        color: '#fff',
        borderRadius: 18,
        padding: 8,
        boxShadow: '0 12px 24px rgba(245,158,11,0.22)',
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
          gap: 4,
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
            fontWeight: 900,
            opacity: 0.88,
          }}
        >
          {formatarHora(a.dataHoraInicio)}
        </span>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div style={loadingPage}>
        <div style={loadingCard}>
          <div style={loadingIcon}>📅</div>
          <strong>Carregando agenda premium...</strong>
          <span>Preparando ambiente operacional.</span>
        </div>
      </div>
    );
  }

  const corPrimaria = empresa.corSidebar || '#7c3aed';
  const corSecundaria = empresa.corSecundaria || '#06b6d4';
  const dataBaseAgenda = dataInputParaDate(dataFiltroAgenda);
  const inicioSemanaAgenda = startOfWeek(dataBaseAgenda, { weekStartsOn: 0 });
  const fimSemanaAgenda = new Date(
    inicioSemanaAgenda.getFullYear(),
    inicioSemanaAgenda.getMonth(),
    inicioSemanaAgenda.getDate() + 6,
  );

  const dataSelecionadaMobile = dataInputParaDate(dataFiltroAgenda);
  const diasMobileAgenda = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((dia, index) => {
    const data = new Date(
      inicioSemanaAgenda.getFullYear(),
      inicioSemanaAgenda.getMonth(),
      inicioSemanaAgenda.getDate() + index,
    );

    return {
      dia,
      data,
      dataInput: dataParaInput(data),
      numero: data.getDate(),
      ativo: mesmoDia(data, dataSelecionadaMobile),
    };
  });

  const nomeDiaMobile = dataSelecionadaMobile.toLocaleDateString('pt-BR', {
    weekday: 'long',
  });

  function navegarDiaMobile(direcao: 'anterior' | 'proximo') {
    const dataAtual = dataInputParaDate(dataFiltroAgenda);
    const novaData = new Date(
      dataAtual.getFullYear(),
      dataAtual.getMonth(),
      dataAtual.getDate() + (direcao === 'proximo' ? 1 : -1),
    );

    setDataFiltroAgenda(dataParaInput(novaData));
  }

  function abrirSeletorDataMobile() {
    const input = inputDataMobileRef.current;

    if (!input) return;

    const inputComPicker = input as HTMLInputElement & {
      showPicker?: () => void;
    };

    if (typeof inputComPicker.showPicker === 'function') {
      inputComPicker.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  return (
    <PremiumLayout empresa={empresa} usuario={usuario}>
      <>
        <style jsx global>{`
          .rbc-calendar {
            background: transparent;
            color: #fff;
            border: none;
          }

          .rbc-toolbar {
            margin-bottom: 22px;
            gap: 12px;
            flex-wrap: wrap;
          }

          .rbc-toolbar button {
            background: rgba(255,255,255,0.05) !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
            color: #fff !important;
            border-radius: 14px !important;
            padding: 10px 16px !important;
            font-weight: 800 !important;
          }

          .rbc-toolbar button.rbc-active {
            background: linear-gradient(135deg, ${corPrimaria}, ${corSecundaria}) !important;
            border: none !important;
          }

          .rbc-toolbar-label {
            color: #fff;
            font-size: 22px;
            font-weight: 900;
          }

          .rbc-header {
            background: rgba(255,255,255,0.04);
            color: #cbd5e1;
            border-color: rgba(255,255,255,0.08) !important;
            padding: 14px 6px;
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .08em;
          }

          .rbc-time-view,
          .rbc-month-view {
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 22px;
            overflow: hidden;
            background: rgba(15,23,42,0.74);
            backdrop-filter: blur(14px);
          }

          .rbc-time-content,
          .rbc-timeslot-group,
          .rbc-time-header-content,
          .rbc-day-bg,
          .rbc-month-row,
          .rbc-row-content,
          .rbc-row-bg {
            border-color: rgba(255,255,255,0.06) !important;
          }

          .rbc-time-slot {
            color: #64748b;
          }

          .rbc-label {
            color: #94a3b8;
            font-size: 12px;
            font-weight: 700;
          }

          .rbc-today {
            background: rgba(124,58,237,0.10) !important;
          }

          .rbc-off-range-bg {
            background: rgba(255,255,255,0.02);
          }

          .rbc-event {
            border: none !important;
          }

          .rbc-current-time-indicator {
            background-color: #22c55e;
            height: 3px;
          }

          .agenda-input-data-compacto-responsive::-webkit-calendar-picker-indicator {
            opacity: 0 !important;
            display: none !important;
            cursor: pointer !important;
          }

          .agenda-input-data-compacto-responsive::-webkit-datetime-edit {
            color: #fff !important;
          }

          .agenda-drawer-responsive small {
            display: block;
            color: #94a3b8;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .06em;
            line-height: 1.15;
          }

          .agenda-drawer-responsive strong {
            display: block;
            min-width: 0;
            overflow-wrap: anywhere;
            line-height: 1.18;
          }

          @media (max-width: 900px) {
            .desktop-calendar {
              display: none;
            }

            .mobile-lista {
              display: flex;
            }

            html,
            body {
              width: 100% !important;
              max-width: 100% !important;
              overflow-x: hidden !important;
              overscroll-behavior-x: none !important;
            }

            body > div,
            body main {
              max-width: 100vw !important;
              overflow-x: hidden !important;
            }

            .agenda-page-responsive {
              width: 100% !important;
              max-width: 100% !important;
              padding: 14px 12px 120px !important;
              min-height: 100dvh !important;
              overflow-x: hidden !important;
              box-sizing: border-box !important;
            }

            .agenda-page-responsive *,
            .agenda-page-responsive *::before,
            .agenda-page-responsive *::after {
              box-sizing: border-box !important;
            }

            .agenda-container-responsive {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              overflow-x: hidden !important;
            }

            .agenda-header-responsive {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              padding: 14px !important;
              border-radius: 22px !important;
              margin-bottom: 12px !important;
              align-items: stretch !important;
              gap: 12px !important;
              overflow: hidden !important;
            }

            .agenda-header-conteudo-responsive {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              align-items: flex-start !important;
              gap: 14px !important;
              overflow: hidden !important;
            }

            .agenda-header-conteudo-responsive > div:last-child {
              min-width: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }

            .agenda-logo-responsive {
              width: 46px !important;
              height: 46px !important;
              border-radius: 16px !important;
              font-size: 20px !important;
            }

            .agenda-titulo-responsive {
              max-width: 100% !important;
              font-size: 23px !important;
              line-height: 1.08 !important;
              overflow-wrap: anywhere !important;
            }

            .agenda-subtitulo-responsive {
              display: none !important;
            }

            .agenda-badges-responsive {
              width: 100% !important;
              max-width: 100% !important;
              gap: 6px !important;
              margin-top: 10px !important;
              overflow: hidden !important;
            }

            .agenda-badges-responsive span {
              max-width: 100% !important;
              min-width: 0 !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              white-space: nowrap !important;
            }

            .agenda-painel-responsive {
              width: 100% !important;
              min-width: 0 !important;
              padding: 12px 14px !important;
              border-radius: 18px !important;
              gap: 4px !important;
            }

            .agenda-painel-valor-responsive {
              font-size: 34px !important;
            }

            .agenda-metricas-responsive {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              overflow-x: hidden !important;
              gap: 8px !important;
              padding: 0 !important;
              margin-bottom: 12px !important;
            }

            .agenda-metricas-responsive > div {
              min-width: 0 !important;
              width: 100% !important;
              padding: 12px !important;
              border-radius: 18px !important;
              gap: 10px !important;
            }

            .agenda-metricas-responsive > div > div:first-child {
              width: 38px !important;
              height: 38px !important;
              border-radius: 14px !important;
              font-size: 18px !important;
            }


            .agenda-toolbar-responsive,
            .agenda-mobile-lista-responsive,
            .agenda-mobile-card-responsive,
            .agenda-drawer-responsive {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              overflow-x: hidden !important;
            }

            .agenda-toolbar-responsive {
              padding: 13px !important;
              border-radius: 20px !important;
              margin-bottom: 12px !important;
            }

            .agenda-toolbar-titulo-responsive {
              font-size: 17px !important;
            }

            .agenda-filtros-responsive {
              grid-template-columns: 1fr !important;
              gap: 10px !important;
            }

            .agenda-periodo-responsive {
              min-height: auto !important;
              padding: 12px 14px !important;
              line-height: 1.4 !important;
            }

            .agenda-mobile-card-responsive {
              border-radius: 18px !important;
              padding: 12px !important;
              min-height: 0 !important;
            }

            .agenda-mobile-card-responsive strong {
              line-height: 1.18 !important;
            }

            .agenda-drawer-overlay-responsive {
              justify-content: center !important;
              align-items: flex-end !important;
              padding: 0 !important;
              z-index: 3000 !important;
            }

            .agenda-drawer-responsive {
              width: 100% !important;
              max-width: 100% !important;
              height: 92dvh !important;
              border-radius: 28px 28px 0 0 !important;
              border-left: none !important;
              border-top: 1px solid rgba(255,255,255,0.12) !important;
              padding: 22px 18px 120px !important;
            }

            .agenda-drawer-title-responsive {
              font-size: 25px !important;
            }

            .agenda-financeiro-responsive,
            .agenda-promo-grid-responsive {
              grid-template-columns: 1fr !important;
            }
          }


            .agenda-mobile-dia-card-responsive {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              overflow-x: hidden !important;
            }

            .agenda-mobile-dias-scroller-responsive {
              display: flex !important;
              overflow-x: auto !important;
              overflow-y: hidden !important;
              scroll-snap-type: x proximity !important;
              padding-bottom: 4px !important;
              -webkit-overflow-scrolling: touch !important;
            }

            .agenda-mobile-dias-scroller-responsive > button {
              flex: 0 0 58px !important;
              min-width: 58px !important;
              scroll-snap-align: start !important;
            }

            .agenda-mobile-resumo-grid-responsive {
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 6px !important;
            }

            .agenda-mobile-dica-responsive {
              display: none !important;
            }

            .agenda-mobile-card-rodape-responsive {
              width: 100% !important;
              min-width: 0 !important;
              gap: 8px !important;
            }

            .agenda-mobile-card-rodape-responsive span {
              min-width: 0 !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              white-space: nowrap !important;
            }

            .agenda-mobile-card-rodape-responsive strong {
              flex-shrink: 0 !important;
              white-space: nowrap !important;
            }

          @media (max-width: 520px) {
            .agenda-page-responsive {
              padding-left: 8px !important;
              padding-right: 8px !important;
              max-width: 100vw !important;
            }

            .agenda-header-responsive {
              padding: 18px !important;
            }

            .agenda-header-conteudo-responsive {
              flex-direction: column !important;
            }

            .agenda-titulo-responsive {
              font-size: 22px !important;
            }

            .agenda-metricas-responsive {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              overflow-x: hidden !important;
            }

            .agenda-metricas-responsive > div {
              min-width: 0 !important;
              width: 100% !important;
            }

            .agenda-badges-responsive span {
              width: 100% !important;
              justify-content: center !important;
              text-align: center !important;
            }

            .agenda-mobile-header-responsive {
              align-items: flex-start !important;
              flex-direction: column !important;
            }

            .agenda-section-title-responsive {
              font-size: 22px !important;
            }

            .agenda-mobile-hora-responsive {
              font-size: 20px !important;
            }
          }

          @media (min-width: 901px) {
            .mobile-lista {
              display: none;
            }
          }

          @media (max-width: 900px) {
            .agenda-header-compact-premium {
              background:
                linear-gradient(180deg, rgba(15,23,42,0.96), rgba(2,6,23,0.98)) !important;
              box-shadow: 0 16px 45px rgba(0,0,0,0.24) !important;
            }

            .agenda-header-responsive {
              padding: 13px !important;
              border-radius: 22px !important;
              margin-bottom: 10px !important;
            }

            .agenda-header-conteudo-responsive {
              flex-direction: row !important;
              align-items: center !important;
              justify-content: space-between !important;
            }

            .agenda-logo-responsive {
              width: 50px !important;
              height: 50px !important;
              border-radius: 17px !important;
            }

            .agenda-titulo-responsive {
              font-size: 25px !important;
            }

            .agenda-badges-responsive {
              margin-top: 10px !important;
            }

            .agenda-painel-responsive {
              display: none !important;
            }

            .agenda-metricas-responsive {
              gap: 9px !important;
              margin-bottom: 10px !important;
            }

            .agenda-metricas-responsive > div {
              min-height: 118px !important;
              padding: 12px !important;
              align-items: flex-start !important;
            }

            .agenda-metricas-responsive > div > div:last-child {
              min-width: 0 !important;
            }

            .agenda-metricas-responsive strong {
              font-size: 24px !important;
              line-height: 1.05 !important;
              white-space: normal !important;
              word-break: break-word !important;
            }

            .agenda-metricas-responsive small {
              font-size: 12px !important;
              line-height: 1.2 !important;
              margin-top: 5px !important;
            }

            .agenda-toolbar-responsive {
              padding: 11px !important;
              border-radius: 20px !important;
              margin-bottom: 10px !important;
            }

            .agenda-periodo-responsive {
              justify-content: center !important;
              text-align: center !important;
              font-size: 11px !important;
              min-height: 34px !important;
              padding: 8px 10px !important;
            }

            .agenda-mobile-dia-card-responsive {
              padding: 10px !important;
              border-radius: 18px !important;
              box-shadow: none !important;
              margin-bottom: 0 !important;
            }

            .agenda-mobile-dias-scroller-responsive {
              gap: 6px !important;
              margin-bottom: 8px !important;
            }

            .agenda-mobile-dias-scroller-responsive > button {
              flex-basis: 52px !important;
              min-width: 52px !important;
              min-height: 58px !important;
            }

            .agenda-mobile-resumo-grid-responsive {
              display: none !important;
            }

            .agenda-mobile-card-responsive {
              padding: 10px !important;
              border-radius: 16px !important;
              gap: 7px !important;
              box-shadow: none !important;
            }

            .agenda-header-conteudo-responsive {
              display: grid !important;
              grid-template-columns: minmax(0, 1fr) auto !important;
              align-items: center !important;
              gap: 10px !important;
            }

            .agenda-header-conteudo-responsive > div:first-child,
            .agenda-header-identidade-responsive {
              width: auto !important;
              max-width: 100% !important;
              min-width: 0 !important;
            }

            .agenda-header-conteudo-responsive > div:last-child,
            .agenda-header-acoes-responsive {
              width: auto !important;
              max-width: max-content !important;
              min-width: auto !important;
              flex-shrink: 0 !important;
            }

            .agenda-titulo-responsive {
              white-space: nowrap !important;
              word-break: normal !important;
              overflow-wrap: normal !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }

            .agenda-header-mini-stat-responsive span,
            .agenda-header-mini-stat-responsive strong {
              white-space: nowrap !important;
            }

            .agenda-badges-responsive strong,
            .agenda-badges-responsive small {
              display: block !important;
              min-width: 0 !important;
              max-width: 100% !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              white-space: nowrap !important;
            }


            .agenda-header-info-grid-responsive {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 8px !important;
              min-width: 0 !important;
              overflow: hidden !important;
            }

            .agenda-header-info-card-responsive {
              min-width: 0 !important;
              width: 100% !important;
              padding: 9px !important;
              gap: 7px !important;
              overflow: hidden !important;
            }

            .agenda-header-info-card-responsive > span {
              width: 28px !important;
              height: 28px !important;
              min-width: 28px !important;
              border-radius: 11px !important;
              font-size: 14px !important;
            }

            .agenda-header-info-card-responsive > div {
              min-width: 0 !important;
              width: 100% !important;
              overflow: hidden !important;
            }

            .agenda-header-info-card-responsive strong {
              font-size: 12px !important;
              line-height: 1.12 !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }

            .agenda-header-info-card-responsive small {
              font-size: 10.5px !important;
              line-height: 1.15 !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }

            .agenda-toolbar-busca-data-responsive {
              grid-template-columns: 1fr !important;
              gap: 8px !important;
            }

            .agenda-busca-compacta-responsive {
              height: 44px !important;
              border-radius: 15px !important;
              padding: 0 10px !important;
            }

            .agenda-data-compacta-responsive {
              height: 46px !important;
              border-radius: 15px !important;
              grid-template-columns: 38px minmax(0, 1fr) 38px !important;
            }

            .agenda-input-data-label-responsive {
              width: 100% !important;
              min-width: 0 !important;
              gap: 7px !important;
            }

            .agenda-input-data-compacto-responsive {
              width: 118px !important;
              min-width: 0 !important;
              max-width: 100% !important;
              text-align: center !important;
              color-scheme: dark !important;
            }

            .agenda-input-data-compacto-responsive::-webkit-calendar-picker-indicator {
              opacity: 0 !important;
              display: none !important;
              cursor: pointer !important;
            }
          }

          @media (max-width: 520px) {
            .agenda-page-responsive {
              padding: 8px 8px 108px !important;
            }

            .agenda-header-responsive {
              padding: 12px !important;
            }

            .agenda-header-conteudo-responsive {
              grid-template-columns: minmax(0, 1fr) auto !important;
              flex-direction: row !important;
            }

            .agenda-header-mini-stat-responsive {
              display: none !important;
            }

            .agenda-header-mini-button-responsive {
              width: 44px !important;
              min-width: 44px !important;
              padding: 0 !important;
              font-size: 11px !important;
            }

            .agenda-titulo-responsive {
              font-size: 22px !important;
            }

            .agenda-badges-responsive span {
              width: auto !important;
              justify-content: flex-start !important;
              text-align: left !important;
            }


            .agenda-header-info-grid-responsive {
              gap: 6px !important;
            }

            .agenda-header-info-card-responsive {
              padding: 8px !important;
              gap: 6px !important;
              border-radius: 14px !important;
            }

            .agenda-header-info-card-responsive > span {
              width: 26px !important;
              height: 26px !important;
              min-width: 26px !important;
              font-size: 13px !important;
            }

            .agenda-header-info-card-responsive strong {
              font-size: 11.5px !important;
            }

            .agenda-header-info-card-responsive small {
              font-size: 10px !important;
            }

            .agenda-metricas-responsive > div {
              min-height: 108px !important;
              padding: 10px !important;
            }

            .agenda-metricas-responsive strong {
              font-size: 21px !important;
              letter-spacing: -0.04em !important;
              white-space: normal !important;
              overflow-wrap: anywhere !important;
            }

            .agenda-metricas-responsive small {
              font-size: 11px !important;
              line-height: 1.12 !important;
            }

            .agenda-toolbar-responsive {
              padding: 9px !important;
            }

            .agenda-toolbar-busca-data-responsive {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 900px) {
            .agenda-header-info-grid-responsive {
              display: none !important;
            }

            .agenda-metricas-responsive > div {
              min-height: 74px !important;
              padding: 9px !important;
              border-radius: 15px !important;
              gap: 3px !important;
            }

            .agenda-metricas-responsive > div > div:first-child {
              width: auto !important;
              height: auto !important;
            }

            .agenda-metricas-responsive strong {
              font-size: 20px !important;
              line-height: 1 !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }

            .agenda-metricas-responsive small {
              font-size: 10px !important;
              line-height: 1.1 !important;
              margin-top: 0 !important;
            }

            .agenda-toolbar-responsive {
              margin-bottom: 8px !important;
            }

            .agenda-periodo-responsive {
              min-height: 28px !important;
              font-size: 10.5px !important;
              padding: 6px 8px !important;
            }

            .agenda-mobile-card-responsive {
              padding: 9px !important;
              border-radius: 15px !important;
              gap: 6px !important;
            }

            .agenda-mobile-hora-responsive {
              font-size: 16px !important;
            }
          }


          @media (max-width: 900px) {
            .agenda-header-responsive {
              padding: 10px 12px !important;
              border-radius: 18px !important;
              margin-bottom: 8px !important;
            }

            .agenda-logo-responsive {
              display: none !important;
            }

            .agenda-titulo-responsive {
              font-size: 21px !important;
              line-height: 1 !important;
            }

            .agenda-header-conteudo-responsive {
              gap: 8px !important;
            }

            .agenda-header-mini-button-responsive {
              height: 38px !important;
              border-radius: 14px !important;
              padding: 0 12px !important;
            }

            .agenda-metricas-responsive {
              display: none !important;
            }

            .agenda-toolbar-responsive {
              padding: 9px !important;
              border-radius: 18px !important;
              gap: 8px !important;
            }

            .agenda-toolbar-responsive > div:first-child {
              gap: 7px !important;
            }

            .agenda-toolbar-responsive > div:first-child button {
              min-height: 38px !important;
              padding: 0 10px !important;
              border-radius: 13px !important;
              font-size: 11px !important;
            }

            .agenda-busca-compacta-responsive,
            .agenda-data-compacta-responsive {
              height: 40px !important;
              border-radius: 13px !important;
            }

            .agenda-periodo-responsive {
              display: none !important;
            }

            .agenda-mobile-dia-card-responsive {
              margin-bottom: 8px !important;
              padding: 8px !important;
              border-radius: 16px !important;
            }

            .agenda-mobile-dias-scroller-responsive > button {
              min-height: 50px !important;
              flex-basis: 48px !important;
              min-width: 48px !important;
              border-radius: 13px !important;
            }

            .agenda-mobile-card-responsive {
              padding: 8px !important;
              border-radius: 14px !important;
              gap: 5px !important;
              min-height: 78px !important;
            }

            .agenda-mobile-hora-responsive {
              font-size: 15px !important;
            }

            .agenda-mobile-card-rodape-responsive {
              margin-top: 3px !important;
            }

            .agenda-mobile-card-rodape-responsive span,
            .agenda-mobile-card-rodape-responsive strong {
              font-size: 11px !important;
            }
          }


        `}</style>

        <main className="agenda-page-responsive" style={page}>
          <div className="agenda-container-responsive" style={container}>
            <header
              className="agenda-header-responsive agenda-header-compact-premium"
              style={headerPremium}
            >
              <div style={headerOverlay} />

              <div className="agenda-header-conteudo-responsive" style={headerConteudoCompacto}>
                <div className="agenda-header-identidade-responsive" style={headerIdentidadeAgenda}>
                  <div className="agenda-logo-responsive" style={logoHeaderCompacto}>
                    {empresa.logo ? (
                      <img
                        src={empresa.logo}
                        alt="Logo"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <span>📅</span>
                    )}
                  </div>

                  <div style={headerTituloBoxCompacto}>
                    <h1 className="agenda-titulo-responsive" style={tituloHeaderCompacto}>Agenda</h1>
                    <span style={subtituloHeaderCompacto}>{formatarDataCurta(dataFiltroAgenda)} • {metricasMobileDiaSelecionado.agendamentos} agendamentos</span>
                  </div>
                </div>

                <div className="agenda-header-acoes-responsive" style={headerAcoesCompactas}>
                  <div className="agenda-header-mini-stat-responsive" style={headerMiniStat}>
                    <span>Hoje</span>
                    <strong>{metricas.hoje}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDataFiltroAgenda(hojeFormatoInput())}
                    className="agenda-header-mini-button-responsive"
                    style={headerMiniButton}
                  >
                    Hoje
                  </button>
                </div>
              </div>

              <div className="agenda-badges-responsive agenda-header-info-grid-responsive" style={headerInfoGridCompacto}>
                <div className="agenda-header-info-card-responsive" style={headerInfoCardCompacto}>
                  <span style={headerInfoIcone}>🏢</span>
                  <div>
                    <strong>{empresa.nome}</strong>
                    <small>ID: {empresa.id?.slice?.(0, 8) || 'empresa'}</small>
                  </div>
                </div>

                <div className="agenda-header-info-card-responsive" style={headerInfoCardCompacto}>
                  <span style={headerInfoIcone}>👑</span>
                  <div>
                    <strong>{empresa.plano ? `Plano ${empresa.plano}` : 'Plano ativo'}</strong>
                    <small>
                      {empresa.assinaturaExpiraEm
                        ? `Até ${formatarDataFiltro(new Date(empresa.assinaturaExpiraEm))}`
                        : 'Tempo real'}
                    </small>
                  </div>
                </div>
              </div>
            </header>
            <section className="agenda-metricas-responsive" style={metricasGrid}>
              <MetricCard titulo="Hoje" valor={String(metricas.hoje)} descricao="Agenda" icone="📅" cor={corPrimaria} />
              <MetricCard titulo="Concluídos" valor={String(metricas.concluidos)} descricao="Semana" icone="✅" cor="#22c55e" />
              <MetricCard titulo="Cancelados" valor={String(metricas.cancelados)} descricao="Semana" icone="🚫" cor="#ef4444" />
              <MetricCard
  titulo="Recebido"
  valor={dinheiro(metricas.faturamento)}
  descricao="Semana"
  icone="💰"
  cor="#f59e0b"
/>
            </section>

            <section className="agenda-toolbar-responsive" style={toolbarAgendaCompacto}>
              <div style={toolbarFiltrosRapidos}>
                <button
                  type="button"
                  onClick={() => setDataFiltroAgenda(hojeFormatoInput())}
                  style={{
                    ...botaoFiltroRapidoAgenda,
                    background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.18)',
                  }}
                >
                  Hoje
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const novaData = new Date();
                    novaData.setDate(novaData.getDate() + 7);
                    setDataFiltroAgenda(dataParaInput(novaData));
                  }}
                  style={botaoFiltroRapidoAgenda}
                >
                  Semana
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const novaData = new Date();
                    novaData.setDate(novaData.getDate() + 30);
                    setDataFiltroAgenda(dataParaInput(novaData));
                  }}
                  style={botaoFiltroRapidoAgenda}
                >
                  Mês
                </button>

                <button
                  type="button"
                  onClick={() => setMostrarSemanaMobile(!mostrarSemanaMobile)}
                  style={botaoFiltroRapidoAgenda}
                >
                  {mostrarSemanaMobile ? 'Ocultar' : 'Calendário'}
                </button>
              </div>

              <div className="agenda-toolbar-busca-data-responsive" style={toolbarBuscaDataCompacta}>
                <div className="agenda-busca-compacta-responsive" style={buscaCompactaBox}>
                  <span style={buscaCompactaIcone}>⌕</span>
                  <input
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                    placeholder="Buscar por cliente, serviço, WhatsApp ou CPF"
                    style={inputBuscaAgendaCompacto}
                  />

                  {pesquisa && (
                    <button onClick={() => setPesquisa('')} style={botaoLimparBuscaCompacto}>
                      ×
                    </button>
                  )}
                </div>

                <div className="agenda-data-compacta-responsive" style={dataCompactaBox}>
                  <button
                    type="button"
                    onClick={() => navegarDiaMobile('anterior')}
                    style={botaoDataCompacta}
                    aria-label="Dia anterior"
                  >
                    ‹
                  </button>

                  <div className="agenda-input-data-label-responsive" style={inputDataCompactaLabel}>
                    <input
                      ref={inputDataMobileRef}
                      type="date"
                      value={dataFiltroAgenda}
                      onChange={(e) => setDataFiltroAgenda(e.target.value)}
                      className="agenda-input-data-compacto-responsive"
                      style={inputDataAgendaCompacto}
                      aria-label="Selecionar data da agenda"
                    />

                    <button
                      type="button"
                      onClick={abrirSeletorDataMobile}
                      style={botaoCalendarioDataCompacta}
                      aria-label="Abrir calendário"
                    >
                      📅
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => navegarDiaMobile('proximo')}
                    style={botaoDataCompacta}
                    aria-label="Próximo dia"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="agenda-periodo-responsive" style={periodoAgendaTextoCompacto}>
                Semana • {formatarDataCurta(inicioSemanaAgenda)} a {formatarDataCurta(fimSemanaAgenda)}
              </div>
            </section>

            <section className="desktop-calendar" style={agendaSemanalWrapper}>
  <div style={diasNav}>
    {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia, index) => (
      <button
        key={dia}
        type="button"
        onClick={() => {
          const coluna = document.getElementById(`dia-agenda-${index}`);
          coluna?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'start',
          });
        }}
        style={botaoDiaNav}
      >
        {dia}
      </button>
    ))}
  </div>

  <div style={agendaSemanalGrid}>
    {(() => {
      const diasSemana = [
        { key: 0, nome: 'Domingo' },
        { key: 1, nome: 'Segunda' },
        { key: 2, nome: 'Terça' },
        { key: 3, nome: 'Quarta' },
        { key: 4, nome: 'Quinta' },
        { key: 5, nome: 'Sexta' },
        { key: 6, nome: 'Sábado' },
      ];

const inicioSemana = inicioSemanaAgenda;

      return diasSemana.map((dia) => {
        const dataColuna = new Date(
  inicioSemana.getFullYear(),
  inicioSemana.getMonth(),
  inicioSemana.getDate() + dia.key,
);

const eventosDia = eventosFiltrados
  .filter((evento) => {
    const dataEvento = new Date(evento.start);

    return (
      dataEvento.getFullYear() === dataColuna.getFullYear() &&
      dataEvento.getMonth() === dataColuna.getMonth() &&
      dataEvento.getDate() === dataColuna.getDate()
    );
  })
          .sort(
            (a, b) =>
              new Date(a.start).getTime() -
              new Date(b.start).getTime(),
          );

        return (
          <div id={`dia-agenda-${dia.key}`} key={dia.key} style={colunaDia}>
            <div style={headerDia}>
              <div>
  <strong style={tituloDia}>{dia.nome}</strong>
  <span style={dataDia}>
    {formatarDataCurta(
      new Date(
        inicioSemana.getFullYear(),
        inicioSemana.getMonth(),
        inicioSemana.getDate() + dia.key,
      ),
    )}
  </span>
</div>

              <span style={badgeQuantidadeDia}>
                {eventosDia.length}
              </span>
            </div>

            <div style={cardsDia}>
              {eventosDia.length === 0 ? (
                <div style={diaVazio}>
                  Nenhum agendamento
                </div>
              ) : (
                eventosDia.map((evento) => {
                  const a = evento.resource;

                  const corStatus =
                    a.status === 'cancelado'
                      ? '#ef4444'
                      : a.status === 'confirmado'
                      ? '#3b82f6'
                      : a.status === 'concluido'
                      ? '#22c55e'
                      : '#f59e0b';

                  return (
                    <button
                      key={evento.id}
                      onClick={() => {
                        setEventoSelecionado(a);
                        setModoReagendamento(false);
                        setNovaDataReagendamento('');
                        setHorariosReagendamento([]);
                        setHorarioReagendamento('');
                      }}
                      style={{
                        ...cardAgendamento,
                        borderLeft: `5px solid ${corStatus}`,
                      }}
                    >
                      <div style={cardHorario}>
                        {formatarHora(a.dataHoraInicio)}
                      </div>

                      <div style={cardConteudo}>
                        <strong style={cardCliente}>
                          {a.cliente?.nome ||
                            a.nomeCliente ||
                            'Cliente'}
                        </strong>

                        <span style={cardServico}>
                          {a.servico?.nome ||
                            a.servicoNome ||
                            'Serviço'}
                        </span>

                        <div style={badgesCard}>
                          <span style={badgeStatus(a.status)}>
                            {textoStatus(a.status)}
                          </span>
{a.reagendadoVisual && (
  <span style={badgeReagendado}>
    🔁 Reagendado
  </span>
)}

                          <span style={badgeProfissional}>
                            👤{' '}
                            {a.profissional?.nome ||
                              'Profissional'}
                          </span>

                          <span
                            style={{
                              ...badgePagamento,
                              background: pagamentoConfirmadoAgenda(a)
                                ? 'rgba(34,197,94,0.12)'
                                : 'rgba(245,158,11,0.14)',
                              color: pagamentoConfirmadoAgenda(a)
                                ? '#bbf7d0'
                                : '#fde68a',
                            }}
                          >
                            {pagamentoConfirmadoAgenda(a) ? '💰 Pago' : '⌛ Pendente'}
                          </span>

                          {promocaoFoiAplicada(a) && (
                            <span style={badgePromocaoAplicada}>
                              🎁 Promoção aplicada
                            </span>
                          )}
                        </div>

                        <div style={rodapeCard}>
                          <span>
                            ⏱️{' '}
                            {a.duracaoMin ||
                              a.servico?.duracao ||
                              60}
                            min
                          </span>

                          <strong>
                            {dinheiro(
                              a.valorTotal ||
                                a.valor ||
                                0,
                            )}
                          </strong>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );
      });
    })()}
  </div>
</section>

            <section className="mobile-lista" style={mobileLista}>
              {mostrarSemanaMobile && (
              <div className="agenda-mobile-dia-card-responsive" style={mobileAgendaDiaCard}>
                <div style={mobileAgendaDiaTopo}>
                  <button
                    type="button"
                    onClick={() => navegarDiaMobile('anterior')}
                    style={mobileSetaDia}
                    aria-label="Dia anterior"
                  >
                    ‹
                  </button>

                  <div style={mobileTituloDiaAtualBox}>
                    <strong style={mobileTituloDiaAtual}>
                      {formatarDataCurta(dataFiltroAgenda)}
                    </strong>
                    <span style={mobileSubtituloDiaAtual}>{nomeDiaMobile}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navegarDiaMobile('proximo')}
                    style={mobileSetaDia}
                    aria-label="Próximo dia"
                  >
                    ›
                  </button>
                </div>

                <div className="agenda-mobile-dias-scroller-responsive" style={mobileDiasSemanaScroller}>
                  {diasMobileAgenda.map((item) => (
                    <button
                      key={item.dataInput}
                      type="button"
                      onClick={() => setDataFiltroAgenda(item.dataInput)}
                      style={{
                        ...mobileBotaoDiaSemana,
                        background: item.ativo
                          ? `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`
                          : 'rgba(255,255,255,0.04)',
                        borderColor: item.ativo
                          ? 'rgba(255,255,255,0.24)'
                          : 'rgba(255,255,255,0.08)',
                        color: item.ativo ? '#fff' : '#cbd5e1',
                        boxShadow: item.ativo
                          ? `0 16px 34px ${corPrimaria}44`
                          : 'none',
                      }}
                    >
                      <span>{item.dia}</span>
                      <strong>{item.numero}</strong>
                    </button>
                  ))}
                </div>

                <div className="agenda-mobile-resumo-grid-responsive" style={mobileResumoDiaGrid}>
                  <div style={mobileResumoDiaItem}>
                    <strong>{metricasMobileDiaSelecionado.agendamentos}</strong>
                    <span>Agendamentos</span>
                  </div>

                  <div style={mobileResumoDiaItem}>
                    <strong>{dinheiro(metricasMobileDiaSelecionado.faturamento)}</strong>
                    <span>Recebido</span>
                  </div>

                  <div style={mobileResumoDiaItem}>
                    <strong>{metricasMobileDiaSelecionado.finalizados}</strong>
                    <span>Finalizados</span>
                  </div>
                </div>

                <div className="agenda-mobile-dica-responsive" style={mobileDicaArraste}>
                  <button
                    type="button"
                    onClick={() => navegarDiaMobile('anterior')}
                    style={mobileBotaoDicaSeta}
                    aria-label="Voltar um dia"
                  >
                    ←
                  </button>

                  <span>Deslize ou use as setas para navegar entre os dias</span>

                  <button
                    type="button"
                    onClick={() => navegarDiaMobile('proximo')}
                    style={mobileBotaoDicaSetaDestaque}
                    aria-label="Avançar um dia"
                  >
                    →
                  </button>
                </div>
              </div>

              )}

              {eventosMobileDiaSelecionado.length === 0 ? (
                <div style={emptyState}>
                  <strong>Nenhum atendimento neste dia</strong>
                  <span>Use as setas ou toque em outro dia da semana para navegar.</span>
                </div>
              ) : (
                eventosMobileDiaSelecionado.map((evento) => {
                  const a = evento.resource;

                  const corStatusMobile =
                    a.status === 'cancelado'
                      ? '#ef4444'
                      : a.status === 'confirmado'
                      ? '#3b82f6'
                      : a.status === 'concluido'
                      ? '#22c55e'
                      : '#f59e0b';

                  return (
                    <button
                      key={evento.id}
                      onClick={() => {
                        setEventoSelecionado(a);
                        setModoReagendamento(false);
                        setNovaDataReagendamento('');
                        setHorariosReagendamento([]);
                        setHorarioReagendamento('');
                      }}
                      className="agenda-mobile-card-responsive"
                      style={{
                        ...mobileCard,
                        borderLeft: `4px solid ${corStatusMobile}`,
                      }}
                    >
                      <div style={mobileCardLinhaPrincipal}>
                        <div style={mobileHoraBox}>
                          <span className="agenda-mobile-hora-responsive" style={mobileHora}>{formatarHora(a.dataHoraInicio)}</span>
                          <small style={mobileData}>{formatarDataCurta(a.dataHoraInicio)}</small>
                        </div>

                        <div style={mobileCardInfo}>
                          <strong style={mobileClienteNome}>{a.cliente?.nome || a.nomeCliente || 'Cliente'}</strong>
                          <small style={mobileServicoNome}>{a.servico?.nome || a.servicoNome || 'Serviço'}</small>

                          <div className="agenda-mobile-card-rodape-responsive" style={mobileCardRodape}>
                            <span>👤 {a.profissional?.nome || 'Profissional'}</span>
                            <strong>{dinheiro(a.valorTotal || a.valor || 0)}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={mobileStatusLinha}>
                        <span style={badgeStatus(a.status)}>{textoStatus(a.status)}</span>

                        {a.reagendadoVisual && (
                          <span style={badgeReagendado}>
                            🔁 Reagendado
                          </span>
                        )}

                        <span
                          style={{
                            ...badgePagamento,
                            background: pagamentoConfirmadoAgenda(a)
                              ? 'rgba(34,197,94,0.12)'
                              : 'rgba(245,158,11,0.14)',
                            color: pagamentoConfirmadoAgenda(a)
                              ? '#bbf7d0'
                              : '#fde68a',
                          }}
                        >
                          {pagamentoConfirmadoAgenda(a) ? '💰 Pago' : '⌛ Pendente'}
                        </span>

                        {promocaoFoiAplicada(a) && (
                          <span style={badgePromocaoAplicada}>
                            🎁 Promoção
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </section>
          </div>

          {eventoSelecionado && (
            <div className="agenda-drawer-overlay-responsive" style={drawerOverlay} onClick={() => setEventoSelecionado(null)}>
              <aside className="agenda-drawer-responsive" style={drawer} onClick={(e) => e.stopPropagation()}>
                <div style={drawerHeaderCompacto}>
                  <div style={drawerHeaderTextoCompacto}>
                    <span style={sectionEyebrow}>Detalhes do atendimento</span>
                    <h2 className="agenda-drawer-title-responsive" style={drawerTitleCompacto}>
                      {eventoSelecionado.cliente?.nome || 'Cliente'}
                    </h2>
                    <p style={drawerSubtitleCompacto}>
                      {eventoSelecionado.servico?.nome || 'Serviço'} • {formatarHora(eventoSelecionado.dataHoraInicio)}
                    </p>
                  </div>

                  <button onClick={() => setEventoSelecionado(null)} style={botaoFechar}>
                    ×
                  </button>
                </div>

                <div style={drawerResumoCompacto}>
                  <div style={drawerResumoLinha}>
                    <span style={drawerResumoIcone}>👤</span>
                    <div style={drawerResumoTexto}>
                      <small>Cliente</small>
                      <strong>{eventoSelecionado.cliente?.nome || 'Não informado'}</strong>
                    </div>
                  </div>

                  <div style={drawerResumoLinha}>
                    <span style={drawerResumoIcone}>💼</span>
                    <div style={drawerResumoTexto}>
                      <small>Serviço</small>
                      <strong>{eventoSelecionado.servico?.nome || 'Não informado'}</strong>
                    </div>
                  </div>

                  <div style={drawerResumoLinha}>
                    <span style={drawerResumoIcone}>👩‍💼</span>
                    <div style={drawerResumoTexto}>
                      <small>Profissional</small>
                      <strong>{eventoSelecionado.profissional?.nome || 'Não informado'}</strong>
                    </div>
                  </div>
                </div>

                <div style={drawerMetaGridCompacto}>
                  <div style={drawerMetaCardCompacto}>
                    <span>📅 Data e horário</span>
                    <strong>{formatarData(eventoSelecionado.dataHoraInicio)}</strong>
                  </div>

                  <div style={drawerMetaCardCompacto}>
                    <span>Status</span>
                    <strong>{textoStatus(eventoSelecionado.status)}</strong>
                  </div>
                </div>

                {eventoSelecionado.status === 'cancelado' && (
                  <div style={drawerCancelamentoCompacto}>
                    <div>
                      <span style={labelCancelado}>Motivo do cancelamento</span>
                      <strong>{eventoSelecionado.motivoCancelamento || 'Não informado'}</strong>
                    </div>

                    <div>
                      <span style={labelCancelado}>Cancelado em</span>
                      <strong>{formatarCanceladoEm(eventoSelecionado.canceladoEm)}</strong>
                    </div>
                  </div>
                )}

                <div style={drawerFinanceiroCompacto}>
                  <div style={drawerFinanceiroTopo}>
                    <span>💰 Financeiro</span>
                    <strong>{dinheiro(valorPago(eventoSelecionado))}</strong>
                  </div>

                  <div style={drawerFinanceiroListaCompacta}>
                    <div style={drawerFinanceiroLinhaCompacta}>
                      <small>Status</small>
                      <strong>{pagamentoConfirmadoAgenda(eventoSelecionado) ? 'Pago' : eventoSelecionado.statusPagamento || 'Pendente'}</strong>
                    </div>

                    <div style={drawerFinanceiroLinhaCompacta}>
                      <small>Forma de pagamento</small>
                      <strong>{formatarMetodoPagamento(eventoSelecionado)}</strong>
                    </div>
                  </div>
                </div>

                {promocaoFoiAplicada(eventoSelecionado) && (
                  <div style={promoDrawerCard}>
                    <div style={promoDrawerHeader}>
                      <span>🎁 Promoção aplicada</span>
                      <strong>
                        {eventoSelecionado.promocaoTitulo ||
                          formatarTipoPromocao(eventoSelecionado.promocaoTipo)}
                      </strong>
                    </div>

                    {eventoSelecionado.promocaoDescricao && (
                      <p style={promoDrawerDescricao}>
                        {eventoSelecionado.promocaoDescricao}
                      </p>
                    )}

                    <div className="agenda-promo-grid-responsive" style={promoDrawerGrid}>
                      <div>
                        <small>Tipo</small>
                        <strong>{formatarTipoPromocao(eventoSelecionado.promocaoTipo)}</strong>
                      </div>

                      {formatarDescontoPromocao(eventoSelecionado) && (
                        <div>
                          <small>Desconto</small>
                          <strong>{formatarDescontoPromocao(eventoSelecionado)}</strong>
                        </div>
                      )}

                      <div>
                        <small>Economia</small>
                        <strong>{dinheiro(Number(eventoSelecionado.valorEconomizado || 0))}</strong>
                      </div>
                    </div>

                    {eventoSelecionado.promocaoUsoUnicoCpf && (
                      <div style={promoUsoUnicoDrawer}>
                        🔒 Promoção válida apenas 1 vez por CPF.
                      </div>
                    )}
                  </div>
                )}

                <div style={drawerAcoesGridCompacto}>
                  <button onClick={() => abrirWhatsApp(eventoSelecionado)} style={botaoWhatsappCompacto}>
                    WhatsApp
                  </button>

                  {eventoSelecionado.status !== 'cancelado' && (
                    <button onClick={iniciarReagendamento} style={botaoReagendarCompacto}>
                      Reagendar
                    </button>
                  )}

                  {eventoSelecionado.status !== 'cancelado' && (
                    <button
                      onClick={cancelarAgendamento}
                      disabled={cancelando}
                      style={{
                        ...botaoCancelarAtendimentoCompacto,
                        opacity: cancelando ? 0.65 : 1,
                        cursor: cancelando ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {cancelando ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  )}

                  <button onClick={() => setEventoSelecionado(null)} style={botaoFecharDrawerCompacto}>
                    Fechar
                  </button>
                </div>

                {modoReagendamento && eventoSelecionado.status !== 'cancelado' && (
                  <div style={reagendamentoBox}>
                    <h3 style={reagendamentoTitulo}>Reagendar atendimento</h3>

                    <p style={reagendamentoTexto}>
                      No painel administrativo, a empresa pode reagendar mesmo com menos de 24h de antecedência.
                    </p>

                    <label style={label}>Nova data</label>

                    <input
                      type="date"
                      min={hojeFormatoInput()}
                      value={novaDataReagendamento}
                      onChange={(e) => {
                        setNovaDataReagendamento(e.target.value);
                        setHorariosReagendamento([]);
                        setHorarioReagendamento('');
                      }}
                      style={inputDrawer}
                    />

                    <button
                      onClick={buscarHorariosReagendamento}
                      disabled={buscandoHorarios}
                      style={botaoBuscarHorario}
                    >
                      {buscandoHorarios ? 'Buscando horários...' : 'Buscar horários disponíveis'}
                    </button>

                    <div style={horariosGrid}>
                      {horariosReagendamento.length === 0 ? (
                        <div style={emptyHorarios}>
                          Selecione uma data e busque os horários disponíveis.
                        </div>
                      ) : (
                        horariosReagendamento.map((h) => (
                          <button
                            key={h}
                            onClick={() => setHorarioReagendamento(h)}
                            style={{
                              ...botaoHorario,
                              background:
                                horarioReagendamento === h
                                  ? `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`
                                  : 'rgba(255,255,255,0.05)',
                            }}
                          >
                            {h}
                          </button>
                        ))
                      )}
                    </div>

                    <button
                      onClick={confirmarReagendamento}
                      disabled={reagendando}
                      style={{
                        ...botaoConfirmarReagendamento,
                        background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                      }}
                    >
                      {reagendando ? 'Reagendando...' : 'Confirmar reagendamento'}
                    </button>

                    <button onClick={cancelarReagendamento} style={botaoCancelarReagendamento}>
                      Cancelar reagendamento
                    </button>
                  </div>
                )}
              </aside>
            </div>
          )}
        </main>
      </>
    </PremiumLayout>
  );
}



const drawerHeaderCompacto: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 14,
  marginBottom: 14,
};

const drawerHeaderTextoCompacto: CSSProperties = {
  minWidth: 0,
};

const drawerTitleCompacto: CSSProperties = {
  margin: '4px 0 0',
  fontSize: 26,
  lineHeight: 1,
  fontWeight: 950,
  color: '#fff',
  letterSpacing: '-0.04em',
};

const drawerSubtitleCompacto: CSSProperties = {
  margin: '8px 0 0',
  color: '#94a3b8',
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.35,
};

const drawerResumoCompacto: CSSProperties = {
  borderRadius: 22,
  padding: 14,
  marginBottom: 10,
  background:
    'radial-gradient(circle at top left, rgba(124,58,237,0.18), transparent 44%), rgba(15,23,42,0.78)',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'grid',
  gap: 10,
};

const drawerResumoLinha: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '34px minmax(0, 1fr)',
  gap: 10,
  alignItems: 'center',
  minWidth: 0,
};

const drawerResumoIcone: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 13,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  fontSize: 15,
};

const drawerResumoTexto: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  color: '#fff',
};

const drawerMetaGridCompacto: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
  marginBottom: 10,
};

const drawerMetaCardCompacto: CSSProperties = {
  borderRadius: 18,
  padding: 13,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.075)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  color: '#fff',
  minWidth: 0,
};

const drawerCancelamentoCompacto: CSSProperties = {
  borderRadius: 18,
  padding: 13,
  marginBottom: 10,
  background: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.18)',
  display: 'grid',
  gap: 10,
  color: '#fecaca',
};

const drawerFinanceiroCompacto: CSSProperties = {
  borderRadius: 20,
  padding: 14,
  marginBottom: 10,
  background:
    'radial-gradient(circle at top left, rgba(34,197,94,0.18), transparent 48%), rgba(6,78,59,0.18)',
  border: '1px solid rgba(34,197,94,0.16)',
  color: '#fff',
};

const drawerFinanceiroTopo: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 12,
  fontWeight: 950,
};

const drawerFinanceiroListaCompacta: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 8,
};

const drawerFinanceiroLinhaCompacta: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: 3,
  minWidth: 0,
};

const drawerFinanceiroGridCompacto: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
};

const drawerAcoesGridCompacto: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 9,
  marginTop: 12,
};

const botaoWhatsappCompacto: CSSProperties = {
  minHeight: 46,
  padding: '0 12px',
  borderRadius: 15,
  border: 'none',
  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
};

const botaoReagendarCompacto: CSSProperties = {
  minHeight: 46,
  padding: '0 12px',
  borderRadius: 15,
  border: 'none',
  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
};

const botaoCancelarAtendimentoCompacto: CSSProperties = {
  minHeight: 46,
  padding: '0 12px',
  borderRadius: 15,
  border: 'none',
  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
  color: '#fff',
  fontWeight: 950,
};

const botaoFecharDrawerCompacto: CSSProperties = {
  minHeight: 46,
  padding: '0 12px',
  borderRadius: 15,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
};

function MetricCard({ titulo, valor, descricao, icone, cor }: any) {
  return (
    <div style={metricCard}>
      <div style={metricTopoCompacto}>
        <strong style={metricValor}>{valor}</strong>

        <span
          style={{
            ...metricIcon,
            background: `linear-gradient(135deg, ${cor}, rgba(255,255,255,0.14))`,
          }}
        >
          {icone}
        </span>
      </div>

      <span style={metricTitulo}>{titulo}</span>
      <small style={metricDescricao}>{descricao}</small>
    </div>
  );
}


const headerConteudoCompacto: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 14,
  position: 'relative',
  zIndex: 2,
  width: '100%',
};

const headerIdentidadeAgenda: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
  flex: 1,
};

const logoHeaderCompacto: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 14,
  overflow: 'hidden',
  background: 'linear-gradient(135deg, rgba(124,58,237,0.92), rgba(168,85,247,0.92))',
  border: '1px solid rgba(255,255,255,0.14)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  fontWeight: 950,
  color: '#fff',
  boxShadow: '0 12px 28px rgba(124,58,237,0.28)',
  flexShrink: 0,
};

const headerTituloBoxCompacto: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const tituloHeaderCompacto: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 950,
  color: '#fff',
  lineHeight: 1,
  letterSpacing: '-.04em',
};

const subtituloHeaderCompacto: CSSProperties = {
  color: '#cbd5e1',
  fontSize: 14,
  fontWeight: 750,
  lineHeight: 1.1,
};

const headerAcoesCompactas: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
};

const headerMiniStat: CSSProperties = {
  minWidth: 62,
  height: 46,
  borderRadius: 16,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1,
};

const headerMiniButton: CSSProperties = {
  height: 46,
  borderRadius: 16,
  padding: '0 13px',
  border: '1px solid rgba(255,255,255,0.09)',
  background: 'rgba(255,255,255,0.055)',
  color: '#fff',
  fontSize: 12,
  fontWeight: 950,
  cursor: 'pointer',
};

const headerInfoGridCompacto: CSSProperties = {
  position: 'relative',
  zIndex: 2,
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 6,
  width: '100%',
};

const headerInfoCardCompacto: CSSProperties = {
  minWidth: 0,
  borderRadius: 16,
  padding: '10px 10px',
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#fff',
  overflow: 'hidden',
};

const headerInfoIcone: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 13,
  background: 'rgba(124,58,237,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const toolbarAgendaCompacto: CSSProperties = {
  borderRadius: 18,
  padding: 10,
  background: 'rgba(15,23,42,0.78)',
  border: '1px solid rgba(255,255,255,0.07)',
  marginBottom: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const toolbarFiltrosRapidos: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 8,
};

const botaoFiltroRapidoAgenda: CSSProperties = {
  height: 38,
  borderRadius: 13,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: '#e2e8f0',
  fontSize: 12,
  fontWeight: 950,
  cursor: 'pointer',
};

const toolbarBuscaDataCompacta: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(190px, 300px)',
  gap: 10,
  alignItems: 'center',
};

const buscaCompactaBox: CSSProperties = {
  height: 42,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(2,6,23,0.68)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 12px',
  minWidth: 0,
};

const buscaCompactaIcone: CSSProperties = {
  color: '#94a3b8',
  fontSize: 22,
  fontWeight: 900,
  flexShrink: 0,
};

const inputBuscaAgendaCompacto: CSSProperties = {
  width: '100%',
  minWidth: 0,
  height: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
};

const botaoLimparBuscaCompacto: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontSize: 18,
  fontWeight: 900,
  cursor: 'pointer',
  flexShrink: 0,
};

const dataCompactaBox: CSSProperties = {
  height: 42,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(2,6,23,0.62)',
  display: 'grid',
  gridTemplateColumns: '42px 1fr 42px',
  alignItems: 'center',
  overflow: 'hidden',
};

const botaoDataCompacta: CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  background: 'transparent',
  color: '#fff',
  fontSize: 30,
  fontWeight: 950,
  cursor: 'pointer',
};

const inputDataCompactaLabel: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 34px',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 0,
  width: '100%',
  height: '100%',
  color: '#fff',
  fontSize: 14,
  fontWeight: 950,
};

const inputDataAgendaCompacto: CSSProperties = {
  width: '100%',
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: '#fff',
  fontSize: 14,
  fontWeight: 950,
  colorScheme: 'dark',
  textAlign: 'center',
  cursor: 'pointer',
};

const botaoCalendarioDataCompacta: CSSProperties = {
  width: 34,
  height: 34,
  border: 'none',
  borderRadius: 12,
  background: 'transparent',
  color: '#fff',
  fontSize: 16,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  filter: 'grayscale(1) brightness(2.8)',
};

const periodoAgendaTextoCompacto: CSSProperties = {
  minHeight: 30,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.07)',
  background: 'rgba(255,255,255,0.035)',
  color: '#cbd5e1',
  fontSize: 12,
  fontWeight: 850,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 12px',
};

const loadingPage: CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #020617, #111827)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  padding: 30,
};

const loadingCard: CSSProperties = {
  width: '100%',
  maxWidth: 360,
  borderRadius: 26,
  padding: 28,
  background: 'rgba(15,23,42,0.82)',
  border: '1px solid rgba(255,255,255,0.10)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  alignItems: 'center',
  textAlign: 'center',
};

const loadingIcon: CSSProperties = {
  width: 58,
  height: 58,
  borderRadius: 20,
  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 26,
};

const page: CSSProperties = {
  minHeight: '100vh',
  padding: 30,
  color: '#e5e7eb',
  background:
    'radial-gradient(circle at top left, rgba(124,58,237,0.22), transparent 34%), radial-gradient(circle at top right, rgba(6,182,212,0.18), transparent 32%), linear-gradient(135deg, #020617 0%, #0f172a 46%, #111827 100%)',
};

const container: CSSProperties = {
  maxWidth: 1500,
  margin: '0 auto',
};

const headerPremium: CSSProperties = {
  color: '#fff',
  borderRadius: 20,
  padding: 12,
  marginBottom: 10,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 8,
  position: 'relative',
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.08)',
  background:
    'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(2,6,23,0.98))',
  boxShadow: '0 14px 38px rgba(0,0,0,0.22)',
};

const headerOverlay: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'radial-gradient(circle at top left, rgba(124,58,237,0.16), transparent 42%), radial-gradient(circle at top right, rgba(6,182,212,0.12), transparent 36%)',
  pointerEvents: 'none',
};

const headerConteudo: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  position: 'relative',
  zIndex: 2,
};

const logoHeader: CSSProperties = {
  width: 86,
  height: 86,
  borderRadius: 28,
  overflow: 'hidden',
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 34,
  fontWeight: 900,
  color: '#fff',
  boxShadow: '0 14px 34px rgba(0,0,0,0.24)',
  flexShrink: 0,
};

const badgeBoasVindas: CSSProperties = {
  display: 'inline-flex',
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  padding: '7px 14px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 12,
  border: '1px solid rgba(255,255,255,0.12)',
};

const tituloHeader: CSSProperties = {
  margin: 0,
  fontSize: 42,
  fontWeight: 950,
  color: '#fff',
  lineHeight: 1,
};

const subtituloHeader: CSSProperties = {
  margin: '12px 0 0',
  color: 'rgba(255,255,255,0.82)',
  fontSize: 15,
  fontWeight: 500,
  maxWidth: 620,
  lineHeight: 1.6,
};

const linhaBadgesHeader: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 18,
};

const badgeEmpresa: CSSProperties = {
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  padding: '9px 14px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const badgeModulo: CSSProperties = {
  background: 'rgba(59,130,246,0.18)',
  color: '#bfdbfe',
  padding: '9px 14px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const badgeStatusHeader: CSSProperties = {
  background: 'rgba(34,197,94,0.16)',
  color: '#bbf7d0',
  padding: '9px 14px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const headerPainel: CSSProperties = {
  minWidth: 240,
  borderRadius: 26,
  padding: 24,
  background: 'rgba(2,6,23,0.26)',
  border: '1px solid rgba(255,255,255,0.12)',
  backdropFilter: 'blur(14px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  position: 'relative',
  zIndex: 2,
};

const headerPainelLabel: CSSProperties = {
  color: 'rgba(255,255,255,0.74)',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.08em',
};

const headerPainelValor: CSSProperties = {
  fontSize: 52,
  lineHeight: 1,
  fontWeight: 950,
  color: '#fff',
};

const headerPainelTexto: CSSProperties = {
  color: 'rgba(255,255,255,0.78)',
  fontSize: 13,
  lineHeight: 1.5,
};

const metricasGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 8,
  marginBottom: 10,
};

const metricCard: CSSProperties = {
  borderRadius: 16,
  padding: 11,
  background: 'rgba(15,23,42,0.74)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 4,
  minWidth: 0,
  minHeight: 78,
  boxShadow: 'none',
};

const metricTopoCompacto: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  minWidth: 0,
};

const metricIcon: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  flexShrink: 0,
};

const metricTitulo: CSSProperties = {
  display: 'block',
  color: '#cbd5e1',
  fontSize: 11,
  fontWeight: 900,
  marginTop: 1,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const metricValor: CSSProperties = {
  display: 'block',
  color: '#fff',
  fontSize: 22,
  fontWeight: 950,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  letterSpacing: '-0.04em',
};

const metricDescricao: CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: 10.5,
  fontWeight: 800,
  marginTop: 0,
  lineHeight: 1.15,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const toolbarAgenda: CSSProperties = {
  borderRadius: 28,
  padding: 22,
  background: 'rgba(15,23,42,0.86)',
  border: '1px solid rgba(255,255,255,0.08)',
  marginBottom: 24,
};

const toolbarTopo: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'center',
  marginBottom: 14,
  flexWrap: 'wrap',
};

const toolbarTitulo: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 22,
  fontWeight: 900,
};

const toolbarTexto: CSSProperties = {
  margin: '6px 0 0',
  color: '#94a3b8',
  fontSize: 14,
};

const inputBuscaAgenda: CSSProperties = {
  width: '100%',
  height: 52,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '0 16px',
  outline: 'none',
  fontSize: 14,
  background: 'rgba(2,6,23,0.66)',
  color: '#fff',
  boxSizing: 'border-box',
};

const filtroDataAgendaGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 280px) 120px minmax(240px, 1fr)',
  gap: 12,
  alignItems: 'end',
  marginBottom: 14,
};

const campoDataAgenda: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 7,
};

const labelFiltroDataAgenda: CSSProperties = {
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.08em',
};

const inputDataAgenda: CSSProperties = {
  width: '100%',
  height: 46,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '0 14px',
  outline: 'none',
  background: 'rgba(2,6,23,0.66)',
  color: '#fff',
  fontWeight: 900,
  boxSizing: 'border-box',
};

const botaoHojeAgenda: CSSProperties = {
  height: 46,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
};

const periodoAgendaTexto: CSSProperties = {
  minHeight: 46,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: '#cbd5e1',
  fontSize: 12,
  fontWeight: 850,
  display: 'flex',
  alignItems: 'center',
  padding: '0 14px',
};


const botaoLimparBusca: CSSProperties = {
  height: 42,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.05)',
  padding: '0 16px',
  cursor: 'pointer',
  fontWeight: 900,
  color: '#fff',
};

const calendarCard: CSSProperties = {
  borderRadius: 30,
  padding: 24,
  background: 'rgba(15,23,42,0.88)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 30px 80px rgba(0,0,0,0.24)',
};


const mobileAgendaDiaCard: CSSProperties = {
  width: '100%',
  borderRadius: 20,
  padding: 12,
  background:
    'linear-gradient(180deg, rgba(15,23,42,0.88), rgba(2,6,23,0.94))',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
  overflow: 'hidden',
};

const mobileAgendaDiaTopo: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '38px 1fr 38px',
  gap: 8,
  alignItems: 'center',
  marginBottom: 10,
};

const mobileSetaDia: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.09)',
  background: 'rgba(255,255,255,0.045)',
  color: '#fff',
  fontSize: 26,
  fontWeight: 900,
  lineHeight: 1,
  cursor: 'pointer',
};

const mobileTituloDiaAtualBox: CSSProperties = {
  minWidth: 0,
  textAlign: 'center',
};

const mobileTituloDiaAtual: CSSProperties = {
  display: 'block',
  color: '#fff',
  fontSize: 18,
  fontWeight: 950,
  lineHeight: 1.05,
};

const mobileSubtituloDiaAtual: CSSProperties = {
  display: 'block',
  marginTop: 2,
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 850,
  textTransform: 'capitalize',
};

const mobileDiasSemanaScroller: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(44px, 1fr))',
  gap: 6,
  marginBottom: 10,
};

const mobileBotaoDiaSemana: CSSProperties = {
  minWidth: 0,
  minHeight: 52,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  cursor: 'pointer',
};

const mobileResumoDiaGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 6,
  marginBottom: 10,
};

const mobileResumoDiaItem: CSSProperties = {
  borderRadius: 14,
  padding: '9px 6px',
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.06)',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  color: '#fff',
};

const mobileDicaArraste: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '34px 1fr 34px',
  gap: 8,
  alignItems: 'center',
  borderRadius: 14,
  padding: 8,
  background: 'rgba(124,58,237,0.10)',
  border: '1px solid rgba(168,85,247,0.14)',
  color: '#ddd6fe',
  fontSize: 11,
  fontWeight: 850,
  textAlign: 'center',
};

const mobileBotaoDicaSeta: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 950,
  cursor: 'pointer',
};

const mobileBotaoDicaSetaDestaque: CSSProperties = {
  ...mobileBotaoDicaSeta,
  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  boxShadow: '0 14px 30px rgba(124,58,237,0.36)',
};

const mobileLista: CSSProperties = {
  flexDirection: 'column',
  gap: 10,
};

const mobileHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 12,
};

const mobileBadge: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 999,
  background: 'rgba(124,58,237,0.18)',
  color: '#ddd6fe',
  fontSize: 12,
  fontWeight: 900,
};

const mobileCard: CSSProperties = {
  width: '100%',
  borderRadius: 15,
  padding: 9,
  background: 'rgba(15,23,42,0.84)',
  border: '1px solid rgba(255,255,255,0.075)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  textAlign: 'left',
  color: '#fff',
  cursor: 'pointer',
  boxShadow: 'none',
};

const mobileCardLinhaPrincipal: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '54px 1fr',
  gap: 9,
  alignItems: 'stretch',
};

const mobileHoraBox: CSSProperties = {
  minWidth: 0,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px 5px',
};

const mobileCardInfo: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 4,
};

const mobileClienteNome: CSSProperties = {
  color: '#fff',
  fontSize: 14,
  fontWeight: 950,
  lineHeight: 1.15,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const mobileServicoNome: CSSProperties = {
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.25,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const mobileStatusLinha: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  alignItems: 'center',
};


const mobileHora: CSSProperties = {
  fontSize: 16,
  fontWeight: 950,
  color: '#38bdf8',
  lineHeight: 1,
};

const mobileSubtituloSemana: CSSProperties = {
  margin: '6px 0 0',
  color: '#94a3b8',
  fontSize: 13,
  fontWeight: 800,
};

const mobileCardTopo: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
};

const mobileData: CSSProperties = {
  display: 'block',
  marginTop: 5,
  color: '#94a3b8',
  fontSize: 10,
  fontWeight: 900,
};

const mobileCardRodape: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
  paddingTop: 4,
  marginTop: 1,
  borderTop: '1px solid rgba(255,255,255,0.06)',
  color: '#cbd5e1',
  fontSize: 11,
  fontWeight: 850,
};

const sectionTitle: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 28,
  fontWeight: 900,
};

const emptyState: CSSProperties = {
  borderRadius: 22,
  padding: 30,
  minHeight: 230,
  background:
    'radial-gradient(circle at top, rgba(124,58,237,0.14), transparent 50%), rgba(15,23,42,0.82)',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  color: '#94a3b8',
};

function badgeStatus(status?: string | null): CSSProperties {
  if (status === 'cancelado') {
    return {
      background: 'rgba(239,68,68,0.18)',
      color: '#fecaca',
      border: '1px solid rgba(239,68,68,0.20)',
      borderRadius: 999,
      padding: '5px 9px',
      fontSize: 11,
      fontWeight: 900,
      width: 'fit-content',
    };
  }

  if (status === 'confirmado') {
    return {
      background: 'rgba(59,130,246,0.18)',
      color: '#bfdbfe',
      border: '1px solid rgba(59,130,246,0.20)',
      borderRadius: 999,
      padding: '5px 9px',
      fontSize: 11,
      fontWeight: 900,
      width: 'fit-content',
    };
  }

  if (status === 'concluido') {
    return {
      background: 'rgba(34,197,94,0.18)',
      color: '#bbf7d0',
      border: '1px solid rgba(34,197,94,0.20)',
      borderRadius: 999,
      padding: '5px 9px',
      fontSize: 11,
      fontWeight: 900,
      width: 'fit-content',
    };
  }

  return {
    background: 'rgba(245,158,11,0.18)',
    color: '#fde68a',
    border: '1px solid rgba(245,158,11,0.20)',
    borderRadius: 999,
    padding: '7px 11px',
    fontSize: 12,
    fontWeight: 900,
    width: 'fit-content',
  };
}

const agendaSemanalWrapper: CSSProperties = {
  width: '100%',
  overflowX: 'auto',
  paddingBottom: 10,
};

const agendaSemanalGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 300px)',
  gap: 18,
  alignItems: 'start',
  overflowX: 'auto',
  paddingBottom: 18,
  width: '100%',
};

const colunaDia: CSSProperties = {
  borderRadius: 28,
  background: 'rgba(15,23,42,0.88)',
  border: '1px solid rgba(255,255,255,0.08)',
  padding: 18,
  minHeight: 720,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  boxShadow: '0 20px 60px rgba(0,0,0,0.24)',
};

const headerDia: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  paddingBottom: 14,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const tituloDia: CSSProperties = {
  color: '#fff',
  fontSize: 18,
  fontWeight: 900,
};

const badgeQuantidadeDia: CSSProperties = {
  minWidth: 32,
  height: 32,
  borderRadius: 999,
  background: 'rgba(124,58,237,0.18)',
  color: '#ddd6fe',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 900,
  padding: '0 10px',
};

const cardsDia: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const diaVazio: CSSProperties = {
  borderRadius: 18,
  border: '1px dashed rgba(255,255,255,0.10)',
  padding: 18,
  color: '#64748b',
  fontSize: 13,
  textAlign: 'center',
  background: 'rgba(255,255,255,0.02)',
};

const cardAgendamento: CSSProperties = {
  width: '100%',
  borderRadius: 22,
  padding: 18,
  background:
    'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))',
  border: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  gap: 16,
  textAlign: 'left',
  cursor: 'pointer',
  transition: '.2s ease',
  color: '#fff',
};

const cardHorario: CSSProperties = {
  minWidth: 64,
  height: 64,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  fontWeight: 900,
  color: '#38bdf8',
  flexShrink: 0,
};

const cardConteudo: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const cardCliente: CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
  color: '#fff',
  lineHeight: 1.3,
};

const cardServico: CSSProperties = {
  color: '#94a3b8',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.5,
};

const badgesCard: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const badgeProfissional: CSSProperties = {
  padding: '5px 9px',
  borderRadius: 999,
  background: 'rgba(59,130,246,0.12)',
  color: '#bfdbfe',
  fontSize: 11,
  fontWeight: 900,
};

const badgePagamento: CSSProperties = {
  padding: '4px 7px',
  borderRadius: 999,
  background: 'rgba(34,197,94,0.12)',
  color: '#bbf7d0',
  fontSize: 11,
  fontWeight: 900,
};


const badgePromocaoAplicada: CSSProperties = {
  padding: '4px 7px',
  borderRadius: 999,
  background: 'rgba(168,85,247,0.16)',
  color: '#e9d5ff',
  border: '1px solid rgba(168,85,247,0.22)',
  fontSize: 11,
  fontWeight: 900,
};

const rodapeCard: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginTop: 6,
  color: '#cbd5e1',
  fontSize: 12,
  fontWeight: 800,
};

const drawerOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(2,6,23,0.72)',
  zIndex: 999,
  display: 'flex',
  justifyContent: 'flex-end',
  backdropFilter: 'blur(10px)',
};

const drawer: CSSProperties = {
  width: 460,
  maxWidth: '100%',
  height: '100vh',
  background: 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))',
  borderLeft: '1px solid rgba(255,255,255,0.10)',
  padding: 28,
  boxShadow: '-30px 0 90px rgba(0,0,0,0.45)',
  overflowY: 'auto',
  color: '#fff',
};

const drawerHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 24,
};

const drawerTitle: CSSProperties = {
  margin: 0,
  fontSize: 30,
  fontWeight: 950,
  color: '#fff',
};

const drawerSubtitle: CSSProperties = {
  margin: '8px 0 0',
  color: '#94a3b8',
};

const sectionEyebrow: CSSProperties = {
  display: 'inline-block',
  color: '#38bdf8',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  marginBottom: 8,
};

const botaoFechar: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontSize: 24,
  fontWeight: 900,
  cursor: 'pointer',
};

const dataDia: CSSProperties = {
  display: 'block',
  marginTop: 4,
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 800,
};

const diasNav: CSSProperties = {
  display: 'flex',
  gap: 10,
  overflowX: 'auto',
  padding: '4px 0 16px',
  marginBottom: 6,
  position: 'sticky',
  top: 0,
  zIndex: 5,
  background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
};

const botaoDiaNav: CSSProperties = {
  flexShrink: 0,
  padding: '11px 16px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
  fontSize: 13,
};

const cardInfo: CSSProperties = {
  borderRadius: 18,
  padding: 16,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginBottom: 12,
  color: '#fff',
};

const label: CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
};

const financeiroGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  marginBottom: 12,
};

const financeiroCard: CSSProperties = {
  borderRadius: 18,
  padding: 16,
  background: 'rgba(34,197,94,0.08)',
  border: '1px solid rgba(34,197,94,0.14)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  color: '#fff',
};

const promoDrawerCard: CSSProperties = {
  borderRadius: 22,
  padding: 18,
  marginBottom: 12,
  background:
    'radial-gradient(circle at top left, rgba(168,85,247,0.22), transparent 42%), rgba(88,28,135,0.16)',
  border: '1px solid rgba(196,181,253,0.22)',
  color: '#f5f3ff',
};

const promoDrawerHeader: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const promoDrawerDescricao: CSSProperties = {
  margin: '10px 0 0',
  color: '#c4b5fd',
  lineHeight: 1.6,
  fontSize: 13,
  fontWeight: 700,
};

const promoDrawerGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
  marginTop: 14,
};

const promoUsoUnicoDrawer: CSSProperties = {
  marginTop: 12,
  borderRadius: 14,
  padding: '11px 12px',
  background: 'rgba(34,197,94,0.10)',
  border: '1px solid rgba(34,197,94,0.18)',
  color: '#bbf7d0',
  fontSize: 13,
  fontWeight: 900,
};

const botaoWhatsapp: CSSProperties = {
  width: '100%',
  marginTop: 14,
  padding: 14,
  borderRadius: 16,
  border: 'none',
  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const botaoReagendar: CSSProperties = {
  width: '100%',
  marginTop: 10,
  padding: 14,
  borderRadius: 16,
  border: 'none',
  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const botaoCancelarAtendimento: CSSProperties = {
  width: '100%',
  marginTop: 10,
  padding: 14,
  borderRadius: 16,
  border: 'none',
  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
  color: '#fff',
  fontWeight: 900,
};

const botaoFecharDrawer: CSSProperties = {
  width: '100%',
  marginTop: 10,
  padding: 14,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const reagendamentoBox: CSSProperties = {
  marginTop: 18,
  padding: 18,
  borderRadius: 22,
  background: 'rgba(124,58,237,0.10)',
  border: '1px solid rgba(124,58,237,0.18)',
};

const reagendamentoTitulo: CSSProperties = {
  margin: '0 0 10px',
  color: '#fff',
  fontSize: 13,
  fontWeight: 900,
};

const reagendamentoTexto: CSSProperties = {
  margin: '0 0 14px',
  color: '#c4b5fd',
  fontSize: 13,
  lineHeight: 1.6,
};

const inputDrawer: CSSProperties = {
  width: '100%',
  height: 46,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(2,6,23,0.66)',
  color: '#fff',
  padding: '0 12px',
  marginBottom: 12,
};

const botaoBuscarHorario: CSSProperties = {
  width: '100%',
  padding: 13,
  borderRadius: 14,
  border: 'none',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const horariosGrid: CSSProperties = {
  marginTop: 12,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const emptyHorarios: CSSProperties = {
  width: '100%',
  border: '1px dashed rgba(255,255,255,0.14)',
  color: '#c4b5fd',
  borderRadius: 14,
  padding: 12,
  fontSize: 13,
  textAlign: 'center',
};

const botaoHorario: CSSProperties = {
  minWidth: 74,
  height: 40,
  borderRadius: 13,
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 900,
};

const botaoConfirmarReagendamento: CSSProperties = {
  width: '100%',
  marginTop: 14,
  padding: 14,
  borderRadius: 16,
  border: 'none',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const botaoCancelarReagendamento: CSSProperties = {
  width: '100%',
  marginTop: 10,
  padding: 13,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const badgeReagendado: CSSProperties = {
  padding: '4px 7px',
  borderRadius: 999,
  background: 'rgba(168,85,247,0.16)',
  color: '#e9d5ff',
  fontSize: 11,
  fontWeight: 900,
  border: '1px solid rgba(168,85,247,0.22)',
};

const cardInfoCancelado: CSSProperties = {
  borderRadius: 18,
  padding: 16,
  background: 'rgba(239,68,68,0.10)',
  border: '1px solid rgba(239,68,68,0.20)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginBottom: 12,
  color: '#fff',
};

const labelCancelado: CSSProperties = {
  fontSize: 12,
  color: '#fecaca',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
};