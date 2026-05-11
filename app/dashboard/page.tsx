'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);

  const [resumo, setResumo] = useState<any>({});
  const [graficoFaturamento, setGraficoFaturamento] = useState<any[]>([]);
  const [aniversariantes, setAniversariantes] = useState<any[]>([]);
  const [mostrarFinanceiro, setMostrarFinanceiro] = useState(false);
const hojeDashboard = new Date().toISOString().slice(0, 10);

const [dataInicioFiltro, setDataInicioFiltro] = useState(hojeDashboard);
const [dataFimFiltro, setDataFimFiltro] = useState(hojeDashboard);
const [periodoAplicado, setPeriodoAplicado] = useState({
  dataInicio: hojeDashboard,
  dataFim: hojeDashboard,
});

  const [modalReagendamentoAberto, setModalReagendamentoAberto] = useState(false);
  const [pesquisaReagendamento, setPesquisaReagendamento] = useState('');
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<any>(null);
  const [novaDataReagendamento, setNovaDataReagendamento] = useState('');
  const [horariosReagendamento, setHorariosReagendamento] = useState<string[]>([]);
  const [horarioReagendamento, setHorarioReagendamento] = useState('');
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  const [reagendando, setReagendando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
const [confirmandoPresencaId, setConfirmandoPresencaId] = useState<string | null>(null);

const [finalizandoAtendimento, setFinalizandoAtendimento] = useState(false);

const [formFinalizacao, setFormFinalizacao] = useState({
  quitarPendencias: true,

  pagamentos: [
    {
      forma: 'pix',
      valor: '',
    },
  ],

  observacao: '',
});

  const [servicosEmpresa, setServicosEmpresa] = useState<any[]>([]);
  const [profissionaisEmpresa, setProfissionaisEmpresa] = useState<any[]>([]);
  const [servicosAdicionais, setServicosAdicionais] = useState<any[]>([]);
  const [resumoServicosAdicionais, setResumoServicosAdicionais] = useState<any>({
    total: 0,
    totalPago: 0,
    totalPendente: 0,
  });
  const [salvandoServicoAdicional, setSalvandoServicoAdicional] = useState(false);
  const [formServicoAdicional, setFormServicoAdicional] = useState({
    servicoId: '',
    profissionalId: '',
    valor: '',
    statusPagamento: 'pendente',
    formaPagamento: '',
    observacao: '',
  });

  useEffect(() => {
  const empresaStorage = localStorage.getItem('empresaLogada');
  const usuarioStorage = localStorage.getItem('usuarioEmpresa');

  if (!empresaStorage || !usuarioStorage) {
    window.location.href = '/login';
    return;
  }

  const emp = JSON.parse(empresaStorage);
  const user = JSON.parse(usuarioStorage);

  setEmpresa(emp);
  setUsuario(user);

  carregar(emp.id, hojeDashboard, hojeDashboard);
}, []);

  async function carregar(
  empresaId: string,
  dataInicio = periodoAplicado.dataInicio,
  dataFim = periodoAplicado.dataFim
) {
  const params = new URLSearchParams({
    empresaId,
    dataInicio,
    dataFim,
  });

  const [
    resDashboard,
    resServicos,
    resProfissionais,
    resAniversariantes,
  ] = await Promise.all([
    fetch(`/api/dashboard/agendamentos?${params.toString()}`, {
      cache: 'no-store',
    }),
    fetch(`/api/servicos?empresaId=${empresaId}`),
    fetch(`/api/profissionais?empresaId=${empresaId}`),
    fetch(`/api/aniversariantes?empresaId=${empresaId}`),
  ]);

  const data = await resDashboard.json();
  const dataServicos = await resServicos.json();
  const dataProfissionais = await resProfissionais.json();
  const dataAniversariantes = await resAniversariantes.json();

  if (data.success) {
    setAgendamentos(data.agendamentos || []);
    setResumo(data.resumo || {});
    setGraficoFaturamento(data.graficoFaturamento || []);
  }

  setServicosEmpresa(dataServicos.servicos || []);
  setProfissionaisEmpresa(dataProfissionais.profissionais || []);
  setAniversariantes(dataAniversariantes.aniversariantes || []);
}

  function sair() {
    localStorage.clear();
    window.location.href = '/login';
  }

  function usuarioTemPermissao(chave: string) {
    if (!usuario) return false;
    if (usuario.acessoTotal === true) return true;
    if (usuario.perfil === 'admin') return true;

    return usuario.permissoes?.[chave] === true;
  }

  function usuarioPodeVerFinanceiro() {
    if (!usuario) return false;
    if (usuario.acessoTotal === true) return true;
    if (usuario.perfil === 'admin') return true;
    if (usuario.permissoes?.visualizarFinanceiro === true) return true;
    if (usuario.permissoes?.financeiro === true) return true;

    return false;
  }

  function alternarFinanceiro() {
    if (usuarioPodeVerFinanceiro()) {
      setMostrarFinanceiro(!mostrarFinanceiro);
      return;
    }

    alert(
      'Usuário sem permissão para visualizar valores financeiros. Solicite acesso a um administrador.'
    );
  }

  function dinheiro(valor: number) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function valorFinanceiro(valor: number) {
    if (!mostrarFinanceiro) return '••••••';
    return dinheiro(valor);
  }

  function valorNumerico(valor: any) {
    if (valor === null || valor === undefined || valor === '') return 0;

    if (typeof valor === 'number') return Number(valor || 0);

    return Number(String(valor).replace(',', '.')) || 0;
  }

  function valorTotalAtendimento(agendamento: any) {
    return valorNumerico(agendamento?.valorTotal);
  }

  function valorServicoPrincipal(agendamento: any) {
    return valorNumerico(
      agendamento?.servico?.valor ||
        agendamento?.Servico?.valor ||
        agendamento?.valorServicoPrincipal ||
        agendamento?.valorTotal
    );
  }

  function pagamentoConfirmado(status?: string | null) {
    return (
      status === 'pago' ||
      status === 'aprovado' ||
      status === 'confirmado'
    );
  }

  function obterServicosAdicionaisDoAgendamento(agendamento: any) {
    return agendamento?.servicosAdicionais || agendamento?.agendamentoServicos || [];
  }

  function resumoAdicionaisDoAgendamento(agendamento: any, resumoPreferencial?: any) {
    if (resumoPreferencial) {
      return {
        total: valorNumerico(resumoPreferencial.total),
        totalPago: valorNumerico(resumoPreferencial.totalPago),
        totalPendente: valorNumerico(resumoPreferencial.totalPendente),
      };
    }

    const itens = obterServicosAdicionaisDoAgendamento(agendamento);

    return itens.reduce(
      (acc: any, item: any) => {
        const valor = valorNumerico(item.valor);
        acc.total += valor;

        if (pagamentoConfirmado(item.statusPagamento)) {
          acc.totalPago += valor;
        } else {
          acc.totalPendente += valor;
        }

        return acc;
      },
      { total: 0, totalPago: 0, totalPendente: 0 }
    );
  }

  function resumoFinanceiroAtendimento(agendamento: any, resumoAdicionaisPreferencial?: any) {
    const principal = valorServicoPrincipal(agendamento);
    const adicionais = resumoAdicionaisDoAgendamento(
      agendamento,
      resumoAdicionaisPreferencial
    );

    const totalGravado = valorTotalAtendimento(agendamento);
    const totalCalculado = principal + adicionais.total;
    const total = Math.max(totalGravado, totalCalculado);

    const principalPago = pagamentoConfirmado(agendamento?.statusPagamento)
      ? principal
      : 0;

    const pago = principalPago + adicionais.totalPago;
    const pendente = Math.max(total - pago, 0);

    const status =
      total > 0 && pendente <= 0
        ? 'pago'
        : pago > 0
          ? 'parcial'
          : 'pendente';

    return {
      total,
      pago,
      pendente,
      status,
      principal,
      principalPago,
      principalPendente: Math.max(principal - principalPago, 0),
      adicionais,
    };
  }

  function corStatusFinanceiro(status: string) {
    if (status === 'pago') return '#15803d';
    if (status === 'parcial') return '#7c3aed';
    return '#b45309';
  }

  function textoStatusFinanceiro(status: string) {
    if (status === 'pago') return 'pago';
    if (status === 'parcial') return 'parcial';
    return 'pendente';
  }

  function valorNovoServicoAdicional() {
    return valorNumerico(formServicoAdicional.valor);
  }

  function totalComNovoServico() {
    const financeiroAtual = resumoFinanceiroAtendimento(
      agendamentoSelecionado,
      resumoServicosAdicionais
    );

    return financeiroAtual.total + valorNovoServicoAdicional();
  }

  function resumoFinanceiroComNovoServico() {
    const financeiroAtual = resumoFinanceiroAtendimento(
      agendamentoSelecionado,
      resumoServicosAdicionais
    );

    const valorNovo = valorNovoServicoAdicional();
    const novoServicoPago = pagamentoConfirmado(formServicoAdicional.statusPagamento);

    const pago = financeiroAtual.pago + (novoServicoPago ? valorNovo : 0);
    const pendente = financeiroAtual.pendente + (novoServicoPago ? 0 : valorNovo);
    const total = financeiroAtual.total + valorNovo;

    return {
      total,
      pago,
      pendente,
      status:
        total > 0 && pendente <= 0
          ? 'pago'
          : pago > 0
            ? 'parcial'
            : 'pendente',
    };
  }

  function ehHoje(data: any) {
    if (!data) return false;

    const d = new Date(data);
    const hoje = new Date();

    return (
      d.getDate() === hoje.getDate() &&
      d.getMonth() === hoje.getMonth() &&
      d.getFullYear() === hoje.getFullYear()
    );
  }

  function estaNaSemanaAtual(data: any) {
    if (!data) return false;

    const d = new Date(data);
    const hoje = new Date();

    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);

    return d >= inicioSemana && d <= fimSemana;
  }

  function hojeFormatoInput() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  function formatarHorario(data: any) {
    if (!data) return '--:--';

    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatarDataHora(data: any) {
    if (!data) return 'Não informado';

    return new Date(data).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
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

  function nomeCliente(agendamento: any) {
    return (
      agendamento.Cliente?.nome ||
      agendamento.cliente?.nome ||
      agendamento.nomeCliente ||
      agendamento.clienteNome ||
      'Cliente não informado'
    );
  }

  function nomeServico(agendamento: any) {
    return (
      agendamento.Servico?.nome ||
      agendamento.servico?.nome ||
      agendamento.servicoNome ||
      'Serviço não informado'
    );
  }

  function nomeProfissional(agendamento: any) {
    return (
      agendamento.Profissional?.nome ||
      agendamento.profissional?.nome ||
      agendamento.profissionalNome ||
      'Profissional não informado'
    );
  }

  function whatsappCliente(agendamento: any) {
    return (
      agendamento.Cliente?.whatsapp ||
      agendamento.cliente?.whatsapp ||
      agendamento.whatsapp ||
      ''
    );
  }

  function cpfCliente(agendamento: any) {
    return (
      agendamento.Cliente?.cpf ||
      agendamento.cliente?.cpf ||
      agendamento.cpf ||
      ''
    );
  }

  function obterProfissional(agendamento: any) {
    return agendamento.Profissional || agendamento.profissional || null;
  }

  function calcularComissao(agendamento: any) {
    const profissional = obterProfissional(agendamento);

    if (!profissional) return 0;

    const valorServico = Number(agendamento.valorTotal || 0);
    const tipoComissao = profissional.tipoComissao;
    const valorComissao = Number(profissional.valorComissao || 0);

    if (tipoComissao === 'percentual') {
      return (valorServico * valorComissao) / 100;
    }

    if (tipoComissao === 'fixo') {
      return valorComissao;
    }

    return 0;
  }

  function agruparPorNome(lista: any[], obterNome: (item: any) => string) {
    const mapa: Record<string, number> = {};

    lista.forEach((item) => {
      const nome = obterNome(item);
      mapa[nome] = (mapa[nome] || 0) + 1;
    });

    return Object.entries(mapa)
      .map(([nome, quantidade]) => ({
        nome,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }

  function limparFormServicoAdicional() {
    setFormServicoAdicional({
      servicoId: '',
      profissionalId: '',
      valor: '',
      statusPagamento: 'pendente',
      formaPagamento: '',
      observacao: '',
    });
  }

  async function carregarServicosAdicionais(agendamento: any) {
    if (!empresa?.id || !agendamento?.id) return;

    try {
      const res = await fetch(
        `/api/agendamentos/servicos?empresaId=${empresa.id}&agendamentoId=${agendamento.id}`,
        { cache: 'no-store' }
      );

      const data = await res.json();

      if (!data.success) {
        setServicosAdicionais([]);
        setResumoServicosAdicionais({ total: 0, totalPago: 0, totalPendente: 0 });
        return;
      }

      setServicosAdicionais(data.itens || []);
      setResumoServicosAdicionais(
        data.resumo || { total: 0, totalPago: 0, totalPendente: 0 }
      );
    } catch (error) {
      setServicosAdicionais([]);
      setResumoServicosAdicionais({ total: 0, totalPago: 0, totalPendente: 0 });
    }
  }

  function alterarServicoAdicionalSelecionado(servicoId: string) {
    const servico = servicosEmpresa.find((item) => item.id === servicoId);

    setFormServicoAdicional({
      ...formServicoAdicional,
      servicoId,
      valor: servico?.valor !== undefined && servico?.valor !== null
        ? String(servico.valor)
        : '',
    });
  }

  async function adicionarServicoAoAtendimento() {
    if (!empresa?.id) return;

    if (!agendamentoSelecionado?.id) {
      alert('Selecione um atendimento.');
      return;
    }

    if (!formServicoAdicional.servicoId) {
      alert('Selecione o serviço adicional.');
      return;
    }

    try {
      setSalvandoServicoAdicional(true);

      const res = await fetch('/api/agendamentos/servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresa.id,
          agendamentoId: agendamentoSelecionado.id,
          servicoId: formServicoAdicional.servicoId,
          profissionalId: formServicoAdicional.profissionalId || null,
          valor: formServicoAdicional.valor,
          statusPagamento: formServicoAdicional.statusPagamento,
          formaPagamento: formServicoAdicional.formaPagamento || null,
          observacao: formServicoAdicional.observacao || null,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao adicionar serviço ao atendimento.');
        return;
      }

      alert('Serviço adicionado ao atendimento com sucesso!');

      limparFormServicoAdicional();

      if (data.agendamento) {
        setAgendamentoSelecionado(data.agendamento);
      }

      await carregarServicosAdicionais(data.agendamento || agendamentoSelecionado);
      await carregar(empresa.id);
    } catch (error) {
      alert('Erro ao adicionar serviço ao atendimento.');
    } finally {
      setSalvandoServicoAdicional(false);
    }
  }

async function finalizarAtendimento() {
  if (!empresa?.id) return;

  if (!usuarioTemPermissao('finalizarAtendimento')) {
    alert('Você não tem permissão para finalizar atendimentos.');
    return;
  }

  if (!agendamentoSelecionado?.id) {
    alert('Selecione um atendimento.');
    return;
  }

  const dataAtendimento = new Date(
    agendamentoSelecionado.dataHoraInicio
  );

  const agora = new Date();

  if (dataAtendimento.getTime() > agora.getTime()) {
    alert(
      'Este atendimento ainda está agendado para uma data futura.\n\nA finalização só será liberada após a data e horário do atendimento.'
    );

    return;
  }

  const financeiro = resumoFinanceiroAtendimento(
    agendamentoSelecionado,
    resumoServicosAdicionais
  );

  const totalPagamentosInformados = formFinalizacao.pagamentos.reduce(
    (total: number, pagamento: any) =>
      total + valorNumerico(pagamento.valor),
    0
  );

  const temDinheiro = formFinalizacao.pagamentos.some(
    (pagamento: any) => pagamento.forma === 'dinheiro'
  );

  if (formFinalizacao.quitarPendencias) {
    if (totalPagamentosInformados <= 0) {
      alert('Informe o valor recebido no fechamento.');
      return;
    }

    if (totalPagamentosInformados < financeiro.pendente) {
      alert('O valor informado é menor que o valor pendente.');
      return;
    }

    if (
      totalPagamentosInformados > financeiro.pendente &&
      !temDinheiro
    ) {
      alert(
        'O valor pago é maior que o pendente. Só é permitido valor maior quando houver pagamento em dinheiro para gerar troco.'
      );
      return;
    }

    if (
      totalPagamentosInformados > financeiro.pendente &&
      temDinheiro
    ) {
      const troco =
        totalPagamentosInformados - financeiro.pendente;

      const confirmarTroco = window.confirm(
        `O valor informado é maior que o pendente.\n\nPendente: ${dinheiro(
          financeiro.pendente
        )}\nRecebido: ${dinheiro(
          totalPagamentosInformados
        )}\nTroco: ${dinheiro(
          troco
        )}\n\nDeseja finalizar com troco?`
      );

      if (!confirmarTroco) return;
    }
  }

  const confirmar = window.confirm(
    'Deseja finalizar este atendimento?'
  );

  if (!confirmar) return;

  try {
    setFinalizandoAtendimento(true);

    const res = await fetch('/api/agendamentos/finalizar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        empresaId: empresa.id,
        agendamentoId: agendamentoSelecionado.id,
        quitarPendencias: formFinalizacao.quitarPendencias,
        pagamentos: formFinalizacao.pagamentos,
        observacao: formFinalizacao.observacao,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error || 'Erro ao finalizar atendimento.');
      return;
    }

    alert(data.message);

    setAgendamentoSelecionado(data.atendimento);

    await carregar(empresa.id);
  } catch (error) {
    alert('Erro ao finalizar atendimento.');
  } finally {
    setFinalizandoAtendimento(false);
  }
}

async function confirmarPresenca(agendamento: any) {
  if (!empresa?.id || !agendamento?.id) return;

  if (agendamento.status === 'em_atendimento') {
    selecionarAgendamentoPainel(agendamento);
    return;
  }

  const confirmar = window.confirm(
    `Confirmar que ${nomeCliente(agendamento)} compareceu ao atendimento?`
  );

  if (!confirmar) return;

  try {
    setConfirmandoPresencaId(agendamento.id);

    const res = await fetch('/api/agendamentos/confirmar-presenca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresaId: empresa.id,
        agendamentoId: agendamento.id,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error || 'Erro ao confirmar presença.');
      return;
    }

    alert('Presença confirmada com sucesso!');

    await carregar(empresa.id);
  } catch (error) {
    alert('Erro ao confirmar presença.');
  } finally {
    setConfirmandoPresencaId(null);
  }
}

  function abrirModalReagendamento() {
    setModalReagendamentoAberto(true);
    setPesquisaReagendamento('');
    setAgendamentoSelecionado(null);
    setNovaDataReagendamento('');
    setHorariosReagendamento([]);
    setHorarioReagendamento('');
    setServicosAdicionais([]);
    setResumoServicosAdicionais({ total: 0, totalPago: 0, totalPendente: 0 });
    limparFormServicoAdicional();
  }

  function fecharModalReagendamento() {
    setModalReagendamentoAberto(false);
    setPesquisaReagendamento('');
    setAgendamentoSelecionado(null);
    setNovaDataReagendamento('');
    setHorariosReagendamento([]);
    setHorarioReagendamento('');
    setServicosAdicionais([]);
    setResumoServicosAdicionais({ total: 0, totalPago: 0, totalPendente: 0 });
    limparFormServicoAdicional();
  }

  function selecionarAgendamentoPainel(agendamento: any) {
    setAgendamentoSelecionado(agendamento);
    setNovaDataReagendamento('');
    setHorariosReagendamento([]);
    setHorarioReagendamento('');
    limparFormServicoAdicional();
    carregarServicosAdicionais(agendamento);
  }

  async function buscarHorariosReagendamento() {
    if (!agendamentoSelecionado) {
      alert('Selecione um agendamento.');
      return;
    }

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

    const servicoId = agendamentoSelecionado.servicoId;
    const profissionalId = agendamentoSelecionado.profissionalId;

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
    if (!empresa) return;

    if (!usuarioTemPermissao('reagendarAtendimento')) {
      alert('Você não tem permissão para reagendar atendimentos.');
      return;
    }

    if (!agendamentoSelecionado) {
      alert('Selecione um agendamento.');
      return;
    }

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
          agendamentoId: agendamentoSelecionado.id,
          dataHoraInicio: novaDataHora,
          servicoId: agendamentoSelecionado.servicoId,
          profissionalId: agendamentoSelecionado.profissionalId,
          permitirMenosDe24h: true,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao reagendar atendimento.');
        return;
      }

      alert('Atendimento reagendado com sucesso!');

      setAgendamentoSelecionado(data.agendamento);
      setNovaDataReagendamento('');
      setHorariosReagendamento([]);
      setHorarioReagendamento('');

      await carregar(empresa.id);
    } catch (error) {
      alert('Erro ao reagendar atendimento.');
    } finally {
      setReagendando(false);
    }
  }

  async function cancelarAgendamento() {
    if (!empresa) return;

    if (!usuarioTemPermissao('cancelarAtendimento')) {
      alert('Você não tem permissão para cancelar atendimentos.');
      return;
    }

    if (!agendamentoSelecionado) {
      alert('Selecione um agendamento.');
      return;
    }

    if (agendamentoSelecionado.status === 'cancelado') {
      alert('Este atendimento já está cancelado.');
      return;
    }

    const motivoCancelamento =
      window.prompt('Motivo do cancelamento (opcional):') || '';

    const confirmar = window.confirm(
      `Tem certeza que deseja cancelar o atendimento de ${nomeCliente(
        agendamentoSelecionado
      )}? O registro continuará salvo como cancelado e o horário ficará disponível para novos agendamentos.`
    );

    if (!confirmar) return;

    try {
      setCancelando(true);

      const res = await fetch('/api/agendamentos/reagendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamentoId: agendamentoSelecionado.id,
          motivoCancelamento,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao cancelar atendimento.');
        return;
      }

      alert('Atendimento cancelado com sucesso!');

      setAgendamentoSelecionado(null);
      setNovaDataReagendamento('');
      setHorariosReagendamento([]);
      setHorarioReagendamento('');
      setServicosAdicionais([]);
      setResumoServicosAdicionais({ total: 0, totalPago: 0, totalPendente: 0 });
      limparFormServicoAdicional();

      await carregar(empresa.id);
    } catch (error) {
      alert('Erro ao cancelar atendimento.');
    } finally {
      setCancelando(false);
    }
  }

  const agendamentosHoje = agendamentos
  .filter(
    (agendamento) =>
      ehHoje(agendamento.dataHoraInicio) &&
      agendamento.status !== 'cancelado'
  )
    .sort(
      (a, b) =>
        new Date(a.dataHoraInicio).getTime() -
        new Date(b.dataHoraInicio).getTime()
    );

  const agendamentosSemana = agendamentos.filter((agendamento) =>
    estaNaSemanaAtual(agendamento.dataHoraInicio)
  );

  const agendamentosFuturos = agendamentos
  .filter((agendamento) => {
    if (!agendamento.dataHoraInicio) return false;

    const dataAgendamento = new Date(agendamento.dataHoraInicio).getTime();

    return (
      dataAgendamento >= Date.now() ||
      agendamento.status === 'cancelado'
    );
  })
    .sort(
      (a, b) =>
        new Date(a.dataHoraInicio).getTime() -
        new Date(b.dataHoraInicio).getTime()
    );

  const agendamentosFuturosFiltrados = agendamentosFuturos.filter((agendamento) => {
    const termo = pesquisaReagendamento.trim().toLowerCase();

    if (!termo) return true;

    const termoNumerico = termo.replace(/\D/g, '');

    const cliente = nomeCliente(agendamento).toLowerCase();
    const servico = nomeServico(agendamento).toLowerCase();
    const profissional = nomeProfissional(agendamento).toLowerCase();
    const whatsapp = String(whatsappCliente(agendamento)).replace(/\D/g, '');
    const cpf = String(cpfCliente(agendamento)).replace(/\D/g, '');

    return (
      cliente.includes(termo) ||
      servico.includes(termo) ||
      profissional.includes(termo) ||
      whatsapp.includes(termoNumerico) ||
      cpf.includes(termoNumerico)
    );
  });

  const proximoCliente = agendamentosHoje.find((agendamento) => {
    if (!agendamento.dataHoraInicio) return false;
    return new Date(agendamento.dataHoraInicio).getTime() >= Date.now();
  });

  const faturamentoHoje = agendamentosHoje
    .filter((a) => a.statusPagamento === 'pago')
    .reduce((total, a) => total + Number(a.valorTotal || 0), 0);

  const comissaoHoje = agendamentosHoje
    .filter((a) => a.statusPagamento === 'pago')
    .reduce((total, a) => total + calcularComissao(a), 0);

  const totalAtendidos = agendamentosHoje.filter(
    (a) => new Date(a.dataHoraInicio).getTime() < Date.now()
  ).length;

  const ocupacaoDia =
    agendamentosHoje.length > 0
      ? Math.round((totalAtendidos / agendamentosHoje.length) * 100)
      : 0;

  const servicosRequisitadosSemana = agruparPorNome(
    agendamentosSemana,
    nomeServico
  ).slice(0, 5);

  const profissionaisRequisitadosSemana = agruparPorNome(
    agendamentosSemana,
    nomeProfissional
  ).slice(0, 5);

function aplicarFiltroDashboard() {
  if (!empresa?.id) return;

  if (!dataInicioFiltro || !dataFimFiltro) {
    alert('Informe a data inicial e a data final.');
    return;
  }

  if (dataInicioFiltro > hojeFormatoInput() || dataFimFiltro > hojeFormatoInput()) {
  alert('O filtro do dashboard não permite datas futuras.');
  return;
}

  setPeriodoAplicado({
    dataInicio: dataInicioFiltro,
    dataFim: dataFimFiltro,
  });

  carregar(empresa.id, dataInicioFiltro, dataFimFiltro);
}

function filtrarHojeDashboard() {
  if (!empresa?.id) return;

  const hoje = hojeFormatoInput();

  setDataInicioFiltro(hoje);
  setDataFimFiltro(hoje);
  setPeriodoAplicado({
    dataInicio: hoje,
    dataFim: hoje,
  });

  carregar(empresa.id, hoje, hoje);
}

function filtrarUltimosDiasDashboard(dias: number) {
  if (!empresa?.id) return;

  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(fim.getDate() - dias + 1);

  const dataInicio = inicio.toISOString().slice(0, 10);
  const dataFim = fim.toISOString().slice(0, 10);

  setDataInicioFiltro(dataInicio);
  setDataFimFiltro(dataFim);
  setPeriodoAplicado({
    dataInicio,
    dataFim,
  });

  carregar(empresa.id, dataInicio, dataFim);
}

  if (!empresa || !usuario) {
    return <p style={{ padding: 40 }}>Carregando...</p>;
  }

  return (
    <main style={{ padding: 30, background: '#f1f5f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <header style={novoHeaderPremium}>
  <div style={headerEmpresaInfo}>
  <div style={logoEmpresa}>
    {empresa?.logoUrl || empresa?.logo || empresa?.imagemUrl ? (
      <img
        src={empresa.logoUrl || empresa.logo || empresa.imagemUrl}
        alt={empresa.nome}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 22,
        }}
      />
    ) : (
      <span>
        {empresa?.nome?.charAt(0)?.toUpperCase() || 'M'}
      </span>
    )}
  </div>

  <div>
    <span style={badgeSistema}>
  Bem-vindo(a) de volta{' '}
  {usuario?.nome || usuario?.email || 'usuário'} 👋
</span>

    <h1 style={tituloEmpresa}>Dashboard</h1>

    <p style={subtituloHeader}>
      Visão geral completa do seu estúdio
    </p>

    <div style={linhaInfosEmpresa}>
      <span style={badgeEmpresa}>
        🏢 {empresa?.nome || 'Meu Estúdio'}
      </span>

      <span style={badgePlano}>
        🚀 Plano {empresa?.plano || 'Premium'}
      </span>

      <span style={badgeStatus}>
        ✅ {empresa?.assinaturaStatus || 'Ativa'}
      </span>

      {empresa?.assinaturaExpiraEm && (
        <span style={badgeVencimento}>
          📅 Vencimento:{' '}
          {new Date(empresa.assinaturaExpiraEm).toLocaleDateString('pt-BR')}
        </span>
      )}
    </div>
  </div>
</div>

  <div style={acoesHeader}>
    <button onClick={alternarFinanceiro} style={botaoHeaderPremium}>
      {mostrarFinanceiro
        ? '🙈 Ocultar valores'
        : '👁 Ver valores'}
    </button>

    <a href="/admin">
      <button style={botaoHeaderPremium}>
        Admin
      </button>
    </a>

    <a href="/agenda">
      <button style={botaoHeaderPremium}>
        Agenda
      </button>
    </a>

    <a href="/clientes">
      <button style={botaoHeaderRoxo}>
        + Agendar
      </button>
    </a>

    <button onClick={sair} style={botaoSairPremium}>
      Sair
    </button>
  </div>
</header>

        {usuarioPodeVerFinanceiro() ? (
          <section style={boxPremium}>
            <div style={tituloLinha}>
              <div>
                <h2 style={{ margin: 0 }}>Dashboard premium</h2>
                <p style={{ color: '#64748b', margin: '6px 0 0' }}>
                  Visão financeira com faturamento, custos, comissões e lucro líquido real.
                </p>
              </div>

              <a href="/comissoes">
                <button style={botaoPequenoRoxo}>Ver comissões</button>
              </a>
            </div>

<div style={filtroDashboardBox}>
  <div>
    <label style={labelCampo}>Data inicial</label>
    <input
      type="date"
      max={hojeFormatoInput()}
      value={dataInicioFiltro}
      onChange={(e) => setDataInicioFiltro(e.target.value)}
      style={inputData}
    />
  </div>

  <div>
    <label style={labelCampo}>Data final</label>
    <input
      type="date"
      max={hojeFormatoInput()}
      value={dataFimFiltro}
      onChange={(e) => setDataFimFiltro(e.target.value)}
      style={inputData}
    />
  </div>

  <button onClick={aplicarFiltroDashboard} style={botaoFiltroDashboard}>
    Buscar período
  </button>

  <button onClick={filtrarHojeDashboard} style={botaoFiltroSecundario}>
    Hoje
  </button>

  <button
    onClick={() => filtrarUltimosDiasDashboard(7)}
    style={botaoFiltroSecundario}
  >
    7 dias
  </button>

  <button
    onClick={() => filtrarUltimosDiasDashboard(30)}
    style={botaoFiltroSecundario}
  >
    30 dias
  </button>
</div>

<p style={periodoTexto}>
  Período exibido: {periodoAplicado.dataInicio.split('-').reverse().join('/')} até{' '}
  {periodoAplicado.dataFim.split('-').reverse().join('/')}
</p>

            <div style={gridFinanceiroPremium}>
              <CardFinanceiro
                titulo="Faturamento bruto"
                valor={valorFinanceiro(resumo.faturamentoBruto || resumo.faturamentoTotal)}
                descricao="Pagamentos recebidos"
                cor="#16a34a"
              />

              <CardFinanceiro
                titulo="Custo operacional"
                valor={valorFinanceiro(resumo.custoOperacionalTotal)}
                descricao="Custos cadastrados nos serviços"
                cor="#f97316"
              />

              <CardFinanceiro
                titulo="Total de comissões"
                valor={valorFinanceiro(resumo.totalComissoes)}
                descricao="Custo variável gerado"
                cor="#dc2626"
              />

              <CardFinanceiro
                titulo="Lucro líquido real"
                valor={valorFinanceiro(resumo.lucroLiquido || resumo.liquidoEstimado)}
                descricao="Faturamento - custos - comissões"
                cor="#7c3aed"
              />
            </div>
          </section>
        ) : (
          <section style={boxResumoBloqueado}>
            <strong>🔒 Dashboard premium</strong>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>
              Você não tem permissão para visualizar valores financeiros.
            </p>
          </section>
        )}

        <section style={gridCards}>
          <Card titulo="Faturamento" valor={valorFinanceiro(resumo.faturamentoTotal)} />
          <Card titulo="Pagos" valor={resumo.totalPagos || 0} />
          <Card titulo="Ticket Médio" valor={valorFinanceiro(resumo.ticketMedio)} />
          <Card titulo="Comissões hoje" valor={valorFinanceiro(comissaoHoje)} />
        </section>

        <section style={gridPrincipal}>
  <div style={box}>
    <h3 style={{ marginTop: 0 }}>Agendamentos de hoje</h3>

    {agendamentosHoje.length === 0 ? (
      <div style={emptyBox}>Nenhum agendamento para hoje.</div>
    ) : (
      <div style={{ display: 'grid', gap: 10 }}>
        {agendamentosHoje.map((agendamento) => (
          <div key={agendamento.id} style={linhaAgendamento}>
  <div>
    <strong>
      {formatarHorario(agendamento.dataHoraInicio)}
    </strong>

    <p style={{ margin: '4px 0 0', color: '#64748b' }}>
      {nomeCliente(agendamento)}
    </p>

    <p
      style={{
        margin: '4px 0 0',
        color: '#7c3aed',
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      👤 {nomeProfissional(agendamento)}
    </p>
  </div>

  <div style={{ textAlign: 'right' }}>
    <strong>{nomeServico(agendamento)}</strong>

    {(() => {
      const financeiro =
        resumoFinanceiroAtendimento(agendamento);

      return (
        <div style={resumoFinanceiroLista}>
          <strong style={{ color: '#0f172a' }}>
            Total: {dinheiro(financeiro.total)}
          </strong>

          <span style={{ color: '#15803d' }}>
            Pago: {dinheiro(financeiro.pago)}
          </span>

          {financeiro.pendente > 0 ? (
            <span style={{ color: '#b45309' }}>
              pendente {dinheiro(financeiro.pendente)}
            </span>
          ) : (
            <span style={{ color: '#15803d' }}>
              finalizado quitado
            </span>
          )}
        </div>
      );
    })()}

    <button
      onClick={() => confirmarPresenca(agendamento)}
      style={{
        marginTop: 10,
        border: 'none',
        background:
          agendamento.status === 'em_atendimento'
            ? '#16a34a'
            : '#4f46e5',
        color: '#fff',
        borderRadius: 10,
        padding: '8px 12px',
        fontWeight: 800,
        cursor: 'pointer',
        fontSize: 12,
      }}
    >
      {confirmandoPresencaId === agendamento.id
  ? 'Confirmando...'
  : agendamento.status === 'em_atendimento'
    ? 'Cliente presente ✅'
    : 'Confirmar presença'}
    </button>
  </div>
</div>
        ))}
      </div>
    )}
  </div>

  <div style={{ display: 'grid', gap: 20 }}>
    <div style={boxDestaque}>
      <h3 style={{ marginTop: 0 }}>Próximo cliente da fila</h3>

      {proximoCliente ? (
        <>
          <div style={horaGrande}>
            {formatarHorario(proximoCliente.dataHoraInicio)}
          </div>

          <h2 style={{ margin: '10px 0 4px' }}>
            {nomeCliente(proximoCliente)}
          </h2>

          <p style={{ color: '#64748b', marginTop: 0 }}>
            {nomeServico(proximoCliente)}
          </p>
        </>
      ) : (
        <div style={emptyBox}>Nenhum próximo cliente para hoje.</div>
      )}

      <a href="/agenda">
        <button style={botaoPrincipal}>
          Abrir agenda semanal completa 📅
        </button>
      </a>

      <button onClick={abrirModalReagendamento} style={botaoReagendar}>
        Gerenciar atendimentos 💰📅
      </button>
    </div>

    <div style={box}>
      <h3 style={{ marginTop: 0 }}>🎂 Aniversariantes da semana</h3>

      {aniversariantes.length === 0 ? (
        <div style={emptyBoxPequeno}>
          Nenhum aniversariante nos próximos 7 dias.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {aniversariantes.map((cliente: any) => (
            <div
              key={cliente.id}
              style={{
                background: '#fff7ed',
                border: '1px solid #fdba74',
                borderRadius: 14,
                padding: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div>
                <strong>{cliente.nome}</strong>

                <p
                  style={{
                    margin: '4px 0 0',
                    color: '#9a3412',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {cliente.diasRestantes === 0
                    ? 'Faz aniversário hoje 🎉'
                    : `Aniversário em ${cliente.diasRestantes} dia(s)`}
                </p>
              </div>

              {cliente.whatsapp && (
                <a
                  href={`https://wa.me/55${String(cliente.whatsapp).replace(/\D/g, '')}`}
                  target="_blank"
                >
                  <button
                    style={{
                      border: 0,
                      background: '#16a34a',
                      color: '#fff',
                      borderRadius: 12,
                      padding: '9px 12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    WhatsApp
                  </button>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    <div style={box}>
      <h3 style={{ marginTop: 0 }}>Resumo do dia</h3>

      <div style={{ display: 'grid', gap: 12 }}>
        <ResumoItem
          label="💰 Faturamento hoje"
          valor={valorFinanceiro(faturamentoHoje)}
        />

        <ResumoItem
          label="💸 Comissões hoje"
          valor={valorFinanceiro(comissaoHoje)}
        />

        <ResumoItem label="📊 Ocupação do dia" valor={`${ocupacaoDia}%`} />

        <ResumoItem label="👥 Total atendidos" valor={totalAtendidos} />
      </div>
    </div>

    <div style={box}>
      <h3 style={{ marginTop: 0 }}>Serviços mais requisitados da semana</h3>

      {servicosRequisitadosSemana.length === 0 ? (
        <div style={emptyBoxPequeno}>
          Nenhum serviço requisitado nesta semana.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {servicosRequisitadosSemana.map((servico: any) => (
            <ResumoItem
              key={servico.nome}
              label={servico.nome}
              valor={servico.quantidade}
            />
          ))}
        </div>
      )}
    </div>

    <div style={box}>
      <h3 style={{ marginTop: 0 }}>
        Profissionais mais requisitados da semana
      </h3>

      {profissionaisRequisitadosSemana.length === 0 ? (
        <div style={emptyBoxPequeno}>
          Nenhum profissional requisitado nesta semana.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {profissionaisRequisitadosSemana.map((profissional: any) => (
            <ResumoItem
              key={profissional.nome}
              label={profissional.nome}
              valor={profissional.quantidade}
            />
          ))}
        </div>
      )}
    </div>
  </div>
</section>

        <section style={{ marginTop: 20 }}>
          <div style={box}>
            <h3>Faturamento</h3>

            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={graficoFaturamento}>
                <XAxis dataKey="data" />
                <Tooltip
                  formatter={(value: any) =>
                    mostrarFinanceiro ? dinheiro(Number(value)) : '••••••'
                  }
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#4f46e5"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {modalReagendamentoAberto && (
        <div style={modalOverlay} onClick={fecharModalReagendamento}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <div>
                <h2 style={{ margin: 0 }}>Reagendar ou cancelar atendimentos</h2>
                <p style={{ marginTop: 6, color: '#64748b' }}>
                  Pesquise agendamentos futuros por nome, serviço, profissional, WhatsApp ou CPF.
                </p>
              </div>

              <button onClick={fecharModalReagendamento} style={botaoFecharModal}>
                ×
              </button>
            </div>

            <input
              value={pesquisaReagendamento}
              onChange={(e) => setPesquisaReagendamento(e.target.value)}
              placeholder="Pesquisar por nome, serviço, profissional, WhatsApp ou CPF"
              style={inputPesquisa}
            />

            <div style={modalGrid}>
              <div style={listaAgendamentos}>
                {agendamentosFuturosFiltrados.length === 0 ? (
                  <div style={emptyBox}>
                    Nenhum agendamento futuro encontrado.
                  </div>
                ) : (
                  agendamentosFuturosFiltrados.map((agendamento) => (
                    <button
                      key={agendamento.id}
                      onClick={() => selecionarAgendamentoPainel(agendamento)}
                      style={{
                        ...itemAgendamentoModal,
                        border:
  agendamentoSelecionado?.id === agendamento.id
    ? '2px solid #7c3aed'
    : agendamento.status === 'cancelado'
      ? '1px solid #fecaca'
      : '1px solid #e2e8f0',
background:
  agendamento.status === 'cancelado'
    ? '#fff1f2'
    : '#fff',
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <strong>{nomeCliente(agendamento)}</strong>
                        <p style={{ margin: '4px 0', color: '#64748b' }}>
  {nomeServico(agendamento)} · {nomeProfissional(agendamento)}
</p>

<span style={{ color: '#475569', fontSize: 13 }}>
  {formatarDataHora(agendamento.dataHoraInicio)}
</span>

{agendamento.status === 'cancelado' && (
  <div
    style={{
      marginTop: 8,
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      borderRadius: 10,
      padding: 8,
      fontSize: 12,
      fontWeight: 800,
    }}
  >
    <div>Cancelado</div>
    <div>
      Em: {formatarCanceladoEm(agendamento.canceladoEm)}
    </div>
    <div>
      Motivo: {agendamento.motivoCancelamento || 'Não informado'}
    </div>
  </div>
)}
                      </div>

                      {(() => {
                        const financeiro = resumoFinanceiroAtendimento(agendamento);

                        return (
                          <div style={resumoFinanceiroModalLista}>
                            <strong>{dinheiro(financeiro.total)}</strong>
                            <span style={{ color: '#15803d' }}>
                              pago {dinheiro(financeiro.pago)}
                            </span>
                            {financeiro.pendente > 0 ? (
  <span style={{ color: '#b45309' }}>
    Pendente: {dinheiro(financeiro.pendente)}
  </span>
) : (
  <span style={{ color: '#15803d' }}>Finalizado quitado</span>
)}
                          </div>
                        );
                      })()}
                    </button>
                  ))
                )}
              </div>

              <div style={painelAcaoModal}>
                {!agendamentoSelecionado ? (
                  <div style={emptyBox}>
                    Selecione um agendamento para reagendar ou cancelar.
                  </div>
                ) : (
                  <>
                    <div style={cardInfoModal}>
                      <span style={labelModal}>Cliente</span>
                      <strong>{nomeCliente(agendamentoSelecionado)}</strong>
                    </div>

                    <div style={cardInfoModal}>
                      <span style={labelModal}>Serviço</span>
                      <strong>{nomeServico(agendamentoSelecionado)}</strong>
                    </div>

                    <div style={cardInfoModal}>
                      <span style={labelModal}>Data atual</span>
                      <strong>{formatarDataHora(agendamentoSelecionado.dataHoraInicio)}</strong>
                    </div>

                    <div
                      style={
                        agendamentoSelecionado.status === 'cancelado'
                          ? cardInfoCanceladoModal
                          : cardInfoModal
                      }
                    >
                      <span
                        style={
                          agendamentoSelecionado.status === 'cancelado'
                            ? labelCanceladoModal
                            : labelModal
                        }
                      >
                        Status
                      </span>
                      <strong>{textoStatus(agendamentoSelecionado.status)}</strong>
                    </div>

                    {agendamentoSelecionado.status === 'cancelado' && (
                      <>
                        <div style={cardInfoCanceladoModal}>
                          <span style={labelCanceladoModal}>Motivo do cancelamento</span>
                          <strong>
                            {agendamentoSelecionado.motivoCancelamento || 'Não informado'}
                          </strong>
                        </div>

                        <div style={cardInfoCanceladoModal}>
                          <span style={labelCanceladoModal}>Cancelado em</span>
                          <strong>{formatarCanceladoEm(agendamentoSelecionado.canceladoEm)}</strong>
                        </div>
                      </>
                    )}

                    {agendamentoSelecionado.status !== 'cancelado' ? (
                      <>
                    <div style={servicosAdicionaisBox}>
                      {(() => {
                        const financeiro = resumoFinanceiroAtendimento(
                          agendamentoSelecionado,
                          resumoServicosAdicionais
                        );

                        return (
                          <>
                            <div style={servicosAdicionaisHeader}>
                              <div>
                                <strong>Financeiro do atendimento</strong>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                                  Veja o total, o que já foi pago e o que ainda está pendente.
                                </p>
                              </div>

                              <span
                                style={{
                                  ...badgeStatusFinanceiro,
                                  color: corStatusFinanceiro(financeiro.status),
                                  borderColor: financeiro.status === 'pago' ? '#bbf7d0' : financeiro.status === 'parcial' ? '#ddd6fe' : '#fed7aa',
                                  background: financeiro.status === 'pago' ? '#ecfdf5' : financeiro.status === 'parcial' ? '#f5f3ff' : '#fff7ed',
                                }}
                              >
                                {textoStatusFinanceiro(financeiro.status)}
                              </span>
                            </div>

                            <div style={financeiroAtendimentoBox}>
                              <ResumoFinanceiroItem
                                label="Total do atendimento"
                                valor={dinheiro(financeiro.total)}
                                cor="#0f172a"
                              />
                              <ResumoFinanceiroItem
                                label="Pago"
                                valor={dinheiro(financeiro.pago)}
                                cor="#15803d"
                              />
                              <ResumoFinanceiroItem
                                label="Pendente"
                                valor={dinheiro(financeiro.pendente)}
                                cor={financeiro.pendente > 0 ? '#b45309' : '#15803d'}
                              />
                            </div>
                          </>
                        );
                      })()}

                      <div style={servicoPrincipalBox}>
                        <span style={labelModal}>Serviço principal</span>
                        <strong>{nomeServico(agendamentoSelecionado)}</strong>
                        <span style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>
                          Valor principal: {dinheiro(valorServicoPrincipal(agendamentoSelecionado))}
                        </span>
                        <span
                          style={{
                            color: pagamentoConfirmado(agendamentoSelecionado.statusPagamento) ? '#15803d' : '#b45309',
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        >
                          {pagamentoConfirmado(agendamentoSelecionado.statusPagamento) ? 'principal pago' : 'principal pendente'}
                        </span>
                      </div>

                      {servicosAdicionais.length > 0 && (
                        <div style={listaServicosAdicionais}>
                          {servicosAdicionais.map((item: any) => (
                            <div key={item.id} style={itemServicoAdicional}>
                              <div>
                                <strong>{item.nomeServico || item.servico?.nome || 'Serviço adicional'}</strong>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
                                  {item.profissional?.nome ? `Profissional: ${item.profissional.nome}` : 'Profissional não informado'}
                                </p>
                                {item.observacao && (
                                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
                                    Obs: {item.observacao}
                                  </p>
                                )}
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <strong>{dinheiro(Number(item.valor || 0))}</strong>
                                <p
                                  style={{
                                    margin: '4px 0 0',
                                    color: item.statusPagamento === 'pago' ? '#15803d' : '#b45309',
                                    fontSize: 12,
                                    fontWeight: 900,
                                  }}
                                >
                                  {item.statusPagamento === 'pago' ? 'pago' : 'pendente'}
                                </p>
                              </div>
                            </div>
                          ))}

                          <div style={resumoServicosAdicionaisBox}>
                            <ResumoItem
                              label="Total de adicionais"
                              valor={dinheiro(resumoServicosAdicionais.total)}
                            />
                          </div>
                        </div>
                      )}

                      <div style={formServicoAdicionalGrid}>
                        <div>
                          <label style={labelCampo}>Serviço adicional</label>
                          <select
                            value={formServicoAdicional.servicoId}
                            onChange={(e) => alterarServicoAdicionalSelecionado(e.target.value)}
                            style={inputData}
                          >
                            <option value="">Selecione o serviço</option>
                            {servicosEmpresa.map((servico) => (
                              <option key={servico.id} value={servico.id}>
                                {servico.nome}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={labelCampo}>Profissional</label>
                          <select
                            value={formServicoAdicional.profissionalId}
                            onChange={(e) =>
                              setFormServicoAdicional({
                                ...formServicoAdicional,
                                profissionalId: e.target.value,
                              })
                            }
                            style={inputData}
                          >
                            <option value="">Não informar</option>
                            {profissionaisEmpresa.map((profissional) => (
                              <option key={profissional.id} value={profissional.id}>
                                {profissional.nome}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={labelCampo}>Valor</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formServicoAdicional.valor}
                            onChange={(e) =>
                              setFormServicoAdicional({
                                ...formServicoAdicional,
                                valor: e.target.value,
                              })
                            }
                            style={inputData}
                            placeholder="0,00"
                          />
                        </div>

                        <div>
                          <label style={labelCampo}>Pagamento</label>
                          <select
                            value={formServicoAdicional.statusPagamento}
                            onChange={(e) =>
                              setFormServicoAdicional({
                                ...formServicoAdicional,
                                statusPagamento: e.target.value,
                              })
                            }
                            style={inputData}
                          >
                            <option value="pendente">Pendente</option>
                            <option value="pago">Pago</option>
                          </select>
                        </div>
                      </div>

                      <div style={previewTotalServicoBox}>
                        {(() => {
                          const preview = resumoFinanceiroComNovoServico();

                          return (
                            <>
                              <span>Novo total do atendimento</span>
                              <strong>{dinheiro(preview.total)}</strong>
                              <span>Novo total pago</span>
                              <strong style={{ color: '#15803d' }}>{dinheiro(preview.pago)}</strong>
                              <span>Novo total pendente</span>
                              <strong style={{ color: preview.pendente > 0 ? '#b45309' : '#15803d' }}>
                                {dinheiro(preview.pendente)}
                              </strong>
                            </>
                          );
                        })()}
                      </div>

                      <input
                        value={formServicoAdicional.formaPagamento}
                        onChange={(e) =>
                          setFormServicoAdicional({
                            ...formServicoAdicional,
                            formaPagamento: e.target.value,
                          })
                        }
                        placeholder="Forma de pagamento (opcional): pix, dinheiro, cartão..."
                        style={inputPesquisa}
                      />

                      <input
                        value={formServicoAdicional.observacao}
                        onChange={(e) =>
                          setFormServicoAdicional({
                            ...formServicoAdicional,
                            observacao: e.target.value,
                          })
                        }
                        placeholder="Observação do serviço adicional (opcional)"
                        style={inputPesquisa}
                      />

                      <button
                        onClick={adicionarServicoAoAtendimento}
                        disabled={salvandoServicoAdicional}
                        style={botaoAdicionarServico}
                      >
                        {salvandoServicoAdicional ? 'Adicionando serviço...' : '+ Adicionar serviço ao atendimento'}
                      </button>
                    </div>

                    <div style={reagendamentoOpcionalBox}>
                      <div style={{ marginBottom: 10 }}>
                        <strong style={{ color: '#0f172a' }}>Alterar data e horário (opcional)</strong>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                          Para apenas adicionar serviços ao atendimento, não precisa escolher nova data.
                          Use esta área somente se também quiser reagendar.
                        </p>
                      </div>

                      <label style={labelCampo}>Nova data</label>
                      <input
                        type="date"
                        min={hojeFormatoInput()}
                        value={novaDataReagendamento}
                        onChange={(e) => {
                          setNovaDataReagendamento(e.target.value);
                          setHorariosReagendamento([]);
                          setHorarioReagendamento('');
                        }}
                        style={inputData}
                      />

                      <button
                        onClick={buscarHorariosReagendamento}
                        disabled={buscandoHorarios || !novaDataReagendamento}
                        style={
                          !novaDataReagendamento
                            ? { ...botaoBuscarHorarios, opacity: 0.55, cursor: 'not-allowed' }
                            : botaoBuscarHorarios
                        }
                      >
                        {buscandoHorarios ? 'Buscando horários...' : 'Buscar horários disponíveis'}
                      </button>

                      <div style={{ marginTop: 12 }}>
                        {horariosReagendamento.length === 0 ? (
                          <div style={emptyBoxPequeno}>
                            A data e o horário atuais serão mantidos se você não reagendar.
                          </div>
                        ) : (
                          <div style={gradeHorarios}>
                            {horariosReagendamento.map((h) => (
                              <button
                                key={h}
                                onClick={() => setHorarioReagendamento(h)}
                                style={{
                                  ...botaoHorario,
                                  background:
                                    horarioReagendamento === h
                                      ? 'linear-gradient(135deg, #7c3aed, #db2777)'
                                      : '#fff',
                                  color: horarioReagendamento === h ? '#fff' : '#0f172a',
                                  border:
                                    horarioReagendamento === h
                                      ? '1px solid transparent'
                                      : '1px solid #cbd5e1',
                                }}
                              >
                                {h}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {(novaDataReagendamento || horarioReagendamento) && (
                        <button
                          onClick={confirmarReagendamento}
                          disabled={reagendando || !horarioReagendamento}
                          style={
                            !horarioReagendamento
                              ? { ...botaoConfirmarReagendamento, opacity: 0.55, cursor: 'not-allowed' }
                              : botaoConfirmarReagendamento
                          }
                        >
                          {reagendando ? 'Reagendando...' : 'Confirmar reagendamento'}
                        </button>
                      )}
                    </div>

                    <button
                      onClick={cancelarAgendamento}
                      disabled={cancelando}
                      style={botaoCancelarAgendamento}
                    >
                      {cancelando ? 'Cancelando...' : 'Cancelar atendimento'}
                    </button>

<div style={fechamentoBox}>
  <h3 style={{ margin: 0 }}>Fechamento do atendimento</h3>

  {(() => {
    const financeiro = resumoFinanceiroAtendimento(
      agendamentoSelecionado,
      resumoServicosAdicionais
    );

    return (
      <div style={financeiroAtendimentoBox}>
        <ResumoFinanceiroItem
          label="Total"
          valor={dinheiro(financeiro.total)}
          cor="#0f172a"
        />

        <ResumoFinanceiroItem
          label="Pago"
          valor={dinheiro(financeiro.pago)}
          cor="#15803d"
        />

        <ResumoFinanceiroItem
          label="Pendente"
          valor={dinheiro(financeiro.pendente)}
          cor={financeiro.pendente > 0 ? '#b45309' : '#15803d'}
        />
      </div>
    );
  })()}

  <label style={checkLinha}>
    <input
      type="checkbox"
      checked={formFinalizacao.quitarPendencias}
      onChange={(e) =>
        setFormFinalizacao({
          ...formFinalizacao,
          quitarPendencias: e.target.checked,
        })
      }
    />
    Quitar pendências ao finalizar
  </label>

  <label style={labelCampo}>Pagamentos do fechamento</label>

<div
  style={{
    display: 'grid',
    gap: 10,
    marginBottom: 12,
  }}
>
  {formFinalizacao.pagamentos.map(
    (pagamento: any, index: number) => (
      <div
        key={index}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <select
          value={pagamento.forma}
          onChange={(e) => {
            const lista = [
              ...formFinalizacao.pagamentos,
            ];

            lista[index].forma =
              e.target.value;

            setFormFinalizacao({
              ...formFinalizacao,
              pagamentos: lista,
            });
          }}
          style={inputData}
        >
          <option value="pix">Pix</option>
          <option value="dinheiro">
            Dinheiro
          </option>
          <option value="cartao_credito">
            Cartão crédito
          </option>
          <option value="cartao_debito">
            Cartão débito
          </option>
          <option value="outro">
            Outro
          </option>
        </select>

        <input
          type="number"
          placeholder="Valor"
          value={pagamento.valor}
          onChange={(e) => {
            const lista = [
              ...formFinalizacao.pagamentos,
            ];

            lista[index].valor =
              e.target.value;

            setFormFinalizacao({
              ...formFinalizacao,
              pagamentos: lista,
            });
          }}
          style={inputData}
        />

        {formFinalizacao.pagamentos.length >
          1 && (
          <button
            onClick={() => {
              const lista =
                formFinalizacao.pagamentos.filter(
                  (_: any, i: number) =>
                    i !== index
                );

              setFormFinalizacao({
                ...formFinalizacao,
                pagamentos: lista,
              });
            }}
            style={{
              border: 'none',
              background: '#dc2626',
              color: '#fff',
              borderRadius: 10,
              width: 38,
              height: 38,
              cursor: 'pointer',
              fontWeight: 900,
            }}
          >
            ×
          </button>
        )}
      </div>
    )
  )}

  <button
    onClick={() =>
      setFormFinalizacao({
        ...formFinalizacao,
        pagamentos: [
          ...formFinalizacao.pagamentos,
          {
            forma: 'pix',
            valor: '',
          },
        ],
      })
    }
    style={{
      border: '1px dashed #7c3aed',
      background: '#f5f3ff',
      color: '#6d28d9',
      borderRadius: 12,
      padding: 12,
      fontWeight: 800,
      cursor: 'pointer',
    }}
  >
    + Adicionar forma de pagamento
  </button>
</div>

  <label style={labelCampo}>Observação do fechamento</label>
  <textarea
    value={formFinalizacao.observacao}
    onChange={(e) =>
      setFormFinalizacao({
        ...formFinalizacao,
        observacao: e.target.value,
      })
    }
    placeholder="Ex: Cliente pagou o restante no Pix."
    style={textareaFechamento}
  />

  <button
    onClick={finalizarAtendimento}
    disabled={finalizandoAtendimento}
    style={botaoFinalizarAtendimento}
  >
    {finalizandoAtendimento
      ? 'Finalizando...'
      : 'Finalizar atendimento'}
  </button>
</div>

                      </>
                    ) : (
                      <div style={emptyBoxPequeno}>
                        Este atendimento já está cancelado e permanece registrado para histórico.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Card({ titulo, valor }: any) {
  return (
    <div style={card}>
      <div style={{ fontSize: 13, color: '#64748b' }}>{titulo}</div>
      <div style={{ fontSize: 26, fontWeight: 'bold' }}>{valor}</div>
    </div>
  );
}

function CardFinanceiro({ titulo, valor, descricao, cor }: any) {
  return (
    <div style={{ ...cardFinanceiroPremium, borderLeft: `6px solid ${cor}` }}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>
        {titulo}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6, color: '#0f172a' }}>
        {valor}
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
        {descricao}
      </div>
    </div>
  );
}

function ResumoItem({ label, valor }: any) {
  return (
    <div style={resumoItem}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function ResumoFinanceiroItem({ label, valor, cor }: any) {
  return (
    <div style={resumoFinanceiroItem}>
      <span>{label}</span>
      <strong style={{ color: cor }}>{valor}</strong>
    </div>
  );
}

const header = {
  background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
  color: '#fff',
  padding: 30,
  borderRadius: 20,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const gridCards = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4,1fr)',
  gap: 16,
  marginTop: 20,
};

const gridPrincipal = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: 20,
  marginTop: 20,
};

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 16,
  boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
};

const box = {
  background: '#fff',
  padding: 20,
  borderRadius: 20,
  boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
};

const boxPremium = {
  ...box,
  marginTop: 20,
  background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
  border: '1px solid #e2e8f0',
};

const boxResumoBloqueado = {
  ...box,
  marginTop: 20,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
};

const tituloLinha = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'center',
  marginBottom: 18,
};

const gridFinanceiroPremium = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 12,
};

const cardFinanceiroPremium = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16,
  boxShadow: '0 8px 20px rgba(15,23,42,0.06)',
};

const botaoPequenoRoxo = {
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none',
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
  whiteSpace: 'nowrap' as const,
};

const boxDestaque = {
  background: '#fff',
  padding: 20,
  borderRadius: 20,
  boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
};

const linhaAgendamento = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const resumoItem = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 12,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
};

const emptyBox = {
  background: '#f8fafc',
  border: '1px dashed #cbd5e1',
  color: '#64748b',
  borderRadius: 14,
  padding: 18,
  textAlign: 'center' as const,
};

const emptyBoxPequeno = {
  background: '#f8fafc',
  border: '1px dashed #cbd5e1',
  color: '#64748b',
  borderRadius: 12,
  padding: 12,
  textAlign: 'center' as const,
  fontSize: 13,
};

const horaGrande = {
  fontSize: 42,
  fontWeight: 900,
  color: '#4f46e5',
};

const botaoHeader = {
  padding: '10px 16px',
  borderRadius: 10,
  border: 'none',
  background: '#6366f1',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const botaoSair = {
  padding: '10px 16px',
  borderRadius: 10,
  border: 'none',
  background: '#ef4444',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const botaoPrincipal = {
  width: '100%',
  marginTop: 18,
  padding: 16,
  borderRadius: 14,
  border: 'none',
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
};

const botaoReagendar = {
  width: '100%',
  marginTop: 10,
  padding: 14,
  borderRadius: 14,
  border: '1px solid #ddd6fe',
  background: '#fff',
  color: '#7c3aed',
  fontWeight: 900,
  cursor: 'pointer',
};

const modalOverlay = {
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(15, 23, 42, 0.45)',
  zIndex: 999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const modalBox = {
  width: '100%',
  maxWidth: 980,
  maxHeight: '90vh',
  overflowY: 'auto' as const,
  background: '#fff',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 30px 80px rgba(15, 23, 42, 0.25)',
};

const modalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 18,
};

const botaoFecharModal = {
  width: 36,
  height: 36,
  borderRadius: 999,
  border: 'none',
  background: '#f1f5f9',
  cursor: 'pointer',
  fontSize: 20,
  fontWeight: 800,
};

const inputPesquisa = {
  width: '100%',
  height: 48,
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '0 14px',
  outline: 'none',
  fontSize: 14,
  background: '#f8fafc',
  marginBottom: 18,
};

const modalGrid = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 0.8fr',
  gap: 18,
};

const listaAgendamentos = {
  display: 'grid',
  gap: 10,
  alignContent: 'start',
};

const itemAgendamentoModal = {
  width: '100%',
  background: '#fff',
  borderRadius: 16,
  padding: 14,
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
};

const painelAcaoModal = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16,
  alignSelf: 'start',
};

const cardInfoModal = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  padding: 12,
  borderRadius: 12,
  marginBottom: 10,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 4,
};

const labelModal = {
  fontSize: 12,
  color: '#64748b',
};

const cardInfoCanceladoModal = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  padding: 12,
  borderRadius: 12,
  marginBottom: 10,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 4,
};

const labelCanceladoModal = {
  fontSize: 12,
  color: '#991b1b',
};

const labelCampo = {
  display: 'block',
  fontSize: 12,
  fontWeight: 800,
  color: '#334155',
  marginBottom: 6,
};

const inputData = {
  width: '100%',
  height: 44,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  padding: '0 12px',
  marginBottom: 10,
};

const botaoBuscarHorarios = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: 'none',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const gradeHorarios = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 8,
};

const botaoHorario = {
  minWidth: 72,
  height: 38,
  borderRadius: 12,
  cursor: 'pointer',
  fontWeight: 800,
};

const resumoFinanceiroLista = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 2,
  marginTop: 4,
  fontSize: 12,
  fontWeight: 900,
};

const resumoFinanceiroModalLista = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 3,
  textAlign: 'right' as const,
  fontSize: 12,
  fontWeight: 900,
  color: '#0f172a',
  whiteSpace: 'nowrap' as const,
};

const financeiroAtendimentoBox = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 12,
  display: 'grid',
  gap: 8,
  marginBottom: 12,
};

const resumoFinanceiroItem = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  fontSize: 13,
  fontWeight: 900,
};

const badgeStatusFinanceiro = {
  border: '1px solid #ddd6fe',
  borderRadius: 999,
  padding: '8px 10px',
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: 'nowrap' as const,
  textTransform: 'uppercase' as const,
};

const servicosAdicionaisBox = {
  background: '#ffffff',
  border: '1px solid #ddd6fe',
  borderRadius: 18,
  padding: 14,
  marginBottom: 16,
  boxShadow: '0 12px 26px rgba(124, 58, 237, 0.08)',
};

const servicosAdicionaisHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 10,
  marginBottom: 12,
};

const badgeTotalAtendimento = {
  background: '#f5f3ff',
  color: '#6d28d9',
  border: '1px solid #ddd6fe',
  borderRadius: 999,
  padding: '8px 10px',
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: 'nowrap' as const,
};

const servicoPrincipalBox = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 12,
  marginBottom: 12,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 4,
};

const listaServicosAdicionais = {
  display: 'grid',
  gap: 10,
  marginBottom: 12,
};

const itemServicoAdicional = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 12,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
};

const resumoServicosAdicionaisBox = {
  display: 'grid',
  gap: 8,
};

const formServicoAdicionalGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
};

const botaoAdicionarServico = {
  width: '100%',
  padding: 14,
  borderRadius: 14,
  border: 'none',
  background: 'linear-gradient(135deg, #0f172a, #7c3aed)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const previewTotalServicoBox = {
  background: '#f8fafc',
  border: '1px dashed #c4b5fd',
  borderRadius: 14,
  padding: 12,
  marginBottom: 12,
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 8,
  alignItems: 'center',
  fontSize: 13,
  color: '#64748b',
};

const reagendamentoOpcionalBox = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 14,
  marginTop: 14,
};

const botaoConfirmarReagendamento = {
  width: '100%',
  marginTop: 14,
  padding: 14,
  borderRadius: 14,
  border: 'none',
  background: 'linear-gradient(135deg, #7c3aed, #db2777)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const botaoCancelarAgendamento = {
  width: '100%',
  marginTop: 10,
  padding: 14,
  borderRadius: 14,
  border: 'none',
  background: '#dc2626',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const fechamentoBox = {
  marginTop: 18,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16,
};

const checkLinha = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 14,
  marginBottom: 12,
  fontSize: 13,
  fontWeight: 800,
  color: '#334155',
};

const textareaFechamento = {
  width: '100%',
  minHeight: 80,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  padding: 12,
  resize: 'vertical' as const,
  marginBottom: 12,
};

const botaoFinalizarAtendimento = {
  width: '100%',
  padding: 14,
  borderRadius: 14,
  border: 'none',
  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const filtroDashboardBox = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr auto auto auto auto',
  gap: 10,
  alignItems: 'end',
  marginBottom: 18,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
};

const botaoFiltroDashboard = {
  height: 48,
  border: 'none',
  borderRadius: 12,
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
  padding: '0 16px',
};

const botaoFiltroSecundario = {
  height: 48,
  border: '1px solid #ddd6fe',
  borderRadius: 12,
  background: '#fff',
  color: '#6d28d9',
  fontWeight: 900,
  cursor: 'pointer',
  padding: '0 14px',
};

const periodoTexto = {
  margin: '-6px 0 16px',
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700,
};

const novoHeaderPremium = {
  background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
  borderRadius: 28,
  padding: 28,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 20,
  flexWrap: 'wrap' as const,
  boxShadow: '0 20px 40px rgba(124,58,237,0.25)',
};

const headerEmpresaInfo = {
  display: 'flex',
  alignItems: 'center',
  gap: 18,
};

const logoEmpresa = {
  width: 78,
  height: 78,
  borderRadius: 24,
  background: 'rgba(255,255,255,0.15)',
  border: '2px solid rgba(255,255,255,0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 32,
  fontWeight: 900,
  color: '#fff',
  backdropFilter: 'blur(10px)',
};

const badgeSistema = {
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  display: 'inline-block',
  marginBottom: 10,
};

const tituloEmpresa = {
  margin: 0,
  color: '#fff',
  fontSize: 34,
  fontWeight: 900,
  lineHeight: 1.1,
};

const linhaInfosEmpresa = {
  display: 'flex',
  gap: 10,
  marginTop: 12,
  flexWrap: 'wrap' as const,
};

const badgePlano = {
  background: '#f59e0b',
  color: '#fff',
  padding: '8px 14px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

const badgeStatus = {
  background: '#16a34a',
  color: '#fff',
  padding: '8px 14px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

const acoesHeader = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap' as const,
  alignItems: 'center',
};

const botaoHeaderPremium = {
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 14,
  padding: '12px 18px',
  fontWeight: 800,
  cursor: 'pointer',
  backdropFilter: 'blur(10px)',
};

const botaoHeaderRoxo = {
  background: '#fff',
  color: '#6d28d9',
  border: 'none',
  borderRadius: 14,
  padding: '12px 18px',
  fontWeight: 900,
  cursor: 'pointer',
};

const botaoSairPremium = {
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '12px 18px',
  fontWeight: 900,
  cursor: 'pointer',
};

const subtituloHeader = {
  color: 'rgba(255,255,255,0.82)',
  fontSize: 15,
  margin: '8px 0 0',
  fontWeight: 500,
};

const badgeEmpresa = {
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.14)',
  color: '#fff',
  padding: '8px 14px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

const badgeVencimento = {
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.14)',
  color: '#fff',
  padding: '8px 14px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};