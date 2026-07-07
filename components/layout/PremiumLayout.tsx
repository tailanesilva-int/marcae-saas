"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gerarTemaEmpresa } from "@/app/lib/theme";
import { moduloBloqueadoPorLicenca, obterStatusLicencaEmpresa } from "@/app/lib/licencaEmpresa";

type Props = {
  children: React.ReactNode;
  empresa?: any;
  usuario?: any;
};

type AvisoSistemaMarcae = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo?: string | null;
  criadoEm?: string | null;
  createdAt?: string | null;
};

const menu = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/agenda", label: "Agenda", icon: "📅" },
  { href: "/clientes", label: "Clientes", icon: "👥" },
  { href: "/fichas-digitais", label: "Fichas Digitais", icon: "📋" },
  { href: "/servicos", label: "Serviços", icon: "✂️" },
  { href: "/profissionais", label: "Profissionais", icon: "🧑‍💼" },
  { href: "/promocoes", label: "Promoções", icon: "🔥" },
  { href: "/financeiro", label: "Financeiro", icon: "💳" },
  { href: "/comissoes", label: "Comissões", icon: "💰" },
  { href: "/relatorios", label: "Relatórios", icon: "📈" },
  { href: "/planos", label: "Planos", icon: "💎" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️" },
];

var audioGlobalLiberado = false;
var audioGlobalContext: AudioContext | null = null;

