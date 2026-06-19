"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import PremiumLayout from "@/components/layout/PremiumLayout";

type TipoCampo =
  | "texto"
  | "textarea"
  | "numero"
  | "data"
  | "sim_nao"
  | "selecao"
  | "multiselecao"
  | "foto"
  | "assinatura"
  | "termo_lgpd";

type FichaCampo = {
  id: string;
  titulo: string;
  descricao?: string | null;
  tipo: TipoCampo | string;
  obrigatorio?: boolean;
  respondidoPor?: "cliente" | "profissional" | string;
  opcoes?: any;
  placeholder?: string | null;
  ordem?: number;
  ativo?: boolean;
};

type FichaModelo = {
  id: string;
  empresaId: string;
  titulo: string;
  descricao?: string | null;
  categoria?: string | null;
  status?: string | null;
  exigeAssinatura?: boolean;
  exigeAceiteLgpd?: boolean;
  permitirFotos?: boolean;
  preencherNoAgendador?: boolean;
  ordem?: number;
  campos?: FichaCampo[];
  _count?: {
    campos?: number;
    registros?: number;
  };
  createdAt?: string;
};

type FichaRegistro = {
  id: string;
  empresaId: string;
  modeloId: string;
  clienteId?: string | null;
  agendamentoId?: string | null;
  tituloSnapshot?: string | null;
  status?: string | null;
  origem?: string | null;
  assinado?: boolean;
  aceiteLgpd?: boolean;
  createdAt?: string;
  modelo?: FichaModelo | null;
  cliente?: {
    id: string;
    nome?: string | null;
    cpf?: string | null;
    whatsapp?: string | null;
  } | null;
  _count?: {
    respostas?: number;
    arquivos?: number;
  };
};

const tiposCampos: {
  tipo: TipoCampo;
  titulo: string;
  descricao: string;
  icone: string;
}[] = [
  {
    tipo: "texto",
    titulo: "Texto curto",
    descricao: "Nome, profissão, observação simples.",
    icone: "✍️",
  },
  {
    tipo: "textarea",
    titulo: "Texto longo",
    descricao: "Observações, histórico e descrições.",
    icone: "📝",
  },
  {
    tipo: "sim_nao",
    titulo: "Sim/Não",
    descricao: "Perguntas objetivas de confirmação.",
    icone: "✅",
  },
  {
    tipo: "selecao",
    titulo: "Seleção única",
    descricao: "Cliente escolhe uma opção.",
    icone: "🔘",
  },
  {
    tipo: "multiselecao",
    titulo: "Múltipla seleção",
    descricao: "Cliente escolhe várias opções.",
    icone: "☑️",
  },
  {
    tipo: "numero",
    titulo: "Número",
    descricao: "Medidas, peso, idade ou quantidade.",
    icone: "🔢",
  },
  {
    tipo: "data",
    titulo: "Data",
    descricao: "Nascimento, retorno ou procedimento.",
    icone: "📅",
  },
  {
    tipo: "foto",
    titulo: "Foto",
    descricao: "Antes/depois ou anexos do cliente.",
    icone: "🖼️",
  },
  {
    tipo: "assinatura",
    titulo: "Assinatura",
    descricao: "Assinatura digital do cliente.",
    icone: "✒️",
  },
  {
    tipo: "termo_lgpd",
    titulo: "Termo LGPD",
    descricao: "Consentimento e aceite de dados.",
    icone: "🛡️",
  },
];

const modeloInicial = {
  titulo: "",
  descricao: "",
  categoria: "geral",
  exigeAssinatura: false,
  exigeAceiteLgpd: true,
  permitirFotos: false,
  preencherNoAgendador: false,
  status: "ativo",
};

const campoInicial = {
  titulo: "",
  descricao: "",
  tipo: "texto" as TipoCampo,
  obrigatorio: false,
  respondidoPor: "cliente" as "cliente" | "profissional",
  opcoes: "",
  placeholder: "",
};

