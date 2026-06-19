"use client";

import PremiumLayout from "@/components/layout/PremiumLayout";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

export default function ClientesPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [formCadastroAberto, setFormCadastroAberto] = useState(false);

  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [historicoCliente, setHistoricoCliente] = useState<any[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [financeiroCliente, setFinanceiroCliente] = useState<any>({
    credito: 0,
    debito: 0,
    saldo: 0,
  });
  const [movimentacoesFinanceiras, setMovimentacoesFinanceiras] = useState<
    any[]
  >([]);
  const [modalLancamentoFinanceiroAberto, setModalLancamentoFinanceiroAberto] =
    useState(false);
  const [salvandoLancamentoFinanceiro, setSalvandoLancamentoFinanceiro] =
    useState(false);
  const [formLancamentoFinanceiro, setFormLancamentoFinanceiro] = useState({
    tipo: "credito",
    valor: "",
    observacao: "",
  });

  const [form, setForm] = useState({
    nome: "",
    whatsapp: "",
    cpf: "",
    dataNascimento: "",
  });

  const [formEdicao, setFormEdicao] = useState({
    nome: "",
    whatsapp: "",
    cpf: "",
    dataNascimento: "",
  });

  const [abaCliente, setAbaCliente] = useState<
    "dados" | "historico" | "financeiro" | "fichas"
  >("dados");
  const [fichasCliente, setFichasCliente] = useState<any[]>([]);
  const [modelosFichaCliente, setModelosFichaCliente] = useState<any[]>([]);
  const [drawerFichaAberto, setDrawerFichaAberto] = useState(false);
  const [modeloFichaSelecionado, setModeloFichaSelecionado] =
    useState<any>(null);
  const [camposFichaCliente, setCamposFichaCliente] = useState<any[]>([]);
  const [carregandoCamposFicha, setCarregandoCamposFicha] = useState(false);
  const [salvandoFichaCliente, setSalvandoFichaCliente] = useState(false);
  const [respostasFichaCliente, setRespostasFichaCliente] = useState<
    Record<string, any>
  >({});
  const [assinaturaNomeFicha, setAssinaturaNomeFicha] = useState("");
  const [assinaturaCpfFicha, setAssinaturaCpfFicha] = useState("");
  const [aceiteLgpdFicha, setAceiteLgpdFicha] = useState(false);

  const [drawerVisualizarFichaAberto, setDrawerVisualizarFichaAberto] =
    useState(false);
  const [fichaDetalhada, setFichaDetalhada] = useState<any>(null);
  const [carregandoFichaDetalhada, setCarregandoFichaDetalhada] =
    useState(false);
  const [respostasProfissionalFicha, setRespostasProfissionalFicha] = useState<
    Record<string, any>
  >({});
  const [salvandoComplementoFicha, setSalvandoComplementoFicha] =
    useState(false);

  useEffect(() => {
    const empresaStorage = localStorage.getItem("empresaLogada");
    const usuarioStorage = localStorage.getItem("usuarioEmpresa");

    if (!empresaStorage) {
      window.location.href = "/login";
      return;
    }

    const emp = JSON.parse(empresaStorage);
    setEmpresa(emp);
    setUsuario(usuarioStorage ? JSON.parse(usuarioStorage) : null);
    carregarClientes(emp.id);
  }, []);

  function somenteNumeros(valor: string) {
    return String(valor || "").replace(/\D/g, "");
  }

  function formatarCpf(valor: string) {
    const numeros = somenteNumeros(valor).slice(0, 11);

    return numeros
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatarWhatsapp(valor: string) {
    const numeros = somenteNumeros(valor).slice(0, 11);

    if (numeros.length <= 10) {
      return numeros
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numeros
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function dinheiro(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function valorNumerico(valor: any) {
    const convertido = Number(String(valor || 0).replace(",", "."));
    return Number.isNaN(convertido) ? 0 : convertido;
  }

  function textoTipoMovimentacao(tipo?: string | null) {
    if (tipo === "credito") return "Crédito";
    if (tipo === "debito") return "Débito";
    return tipo || "Movimentação";
  }

  function textoOrigemMovimentacao(origem?: string | null) {
    if (origem === "ajuste_manual") return "Ajuste manual";
    if (origem === "atendimento") return "Atendimento";
    if (origem === "compensacao") return "Compensação";
    if (origem === "pagamento") return "Pagamento";
    if (origem === "estorno") return "Estorno";
    return origem || "Não informado";
  }

  function corSaldoFinanceiro(saldo: number) {
    if (saldo > 0) return "#22c55e";
    if (saldo < 0) return "#ef4444";
    return "#94a3b8";
  }

  function formatarData(data?: string | null) {
    if (!data) return "Não informada";

    const dataString = String(data);

    // Corrige problema de UTC em datas YYYY-MM-DD
    if (dataString.includes("-")) {
      const [ano, mes, dia] = dataString.split("T")[0].split("-");

      return `${dia}/${mes}/${ano}`;
    }

    const dataObj = new Date(data);

    return dataObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatarDataHora(data?: string | null) {
    if (!data) return "Não informado";

    return new Date(data).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function obterUltimoAtendimento(cliente: any) {
    return (
      cliente?.ultimoAtendimento ||
      cliente?.ultimoAtendimentoEm ||
      cliente?.ultimoAgendamento ||
      cliente?.ultimaVisita ||
      cliente?.lastAppointmentAt ||
      cliente?.lastAtendimentoAt ||
      null
    );
  }

  function textoUltimoAtendimento(cliente: any) {
    const ultimoAtendimento = obterUltimoAtendimento(cliente);

    if (!ultimoAtendimento) return "Sem atendimento";

    const dataUltimoAtendimento = new Date(ultimoAtendimento);

    if (Number.isNaN(dataUltimoAtendimento.getTime())) {
      return formatarData(ultimoAtendimento);
    }

    const hoje = new Date();
    const inicioHoje = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
    );
    const inicioAtendimento = new Date(
      dataUltimoAtendimento.getFullYear(),
      dataUltimoAtendimento.getMonth(),
      dataUltimoAtendimento.getDate(),
    );
    const diferencaDias = Math.floor(
      (inicioHoje.getTime() - inicioAtendimento.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (diferencaDias <= 0) return "Hoje";
    if (diferencaDias === 1) return "Ontem";
    if (diferencaDias <= 30) return `${diferencaDias} dias atrás`;

    return formatarData(ultimoAtendimento);
  }

  function totalAtendimentosCliente(cliente: any) {
    return (
      cliente?.totalAtendimentos ||
      cliente?.quantidadeAtendimentos ||
      cliente?._count?.agendamentos ||
      cliente?._count?.atendimentos ||
      0
    );
  }

  function dataInput(data?: string | null) {
    if (!data) return "";
    return new Date(data).toISOString().slice(0, 10);
  }

  function textoStatus(status?: string | null) {
    if (status === "concluido") return "Concluído";
    if (status === "confirmado") return "Confirmado";
    if (status === "cancelado") return "Cancelado";
    if (status === "pendente") return "Pendente";
    return status || "Não informado";
  }

  function textoPagamento(status?: string | null) {
    if (status === "pago") return "Pago";
    if (status === "aprovado") return "Pago";
    if (status === "confirmado") return "Confirmado";
    if (status === "pendente") return "Pendente";
    if (status === "sem_pagamento") return "Sem pagamento";
    return status || "Não informado";
  }

  async function carregarClientes(empresaId: string) {
    try {
      setCarregando(true);

      const res = await fetch(`/api/v1/clients?empresaId=${empresaId}`, {
        cache: "no-store",
      });

      const data = await res.json();

      setClientes(data.clientes || []);
    } catch (error) {
      alert("Erro ao carregar clientes.");
    } finally {
      setCarregando(false);
    }
  }

  async function salvarCliente() {
    if (!empresa?.id) return;

    if (!form.nome.trim()) return alert("Informe o nome do cliente.");

    if (somenteNumeros(form.whatsapp).length < 10) {
      return alert("Informe um WhatsApp válido.");
    }

    if (form.cpf && somenteNumeros(form.cpf).length !== 11) {
      return alert("Informe um CPF válido com 11 dígitos.");
    }

    try {
      setSalvando(true);

      const res = await fetch("/api/v1/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: empresa.id,
          nome: form.nome.trim(),
          whatsapp: somenteNumeros(form.whatsapp),
          cpf: somenteNumeros(form.cpf),
          dataNascimento: form.dataNascimento || undefined,
        }),
      });

      if (!res.ok) {
        const erro = await res.json();
        alert(erro.error || "Erro ao salvar cliente.");
        return;
      }

      setForm({
        nome: "",
        whatsapp: "",
        cpf: "",
        dataNascimento: "",
      });

      await carregarClientes(empresa.id);
      setFormCadastroAberto(false);
      alert("Cliente salvo com sucesso!");
    } catch (error) {
      alert("Erro ao salvar cliente.");
    } finally {
      setSalvando(false);
    }
  }

  function abrirEditar(cliente: any) {
    setClienteSelecionado(cliente);
    setFormEdicao({
      nome: cliente.nome || "",
      whatsapp: formatarWhatsapp(cliente.whatsapp || ""),
      cpf: formatarCpf(cliente.cpf || ""),
      dataNascimento: dataInput(cliente.dataNascimento),
    });
    setModalEditarAberto(true);
  }

  function fecharEditar() {
    setModalEditarAberto(false);
    setClienteSelecionado(null);
    setFormEdicao({
      nome: "",
      whatsapp: "",
      cpf: "",
      dataNascimento: "",
    });
  }

  async function salvarEdicaoCliente() {
    if (!empresa?.id || !clienteSelecionado?.id) return;

    if (!formEdicao.nome.trim()) return alert("Informe o nome do cliente.");

    if (somenteNumeros(formEdicao.whatsapp).length < 10) {
      return alert("Informe um WhatsApp válido.");
    }

    if (formEdicao.cpf && somenteNumeros(formEdicao.cpf).length !== 11) {
      return alert("Informe um CPF válido com 11 dígitos.");
    }

    try {
      setSalvandoEdicao(true);

      const res = await fetch("/api/v1/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: empresa.id,
          clienteId: clienteSelecionado.id,
          nome: formEdicao.nome.trim(),
          whatsapp: somenteNumeros(formEdicao.whatsapp),
          cpf: somenteNumeros(formEdicao.cpf),
          dataNascimento: formEdicao.dataNascimento || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Erro ao editar cliente.");
        return;
      }

      await carregarClientes(empresa.id);
      fecharEditar();
      alert("Cliente atualizado com sucesso!");
    } catch (error) {
      alert("Erro ao editar cliente.");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function abrirHistorico(cliente: any) {
    if (!empresa?.id) return;

    try {
      setClienteSelecionado(cliente);
      setModalHistoricoAberto(true);
      setAbaCliente("dados");
      setCarregandoHistorico(true);
      setHistoricoCliente([]);
      setFinanceiroCliente({ credito: 0, debito: 0, saldo: 0 });
      setMovimentacoesFinanceiras([]);
      setFichasCliente([]);
      setModelosFichaCliente([]);
      fecharDrawerFichaCliente();

      const [resCliente, resFichas, resModelos] = await Promise.all([
        fetch(
          `/api/v1/clients?empresaId=${empresa.id}&clienteId=${cliente.id}`,
          {
            cache: "no-store",
          },
        ),
        fetch(
          `/api/fichas-digitais/registros?empresaId=${empresa.id}&clienteId=${cliente.id}`,
          {
            cache: "no-store",
          },
        ),
        fetch(
          `/api/fichas-digitais/modelos?empresaId=${empresa.id}&includeCampos=true&status=ativo`,
          {
            cache: "no-store",
          },
        ),
      ]);

      const dataCliente = await resCliente.json();
      const dataFichas = await resFichas.json();
      const dataModelos = await resModelos.json();

      if (!resCliente.ok) {
        alert(dataCliente.error || "Erro ao buscar histórico.");
        return;
      }

      setHistoricoCliente(dataCliente.historico || []);
      setFinanceiroCliente(
        dataCliente.financeiroCliente ||
          dataCliente.cliente?.financeiro || {
            credito: 0,
            debito: 0,
            saldo: 0,
          },
      );
      setMovimentacoesFinanceiras(dataCliente.movimentacoesFinanceiras || []);

      if (resFichas.ok) {
        setFichasCliente(
          Array.isArray(dataFichas.registros) ? dataFichas.registros : [],
        );
      }

      if (resModelos.ok) {
        setModelosFichaCliente(
          Array.isArray(dataModelos.modelos) ? dataModelos.modelos : [],
        );
      }
    } catch (error) {
      alert("Erro ao buscar histórico.");
    } finally {
      setCarregandoHistorico(false);
    }
  }

  function fecharHistorico() {
    setModalHistoricoAberto(false);
    setClienteSelecionado(null);
    setHistoricoCliente([]);
    setFinanceiroCliente({ credito: 0, debito: 0, saldo: 0 });
    setMovimentacoesFinanceiras([]);
    setFichasCliente([]);
    setModelosFichaCliente([]);
    setModalLancamentoFinanceiroAberto(false);
    setAbaCliente("dados");
    fecharDrawerFichaCliente();
    fecharDrawerVisualizarFicha();
  }

  function abrirLancamentoFinanceiro(tipo: "credito" | "debito") {
    setFormLancamentoFinanceiro({
      tipo,
      valor: "",
      observacao: "",
    });
    setModalLancamentoFinanceiroAberto(true);
  }

  async function salvarLancamentoFinanceiro() {
    if (!empresa?.id || !clienteSelecionado?.id) return;

    const valor = valorNumerico(formLancamentoFinanceiro.valor);

    if (valor <= 0) {
      alert("Informe um valor maior que zero.");
      return;
    }

    try {
      setSalvandoLancamentoFinanceiro(true);

      const res = await fetch("/api/v1/clients/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: empresa.id,
          clienteId: clienteSelecionado.id,
          tipo: formLancamentoFinanceiro.tipo,
          valor,
          origem: "ajuste_manual",
          observacao: formLancamentoFinanceiro.observacao || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Erro ao lançar movimentação financeira.");
        return;
      }

      setFinanceiroCliente(data.resumo || { credito: 0, debito: 0, saldo: 0 });
      setMovimentacoesFinanceiras((atual) => [data.movimentacao, ...atual]);
      setModalLancamentoFinanceiroAberto(false);
      setFormLancamentoFinanceiro({
        tipo: "credito",
        valor: "",
        observacao: "",
      });
      await carregarClientes(empresa.id);

      alert("Movimentação financeira lançada com sucesso!");
    } catch (error) {
      alert("Erro ao lançar movimentação financeira.");
    } finally {
      setSalvandoLancamentoFinanceiro(false);
    }
  }

  function iniciarAgendamento(cliente: any) {
    window.location.href = `/agendar/${empresa.slug}?clienteId=${cliente.id}&origem=painel`;
  }

  function opcoesCampoFicha(campo: any) {
    if (!campo?.opcoes) return [];

    if (Array.isArray(campo.opcoes)) {
      return campo.opcoes
        .map((item: any) => String(item || "").trim())
        .filter(Boolean);
    }

    if (typeof campo.opcoes === "string") {
      return campo.opcoes
        .split("\n")
        .map((item: string) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  function labelTipoFicha(tipo?: string | null) {
    if (tipo === "texto") return "Texto curto";
    if (tipo === "textarea") return "Texto longo";
    if (tipo === "numero") return "Número";
    if (tipo === "data") return "Data";
    if (tipo === "sim_nao") return "Sim/Não";
    if (tipo === "selecao") return "Seleção única";
    if (tipo === "multiselecao") return "Múltipla seleção";
    if (tipo === "foto") return "Foto";
    if (tipo === "assinatura") return "Assinatura";
    if (tipo === "termo_lgpd") return "LGPD";
    return tipo || "Campo";
  }

  function statusFichaTexto(registro: any) {
    if (registro?.assinado) return "Assinada";
    if (registro?.status === "preenchida") return "Preenchida";
    if (registro?.status === "finalizada") return "Finalizada";
    if (registro?.status === "rascunho") return "Rascunho";
    if (registro?.status === "pendente") return "Pendente";
    if (registro?.status === "arquivada") return "Arquivada";
    return registro?.status || "Pendente";
  }

  function abrirNovaFichaCliente() {
    if (modelosFichaCliente.length === 0) {
      alert(
        "Crie ao menos um modelo ativo em Fichas Digitais antes de preencher uma ficha para o cliente.",
      );
      return;
    }

    setDrawerFichaAberto(true);
    setModeloFichaSelecionado(null);
    setCamposFichaCliente([]);
    setRespostasFichaCliente({});
    setAssinaturaNomeFicha(clienteSelecionado?.nome || "");
    setAssinaturaCpfFicha(formatarCpf(clienteSelecionado?.cpf || ""));
    setAceiteLgpdFicha(false);
  }

  function fecharDrawerFichaCliente() {
    setDrawerFichaAberto(false);
    setModeloFichaSelecionado(null);
    setCamposFichaCliente([]);
    setRespostasFichaCliente({});
    setAssinaturaNomeFicha("");
    setAssinaturaCpfFicha("");
    setAceiteLgpdFicha(false);
    setCarregandoCamposFicha(false);
    setSalvandoFichaCliente(false);
  }

  async function selecionarModeloFichaCliente(modeloId: string) {
    if (!empresa?.id || !modeloId) {
      setModeloFichaSelecionado(null);
      setCamposFichaCliente([]);
      return;
    }

    const modelo =
      modelosFichaCliente.find((item) => item.id === modeloId) || null;
    setModeloFichaSelecionado(modelo);
    setCamposFichaCliente([]);
    setRespostasFichaCliente({});
    setAceiteLgpdFicha(
      Boolean(modelo?.exigeAceiteLgpd) ? false : aceiteLgpdFicha,
    );

    try {
      setCarregandoCamposFicha(true);

      const res = await fetch(
        `/api/fichas-digitais/campos?empresaId=${empresa.id}&modeloId=${modeloId}`,
        {
          cache: "no-store",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao carregar perguntas da ficha.");
        return;
      }

      setCamposFichaCliente(Array.isArray(data.campos) ? data.campos : []);
    } catch (error) {
      alert("Erro ao carregar perguntas da ficha.");
    } finally {
      setCarregandoCamposFicha(false);
    }
  }

  function atualizarRespostaFicha(campoId: string, valor: any) {
    setRespostasFichaCliente((atual) => ({
      ...atual,
      [campoId]: valor,
    }));
  }

  function respostaEstaVazia(valor: any) {
    if (valor === undefined || valor === null) return true;
    if (Array.isArray(valor)) return valor.length === 0;
    if (typeof valor === "boolean") return !valor;
    return String(valor).trim() === "";
  }

  function montarRespostaFichaComValor(campo: any, valor: any, index: number) {
    const tipo = campo.tipo || "texto";

    const respostaBase = {
      campoId: campo.id,
      campoTitulo: campo.titulo,
      campoTipo: tipo,
      ordem: Number.isFinite(Number(campo.ordem)) ? Number(campo.ordem) : index,
    };

    if (tipo === "numero") {
      return {
        ...respostaBase,
        valorNumero: valor || null,
      };
    }

    if (tipo === "data") {
      return {
        ...respostaBase,
        valorData: valor || null,
      };
    }

    if (tipo === "multiselecao") {
      return {
        ...respostaBase,
        valorJson: Array.isArray(valor) ? valor : [],
      };
    }

    if (tipo === "foto") {
      return {
        ...respostaBase,
        valorJson: valor ? [valor] : [],
      };
    }

    if (tipo === "termo_lgpd") {
      return {
        ...respostaBase,
        valorTexto: valor ? "Aceito" : "",
      };
    }

    return {
      ...respostaBase,
      valorTexto: valor || "",
    };
  }

  function montarRespostaFicha(campo: any, index: number) {
    return montarRespostaFichaComValor(
      campo,
      respostasFichaCliente[campo.id],
      index,
    );
  }

  async function salvarFichaCliente() {
    if (
      !empresa?.id ||
      !clienteSelecionado?.id ||
      !modeloFichaSelecionado?.id
    ) {
      alert("Selecione um modelo de ficha.");
      return;
    }

    const campoObrigatorioPendente = camposFichaCliente.find((campo, index) => {
      const valor = respostasFichaCliente[campo.id];

      if (campo.tipo === "assinatura") {
        return Boolean(campo.obrigatorio) && !assinaturaNomeFicha.trim();
      }

      if (campo.tipo === "termo_lgpd") {
        return Boolean(campo.obrigatorio) && !Boolean(valor);
      }

      return Boolean(campo.obrigatorio) && respostaEstaVazia(valor);
    });

    if (campoObrigatorioPendente) {
      alert(`Responda o campo obrigatório: ${campoObrigatorioPendente.titulo}`);
      return;
    }

    if (modeloFichaSelecionado.exigeAceiteLgpd && !aceiteLgpdFicha) {
      alert("Confirme o aceite LGPD para salvar esta ficha.");
      return;
    }

    if (modeloFichaSelecionado.exigeAssinatura && !assinaturaNomeFicha.trim()) {
      alert("Informe o nome da assinatura para salvar esta ficha.");
      return;
    }

    try {
      setSalvandoFichaCliente(true);

      const respostas = camposFichaCliente.map((campo, index) =>
        montarRespostaFicha(campo, index),
      );
      const arquivos = camposFichaCliente
        .filter(
          (campo) => campo.tipo === "foto" && respostasFichaCliente[campo.id],
        )
        .map((campo, index) => ({
          tipo: "foto",
          categoria: "cliente",
          url: respostasFichaCliente[campo.id],
          descricao: campo.titulo,
          ordem: index,
        }));

      const res = await fetch("/api/fichas-digitais/registros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresaId: empresa.id,
          modeloId: modeloFichaSelecionado.id,
          clienteId: clienteSelecionado.id,
          status: "preenchida",
          origem: "painel",
          preenchidoPorTipo: "usuario",
          preenchidoPorNome: usuario?.nome || null,
          preenchidoPorUsuarioId: usuario?.id || null,
          assinado: Boolean(
            modeloFichaSelecionado.exigeAssinatura &&
            assinaturaNomeFicha.trim(),
          ),
          assinaturaNome: assinaturaNomeFicha.trim() || null,
          assinaturaCpf: somenteNumeros(assinaturaCpfFicha) || null,
          aceiteLgpd: Boolean(
            aceiteLgpdFicha || modeloFichaSelecionado.exigeAceiteLgpd === false,
          ),
          aceiteLgpdTexto:
            aceiteLgpdFicha || modeloFichaSelecionado.exigeAceiteLgpd === false
              ? "Cliente autorizou o uso dos dados para histórico, atendimento e prestação de serviço."
              : null,
          respostas,
          arquivos,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Erro ao salvar ficha digital.");
        return;
      }

      setFichasCliente((atual) => [data.registro, ...atual]);
      fecharDrawerFichaCliente();
      setAbaCliente("fichas");
      alert("Ficha digital salva com sucesso!");
    } catch (error) {
      alert("Erro ao salvar ficha digital.");
    } finally {
      setSalvandoFichaCliente(false);
    }
  }

  function renderCampoFicha(campo: any) {
    const valor = respostasFichaCliente[campo.id] ?? "";
    const opcoes = opcoesCampoFicha(campo);

    if (campo.tipo === "textarea") {
      return (
        <textarea
          value={valor}
          onChange={(e) => atualizarRespostaFicha(campo.id, e.target.value)}
          placeholder={campo.placeholder || "Digite a resposta"}
          style={textareaFicha}
        />
      );
    }

    if (campo.tipo === "numero") {
      return (
        <input
          type="number"
          value={valor}
          onChange={(e) => atualizarRespostaFicha(campo.id, e.target.value)}
          placeholder={campo.placeholder || "0"}
          style={input}
        />
      );
    }

    if (campo.tipo === "data") {
      return (
        <input
          type="date"
          value={valor}
          onChange={(e) => atualizarRespostaFicha(campo.id, e.target.value)}
          style={input}
        />
      );
    }

    if (campo.tipo === "sim_nao") {
      return (
        <select
          value={valor}
          onChange={(e) => atualizarRespostaFicha(campo.id, e.target.value)}
          style={input}
        >
          <option value="">Selecione</option>
          <option value="Sim">Sim</option>
          <option value="Não">Não</option>
        </select>
      );
    }

    if (campo.tipo === "selecao") {
      return (
        <select
          value={valor}
          onChange={(e) => atualizarRespostaFicha(campo.id, e.target.value)}
          style={input}
        >
          <option value="">Selecione</option>
          {opcoes.map((opcao: string) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      );
    }

    if (campo.tipo === "multiselecao") {
      const valores = Array.isArray(respostasFichaCliente[campo.id])
        ? respostasFichaCliente[campo.id]
        : [];

      return (
        <div style={opcoesChecklist}>
          {opcoes.map((opcao: string) => (
            <label key={opcao} style={checkLinhaFicha}>
              <input
                type="checkbox"
                checked={valores.includes(opcao)}
                onChange={(e) => {
                  const novosValores = e.target.checked
                    ? [...valores, opcao]
                    : valores.filter((item: string) => item !== opcao);

                  atualizarRespostaFicha(campo.id, novosValores);
                }}
              />
              <span>{opcao}</span>
            </label>
          ))}
        </div>
      );
    }

    if (campo.tipo === "foto") {
      return (
        <input
          value={valor}
          onChange={(e) => atualizarRespostaFicha(campo.id, e.target.value)}
          placeholder="Cole aqui a URL da foto nesta fase"
          style={input}
        />
      );
    }

    if (campo.tipo === "assinatura") {
      return (
        <div style={assinaturaBox}>
          <Campo
            label="Nome para assinatura"
            value={assinaturaNomeFicha}
            placeholder="Nome do cliente"
            onChange={(value: string) => {
              setAssinaturaNomeFicha(value);
              atualizarRespostaFicha(campo.id, value);
            }}
          />

          <Campo
            label="CPF da assinatura"
            value={assinaturaCpfFicha}
            placeholder="000.000.000-00"
            onChange={(value: string) =>
              setAssinaturaCpfFicha(formatarCpf(value))
            }
          />
        </div>
      );
    }

    if (campo.tipo === "termo_lgpd") {
      return (
        <label style={lgpdBox}>
          <input
            type="checkbox"
            checked={Boolean(respostasFichaCliente[campo.id])}
            onChange={(e) => {
              atualizarRespostaFicha(campo.id, e.target.checked);
              setAceiteLgpdFicha(e.target.checked);
            }}
          />
          <span>
            Li e autorizo o uso dos dados para histórico, atendimento e
            prestação de serviço.
          </span>
        </label>
      );
    }

    return (
      <input
        value={valor}
        onChange={(e) => atualizarRespostaFicha(campo.id, e.target.value)}
        placeholder={campo.placeholder || "Digite a resposta"}
        style={input}
      />
    );
  }

  function fecharDrawerVisualizarFicha() {
    setDrawerVisualizarFichaAberto(false);
    setFichaDetalhada(null);
    setRespostasProfissionalFicha({});
    setCarregandoFichaDetalhada(false);
    setSalvandoComplementoFicha(false);
  }

  function obterValorRespostaFicha(resposta: any) {
    if (!resposta) return "";

    if (resposta.valorJson !== null && resposta.valorJson !== undefined) {
      return resposta.valorJson;
    }

    if (resposta.valorNumero !== null && resposta.valorNumero !== undefined) {
      return String(resposta.valorNumero);
    }

    if (resposta.valorData) {
      return String(resposta.valorData).slice(0, 10);
    }

    return resposta.valorTexto || "";
  }

  function formatarValorRespostaFicha(resposta: any) {
    const valor = obterValorRespostaFicha(resposta);

    if (Array.isArray(valor)) {
      return valor.length ? valor.join(", ") : "Não informado";
    }

    if (resposta?.campoTipo === "data" && valor) {
      return formatarData(valor);
    }

    if (resposta?.campoTipo === "termo_lgpd") {
      return valor ? "Aceito" : "Não aceito";
    }

    if (resposta?.campoTipo === "assinatura") {
      return valor ? "Declaração confirmada" : "Não confirmada";
    }

    return valor ? String(valor) : "Não informado";
  }

  function camposClienteSemAssinatura(ficha: any) {
    return camposDaFichaPorRespondente(ficha, "cliente").filter(
      (campo: any) => campo.tipo !== "assinatura",
    );
  }

  function campoAssinaturaCliente(ficha: any) {
    return camposDaFichaPorRespondente(ficha, "cliente").find(
      (campo: any) => campo.tipo === "assinatura",
    );
  }

  function cpfAssinaturaFicha(ficha: any) {
    const cpf =
      ficha?.assinaturaCpf ||
      ficha?.cliente?.cpf ||
      clienteSelecionado?.cpf ||
      "";

    return cpf ? formatarCpf(cpf) : "CPF não informado";
  }

  function nomeAssinaturaFicha(ficha: any) {
    return (
      ficha?.assinaturaNome ||
      ficha?.cliente?.nome ||
      clienteSelecionado?.nome ||
      "Nome não informado"
    );
  }

  function textoAssinaturaFicha(ficha: any) {
    if (!ficha?.assinado && !ficha?.assinaturaNome) {
      return "Assinatura ainda não confirmada";
    }

    return ficha?.assinadoEm
      ? formatarDataHora(ficha.assinadoEm)
      : "Não informada";
  }

  function escaparHtmlFicha(valor: any) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function obterEnderecoEmpresaTexto() {
    const enderecoBruto = empresa?.endereco;

    const montarEndereco = (endereco: any) => {
      if (!endereco || typeof endereco !== "object") return "";

      return [
        endereco.rua || endereco.logradouro || endereco.endereco,
        endereco.numero ? `nº ${endereco.numero}` : "",
        endereco.bairro,
        endereco.cidade,
        endereco.estado || endereco.uf,
        endereco.cep ? `CEP ${endereco.cep}` : "",
        endereco.complemento,
      ]
        .filter(Boolean)
        .join(", ");
    };

    if (enderecoBruto && typeof enderecoBruto === "object") {
      const enderecoObjeto = montarEndereco(enderecoBruto);
      if (enderecoObjeto) return enderecoObjeto;
    }

    if (typeof enderecoBruto === "string") {
      const texto = enderecoBruto.trim();

      if (texto.startsWith("{") && texto.endsWith("}")) {
        try {
          const enderecoParseado = JSON.parse(texto);
          const enderecoObjeto = montarEndereco(enderecoParseado);
          if (enderecoObjeto) return enderecoObjeto;
        } catch (error) {}
      }

      if (texto) return texto;
    }

    return [
      empresa?.rua,
      empresa?.numero ? `nº ${empresa.numero}` : "",
      empresa?.bairro,
      empresa?.cidade,
      empresa?.estado || empresa?.uf,
      empresa?.cep ? `CEP ${empresa.cep}` : "",
    ]
      .filter(Boolean)
      .join(", ");
  }

  function montarTextoFichaParaCompartilhar() {
    if (!fichaDetalhada) return "";

    const linhas: string[] = [];
    const respostasPorCampo = respostasDaFichaPorCampo(fichaDetalhada);
    const camposCliente = camposClienteSemAssinatura(fichaDetalhada);
    const camposProfissional = camposDaFichaPorRespondente(
      fichaDetalhada,
      "profissional",
    );
    const titulo =
      fichaDetalhada.tituloSnapshot ||
      fichaDetalhada.modelo?.titulo ||
      "Ficha digital";
    const nomeEmpresa = empresa?.nome || empresa?.razaoSocial || "Empresa";
    const documentoEmpresa =
      empresa?.cnpj || empresa?.cpfCnpj || empresa?.documento || "";
    const telefoneEmpresa = empresa?.whatsapp || empresa?.telefone || "";
    const emailEmpresa = empresa?.email || "";
    const enderecoEmpresa = obterEnderecoEmpresaTexto();

    linhas.push("MARCAÊ | FICHA DIGITAL");
    linhas.push("");
    linhas.push(`Empresa: ${nomeEmpresa}`);
    if (documentoEmpresa) linhas.push(`Documento: ${documentoEmpresa}`);
    if (telefoneEmpresa)
      linhas.push(
        `Contato: ${formatarWhatsapp(telefoneEmpresa) || telefoneEmpresa}`,
      );
    if (emailEmpresa) linhas.push(`E-mail: ${emailEmpresa}`);
    if (enderecoEmpresa) linhas.push(`Endereço: ${enderecoEmpresa}`);
    linhas.push("");
    linhas.push(titulo);
    linhas.push(
      `Cliente: ${fichaDetalhada.cliente?.nome || clienteSelecionado?.nome || "Não vinculado"}`,
    );
    linhas.push(
      `CPF: ${formatarCpf(fichaDetalhada.cliente?.cpf || clienteSelecionado?.cpf || "") || "Não informado"}`,
    );
    linhas.push(`Data da ficha: ${formatarData(fichaDetalhada.createdAt)}`);
    linhas.push(`Status: ${statusFichaTexto(fichaDetalhada)}`);

    if (fichaDetalhada.agendamento) {
      linhas.push("");
      linhas.push("Atendimento vinculado");
      linhas.push(
        `Serviço: ${fichaDetalhada.agendamento?.servico?.nome || "Não informado"}`,
      );
      linhas.push(
        `Profissional: ${fichaDetalhada.agendamento?.profissional?.nome || "Não informado"}`,
      );
      linhas.push(
        `Data e horário: ${formatarDataHora(fichaDetalhada.agendamento?.dataHoraInicio)}`,
      );
    }

    linhas.push("");
    linhas.push("Respostas do cliente");

    camposCliente.forEach((campo: any) => {
      const resposta = respostasPorCampo.get(campo.id);
      linhas.push(`${campo.titulo}: ${formatarValorRespostaFicha(resposta)}`);
    });

    if (campoAssinaturaCliente(fichaDetalhada)) {
      linhas.push("");
      linhas.push("Assinatura Digital Confirmada");
      linhas.push(
        "Confirmo que as informações desta ficha foram preenchidas por mim e autorizo sua utilização como assinatura digital para este atendimento.",
      );
      linhas.push(`Nome do cliente: ${nomeAssinaturaFicha(fichaDetalhada)}`);
      linhas.push(`CPF: ${cpfAssinaturaFicha(fichaDetalhada)}`);
      linhas.push(
        `Data da confirmação: ${textoAssinaturaFicha(fichaDetalhada)}`,
      );
      linhas.push("Origem: Agendador Online Marcaê");
    }

    if (camposProfissional.length > 0) {
      linhas.push("");
      linhas.push("Complemento profissional");

      camposProfissional.forEach((campo: any) => {
        const resposta = respostasPorCampo.get(campo.id);
        linhas.push(`${campo.titulo}: ${formatarValorRespostaFicha(resposta)}`);
      });
    }

    linhas.push("");
    linhas.push("Documento gerado pelo Marcaê.");

    return linhas.join("\n");
  }

  function montarHtmlFichaParaImpressao() {
    if (!fichaDetalhada) return "";

    const respostasPorCampo = respostasDaFichaPorCampo(fichaDetalhada);
    const camposCliente = camposClienteSemAssinatura(fichaDetalhada);
    const camposProfissional = camposDaFichaPorRespondente(
      fichaDetalhada,
      "profissional",
    );
    const titulo =
      fichaDetalhada.tituloSnapshot ||
      fichaDetalhada.modelo?.titulo ||
      "Ficha digital";
    const nomeEmpresa = empresa?.nome || empresa?.razaoSocial || "Empresa";
    const documentoEmpresa =
      empresa?.cnpj || empresa?.cpfCnpj || empresa?.documento || "";
    const telefoneEmpresa = empresa?.whatsapp || empresa?.telefone || "";
    const emailEmpresa = empresa?.email || "";
    const enderecoEmpresa = obterEnderecoEmpresaTexto();
    const logoEmpresa =
      empresa?.logoUrl || empresa?.logo || empresa?.imagemUrl || "";
    const clienteNome =
      fichaDetalhada.cliente?.nome ||
      clienteSelecionado?.nome ||
      "Não vinculado";
    const clienteCpf =
      formatarCpf(
        fichaDetalhada.cliente?.cpf || clienteSelecionado?.cpf || "",
      ) || "Não informado";
    const dataGeracao = formatarDataHora(new Date().toISOString());

    const respostaHtml = (campo: any) => {
      const resposta = respostasPorCampo.get(campo.id);

      return `
        <article class="resposta">
          <div class="resposta-tipo">${escaparHtmlFicha(labelTipoFicha(campo.tipo))}</div>
          <h3>${escaparHtmlFicha(campo.titulo)}</h3>
          <p>${escaparHtmlFicha(formatarValorRespostaFicha(resposta))}</p>
        </article>
      `;
    };

    const logoHtml = logoEmpresa
      ? `<img src="${escaparHtmlFicha(logoEmpresa)}" alt="Logo ${escaparHtmlFicha(nomeEmpresa)}" />`
      : `<div class="logo-fallback">${escaparHtmlFicha(
          String(nomeEmpresa || "M")
            .charAt(0)
            .toUpperCase(),
        )}</div>`;

    const empresaContatoHtml = [
      documentoEmpresa
        ? `<span><b>Documento</b>${escaparHtmlFicha(documentoEmpresa)}</span>`
        : "",
      telefoneEmpresa
        ? `<span><b>Contato</b>${escaparHtmlFicha(formatarWhatsapp(telefoneEmpresa) || telefoneEmpresa)}</span>`
        : "",
      emailEmpresa
        ? `<span><b>E-mail</b>${escaparHtmlFicha(emailEmpresa)}</span>`
        : "",
      enderecoEmpresa
        ? `<span class="full"><b>Endereço</b>${escaparHtmlFicha(enderecoEmpresa)}</span>`
        : "",
    ]
      .filter(Boolean)
      .join("");

    const agendamentoHtml = fichaDetalhada.agendamento
      ? `
        <section class="section compact-section">
          <div class="section-head">
            <span>Atendimento</span>
            <h2>Agendamento vinculado</h2>
          </div>
          <div class="info-grid three">
            <div><span>Serviço</span><strong>${escaparHtmlFicha(fichaDetalhada.agendamento?.servico?.nome || "Não informado")}</strong></div>
            <div><span>Profissional</span><strong>${escaparHtmlFicha(fichaDetalhada.agendamento?.profissional?.nome || "Não informado")}</strong></div>
            <div><span>Data e horário</span><strong>${escaparHtmlFicha(formatarDataHora(fichaDetalhada.agendamento?.dataHoraInicio))}</strong></div>
          </div>
        </section>
      `
      : "";

    const assinaturaHtml = campoAssinaturaCliente(fichaDetalhada)
      ? `
        <section class="section assinatura">
          <div class="signature-title">
            <span class="check">✓</span>
            <div>
              <small>Assinatura digital</small>
              <h2>Assinatura digital confirmada</h2>
            </div>
          </div>
          <p class="declaracao">
            Confirmo que as informações desta ficha foram preenchidas por mim e autorizo sua utilização como assinatura digital para este atendimento.
          </p>
          <div class="info-grid three">
            <div><span>Nome do cliente</span><strong>${escaparHtmlFicha(nomeAssinaturaFicha(fichaDetalhada))}</strong></div>
            <div><span>CPF</span><strong>${escaparHtmlFicha(cpfAssinaturaFicha(fichaDetalhada))}</strong></div>
            <div><span>Confirmada em</span><strong>${escaparHtmlFicha(textoAssinaturaFicha(fichaDetalhada))}</strong></div>
          </div>
          <div class="origem">Origem: Agendador Online Marcaê</div>
        </section>
      `
      : "";

    const profissionalHtml =
      camposProfissional.length > 0
        ? `
        <section class="section">
          <div class="section-head">
            <span>Profissional</span>
            <h2>Complemento profissional</h2>
          </div>
          <div class="respostas-grid">${camposProfissional.map(respostaHtml).join("")}</div>
        </section>
      `
        : "";

    return `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${escaparHtmlFicha(titulo)}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #ffffff;
              color: #111827;
              font-family: Inter, Arial, Helvetica, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            main {
              width: 100%;
              max-width: 794px;
              margin: 0 auto;
              background: #ffffff;
            }
            .top-strip {
              height: 8px;
              background: linear-gradient(90deg, #7c3aed, #06b6d4);
              border-radius: 999px;
              margin-bottom: 14px;
            }
            .empresa-header {
              display: grid;
              grid-template-columns: 58px minmax(0, 1fr) auto;
              gap: 14px;
              align-items: center;
              padding-bottom: 16px;
              border-bottom: 1px solid #e5e7eb;
            }
            .logo-box {
              width: 58px;
              height: 58px;
              border-radius: 16px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
              background: #f8fafc;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .logo-box img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
            .logo-fallback { font-size: 24px; font-weight: 900; color: #7c3aed; }
            .empresa h1 { margin: 0 0 5px; font-size: 20px; line-height: 1.15; }
            .empresa p { margin: 0; color: #64748b; font-size: 11px; }
            .empresa-info {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 5px 12px;
              margin-top: 8px;
            }
            .empresa-info span { color: #475569; font-size: 10.5px; line-height: 1.35; overflow-wrap: anywhere; }
            .empresa-info span.full { grid-column: 1 / -1; }
            .empresa-info b { display: block; color: #94a3b8; font-size: 9px; text-transform: uppercase; letter-spacing: .06em; }
            .document-badge {
              padding: 8px 11px;
              border-radius: 999px;
              background: #f5f3ff;
              color: #6d28d9;
              border: 1px solid #ddd6fe;
              font-size: 10.5px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: .08em;
              white-space: nowrap;
            }
            .document-title {
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
              gap: 14px;
              align-items: start;
              margin: 18px 0 14px;
            }
            .document-title h1 { margin: 0 0 7px; font-size: 25px; line-height: 1.08; }
            .document-title p { margin: 0; color: #475569; font-size: 12px; line-height: 1.55; }
            .status-chip {
              padding: 8px 12px;
              border-radius: 999px;
              background: #dcfce7;
              color: #166534;
              border: 1px solid #bbf7d0;
              font-size: 11px;
              font-weight: 900;
              white-space: nowrap;
            }
            .section {
              border: 1px solid #dbe3ef;
              border-radius: 16px;
              padding: 16px;
              margin-top: 13px;
              background: #ffffff;
              break-inside: avoid;
            }
            .compact-section { padding: 14px; }
            .section-head { margin-bottom: 12px; }
            .section-head span, .signature-title small {
              display: block;
              color: #7c3aed;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: .11em;
              margin-bottom: 4px;
            }
            .section-head h2, .signature-title h2 {
              margin: 0;
              font-size: 15px;
              color: #111827;
            }
            .info-grid { display: grid; gap: 8px; }
            .info-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .info-grid div {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 10px 11px;
              background: #f8fafc;
              min-width: 0;
            }
            .info-grid span {
              display: block;
              color: #64748b;
              font-size: 10px;
              font-weight: 900;
              margin-bottom: 4px;
            }
            .info-grid strong {
              display: block;
              color: #0f172a;
              font-size: 12.5px;
              line-height: 1.35;
              overflow-wrap: anywhere;
            }
            .respostas-grid { display: grid; gap: 8px; }
            .resposta {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 10px 11px;
              background: #f8fafc;
              break-inside: avoid;
            }
            .resposta-tipo {
              color: #64748b;
              font-size: 10px;
              font-weight: 900;
              margin-bottom: 3px;
            }
            .resposta h3 {
              margin: 0;
              font-size: 12.5px;
              color: #0f172a;
              line-height: 1.35;
            }
            .resposta p {
              margin: 7px 0 0;
              color: #111827;
              font-size: 12.5px;
              line-height: 1.45;
              white-space: pre-wrap;
            }
            .assinatura {
              border-color: #86efac;
              background: #f7fef9;
            }
            .signature-title {
              display: flex;
              gap: 10px;
              align-items: center;
              margin-bottom: 10px;
            }
            .check {
              width: 30px;
              height: 30px;
              border-radius: 999px;
              background: #16a34a;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              flex-shrink: 0;
            }
            .declaracao {
              margin: 0 0 12px;
              padding: 11px 12px;
              border-radius: 12px;
              background: #ecfdf5;
              color: #14532d;
              border: 1px solid #bbf7d0;
              font-size: 12.5px;
              line-height: 1.55;
            }
            .origem {
              margin-top: 9px;
              padding: 10px 11px;
              border-radius: 11px;
              background: #dcfce7;
              color: #166534;
              border: 1px solid #bbf7d0;
              font-weight: 900;
              font-size: 11.5px;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              margin-top: 14px;
              padding-top: 12px;
              border-top: 1px solid #e5e7eb;
              color: #64748b;
              font-size: 10.5px;
            }
            @media print {
              body { background: #ffffff; }
              main { max-width: 100%; }
              .section { break-inside: avoid; page-break-inside: avoid; }
            }
            @media (max-width: 760px) {
              .empresa-header, .document-title { grid-template-columns: 1fr; }
              .empresa-info, .info-grid.three { grid-template-columns: 1fr; }
              .document-badge { width: fit-content; }
            }
          </style>
        </head>
        <body>
          <main>
            <div class="top-strip"></div>

            <header class="empresa-header">
              <div class="logo-box">${logoHtml}</div>
              <div class="empresa">
                <h1>${escaparHtmlFicha(nomeEmpresa)}</h1>
                <p>Documento digital de atendimento gerado e armazenado no Marcaê.</p>
                <div class="empresa-info">${empresaContatoHtml}</div>
              </div>
              <div class="document-badge">Ficha digital</div>
            </header>

            <section class="document-title">
              <div>
                <h1>${escaparHtmlFicha(titulo)}</h1>
                <p>
                  Cliente: <strong>${escaparHtmlFicha(clienteNome)}</strong> · CPF: <strong>${escaparHtmlFicha(clienteCpf)}</strong><br />
                  Data da ficha: ${escaparHtmlFicha(formatarData(fichaDetalhada.createdAt))} · Gerado em: ${escaparHtmlFicha(dataGeracao)}
                </p>
              </div>
              <div class="status-chip">${escaparHtmlFicha(statusFichaTexto(fichaDetalhada))}</div>
            </section>

            ${agendamentoHtml}

            <section class="section">
              <div class="section-head">
                <span>Cliente</span>
                <h2>Respostas do cliente</h2>
              </div>
              <div class="respostas-grid">
                ${camposCliente.map(respostaHtml).join("") || "<p>Nenhuma pergunta para cliente.</p>"}
              </div>
            </section>

            ${assinaturaHtml}
            ${profissionalHtml}

            <footer class="footer">
              <span>Documento gerado pelo Marcaê</span>
              <span>${escaparHtmlFicha(nomeEmpresa)}</span>
            </footer>
          </main>
        </body>
      </html>
    `;
  }

  function imprimirFichaDetalhada() {
    if (!fichaDetalhada) return;

    const janela = window.open("", "_blank", "width=920,height=720");

    if (!janela) {
      alert(
        "Não foi possível abrir a impressão. Verifique o bloqueador de pop-ups.",
      );
      return;
    }

    janela.document.open();
    janela.document.write(montarHtmlFichaParaImpressao());
    janela.document.close();
    janela.focus();

    setTimeout(() => {
      janela.print();
    }, 350);
  }

  async function compartilharFichaDetalhada() {
    if (!fichaDetalhada) return;

    const titulo =
      fichaDetalhada.tituloSnapshot ||
      fichaDetalhada.modelo?.titulo ||
      "Ficha digital";
    const texto = montarTextoFichaParaCompartilhar();

    if (navigator.share) {
      try {
        await navigator.share({
          title: titulo,
          text: texto,
        });
        return;
      } catch (error) {}
    }

    imprimirFichaDetalhada();
  }

  function respostasDaFichaPorCampo(ficha: any) {
    const mapa = new Map<string, any>();

    (ficha?.respostas || []).forEach((resposta: any) => {
      if (resposta.campoId) {
        mapa.set(resposta.campoId, resposta);
      }
    });

    return mapa;
  }

  function camposDaFichaPorRespondente(
    ficha: any,
    respondidoPor: "cliente" | "profissional",
  ) {
    const campos = Array.isArray(ficha?.modelo?.campos)
      ? ficha.modelo.campos
      : [];

    return campos.filter(
      (campo: any) =>
        campo.ativo !== false &&
        (campo.respondidoPor || "cliente") === respondidoPor,
    );
  }

  async function abrirVisualizarFicha(ficha: any) {
    if (!empresa?.id || !ficha?.id) return;

    setDrawerVisualizarFichaAberto(true);
    setFichaDetalhada(null);
    setRespostasProfissionalFicha({});
    setCarregandoFichaDetalhada(true);

    try {
      const res = await fetch(
        `/api/fichas-digitais/registros?empresaId=${empresa.id}&id=${ficha.id}`,
        { cache: "no-store" },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Erro ao carregar ficha digital.");
        fecharDrawerVisualizarFicha();
        return;
      }

      const registro = data.registro;
      const respostasPorCampo = respostasDaFichaPorCampo(registro);
      const camposProfissional = camposDaFichaPorRespondente(
        registro,
        "profissional",
      );
      const respostasIniciais: Record<string, any> = {};

      camposProfissional.forEach((campo: any) => {
        const resposta = respostasPorCampo.get(campo.id);
        const valor = obterValorRespostaFicha(resposta);

        if (campo.tipo === "multiselecao") {
          respostasIniciais[campo.id] = Array.isArray(valor) ? valor : [];
        } else if (campo.tipo === "termo_lgpd") {
          respostasIniciais[campo.id] =
            String(valor).toLowerCase() === "aceito" || valor === true;
        } else {
          respostasIniciais[campo.id] = valor || "";
        }
      });

      setFichaDetalhada(registro);
      setRespostasProfissionalFicha(respostasIniciais);
    } catch (error) {
      alert("Erro ao carregar ficha digital.");
      fecharDrawerVisualizarFicha();
    } finally {
      setCarregandoFichaDetalhada(false);
    }
  }

  function atualizarRespostaProfissionalFicha(campoId: string, valor: any) {
    setRespostasProfissionalFicha((atual) => ({
      ...atual,
      [campoId]: valor,
    }));
  }

  function renderCampoFichaProfissional(campo: any) {
    const valor = respostasProfissionalFicha[campo.id] ?? "";
    const opcoes = opcoesCampoFicha(campo);

    if (campo.tipo === "textarea") {
      return (
        <textarea
          value={valor}
          onChange={(e) =>
            atualizarRespostaProfissionalFicha(campo.id, e.target.value)
          }
          placeholder={campo.placeholder || "Digite a resposta"}
          style={textareaFicha}
        />
      );
    }

    if (campo.tipo === "numero") {
      return (
        <input
          type="number"
          value={valor}
          onChange={(e) =>
            atualizarRespostaProfissionalFicha(campo.id, e.target.value)
          }
          placeholder={campo.placeholder || "0"}
          style={input}
        />
      );
    }

    if (campo.tipo === "data") {
      return (
        <input
          type="date"
          value={valor}
          onChange={(e) =>
            atualizarRespostaProfissionalFicha(campo.id, e.target.value)
          }
          style={input}
        />
      );
    }

    if (campo.tipo === "sim_nao") {
      return (
        <select
          value={valor}
          onChange={(e) =>
            atualizarRespostaProfissionalFicha(campo.id, e.target.value)
          }
          style={input}
        >
          <option value="">Selecione</option>
          <option value="Sim">Sim</option>
          <option value="Não">Não</option>
        </select>
      );
    }

    if (campo.tipo === "selecao") {
      return (
        <select
          value={valor}
          onChange={(e) =>
            atualizarRespostaProfissionalFicha(campo.id, e.target.value)
          }
          style={input}
        >
          <option value="">Selecione</option>
          {opcoes.map((opcao: string) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      );
    }

    if (campo.tipo === "multiselecao") {
      const valores = Array.isArray(respostasProfissionalFicha[campo.id])
        ? respostasProfissionalFicha[campo.id]
        : [];

      return (
        <div style={opcoesChecklist}>
          {opcoes.map((opcao: string) => (
            <label key={opcao} style={checkLinhaFicha}>
              <input
                type="checkbox"
                checked={valores.includes(opcao)}
                onChange={(e) => {
                  const novosValores = e.target.checked
                    ? [...valores, opcao]
                    : valores.filter((item: string) => item !== opcao);

                  atualizarRespostaProfissionalFicha(campo.id, novosValores);
                }}
              />
              <span>{opcao}</span>
            </label>
          ))}
        </div>
      );
    }

    if (campo.tipo === "foto") {
      return (
        <input
          value={valor}
          onChange={(e) =>
            atualizarRespostaProfissionalFicha(campo.id, e.target.value)
          }
          placeholder="Cole aqui a URL da foto nesta fase"
          style={input}
        />
      );
    }

    if (campo.tipo === "termo_lgpd") {
      return (
        <label style={lgpdBox}>
          <input
            type="checkbox"
            checked={Boolean(respostasProfissionalFicha[campo.id])}
            onChange={(e) =>
              atualizarRespostaProfissionalFicha(campo.id, e.target.checked)
            }
          />
          <span>Confirmo esta informação internamente.</span>
        </label>
      );
    }

    return (
      <input
        value={valor}
        onChange={(e) =>
          atualizarRespostaProfissionalFicha(campo.id, e.target.value)
        }
        placeholder={campo.placeholder || "Digite a resposta"}
        style={input}
      />
    );
  }

  async function salvarComplementoProfissionalFicha() {
    if (!empresa?.id || !fichaDetalhada?.id) return;

    const camposCliente = camposDaFichaPorRespondente(
      fichaDetalhada,
      "cliente",
    );
    const camposProfissional = camposDaFichaPorRespondente(
      fichaDetalhada,
      "profissional",
    );

    const pendente = camposProfissional.find((campo: any) => {
      if (!campo.obrigatorio) return false;
      return respostaEstaVazia(respostasProfissionalFicha[campo.id]);
    });

    if (pendente) {
      alert(`Responda o campo obrigatório: ${pendente.titulo}`);
      return;
    }

    try {
      setSalvandoComplementoFicha(true);

      const respostasPorCampo = respostasDaFichaPorCampo(fichaDetalhada);
      const respostasCliente = camposCliente
        .map((campo: any, index: number) => {
          const respostaExistente = respostasPorCampo.get(campo.id);
          if (!respostaExistente) return null;

          return montarRespostaFichaComValor(
            campo,
            obterValorRespostaFicha(respostaExistente),
            index,
          );
        })
        .filter(Boolean);

      const respostasProfissional = camposProfissional.map(
        (campo: any, index: number) =>
          montarRespostaFichaComValor(
            campo,
            respostasProfissionalFicha[campo.id],
            camposCliente.length + index,
          ),
      );

      const res = await fetch("/api/fichas-digitais/registros", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: fichaDetalhada.id,
          empresaId: empresa.id,
          status: "preenchida",
          preenchidoPorTipo: "usuario",
          preenchidoPorNome: usuario?.nome || null,
          preenchidoPorUsuarioId: usuario?.id || null,
          respostas: [...respostasCliente, ...respostasProfissional],
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Erro ao salvar complemento profissional.");
        return;
      }

      setFichaDetalhada(data.registro);
      setFichasCliente((atual) =>
        atual.map((ficha) =>
          ficha.id === data.registro.id ? data.registro : ficha,
        ),
      );
      alert("Ficha atualizada com sucesso!");
    } catch (error) {
      alert("Erro ao salvar complemento profissional.");
    } finally {
      setSalvandoComplementoFicha(false);
    }
  }

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const termoNumerico = somenteNumeros(busca);

    if (!termo && !termoNumerico) return clientes;

    return clientes.filter((cliente) => {
      const nome = String(cliente.nome || "").toLowerCase();
      const whatsapp = somenteNumeros(cliente.whatsapp || "");
      const cpf = somenteNumeros(cliente.cpf || "");
      const nascimentoFormatado = formatarData(
        cliente.dataNascimento,
      ).toLowerCase();
      const nascimentoNumerico = somenteNumeros(nascimentoFormatado);
      const nascimentoIso = String(cliente.dataNascimento || "").toLowerCase();

      return (
        nome.includes(termo) ||
        whatsapp.includes(termoNumerico) ||
        cpf.includes(termoNumerico) ||
        nascimentoFormatado.includes(termo) ||
        nascimentoIso.includes(termo) ||
        (termoNumerico.length > 0 && nascimentoNumerico.includes(termoNumerico))
      );
    });
  }, [busca, clientes]);

  const corPrimaria = empresa?.corSidebar || empresa?.corPrimaria || "#7c3aed";
  const corSecundaria = empresa?.corSecundaria || "#06b6d4";

  const metricas = useMemo(() => {
    const totalClientes = clientes.length;
    const comCpf = clientes.filter(
      (cliente) => somenteNumeros(cliente.cpf || "").length === 11,
    ).length;
    const comNascimento = clientes.filter(
      (cliente) => !!cliente.dataNascimento,
    ).length;
    const encontrados = clientesFiltrados.length;
    const creditoTotal = clientes.reduce(
      (total, cliente) => total + valorNumerico(cliente.financeiro?.credito),
      0,
    );
    const debitoTotal = clientes.reduce(
      (total, cliente) => total + valorNumerico(cliente.financeiro?.debito),
      0,
    );

    return {
      totalClientes,
      encontrados,
      comCpf,
      comNascimento,
      creditoTotal,
      debitoTotal,
    };
  }, [clientes, clientesFiltrados]);

  if (!empresa) {
    return (
      <main style={loadingPage}>
        <div style={loadingCard}>
          <div style={loadingIcon}>👤</div>
          <strong>Carregando clientes...</strong>
          <span>Preparando seu CRM premium.</span>
        </div>
      </main>
    );
  }

  return (
    <PremiumLayout empresa={empresa} usuario={usuario}>
      <main
        className="clientes-page-mobile-safe"
        style={{
          ...page,
          background: `
            radial-gradient(circle at top left, ${hexToRgba(corPrimaria, 0.22)}, transparent 34%),
            radial-gradient(circle at top right, ${hexToRgba(corSecundaria, 0.18)}, transparent 32%),
            linear-gradient(135deg, #020617 0%, #0f172a 46%, #111827 100%)
          `,
        }}
      >
        <style jsx global>{`
          html,
          body {
            max-width: 100%;
            overflow-x: hidden;
          }

          .clientes-page-mobile-safe,
          .clientes-page-mobile-safe * {
            box-sizing: border-box;
          }

          .clientes-page-mobile-safe {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }

          @media (max-width: 1180px) {
            .clientes-page-mobile-safe {
              padding: 18px !important;
              padding-bottom: 120px !important;
            }

            .clientes-container-mobile {
              max-width: 100% !important;
              width: 100% !important;
            }

            .clientes-module-top-mobile,
            .clientes-header-mobile,
            .clientes-crm-dashboard-mobile,
            .clientes-form-card-mobile,
            .clientes-side-card-mobile,
            .clientes-lista-card-mobile {
              width: 100% !important;
              max-width: 100% !important;
            }

            .clientes-main-grid-mobile {
              grid-template-columns: 1fr !important;
            }

            .clientes-side-card-mobile {
              position: relative !important;
              top: auto !important;
            }

            .clientes-metricas-mobile {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              overflow-x: hidden !important;
              gap: 10px !important;
              padding-bottom: 0 !important;
            }

            .clientes-metricas-mobile > * {
              min-width: 0 !important;
            }

            .clientes-metricas-mobile > div {
              padding: 12px !important;
              border-radius: 18px !important;
              gap: 10px !important;
              min-height: 92px !important;
            }

            .clientes-metricas-mobile > div > div:first-child {
              width: 36px !important;
              height: 36px !important;
              border-radius: 13px !important;
              font-size: 17px !important;
            }

            .clientes-metricas-mobile small {
              display: none !important;
            }

            .clientes-grid-mobile {
              display: flex !important;
              overflow-x: auto !important;
              overflow-y: hidden !important;
              gap: 12px !important;
              padding: 2px 4px 12px !important;
              scroll-snap-type: x mandatory !important;
              -webkit-overflow-scrolling: touch !important;
            }
          }

          @media (max-width: 760px) {
            .clientes-page-mobile-safe {
              padding: 14px !important;
              padding-bottom: 126px !important;
            }

            .clientes-module-top-mobile {
              padding: 13px 14px !important;
              border-radius: 20px !important;
              margin-bottom: 12px !important;
            }

            .clientes-header-mobile {
              padding: 12px !important;
              border-radius: 20px !important;
              display: grid !important;
              gap: 10px !important;
              margin-bottom: 12px !important;
            }

            .clientes-header-conteudo-mobile {
              display: grid !important;
              grid-template-columns: 42px minmax(0, 1fr) !important;
              gap: 10px !important;
              align-items: start !important;
              width: 100% !important;
              min-width: 0 !important;
            }

            .clientes-logo-mobile {
              width: 42px !important;
              height: 42px !important;
              border-radius: 14px !important;
              font-size: 18px !important;
            }

            .clientes-header-mobile h1 {
              font-size: 22px !important;
              line-height: 1.05 !important;
            }

            .clientes-header-mobile p {
              display: none !important;
            }

            .clientes-header-painel-mobile {
              width: 100% !important;
              min-width: 0 !important;
              padding: 12px 14px !important;
              border-radius: 18px !important;
              display: grid !important;
              grid-template-columns: minmax(0, 1fr) auto !important;
              align-items: center !important;
              gap: 6px 12px !important;
            }

            .clientes-header-painel-mobile strong {
              grid-row: 1 / span 2 !important;
              grid-column: 2 !important;
              font-size: 34px !important;
            }

            .clientes-crm-dashboard-mobile,
            .clientes-form-card-mobile,
            .clientes-side-card-mobile,
            .clientes-lista-card-mobile {
              padding: 12px !important;
              border-radius: 22px !important;
            }

            .clientes-form-card-mobile {
              margin-bottom: 12px !important;
            }

            .clientes-crm-dashboard-mobile > div:first-child {
              display: grid !important;
              grid-template-columns: 1fr !important;
            }

            .clientes-crm-dashboard-mobile > div:nth-child(2) {
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 8px !important;
            }

            .clientes-crm-dashboard-mobile {
              margin-bottom: 10px !important;
            }

            .clientes-grid-form-mobile,
            .clientes-grid-form-modal-mobile,
            .clientes-financeiro-grid-mobile,
            .clientes-lancamento-grid-mobile {
              grid-template-columns: 1fr !important;
            }

            .clientes-lista-header-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 12px !important;
              align-items: stretch !important;
            }

            .clientes-busca-mobile {
              max-width: 100% !important;
              width: 100% !important;
            }

            .clientes-grid-mobile {
              display: flex !important;
              overflow-x: auto !important;
              overflow-y: hidden !important;
              gap: 12px !important;
              padding: 2px 4px 12px !important;
              scroll-snap-type: x mandatory !important;
              -webkit-overflow-scrolling: touch !important;
            }

            .cliente-card-mobile {
              padding: 12px !important;
              border-radius: 18px !important;
              flex: 0 0 80vw !important;
              width: 80vw !important;
              max-width: 318px !important;
              min-width: 270px !important;
              overflow: hidden !important;
              scroll-snap-align: start !important;
            }

            .cliente-topo-mobile {
              display: grid !important;
              grid-template-columns: 44px minmax(0, 1fr) !important;
              gap: 10px !important;
              min-width: 0 !important;
              margin-bottom: 12px !important;
            }

            .cliente-topo-mobile > div:first-child {
              width: 44px !important;
              height: 44px !important;
              border-radius: 14px !important;
              font-size: 18px !important;
            }

            .cliente-topo-mobile > div:last-child {
              min-width: 0 !important;
            }

            .cliente-topo-mobile strong,
            .cliente-topo-mobile span {
              overflow-wrap: anywhere !important;
              word-break: break-word !important;
            }

            .cliente-mini-grid-mobile {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 8px !important;
              margin-bottom: 10px !important;
              padding-bottom: 0 !important;
            }

            .cliente-mini-grid-mobile > div {
              min-width: 0 !important;
              min-height: 64px !important;
              padding: 9px 10px !important;
              border-radius: 13px !important;
            }

            .cliente-mini-grid-mobile span,
            .cliente-mini-grid-mobile strong {
              white-space: normal !important;
              word-break: normal !important;
              overflow-wrap: normal !important;
            }

            .cliente-botoes-mobile {
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 8px !important;
            }

            .cliente-botoes-mobile button {
              width: 100% !important;
              min-height: 40px !important;
              padding: 10px 8px !important;
              font-size: 12px !important;
              border-radius: 14px !important;
            }

            .clientes-modal-overlay-mobile {
              align-items: stretch !important;
              padding: 0 !important;
            }

            .clientes-modal-box-mobile,
            .clientes-modal-historico-mobile {
              width: 100vw !important;
              max-width: 100vw !important;
              height: 100vh !important;
              max-height: 100vh !important;
              border-radius: 0 !important;
              padding: 16px !important;
              overflow-x: hidden !important;
            }

            .clientes-modal-header-mobile {
              position: sticky !important;
              top: 0 !important;
              z-index: 5 !important;
              background: rgba(2, 6, 23, 0.96) !important;
              backdrop-filter: blur(18px) !important;
              margin: -16px -16px 16px !important;
              padding: 16px !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
              align-items: flex-start !important;
            }

            .clientes-modal-actions-mobile,
            .clientes-financeiro-acoes-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
              width: 100% !important;
            }

            .clientes-modal-actions-mobile button,
            .clientes-financeiro-acoes-mobile button {
              width: 100% !important;
            }

            .clientes-financeiro-header-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
            }

            .clientes-historico-topo-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
              text-align: left !important;
            }

            .clientes-historico-topo-mobile > div:last-child {
              text-align: left !important;
            }

            .clientes-financeiro-cards-mobile {
              grid-template-columns: 1fr !important;
            }

            .clientes-resumo-financeiro-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 6px !important;
            }

            .clientes-movimentacao-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
            }

            .clientes-abas-modal-mobile {
              overflow-x: auto !important;
              flex-wrap: nowrap !important;
              padding-bottom: 4px !important;
            }

            .clientes-abas-modal-mobile button {
              flex: 0 0 auto !important;
              white-space: nowrap !important;
            }

            .clientes-dados-grid-mobile,
            .clientes-fichas-grid-mobile {
              grid-template-columns: 1fr !important;
            }

            .clientes-drawer-ficha-mobile {
              width: 100vw !important;
              max-width: 100vw !important;
              height: 100vh !important;
              max-height: 100vh !important;
              border-radius: 0 !important;
              padding: 16px !important;
            }
          }

          @media (max-width: 430px) {
            .clientes-metricas-mobile > * {
              min-width: 0 !important;
            }

            .cliente-card-mobile {
              flex-basis: 84vw !important;
              width: 84vw !important;
              min-width: 272px !important;
            }
          }
        `}</style>

        <div className="clientes-container-mobile" style={container}>
          <section className="clientes-module-top-mobile" style={moduleTopBar}>
            <div style={moduleTopLeft}>
              <div
                style={{
                  ...moduleTopIcon,
                  background: `linear-gradient(135deg, ${hexToRgba(corPrimaria, 0.98)}, ${hexToRgba(
                    corSecundaria,
                    0.72,
                  )})`,
                  boxShadow: `0 14px 32px ${hexToRgba(corPrimaria, 0.24)}`,
                }}
              >
                👥
              </div>

              <div style={{ minWidth: 0 }}>
                <h1 style={moduleTopTitle}>Clientes</h1>
                <p style={moduleTopSubtitle}>CRM, histórico e relacionamento</p>
              </div>
            </div>

            <div style={moduleTopBadge}>{metricas.totalClientes} na base</div>
          </section>
          <section
            className="clientes-crm-dashboard-mobile"
            style={crmDashboardCard}
          >
            <div style={crmDashboardHeader}>
              <div style={sideCompactHeader}>
                <div style={sideIcon}>💎</div>
                <div>
                  <span style={sectionEyebrow}>CRM inteligente</span>
                  <h2 style={sectionTitle}>Resumo do cliente</h2>
                  <p style={sideText}>
                    Base, relacionamento e saldo em uma visão compacta.
                  </p>
                </div>
              </div>

              <div style={crmDashboardTotalBox}>
                <span>Clientes</span>
                <strong>{metricas.totalClientes}</strong>
              </div>
            </div>

            <div style={crmDashboardStats}>
              <div style={sideStatItem}>
                <span>Com CPF</span>
                <strong>{metricas.comCpf}</strong>
              </div>

              <div style={sideStatItem}>
                <span>Aniversários</span>
                <strong>{metricas.comNascimento}</strong>
              </div>

              <div style={sideStatItem}>
                <span>Saldo geral</span>
                <strong>
                  {dinheiro(metricas.creditoTotal - metricas.debitoTotal)}
                </strong>
              </div>
            </div>

            <div style={insightCompactBox}>
              💡 CPF e aniversário melhoram reagendamento, campanhas e histórico
              do cliente.
            </div>
          </section>

          <section
            className="clientes-form-card-mobile"
            style={novoClienteCompactCard}
          >
            <div style={novoClienteCompactInfo}>
              <span style={novoClienteIcon}>+</span>
              <div style={{ minWidth: 0 }}>
                <h2 style={novoClienteTitulo}>Novo cliente</h2>
                <p style={novoClienteTexto}>
                  Cadastre rápido sem sair da lista.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFormCadastroAberto(true)}
              aria-label="Abrir cadastro de cliente"
              style={{
                ...botaoNovoCliente,
                background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                boxShadow: `0 14px 34px ${hexToRgba(corPrimaria, 0.24)}`,
              }}
            >
              Cadastrar
            </button>
          </section>

          <section className="clientes-lista-card-mobile" style={listaCard}>
            <div className="clientes-lista-header-mobile" style={listaHeader}>
              <div>
                <div style={listaTitleRow}>
                  <h2 style={sectionTitle}>Lista de clientes</h2>
                  <span style={listaContador}>
                    {metricas.encontrados} encontrados
                  </span>
                </div>
                <p style={sectionDescription}>
                  Busque e acesse histórico, saldo e novo agendamento.
                </p>
              </div>

              <div className="clientes-busca-mobile" style={buscaArea}>
                <span style={buscaIcon}>🔎</span>
                <input
                  value={busca || ""}
                  onChange={(e) => setBusca(e.target.value || "")}
                  placeholder="Buscar cliente"
                  style={inputBusca}
                />
              </div>
            </div>

            {carregando ? (
              <div style={emptyState}>
                <div style={emptyIcon}>⏳</div>
                <strong>Carregando clientes...</strong>
                <span>Buscando sua base de relacionamento.</span>
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div style={emptyState}>
                <div style={emptyIcon}>👤</div>
                <strong>Nenhum cliente encontrado</strong>
                <span>
                  Tente outro termo ou cadastre um novo cliente acima.
                </span>
              </div>
            ) : (
              <div className="clientes-grid-mobile" style={clientesGrid}>
                {clientesFiltrados.map((cliente) => (
                  <article
                    key={cliente.id}
                    className="cliente-card-mobile"
                    style={clienteCard}
                  >
                    <div
                      style={{
                        ...clienteGlow,
                        background: `radial-gradient(circle, ${hexToRgba(
                          corPrimaria,
                          0.22,
                        )}, transparent 72%)`,
                      }}
                    />

                    <div className="cliente-topo-mobile" style={clienteTopo}>
                      <div
                        style={{
                          ...avatar,
                          background: `linear-gradient(135deg, ${hexToRgba(
                            corPrimaria,
                            0.95,
                          )}, ${hexToRgba(corSecundaria, 0.72)})`,
                        }}
                      >
                        {String(cliente.nome || "C")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={clienteNomeLinha}>
                          <strong style={clienteNome}>{cliente.nome}</strong>
                          <span
                            style={{
                              ...clienteSaldoBadge,
                              color: corSaldoFinanceiro(
                                valorNumerico(cliente.financeiro?.saldo),
                              ),
                            }}
                          >
                            {dinheiro(valorNumerico(cliente.financeiro?.saldo))}
                          </span>
                        </div>

                        <div style={clienteInfo}>
                          <span>
                            📲{" "}
                            {formatarWhatsapp(cliente.whatsapp || "") ||
                              "WhatsApp não informado"}
                          </span>
                          <span>🎂 {formatarData(cliente.dataNascimento)}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="cliente-mini-grid-mobile"
                      style={clienteMiniGrid}
                    >
                      <div style={clienteMiniCard}>
                        <span>Último atendimento</span>
                        <strong>{textoUltimoAtendimento(cliente)}</strong>
                      </div>

                      <div style={clienteMiniCard}>
                        <span>Atendimentos</span>
                        <strong>{totalAtendimentosCliente(cliente)}</strong>
                      </div>
                    </div>

                    <div
                      className="cliente-botoes-mobile"
                      style={botoesCliente}
                    >
                      <button
                        onClick={() => abrirEditar(cliente)}
                        style={botaoEditar}
                      >
                        ✏️ Editar
                      </button>

                      <button
                        onClick={() => abrirHistorico(cliente)}
                        style={botaoHistorico}
                      >
                        📋 Histórico
                      </button>

                      <button
                        onClick={() => iniciarAgendamento(cliente)}
                        style={{
                          ...botaoAgendar,
                          background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                        }}
                      >
                        📅 Agendar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {formCadastroAberto && (
          <div className="clientes-modal-overlay-mobile" style={modalOverlay}>
            <div className="clientes-modal-box-mobile" style={modalBox}>
              <div className="clientes-modal-header-mobile" style={modalHeader}>
                <div>
                  <h2 style={modalTitle}>Cadastrar cliente</h2>
                  <p style={modalSubtitle}>
                    Adicione nome, WhatsApp, CPF e aniversário em uma tela
                    rápida.
                  </p>
                </div>

                <button
                  onClick={() => setFormCadastroAberto(false)}
                  style={botaoFechar}
                >
                  ×
                </button>
              </div>

              <div
                className="clientes-grid-form-modal-mobile"
                style={gridFormularioModal}
              >
                <Campo
                  label="Nome completo"
                  placeholder="Ex: Maria Silva"
                  value={form.nome}
                  onChange={(value: string) =>
                    setForm({ ...form, nome: value })
                  }
                />

                <Campo
                  label="WhatsApp"
                  placeholder="(00) 00000-0000"
                  value={form.whatsapp}
                  onChange={(value: string) =>
                    setForm({ ...form, whatsapp: formatarWhatsapp(value) })
                  }
                />

                <Campo
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={(value: string) =>
                    setForm({ ...form, cpf: formatarCpf(value) })
                  }
                />

                <div>
                  <label style={label}>Data de nascimento</label>
                  <input
                    type="date"
                    value={form.dataNascimento}
                    onChange={(e) =>
                      setForm({ ...form, dataNascimento: e.target.value })
                    }
                    style={input}
                  />
                </div>
              </div>

              <div
                className="clientes-modal-actions-mobile"
                style={modalActions}
              >
                <button
                  onClick={() => setFormCadastroAberto(false)}
                  style={botaoCancelar}
                >
                  Cancelar
                </button>

                <button
                  onClick={salvarCliente}
                  disabled={salvando}
                  style={{
                    ...botaoSalvarModal,
                    background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                    opacity: salvando ? 0.7 : 1,
                  }}
                >
                  {salvando ? "Salvando..." : "Salvar cliente"}
                </button>
              </div>
            </div>
          </div>
        )}

        {modalEditarAberto && (
          <div className="clientes-modal-overlay-mobile" style={modalOverlay}>
            <div className="clientes-modal-box-mobile" style={modalBox}>
              <div className="clientes-modal-header-mobile" style={modalHeader}>
                <div>
                  <h2 style={modalTitle}>Editar cliente</h2>
                  <p style={modalSubtitle}>
                    Atualize os dados do cliente sem perder o histórico.
                  </p>
                </div>

                <button onClick={fecharEditar} style={botaoFechar}>
                  ×
                </button>
              </div>

              <div
                className="clientes-grid-form-modal-mobile"
                style={gridFormularioModal}
              >
                <Campo
                  label="Nome completo"
                  placeholder="Nome do cliente"
                  value={formEdicao.nome}
                  onChange={(value: string) =>
                    setFormEdicao({ ...formEdicao, nome: value })
                  }
                />

                <Campo
                  label="WhatsApp"
                  placeholder="(00) 00000-0000"
                  value={formEdicao.whatsapp}
                  onChange={(value: string) =>
                    setFormEdicao({
                      ...formEdicao,
                      whatsapp: formatarWhatsapp(value),
                    })
                  }
                />

                <Campo
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={formEdicao.cpf}
                  onChange={(value: string) =>
                    setFormEdicao({
                      ...formEdicao,
                      cpf: formatarCpf(value),
                    })
                  }
                />

                <div>
                  <label style={label}>Data de nascimento</label>
                  <input
                    type="date"
                    value={formEdicao.dataNascimento}
                    onChange={(e) =>
                      setFormEdicao({
                        ...formEdicao,
                        dataNascimento: e.target.value,
                      })
                    }
                    style={input}
                  />
                </div>
              </div>

              <div
                className="clientes-modal-actions-mobile"
                style={modalActions}
              >
                <button onClick={fecharEditar} style={botaoCancelar}>
                  Cancelar
                </button>

                <button
                  onClick={salvarEdicaoCliente}
                  disabled={salvandoEdicao}
                  style={{
                    ...botaoSalvarModal,
                    background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                  }}
                >
                  {salvandoEdicao ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          </div>
        )}

        {modalHistoricoAberto && (
          <div className="clientes-modal-overlay-mobile" style={modalOverlay}>
            <div
              className="clientes-modal-historico-mobile"
              style={modalHistorico}
            >
              <div className="clientes-modal-header-mobile" style={modalHeader}>
                <div>
                  <h2 style={modalTitle}>Cliente</h2>

                  <p style={modalSubtitle}>
                    {clienteSelecionado?.nome} ·{" "}
                    {formatarWhatsapp(clienteSelecionado?.whatsapp || "")}
                  </p>
                </div>

                <button onClick={fecharHistorico} style={botaoFechar}>
                  ×
                </button>
              </div>

              <div
                className="clientes-abas-modal-mobile"
                style={abasClienteLinha}
              >
                <button
                  type="button"
                  onClick={() => setAbaCliente("dados")}
                  style={{
                    ...abaClienteBotao,
                    background:
                      abaCliente === "dados"
                        ? "rgba(124,58,237,0.22)"
                        : "rgba(255,255,255,0.04)",
                    color: abaCliente === "dados" ? "#ddd6fe" : "#94a3b8",
                  }}
                >
                  Dados
                </button>

                <button
                  type="button"
                  onClick={() => setAbaCliente("historico")}
                  style={{
                    ...abaClienteBotao,
                    background:
                      abaCliente === "historico"
                        ? "rgba(56,189,248,0.16)"
                        : "rgba(255,255,255,0.04)",
                    color: abaCliente === "historico" ? "#bae6fd" : "#94a3b8",
                  }}
                >
                  Histórico
                </button>

                <button
                  type="button"
                  onClick={() => setAbaCliente("financeiro")}
                  style={{
                    ...abaClienteBotao,
                    background:
                      abaCliente === "financeiro"
                        ? "rgba(34,197,94,0.14)"
                        : "rgba(255,255,255,0.04)",
                    color: abaCliente === "financeiro" ? "#bbf7d0" : "#94a3b8",
                  }}
                >
                  Financeiro
                </button>

                <button
                  type="button"
                  onClick={() => setAbaCliente("fichas")}
                  style={{
                    ...abaClienteBotao,
                    background:
                      abaCliente === "fichas"
                        ? "rgba(245,158,11,0.16)"
                        : "rgba(255,255,255,0.04)",
                    color: abaCliente === "fichas" ? "#fde68a" : "#94a3b8",
                  }}
                >
                  Fichas Digitais
                </button>
              </div>

              {abaCliente === "dados" && (
                <section style={abaConteudoBox}>
                  <div style={abaSecaoHeader}>
                    <div>
                      <span style={sectionEyebrow}>Resumo CRM</span>
                      <h3 style={clienteFinanceiroTitulo}>Dados do cliente</h3>
                      <p style={modalSubtitle}>
                        Informações principais para atendimento, relacionamento
                        e histórico.
                      </p>
                    </div>

                    <button
                      onClick={() => abrirEditar(clienteSelecionado)}
                      style={botaoCancelar}
                    >
                      ✏️ Editar dados
                    </button>
                  </div>

                  <div
                    className="clientes-dados-grid-mobile"
                    style={dadosClienteGrid}
                  >
                    <div style={dadosClienteCard}>
                      <span>Nome</span>
                      <strong>
                        {clienteSelecionado?.nome || "Não informado"}
                      </strong>
                    </div>

                    <div style={dadosClienteCard}>
                      <span>WhatsApp</span>
                      <strong>
                        {formatarWhatsapp(clienteSelecionado?.whatsapp || "") ||
                          "Não informado"}
                      </strong>
                    </div>

                    <div style={dadosClienteCard}>
                      <span>CPF</span>
                      <strong>
                        {formatarCpf(clienteSelecionado?.cpf || "") ||
                          "Não informado"}
                      </strong>
                    </div>

                    <div style={dadosClienteCard}>
                      <span>Nascimento</span>
                      <strong>
                        {formatarData(clienteSelecionado?.dataNascimento)}
                      </strong>
                    </div>

                    <div style={dadosClienteCard}>
                      <span>Atendimentos</span>
                      <strong>
                        {totalAtendimentosCliente(clienteSelecionado)}
                      </strong>
                    </div>

                    <div style={dadosClienteCard}>
                      <span>Último atendimento</span>
                      <strong>
                        {textoUltimoAtendimento(clienteSelecionado)}
                      </strong>
                    </div>
                  </div>
                </section>
              )}

              {abaCliente === "financeiro" && (
                <section style={clienteFinanceiroResumoBox}>
                  <div
                    className="clientes-financeiro-header-mobile"
                    style={clienteFinanceiroResumoHeader}
                  >
                    <div>
                      <span style={sectionEyebrow}>Conta financeira</span>
                      <h3 style={clienteFinanceiroTitulo}>
                        Créditos e débitos do cliente
                      </h3>
                      <p style={modalSubtitle}>
                        Controle valores a favor do cliente, pendências e
                        compensações internas.
                      </p>
                    </div>

                    <div
                      className="clientes-financeiro-acoes-mobile"
                      style={clienteFinanceiroAcoes}
                    >
                      <button
                        onClick={() => abrirLancamentoFinanceiro("credito")}
                        style={{
                          ...botaoCredito,
                          background: "rgba(34,197,94,0.16)",
                          color: "#bbf7d0",
                        }}
                      >
                        + Lançar crédito
                      </button>

                      <button
                        onClick={() => abrirLancamentoFinanceiro("debito")}
                        style={{
                          ...botaoCredito,
                          background: "rgba(239,68,68,0.16)",
                          color: "#fecaca",
                        }}
                      >
                        + Lançar débito
                      </button>
                    </div>
                  </div>

                  <div
                    className="clientes-financeiro-grid-mobile"
                    style={financeiroClienteGrid}
                  >
                    <ResumoFinanceiro
                      label="Crédito ativo"
                      valor={dinheiro(financeiroCliente.credito)}
                    />
                    <ResumoFinanceiro
                      label="Débito aberto"
                      valor={dinheiro(financeiroCliente.debito)}
                    />
                    <ResumoFinanceiro
                      label="Saldo final"
                      valor={dinheiro(financeiroCliente.saldo)}
                    />
                  </div>

                  {modalLancamentoFinanceiroAberto && (
                    <div
                      className="clientes-lancamento-grid-mobile"
                      style={lancamentoFinanceiroBox}
                    >
                      <div>
                        <label style={labelStyle}>Tipo</label>
                        <select
                          value={formLancamentoFinanceiro.tipo}
                          onChange={(e) =>
                            setFormLancamentoFinanceiro({
                              ...formLancamentoFinanceiro,
                              tipo: e.target.value,
                            })
                          }
                          style={input}
                        >
                          <option value="credito">
                            Crédito para o cliente
                          </option>
                          <option value="debito">Débito do cliente</option>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Valor</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          value={formLancamentoFinanceiro.valor}
                          onChange={(e) =>
                            setFormLancamentoFinanceiro({
                              ...formLancamentoFinanceiro,
                              valor: e.target.value,
                            })
                          }
                          style={input}
                        />
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>Observação</label>
                        <textarea
                          value={formLancamentoFinanceiro.observacao}
                          onChange={(e) =>
                            setFormLancamentoFinanceiro({
                              ...formLancamentoFinanceiro,
                              observacao: e.target.value,
                            })
                          }
                          placeholder="Ex: Crédito gerado por ajuste interno / débito de valor pendente."
                          style={textareaFinanceiroCliente}
                        />
                      </div>

                      <div
                        className="clientes-modal-actions-mobile"
                        style={modalActions}
                      >
                        <button
                          onClick={() =>
                            setModalLancamentoFinanceiroAberto(false)
                          }
                          style={botaoCancelar}
                        >
                          Cancelar
                        </button>

                        <button
                          onClick={salvarLancamentoFinanceiro}
                          disabled={salvandoLancamentoFinanceiro}
                          style={{
                            ...botaoSalvarModal,
                            background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                          }}
                        >
                          {salvandoLancamentoFinanceiro
                            ? "Salvando..."
                            : "Salvar lançamento"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={movimentacoesFinanceirasBox}>
                    <strong style={historicoServico}>
                      Histórico financeiro
                    </strong>

                    {movimentacoesFinanceiras.length === 0 ? (
                      <p style={historicoTexto}>
                        Nenhuma movimentação financeira lançada.
                      </p>
                    ) : (
                      movimentacoesFinanceiras.map((movimentacao) => (
                        <div
                          key={movimentacao.id}
                          className="clientes-movimentacao-mobile"
                          style={movimentacaoLinha}
                        >
                          <div>
                            <strong
                              style={{
                                color:
                                  movimentacao.tipo === "credito"
                                    ? "#bbf7d0"
                                    : "#fecaca",
                              }}
                            >
                              {textoTipoMovimentacao(movimentacao.tipo)} ·{" "}
                              {dinheiro(movimentacao.valor)}
                            </strong>

                            <p style={historicoTexto}>
                              {textoOrigemMovimentacao(movimentacao.origem)} ·{" "}
                              {formatarDataHora(movimentacao.createdAt)}
                            </p>

                            {movimentacao.observacao && (
                              <p style={historicoTexto}>
                                {movimentacao.observacao}
                              </p>
                            )}
                          </div>

                          <span style={badgeStatus(movimentacao.status)}>
                            {movimentacao.status || "ativo"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )}

              {abaCliente === "historico" && (
                <>
                  {carregandoHistorico ? (
                    <div style={emptyState}>
                      <div style={emptyIcon}>⏳</div>
                      <strong>Carregando histórico...</strong>
                      <span>Buscando atendimentos do cliente.</span>
                    </div>
                  ) : historicoCliente.length === 0 ? (
                    <div style={emptyState}>
                      <div style={emptyIcon}>📋</div>
                      <strong>Sem histórico</strong>
                      <span>Este cliente ainda não possui atendimentos.</span>
                    </div>
                  ) : (
                    <div style={listaHistorico}>
                      {historicoCliente.map((item) => (
                        <div key={item.id} style={historicoCard}>
                          <div style={historicoGlow} />

                          <div
                            className="clientes-historico-topo-mobile"
                            style={historicoTopo}
                          >
                            <div>
                              <strong style={historicoServico}>
                                {item.servico}
                              </strong>

                              <p style={historicoTexto}>
                                {item.profissional} ·{" "}
                                {formatarDataHora(item.dataHoraInicio)}
                              </p>
                            </div>

                            <div style={{ textAlign: "right" }}>
                              <span style={badgeStatus(item.status)}>
                                {textoStatus(item.status)}
                              </span>

                              <p style={historicoTexto}>
                                Pagamento:{" "}
                                {textoPagamento(item.statusPagamento)}
                              </p>
                            </div>
                          </div>

                          <div
                            className="clientes-financeiro-cards-mobile"
                            style={financeiroGrid}
                          >
                            <ResumoFinanceiro
                              label="Total"
                              valor={dinheiro(item.total)}
                            />

                            <ResumoFinanceiro
                              label="Pago"
                              valor={dinheiro(item.pago)}
                            />

                            <ResumoFinanceiro
                              label="Pendente"
                              valor={dinheiro(item.pendente)}
                            />
                          </div>

                          {item.adicionais?.length > 0 && (
                            <div style={adicionaisBox}>
                              <strong>Serviços adicionais</strong>

                              {item.adicionais.map((adicional: any) => (
                                <div key={adicional.id} style={adicionalLinha}>
                                  <span>
                                    {adicional.nome} · {adicional.profissional}
                                  </span>

                                  <strong>{dinheiro(adicional.valor)}</strong>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {abaCliente === "fichas" && (
                <section style={abaConteudoBox}>
                  <div style={abaSecaoHeader}>
                    <div>
                      <span style={sectionEyebrow}>Fichas Digitais</span>
                      <h3 style={clienteFinanceiroTitulo}>
                        Histórico de fichas
                      </h3>
                      <p style={modalSubtitle}>
                        Registre avaliações, consentimentos, evolução, fotos e
                        assinatura digital.
                      </p>
                    </div>

                    <button
                      onClick={abrirNovaFichaCliente}
                      style={{
                        ...botaoSalvarModal,
                        background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                      }}
                    >
                      + Nova ficha
                    </button>
                  </div>

                  {fichasCliente.length === 0 ? (
                    <div style={emptyState}>
                      <div style={emptyIcon}>📋</div>
                      <strong>Nenhuma ficha digital</strong>
                      <span>
                        Este cliente ainda não possui fichas preenchidas.
                      </span>
                    </div>
                  ) : (
                    <div
                      className="clientes-fichas-grid-mobile"
                      style={fichasClienteGrid}
                    >
                      {fichasCliente.map((ficha) => (
                        <article key={ficha.id} style={fichaClienteCard}>
                          <div style={fichaClienteIcone}>📋</div>

                          <div style={{ minWidth: 0 }}>
                            <div style={fichaClienteTituloLinha}>
                              <strong>
                                {ficha.tituloSnapshot ||
                                  ficha.modelo?.titulo ||
                                  "Ficha digital"}
                              </strong>

                              <span
                                style={{
                                  ...badgeBase,
                                  background: ficha.assinado
                                    ? "rgba(34,197,94,0.18)"
                                    : "rgba(245,158,11,0.18)",
                                  color: ficha.assinado ? "#bbf7d0" : "#fde68a",
                                  border: ficha.assinado
                                    ? "1px solid rgba(34,197,94,0.20)"
                                    : "1px solid rgba(245,158,11,0.20)",
                                }}
                              >
                                {statusFichaTexto(ficha)}
                              </span>
                            </div>

                            <div style={fichaBadgesCliente}>
                              <span>📅 {formatarData(ficha.createdAt)}</span>
                              <span>
                                🧩{" "}
                                {ficha._count?.respostas ||
                                  ficha.respostas?.length ||
                                  0}{" "}
                                respostas
                              </span>
                              <span>
                                🖼️{" "}
                                {ficha._count?.arquivos ||
                                  ficha.arquivos?.length ||
                                  0}{" "}
                                arquivos
                              </span>
                              {ficha.aceiteLgpd && <span>🛡️ LGPD</span>}
                            </div>

                            <div style={fichaAcoesCliente}>
                              <button
                                type="button"
                                onClick={() => abrirVisualizarFicha(ficha)}
                                style={botaoVerFicha}
                              >
                                Ver ficha
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        )}

        {drawerVisualizarFichaAberto && (
          <div style={drawerFichaOverlay}>
            <button
              type="button"
              aria-label="Fechar ficha digital"
              onClick={fecharDrawerVisualizarFicha}
              style={drawerFichaBackdrop}
            />

            <aside
              className="clientes-drawer-ficha-mobile"
              style={drawerFichaCard}
            >
              <div style={drawerFichaHeader}>
                <div>
                  <span style={sectionEyebrow}>Ficha preenchida</span>
                  <h2 style={modalTitle}>
                    {fichaDetalhada?.tituloSnapshot ||
                      fichaDetalhada?.modelo?.titulo ||
                      "Ficha digital"}
                  </h2>
                  <p style={modalSubtitle}>
                    {clienteSelecionado?.nome ||
                      fichaDetalhada?.cliente?.nome ||
                      "Cliente"}{" "}
                    · histórico e complemento profissional.
                  </p>
                </div>

                <button
                  onClick={fecharDrawerVisualizarFicha}
                  style={botaoFechar}
                >
                  ×
                </button>
              </div>

              <div style={drawerFichaScroll}>
                {carregandoFichaDetalhada && (
                  <div style={emptyState}>
                    <div style={emptyIcon}>⏳</div>
                    <strong>Carregando ficha...</strong>
                    <span>Buscando respostas e campos profissionais.</span>
                  </div>
                )}

                {!carregandoFichaDetalhada && fichaDetalhada && (
                  <>
                    <section style={fichaVisualResumoGrid}>
                      <div style={fichaVisualResumoCard}>
                        <span>Cliente</span>
                        <strong>
                          {fichaDetalhada.cliente?.nome ||
                            clienteSelecionado?.nome ||
                            "Não vinculado"}
                        </strong>
                      </div>

                      <div style={fichaVisualResumoCard}>
                        <span>Data</span>
                        <strong>
                          {formatarData(fichaDetalhada.createdAt)}
                        </strong>
                      </div>

                      <div style={fichaVisualResumoCard}>
                        <span>Status</span>
                        <strong>{statusFichaTexto(fichaDetalhada)}</strong>
                      </div>

                      <div style={fichaVisualResumoCard}>
                        <span>Origem</span>
                        <strong>{fichaDetalhada.origem || "Painel"}</strong>
                      </div>
                    </section>

                    {fichaDetalhada.agendamento && (
                      <section style={fichaAgendaBox}>
                        <div style={fichaAgendaHeader}>
                          <span style={campoTipoBadge}>
                            Agendamento vinculado
                          </span>
                          <strong>Atendimento relacionado a esta ficha</strong>
                        </div>

                        <div style={fichaInfoAgendaGrid}>
                          <div style={fichaAgendaItem}>
                            <small>Serviço</small>
                            <strong>
                              {fichaDetalhada.agendamento?.servico?.nome ||
                                "Não informado"}
                            </strong>
                          </div>

                          <div style={fichaAgendaItem}>
                            <small>Profissional</small>
                            <strong>
                              {fichaDetalhada.agendamento?.profissional?.nome ||
                                "Não informado"}
                            </strong>
                          </div>

                          <div style={fichaAgendaItem}>
                            <small>Data e horário</small>
                            <strong>
                              {formatarDataHora(
                                fichaDetalhada.agendamento?.dataHoraInicio,
                              )}
                            </strong>
                          </div>
                        </div>
                      </section>
                    )}

                    <section style={fichaVisualSecao}>
                      <div style={fichaVisualSecaoHeader}>
                        <span style={sectionEyebrow}>Cliente</span>
                        <h3>Respostas do cliente</h3>
                      </div>

                      {camposClienteSemAssinatura(fichaDetalhada).length ===
                        0 && !campoAssinaturaCliente(fichaDetalhada) ? (
                        <div style={emptyStateCompacto}>
                          <strong>Nenhuma pergunta para cliente</strong>
                        </div>
                      ) : (
                        <div style={fichaRespostaLista}>
                          {camposClienteSemAssinatura(fichaDetalhada).map(
                            (campo: any) => {
                              const resposta = respostasDaFichaPorCampo(
                                fichaDetalhada,
                              ).get(campo.id);

                              return (
                                <div key={campo.id} style={fichaRespostaCard}>
                                  <span>{labelTipoFicha(campo.tipo)}</span>
                                  <strong>{campo.titulo}</strong>
                                  <p>{formatarValorRespostaFicha(resposta)}</p>
                                </div>
                              );
                            },
                          )}

                          {campoAssinaturaCliente(fichaDetalhada) && (
                            <div style={fichaAssinaturaCard}>
                              <div style={fichaAssinaturaTopo}>
                                <span style={fichaAssinaturaIcone}>✓</span>
                                <div style={fichaAssinaturaTituloBox}>
                                  <strong>Assinatura Digital Confirmada</strong>
                                  <small>
                                    Confirmação eletrônica realizada pelo
                                    cliente.
                                  </small>
                                </div>
                              </div>

                              <p style={fichaAssinaturaDeclaracao}>
                                Confirmo que as informações desta ficha foram
                                preenchidas por mim e autorizo sua utilização
                                como assinatura digital para este atendimento.
                              </p>

                              <div style={fichaAssinaturaGrid}>
                                <div style={fichaAssinaturaInfoItem}>
                                  <small>Nome do cliente</small>
                                  <strong>
                                    {nomeAssinaturaFicha(fichaDetalhada)}
                                  </strong>
                                </div>

                                <div style={fichaAssinaturaInfoItem}>
                                  <small>CPF</small>
                                  <strong>
                                    {cpfAssinaturaFicha(fichaDetalhada)}
                                  </strong>
                                </div>

                                <div style={fichaAssinaturaInfoItem}>
                                  <small>Data da confirmação</small>
                                  <strong>
                                    {textoAssinaturaFicha(fichaDetalhada)}
                                  </strong>
                                </div>
                              </div>

                              <div style={fichaAssinaturaOrigem}>
                                Origem: Agendador Online Marcaê
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </section>

                    {camposDaFichaPorRespondente(fichaDetalhada, "profissional")
                      .length > 0 && (
                      <section style={fichaVisualSecao}>
                        <div style={fichaVisualSecaoHeader}>
                          <span style={sectionEyebrow}>Profissional</span>
                          <h3>Complemento profissional</h3>
                          <p style={modalSubtitle}>
                            Preencha aqui somente os campos definidos como
                            “Profissional responde”.
                          </p>
                        </div>

                        <div style={fichaRespostaLista}>
                          {camposDaFichaPorRespondente(
                            fichaDetalhada,
                            "profissional",
                          ).map((campo: any, index: number) => (
                            <div key={campo.id} style={fichaCampoBox}>
                              <div style={fichaCampoHeader}>
                                <div>
                                  <span style={campoTipoBadge}>
                                    {labelTipoFicha(campo.tipo)}
                                  </span>
                                  <label style={labelStyle}>
                                    {index + 1}. {campo.titulo}
                                    {campo.obrigatorio ? " *" : ""}
                                  </label>
                                </div>
                              </div>

                              {campo.descricao && (
                                <p style={campoAjudaTexto}>{campo.descricao}</p>
                              )}

                              {renderCampoFichaProfissional(campo)}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>

              <div style={drawerFichaActions}>
                <div style={drawerFichaActionsGrupo}>
                  <button
                    type="button"
                    onClick={compartilharFichaDetalhada}
                    disabled={!fichaDetalhada}
                    style={{
                      ...botaoVerFicha,
                      opacity: fichaDetalhada ? 1 : 0.5,
                    }}
                  >
                    Compartilhar PDF
                  </button>

                  <button
                    type="button"
                    onClick={imprimirFichaDetalhada}
                    disabled={!fichaDetalhada}
                    style={{
                      ...botaoVerFicha,
                      opacity: fichaDetalhada ? 1 : 0.5,
                    }}
                  >
                    Imprimir ficha
                  </button>
                </div>

                <div style={drawerFichaActionsGrupo}>
                  <button
                    onClick={fecharDrawerVisualizarFicha}
                    style={botaoCancelar}
                  >
                    Fechar
                  </button>

                  {fichaDetalhada &&
                    camposDaFichaPorRespondente(fichaDetalhada, "profissional")
                      .length > 0 && (
                      <button
                        onClick={salvarComplementoProfissionalFicha}
                        disabled={salvandoComplementoFicha}
                        style={{
                          ...botaoSalvarModal,
                          background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                          opacity: salvandoComplementoFicha ? 0.58 : 1,
                        }}
                      >
                        {salvandoComplementoFicha
                          ? "Salvando..."
                          : "Salvar complemento"}
                      </button>
                    )}
                </div>
              </div>
            </aside>
          </div>
        )}

        {drawerFichaAberto && (
          <div style={drawerFichaOverlay}>
            <button
              type="button"
              aria-label="Fechar nova ficha"
              onClick={fecharDrawerFichaCliente}
              style={drawerFichaBackdrop}
            />

            <aside
              className="clientes-drawer-ficha-mobile"
              style={drawerFichaCard}
            >
              <div style={drawerFichaHeader}>
                <div>
                  <span style={sectionEyebrow}>Nova ficha</span>
                  <h2 style={modalTitle}>Preencher ficha digital</h2>
                  <p style={modalSubtitle}>
                    {clienteSelecionado?.nome} · selecione o modelo e responda
                    as perguntas.
                  </p>
                </div>

                <button onClick={fecharDrawerFichaCliente} style={botaoFechar}>
                  ×
                </button>
              </div>

              <div style={drawerFichaScroll}>
                <div style={fichaCampoBox}>
                  <label style={labelStyle}>Modelo da ficha</label>

                  <select
                    value={modeloFichaSelecionado?.id || ""}
                    onChange={(e) =>
                      selecionarModeloFichaCliente(e.target.value)
                    }
                    style={input}
                  >
                    <option value="">Selecione um modelo</option>
                    {modelosFichaCliente.map((modelo) => (
                      <option key={modelo.id} value={modelo.id}>
                        {modelo.titulo}
                      </option>
                    ))}
                  </select>

                  {modeloFichaSelecionado?.descricao && (
                    <p style={campoAjudaTexto}>
                      {modeloFichaSelecionado.descricao}
                    </p>
                  )}
                </div>

                {carregandoCamposFicha && (
                  <div style={emptyState}>
                    <div style={emptyIcon}>⏳</div>
                    <strong>Carregando perguntas...</strong>
                    <span>Preparando os campos da ficha.</span>
                  </div>
                )}

                {!carregandoCamposFicha &&
                  modeloFichaSelecionado &&
                  camposFichaCliente.length === 0 && (
                    <div style={emptyState}>
                      <div style={emptyIcon}>📋</div>
                      <strong>Sem perguntas cadastradas</strong>
                      <span>
                        Edite o modelo em Fichas Digitais para adicionar campos.
                      </span>
                    </div>
                  )}

                {!carregandoCamposFicha &&
                  camposFichaCliente.map((campo, index) => (
                    <div key={campo.id} style={fichaCampoBox}>
                      <div style={fichaCampoHeader}>
                        <div>
                          <span style={campoTipoBadge}>
                            {labelTipoFicha(campo.tipo)}
                          </span>
                          <label style={labelStyle}>
                            {index + 1}. {campo.titulo}
                            {campo.obrigatorio ? " *" : ""}
                          </label>
                        </div>
                      </div>

                      {campo.descricao && (
                        <p style={campoAjudaTexto}>{campo.descricao}</p>
                      )}

                      {renderCampoFicha(campo)}
                    </div>
                  ))}

                {modeloFichaSelecionado?.exigeAceiteLgpd && (
                  <label style={lgpdBox}>
                    <input
                      type="checkbox"
                      checked={aceiteLgpdFicha}
                      onChange={(e) => setAceiteLgpdFicha(e.target.checked)}
                    />
                    <span>
                      Cliente autorizou o uso dos dados para histórico,
                      atendimento e prestação de serviço.
                    </span>
                  </label>
                )}

                {modeloFichaSelecionado?.exigeAssinatura && (
                  <div style={fichaCampoBox}>
                    <span style={campoTipoBadge}>Assinatura digital</span>

                    <div style={assinaturaBox}>
                      <Campo
                        label="Nome para assinatura"
                        value={assinaturaNomeFicha}
                        placeholder="Nome do cliente"
                        onChange={(value: string) =>
                          setAssinaturaNomeFicha(value)
                        }
                      />

                      <Campo
                        label="CPF da assinatura"
                        value={assinaturaCpfFicha}
                        placeholder="000.000.000-00"
                        onChange={(value: string) =>
                          setAssinaturaCpfFicha(formatarCpf(value))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={drawerFichaActions}>
                <button
                  onClick={fecharDrawerFichaCliente}
                  style={botaoCancelar}
                >
                  Cancelar
                </button>

                <button
                  onClick={salvarFichaCliente}
                  disabled={salvandoFichaCliente || !modeloFichaSelecionado}
                  style={{
                    ...botaoSalvarModal,
                    background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                    opacity:
                      salvandoFichaCliente || !modeloFichaSelecionado
                        ? 0.58
                        : 1,
                  }}
                >
                  {salvandoFichaCliente ? "Salvando..." : "Salvar ficha"}
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </PremiumLayout>
  );
}

function Campo({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={input}
      />
    </div>
  );
}

function MetricCard({
  titulo,
  valor,
  descricao,
  icone,
  cor,
}: {
  titulo: string;
  valor: string;
  descricao: string;
  icone: string;
  cor: string;
}) {
  return (
    <div style={metricCard}>
      <div
        style={{
          ...metricIcon,
          background: `linear-gradient(135deg, ${hexToRgba(
            cor,
            0.95,
          )}, ${hexToRgba(cor, 0.45)})`,
          boxShadow: `0 18px 38px ${hexToRgba(cor, 0.26)}`,
        }}
      >
        {icone}
      </div>

      <div>
        <span style={metricTitulo}>{titulo}</span>
        <strong style={metricValor}>{valor}</strong>
        <small style={metricDescricao}>{descricao}</small>
      </div>
    </div>
  );
}

function ResumoFinanceiro({ label, valor }: any) {
  return (
    <div
      className="clientes-resumo-financeiro-mobile"
      style={resumoFinanceiroCard}
    >
      <span>{label}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function badgeStatus(status?: string | null): CSSProperties {
  if (status === "concluido") {
    return {
      ...badgeBase,
      background: "rgba(34,197,94,0.18)",
      color: "#bbf7d0",
      border: "1px solid rgba(34,197,94,0.20)",
    };
  }

  if (status === "confirmado") {
    return {
      ...badgeBase,
      background: "rgba(59,130,246,0.18)",
      color: "#bfdbfe",
      border: "1px solid rgba(59,130,246,0.20)",
    };
  }

  if (status === "cancelado") {
    return {
      ...badgeBase,
      background: "rgba(239,68,68,0.18)",
      color: "#fecaca",
      border: "1px solid rgba(239,68,68,0.20)",
    };
  }

  return {
    ...badgeBase,
    background: "rgba(245,158,11,0.18)",
    color: "#fde68a",
    border: "1px solid rgba(245,158,11,0.20)",
  };
}

function hexToRgba(hex: string, alpha: number) {
  if (!hex) return `rgba(124,58,237,${alpha})`;

  const cleanHex = hex.replace("#", "");

  if (cleanHex.length !== 6) {
    return `rgba(124,58,237,${alpha})`;
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

const moduleTopBar: CSSProperties = {
  borderRadius: 24,
  padding: "16px 18px",
  marginBottom: 14,
  background: "linear-gradient(135deg, rgba(15,23,42,0.94), rgba(2,6,23,0.92))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 22px 60px rgba(0,0,0,0.22)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const moduleTopLeft: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
};

const moduleTopIcon: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 21,
  flexShrink: 0,
  color: "#fff",
};

const moduleTopTitle: CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: 24,
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
};

const moduleTopSubtitle: CSSProperties = {
  margin: "6px 0 0",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.35,
};

const moduleTopBadge: CSSProperties = {
  padding: "9px 12px",
  borderRadius: 999,
  background: "rgba(124,58,237,0.14)",
  border: "1px solid rgba(124,58,237,0.20)",
  color: "#ddd6fe",
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const page: CSSProperties = {
  minHeight: "100vh",
  padding: 30,
  color: "#e5e7eb",
};

const container: CSSProperties = {
  maxWidth: 1320,
  margin: "0 auto",
};

const loadingPage: CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #020617, #111827)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  padding: 30,
};

const loadingCard: CSSProperties = {
  width: "100%",
  maxWidth: 360,
  borderRadius: 26,
  padding: 28,
  background: "rgba(15,23,42,0.82)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 30px 90px rgba(0,0,0,0.35)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "center",
  textAlign: "center",
};

const loadingIcon: CSSProperties = {
  width: 58,
  height: 58,
  borderRadius: 20,
  background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 26,
  marginBottom: 8,
};

const headerPremium: CSSProperties = {
  color: "#fff",
  borderRadius: 24,
  padding: 22,
  marginBottom: 14,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 24,
  flexWrap: "wrap",
  position: "relative",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.16)",
};

const headerOverlay: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(90deg, rgba(255,255,255,0.08), transparent 34%, rgba(255,255,255,0.08))",
  pointerEvents: "none",
};

const headerConteudo: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 20,
  position: "relative",
  zIndex: 2,
};

const logoHeader: CSSProperties = {
  width: 62,
  height: 62,
  borderRadius: 20,
  overflow: "hidden",
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 34,
  fontWeight: 900,
  color: "#fff",
  boxShadow: "0 14px 34px rgba(0,0,0,0.24)",
  flexShrink: 0,
};

const badgeBoasVindas: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(255,255,255,0.14)",
  color: "#fff",
  padding: "7px 14px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 12,
  border: "1px solid rgba(255,255,255,0.12)",
};

const tituloHeader: CSSProperties = {
  margin: 0,
  fontSize: 34,
  fontWeight: 950,
  color: "#fff",
  lineHeight: 1,
  letterSpacing: "-0.03em",
};

const subtituloHeader: CSSProperties = {
  margin: "12px 0 0",
  color: "rgba(255,255,255,0.82)",
  fontSize: 15,
  fontWeight: 500,
  maxWidth: 620,
  lineHeight: 1.6,
};

const linhaBadgesHeader: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 18,
};

const badgeEmpresa: CSSProperties = {
  background: "rgba(255,255,255,0.14)",
  color: "#fff",
  padding: "9px 14px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,0.12)",
};

const badgeModulo: CSSProperties = {
  background: "rgba(245,158,11,0.18)",
  color: "#fde68a",
  padding: "9px 14px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  border: "1px solid rgba(245,158,11,0.18)",
};

const badgeStatusHeader: CSSProperties = {
  background: "rgba(34,197,94,0.16)",
  color: "#bbf7d0",
  padding: "9px 14px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  border: "1px solid rgba(34,197,94,0.18)",
};

const headerPainel: CSSProperties = {
  minWidth: 220,
  borderRadius: 20,
  padding: 18,
  background: "rgba(2,6,23,0.26)",
  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(14px)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  position: "relative",
  zIndex: 2,
};

const headerPainelLabel: CSSProperties = {
  color: "rgba(255,255,255,0.74)",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: ".08em",
};

const headerPainelValor: CSSProperties = {
  fontSize: 44,
  lineHeight: 1,
  fontWeight: 950,
  color: "#fff",
};

const headerPainelTexto: CSSProperties = {
  color: "rgba(255,255,255,0.78)",
  fontSize: 13,
  lineHeight: 1.5,
};

const metricasGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 12,
  marginBottom: 14,
};

const metricCard: CSSProperties = {
  borderRadius: 20,
  padding: 16,
  background: "rgba(15,23,42,0.86)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(14px)",
  display: "flex",
  alignItems: "center",
  gap: 18,
  boxShadow: "0 20px 60px rgba(0,0,0,0.24)",
};

const metricIcon: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 28,
  flexShrink: 0,
};

const metricTitulo: CSSProperties = {
  display: "block",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 8,
  textTransform: "uppercase",
  letterSpacing: ".08em",
};

const metricValor: CSSProperties = {
  display: "block",
  color: "#fff",
  fontSize: 28,
  fontWeight: 900,
  lineHeight: 1.1,
};

const metricDescricao: CSSProperties = {
  display: "block",
  color: "#94a3b8",
  fontSize: 13,
  marginTop: 8,
  lineHeight: 1.5,
};

const mainGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 340px",
  gap: 22,
  alignItems: "start",
  marginBottom: 24,
};

const formCard: CSSProperties = {
  borderRadius: 30,
  padding: 28,
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(124,58,237,0.30)",
  backdropFilter: "blur(14px)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.26)",
  marginBottom: 24,
};

const novoClienteCompactCard: CSSProperties = {
  borderRadius: 22,
  padding: 14,
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(124,58,237,0.22)",
  backdropFilter: "blur(14px)",
  boxShadow: "0 18px 52px rgba(0,0,0,0.20)",
  marginBottom: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const novoClienteCompactInfo: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
};

const novoClienteIcon: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 14,
  background: "rgba(124,58,237,0.20)",
  border: "1px solid rgba(124,58,237,0.24)",
  color: "#ddd6fe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  fontWeight: 950,
  flexShrink: 0,
};

const novoClienteTitulo: CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: 18,
  fontWeight: 950,
  letterSpacing: "-0.03em",
};

const novoClienteTexto: CSSProperties = {
  margin: "4px 0 0",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.35,
};

const botaoNovoCliente: CSSProperties = {
  border: "none",
  borderRadius: 14,
  padding: "11px 14px",
  color: "#fff",
  fontSize: 13,
  fontWeight: 950,
  cursor: "pointer",
  flexShrink: 0,
};

const sectionHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 24,
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const sectionEyebrow: CSSProperties = {
  display: "inline-block",
  color: "#38bdf8",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: ".08em",
  marginBottom: 10,
};

const sectionTitle: CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: 28,
  fontWeight: 900,
  letterSpacing: "-0.03em",
};

const sectionDescription: CSSProperties = {
  margin: "10px 0 0",
  color: "#94a3b8",
  fontSize: 14,
  lineHeight: 1.7,
  maxWidth: 560,
};

const crmDashboardCard: CSSProperties = {
  borderRadius: 24,
  padding: 14,
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(14px)",
  boxShadow: "0 22px 60px rgba(0,0,0,0.22)",
  marginBottom: 14,
};

const crmDashboardHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  marginBottom: 10,
  flexWrap: "wrap",
};

const crmDashboardTotalBox: CSSProperties = {
  minWidth: 116,
  borderRadius: 18,
  padding: "12px 14px",
  background: "rgba(2,6,23,0.58)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

const crmDashboardStats: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
};

const cadastroCompactHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
};

const cadastroCompactTexto: CSSProperties = {
  margin: "8px 0 0",
  color: "#94a3b8",
  fontSize: 14,
  lineHeight: 1.55,
};

const botaoAbrirCadastro: CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#fff",
  fontSize: 26,
  fontWeight: 950,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const gridFormulario: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 18,
  marginTop: 22,
  marginBottom: 24,
};

const label: CSSProperties = {
  color: "#e2e8f0",
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 8,
  display: "block",
};

const labelStyle: CSSProperties = {
  color: "#e2e8f0",
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 8,
  display: "block",
};

const input: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(2,6,23,0.66)",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const botaoPrincipal: CSSProperties = {
  width: "100%",
  padding: "16px 22px",
  borderRadius: 18,
  border: "none",
  color: "#fff",
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
};

const sideCard: CSSProperties = {
  borderRadius: 22,
  padding: 16,
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(14px)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.24)",
  position: "sticky",
  top: 20,
};

const sideIcon: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 16,
  background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  marginBottom: 0,
};

const sideTitle: CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: 19,
  fontWeight: 900,
};

const sideText: CSSProperties = {
  margin: "8px 0 0",
  color: "#94a3b8",
  lineHeight: 1.5,
  fontSize: 13,
};

const sideStats: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  marginTop: 24,
};

const sideStatItem: CSSProperties = {
  borderRadius: 14,
  padding: "9px 10px",
  background: "rgba(2,6,23,0.56)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 5,
  color: "#fff",
};

const insightBox: CSSProperties = {
  marginTop: 22,
  borderRadius: 20,
  padding: 20,
  background: "rgba(59,130,246,0.10)",
  border: "1px solid rgba(59,130,246,0.14)",
  display: "flex",
  flexDirection: "column",
  gap: 10,
  color: "#dbeafe",
  lineHeight: 1.7,
};

const listaCard: CSSProperties = {
  borderRadius: 24,
  padding: 18,
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(14px)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.24)",
};

const listaHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  marginBottom: 16,
  flexWrap: "wrap",
  alignItems: "center",
};

const listaTitleRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const listaContador: CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(124,58,237,0.14)",
  border: "1px solid rgba(124,58,237,0.18)",
  color: "#ddd6fe",
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const buscaArea: CSSProperties = {
  width: "100%",
  maxWidth: 360,
  height: 52,
  borderRadius: 18,
  background: "rgba(2,6,23,0.66)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 14px",
};

const buscaIcon: CSSProperties = {
  color: "#94a3b8",
  fontSize: 16,
};

const inputBusca: CSSProperties = {
  flex: 1,
  border: "none",
  background: "transparent",
  outline: "none",
  color: "#fff",
  fontSize: 14,
};

const emptyState: CSSProperties = {
  borderRadius: 26,
  padding: 42,
  background: "rgba(2,6,23,0.44)",
  border: "1px dashed rgba(255,255,255,0.10)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: 10,
  color: "#94a3b8",
};

const emptyStateCompacto: CSSProperties = {
  borderRadius: 16,
  padding: 16,
  background: "rgba(2,6,23,0.38)",
  border: "1px dashed rgba(255,255,255,0.10)",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 6,
  color: "#94a3b8",
  fontSize: 13,
  fontWeight: 800,
};

const emptyIcon: CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 24,
  background: "rgba(124,58,237,0.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 32,
};

const clientesGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 16,
};

const clienteCard: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 22,
  padding: 16,
  background: "linear-gradient(180deg, rgba(15,23,42,0.94), rgba(2,6,23,0.94))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 26px 70px rgba(0,0,0,0.28)",
};

const clienteGlow: CSSProperties = {
  position: "absolute",
  width: 240,
  height: 240,
  top: -120,
  right: -120,
  pointerEvents: "none",
};

const clienteTopo: CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  marginBottom: 12,
  position: "relative",
  zIndex: 2,
};

const avatar: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  fontWeight: 950,
  flexShrink: 0,
  color: "#fff",
};

const clienteNomeLinha: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 8,
  marginBottom: 7,
};

const clienteNome: CSSProperties = {
  display: "block",
  color: "#fff",
  fontSize: 17,
  fontWeight: 950,
  lineHeight: 1.12,
  minWidth: 0,
};

const clienteSaldoBadge: CSSProperties = {
  padding: "5px 8px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.07)",
  fontSize: 11,
  fontWeight: 950,
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const clienteInfo: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 750,
};

const clienteMiniGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
  marginBottom: 10,
};

const clienteMiniCard: CSSProperties = {
  borderRadius: 14,
  padding: "10px 12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 6,
  color: "#fff",
  minWidth: 0,
  minHeight: 66,
  overflow: "hidden",
};

const botoesCliente: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
};

const botaoEditar: CSSProperties = {
  padding: "10px 8px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const botaoHistorico: CSSProperties = {
  ...botaoEditar,
};

const botaoAgendar: CSSProperties = {
  ...botaoEditar,
  border: "none",
};

const sideCompactHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 8,
};

const sideCompactStats: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  marginTop: 12,
};

const insightCompactBox: CSSProperties = {
  marginTop: 12,
  borderRadius: 16,
  padding: 12,
  background: "rgba(59,130,246,0.08)",
  border: "1px solid rgba(59,130,246,0.12)",
  color: "#bfdbfe",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.45,
};

const modalOverlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,23,0.78)",
  zIndex: 999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  backdropFilter: "blur(12px)",
};

const modalBox: CSSProperties = {
  width: "100%",
  maxWidth: 760,
  borderRadius: 30,
  padding: 28,
  background: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 35px 100px rgba(0,0,0,0.48)",
  color: "#fff",
};

const modalHistorico: CSSProperties = {
  ...modalBox,
  maxWidth: 980,
  maxHeight: "90vh",
  overflowY: "auto",
};

const modalHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 22,
};

const modalTitle: CSSProperties = {
  margin: 0,
  fontSize: 28,
  color: "#fff",
  fontWeight: 900,
  letterSpacing: "-0.03em",
};

const modalSubtitle: CSSProperties = {
  margin: "8px 0 0",
  color: "#94a3b8",
  fontSize: 14,
  lineHeight: 1.6,
};

const botaoFechar: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontSize: 24,
  fontWeight: 900,
  cursor: "pointer",
};

const gridFormularioModal: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
};

const modalActions: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 22,
  flexWrap: "wrap",
};

const botaoCancelar: CSSProperties = {
  padding: "13px 18px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const botaoSalvarModal: CSSProperties = {
  padding: "13px 18px",
  borderRadius: 16,
  border: "none",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const listaHistorico: CSSProperties = {
  display: "grid",
  gap: 14,
};

const historicoCard: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 22,
  padding: 18,
  background: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const historicoGlow: CSSProperties = {
  position: "absolute",
  width: 180,
  height: 180,
  top: -90,
  right: -90,
  background: "radial-gradient(circle, rgba(124,58,237,0.18), transparent 70%)",
  pointerEvents: "none",
};

const historicoTopo: CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  marginBottom: 14,
};

const historicoServico: CSSProperties = {
  color: "#fff",
  fontSize: 18,
  fontWeight: 900,
};

const historicoTexto: CSSProperties = {
  margin: "6px 0 0",
  color: "#94a3b8",
  fontSize: 13,
  fontWeight: 700,
};

const badgeBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "7px 11px",
  fontSize: 12,
  fontWeight: 900,
};

const financeiroGrid: CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 10,
  marginTop: 12,
};

const resumoFinanceiroCard: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: 14,
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  color: "#fff",
  fontSize: 13,
  fontWeight: 900,
};

const adicionaisBox: CSSProperties = {
  position: "relative",
  zIndex: 2,
  marginTop: 12,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: 14,
  color: "#fff",
};

const adicionalLinha: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 8,
  color: "#cbd5e1",
  fontSize: 13,
  fontWeight: 800,
};

const clienteFinanceiroResumoBox: CSSProperties = {
  borderRadius: 24,
  padding: 20,
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: 20,
};

const clienteFinanceiroResumoHeader: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 16,
  flexWrap: "wrap",
};

const clienteFinanceiroTitulo: CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: 22,
  fontWeight: 950,
  letterSpacing: "-0.03em",
};

const clienteFinanceiroAcoes: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const botaoCredito: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  padding: "12px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

const financeiroClienteGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const lancamentoFinanceiroBox: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  borderRadius: 20,
  padding: 16,
  background: "rgba(2,6,23,0.48)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: 16,
};

const textareaFinanceiroCliente: CSSProperties = {
  ...input,
  minHeight: 92,
  resize: "vertical",
  fontFamily: "inherit",
};

const movimentacoesFinanceirasBox: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const movimentacaoLinha: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  padding: 14,
  borderRadius: 16,
  background: "rgba(2,6,23,0.42)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const abasClienteLinha: CSSProperties = {
  display: "flex",
  gap: 8,
  marginBottom: 18,
  flexWrap: "wrap",
};

const abaClienteBotao: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 999,
  padding: "10px 13px",
  fontSize: 12,
  fontWeight: 950,
  cursor: "pointer",
};

const abaConteudoBox: CSSProperties = {
  borderRadius: 24,
  padding: 20,
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const abaSecaoHeader: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 14,
  marginBottom: 16,
  flexWrap: "wrap",
};

const dadosClienteGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: 12,
};

const dadosClienteCard: CSSProperties = {
  borderRadius: 16,
  padding: 14,
  background: "rgba(2,6,23,0.42)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 7,
  color: "#fff",
};

const fichasClienteGrid: CSSProperties = {
  display: "grid",
  gap: 12,
};

const fichaClienteCard: CSSProperties = {
  borderRadius: 18,
  padding: 14,
  background: "rgba(2,6,23,0.42)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  gridTemplateColumns: "44px minmax(0, 1fr)",
  gap: 12,
  alignItems: "flex-start",
};

const fichaClienteIcone: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 15,
  background:
    "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(6,182,212,0.72))",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
};

const fichaClienteTituloLinha: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "flex-start",
  color: "#fff",
  fontSize: 16,
  fontWeight: 950,
  flexWrap: "wrap",
};

const fichaBadgesCliente: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 10,
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 850,
};

const fichaAcoesCliente: CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 12,
  flexWrap: "wrap",
};

const botaoVerFicha: CSSProperties = {
  border: "1px solid rgba(124,58,237,0.28)",
  background: "rgba(124,58,237,0.14)",
  color: "#ddd6fe",
  borderRadius: 12,
  padding: "9px 12px",
  fontSize: 12,
  fontWeight: 950,
  cursor: "pointer",
};

const fichaVisualResumoGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: 10,
};

const fichaVisualResumoCard: CSSProperties = {
  borderRadius: 16,
  padding: 13,
  background: "rgba(2,6,23,0.48)",
  border: "1px solid rgba(255,255,255,0.07)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const fichaAgendaBox: CSSProperties = {
  borderRadius: 22,
  padding: 16,
  background:
    "linear-gradient(135deg, rgba(124,58,237,0.10), rgba(6,182,212,0.055))",
  border: "1px solid rgba(124,58,237,0.16)",
  display: "grid",
  gap: 12,
};

const fichaAgendaHeader: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const fichaInfoAgendaGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
  color: "#e5e7eb",
};

const fichaAgendaItem: CSSProperties = {
  borderRadius: 16,
  padding: 12,
  background: "rgba(2,6,23,0.36)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 5,
  minWidth: 0,
};

const fichaAssinaturaCard: CSSProperties = {
  borderRadius: 20,
  padding: 16,
  background:
    "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(6,182,212,0.08))",
  border: "1px solid rgba(34,197,94,0.22)",
  display: "flex",
  flexDirection: "column",
  gap: 14,
  overflow: "hidden",
};

const fichaAssinaturaTopo: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
};

const fichaAssinaturaIcone: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 999,
  background: "rgba(34,197,94,0.18)",
  border: "1px solid rgba(34,197,94,0.34)",
  color: "#bbf7d0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 15,
  fontWeight: 900,
  flexShrink: 0,
};

const fichaAssinaturaTituloBox: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  minWidth: 0,
};

const fichaAssinaturaDeclaracao: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.88)",
  fontSize: 13,
  lineHeight: "20px",
};

const fichaAssinaturaGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 10,
};

const fichaAssinaturaInfoItem: CSSProperties = {
  padding: 12,
  borderRadius: 14,
  background: "rgba(2,6,23,0.34)",
  border: "1px solid rgba(255,255,255,0.07)",
  display: "flex",
  flexDirection: "column",
  gap: 5,
  minWidth: 0,
};

const fichaAssinaturaOrigem: CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(34,197,94,0.22)",
  background: "rgba(34,197,94,0.10)",
  color: "#bbf7d0",
  fontSize: 12,
  lineHeight: "16px",
  fontWeight: 800,
};

const fichaVisualSecao: CSSProperties = {
  borderRadius: 22,
  padding: 14,
  background: "rgba(255,255,255,0.026)",
  border: "1px solid rgba(255,255,255,0.07)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const fichaVisualSecaoHeader: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const fichaRespostaLista: CSSProperties = {
  display: "grid",
  gap: 10,
};

const fichaRespostaCard: CSSProperties = {
  borderRadius: 16,
  padding: 13,
  background: "rgba(2,6,23,0.44)",
  border: "1px solid rgba(255,255,255,0.07)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const drawerFichaOverlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  justifyContent: "flex-end",
  background: "rgba(2,6,23,0.76)",
  backdropFilter: "blur(12px)",
};

const drawerFichaBackdrop: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

const drawerFichaCard: CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "min(560px, calc(100vw - 28px))",
  height: "calc(100vh - 28px)",
  margin: 14,
  borderRadius: 28,
  padding: 20,
  background: "linear-gradient(180deg, rgba(15,23,42,0.99), rgba(2,6,23,0.99))",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 35px 110px rgba(0,0,0,0.54)",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
};

const drawerFichaHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "flex-start",
  paddingBottom: 16,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const drawerFichaScroll: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 14,
  padding: "16px 2px",
};

const drawerFichaActions: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  paddingTop: 14,
  borderTop: "1px solid rgba(255,255,255,0.08)",
  flexWrap: "wrap",
};

