"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { gerarTemaEmpresa } from "@/app/lib/theme";

export default function AgendarPage() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const clienteIdUrl = searchParams.get("clienteId");
  const origemUrl = searchParams.get("origem");
  const veioDoPainel = origemUrl === "painel";

  const [empresa, setEmpresa] = useState<any>(null);
  const [servicos, setServicos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [promocoes, setPromocoes] = useState<any[]>([]);

  const [servicoId, setServicoId] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [data, setData] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [servicosCarrinho, setServicosCarrinho] = useState<any[]>([]);
  const [camposFichaServico, setCamposFichaServico] = useState<any[]>([]);
  const [respostasFichaServico, setRespostasFichaServico] = useState<Record<string, any>>({});
  const [carregandoFichaServico, setCarregandoFichaServico] = useState(false);
  const [salvandoFichaServico, setSalvandoFichaServico] = useState(false);
  const [fichasRegistrosPorServico, setFichasRegistrosPorServico] = useState<Record<string, string>>({});
  const [fichasTitulosPorServico, setFichasTitulosPorServico] = useState<Record<string, string>>({});
  const [galeriaServicoAberta, setGaleriaServicoAberta] = useState<
    string[] | null
  >(null);
  const [imagemGaleriaAtual, setImagemGaleriaAtual] = useState(0);

  const [cpf, setCpf] = useState("");
  const [buscandoCpf, setBuscandoCpf] = useState(false);
  const [cpfConsultado, setCpfConsultado] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState<any>(null);
  const [mostrarCamposExtras, setMostrarCamposExtras] = useState(false);

  const [modoReagendamento, setModoReagendamento] = useState(false);
  const [buscandoReagendamentos, setBuscandoReagendamentos] = useState(false);
  const [agendamentosReagendamento, setAgendamentosReagendamento] = useState<
    any[]
  >([]);
  const [agendamentoSelecionado, setAgendamentoSelecionado] =
    useState<any>(null);
  const [novaDataReagendamento, setNovaDataReagendamento] = useState("");
  const [novosHorariosReagendamento, setNovosHorariosReagendamento] = useState<
    string[]
  >([]);
  const [novoHorarioReagendamento, setNovoHorarioReagendamento] = useState("");
  const [reagendando, setReagendando] = useState(false);
  const [reagendamentoDireto, setReagendamentoDireto] = useState(false);

  const [cliente, setCliente] = useState({
    nome: "",
    whatsapp: "",
    dataNascimento: "",
    cpf: "",
  });

  const [etapaAtual, setEtapaAtual] = useState<
    | "identificacao"
    | "servico"
    | "ficha"
    | "profissional"
    | "data"
    | "horario"
    | "confirmacao"
  >("identificacao");

  useEffect(() => {
    carregarEmpresa();
  }, [slug]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [etapaAtual]);

  function hojeFormatoInput() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function dataMaximaNascimentoPermitida() {
    const hoje = new Date();

    const dataLimite = new Date(
      hoje.getFullYear() - 10,
      hoje.getMonth(),
      hoje.getDate(),
    );

    const ano = dataLimite.getFullYear();

    const mes = String(dataLimite.getMonth() + 1).padStart(2, "0");

    const dia = String(dataLimite.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function clienteTemIdadeMinima(dataNascimento?: string) {
    if (!dataNascimento) return false;

    const hoje = new Date();

    const nascimento = new Date(`${dataNascimento}T00:00:00`);

    let idade = hoje.getFullYear() - nascimento.getFullYear();

    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return idade >= 10;
  }

  function somenteNumeros(valor: string) {
    return valor.replace(/\D/g, "");
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

  function formatarDataHora(dataHora?: string | null) {
    if (!dataHora) return "Data não informada";

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(dataHora));
  }

  function limparFluxoAgendamento() {
    setReagendamentoDireto(false);
    setAgendamentoSelecionado(null);
    setServicoId("");
    setProfissionalId("");
    setData("");
    setHorarios([]);
    setHorarioSelecionado("");
    setCamposFichaServico([]);
    setRespostasFichaServico({});
  }

  function limparFluxoReagendamento() {
    setAgendamentosReagendamento([]);
    setAgendamentoSelecionado(null);
    setNovaDataReagendamento("");
    setNovosHorariosReagendamento([]);
    setNovoHorarioReagendamento("");
  }

  function abrirWhatsappEmpresa() {
    const numeroEmpresa = somenteNumeros(
      empresa?.whatsapp || empresa?.telefone || "",
    );

    if (!numeroEmpresa) {
      alert("A empresa ainda não possui WhatsApp/telefone cadastrado.");
      return;
    }

    const mensagem = encodeURIComponent(
      `Olá! Estou tentando reagendar um horário pelo Marcaê e preciso de ajuda.\n\nEmpresa: ${empresa.nome}`,
    );

    window.open(`https://wa.me/55${numeroEmpresa}?text=${mensagem}`, "_blank");
  }

  async function carregarEmpresa() {
    const res = await fetch(`/api/empresas/slug/${slug}`);
    const data = await res.json();

    if (!data.empresa) {
      alert("Empresa não encontrada");
      return;
    }

    setEmpresa(data.empresa);
    carregarDados(data.empresa.id);

    if (clienteIdUrl) {
      carregarClientePorId(data.empresa.id, clienteIdUrl);
    }
  }

  async function carregarClientePorId(empresaId: string, clienteId: string) {
    try {
      const res = await fetch(
        `/api/v1/clients?empresaId=${empresaId}&clienteId=${clienteId}`,
        { cache: "no-store" },
      );

      const data = await res.json();

      if (!data.cliente) {
        alert("Cliente não encontrado para esta empresa.");
        return;
      }

      setCpf(formatarCpf(data.cliente.cpf || ""));
      setCpfConsultado(true);
      setClienteEncontrado(data.cliente);
      setMostrarCamposExtras(false);
      setModoReagendamento(false);

      setCliente({
        nome: data.cliente.nome || "",
        whatsapp: data.cliente.whatsapp || "",
        dataNascimento: data.cliente.dataNascimento
          ? String(data.cliente.dataNascimento).slice(0, 10)
          : "",
        cpf: data.cliente.cpf || "",
      });

      await carregarPromocoesComCpf(empresaId, data.cliente.cpf || cpf);

      setEtapaAtual("servico");
    } catch (error) {
      alert("Erro ao carregar cliente selecionado.");
    }
  }

  async function carregarDados(empresaId: string) {
    const [s, p, promocoesRes] = await Promise.all([
      fetch(`/api/servicos?empresaId=${empresaId}`, { cache: "no-store" }).then(
        (r) => r.json(),
      ),
      fetch(`/api/profissionais?empresaId=${empresaId}`, {
        cache: "no-store",
      }).then((r) => r.json()),
      fetch(`/api/promocoes?empresaId=${empresaId}`, {
        cache: "no-store",
      }).then((r) => r.json()),
    ]);

    setServicos(
      (s.servicos || []).filter((servico: any) => servico.ativo !== false),
    );

    setProfissionais(
      (p.profissionais || []).filter(
        (profissional: any) => profissional.ativo !== false,
      ),
    );
    setPromocoes(promocoesRes.promocoes || []);
  }

  async function carregarPromocoesComCpf(
    empresaId: string,
    cpfCliente?: string | null,
  ) {
    const cpfLimpo = somenteNumeros(cpfCliente || "");
    const queryCpf = cpfLimpo ? `&cpf=${cpfLimpo}` : "";

    const res = await fetch(
      `/api/promocoes?empresaId=${empresaId}${queryCpf}`,
      {
        cache: "no-store",
      },
    );

    const data = await res.json();
    setPromocoes(data.promocoes || []);
  }

  async function buscarClientePorCpf() {
    if (!empresa?.id) return;

    const cpfLimpo = somenteNumeros(cpf);

    if (cpfLimpo.length !== 11) {
      alert("Informe um CPF válido com 11 dígitos.");
      return;
    }

    try {
      setBuscandoCpf(true);
      setModoReagendamento(false);
      limparFluxoReagendamento();

      const res = await fetch(
        `/api/v1/clients/by-cpf?empresaId=${empresa.id}&cpf=${cpfLimpo}`,
      );

      const data = await res.json();

      setCpfConsultado(true);

      if (data.cliente) {
        setClienteEncontrado(data.cliente);

        setCliente({
          nome: data.cliente.nome || "",
          whatsapp: data.cliente.whatsapp || "",
          dataNascimento: data.cliente.dataNascimento
            ? String(data.cliente.dataNascimento).slice(0, 10)
            : "",
          cpf: data.cliente.cpf || "",
        });

        await carregarPromocoesComCpf(empresa.id, data.cliente.cpf || cpfLimpo);

        setMostrarCamposExtras(false);
        setEtapaAtual("servico");
      } else {
        setClienteEncontrado(null);
        setCliente({
          nome: "",
          whatsapp: "",
          dataNascimento: "",
          cpf: "",
        });
        await carregarPromocoesComCpf(empresa.id, cpfLimpo);
        setMostrarCamposExtras(true);
        setEtapaAtual("identificacao");
      }
    } catch (error) {
      alert("Erro ao consultar CPF. Tente novamente.");
    } finally {
      setBuscandoCpf(false);
    }
  }

  async function buscarAgendamentosParaReagendar() {
    if (!empresa?.id) return;

    const cpfLimpo = somenteNumeros(cpf);

    if (cpfLimpo.length !== 11) {
      alert("Informe o CPF para buscar seus agendamentos.");
      return;
    }

    try {
      setModoReagendamento(true);
      setEtapaAtual("identificacao");
      setCpfConsultado(false);
      setClienteEncontrado(null);
      setMostrarCamposExtras(false);
      limparFluxoAgendamento();
      limparFluxoReagendamento();
      setBuscandoReagendamentos(true);

      const res = await fetch(
        `/api/agendamentos/reagendar?empresaId=${empresa.id}&cpf=${cpfLimpo}`,
        { cache: "no-store" },
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Erro ao buscar agendamentos para reagendamento.");
        return;
      }

      setAgendamentosReagendamento(data.agendamentos || []);
    } catch (error) {
      alert("Erro ao buscar agendamentos para reagendamento.");
    } finally {
      setBuscandoReagendamentos(false);
    }
  }

  async function buscarHorarios() {
    if (!servicoId || !profissionalId || !data) {
      alert("Selecione serviço, profissional e data para buscar horários.");
      return false;
    }

    if (data < hojeFormatoInput()) {
      alert("A data do atendimento não pode ser anterior ao dia atual.");
      setData("");
      setHorarios([]);
      setHorarioSelecionado("");
      return false;
    }

    const params = new URLSearchParams({
      empresaId: empresa.id,
      profissionalId,
      servicoId,
      data,
    });

    const clienteIdAtual = clienteEncontrado?.id || clienteIdUrl || "";
    const cpfAtual = somenteNumeros(
      clienteEncontrado?.cpf ||
        clienteEncontrado?.clienteCpf ||
        cpf ||
        cliente?.cpf ||
        "",
    );

    if (clienteIdAtual) {
      params.set("clienteId", clienteIdAtual);
    }

    if (cpfAtual) {
      params.set("cpf", cpfAtual);
    }

    const res = await fetch(`/api/horarios-disponiveis?${params.toString()}`, {
      cache: "no-store",
    });

    const dataRes = await res.json();
    setHorarios(dataRes.horarios || []);
    setHorarioSelecionado("");
    return true;
  }

  async function buscarHorariosReagendamento() {
    if (!agendamentoSelecionado) {
      alert("Selecione um agendamento para reagendar.");
      return;
    }

    if (!novaDataReagendamento) {
      alert("Selecione a nova data.");
      return;
    }

    if (novaDataReagendamento < hojeFormatoInput()) {
      alert("A nova data não pode ser anterior ao dia atual.");
      setNovaDataReagendamento("");
      setNovosHorariosReagendamento([]);
      setNovoHorarioReagendamento("");
      return;
    }

    const servicoAtualId = agendamentoSelecionado.servicoId;
    const profissionalAtualId = agendamentoSelecionado.profissionalId;

    if (!servicoAtualId || !profissionalAtualId) {
      alert(
        "Este agendamento não possui serviço ou profissional vinculado para buscar horários.",
      );
      return;
    }

    const params = new URLSearchParams({
      empresaId: empresa.id,
      profissionalId: profissionalAtualId,
      servicoId: servicoAtualId,
      data: novaDataReagendamento,
    });

    const clienteIdAtual =
      agendamentoSelecionado.clienteId ||
      agendamentoSelecionado.cliente?.id ||
      agendamentoSelecionado.Cliente?.id ||
      clienteEncontrado?.id ||
      clienteIdUrl ||
      "";

    const cpfAtual = somenteNumeros(
      agendamentoSelecionado.clienteCpf ||
        agendamentoSelecionado.cpf ||
        agendamentoSelecionado.cliente?.cpf ||
        agendamentoSelecionado.Cliente?.cpf ||
        clienteEncontrado?.cpf ||
        cpf ||
        "",
    );

    if (clienteIdAtual) {
      params.set("clienteId", clienteIdAtual);
    }

    if (cpfAtual) {
      params.set("cpf", cpfAtual);
    }

    const res = await fetch(`/api/horarios-disponiveis?${params.toString()}`, {
      cache: "no-store",
    });

    const dataRes = await res.json();
    setNovosHorariosReagendamento(dataRes.horarios || []);
    setNovoHorarioReagendamento("");
  }

  function redirecionarParaComprovante(
    agendamentoId?: string | null,
    ids?: string | null,
  ) {
    if (!agendamentoId) {
      alert(
        "Agendamento atualizado, mas não foi possível localizar o comprovante.",
      );
      return;
    }

    const idsParam = ids || agendamentoId;
    const destino = `/sucesso/${agendamentoId}?ids=${encodeURIComponent(
      idsParam,
    )}#comprovante`;

    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      sessionStorage.setItem("marcae_forcar_topo_sucesso", "true");
    } catch (error) {}

    window.location.assign(destino);
  }

  async function confirmarReagendamento() {
    if (!agendamentoSelecionado) return alert("Selecione o agendamento.");
    if (!novaDataReagendamento) return alert("Selecione a nova data.");
    if (!novoHorarioReagendamento) return alert("Selecione o novo horário.");

    if (novaDataReagendamento < hojeFormatoInput()) {
      alert("A nova data não pode ser anterior ao dia atual.");
      setNovaDataReagendamento("");
      setNovosHorariosReagendamento([]);
      setNovoHorarioReagendamento("");
      return;
    }

    try {
      setReagendando(true);

      const novaDataHora = new Date(
        `${novaDataReagendamento}T${novoHorarioReagendamento}`,
      );

      const res = await fetch("/api/agendamentos/reagendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agendamentoId: agendamentoSelecionado.id,
          dataHoraInicio: novaDataHora,
          servicoId: agendamentoSelecionado.servicoId,
          profissionalId: agendamentoSelecionado.profissionalId,
          permitirMenosDe24h: false,
          permitirReagendamentoAberto: true,
        }),
      });

      const dataRes = await res.json();

      if (!dataRes.success) {
        alert(dataRes.error || "Erro ao reagendar atendimento.");
        return;
      }

      redirecionarParaComprovante(dataRes.agendamento?.id);
    } catch (error) {
      alert("Erro ao reagendar atendimento.");
    } finally {
      setReagendando(false);
    }
  }


  function servicoPossuiFicha(servico: any) {
    return Boolean(servico?.fichaModeloId || servico?.fichaModelo?.id);
  }

  function obterFichaModeloIdServico(servico: any) {
    return servico?.fichaModeloId || servico?.fichaModelo?.id || "";
  }

  function obterTituloFichaServico(servico: any) {
    return servico?.fichaModelo?.titulo || "Ficha digital";
  }

  async function carregarCamposFichaDoServico(servico: any) {
    if (!empresa?.id || !servicoPossuiFicha(servico)) {
      setCamposFichaServico([]);
      setRespostasFichaServico({});
      return false;
    }

    const modeloId = obterFichaModeloIdServico(servico);

    if (!modeloId) {
      setCamposFichaServico([]);
      setRespostasFichaServico({});
      return false;
    }

    try {
      setCarregandoFichaServico(true);

      const res = await fetch(
        `/api/fichas-digitais/campos?empresaId=${empresa.id}&modeloId=${modeloId}&respondidoPor=cliente`,
        { cache: "no-store" },
      );

      const dataRes = await res.json();
      const campos = (Array.isArray(dataRes.campos) ? dataRes.campos : []).filter(
        (campo: any) => (campo.respondidoPor || "cliente") === "cliente",
      );

      setCamposFichaServico(campos);

      setRespostasFichaServico((atual) => {
        const novo = { ...atual };

        campos.forEach((campo: any) => {
          if (novo[campo.id] !== undefined) return;

          const tipoCampo = normalizarTipoFicha(campo.tipo);

          if (tipoCampo === "multiselecao") {
            novo[campo.id] = [];
          } else if (tipoCampo === "termo_lgpd" || tipoCampo === "assinatura") {
            novo[campo.id] = false;
          } else {
            novo[campo.id] = "";
          }
        });

        return novo;
      });

      return campos.length > 0;
    } catch (error) {
      console.error("Erro ao carregar ficha do serviço:", error);
      alert("Não foi possível carregar a ficha digital deste serviço.");
      setCamposFichaServico([]);
      return false;
    } finally {
      setCarregandoFichaServico(false);
    }
  }

  function alterarRespostaFicha(campoId: string, valor: any) {
    setRespostasFichaServico((atual) => ({
      ...atual,
      [campoId]: valor,
    }));
  }

  function opcoesCampoFicha(campo: any) {
    if (Array.isArray(campo?.opcoes)) return campo.opcoes;

    if (typeof campo?.opcoes === "string") {
      try {
        const parsed = JSON.parse(campo.opcoes);
        if (Array.isArray(parsed)) return parsed;
      } catch (error) {}

      return campo.opcoes
        .split("\n")
        .map((item: string) => item.trim())
        .filter(Boolean);
    }

    if (campo?.opcoes && typeof campo.opcoes === "object") {
      if (Array.isArray(campo.opcoes.itens)) return campo.opcoes.itens;
      if (Array.isArray(campo.opcoes.opcoes)) return campo.opcoes.opcoes;
    }

    return [];
  }

  function normalizarTipoFicha(tipo: any) {
    const normalizado = String(tipo || "texto")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s-]+/g, "_");

    if (normalizado.includes("assinatura")) return "assinatura";
    if (normalizado.includes("foto") || normalizado.includes("imagem")) return "foto";
    if (normalizado.includes("lgpd")) return "termo_lgpd";
    if (normalizado.includes("multi")) return "multiselecao";
    if (normalizado.includes("sim") && normalizado.includes("nao")) return "sim_nao";

    return normalizado;
  }

  function campoFichaEstaRespondido(campo: any) {
    const valor = respostasFichaServico[campo.id];
    const tipoCampo = normalizarTipoFicha(campo.tipo);

    if (tipoCampo === "termo_lgpd") {
      return Boolean(valor);
    }

    if (tipoCampo === "assinatura") {
      return Boolean(valor);
    }

    if (tipoCampo === "multiselecao") {
      return Array.isArray(valor) && valor.length > 0;
    }

    if (tipoCampo === "foto") {
      return true;
    }

    if (valor === null || valor === undefined) {
      return false;
    }

    return String(valor).trim().length > 0;
  }

  function validarFichaAtual() {
    const camposObrigatorios = camposFichaServico.filter(
      (campo: any) => campo.obrigatorio && (campo.respondidoPor || "cliente") === "cliente",
    );
    const pendente = camposObrigatorios.find((campo: any) => !campoFichaEstaRespondido(campo));

    if (pendente) {
      alert(`Responda a pergunta obrigatória: ${pendente.titulo}`);
      return false;
    }

    const exigeAceiteLgpd = Boolean(servicoSelecionado?.fichaModelo?.exigeAceiteLgpd);
    const campoLgpd = camposFichaServico.find((campo: any) => normalizarTipoFicha(campo.tipo) === "termo_lgpd");

    if (exigeAceiteLgpd && campoLgpd && !campoFichaEstaRespondido(campoLgpd)) {
      alert("É necessário aceitar o termo LGPD para continuar.");
      return false;
    }

    return true;
  }

  async function salvarFichaDoServicoEAvancar() {
    if (!servicoSelecionado || !servicoPossuiFicha(servicoSelecionado)) {
      setEtapaAtual("profissional");
      return;
    }

    if (fichasRegistrosPorServico[servicoSelecionado.id]) {
      setEtapaAtual("profissional");
      return;
    }

    if (!validarFichaAtual()) return;

    try {
      setSalvandoFichaServico(true);

      const respostas = camposFichaServico
        .filter((campo: any) => (campo.respondidoPor || "cliente") === "cliente")
        .map((campo: any, index: number) => ({
        campoId: campo.id,
        campoTitulo: campo.titulo,
        campoTipo: campo.tipo,
        valor: respostasFichaServico[campo.id],
        ordem: campo.ordem ?? index,
      }));

      const res = await fetch("/api/fichas-digitais/preencher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresaId: empresa.id,
          modeloId: obterFichaModeloIdServico(servicoSelecionado),
          clienteId: clienteEncontrado?.id || clienteIdUrl || null,
          clienteCpf: somenteNumeros(
            clienteEncontrado?.cpf || clienteEncontrado?.clienteCpf || cpf || cliente?.cpf || "",
          ),
          clienteNome: clienteEncontrado?.nome || cliente.nome || null,
          origem: "agendador",
          preenchidoPorTipo: "cliente",
          preenchidoPorNome: clienteEncontrado?.nome || cliente.nome || null,
          assinaturaNome: clienteEncontrado?.nome || cliente.nome || null,
          assinaturaCpf: somenteNumeros(
            clienteEncontrado?.cpf || clienteEncontrado?.clienteCpf || cpf || cliente?.cpf || "",
          ),
          aceiteLgpd: camposFichaServico.some(
            (campo: any) => normalizarTipoFicha(campo.tipo) === "termo_lgpd" && Boolean(respostasFichaServico[campo.id]),
          ),
          respostas,
        }),
      });

      const dataRes = await res.json();

      if (!res.ok || !dataRes.success) {
        alert(dataRes.error || "Erro ao salvar ficha digital.");
        return;
      }

      setFichasRegistrosPorServico((atual) => ({
        ...atual,
        [servicoSelecionado.id]: dataRes.registro?.id,
      }));

      setFichasTitulosPorServico((atual) => ({
        ...atual,
        [servicoSelecionado.id]: dataRes.registro?.tituloSnapshot || obterTituloFichaServico(servicoSelecionado),
      }));

      setEtapaAtual("profissional");
    } catch (error) {
      console.error("Erro ao salvar ficha digital:", error);
      alert("Erro ao salvar ficha digital. Tente novamente.");
    } finally {
      setSalvandoFichaServico(false);
    }
  }

  async function agendar() {
    if (!clienteEncontrado && !cpf) return alert("Informe o CPF");
    if (!clienteEncontrado && !cpfConsultado)
      return alert("Clique em continuar para validar o CPF");

    if (itensResumo.length === 0) {
      return alert(
        "Adicione pelo menos um serviço para finalizar o agendamento.",
      );
    }

    const itemPrincipalResumo = itensResumo[0];

    if (!itemPrincipalResumo?.servicoId) return alert("Selecione um serviço");
    if (!itemPrincipalResumo?.profissionalId)
      return alert("Selecione um profissional");
    if (!itemPrincipalResumo?.data) return alert("Selecione uma data");

    if (itemPrincipalResumo.data < hojeFormatoInput()) {
      alert("A data do atendimento não pode ser anterior ao dia atual.");
      setData("");
      setHorarios([]);
      setHorarioSelecionado("");
      return;
    }

    if (!itemPrincipalResumo?.horario) return alert("Selecione um horário");

    if (!clienteEncontrado) {
      if (!cliente.nome.trim()) return alert("Informe seu nome completo");
      if (!cliente.whatsapp.trim()) return alert("Informe seu WhatsApp");
      if (!cliente.dataNascimento)
        return alert("Informe sua data de nascimento");

      const hoje = new Date();
      const nascimento = new Date(cliente.dataNascimento);

      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const mes = hoje.getMonth() - nascimento.getMonth();

      if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }

      if (idade < 10) {
        return alert(
          "É necessário ter pelo menos 10 anos para realizar um agendamento.",
        );
      }
    }

    const dataHora = new Date(
      `${itemPrincipalResumo.data}T${itemPrincipalResumo.horario}`,
    );

    if (reagendamentoDireto && agendamentoSelecionado?.id) {
      const confirmar = confirm(
        `Confirma o reagendamento do atendimento aberto para ${new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR")} às ${horarioSelecionado}?`,
      );

      if (!confirmar) {
        return;
      }

      const reagendamentoRes = await fetch("/api/agendamentos/reagendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agendamentoId: agendamentoSelecionado.id,
          dataHoraInicio: dataHora,
          servicoId,
          profissionalId,
          permitirMenosDe24h: false,
          permitirReagendamentoAberto: true,
        }),
      });

      const reagendamentoData = await reagendamentoRes.json();

      if (!reagendamentoData.success) {
        alert(reagendamentoData.error || "Erro ao reagendar atendimento.");
        return;
      }

      redirecionarParaComprovante(reagendamentoData.agendamento?.id);
      return;
    }

    const res = await fetch("/api/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empresaId: empresa.id,
        clienteId: clienteEncontrado?.id || null,
        cliente: {
          ...cliente,
          cpf: somenteNumeros(cpf),
          whatsapp: somenteNumeros(cliente.whatsapp),
        },
        servicosCarrinho: itensResumo.map((item) => ({
          servicoId: item.servicoId,
          profissionalId: item.profissionalId,
          dataHoraInicio: new Date(`${item.data}T${item.horario}`),
          fichaRegistroId:
            item.fichaRegistroId || fichasRegistrosPorServico[item.servicoId] || null,
        })),
        fichasRegistrosPorServico: itensResumo
          .filter((item) => item.fichaRegistroId || fichasRegistrosPorServico[item.servicoId])
          .map((item) => ({
            servicoId: item.servicoId,
            registroId:
              item.fichaRegistroId || fichasRegistrosPorServico[item.servicoId],
          })),
        servicoId: itemPrincipalResumo.servicoId,
        profissionalId: itemPrincipalResumo.profissionalId,
        dataHoraInicio: dataHora,
      }),
    });

    const dataRes = await res.json();

    if (!dataRes.success) {
      if (dataRes.reagendamentoDisponivel && dataRes.agendamentoExistente) {
        const desejaReagendar = confirm(
          `${dataRes.error || "Você já possui um atendimento em aberto para este serviço."}\n\nDeseja reagendar esse atendimento para ${data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "a nova data"} às ${horarioSelecionado}?`,
        );

        if (!desejaReagendar) {
          return;
        }

        const agendamentoAberto = dataRes.agendamentoExistente;

        const reagendamentoRes = await fetch("/api/agendamentos/reagendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agendamentoId: agendamentoAberto.id,
            dataHoraInicio: dataHora,
            servicoId: agendamentoAberto.servicoId || servicoId,
            profissionalId: profissionalId || agendamentoAberto.profissionalId,
            permitirMenosDe24h: false,
            permitirReagendamentoAberto: true,
          }),
        });

        const reagendamentoData = await reagendamentoRes.json();

        if (!reagendamentoData.success) {
          alert(reagendamentoData.error || "Erro ao reagendar atendimento.");
          return;
        }

        redirecionarParaComprovante(reagendamentoData.agendamento?.id);
        return;
      }

      alert(dataRes.error || "Erro ao agendar");
      return;
    }

    const agendamentosCriados = Array.isArray(dataRes.agendamentos)
      ? dataRes.agendamentos
      : dataRes.agendamento
        ? [dataRes.agendamento]
        : [];

    const agendamentoPrincipal = dataRes.agendamento || agendamentosCriados[0];

    if (!agendamentoPrincipal?.id) {
      alert(
        "Agendamento criado, mas não foi possível localizar o comprovante.",
      );
      return;
    }

    const idsAgendamentos =
      agendamentosCriados.length > 0
        ? agendamentosCriados.map((a: any) => a.id).join(",")
        : agendamentoPrincipal.id;

    if (existePrePagamentoResumo) {
      const pagamentoRes = await fetch("/api/pagamentos/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agendamentoId: agendamentoPrincipal.id,
          tipo: "agendamento",
          agendamentosIds: idsAgendamentos.split(","),
          valorTotal: totalResumo,
        }),
      });

      const pagamentoData = await pagamentoRes.json();

      if (pagamentoData.linkPagamento) {
        window.location.href = pagamentoData.linkPagamento;
        return;
      }

      alert(pagamentoData.error || "Erro ao gerar pagamento");
      return;
    }

    redirecionarParaComprovante(agendamentoPrincipal.id, idsAgendamentos);
  }

  function clienteNovoValido() {
    if (clienteEncontrado) return true;

    if (!cpfConsultado) {
      alert("Clique em continuar para validar o CPF.");
      return false;
    }

    if (!cliente.nome.trim()) {
      alert("Informe seu nome completo.");
      return false;
    }

    if (!cliente.whatsapp.trim()) {
      alert("Informe seu WhatsApp.");
      return false;
    }

    if (!cliente.dataNascimento) {
      alert("Informe sua data de nascimento.");
      return false;
    }

    if (!clienteTemIdadeMinima(cliente.dataNascimento)) {
      alert(
        "É necessário ter pelo menos 10 anos para realizar um agendamento.",
      );

      return false;
    }

    return true;
  }

  function avancarParaServico() {
    if (!clienteEncontrado && !cpf) {
      alert("Informe o CPF.");
      return;
    }

    if (!clienteNovoValido()) return;

    setModoReagendamento(false);
    setEtapaAtual("servico");
  }

  async function verificarAgendamentoAbertoParaServico(servicoIdBusca: string) {
    if (!empresa?.id) return null;

    const cpfAtual = somenteNumeros(
      clienteEncontrado?.cpf || clienteEncontrado?.clienteCpf || cpf || "",
    );

    if (!cpfAtual) return null;

    try {
      const params = new URLSearchParams({
        empresaId: empresa.id,
        cpf: cpfAtual,
        servicoId: servicoIdBusca,
        modo: "aberto_servico",
      });

      const res = await fetch(
        `/api/agendamentos/reagendar?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const dataRes = await res.json();

      if (!dataRes.success) {
        return null;
      }

      return dataRes.agendamentoAberto || null;
    } catch (error) {
      return null;
    }
  }

  async function selecionarServicoPublico(servicoIdSelecionado: string) {
    const servicoJaEstaNoResumo = itensResumo.some(
      (item) => item.servicoId === servicoIdSelecionado,
    );

    if (servicoJaEstaNoResumo) {
      alert(
        "Este serviço já foi adicionado ao agendamento. Para alterar, remova o serviço existente primeiro.",
      );
      return;
    }
    setServicoId("");
    setProfissionalId("");
    setData("");
    setHorarios([]);
    setHorarioSelecionado("");
    setReagendamentoDireto(false);
    setAgendamentoSelecionado(null);
    setCamposFichaServico([]);
    setRespostasFichaServico({});

    const agendamentoAberto =
      await verificarAgendamentoAbertoParaServico(servicoIdSelecionado);

    if (agendamentoAberto) {
      const desejaReagendar = confirm(
        `Já existe um atendimento aberto para esse serviço.\n\nServiço: ${agendamentoAberto.servico?.nome || "Serviço selecionado"}\nAgendamento atual: ${formatarDataHora(agendamentoAberto.dataHoraInicio)}\n\nDeseja reagendar esse atendimento?`,
      );

      if (!desejaReagendar) {
        alert(
          "Para evitar duplicidade, não será criado outro agendamento para esse serviço enquanto houver um atendimento em aberto.",
        );
        return;
      }

      setServicoId(servicoIdSelecionado);
      setAgendamentoSelecionado(agendamentoAberto);
      setReagendamentoDireto(true);
      setModoReagendamento(false);
      setEtapaAtual("profissional");
      return;
    }

    setServicoId(servicoIdSelecionado);
    setProfissionalId("");
    setData("");
    setHorarios([]);
    setHorarioSelecionado("");
    setReagendamentoDireto(false);
    setAgendamentoSelecionado(null);
    setCamposFichaServico([]);
    setRespostasFichaServico({});
    setModoReagendamento(false);
  }

  async function avancarParaProfissional() {
    if (!servicoId) {
      alert("Escolha um serviço para continuar.");
      return;
    }

    if (servicoPossuiFicha(servicoSelecionado) && !fichasRegistrosPorServico[servicoId]) {
      const possuiCamposParaCliente = await carregarCamposFichaDoServico(servicoSelecionado);

      if (possuiCamposParaCliente) {
        setEtapaAtual("ficha");
        return;
      }
    }

    setEtapaAtual("profissional");
  }

  function avancarParaData() {
    if (!profissionalId) {
      alert("Escolha um profissional para continuar.");
      return;
    }

    setEtapaAtual("data");
  }

  async function avancarParaHorarios() {
    const ok = await buscarHorarios();
    if (ok) {
      setEtapaAtual("horario");
    }
  }

  function avancarParaConfirmacao() {
    if (!horarioSelecionado) {
      alert("Escolha um horário para continuar.");
      return;
    }

    setEtapaAtual("confirmacao");
  }

  function adicionarServicoAoCarrinho() {
    if (
      !servicoSelecionado ||
      !profissionalSelecionado ||
      !data ||
      !horarioSelecionado
    ) {
      alert(
        "Selecione serviço, profissional, data e horário antes de adicionar.",
      );
      return;
    }

    const servicoJaAdicionado = servicosCarrinho.some(
      (item) => item.servicoId === servicoId,
    );

    if (servicoJaAdicionado) {
      alert(
        "Este serviço já foi adicionado ao agendamento. Para alterar, remova o serviço existente primeiro.",
      );
      return;
    }

    const item = {
      id: `${servicoId}-${profissionalId}-${data}-${horarioSelecionado}-${Date.now()}`,
      servicoId,
      profissionalId,
      data,
      horario: horarioSelecionado,
      servico: servicoSelecionado,
      profissional: profissionalSelecionado,
      fichaRegistroId: fichasRegistrosPorServico[servicoId] || null,
      fichaTitulo: fichasTitulosPorServico[servicoId] || obterTituloFichaServico(servicoSelecionado),
    };

    setServicosCarrinho((atual) => [...atual, item]);
    limparFluxoAgendamento();
    setEtapaAtual("servico");
  }

  function removerServicoDoCarrinho(itemId: string) {
    if (itensResumo.length <= 1) {
      alert("Mantenha pelo menos um serviço para finalizar o agendamento.");
      return;
    }

    if (itemId === "atual") {
      setServicoId("");
      setProfissionalId("");
      setData("");
      setHorarios([]);
      setHorarioSelecionado("");
      setReagendamentoDireto(false);
      setAgendamentoSelecionado(null);
      return;
    }

    setServicosCarrinho((atual) => atual.filter((item) => item.id !== itemId));
  }

  function iniciarAdicionarOutroServico() {
    if (
      !servicoSelecionado ||
      !profissionalSelecionado ||
      !data ||
      !horarioSelecionado
    ) {
      setServicoId("");
      setProfissionalId("");
      setData("");
      setHorarios([]);
      setHorarioSelecionado("");
      setReagendamentoDireto(false);
      setAgendamentoSelecionado(null);
      setEtapaAtual("servico");
      return;
    }

    const servicoJaEstaNoCarrinho = servicosCarrinho.some(
      (item) => item.servicoId === servicoId,
    );

    if (!servicoJaEstaNoCarrinho) {
      const item = {
        id: `${servicoId}-${profissionalId}-${data}-${horarioSelecionado}-${Date.now()}`,
        servicoId,
        profissionalId,
        data,
        horario: horarioSelecionado,
        servico: servicoSelecionado,
        profissional: profissionalSelecionado,
        fichaRegistroId: fichasRegistrosPorServico[servicoId] || null,
        fichaTitulo: fichasTitulosPorServico[servicoId] || obterTituloFichaServico(servicoSelecionado),
      };

      setServicosCarrinho((atual) => [...atual, item]);
    }

    setServicoId("");
    setProfissionalId("");
    setData("");
    setHorarios([]);
    setHorarioSelecionado("");
    setReagendamentoDireto(false);
    setAgendamentoSelecionado(null);
    setEtapaAtual("servico");
  }

  function numeroValor(valor: any) {
    if (valor === null || valor === undefined || valor === "") return 0;

    const convertido = Number(String(valor).replace(",", "."));

    return Number.isNaN(convertido) ? 0 : convertido;
  }

  function obterValorOriginalServico(servico: any) {
    return numeroValor(
      servico?.valor ?? servico?.preco ?? servico?.valorTotal ?? 0,
    );
  }

  function promocaoEstaAtiva(promocao: any) {
    if (!promocao) return false;
    if (promocao.status !== "ativa") return false;

    const agora = new Date();
    const inicio = promocao.dataInicio ? new Date(promocao.dataInicio) : null;
    const fim = promocao.dataFim ? new Date(promocao.dataFim) : null;

    if (inicio) {
      inicio.setHours(0, 0, 0, 0);
    }

    if (fim) {
      fim.setHours(23, 59, 59, 999);
    }

    if (inicio && agora < inicio) return false;
    if (fim && agora > fim) return false;

    return true;
  }

  function clienteFazAniversarioNoMesAtual() {
    const dataNascimento =
      clienteEncontrado?.dataNascimento ||
      clienteEncontrado?.clienteNascimento ||
      cliente.dataNascimento;

    if (!dataNascimento) return false;

    const nascimento = new Date(
      `${String(dataNascimento).slice(0, 10)}T00:00:00`,
    );

    if (Number.isNaN(nascimento.getTime())) return false;

    return nascimento.getMonth() === new Date().getMonth();
  }

  function promocaoBloqueadaPorCpf(promocao: any) {
    return Boolean(promocao?.usoUnicoCpf && promocao?.usoCpfBloqueado);
  }

  function promocaoAtivaDoServico(servicoIdBusca?: string | null) {
    if (!servicoIdBusca) return null;

    const promocoesAtivas = promocoes.filter((promocao) =>
      promocaoEstaAtiva(promocao),
    );

    const promocaoServico = promocoesAtivas.find((promocao) => {
      if (promocao.tipo !== "servico") return false;
      if (promocaoBloqueadaPorCpf(promocao)) return false;

      return (
        Array.isArray(promocao.servicos) &&
        promocao.servicos.some(
          (item: any) =>
            item.servicoId === servicoIdBusca ||
            item.servico?.id === servicoIdBusca,
        )
      );
    });

    if (promocaoServico) return promocaoServico;

    const promocaoAniversario = promocoesAtivas.find((promocao) => {
      if (promocao.tipo !== "aniversariantes") return false;
      if (promocaoBloqueadaPorCpf(promocao)) return false;

      return clienteFazAniversarioNoMesAtual();
    });

    if (promocaoAniversario) return promocaoAniversario;

    const promocaoGeral = promocoesAtivas.find((promocao) => {
      if (promocao.tipo !== "geral") return false;
      if (promocaoBloqueadaPorCpf(promocao)) return false;

      return true;
    });

    return promocaoGeral || null;
  }

  function calcularValorComPromocao(valorOriginal: number, promocao: any) {
    const desconto = numeroValor(promocao?.desconto);

    if (!promocao || desconto <= 0) return valorOriginal;

    if (promocao.tipoDesconto === "percentual") {
      const percentual = Math.min(Math.max(desconto, 0), 100);
      return Math.max(valorOriginal - (valorOriginal * percentual) / 100, 0);
    }

    return Math.max(valorOriginal - desconto, 0);
  }

  function obterValorServico(servico: any) {
    const valorOriginal = obterValorOriginalServico(servico);
    const promocao = promocaoAtivaDoServico(servico?.id);

    return calcularValorComPromocao(valorOriginal, promocao);
  }

  function obterResumoPromocaoServico(servico: any) {
    const valorOriginal = obterValorOriginalServico(servico);
    const promocao = promocaoAtivaDoServico(servico?.id);
    const valorPromocional = calcularValorComPromocao(valorOriginal, promocao);
    const possuiPromocao = Boolean(
      promocao && valorPromocional < valorOriginal,
    );

    return {
      promocao,
      possuiPromocao,
      valorOriginal,
      valorPromocional,
      economia: Math.max(valorOriginal - valorPromocional, 0),
    };
  }

  function obterValorPrePagamentoOriginalServico(servico: any) {
    return numeroValor(
      servico?.valorPrePagamento ??
        servico?.valorPrePago ??
        servico?.precoPrePagamento ??
        servico?.prePagamentoValor ??
        servico?.valorSinal ??
        0,
    );
  }

  function obterValorPrePagamentoServico(servico: any) {
    const valorPrePagamentoOriginal =
      obterValorPrePagamentoOriginalServico(servico);

    if (valorPrePagamentoOriginal <= 0) return 0;

    const promocao = promocaoAtivaDoServico(servico?.id);

    return calcularValorComPromocao(valorPrePagamentoOriginal, promocao);
  }

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function itemExigePrePagamento(item: any) {
    return Boolean(
      item?.servico?.exigePrePagamento ||
      item?.servico?.prePagamentoObrigatorio,
    );
  }

  function obterDescricaoServico(servico: any) {
    const descricao =
      servico?.descricao ||
      servico?.descricaoPublica ||
      servico?.detalhes ||
      "";

    return String(descricao || "").trim();
  }

  const servicoSelecionado = servicos.find((s) => s.id === servicoId);
  const profissionalSelecionado = profissionais.find(
    (p) => p.id === profissionalId,
  );
  const itensResumo = [
    ...servicosCarrinho,
    ...(servicoSelecionado &&
    profissionalSelecionado &&
    data &&
    horarioSelecionado
      ? [
          {
            id: "atual",
            servicoId,
            profissionalId,
            data,
            horario: horarioSelecionado,
            servico: servicoSelecionado,
            profissional: profissionalSelecionado,
            fichaRegistroId: fichasRegistrosPorServico[servicoId] || null,
            fichaTitulo: fichasTitulosPorServico[servicoId] || obterTituloFichaServico(servicoSelecionado),
          },
        ]
      : []),
  ];

  const totalResumo = itensResumo.reduce((total, item) => {
    return total + obterValorServico(item.servico);
  }, 0);

  const totalPrePagamentoResumo = itensResumo.reduce((total, item) => {
    if (!itemExigePrePagamento(item)) return total;

    return total + obterValorPrePagamentoServico(item.servico);
  }, 0);

  const existePrePagamentoResumo = itensResumo.some((item) =>
    itemExigePrePagamento(item),
  );

  const profissionaisFiltrados = profissionais.filter(
    (p: any) =>
      p.ativo !== false &&
      Array.isArray(p.servicos) &&
      p.servicos.some(
        (ps: any) =>
          ps.servico?.ativo !== false &&
          (ps.servicoId === servicoId || ps.servico?.id === servicoId),
      ),
  );

  useEffect(() => {
    const podeAutoSelecionarServico =
      !modoReagendamento &&
      cpfConsultado &&
      Boolean(clienteEncontrado || mostrarCamposExtras);

    if (!podeAutoSelecionarServico) return;
    if (servicoId) return;
    if (servicos.length !== 1) return;

    selecionarServicoPublico(servicos[0].id);
  }, [
    modoReagendamento,
    cpfConsultado,
    clienteEncontrado,
    mostrarCamposExtras,
    servicoId,
    servicos,
  ]);

  useEffect(() => {
    const podeAutoSelecionarProfissional =
      !modoReagendamento &&
      cpfConsultado &&
      Boolean(clienteEncontrado || mostrarCamposExtras) &&
      Boolean(servicoId);

    if (!podeAutoSelecionarProfissional) return;
    if (profissionalId) return;
    if (profissionaisFiltrados.length !== 1) return;

    setProfissionalId(profissionaisFiltrados[0].id);
    setData("");
    setHorarios([]);
    setHorarioSelecionado("");
  }, [
    modoReagendamento,
    cpfConsultado,
    clienteEncontrado,
    mostrarCamposExtras,
    servicoId,
    profissionalId,
    profissionaisFiltrados,
  ]);

  const podeMostrarAgenda =
    !modoReagendamento &&
    cpfConsultado &&
    (clienteEncontrado || mostrarCamposExtras);
  const clienteVeioDoPainel = Boolean(clienteIdUrl);
  const etapasWizard = [
    { id: "identificacao", label: "CPF" },
    { id: "servico", label: "Serviço" },
    ...(servicoPossuiFicha(servicoSelecionado)
      ? [{ id: "ficha", label: "Ficha" }]
      : []),
    { id: "profissional", label: "Profissional" },
    { id: "data", label: "Data" },
    { id: "horario", label: "Horário" },
    { id: "confirmacao", label: "Resumo" },
  ];
  const indiceEtapaAtual = Math.max(
    etapasWizard.findIndex((etapa) => etapa.id === etapaAtual),
    0,
  );

  if (!empresa) {
    return (
      <main className="loadingPage">
        <div className="loadingCard">
          <div className="loadingPulse">⌛</div>
          <h1>Carregando vitrine...</h1>
          <p>Estamos preparando a agenda para você.</p>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  const tema = gerarTemaEmpresa(empresa);

  return (
    <main
      className="page"
      style={
        {
          "--marcae-primary": tema.primary,
          "--marcae-secondary": tema.secondary,
          "--marcae-sidebar": tema.sidebar,
          "--marcae-primary-soft": tema.primarySoft,
          "--marcae-secondary-soft": tema.secondarySoft,
          "--marcae-primary-medium": tema.primaryMedium,
          "--marcae-secondary-medium": tema.secondaryMedium,
          "--marcae-gradient": tema.gradient,
          "--marcae-bg": tema.bg,
          "--marcae-bg-soft": tema.bgSoft,
          "--marcae-card": tema.card,
          "--marcae-card-strong": tema.cardStrong,
          "--marcae-border": tema.border,
          "--marcae-text": tema.text,
          "--marcae-muted": tema.muted,
          "--marcae-glow": tema.glow,
        } as CSSProperties
      }
    >
      <section className="shell">
        <div className="wizardSteps">
          {etapasWizard.map((etapa, index) => {
            const numero = index + 1;

            return (
              <div
                key={etapa.id}
                className={`wizardStep ${
                  etapaAtual === etapa.id
                    ? "active"
                    : indiceEtapaAtual > index
                      ? "done"
                      : ""
                }`}
              >
                <div className="wizardBall">{numero}</div>

                <span>{etapa.label}</span>
              </div>
            );
          })}
        </div>

        {etapaAtual === "identificacao" && (
          <header className="topBar">
            {veioDoPainel && (
              <button
                className="voltarPainelButton"
                onClick={() => {
                  window.location.href = "/clientes";
                }}
              >
                ← Voltar ao painel
              </button>
            )}
            <div className="marca">
              Marc<span>aê</span>
            </div>

            <div className="secureBadge">Ambiente seguro de agendamento</div>
          </header>
        )}

        {etapaAtual === "identificacao" && (
          <section className="hero">
            <div className="heroBackgroundGlow" />

            <div className="empresaHeroCard">
              <div className="heroOfficialBadge">
                <span>✓</span>
                Agendamento online oficial
              </div>

              <div className="empresaHeroCentered">
                <div className="empresaLogoBox">
                  {empresa.logoUrl ? (
                    <img
                      src={empresa.logoUrl}
                      alt={empresa.nome}
                      className="empresaLogo"
                    />
                  ) : (
                    <div className="empresaLogoFallback">
                      {String(empresa.nome || "M").charAt(0)}
                    </div>
                  )}
                </div>

                <h1>{empresa.nome}</h1>

                <p className="subtitle">
                  Agende seu atendimento em poucos minutos!
                </p>

                <div className="heroMiniBadges heroMiniBadgesCompact">
                  <div className="heroMiniBadge">🛡️ Dados protegidos</div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="card wizardCard">
          <div className="cardHeader">
            <div>
              <h2>Reserve seu horário</h2>
              <p>
                {etapaAtual === "identificacao" &&
                  "Comece pelo CPF para localizar seu cadastro ou criar um novo."}
                {etapaAtual === "servico" &&
                  "Agora escolha o serviço que deseja agendar."}
                {etapaAtual === "ficha" &&
                  "Preencha a ficha digital vinculada ao serviço escolhido."}
                {etapaAtual === "profissional" &&
                  "Escolha o profissional disponível para o serviço selecionado."}
                {etapaAtual === "data" &&
                  "Escolha o melhor dia para seu atendimento."}
                {etapaAtual === "horario" &&
                  "Agora selecione o horário que funciona melhor para você."}
                {etapaAtual === "confirmacao" &&
                  "Confira tudo antes de finalizar sua reserva."}
              </p>
            </div>

            <div className="step">
              {indiceEtapaAtual + 1}/{etapasWizard.length}
            </div>
          </div>

          <div className="progressSteps wizardSteps">
            {etapasWizard.map((etapa, index) => (
              <div
                key={etapa.id}
                className={indiceEtapaAtual >= index ? "progressStep active" : "progressStep"}
              >
                <span>{index + 1}</span>
                <p>{etapa.label}</p>
              </div>
            ))}
          </div>

          {clienteVeioDoPainel && clienteEncontrado && (
            <div className="clienteSelecionadoCard">
              <div className="clienteSelecionadoTop">
                <div className="clienteAvatar">
                  {String(clienteEncontrado.nome || "C")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="clienteInfo">
                  <strong>{clienteEncontrado.nome}</strong>
                  <span>
                    📲 {formatarWhatsapp(clienteEncontrado.whatsapp || "")}
                  </span>
                  {clienteEncontrado.cpf && (
                    <span>🪪 {formatarCpf(clienteEncontrado.cpf)}</span>
                  )}
                  {clienteEncontrado.dataNascimento && (
                    <span>
                      🎂{" "}
                      {new Date(
                        clienteEncontrado.dataNascimento,
                      ).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>

              <div className="clienteSelecionadoFooter">
                <div className="clienteBadge">✅ Cliente identificado</div>
                <button
                  className="trocarClienteButton"
                  onClick={() => (window.location.href = `/agendar/${slug}`)}
                >
                  Trocar cliente
                </button>
              </div>
            </div>
          )}

          {etapaAtual === "identificacao" && !clienteVeioDoPainel && (
            <div className="cpfBox etapaBox">
              <div className="etapaIntro">
                <span>👋</span>
                <div>
                  <strong>Vamos começar?</strong>
                  <p>
                    Informe seu CPF para localizarmos seu cadastro ou criar um
                    novo rapidinho.
                  </p>
                </div>
              </div>

              <label>Informe seu CPF</label>

              <div className="cpfLine">
                <input
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => {
                    setCpf(formatarCpf(e.target.value));
                    setCpfConsultado(false);
                    setClienteEncontrado(null);
                    setMostrarCamposExtras(false);
                    setModoReagendamento(false);
                    limparFluxoAgendamento();
                    setReagendamentoDireto(false);
                    setAgendamentoSelecionado(null);
                    limparFluxoReagendamento();
                  }}
                />

                <button onClick={buscarClientePorCpf} disabled={buscandoCpf}>
                  {buscandoCpf ? "Buscando..." : "Continuar"}
                </button>
              </div>

              <button
                className="outlineButton"
                onClick={buscarAgendamentosParaReagendar}
                disabled={buscandoReagendamentos}
              >
                {buscandoReagendamentos
                  ? "Buscando agendamentos..."
                  : "Já tenho horário e quero reagendar"}
              </button>

              {clienteEncontrado && (
                <div className="successBox">
                  <strong>Cadastro encontrado</strong>
                  <span>
                    Olá, {clienteEncontrado.nome}. Você já pode escolher seu
                    serviço.
                  </span>
                </div>
              )}

              {mostrarCamposExtras && (
                <div className="section dadosClienteBox">
                  <div className="warningBox">
                    <strong>Novo cadastro</strong>
                    <span>
                      Não encontramos seu CPF. Complete seus dados uma única vez
                      para continuar.
                    </span>
                  </div>

                  <input
                    className="field"
                    placeholder="Nome completo"
                    value={cliente.nome}
                    onChange={(e) =>
                      setCliente({ ...cliente, nome: e.target.value })
                    }
                  />

                  <input
                    className="field"
                    placeholder="WhatsApp"
                    value={cliente.whatsapp}
                    onChange={(e) =>
                      setCliente({
                        ...cliente,
                        whatsapp: formatarWhatsapp(e.target.value),
                      })
                    }
                  />

                  <div className="fieldGroup">
                    <label className="fieldLabel">Data de nascimento</label>
                    <input
                      className="field"
                      type="date"
                      max={dataMaximaNascimentoPermitida()}
                      value={cliente.dataNascimento}
                      onChange={(e) => {
                        const valor = e.target.value;

                        if (valor && !clienteTemIdadeMinima(valor)) {
                          alert(
                            "É necessário ter pelo menos 10 anos para realizar um agendamento.",
                          );

                          setCliente({
                            nome: "",
                            whatsapp: "",
                            dataNascimento: "",
                            cpf: "",
                          });

                          return;
                        }

                        setCliente({
                          ...cliente,
                          dataNascimento: valor,
                        });
                      }}
                    />

                    <span className="fieldHint">
                      Usamos essa informação apenas para identificação do
                      cadastro.
                    </span>
                  </div>
                </div>
              )}

              {(clienteEncontrado || mostrarCamposExtras) && (
                <button className="primaryButton" onClick={avancarParaServico}>
                  Escolher serviço
                </button>
              )}
            </div>
          )}

          {modoReagendamento && (
            <div className="section">
              <div className="sectionTitle">Reagendamento</div>

              <div className="policyBox">
                <strong>Política de reagendamento</strong>
                <span>
                  Você pode reagendar seu horário gratuitamente com até{" "}
                  <b>24 horas</b> de antecedência.
                </span>
                <span>
                  Após esse período, o reagendamento não estará disponível pelo
                  link e o valor pago não será reembolsado.
                </span>
                <span>
                  Em caso de dúvidas, entre em contato diretamente com a
                  empresa.
                </span>
                <button
                  className="whatsappButton"
                  onClick={abrirWhatsappEmpresa}
                >
                  Falar com a empresa no WhatsApp
                </button>
              </div>

              {buscandoReagendamentos && (
                <div className="emptySlots">Buscando seus agendamentos...</div>
              )}

              {!buscandoReagendamentos &&
                agendamentosReagendamento.length === 0 && (
                  <div className="emptySlots">
                    Não encontramos agendamentos pagos e futuros para este CPF.
                  </div>
                )}

              {!buscandoReagendamentos &&
                agendamentosReagendamento.length > 0 && (
                  <div className="rescheduleList">
                    {agendamentosReagendamento.map((agendamento) => (
                      <div
                        key={agendamento.id}
                        className={
                          agendamentoSelecionado?.id === agendamento.id
                            ? "rescheduleCard selected"
                            : "rescheduleCard"
                        }
                      >
                        <div>
                          <strong>
                            {agendamento.servico?.nome || "Serviço"}
                          </strong>
                          <p>{formatarDataHora(agendamento.dataHoraInicio)}</p>
                          {agendamento.profissional?.nome && (
                            <span>
                              Profissional: {agendamento.profissional.nome}
                            </span>
                          )}
                        </div>

                        {agendamento.podeReagendarPublico ? (
                          <button
                            className="miniButton"
                            onClick={() => {
                              setAgendamentoSelecionado(agendamento);
                              setNovaDataReagendamento("");
                              setNovosHorariosReagendamento([]);
                              setNovoHorarioReagendamento("");
                            }}
                          >
                            Selecionar
                          </button>
                        ) : (
                          <div className="blockedText">Menos de 24h</div>
                        )}

                        {!agendamento.podeReagendarPublico && (
                          <div className="dangerBox">
                            {agendamento.motivoBloqueio ||
                              "Este agendamento não pode ser reagendado pelo link público."}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              {agendamentoSelecionado && (
                <div className="section rescheduleForm">
                  <div className="sectionTitle">Escolha a nova data</div>

                  <input
                    className="field"
                    type="date"
                    min={hojeFormatoInput()}
                    value={novaDataReagendamento}
                    onChange={(e) => {
                      const novaData = e.target.value;

                      if (novaData && novaData < hojeFormatoInput()) {
                        alert(
                          "A nova data não pode ser anterior ao dia atual.",
                        );
                        setNovaDataReagendamento("");
                        setNovosHorariosReagendamento([]);
                        setNovoHorarioReagendamento("");
                        return;
                      }

                      setNovaDataReagendamento(novaData);
                      setNovosHorariosReagendamento([]);
                      setNovoHorarioReagendamento("");
                    }}
                  />

                  <button
                    className="secondaryButton"
                    onClick={buscarHorariosReagendamento}
                  >
                    Buscar novos horários
                  </button>

                  <div className="sectionTitleRow">
                    <div className="sectionTitle">Novos horários</div>
                    {novosHorariosReagendamento.length > 0 && (
                      <span>{novosHorariosReagendamento.length} opções</span>
                    )}
                  </div>

                  {novosHorariosReagendamento.length === 0 ? (
                    <div className="emptySlots">
                      Selecione uma nova data para visualizar os horários
                      disponíveis.
                    </div>
                  ) : (
                    <div className="slots">
                      {novosHorariosReagendamento.map((h) => (
                        <button
                          key={h}
                          onClick={() => setNovoHorarioReagendamento(h)}
                          className={
                            novoHorarioReagendamento === h
                              ? "slot active"
                              : "slot"
                          }
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    className="primaryButton"
                    onClick={confirmarReagendamento}
                    disabled={reagendando}
                  >
                    {reagendando ? "Reagendando..." : "Confirmar novo horário"}
                  </button>
                </div>
              )}
            </div>
          )}

          {podeMostrarAgenda && etapaAtual === "servico" && (
            <div className="section etapaBox">
              <div className="etapaIntro">
                <span>✨</span>
                <div>
                  <strong>Agora escolha o serviço</strong>
                  <p>Selecione o atendimento que deseja reservar.</p>
                </div>
              </div>

              <div className="sectionTitleRow">
                <div className="sectionTitle">Serviços disponíveis</div>
                {servicos.length > 0 && <span>{servicos.length} opções</span>}
              </div>

              {servicos.length === 0 ? (
                <div className="emptySlots">
                  Nenhum serviço disponível para agendamento no momento.
                </div>
              ) : (
                <div className="servicosPublicos">
                  {servicos.map((s) => {
                    const servicoAtivo = servicoId === s.id;
                    const servicoJaEstaNoResumo = itensResumo.some(
                      (item) => item.servicoId === s.id,
                    );
                    const resumoPromocao = obterResumoPromocaoServico(s);
                    const valorServico = resumoPromocao.valorPromocional;
                    const valorPrePagamentoOriginalServico =
                      obterValorPrePagamentoOriginalServico(s);
                    const valorPrePagamentoServico =
                      obterValorPrePagamentoServico(s);
                    const descricaoServico = obterDescricaoServico(s);

                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-disabled={servicoJaEstaNoResumo}
                        className={
                          servicoJaEstaNoResumo
                            ? "servicoPublicoCard disabled"
                            : servicoAtivo
                              ? "servicoPublicoCard active"
                              : "servicoPublicoCard"
                        }
                        onClick={() => {
                          if (servicoJaEstaNoResumo) return;
                          selecionarServicoPublico(s.id);
                        }}
                      >
                        <div
                          className="servicoPublicoImagemBox"
                          onClick={(e) => {
                            e.stopPropagation();

                            const imagensServico = [
                              s.imagemUrl1,
                              s.imagemUrl2,
                              s.imagemUrl3,
                            ].filter(Boolean);

                            if (imagensServico.length > 0) {
                              setGaleriaServicoAberta(imagensServico);
                              setImagemGaleriaAtual(0);
                            }
                          }}
                        >
                          {s.imagemUrl1 ? (
                            <img
                              src={s.imagemUrl1}
                              alt={s.nome}
                              className="servicoPublicoImagem"
                            />
                          ) : (
                            <div className="servicoPublicoIcon">✨</div>
                          )}

                          {(s.imagemUrl2 || s.imagemUrl3) && (
                            <div className="servicoGaleriaBadge">
                              +
                              {
                                [s.imagemUrl2, s.imagemUrl3].filter(Boolean)
                                  .length
                              }
                            </div>
                          )}
                        </div>

                        <div className="servicoPublicoInfo">
                          <strong>{s.nome}</strong>

                          {descricaoServico && (
                            <p className="servicoPublicoDescricao">
                              {descricaoServico}
                            </p>
                          )}

                          <div className="servicoPublicoMeta">
                            {s.duracaoMin && <span>⏱ {s.duracaoMin}min</span>}
                            <span
                              className={
                                resumoPromocao.possuiPromocao
                                  ? "priceTag promoPriceTag"
                                  : "priceTag"
                              }
                            >
                              💰{" "}
                              {resumoPromocao.possuiPromocao && (
                                <small>
                                  {formatarMoeda(resumoPromocao.valorOriginal)}
                                </small>
                              )}
                              <strong>{formatarMoeda(valorServico)}</strong>
                            </span>

                            {resumoPromocao.possuiPromocao && (
                              <span className="promoBadge">
                                {resumoPromocao.promocao?.tipo ===
                                "aniversariantes"
                                  ? "Promoção de aniversário"
                                  : "Promoção ativa"}
                              </span>
                            )}
                            {servicoPossuiFicha(s) && (
                              <span className="fichaServicoTag">📋 Ficha digital</span>
                            )}
                            {s.exigePrePagamento && (
                              <span className="prePagamentoTag">
                                Pré-pagamento
                                {valorPrePagamentoServico > 0
                                  ? `: ${formatarMoeda(valorPrePagamentoServico)}`
                                  : ""}
                                {resumoPromocao.possuiPromocao &&
                                valorPrePagamentoOriginalServico >
                                  valorPrePagamentoServico
                                  ? ` (antes ${formatarMoeda(valorPrePagamentoOriginalServico)})`
                                  : ""}
                              </span>
                            )}
                          </div>

                          {resumoPromocao.possuiPromocao &&
                            resumoPromocao.promocao?.descricao && (
                              <div className="promoDescriptionBox">
                                <strong>
                                  {resumoPromocao.promocao?.titulo ||
                                    "Oferta especial"}
                                </strong>
                                <span>{resumoPromocao.promocao.descricao}</span>
                              </div>
                            )}
                        </div>

                        {servicoJaEstaNoResumo && (
                          <div className="servicoJaAdicionadoBadge">
                            Já adicionado
                          </div>
                        )}

                        <div className="servicoPublicoCheck">
                          {servicoAtivo ? "✓" : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {servicoSelecionado && (
                <div className="selectedInfo">
                  <span>
                    {reagendamentoDireto
                      ? "Serviço em reagendamento"
                      : "Serviço selecionado"}
                  </span>
                  <strong>
                    {servicoSelecionado.nome} • {servicoSelecionado.duracaoMin}
                    min
                  </strong>
                  {reagendamentoDireto && (
                    <small>
                      Você está reagendando um atendimento aberto desse serviço.
                    </small>
                  )}

                  {servicoPossuiFicha(servicoSelecionado) && (
                    <div className="recommendationBox fichaVinculadaBox">
                      <strong>📋 Ficha digital vinculada</strong>
                      <p>
                        Este serviço solicita o preenchimento da ficha
                        {servicoSelecionado.fichaModelo?.titulo
                          ? ` ${servicoSelecionado.fichaModelo.titulo}`
                          : " digital"}
                        antes da escolha do profissional.
                      </p>
                    </div>
                  )}

                  {servicoSelecionado.recomendacoesPreAtendimento && (
                    <div className="recommendationBox">
                      <strong>⚠️ Recomendações antes do atendimento</strong>
                      <p>{servicoSelecionado.recomendacoesPreAtendimento}</p>
                    </div>
                  )}
                </div>
              )}

              {existePrePagamentoResumo && (
                <div className="policyBox">
                  <strong>Importante sobre o pré-pagamento</strong>
                  <span>
                    A taxa de pré-pagamento não é reembolsável em caso de falta
                    no dia do agendamento ou se o reagendamento não for
                    solicitado com pelo menos 24h de antecedência.
                  </span>
                </div>
              )}

              <div className="wizardActions">
                <button
                  className="outlineButton"
                  onClick={() => setEtapaAtual("identificacao")}
                >
                  Voltar
                </button>
                <button
                  className="primaryButton"
                  onClick={avancarParaProfissional}
                >
                  {servicoPossuiFicha(servicoSelecionado) && !fichasRegistrosPorServico[servicoId]
                    ? "Próximo: ficha"
                    : "Próximo: profissional"}
                </button>
              </div>
            </div>
          )}

          {podeMostrarAgenda && etapaAtual === "ficha" && (
            <div className="section etapaBox">
              <div className="etapaIntro">
                <span>📋</span>
                <div>
                  <strong>Ficha digital do serviço</strong>
                  <p>
                    Responda as informações solicitadas para continuar o agendamento.
                  </p>
                </div>
              </div>

              <div className="selectedInfo">
                <span>Serviço selecionado</span>
                <strong>{servicoSelecionado?.nome || "Serviço"}</strong>
                <small>{obterTituloFichaServico(servicoSelecionado)}</small>
              </div>

              {carregandoFichaServico ? (
                <div className="emptySlots">Carregando ficha digital...</div>
              ) : camposFichaServico.length === 0 ? (
                <div className="emptySlots">
                  Esta ficha ainda não possui perguntas cadastradas. Você pode continuar.
                </div>
              ) : (
                <div className="fichaPublicaBox">
                  {camposFichaServico
                    .filter((campo: any) => (campo.respondidoPor || "cliente") === "cliente")
                    .map((campo: any) => {
                    const valor = respostasFichaServico[campo.id];
                    const tipoCampo = normalizarTipoFicha(campo.tipo);
                    const opcoes = opcoesCampoFicha(campo);

                    return (
                      <div key={campo.id} className="fichaCampoPublico">
                        <label>
                          {campo.titulo}
                          {campo.obrigatorio && <b> *</b>}
                        </label>

                        {campo.descricao && <p>{campo.descricao}</p>}

                        {(tipoCampo === "texto" || !tipoCampo) && (
                          <input
                            className="field"
                            value={valor || ""}
                            placeholder={campo.placeholder || "Digite sua resposta"}
                            onChange={(e) => alterarRespostaFicha(campo.id, e.target.value)}
                          />
                        )}

                        {tipoCampo === "textarea" && (
                          <textarea
                            className="field fichaTextarea"
                            value={valor || ""}
                            placeholder={campo.placeholder || "Digite sua resposta"}
                            onChange={(e) => alterarRespostaFicha(campo.id, e.target.value)}
                          />
                        )}

                        {tipoCampo === "numero" && (
                          <input
                            className="field"
                            type="number"
                            value={valor || ""}
                            placeholder={campo.placeholder || "0"}
                            onChange={(e) => alterarRespostaFicha(campo.id, e.target.value)}
                          />
                        )}

                        {tipoCampo === "data" && (
                          <input
                            className="field"
                            type="date"
                            value={valor || ""}
                            onChange={(e) => alterarRespostaFicha(campo.id, e.target.value)}
                          />
                        )}

                        {tipoCampo === "sim_nao" && (
                          <div className="fichaOpcoesLinha">
                            {["Sim", "Não"].map((opcao) => (
                              <button
                                key={opcao}
                                type="button"
                                className={valor === opcao ? "fichaOpcao active" : "fichaOpcao"}
                                onClick={() => alterarRespostaFicha(campo.id, opcao)}
                              >
                                {opcao}
                              </button>
                            ))}
                          </div>
                        )}

                        {tipoCampo === "selecao" && (
                          <div className="fichaOpcoesGrid">
                            {opcoes.map((opcao: string) => (
                              <button
                                key={opcao}
                                type="button"
                                className={valor === opcao ? "fichaOpcao active" : "fichaOpcao"}
                                onClick={() => alterarRespostaFicha(campo.id, opcao)}
                              >
                                {opcao}
                              </button>
                            ))}
                          </div>
                        )}

                        {tipoCampo === "multiselecao" && (
                          <div className="fichaOpcoesGrid">
                            {opcoes.map((opcao: string) => {
                              const selecionadas = Array.isArray(valor) ? valor : [];
                              const ativo = selecionadas.includes(opcao);

                              return (
                                <button
                                  key={opcao}
                                  type="button"
                                  className={ativo ? "fichaOpcao active" : "fichaOpcao"}
                                  onClick={() =>
                                    alterarRespostaFicha(
                                      campo.id,
                                      ativo
                                        ? selecionadas.filter((item: string) => item !== opcao)
                                        : [...selecionadas, opcao],
                                    )
                                  }
                                >
                                  {ativo ? "✓ " : ""}
                                  {opcao}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {normalizarTipoFicha(campo.tipo) === "termo_lgpd" && (
                          <label className="fichaCheckLinha">
                            <input
                              type="checkbox"
                              checked={Boolean(valor)}
                              onChange={(e) => alterarRespostaFicha(campo.id, e.target.checked)}
                            />
                            <span>
                              Aceito o uso dos meus dados para este atendimento, conforme a política da empresa.
                            </span>
                          </label>
                        )}

                        {tipoCampo === "assinatura" && (
                          <label className="fichaCheckLinha assinaturaCheckLinha">
                            <input
                              type="checkbox"
                              checked={Boolean(valor)}
                              onChange={(e) => alterarRespostaFicha(campo.id, e.target.checked)}
                            />
                            <span>
                              Confirmo que as informações desta ficha foram preenchidas por mim e autorizo o uso como assinatura digital.
                              <small>
                                Assinatura vinculada ao nome e CPF informados no cadastro.
                              </small>
                            </span>
                          </label>
                        )}

                        {tipoCampo === "foto" && (
                          <div className="fichaInfoBox">
                            Envio de fotos pelo agendador será conectado na próxima fase. Continue normalmente.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="wizardActions">
                <button
                  className="outlineButton"
                  onClick={() => setEtapaAtual("servico")}
                  disabled={salvandoFichaServico}
                >
                  Voltar
                </button>

                <button
                  className="primaryButton"
                  onClick={salvarFichaDoServicoEAvancar}
                  disabled={salvandoFichaServico || carregandoFichaServico}
                >
                  {salvandoFichaServico ? "Salvando ficha..." : "Salvar ficha e continuar"}
                </button>
              </div>
            </div>
          )}

          {podeMostrarAgenda && etapaAtual === "profissional" && (
            <div className="section etapaBox">
              <div className="etapaIntro">
                <span>👩‍💼</span>
                <div>
                  <strong>Escolha seu profissional</strong>
                  <p>
                    Mostramos apenas profissionais que realizam o serviço
                    escolhido.
                  </p>
                </div>
              </div>

              <div className="sectionTitle">Profissional</div>

              {!servicoId ? (
                <div className="emptySlots">
                  Primeiro escolha um serviço para visualizar os profissionais
                  disponíveis.
                </div>
              ) : profissionaisFiltrados.length === 0 ? (
                <div className="emptySlots">
                  Nenhum profissional disponível para este serviço no momento.
                </div>
              ) : (
                <div className="profissionaisPublicos">
                  {profissionaisFiltrados.map((p) => {
                    const fotoProfissional =
                      p.fotoUrl || p.foto || p.imagemUrl || p.avatarUrl || "";
                    const bioProfissional =
                      p.bio ||
                      p.descricao ||
                      "Profissional disponível para atendimento.";
                    const servicosProfissional = Array.isArray(p.servicos)
                      ? p.servicos
                          .map((item: any) => item?.nome || item?.servico?.nome)
                          .filter(Boolean)
                      : [];

                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={
                          profissionalId === p.id
                            ? "profissionalPublicoCard active"
                            : "profissionalPublicoCard"
                        }
                        onClick={() => {
                          setProfissionalId(p.id);
                          setData("");
                          setHorarios([]);
                          setHorarioSelecionado("");
                        }}
                      >
                        <div className="profissionalFotoBox">
                          {fotoProfissional ? (
                            <img
                              src={fotoProfissional}
                              alt={p.nome}
                              className="profissionalFoto"
                            />
                          ) : (
                            <div className="profissionalFotoFallback">
                              {String(p.nome || "P")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="profissionalPublicoInfo">
                          <strong>{p.nome}</strong>
                          <p>{bioProfissional}</p>

                          {servicosProfissional.length > 0 && (
                            <div className="profissionalServicos">
                              {servicosProfissional
                                .slice(0, 4)
                                .map((nomeServico: string) => (
                                  <span key={nomeServico}>{nomeServico}</span>
                                ))}
                            </div>
                          )}
                        </div>

                        <div className="profissionalCheck">
                          {profissionalId === p.id ? "✓" : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {profissionalSelecionado && (
                <div className="selectedInfo">
                  <span>Profissional selecionado</span>
                  <strong>{profissionalSelecionado.nome}</strong>
                </div>
              )}

              <div className="wizardActions">
                <button
                  className="outlineButton"
                  onClick={() => setEtapaAtual("servico")}
                >
                  Voltar
                </button>
                <button className="primaryButton" onClick={avancarParaData}>
                  Próximo: data
                </button>
              </div>
            </div>
          )}

          {podeMostrarAgenda && etapaAtual === "data" && (
            <div className="section etapaBox">
              <div className="etapaIntro">
                <span>📅</span>
                <div>
                  <strong>Escolha a data</strong>
                  <p>
                    Selecione o melhor dia para visualizar os horários
                    disponíveis.
                  </p>
                </div>
              </div>

              <div className="selectedInfo">
                <span>Resumo até aqui</span>
                <strong>
                  {servicoSelecionado?.nome || "Serviço"} •{" "}
                  {profissionalSelecionado?.nome || "Profissional"}
                </strong>
              </div>

              <div className="sectionTitle">Data do atendimento</div>

              <input
                className="field"
                type="date"
                min={hojeFormatoInput()}
                value={data}
                onChange={(e) => {
                  const novaData = e.target.value;

                  if (novaData && novaData < hojeFormatoInput()) {
                    alert(
                      "A data do atendimento não pode ser anterior ao dia atual.",
                    );
                    setData("");
                    setHorarios([]);
                    setHorarioSelecionado("");
                    return;
                  }

                  setData(novaData);
                  setHorarios([]);
                  setHorarioSelecionado("");
                }}
              />

              <div className="wizardActions">
                <button
                  className="outlineButton"
                  onClick={() => setEtapaAtual("profissional")}
                >
                  Voltar
                </button>
                <button className="primaryButton" onClick={avancarParaHorarios}>
                  Buscar horários
                </button>
              </div>
            </div>
          )}

          {podeMostrarAgenda && etapaAtual === "horario" && (
            <div className="section etapaBox">
              <div className="etapaIntro">
                <span>⏰</span>
                <div>
                  <strong>Escolha o horário</strong>
                  <p>Toque no horário desejado para continuar.</p>
                </div>
              </div>

              <div className="sectionTitleRow">
                <div className="sectionTitle">Horários disponíveis</div>
                {horarios.length > 0 && <span>{horarios.length} opções</span>}
              </div>

              {horarios.length === 0 ? (
                <div className="emptySlots">
                  Não encontramos horários disponíveis para essa combinação.
                  Volte e tente outra data.
                </div>
              ) : (
                <div className="slots">
                  {horarios.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHorarioSelecionado(h)}
                      className={
                        horarioSelecionado === h ? "slot active" : "slot"
                      }
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}

              {horarioSelecionado && (
                <div className="readyBox">
                  <strong>Horário selecionado</strong>
                  <span>
                    {horarioSelecionado} • {servicoSelecionado?.nome}
                  </span>
                </div>
              )}

              <div className="wizardActions">
                <button
                  className="outlineButton"
                  onClick={() => setEtapaAtual("data")}
                >
                  Voltar
                </button>
                <button
                  className="primaryButton"
                  onClick={avancarParaConfirmacao}
                >
                  Próximo: conferir
                </button>
              </div>
            </div>
          )}

          {podeMostrarAgenda && etapaAtual === "confirmacao" && (
            <div className="section etapaBox">
              <div className="etapaIntro">
                <span>✅</span>
                <div>
                  <strong>Confira sua reserva</strong>
                  <p>Veja se está tudo certo antes de finalizar.</p>
                </div>
              </div>

              <div className="resumoReserva">
                {itensResumo.map((item, index) => {
                  const resumoPromocaoItem = obterResumoPromocaoServico(
                    item.servico,
                  );
                  const valorItem = resumoPromocaoItem.valorPromocional;
                  const valorPrePagamentoOriginalItem =
                    obterValorPrePagamentoOriginalServico(item.servico);
                  const valorPrePagamentoItem = obterValorPrePagamentoServico(
                    item.servico,
                  );
                  const exigePrePagamentoItem = itemExigePrePagamento(item);
                  const podeRemover = itensResumo.length > 1;

                  return (
                    <div key={item.id} className="resumoServicoCard">
                      <div className="resumoServicoTopo">
                        <div className="resumoServicoNumero">{index + 1}</div>

                        <div className="resumoServicoInfo">
                          <span>Serviço {index + 1}</span>
                          <strong>{item.servico?.nome || "Serviço"}</strong>
                          <small>
                            {item.profissional?.nome || "Profissional"}
                          </small>
                        </div>

                        {podeRemover && (
                          <button
                            type="button"
                            className="removerServicoButton"
                            onClick={() => removerServicoDoCarrinho(item.id)}
                            aria-label="Remover serviço do resumo"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="resumoServicoDetalhes">
                        <div>
                          <span>Data</span>
                          <strong>
                            {item.data
                              ? new Date(
                                  `${item.data}T00:00:00`,
                                ).toLocaleDateString("pt-BR")
                              : "Data"}
                          </strong>
                        </div>

                        <div>
                          <span>Horário</span>
                          <strong>{item.horario || "--:--"}</strong>
                        </div>

                        <div>
                          <span>Duração</span>
                          <strong>
                            {item.servico?.duracaoMin
                              ? `${item.servico.duracaoMin}min`
                              : "Não informada"}
                          </strong>
                        </div>

                        <div>
                          <span>Valor do serviço</span>
                          {resumoPromocaoItem.possuiPromocao ? (
                            <strong className="resumoValorPromocional">
                              <small>
                                {formatarMoeda(
                                  resumoPromocaoItem.valorOriginal,
                                )}
                              </small>
                              {formatarMoeda(valorItem)}
                            </strong>
                          ) : (
                            <strong>{formatarMoeda(valorItem)}</strong>
                          )}
                        </div>

                        {resumoPromocaoItem.possuiPromocao && (
                          <div>
                            <span>Promoção</span>
                            <strong>
                              {resumoPromocaoItem.promocao?.titulo ||
                                "Desconto aplicado"}
                            </strong>
                          </div>
                        )}

                        {resumoPromocaoItem.possuiPromocao &&
                          resumoPromocaoItem.promocao?.descricao && (
                            <div className="resumoPromocaoDescricao">
                              <span>Descrição da promoção</span>
                              <strong>
                                {resumoPromocaoItem.promocao.descricao}
                              </strong>
                            </div>
                          )}

                        {exigePrePagamentoItem && (
                          <div>
                            <span>Pagar agora</span>
                            {valorPrePagamentoOriginalItem >
                            valorPrePagamentoItem ? (
                              <strong className="resumoValorPromocional">
                                <small>
                                  {formatarMoeda(valorPrePagamentoOriginalItem)}
                                </small>
                                {formatarMoeda(valorPrePagamentoItem)}
                              </strong>
                            ) : (
                              <strong>
                                {formatarMoeda(valorPrePagamentoItem)}
                              </strong>
                            )}
                          </div>
                        )}
                      </div>

                      {(item.fichaRegistroId || item.servico?.fichaModeloId) && (
                        <div className="resumoFichaBadge">
                          📋 Ficha digital preenchida: {item.fichaTitulo || item.servico?.fichaModelo?.titulo || "Ficha do serviço"}
                        </div>
                      )}

                      {exigePrePagamentoItem && (
                        <div className="resumoPrePagamentoBadge">
                          Pré-pagamento obrigatório:{" "}
                          {formatarMoeda(valorPrePagamentoItem)}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="resumoTotalCard">
                  <div className="resumoTotalValores">
                    <div>
                      <span>Total dos serviços</span>
                      <strong>{formatarMoeda(totalResumo)}</strong>
                    </div>

                    {existePrePagamentoResumo && (
                      <div>
                        <span>Total pré-pagamento</span>
                        <strong>
                          {formatarMoeda(totalPrePagamentoResumo)}
                        </strong>
                      </div>
                    )}
                  </div>

                  <small>
                    {itensResumo.length}{" "}
                    {itensResumo.length === 1
                      ? "serviço selecionado"
                      : "serviços selecionados"}
                    {existePrePagamentoResumo
                      ? " • Você pagará agora apenas o valor do pré-pagamento."
                      : ""}
                  </small>
                </div>
              </div>

              {existePrePagamentoResumo && (
                <div className="policyBox">
                  <strong>
                    Existe serviço com pré-pagamento neste agendamento
                  </strong>
                  <span>
                    Ao finalizar, você será direcionado para o pagamento seguro.
                  </span>
                  <span>
                    Você pagará agora {formatarMoeda(totalPrePagamentoResumo)}{" "}
                    referente ao pré-pagamento. O valor total dos serviços é{" "}
                    {formatarMoeda(totalResumo)}.
                  </span>
                  <span>
                    O valor pago não é reembolsável em caso de falta ou se o
                    reagendamento/cancelamento não for solicitado com pelo menos
                    24h de antecedência.
                  </span>
                </div>
              )}

              <div className="wizardActions">
                <button
                  className="outlineButton"
                  onClick={() => setEtapaAtual("horario")}
                >
                  Voltar
                </button>

                <button
                  className="outlineButton"
                  onClick={iniciarAdicionarOutroServico}
                >
                  + Adicionar outro serviço
                </button>

                <button className="primaryButton" onClick={agendar}>
                  {reagendamentoDireto
                    ? "Confirmar reagendamento"
                    : existePrePagamentoResumo
                      ? "Reservar e seguir para pagamento"
                      : "Finalizar agendamento"}
                </button>
              </div>

              <p className="security">
                Seus dados serão usados apenas para identificação do agendamento
                e comunicação sobre o atendimento.
              </p>
            </div>
          )}
        </section>

        <section className="benefits benefitsMinimal">
          <div className="benefit benefitMinimal">
            <span>⚡</span>
            <strong>Seu tempo importa</strong>
          </div>

          <div className="benefit benefitMinimal">
            <span>🔒</span>
            <strong>Seguro e confiável</strong>
          </div>

          <div className="benefit benefitMinimal">
            <span>💜</span>
            <strong>Experiência premium</strong>
          </div>
        </section>

        <footer className="footerBrand footerBrandPremium">
          <span>✦</span>
          <p>Agendado por</p>
          <strong>
            Marc<span>aê</span>
          </strong>
          <span>✦</span>
        </footer>
      </section>

      {galeriaServicoAberta && (
        <div
          className="galeriaOverlay"
          onClick={() => setGaleriaServicoAberta(null)}
        >
          <div className="galeriaModal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="galeriaFechar"
              onClick={() => setGaleriaServicoAberta(null)}
              aria-label="Fechar galeria"
            >
              ✕
            </button>

            <div className="galeriaImagemFrame">
              <img
                src={galeriaServicoAberta[imagemGaleriaAtual]}
                className="galeriaImagem"
                alt="Imagem do serviço"
              />
            </div>

            {galeriaServicoAberta.length > 1 && (
              <div className="galeriaControles">
                <button
                  type="button"
                  onClick={() =>
                    setImagemGaleriaAtual((prev) =>
                      prev === 0 ? galeriaServicoAberta.length - 1 : prev - 1,
                    )
                  }
                >
                  ←
                </button>

                <span>
                  {imagemGaleriaAtual + 1} / {galeriaServicoAberta.length}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setImagemGaleriaAtual((prev) =>
                      prev === galeriaServicoAberta.length - 1 ? 0 : prev + 1,
                    )
                  }
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  * {
    box-sizing: border-box;
  }

  :global(html),
  :global(body) {
    margin: 0;
    background: var(--marcae-bg);
  }

  .page {
    width: 100%;
    min-height: 100vh;
    background:
      radial-gradient(circle at 12% 0%, var(--marcae-primary-soft), transparent 32%),
      radial-gradient(circle at 88% 10%, var(--marcae-secondary-soft), transparent 30%),
      radial-gradient(circle at 50% 100%, var(--marcae-primary-soft), transparent 34%),
      linear-gradient(180deg, var(--marcae-bg) 0%, var(--marcae-bg-soft) 46%, var(--marcae-sidebar) 100%);
    color: var(--marcae-text);
    overflow-x: hidden;
    display: flex;
    justify-content: center;
  }

  .page::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 54px 54px;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent 72%);
  }

  .shell {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 760px;
min-height: 100vh;
margin: 0 auto;
padding: 24px 20px 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .shell > .wizardSteps {
    display: none;
  }

  .topBar {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 22px;
  }

  .marca,
  .secureBadge {
    border: 1px solid rgba(237, 233, 255, 0.12);
    background: rgba(17, 20, 37, 0.72);
    backdrop-filter: blur(18px);
    border-radius: 999px;
    box-shadow: 0 18px 55px rgba(0, 0, 0, 0.28);
  }

  .marca {
    padding: 10px 16px;
    color: var(--marcae-text);
    font-size: 18px;
    font-weight: 950;
    letter-spacing: -0.06em;
  }

  .marca span,
  .footerBrand strong span {
    color: var(--marcae-secondary);
    text-shadow: 0 0 22px var(--marcae-secondary-soft);
  }

  .secureBadge {
    padding: 10px 14px;
    color: var(--marcae-secondary);
    font-size: 12px;
    font-weight: 850;
  }

  .hero {
    position: relative;
    width: 100%;
    max-width: 720px;
    margin-bottom: 12px;
  }

  .heroBackgroundGlow {
    position: absolute;
    inset: -50px 20%;
    background: radial-gradient(circle, var(--marcae-primary-soft), transparent 64%);
    filter: blur(10px);
    pointer-events: none;
  }

  .empresaHeroCard {
max-width: 420px;
margin-left: auto;
margin-right: auto;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(237, 233, 255, 0.14);
    background: linear-gradient(145deg, rgba(17, 20, 37, 0.86), rgba(8, 11, 15, 0.86));
    border-radius: 32px;
    padding: 26px 24px;
    box-shadow: 0 34px 90px rgba(0, 0, 0, 0.42);
    backdrop-filter: blur(18px);
  }

  .empresaHeroCard::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(255,255,255,0.12), transparent 28%, transparent 72%, var(--marcae-secondary-soft));
    pointer-events: none;
  }

  .heroOfficialBadge,
  .heroMiniBadge,
  .tag {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: fit-content;
    margin: 0 auto 18px;
    padding: 8px 12px;
    border-radius: 999px;
    color: var(--marcae-text);
    background: var(--marcae-primary-soft);
    border: 1px solid var(--marcae-secondary-soft);
    font-size: 12px;
    font-weight: 900;
  }

  .heroOfficialBadge span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--marcae-primary);
    color: white;
  }

  .empresaHeroCentered {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .empresaLogoBox {
    width: 86px;
    height: 86px;
    border-radius: 28px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    background: linear-gradient(145deg, rgba(237, 233, 255, 0.12), var(--marcae-primary-soft));
    border: 1px solid rgba(237, 233, 255, 0.2);
    box-shadow: 0 22px 60px var(--marcae-primary-soft);
  }

  .empresaLogo {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .empresaLogoFallback {
    color: var(--marcae-text);
    font-size: 34px;
    font-weight: 950;
  }

  .hero h1 {
    margin: 0;
    max-width: 660px;
    font-size: clamp(32px, 4vw, 48px);
    line-height: 0.95;
    letter-spacing: -0.075em;
    color: var(--marcae-text);
  }

  .subtitle {
    max-width: 520px;
    margin: 14px 0 0;
    color: var(--marcae-muted);
    font-size: 15px;
    line-height: 1.6;
  }

  .heroMiniBadges,
  .heroMiniBadgesCompact {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }

  .heroMiniBadge {
    margin: 0;
    background: rgba(237, 233, 255, 0.08);
  }

  .card {
    width: 100%;
    max-width: 620px;
    margin-bottom: 18px;
    padding: 24px;
    border-radius: 32px;
    background: rgba(17, 20, 37, 0.84);
    border: 1px solid rgba(237, 233, 255, 0.13);
    box-shadow: 0 36px 95px rgba(0, 0, 0, 0.44);
    backdrop-filter: blur(20px);
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .wizardCard {
    position: relative;
    overflow: hidden;
  }

  .wizardCard::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 88% 0%, var(--marcae-secondary-soft), transparent 28%);
    pointer-events: none;
  }

  .wizardCard > * {
    position: relative;
    z-index: 1;
  }

  .cardHeader {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .cardHeader h2 {
    margin: 0;
    color: var(--marcae-text);
    font-size: clamp(25px, 4vw, 34px);
    line-height: 1.02;
    letter-spacing: -0.06em;
  }

  .cardHeader p {
    margin: 8px 0 0;
    color: var(--marcae-muted);
    font-size: 13px;
    line-height: 1.5;
  }

  .step {
    min-width: 54px;
    height: 54px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 950;
    background: linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary));
    box-shadow: 0 18px 42px var(--marcae-primary-soft);
  }

  .progressSteps.wizardSteps {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
    padding: 9px;
    border-radius: 22px;
    background: rgba(8, 11, 15, 0.58);
    border: 1px solid rgba(237, 233, 255, 0.1);
  }

  .progressStep {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 16px;
    padding: 10px 8px;
    color: #68748A;
    transition: all 0.18s ease;
  }

  .progressStep span,
  .wizardBall {
    min-width: 23px;
    width: 23px;
    height: 23px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(237, 233, 255, 0.1);
    color: var(--marcae-muted);
    font-size: 11px;
    font-weight: 950;
  }

  .progressStep p,
  .wizardStep span {
    margin: 0;
    font-size: 11px;
    line-height: 1;
    font-weight: 900;
    white-space: nowrap;
  }

  .progressStep.active {
    color: var(--marcae-text);
    background: var(--marcae-primary-soft);
    box-shadow: inset 0 0 0 1px var(--marcae-secondary-soft);
  }

  .progressStep.active span,
  .wizardStep.active .wizardBall,
  .wizardStep.done .wizardBall {
    color: #fff;
    background: linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary));
  }

  .cpfBox,
  .section,
  .etapaBox,
  .dadosClienteBox,
  .rescheduleForm {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .etapaIntro {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 12px;
    margin-top: 2px;
  }

  .etapaIntro > span {
    width: 42px;
    height: 42px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--marcae-primary-soft);
    border: 1px solid var(--marcae-secondary-soft);
  }

  .etapaIntro strong {
    display: block;
    color: var(--marcae-text);
    font-size: 17px;
    letter-spacing: -0.02em;
  }

  .etapaIntro p {
    margin: 4px 0 0;
    color: var(--marcae-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .cpfBox label,
  .sectionTitle,
  .fieldLabel {
    color: var(--marcae-text);
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.01em;
  }

  .fieldHint,
  .security {
    color: #7D889F;
    font-size: 11px;
    line-height: 1.45;
  }

  .cpfLine {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 136px;
    gap: 10px;
  }

  .cpfLine input,
  .field {
    width: 100%;
    height: 52px;
    border-radius: 18px;
    border: 1px solid rgba(237, 233, 255, 0.13);
    background: rgba(8, 11, 15, 0.62);
    color: var(--marcae-text);
    outline: none;
    padding: 0 14px;
    font-size: 15px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  }

  .cpfLine input::placeholder,
  .field::placeholder {
    color: #68748A;
  }

  .cpfLine input:focus,
  .field:focus {
    border-color: var(--marcae-secondary-soft);
    box-shadow: 0 0 0 4px var(--marcae-primary-soft), inset 0 1px 0 rgba(255,255,255,0.06);
  }

  .cpfLine button,
  .primaryButton,
  .secondaryButton,
  .outlineButton,
  .miniButton,
  .whatsappButton,
  .trocarClienteButton,
  .removerServicoButton {
    border: 0;
    cursor: pointer;
    font-weight: 950;
    transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, background 0.16s ease;
  }

  .cpfLine button,
  .primaryButton,
  .secondaryButton,
  .miniButton {
    color: white;
    background: linear-gradient(135deg, var(--marcae-primary) 0%, var(--marcae-secondary) 100%);
    box-shadow: 0 18px 44px var(--marcae-primary-soft);
  }

  .cpfLine button,
  .secondaryButton,
  .outlineButton,
  .whatsappButton {
    height: 52px;
    border-radius: 18px;
  }

  .primaryButton {
    width: 100%;
    min-height: 58px;
    border-radius: 20px;
    padding: 0 18px;
    font-size: 15px;
  }

  .outlineButton,
  .trocarClienteButton {
    width: 100%;
    color: var(--marcae-text);
    background: rgba(237, 233, 255, 0.06);
    border: 1px solid var(--marcae-secondary-soft);
  }

  .whatsappButton {
    width: 100%;
    color: #EFFFF7;
    background: rgba(22, 163, 74, 0.18);
    border: 1px solid rgba(74, 222, 128, 0.24);
  }

  .miniButton {
    height: 40px;
    padding: 0 14px;
    border-radius: 14px;
    white-space: nowrap;
  }

  .cpfLine button:hover,
  .primaryButton:hover,
  .secondaryButton:hover,
  .outlineButton:hover,
  .miniButton:hover,
  .whatsappButton:hover,
  .slot:hover,
  .servicoPublicoCard:hover,
  .profissionalPublicoCard:hover {
    transform: translateY(-1px);
  }

  .cpfLine button:disabled,
  .outlineButton:disabled,
  .primaryButton:disabled,
  .secondaryButton:disabled,
  .whatsappButton:disabled {
    opacity: 0.62;
    cursor: not-allowed;
    transform: none;
  }

  .successBox,
  .warningBox,
  .selectedInfo,
  .emptySlots,
  .policyBox,
  .dangerBox,
  .readyBox,
  .resumoPrePagamentoBadge,
  .clienteBadge,
  .blockedText {
    border-radius: 18px;
    padding: 13px 14px;
    font-size: 13px;
    line-height: 1.45;
  }

  .successBox {
    color: #BBF7D0;
    background: rgba(22, 163, 74, 0.12);
    border: 1px solid rgba(74, 222, 128, 0.22);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .warningBox,
  .policyBox {
    color: var(--marcae-text);
    background: var(--marcae-primary-soft);
    border: 1px solid var(--marcae-secondary-soft);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .recommendationBox {
    margin-top: 12px;
    padding: 13px 14px;
    border-radius: 16px;
    background: rgba(245, 158, 11, 0.10);
    border: 1px solid rgba(245, 158, 11, 0.24);
    color: #fef3c7;
  }

  .recommendationBox strong {
    display: block;
    color: #fbbf24;
    font-size: 12px;
    font-weight: 950;
    margin-bottom: 7px;
  }

  .recommendationBox p {
    margin: 0;
    color: #f8fafc;
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-line;
  }

  .dangerBox {
    grid-column: 1 / -1;
    color: #FECACA;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(248, 113, 113, 0.22);
  }

  .readyBox,
  .selectedInfo {
    color: var(--marcae-muted);
    background: rgba(8, 11, 15, 0.54);
    border: 1px solid rgba(237, 233, 255, 0.11);
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .readyBox strong,
  .selectedInfo strong {
    color: var(--marcae-text);
  }

  .sectionTitleRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .sectionTitleRow span {
    color: var(--marcae-muted);
    font-size: 12px;
    font-weight: 850;
  }

  .emptySlots {
    color: var(--marcae-muted);
    background: rgba(8, 11, 15, 0.42);
    border: 1px dashed rgba(237, 233, 255, 0.18);
  }

  .servicosPublicos,
  .profissionaisPublicos,
  .rescheduleList,
  .resumoReserva {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .servicoPublicoCard,
  .profissionalPublicoCard,
  .rescheduleCard,
  .resumoServicoCard,
  .resumoTotalCard,
  .clienteSelecionadoCard,
  .benefit {
    width: 100%;
    border: 1px solid rgba(237, 233, 255, 0.12);
    background: rgba(8, 11, 15, 0.56);
    border-radius: 22px;
    box-shadow: 0 16px 42px rgba(0, 0, 0, 0.18);
  }

  .servicoPublicoCard,
  .profissionalPublicoCard {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 14px;
    text-align: left;
    color: inherit;
  }

  .servicoPublicoCard.active,
  .profissionalPublicoCard.active,
  .rescheduleCard.selected {
    border-color: var(--marcae-secondary-soft);
    background: linear-gradient(135deg, var(--marcae-primary-soft), rgba(8, 11, 15, 0.62));
    box-shadow: 0 0 0 4px var(--marcae-primary-soft), 0 20px 54px rgba(0, 0, 0, 0.28);
  }

  .servicoPublicoCard.disabled {
    cursor: not-allowed;
    opacity: 0.58;
    border-color: rgba(148, 163, 184, 0.18);
    background: rgba(8, 11, 15, 0.38);
    box-shadow: none;
  }

  .servicoPublicoCard.disabled:hover {
    transform: none;
    border-color: rgba(148, 163, 184, 0.18);
    box-shadow: none;
  }

  .servicoJaAdicionadoBadge {
    position: absolute;
    top: 10px;
    right: 12px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.22);
    background: rgba(15, 23, 42, 0.86);
    color: rgba(226, 232, 240, 0.9);
    font-size: 10px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .servicoPublicoImagemBox {
  position: relative;
  width: 78px;
  min-width: 78px;
  height: 78px;
  border-radius: 22px;
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;

  background:
    linear-gradient(
      145deg,
      var(--marcae-primary-soft),
      rgba(255,255,255,0.04)
    );

  border: 1px solid rgba(255,255,255,0.10);

  box-shadow:
    0 18px 40px rgba(0,0,0,0.30),
    0 0 28px var(--marcae-primary-soft);
}

.servicoPublicoImagem {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.servicoPublicoIcon {
  font-size: 28px;
  color: var(--marcae-secondary);
}

.servicoGaleriaBadge {
  position: absolute;
  bottom: 6px;
  right: 6px;

  width: 24px;
  height: 24px;

  border-radius: 999px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(0,0,0,0.72);
  border: 1px solid rgba(255,255,255,0.12);

  color: white;
  font-size: 11px;
  font-weight: 800;

  backdrop-filter: blur(10px);
}


.galeriaOverlay {
  position: fixed;
  inset: 0;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(2, 6, 23, 0.94);
  backdrop-filter: blur(12px);
}

.galeriaModal {
  position: relative;
  width: min(92vw, 420px);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.galeriaImagemFrame {
  width: 100%;
  max-height: 74vh;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.58);
}

.galeriaImagem {
  width: 100%;
  height: auto;
  max-width: 100%;
  max-height: 74vh;
  object-fit: contain;
  display: block;
}

.galeriaFechar {
  position: absolute;
  top: -14px;
  right: -10px;
  z-index: 2;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(15, 23, 42, 0.96);
  color: white;
  font-size: 17px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
}

.galeriaControles {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.10);
}

.galeriaControles button {
  width: 44px;
  height: 38px;
  border: none;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  color: white;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
}

.galeriaControles span {
  color: white;
  font-size: 13px;
  font-weight: 900;
}

@media (max-width: 520px) {
  .galeriaOverlay {
    padding: 14px;
    align-items: center;
  }

  .galeriaModal {
    width: 94vw;
    max-height: 86vh;
  }

  .galeriaImagemFrame {
    max-height: 68vh;
    border-radius: 22px;
  }

  .galeriaImagem {
    max-height: 68vh;
  }

  .galeriaFechar {
    top: 8px;
    right: 8px;
    background: rgba(2, 6, 23, 0.82);
  }
}

  .servicoPublicoInfo,
  .profissionalPublicoInfo,
  .resumoServicoInfo,
  .clienteInfo {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .servicoPublicoInfo strong,
  .profissionalPublicoInfo strong,
  .rescheduleCard strong,
  .resumoServicoInfo strong,
  .clienteInfo strong {
    color: var(--marcae-text);
    font-size: 15px;
    line-height: 1.2;
  }

  .servicoPublicoInfo p,
  .profissionalPublicoInfo p,
  .rescheduleCard p,
  .resumoServicoInfo span,
  .resumoServicoInfo small,
  .clienteInfo span {
    margin: 0;
    color: var(--marcae-muted);
    font-size: 12px;
    line-height: 1.4;
    font-weight: 700;
  }

  .servicoPublicoInfo .servicoPublicoDescricao {
    margin: 4px 0 2px;
    color: rgba(226, 232, 240, 0.78);
    font-size: 12px;
    line-height: 1.45;
    font-weight: 700;
    white-space: pre-line;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .servicoPublicoCard.active .servicoPublicoDescricao {
    color: rgba(248, 250, 252, 0.92);
  }

  .servicoPublicoMeta,
  .profissionalServicos {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 2px;
  }

  .servicoPublicoMeta span,
  .profissionalServicos span,
  .prePagamentoTag {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    min-height: 25px;
    border-radius: 999px;
    padding: 5px 8px;
    color: #DDE3F0;
    background: rgba(237, 233, 255, 0.08);
    border: 1px solid rgba(237, 233, 255, 0.12);
    font-size: 11px;
    font-weight: 850;
  }


  .priceTag {
    gap: 5px;
  }

  .priceTag strong {
    color: inherit;
    font-size: 11px;
    line-height: 1;
  }

  .priceTag small,
  .resumoValorPromocional small {
    color: var(--marcae-muted);
    text-decoration: line-through;
    font-size: 11px;
    font-weight: 800;
  }

  .promoPriceTag,
  .promoBadge {
    color: #BBF7D0 !important;
    background: rgba(22, 163, 74, 0.14) !important;
    border-color: rgba(74, 222, 128, 0.28) !important;
  }

  .promoBadge {
    font-weight: 950 !important;
  }

  .resumoValorPromocional {
    display: flex !important;
    flex-direction: column;
    gap: 2px;
    color: #BBF7D0 !important;
  }

  .prePagamentoTag,
  .resumoPrePagamentoBadge {
    color: var(--marcae-text) !important;
    background: var(--marcae-primary-soft) !important;
    border-color: var(--marcae-secondary-soft) !important;
  }


  .promoDescriptionBox {
    margin-top: 10px;
    padding: 12px;
    border-radius: 16px;
    background: rgba(34, 197, 94, 0.08);
    border: 1px solid rgba(34, 197, 94, 0.18);
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: #dcfce7;
  }

  .promoDescriptionBox strong {
    font-size: 12px;
    font-weight: 950;
  }

  .promoDescriptionBox span {
    font-size: 12px;
    line-height: 1.5;
    color: #bbf7d0;
    font-weight: 750;
  }

  .resumoPromocaoDescricao {
    grid-column: 1 / -1;
  }

  .servicoPublicoCheck,
  .profissionalCheck {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: rgba(237, 233, 255, 0.08);
    border: 1px solid rgba(237, 233, 255, 0.13);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 13px;
    font-weight: 950;
  }

  .servicoPublicoCard.active .servicoPublicoCheck,
  .profissionalPublicoCard.active .profissionalCheck {
    background: var(--marcae-primary);
    border-color: var(--marcae-secondary);
  }

  .profissionalFotoBox {
    width: 52px;
    height: 52px;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(237, 233, 255, 0.16);
    background: rgba(237, 233, 255, 0.07);
  }

  .profissionalFoto {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .slots {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 9px;
  }

  .slot {
    height: 44px;
    border-radius: 16px;
    border: 1px solid rgba(237, 233, 255, 0.12);
    background: rgba(8, 11, 15, 0.54);
    color: #DDE3F0;
    cursor: pointer;
    font-weight: 950;
  }

  .slot.active {
    color: #fff;
    border-color: var(--marcae-secondary-soft);
    background: linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary));
    box-shadow: 0 16px 34px var(--marcae-primary-soft);
  }

  .rescheduleCard {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 14px;
  }

  .blockedText {
    color: #FECACA;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(248, 113, 113, 0.2);
    white-space: nowrap;
    font-weight: 900;
  }

  .rescheduleForm {
    border-top: 1px solid rgba(237, 233, 255, 0.1);
    padding-top: 14px;
  }

  .clienteSelecionadoCard {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .clienteSelecionadoTop {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .clienteSelecionadoFooter {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: center;
  }

  .clienteBadge {
    color: #BBF7D0;
    background: rgba(22, 163, 74, 0.12);
    border: 1px solid rgba(74, 222, 128, 0.2);
    font-weight: 900;
  }

  .trocarClienteButton {
    width: auto;
    height: 42px;
    padding: 0 14px;
    border-radius: 14px;
  }

  .resumoServicoCard {
    padding: 14px;
  }

  .resumoServicoTopo {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
  }

  .removerServicoButton {
    width: 34px;
    height: 34px;
    border-radius: 12px;
    color: #FECACA;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(248, 113, 113, 0.18);
    font-size: 20px;
  }

  .resumoServicoDetalhes,
  .resumoTotalValores {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .resumoServicoDetalhes div,
  .resumoTotalValores div {
    padding: 12px;
    border-radius: 16px;
    background: rgba(237, 233, 255, 0.06);
    border: 1px solid rgba(237, 233, 255, 0.09);
  }

  .resumoServicoDetalhes span,
  .resumoTotalValores span {
    display: block;
    color: #7D889F;
    font-size: 11px;
    font-weight: 850;
    margin-bottom: 4px;
  }

  .resumoServicoDetalhes strong,
  .resumoTotalValores strong {
    display: block;
    color: var(--marcae-text);
    font-size: 13px;
    line-height: 1.25;
  }

  .resumoPrePagamentoBadge {
    margin-top: 10px;
    font-weight: 900;
  }

  .resumoTotalCard {
    padding: 14px;
    background: linear-gradient(135deg, var(--marcae-primary-soft), rgba(8, 11, 15, 0.68));
    border-color: var(--marcae-secondary-soft);
  }

  .resumoTotalCard small {
    display: block;
    margin-top: 10px;
    color: var(--marcae-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  .wizardActions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 4px;
  }

  .wizardActions .primaryButton,
  .wizardActions .outlineButton {
    height: auto;
    min-height: 54px;
  }

  .benefits {
    width: 100%;
    max-width: 720px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .benefit {
    padding: 16px;
    text-align: center;
  }

  .benefit span {
    display: block;
    font-size: 20px;
    margin-bottom: 8px;
  }

  .benefit strong {
    color: var(--marcae-text);
    font-size: 13px;
  }

  .benefit p {
    margin: 5px 0 0;
    color: var(--marcae-muted);
    font-size: 12px;
    line-height: 1.4;
  }

  .footerBrand {
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    color: #7D889F;
    font-size: 12px;
  }

  .footerBrand p {
    margin: 0;
  }

  .footerBrand strong {
    color: var(--marcae-text);
    letter-spacing: -0.04em;
  }

  .loadingPage {
    min-height: 100vh;
    background:
      radial-gradient(circle at 50% 0%, var(--marcae-primary-soft), transparent 34%),
      var(--marcae-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: var(--marcae-text);
  }

  .loadingCard {
    width: 100%;
    max-width: 360px;
    border-radius: 28px;
    padding: 30px;
    text-align: center;
    background: rgba(17, 20, 37, 0.86);
    border: 1px solid rgba(237, 233, 255, 0.13);
    box-shadow: 0 26px 70px rgba(0, 0, 0, 0.38);
  }

  .loadingPulse {
    font-size: 34px;
    margin-bottom: 12px;
  }

  .loadingCard h1 {
    margin: 0;
    color: var(--marcae-text);
    font-size: 24px;
  }

  .loadingCard p {
    margin: 8px 0 0;
    color: var(--marcae-muted);
  }

    @media (max-width: 760px) {
    .shell {
      padding: 16px 12px 28px;
      align-items: stretch;
    }

    .topBar {
      margin-bottom: 14px;
    }

    .secureBadge {
      display: none;
    }

    .hero {
      max-width: none;
      margin-bottom: 12px;
    }

    .empresaHeroCard {
      padding: 18px;
      border-radius: 28px;
    }

    .empresaLogoBox {
      width: 72px;
      height: 72px;
      border-radius: 24px;
    }

    .hero h1 {
      font-size: clamp(30px, 10vw, 46px);
    }

    .card {
      max-width: none;
      padding: 18px;
      border-radius: 28px;
    }

    .cardHeader {
      gap: 12px;
    }

    .step {
      min-width: 48px;
      height: 48px;
      border-radius: 16px;
    }

    .progressSteps.wizardSteps {
      grid-template-columns: repeat(3, 1fr);
    }

    .cpfLine {
      grid-template-columns: 1fr;
    }

    .wizardActions,
    .resumoServicoDetalhes,
    .resumoTotalValores,
    .benefits,
    .clienteSelecionadoFooter {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 420px) {
    .progressSteps.wizardSteps {
      grid-template-columns: repeat(2, 1fr);
    }

    .slots {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .cardHeader h2 {
      font-size: 26px;
    }
  }

  .fichaServicoTag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 10px;
    border-radius: 999px;
    background: rgba(124,58,237,0.16);
    border: 1px solid rgba(167,139,250,0.20);
    color: #ddd6fe;
    font-size: 12px;
    font-weight: 900;
  }

  .fichaVinculadaBox {
    background: rgba(124,58,237,0.10);
    border-color: rgba(167,139,250,0.18);
  }

  .fichaPublicaBox {
    display: grid;
    gap: 14px;
    margin-top: 14px;
  }

  .fichaCampoPublico {
    border-radius: 20px;
    padding: 16px;
    background: rgba(255,255,255,0.045);
    border: 1px solid rgba(255,255,255,0.08);
    display: grid;
    gap: 10px;
  }

  .fichaCampoPublico > label {
    color: #fff;
    font-weight: 900;
    font-size: 14px;
  }

  .fichaCampoPublico > label b {
    color: #fca5a5;
  }

  .fichaCampoPublico > p {
    margin: -4px 0 0;
    color: rgba(255,255,255,0.68);
    font-size: 13px;
    line-height: 1.45;
  }

  .fichaTextarea {
    min-height: 92px;
    resize: vertical;
  }

  .fichaOpcoesLinha,
  .fichaOpcoesGrid {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .fichaOpcoesGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  }

  .fichaOpcao {
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.045);
    color: #e5e7eb;
    min-height: 42px;
    border-radius: 14px;
    padding: 10px 12px;
    font-weight: 900;
    cursor: pointer;
  }

  .fichaOpcao.active {
    background: var(--marcae-primary-medium);
    border-color: var(--marcae-primary);
    color: #fff;
  }

  .fichaCheckLinha {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    color: rgba(255,255,255,0.82);
    line-height: 1.5;
    font-size: 13px;
  }

  .fichaInfoBox {
    border-radius: 16px;
    padding: 12px;
    background: rgba(56,189,248,0.10);
    border: 1px solid rgba(56,189,248,0.16);
    color: #bae6fd;
    font-size: 13px;
    line-height: 1.5;
    font-weight: 750;
  }

  .resumoFichaBadge {
    margin-top: 12px;
    border-radius: 16px;
    padding: 12px;
    background: rgba(124,58,237,0.12);
    border: 1px solid rgba(167,139,250,0.18);
    color: #ddd6fe;
    font-weight: 900;
    font-size: 13px;
    line-height: 1.35;
  }


  @media (min-width: 981px) {
  .page {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .shell {
    width: 760px;
    max-width: 760px;
    margin-left: auto;
    margin-right: auto;
    padding-top: 28px;
  }

  .hero {
    margin-bottom: 14px;
  }

  .empresaHeroCard {
    padding: 24px 24px;
  }

.voltarPainelButton {
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.06);
  color: #fff;
  padding: 12px 18px;
  border-radius: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: .2s ease;
  backdrop-filter: blur(10px);
}

.voltarPainelButton:hover {
  transform: translateY(-2px);
  background: rgba(255,255,255,0.10);
}

.servicoPublicoInfo p {
  margin: 8px 0 0;
  color: rgba(255,255,255,0.72);
  font-size: 13px;
  line-height: 1.5;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  overflow: hidden;
  text-overflow: ellipsis;
}

  .fichaServicoTag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 10px;
    border-radius: 999px;
    background: rgba(124,58,237,0.16);
    border: 1px solid rgba(167,139,250,0.20);
    color: #ddd6fe;
    font-size: 12px;
    font-weight: 900;
  }

  .fichaVinculadaBox {
    background: rgba(124,58,237,0.10);
    border-color: rgba(167,139,250,0.18);
  }

  .fichaPublicaBox {
    display: grid;
    gap: 14px;
    margin-top: 14px;
  }

  .fichaCampoPublico {
    border-radius: 20px;
    padding: 16px;
    background: rgba(255,255,255,0.045);
    border: 1px solid rgba(255,255,255,0.08);
    display: grid;
    gap: 10px;
  }

  .fichaCampoPublico > label {
    color: #fff;
    font-weight: 900;
    font-size: 14px;
  }

  .fichaCampoPublico > label b {
    color: #fca5a5;
  }

  .fichaCampoPublico > p {
    margin: -4px 0 0;
    color: rgba(255,255,255,0.68);
    font-size: 13px;
    line-height: 1.45;
  }

  .fichaTextarea {
    min-height: 92px;
    resize: vertical;
  }

  .fichaOpcoesLinha,
  .fichaOpcoesGrid {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .fichaOpcoesGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  }

  .fichaOpcao {
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.045);
    color: #e5e7eb;
    min-height: 42px;
    border-radius: 14px;
    padding: 10px 12px;
    font-weight: 900;
    cursor: pointer;
  }

  .fichaOpcao.active {
    background: var(--marcae-primary-medium);
    border-color: var(--marcae-primary);
    color: #fff;
  }

  .fichaCheckLinha {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    color: rgba(255,255,255,0.82);
    line-height: 1.5;
    font-size: 13px;
  }

  .fichaInfoBox {
    border-radius: 16px;
    padding: 12px;
    background: rgba(56,189,248,0.10);
    border: 1px solid rgba(56,189,248,0.16);
    color: #bae6fd;
    font-size: 13px;
    line-height: 1.5;
    font-weight: 750;
  }

  .resumoFichaBadge {
    margin-top: 12px;
    border-radius: 16px;
    padding: 12px;
    background: rgba(124,58,237,0.12);
    border: 1px solid rgba(167,139,250,0.18);
    color: #ddd6fe;
    font-weight: 900;
    font-size: 13px;
    line-height: 1.35;
  }


  .assinaturaCheckLinha span {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .assinaturaCheckLinha small {
    color: rgba(226,232,240,0.68);
    font-size: 11px;
    line-height: 1.35;
  }

}
`;