export default function FichasDigitaisPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [modelos, setModelos] = useState<FichaModelo[]>([]);
  const [registros, setRegistros] = useState<FichaRegistro[]>([]);
  const [modeloSelecionado, setModeloSelecionado] =
    useState<FichaModelo | null>(null);
  const [camposModelo, setCamposModelo] = useState<FichaCampo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoCampos, setCarregandoCampos] = useState(false);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [editandoModeloId, setEditandoModeloId] = useState("");
  const [salvandoModelo, setSalvandoModelo] = useState(false);
  const [salvandoCampo, setSalvandoCampo] = useState(false);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"modelos" | "respostas">("modelos");
  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ativos" | "inativos" | "preenchidas" | "assinadas" | "pendentes"
  >("todos");

  const [formModelo, setFormModelo] = useState(modeloInicial);
  const [formCampo, setFormCampo] = useState(campoInicial);

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

    carregarTudo(emp.id);
  }, []);

  async function carregarTudo(empresaId: string) {
    setCarregando(true);

    try {
      const [resModelos, resRegistros] = await Promise.all([
        fetch(
          `/api/fichas-digitais/modelos?empresaId=${empresaId}&includeCampos=true`,
          {
            cache: "no-store",
          },
        ),
        fetch(`/api/fichas-digitais/registros?empresaId=${empresaId}`, {
          cache: "no-store",
        }),
      ]);

      const dataModelos = await resModelos.json();
      const dataRegistros = await resRegistros.json();

      setModelos(Array.isArray(dataModelos.modelos) ? dataModelos.modelos : []);
      setRegistros(
        Array.isArray(dataRegistros.registros) ? dataRegistros.registros : [],
      );
    } catch (error) {
      console.error("Erro ao carregar fichas digitais:", error);
      alert("Erro ao carregar fichas digitais.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarCampos(modeloId: string) {
    if (!empresa?.id || !modeloId) return;

    setCarregandoCampos(true);

    try {
      const res = await fetch(
        `/api/fichas-digitais/campos?empresaId=${empresa.id}&modeloId=${modeloId}`,
        {
          cache: "no-store",
        },
      );

      const data = await res.json();

      setCamposModelo(Array.isArray(data.campos) ? data.campos : []);
    } catch (error) {
      console.error("Erro ao carregar campos da ficha:", error);
      setCamposModelo([]);
    } finally {
      setCarregandoCampos(false);
    }
  }

  function abrirNovoModelo() {
    setDrawerAberto(true);
    setEditandoModeloId("");
    setModeloSelecionado(null);
    setCamposModelo([]);
    setFormModelo(modeloInicial);
    setFormCampo(campoInicial);
  }

  function editarModelo(modelo: FichaModelo) {
    setDrawerAberto(true);
    setEditandoModeloId(modelo.id);
    setModeloSelecionado(modelo);
    setFormModelo({
      titulo: modelo.titulo || "",
      descricao: modelo.descricao || "",
      categoria: modelo.categoria || "geral",
      exigeAssinatura: Boolean(modelo.exigeAssinatura),
      exigeAceiteLgpd: modelo.exigeAceiteLgpd !== false,
      permitirFotos: Boolean(modelo.permitirFotos),
      preencherNoAgendador: Boolean(modelo.preencherNoAgendador),
      status: modelo.status || "ativo",
    });
    setFormCampo(campoInicial);
    carregarCampos(modelo.id);
  }

  function fecharDrawer() {
    setDrawerAberto(false);
    setEditandoModeloId("");
    setModeloSelecionado(null);
    setCamposModelo([]);
    setFormModelo(modeloInicial);
    setFormCampo(campoInicial);
  }

  function selecionarTipoCampo(tipo: TipoCampo) {
    setFormCampo((atual) => ({
      ...atual,
      tipo,
      opcoes:
        tipo === "selecao" || tipo === "multiselecao"
          ? atual.opcoes || "Sim\nNão"
          : "",
      placeholder: textoExemploPorTipo(tipo, atual.placeholder),
    }));
  }

  function textoExemploPorTipo(tipo: TipoCampo | string, valorAtual?: string | null) {
    if (valorAtual && valorAtual !== "null") return valorAtual;

    if (tipo === "texto") return "Ex: Maria Silva";
    if (tipo === "textarea") return "Ex: Descreva as observações do cliente";
    if (tipo === "numero") return "Ex: 10";
    if (tipo === "data") return "";
    if (tipo === "sim_nao") return "";
    if (tipo === "selecao") return "Ex: Escolha uma opção";
    if (tipo === "multiselecao") return "Ex: Escolha uma ou mais opções";
    if (tipo === "foto") return "Ex: Foto antes do procedimento";
    if (tipo === "assinatura") return "Ex: Assinatura do cliente";
    if (tipo === "termo_lgpd") return "Ex: Aceito o uso dos meus dados";
    return "";
  }

  function limparValorCampo(valor?: string | null) {
    if (!valor || valor === "null" || valor === "undefined") return "";
    return valor;
  }

  async function salvarModelo() {
    if (!empresa?.id || salvandoModelo) return;

    if (!formModelo.titulo.trim()) {
      alert("Informe o nome da ficha digital.");
      return;
    }

    setSalvandoModelo(true);

    try {
      const payload = {
        id: editandoModeloId,
        empresaId: empresa.id,
        titulo: formModelo.titulo,
        descricao: formModelo.descricao,
        categoria: formModelo.categoria,
        exigeAssinatura: formModelo.exigeAssinatura,
        exigeAceiteLgpd: formModelo.exigeAceiteLgpd,
        permitirFotos: formModelo.permitirFotos,
        preencherNoAgendador: formModelo.preencherNoAgendador,
        status: formModelo.status,
        criadoPorUsuarioId: usuario?.id || null,
        criadoPorNome: usuario?.nome || null,
      };

      const res = await fetch("/api/fichas-digitais/modelos", {
        method: editandoModeloId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Erro ao salvar ficha digital.");
        return;
      }

      await carregarTudo(empresa.id);

      if (!editandoModeloId) {
        setEditandoModeloId(data.modelo.id);
        setModeloSelecionado(data.modelo);
        setCamposModelo([]);
        alert("Ficha digital criada! Agora adicione as perguntas.");
      } else {
        setModeloSelecionado(data.modelo);
        alert("Ficha digital atualizada!");
      }
    } catch (error) {
      console.error("Erro ao salvar ficha digital:", error);
      alert("Erro ao salvar ficha digital.");
    } finally {
      setSalvandoModelo(false);
    }
  }

  async function salvarCampo() {
    if (!empresa?.id || salvandoCampo) return;

    const modeloId = editandoModeloId || modeloSelecionado?.id;

    if (!modeloId) {
      alert("Salve a ficha digital antes de adicionar perguntas.");
      return;
    }

    if (!formCampo.titulo.trim()) {
      alert("Informe a pergunta.");
      return;
    }

    if (
      (formCampo.tipo === "selecao" || formCampo.tipo === "multiselecao") &&
      !formCampo.opcoes.trim()
    ) {
      alert("Informe as opções, uma por linha.");
      return;
    }

    setSalvandoCampo(true);

    try {
      const res = await fetch("/api/fichas-digitais/campos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresaId: empresa.id,
          modeloId,
          titulo: formCampo.titulo,
          descricao: formCampo.descricao,
          tipo: formCampo.tipo,
          obrigatorio: formCampo.obrigatorio,
          respondidoPor: formCampo.respondidoPor,
          opcoes: formCampo.opcoes,
          placeholder: formCampo.placeholder,
          ordem: camposModelo.length,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Erro ao adicionar pergunta.");
        return;
      }

      setFormCampo(campoInicial);
      await carregarCampos(modeloId);
      await carregarTudo(empresa.id);
    } catch (error) {
      console.error("Erro ao adicionar pergunta:", error);
      alert("Erro ao adicionar pergunta.");
    } finally {
      setSalvandoCampo(false);
    }
  }

  async function inativarCampo(campo: FichaCampo) {
    if (!empresa?.id || !campo.id) return;

    const confirmar = confirm(`Deseja remover a pergunta "${campo.titulo}"?`);

    if (!confirmar) return;

    try {
      setProcessandoId(campo.id);

      const res = await fetch(
        `/api/fichas-digitais/campos?id=${campo.id}&empresaId=${empresa.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Erro ao remover pergunta.");
        return;
      }

      if (editandoModeloId) {
        await carregarCampos(editandoModeloId);
      }

      await carregarTudo(empresa.id);
    } catch (error) {
      console.error("Erro ao remover pergunta:", error);
      alert("Erro ao remover pergunta.");
    } finally {
      setProcessandoId(null);
    }
  }

  async function inativarModelo(modelo: FichaModelo) {
    if (!empresa?.id) return;

    const confirmar = confirm(
      `Deseja inativar a ficha "${modelo.titulo}"?\n\nEla não será removida do histórico.`,
    );

    if (!confirmar) return;

    try {
      setProcessandoId(modelo.id);

      const res = await fetch(
        `/api/fichas-digitais/modelos?id=${modelo.id}&empresaId=${empresa.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Erro ao inativar ficha.");
        return;
      }

      await carregarTudo(empresa.id);
    } catch (error) {
      console.error("Erro ao inativar ficha:", error);
      alert("Erro ao inativar ficha.");
    } finally {
      setProcessandoId(null);
    }
  }

  async function duplicarModelo(modelo: FichaModelo) {
    if (!empresa?.id || processandoId) return;

    const confirmar = confirm(`Deseja duplicar a ficha "${modelo.titulo}"?`);

    if (!confirmar) return;

    try {
      setProcessandoId(modelo.id);

      const resModelo = await fetch("/api/fichas-digitais/modelos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresaId: empresa.id,
          titulo: `${modelo.titulo} - cópia`,
          descricao: modelo.descricao || "",
          categoria: modelo.categoria || "geral",
          exigeAssinatura: Boolean(modelo.exigeAssinatura),
          exigeAceiteLgpd: modelo.exigeAceiteLgpd !== false,
          permitirFotos: Boolean(modelo.permitirFotos),
          preencherNoAgendador: Boolean(modelo.preencherNoAgendador),
          status: "ativo",
          criadoPorUsuarioId: usuario?.id || null,
          criadoPorNome: usuario?.nome || null,
        }),
      });

      const dataModelo = await resModelo.json();

      if (!resModelo.ok || !dataModelo.success) {
        alert(dataModelo.error || "Erro ao duplicar ficha.");
        return;
      }

      const camposOriginais = Array.isArray(modelo.campos)
        ? modelo.campos
        : [];

      for (const campo of camposOriginais) {
        await fetch("/api/fichas-digitais/campos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            empresaId: empresa.id,
            modeloId: dataModelo.modelo.id,
            titulo: campo.titulo,
            descricao: campo.descricao || "",
            tipo: campo.tipo || "texto",
            obrigatorio: Boolean(campo.obrigatorio),
            respondidoPor: campo.respondidoPor === "profissional" ? "profissional" : "cliente",
            opcoes: campo.opcoes || null,
            placeholder: campo.placeholder || "",
            ordem: campo.ordem || 0,
          }),
        });
      }

      await carregarTudo(empresa.id);
      alert("Ficha duplicada com sucesso!");
    } catch (error) {
      console.error("Erro ao duplicar ficha:", error);
      alert("Erro ao duplicar ficha.");
    } finally {
      setProcessandoId(null);
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return "Sem data";

    const date = new Date(data);

    if (Number.isNaN(date.getTime())) return "Sem data";

    return date.toLocaleDateString("pt-BR");
  }

  function somenteNumeros(texto: string) {
    return String(texto || "").replace(/\D/g, "");
  }

  const corPrimaria = empresa?.corSidebar || empresa?.corPrimaria || "#7c3aed";
  const corSecundaria = empresa?.corSecundaria || "#06b6d4";

  const metricas = useMemo(() => {
    const modelosAtivos = modelos.filter((modelo) => modelo.status !== "inativo");
    const registrosAssinados = registros.filter((registro) => registro.assinado);
    const registrosPendentes = registros.filter(
      (registro) =>
        registro.status === "pendente" ||
        registro.status === "rascunho" ||
        (!registro.assinado && registro.modelo?.exigeAssinatura),
    );

    return {
      modelos: modelos.length,
      modelosAtivos: modelosAtivos.length,
      respostas: registros.length,
      assinadas: registrosAssinados.length,
      pendentes: registrosPendentes.length,
    };
  }, [modelos, registros]);

  const modelosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    const termoNumerico = somenteNumeros(termo);

    return modelos.filter((modelo) => {
      const statusOk =
        filtroStatus === "ativos"
          ? modelo.status !== "inativo"
          : filtroStatus === "inativos"
            ? modelo.status === "inativo"
            : filtroStatus === "todos"
              ? true
              : true;

      if (!statusOk) return false;

      if (!termo) return true;

      const texto = [
        modelo.titulo,
        modelo.descricao,
        modelo.categoria,
        modelo.status,
        modelo.preencherNoAgendador ? "cliente agendador publico público" : "",
        modelo.exigeAssinatura ? "assinatura assinado" : "",
        modelo.exigeAceiteLgpd ? "lgpd aceite consentimento" : "",
        modelo.permitirFotos ? "foto fotos antes depois imagem" : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo) || Boolean(termoNumerico && texto.includes(termoNumerico));
    });
  }, [modelos, pesquisa, filtroStatus]);

  const registrosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    const termoNumerico = somenteNumeros(termo);

    return registros.filter((registro) => {
      const statusOk =
        filtroStatus === "preenchidas"
          ? registro.status === "preenchida" || registro.status === "finalizada"
          : filtroStatus === "assinadas"
            ? Boolean(registro.assinado)
            : filtroStatus === "pendentes"
              ? registro.status === "pendente" ||
                registro.status === "rascunho" ||
                (!registro.assinado && registro.modelo?.exigeAssinatura)
              : true;

      if (!statusOk) return false;

      if (!termo) return true;

      const clienteCpf = registro.cliente?.cpf || "";
      const clienteWhatsapp = registro.cliente?.whatsapp || "";

      const texto = [
        registro.cliente?.nome,
        clienteCpf,
        clienteWhatsapp,
        registro.tituloSnapshot,
        registro.modelo?.titulo,
        registro.status,
        registro.origem,
        registro.assinado ? "assinada assinado assinatura" : "",
        registro.aceiteLgpd ? "lgpd aceite" : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const numeros = [clienteCpf, clienteWhatsapp]
        .map((item) => somenteNumeros(item))
        .join(" ");

      return (
        texto.includes(termo) ||
        Boolean(termoNumerico && numeros.includes(termoNumerico))
      );
    });
  }, [registros, pesquisa, filtroStatus]);

  if (!empresa) {
    return (
      <main style={loadingPage}>
        <div style={loadingCard}>
          <div style={loadingIcon}>📋</div>
          <strong>Carregando fichas digitais...</strong>
          <span>Preparando modelos, histórico e respostas.</span>
        </div>
      </main>
    );
  }

  return (
    <PremiumLayout empresa={empresa} usuario={usuario}>
      <main
        className="fichas-mobile-safe"
        style={{
          ...page,
          background: `
            radial-gradient(circle at top left, ${hexToRgba(corPrimaria, 0.22)}, transparent 34%),
            radial-gradient(circle at top right, ${hexToRgba(corSecundaria, 0.14)}, transparent 30%),
            linear-gradient(135deg, #020617 0%, #0f172a 48%, #111827 100%)
          `,
        }}
      >
        <style jsx global>{`
          html,
          body {
            max-width: 100%;
            overflow-x: hidden;
          }

          .fichas-mobile-safe,
          .fichas-mobile-safe * {
            box-sizing: border-box;
          }

          .fichas-mobile-safe {
            width: 100%;
            overflow-x: hidden;
          }

          .fichas-container-mobile {
            width: 100%;
            max-width: 1240px;
            overflow-x: hidden;
          }

          .fichas-details-mobile > summary::-webkit-details-marker {
            display: none;
          }

          .fichas-details-mobile[open] summary b {
            transform: rotate(45deg);
          }

          @media (max-width: 1180px) {
            .fichas-mobile-safe {
              padding-left: 18px !important;
              padding-right: 18px !important;
              padding-bottom: 120px !important;
            }

            .fichas-main-grid-mobile {
              grid-template-columns: 1fr !important;
            }

            .fichas-side-card-mobile {
              position: relative !important;
              top: auto !important;
            }
          }

          @media (max-width: 760px) {
            .fichas-mobile-safe {
              padding: 14px !important;
              padding-bottom: 132px !important;
            }

            .fichas-header-mobile {
              padding: 16px !important;
              border-radius: 24px !important;
              margin-bottom: 12px !important;
              gap: 12px !important;
              background: linear-gradient(
                135deg,
                rgba(15, 23, 42, 0.96),
                rgba(2, 6, 23, 0.94)
              ) !important;
              box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22) !important;
              border: 1px solid rgba(148, 163, 184, 0.14) !important;
            }

            .fichas-header-mobile > div:nth-child(2) {
              display: grid !important;
              grid-template-columns: 42px minmax(0, 1fr) !important;
              gap: 11px !important;
              align-items: center !important;
            }

            .fichas-header-mobile > div:nth-child(2) > div:first-child {
              width: 42px !important;
              height: 42px !important;
              border-radius: 15px !important;
              background: rgba(15, 23, 42, 0.72) !important;
              font-size: 20px !important;
            }

            .fichas-header-mobile h1 {
              font-size: 25px !important;
              line-height: 1 !important;
              margin-top: 3px !important;
            }

            .fichas-header-mobile p {
              display: none !important;
            }

            .fichas-header-mobile > div:nth-child(2) > div:last-child > span:first-child {
              display: none !important;
            }

            .fichas-header-mobile > div:nth-child(2) > div:last-child > div {
              margin-top: 7px !important;
              display: flex !important;
              gap: 6px !important;
              overflow-x: auto !important;
              padding-bottom: 2px !important;
            }

            .fichas-header-mobile > div:nth-child(2) > div:last-child > div span {
              padding: 6px 9px !important;
              font-size: 10.5px !important;
              justify-content: center !important;
              text-align: center !important;
              white-space: nowrap !important;
              flex: 0 0 auto !important;
            }

            .fichas-metricas-mobile {
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 8px !important;
              margin-bottom: 12px !important;
            }

            .fichas-metricas-mobile > div {
              min-width: 0 !important;
              padding: 11px !important;
              border-radius: 18px !important;
              gap: 8px !important;
              align-items: flex-start !important;
              flex-direction: column !important;
              box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18) !important;
            }

            .fichas-metricas-mobile > div > div:first-child {
              width: 34px !important;
              height: 34px !important;
              border-radius: 12px !important;
              font-size: 16px !important;
            }

            .fichas-metricas-mobile strong {
              font-size: 18px !important;
              line-height: 1.05 !important;
            }

            .fichas-metricas-mobile small {
              display: none !important;
            }

            .fichas-metricas-mobile span {
              font-size: 9px !important;
              line-height: 1.1 !important;
              margin-bottom: 3px !important;
              letter-spacing: 0.04em !important;
            }

            .fichas-form-card-mobile,
            .fichas-side-card-mobile,
            .fichas-lista-card-mobile {
              padding: 14px !important;
              border-radius: 20px !important;
            }

            .fichas-form-card-mobile {
              margin-bottom: 10px !important;
            }

            .fichas-form-card-mobile h2,
            .fichas-lista-card-mobile h2 {
              font-size: 24px !important;
              line-height: 1.05 !important;
            }

            .fichas-form-card-mobile p,
            .fichas-lista-card-mobile p {
              display: none !important;
            }

            .fichas-form-card-mobile > div:first-child button {
              width: 48px !important;
              height: 48px !important;
              border-radius: 17px !important;
              font-size: 30px !important;
            }

            .fichas-side-card-mobile {
              padding: 12px !important;
              margin-bottom: 10px !important;
            }

            .fichas-lista-card-mobile > div:first-child {
              gap: 12px !important;
              margin-bottom: 12px !important;
            }

            .fichas-tabs-mobile,
            .fichas-filtros-mobile {
              display: flex !important;
              flex-wrap: nowrap !important;
              overflow-x: auto !important;
              gap: 6px !important;
              padding: 2px 2px 4px !important;
              -webkit-overflow-scrolling: touch !important;
            }

            .fichas-tabs-mobile button,
            .fichas-filtros-mobile button,
            .fichas-filtros-mobile span {
              width: auto !important;
              min-width: fit-content !important;
              height: 32px !important;
              padding: 0 10px !important;
              border-radius: 999px !important;
              font-size: 10.5px !important;
              line-height: 1 !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              flex: 0 0 auto !important;
              white-space: nowrap !important;
            }

            .fichas-busca-mobile {
              margin: 12px 0 14px !important;
            }

            .fichas-busca-mobile input {
              height: 40px !important;
              padding-left: 36px !important;
              font-size: 13px !important;
            }

            .fichas-grid-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 10px !important;
            }

            .ficha-card-mobile {
              padding: 12px !important;
              border-radius: 20px !important;
              gap: 8px !important;
            }

            .ficha-card-mobile h3 {
              font-size: 15px !important;
              line-height: 1.15 !important;
              display: -webkit-box !important;
              -webkit-line-clamp: 1 !important;
              -webkit-box-orient: vertical !important;
              overflow: hidden !important;
            }

            .ficha-card-mobile button {
              min-height: 34px !important;
              height: 34px !important;
              padding: 0 6px !important;
              font-size: 10.5px !important;
              border-radius: 12px !important;
            }

            .fichas-drawer-mobile {
              width: calc(100vw - 20px) !important;
              margin: 10px !important;
              border-radius: 24px !important;
              padding: 14px !important;
            }

            .fichas-drawer-grid-mobile,
            .fichas-campo-grid-mobile {
              grid-template-columns: 1fr !important;
            }

            .fichas-tipo-grid-mobile {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .fichas-switch-grid-mobile {
              grid-template-columns: 1fr !important;
              gap: 10px !important;
            }

            .fichas-switch-grid-mobile button {
              min-height: 102px !important;
              padding: 16px !important;
            }
          }
        `}</style>

        <div className="fichas-container-mobile" style={container}>
          <header
            className="fichas-header-mobile"
            style={{
              ...headerPremium,
              background: `
                radial-gradient(circle at top left, ${hexToRgba(corPrimaria, 0.18)}, transparent 34%),
                radial-gradient(circle at bottom right, ${hexToRgba(corSecundaria, 0.1)}, transparent 32%),
                linear-gradient(135deg, rgba(15,23,42,0.96), rgba(2,6,23,0.92))
              `,
              boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
            }}
          >
            <div style={headerOverlay} />

            <div style={headerConteudo}>
              <div style={logoHeader}>
                {empresa?.logoUrl || empresa?.logo || empresa?.imagemUrl ? (
                  <img
                    src={empresa.logoUrl || empresa.logo || empresa.imagemUrl}
                    alt={empresa.nome}
                    style={logoImage}
                  />
                ) : (
                  "📋"
                )}
              </div>

              <div style={{ position: "relative", zIndex: 2 }}>
                <span style={badgeBoasVindas}>📋 CRM inteligente</span>

                <h1 style={tituloHeader}>Fichas Digitais</h1>

                <p style={subtituloHeader}>
                  Crie questionários personalizados, acompanhe histórico por
                  cliente, LGPD, assinatura e fotos.
                </p>

                <div style={linhaBadgesHeader}>
                  <span style={badgeEmpresa}>
                    🏢 {empresa?.nome || "Minha empresa"}
                  </span>

                  <span style={badgeModulo}>Mobile first</span>

                  <span style={badgeStatusHeader}>✅ Produção segura</span>
                </div>
              </div>
            </div>
          </header>

          <section className="fichas-metricas-mobile" style={metricasGrid}>
            <MetricCard
              titulo="Modelos"
              valor={String(metricas.modelosAtivos)}
              descricao="Fichas ativas"
              icone="📋"
              cor={corPrimaria}
            />

            <MetricCard
              titulo="Respostas"
              valor={String(metricas.respostas)}
              descricao="Histórico preenchido"
              icone="🧾"
              cor="#38bdf8"
            />

            <MetricCard
              titulo="Pendentes"
              valor={String(metricas.pendentes)}
              descricao="Faltam assinatura ou conclusão"
              icone="⏳"
              cor="#f59e0b"
            />
          </section>

          <section className="fichas-main-grid-mobile" style={mainGrid}>
            <div className="fichas-form-card-mobile" style={formCardFechado}>
              <div style={formResumoCadastro}>
                <div style={formResumoTexto}>
                  <span style={sectionEyebrow}>Construtor</span>

                  <h2 style={sectionTitle}>Nova ficha digital</h2>

                  <p style={sectionDescription}>
                    Crie modelos reutilizáveis para qualquer tipo de empresa.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={abrirNovoModelo}
                  aria-label="Criar nova ficha digital"
                  style={{
                    ...botaoToggleCadastro,
                    background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                    boxShadow: `0 16px 38px ${hexToRgba(corPrimaria, 0.32)}`,
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <aside
              className="fichas-side-card-mobile"
              style={sideCardCompacto}
            >
              <div style={sideCompactoHeader}>
                <div style={sideIconCompacto}>🛡️</div>

                <div>
                  <span style={sectionEyebrow}>LGPD e histórico</span>
                  <h3 style={sideTitleCompacto}>Base pronta</h3>
                </div>
              </div>

              <div style={sideStatsCompacto}>
                <div style={sideStatItemCompacto}>
                  <span>Assinadas</span>
                  <strong>{metricas.assinadas}</strong>
                </div>

                <div style={sideStatItemCompacto}>
                  <span>Ativas</span>
                  <strong>{metricas.modelosAtivos}</strong>
                </div>

                <div style={sideStatItemCompacto}>
                  <span>Total</span>
                  <strong>{metricas.modelos}</strong>
                </div>
              </div>
            </aside>
          </section>

          <section className="fichas-lista-card-mobile" style={listaCard}>
            <div style={listaHeader}>
              <div>
                <span style={sectionEyebrow}>Central operacional</span>
                <h2 style={sectionTitle}>
                  {abaAtiva === "modelos"
                    ? "Modelos de fichas"
                    : "Fichas preenchidas"}
                </h2>
                <p style={sectionDescription}>
                  Pesquise por cliente, CPF, WhatsApp, ficha ou status.
                </p>
              </div>

              <div className="fichas-tabs-mobile" style={tabsLinha}>
                <button
                  type="button"
                  onClick={() => {
                    setAbaAtiva("modelos");
                    setFiltroStatus("todos");
                  }}
                  style={{
                    ...tabBotao,
                    background:
                      abaAtiva === "modelos"
                        ? "rgba(124,58,237,0.22)"
                        : "rgba(255,255,255,0.04)",
                  }}
                >
                  Modelos
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAbaAtiva("respostas");
                    setFiltroStatus("todos");
                  }}
                  style={{
                    ...tabBotao,
                    background:
                      abaAtiva === "respostas"
                        ? "rgba(56,189,248,0.18)"
                        : "rgba(255,255,255,0.04)",
                  }}
                >
                  Respostas
                </button>
              </div>
            </div>

            <div className="fichas-busca-mobile" style={buscaBox}>
              <span style={buscaIcone}>⌕</span>
              <input
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Buscar por cliente, CPF, WhatsApp ou ficha"
                style={buscaInput}
              />
              {pesquisa && (
                <button
                  type="button"
                  onClick={() => setPesquisa("")}
                  style={buscaLimpar}
                >
                  ×
                </button>
              )}
            </div>

            <div className="fichas-filtros-mobile" style={filtrosStatusLinha}>
              {abaAtiva === "modelos" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setFiltroStatus("todos")}
                    style={{
                      ...filtroBotao,
                      background:
                        filtroStatus === "todos"
                          ? "rgba(124,58,237,0.22)"
                          : "rgba(255,255,255,0.04)",
                    }}
                  >
                    Todos
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroStatus("ativos")}
                    style={{
                      ...filtroBotao,
                      background:
                        filtroStatus === "ativos"
                          ? "rgba(34,197,94,0.18)"
                          : "rgba(255,255,255,0.04)",
                    }}
                  >
                    Ativos
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroStatus("inativos")}
                    style={{
                      ...filtroBotao,
                      background:
                        filtroStatus === "inativos"
                          ? "rgba(239,68,68,0.18)"
                          : "rgba(255,255,255,0.04)",
                    }}
                  >
                    Inativos
                  </button>

                  <span style={listaBadge}>
                    {modelosFiltrados.length} fichas
                  </span>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setFiltroStatus("todos")}
                    style={{
                      ...filtroBotao,
                      background:
                        filtroStatus === "todos"
                          ? "rgba(124,58,237,0.22)"
                          : "rgba(255,255,255,0.04)",
                    }}
                  >
                    Todas
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroStatus("preenchidas")}
                    style={{
                      ...filtroBotao,
                      background:
                        filtroStatus === "preenchidas"
                          ? "rgba(34,197,94,0.18)"
                          : "rgba(255,255,255,0.04)",
                    }}
                  >
                    Preenchidas
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroStatus("assinadas")}
                    style={{
                      ...filtroBotao,
                      background:
                        filtroStatus === "assinadas"
                          ? "rgba(56,189,248,0.18)"
                          : "rgba(255,255,255,0.04)",
                    }}
                  >
                    Assinadas
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroStatus("pendentes")}
                    style={{
                      ...filtroBotao,
                      background:
                        filtroStatus === "pendentes"
                          ? "rgba(245,158,11,0.18)"
                          : "rgba(255,255,255,0.04)",
                    }}
                  >
                    Pendentes
                  </button>

                  <span style={listaBadge}>
                    {registrosFiltrados.length} respostas
                  </span>
                </>
              )}
            </div>

            {carregando && (
              <div style={emptyState}>
                <div style={emptyIcon}>⏳</div>
                <strong>Carregando fichas digitais...</strong>
                <span>Buscando modelos e histórico preenchido.</span>
              </div>
            )}

            {!carregando && abaAtiva === "modelos" && modelos.length === 0 && (
              <div style={emptyState}>
                <div style={emptyIcon}>📋</div>
                <strong>Nenhuma ficha digital criada</strong>
                <span>
                  Crie o primeiro modelo para começar a coletar dados dos
                  clientes.
                </span>
              </div>
            )}

            {!carregando &&
              abaAtiva === "modelos" &&
              modelos.length > 0 &&
              modelosFiltrados.length === 0 && (
                <div style={emptyStateCompacto}>
                  <strong>Nenhum modelo encontrado</strong>
                  <span>Revise a busca ou altere os filtros.</span>
                </div>
              )}

            {!carregando && abaAtiva === "modelos" && modelosFiltrados.length > 0 && (
              <div className="fichas-grid-mobile" style={fichasGrid}>
                {modelosFiltrados.map((modelo) => {
                  const totalCampos =
                    modelo._count?.campos ?? modelo.campos?.length ?? 0;
                  const totalRegistros = modelo._count?.registros ?? 0;

                  return (
                    <article
                      key={modelo.id}
                      className="ficha-card-mobile"
                      style={fichaCard}
                    >
                      <div
                        style={{
                          ...fichaGlow,
                          background: `radial-gradient(circle, ${hexToRgba(
                            corPrimaria,
                            0.16,
                          )}, transparent 72%)`,
                        }}
                      />

                      <div style={fichaLinhaPrincipal}>
                        <div
                          style={{
                            ...fichaIcone,
                            background: `linear-gradient(135deg, ${hexToRgba(
                              corPrimaria,
                              0.92,
                            )}, ${hexToRgba(corSecundaria, 0.72)})`,
                          }}
                        >
                          📋
                        </div>

                        <div style={fichaConteudoPrincipal}>
                          <div style={fichaTituloLinha}>
                            <h3 style={fichaNome}>{modelo.titulo}</h3>

                            <span
                              style={
                                modelo.status === "inativo"
                                  ? badgeInativo
                                  : badgeAtivo
                              }
                            >
                              {modelo.status === "inativo" ? "Inativa" : "Ativa"}
                            </span>
                          </div>

                          <div style={fichaResumoLinha}>
                            <span style={miniBadge}>🧩 {totalCampos} campos</span>
                            <span style={miniBadge}>🧾 {totalRegistros} respostas</span>
                          </div>
                        </div>
                      </div>

                      <div style={fichaBadgesLinha}>
                        {modelo.exigeAssinatura && (
                          <span style={badgeInfo}>✒️ Assinatura</span>
                        )}

                        {modelo.exigeAceiteLgpd && (
                          <span style={badgeInfo}>🛡️ LGPD</span>
                        )}

                        {modelo.permitirFotos && (
                          <span style={badgeInfo}>🖼️ Fotos</span>
                        )}

                        {modelo.preencherNoAgendador && (
                          <span style={badgeInfo}>📲 Cliente preenche</span>
                        )}

                        {!modelo.exigeAssinatura &&
                          !modelo.permitirFotos &&
                          !modelo.preencherNoAgendador && (
                            <span style={badgeInfo}>Painel interno</span>
                          )}
                      </div>

                      <details
                        className="fichas-details-mobile"
                        style={detailsBox}
                      >
                        <summary style={detailsSummary}>
                          <span>Ver detalhes</span>
                          <b>+</b>
                        </summary>

                        <div style={detailsConteudo}>
                          <p style={descricaoFicha}>
                            {modelo.descricao ||
                              "Sem descrição cadastrada para esta ficha."}
                          </p>

                          {Array.isArray(modelo.campos) &&
                            modelo.campos.length > 0 && (
                              <div style={camposResumoLista}>
                                {modelo.campos.slice(0, 4).map((campo) => (
                                  <span key={campo.id} style={campoResumoItem}>
                                    <small>{labelTipoCampo(campo.tipo)}</small>
                                    <strong>{campo.titulo}</strong>
                                  </span>
                                ))}

                                {modelo.campos.length > 4 && (
                                  <span style={campoResumoItem}>
                                    <small>Mais campos</small>
                                    <strong>
                                      +{modelo.campos.length - 4} perguntas
                                    </strong>
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                      </details>

                      <div style={acoesLinha}>
                        <button
                          type="button"
                          onClick={() => editarModelo(modelo)}
                          style={{
                            ...botaoAcao,
                            color: "#c4b5fd",
                            borderColor: "rgba(124,58,237,0.25)",
                          }}
                        >
                          ✏️ Editar
                        </button>

                        <button
                          type="button"
                          disabled={processandoId === modelo.id}
                          onClick={() => duplicarModelo(modelo)}
                          style={{
                            ...botaoAcao,
                            opacity: processandoId === modelo.id ? 0.55 : 1,
                            color: "#93c5fd",
                            borderColor: "rgba(56,189,248,0.25)",
                          }}
                        >
                          📄 Duplicar
                        </button>

                        <button
                          type="button"
                          disabled={processandoId === modelo.id}
                          onClick={() => inativarModelo(modelo)}
                          style={{
                            ...botaoAcao,
                            opacity: processandoId === modelo.id ? 0.55 : 1,
                            color: "#fca5a5",
                            borderColor: "rgba(239,68,68,0.25)",
                          }}
                        >
                          {processandoId === modelo.id
                            ? "Aguarde..."
                            : "🚫 Inativar"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!carregando && abaAtiva === "respostas" && registros.length === 0 && (
              <div style={emptyState}>
                <div style={emptyIcon}>🧾</div>
                <strong>Nenhuma ficha preenchida</strong>
                <span>
                  Quando clientes ou profissionais preencherem fichas, o
                  histórico aparecerá aqui.
                </span>
              </div>
            )}

            {!carregando &&
              abaAtiva === "respostas" &&
              registros.length > 0 &&
              registrosFiltrados.length === 0 && (
                <div style={emptyStateCompacto}>
                  <strong>Nenhuma resposta encontrada</strong>
                  <span>
                    Pesquise por nome, CPF, WhatsApp ou título da ficha.
                  </span>
                </div>
              )}

            {!carregando &&
              abaAtiva === "respostas" &&
              registrosFiltrados.length > 0 && (
                <div className="fichas-grid-mobile" style={fichasGrid}>
                  {registrosFiltrados.map((registro) => (
                    <article
                      key={registro.id}
                      className="ficha-card-mobile"
                      style={fichaCard}
                    >
                      <div style={fichaLinhaPrincipal}>
                        <div
                          style={{
                            ...fichaIcone,
                            background:
                              registro.assinado
                                ? "linear-gradient(135deg, rgba(34,197,94,.92), rgba(56,189,248,.62))"
                                : "linear-gradient(135deg, rgba(124,58,237,.92), rgba(245,158,11,.62))",
                          }}
                        >
                          🧾
                        </div>

                        <div style={fichaConteudoPrincipal}>
                          <div style={fichaTituloLinha}>
                            <h3 style={fichaNome}>
                              {registro.tituloSnapshot ||
                                registro.modelo?.titulo ||
                                "Ficha digital"}
                            </h3>

                            <span
                              style={
                                registro.assinado ? badgeAtivo : badgePendente
                              }
                            >
                              {registro.assinado ? "Assinada" : "Pendente"}
                            </span>
                          </div>

                          <div style={clienteLinha}>
                            <strong>
                              {registro.cliente?.nome || "Cliente não vinculado"}
                            </strong>
                            <span>
                              CPF: {registro.cliente?.cpf || "Não informado"}
                            </span>
                            <span>
                              WhatsApp:{" "}
                              {registro.cliente?.whatsapp || "Não informado"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={fichaBadgesLinha}>
                        <span style={badgeInfo}>
                          📅 {formatarData(registro.createdAt)}
                        </span>

                        <span style={badgeInfo}>
                          🧩 {registro._count?.respostas || 0} respostas
                        </span>

                        <span style={badgeInfo}>
                          🖼️ {registro._count?.arquivos || 0} arquivos
                        </span>

                        {registro.aceiteLgpd && (
                          <span style={badgeInfo}>🛡️ LGPD</span>
                        )}
                      </div>

                      <div style={acoesLinha}>
                        <button
                          type="button"
                          style={{
                            ...botaoAcao,
                            color: "#c4b5fd",
                            borderColor: "rgba(124,58,237,0.25)",
                          }}
                          onClick={() =>
                            alert(
                              "Visualização completa da ficha será implementada na próxima fase.",
                            )
                          }
                        >
                          👁️ Ver ficha
                        </button>

                        <button
                          type="button"
                          style={{
                            ...botaoAcao,
                            color: "#93c5fd",
                            borderColor: "rgba(56,189,248,0.25)",
                          }}
                          onClick={() =>
                            alert(
                              "Preenchimento/edição pelo painel entra na próxima fase.",
                            )
                          }
                        >
                          ✏️ Editar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
          </section>
        </div>

        {drawerAberto && (
          <div style={drawerOverlay}>
            <button
              type="button"
              aria-label="Fechar edição de ficha digital"
              onClick={fecharDrawer}
              style={drawerBackdrop}
            />

            <aside className="fichas-drawer-mobile" style={drawerCard}>
              <div style={drawerHeader}>
                <div>
                  <span style={sectionEyebrow}>
                    {editandoModeloId ? "Editar modelo" : "Novo modelo"}
                  </span>

                  <h2 style={drawerTitle}>
                    {editandoModeloId
                      ? "Editar ficha digital"
                      : "Nova ficha digital"}
                  </h2>

                  <p style={drawerDescription}>
                    Configure o modelo e adicione perguntas reutilizáveis.
                  </p>
                </div>

                <button type="button" onClick={fecharDrawer} style={drawerClose}>
                  ×
                </button>
              </div>

              <div style={drawerScroll}>
                <section style={drawerSection}>
                  <div style={formGrupoTopo}>
                    <span style={formGrupoBadge}>01</span>
                    <div>
                      <strong style={formGrupoTitulo}>Dados da ficha</strong>
                      <small style={formGrupoTexto}>
                        Nome, descrição e regras gerais.
                      </small>
                    </div>
                  </div>

                  <div className="fichas-drawer-grid-mobile" style={drawerGrid}>
                    <div style={{ ...campo, gridColumn: "1 / -1" }}>
                      <label style={label}>Nome da ficha *</label>
                      <input
                        value={formModelo.titulo}
                        onChange={(e) =>
                          setFormModelo({
                            ...formModelo,
                            titulo: e.target.value,
                          })
                        }
                        placeholder="Ex: Avaliação inicial"
                        style={inputCompacto}
                      />
                    </div>

                    <div style={{ ...campo, gridColumn: "1 / -1" }}>
                      <label style={label}>Descrição</label>
                      <textarea
                        value={formModelo.descricao}
                        onChange={(e) =>
                          setFormModelo({
                            ...formModelo,
                            descricao: e.target.value,
                          })
                        }
                        placeholder="Explique quando essa ficha deve ser usada."
                        style={{
                          ...inputCompacto,
                          minHeight: 76,
                          resize: "vertical",
                        }}
                      />
                    </div>

                    <div style={campo}>
                      <label style={label}>Categoria</label>
                      <select
                        value={formModelo.categoria}
                        onChange={(e) =>
                          setFormModelo({
                            ...formModelo,
                            categoria: e.target.value,
                          })
                        }
                        style={inputCompacto}
                      >
                        <option value="geral">Geral</option>
                        <option value="avaliacao">Avaliação</option>
                        <option value="consentimento">Consentimento</option>
                        <option value="evolucao">Evolução</option>
                        <option value="anamnese">Anamnese</option>
                      </select>
                    </div>

                    <div style={campo}>
                      <label style={label}>Status</label>
                      <select
                        value={formModelo.status}
                        onChange={(e) =>
                          setFormModelo({
                            ...formModelo,
                            status: e.target.value,
                          })
                        }
                        style={inputCompacto}
                      >
                        <option value="ativo">Ativa</option>
                        <option value="inativo">Inativa</option>
                      </select>
                    </div>
                  </div>

                  <div className="fichas-switch-grid-mobile" style={switchGrid}>
                    <SwitchCard
                      titulo="Cliente preenche no agendador"
                      descricao="Disponibiliza esta ficha para o cliente preencher no agendador (online)."
                      checked={formModelo.preencherNoAgendador}
                      onChange={() =>
                        setFormModelo({
                          ...formModelo,
                          preencherNoAgendador:
                            !formModelo.preencherNoAgendador,
                        })
                      }
                    />

                    <SwitchCard
                      titulo="Exigir aceite LGPD"
                      descricao="Solicita o aceite do cliente para o uso de dados conforme a LGPD."
                      checked={formModelo.exigeAceiteLgpd}
                      onChange={() =>
                        setFormModelo({
                          ...formModelo,
                          exigeAceiteLgpd: !formModelo.exigeAceiteLgpd,
                        })
                      }
                    />

                    <SwitchCard
                      titulo="Assinatura digital"
                      descricao="Adiciona um campo de assinatura digital para o cliente assinar a ficha."
                      checked={formModelo.exigeAssinatura}
                      onChange={() =>
                        setFormModelo({
                          ...formModelo,
                          exigeAssinatura: !formModelo.exigeAssinatura,
                        })
                      }
                    />

                    <SwitchCard
                      titulo="Permitir fotos antes/depois e anexos"
                      descricao="Permite que o cliente envie fotos (antes/depois) e anexos durante o preenchimento."
                      checked={formModelo.permitirFotos}
                      onChange={() =>
                        setFormModelo({
                          ...formModelo,
                          permitirFotos: !formModelo.permitirFotos,
                        })
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={salvarModelo}
                    disabled={salvandoModelo}
                    style={{
                      ...botaoPrincipal,
                      opacity: salvandoModelo ? 0.62 : 1,
                      background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                      boxShadow: `0 18px 45px ${hexToRgba(corPrimaria, 0.32)}`,
                    }}
                  >
                    {salvandoModelo
                      ? "Salvando ficha..."
                      : editandoModeloId
                        ? "Atualizar ficha"
                        : "Salvar ficha e adicionar perguntas"}
                  </button>
                </section>

                <section style={drawerSection}>
                  <div style={formGrupoTopo}>
                    <span style={formGrupoBadge}>02</span>
                    <div>
                      <strong style={formGrupoTitulo}>Perguntas</strong>
                      <small style={formGrupoTexto}>
                        Campos dinâmicos que serão preenchidos.
                      </small>
                    </div>
                  </div>

                  {!editandoModeloId && (
                    <div style={avisoCompacto}>
                      Salve a ficha primeiro para liberar o cadastro das
                      perguntas.
                    </div>
                  )}

                  {editandoModeloId && (
                    <>
                      <div className="fichas-tipo-grid-mobile" style={tipoGrid}>
                        {tiposCampos.map((item) => (
                          <button
                            key={item.tipo}
                            type="button"
                            aria-pressed={formCampo.tipo === item.tipo}
                            onClick={() => selecionarTipoCampo(item.tipo)}
                            style={{
                              ...tipoButton,
                              border:
                                formCampo.tipo === item.tipo
                                  ? `1px solid ${hexToRgba(corPrimaria, 0.9)}`
                                  : "1px solid rgba(255,255,255,0.08)",
                              background:
                                formCampo.tipo === item.tipo
                                  ? `linear-gradient(135deg, ${hexToRgba(corPrimaria, 0.34)}, ${hexToRgba(corSecundaria, 0.16)})`
                                  : "rgba(255,255,255,0.035)",
                              boxShadow:
                                formCampo.tipo === item.tipo
                                  ? `0 14px 32px ${hexToRgba(corPrimaria, 0.18)}`
                                  : "none",
                            }}
                          >
                            <span style={tipoIcone}>{item.icone}</span>
                            <strong>{item.titulo}</strong>
                            {formCampo.tipo === item.tipo && (
                              <small style={tipoSelecionadoTexto}>Selecionado</small>
                            )}
                          </button>
                        ))}
                      </div>

                      <div style={tipoSelecionadoBox}>
                        <strong>{labelTipoCampo(formCampo.tipo)}</strong>
                        <span>
                          {tiposCampos.find((item) => item.tipo === formCampo.tipo)?.descricao ||
                            "Escolha como esta pergunta será respondida."}
                        </span>
                      </div>

                      <div className="fichas-campo-grid-mobile" style={campoGrid}>
                        <div style={{ ...campo, gridColumn: "1 / -1" }}>
                          <label style={label}>Pergunta *</label>
                          <input
                            value={limparValorCampo(formCampo.titulo)}
                            onChange={(e) =>
                              setFormCampo({
                                ...formCampo,
                                titulo: e.target.value,
                              })
                            }
                            placeholder="Ex: Possui alergias?"
                            style={inputCompacto}
                          />
                        </div>

                        <div style={{ ...campo, gridColumn: "1 / -1" }}>
                          <label style={label}>Descrição / ajuda</label>
                          <input
                            value={limparValorCampo(formCampo.descricao)}
                            onChange={(e) =>
                              setFormCampo({
                                ...formCampo,
                                descricao: e.target.value,
                              })
                            }
                            placeholder="Texto opcional para orientar o cliente"
                            style={inputCompacto}
                          />
                        </div>

                        <div style={{ ...campo, gridColumn: "1 / -1" }}>
                          <label style={label}>Texto de exemplo (opcional)</label>
                          <input
                            value={limparValorCampo(formCampo.placeholder)}
                            onChange={(e) =>
                              setFormCampo({
                                ...formCampo,
                                placeholder: e.target.value,
                              })
                            }
                            placeholder={textoExemploPorTipo(formCampo.tipo)}
                            style={inputCompacto}
                          />
                        </div>

                        {(formCampo.tipo === "selecao" ||
                          formCampo.tipo === "multiselecao") && (
                          <div style={{ ...campo, gridColumn: "1 / -1" }}>
                            <label style={label}>Opções</label>
                            <textarea
                              value={limparValorCampo(formCampo.opcoes)}
                              onChange={(e) =>
                                setFormCampo({
                                  ...formCampo,
                                  opcoes: e.target.value,
                                })
                              }
                              placeholder={"Uma opção por linha\nSim\nNão"}
                              style={{
                                ...inputCompacto,
                                minHeight: 88,
                                resize: "vertical",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <label style={checkLinha}>
                        <input
                          type="checkbox"
                          checked={formCampo.obrigatorio}
                          onChange={(e) =>
                            setFormCampo({
                              ...formCampo,
                              obrigatorio: e.target.checked,
                            })
                          }
                        />
                        <span style={checkTexto}>
                          <strong>Pergunta obrigatória</strong>
                          <small>
                            Quem responder esta pergunta precisa preencher antes de finalizar.
                          </small>
                        </span>
                      </label>

                      <div style={respondidoPorBox}>
                        <div style={respondidoPorHeader}>
                          <strong>Quem responde?</strong>
                          <small>
                            No agendador público aparecem apenas perguntas do cliente.
                          </small>
                        </div>

                        <div style={respondidoPorGrid}>
                          {[
  {
    valor: "cliente",
    titulo: "Cliente responde",
    descricao: "Exibida no agendador público.",
  },
  {
    valor: "profissional",
    titulo: "Profissional responde",
    descricao: "Preenchida internamente pela equipe.",
  },
].map((item) => {
                            const ativo = formCampo.respondidoPor === item.valor;

                            return (
                              <button
                                key={item.valor}
                                type="button"
                                onClick={() =>
                                  setFormCampo({
                                    ...formCampo,
                                    respondidoPor: item.valor as "cliente" | "profissional",
                                  })
                                }
                                style={{
                                  ...respondidoPorButton,
                                  borderColor: ativo
                                    ? hexToRgba(corPrimaria, 0.78)
                                    : "rgba(255,255,255,0.08)",
                                  background: ativo
                                    ? `linear-gradient(135deg, ${hexToRgba(corPrimaria, 0.26)}, ${hexToRgba(corSecundaria, 0.12)})`
                                    : "rgba(255,255,255,0.035)",
                                }}
                              >
                                <span style={respondidoPorRadio}>
                                  {ativo ? "●" : "○"}
                                </span>
                                <span
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "flex-start",
  }}
>
  <strong
    style={{
      fontSize: 14,
      lineHeight: "18px",
      color: "#ffffff",
    }}
  >
    {item.titulo}
  </strong>

  <small
    style={{
      fontSize: 12,
      lineHeight: "16px",
      color: "rgba(255,255,255,0.72)",
      textAlign: "left",
      display: "block",
    }}
  >
    {item.descricao}
  </small>
</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={salvarCampo}
                        disabled={salvandoCampo}
                        style={{
                          ...botaoPrincipal,
                          opacity: salvandoCampo ? 0.62 : 1,
                          background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                          boxShadow: `0 18px 45px ${hexToRgba(corPrimaria, 0.24)}`,
                        }}
                      >
                        {salvandoCampo ? "Adicionando..." : "+ Adicionar pergunta"}
                      </button>

                      <div style={camposLista}>
                        {carregandoCampos && (
                          <div style={emptyStateCompacto}>
                            <strong>Carregando perguntas...</strong>
                          </div>
                        )}

                        {!carregandoCampos && camposModelo.length === 0 && (
                          <div style={emptyStateCompacto}>
                            <strong>Nenhuma pergunta cadastrada</strong>
                            <span>Adicione os campos desta ficha digital.</span>
                          </div>
                        )}

                        {!carregandoCampos &&
                          camposModelo.map((campoItem, index) => (
                            <div key={campoItem.id} style={campoItemCard}>
                              <div style={campoItemNumero}>{index + 1}</div>

                              <div style={campoItemTexto}>
                                <strong>{campoItem.titulo}</strong>
                                <span>
                                  {labelTipoCampo(campoItem.tipo)}
                                  {" • "}
                                  {labelRespondidoPorCampo(campoItem.respondidoPor)}
                                  {campoItem.obrigatorio
                                    ? " • Obrigatória"
                                    : " • Opcional"}
                                </span>
                              </div>

                              <button
                                type="button"
                                disabled={processandoId === campoItem.id}
                                onClick={() => inativarCampo(campoItem)}
                                style={campoRemoverButton}
                              >
                                {processandoId === campoItem.id ? "..." : "×"}
                              </button>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </section>
              </div>
            </aside>
          </div>
        )}
      </main>
    </PremiumLayout>
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
          background: `linear-gradient(135deg, ${hexToRgba(cor, 0.95)}, ${hexToRgba(
            cor,
            0.45,
          )})`,
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

function SwitchCard({
  titulo,
  descricao,
  checked,
  onChange,
}: {
  titulo: string;
  descricao: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button type="button" onClick={onChange} style={switchCard}>
      <span style={switchTextoBox}>
        <strong style={switchTitulo}>{titulo}</strong>
        <small style={switchDescricao}>{descricao}</small>
      </span>

      <span
        style={{
          ...switchPill,
          justifyContent: checked ? "flex-end" : "flex-start",
          background: checked
            ? "linear-gradient(135deg, #7c3aed, #a855f7)"
            : "rgba(255,255,255,0.12)",
          borderColor: checked ? "rgba(196,181,253,0.38)" : "rgba(255,255,255,0.10)",
        }}
      >
        <span style={switchCircle} />
      </span>
    </button>
  );
}

function labelTipoCampo(tipo: string) {
  const encontrado = tiposCampos.find((item) => item.tipo === tipo);

  return encontrado?.titulo || tipo;
}

function labelRespondidoPorCampo(respondidoPor?: string | null) {
  return respondidoPor === "profissional"
    ? "Profissional responde"
    : "Cliente responde";
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

const page: CSSProperties = {
  minHeight: "100vh",
  padding: 30,
  color: "#e5e7eb",
};

const container: CSSProperties = {
  maxWidth: 1240,
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
  borderRadius: 28,
  padding: 26,
  marginBottom: 20,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap",
  position: "relative",
  overflow: "hidden",
  border: "1px solid rgba(148,163,184,0.14)",
};

const headerOverlay: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(90deg, rgba(255,255,255,0.035), transparent 36%, rgba(255,255,255,0.025))",
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
  width: 64,
  height: 64,
  borderRadius: 22,
  overflow: "hidden",
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(148,163,184,0.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 26,
  fontWeight: 900,
  color: "#fff",
  boxShadow: "0 12px 28px rgba(0,0,0,0.20)",
  flexShrink: 0,
};

const logoImage: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const badgeBoasVindas: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(124,58,237,0.12)",
  color: "#c4b5fd",
  padding: "6px 11px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  marginBottom: 10,
  border: "1px solid rgba(167,139,250,0.18)",
};

const tituloHeader: CSSProperties = {
  margin: 0,
  fontSize: 36,
  fontWeight: 950,
  color: "#fff",
  lineHeight: 1,
  letterSpacing: "-0.035em",
};

const subtituloHeader: CSSProperties = {
  margin: "10px 0 0",
  color: "#94a3b8",
  fontSize: 14,
  fontWeight: 500,
  maxWidth: 700,
  lineHeight: 1.55,
};

const linhaBadgesHeader: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 14,
};

const badgeEmpresa: CSSProperties = {
  background: "rgba(15,23,42,0.58)",
  color: "#e2e8f0",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  border: "1px solid rgba(148,163,184,0.18)",
};

const badgeModulo: CSSProperties = {
  background: "rgba(245,158,11,0.10)",
  color: "#fde68a",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  border: "1px solid rgba(245,158,11,0.14)",
};

const badgeStatusHeader: CSSProperties = {
  background: "rgba(34,197,94,0.10)",
  color: "#bbf7d0",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  border: "1px solid rgba(34,197,94,0.14)",
};

const metricasGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginBottom: 18,
};

const metricCard: CSSProperties = {
  borderRadius: 22,
  padding: 18,
  background: "rgba(15,23,42,0.86)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(14px)",
  display: "flex",
  alignItems: "center",
  gap: 18,
  boxShadow: "0 20px 60px rgba(0,0,0,0.24)",
};

const metricIcon: CSSProperties = {
  width: 50,
  height: 50,
  borderRadius: 17,
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
  fontSize: 24,
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
  gridTemplateColumns: "minmax(0, 1fr) 330px",
  gap: 14,
  alignItems: "start",
  marginBottom: 14,
};

const formCardFechado: CSSProperties = {
  background: "rgba(15,23,42,0.86)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 24,
  padding: 18,
  boxShadow: "0 20px 60px rgba(0,0,0,0.24)",
  backdropFilter: "blur(14px)",
};

const formResumoCadastro: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
};

const formResumoTexto: CSSProperties = {
  minWidth: 0,
};

const sectionEyebrow: CSSProperties = {
  display: "inline-flex",
  color: "#c4b5fd",
  fontSize: 11,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: ".08em",
  marginBottom: 8,
};

const sectionTitle: CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: 28,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
};

const sectionDescription: CSSProperties = {
  margin: "8px 0 0",
  color: "#94a3b8",
  fontSize: 13,
  lineHeight: 1.5,
};

const botaoToggleCadastro: CSSProperties = {
  width: 58,
  height: 58,
  border: "none",
  borderRadius: 20,
  color: "#fff",
  fontSize: 34,
  fontWeight: 850,
  cursor: "pointer",
  flexShrink: 0,
};

const sideCardCompacto: CSSProperties = {
  position: "sticky",
  top: 110,
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 24,
  padding: 18,
  boxShadow: "0 20px 60px rgba(0,0,0,0.24)",
  backdropFilter: "blur(14px)",
};

const sideCompactoHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 14,
};

const sideIconCompacto: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 15,
  background: "rgba(124,58,237,0.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 19,
};

const sideTitleCompacto: CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: 18,
  fontWeight: 950,
};

const sideStatsCompacto: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
};

const sideStatItemCompacto: CSSProperties = {
  padding: 10,
  borderRadius: 15,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.07)",
  minWidth: 0,
};

const listaCard: CSSProperties = {
  background: "rgba(15,23,42,0.86)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 24,
  padding: 18,
  boxShadow: "0 20px 60px rgba(0,0,0,0.24)",
  backdropFilter: "blur(14px)",
};

const listaHeader: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
  marginBottom: 14,
};

const tabsLinha: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};

const tabBotao: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#e5e7eb",
  padding: "9px 13px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
};

const buscaBox: CSSProperties = {
  position: "relative",
  marginBottom: 14,
};

const buscaIcone: CSSProperties = {
  position: "absolute",
  left: 14,
  top: "50%",
  transform: "translateY(-50%)",
  color: "#94a3b8",
  fontSize: 16,
};

const buscaInput: CSSProperties = {
  width: "100%",
  height: 46,
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  background: "rgba(2,6,23,0.45)",
  color: "#fff",
  padding: "0 42px",
  outline: "none",
  fontSize: 14,
};

const buscaLimpar: CSSProperties = {
  position: "absolute",
  right: 10,
  top: "50%",
  transform: "translateY(-50%)",
  width: 28,
  height: 28,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  cursor: "pointer",
};

const filtrosStatusLinha: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 14,
};

const filtroBotao: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#e5e7eb",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
};

const listaBadge: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.09)",
  background: "rgba(255,255,255,0.04)",
  color: "#cbd5e1",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const fichasGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))",
  gap: 12,
};

const fichaCard: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  display: "grid",
  gap: 10,
  padding: 14,
  borderRadius: 22,
  background: "rgba(2,6,23,0.52)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const fichaGlow: CSSProperties = {
  position: "absolute",
  top: -70,
  right: -70,
  width: 170,
  height: 170,
  pointerEvents: "none",
};

const fichaLinhaPrincipal: CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "grid",
  gridTemplateColumns: "52px minmax(0, 1fr)",
  gap: 12,
  alignItems: "center",
};

const fichaIcone: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 17,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontSize: 22,
  overflow: "hidden",
};

const fichaConteudoPrincipal: CSSProperties = {
  minWidth: 0,
};

const fichaTituloLinha: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const fichaNome: CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: 17,
  fontWeight: 950,
  minWidth: 0,
  lineHeight: 1.2,
};

const badgeAtivo: CSSProperties = {
  padding: "5px 9px",
  borderRadius: 999,
  background: "rgba(34,197,94,0.13)",
  color: "#86efac",
  border: "1px solid rgba(34,197,94,0.18)",
  fontSize: 10,
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const badgeInativo: CSSProperties = {
  padding: "5px 9px",
  borderRadius: 999,
  background: "rgba(239,68,68,0.12)",
  color: "#fca5a5",
  border: "1px solid rgba(239,68,68,0.18)",
  fontSize: 10,
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const badgePendente: CSSProperties = {
  padding: "5px 9px",
  borderRadius: 999,
  background: "rgba(245,158,11,0.12)",
  color: "#fcd34d",
  border: "1px solid rgba(245,158,11,0.18)",
  fontSize: 10,
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const fichaResumoLinha: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  marginTop: 7,
};

const miniBadge: CSSProperties = {
  height: 28,
  padding: "0 9px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.07)",
  color: "#cbd5e1",
  fontSize: 10.5,
  fontWeight: 850,
  display: "inline-flex",
  alignItems: "center",
};

const fichaBadgesLinha: CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const badgeInfo: CSSProperties = {
  minHeight: 28,
  padding: "0 9px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.07)",
  color: "#cbd5e1",
  fontSize: 10.5,
  fontWeight: 850,
  display: "inline-flex",
  alignItems: "center",
};

const detailsBox: CSSProperties = {
  position: "relative",
  zIndex: 2,
  borderRadius: 15,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.06)",
  overflow: "hidden",
};

const detailsSummary: CSSProperties = {
  listStyle: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  cursor: "pointer",
  color: "#cbd5e1",
  fontWeight: 900,
  fontSize: 12,
};

const detailsConteudo: CSSProperties = {
  padding: "0 12px 12px",
  display: "grid",
  gap: 10,
};

const descricaoFicha: CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: 12,
  lineHeight: 1.5,
};

const camposResumoLista: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const campoResumoItem: CSSProperties = {
  padding: 9,
  borderRadius: 12,
  background: "rgba(2,6,23,0.52)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  gap: 3,
  minWidth: 0,
};

const acoesLinha: CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 7,
};

const botaoAcao: CSSProperties = {
  minHeight: 38,
  borderRadius: 13,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.035)",
  fontSize: 11,
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const clienteLinha: CSSProperties = {
  display: "grid",
  gap: 3,
  marginTop: 5,
  color: "#94a3b8",
  fontSize: 11,
  fontWeight: 750,
};

const emptyState: CSSProperties = {
  padding: 28,
  borderRadius: 22,
  background: "rgba(2,6,23,0.46)",
  border: "1px dashed rgba(148,163,184,0.22)",
  color: "#cbd5e1",
  display: "grid",
  justifyItems: "center",
  gap: 8,
  textAlign: "center",
};

const emptyStateCompacto: CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "rgba(2,6,23,0.42)",
  border: "1px dashed rgba(148,163,184,0.18)",
  color: "#cbd5e1",
  display: "grid",
  gap: 5,
  textAlign: "center",
};

const emptyIcon: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 17,
  background: "rgba(124,58,237,0.16)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
};

const drawerOverlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 3200,
  display: "flex",
  justifyContent: "flex-end",
};

const drawerBackdrop: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(2,6,23,0.72)",
  backdropFilter: "blur(10px)",
  border: "none",
  cursor: "pointer",
};

const drawerCard: CSSProperties = {
  position: "relative",
  width: "min(720px, calc(100vw - 28px))",
  height: "calc(100dvh - 24px)",
  margin: 12,
  padding: 18,
  borderRadius: 28,
  background:
    "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 34px 90px rgba(0,0,0,0.62)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const drawerHeader: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
  paddingBottom: 14,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const drawerTitle: CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: 28,
  fontWeight: 950,
  letterSpacing: "-0.035em",
};

const drawerDescription: CSSProperties = {
  margin: "8px 0 0",
  color: "#94a3b8",
  fontSize: 13,
  lineHeight: 1.5,
};

const drawerClose: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 24,
  lineHeight: 1,
  flexShrink: 0,
};