const drawerFichaActionsGrupo: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const fichaCampoBox: CSSProperties = {
  borderRadius: 20,
  padding: 16,
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const fichaCampoHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 8,
};

const campoTipoBadge: CSSProperties = {
  display: "inline-flex",
  borderRadius: 999,
  padding: "6px 9px",
  background: "rgba(124,58,237,0.14)",
  border: "1px solid rgba(124,58,237,0.20)",
  color: "#ddd6fe",
  fontSize: 11,
  fontWeight: 950,
  marginBottom: 8,
};

const campoAjudaTexto: CSSProperties = {
  margin: "8px 0 12px",
  color: "#94a3b8",
  fontSize: 12,
  lineHeight: 1.5,
  fontWeight: 700,
};

const textareaFicha: CSSProperties = {
  ...input,
  minHeight: 96,
  resize: "vertical",
  fontFamily: "inherit",
};

const opcoesChecklist: CSSProperties = {
  display: "grid",
  gap: 8,
};

const checkLinhaFicha: CSSProperties = {
  display: "flex",
  gap: 9,
  alignItems: "center",
  borderRadius: 14,
  padding: "10px 12px",
  background: "rgba(2,6,23,0.42)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "#e2e8f0",
  fontSize: 13,
  fontWeight: 850,
};

const lgpdBox: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  borderRadius: 18,
  padding: 14,
  background: "rgba(34,197,94,0.10)",
  border: "1px solid rgba(34,197,94,0.16)",
  color: "#bbf7d0",
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 850,
};

const assinaturaBox: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};
