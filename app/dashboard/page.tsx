"use client";

import PremiumLayout from "@/components/layout/PremiumLayout";
import { gerarTemaEmpresa } from "@/app/lib/theme";
import { obterStatusLicencaEmpresa } from "@/app/lib/licencaEmpresa";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [agendamentosSemanaPrevisao, setAgendamentosSemanaPrevisao] = useState<
    any[]
  >([]);
  const [agendamentosCentral, setAgendamentosCentral] = useState<any[]>([]);
  const [carregandoCentral, setCarregandoCentral] = useState(false);

  const [resumo, setResumo] = useState<any>({});
  const [graficoFaturamento, setGraficoFaturamento] = useState<any[]>([]);
  const [aniversariantes, setAniversariantes] = useState<any[]>([]);
  const [mostrarFinanceiro, setMostrarFinanceiro] = useState(true);

  const hojeDashboard = formatarDataInputLocal();
  const [promocoesAtivas, setPromocoesAtivas] = useState<any[]>([]);

  const [dataInicioFiltro, setDataInicioFiltro] = useState(hojeDashboard);
  const [dataFimFiltro, setDataFimFiltro] = useState(hojeDashboard);
  const [periodoAplicado, setPeriodoAplicado] = useState({
    dataInicio: hojeDashboard,
    dataFim: hojeDashboard,
  });

  const [mostrarFiltroAvancado, setMostrarFiltroAvancado] = useState(false);
  const [rankingDashboard, setRankingDashboard] = useState<any>({
    clientes: [],
    servicos: [],
    profissionais: [],
  });
  const [carregandoRankingDashboard, setCarregandoRankingDashboard] =
    useState(false);
  const [abaRankingDashboard, setAbaRankingDashboard] = useState<
    "clientes" | "servicos" | "profissionais"
  >("clientes");
  const [modalRankingAberto, setModalRankingAberto] = useState(false);
  const [pesquisaRanking, setPesquisaRanking] = useState("");
  const intervaloMesAtualDashboard = obterIntervaloMesAtualDashboard();
  const [dataInicioRanking, setDataInicioRanking] = useState(
    intervaloMesAtualDashboard.dataInicio,
  );
  const [dataFimRanking, setDataFimRanking] = useState(
    intervaloMesAtualDashboard.dataFim,
  );
  const [periodoRankingAplicado, setPeriodoRankingAplicado] = useState({
    dataInicio: intervaloMesAtualDashboard.dataInicio,
    dataFim: intervaloMesAtualDashboard.dataFim,
  });

  const [modalReagendamentoAberto, setModalReagendamentoAberto] =
    useState(false);
  const [pesquisaReagendamento, setPesquisaReagendamento] = useState("");
  const [agendamentoSelecionado, setAgendamentoSelecionado] =
    useState<any>(null);
  const [novaDataReagendamento, setNovaDataReagendamento] = useState("");
  const [horariosReagendamento, setHorariosReagendamento] = useState<string[]>(
    [],
  );
  const [horarioReagendamento, setHorarioReagendamento] = useState("");
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  const [reagendando, setReagendando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [confirmandoPresencaId, setConfirmandoPresencaId] = useState<
    string | null
  >(null);

  const [filtroCentralAtendimentos, setFiltroCentralAtendimentos] = useState<
    "abertosHoje" | "abertos" | "finalizados" | "cancelados" | "todos"
  >("abertosHoje");

  const [finalizandoAtendimento, setFinalizandoAtendimento] = useState(false);
  const [resumoFinanceiroCliente, setResumoFinanceiroCliente] = useState<any>({
    credito: 0,
    debito: 0,
    saldo: 0,
  });
  const [carregandoFinanceiroCliente, setCarregandoFinanceiroCliente] =
    useState(false);

  const [formFinalizacao, setFormFinalizacao] = useState({
    habilitarFechamento: false,
    habilitarAjusteValor: false,
    tipoAjusteFechamento: "desconto",
    habilitarCreditoDebito: false,
    valorDescontoAtendimento: "",
    tipoDescontoAtendimento: "valor",
    valorAcrescimoAtendimento: "",
    tipoAcrescimoAtendimento: "valor",
    observacaoAjusteAtendimento: "",
    usarCreditoCliente: false,
    gerarDebitoCliente: false,
    valorDebitoCliente: "",
    observacaoDebitoCliente: "",
    gerarCreditoCliente: false,
    valorCreditoCliente: "",
    observacaoCreditoCliente: "",
    valorCreditoUtilizadoCliente: "",
    abaterDebitoCliente: false,
    valorAbatimentoDebitoCliente: "",
    observacaoAbatimentoDebitoCliente: "",

    pagamentos: [
      {
        forma: "pix",
        valor: "",
      },
    ],

    observacao: "",
  });

  const [servicosEmpresa, setServicosEmpresa] = useState<any[]>([]);
  const [profissionaisEmpresa, setProfissionaisEmpresa] = useState<any[]>([]);
  const [servicosAdicionais, setServicosAdicionais] = useState<any[]>([]);
  const [resumoServicosAdicionais, setResumoServicosAdicionais] = useState<any>(
    {
      total: 0,
      totalPago: 0,
      totalPendente: 0,
    },
  );
  const [salvandoServicoAdicional, setSalvandoServicoAdicional] =
    useState(false);
  const [formServicoAdicional, setFormServicoAdicional] = useState({
    servicoId: "",
    profissionalId: "",
    valor: "",
    statusPagamento: "pendente",
    formaPagamento: "",
    observacao: "",
  });

  function obterIntervaloMesAtualDashboard() {
    const agora = new Date();
    const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

    return {
      dataInicio: formatarDataInputLocal(inicio),
      dataFim: formatarDataInputLocal(fim),
    };
  }

  useEffect(() => {
    const empresaStorage = localStorage.getItem("empresaLogada");
    const usuarioStorage = localStorage.getItem("usuarioEmpresa");

    if (!empresaStorage || !usuarioStorage) {
      window.location.href = "/login";
      return;
    }

    const emp = JSON.parse(empresaStorage);
    const user = JSON.parse(usuarioStorage);

    setEmpresa(emp);
    setUsuario(user);

    const podeVerFinanceiro =
      user?.acessoTotal === true ||
      user?.perfil === "admin" ||
      user?.permissoes?.visualizarFinanceiro === true ||
      user?.permissoes?.financeiro === true;

    setMostrarFinanceiro(podeVerFinanceiro);

    carregar(emp.id, hojeDashboard, hojeDashboard);
    carregarAtendimentosCentral(emp.id);
    carregarRankingsDashboard(
      emp.id,
      intervaloMesAtualDashboard.dataInicio,
      intervaloMesAtualDashboard.dataFim,
    );
  }, []);

  async function carregar(
    empresaId: string,
    dataInicio = periodoAplicado.dataInicio,
    dataFim = periodoAplicado.dataFim,
  ) {
    const params = new URLSearchParams({
      empresaId,
      dataInicio,
      dataFim,
    });

    const intervaloSemanaPrevisao = intervaloSemanaPorData(
      dataFim || dataInicio,
    );

    const paramsSemanaPrevisao = new URLSearchParams({
      empresaId,
      dataInicio: intervaloSemanaPrevisao.dataInicio,
      dataFim: intervaloSemanaPrevisao.dataFim,
    });

    const [
      resDashboard,
      resDashboardSemanaPrevisao,
      resServicos,
      resProfissionais,
      resAniversariantes,
      resPromocoes,
    ] = await Promise.all([
      fetch(`/api/dashboard/agendamentos?${params.toString()}`, {
        cache: "no-store",
      }),
      fetch(`/api/dashboard/agendamentos?${paramsSemanaPrevisao.toString()}`, {
        cache: "no-store",
      }),
      fetch(`/api/servicos?empresaId=${empresaId}`),
      fetch(`/api/profissionais?empresaId=${empresaId}`),
      fetch(`/api/aniversariantes?empresaId=${empresaId}`),
      fetch(`/api/promocoes?empresaId=${empresaId}`),
    ]);

    const data = await resDashboard.json();
    const dataSemanaPrevisao = await resDashboardSemanaPrevisao.json();
    const dataServicos = await resServicos.json();
    const dataProfissionais = await resProfissionais.json();
    const dataAniversariantes = await resAniversariantes.json();
    const dataPromocoes = await resPromocoes.json();

    if (data.success) {
      setAgendamentos(data.agendamentos || []);
      setResumo(data.resumo || {});
      setGraficoFaturamento(data.graficoFaturamento || []);
    }

    if (dataSemanaPrevisao.success) {
      setAgendamentosSemanaPrevisao(dataSemanaPrevisao.agendamentos || []);
    } else {
      setAgendamentosSemanaPrevisao([]);
    }

    setServicosEmpresa(dataServicos.servicos || []);
    setProfissionaisEmpresa(dataProfissionais.profissionais || []);
    setAniversariantes(dataAniversariantes.aniversariantes || []);

    const agora = new Date();

    const promocoesValidas = (dataPromocoes.promocoes || []).filter(
      (promo: any) => {
        if (promo.status !== "ativa") return false;

        if (!promo.dataInicio || !promo.dataFim) return true;

        const inicio = new Date(promo.dataInicio);
        const fim = new Date(promo.dataFim);

        return agora >= inicio && agora <= fim;
      },
    );

    setPromocoesAtivas(promocoesValidas);
  }

  async function carregarRankingsDashboard(
    empresaId: string,
    dataInicio = periodoRankingAplicado.dataInicio,
    dataFim = periodoRankingAplicado.dataFim,
  ) {
    if (!empresaId) return;

    try {
      setCarregandoRankingDashboard(true);

      const params = new URLSearchParams({
        empresaId,
        dataInicio,
        dataFim,
      });

      const res = await fetch(
        `/api/dashboard/agendamentos?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const data = await res.json();

      if (!data.success) {
        setRankingDashboard({ clientes: [], servicos: [], profissionais: [] });
        return;
      }

      setRankingDashboard(
        data.ranking || { clientes: [], servicos: [], profissionais: [] },
      );
    } catch (error) {
      setRankingDashboard({ clientes: [], servicos: [], profissionais: [] });
      alert("Erro ao carregar rankings do dashboard.");
    } finally {
      setCarregandoRankingDashboard(false);
    }
  }

  function fecharModalRankingDashboard() {
    setModalRankingAberto(false);
    setPesquisaRanking("");
  }

  function limparSessaoLocalDashboard() {
    try {
      sessionStorage.setItem("marcae_logout_recente", "true");
      sessionStorage.setItem("marcae_logout_em", Date.now().toString());
      sessionStorage.removeItem("marcae_audio_notificacoes_liberado");
    } catch (error) {
      console.warn("Não foi possível registrar logout local no dashboard:", error);
    }

    localStorage.removeItem("empresaLogada");
    localStorage.removeItem("usuarioEmpresa");
    localStorage.removeItem("empresaId");
    localStorage.removeItem("empresaSlugAcesso");
    localStorage.removeItem("marcae_ultimo_acesso");
  }

  async function sair() {
    limparSessaoLocalDashboard();

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });
    } catch (error) {
      console.error("Erro ao encerrar sessão pelo dashboard:", error);
    } finally {
      limparSessaoLocalDashboard();
      window.location.replace("/login?logout=1");
    }
  }

  function usuarioTemPermissao(chave: string) {
    if (!usuario) return false;
    if (usuario.acessoTotal === true) return true;
    if (usuario.perfil === "admin") return true;

    return usuario.permissoes?.[chave] === true;
  }

  function usuarioPodeVerFinanceiro() {
    if (!usuario) return false;
    if (usuario.acessoTotal === true) return true;
    if (usuario.perfil === "admin") return true;
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
      "Usuário sem permissão para visualizar valores financeiros. Solicite acesso a um administrador.",
    );
  }

  function dinheiro(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function corValorCliente(valor: any) {
    const saldo = valorNumerico(valor);

    if (saldo > 0) return "#22c55e";
    if (saldo < 0) return "#ef4444";

    return "#94a3b8";
  }

  function dinheiroComSinal(valor: any) {
    const saldo = valorNumerico(valor);

    if (saldo > 0) return `+${dinheiro(saldo)}`;
    if (saldo < 0) return `-${dinheiro(Math.abs(saldo))}`;

    return dinheiro(0);
  }

  function valorFinanceiro(valor: number) {
    if (!mostrarFinanceiro) return "••••••";
    return dinheiro(valor);
  }

  function valorNumerico(valor: any) {
    if (valor === null || valor === undefined || valor === "") return 0;

    if (typeof valor === "number") return Number(valor || 0);

    return Number(String(valor).replace(",", ".")) || 0;
  }

  function valorTotalAtendimento(agendamento: any) {
    return valorNumerico(agendamento?.valorTotal);
  }

  function valorServicoPrincipal(agendamento: any) {
    return valorNumerico(
      agendamento?.valorTotal ||
        agendamento?.valorServicoPrincipal ||
        agendamento?.servico?.valor ||
        agendamento?.Servico?.valor,
    );
  }

  function pagamentoConfirmado(status?: string | null) {
    return (
      status === "pago" || status === "aprovado" || status === "confirmado"
    );
  }

  function obterServicosAdicionaisDoAgendamento(agendamento: any) {
    return (
      agendamento?.servicosAdicionais || agendamento?.agendamentoServicos || []
    );
  }

  function resumoAdicionaisDoAgendamento(
    agendamento: any,
    resumoPreferencial?: any,
  ) {
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
      { total: 0, totalPago: 0, totalPendente: 0 },
    );
  }

  function resumoFinanceiroAtendimento(
    agendamento: any,
    resumoAdicionaisPreferencial?: any,
  ) {
    const principal = valorServicoPrincipal(agendamento);
    const adicionais = resumoAdicionaisDoAgendamento(
      agendamento,
      resumoAdicionaisPreferencial,
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
      total > 0 && pendente <= 0 ? "pago" : pago > 0 ? "parcial" : "pendente";

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
    if (status === "pago") return "#15803d";
    if (status === "parcial") return "#7c3aed";
    return "#b45309";
  }

  function textoStatusFinanceiro(status: string) {
    if (status === "pago") return "pago";
    if (status === "parcial") return "parcial";
    return "pendente";
  }

  function promocaoFoiAplicadaDashboard(agendamento: any) {
    return Boolean(
      agendamento?.promocaoId ||
      agendamento?.promocaoTitulo ||
      Number(agendamento?.valorEconomizado || 0) > 0,
    );
  }

  function formatarTipoPromocaoDashboard(tipo?: string | null) {
    if (tipo === "servico") return "Desconto por serviço";
    if (tipo === "aniversariantes") return "Promoção de aniversário";
    if (tipo === "geral") return "Promoção geral";

    return "Promoção aplicada";
  }

  function formatarDescontoDashboard(agendamento: any) {
    const desconto = Number(agendamento?.promocaoDesconto || 0);

    if (!desconto) return "";

    if (agendamento?.promocaoTipoDesconto === "valor") {
      return dinheiro(desconto);
    }

    return `${desconto}%`;
  }

  function valorServicoPrincipalOriginal(agendamento: any) {
    return valorNumerico(
      agendamento?.valorServicoOriginal ||
        agendamento?.valorOriginalServico ||
        agendamento?.servico?.valor ||
        agendamento?.Servico?.valor ||
        agendamento?.valorTotal,
    );
  }

  function metodosPagamentoTexto(agendamento: any) {
    const pagamentosPossiveis =
      agendamento?.pagamentos ||
      agendamento?.Pagamento ||
      agendamento?.pagamento ||
      agendamento?.Pagamentos ||
      [];

    if (Array.isArray(pagamentosPossiveis)) {
      return pagamentosPossiveis
        .map(
          (pagamento: any) =>
            pagamento?.metodoPagamento || pagamento?.formaPagamento || "",
        )
        .filter(Boolean)
        .join(" | ");
    }

    return String(
      pagamentosPossiveis?.metodoPagamento ||
        pagamentosPossiveis?.formaPagamento ||
        agendamento?.metodoPagamento ||
        "",
    );
  }

  function extrairValorAjusteDoTexto(texto: string, chave: string) {
    if (!texto) return 0;

    const regex = new RegExp(`${chave}_[^:|]*:\\s*R\\$\\s*([0-9.,]+)`, "i");
    const match = texto.match(regex);

    if (!match?.[1]) return 0;

    return valorNumerico(match[1]);
  }

  function resumoAjusteFechamentoSalvo(
    agendamento: any,
    resumoAdicionaisPreferencial?: any,
  ) {
    const adicionais = resumoAdicionaisDoAgendamento(
      agendamento,
      resumoAdicionaisPreferencial,
    );

    const valorOriginal =
      valorServicoPrincipalOriginal(agendamento) + adicionais.total;
    const valorFinal = valorTotalAtendimento(agendamento);
    const textoMetodos = metodosPagamentoTexto(agendamento);

    let desconto =
      valorNumerico(agendamento?.descontoAplicado) ||
      valorNumerico(agendamento?.valorDescontoAtendimento) ||
      valorNumerico(agendamento?.descontoFechamento) ||
      extrairValorAjusteDoTexto(textoMetodos, "desconto");

    let acrescimo =
      valorNumerico(agendamento?.acrescimoAplicado) ||
      valorNumerico(agendamento?.valorAcrescimoAtendimento) ||
      valorNumerico(agendamento?.acrescimoFechamento) ||
      extrairValorAjusteDoTexto(textoMetodos, "acrescimo");

    if (
      valorOriginal > 0 &&
      valorFinal > 0 &&
      desconto <= 0 &&
      acrescimo <= 0
    ) {
      if (valorFinal < valorOriginal) {
        desconto = valorOriginal - valorFinal;
      }

      if (valorFinal > valorOriginal) {
        acrescimo = valorFinal - valorOriginal;
      }
    }

    const temDesconto = desconto > 0;
    const temAcrescimo = acrescimo > 0;

    return {
      valorOriginal,
      valorFinal,
      desconto,
      acrescimo,
      temDesconto,
      temAcrescimo,
      temAjuste: temDesconto || temAcrescimo,
    };
  }

  function valorNovoServicoAdicional() {
    return valorNumerico(formServicoAdicional.valor);
  }

  function totalComNovoServico() {
    const financeiroAtual = resumoFinanceiroAtendimento(
      agendamentoSelecionado,
      resumoServicosAdicionais,
    );

    return financeiroAtual.total + valorNovoServicoAdicional();
  }

  function resumoFinanceiroComNovoServico() {
    const financeiroAtual = resumoFinanceiroAtendimento(
      agendamentoSelecionado,
      resumoServicosAdicionais,
    );

    const valorNovo = valorNovoServicoAdicional();
    const novoServicoPago = pagamentoConfirmado(
      formServicoAdicional.statusPagamento,
    );

    const pago = financeiroAtual.pago + (novoServicoPago ? valorNovo : 0);
    const pendente =
      financeiroAtual.pendente + (novoServicoPago ? 0 : valorNovo);
    const total = financeiroAtual.total + valorNovo;

    return {
      total,
      pago,
      pendente,
      status:
        total > 0 && pendente <= 0 ? "pago" : pago > 0 ? "parcial" : "pendente",
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

  function intervaloSemanaPorData(dataReferencia?: string | Date | null) {
    const base = dataReferencia
      ? new Date(`${String(dataReferencia).split("T")[0]}T00:00:00`)
      : new Date();

    const inicioSemana = new Date(base);
    inicioSemana.setDate(base.getDate() - base.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);

    return {
      dataInicio: formatarDataInputLocal(inicioSemana),
      dataFim: formatarDataInputLocal(fimSemana),
    };
  }

  function hojeFormatoInput() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function formatarHorario(data: any) {
    if (!data) return "--:--";

    return new Date(data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatarDataHora(data: any) {
    if (!data) return "Não informado";

    return new Date(data).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function formatarCanceladoEm(data?: string | null) {
    if (!data) return "Não informado";

    return new Date(data).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function textoStatus(status?: string | null) {
    if (!status) return "-";

    if (status === "confirmado") return "Confirmado";

    if (status === "cancelado") return "Cancelado";

    if (status === "concluido") return "Finalizado";

    if (status === "em_atendimento") {
      return "Em atendimento";
    }

    return status;
  }

  function nomeCliente(agendamento: any) {
    return (
      agendamento.Cliente?.nome ||
      agendamento.cliente?.nome ||
      agendamento.nomeCliente ||
      agendamento.clienteNome ||
      "Cliente não informado"
    );
  }

  function nomeServico(agendamento: any) {
    return (
      agendamento.Servico?.nome ||
      agendamento.servico?.nome ||
      agendamento.servicoNome ||
      "Serviço não informado"
    );
  }

  function promocaoDoAgendamento(agendamento: any) {
    const servicoId =
      agendamento.servicoId ||
      agendamento.servico?.id ||
      agendamento.Servico?.id;

    if (!servicoId) return null;

    return promocoesAtivas.find(
      (promo: any) =>
        Array.isArray(promo.servicos) &&
        promo.servicos.some(
          (item: any) =>
            item.servicoId === servicoId || item.servico?.id === servicoId,
        ),
    );
  }

  function nomeProfissional(agendamento: any) {
    return (
      agendamento.Profissional?.nome ||
      agendamento.profissional?.nome ||
      agendamento.profissionalNome ||
      "Profissional não informado"
    );
  }

  function whatsappCliente(agendamento: any) {
    return (
      agendamento.Cliente?.whatsapp ||
      agendamento.cliente?.whatsapp ||
      agendamento.whatsapp ||
      ""
    );
  }

  function cpfCliente(agendamento: any) {
    return (
      agendamento.Cliente?.cpf ||
      agendamento.cliente?.cpf ||
      agendamento.cpf ||
      ""
    );
  }

  function clienteIdAtendimento(agendamento: any) {
    return (
      agendamento?.clienteId ||
      agendamento?.cliente?.id ||
      agendamento?.Cliente?.id ||
      ""
    );
  }

  async function carregarFinanceiroClienteAtendimento(agendamento: any) {
    if (!empresa?.id) return;

    const clienteId = clienteIdAtendimento(agendamento);

    if (!clienteId) {
      setResumoFinanceiroCliente({ credito: 0, debito: 0, saldo: 0 });
      return;
    }

    try {
      setCarregandoFinanceiroCliente(true);

      const res = await fetch(
        `/api/v1/clients/financeiro?empresaId=${empresa.id}&clienteId=${clienteId}`,
        { cache: "no-store" },
      );

      const data = await res.json();

      if (data.success) {
        setResumoFinanceiroCliente(
          data.resumo || { credito: 0, debito: 0, saldo: 0 },
        );
      } else {
        setResumoFinanceiroCliente({ credito: 0, debito: 0, saldo: 0 });
      }
    } catch (error) {
      setResumoFinanceiroCliente({ credito: 0, debito: 0, saldo: 0 });
    } finally {
      setCarregandoFinanceiroCliente(false);
    }
  }

  function limparFormFinalizacao() {
    setFormFinalizacao({
      habilitarFechamento: false,
      habilitarAjusteValor: false,
      tipoAjusteFechamento: "desconto",
      habilitarCreditoDebito: false,
      valorDescontoAtendimento: "",
      tipoDescontoAtendimento: "valor",
      valorAcrescimoAtendimento: "",
      tipoAcrescimoAtendimento: "valor",
      observacaoAjusteAtendimento: "",
      usarCreditoCliente: false,
      gerarDebitoCliente: false,
      valorDebitoCliente: "",
      observacaoDebitoCliente: "",
      gerarCreditoCliente: false,
      valorCreditoCliente: "",
      observacaoCreditoCliente: "",
      valorCreditoUtilizadoCliente: "",
      abaterDebitoCliente: false,
      valorAbatimentoDebitoCliente: "",
      observacaoAbatimentoDebitoCliente: "",
      pagamentos: [
        {
          forma: "pix",
          valor: "",
        },
      ],
      observacao: "",
    });
  }

  function valorDescontoFechamento() {
    const valorInformado = valorNumerico(
      formFinalizacao.valorDescontoAtendimento,
    );

    if (formFinalizacao.tipoDescontoAtendimento === "percentual") {
      const financeiroBase = agendamentoSelecionado
        ? resumoFinanceiroAtendimento(
            agendamentoSelecionado,
            resumoServicosAdicionais,
          )
        : { pendente: 0 };

      return (valorNumerico(financeiroBase.pendente) * valorInformado) / 100;
    }

    return valorInformado;
  }

  function valorAcrescimoFechamento() {
    const valorInformado = valorNumerico(
      formFinalizacao.valorAcrescimoAtendimento,
    );

    if (formFinalizacao.tipoAcrescimoAtendimento === "percentual") {
      const financeiroBase = agendamentoSelecionado
        ? resumoFinanceiroAtendimento(
            agendamentoSelecionado,
            resumoServicosAdicionais,
          )
        : { pendente: 0 };

      return (valorNumerico(financeiroBase.pendente) * valorInformado) / 100;
    }

    return valorInformado;
  }

  function pendenteAjustadoFechamento(agendamento: any) {
    const financeiro = resumoFinanceiroAtendimento(
      agendamento,
      resumoServicosAdicionais,
    );

    const desconto = valorDescontoFechamento();
    const acrescimo = valorAcrescimoFechamento();

    return Math.max(financeiro.pendente - desconto + acrescimo, 0);
  }

  function obterPendenciaComCredito(agendamento: any) {
    const pendenteAjustado = pendenteAjustadoFechamento(agendamento);

    const totalPagamentosInformados = formFinalizacao.pagamentos.reduce(
      (total: number, pagamento: any) => total + valorNumerico(pagamento.valor),
      0,
    );

    const pendenteAposPagamentos = Math.max(
      pendenteAjustado - totalPagamentosInformados,
      0,
    );

    const creditoDisponivelCliente = valorNumerico(
      resumoFinanceiroCliente.credito,
    );
    const creditoInformadoCliente = valorNumerico(
      formFinalizacao.valorCreditoUtilizadoCliente,
    );
    const creditoAplicavel = formFinalizacao.usarCreditoCliente
      ? Math.min(
          creditoInformadoCliente > 0
            ? creditoInformadoCliente
            : creditoDisponivelCliente,
          creditoDisponivelCliente,
          pendenteAposPagamentos,
        )
      : 0;

    return {
      pendenteOriginal: pendenteAjustado,
      desconto: valorDescontoFechamento(),
      acrescimo: valorAcrescimoFechamento(),
      pendenteAposPagamentos,
      creditoAplicavel,
      pendenteFinal: Math.max(pendenteAposPagamentos - creditoAplicavel, 0),
    };
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

    if (tipoComissao === "percentual") {
      return (valorServico * valorComissao) / 100;
    }

    if (tipoComissao === "fixo") {
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

  function chaveUnicaAgendamento(agendamento: any) {
    if (agendamento.id) {
      return agendamento.id;
    }

    const clienteId = agendamento.clienteId || agendamento.cliente?.id || "";

    const servicoId = agendamento.servicoId || agendamento.servico?.id || "";

    const profissionalId =
      agendamento.profissionalId || agendamento.profissional?.id || "";

    const dataHora = agendamento.dataHoraInicio
      ? new Date(agendamento.dataHoraInicio).toISOString()
      : "";

    return `${clienteId}-${servicoId}-${profissionalId}-${dataHora}`;
  }

  function removerAgendamentosDuplicados(lista: any[]) {
    const mapa = new Map<string, any>();

    lista.forEach((agendamento) => {
      const chave = chaveUnicaAgendamento(agendamento);
      const existente = mapa.get(chave);

      if (!existente) {
        mapa.set(chave, agendamento);
        return;
      }

      const prioridadeStatus: Record<string, number> = {
        concluido: 5,
        em_atendimento: 4,
        confirmado: 3,
        pendente: 2,
        cancelado: 1,
      };

      const prioridadeAtual = prioridadeStatus[agendamento.status] || 0;
      const prioridadeExistente = prioridadeStatus[existente.status] || 0;

      if (prioridadeAtual > prioridadeExistente) {
        mapa.set(chave, agendamento);
      }
    });

    return Array.from(mapa.values());
  }

  function abrirFechamentoAtendimento(agendamento: any) {
    if (!agendamento?.id) return;

    setModalReagendamentoAberto(true);
    setPesquisaReagendamento("");
    selecionarAgendamentoPainel(agendamento);
  }

  function limparFormServicoAdicional() {
    setFormServicoAdicional({
      servicoId: "",
      profissionalId: "",
      valor: "",
      statusPagamento: "pendente",
      formaPagamento: "",
      observacao: "",
    });
  }

  function registroAtivoPainel(item: any) {
    if (!item) return false;

    const ativo = item?.ativo;
    const status = String(item?.status || item?.situacao || "").toLowerCase();

    if (ativo === false) return false;

    if (
      status === "inativo" ||
      status === "inativa" ||
      status === "desativado" ||
      status === "desativada" ||
      status === "bloqueado" ||
      status === "bloqueada"
    ) {
      return false;
    }

    return true;
  }

  function normalizarIdPainel(valor: any) {
    if (valor === null || valor === undefined || valor === "") return "";

    return String(valor);
  }

  function idsServicosDoProfissionalPainel(profissional: any) {
    const fontes = [
      profissional?.servicos,
      profissional?.Servicos,
      profissional?.servicosVinculados,
      profissional?.profissionalServicos,
      profissional?.ProfissionalServico,
      profissional?.ProfissionalServicos,
      profissional?.servicosIds,
      profissional?.servicoIds,
    ];

    const ids = fontes.filter(Array.isArray).flatMap((lista: any[]) =>
      lista
        .map((item: any) => {
          if (typeof item === "string") return item;

          return (
            item?.servicoId ||
            item?.ServicoId ||
            item?.servico_id ||
            item?.idServico ||
            item?.servico?.id ||
            item?.Servico?.id ||
            item?.servico?.servicoId ||
            item?.Servico?.servicoId ||
            ""
          );
        })
        .map(normalizarIdPainel)
        .filter(Boolean),
    );

    return Array.from(new Set(ids));
  }

  function idsProfissionaisDoServicoPainel(servico: any) {
    const fontes = [
      servico?.profissionais,
      servico?.Profissionais,
      servico?.profissionaisVinculados,
      servico?.servicoProfissionais,
      servico?.ServicoProfissional,
      servico?.ServicoProfissionais,
      servico?.profissionaisIds,
      servico?.profissionalIds,
    ];

    const ids = fontes.filter(Array.isArray).flatMap((lista: any[]) =>
      lista
        .map((item: any) => {
          if (typeof item === "string") return item;

          return (
            item?.profissionalId ||
            item?.ProfissionalId ||
            item?.profissional_id ||
            item?.idProfissional ||
            item?.profissional?.id ||
            item?.Profissional?.id ||
            item?.profissional?.profissionalId ||
            item?.Profissional?.profissionalId ||
            ""
          );
        })
        .map(normalizarIdPainel)
        .filter(Boolean),
    );

    return Array.from(new Set(ids));
  }

  function profissionalAtendeServicoPainel(
    profissional: any,
    servicoId?: string,
  ) {
    const servicoIdNormalizado = normalizarIdPainel(servicoId);

    if (!servicoIdNormalizado) return true;

    const idsServicos = idsServicosDoProfissionalPainel(profissional);

    if (idsServicos.length > 0) {
      return idsServicos.includes(servicoIdNormalizado);
    }

    const servico = servicosEmpresa.find(
      (item: any) => normalizarIdPainel(item.id) === servicoIdNormalizado,
    );

    const idsProfissionais = idsProfissionaisDoServicoPainel(servico);

    if (idsProfissionais.length > 0) {
      return idsProfissionais.includes(normalizarIdPainel(profissional?.id));
    }

    return false;
  }

  function servicoAtendidoPorProfissionalPainel(
    servico: any,
    profissionalId?: string,
  ) {
    const profissionalIdNormalizado = normalizarIdPainel(profissionalId);

    if (!profissionalIdNormalizado) return true;

    const idsProfissionais = idsProfissionaisDoServicoPainel(servico);

    if (idsProfissionais.length > 0) {
      return idsProfissionais.includes(profissionalIdNormalizado);
    }

    const profissional = profissionaisEmpresa.find(
      (item: any) => normalizarIdPainel(item.id) === profissionalIdNormalizado,
    );

    const idsServicos = idsServicosDoProfissionalPainel(profissional);

    if (idsServicos.length > 0) {
      return idsServicos.includes(normalizarIdPainel(servico?.id));
    }

    return false;
  }

  function servicosAtivosParaAdicional(
    profissionalId = formServicoAdicional.profissionalId,
  ) {
    return servicosEmpresa.filter(
      (servico: any) =>
        registroAtivoPainel(servico) &&
        servicoAtendidoPorProfissionalPainel(servico, profissionalId),
    );
  }

  function profissionaisAtivosParaAdicional(
    servicoId = formServicoAdicional.servicoId,
  ) {
    return profissionaisEmpresa.filter(
      (profissional: any) =>
        registroAtivoPainel(profissional) &&
        profissionalAtendeServicoPainel(profissional, servicoId),
    );
  }

  async function carregarServicosAdicionais(agendamento: any) {
    if (!empresa?.id || !agendamento?.id) return;

    try {
      const res = await fetch(
        `/api/agendamentos/servicos?empresaId=${empresa.id}&agendamentoId=${agendamento.id}`,
        { cache: "no-store" },
      );

      const data = await res.json();

      if (!data.success) {
        setServicosAdicionais([]);
        setResumoServicosAdicionais({
          total: 0,
          totalPago: 0,
          totalPendente: 0,
        });
        return;
      }

      setServicosAdicionais(data.itens || []);
      setResumoServicosAdicionais(
        data.resumo || { total: 0, totalPago: 0, totalPendente: 0 },
      );
    } catch (error) {
      setServicosAdicionais([]);
      setResumoServicosAdicionais({ total: 0, totalPago: 0, totalPendente: 0 });
    }
  }

  function alterarServicoAdicionalSelecionado(servicoId: string) {
    const servico = servicosAtivosParaAdicional().find(
      (item: any) => item.id === servicoId,
    );
    const profissionaisVinculados = profissionaisAtivosParaAdicional(servicoId);
    const profissionalSelecionadoAindaValido =
      formServicoAdicional.profissionalId &&
      profissionaisVinculados.some(
        (profissional: any) =>
          profissional.id === formServicoAdicional.profissionalId,
      );

    setFormServicoAdicional({
      ...formServicoAdicional,
      servicoId,
      profissionalId: profissionalSelecionadoAindaValido
        ? formServicoAdicional.profissionalId
        : "",
      valor:
        servico?.valor !== undefined && servico?.valor !== null
          ? String(servico.valor)
          : "",
    });
  }

  function alterarProfissionalAdicionalSelecionado(profissionalId: string) {
    const servicoSelecionadoAindaValido =
      formServicoAdicional.servicoId &&
      servicosAtivosParaAdicional(profissionalId).some(
        (servico: any) => servico.id === formServicoAdicional.servicoId,
      );

    setFormServicoAdicional({
      ...formServicoAdicional,
      profissionalId,
      servicoId: servicoSelecionadoAindaValido
        ? formServicoAdicional.servicoId
        : "",
      valor: servicoSelecionadoAindaValido ? formServicoAdicional.valor : "",
    });
  }

  async function adicionarServicoAoAtendimento() {
    if (!empresa?.id) return;

    if (!agendamentoSelecionado?.id) {
      alert("Selecione um atendimento.");
      return;
    }

    if (!formServicoAdicional.servicoId) {
      alert("Selecione o serviço adicional.");
      return;
    }

    try {
      setSalvandoServicoAdicional(true);

      const res = await fetch("/api/agendamentos/servicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        alert(data.error || "Erro ao adicionar serviço ao atendimento.");
        return;
      }

      alert("Serviço adicionado ao atendimento com sucesso!");

      limparFormServicoAdicional();

      if (data.agendamento) {
        setAgendamentoSelecionado(data.agendamento);
      }

      await carregarServicosAdicionais(
        data.agendamento || agendamentoSelecionado,
      );
      await carregar(empresa.id);
    } catch (error) {
      alert("Erro ao adicionar serviço ao atendimento.");
    } finally {
      setSalvandoServicoAdicional(false);
    }
  }

  async function finalizarAtendimento() {
    if (!empresa?.id) return;

    if (!usuarioTemPermissao("finalizarAtendimento")) {
      alert("Você não tem permissão para finalizar atendimentos.");
      return;
    }

    if (!agendamentoSelecionado?.id) {
      alert("Selecione um atendimento.");
      return;
    }

    const dataAtendimento = new Date(agendamentoSelecionado.dataHoraInicio);

    const agora = new Date();

    const mesmaDataAtendimento =
      dataAtendimento.getFullYear() === agora.getFullYear() &&
      dataAtendimento.getMonth() === agora.getMonth() &&
      dataAtendimento.getDate() === agora.getDate();

    const atendimentoEmAndamento =
      agendamentoSelecionado.status === "em_atendimento";

    if (
      dataAtendimento.getTime() > agora.getTime() &&
      !(mesmaDataAtendimento && atendimentoEmAndamento)
    ) {
      alert(
        "Este atendimento ainda está agendado para uma data futura.\n\nA finalização só será liberada após a data e horário do atendimento.",
      );

      return;
    }

    const financeiro = resumoFinanceiroAtendimento(
      agendamentoSelecionado,
      resumoServicosAdicionais,
    );

    const descontoFechamento = valorDescontoFechamento();
    const acrescimoFechamento = valorAcrescimoFechamento();
    const pendenteAjustadoFechamentoAtual = pendenteAjustadoFechamento(
      agendamentoSelecionado,
    );

    if (descontoFechamento < 0 || acrescimoFechamento < 0) {
      alert("Desconto e acréscimo não podem ser negativos.");
      return;
    }

    if (descontoFechamento > financeiro.pendente + acrescimoFechamento) {
      alert(
        `O desconto não pode ser maior que o saldo pendente ajustado (${dinheiro(
          financeiro.pendente + acrescimoFechamento,
        )}).`,
      );
      return;
    }

    const totalPagamentosInformados = formFinalizacao.pagamentos.reduce(
      (total: number, pagamento: any) => total + valorNumerico(pagamento.valor),
      0,
    );

    const temDinheiro = formFinalizacao.pagamentos.some(
      (pagamento: any) => pagamento.forma === "dinheiro",
    );

    const pendenciaComCredito = obterPendenciaComCredito(
      agendamentoSelecionado,
    );
    const debitoClienteDisponivel = valorNumerico(
      resumoFinanceiroCliente.debito,
    );
    const valorAbatimentoDebitoCliente = formFinalizacao.abaterDebitoCliente
      ? valorNumerico(formFinalizacao.valorAbatimentoDebitoCliente)
      : 0;
    const creditoDisponivelCliente = valorNumerico(
      resumoFinanceiroCliente.credito,
    );
    const creditoInformadoCliente = valorNumerico(
      formFinalizacao.valorCreditoUtilizadoCliente,
    );
    const creditoAplicadoFechamento = formFinalizacao.usarCreditoCliente
      ? Math.min(
          creditoInformadoCliente > 0
            ? creditoInformadoCliente
            : creditoDisponivelCliente,
          creditoDisponivelCliente,
          pendenteAjustadoFechamentoAtual,
        )
      : 0;
    const totalAReceberFechamento =
      Math.max(pendenteAjustadoFechamentoAtual - creditoAplicadoFechamento, 0) +
      valorAbatimentoDebitoCliente;
    const excedentePagamento = Math.max(
      totalPagamentosInformados - totalAReceberFechamento,
      0,
    );
    const saldoFechamentoAtual = Math.max(
      totalAReceberFechamento - totalPagamentosInformados,
      0,
    );

    if (formFinalizacao.abaterDebitoCliente) {
      if (valorAbatimentoDebitoCliente <= 0) {
        alert("Informe o valor do débito que será cobrado neste fechamento.");
        return;
      }

      if (valorAbatimentoDebitoCliente > debitoClienteDisponivel) {
        alert(
          `O débito cobrado não pode ser maior que o débito disponível do cliente (${dinheiro(debitoClienteDisponivel)}).`,
        );
        return;
      }

      if (saldoFechamentoAtual > 0) {
        alert(
          `O saldo a pagar atualizado é ${dinheiro(totalAReceberFechamento)}. Informe o recebimento completo ou desative a cobrança do débito neste fechamento.`,
        );
        return;
      }
    }

    if (excedentePagamento > 0) {
      if (!formFinalizacao.abaterDebitoCliente && debitoClienteDisponivel > 0) {
        const abatimentoSugerido = Math.min(
          excedentePagamento,
          debitoClienteDisponivel,
        );

        const desejaAbaterDebito = window.confirm(
          `O cliente possui débito aberto de ${dinheiro(
            debitoClienteDisponivel,
          )}.\n\nO pagamento informado tem excedente de ${dinheiro(
            excedentePagamento,
          )}.\n\nDeseja usar esse valor excedente para abater o débito do cliente?`,
        );

        if (desejaAbaterDebito) {
          setFormFinalizacao({
            ...formFinalizacao,
            abaterDebitoCliente: true,
            valorAbatimentoDebitoCliente: String(abatimentoSugerido.toFixed(2)),
          });

          alert(
            `Confirme o valor que será abatido do débito do cliente e clique novamente em Finalizar atendimento.`,
          );

          return;
        }
      }

      if (formFinalizacao.abaterDebitoCliente) {
        if (valorAbatimentoDebitoCliente <= 0) {
          alert("Informe o valor que será abatido dos débitos do cliente.");
          return;
        }

        if (valorAbatimentoDebitoCliente > excedentePagamento) {
          alert(
            `O abatimento não pode ser maior que o valor excedente recebido (${dinheiro(excedentePagamento)}).`,
          );
          return;
        }

        if (valorAbatimentoDebitoCliente > debitoClienteDisponivel) {
          alert(
            `O abatimento não pode ser maior que o débito aberto do cliente (${dinheiro(debitoClienteDisponivel)}).`,
          );
          return;
        }
      }

      const excedenteRestante = Math.max(
        excedentePagamento - valorAbatimentoDebitoCliente,
        0,
      );

      if (excedenteRestante > 0 && !temDinheiro) {
        alert(
          "O valor recebido é maior que o pendente. Para valor excedente, abata nos débitos do cliente ou informe pagamento em dinheiro para gerar troco.",
        );
        return;
      }

      if (excedenteRestante > 0 && temDinheiro) {
        const confirmarTroco = window.confirm(
          `O valor informado é maior que o pendente.\n\nPendente ajustado: ${dinheiro(
            pendenteAjustadoFechamentoAtual,
          )}\nRecebido: ${dinheiro(
            totalPagamentosInformados,
          )}\nExcedente: ${dinheiro(
            excedentePagamento,
          )}\nAbatimento em débitos: ${dinheiro(
            valorAbatimentoDebitoCliente,
          )}\nTroco: ${dinheiro(
            excedenteRestante,
          )}\n\nDeseja finalizar com troco?`,
        );

        if (!confirmarTroco) return;
      }
    }

    if (pendenciaComCredito.pendenteFinal > 0) {
      const valorDebitoCliente = valorNumerico(
        formFinalizacao.valorDebitoCliente,
      );

      if (formFinalizacao.gerarDebitoCliente && valorDebitoCliente <= 0) {
        alert("Informe o valor do débito que será lançado para o cliente.");
        return;
      }

      if (
        formFinalizacao.gerarDebitoCliente &&
        valorDebitoCliente > pendenciaComCredito.pendenteFinal
      ) {
        alert(
          `O débito informado não pode ser maior que o pendente final (${dinheiro(
            pendenciaComCredito.pendenteFinal,
          )}).`,
        );
        return;
      }

      if (!formFinalizacao.gerarDebitoCliente) {
        const confirmarSemDebito = window.confirm(
          `Ainda ficará pendente ${dinheiro(
            pendenciaComCredito.pendenteFinal,
          )}. Deseja finalizar sem registrar débito no cadastro do cliente?`,
        );

        if (!confirmarSemDebito) return;
      }
    }

    if (
      formFinalizacao.gerarCreditoCliente &&
      valorNumerico(formFinalizacao.valorCreditoCliente) <= 0
    ) {
      alert("Informe o valor do crédito que será lançado para o cliente.");
      return;
    }

    const confirmar = window.confirm("Deseja finalizar este atendimento?");

    if (!confirmar) return;

    try {
      setFinalizandoAtendimento(true);

      const res = await fetch("/api/agendamentos/finalizar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresaId: empresa.id,
          agendamentoId: agendamentoSelecionado.id,
          pagamentos: formFinalizacao.pagamentos,
          observacao: formFinalizacao.observacao,
          valorDescontoAtendimento: formFinalizacao.valorDescontoAtendimento,
          tipoDescontoAtendimento: formFinalizacao.tipoDescontoAtendimento,
          valorAcrescimoAtendimento: formFinalizacao.valorAcrescimoAtendimento,
          tipoAcrescimoAtendimento: formFinalizacao.tipoAcrescimoAtendimento,
          observacaoAjusteAtendimento:
            formFinalizacao.observacaoAjusteAtendimento,
          usarCreditoCliente: formFinalizacao.usarCreditoCliente,
          gerarDebitoCliente: formFinalizacao.gerarDebitoCliente,
          valorDebitoCliente: formFinalizacao.valorDebitoCliente,
          observacaoDebitoCliente: formFinalizacao.observacaoDebitoCliente,
          gerarCreditoCliente: formFinalizacao.gerarCreditoCliente,
          valorCreditoCliente: formFinalizacao.valorCreditoCliente,
          observacaoCreditoCliente: formFinalizacao.observacaoCreditoCliente,
          valorCreditoUtilizadoCliente:
            formFinalizacao.valorCreditoUtilizadoCliente,
          abaterDebitoCliente: formFinalizacao.abaterDebitoCliente,
          valorAbatimentoDebitoCliente:
            formFinalizacao.valorAbatimentoDebitoCliente,
          observacaoAbatimentoDebitoCliente:
            formFinalizacao.observacaoAbatimentoDebitoCliente,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Erro ao finalizar atendimento.");
        return;
      }

      alert(data.message);

      setAgendamentoSelecionado(data.atendimento);
      await carregarFinanceiroClienteAtendimento(data.atendimento);

      await carregar(empresa.id);
      await carregarAtendimentosCentral(empresa.id);
    } catch (error) {
      alert("Erro ao finalizar atendimento.");
    } finally {
      setFinalizandoAtendimento(false);
    }
  }

  async function confirmarPresenca(agendamento: any) {
    if (!empresa?.id || !agendamento?.id) return;

    if (agendamento.status === "em_atendimento") {
      selecionarAgendamentoPainel(agendamento);
      return;
    }

    const confirmar = window.confirm(
      `Confirmar que ${nomeCliente(agendamento)} compareceu ao atendimento?`,
    );

    if (!confirmar) return;

    try {
      setConfirmandoPresencaId(agendamento.id);

      const res = await fetch("/api/agendamentos/confirmar-presenca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: empresa.id,
          agendamentoId: agendamento.id,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Erro ao confirmar presença.");
        return;
      }

      alert("Atendimento iniciado com sucesso!");

      await carregar(empresa.id);
      if (modalReagendamentoAberto) {
        await carregarAtendimentosCentral(empresa.id);
      }
    } catch (error) {
      alert("Erro ao confirmar presença.");
    } finally {
      setConfirmandoPresencaId(null);
    }
  }

  function formatarDataInputLocal(data?: Date) {
    const dataBase = data || new Date();

    const ano = dataBase.getFullYear();
    const mes = String(dataBase.getMonth() + 1).padStart(2, "0");
    const dia = String(dataBase.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function intervaloSemanaAtualCentral() {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);

    return {
      dataInicio: formatarDataInputLocal(inicioSemana),
      dataFim: formatarDataInputLocal(fimSemana),
    };
  }

  async function carregarAtendimentosCentral(empresaId = empresa?.id) {
    if (!empresaId) return;

    try {
      setCarregandoCentral(true);

      const params = new URLSearchParams({
        empresaId,
      });

      const res = await fetch(
        `/api/dashboard/agendamentos?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const data = await res.json();

      if (!data.success) {
        setAgendamentosCentral([]);
        return;
      }

      setAgendamentosCentral(data.agendamentos || []);
    } catch (error) {
      setAgendamentosCentral([]);
      alert("Erro ao carregar atendimentos da central.");
    } finally {
      setCarregandoCentral(false);
    }
  }

  function abrirModalReagendamento() {
    setModalReagendamentoAberto(true);
    setPesquisaReagendamento("");
    setAgendamentoSelecionado(null);
    setNovaDataReagendamento("");
    setHorariosReagendamento([]);
    setHorarioReagendamento("");
    setServicosAdicionais([]);
    setResumoServicosAdicionais({ total: 0, totalPago: 0, totalPendente: 0 });
    limparFormServicoAdicional();
    setAgendamentosCentral([]);

    if (empresa?.id) {
      carregarAtendimentosCentral(empresa.id);
    }
  }

  function fecharModalReagendamento() {
    setModalReagendamentoAberto(false);
    setPesquisaReagendamento("");
    setAgendamentoSelecionado(null);
    setNovaDataReagendamento("");
    setHorariosReagendamento([]);
    setHorarioReagendamento("");
    setServicosAdicionais([]);
    setResumoServicosAdicionais({ total: 0, totalPago: 0, totalPendente: 0 });
    setAgendamentosCentral([]);
    limparFormServicoAdicional();
  }

  function selecionarAgendamentoPainel(agendamento: any) {
    setAgendamentoSelecionado(agendamento);
    setNovaDataReagendamento("");
    setHorariosReagendamento([]);
    setHorarioReagendamento("");
    limparFormServicoAdicional();
    limparFormFinalizacao();
    carregarServicosAdicionais(agendamento);
    carregarFinanceiroClienteAtendimento(agendamento);
  }

  async function buscarHorariosReagendamento() {
    if (!agendamentoSelecionado) {
      alert("Selecione um agendamento.");
      return;
    }

    if (!novaDataReagendamento) {
      alert("Selecione a nova data.");
      return;
    }

    if (novaDataReagendamento < hojeFormatoInput()) {
      alert("A nova data não pode ser anterior ao dia atual.");
      setNovaDataReagendamento("");
      setHorariosReagendamento([]);
      setHorarioReagendamento("");
      return;
    }

    const servicoId = agendamentoSelecionado.servicoId;
    const profissionalId = agendamentoSelecionado.profissionalId;

    if (!servicoId || !profissionalId) {
      alert("Este agendamento não possui serviço ou profissional vinculado.");
      return;
    }

    try {
      setBuscandoHorarios(true);

      const res = await fetch(
        `/api/horarios-disponiveis?profissionalId=${profissionalId}&servicoId=${servicoId}&data=${novaDataReagendamento}`,
      );

      const data = await res.json();

      setHorariosReagendamento(data.horarios || []);
      setHorarioReagendamento("");
    } catch (error) {
      alert("Erro ao buscar horários disponíveis.");
    } finally {
      setBuscandoHorarios(false);
    }
  }

  async function confirmarReagendamento() {
    if (!empresa) return;

    if (!usuarioTemPermissao("reagendarAtendimento")) {
      alert("Você não tem permissão para reagendar atendimentos.");
      return;
    }

    if (!agendamentoSelecionado) {
      alert("Selecione um agendamento.");
      return;
    }

    if (!novaDataReagendamento) {
      alert("Selecione a nova data.");
      return;
    }

    if (!horarioReagendamento) {
      alert("Selecione o novo horário.");
      return;
    }

    try {
      setReagendando(true);

      const novaDataHora = new Date(
        `${novaDataReagendamento}T${horarioReagendamento}`,
      );

      const res = await fetch("/api/agendamentos/reagendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        alert(data.error || "Erro ao reagendar atendimento.");
        return;
      }

      alert("Atendimento reagendado com sucesso!");

      setAgendamentoSelecionado(data.agendamento);
      setNovaDataReagendamento("");
      setHorariosReagendamento([]);
      setHorarioReagendamento("");

      await carregar(empresa.id);
      if (modalReagendamentoAberto) {
        await carregarAtendimentosCentral(empresa.id);
      }
    } catch (error) {
      alert("Erro ao reagendar atendimento.");
    } finally {
      setReagendando(false);
    }
  }

  async function cancelarAgendamento() {
    if (!empresa) return;

    if (!usuarioTemPermissao("cancelarAtendimento")) {
      alert("Você não tem permissão para cancelar atendimentos.");
      return;
    }

    if (!agendamentoSelecionado) {
      alert("Selecione um agendamento.");
      return;
    }

    if (agendamentoSelecionado.status === "cancelado") {
      alert("Este atendimento já está cancelado.");
      return;
    }

    const motivoCancelamento =
      window.prompt("Motivo do cancelamento (opcional):") || "";

    const confirmar = window.confirm(
      `Tem certeza que deseja cancelar o atendimento de ${nomeCliente(
        agendamentoSelecionado,
      )}? O registro continuará salvo como cancelado e o horário ficará disponível para novos agendamentos.`,
    );

    if (!confirmar) return;

    try {
      setCancelando(true);

      const res = await fetch("/api/agendamentos/reagendar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agendamentoId: agendamentoSelecionado.id,
          motivoCancelamento,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Erro ao cancelar atendimento.");
        return;
      }

      alert("Atendimento cancelado com sucesso!");

      setAgendamentoSelecionado(null);
      setNovaDataReagendamento("");
      setHorariosReagendamento([]);
      setHorarioReagendamento("");
      setServicosAdicionais([]);
      setResumoServicosAdicionais({ total: 0, totalPago: 0, totalPendente: 0 });
      limparFormServicoAdicional();

      await carregar(empresa.id);
      if (modalReagendamentoAberto) {
        await carregarAtendimentosCentral(empresa.id);
      }
    } catch (error) {
      alert("Erro ao cancelar atendimento.");
    } finally {
      setCancelando(false);
    }
  }

  const agendamentosUnicos = removerAgendamentosDuplicados(agendamentos);
  const agendamentosCentralUnicos =
    removerAgendamentosDuplicados(agendamentosCentral);
  const agendamentosSemanaPrevisaoUnicos = removerAgendamentosDuplicados(
    agendamentosSemanaPrevisao,
  );

  const agendamentosOperacionaisBase = agendamentosUnicos;

  const agendamentosHoje = agendamentosOperacionaisBase
    .filter(
      (agendamento) =>
        ehHoje(agendamento.dataHoraInicio) &&
        agendamento.status !== "cancelado",
    )
    .sort((a, b) => {
      const aFinalizado =
        a.status === "concluido" || a.statusPagamento === "pago";

      const bFinalizado =
        b.status === "concluido" || b.statusPagamento === "pago";

      if (aFinalizado && !bFinalizado) return 1;
      if (!aFinalizado && bFinalizado) return -1;

      return (
        new Date(a.dataHoraInicio).getTime() -
        new Date(b.dataHoraInicio).getTime()
      );
    });

  const agendamentosSemana = agendamentosOperacionaisBase.filter(
    (agendamento) => estaNaSemanaAtual(agendamento.dataHoraInicio),
  );

  const agendamentosSemanaOperacionalBase = agendamentosOperacionaisBase;

  const agendamentosSemanaOperacional =
    agendamentosSemanaOperacionalBase.filter(
      (agendamento) =>
        estaNaSemanaAtual(agendamento.dataHoraInicio) &&
        agendamento.status !== "cancelado",
    );

  const baseAgendamentosCentral = modalReagendamentoAberto
    ? agendamentosCentralUnicos
    : agendamentosUnicos;

  const agendamentosFuturos = baseAgendamentosCentral
    .filter((agendamento) => {
      if (!agendamento.dataHoraInicio) return false;

      if (filtroCentralAtendimentos === "abertosHoje") {
        return (
          ehHoje(agendamento.dataHoraInicio) &&
          agendamento.status !== "concluido" &&
          agendamento.status !== "cancelado"
        );
      }

      if (filtroCentralAtendimentos === "abertos") {
        return (
          agendamento.status !== "concluido" &&
          agendamento.status !== "cancelado"
        );
      }

      if (filtroCentralAtendimentos === "finalizados") {
        return agendamento.status === "concluido";
      }

      if (filtroCentralAtendimentos === "cancelados") {
        return agendamento.status === "cancelado";
      }

      return true;
    })
    .sort((a, b) => {
      const aFinalizado =
        a.status === "concluido" || a.statusPagamento === "pago";

      const bFinalizado =
        b.status === "concluido" || b.statusPagamento === "pago";

      if (aFinalizado && !bFinalizado) return 1;
      if (!aFinalizado && bFinalizado) return -1;

      return (
        new Date(a.dataHoraInicio).getTime() -
        new Date(b.dataHoraInicio).getTime()
      );
    });

  const agendamentosFuturosFiltrados = agendamentosFuturos.filter(
    (agendamento) => {
      const termo = pesquisaReagendamento.trim().toLowerCase();

      if (!termo) return true;

      const termoNumerico = termo.replace(/\D/g, "");

      const cliente = nomeCliente(agendamento).toLowerCase();
      const servico = nomeServico(agendamento).toLowerCase();
      const profissional = nomeProfissional(agendamento).toLowerCase();
      const whatsapp = String(whatsappCliente(agendamento)).replace(/\D/g, "");
      const cpf = String(cpfCliente(agendamento)).replace(/\D/g, "");

      return (
        cliente.includes(termo) ||
        servico.includes(termo) ||
        profissional.includes(termo) ||
        whatsapp.includes(termoNumerico) ||
        cpf.includes(termoNumerico)
      );
    },
  );

  const proximoCliente = agendamentosHoje.find((agendamento) => {
    if (!agendamento.dataHoraInicio) return false;
    return new Date(agendamento.dataHoraInicio).getTime() >= Date.now();
  });

  const faturamentoHoje = agendamentosHoje
    .filter((a) => a.statusPagamento === "pago")
    .reduce((total, a) => total + Number(a.valorTotal || 0), 0);

  const comissaoHoje = agendamentosHoje
    .filter((a) => a.statusPagamento === "pago")
    .reduce((total, a) => total + calcularComissao(a), 0);

  const servicosRequisitadosSemana = agruparPorNome(
    agendamentosSemanaOperacional,
    nomeServico,
  ).slice(0, 5);

  const profissionaisRequisitadosSemana = agruparPorNome(
    agendamentosSemanaOperacional,
    nomeProfissional,
  ).slice(0, 5);

  const rankingClientesDashboard = Array.isArray(rankingDashboard?.clientes)
    ? rankingDashboard.clientes
    : [];
  const rankingServicosDashboard = Array.isArray(rankingDashboard?.servicos)
    ? rankingDashboard.servicos
    : [];
  const rankingProfissionaisDashboard = Array.isArray(
    rankingDashboard?.profissionais,
  )
    ? rankingDashboard.profissionais
    : [];

  const rankingAtivoDashboard =
    abaRankingDashboard === "clientes"
      ? rankingClientesDashboard
      : abaRankingDashboard === "servicos"
        ? rankingServicosDashboard
        : rankingProfissionaisDashboard;

  const rankingAtivoFiltrado = rankingAtivoDashboard.filter((item: any) => {
    const termo = pesquisaRanking.trim().toLowerCase();

    if (!termo) return true;

    return String(item?.nome || "")
      .toLowerCase()
      .includes(termo);
  });

  const rankingTopDashboard = rankingAtivoDashboard.slice(0, 5);

  function aplicarFiltroDashboard() {
    if (!empresa?.id) return;

    if (!dataInicioFiltro || !dataFimFiltro) {
      alert("Informe a data inicial e a data final.");
      return;
    }

    if (
      dataInicioFiltro > hojeFormatoInput() ||
      dataFimFiltro > hojeFormatoInput()
    ) {
      alert("O filtro do dashboard não permite datas futuras.");
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

    const dataInicio = formatarDataInputLocal(inicio);
    const dataFim = formatarDataInputLocal(fim);

    setDataInicioFiltro(dataInicio);
    setDataFimFiltro(dataFim);
    setPeriodoAplicado({
      dataInicio,
      dataFim,
    });

    carregar(empresa.id, dataInicio, dataFim);
  }

  function aplicarFiltroRankingDashboard() {
    if (!empresa?.id) return;

    if (!dataInicioRanking || !dataFimRanking) {
      alert("Informe a data inicial e a data final do ranking.");
      return;
    }

    if (dataInicioRanking > dataFimRanking) {
      alert("A data inicial do ranking não pode ser maior que a data final.");
      return;
    }

    if (
      dataInicioRanking > hojeFormatoInput() ||
      dataFimRanking > hojeFormatoInput()
    ) {
      alert("O ranking não permite datas futuras.");
      return;
    }

    setPeriodoRankingAplicado({
      dataInicio: dataInicioRanking,
      dataFim: dataFimRanking,
    });

    carregarRankingsDashboard(empresa.id, dataInicioRanking, dataFimRanking);
  }

  function filtrarRankingMesAtual() {
    if (!empresa?.id) return;

    const intervalo = obterIntervaloMesAtualDashboard();

    setDataInicioRanking(intervalo.dataInicio);
    setDataFimRanking(intervalo.dataFim);
    setPeriodoRankingAplicado(intervalo);
    carregarRankingsDashboard(
      empresa.id,
      intervalo.dataInicio,
      intervalo.dataFim,
    );
  }

  function filtrarRankingUltimosDias(dias: number) {
    if (!empresa?.id) return;

    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(fim.getDate() - dias + 1);

    const dataInicio = formatarDataInputLocal(inicio);
    const dataFim = formatarDataInputLocal(fim);

    setDataInicioRanking(dataInicio);
    setDataFimRanking(dataFim);
    setPeriodoRankingAplicado({ dataInicio, dataFim });
    carregarRankingsDashboard(empresa.id, dataInicio, dataFim);
  }

  function medalhaRanking(index: number) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";

    return `${index + 1}º`;
  }

  function formatarData(data?: any) {
    if (!data) return "Não informado";

    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) return "Não informado";

    return dataObj.toLocaleDateString("pt-BR");
  }

  function formatarPeriodoRanking() {
    return `${formatarData(periodoRankingAplicado.dataInicio)} até ${formatarData(
      periodoRankingAplicado.dataFim,
    )}`;
  }

  function abrirCadastroClienteRanking(cliente: any) {
    if (!cliente?.clienteId) {
      alert("Este cliente não possui cadastro vinculado para abrir.");
      return;
    }

    window.location.href = `/clientes?clienteId=${cliente.clienteId}`;
  }

  const agendamentosPeriodoValidos = agendamentosUnicos.filter(
    (agendamento) => agendamento.status !== "cancelado",
  );

  const agendamentosCanceladosPeriodo = agendamentosUnicos.filter(
    (agendamento) => agendamento.status === "cancelado",
  );

  const agendamentosConcluidosPeriodo = agendamentosUnicos.filter(
    (agendamento) => agendamento.status === "concluido",
  );

  const agendamentosPendentesPeriodo = agendamentosUnicos.filter(
    (agendamento) => agendamento.status === "pendente",
  );

  const atendimentosEmAndamento = agendamentosUnicos.filter(
    (agendamento) => agendamento.status === "em_atendimento",
  );

  const financeiroPeriodo = agendamentosPeriodoValidos.reduce(
    (acc: any, agendamento: any) => {
      const financeiro = resumoFinanceiroAtendimento(agendamento);

      acc.total += financeiro.total;
      acc.pago += financeiro.pago;
      acc.pendente += financeiro.pendente;

      return acc;
    },
    {
      total: 0,
      pago: 0,
      pendente: 0,
    },
  );

  const faturamentoPeriodo =
    valorNumerico(resumo.faturamentoBruto) ||
    valorNumerico(resumo.faturamentoTotal) ||
    financeiroPeriodo.pago;

  const custoOperacionalPeriodo = valorNumerico(resumo.custoOperacionalTotal);
  const comissoesPeriodo = valorNumerico(
    resumo.comissaoTotal || resumo.comissoesTotal,
  );
  const lucroLiquidoPeriodo =
    valorNumerico(resumo.lucroLiquido) ||
    Math.max(
      faturamentoPeriodo - custoOperacionalPeriodo - comissoesPeriodo,
      0,
    );

  const atendimentosPagosPeriodo = agendamentosPeriodoValidos.filter(
    (agendamento) => {
      const financeiro = resumoFinanceiroAtendimento(agendamento);
      return financeiro.pago > 0 && agendamento.status !== "cancelado";
    },
  );

  const ticketMedioPeriodo =
    atendimentosPagosPeriodo.length > 0
      ? faturamentoPeriodo / atendimentosPagosPeriodo.length
      : 0;

  const taxaCancelamentoPeriodo =
    agendamentosUnicos.length > 0
      ? Math.round(
          (agendamentosCanceladosPeriodo.length / agendamentosUnicos.length) *
            100,
        )
      : 0;

  const taxaConclusaoPeriodo =
    agendamentosUnicos.length > 0
      ? Math.round(
          (agendamentosConcluidosPeriodo.length / agendamentosUnicos.length) *
            100,
        )
      : 0;

  const agendamentosPrevisaoPeriodoValidos = agendamentosPeriodoValidos;

  const previsaoPeriodo = agendamentosPrevisaoPeriodoValidos.reduce(
    (total, agendamento) => {
      const financeiro = resumoFinanceiroAtendimento(agendamento);
      return total + financeiro.total;
    },
    0,
  );

  const prePagamentosPeriodo = agendamentosPrevisaoPeriodoValidos.reduce(
    (total, agendamento) => total + valorNumerico(agendamento?.valorPrePago),
    0,
  );

  const comissoesPeriodoEstimadas = agendamentosPrevisaoPeriodoValidos.reduce(
    (total, agendamento) => total + calcularComissao(agendamento),
    0,
  );

  const clientesUnicosPeriodo = new Set(
    agendamentosPeriodoValidos.map(
      (agendamento) =>
        agendamento.clienteId ||
        agendamento.cliente?.id ||
        agendamento.Cliente?.id ||
        nomeCliente(agendamento),
    ),
  ).size;

  const horariosMaisVendidos = agruparPorNome(
    agendamentosSemanaOperacional,
    (agendamento) => formatarHorario(agendamento.dataHoraInicio),
  ).slice(0, 5);

  const diaMaisMovimentado = agruparPorNome(
    agendamentosSemanaOperacional,
    (agendamento) =>
      new Date(agendamento.dataHoraInicio).toLocaleDateString("pt-BR", {
        weekday: "long",
      }),
  )[0];

  const servicoCampeao = servicosRequisitadosSemana[0];
  const profissionalDestaque = profissionaisRequisitadosSemana[0];

  if (!empresa || !usuario) {
    return <p style={{ padding: 40 }}>Carregando...</p>;
  }

  const tema = gerarTemaEmpresa(empresa);
  const licencaEmpresa = obterStatusLicencaEmpresa(empresa);

  return (
    <PremiumLayout empresa={empresa} usuario={usuario}>
      <div
        className="dashboard-shell-mobile-safe"
        style={
          {
            ...dashboardShellPremium,
            "--marcae-primary": tema.primary,
            "--marcae-secondary": tema.secondary,
            "--marcae-sidebar": tema.sidebar,
          } as React.CSSProperties
        }
      >
        {licencaEmpresa.mostrarBanner && (
          <section
            style={{
              marginBottom: 16,
              padding: 16,
              borderRadius: 22,
              background:
                licencaEmpresa.status === "bloqueio_parcial"
                  ? "linear-gradient(135deg, rgba(249,115,22,0.18), rgba(124,58,237,0.12))"
                  : "linear-gradient(135deg, rgba(245,158,11,0.16), rgba(124,58,237,0.10))",
              border:
                licencaEmpresa.status === "bloqueio_parcial"
                  ? "1px solid rgba(251,146,60,0.28)"
                  : "1px solid rgba(251,191,36,0.24)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <strong
                style={{ display: "block", fontSize: 15, fontWeight: 950 }}
              >
                {licencaEmpresa.status === "bloqueio_parcial"
                  ? "⚠️ Alguns recursos foram bloqueados"
                  : "⚠️ Sua assinatura está vencida"}
              </strong>
              <span
                style={{
                  display: "block",
                  marginTop: 4,
                  color: "#cbd5e1",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {licencaEmpresa.mensagemCurta}.{" "}
                {licencaEmpresa.mensagemDetalhada}
              </span>
            </div>

            <a
              href="/planos"
              style={{
                minHeight: 40,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 14px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #f97316, #7c3aed)",
                color: "#fff",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 950,
                boxShadow: "0 12px 28px rgba(249,115,22,0.22)",
              }}
            >
              Regularizar pagamento
            </a>
          </section>
        )}
        <style jsx global>{`
          html,
          body {
            max-width: 100%;
            overflow-x: hidden;
            overflow-y: auto;
          }


          /* Marcaê Dashboard Mobile Scroll Hard Fix */
          @media (max-width: 1180px) {
            html,
            body {
              height: auto !important;
              min-height: 100% !important;
              overflow-x: hidden !important;
              overflow-y: auto !important;
              overscroll-behavior-y: auto !important;
              touch-action: pan-y !important;
            }

            body {
              position: static !important;
            }

            .dashboard-shell-mobile-safe {
              display: block !important;
              min-height: auto !important;
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              touch-action: pan-y !important;
              -webkit-overflow-scrolling: touch !important;
              padding-bottom: 138px !important;
            }

            .dashboard-chart-mobile,
            .dashboard-chart-mobile *,
            .recharts-wrapper,
            .recharts-surface {
              touch-action: pan-y !important;
            }
          }

          .dashboard-shell-mobile-safe {
            width: 100%;
            max-width: 1540px;
            overflow-x: hidden;
            box-sizing: border-box;
          }

          .dashboard-shell-mobile-safe * {
            box-sizing: border-box;
          }

          @media (max-width: 1180px) {
            .dashboard-shell-mobile-safe {
              max-width: 100% !important;
              width: 100% !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
              padding-bottom: 112px !important;
            }

            .dashboard-hero-mobile,
            .dashboard-filter-mobile,
            .dashboard-analytics-card-mobile,
            .dashboard-operacao-card-mobile,
            .dashboard-panel-large-mobile {
              width: 100% !important;
              max-width: 100% !important;
              border-radius: 26px !important;
            }

            .dashboard-analytics-mobile,
            .dashboard-operacional-grid-mobile {
              grid-template-columns: 1fr !important;
              width: 100% !important;
              max-width: 100% !important;
            }

            .dashboard-filter-grid-mobile,
            .dashboard-finance-grid-mobile,
            .dashboard-previsao-grid-mobile,
            .dashboard-modal-grid-mobile {
              grid-template-columns: 1fr !important;
            }

            .dashboard-kpi-mobile {
              display: flex !important;
              overflow-x: auto !important;
              gap: 12px !important;
              padding-bottom: 8px !important;
              scroll-snap-type: x mandatory;
              -webkit-overflow-scrolling: touch;
            }

            .dashboard-kpi-mobile > * {
              min-width: 220px !important;
              scroll-snap-align: start;
            }

            .dashboard-agenda-lista-mobile {
              width: 100% !important;
              max-width: 100% !important;
              overflow-x: hidden !important;
            }

            .dashboard-chart-mobile {
              width: 100% !important;
              min-width: 0 !important;
              overflow: hidden !important;
            }

            .dashboard-modal-box-mobile {
              width: min(980px, calc(100vw - 28px)) !important;
              max-width: calc(100vw - 28px) !important;
              max-height: calc(100vh - 28px) !important;
              overflow-y: auto !important;
            }
          }

          @media (max-width: 760px) {
            .dashboard-shell-mobile-safe {
              padding-bottom: 126px !important;
            }

            .dashboard-hero-mobile {
              padding: 14px !important;
              margin-bottom: 10px !important;
              border-radius: 20px !important;
            }

            .dashboard-hero-content-mobile,
            .dashboard-hero-identity-mobile,
            .dashboard-hero-actions-mobile {
              width: 100% !important;
              align-items: stretch !important;
              justify-content: flex-start !important;
            }

            .dashboard-hero-identity-mobile {
              display: block !important;
              min-width: 0 !important;
            }

            .dashboard-hero-actions-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 8px !important;
            }

            .dashboard-hero-actions-mobile a,
            .dashboard-hero-actions-mobile button {
              width: 100% !important;
            }

            .dashboard-hero-mobile h1 {
              font-size: 26px !important;
              line-height: 1.02 !important;
              letter-spacing: -0.055em !important;
            }

            .dashboard-hero-mobile p {
              font-size: 13px !important;
            }

            .dashboard-filter-mobile,
            .dashboard-analytics-card-mobile,
            .dashboard-operacao-card-mobile,
            .dashboard-panel-large-mobile {
              padding: 16px !important;
              border-radius: 24px !important;
            }

            .dashboard-filter-grid-mobile {
              gap: 10px !important;
            }

            .dashboard-filter-grid-mobile button,
            .dashboard-filter-grid-mobile input {
              width: 100% !important;
            }

            .dashboard-finance-grid-mobile,
            .dashboard-previsao-grid-mobile {
              gap: 12px !important;
            }

            .dashboard-analytics-mobile,
            .dashboard-operacional-grid-mobile {
              gap: 16px !important;
            }

            .dashboard-modal-overlay-mobile {
              align-items: stretch !important;
              padding: 0 !important;
            }

            .dashboard-modal-box-mobile {
              width: 100vw !important;
              max-width: 100vw !important;
              height: 100vh !important;
              max-height: 100vh !important;
              border-radius: 0 !important;
              padding: 16px !important;
              overflow-x: hidden !important;
            }

            .dashboard-modal-header-mobile {
              position: sticky !important;
              top: 0 !important;
              z-index: 5 !important;
              background: rgba(2, 6, 23, 0.96) !important;
              backdrop-filter: blur(18px) !important;
              margin: -16px -16px 16px !important;
              padding: 16px !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
          }

          .dashboard-agenda-lista-mobile > div {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            grid-template-columns: 70px minmax(0, 1fr) !important;
            gap: 10px 12px !important;
            align-items: start !important;
            overflow: hidden !important;
          }

          .dashboard-agenda-lista-mobile > div > div:nth-child(1) {
            grid-column: 1 !important;
            grid-row: 1 / 4 !important;
            font-size: 20px !important;
            align-self: center !important;
            min-width: 0 !important;
          }

          .dashboard-agenda-lista-mobile > div > div:nth-child(2) {
            grid-column: 2 !important;
            min-width: 0 !important;
            width: 100% !important;
            overflow: hidden !important;
          }

          .dashboard-agenda-lista-mobile > div > div:nth-child(2) strong,
          .dashboard-agenda-lista-mobile > div > div:nth-child(2) p,
          .dashboard-agenda-lista-mobile > div > div:nth-child(2) span {
            max-width: 100% !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
          }

          .dashboard-agenda-lista-mobile > div > div:nth-child(3) {
            grid-column: 2 !important;
            width: 100% !important;
            min-width: 0 !important;
            text-align: left !important;
            justify-items: start !important;
            overflow: hidden !important;
          }

          .dashboard-agenda-lista-mobile > div > div:nth-child(4) {
            grid-column: 1 / -1 !important;
            width: 100% !important;
            min-width: 0 !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
            justify-content: stretch !important;
          }

          .dashboard-agenda-lista-mobile > div > div:nth-child(4) button {
            width: 100% !important;
            min-width: 0 !important;
            padding-left: 10px !important;
            padding-right: 10px !important;
          }

          .dashboard-atalhos-grid-mobile {
            grid-template-columns: 1fr 1fr !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
          }

          .dashboard-atalhos-grid-mobile a {
            width: 100% !important;
            min-width: 0 !important;
            white-space: normal !important;
            overflow-wrap: anywhere !important;
          }

          .dashboard-atendimento-voltar-mobile {
            display: none;
          }

          .dashboard-painel-atendimento-mobile {
            min-width: 0 !important;
          }

          @media (max-width: 760px) {
            .dashboard-modal-box-mobile:has(
                .dashboard-atendimento-selecionado-mobile
              )
              .dashboard-pesquisa-central-mobile,
            .dashboard-modal-box-mobile:has(
                .dashboard-atendimento-selecionado-mobile
              )
              .dashboard-filtros-central-mobile,
            .dashboard-modal-box-mobile:has(
                .dashboard-atendimento-selecionado-mobile
              )
              .dashboard-lista-central-mobile {
              display: none !important;
            }

            .dashboard-modal-grid-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 14px !important;
              min-width: 0 !important;
            }

            .dashboard-painel-atendimento-mobile {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              display: flex !important;
              flex-direction: column !important;
              gap: 12px !important;
              overflow-x: hidden !important;
            }

            .dashboard-atendimento-selecionado-mobile {
              min-height: auto !important;
            }

            .dashboard-atendimento-voltar-mobile {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              width: 100% !important;
              min-height: 44px !important;
              border-radius: 14px !important;
              border: 1px solid rgba(255, 255, 255, 0.12) !important;
              background: rgba(255, 255, 255, 0.06) !important;
              color: #fff !important;
              font-weight: 950 !important;
              cursor: pointer !important;
              order: -20 !important;
            }

            .dashboard-fechamento-box-mobile {
              width: 100% !important;
              max-width: 100% !important;
              overflow-x: hidden !important;
              border-color: rgba(34, 197, 94, 0.32) !important;
              box-shadow: 0 18px 44px rgba(34, 197, 94, 0.1) !important;
            }

            .dashboard-fechamento-box-mobile input,
            .dashboard-fechamento-box-mobile select,
            .dashboard-fechamento-box-mobile textarea,
            .dashboard-fechamento-box-mobile button {
              max-width: 100% !important;
            }

            .dashboard-fechamento-box-mobile
              [style*="grid-template-columns: 1fr 1fr auto"] {
              grid-template-columns: 1fr !important;
            }

            .dashboard-fechamento-box-mobile {
              display: block !important;
              position: relative !important;
              z-index: 6 !important;
              order: 10 !important;
              height: auto !important;
              min-height: unset !important;
              max-height: none !important;
              overflow: visible !important;
              margin-top: 18px !important;
              margin-bottom: 18px !important;
              flex-shrink: 0 !important;
            }

            .dashboard-servicos-box-mobile {
              display: block !important;
              position: relative !important;
              z-index: 1 !important;
              order: 20 !important;
              margin-top: 0 !important;
              margin-bottom: 16px !important;
              flex-shrink: 0 !important;
              clear: both !important;
            }

            .dashboard-reagendamento-box-mobile {
              display: block !important;
              position: relative !important;
              z-index: 1 !important;
              order: 30 !important;
              margin-top: 0 !important;
              margin-bottom: 16px !important;
              flex-shrink: 0 !important;
              clear: both !important;
            }

            .dashboard-cancelar-atendimento-mobile {
              order: 40 !important;
              position: relative !important;
              z-index: 1 !important;
              width: 100% !important;
              flex-shrink: 0 !important;
            }

            .dashboard-fechamento-box-mobile + .dashboard-servicos-box-mobile {
              margin-top: 0 !important;
            }

            .dashboard-painel-atendimento-mobile
              > div:not(.dashboard-fechamento-box-mobile):not(
                .dashboard-servicos-box-mobile
              ) {
              position: relative !important;
              z-index: 2 !important;
            }
          }

          /* Marcaê Compact Premium — dashboard mobile operacional */
          @media (max-width: 760px) {
            .dashboard-shell-mobile-safe {
              padding-top: 0 !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
            }

            .dashboard-hero-mobile {
              padding: 14px !important;
              margin-bottom: 12px !important;
              border-radius: 22px !important;
              min-height: unset !important;
            }

            .dashboard-hero-mobile h1 {
              font-size: 24px !important;
              line-height: 1.04 !important;
              margin-top: 10px !important;
              margin-bottom: 6px !important;
            }

            .dashboard-hero-mobile p {
              display: none !important;
            }

            .dashboard-hero-identity-mobile {
              grid-template-columns: 44px minmax(0, 1fr) !important;
              gap: 10px !important;
              align-items: center !important;
            }

            .dashboard-hero-identity-mobile > div:first-child {
              width: 44px !important;
              height: 44px !important;
              border-radius: 15px !important;
            }

            .dashboard-hero-actions-mobile {
              grid-template-columns: 1fr 1fr !important;
              gap: 8px !important;
              margin-top: 10px !important;
            }

            .dashboard-hero-actions-mobile a,
            .dashboard-hero-actions-mobile button {
              min-height: 40px !important;
              padding: 9px 12px !important;
              border-radius: 14px !important;
              font-size: 12px !important;
            }

            .dashboard-filter-mobile {
              padding: 14px !important;
              border-radius: 20px !important;
              margin-bottom: 12px !important;
            }

            .dashboard-filter-mobile h2 {
              font-size: 18px !important;
              line-height: 1.1 !important;
              margin: 4px 0 0 !important;
            }

            .dashboard-filter-mobile p {
              display: none !important;
            }

            .dashboard-filter-grid-mobile {
              gap: 8px !important;
              margin-top: 12px !important;
            }

            .dashboard-filter-grid-mobile label {
              font-size: 10px !important;
              letter-spacing: 0.08em !important;
            }

            .dashboard-filter-grid-mobile input,
            .dashboard-filter-grid-mobile button {
              min-height: 40px !important;
              padding: 9px 12px !important;
              border-radius: 13px !important;
              font-size: 12px !important;
            }

            .dashboard-kpi-mobile {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 10px !important;
              overflow: visible !important;
              padding-bottom: 0 !important;
              scroll-snap-type: none !important;
            }

            .dashboard-kpi-mobile > * {
              min-width: 0 !important;
              width: 100% !important;
              padding: 12px !important;
              border-radius: 18px !important;
              min-height: 108px !important;
              scroll-snap-align: unset !important;
            }

            .dashboard-kpi-mobile > * span {
              font-size: 11px !important;
              line-height: 1.15 !important;
            }

            .dashboard-kpi-mobile > * strong {
              font-size: 22px !important;
              line-height: 1.05 !important;
            }

            .dashboard-analytics-card-mobile,
            .dashboard-operacao-card-mobile,
            .dashboard-panel-large-mobile {
              padding: 14px !important;
              border-radius: 22px !important;
              margin-bottom: 12px !important;
            }

            .dashboard-analytics-card-mobile h2,
            .dashboard-operacao-card-mobile h2,
            .dashboard-panel-large-mobile h2 {
              font-size: 20px !important;
              line-height: 1.08 !important;
              margin: 5px 0 0 !important;
            }

            .dashboard-analytics-card-mobile p,
            .dashboard-operacao-card-mobile p,
            .dashboard-panel-large-mobile p {
              font-size: 12px !important;
              line-height: 1.35 !important;
            }

            .dashboard-analytics-card-mobile [style*="Números operacionais"],
            .dashboard-panel-large-mobile [style*="Lista operacional"] {
              display: none !important;
            }

            .dashboard-finance-grid-mobile,
            .dashboard-previsao-grid-mobile {
              grid-template-columns: 1fr 1fr !important;
              gap: 10px !important;
            }

            .dashboard-finance-grid-mobile > *,
            .dashboard-previsao-grid-mobile > * {
              padding: 12px !important;
              border-radius: 18px !important;
              min-height: 98px !important;
            }

            .dashboard-finance-grid-mobile > * strong,
            .dashboard-previsao-grid-mobile > * strong {
              font-size: 20px !important;
              line-height: 1.05 !important;
            }

            .dashboard-finance-grid-mobile > * small,
            .dashboard-previsao-grid-mobile > * small {
              display: none !important;
            }

            .dashboard-agenda-lista-mobile {
              display: grid !important;
              gap: 10px !important;
            }

            .dashboard-agenda-lista-mobile > div {
              padding: 12px !important;
              border-radius: 18px !important;
              grid-template-columns: 56px minmax(0, 1fr) !important;
              gap: 8px 10px !important;
            }

            .dashboard-agenda-lista-mobile > div > div:nth-child(1) {
              font-size: 20px !important;
            }

            .dashboard-agenda-lista-mobile > div > div:nth-child(4) {
              grid-template-columns: 1fr 1fr !important;
              gap: 8px !important;
            }

            .dashboard-agenda-lista-mobile > div > div:nth-child(4) button {
              min-height: 38px !important;
              padding: 8px 10px !important;
              border-radius: 13px !important;
              font-size: 12px !important;
            }

            .dashboard-operacao-card-mobile button,
            .dashboard-panel-large-mobile button {
              min-height: 38px !important;
              padding: 8px 12px !important;
              border-radius: 13px !important;
              font-size: 12px !important;
            }

            .dashboard-operacao-card-mobile [style*="grid"] {
              gap: 8px !important;
            }

            .dashboard-panel-large-mobile:has(.dashboard-atalhos-grid-mobile),
            div:has(> .dashboard-atalhos-grid-mobile) {
              display: none !important;
            }

            .dashboard-chart-mobile > div {
              height: 170px !important;
            }
          }

          @media (max-width: 430px) {
            .dashboard-kpi-mobile {
              grid-template-columns: 1fr 1fr !important;
            }

            .dashboard-kpi-mobile > * {
              min-width: 0 !important;
            }

            .dashboard-finance-grid-mobile,
            .dashboard-previsao-grid-mobile {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 430px) {
            .dashboard-hero-actions-mobile {
              grid-template-columns: 1fr !important;
            }

            .dashboard-kpi-mobile > * {
              min-width: 78vw !important;
            }

            .dashboard-agenda-lista-mobile > div {
              grid-template-columns: 1fr !important;
            }

            .dashboard-agenda-lista-mobile > div > div:nth-child(1),
            .dashboard-agenda-lista-mobile > div > div:nth-child(2),
            .dashboard-agenda-lista-mobile > div > div:nth-child(3),
            .dashboard-agenda-lista-mobile > div > div:nth-child(4) {
              grid-column: 1 !important;
              grid-row: auto !important;
            }

            .dashboard-agenda-lista-mobile > div > div:nth-child(4),
            .dashboard-atalhos-grid-mobile {
              grid-template-columns: 1fr !important;
            }
          }

          /* Marcaê Compact Premium V2 — ajustes finais mobile operacional */
          @media (max-width: 760px) {
            .dashboard-hero-mobile {
              padding: 12px !important;
              border-radius: 20px !important;
              margin-bottom: 10px !important;
            }

            .dashboard-hero-identity-mobile {
              grid-template-columns: 42px minmax(0, 1fr) !important;
              align-items: center !important;
            }

            .dashboard-hero-identity-mobile > div:first-child {
              width: 42px !important;
              height: 42px !important;
              border-radius: 14px !important;
            }

            .dashboard-hero-actions-mobile {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 8px !important;
              margin-top: 10px !important;
            }

            .dashboard-hero-actions-mobile button {
              min-height: 38px !important;
              font-size: 12px !important;
              padding: 8px 10px !important;
              border-radius: 13px !important;
            }

            .dashboard-filter-mobile,
            .dashboard-analytics-card-mobile,
            .dashboard-operacao-card-mobile,
            .dashboard-panel-large-mobile {
              padding: 12px !important;
              border-radius: 20px !important;
            }

            .dashboard-hero-mobile p,
            .dashboard-filter-mobile p,
            .dashboard-panel-large-mobile p,
            .dashboard-analytics-card-mobile p {
              display: none !important;
            }

            .dashboard-kpi-mobile {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 10px !important;
              overflow: visible !important;
            }

            .dashboard-kpi-mobile > * {
              min-width: 0 !important;
              width: 100% !important;
              min-height: 92px !important;
              padding: 10px !important;
              border-radius: 16px !important;
            }

            .dashboard-kpi-mobile > * strong {
              font-size: 20px !important;
            }

            .dashboard-finance-grid-mobile,
            .dashboard-previsao-grid-mobile {
              grid-template-columns: 1fr 1fr !important;
            }

            .dashboard-finance-grid-mobile > *,
            .dashboard-previsao-grid-mobile > * {
              min-height: 88px !important;
              padding: 10px !important;
              border-radius: 16px !important;
            }

            .dashboard-filter-actions-compact {
              display: grid !important;
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
              gap: 8px !important;
              margin-top: 12px !important;
            }

            .dashboard-filter-actions-compact button {
              min-height: 38px !important;
              padding: 8px 10px !important;
              font-size: 12px !important;
              border-radius: 13px !important;
            }

            .dashboard-panel-large-mobile:has(.dashboard-atalhos-grid-mobile),
            div:has(> .dashboard-atalhos-grid-mobile) {
              display: none !important;
            }
          }

          @media (max-width: 430px) {
            .dashboard-hero-actions-mobile {
              grid-template-columns: 1fr 1fr !important;
            }

            .dashboard-kpi-mobile > * {
              min-width: 0 !important;
            }

            .dashboard-filter-actions-compact {
              grid-template-columns: 1fr 1fr !important;
            }

            .dashboard-finance-grid-mobile,
            .dashboard-previsao-grid-mobile {
              grid-template-columns: 1fr 1fr !important;
            }
          }

          /* Marcaê Compact Premium V3 — mobile operacional real */
          .dashboard-mobile-compact-stack {
            display: none;
          }

          @media (max-width: 760px) {
            .dashboard-mobile-compact-stack {
              display: grid !important;
              gap: 10px !important;
              margin-top: 10px !important;
            }

            .dashboard-desktop-rich {
              display: none !important;
            }

            .dashboard-shell-mobile-safe {
              gap: 10px !important;
              padding-bottom: 130px !important;
            }

            .dashboard-hero-mobile {
              margin-bottom: 8px !important;
            }

            .dashboard-kpi-mobile {
              gap: 8px !important;
              margin-top: 10px !important;
            }

            .dashboard-kpi-mobile > * {
              min-height: 78px !important;
              padding: 9px !important;
              border-radius: 15px !important;
              box-shadow: none !important;
            }

            .dashboard-kpi-mobile > * span,
            .dashboard-kpi-mobile > * small {
              font-size: 10px !important;
              line-height: 1.15 !important;
            }

            .dashboard-kpi-mobile > * strong {
              font-size: 22px !important;
              line-height: 1 !important;
            }

            .dashboard-filter-mobile {
              padding: 10px !important;
              margin-bottom: 8px !important;
            }

            .dashboard-filter-actions-compact {
              margin-top: 10px !important;
              gap: 7px !important;
            }

            .dashboard-filter-actions-compact button {
              min-height: 34px !important;
              border-radius: 12px !important;
              font-size: 11px !important;
              padding: 7px 8px !important;
            }

            .dashboard-hero-mobile h1 {
              font-size: 23px !important;
            }

            .dashboard-hero-actions-mobile {
              grid-template-columns: 1fr !important;
              gap: 7px !important;
            }

            .dashboard-hero-actions-mobile button {
              min-height: 34px !important;
              border-radius: 12px !important;
              font-size: 11px !important;
              padding: 7px 9px !important;
            }
          }

          /* Correção final do Hero Compact Premium no mobile.
           Remove regras antigas que tratavam o primeiro bloco do hero como logo. */
          @media (max-width: 760px) {
            .dashboard-hero-mobile {
              padding: 16px !important;
              min-height: auto !important;
            }

            .dashboard-hero-content-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 12px !important;
              align-items: stretch !important;
            }

            .dashboard-hero-identity-mobile {
              display: block !important;
              width: 100% !important;
              min-width: 0 !important;
            }

            .dashboard-hero-identity-mobile > .dashboard-hero-text-mobile {
              width: 100% !important;
              height: auto !important;
              min-width: 0 !important;
              min-height: 0 !important;
              border-radius: 0 !important;
              display: block !important;
              overflow: visible !important;
            }

            .dashboard-hero-text-mobile {
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
            }

            .dashboard-hero-identity-mobile
              > div.dashboard-hero-text-mobile:first-child {
              width: 100% !important;
              height: auto !important;
              min-width: 0 !important;
              min-height: 0 !important;
              border-radius: 0 !important;
              display: block !important;
              overflow: visible !important;
            }

            .dashboard-hero-text-mobile > h1 {
              display: block !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 0 8px !important;
              overflow: visible !important;
            }

            .dashboard-hero-meta-mobile {
              display: flex !important;
              flex-direction: row !important;
              align-items: center !important;
              gap: 7px !important;
              flex-wrap: wrap !important;
              width: 100% !important;
              max-width: 100% !important;
              margin-top: 8px !important;
              line-height: 1.25 !important;
              overflow: visible !important;
            }

            .dashboard-hero-meta-mobile span {
              display: inline-flex !important;
              width: auto !important;
              height: auto !important;
              min-width: 0 !important;
              white-space: nowrap !important;
              line-height: 1.25 !important;
            }

            .dashboard-hero-actions-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 8px !important;
              width: 100% !important;
              margin-top: 0 !important;
            }

            .dashboard-hero-actions-mobile button {
              width: 100% !important;
              min-height: 38px !important;
              height: 38px !important;
              padding: 8px 12px !important;
              border-radius: 13px !important;
              line-height: 1 !important;
            }
          }

          /* Marcaê Compact Premium V4 — proporção real dos blocos marcados */
          @media (max-width: 760px) {
            .dashboard-filter-mobile {
              padding: 10px 12px !important;
              margin-bottom: 8px !important;
              border-radius: 18px !important;
            }

            .dashboard-filter-mobile [style*="display: flex"] {
              gap: 8px !important;
            }

            .dashboard-filter-mobile h2 {
              font-size: 17px !important;
              line-height: 1.05 !important;
              margin: 2px 0 0 !important;
            }

            .dashboard-filter-mobile span {
              line-height: 1.15 !important;
            }

            .dashboard-filter-actions-compact {
              margin-top: 8px !important;
              gap: 7px !important;
            }

            .dashboard-filter-actions-compact button {
              min-height: 34px !important;
              height: 34px !important;
              padding: 7px 8px !important;
              border-radius: 12px !important;
              font-size: 11px !important;
            }

            .dashboard-kpi-mobile {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 8px !important;
              margin-top: 8px !important;
              margin-bottom: 8px !important;
              overflow: visible !important;
              padding-bottom: 0 !important;
            }

            .dashboard-kpi-mobile > * {
              min-width: 0 !important;
              width: 100% !important;
              min-height: 66px !important;
              padding: 9px 10px !important;
              border-radius: 14px !important;
              box-shadow: none !important;
              background: linear-gradient(
                180deg,
                rgba(255, 255, 255, 0.062),
                rgba(255, 255, 255, 0.027)
              ) !important;
            }

            .dashboard-kpi-mobile > * > div:nth-child(2) {
              gap: 5px !important;
              margin-bottom: 4px !important;
            }

            .dashboard-kpi-mobile > * span {
              font-size: 10px !important;
              line-height: 1.05 !important;
            }

            .dashboard-kpi-mobile > * strong,
            .dashboard-kpi-mobile > * > div:nth-child(3) {
              font-size: 26px !important;
              line-height: 0.9 !important;
            }

            .dashboard-mobile-compact-stack {
              gap: 7px !important;
              margin-top: 7px !important;
            }

            .dashboard-mobile-compact-stack > div {
              padding: 9px !important;
              border-radius: 15px !important;
            }
          }

          /* Marcaê Compact Premium — correção definitiva do scroll da Central de Atendimento mobile */
          @media (max-width: 760px) {
            .dashboard-modal-overlay-mobile {
              position: fixed !important;
              inset: 0 !important;
              width: 100vw !important;
              height: 100dvh !important;
              max-height: 100dvh !important;
              align-items: stretch !important;
              justify-content: stretch !important;
              padding: 0 !important;
              overflow: hidden !important;
              overscroll-behavior: contain !important;
              z-index: 9999 !important;
            }

            .dashboard-modal-box-mobile {
              width: 100vw !important;
              max-width: 100vw !important;
              height: 100dvh !important;
              min-height: 100dvh !important;
              max-height: 100dvh !important;
              border-radius: 0 !important;
              padding: 14px 14px calc(180px + env(safe-area-inset-bottom)) !important;
              overflow-x: hidden !important;
              overflow-y: auto !important;
              -webkit-overflow-scrolling: touch !important;
              overscroll-behavior-y: contain !important;
              scroll-padding-bottom: 190px !important;
              display: block !important;
            }

            .dashboard-modal-box-mobile:has(
              .dashboard-atendimento-selecionado-mobile
            ) {
              padding-bottom: calc(
                220px + env(safe-area-inset-bottom)
              ) !important;
            }

            .dashboard-modal-header-mobile {
              position: sticky !important;
              top: 0 !important;
              z-index: 30 !important;
              margin: -14px -14px 14px !important;
              padding: 14px !important;
              background: rgba(2, 6, 23, 0.97) !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
              backdrop-filter: blur(18px) !important;
            }

            .dashboard-modal-grid-mobile,
            .dashboard-painel-atendimento-mobile,
            .dashboard-atendimento-selecionado-mobile {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: visible !important;
            }

            .dashboard-atendimento-selecionado-mobile {
              display: flex !important;
              flex-direction: column !important;
              gap: 12px !important;
              padding-bottom: calc(
                160px + env(safe-area-inset-bottom)
              ) !important;
            }

            .dashboard-atendimento-selecionado-mobile::after {
              content: "" !important;
              display: block !important;
              width: 100% !important;
              height: calc(120px + env(safe-area-inset-bottom)) !important;
              min-height: calc(120px + env(safe-area-inset-bottom)) !important;
              flex: 0 0 auto !important;
            }

            .dashboard-fechamento-box-mobile,
            .dashboard-servicos-box-mobile,
            .dashboard-reagendamento-box-mobile,
            .dashboard-cancelar-atendimento-mobile {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: visible !important;
              flex: 0 0 auto !important;
            }

            .dashboard-fechamento-box-mobile {
              padding: 14px !important;
              margin-top: 14px !important;
              margin-bottom: 28px !important;
              scroll-margin-bottom: 180px !important;
            }

            .dashboard-fechamento-box-mobile::after {
              content: "" !important;
              display: block !important;
              height: 72px !important;
              min-height: 72px !important;
            }

            .dashboard-fechamento-box-mobile input,
            .dashboard-fechamento-box-mobile select,
            .dashboard-fechamento-box-mobile textarea,
            .dashboard-fechamento-box-mobile button {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
            }

            .dashboard-fechamento-box-mobile
              [style*="grid-template-columns: 1fr 1fr auto"],
            .dashboard-fechamento-box-mobile
              [style*="grid-template-columns:1fr 1fr auto"],
            .dashboard-fechamento-box-mobile
              [style*="grid-template-columns: 1fr 72px"],
            .dashboard-fechamento-box-mobile
              [style*="grid-template-columns:1fr 72px"] {
              grid-template-columns: 1fr !important;
            }

            .dashboard-fechamento-box-mobile textarea {
              min-height: 92px !important;
            }

            .dashboard-fechamento-box-mobile button:last-child {
              margin-bottom: calc(
                96px + env(safe-area-inset-bottom)
              ) !important;
            }
          }

          /* Marcaê Compact Premium — refinamento real da etapa Fechamento no mobile */
          @media (max-width: 760px) {
            .dashboard-modal-box-mobile:has(
              .dashboard-atendimento-selecionado-mobile
            ) {
              padding-bottom: calc(
                120px + env(safe-area-inset-bottom)
              ) !important;
            }

            .dashboard-atendimento-selecionado-mobile {
              gap: 8px !important;
              padding-bottom: calc(
                70px + env(safe-area-inset-bottom)
              ) !important;
            }

            .dashboard-atendimento-selecionado-mobile::after,
            .dashboard-fechamento-box-mobile::after {
              display: none !important;
              height: 0 !important;
              min-height: 0 !important;
            }

            .dashboard-painel-atendimento-mobile {
              padding: 10px !important;
              border-radius: 18px !important;
            }

            .dashboard-painel-atendimento-mobile > div[style*="margin-bottom"] {
              margin-bottom: 7px !important;
            }

            .dashboard-fechamento-box-mobile {
              padding: 10px !important;
              margin-top: 8px !important;
              margin-bottom: 12px !important;
              border-radius: 18px !important;
              box-shadow: none !important;
            }

            .dashboard-fechamento-box-mobile > span:first-child {
              padding: 4px 8px !important;
              margin-bottom: 6px !important;
              font-size: 9px !important;
            }

            .dashboard-fechamento-box-mobile h3 {
              font-size: 15px !important;
              margin-bottom: 3px !important;
            }

            .dashboard-fechamento-box-mobile p {
              font-size: 10.5px !important;
              line-height: 1.22 !important;
              margin-bottom: 6px !important;
            }

            .dashboard-pagamento-card-compacto-mobile {
              display: flex !important;
              flex-direction: column !important;
              gap: 7px !important;
              padding: 8px !important;
              margin: 0 0 8px !important;
              border-radius: 15px !important;
              min-height: 0 !important;
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
            }

            .dashboard-pagamentos-fechamento-mobile {
              display: flex !important;
              flex-direction: column !important;
              gap: 6px !important;
              margin: 0 !important;
              padding: 0 !important;
              min-height: 0 !important;
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
            }

            .dashboard-pagamento-row-mobile {
              display: grid !important;
              grid-template-columns:
                minmax(0, 1.2fr) minmax(82px, 0.8fr)
                28px !important;
              align-items: center !important;
              gap: 6px !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              border-radius: 0 !important;
              background: transparent !important;
              border: none !important;
              min-height: 36px !important;
              height: 36px !important;
            }

            .dashboard-pagamento-forma-mobile,
            .dashboard-pagamento-valor-mobile {
              min-width: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              height: 34px !important;
              min-height: 34px !important;
              margin: 0 !important;
              padding-top: 0 !important;
              padding-bottom: 0 !important;
            }

            .dashboard-remover-pagamento-mobile,
            .dashboard-remover-pagamento-placeholder-mobile {
              width: 28px !important;
              min-width: 28px !important;
              max-width: 28px !important;
              height: 28px !important;
              margin: 0 !important;
              padding: 0 !important;
              border-radius: 9px !important;
              align-self: center !important;
              justify-self: end !important;
            }

            .dashboard-remover-pagamento-placeholder-mobile {
              visibility: hidden !important;
              pointer-events: none !important;
            }

            .dashboard-adicionar-pagamento-mobile {
              min-height: 32px !important;
              padding: 6px 10px !important;
              border-radius: 12px !important;
              margin: 0 !important;
              font-size: 11px !important;
            }

            .dashboard-ajustes-fechamento-mobile,
            .dashboard-resumo-ajustado-mobile,
            .dashboard-resumo-cliente-financeiro-mobile {
              gap: 6px !important;
              padding: 8px !important;
              margin-bottom: 8px !important;
              border-radius: 13px !important;
            }

            .dashboard-valor-tipo-row-mobile {
              grid-template-columns: minmax(0, 1fr) 58px !important;
              gap: 6px !important;
            }

            .dashboard-fechamento-box-mobile label {
              margin-bottom: 4px !important;
              font-size: 10px !important;
              line-height: 1.15 !important;
            }

            .dashboard-fechamento-box-mobile input,
            .dashboard-fechamento-box-mobile select {
              height: 36px !important;
              min-height: 36px !important;
              padding: 0 9px !important;
              border-radius: 11px !important;
              margin-bottom: 0 !important;
              font-size: 12px !important;
            }

            .dashboard-fechamento-box-mobile textarea {
              min-height: 58px !important;
              padding: 9px !important;
              border-radius: 11px !important;
              margin-bottom: 7px !important;
              font-size: 12px !important;
            }

            .dashboard-fechamento-box-mobile button:last-child {
              margin-bottom: calc(
                72px + env(safe-area-inset-bottom)
              ) !important;
            }
          }

          @media (min-width: 761px) {
            .dashboard-desktop-rich {
              display: grid;
            }
          }
        `}</style>
        <header className="dashboard-hero-mobile" style={dashboardHeroPremium}>
          <div style={heroGlowOne} />
          <div style={heroGlowTwo} />

          <div
            className="dashboard-hero-content-mobile"
            style={heroContentPremium}
          >
            <div
              className="dashboard-hero-identity-mobile"
              style={heroIdentityPremium}
            >
              <div
                className="dashboard-hero-text-mobile"
                style={heroTextCompactFix}
              >
                <h1 style={heroTitleCompact}>Dashboard</h1>

                <div
                  className="dashboard-hero-meta-mobile"
                  style={heroCompactInfo}
                >
                  <span>
                    {new Date()
                      .toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      .replace(".", "")}
                  </span>
                  <span>•</span>
                  <span>{empresa?.plano || "Premium"}</span>
                  <span>•</span>
                  <span>{empresa?.assinaturaStatus || "Ativo"}</span>
                </div>
              </div>
            </div>

            <div
              className="dashboard-hero-actions-mobile"
              style={heroActionsPremium}
            >
              <button
                onClick={abrirModalReagendamento}
                style={heroButtonPrimaryPremium}
              >
                Gerenciar operação
              </button>

              <button
                onClick={alternarFinanceiro}
                style={heroButtonGhostPremium}
              >
                {mostrarFinanceiro ? "Ocultar valores" : "Ver valores"}
              </button>

              <button onClick={sair} style={heroButtonDangerPremium}>
                Sair
              </button>
            </div>
          </div>
        </header>

        <section
          className="dashboard-filter-mobile"
          style={filtroEnterpriseBox}
        >
          <div style={filtroCompactHeader}>
            <div>
              <span style={sectionKickerPremium}>Período</span>
              <h2 style={sectionTitlePremium}>Resumo operacional</h2>
            </div>

            <span style={periodoEnterpriseTexto}>
              {periodoAplicado.dataInicio.split("-").reverse().join("/")} até{" "}
              {periodoAplicado.dataFim.split("-").reverse().join("/")}
            </span>
          </div>

          <div
            className="dashboard-filter-actions-compact"
            style={filtroCompactActions}
          >
            <button
              onClick={filtrarHojeDashboard}
              style={botaoFiltroEnterprise}
            >
              Hoje
            </button>
            <button
              onClick={() => filtrarUltimosDiasDashboard(7)}
              style={botaoFiltroEnterprise}
            >
              7 dias
            </button>
            <button
              onClick={() => filtrarUltimosDiasDashboard(30)}
              style={botaoFiltroEnterprise}
            >
              30 dias
            </button>
            <button
              type="button"
              onClick={() => setMostrarFiltroAvancado((valor) => !valor)}
              style={
                mostrarFiltroAvancado
                  ? botaoFiltroEnterprisePrimario
                  : botaoFiltroEnterprise
              }
            >
              Filtros
            </button>
          </div>

          {mostrarFiltroAvancado && (
            <div
              className="dashboard-filter-grid-mobile"
              style={filtroEnterpriseGrid}
            >
              <div>
                <label style={labelCampoPremium}>Data inicial</label>
                <input
                  type="date"
                  max={hojeFormatoInput()}
                  value={dataInicioFiltro}
                  onChange={(e) => setDataInicioFiltro(e.target.value)}
                  style={inputEnterprisePremium}
                />
              </div>

              <div>
                <label style={labelCampoPremium}>Data final</label>
                <input
                  type="date"
                  max={hojeFormatoInput()}
                  value={dataFimFiltro}
                  onChange={(e) => setDataFimFiltro(e.target.value)}
                  style={inputEnterprisePremium}
                />
              </div>

              <button
                onClick={aplicarFiltroDashboard}
                style={botaoFiltroEnterprisePrimario}
              >
                Aplicar filtro
              </button>
            </div>
          )}
        </section>

        <section className="dashboard-kpi-mobile" style={kpiGridEnterprise}>
          <Card titulo="Agenda" valor={agendamentosHoje.length} />
          <Card
            titulo="Concluídos"
            valor={agendamentosConcluidosPeriodo.length}
          />
          <Card titulo="Clientes" valor={clientesUnicosPeriodo} />
          <Card titulo="Cancelamento" valor={`${taxaCancelamentoPeriodo}%`} />
        </section>

        <section
          className="dashboard-mobile-compact-stack"
          style={mobileCompactStack}
        >
          {usuarioPodeVerFinanceiro() ? (
            <div style={mobileCompactPanel}>
              <div style={mobileCompactHeaderLine}>
                <strong>Financeiro</strong>
                <a href="/financeiro" style={mobileCompactLink}>
                  Ver
                </a>
              </div>

              <div style={mobileFinanceMiniGrid}>
                <MobileMetric
                  label="Recebido"
                  value={valorFinanceiro(faturamentoPeriodo)}
                  tone="#22c55e"
                />
                <MobileMetric
                  label="Pendente"
                  value={valorFinanceiro(financeiroPeriodo.pendente)}
                  tone="#f59e0b"
                />
                <MobileMetric
                  label="Previsão"
                  value={valorFinanceiro(previsaoPeriodo)}
                  tone="#8b5cf6"
                />
                <MobileMetric
                  label="Pré-pago"
                  value={valorFinanceiro(prePagamentosPeriodo)}
                  tone="#06b6d4"
                />
              </div>
            </div>
          ) : (
            <div style={mobileCompactPanel}>
              <div style={mobileCompactHeaderLine}>
                <strong>Financeiro</strong>
              </div>
              <div style={mobileMutedBox}>
                Valores financeiros ocultos para este usuário.
              </div>
            </div>
          )}

          <div style={mobileCompactPanel}>
            <div style={mobileCompactHeaderLine}>
              <strong>Agenda de hoje</strong>
              <a href="/agenda" style={mobileCompactLink}>
                Agenda
              </a>
            </div>

            {agendamentosHoje.length === 0 ? (
              <div style={mobileMutedBox}>Nenhum atendimento para hoje.</div>
            ) : (
              <div style={mobileAgendaStack}>
                {agendamentosHoje.slice(0, 4).map((agendamento) => {
                  const financeiro = resumoFinanceiroAtendimento(agendamento);

                  return (
                    <div key={agendamento.id} style={mobileAgendaItem}>
                      <div style={mobileAgendaTime}>
                        {formatarHorario(agendamento.dataHoraInicio)}
                      </div>

                      <div style={mobileAgendaInfo}>
                        <strong>{nomeCliente(agendamento)}</strong>
                        <span>{nomeServico(agendamento)}</span>
                        <small style={mobileAgendaProfessional}>
                          👩 {nomeProfissional(agendamento)}
                        </small>
                        <small>
                          {mostrarFinanceiro
                            ? dinheiro(financeiro.total)
                            : "••••••"}{" "}
                          · {financeiro.pendente > 0 ? "pendente" : "quitado"}
                        </small>
                      </div>

                      <div style={mobileAgendaActions}>
                        {agendamento.status === "em_atendimento" ? (
                          <button
                            type="button"
                            onClick={() =>
                              selecionarAgendamentoPainel(agendamento)
                            }
                            style={mobileButtonWarning}
                            aria-label="Abrir atendimento em andamento"
                          >
                            ▶
                          </button>
                        ) : agendamento.status === "concluido" ? (
                          <button
                            type="button"
                            disabled
                            style={mobileButtonDone}
                            aria-label="Atendimento finalizado"
                          >
                            ✓
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => confirmarPresenca(agendamento)}
                            disabled={confirmandoPresencaId === agendamento.id}
                            style={mobileButtonConfirm}
                            aria-label="Confirmar presença"
                          >
                            ✓
                          </button>
                        )}

                        {agendamento.status !== "cancelado" &&
                          agendamento.status !== "concluido" && (
                            <button
                              type="button"
                              onClick={() =>
                                abrirFechamentoAtendimento(agendamento)
                              }
                              style={mobileButtonClose}
                              aria-label="Fechar atendimento"
                            >
                              ×
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}

                {agendamentosHoje.length > 4 && (
                  <button
                    type="button"
                    onClick={abrirModalReagendamento}
                    style={mobileFullButton}
                  >
                    Ver todos os atendimentos
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={mobileCompactPanelSoft}>
            <div style={mobileCompactHeaderLine}>
              <strong>Resumo rápido</strong>
              <button
                type="button"
                onClick={abrirModalReagendamento}
                style={mobileTextButton}
              >
                Central
              </button>
            </div>

            <div style={mobileAlertStack}>
              <MobileInsight
                icon="💰"
                label="Pendências"
                value={valorFinanceiro(financeiroPeriodo.pendente)}
              />
              <MobileInsight
                icon="🏆"
                label="Top serviço"
                value={
                  servicoCampeao
                    ? `${servicoCampeao.nome} · ${servicoCampeao.quantidade}x`
                    : "Sem dados"
                }
              />
              <MobileInsight
                icon="👤"
                label="Profissional"
                value={
                  profissionalDestaque
                    ? `${profissionalDestaque.nome} · ${profissionalDestaque.quantidade}x`
                    : "Sem dados"
                }
              />
              <MobileInsight
                icon="🔥"
                label="Pico"
                value={
                  horariosMaisVendidos[0]
                    ? `${horariosMaisVendidos[0].nome} · ${horariosMaisVendidos[0].quantidade}x`
                    : "Sem dados"
                }
              />
            </div>
          </div>

          <div style={mobileCompactPanelSoft}>
            <div style={mobileCompactHeaderLine}>
              <strong>Relacionamento</strong>
              <a href="/promocoes" style={mobileCompactLink}>
                Campanhas
              </a>
            </div>

            <div style={mobileRelationshipGrid}>
              <MobileMetric
                label="Aniversários"
                value={aniversariantes.length}
                tone="#f97316"
              />
              <MobileMetric
                label="Promoções"
                value={promocoesAtivas.length}
                tone="#ec4899"
              />
            </div>
          </div>

          <div style={mobileAttentionPanel}>
            <div style={mobileCompactHeaderLine}>
              <strong>O que merece atenção</strong>
              <button
                type="button"
                onClick={abrirModalReagendamento}
                style={mobileTextButton}
              >
                Ver todas
              </button>
            </div>

            <div style={mobileAttentionStack}>
              <MobileAttentionItem
                icon="!"
                title="Pendências financeiras"
                description={`${valorFinanceiro(financeiroPeriodo.pendente)} em aberto`}
                tone="#ef4444"
              />

              <MobileAttentionItem
                icon="📅"
                title="Agendamentos para confirmar"
                description={`${agendamentosPendentesPeriodo.length} aguardando confirmação`}
                tone="#f97316"
              />

              <MobileAttentionItem
                icon="🕘"
                title="Atendimentos hoje"
                description={`${agendamentosHoje.length} atendimentos agendados`}
                tone="#60a5fa"
              />

              <MobileAttentionItem
                icon="🏷️"
                title="Promoções ativas"
                description={`${promocoesAtivas.length} promoções em andamento`}
                tone="#a855f7"
              />
            </div>
          </div>
        </section>

        <section
          className="dashboard-analytics-mobile dashboard-desktop-rich"
          style={analyticsHeroGrid}
        >
          <div
            className="dashboard-analytics-card-mobile"
            style={analyticsMainCard}
          >
            <div style={analyticsHeaderPremium}>
              <div>
                <span style={sectionKickerPremium}>Financeiro inteligente</span>
                <h2 style={sectionTitlePremium}>
                  Receita, pendências e previsão
                </h2>
                <p style={sectionDescriptionPremium}>
                  Números operacionais do período com visão de caixa recebido,
                  pendências e potencial semanal.
                </p>
              </div>

              <a href="/financeiro" style={{ textDecoration: "none" }}>
                <button style={botaoMiniEnterprise}>Abrir financeiro</button>
              </a>
            </div>

            {usuarioPodeVerFinanceiro() ? (
              <>
                <div
                  className="dashboard-finance-grid-mobile"
                  style={financeGridEnterprise}
                >
                  <CardFinanceiro
                    titulo="Faturamento recebido"
                    valor={valorFinanceiro(faturamentoPeriodo)}
                    descricao="Pagamentos confirmados no período"
                    cor="#22c55e"
                  />

                  <CardFinanceiro
                    titulo="Pendente operacional"
                    valor={valorFinanceiro(financeiroPeriodo.pendente)}
                    descricao="Valores ainda não quitados"
                    cor="#f59e0b"
                  />

                  <CardFinanceiro
                    titulo="Lucro líquido estimado"
                    valor={valorFinanceiro(lucroLiquidoPeriodo)}
                    descricao="Receita menos custos e comissões"
                    cor="#8b5cf6"
                  />

                  <CardFinanceiro
                    titulo="Ticket médio"
                    valor={valorFinanceiro(ticketMedioPeriodo)}
                    descricao="Média recebida por atendimento"
                    cor="#06b6d4"
                  />
                </div>

                <div
                  className="dashboard-previsao-grid-mobile"
                  style={previsaoGridEnterprise}
                >
                  <div style={previsaoCardEnterprise}>
                    <span>Previsão semanal agendada</span>
                    <strong>{valorFinanceiro(previsaoPeriodo)}</strong>
                    <small>
                      Baseada no valor total dos serviços da semana.
                    </small>
                  </div>

                  <div style={previsaoCardEnterprise}>
                    <span>Pré-pagamentos da semana</span>
                    <strong>{valorFinanceiro(prePagamentosPeriodo)}</strong>
                    <small>Baseado nos agendamentos pré-pagos da semana.</small>
                  </div>

                  <div style={previsaoCardEnterprise}>
                    <span>Comissões estimadas</span>
                    <strong>
                      {valorFinanceiro(comissoesPeriodoEstimadas)}
                    </strong>
                    <small>
                      Com base nos atendimentos agendados da semana.
                    </small>
                  </div>
                </div>
              </>
            ) : (
              <div style={boxResumoBloqueado}>
                Valores financeiros ocultos. Solicite permissão ao administrador
                para liberar a visão financeira.
              </div>
            )}
          </div>

          <aside
            className="dashboard-operacao-card-mobile"
            style={operacaoLiveCard}
          >
            <span style={sectionKickerPremium}>Operação ao vivo</span>
            <h2 style={sectionTitlePremium}>Fila de atendimento</h2>

            {proximoCliente ? (
              <div style={proximoClientePremium}>
                <span>Próximo cliente</span>
                <strong>
                  {formatarHorario(proximoCliente.dataHoraInicio)}
                </strong>
                <h3>{nomeCliente(proximoCliente)}</h3>
                <p>{nomeServico(proximoCliente)}</p>
                <small>👤 {nomeProfissional(proximoCliente)}</small>
              </div>
            ) : (
              <div style={emptyBoxPremium}>
                Nenhum próximo cliente para hoje.
              </div>
            )}

            <div style={operacaoMiniGrid}>
              <ResumoItem
                label="Em atendimento"
                valor={atendimentosEmAndamento.length}
              />
              <ResumoItem
                label="Pendentes"
                valor={agendamentosPendentesPeriodo.length}
              />
              <ResumoItem
                label="Cancelamentos"
                valor={`${taxaCancelamentoPeriodo}%`}
              />
              <ResumoItem
                label="Conclusão"
                valor={`${taxaConclusaoPeriodo}%`}
              />
            </div>

            <button
              onClick={abrirModalReagendamento}
              style={botaoOperacaoPremium}
            >
              Abrir central de atendimentos
            </button>
          </aside>
        </section>

        <section
          className="dashboard-operacional-grid-mobile dashboard-desktop-rich"
          style={gridOperacionalEnterprise}
        >
          <div
            className="dashboard-panel-large-mobile"
            style={panelEnterpriseLarge}
          >
            <div style={analyticsHeaderPremium}>
              <div>
                <span style={sectionKickerPremium}>Agenda do dia</span>
                <h2 style={sectionTitlePremium}>Atendimentos de hoje</h2>
                <p style={sectionDescriptionPremium}>
                  Lista operacional rápida para confirmação de presença e
                  fechamento.
                </p>
              </div>

              <a href="/agenda" style={{ textDecoration: "none" }}>
                <button style={botaoMiniEnterprise}>Agenda semanal</button>
              </a>
            </div>

            {agendamentosHoje.length === 0 ? (
              <div style={emptyBoxPremium}>Nenhum atendimento para hoje.</div>
            ) : (
              <div
                className="dashboard-agenda-lista-mobile"
                style={agendaListaPremium}
              >
                {agendamentosHoje.map((agendamento) => {
                  const financeiro = resumoFinanceiroAtendimento(agendamento);
                  const temPromocaoAplicada =
                    promocaoFoiAplicadaDashboard(agendamento);
                  const valorOriginalPromocao = valorNumerico(
                    agendamento?.valorOriginalServico,
                  );
                  const valorEconomizadoPromocao = valorNumerico(
                    agendamento?.valorEconomizado,
                  );

                  return (
                    <div key={agendamento.id} style={agendaRowPremium}>
                      <div style={agendaHoraPremium}>
                        {formatarHorario(agendamento.dataHoraInicio)}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <strong style={agendaClientePremium}>
                          {nomeCliente(agendamento)}
                        </strong>
                        <p style={agendaMetaPremium}>
                          {nomeServico(agendamento)} ·{" "}
                          {nomeProfissional(agendamento)}
                        </p>

                        {temPromocaoAplicada && (
                          <span style={badgePromocaoPremium}>
                            🎁{" "}
                            {agendamento?.promocaoTitulo || "Promoção aplicada"}
                            {valorEconomizadoPromocao > 0
                              ? ` · economia ${dinheiro(valorEconomizadoPromocao)}`
                              : ""}
                          </span>
                        )}
                      </div>

                      <div style={agendaFinanceiroPremium}>
                        {temPromocaoAplicada && valorOriginalPromocao > 0 && (
                          <span
                            style={{
                              color: "#94a3b8",
                              fontSize: 13,
                              fontWeight: 800,
                              textDecoration: "line-through",
                            }}
                          >
                            {mostrarFinanceiro
                              ? dinheiro(valorOriginalPromocao)
                              : "••••••"}
                          </span>
                        )}

                        <strong>
                          {mostrarFinanceiro
                            ? dinheiro(financeiro.total)
                            : "••••••"}
                        </strong>
                        <span
                          style={{
                            color:
                              financeiro.pendente > 0 ? "#f59e0b" : "#22c55e",
                          }}
                        >
                          {financeiro.pendente > 0 ? "pendente" : "quitado"}
                        </span>

                        {temPromocaoAplicada && (
                          <span
                            style={{
                              color: "#e9d5ff",
                              fontSize: 11,
                              fontWeight: 900,
                              background: "rgba(168,85,247,0.14)",
                              border: "1px solid rgba(168,85,247,0.28)",
                              borderRadius: 999,
                              padding: "4px 8px",
                            }}
                          >
                            🎁 Promoção
                          </span>
                        )}
                      </div>

                      <div style={agendaActionsPremium}>
                        {agendamento.status === "em_atendimento" ? (
                          <button
                            onClick={() =>
                              selecionarAgendamentoPainel(agendamento)
                            }
                            style={{
                              border: "none",
                              borderRadius: 12,
                              padding: "10px 14px",
                              fontWeight: 700,
                              color: "#fff",
                              cursor: "pointer",
                              background:
                                "linear-gradient(135deg,#f59e0b,#d97706)",
                              boxShadow: "0 10px 25px rgba(245,158,11,.35)",
                            }}
                          >
                            Em atendimento
                          </button>
                        ) : agendamento.status === "concluido" ? (
                          <button
                            disabled
                            style={{
                              border: "none",
                              borderRadius: 12,
                              padding: "10px 14px",
                              fontWeight: 700,
                              color: "#fff",
                              opacity: 0.9,
                              cursor: "default",
                              background:
                                "linear-gradient(135deg,#22c55e,#15803d)",
                            }}
                          >
                            Finalizado
                          </button>
                        ) : (
                          <button
                            onClick={() => confirmarPresenca(agendamento)}
                            disabled={confirmandoPresencaId === agendamento.id}
                            style={{
                              border: "none",
                              borderRadius: 12,
                              padding: "10px 14px",
                              fontWeight: 700,
                              color: "#fff",
                              cursor: "pointer",
                              background:
                                "linear-gradient(135deg,#22c55e,#16a34a)",
                              boxShadow: "0 10px 25px rgba(34,197,94,.35)",
                              opacity:
                                confirmandoPresencaId === agendamento.id
                                  ? 0.7
                                  : 1,
                            }}
                          >
                            {confirmandoPresencaId === agendamento.id
                              ? "Confirmando..."
                              : "Confirmar"}
                          </button>
                        )}

                        {agendamento.status !== "cancelado" &&
                          agendamento.status !== "concluido" && (
                            <button
                              onClick={() =>
                                abrirFechamentoAtendimento(agendamento)
                              }
                              style={botaoAgendaFechar}
                            >
                              Fechar
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={sideStackEnterprise}>
            <div style={panelEnterprise}>
              <span style={sectionKickerPremium}>Alertas inteligentes</span>
              <h2 style={sectionTitlePremium}>O que merece atenção</h2>

              <div style={alertStackPremium}>
                <div style={smartAlertPremium}>
                  <strong>
                    {financeiroPeriodo.pendente > 0
                      ? "💰 Valores pendentes"
                      : "✅ Financeiro saudável"}
                  </strong>

                  <span>
                    {financeiroPeriodo.pendente > 0
                      ? `${valorFinanceiro(
                          financeiroPeriodo.pendente,
                        )} ainda aguardando pagamento.`
                      : "Nenhuma pendência financeira relevante no período."}
                  </span>
                </div>

                <div style={smartAlertPremium}>
                  <strong>
                    {taxaCancelamentoPeriodo > 20
                      ? "🚨 Cancelamentos no período"
                      : "🧭 Cancelamentos controlados"}
                  </strong>

                  <span>
                    {agendamentosCanceladosPeriodo.length} cancelamento(s) em{" "}
                    {agendamentosUnicos.length} agendamento(s)
                  </span>

                  <small
                    style={{
                      color:
                        taxaCancelamentoPeriodo > 20 ? "#fca5a5" : "#86efac",
                      fontWeight: 800,
                      marginTop: 6,
                      display: "block",
                    }}
                  >
                    Taxa: {taxaCancelamentoPeriodo}%
                  </small>
                </div>

                <div style={smartAlertPremium}>
                  <strong>🏆 Serviço campeão</strong>
                  <span>
                    {servicoCampeao
                      ? `${servicoCampeao.nome} · ${servicoCampeao.quantidade}x`
                      : "Sem volume suficiente ainda."}
                  </span>
                </div>
              </div>
            </div>

            <div style={panelEnterprise}>
              <span style={sectionKickerPremium}>Atalhos rápidos</span>
              <div
                className="dashboard-atalhos-grid-mobile"
                style={atalhosGridPremium}
              >
                <a href="/clientes" style={atalhoPremium}>
                  + Agendar
                </a>
                <a href="/servicos" style={atalhoPremium}>
                  Serviços
                </a>
                <a href="/profissionais" style={atalhoPremium}>
                  Profissionais
                </a>
                <a href="/promocoes" style={atalhoPremium}>
                  Promoções
                </a>
                <a href="/comissoes" style={atalhoPremium}>
                  Comissões
                </a>
                <a href="/configuracoes" style={atalhoPremium}>
                  Configurações
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          className="dashboard-desktop-rich"
          style={rankingDashboardSectionPremium}
        >
          <div style={panelEnterprise}>
            <div style={rankingHeaderPremium}>
              <div>
                <span style={sectionKickerPremium}>Inteligência comercial</span>
                <h2 style={sectionTitlePremium}>🏆 Rankings do período</h2>
                <p style={rankingSubtitlePremium}>
                  Padrão do mês atual · {formatarPeriodoRanking()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPesquisaRanking("");
                  setModalRankingAberto(true);
                }}
                style={rankingVerTodosButtonPremium}
              >
                Ver todos →
              </button>
            </div>

            <div style={rankingTabsPremium}>
              {[
                { key: "clientes", label: "👥 Clientes" },
                { key: "servicos", label: "💼 Serviços" },
                { key: "profissionais", label: "👨‍💼 Profissionais" },
              ].map((aba) => (
                <button
                  key={aba.key}
                  type="button"
                  onClick={() => setAbaRankingDashboard(aba.key as any)}
                  style={{
                    ...rankingTabButtonPremium,
                    ...(abaRankingDashboard === aba.key
                      ? rankingTabButtonAtivoPremium
                      : {}),
                  }}
                >
                  {aba.label}
                </button>
              ))}
            </div>

            {carregandoRankingDashboard ? (
              <div style={emptyBoxPremium}>Carregando rankings...</div>
            ) : rankingTopDashboard.length === 0 ? (
              <div style={emptyBoxPremium}>
                Sem dados suficientes neste período.
              </div>
            ) : (
              <div style={rankingStackPremium}>
                {rankingTopDashboard.map((item: any, index: number) => (
                  <div
                    key={`${abaRankingDashboard}-${item.nome}-${index}`}
                    style={rankingRowPremium}
                  >
                    <span>{medalhaRanking(index)}</span>
                    <strong>{item.nome}</strong>
                    <em>
                      {abaRankingDashboard === "clientes"
                        ? `${item.quantidadeAgendamentos} ag.`
                        : abaRankingDashboard === "servicos"
                          ? `${item.quantidade}x`
                          : `${item.atendimentos} atend.`}
                    </em>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          className="dashboard-desktop-rich"
          style={performanceGridEnterprise}
        >
          <div style={panelEnterprise}>
            <span style={sectionKickerPremium}>Performance comercial</span>
            <h2 style={sectionTitlePremium}>Serviços mais requisitados</h2>

            {servicosRequisitadosSemana.length === 0 ? (
              <div style={emptyBoxPremium}>
                Nenhum serviço requisitado nesta semana.
              </div>
            ) : (
              <div style={rankingStackPremium}>
                {servicosRequisitadosSemana.map(
                  (servico: any, index: number) => (
                    <div key={servico.nome} style={rankingRowPremium}>
                      <span>{index + 1}</span>
                      <strong>{servico.nome}</strong>
                      <em>{servico.quantidade}x</em>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          <div style={panelEnterprise}>
            <span style={sectionKickerPremium}>Time</span>
            <h2 style={sectionTitlePremium}>Profissionais em destaque</h2>

            {profissionaisRequisitadosSemana.length === 0 ? (
              <div style={emptyBoxPremium}>
                Nenhum profissional requisitado nesta semana.
              </div>
            ) : (
              <div style={rankingStackPremium}>
                {profissionaisRequisitadosSemana.map(
                  (profissional: any, index: number) => (
                    <div key={profissional.nome} style={rankingRowPremium}>
                      <span>{index + 1}</span>
                      <strong>{profissional.nome}</strong>
                      <em>{profissional.quantidade}x</em>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          <div style={panelEnterprise}>
            <span style={sectionKickerPremium}>Horários quentes</span>
            <h2 style={sectionTitlePremium}>Picos de venda</h2>

            {horariosMaisVendidos.length === 0 ? (
              <div style={emptyBoxPremium}>
                Sem dados suficientes no período.
              </div>
            ) : (
              <div style={rankingStackPremium}>
                {horariosMaisVendidos.map((horario: any, index: number) => (
                  <div key={horario.nome} style={rankingRowPremium}>
                    <span>{index + 1}</span>
                    <strong>{horario.nome}</strong>
                    <em>{horario.quantidade}x</em>
                  </div>
                ))}
              </div>
            )}

            <div style={miniInsightPremium}>
              <strong>Dia mais movimentado</strong>
              <span>
                {diaMaisMovimentado
                  ? `${diaMaisMovimentado.nome} · ${diaMaisMovimentado.quantidade} atend.`
                  : "Sem histórico suficiente"}
              </span>
            </div>
          </div>
        </section>

        <section className="dashboard-desktop-rich" style={crmGridEnterprise}>
          <div
            className="dashboard-panel-large-mobile"
            style={panelEnterpriseLarge}
          >
            <div style={analyticsHeaderPremium}>
              <div>
                <span style={sectionKickerPremium}>CRM e relacionamento</span>
                <h2 style={sectionTitlePremium}>
                  Aniversários e oportunidades
                </h2>
                <p style={sectionDescriptionPremium}>
                  Transforme datas e promoções ativas em retorno de clientes
                  pelo WhatsApp.
                </p>
              </div>

              <a href="/promocoes" style={{ textDecoration: "none" }}>
                <button style={botaoMiniEnterprise}>Campanhas</button>
              </a>
            </div>

            <div style={crmColumnsPremium}>
              <div>
                <h3 style={subsectionTitlePremium}>
                  🎂 Aniversariantes da semana
                </h3>
                {aniversariantes.length === 0 ? (
                  <div style={emptyBoxPremium}>
                    Nenhum aniversariante nos próximos 7 dias.
                  </div>
                ) : (
                  <div style={crmListPremium}>
                    {aniversariantes.map((cliente: any) => (
                      <div key={cliente.id} style={clienteCardPremium}>
                        <div>
                          <strong>{cliente.nome}</strong>
                          <span>
                            {cliente.diasRestantes === 0
                              ? "Faz aniversário hoje 🎉"
                              : `Aniversário em ${cliente.diasRestantes} dia(s)`}
                          </span>
                        </div>

                        {cliente.whatsapp && (
                          <a
                            href={`https://wa.me/55${String(cliente.whatsapp).replace(/\D/g, "")}`}
                            target="_blank"
                          >
                            <button style={botaoWhatsAppPremium}>
                              WhatsApp
                            </button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 style={subsectionTitlePremium}>🔥 Promoções ativas</h3>
                {promocoesAtivas.length === 0 ? (
                  <div style={emptyBoxPremium}>
                    Nenhuma promoção ativa no momento.
                  </div>
                ) : (
                  <div style={crmListPremium}>
                    {promocoesAtivas.map((promo: any) => (
                      <div key={promo.id} style={promocaoCardPremium}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <strong>{promo.titulo}</strong>
                          <span>ativa</span>
                        </div>

                        {promo.descricao && <p>{promo.descricao}</p>}

                        <small>
                          🎁{" "}
                          {promo.tipoDesconto === "percentual"
                            ? `${promo.desconto}%`
                            : dinheiro(promo.desconto)}{" "}
                          ·{" "}
                          {promo.dataInicio
                            ? new Date(promo.dataInicio).toLocaleDateString(
                                "pt-BR",
                              )
                            : "--"}{" "}
                          até{" "}
                          {promo.dataFim
                            ? new Date(promo.dataFim).toLocaleDateString(
                                "pt-BR",
                              )
                            : "--"}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          className="dashboard-desktop-rich"
          style={chartPanelEnterprise}
        >
          <div style={analyticsHeaderPremium}>
            <div>
              <span style={sectionKickerPremium}>Fluxo financeiro</span>

              <h2 style={sectionTitlePremium}>Recebimentos no período</h2>

              <p style={sectionDescriptionPremium}>
                Valores recebidos e pré-pagos no período filtrado.
              </p>
            </div>
          </div>

          <div className="dashboard-chart-mobile">
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={graficoFaturamento}>
                <XAxis dataKey="data" stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10,15,35,0.96)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 16,
                    backdropFilter: "blur(18px)",
                    boxShadow: "0 20px 50px rgba(0,0,0,.45)",
                    color: "#fff",
                  }}
                  labelStyle={{
                    color: "#ffffff",
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                  itemStyle={{
                    color: "#c084fc",
                    fontWeight: 700,
                  }}
                  cursor={{
                    stroke: "#8b5cf6",
                    strokeWidth: 2,
                    strokeDasharray: "4 4",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--marcae-primary)"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {modalRankingAberto && (
        <div
          className="dashboard-modal-overlay-mobile"
          style={modalOverlay}
          onClick={fecharModalRankingDashboard}
        >
          <div
            className="dashboard-modal-box-mobile"
            style={modalBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header-mobile" style={modalHeader}>
              <div>
                <h2 style={{ margin: 0 }}>🏆 Rankings do período</h2>
                <p style={{ marginTop: 6, color: "#94a3b8" }}>
                  Veja clientes, serviços e profissionais em ordem de maior
                  movimento para menor movimento.
                </p>
              </div>

              <button
                onClick={fecharModalRankingDashboard}
                style={botaoFecharModal}
              >
                ×
              </button>
            </div>

            <div style={rankingFiltrosModalPremium}>
              <button
                type="button"
                onClick={filtrarRankingMesAtual}
                style={rankingFiltroButtonPremium}
              >
                Mês atual
              </button>
              <button
                type="button"
                onClick={() => filtrarRankingUltimosDias(7)}
                style={rankingFiltroButtonPremium}
              >
                7 dias
              </button>
              <button
                type="button"
                onClick={() => filtrarRankingUltimosDias(30)}
                style={rankingFiltroButtonPremium}
              >
                30 dias
              </button>

              <input
                type="date"
                value={dataInicioRanking}
                onChange={(e) => setDataInicioRanking(e.target.value)}
                style={rankingDateInputPremium}
              />

              <input
                type="date"
                value={dataFimRanking}
                onChange={(e) => setDataFimRanking(e.target.value)}
                style={rankingDateInputPremium}
              />

              <button
                type="button"
                onClick={aplicarFiltroRankingDashboard}
                style={rankingAplicarButtonPremium}
              >
                Aplicar
              </button>
            </div>

            <div style={rankingTabsPremium}>
              {[
                { key: "clientes", label: "👥 Clientes" },
                { key: "servicos", label: "💼 Serviços" },
                { key: "profissionais", label: "👨‍💼 Profissionais" },
              ].map((aba) => (
                <button
                  key={aba.key}
                  type="button"
                  onClick={() => setAbaRankingDashboard(aba.key as any)}
                  style={{
                    ...rankingTabButtonPremium,
                    ...(abaRankingDashboard === aba.key
                      ? rankingTabButtonAtivoPremium
                      : {}),
                  }}
                >
                  {aba.label}
                </button>
              ))}
            </div>

            <input
              value={pesquisaRanking}
              onChange={(e) => setPesquisaRanking(e.target.value)}
              placeholder="Pesquisar no ranking..."
              style={inputPesquisa}
            />

            {carregandoRankingDashboard ? (
              <div style={emptyBox}>Carregando ranking...</div>
            ) : rankingAtivoFiltrado.length === 0 ? (
              <div style={emptyBox}>
                Nenhum resultado encontrado para este período.
              </div>
            ) : (
              <div style={rankingListaCompletaPremium}>
                {rankingAtivoFiltrado.map((item: any, index: number) => (
                  <article
                    key={`${abaRankingDashboard}-modal-${item.nome}-${index}`}
                    style={rankingCardModalPremium}
                  >
                    <div style={rankingCardTopoPremium}>
                      <div style={rankingPosicaoPremium}>
                        {medalhaRanking(index)}
                      </div>

                      <div>
                        <strong style={rankingNomePremium}>{item.nome}</strong>
                        <span style={rankingPeriodoPremium}>
                          {formatarPeriodoRanking()}
                        </span>
                      </div>
                    </div>

                    {abaRankingDashboard === "clientes" && (
                      <div style={rankingMetricasGridPremium}>
                        <div>
                          <span>Agendamentos</span>
                          <strong>{item.quantidadeAgendamentos}</strong>
                        </div>
                        <div>
                          <span>Valor total</span>
                          <strong>
                            {valorFinanceiro(item.valorTotal || 0)}
                          </strong>
                        </div>
                        <div>
                          <span>Ticket médio</span>
                          <strong>
                            {valorFinanceiro(item.ticketMedio || 0)}
                          </strong>
                        </div>
                        <div>
                          <span>Último atendimento</span>
                          <strong>
                            {formatarData(item.ultimoAtendimento)}
                          </strong>
                        </div>
                        <div>
                          <span>Serviço preferido</span>
                          <strong>
                            {item.servicoMaisRealizado || "Não informado"}{" "}
                            {item.quantidadeServico
                              ? `(${item.quantidadeServico}x)`
                              : ""}
                          </strong>
                        </div>
                        <div>
                          <span>Profissional preferido</span>
                          <strong>
                            {item.profissionalMaisEscolhido || "Não informado"}{" "}
                            {item.quantidadeProfissional
                              ? `(${item.quantidadeProfissional}x)`
                              : ""}
                          </strong>
                        </div>
                      </div>
                    )}

                    {abaRankingDashboard === "servicos" && (
                      <div style={rankingMetricasGridPremium}>
                        <div>
                          <span>Realizações</span>
                          <strong>{item.quantidade}</strong>
                        </div>
                        <div>
                          <span>Faturamento</span>
                          <strong>
                            {valorFinanceiro(item.faturamento || 0)}
                          </strong>
                        </div>
                        <div>
                          <span>Ticket médio</span>
                          <strong>
                            {valorFinanceiro(item.ticketMedio || 0)}
                          </strong>
                        </div>
                        <div>
                          <span>Profissional destaque</span>
                          <strong>
                            {item.profissionalMaisExecutou || "Não informado"}{" "}
                            {item.quantidadeProfissional
                              ? `(${item.quantidadeProfissional}x)`
                              : ""}
                          </strong>
                        </div>
                      </div>
                    )}

                    {abaRankingDashboard === "profissionais" && (
                      <div style={rankingMetricasGridPremium}>
                        <div>
                          <span>Atendimentos</span>
                          <strong>{item.atendimentos}</strong>
                        </div>
                        <div>
                          <span>Faturamento</span>
                          <strong>
                            {valorFinanceiro(item.faturamento || 0)}
                          </strong>
                        </div>
                        <div>
                          <span>Comissão</span>
                          <strong>{valorFinanceiro(item.comissao || 0)}</strong>
                        </div>
                        <div>
                          <span>Ticket médio</span>
                          <strong>
                            {valorFinanceiro(item.ticketMedio || 0)}
                          </strong>
                        </div>
                        <div>
                          <span>Serviço mais realizado</span>
                          <strong>
                            {item.servicoMaisRealizado || "Não informado"}{" "}
                            {item.quantidadeServico
                              ? `(${item.quantidadeServico}x)`
                              : ""}
                          </strong>
                        </div>
                      </div>
                    )}

                    {abaRankingDashboard === "clientes" && (
                      <button
                        type="button"
                        onClick={() => abrirCadastroClienteRanking(item)}
                        style={rankingAbrirCadastroButtonPremium}
                      >
                        Abrir cadastro
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {modalReagendamentoAberto && (
        <div
          className="dashboard-modal-overlay-mobile"
          style={modalOverlay}
          onClick={fecharModalReagendamento}
        >
          <div
            className="dashboard-modal-box-mobile"
            style={modalBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header-mobile" style={modalHeader}>
              <div>
                <h2 style={{ margin: 0 }}>Central de atendimento</h2>
                <p style={{ marginTop: 6, color: "#64748b" }}>
                  Pesquise agendamentos abertos por nome, serviço, profissional,
                  WhatsApp ou CPF.
                </p>
              </div>

              <button
                onClick={fecharModalReagendamento}
                style={botaoFecharModal}
              >
                ×
              </button>
            </div>

            <input
              className="dashboard-pesquisa-central-mobile"
              value={pesquisaReagendamento}
              onChange={(e) => setPesquisaReagendamento(e.target.value)}
              placeholder="Pesquisar agendamentos abertos por nome, serviço, profissional, WhatsApp ou CPF"
              style={inputPesquisa}
            />

            <div
              className="dashboard-filtros-central-mobile"
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginTop: 12,
              }}
            >
              {[
                { key: "abertosHoje", label: "Abertos hoje" },
                { key: "abertos", label: "Abertos" },
                { key: "finalizados", label: "Finalizados" },
                { key: "cancelados", label: "Cancelados" },
                { key: "todos", label: "Todos" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setFiltroCentralAtendimentos(item.key as any);
                    setAgendamentoSelecionado(null);
                  }}
                  style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 999,
                    padding: "9px 13px",
                    fontWeight: 900,
                    cursor: "pointer",
                    color:
                      filtroCentralAtendimentos === item.key
                        ? "#fff"
                        : "#cbd5e1",
                    background:
                      filtroCentralAtendimentos === item.key
                        ? "linear-gradient(135deg,#7c3aed,#a855f7)"
                        : "rgba(255,255,255,0.04)",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="dashboard-modal-grid-mobile" style={modalGrid}>
              <div
                className="dashboard-lista-central-mobile"
                style={listaAgendamentos}
              >
                {carregandoCentral ? (
                  <div style={emptyBox}>Carregando atendimentos...</div>
                ) : agendamentosFuturosFiltrados.length === 0 ? (
                  <div style={emptyBox}>
                    Nenhum atendimento encontrado para o filtro selecionado.
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
                            ? "1px solid rgba(168,85,247,0.72)"
                            : agendamento.status === "cancelado"
                              ? "1px solid rgba(248,113,113,0.34)"
                              : "1px solid rgba(255,255,255,0.10)",
                        background:
                          agendamentoSelecionado?.id === agendamento.id
                            ? "linear-gradient(135deg, rgba(124,58,237,0.28), rgba(59,130,246,0.10))"
                            : agendamento.status === "cancelado"
                              ? "linear-gradient(135deg, rgba(239,68,68,0.16), rgba(127,29,29,0.10))"
                              : "linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035))",
                        boxShadow:
                          agendamentoSelecionado?.id === agendamento.id
                            ? "0 18px 45px rgba(124,58,237,0.18)"
                            : agendamento.status === "cancelado"
                              ? "0 16px 40px rgba(239,68,68,0.10)"
                              : "0 14px 34px rgba(0,0,0,0.18)",
                      }}
                    >
                      <div style={{ textAlign: "left" }}>
                        <strong>{nomeCliente(agendamento)}</strong>
                        <p style={{ margin: "4px 0", color: "#9fb0c7" }}>
                          {nomeServico(agendamento)} ·{" "}
                          {nomeProfissional(agendamento)}
                        </p>

                        <span style={{ color: "#cbd5e1", fontSize: 13 }}>
                          {formatarDataHora(agendamento.dataHoraInicio)}
                        </span>

                        {agendamento.status === "cancelado" && (
                          <div
                            style={{
                              marginTop: 7,
                              background: "rgba(239,68,68,0.12)",
                              border: "1px solid rgba(248,113,113,0.28)",
                              color: "#fecaca",
                              borderRadius: 9,
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
                              Motivo:{" "}
                              {agendamento.motivoCancelamento ||
                                "Não informado"}
                            </div>
                          </div>
                        )}
                      </div>

                      {(() => {
                        const financeiro =
                          resumoFinanceiroAtendimento(agendamento);
                        const ajusteFechamento =
                          resumoAjusteFechamentoSalvo(agendamento);

                        return (
                          <div style={resumoFinanceiroModalLista}>
                            {ajusteFechamento.temAjuste &&
                              ajusteFechamento.valorOriginal > 0 && (
                                <span
                                  style={{
                                    color: "#94a3b8",
                                    fontSize: 12,
                                    fontWeight: 900,
                                    textDecoration: "line-through",
                                    lineHeight: 1.1,
                                  }}
                                >
                                  {dinheiro(ajusteFechamento.valorOriginal)}
                                </span>
                              )}

                            <strong>{dinheiro(financeiro.total)}</strong>

                            {ajusteFechamento.temDesconto && (
                              <span
                                style={{ color: "#22c55e", fontWeight: 950 }}
                              >
                                desconto {dinheiro(ajusteFechamento.desconto)}
                              </span>
                            )}

                            {ajusteFechamento.temAcrescimo && (
                              <span
                                style={{ color: "#f97316", fontWeight: 950 }}
                              >
                                acréscimo {dinheiro(ajusteFechamento.acrescimo)}
                              </span>
                            )}

                            <span style={{ color: "#15803d" }}>
                              pago {dinheiro(financeiro.pago)}
                            </span>
                            {financeiro.pendente > 0 ? (
                              <span style={{ color: "#b45309" }}>
                                Pendente: {dinheiro(financeiro.pendente)}
                              </span>
                            ) : (
                              <span style={{ color: "#15803d" }}>
                                Finalizado quitado
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </button>
                  ))
                )}
              </div>

              <div
                className={`dashboard-painel-atendimento-mobile ${agendamentoSelecionado ? "dashboard-atendimento-selecionado-mobile" : ""}`}
                style={painelAcaoModal}
              >
                {!agendamentoSelecionado ? (
                  <div style={emptyBox}>
                    Selecione um agendamento para reagendar ou cancelar.
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="dashboard-atendimento-voltar-mobile"
                      onClick={() => setAgendamentoSelecionado(null)}
                    >
                      ← Voltar para lista de atendimentos
                    </button>

                    <div
                      style={{
                        display: "grid",
                        gap: 7,
                        padding: "4px 4px 8px",
                        color: "#f8fafc",
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          fontSize: 18,
                          fontWeight: 950,
                          lineHeight: 1.12,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        👤 {nomeCliente(agendamentoSelecionado)}
                      </strong>

                      <span
                        style={{
                          display: "block",
                          color: "#dbeafe",
                          fontSize: 14,
                          fontWeight: 850,
                          lineHeight: 1.2,
                        }}
                      >
                        💆 {nomeServico(agendamentoSelecionado)}
                      </span>

                      <span
                        style={{
                          display: "block",
                          color: "#cbd5e1",
                          fontSize: 13,
                          fontWeight: 800,
                          lineHeight: 1.2,
                        }}
                      >
                        📅{" "}
                        {formatarDataHora(
                          agendamentoSelecionado.dataHoraInicio,
                        )}
                      </span>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          width: "fit-content",
                          color:
                            agendamentoSelecionado.status === "cancelado"
                              ? "#fecaca"
                              : agendamentoSelecionado.status === "concluido"
                                ? "#bfdbfe"
                                : agendamentoSelecionado.status ===
                                    "em_atendimento"
                                  ? "#bbf7d0"
                                  : "#fde68a",
                          fontSize: 13,
                          fontWeight: 900,
                          lineHeight: 1.2,
                          textTransform: "capitalize",
                        }}
                      >
                        {agendamentoSelecionado.status === "cancelado"
                          ? "🔴"
                          : agendamentoSelecionado.status === "concluido"
                            ? "🔵"
                            : agendamentoSelecionado.status === "em_atendimento"
                              ? "🟢"
                              : "🟡"}{" "}
                        {textoStatus(agendamentoSelecionado.status)}
                      </span>
                    </div>

                    {agendamentoSelecionado.status === "cancelado" && (
                      <>
                        <div style={cardInfoCanceladoModal}>
                          <span style={labelCanceladoModal}>
                            Motivo do cancelamento
                          </span>
                          <strong>
                            {agendamentoSelecionado.motivoCancelamento ||
                              "Não informado"}
                          </strong>
                        </div>

                        <div style={cardInfoCanceladoModal}>
                          <span style={labelCanceladoModal}>Cancelado em</span>
                          <strong>
                            {formatarCanceladoEm(
                              agendamentoSelecionado.canceladoEm,
                            )}
                          </strong>
                        </div>
                      </>
                    )}

                    {agendamentoSelecionado.status !== "cancelado" ? (
                      <>
                        <div
                          className="dashboard-fechamento-box-mobile"
                          style={fechamentoBox}
                        >
                          <span style={etapaKickerVerde}>
                            ETAPA 1 - CAIXA E FINALIZAÇÃO
                          </span>

                          <h3 style={tituloFechamentoPremium}>
                            Fechamento do atendimento
                          </h3>

                          <p style={descricaoSecaoOperacional}>
                            Confira o resumo, ative apenas as ações necessárias
                            e finalize com as modalidades de pagamento.
                          </p>

                          {(() => {
                            const financeiro = resumoFinanceiroAtendimento(
                              agendamentoSelecionado,
                              resumoServicosAdicionais,
                            );

                            const recebidoAgora =
                              formFinalizacao.pagamentos.reduce(
                                (total: number, pagamento: any) =>
                                  total + valorNumerico(pagamento.valor),
                                0,
                              );

                            const desconto =
                              formFinalizacao.habilitarAjusteValor
                                ? valorDescontoFechamento()
                                : 0;
                            const acrescimo =
                              formFinalizacao.habilitarAjusteValor
                                ? valorAcrescimoFechamento()
                                : 0;
                            const creditoDisponivel = valorNumerico(
                              resumoFinanceiroCliente.credito,
                            );
                            const debitoDisponivel = valorNumerico(
                              resumoFinanceiroCliente.debito,
                            );
                            const saldoAjustado = Math.max(
                              financeiro.pendente - desconto + acrescimo,
                              0,
                            );
                            const creditoInformado = valorNumerico(
                              formFinalizacao.valorCreditoUtilizadoCliente,
                            );
                            const creditoAbatido =
                              formFinalizacao.usarCreditoCliente
                                ? Math.min(
                                    creditoInformado > 0
                                      ? creditoInformado
                                      : creditoDisponivel,
                                    creditoDisponivel,
                                    saldoAjustado,
                                  )
                                : 0;
                            const totalDepoisCredito = Math.max(
                              saldoAjustado - creditoAbatido,
                              0,
                            );
                            const debitoCobrado =
                              formFinalizacao.abaterDebitoCliente
                                ? valorNumerico(
                                    formFinalizacao.valorAbatimentoDebitoCliente,
                                  )
                                : 0;
                            const totalACobrarAgora =
                              totalDepoisCredito + debitoCobrado;
                            const totalPagoFechamento =
                              financeiro.pago + recebidoAgora;
                            const troco = Math.max(
                              recebidoAgora - totalACobrarAgora,
                              0,
                            );
                            const pendenteFinal = Math.max(
                              totalACobrarAgora - recebidoAgora,
                              0,
                            );

                            return (
                              <div
                                className="dashboard-resumo-ajustado-mobile"
                                style={{
                                  display: "grid",
                                  gap: 7,
                                  marginBottom: 12,
                                  padding: 11,
                                  borderRadius: 16,
                                  background: "rgba(15,23,42,0.58)",
                                  border: "1px solid rgba(255,255,255,0.12)",
                                }}
                              >
                                <div style={{ marginBottom: 2 }}>
                                  <strong
                                    style={{
                                      color: "#f8fafc",
                                      fontSize: 15,
                                      fontWeight: 950,
                                    }}
                                  >
                                    Resumo do fechamento
                                  </strong>
                                  <p
                                    style={{
                                      margin: "3px 0 0",
                                      color: "#94a3b8",
                                      fontSize: 11,
                                      fontWeight: 800,
                                    }}
                                  >
                                    Valores atualizados automaticamente conforme
                                    o fechamento é preenchido.
                                  </p>
                                </div>

                                <ResumoFinanceiroItem
                                  label="Total"
                                  valor={dinheiro(financeiro.total)}
                                  cor="#f8fafc"
                                />
                                <ResumoFinanceiroItem
                                  label="Desconto"
                                  valor={dinheiro(desconto)}
                                  cor={desconto > 0 ? "#22c55e" : "#94a3b8"}
                                />
                                <ResumoFinanceiroItem
                                  label="Acréscimo"
                                  valor={dinheiro(acrescimo)}
                                  cor={acrescimo > 0 ? "#f97316" : "#94a3b8"}
                                />
                                <ResumoFinanceiroItem
                                  label="Crédito disponível"
                                  valor={
                                    carregandoFinanceiroCliente
                                      ? "Carregando..."
                                      : dinheiro(creditoDisponivel)
                                  }
                                  cor={
                                    creditoDisponivel > 0
                                      ? "#38bdf8"
                                      : "#94a3b8"
                                  }
                                />
                                <ResumoFinanceiroItem
                                  label="Débito disponível"
                                  valor={
                                    carregandoFinanceiroCliente
                                      ? "Carregando..."
                                      : dinheiro(debitoDisponivel)
                                  }
                                  cor={
                                    debitoDisponivel > 0 ? "#f97316" : "#94a3b8"
                                  }
                                />
                                <ResumoFinanceiroItem
                                  label="Pago"
                                  valor={dinheiro(totalPagoFechamento)}
                                  cor={
                                    totalPagoFechamento > 0
                                      ? "#22c55e"
                                      : "#94a3b8"
                                  }
                                />
                                <ResumoFinanceiroItem
                                  label="Troco"
                                  valor={dinheiro(troco)}
                                  cor={troco > 0 ? "#facc15" : "#94a3b8"}
                                />
                                <ResumoFinanceiroItem
                                  label="Pendente"
                                  valor={dinheiro(pendenteFinal)}
                                  cor={
                                    pendenteFinal > 0 ? "#ef4444" : "#22c55e"
                                  }
                                />
                              </div>
                            );
                          })()}

                          <div style={acoesFechamentoBox}>
                            <ToggleLinha
                              titulo="Fechar atendimento"
                              descricao="Habilita pagamentos, observação e conclusão."
                              ativo={formFinalizacao.habilitarFechamento}
                              onClick={() => {
                                const ativo =
                                  !formFinalizacao.habilitarFechamento;
                                setFormFinalizacao({
                                  ...formFinalizacao,
                                  habilitarFechamento: ativo,
                                  habilitarAjusteValor: ativo
                                    ? formFinalizacao.habilitarAjusteValor
                                    : false,
                                  habilitarCreditoDebito: false,
                                  usarCreditoCliente: ativo
                                    ? formFinalizacao.usarCreditoCliente
                                    : false,
                                  abaterDebitoCliente: ativo
                                    ? formFinalizacao.abaterDebitoCliente
                                    : false,
                                  gerarDebitoCliente: ativo
                                    ? formFinalizacao.gerarDebitoCliente
                                    : false,
                                  gerarCreditoCliente: ativo
                                    ? formFinalizacao.gerarCreditoCliente
                                    : false,
                                  valorDescontoAtendimento: ativo
                                    ? formFinalizacao.valorDescontoAtendimento
                                    : "",
                                  valorAcrescimoAtendimento: ativo
                                    ? formFinalizacao.valorAcrescimoAtendimento
                                    : "",
                                  observacaoAjusteAtendimento: ativo
                                    ? formFinalizacao.observacaoAjusteAtendimento
                                    : "",
                                  valorAbatimentoDebitoCliente: ativo
                                    ? formFinalizacao.valorAbatimentoDebitoCliente
                                    : "",
                                  observacaoAbatimentoDebitoCliente: ativo
                                    ? formFinalizacao.observacaoAbatimentoDebitoCliente
                                    : "",
                                  valorDebitoCliente: ativo
                                    ? formFinalizacao.valorDebitoCliente
                                    : "",
                                  observacaoDebitoCliente: ativo
                                    ? formFinalizacao.observacaoDebitoCliente
                                    : "",
                                  valorCreditoCliente: ativo
                                    ? formFinalizacao.valorCreditoCliente
                                    : "",
                                  observacaoCreditoCliente: ativo
                                    ? formFinalizacao.observacaoCreditoCliente
                                    : "",
                                  valorCreditoUtilizadoCliente: ativo
                                    ? formFinalizacao.valorCreditoUtilizadoCliente
                                    : "",
                                  observacao: ativo
                                    ? formFinalizacao.observacao
                                    : "",
                                });
                              }}
                            />

                            {formFinalizacao.habilitarFechamento && (
                              <div style={{ display: "grid", gap: 8 }}>
                                {(() => {
                                  const creditoDisponivelCliente =
                                    valorNumerico(
                                      resumoFinanceiroCliente.credito,
                                    );
                                  const pendencia = obterPendenciaComCredito(
                                    agendamentoSelecionado,
                                  );
                                  const valorSugeridoCredito = Math.min(
                                    creditoDisponivelCliente,
                                    pendencia.pendenteAposPagamentos ||
                                      pendenteAjustadoFechamento(
                                        agendamentoSelecionado,
                                      ),
                                  );

                                  if (creditoDisponivelCliente <= 0)
                                    return null;

                                  return (
                                    <div style={avisoCreditoClienteFechamento}>
                                      <div
                                        style={avisoFinanceiroTopoFechamento}
                                      >
                                        <strong>
                                          Cliente possui crédito de{" "}
                                          {dinheiro(creditoDisponivelCliente)}
                                        </strong>
                                        <span>
                                          Deseja abater no atendimento atual?
                                        </span>
                                      </div>

                                      <ToggleSimNaoFechamento
                                        titulo="Abater crédito neste atendimento"
                                        descricao="Por padrão fica como Não. Ative somente se desejar usar o crédito agora."
                                        ativo={
                                          formFinalizacao.usarCreditoCliente
                                        }
                                        variante="verde"
                                        onClick={() => {
                                          const usarCredito =
                                            !formFinalizacao.usarCreditoCliente;

                                          setFormFinalizacao({
                                            ...formFinalizacao,
                                            usarCreditoCliente: usarCredito,
                                            valorCreditoUtilizadoCliente:
                                              usarCredito
                                                ? String(
                                                    (valorSugeridoCredito > 0
                                                      ? valorSugeridoCredito
                                                      : creditoDisponivelCliente
                                                    ).toFixed(2),
                                                  )
                                                : "",
                                          });
                                        }}
                                      />

                                      {formFinalizacao.usarCreditoCliente && (
                                        <input
                                          type="number"
                                          placeholder={`Valor do crédito até ${dinheiro(creditoDisponivelCliente)}`}
                                          value={
                                            formFinalizacao.valorCreditoUtilizadoCliente ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            setFormFinalizacao({
                                              ...formFinalizacao,
                                              valorCreditoUtilizadoCliente:
                                                e.target.value,
                                            })
                                          }
                                          style={{
                                            ...inputData,
                                            minHeight: 38,
                                            height: 38,
                                          }}
                                        />
                                      )}
                                    </div>
                                  );
                                })()}

                                {(() => {
                                  const debitoClienteDisponivel = valorNumerico(
                                    resumoFinanceiroCliente.debito,
                                  );
                                  const recebidoAgora =
                                    formFinalizacao.pagamentos.reduce(
                                      (total: number, pagamento: any) =>
                                        total + valorNumerico(pagamento.valor),
                                      0,
                                    );
                                  const pendenteAjustado =
                                    pendenteAjustadoFechamento(
                                      agendamentoSelecionado,
                                    );
                                  const excedentePagamento = Math.max(
                                    recebidoAgora - pendenteAjustado,
                                    0,
                                  );
                                  const abatimentoSugerido = Math.min(
                                    excedentePagamento,
                                    debitoClienteDisponivel,
                                  );

                                  if (debitoClienteDisponivel <= 0) return null;

                                  return (
                                    <div style={avisoDebitoClienteFechamento}>
                                      <div
                                        style={avisoFinanceiroTopoFechamento}
                                      >
                                        <strong>
                                          Cliente possui débitos de{" "}
                                          {dinheiro(debitoClienteDisponivel)}
                                        </strong>
                                        <span>
                                          Deseja cobrar agora neste fechamento?
                                        </span>
                                      </div>

                                      <ToggleSimNaoFechamento
                                        titulo="Cobrar débito neste fechamento"
                                        descricao="Por padrão fica como Não. Ative somente se desejar cobrar o débito agora."
                                        ativo={
                                          formFinalizacao.abaterDebitoCliente
                                        }
                                        variante="laranja"
                                        onClick={() => {
                                          const cobrarDebito =
                                            !formFinalizacao.abaterDebitoCliente;

                                          setFormFinalizacao({
                                            ...formFinalizacao,
                                            abaterDebitoCliente: cobrarDebito,
                                            valorAbatimentoDebitoCliente:
                                              cobrarDebito
                                                ? String(
                                                    (abatimentoSugerido > 0
                                                      ? abatimentoSugerido
                                                      : debitoClienteDisponivel
                                                    ).toFixed(2),
                                                  )
                                                : "",
                                            observacaoAbatimentoDebitoCliente:
                                              cobrarDebito
                                                ? formFinalizacao.observacaoAbatimentoDebitoCliente
                                                : "",
                                          });
                                        }}
                                      />

                                      {formFinalizacao.abaterDebitoCliente && (
                                        <input
                                          type="number"
                                          placeholder={`Valor do débito até ${dinheiro(debitoClienteDisponivel)}`}
                                          value={
                                            formFinalizacao.valorAbatimentoDebitoCliente ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            setFormFinalizacao({
                                              ...formFinalizacao,
                                              valorAbatimentoDebitoCliente:
                                                e.target.value,
                                            })
                                          }
                                          style={{
                                            ...inputData,
                                            minHeight: 38,
                                            height: 38,
                                          }}
                                        />
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            <ToggleLinha
                              titulo="Aplicar ajuste financeiro"
                              descricao="Desconto ou acréscimo antes do pagamento."
                              ativo={formFinalizacao.habilitarAjusteValor}
                              disabled={!formFinalizacao.habilitarFechamento}
                              onClick={() => {
                                if (!formFinalizacao.habilitarFechamento)
                                  return;
                                const ativo =
                                  !formFinalizacao.habilitarAjusteValor;
                                setFormFinalizacao({
                                  ...formFinalizacao,
                                  habilitarAjusteValor: ativo,
                                  valorDescontoAtendimento: ativo
                                    ? formFinalizacao.valorDescontoAtendimento
                                    : "",
                                  valorAcrescimoAtendimento: ativo
                                    ? formFinalizacao.valorAcrescimoAtendimento
                                    : "",
                                  observacaoAjusteAtendimento: ativo
                                    ? formFinalizacao.observacaoAjusteAtendimento
                                    : "",
                                });
                              }}
                            />
                          </div>

                          {formFinalizacao.habilitarFechamento &&
                            formFinalizacao.habilitarAjusteValor && (
                              <div
                                style={{
                                  ...subBlocoFechamentoRoxo,
                                  gap: 4,
                                  padding: 10,
                                  marginBottom: 8,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 8,
                                  }}
                                >
                                  <span style={subBlocoNumeroLaranja}>2</span>
                                  <div style={{ minWidth: 0 }}>
                                    <strong
                                      style={{
                                        display: "block",
                                        fontSize: 15,
                                        lineHeight: 1.05,
                                      }}
                                    >
                                      Ajuste financeiro
                                    </strong>
                                    <small
                                      style={{
                                        display: "block",
                                        marginTop: 2,
                                        color: "#cbd5e1",
                                        fontSize: 11,
                                        fontWeight: 800,
                                        lineHeight: 1.18,
                                      }}
                                    >
                                      Escolha o tipo e informe o valor. O resumo
                                      atualiza em tempo real.
                                    </small>
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 7,
                                    marginBottom: 0,
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFormFinalizacao({
                                        ...formFinalizacao,
                                        tipoAjusteFechamento: "desconto",
                                        valorAcrescimoAtendimento: "",
                                      })
                                    }
                                    style={{
                                      height: 34,
                                      borderRadius: 11,
                                      border:
                                        formFinalizacao.tipoAjusteFechamento ===
                                        "desconto"
                                          ? "1px solid rgba(74,222,128,0.50)"
                                          : "1px solid rgba(255,255,255,0.10)",
                                      background:
                                        formFinalizacao.tipoAjusteFechamento ===
                                        "desconto"
                                          ? "linear-gradient(135deg, rgba(34,197,94,0.26), rgba(34,197,94,0.10))"
                                          : "rgba(15,23,42,0.56)",
                                      color:
                                        formFinalizacao.tipoAjusteFechamento ===
                                        "desconto"
                                          ? "#bbf7d0"
                                          : "#cbd5e1",
                                      fontSize: 12,
                                      fontWeight: 950,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Desconto
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFormFinalizacao({
                                        ...formFinalizacao,
                                        tipoAjusteFechamento: "acrescimo",
                                        valorDescontoAtendimento: "",
                                      })
                                    }
                                    style={{
                                      height: 34,
                                      borderRadius: 11,
                                      border:
                                        formFinalizacao.tipoAjusteFechamento ===
                                        "acrescimo"
                                          ? "1px solid rgba(251,146,60,0.52)"
                                          : "1px solid rgba(255,255,255,0.10)",
                                      background:
                                        formFinalizacao.tipoAjusteFechamento ===
                                        "acrescimo"
                                          ? "linear-gradient(135deg, rgba(249,115,22,0.30), rgba(249,115,22,0.10))"
                                          : "rgba(15,23,42,0.56)",
                                      color:
                                        formFinalizacao.tipoAjusteFechamento ===
                                        "acrescimo"
                                          ? "#fed7aa"
                                          : "#cbd5e1",
                                      fontSize: 12,
                                      fontWeight: 950,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Acréscimo
                                  </button>
                                </div>

                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "76px minmax(0, 1fr)",
                                    gap: 7,
                                    alignItems: "center",
                                    marginTop: -46,
                                  }}
                                >
                                  <select
                                    value={
                                      formFinalizacao.tipoAjusteFechamento ===
                                      "acrescimo"
                                        ? formFinalizacao.tipoAcrescimoAtendimento
                                        : formFinalizacao.tipoDescontoAtendimento
                                    }
                                    onChange={(e) => {
                                      if (
                                        formFinalizacao.tipoAjusteFechamento ===
                                        "acrescimo"
                                      ) {
                                        setFormFinalizacao({
                                          ...formFinalizacao,
                                          tipoAcrescimoAtendimento:
                                            e.target.value,
                                        });
                                        return;
                                      }

                                      setFormFinalizacao({
                                        ...formFinalizacao,
                                        tipoDescontoAtendimento: e.target.value,
                                      });
                                    }}
                                    style={{
                                      ...inputData,
                                      minHeight: 34,
                                      height: 34,
                                      borderRadius: 11,
                                      padding: "0 9px",
                                      fontSize: 12,
                                      fontWeight: 950,
                                    }}
                                  >
                                    <option value="valor">R$</option>
                                    <option value="percentual">%</option>
                                  </select>

                                  <input
                                    type="number"
                                    placeholder={
                                      formFinalizacao.tipoAjusteFechamento ===
                                      "acrescimo"
                                        ? "Valor do acréscimo"
                                        : "Valor do desconto"
                                    }
                                    value={
                                      formFinalizacao.tipoAjusteFechamento ===
                                      "acrescimo"
                                        ? formFinalizacao.valorAcrescimoAtendimento
                                        : formFinalizacao.valorDescontoAtendimento
                                    }
                                    onChange={(e) => {
                                      if (
                                        formFinalizacao.tipoAjusteFechamento ===
                                        "acrescimo"
                                      ) {
                                        setFormFinalizacao({
                                          ...formFinalizacao,
                                          valorAcrescimoAtendimento:
                                            e.target.value,
                                        });
                                        return;
                                      }

                                      setFormFinalizacao({
                                        ...formFinalizacao,
                                        valorDescontoAtendimento:
                                          e.target.value,
                                      });
                                    }}
                                    style={{
                                      ...inputData,
                                      minHeight: 34,
                                      height: 34,
                                      borderRadius: 11,
                                      padding: "0 10px",
                                      fontSize: 12,
                                    }}
                                  />
                                </div>

                                <div
                                  style={{
                                    display: "grid",
                                    gap: 4,
                                    padding: "8px 10px",
                                    borderRadius: 12,
                                    background: "rgba(2,6,23,0.42)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      gap: 10,
                                      fontSize: 12,
                                      fontWeight: 950,
                                    }}
                                  >
                                    <span style={{ color: "#cbd5e1" }}>
                                      {formFinalizacao.tipoAjusteFechamento ===
                                      "acrescimo"
                                        ? "Acréscimo aplicado"
                                        : "Desconto aplicado"}
                                    </span>
                                    <strong
                                      style={{
                                        color:
                                          formFinalizacao.tipoAjusteFechamento ===
                                          "acrescimo"
                                            ? "#fb923c"
                                            : "#22c55e",
                                      }}
                                    >
                                      {dinheiro(
                                        formFinalizacao.tipoAjusteFechamento ===
                                          "acrescimo"
                                          ? valorAcrescimoFechamento()
                                          : valorDescontoFechamento(),
                                      )}
                                    </strong>
                                  </div>

                                  {agendamentoSelecionado && (
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 10,
                                        fontSize: 12,
                                        fontWeight: 950,
                                      }}
                                    >
                                      <span style={{ color: "#cbd5e1" }}>
                                        Saldo após ajuste
                                      </span>
                                      <strong style={{ color: "#f97316" }}>
                                        {dinheiro(
                                          pendenteAjustadoFechamento(
                                            agendamentoSelecionado,
                                          ),
                                        )}
                                      </strong>
                                    </div>
                                  )}
                                </div>

                                <textarea
                                  value={
                                    formFinalizacao.observacaoAjusteAtendimento ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setFormFinalizacao({
                                      ...formFinalizacao,
                                      observacaoAjusteAtendimento:
                                        e.target.value,
                                    })
                                  }
                                  placeholder="Observação do ajuste. Ex: desconto autorizado."
                                  style={{
                                    ...textareaFechamento,
                                    minHeight: 42,
                                    height: 42,
                                    marginBottom: 0,
                                    padding: 9,
                                    borderRadius: 11,
                                    fontSize: 12,
                                  }}
                                />
                              </div>
                            )}

                          {formFinalizacao.habilitarFechamento && (
                            <>
                              <div style={subBlocoOperacionalTitulo}>
                                <span style={subBlocoNumeroCinza}>4</span>
                                <div>
                                  <strong>Pagamento recebido</strong>
                                  <small>
                                    {" "}
                                    Informe modalidade e valor lado a lado.
                                  </small>
                                </div>
                              </div>

                              {(() => {
                                const financeiro = resumoFinanceiroAtendimento(
                                  agendamentoSelecionado,
                                  resumoServicosAdicionais,
                                );
                                const desconto =
                                  formFinalizacao.habilitarAjusteValor
                                    ? valorDescontoFechamento()
                                    : 0;
                                const acrescimo =
                                  formFinalizacao.habilitarAjusteValor
                                    ? valorAcrescimoFechamento()
                                    : 0;
                                const creditoDisponivel = valorNumerico(
                                  resumoFinanceiroCliente.credito,
                                );
                                const creditoInformado = valorNumerico(
                                  formFinalizacao.valorCreditoUtilizadoCliente,
                                );
                                const saldoAjustado = Math.max(
                                  financeiro.pendente - desconto + acrescimo,
                                  0,
                                );
                                const creditoAbatido =
                                  formFinalizacao.usarCreditoCliente
                                    ? Math.min(
                                        creditoInformado > 0
                                          ? creditoInformado
                                          : creditoDisponivel,
                                        creditoDisponivel,
                                        saldoAjustado,
                                      )
                                    : 0;
                                const debitoCobrado =
                                  formFinalizacao.abaterDebitoCliente
                                    ? Math.min(
                                        valorNumerico(
                                          formFinalizacao.valorAbatimentoDebitoCliente,
                                        ),
                                        valorNumerico(
                                          resumoFinanceiroCliente.debito,
                                        ),
                                      )
                                    : 0;
                                const saldoAPagarAtualizado =
                                  Math.max(saldoAjustado - creditoAbatido, 0) +
                                  debitoCobrado;

                                return (
                                  <div style={pagamentoCompactoCardFechamento}>
                                    <div style={saldoAPagarFechamentoBox}>
                                      <span>Saldo a pagar atualizado</span>
                                      <strong>
                                        {dinheiro(saldoAPagarAtualizado)}
                                      </strong>
                                    </div>

                                    <div
                                      style={pagamentoLinhasCompactasFechamento}
                                    >
                                      {formFinalizacao.pagamentos.map(
                                        (pagamento: any, index: number) => {
                                          const podeRemoverPagamento =
                                            index > 0;

                                          return (
                                            <div
                                              key={`pagamento-fechamento-${index}`}
                                              style={
                                                pagamentoLinhaCompactaFechamento
                                              }
                                            >
                                              <select
                                                value={pagamento.forma}
                                                onChange={(e) => {
                                                  const lista =
                                                    formFinalizacao.pagamentos.map(
                                                      (item: any, i: number) =>
                                                        i === index
                                                          ? {
                                                              ...item,
                                                              forma:
                                                                e.target.value,
                                                            }
                                                          : item,
                                                    );
                                                  setFormFinalizacao({
                                                    ...formFinalizacao,
                                                    pagamentos: lista,
                                                  });
                                                }}
                                                style={
                                                  campoPagamentoModalidadeCompacto
                                                }
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
                                                value={pagamento.valor || ""}
                                                onChange={(e) => {
                                                  const lista =
                                                    formFinalizacao.pagamentos.map(
                                                      (item: any, i: number) =>
                                                        i === index
                                                          ? {
                                                              ...item,
                                                              valor:
                                                                e.target.value,
                                                            }
                                                          : item,
                                                    );
                                                  setFormFinalizacao({
                                                    ...formFinalizacao,
                                                    pagamentos: lista,
                                                  });
                                                }}
                                                style={
                                                  campoPagamentoValorCompacto
                                                }
                                              />

                                              {podeRemoverPagamento ? (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const lista =
                                                      formFinalizacao.pagamentos.filter(
                                                        (_: any, i: number) =>
                                                          i !== index,
                                                      );
                                                    setFormFinalizacao({
                                                      ...formFinalizacao,
                                                      pagamentos: lista,
                                                    });
                                                  }}
                                                  style={
                                                    botaoRemoverPagamentoCompacto
                                                  }
                                                  aria-label="Remover modalidade de pagamento"
                                                >
                                                  ×
                                                </button>
                                              ) : (
                                                <span
                                                  aria-hidden="true"
                                                  style={
                                                    espacoRemoverPagamentoCompacto
                                                  }
                                                />
                                              )}
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const totalJaInformado =
                                          formFinalizacao.pagamentos.reduce(
                                            (total: number, item: any) =>
                                              total + valorNumerico(item.valor),
                                            0,
                                          );
                                        const valorRestante = Math.max(
                                          saldoAPagarAtualizado -
                                            totalJaInformado,
                                          0,
                                        );

                                        setFormFinalizacao({
                                          ...formFinalizacao,
                                          pagamentos: [
                                            ...formFinalizacao.pagamentos,
                                            {
                                              forma: "pix",
                                              valor:
                                                valorRestante > 0
                                                  ? String(
                                                      valorRestante.toFixed(2),
                                                    )
                                                  : "",
                                            },
                                          ],
                                        });
                                      }}
                                      style={botaoAdicionarPagamentoCompacto}
                                    >
                                      + Adicionar modalidade
                                    </button>
                                  </div>
                                );
                              })()}

                              <label style={labelCampo}>
                                Observação do fechamento
                              </label>
                              <textarea
                                value={formFinalizacao.observacao || ""}
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
                                  ? "Finalizando..."
                                  : "Finalizar atendimento"}
                              </button>
                            </>
                          )}
                        </div>

                        <div
                          className="dashboard-servicos-box-mobile"
                          style={servicosAdicionaisBox}
                        >
                          {(() => {
                            const financeiro = resumoFinanceiroAtendimento(
                              agendamentoSelecionado,
                              resumoServicosAdicionais,
                            );

                            return (
                              <>
                                <div style={servicosAdicionaisHeader}>
                                  <div>
                                    <span style={etapaKickerAzul}>
                                      ETAPA 2 • SERVIÇOS E VALORES
                                    </span>
                                    <strong style={tituloSecaoOperacional}>
                                      Financeiro e serviços do atendimento
                                    </strong>
                                    <p style={descricaoSecaoOperacional}>
                                      Consulte o resumo financeiro, visualize o
                                      serviço principal e adicione serviços
                                      extras quando necessário.
                                    </p>
                                  </div>

                                  <span
                                    style={{
                                      ...badgeStatusFinanceiro,
                                      color: corStatusFinanceiro(
                                        financeiro.status,
                                      ),
                                      borderColor:
                                        financeiro.status === "pago"
                                          ? "#bbf7d0"
                                          : financeiro.status === "parcial"
                                            ? "#ddd6fe"
                                            : "#fed7aa",
                                      background:
                                        financeiro.status === "pago"
                                          ? "#ecfdf5"
                                          : financeiro.status === "parcial"
                                            ? "#f5f3ff"
                                            : "#fff7ed",
                                    }}
                                  >
                                    {textoStatusFinanceiro(financeiro.status)}
                                  </span>
                                </div>

                                <div style={financeiroAtendimentoBox}>
                                  <ResumoFinanceiroItem
                                    label="Total do atendimento"
                                    valor={dinheiro(financeiro.total)}
                                    cor="rgba(255,255,255,0.92)"
                                  />
                                </div>

                                {promocaoFoiAplicadaDashboard(
                                  agendamentoSelecionado,
                                ) && (
                                  <div
                                    style={{
                                      marginTop: 16,
                                      padding: 18,
                                      borderRadius: 22,
                                      background:
                                        "linear-gradient(135deg, rgba(91,33,182,0.18), rgba(168,85,247,0.08))",
                                      border: "1px solid rgba(168,85,247,0.26)",
                                      display: "grid",
                                      gap: 14,
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        color: "#6d28d9",
                                        fontSize: 15,
                                        fontWeight: 950,
                                      }}
                                    >
                                      🎁 Promoção aplicada no atendimento
                                    </div>

                                    <div>
                                      <strong
                                        style={{
                                          display: "block",
                                          color: "#0f172a",
                                          fontSize: 17,
                                          fontWeight: 950,
                                        }}
                                      >
                                        {agendamentoSelecionado?.promocaoTitulo ||
                                          "Promoção aplicada"}
                                      </strong>

                                      {agendamentoSelecionado?.promocaoDescricao && (
                                        <span
                                          style={{
                                            display: "block",
                                            marginTop: 6,
                                            color: "#475569",
                                            fontSize: 13,
                                            lineHeight: 1.5,
                                            fontWeight: 700,
                                          }}
                                        >
                                          {
                                            agendamentoSelecionado.promocaoDescricao
                                          }
                                        </span>
                                      )}
                                    </div>

                                    <div
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                          "repeat(auto-fit, minmax(120px, 1fr))",
                                        gap: 10,
                                      }}
                                    >
                                      <ResumoFinanceiroItem
                                        label="Tipo"
                                        valor={formatarTipoPromocaoDashboard(
                                          agendamentoSelecionado?.promocaoTipo,
                                        )}
                                        cor="#6d28d9"
                                      />

                                      <ResumoFinanceiroItem
                                        label="Desconto"
                                        valor={
                                          formatarDescontoDashboard(
                                            agendamentoSelecionado,
                                          ) || "Não informado"
                                        }
                                        cor="#6d28d9"
                                      />

                                      <ResumoFinanceiroItem
                                        label="Economia"
                                        valor={dinheiro(
                                          valorNumerico(
                                            agendamentoSelecionado?.valorEconomizado,
                                          ),
                                        )}
                                        cor="#15803d"
                                      />
                                    </div>

                                    {agendamentoSelecionado?.promocaoUsoUnicoCpf && (
                                      <div
                                        style={{
                                          padding: "10px 14px",
                                          borderRadius: 14,
                                          background: "rgba(16,185,129,0.10)",
                                          border:
                                            "1px solid rgba(16,185,129,0.22)",
                                          color: "#047857",
                                          fontSize: 13,
                                          fontWeight: 900,
                                        }}
                                      >
                                        🔒 Promoção válida apenas 1 vez por CPF.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            );
                          })()}

                          <div style={servicoPrincipalBox}>
                            <span style={labelModal}>
                              Serviço principal já contratado
                            </span>
                            <strong>
                              {nomeServico(agendamentoSelecionado)}
                            </strong>
                            <span
                              style={{
                                color: "#64748b",
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              Valor principal:{" "}
                              {dinheiro(
                                valorServicoPrincipal(agendamentoSelecionado),
                              )}
                            </span>
                            <span
                              style={{
                                color: pagamentoConfirmado(
                                  agendamentoSelecionado.statusPagamento,
                                )
                                  ? "#15803d"
                                  : "#b45309",
                                fontSize: 12,
                                fontWeight: 900,
                              }}
                            >
                              {pagamentoConfirmado(
                                agendamentoSelecionado.statusPagamento,
                              )
                                ? "principal pago"
                                : "principal pendente"}
                            </span>
                          </div>

                          {servicosAdicionais.length > 0 && (
                            <div style={listaServicosAdicionais}>
                              {servicosAdicionais.map((item: any) => (
                                <div key={item.id} style={itemServicoAdicional}>
                                  <div>
                                    <strong>
                                      {item.nomeServico ||
                                        item.servico?.nome ||
                                        "Serviço adicional"}
                                    </strong>
                                    <p
                                      style={{
                                        margin: "4px 0 0",
                                        color: "#64748b",
                                        fontSize: 12,
                                      }}
                                    >
                                      {item.profissional?.nome
                                        ? `Profissional: ${item.profissional.nome}`
                                        : "Profissional não informado"}
                                    </p>
                                    {item.observacao && (
                                      <p
                                        style={{
                                          margin: "4px 0 0",
                                          color: "#64748b",
                                          fontSize: 12,
                                        }}
                                      >
                                        Obs: {item.observacao}
                                      </p>
                                    )}
                                  </div>

                                  <div style={{ textAlign: "right" }}>
                                    <strong>
                                      {dinheiro(Number(item.valor || 0))}
                                    </strong>
                                    <p
                                      style={{
                                        margin: "4px 0 0",
                                        color:
                                          item.statusPagamento === "pago"
                                            ? "#15803d"
                                            : "#b45309",
                                        fontSize: 12,
                                        fontWeight: 900,
                                      }}
                                    >
                                      {item.statusPagamento === "pago"
                                        ? "pago"
                                        : "pendente"}
                                    </p>
                                  </div>
                                </div>
                              ))}

                              <div style={resumoServicosAdicionaisBox}>
                                <ResumoItem
                                  label="Total de adicionais"
                                  valor={dinheiro(
                                    resumoServicosAdicionais.total,
                                  )}
                                />
                              </div>
                            </div>
                          )}

                          <div style={formServicoAdicionalGrid}>
                            <div>
                              <label style={labelCampo}>
                                Serviço adicional
                              </label>
                              <select
                                value={formServicoAdicional.servicoId}
                                onChange={(e) =>
                                  alterarServicoAdicionalSelecionado(
                                    e.target.value,
                                  )
                                }
                                style={inputData}
                              >
                                <option value="">Selecione o serviço</option>
                                {servicosAtivosParaAdicional().map(
                                  (servico: any) => (
                                    <option key={servico.id} value={servico.id}>
                                      {servico.nome}
                                    </option>
                                  ),
                                )}
                              </select>
                            </div>

                            <div>
                              <label style={labelCampo}>Profissional</label>
                              <select
                                value={formServicoAdicional.profissionalId}
                                onChange={(e) =>
                                  alterarProfissionalAdicionalSelecionado(
                                    e.target.value,
                                  )
                                }
                                style={inputData}
                              >
                                <option value="">Não informar</option>
                                {profissionaisAtivosParaAdicional().map(
                                  (profissional: any) => (
                                    <option
                                      key={profissional.id}
                                      value={profissional.id}
                                    >
                                      {profissional.nome}
                                    </option>
                                  ),
                                )}
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
                                  <strong style={{ color: "#15803d" }}>
                                    {dinheiro(preview.pago)}
                                  </strong>
                                  <span>Novo total pendente</span>
                                  <strong
                                    style={{
                                      color:
                                        preview.pendente > 0
                                          ? "#b45309"
                                          : "#15803d",
                                    }}
                                  >
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
                            {salvandoServicoAdicional
                              ? "Adicionando serviço..."
                              : "+ Adicionar serviço ao atendimento"}
                          </button>
                        </div>

                        <div
                          className="dashboard-reagendamento-box-mobile"
                          style={reagendamentoOpcionalBox}
                        >
                          <div style={{ marginBottom: 10 }}>
                            <span style={etapaKickerRoxo}>
                              ETAPA 3 • REAGENDAMENTO
                            </span>
                            <strong style={tituloSecaoOperacional}>
                              Reagendar atendimento (opcional)
                            </strong>
                            <p style={descricaoSecaoOperacional}>
                              Use esta área somente se precisar mudar a data ou
                              horário. Para finalizar ou adicionar serviços, não
                              é necessário reagendar.
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
                              setHorarioReagendamento("");
                            }}
                            style={inputData}
                          />

                          <button
                            onClick={buscarHorariosReagendamento}
                            disabled={
                              buscandoHorarios || !novaDataReagendamento
                            }
                            style={
                              !novaDataReagendamento
                                ? {
                                    ...botaoBuscarHorarios,
                                    opacity: 0.55,
                                    cursor: "not-allowed",
                                  }
                                : botaoBuscarHorarios
                            }
                          >
                            {buscandoHorarios
                              ? "Buscando horários..."
                              : "Buscar horários disponíveis"}
                          </button>

                          <div style={{ marginTop: 12 }}>
                            {horariosReagendamento.length === 0 ? (
                              <div style={emptyBoxPequeno}>
                                A data e o horário atuais serão mantidos se você
                                não reagendar.
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
                                          ? "linear-gradient(135deg, #7c3aed, #db2777)"
                                          : "#fff",
                                      color:
                                        horarioReagendamento === h
                                          ? "#fff"
                                          : "#0f172a",
                                      border:
                                        horarioReagendamento === h
                                          ? "1px solid transparent"
                                          : "1px solid #cbd5e1",
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
                                  ? {
                                      ...botaoConfirmarReagendamento,
                                      opacity: 0.55,
                                      cursor: "not-allowed",
                                    }
                                  : botaoConfirmarReagendamento
                              }
                            >
                              {reagendando
                                ? "Reagendando..."
                                : "Confirmar reagendamento"}
                            </button>
                          )}
                        </div>

                        <button
                          className="dashboard-cancelar-atendimento-mobile"
                          onClick={cancelarAgendamento}
                          disabled={cancelando}
                          style={botaoCancelarAgendamento}
                        >
                          {cancelando
                            ? "Cancelando..."
                            : "Cancelar atendimento"}
                        </button>
                      </>
                    ) : (
                      <div style={emptyBoxPequeno}>
                        Este atendimento já está cancelado e permanece
                        registrado para histórico.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PremiumLayout>
  );
}

function Card({ titulo, valor }: any) {
  return (
    <div style={card}>
      <div style={cardGlow} />
      <div style={cardTopLine}>
        <span style={cardLabel}>{titulo}</span>
        <span style={cardIcon}>✦</span>
      </div>
      <strong style={cardValue}>{valor}</strong>
    </div>
  );
}

function MobileMetric({ label, value, tone }: any) {
  return (
    <div style={{ ...mobileMetricCard, borderColor: `${tone}36` }}>
      <span style={{ ...mobileMetricLabel, color: tone }}>{label}</span>
      <strong style={mobileMetricValue}>{value}</strong>
    </div>
  );
}

function MobileInsight({ icon, label, value }: any) {
  return (
    <div style={mobileInsightRow}>
      <span style={mobileInsightIcon}>{icon}</span>
      <strong>{label}</strong>
      <em>{value}</em>
    </div>
  );
}

function MobileAttentionItem({ icon, title, description, tone }: any) {
  return (
    <button type="button" style={mobileAttentionItem} onClick={() => {}}>
      <span
        style={{ ...mobileAttentionIcon, background: `${tone}22`, color: tone }}
      >
        {icon}
      </span>

      <span style={mobileAttentionText}>
        <strong>{title}</strong>
        <small style={{ color: tone }}>{description}</small>
      </span>

      <span style={mobileAttentionArrow}>›</span>
    </button>
  );
}

function CardFinanceiro({ titulo, valor, descricao, cor }: any) {
  return (
    <div
      style={{
        ...cardFinanceiroPremium,
        borderColor: `${cor}55`,
        boxShadow: `0 22px 55px ${cor}18, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <div
        style={{
          ...financeiroOrb,
          background: cor,
          boxShadow: `0 0 28px ${cor}88`,
        }}
      />
      <div style={financeiroTitulo}>{titulo}</div>
      <div style={financeiroValor}>{valor}</div>
      <div style={financeiroDescricao}>{descricao}</div>
    </div>
  );
}

function ResumoItem({ label, valor }: any) {
  return (
    <div style={resumoItem}>
      <span>{label}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function ResumoFinanceiroItem({ label, valor, cor }: any) {
  return (
    <div style={resumoFinanceiroItem}>
      <span>{label}</span>
      <strong
        style={{
          color: cor === "#0f172a" ? "#f8fafc" : cor,
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "flex-end",
          minWidth: 86,
          textAlign: "right",
        }}
      >
        {valor}
      </strong>
    </div>
  );
}

function ToggleLinha({ titulo, descricao, ativo, disabled, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...toggleLinhaFechamento,
        opacity: disabled ? 0.48 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span style={{ display: "grid", gap: 2, minWidth: 0, textAlign: "left" }}>
        <strong
          style={{
            color: "#f8fafc",
            fontSize: 12.5,
            fontWeight: 950,
            lineHeight: 1.1,
          }}
        >
          {titulo}
        </strong>
        {descricao && (
          <small
            style={{
              color: "#94a3b8",
              fontSize: 10.5,
              fontWeight: 800,
              lineHeight: 1.18,
            }}
          >
            {descricao}
          </small>
        )}
      </span>

      <span
        style={{
          ...toggleSwitchFechamento,
          background: ativo
            ? "linear-gradient(135deg, #22c55e, #4ade80)"
            : "rgba(148,163,184,0.16)",
          borderColor: ativo
            ? "rgba(74,222,128,0.52)"
            : "rgba(148,163,184,0.36)",
          boxShadow: ativo ? "0 10px 22px rgba(34,197,94,0.22)" : "none",
        }}
      >
        <span
          style={{
            ...toggleKnobFechamento,
            transform: ativo ? "translateX(20px)" : "translateX(0)",
          }}
        />
      </span>
    </button>
  );
}

function ToggleSimNaoFechamento({
  titulo,
  descricao,
  ativo,
  onClick,
  variante = "verde",
}: any) {
  const ativoVerde = variante === "verde";
  const corAtiva = ativoVerde ? "#22c55e" : "#f97316";
  const corAtivaClara = ativoVerde ? "#4ade80" : "#fb923c";
  const textoAtivo = ativoVerde ? "#bbf7d0" : "#fed7aa";

  return (
    <button type="button" onClick={onClick} style={toggleSimNaoFechamentoLinha}>
      <span style={{ display: "grid", gap: 2, minWidth: 0, textAlign: "left" }}>
        <strong
          style={{
            color: "#f8fafc",
            fontSize: 12,
            fontWeight: 950,
            lineHeight: 1.08,
          }}
        >
          {titulo}
        </strong>
        {descricao && (
          <small
            style={{
              color: "#cbd5e1",
              fontSize: 10.2,
              fontWeight: 800,
              lineHeight: 1.16,
            }}
          >
            {descricao}
          </small>
        )}
      </span>

      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            minWidth: 28,
            textAlign: "right",
            color: ativo ? textoAtivo : "#cbd5e1",
            fontSize: 10.5,
            fontWeight: 950,
            textTransform: "uppercase",
          }}
        >
          {ativo ? "Sim" : "Não"}
        </span>
        <span
          style={{
            ...toggleSwitchCompactoFechamento,
            background: ativo
              ? `linear-gradient(135deg, ${corAtiva}, ${corAtivaClara})`
              : "rgba(148,163,184,0.16)",
            borderColor: ativo
              ? `${corAtivaClara}88`
              : "rgba(148,163,184,0.36)",
            boxShadow: ativo ? `0 8px 18px ${corAtiva}33` : "none",
          }}
        >
          <span
            style={{
              ...toggleKnobCompactoFechamento,
              transform: ativo ? "translateX(17px)" : "translateX(0)",
            }}
          />
        </span>
      </span>
    </button>
  );
}

const glassPanelBase: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(15,23,42,0.78), rgba(2,6,23,0.72))",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow:
    "0 28px 80px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05)",
  backdropFilter: "blur(22px)",
};

const dashboardShellPremium: React.CSSProperties = {
  maxWidth: 1540,
  margin: "0 auto",
  color: "#e5e7eb",
  paddingBottom: 56,
};

const dashboardHeroPremium: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 24,
  padding: 20,
  marginBottom: 14,
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.86), rgba(2,6,23,0.82) 48%, color-mix(in srgb, var(--marcae-primary) 32%, rgba(15,23,42,0.86)))",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow:
    "0 22px 60px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.05)",
  backdropFilter: "blur(24px)",
};

const heroGlowOne: React.CSSProperties = {
  position: "absolute",
  width: 320,
  height: 320,
  right: -135,
  top: -155,
  background:
    "radial-gradient(circle, color-mix(in srgb, var(--marcae-primary) 58%, transparent), transparent 66%)",
  filter: "blur(18px)",
  opacity: 0.62,
};

const heroGlowTwo: React.CSSProperties = {
  position: "absolute",
  width: 220,
  height: 220,
  left: "40%",
  bottom: -165,
  background: "radial-gradient(circle, rgba(34,197,94,0.24), transparent 66%)",
  filter: "blur(18px)",
};

const heroContentPremium: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  flexWrap: "wrap",
};

const heroIdentityPremium: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  minWidth: 180,
};

const heroTextCompactFix: React.CSSProperties = {
  width: "100%",
  height: "auto",
  minWidth: 0,
  minHeight: 0,
  display: "block",
  overflow: "visible",
  borderRadius: 0,
  flex: 1,
};

const logoEmpresaHeroPremium: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 24,
  overflow: "hidden",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))",
  border: "1px solid rgba(255,255,255,0.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontWeight: 950,
  fontSize: 30,
  boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
};

const heroEyebrowPremium: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  padding: "7px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  color: "#dbeafe",
  border: "1px solid rgba(255,255,255,0.11)",
  fontSize: 12,
  fontWeight: 850,
  marginBottom: 10,
};

const heroTitlePremium: React.CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: 42,
  lineHeight: 1,
  letterSpacing: "-0.07em",
  fontWeight: 950,
};

const heroSubtitlePremium: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#b6c4d8",
  fontSize: 15,
  lineHeight: 1.55,
};

const heroTitleCompact: React.CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: 30,
  lineHeight: 1,
  letterSpacing: "-0.05em",
  fontWeight: 950,
};

const heroCompactInfo: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginTop: 8,
  color: "#cbd5e1",
  fontSize: 12,
  fontWeight: 750,
  flexWrap: "wrap",
};

const heroBadgesPremium: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 9,
  marginTop: 16,
};

const heroBadge: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  color: "#f8fafc",
  border: "1px solid rgba(255,255,255,0.10)",
  fontSize: 12,
  fontWeight: 850,
};

const heroActionsPremium: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const heroButtonGhostPremium: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.07)",
  color: "#fff",
  borderRadius: 14,
  padding: "11px 14px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
};

const heroButtonPrimaryPremium: React.CSSProperties = {
  border: "none",
  background:
    "linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary))",
  color: "#fff",
  borderRadius: 14,
  padding: "11px 16px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow:
    "0 12px 28px color-mix(in srgb, var(--marcae-primary) 28%, transparent)",
};

const heroButtonDangerPremium: React.CSSProperties = {
  border: "1px solid rgba(248,113,113,0.24)",
  background: "rgba(127,29,29,0.18)",
  color: "#fecaca",
  borderRadius: 14,
  padding: "11px 13px",
  fontWeight: 900,
  cursor: "pointer",
};

const filtroEnterpriseBox: React.CSSProperties = {
  ...glassPanelBase,
  borderRadius: 28,
  padding: 22,
  marginBottom: 20,
};

const filtroEnterpriseGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
  marginTop: 14,
  alignItems: "end",
};

const filtroCompactHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const filtroCompactActions: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
  marginTop: 14,
};

const labelCampoPremium: React.CSSProperties = {
  display: "block",
  color: "#9fb0c7",
  fontSize: 11,
  fontWeight: 900,
  marginBottom: 8,
  textTransform: "uppercase",
  letterSpacing: ".09em",
};

const inputEnterprisePremium: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 15,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(2,6,23,0.68)",
  color: "#f8fafc",
  padding: "13px 14px",
  outline: "none",
  fontWeight: 850,
  colorScheme: "dark",
};

const botaoFiltroEnterprisePrimario: React.CSSProperties = {
  border: "none",
  background:
    "linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary))",
  color: "#fff",
  borderRadius: 15,
  padding: "14px 16px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow:
    "0 16px 34px color-mix(in srgb, var(--marcae-primary) 30%, transparent)",
};

const botaoFiltroEnterprise: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.07)",
  color: "#e2e8f0",
  borderRadius: 15,
  padding: "14px 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const periodoEnterpriseTexto: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#9fb0c7",
  fontSize: 12,
  fontWeight: 800,
};

const sectionKickerPremium: React.CSSProperties = {
  display: "inline-flex",
  color: "color-mix(in srgb, var(--marcae-primary) 78%, #ffffff)",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  marginBottom: 8,
};

const sectionTitlePremium: React.CSSProperties = {
  margin: 0,
  color: "#f8fafc",
  fontSize: 22,
  letterSpacing: "-0.055em",
  fontWeight: 950,
};

const sectionDescriptionPremium: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#9fb0c7",
  lineHeight: 1.6,
  fontSize: 14,
};

const kpiGridEnterprise: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
  marginBottom: 10,
};

const analyticsHeroGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.7fr) minmax(320px, .8fr)",
  gap: 20,
  marginBottom: 20,
};

const analyticsMainCard: React.CSSProperties = {
  ...glassPanelBase,
  borderRadius: 32,
  padding: 24,
};

const analyticsHeaderPremium: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 18,
};

const financeGridEnterprise: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: 14,
};

const previsaoGridEnterprise: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginTop: 14,
};

const previsaoCardEnterprise: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
  borderRadius: 22,
  padding: 16,
  display: "grid",
  gap: 7,
  color: "#dbeafe",
};

const operacaoLiveCard: React.CSSProperties = {
  ...glassPanelBase,
  borderRadius: 32,
  padding: 24,
  background:
    "linear-gradient(160deg, rgba(2,6,23,0.88), rgba(15,23,42,0.82), color-mix(in srgb, var(--marcae-primary) 16%, rgba(15,23,42,0.82)))",
};

const proximoClientePremium: React.CSSProperties = {
  marginTop: 16,
  padding: 18,
  borderRadius: 24,
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--marcae-primary) 23%, transparent), rgba(255,255,255,0.06))",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#f8fafc",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
};

const operacaoMiniGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginTop: 16,
};

const botaoOperacaoPremium: React.CSSProperties = {
  width: "100%",
  marginTop: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background:
    "linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary))",
  color: "#fff",
  borderRadius: 17,
  padding: 14,
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 18px 44px rgba(124,58,237,0.22)",
};

const gridOperacionalEnterprise: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.45fr) minmax(300px, .75fr)",
  gap: 20,
  marginBottom: 20,
};

const panelEnterpriseLarge: React.CSSProperties = {
  ...glassPanelBase,
  borderRadius: 32,
  padding: 24,
};

const panelEnterprise: React.CSSProperties = {
  ...glassPanelBase,
  borderRadius: 28,
  padding: 22,
};

const sideStackEnterprise: React.CSSProperties = {
  display: "grid",
  gap: 20,
};

const botaoMiniEnterprise: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.07)",
  color: "#f8fafc",
  borderRadius: 15,
  padding: "11px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

const agendaListaPremium: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const agendaRowPremium: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "82px minmax(0, 1fr) 150px auto",
  gap: 14,
  alignItems: "center",
  padding: 14,
  borderRadius: 22,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

const agendaHoraPremium: React.CSSProperties = {
  color: "#fff",
  fontSize: 22,
  fontWeight: 950,
};

const agendaClientePremium: React.CSSProperties = {
  display: "block",
  color: "#f8fafc",
  fontSize: 15,
};

const agendaMetaPremium: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#9fb0c7",
  fontSize: 13,
  fontWeight: 750,
};

const badgePromocaoPremium: React.CSSProperties = {
  display: "inline-flex",
  marginTop: 8,
  padding: "5px 9px",
  borderRadius: 999,
  color: "#fff7ed",
  background: "rgba(249,115,22,0.22)",
  border: "1px solid rgba(249,115,22,0.28)",
  fontSize: 12,
  fontWeight: 900,
};

const agendaFinanceiroPremium: React.CSSProperties = {
  display: "grid",
  gap: 4,
  textAlign: "right",
  color: "#f8fafc",
  fontSize: 13,
};

const agendaActionsPremium: React.CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
  flexWrap: "wrap",
};

const botaoAgendaConfirmar: React.CSSProperties = {
  border: "none",
  background: "linear-gradient(135deg, #16a34a, #22c55e)",
  color: "#fff",
  borderRadius: 13,
  padding: "10px 12px",
  fontWeight: 900,
  cursor: "pointer",
};

const botaoAgendaFechar: React.CSSProperties = {
  border: "none",
  background:
    "linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary))",
  color: "#fff",
  borderRadius: 13,
  padding: "10px 12px",
  fontWeight: 900,
  cursor: "pointer",
};

const alertStackPremium: React.CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 16,
};

const smartAlertPremium: React.CSSProperties = {
  display: "grid",
  gap: 6,
  padding: 14,
  borderRadius: 20,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#cbd5e1",
};

const atalhosGridPremium: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginTop: 14,
};

const atalhoPremium: React.CSSProperties = {
  textDecoration: "none",
  color: "#f8fafc",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035))",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 13,
  fontWeight: 900,
  textAlign: "center",
};

const performanceGridEnterprise: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20,
  marginBottom: 20,
};

const rankingStackPremium: React.CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 16,
};

const rankingRowPremium: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 10,
  padding: 12,
  borderRadius: 17,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#f8fafc",
};

const miniInsightPremium: React.CSSProperties = {
  marginTop: 16,
  borderRadius: 18,
  padding: 14,
  background: "rgba(34,197,94,0.10)",
  border: "1px solid rgba(34,197,94,0.18)",
  color: "#bbf7d0",
  display: "grid",
  gap: 5,
};

const crmGridEnterprise: React.CSSProperties = {
  display: "grid",
  gap: 20,
  marginBottom: 20,
};

const crmColumnsPremium: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 18,
};

const subsectionTitlePremium: React.CSSProperties = {
  margin: "0 0 12px",
  color: "#f8fafc",
  fontSize: 17,
};

const crmListPremium: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const clienteCardPremium: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: 14,
  borderRadius: 20,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#f8fafc",
};

const promocaoCardPremium: React.CSSProperties = {
  display: "grid",
  gap: 8,
  padding: 14,
  borderRadius: 20,
  background: "rgba(249,115,22,0.10)",
  border: "1px solid rgba(249,115,22,0.18)",
  color: "#fed7aa",
};

const botaoWhatsAppPremium: React.CSSProperties = {
  border: "none",
  background: "linear-gradient(135deg, #16a34a, #22c55e)",
  color: "#fff",
  borderRadius: 13,
  padding: "9px 12px",
  fontWeight: 900,
  cursor: "pointer",
};

const chartPanelEnterprise: React.CSSProperties = {
  ...glassPanelBase,
  borderRadius: 32,
  padding: 24,
};

const emptyBoxPremium: React.CSSProperties = {
  border: "1px dashed rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.04)",
  borderRadius: 20,
  padding: 18,
  color: "#9fb0c7",
  fontWeight: 850,
  textAlign: "center",
};

const card: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.068), rgba(255,255,255,0.028))",
  padding: "10px 11px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  minHeight: 72,
  display: "grid",
  alignContent: "space-between",
};

const cardGlow: React.CSSProperties = {
  position: "absolute",
  right: -28,
  top: -32,
  width: 72,
  height: 72,
  borderRadius: "50%",
  background: "color-mix(in srgb, var(--marcae-primary) 16%, transparent)",
  filter: "blur(22px)",
};

const cardTopLine: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 6,
  marginBottom: 6,
};

const cardIcon: React.CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: 7,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.075)",
  color: "#dbeafe",
  fontSize: 9,
  flex: "0 0 auto",
};

const cardLabel: React.CSSProperties = {
  color: "#a8b6ca",
  fontSize: 11,
  fontWeight: 900,
  lineHeight: 1.1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const cardValue: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "block",
  fontSize: 28,
  lineHeight: 0.92,
  color: "#fff",
  fontWeight: 950,
  letterSpacing: "-0.055em",
};

const cardHint: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  color: "#7dd3fc",
  fontSize: 11,
  fontWeight: 800,
  marginTop: 6,
};

const cardFinanceiroPremium: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.035))",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 24,
  padding: 18,
  color: "#f8fafc",
};

const financeiroOrb: React.CSSProperties = {
  position: "absolute",
  right: -18,
  top: -18,
  width: 74,
  height: 74,
  borderRadius: "50%",
  opacity: 0.34,
};

const financeiroTitulo: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  fontSize: 12,
  color: "#9fb0c7",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: ".06em",
};

const financeiroValor: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  fontSize: 24,
  lineHeight: 1.15,
  fontWeight: 950,
  marginTop: 8,
  color: "#fff",
  letterSpacing: "-0.035em",
};

const financeiroDescricao: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  fontSize: 12,
  color: "#9fb0c7",
  marginTop: 8,
  lineHeight: 1.45,
};

const boxResumoBloqueado: React.CSSProperties = {
  marginTop: 14,
  background: "rgba(239,68,68,0.10)",
  border: "1px solid rgba(239,68,68,0.18)",
  color: "#fecaca",
  borderRadius: 20,
  padding: 18,
  fontWeight: 850,
};

const resumoItem: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  color: "#f8fafc",
};

const emptyBox: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px dashed rgba(255,255,255,0.16)",
  color: "#9fb0c7",
  borderRadius: 16,
  padding: 18,
  textAlign: "center",
};

const emptyBoxPequeno: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px dashed rgba(255,255,255,0.16)",
  color: "#9fb0c7",
  borderRadius: 14,
  padding: 12,
  textAlign: "center",
  fontSize: 13,
};

const rankingDashboardSectionPremium: React.CSSProperties = {
  marginTop: 18,
};

const rankingHeaderPremium: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 14,
  marginBottom: 16,
};

const rankingSubtitlePremium: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#94a3b8",
  fontSize: 13,
  fontWeight: 700,
};

const rankingVerTodosButtonPremium: React.CSSProperties = {
  border: "1px solid rgba(168,85,247,0.35)",
  borderRadius: 14,
  padding: "10px 14px",
  background: "rgba(168,85,247,0.14)",
  color: "#e9d5ff",
  fontWeight: 950,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const rankingTabsPremium: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 16,
};

const rankingTabButtonPremium: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 999,
  padding: "9px 13px",
  background: "rgba(255,255,255,0.05)",
  color: "#cbd5e1",
  fontWeight: 950,
  cursor: "pointer",
};

const rankingTabButtonAtivoPremium: React.CSSProperties = {
  background: "linear-gradient(135deg,#7c3aed,#a855f7)",
  color: "#fff",
  borderColor: "rgba(255,255,255,0.16)",
  boxShadow: "0 14px 28px rgba(124,58,237,0.22)",
};

const rankingFiltrosModalPremium: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: 10,
  marginBottom: 16,
};

const rankingFiltroButtonPremium: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  padding: "11px 12px",
  background: "rgba(255,255,255,0.06)",
  color: "#e2e8f0",
  fontWeight: 900,
  cursor: "pointer",
};

const rankingAplicarButtonPremium: React.CSSProperties = {
  border: "1px solid rgba(168,85,247,0.34)",
  borderRadius: 14,
  padding: "11px 12px",
  background: "linear-gradient(135deg,#7c3aed,#a855f7)",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};

const rankingDateInputPremium: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: "10px 12px",
  background: "rgba(2,6,23,0.72)",
  color: "#fff",
  fontWeight: 800,
  outline: "none",
  colorScheme: "dark",
};

const rankingListaCompletaPremium: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const rankingCardModalPremium: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 22,
  padding: 16,
  background:
    "linear-gradient(145deg, rgba(15,23,42,0.86), rgba(30,41,59,0.54))",
  boxShadow: "0 18px 42px rgba(0,0,0,0.22)",
};

const rankingCardTopoPremium: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 14,
};

const rankingPosicaoPremium: React.CSSProperties = {
  width: 46,
  height: 46,
  minWidth: 46,
  borderRadius: 16,
  display: "grid",
  placeItems: "center",
  background: "rgba(168,85,247,0.16)",
  border: "1px solid rgba(168,85,247,0.24)",
  color: "#f8fafc",
  fontWeight: 950,
};

const rankingNomePremium: React.CSSProperties = {
  display: "block",
  color: "#fff",
  fontSize: 17,
  fontWeight: 950,
};

const rankingPeriodoPremium: React.CSSProperties = {
  display: "block",
  marginTop: 4,
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 800,
};

const rankingMetricasGridPremium: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 10,
};

const rankingAbrirCadastroButtonPremium: React.CSSProperties = {
  marginTop: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: "11px 13px",
  background: "rgba(255,255,255,0.07)",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background:
    "radial-gradient(circle at top left, rgba(124,58,237,0.20), transparent 34%), rgba(2,6,23,0.82)",
  zIndex: 4000,
  display: "flex",
  pointerEvents: "auto",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  backdropFilter: "blur(22px)",
};

const modalBox: React.CSSProperties = {
  width: "100%",
  maxWidth: 1120,
  maxHeight: "90vh",
  overflowY: "auto",
  overscrollBehaviorY: "contain",
  WebkitOverflowScrolling: "touch",
  background: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#f8fafc",
  borderRadius: 30,
  padding: 24,
  boxShadow:
    "0 35px 100px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const modalHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 18,
};

const botaoFecharModal: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 22,
  fontWeight: 900,
};

const inputPesquisa: React.CSSProperties = {
  width: "100%",
  height: 50,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "0 14px",
  outline: "none",
  fontSize: 14,
  background: "rgba(2,6,23,0.72)",
  color: "#fff",
  marginBottom: 18,
};

const modalGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.25fr) minmax(320px, 0.75fr)",
  gap: 18,
  alignItems: "start",
};

const listaAgendamentos: React.CSSProperties = {
  display: "grid",
  gap: 10,
  alignContent: "start",
};

const itemAgendamentoModal: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  color: "#f8fafc",
  borderRadius: 20,
  padding: 16,
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  textAlign: "left",
  transition: "0.2s ease",
};

const painelAcaoModal: React.CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.032))",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 22,
  padding: 12,
  alignSelf: "start",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
  position: "sticky",
  top: 12,
  maxHeight: "calc(90vh - 56px)",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
};

const cardInfoModal: React.CSSProperties = {
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: 9,
  borderRadius: 13,
  marginBottom: 7,
  display: "flex",
  flexDirection: "column",
  gap: 3,
  color: "#f8fafc",
};

const labelModal: React.CSSProperties = {
  fontSize: 12,
  color: "#9fb0c7",
};

const cardInfoCanceladoModal: React.CSSProperties = {
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(248,113,113,0.24)",
  padding: 12,
  borderRadius: 15,
  marginBottom: 10,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  color: "#fecaca",
};

const labelCanceladoModal: React.CSSProperties = {
  fontSize: 12,
  color: "#fecaca",
};

const labelCampo: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 850,
  color: "#cbd5e1",
  marginBottom: 6,
};

const inputData: React.CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "0 10px",
  marginBottom: 0,
  background: "rgba(2,6,23,0.72)",
  color: "#fff",
  colorScheme: "dark",
};

const botaoBuscarHorarios: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 13,
  border: "none",
  background:
    "linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary))",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const gradeHorarios: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const botaoHorario: React.CSSProperties = {
  minWidth: 72,
  height: 38,
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 850,
};

const resumoFinanceiroLista: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  marginTop: 4,
  fontSize: 12,
  fontWeight: 900,
};

const resumoFinanceiroModalLista: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  textAlign: "right",
  fontSize: 12,
  fontWeight: 900,
  color: "#f8fafc",
  whiteSpace: "nowrap",
};

const financeiroAtendimentoBox: React.CSSProperties = {
  background: "rgba(2,6,23,0.38)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 15,
  padding: 9,
  display: "grid",
  gap: 5,
  marginBottom: 8,
};

const resumoFinanceiroItem: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  fontWeight: 900,
  color: "#f8fafc",
};

const badgeStatusFinanceiro: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 999,
  padding: "7px 10px",
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
  textTransform: "uppercase",
};

const etapaKickerAzul: React.CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  color: "#7dd3fc",
  background: "rgba(14,165,233,0.14)",
  border: "1px solid rgba(56,189,248,0.26)",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  marginBottom: 8,
};

const etapaKickerRoxo: React.CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  color: "#ddd6fe",
  background: "rgba(124,58,237,0.16)",
  border: "1px solid rgba(167,139,250,0.28)",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  marginBottom: 8,
};

const etapaKickerVerde: React.CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  color: "#bbf7d0",
  background: "rgba(34,197,94,0.15)",
  border: "1px solid rgba(74,222,128,0.28)",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  marginBottom: 8,
};

const tituloSecaoOperacional: React.CSSProperties = {
  display: "block",
  color: "#f8fafc",
  fontSize: 16,
  fontWeight: 950,
  lineHeight: 1.18,
};

const descricaoSecaoOperacional: React.CSSProperties = {
  margin: "3px 0 0",
  color: "#a9b8d0",
  fontSize: 11.5,
  lineHeight: 1.28,
  fontWeight: 650,
};

const cabecalhoFechamentoPremium: React.CSSProperties = {
  marginBottom: 14,
  paddingBottom: 12,
  borderBottom: "1px solid rgba(255,255,255,0.10)",
};

const tituloFechamentoPremium: React.CSSProperties = {
  margin: 0,
  color: "#f8fafc",
  fontSize: 16,
  fontWeight: 950,
  lineHeight: 1.12,
};

const subBlocoOperacionalTitulo: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 0 6px",
  marginTop: 6,
  color: "#f8fafc",
};

const subBlocoNumeroVerde: React.CSSProperties = {
  width: 23,
  height: 23,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(34,197,94,0.18)",
  border: "1px solid rgba(74,222,128,0.30)",
  color: "#bbf7d0",
  fontSize: 11,
  fontWeight: 950,
  flex: "0 0 auto",
};

const subBlocoNumeroLaranja: React.CSSProperties = {
  ...subBlocoNumeroVerde,
  background: "rgba(249,115,22,0.16)",
  border: "1px solid rgba(251,146,60,0.30)",
  color: "#fed7aa",
};

const subBlocoNumeroCinza: React.CSSProperties = {
  ...subBlocoNumeroVerde,
  background: "rgba(148,163,184,0.13)",
  border: "1px solid rgba(148,163,184,0.24)",
  color: "#e2e8f0",
};

const resumoClienteFinanceiroGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 6,
  marginBottom: 8,
  padding: 9,
  borderRadius: 14,
  background: "rgba(2,6,23,0.30)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const servicosAdicionaisBox: React.CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(14,165,233,0.13), rgba(255,255,255,0.045))",
  border: "1px solid rgba(56,189,248,0.26)",
  borderLeft: "5px solid #38bdf8",
  borderRadius: 22,
  padding: 16,
  marginBottom: 16,
  boxShadow: "0 18px 44px rgba(14,165,233,0.12), 0 16px 34px rgba(0,0,0,0.18)",
  color: "#f8fafc",
};

const servicosAdicionaisHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 10,
  marginBottom: 12,
};

const badgeTotalAtendimento: React.CSSProperties = {
  background: "rgba(124,58,237,0.14)",
  color: "#ddd6fe",
  border: "1px solid rgba(167,139,250,0.24)",
  borderRadius: 999,
  padding: "7px 10px",
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const servicoPrincipalBox: React.CSSProperties = {
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 12,
  marginBottom: 12,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const listaServicosAdicionais: React.CSSProperties = {
  display: "grid",
  gap: 10,
  marginBottom: 12,
};

const itemServicoAdicional: React.CSSProperties = {
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
};

const resumoServicosAdicionaisBox: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const formServicoAdicionalGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const botaoAdicionarServico: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 15,
  border: "none",
  background: "linear-gradient(135deg, #0f172a, var(--marcae-primary))",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const previewTotalServicoBox: React.CSSProperties = {
  background: "rgba(34,197,94,0.08)",
  border: "1px dashed rgba(74,222,128,0.28)",
  borderRadius: 16,
  padding: 12,
  marginBottom: 12,
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 8,
  alignItems: "center",
  fontSize: 13,
  color: "#bbf7d0",
};

const reagendamentoOpcionalBox: React.CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(124,58,237,0.16), rgba(255,255,255,0.045))",
  border: "1px solid rgba(167,139,250,0.26)",
  borderLeft: "5px solid #8b5cf6",
  borderRadius: 22,
  padding: 16,
  marginTop: 14,
  boxShadow: "0 18px 44px rgba(124,58,237,0.12), 0 16px 34px rgba(0,0,0,0.16)",
};

const botaoConfirmarReagendamento: React.CSSProperties = {
  width: "100%",
  marginTop: 14,
  padding: 14,
  borderRadius: 15,
  border: "none",
  background: "linear-gradient(135deg, #7c3aed, #db2777)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const botaoCancelarAgendamento: React.CSSProperties = {
  width: "100%",
  marginTop: 10,
  padding: 14,
  borderRadius: 15,
  border: "none",
  background: "linear-gradient(135deg, #dc2626, #ef4444)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const fechamentoBox: React.CSSProperties = {
  marginTop: 10,
  background:
    "linear-gradient(135deg, rgba(34,197,94,0.13), rgba(255,255,255,0.04))",
  border: "1px solid rgba(74,222,128,0.22)",
  borderLeft: "4px solid #22c55e",
  borderRadius: 20,
  padding: 12,
  boxShadow: "0 14px 32px rgba(34,197,94,0.10), 0 10px 22px rgba(0,0,0,0.14)",
};

const checkLinha: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 8,
  marginBottom: 8,
  fontSize: 12,
  fontWeight: 850,
  color: "#cbd5e1",
};

const acoesFechamentoBox: React.CSSProperties = {
  display: "grid",
  gap: 8,
  marginBottom: 12,
  padding: 10,
  borderRadius: 16,
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const toggleLinhaFechamento: React.CSSProperties = {
  width: "100%",
  minHeight: 54,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 10,
  padding: "9px 10px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(15,23,42,0.58)",
  color: "#fff",
};

const toggleSwitchFechamento: React.CSSProperties = {
  width: 48,
  height: 28,
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.36)",
  padding: 3,
  display: "inline-flex",
  alignItems: "center",
  transition: "all 0.18s ease",
  flex: "0 0 auto",
};

const toggleKnobFechamento: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: 999,
  background: "#fff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.34)",
  transition: "transform 0.18s ease",
};

const botaoSegmentadoFechamento: React.CSSProperties = {
  minHeight: 38,
  borderRadius: 13,
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "0 10px",
  fontSize: 12,
  fontWeight: 950,
  cursor: "pointer",
};

const miniAcaoFinanceiraBox: React.CSSProperties = {
  display: "grid",
  gap: 8,
  padding: 9,
  borderRadius: 14,
  background: "rgba(15,23,42,0.48)",
  border: "1px solid rgba(255,255,255,0.09)",
};

const subBlocoFechamentoRoxo: React.CSSProperties = {
  display: "grid",
  gap: 9,
  marginBottom: 12,
  padding: 10,
  borderRadius: 16,
  background: "rgba(124,58,237,0.09)",
  border: "1px solid rgba(167,139,250,0.20)",
};

const subBlocoFechamentoAzul: React.CSSProperties = {
  display: "grid",
  gap: 9,
  marginBottom: 12,
  padding: 10,
  borderRadius: 16,
  background: "rgba(14,165,233,0.08)",
  border: "1px solid rgba(56,189,248,0.18)",
};

const toggleSimNaoFechamentoLinha: React.CSSProperties = {
  width: "100%",
  minHeight: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "9px 10px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(15,23,42,0.54)",
  cursor: "pointer",
};

const toggleSwitchCompactoFechamento: React.CSSProperties = {
  width: 42,
  height: 24,
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.36)",
  padding: 2,
  display: "inline-flex",
  alignItems: "center",
  transition: "all 0.18s ease",
};

const toggleKnobCompactoFechamento: React.CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: 999,
  background: "#fff",
  boxShadow: "0 4px 10px rgba(2,6,23,0.32)",
  transition: "transform 0.18s ease",
};

const avisoFinanceiroTopoFechamento: React.CSSProperties = {
  display: "grid",
  gap: 3,
  marginBottom: 8,
};

const avisoDebitoClienteFechamento: React.CSSProperties = {
  padding: 9,
  borderRadius: 14,
  background: "rgba(249,115,22,0.10)",
  border: "1px solid rgba(251,146,60,0.24)",
  color: "#fed7aa",
  fontSize: 12,
  fontWeight: 850,
};

const pagamentoCompactoCardFechamento: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 7,
  padding: 7,
  marginBottom: 6,
  borderRadius: 14,
  background: "rgba(15,23,42,0.58)",
  border: "1px solid rgba(255,255,255,0.08)",
  minHeight: "unset",
  height: "fit-content",
  maxHeight: "none",
  overflow: "visible",
};

const pagamentoLinhasCompactasFechamento: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  width: "100%",
  margin: 0,
  padding: 0,
  minHeight: "unset",
};

const pagamentoLinhaCompactaFechamento: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.08fr) minmax(86px, 0.78fr) 26px",
  alignItems: "center",
  columnGap: 6,
  width: "100%",
  margin: 0,
  padding: 0,
  minHeight: 34,
};

const campoPagamentoModalidadeCompacto: React.CSSProperties = {
  ...inputData,
  minWidth: 0,
  width: "100%",
  height: 34,
  minHeight: 34,
  borderRadius: 11,
  margin: 0,
  padding: "0 9px",
  fontSize: 12,
  lineHeight: "34px",
};

const campoPagamentoValorCompacto: React.CSSProperties = {
  ...inputData,
  minWidth: 0,
  width: "100%",
  height: 34,
  minHeight: 34,
  borderRadius: 11,
  margin: 0,
  padding: "0 9px",
  fontSize: 12,
  lineHeight: "34px",
};

const espacoRemoverPagamentoCompacto: React.CSSProperties = {
  width: 26,
  height: 26,
  minWidth: 26,
  display: "block",
};

const botaoRemoverPagamentoCompacto: React.CSSProperties = {
  width: 26,
  height: 26,
  minWidth: 26,
  borderRadius: 9,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(239,68,68,0.16)",
  color: "#fecaca",
  fontWeight: 950,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  margin: 0,
  lineHeight: 1,
};

const botaoAdicionarPagamentoCompacto: React.CSSProperties = {
  width: "100%",
  minHeight: 32,
  height: 32,
  borderRadius: 11,
  border: "1px dashed rgba(167,139,250,0.55)",
  background: "rgba(255,255,255,0.92)",
  color: "#7c3aed",
  fontWeight: 950,
  fontSize: 11,
  cursor: "pointer",
  margin: 0,
  padding: 0,
};

const saldoAPagarFechamentoBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "7px 10px",
  borderRadius: 12,
  background:
    "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(15,23,42,0.72))",
  border: "1px solid rgba(34,197,94,0.28)",
  color: "#e2e8f0",
  fontSize: 13,
  fontWeight: 900,
};

const saldoAPagarFechamentoBoxSpan: React.CSSProperties = {};

const avisoCreditoClienteFechamento: React.CSSProperties = {
  padding: 9,
  borderRadius: 14,
  background: "rgba(56,189,248,0.10)",
  border: "1px solid rgba(125,211,252,0.24)",
  color: "#bae6fd",
  fontSize: 12,
  fontWeight: 850,
};

const textareaFechamento: React.CSSProperties = {
  width: "100%",
  minHeight: 66,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  padding: 10,
  resize: "vertical",
  marginBottom: 8,
  background: "rgba(2,6,23,0.72)",
  color: "#fff",
};

const botaoFinalizarAtendimento: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(135deg, #16a34a, #22c55e)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const mobileCompactStack: React.CSSProperties = {
  display: "none",
};

const mobileCompactPanel: React.CSSProperties = {
  borderRadius: 15,
  border: "1px solid rgba(255,255,255,0.075)",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.78), rgba(30,41,59,0.36))",
  padding: 9,
  boxShadow: "0 8px 20px rgba(0,0,0,0.11)",
};

const mobileCompactPanelSoft: React.CSSProperties = {
  ...mobileCompactPanel,
  background: "rgba(15,23,42,0.58)",
  boxShadow: "none",
};

const mobileCompactHeaderLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 8,
};

const mobileCompactLink: React.CSSProperties = {
  color: "#60a5fa",
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 900,
};

const mobileCompactMuted: React.CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const mobileTextButton: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#60a5fa",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
  padding: 0,
};

const mobileFinanceMiniGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 6,
};

const mobileRelationshipGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
};

const mobileMetricCard: React.CSSProperties = {
  minWidth: 0,
  minHeight: 52,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.075)",
  background: "rgba(2,6,23,0.30)",
  padding: "7px 8px",
  display: "grid",
  alignContent: "center",
  gap: 2,
};

const mobileMetricLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 850,
  lineHeight: 1.1,
};

const mobileMetricValue: React.CSSProperties = {
  color: "#f8fafc",
  fontSize: 17,
  fontWeight: 950,
  lineHeight: 1.05,
};

const mobileAgendaStack: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const mobileAgendaItem: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "48px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 10,
  borderRadius: 15,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(2,6,23,0.34)",
  padding: 10,
};

const mobileAgendaTime: React.CSSProperties = {
  color: "#c084fc",
  fontSize: 16,
  fontWeight: 950,
};

const mobileAgendaInfo: React.CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: 2,
};

const mobileAgendaProfessional: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 800,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const mobileAgendaActions: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px 34px",
  gap: 6,
};

const mobileActionButtonBase: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};

const mobileButtonConfirm: React.CSSProperties = {
  ...mobileActionButtonBase,
  background: "rgba(34,197,94,0.22)",
};

const mobileButtonWarning: React.CSSProperties = {
  ...mobileActionButtonBase,
  background: "rgba(245,158,11,0.22)",
};

const mobileButtonDone: React.CSSProperties = {
  ...mobileActionButtonBase,
  background: "rgba(34,197,94,0.18)",
  opacity: 0.7,
  cursor: "default",
};

const mobileButtonClose: React.CSSProperties = {
  ...mobileActionButtonBase,
  background: "rgba(148,163,184,0.14)",
};

const mobileFullButton: React.CSSProperties = {
  border: "1px solid rgba(124,58,237,0.35)",
  background: "rgba(124,58,237,0.16)",
  color: "#fff",
  borderRadius: 14,
  minHeight: 38,
  fontWeight: 900,
  cursor: "pointer",
};

const mobileMutedBox: React.CSSProperties = {
  border: "1px dashed rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.025)",
  borderRadius: 14,
  padding: 12,
  color: "#94a3b8",
  fontSize: 13,
  fontWeight: 800,
};

const mobileAlertStack: React.CSSProperties = {
  display: "grid",
  gap: 7,
};

const mobileAttentionPanel: React.CSSProperties = {
  ...mobileCompactPanelSoft,
  marginTop: 0,
};

const mobileAttentionStack: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const mobileAttentionItem: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.075)",
  background: "linear-gradient(135deg, rgba(2,6,23,0.42), rgba(15,23,42,0.32))",
  borderRadius: 16,
  padding: "10px 10px",
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr) 18px",
  alignItems: "center",
  gap: 10,
  color: "#fff",
  textAlign: "left",
  cursor: "pointer",
};

const mobileAttentionIcon: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  fontWeight: 950,
  fontSize: 17,
};

const mobileAttentionText: React.CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: 3,
};

const mobileAttentionArrow: React.CSSProperties = {
  color: "#64748b",
  fontSize: 26,
  fontWeight: 300,
  lineHeight: 1,
  justifySelf: "end",
};

const mobileInsightRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 0.8fr) minmax(0, 1.2fr)",
  alignItems: "center",
  gap: 8,
  minHeight: 38,
  borderRadius: 13,
  background: "rgba(2,6,23,0.30)",
  border: "1px solid rgba(255,255,255,0.07)",
  padding: "7px 10px",
};

const mobileInsightIcon: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.06)",
};

/* Constantes antigas mantidas para compatibilidade com blocos existentes do arquivo */
const header: React.CSSProperties = {};
const gridCards: React.CSSProperties = {};
const gridPrincipal: React.CSSProperties = {};
const box: React.CSSProperties = glassPanelBase;
const boxPremium: React.CSSProperties = glassPanelBase;
const tituloLinha: React.CSSProperties = {};
const gridFinanceiroPremium: React.CSSProperties = {};
const botaoPequenoRoxo: React.CSSProperties = botaoMiniEnterprise;
const boxDestaque: React.CSSProperties = glassPanelBase;
const linhaAgendamento: React.CSSProperties = agendaRowPremium;
const horaGrande: React.CSSProperties = {
  fontSize: 42,
  fontWeight: 950,
  color: "#fff",
};
const botaoHeader: React.CSSProperties = heroButtonGhostPremium;
const botaoSair: React.CSSProperties = heroButtonDangerPremium;
const botaoPrincipal: React.CSSProperties = heroButtonPrimaryPremium;
const botaoReagendar: React.CSSProperties = heroButtonGhostPremium;
const filtroDashboardBox: React.CSSProperties = filtroEnterpriseBox;
const botaoFiltroDashboard: React.CSSProperties = botaoFiltroEnterprisePrimario;
const botaoFiltroSecundario: React.CSSProperties = botaoFiltroEnterprise;
const periodoTexto: React.CSSProperties = periodoEnterpriseTexto;
const novoHeaderPremium: React.CSSProperties = dashboardHeroPremium;
const headerEmpresaInfo: React.CSSProperties = heroIdentityPremium;
const logoEmpresa: React.CSSProperties = logoEmpresaHeroPremium;
const badgeSistema: React.CSSProperties = heroEyebrowPremium;
const tituloEmpresa: React.CSSProperties = heroTitlePremium;
const linhaInfosEmpresa: React.CSSProperties = heroBadgesPremium;
const badgePlano: React.CSSProperties = heroBadge;
const badgeStatus: React.CSSProperties = heroBadge;
const acoesHeader: React.CSSProperties = heroActionsPremium;
const botaoHeaderPremium: React.CSSProperties = heroButtonGhostPremium;
const botaoHeaderRoxo: React.CSSProperties = heroButtonPrimaryPremium;
const botaoSairPremium: React.CSSProperties = heroButtonDangerPremium;
const subtituloHeader: React.CSSProperties = heroSubtitlePremium;
const badgeEmpresa: React.CSSProperties = heroBadge;
const badgeVencimento: React.CSSProperties = heroBadge;