const drawerScroll: CSSProperties = {
  overflowY: "auto",
  overflowX: "hidden",
  paddingRight: 4,
  display: "grid",
  gap: 12,
};

const drawerSection: CSSProperties = {
  padding: 14,
  borderRadius: 20,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const formGrupoTopo: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 12,
};

const formGrupoBadge: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  background: "rgba(124,58,237,0.16)",
  border: "1px solid rgba(167,139,250,0.18)",
  color: "#c4b5fd",
  fontSize: 12,
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const formGrupoTitulo: CSSProperties = {
  display: "block",
  color: "#fff",
  fontSize: 15,
  fontWeight: 950,
};

const formGrupoTexto: CSSProperties = {
  display: "block",
  color: "#94a3b8",
  fontSize: 11,
  marginTop: 2,
};

const drawerGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const campo: CSSProperties = {
  display: "grid",
  gap: 6,
};

const label: CSSProperties = {
  color: "#cbd5e1",
  fontSize: 12,
  fontWeight: 850,
};

const inputCompacto: CSSProperties = {
  width: "100%",
  minHeight: 42,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(2,6,23,0.52)",
  color: "#fff",
  padding: "10px 12px",
  outline: "none",
  fontSize: 13,
};

const switchGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginTop: 14,
};

const switchCard: CSSProperties = {
  minHeight: 108,
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "center",
  padding: "18px 20px",
  borderRadius: 18,
  border: "1px solid rgba(148,163,184,0.16)",
  background:
    "linear-gradient(180deg, rgba(15,23,42,0.72), rgba(2,6,23,0.62))",
  color: "#fff",
  cursor: "pointer",
  textAlign: "left",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

const switchTextoBox: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  minWidth: 0,
  flex: 1,
};