export default function PremiumLayout({ children, empresa, usuario }: Props) {
  const pathname = usePathname();

  const [mobileMenuAberto, setMobileMenuAberto] = useState(false);
  const [quantidadeNotificacoes, setQuantidadeNotificacoes] = useState(0);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [animandoSino, setAnimandoSino] = useState(false);
  const [painelNotificacoesAberto, setPainelNotificacoesAberto] =
    useState(false);
  const [notificacoesCarregadas, setNotificacoesCarregadas] = useState(false);
  const [avisosMarcae, setAvisosMarcae] = useState<AvisoSistemaMarcae[]>([]);
  const [painelAvisosMarcaeAberto, setPainelAvisosMarcaeAberto] =
    useState(false);
  const [avisoMarcaeSelecionado, setAvisoMarcaeSelecionado] =
    useState<AvisoSistemaMarcae | null>(null);
  const [avisosLidos, setAvisosLidos] = useState<string[]>([]);
  const [whatsappSuporteMarcae, setWhatsappSuporteMarcae] = useState("");
  const [gerandoPagamentoLicenca, setGerandoPagamentoLicenca] = useState(false);
  const [gerandoPixLicenca, setGerandoPixLicenca] = useState(false);
  const [pixAssinatura, setPixAssinatura] = useState<any>(null);
  const [statusPixAssinatura, setStatusPixAssinatura] = useState<
    "idle" | "aguardando" | "aprovado" | "erro" | "expirado"
  >("idle");
  const [erroPixAssinatura, setErroPixAssinatura] = useState("");
  const [segundosPixAssinatura, setSegundosPixAssinatura] = useState(0);
  const [copiadoPixAssinatura, setCopiadoPixAssinatura] = useState(false);

  const ultimoCheckRef = useRef<string | null>(null);
  const notificacoesIdsRef = useRef<Set<string>>(new Set());
  const audioLiberadoRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const tema = gerarTemaEmpresa(empresa || {});
  const corPrimaria = tema.primary;
  const corSecundaria = tema.secondary;
  const corSidebar = tema.sidebar;
  const storageKey = `marcae_notificacoes_${empresa?.id || "global"}`;
  const avisosLidosStorageKey = `marcae_avisos_lidos_${empresa?.id || "global"}`;
  const licencaEmpresa = obterStatusLicencaEmpresa(empresa || {});
  const bloquearModalLicenca = licencaEmpresa.bloqueioTotal && pathname !== "/planos";

  const cssVars = {
    "--marcae-primary": tema.primary,
    "--marcae-primary-soft": tema.primarySoft,
    "--marcae-primary-medium": tema.primaryMedium,
    "--marcae-primary-strong": tema.primaryStrong,
    "--marcae-secondary": tema.secondary,
    "--marcae-secondary-soft": tema.secondarySoft,
    "--marcae-secondary-medium": tema.secondaryMedium,
    "--marcae-secondary-strong": tema.secondaryStrong,
    "--marcae-sidebar": tema.sidebar,
    "--marcae-sidebar-soft": tema.sidebarSoft,
    "--marcae-sidebar-medium": tema.sidebarMedium,
    "--marcae-bg": tema.bg,
    "--marcae-bg-soft": tema.bgSoft,
    "--marcae-card": tema.card,
    "--marcae-card-strong": tema.cardStrong,
    "--marcae-border": tema.border,
    "--marcae-text": tema.text,
    "--marcae-muted": tema.muted,
    "--marcae-success": tema.success,
    "--marcae-danger": tema.danger,
    "--marcae-warning": tema.warning,
    "--marcae-gradient": tema.gradient,
    "--marcae-gradient-soft": tema.gradientSoft,
    "--marcae-glow": tema.glow,
  } as React.CSSProperties;

  useEffect(() => {
    if (!pixAssinatura?.expiraEm || statusPixAssinatura === "aprovado") {
      return;
    }

    function atualizarTempoPix() {
      const expiraEm = new Date(pixAssinatura.expiraEm).getTime();
      const restante = Math.max(Math.floor((expiraEm - Date.now()) / 1000), 0);

      setSegundosPixAssinatura(restante);

      if (restante <= 0 && statusPixAssinatura === "aguardando") {
        setStatusPixAssinatura("expirado");
      }
    }

    atualizarTempoPix();
    const interval = setInterval(atualizarTempoPix, 1000);

    return () => clearInterval(interval);
  }, [pixAssinatura?.expiraEm, statusPixAssinatura]);

  useEffect(() => {
    if (
      !empresa?.id ||
      !pixAssinatura?.paymentId ||
      statusPixAssinatura !== "aguardando"
    ) {
      return;
    }

    let cancelado = false;

    async function consultarStatusPix() {
      try {
        const res = await fetch(
          `/api/admin/empresas/${empresa.id}/assinatura/pix/status?paymentId=${encodeURIComponent(
            pixAssinatura.paymentId,
          )}`,
          { cache: "no-store" },
        );

        const data = await res.json().catch(() => null);

        if (cancelado || !data?.success) return;

        if (data.aprovado) {
          setStatusPixAssinatura("aprovado");

          if (data.empresa) {
            localStorage.setItem("empresaLogada", JSON.stringify(data.empresa));
          }

          setTimeout(() => {
            window.location.reload();
          }, 1800);
        }
      } catch (error) {
        console.error("Erro ao consultar status do Pix da assinatura:", error);
      }
    }

    consultarStatusPix();
    const interval = setInterval(consultarStatusPix, 5000);

    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [empresa?.id, pixAssinatura?.paymentId, statusPixAssinatura]);

  useEffect(() => {
    if (!copiadoPixAssinatura) return;

    const timeout = setTimeout(() => {
      setCopiadoPixAssinatura(false);
    }, 2200);

    return () => clearTimeout(timeout);
  }, [copiadoPixAssinatura]);

  useEffect(() => {
    setMobileMenuAberto(false);
    setPainelNotificacoesAberto(false);
    setPainelAvisosMarcaeAberto(false);
    setAvisoMarcaeSelecionado(null);
  }, [pathname]);

  useEffect(() => {
    if (!empresa?.id) return;

    try {
      const dados = localStorage.getItem(avisosLidosStorageKey);

      if (dados) {
        const parsed = JSON.parse(dados);

        if (Array.isArray(parsed)) {
          setAvisosLidos(parsed);
        }
      } else {
        setAvisosLidos([]);
      }
    } catch (error) {
      console.error("Erro ao carregar avisos lidos:", error);
      setAvisosLidos([]);
    }
  }, [empresa?.id, avisosLidosStorageKey]);

  useEffect(() => {
    if (!empresa?.id) return;

    let cancelado = false;

    async function carregarComunicacaoMarcae() {
      try {
        const [resAvisos, resConfiguracao] = await Promise.all([
          fetch(`/api/admin/avisos?empresaId=${empresa.id}`, {
            cache: "no-store",
          }),
          fetch("/api/master/configuracoes/marcae", { cache: "no-store" }),
        ]);

        const dataAvisos = await resAvisos.json().catch(() => null);
        const dataConfiguracao = await resConfiguracao.json().catch(() => null);

        if (cancelado) return;

        if (resAvisos.ok && dataAvisos?.success) {
          setAvisosMarcae(
            Array.isArray(dataAvisos.avisos) ? dataAvisos.avisos : [],
          );
        } else {
          setAvisosMarcae([]);
        }

        if (resConfiguracao.ok && dataConfiguracao?.success) {
          setWhatsappSuporteMarcae(
            dataConfiguracao?.configuracao?.whatsappSuporte || "",
          );
        } else {
          setWhatsappSuporteMarcae("");
        }
      } catch (error) {
        if (!cancelado) {
          console.error("Erro ao carregar comunicação Marcaê:", error);
          setAvisosMarcae([]);
          setWhatsappSuporteMarcae("");
        }
      }
    }

    carregarComunicacaoMarcae();

    return () => {
      cancelado = true;
    };
  }, [empresa?.id]);

  useEffect(() => {
    if (!empresa?.id) return;

    setNotificacoesCarregadas(false);

    try {
      const dadosSalvos = localStorage.getItem(storageKey);

      notificacoesIdsRef.current = new Set();

      if (dadosSalvos) {
        const parsed = JSON.parse(dadosSalvos);

        if (Array.isArray(parsed?.notificacoes)) {
          setNotificacoes(parsed.notificacoes);

          parsed.notificacoes.forEach((item: any) => {
            if (item?.id) {
              notificacoesIdsRef.current.add(item.id);
            }
          });
        } else {
          setNotificacoes([]);
        }

        if (typeof parsed?.quantidade === "number") {
          setQuantidadeNotificacoes(parsed.quantidade);
        } else {
          setQuantidadeNotificacoes(0);
        }

        if (parsed?.ultimoCheck) {
          ultimoCheckRef.current = parsed.ultimoCheck;
        } else {
          ultimoCheckRef.current = null;
        }
      } else {
        setNotificacoes([]);
        setQuantidadeNotificacoes(0);
        ultimoCheckRef.current = null;
      }
    } catch (error) {
      console.error("Erro ao carregar notificações salvas:", error);

      setNotificacoes([]);
      setQuantidadeNotificacoes(0);
      ultimoCheckRef.current = null;
      notificacoesIdsRef.current = new Set();
    } finally {
      setNotificacoesCarregadas(true);
    }
  }, [empresa?.id, storageKey]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioLiberadoRef.current =
        sessionStorage.getItem("marcae_audio_notificacoes_liberado") === "true";
    }

    const liberarAudio = () => {
      audioLiberadoRef.current = true;
      audioGlobalLiberado = true;

      try {
        sessionStorage.setItem("marcae_audio_notificacoes_liberado", "true");

        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;

        if (AudioContextClass && !audioContextRef.current) {
          audioContextRef.current = new AudioContextClass();
        }

        if (audioContextRef.current?.state === "suspended") {
          audioContextRef.current.resume().catch(() => {});
        }
      } catch (error) {
        console.warn("Áudio de notificação ainda não liberado:", error);
      }
    };

    window.addEventListener("click", liberarAudio);
    window.addEventListener("touchstart", liberarAudio);
    window.addEventListener("keydown", liberarAudio);

    return () => {
      window.removeEventListener("click", liberarAudio);
      window.removeEventListener("touchstart", liberarAudio);
      window.removeEventListener("keydown", liberarAudio);
    };
  }, []);

  function tocarSomNotificacao() {
    if (!audioLiberadoRef.current && !audioGlobalLiberado) return;

    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      const contexto =
        audioContextRef.current ||
        audioGlobalContext ||
        new AudioContextClass();

      audioContextRef.current = contexto;
      audioGlobalContext = contexto;

      if (contexto.state === "suspended") {
        contexto.resume().catch(() => {});
      }

      const tocarBeep = (
        frequencia: number,
        inicio: number,
        duracao: number,
        volume: number,
      ) => {
        const oscilador = contexto.createOscillator();
        const ganho = contexto.createGain();

        oscilador.type = "sine";

        oscilador.frequency.setValueAtTime(
          frequencia,
          contexto.currentTime + inicio,
        );

        ganho.gain.setValueAtTime(0.0001, contexto.currentTime + inicio);

        ganho.gain.exponentialRampToValueAtTime(
          volume,
          contexto.currentTime + inicio + 0.015,
        );

        ganho.gain.exponentialRampToValueAtTime(
          0.0001,
          contexto.currentTime + inicio + duracao,
        );

        oscilador.connect(ganho);
        ganho.connect(contexto.destination);

        oscilador.start(contexto.currentTime + inicio);

        oscilador.stop(contexto.currentTime + inicio + duracao);
      };

      tocarBeep(660, 0, 0.07, 0.22);
      tocarBeep(880, 0.11, 0.07, 0.2);
      tocarBeep(1040, 0.23, 0.12, 0.18);
    } catch (error) {
      console.warn("Não foi possível tocar o som da notificação:", error);
    }
  }
  useEffect(() => {
    if (!empresa?.id || !notificacoesCarregadas) return;

    if (!ultimoCheckRef.current) {
      ultimoCheckRef.current = new Date().toISOString();
    }

    let cancelado = false;

    async function verificarNotificacoes() {
      try {
        const params = new URLSearchParams({
          empresaId: empresa.id,
        });

        if (ultimoCheckRef.current) {
          params.set("ultimoCheck", ultimoCheckRef.current);
        }

        const response = await fetch(
          `/api/notificacoes/agendamentos?${params.toString()}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (cancelado || !data?.success) return;

        const novosRecebidos = Array.isArray(data.novosAgendamentos)
          ? data.novosAgendamentos.filter((agendamento: any) => {
              if (!agendamento?.id) return false;

              if (notificacoesIdsRef.current.has(agendamento.id)) {
                return false;
              }

              notificacoesIdsRef.current.add(agendamento.id);
              return true;
            })
          : [];

        ultimoCheckRef.current = data.serverNow || new Date().toISOString();

        if (novosRecebidos.length > 0) {
          setQuantidadeNotificacoes((prev) => prev + novosRecebidos.length);

          setNotificacoes((prev) => [...novosRecebidos, ...prev].slice(0, 12));

          setAnimandoSino(true);

          setTimeout(() => {
            setAnimandoSino(false);
          }, 1800);

          novosRecebidos.forEach((item: any, index: number) => {
            setTimeout(() => {
              tocarSomNotificacao();
            }, index * 450);
          });
        }
      } catch (error) {
        console.error("Erro ao verificar notificações:", error);
      }
    }

    verificarNotificacoes();

    const interval = setInterval(verificarNotificacoes, 7000);

    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [empresa?.id, notificacoesCarregadas]);

  useEffect(() => {
    if (!empresa?.id || !notificacoesCarregadas) return;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          notificacoes,
          quantidade: quantidadeNotificacoes,
          ultimoCheck: ultimoCheckRef.current,
        }),
      );
    } catch (error) {
      console.error("Erro ao salvar notificações:", error);
    }
  }, [
    empresa?.id,
    notificacoes,
    quantidadeNotificacoes,
    notificacoesCarregadas,
    storageKey,
  ]);

  useEffect(() => {
    const SESSION_TIMEOUT = 1000 * 60 * 60;

    function validarSessao() {
      const ultimoAcesso = localStorage.getItem("marcae_ultimo_acesso");

      if (!ultimoAcesso) {
        localStorage.setItem("marcae_ultimo_acesso", Date.now().toString());
        return;
      }

      const agora = Date.now();
      const diferenca = agora - Number(ultimoAcesso);

      if (diferenca > SESSION_TIMEOUT) {
        limparSessaoLocalMarcae();

        fetch("/api/auth/logout", {
          method: "POST",
          keepalive: true,
          cache: "no-store",
          credentials: "include",
        }).catch(() => {});

        window.location.replace("/login?logout=1");
        return;
      }

      localStorage.setItem("marcae_ultimo_acesso", agora.toString());
    }

    validarSessao();

    const interval = setInterval(validarSessao, 60000);

    const atualizarAtividade = () => {
      localStorage.setItem("marcae_ultimo_acesso", Date.now().toString());
    };

    window.addEventListener("click", atualizarAtividade);
    window.addEventListener("keydown", atualizarAtividade);
    window.addEventListener("mousemove", atualizarAtividade);
    window.addEventListener("scroll", atualizarAtividade);
    window.addEventListener("touchstart", atualizarAtividade);

    return () => {
      clearInterval(interval);

      window.removeEventListener("click", atualizarAtividade);
      window.removeEventListener("keydown", atualizarAtividade);
      window.removeEventListener("mousemove", atualizarAtividade);
      window.removeEventListener("scroll", atualizarAtividade);
      window.removeEventListener("touchstart", atualizarAtividade);
    };
  }, []);

  function ativo(href: string) {
    return pathname === href;
  }

  function limparSessaoLocalMarcae() {
    try {
      sessionStorage.setItem("marcae_logout_recente", "true");
      sessionStorage.setItem("marcae_logout_em", Date.now().toString());
      sessionStorage.removeItem("marcae_audio_notificacoes_liberado");
    } catch (error) {
      console.warn("Não foi possível registrar logout local:", error);
    }

    localStorage.removeItem("empresaLogada");
    localStorage.removeItem("usuarioEmpresa");
    localStorage.removeItem("empresaId");
    localStorage.removeItem("empresaSlugAcesso");
    localStorage.removeItem("marcae_ultimo_acesso");
  }

  async function sair() {
    limparSessaoLocalMarcae();

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });
    } catch (error) {
      console.error("Erro ao encerrar sessão no servidor:", error);
    } finally {
      limparSessaoLocalMarcae();
      window.location.replace("/login?logout=1");
    }
  }

  async function pagarComCartaoLicenca() {
    if (!empresa?.id) {
      window.location.href = "/planos";
      return;
    }

    try {
      setGerandoPagamentoLicenca(true);

      const res = await fetch(`/api/admin/empresas/${empresa.id}/assinatura/pagar`, {
        method: "POST",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (!data?.success && !data?.linkPagamento)) {
        window.location.href = "/planos";
        return;
      }

      window.location.href = data.linkPagamento;
    } catch (error) {
      console.error("Erro ao gerar pagamento da licença:", error);
      window.location.href = "/planos";
    } finally {
      setGerandoPagamentoLicenca(false);
    }
  }

  function mensagemErroPixAmigavel(mensagem?: string | null) {
    const texto = String(mensagem || '').toLowerCase();

    if (
      texto.includes('unauthorized') ||
      texto.includes('credentials') ||
      texto.includes('access token') ||
      texto.includes('token') ||
      texto.includes('live credentials')
    ) {
      return 'Não foi possível gerar o Pix neste momento. Tente novamente em alguns instantes ou fale com nossa equipe.';
    }

    if (texto.includes('valor') || texto.includes('amount')) {
      return 'Não foi possível gerar o Pix porque o valor da mensalidade não foi localizado. Fale com nossa equipe para regularizar.';
    }

    return 'Não foi possível gerar o Pix neste momento. Tente novamente em alguns instantes ou fale com nossa equipe.';
  }

  async function gerarPixLicenca() {
    if (!empresa?.id) {
      window.location.href = "/planos";
      return;
    }

    try {
      setGerandoPixLicenca(true);
      setErroPixAssinatura("");
      setCopiadoPixAssinatura(false);

      const res = await fetch(`/api/admin/empresas/${empresa.id}/assinatura/pix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plano: String(empresa?.plano || "premium").toLowerCase(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setStatusPixAssinatura("erro");
        setErroPixAssinatura(mensagemErroPixAmigavel(data?.error || data?.message));
        return;
      }

      setPixAssinatura(data);
      setStatusPixAssinatura("aguardando");
      setSegundosPixAssinatura(1800);
    } catch (error) {
      console.error("Erro ao gerar Pix da licença:", error);
      setStatusPixAssinatura("erro");
      setErroPixAssinatura(mensagemErroPixAmigavel());
    } finally {
      setGerandoPixLicenca(false);
    }
  }

  async function copiarCodigoPixLicenca() {
    const codigoPix = pixAssinatura?.qrCode;

    if (!codigoPix) return;

    try {
      await navigator.clipboard.writeText(codigoPix);
      setCopiadoPixAssinatura(true);
    } catch (error) {
      console.error("Erro ao copiar código Pix:", error);
      alert("Não foi possível copiar automaticamente. Selecione e copie o código Pix manualmente.");
    }
  }

  function formatarTempoPix(totalSegundos: number) {
    const minutos = Math.floor(Math.max(totalSegundos, 0) / 60);
    const segundos = Math.max(totalSegundos, 0) % 60;

    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
  }

  function formatarValorPix(valor: any) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function menuBloqueadoPorLicenca(href: string) {
    return moduloBloqueadoPorLicenca(href, empresa || {});
  }

  function abrirSuporteMarcae() {
    const numero = String(whatsappSuporteMarcae || "").replace(/\D/g, "");

    if (!numero) {
      alert(
        "WhatsApp de suporte Marcaê ainda não configurado no painel master.",
      );
      return;
    }

    const texto = encodeURIComponent(
      `Olá, equipe Marcaê! Preciso de suporte no sistema. Empresa: ${empresa?.nome || ""}`,
    );

    window.open(`https://wa.me/${numero}?text=${texto}`, "_blank");
  }

  function abrirAjudaPagamentoLicenca() {
    const numero = String(whatsappSuporteMarcae || "").replace(/\D/g, "");

    if (!numero) {
      alert(
        "WhatsApp de suporte Marcaê ainda não configurado no painel master.",
      );
      return;
    }

    const texto = encodeURIComponent(
      `Olá, equipe Marcaê!

Estou tentando regularizar minha assinatura.

Empresa:
${empresa?.nome || "Não informada"}

Plano:
${empresa?.plano || "Não informado"}

Dias em atraso:
${licencaEmpresa.diasAtraso}

Preciso de ajuda para concluir o pagamento.`,
    );

    window.open(`https://wa.me/${numero}?text=${texto}`, "_blank");
  }

  function marcarAvisoComoLido(avisoId: string) {
    try {
      const atualizados = [...new Set([...avisosLidos, avisoId])];

      setAvisosLidos(atualizados);

      localStorage.setItem(avisosLidosStorageKey, JSON.stringify(atualizados));
    } catch (error) {
      console.error("Erro ao salvar aviso lido:", error);
    }
  }

  function labelTipoAvisoMarcae(tipo?: string | null) {
    if (tipo === "novidade") return "Novidade";
    if (tipo === "alerta") return "Alerta";
    if (tipo === "manutencao") return "Manutenção";
    return "Informativo";
  }

  return (
    <div style={cssVars}>
      <div style={layoutRoot}>
        <div style={backgroundGlowPrimary} />
        <div style={backgroundGlowSecondary} />
        <div style={backgroundGlowThird} />

        <div style={layoutFlex}>
          <aside className="marcae-sidebar-desktop" style={sidebarStyle}>
            <div style={sidebarTop}>
              <div style={brandRow}>
                <div
                  style={{
                    ...logoBox,
                    background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                    boxShadow: `0 20px 45px ${corPrimaria}55`,
                  }}
                >
                  {empresa?.logoUrl || empresa?.logo || empresa?.imagemUrl ? (
                    <img
                      src={empresa.logoUrl || empresa.logo || empresa.imagemUrl}
                      alt={empresa?.nome || "Marcaê"}
                      style={logoImage}
                    />
                  ) : (
                    <span>
                      {empresa?.nome?.charAt(0)?.toUpperCase() || "M"}
                    </span>
                  )}
                </div>

                <div>
                  <strong style={empresaNome}>
                    {empresa?.nome || "Marcaê"}
                  </strong>
                  <span style={empresaPlano}>SaaS Premium Enterprise</span>
                </div>
              </div>

              <div style={empresaStatusCard}>
                <div style={empresaStatusHeader}>
                  <div style={onlineDot} />
                  <span>Sistema operacional ativo</span>
                </div>

                <strong style={empresaStatusTitle}>
                  Gestão inteligente do negócio
                </strong>

                <p style={empresaStatusText}>
                  Analytics, financeiro, agenda, CRM e automações em um único
                  painel.
                </p>
              </div>
            </div>

            <nav style={navGrid}>
              {menu.map((item) => {
                const isActive = ativo(item.href);
                const itemBloqueado = menuBloqueadoPorLicenca(item.href);

                return (
                  <Link
                    key={item.href}
                    href={itemBloqueado ? "/planos" : item.href}
                    style={{
                      ...menuItem,
                      background: itemBloqueado
                        ? "rgba(100,116,139,0.08)"
                        : isActive
                          ? `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`
                          : "rgba(255,255,255,0.02)",
                      border: itemBloqueado
                        ? "1px solid rgba(248,113,113,0.18)"
                        : isActive
                          ? `1px solid ${corPrimaria}66`
                          : "1px solid rgba(255,255,255,0.04)",
                      color: itemBloqueado ? "#94a3b8" : isActive ? "#fff" : "#cbd5e1",
                      boxShadow: itemBloqueado
                        ? "none"
                        : isActive
                          ? `0 18px 35px ${corPrimaria}40`
                          : "none",
                      opacity: itemBloqueado ? 0.72 : 1,
                    }}
                  >
                    <span style={menuIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                    {itemBloqueado && <span style={licenseMenuBadge}>Bloqueado</span>}
                    {isActive && <div style={activeGlow} />}
                  </Link>
                );
              })}
            </nav>

            <div style={{ flex: 1 }} />

            <div style={sidebarBottom}>
              <button
                type="button"
                onClick={abrirSuporteMarcae}
                style={supportSidebarButton}
              >
                <span style={supportSidebarIcon}>💬</span>
                <span>
                  <strong style={supportSidebarTitle}>Suporte Marcaê</strong>
                  <small style={supportSidebarText}>
                    Fale com nossa equipe
                  </small>
                </span>
              </button>

              <button type="button" onClick={sair} style={logoutSidebarButton}>
                <span>🚪</span>
                <span>Sair</span>
              </button>

              <div style={userCard}>
                <div style={userAvatar}>
                  {(usuario?.nome || "U").charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <strong style={userName}>{usuario?.nome || "Usuário"}</strong>
                  <span style={userRole}>
                    {usuario?.perfil || "Administrador"}
                  </span>
                </div>

                <span style={userArrow}>›</span>
              </div>
            </div>
          </aside>

          <div className="marcae-main-wrapper" style={mainWrapper}>
            <header className="marcae-topbar" style={topbar}>
              <button
                type="button"
                className="marcae-mobile-menu-button"
                onClick={() => setMobileMenuAberto(true)}
                style={mobileMenuButton}
                aria-label="Abrir menu"
              >
                ☰
              </button>

              <div className="marcae-topbar-search" style={topbarSearch}>
                <span style={searchIcon}>⌕</span>

                <input
                  placeholder="Buscar cliente, serviço, profissional..."
                  style={searchInput}
                />

                <span style={shortcutBadge}>⌘K</span>
              </div>

              <div className="marcae-topbar-actions" style={topbarActions}>
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPainelAvisosMarcaeAberto((aberto) => !aberto);
                      setAvisoMarcaeSelecionado(null);
                    }}
                    style={avisosTopbarButton}
                    title="Avisos e informativos do Marcaê"
                  >
                    <span>🔔</span>
                    <strong>Avisos</strong>

                    {avisosMarcae.filter((a) => !avisosLidos.includes(a.id)).length > 0 && (
                      <div style={notificationBadge}>
                        {avisosMarcae.filter((a) => !avisosLidos.includes(a.id)).length > 99
                          ? "99+"
                          : avisosMarcae.filter((a) => !avisosLidos.includes(a.id)).length}
                      </div>
                    )}
                  </button>

                  {painelAvisosMarcaeAberto && (
                    <div
                      className="marcae-aviso-panel-mobile"
                      style={avisoMarcaePanel}
                    >
                      <div style={notificationPanelHeader}>
                        <div>
                          <strong style={notificationPanelTitle}>
                            Avisos e Informativos
                          </strong>
                          <span style={notificationPanelSub}>
                            Comunicados oficiais do Marcaê
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setPainelAvisosMarcaeAberto(false);
                            setAvisoMarcaeSelecionado(null);
                          }}
                          style={notificationCloseButton}
                        >
                          ×
                        </button>
                      </div>

                      {avisoMarcaeSelecionado ? (
                        <div style={avisoMarcaeNota}>
                          <button
                            type="button"
                            onClick={() => setAvisoMarcaeSelecionado(null)}
                            style={avisoMarcaeVoltar}
                          >
                            ← Voltar para avisos
                          </button>

                          <div style={avisoMarcaeNotaBadge}>
                            {labelTipoAvisoMarcae(avisoMarcaeSelecionado.tipo)}
                          </div>

                          <h3 style={avisoMarcaeNotaTitulo}>
                            {avisoMarcaeSelecionado.titulo}
                          </h3>

                          <p style={avisoMarcaeNotaMensagem}>
                            {avisoMarcaeSelecionado.mensagem}
                          </p>

                          <div style={avisoMarcaeNotaRodape}>
                            Comunicado oficial Marcaê
                          </div>
                        </div>
                      ) : avisosMarcae.length === 0 ? (
                        <div style={notificationEmpty}>
                          Nenhum aviso disponível no momento.
                        </div>
                      ) : (
                        <div
                          className="marcae-aviso-list-mobile"
                          style={notificationList}
                        >
                          {avisosMarcae.map((aviso) => (
                            <button
                              key={aviso.id}
                              type="button"
                              style={avisoMarcaeItem}
                              onClick={() => {
                                setAvisoMarcaeSelecionado(aviso);
                                marcarAvisoComoLido(aviso.id);
                              }}
                              title="Abrir aviso completo"
                            >
                              <div style={avisoMarcaeItemIcon}>📣</div>

                              <div style={avisoMarcaeItemContent}>
                                <div style={avisoMarcaeItemTop}>
                                  <span>
                                    {labelTipoAvisoMarcae(aviso.tipo)}
                                  </span>
                                  <small>Clique para ler</small>
                                </div>

                                <strong style={notificationItemTitle}>
                                  {aviso.titulo}
                                </strong>

                                <span style={avisoMarcaeResumo}>
                                  {aviso.mensagem}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </header>

            <main style={mainContent}>{bloquearModalLicenca ? null : children}</main>
          </div>
        </div>

        {mobileMenuAberto && (
          <div className="marcae-mobile-overlay" style={mobileOverlay}>
            <button
              type="button"
              style={mobileOverlayBackdrop}
              onClick={() => setMobileMenuAberto(false)}
              aria-label="Fechar menu"
            />

            <aside style={mobileDrawer}>
              <div style={mobileDrawerHeader}>
                <div style={brandRow}>
                  <div
                    style={{
                      ...logoBox,
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                      boxShadow: `0 18px 40px ${corPrimaria}44`,
                    }}
                  >
                    {empresa?.logoUrl || empresa?.logo || empresa?.imagemUrl ? (
                      <img
                        src={
                          empresa.logoUrl || empresa.logo || empresa.imagemUrl
                        }
                        alt={empresa?.nome || "Marcaê"}
                        style={logoImage}
                      />
                    ) : (
                      <span>
                        {empresa?.nome?.charAt(0)?.toUpperCase() || "M"}
                      </span>
                    )}
                  </div>

                  <div>
                    <strong style={{ ...empresaNome, fontSize: 18 }}>
                      {empresa?.nome || "Marcaê"}
                    </strong>
                    <span style={empresaPlano}>Menu administrativo</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuAberto(false)}
                  style={mobileDrawerClose}
                  aria-label="Fechar menu"
                >
                  ×
                </button>
              </div>

              <div style={mobileDrawerStatus}>
                <div style={empresaStatusHeader}>
                  <div style={onlineDot} />
                  <span>Sistema operacional ativo</span>
                </div>
                <p style={empresaStatusText}>
                  Acesse todos os módulos do Marcaê pelo celular.
                </p>
              </div>

              <nav style={mobileDrawerNav}>
                {menu.map((item) => {
                  const isActive = ativo(item.href);
                  const itemBloqueado = menuBloqueadoPorLicenca(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={itemBloqueado ? "/planos" : item.href}
                      onClick={() => setMobileMenuAberto(false)}
                      style={{
                        ...mobileDrawerItem,
                        background: itemBloqueado
                          ? "rgba(100,116,139,0.08)"
                          : isActive
                            ? `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`
                            : "rgba(255,255,255,0.035)",
                        border: itemBloqueado
                          ? "1px solid rgba(248,113,113,0.18)"
                          : isActive
                            ? `1px solid ${corPrimaria}66`
                            : "1px solid rgba(255,255,255,0.06)",
                        color: itemBloqueado ? "#94a3b8" : isActive ? "#fff" : "#cbd5e1",
                        boxShadow: itemBloqueado
                          ? "none"
                          : isActive
                            ? `0 14px 32px ${corPrimaria}33`
                            : "none",
                        opacity: itemBloqueado ? 0.72 : 1,
                      }}
                    >
                      <span style={menuIcon}>{item.icon}</span>
                      <span>{item.label}</span>
                      {itemBloqueado && <span style={licenseMenuBadge}>Bloqueado</span>}
                    </Link>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={abrirSuporteMarcae}
                style={supportMobileDrawerButton}
              >
                💬 Suporte Marcaê
              </button>

              <button
                type="button"
                onClick={sair}
                style={logoutMobileDrawerButton}
              >
                🚪 Sair do sistema
              </button>

              <div style={mobileDrawerUser}>
                <div style={userAvatar}>
                  {(usuario?.nome || "U").charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <strong style={userName}>{usuario?.nome || "Usuário"}</strong>
                  <span style={userRole}>
                    {usuario?.perfil || "Administrador"}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}

        <div className="marcae-mobile-menu" style={mobileMenu}>
          {menu.slice(0, 5).map((item) => {
            const isActive = ativo(item.href);
            const itemBloqueado = menuBloqueadoPorLicenca(item.href);

            return (
              <Link
                key={item.href}
                href={itemBloqueado ? "/planos" : item.href}
                onClick={() => {
                  setMobileMenuAberto(false);
                  setPainelNotificacoesAberto(false);
                  setAvisoMarcaeSelecionado(null);
                }}
                style={{
                  ...mobileMenuItem,
                  background: itemBloqueado
                    ? "rgba(100,116,139,0.08)"
                    : isActive
                      ? `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`
                      : "transparent",
                  color: itemBloqueado ? "#64748b" : isActive ? "#fff" : "#94a3b8",
                  boxShadow: itemBloqueado ? "none" : isActive ? `0 10px 30px ${corPrimaria}55` : "none",
                  opacity: itemBloqueado ? 0.62 : 1,
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {bloquearModalLicenca && (
          <div style={licenseModalOverlay} role="dialog" aria-modal="true">
            <div style={licenseModalBox}>
              <div style={licenseModalIcon}>🔒</div>

              <span style={licenseModalKicker}>Assinatura vencida</span>

              <h2 style={licenseModalTitle}>Acesso temporariamente bloqueado</h2>

              <p style={licenseModalText}>
                Sua empresa está há <strong>{licencaEmpresa.diasAtraso} dias</strong> com a mensalidade em atraso.
                Para continuar utilizando o Marcaê, regularize a assinatura.
              </p>

              {!pixAssinatura && (
                <div style={licensePaymentOptions}>
                  <button
                    type="button"
                    onClick={gerarPixLicenca}
                    disabled={gerandoPixLicenca}
                    style={licensePixButton}
                  >
                    <span style={licensePaymentIcon}>💚</span>
                    <span style={licensePaymentText}>
                      <strong>{gerandoPixLicenca ? "Gerando Pix..." : "Pagar via Pix agora"}</strong>
                      <small>QR Code + Pix copia e cola dentro do Marcaê</small>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={pagarComCartaoLicenca}
                    disabled={gerandoPagamentoLicenca}
                    style={licenseCardButton}
                  >
                    <span style={licensePaymentIcon}>💳</span>
                    <span style={licensePaymentText}>
                      <strong>{gerandoPagamentoLicenca ? "Abrindo Mercado Pago..." : "Pagar com cartão"}</strong>
                      <small>Cartão e outros meios no Checkout Mercado Pago</small>
                    </span>
                  </button>

                  {erroPixAssinatura && (
                    <div style={licensePixError}>{erroPixAssinatura}</div>
                  )}

                  <div style={licenseHelpBox}>
                    <div>
                      <strong>🤝 Não consegue realizar o pagamento?</strong>
                      <span>Fale com nossa equipe para receber ajuda na regularização.</span>
                    </div>

                    <button
                      type="button"
                      onClick={abrirAjudaPagamentoLicenca}
                      style={licenseHelpButton}
                    >
                      💬 Falar com a equipe Marcaê
                    </button>
                  </div>

                  <button type="button" onClick={sair} style={licenseModalSecondaryButton}>
                    Sair
                  </button>
                </div>
              )}

              {pixAssinatura && (
                <div style={licensePixArea}>
                  <div style={licensePixHeader}>
                    <div>
                      <strong>Pix Mercado Pago gerado</strong>
                      <span>Escaneie o QR Code ou copie o código Pix.</span>
                    </div>

                    <span
                      style={{
                        ...licensePixTimer,
                        ...(statusPixAssinatura === "expirado" ? licensePixTimerExpired : {}),
                      }}
                    >
                      {statusPixAssinatura === "expirado"
                        ? "Expirado"
                        : formatarTempoPix(segundosPixAssinatura)}
                    </span>
                  </div>

                  <div style={licensePixQrBox}>
                    {pixAssinatura.qrCodeBase64 ? (
                      <img
                        src={`data:image/png;base64,${pixAssinatura.qrCodeBase64}`}
                        alt="QR Code Pix para regularizar assinatura"
                        style={licensePixQrImage}
                      />
                    ) : (
                      <div style={licensePixQrFallback}>QR Code indisponível</div>
                    )}
                  </div>

                  <div style={licensePixMeta}>
                    <span>Valor</span>
                    <strong>{formatarValorPix(pixAssinatura.valor)}</strong>
                  </div>

                  <div style={licensePixCodeBox}>
                    <span>Pix copia e cola</span>
                    <textarea
                      readOnly
                      value={pixAssinatura.qrCode || ""}
                      style={licensePixTextarea}
                    />

                    <button
                      type="button"
                      onClick={copiarCodigoPixLicenca}
                      style={licenseCopyPixButton}
                    >
                      {copiadoPixAssinatura ? "Código copiado!" : "Copiar código Pix"}
                    </button>
                  </div>

                  <div
                    style={{
                      ...licensePixStatus,
                      ...(statusPixAssinatura === "aprovado" ? licensePixStatusApproved : {}),
                      ...(statusPixAssinatura === "erro" || statusPixAssinatura === "expirado"
                        ? licensePixStatusError
                        : {}),
                    }}
                  >
                    {statusPixAssinatura === "aprovado" ? (
                      <>✅ Pagamento confirmado! Liberando acesso...</>
                    ) : statusPixAssinatura === "expirado" ? (
                      <>⚠️ Este Pix expirou. Gere um novo código para pagar.</>
                    ) : statusPixAssinatura === "erro" ? (
                      <>⚠️ {erroPixAssinatura || "Não foi possível consultar o Pix."}</>
                    ) : (
                      <>⏳ Aguardando pagamento. A confirmação é automática.</>
                    )}
                  </div>

                  <div style={licensePixActions}>
                    <button
                      type="button"
                      onClick={gerarPixLicenca}
                      disabled={gerandoPixLicenca}
                      style={licenseModalSecondaryButton}
                    >
                      {gerandoPixLicenca ? "Gerando..." : "Gerar novo Pix"}
                    </button>

                    <button
                      type="button"
                      onClick={pagarComCartaoLicenca}
                      disabled={gerandoPagamentoLicenca}
                      style={licenseModalPrimaryButton}
                    >
                      {gerandoPagamentoLicenca ? "Abrindo..." : "Pagar com cartão"}
                    </button>
                  </div>

                  <div style={licenseHelpBox}>
                    <div>
                      <strong>🤝 Precisa de ajuda?</strong>
                      <span>Se tiver dificuldade com o Pix ou cartão, fale com nossa equipe.</span>
                    </div>

                    <button
                      type="button"
                      onClick={abrirAjudaPagamentoLicenca}
                      style={licenseHelpButton}
                    >
                      💬 Falar com a equipe Marcaê
                    </button>
                  </div>

                  <button type="button" onClick={sair} style={licenseModalSecondaryButton}>
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <style jsx>{`
          .marcae-mobile-menu-button {
            display: none;
          }

          @media (max-width: 1180px) {
            .marcae-sidebar-desktop {
              display: none !important;
            }

            .marcae-mobile-menu {
              display: grid !important;
            }

            .marcae-mobile-menu-button {
              display: flex !important;
            }

            .marcae-main-wrapper {
              width: 100% !important;
              max-width: 100vw !important;
              min-width: 0 !important;
              height: auto !important;
              min-height: 100dvh !important;
              overflow-x: hidden !important;
              overflow-y: visible !important;
              padding: 10px 8px 120px !important;
              box-sizing: border-box !important;
            }

            .marcae-topbar {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              position: relative !important;
              top: auto !important;
              margin-bottom: 16px !important;
              box-sizing: border-box !important;
              overflow: visible !important;
            }
          }

          @media (max-width: 720px) {
            .marcae-topbar {
              gap: 10px !important;
              padding: 12px !important;
              border-radius: 22px !important;
            }

            .marcae-topbar-search {
              display: none !important;
            }

            .marcae-empresa-mini-card {
              display: none !important;
            }

            .marcae-topbar-actions {
              margin-left: auto !important;
              gap: 8px !important;
            }

            .marcae-mobile-menu {
              left: 8px !important;
              right: 8px !important;
              bottom: 8px !important;
              gap: 6px !important;
              padding: 8px !important;
              border-radius: 22px !important;
            }

            .marcae-aviso-panel-mobile,
            .marcae-notification-panel-mobile {
              position: fixed !important;
              top: 86px !important;
              left: 10px !important;
              right: 10px !important;
              width: auto !important;
              max-width: none !important;
              max-height: calc(100dvh - 170px) !important;
              overflow: hidden !important;
              z-index: 2500 !important;
              border-radius: 22px !important;
              padding: 12px !important;
            }

            .marcae-aviso-list-mobile,
            .marcae-notification-list-mobile {
              max-height: calc(100dvh - 285px) !important;
              overflow-y: auto !important;
              padding-right: 2px !important;
            }

            .marcae-aviso-panel-mobile strong,
            .marcae-aviso-panel-mobile span,
            .marcae-notification-panel-mobile strong,
            .marcae-notification-panel-mobile span {
              max-width: 100% !important;
              overflow-wrap: anywhere !important;
            }
          }

          @media (max-width: 560px) {
            .marcae-mobile-menu span:last-child {
              font-size: 10px !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

const layoutRoot: React.CSSProperties = {
  minHeight: "100dvh",
  position: "relative",
  overflowX: "hidden",
  overflowY: "visible",
  background:
    "linear-gradient(135deg, var(--marcae-bg) 0%, var(--marcae-bg-soft) 48%, var(--marcae-sidebar) 100%)",
  color: "var(--marcae-text)",
};

const backgroundGlowPrimary: React.CSSProperties = {
  position: "fixed",
  top: -300,
  left: -180,
  width: 700,
  height: 700,
  borderRadius: "50%",
  background: "var(--marcae-primary-soft)",
  filter: "blur(140px)",
  pointerEvents: "none",
};

const backgroundGlowSecondary: React.CSSProperties = {
  position: "fixed",
  top: -200,
  right: -160,
  width: 620,
  height: 620,
  borderRadius: "50%",
  background: "var(--marcae-secondary-soft)",
  filter: "blur(130px)",
  pointerEvents: "none",
};

const backgroundGlowThird: React.CSSProperties = {
  position: "fixed",
  bottom: -260,
  left: "35%",
  width: 580,
  height: 580,
  borderRadius: "50%",
  background: "var(--marcae-secondary-soft)",
  filter: "blur(150px)",
  pointerEvents: "none",
};

const layoutFlex: React.CSSProperties = {
  display: "flex",
  minHeight: "100dvh",
  position: "relative",
  zIndex: 2,
  overflow: "visible",
};

const sidebarStyle: React.CSSProperties = {
  width: 300,
  margin: 18,
  padding: 22,
  display: "flex",
  flexDirection: "column",
  position: "sticky",
  top: 18,
  height: "calc(100vh - 36px)",
  borderRadius: 32,
  background:
    "linear-gradient(180deg, var(--marcae-sidebar-soft), rgba(2,6,23,0.96))",
  border: "1px solid var(--marcae-border)",
  backdropFilter: "blur(24px)",
  boxShadow:
    "0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
};

const sidebarTop: React.CSSProperties = { marginBottom: 24 };

const brandRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  marginBottom: 22,
};

const logoBox: React.CSSProperties = {
  width: 68,
  height: 68,
  borderRadius: 22,
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 26,
  fontWeight: 900,
  color: "#fff",
};

const logoImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const empresaNome: React.CSSProperties = {
  display: "block",
  color: "#fff",
  fontSize: 22,
  fontWeight: 900,
  letterSpacing: "-0.03em",
};

const empresaPlano: React.CSSProperties = {
  color: "var(--marcae-muted)",
  fontSize: 13,
  fontWeight: 700,
};

const empresaStatusCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--marcae-border)",
  borderRadius: 24,
  padding: 18,
};

const empresaStatusHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 12,
  color: "#dbeafe",
  fontSize: 12,
  fontWeight: 800,
};

const onlineDot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "var(--marcae-success)",
  boxShadow: "0 0 18px var(--marcae-success)",
};

const empresaStatusTitle: React.CSSProperties = {
  display: "block",
  color: "#fff",
  fontSize: 15,
  marginBottom: 8,
};

const empresaStatusText: React.CSSProperties = {
  color: "var(--marcae-muted)",
  fontSize: 13,
  lineHeight: 1.6,
  margin: 0,
};

const navGrid: React.CSSProperties = { display: "grid", gap: 10 };

const menuItem: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "14px 16px",
  borderRadius: 20,
  textDecoration: "none",
  overflow: "hidden",
  fontWeight: 800,
  transition: ".25s",
};

const menuIcon: React.CSSProperties = { fontSize: 18 };

const activeGlow: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(255,255,255,0.06)",
  pointerEvents: "none",
};

const sidebarBottom: React.CSSProperties = { display: "grid", gap: 14 };

const supportSidebarButton: React.CSSProperties = {
  width: "100%",
  minHeight: 64,
  borderRadius: 20,
  border: "1px solid rgba(168,85,247,0.55)",
  background:
    "linear-gradient(135deg, rgba(88,28,135,0.34), rgba(15,23,42,0.96))",
  color: "#fff",
  fontWeight: 900,
  fontSize: 13,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 14px",
  textAlign: "left",
  boxShadow: "0 18px 36px rgba(168,85,247,0.18)",
};

const supportSidebarIcon: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 14,
  background: "rgba(168,85,247,0.20)",
  border: "1px solid rgba(168,85,247,0.36)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  fontSize: 18,
};

const supportSidebarTitle: React.CSSProperties = {
  display: "block",
  color: "#fff",
  fontSize: 13,
  fontWeight: 950,
};

const supportSidebarText: React.CSSProperties = {
  display: "block",
  color: "#c4b5fd",
  fontSize: 11,
  fontWeight: 800,
  marginTop: 2,
};

const supportMobileDrawerButton: React.CSSProperties = {
  width: "100%",
  minHeight: 52,
  borderRadius: 16,
  border: "1px solid rgba(168,85,247,0.50)",
  background:
    "linear-gradient(135deg, rgba(88,28,135,0.42), rgba(15,23,42,0.96))",
  color: "#fff",
  fontWeight: 950,
  fontSize: 14,
  cursor: "pointer",
  marginTop: 14,
};

const logoutSidebarButton: React.CSSProperties = {
  width: "100%",
  height: 50,
  borderRadius: 18,
  border: "1px solid rgba(239,68,68,.20)",
  background: "rgba(239,68,68,.08)",
  color: "#fca5a5",
  fontWeight: 900,
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  transition: ".2s",
};

const logoutMobileDrawerButton: React.CSSProperties = {
  width: "100%",
  minHeight: 52,
  borderRadius: 16,
  border: "1px solid rgba(239,68,68,.20)",
  background: "rgba(239,68,68,.08)",
  color: "#fca5a5",
  fontWeight: 900,
  fontSize: 14,
  cursor: "pointer",
  marginTop: 14,
};

const userCard: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: 16,
  borderRadius: 22,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--marcae-border)",
};

const userAvatar: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: "50%",
  background: "var(--marcae-gradient)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontWeight: 900,
};

const userName: React.CSSProperties = {
  display: "block",
  color: "#fff",
  fontSize: 14,
};
const userRole: React.CSSProperties = {
  color: "var(--marcae-muted)",
  fontSize: 12,
};
const userArrow: React.CSSProperties = {
  color: "var(--marcae-muted)",
  fontSize: 20,
};

const mainWrapper: React.CSSProperties = {
  flex: 1,
  minHeight: "100dvh",
  minWidth: 0,
  overflowX: "hidden",
  overflowY: "visible",
  padding: "18px 22px 120px",
};

const topbar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "center",
  marginBottom: 22,
  position: "sticky",
  top: 18,
  zIndex: 500,
  padding: 18,
  borderRadius: 28,
  background: "rgba(5,10,25,0.72)",
  border: "1px solid var(--marcae-border)",
  backdropFilter: "blur(24px)",
};

const topbarSearch: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 18px",
  borderRadius: 20,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--marcae-border)",
};

const searchIcon: React.CSSProperties = {
  color: "var(--marcae-muted)",
  fontSize: 18,
};

const searchInput: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  color: "#fff",
  fontSize: 14,
};

const shortcutBadge: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid var(--marcae-border)",
  borderRadius: 12,
  padding: "6px 10px",
  color: "var(--marcae-muted)",
  fontSize: 12,
  fontWeight: 800,
};

const topbarActions: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const avisosTopbarButton: React.CSSProperties = {
  position: "relative",
  minWidth: 118,
  height: 48,
  borderRadius: 18,
  border: "1px solid rgba(168,85,247,0.45)",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(88,28,135,0.34))",
  color: "#fff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 9,
  padding: "0 18px",
  boxShadow: "0 14px 34px rgba(168,85,247,0.18)",
};

const avisoMarcaePanel: React.CSSProperties = {
  position: "absolute",
  top: 60,
  right: 0,
  width: 420,
  maxWidth: "calc(100vw - 32px)",
  borderRadius: 24,
  padding: 16,
  background: "rgba(5,10,25,0.97)",
  border: "1px solid var(--marcae-border)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
  backdropFilter: "blur(24px)",
  zIndex: 2200,
  overflow: "hidden",
};

const avisoMarcaeItem: React.CSSProperties = {
  width: "100%",
  display: "flex",
  gap: 12,
  padding: 14,
  borderRadius: 18,
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(168,85,247,0.10))",
  border: "1px solid var(--marcae-border)",
  cursor: "pointer",
  textAlign: "left",
  color: "#fff",
  minWidth: 0,
  overflow: "hidden",
};

const avisoMarcaeItemContent: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
};

const avisoMarcaeResumo: React.CSSProperties = {
  display: "-webkit-box",
  marginTop: 4,
  color: "#cbd5e1",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.45,
  overflow: "hidden",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

const avisoMarcaeNota: React.CSSProperties = {
  marginTop: 12,
  padding: 18,
  borderRadius: 20,
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(168,85,247,0.12))",
  border: "1px solid var(--marcae-border)",
  maxHeight: 430,
  overflowY: "auto",
  overflowX: "hidden",
};

const avisoMarcaeVoltar: React.CSSProperties = {
  border: "1px solid var(--marcae-border)",
  background: "rgba(255,255,255,0.05)",
  color: "#c4b5fd",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
  marginBottom: 14,
};

const avisoMarcaeNotaBadge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "6px 10px",
  background: "rgba(168,85,247,0.18)",
  color: "#d8b4fe",
  fontSize: 11,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 12,
};

const avisoMarcaeNotaTitulo: React.CSSProperties = {
  margin: "0 0 12px",
  color: "#fff",
  fontSize: 20,
  fontWeight: 950,
  lineHeight: 1.15,
  letterSpacing: "-0.03em",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

const avisoMarcaeNotaMensagem: React.CSSProperties = {
  margin: 0,
  color: "#e5e7eb",
  fontSize: 14,
  fontWeight: 650,
  lineHeight: 1.75,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

const avisoMarcaeNotaRodape: React.CSSProperties = {
  marginTop: 18,
  paddingTop: 14,
  borderTop: "1px solid var(--marcae-border)",
  color: "var(--marcae-muted)",
  fontSize: 12,
  fontWeight: 800,
};

const avisoMarcaeItemIcon: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 14,
  background: "rgba(168,85,247,0.22)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const avisoMarcaeItemTop: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 6,
  color: "#c084fc",
  fontSize: 11,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const topbarIconButton: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 18,
  border: "1px solid var(--marcae-border)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 18,
};

const notificationBadge: React.CSSProperties = {
  position: "absolute",
  top: -6,
  right: -6,
  minWidth: 24,
  height: 24,
  borderRadius: 999,
  background: "#ef4444",
  color: "#fff",
  fontSize: 11,
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 6px",
  border: "2px solid rgba(5,10,25,0.95)",
  boxShadow: "0 0 18px rgba(239,68,68,0.65)",
};

const notificationPanel: React.CSSProperties = {
  position: "absolute",
  top: 60,
  right: 0,
  width: 360,
  maxWidth: "calc(100vw - 32px)",
  borderRadius: 24,
  padding: 16,
  background: "rgba(5,10,25,0.96)",
  border: "1px solid var(--marcae-border)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
  backdropFilter: "blur(24px)",
  zIndex: 2000,
};

const notificationPanelHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  paddingBottom: 12,
  borderBottom: "1px solid var(--marcae-border)",
};

const notificationPanelTitle: React.CSSProperties = {
  display: "block",
  color: "#fff",
  fontSize: 15,
  fontWeight: 900,
};

const notificationPanelSub: React.CSSProperties = {
  display: "block",
  marginTop: 4,
  color: "var(--marcae-muted)",
  fontSize: 12,
  fontWeight: 700,
};

const notificationCloseButton: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 999,
  border: "1px solid var(--marcae-border)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 18,
  lineHeight: 1,
};

const notificationEmpty: React.CSSProperties = {
  padding: 18,
  color: "var(--marcae-muted)",
  fontSize: 13,
  lineHeight: 1.5,
};

const notificationList: React.CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 12,
  maxHeight: 380,
  overflowY: "auto",
  overflowX: "hidden",
};

const notificationItem: React.CSSProperties = {
  display: "flex",
  gap: 12,
  padding: 12,
  borderRadius: 18,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--marcae-border)",
};

const notificationItemIcon: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 14,
  background: "var(--marcae-gradient)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const notificationItemTitle: React.CSSProperties = {
  display: "block",
  color: "#fff",
  fontSize: 13,
  fontWeight: 900,
  lineHeight: 1.25,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

const notificationItemText: React.CSSProperties = {
  display: "block",
  marginTop: 4,
  color: "#cbd5e1",
  fontSize: 12,
  fontWeight: 700,
};

const notificationItemDate: React.CSSProperties = {
  display: "block",
  marginTop: 4,
  color: "var(--marcae-muted)",
  fontSize: 11,
  fontWeight: 700,
};

const empresaMiniCard: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 14px",
  borderRadius: 20,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--marcae-border)",
};

const empresaMiniAvatar: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "var(--marcae-gradient)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  color: "#fff",
};

const empresaMiniNome: React.CSSProperties = {
  display: "block",
  color: "#fff",
  fontSize: 13,
};
const empresaMiniPlano: React.CSSProperties = {
  color: "var(--marcae-muted)",
  fontSize: 11,
};

const mainContent: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: 0,
};

const mobileMenuButton: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 18,
  border: "1px solid var(--marcae-border)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 22,
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const mobileOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 3000,
  display: "flex",
  justifyContent: "flex-start",
};

const mobileOverlayBackdrop: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  border: "none",
  background: "rgba(2,6,23,0.72)",
  backdropFilter: "blur(10px)",
  cursor: "pointer",
};

const mobileDrawer: React.CSSProperties = {
  position: "relative",
  width: "min(390px, calc(100vw - 28px))",
  height: "calc(100dvh - 24px)",
  margin: 12,
  padding: 18,
  borderRadius: 28,
  background:
    "linear-gradient(180deg, var(--marcae-sidebar-soft), rgba(2,6,23,0.98))",
  border: "1px solid var(--marcae-border)",
  boxShadow: "0 34px 90px rgba(0,0,0,0.62)",
  overflowY: "auto",
};

const mobileDrawerHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 16,
};

const mobileDrawerClose: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 16,
  border: "1px solid var(--marcae-border)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 24,
  lineHeight: 1,
  flexShrink: 0,
};

const mobileDrawerStatus: React.CSSProperties = {
  background: "rgba(255,255,255,0.035)",
  border: "1px solid var(--marcae-border)",
  borderRadius: 22,
  padding: 14,
  marginBottom: 16,
};

const mobileDrawerNav: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  paddingBottom: 18,
};

const mobileDrawerItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "13px 12px",
  borderRadius: 18,
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 900,
  minHeight: 50,
};

const mobileDrawerUser: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 14,
  borderRadius: 20,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--marcae-border)",
};

const mobileMenu: React.CSSProperties = {
  position: "fixed",
  left: 12,
  right: 12,
  bottom: 12,
  display: "none",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: 10,
  padding: 12,
  borderRadius: 26,
  background: "rgba(5,10,25,0.88)",
  border: "1px solid var(--marcae-border)",
  backdropFilter: "blur(24px)",
  zIndex: 999,
};

const mobileMenuItem: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  padding: "10px 6px",
  borderRadius: 18,
  textDecoration: "none",
  fontSize: 11,
  fontWeight: 800,
};


const licenseMenuBadge: React.CSSProperties = {
  marginLeft: 'auto',
  borderRadius: 999,
  padding: '3px 7px',
  background: 'rgba(239,68,68,0.16)',
  border: '1px solid rgba(248,113,113,0.22)',
  color: '#fecaca',
  fontSize: 9,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const licenseModalOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 18,
  background: 'rgba(2,6,23,0.88)',
  backdropFilter: 'blur(18px)',
};

const licenseModalBox: React.CSSProperties = {
  width: 'min(620px, 100%)',
  borderRadius: 30,
  padding: 28,
  background: 'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(30,41,59,0.96))',
  border: '1px solid rgba(248,113,113,0.24)',
  boxShadow: '0 28px 90px rgba(0,0,0,0.55)',
  color: '#fff',
  textAlign: 'center',
};

const licenseModalIcon: React.CSSProperties = {
  width: 62,
  height: 62,
  margin: '0 auto 14px',
  borderRadius: 22,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(124,58,237,0.90))',
  fontSize: 28,
  boxShadow: '0 18px 42px rgba(239,68,68,0.28)',
};

const licenseModalKicker: React.CSSProperties = {
  display: 'inline-flex',
  borderRadius: 999,
  padding: '6px 10px',
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(248,113,113,0.22)',
  color: '#fecaca',
  fontSize: 11,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const licenseModalTitle: React.CSSProperties = {
  margin: '14px 0 8px',
  fontSize: 30,
  lineHeight: 1.05,
  letterSpacing: '-0.045em',
  fontWeight: 950,
};

const licenseModalText: React.CSSProperties = {
  margin: '0 auto 18px',
  maxWidth: 430,
  color: '#cbd5e1',
  lineHeight: 1.6,
  fontSize: 14,
  fontWeight: 700,
};

const licenseModalActions: React.CSSProperties = {
  display: 'grid',
  gap: 10,
};

const licenseModalPrimaryButton: React.CSSProperties = {
  minHeight: 48,
  border: 'none',
  borderRadius: 16,
  background: 'linear-gradient(135deg, #ef4444, #7c3aed)',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
  boxShadow: '0 16px 36px rgba(239,68,68,0.24)',
};

const licenseModalSecondaryButton: React.CSSProperties = {
  minHeight: 46,
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.05)',
  color: '#e2e8f0',
  fontWeight: 900,
  cursor: 'pointer',
};


const licensePaymentOptions: React.CSSProperties = {
  display: 'grid',
  gap: 12,
};

const licensePixButton: React.CSSProperties = {
  width: '100%',
  border: '1px solid rgba(34,197,94,0.36)',
  borderRadius: 18,
  padding: 14,
  background: 'linear-gradient(135deg, rgba(22,163,74,0.22), rgba(15,23,42,0.78))',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  textAlign: 'left',
  cursor: 'pointer',
};

const licenseCardButton: React.CSSProperties = {
  width: '100%',
  border: '1px solid rgba(168,85,247,0.36)',
  borderRadius: 18,
  padding: 14,
  background: 'linear-gradient(135deg, rgba(124,58,237,0.24), rgba(15,23,42,0.78))',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  textAlign: 'left',
  cursor: 'pointer',
};

const licensePaymentIcon: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 15,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.10)',
  flexShrink: 0,
  fontSize: 20,
};

const licensePaymentText: React.CSSProperties = {
  display: 'grid',
  gap: 3,
};

const licensePixError: React.CSSProperties = {
  borderRadius: 14,
  padding: 12,
  background: 'rgba(239,68,68,0.10)',
  border: '1px solid rgba(248,113,113,0.22)',
  color: '#fecaca',
  fontSize: 12,
  fontWeight: 800,
};

const licenseHelpBox: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 14,
  borderRadius: 18,
  background: 'linear-gradient(135deg, rgba(34,197,94,0.10), rgba(15,23,42,0.72))',
  border: '1px solid rgba(34,197,94,0.22)',
  color: '#e2e8f0',
  textAlign: 'left',
};

const licenseHelpButton: React.CSSProperties = {
  minHeight: 42,
  border: '1px solid rgba(34,197,94,0.34)',
  borderRadius: 14,
  background: 'rgba(34,197,94,0.16)',
  color: '#bbf7d0',
  fontWeight: 950,
  cursor: 'pointer',
};

const licensePixArea: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  textAlign: 'left',
};

const licensePixHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  borderRadius: 18,
  padding: 14,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const licensePixTimer: React.CSSProperties = {
  borderRadius: 999,
  padding: '8px 11px',
  background: 'rgba(34,197,94,0.14)',
  border: '1px solid rgba(74,222,128,0.24)',
  color: '#bbf7d0',
  fontSize: 12,
  fontWeight: 950,
  flexShrink: 0,
};

const licensePixTimerExpired: React.CSSProperties = {
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(248,113,113,0.26)',
  color: '#fecaca',
};

const licensePixQrBox: React.CSSProperties = {
  width: 'min(235px, 100%)',
  margin: '0 auto',
  borderRadius: 24,
  padding: 12,
  background: '#fff',
  boxShadow: '0 18px 45px rgba(0,0,0,0.22)',
};

const licensePixQrImage: React.CSSProperties = {
  width: '100%',
  display: 'block',
  borderRadius: 14,
};

const licensePixQrFallback: React.CSSProperties = {
  minHeight: 180,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#0f172a',
  fontWeight: 900,
};

const licensePixMeta: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 14px',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#e2e8f0',
};

const licensePixCodeBox: React.CSSProperties = {
  display: 'grid',
  gap: 8,
};

const licensePixTextarea: React.CSSProperties = {
  width: '100%',
  minHeight: 74,
  resize: 'none',
  borderRadius: 14,
  border: '1px solid rgba(148,163,184,0.22)',
  background: 'rgba(2,6,23,0.60)',
  color: '#e2e8f0',
  padding: 12,
  fontSize: 11,
  lineHeight: 1.45,
  outline: 'none',
  boxSizing: 'border-box',
};

const licenseCopyPixButton: React.CSSProperties = {
  minHeight: 42,
  border: '1px solid rgba(34,197,94,0.34)',
  borderRadius: 14,
  background: 'rgba(34,197,94,0.14)',
  color: '#bbf7d0',
  fontWeight: 950,
  cursor: 'pointer',
};

const licensePixStatus: React.CSSProperties = {
  borderRadius: 16,
  padding: 12,
  background: 'rgba(250,204,21,0.10)',
  border: '1px solid rgba(250,204,21,0.20)',
  color: '#fef3c7',
  fontSize: 12,
  fontWeight: 850,
  textAlign: 'center',
};

const licensePixStatusApproved: React.CSSProperties = {
  background: 'rgba(34,197,94,0.12)',
  border: '1px solid rgba(74,222,128,0.24)',
  color: '#bbf7d0',
};

const licensePixStatusError: React.CSSProperties = {
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(248,113,113,0.24)',
  color: '#fecaca',
};

const licensePixActions: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
};