const switchTitulo: CSSProperties = {
  color: "#fff",
  fontSize: 16,
  fontWeight: 950,
  lineHeight: 1.18,
  letterSpacing: "-0.02em",
};

const switchDescricao: CSSProperties = {
  color: "#cbd5e1",
  fontSize: 13,
  fontWeight: 750,
  lineHeight: 1.55,
};

const switchPill: CSSProperties = {
  width: 58,
  height: 34,
  borderRadius: 999,
  padding: 4,
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
  border: "1px solid rgba(255,255,255,0.10)",
  transition: "all .18s ease",
};

const switchCircle: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 999,
  background: "#fff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.24)",
};

const botaoPrincipal: CSSProperties = {
  width: "100%",
  minHeight: 46,
  border: "none",
  borderRadius: 15,
  color: "#fff",
  fontSize: 13,
  fontWeight: 950,
  cursor: "pointer",
  marginTop: 12,
};

const avisoCompacto: CSSProperties = {
  padding: 12,
  borderRadius: 15,
  background: "rgba(245,158,11,0.10)",
  border: "1px solid rgba(245,158,11,0.16)",
  color: "#fde68a",
  fontSize: 12,
  lineHeight: 1.5,
  fontWeight: 800,
};

const tipoGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 8,
  marginBottom: 12,
};

const tipoButton: CSSProperties = {
  minHeight: 88,
  borderRadius: 16,
  color: "#fff",
  cursor: "pointer",
  display: "grid",
  gap: 5,
  justifyItems: "center",
  alignContent: "center",
  padding: 10,
  fontSize: 11,
  fontWeight: 900,
  transition: "all 0.18s ease",
};

const tipoIcone: CSSProperties = {
  fontSize: 16,
  lineHeight: 1,
};

const tipoSelecionadoTexto: CSSProperties = {
  color: "#c4b5fd",
  fontSize: 9,
  fontWeight: 950,
};

const tipoSelecionadoBox: CSSProperties = {
  borderRadius: 15,
  padding: "11px 12px",
  background: "rgba(124,58,237,0.12)",
  border: "1px solid rgba(124,58,237,0.18)",
  color: "#fff",
  display: "grid",
  gap: 4,
  marginBottom: 12,
};



const campoGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const checkLinha: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  marginTop: 12,
  padding: 12,
  borderRadius: 15,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  cursor: "pointer",
};

const checkTexto: CSSProperties = {
  display: "grid",
  gap: 3,
  minWidth: 0,
};

const respondidoPorBox: CSSProperties = {
  marginTop: 10,
  padding: 12,
  borderRadius: 15,
  background: "rgba(2,6,23,0.42)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  gap: 10,
};

const respondidoPorHeader: CSSProperties = {
  display: "grid",
  gap: 3,
  color: "#fff",
};

const respondidoPorGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const respondidoPorButton: CSSProperties = {
  minHeight: 92,
  padding: "14px 16px",
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  cursor: "pointer",
  textAlign: "left",
};

const respondidoPorRadio: CSSProperties = {
  color: "#c4b5fd",
  fontSize: 14,
  fontWeight: 950,
};

const camposLista: CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 12,
};

const campoItemCard: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) 34px",
  gap: 10,
  alignItems: "center",
  padding: 10,
  borderRadius: 15,
  background: "rgba(2,6,23,0.42)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const campoItemNumero: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  background: "rgba(124,58,237,0.16)",
  color: "#c4b5fd",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 950,
};

const campoItemTexto: CSSProperties = {
  display: "grid",
  gap: 3,
  minWidth: 0,
  color: "#fff",
};

const campoRemoverButton: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(239,68,68,0.08)",
  color: "#fca5a5",
  cursor: "pointer",
  fontSize: 18,
  lineHeight: 1,
};

const camposResumoListaSmall: CSSProperties = {};
