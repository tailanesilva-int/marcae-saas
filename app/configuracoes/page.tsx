"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PremiumLayout from "@/components/layout/PremiumLayout";
import { aplicarTemaNoDocumento, TEMA_PADRAO_MARCAE } from "@/app/lib/theme";
import { montarMensagemConviteAgendamento } from "@/lib/templatesWhatsapp";
import { montarLinkAgendamento } from "@/lib/links";

type PermissoesUsuario = {
  dashboard: boolean;
  agenda: boolean;
  servicos: boolean;
  profissionais: boolean;
  promocoes: boolean;
  configuracoes: boolean;
  comissoes: boolean;
  visualizarFinanceiro: boolean;
  financeiro: boolean;
  operarCaixa: boolean;
  abrirCaixa: boolean;
  registrarMovimentacaoCaixa: boolean;
  fecharCaixa: boolean;
  verCreditosDebitosClientes: boolean;
  clientes: boolean;
  lancarCreditoCliente: boolean;
  lancarDebitoCliente: boolean;
  abaterDebitoCliente: boolean;
  finalizarAtendimento: boolean;
  registrarPagamentoAtendimento: boolean;
  lancarDebitoNoFechamento: boolean;
  lancarCreditoNoFechamento: boolean;
  reagendarAtendimento: boolean;
  cancelarAtendimento: boolean;
  fecharComissao: boolean;
  relatorios: boolean;
  exportarRelatorios: boolean;
  gerenciarUsuarios: boolean;
  alterarPermissoes: boolean;
  alterarDadosEmpresa: boolean;
  alterarTemaWhiteLabel: boolean;
};

type UsuarioSistema = {
  id: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  perfil: string | null;
  ativo: boolean | null;
  permissoes: any;
};

const permissoesPadrao: PermissoesUsuario = {
  dashboard: false,
  agenda: false,
  servicos: false,
  profissionais: false,
  promocoes: false,
  configuracoes: false,
  comissoes: false,
  visualizarFinanceiro: false,
  financeiro: false,
  operarCaixa: false,
  abrirCaixa: false,
  registrarMovimentacaoCaixa: false,
  fecharCaixa: false,
  verCreditosDebitosClientes: false,
  clientes: false,
  lancarCreditoCliente: false,
  lancarDebitoCliente: false,
  abaterDebitoCliente: false,
  finalizarAtendimento: false,
  registrarPagamentoAtendimento: false,
  lancarDebitoNoFechamento: false,
  lancarCreditoNoFechamento: false,
  reagendarAtendimento: false,
  cancelarAtendimento: false,
  fecharComissao: false,
  relatorios: false,
  exportarRelatorios: false,
  gerenciarUsuarios: false,
  alterarPermissoes: false,
  alterarDadosEmpresa: false,
  alterarTemaWhiteLabel: false,
};

const TEMA_MARCAE = {
  corPrimaria: TEMA_PADRAO_MARCAE.primary,
  corSecundaria: TEMA_PADRAO_MARCAE.secondary,
  corSidebar: TEMA_PADRAO_MARCAE.sidebar,
};

const permissoesLista: {
  chave: keyof PermissoesUsuario;
  titulo: string;
  descricao: string;
  grupo: string;
}[] = [
  {
    chave: "dashboard",
    titulo: "Dashboard",
    descricao: "Acessar indicadores e visão geral.",
    grupo: "Módulos",
  },
  {
    chave: "agenda",
    titulo: "Agenda",
    descricao: "Visualizar e gerenciar agenda.",
    grupo: "Módulos",
  },
  {
    chave: "servicos",
    titulo: "Serviços",
    descricao: "Cadastrar e editar serviços.",
    grupo: "Módulos",
  },
  {
    chave: "profissionais",
    titulo: "Profissionais",
    descricao: "Gerenciar equipe e horários.",
    grupo: "Módulos",
  },
  {
    chave: "promocoes",
    titulo: "Promoções",
    descricao: "Criar campanhas e ações.",
    grupo: "Módulos",
  },
  {
    chave: "clientes",
    titulo: "Clientes",
    descricao: "Acessar cadastro e histórico dos clientes.",
    grupo: "Módulos",
  },
  {
    chave: "configuracoes",
    titulo: "Configurações",
    descricao: "Acessar tela de configurações.",
    grupo: "Módulos",
  },
  {
    chave: "financeiro",
    titulo: "Acessar financeiro",
    descricao: "Abrir o menu financeiro e visualizar o módulo.",
    grupo: "Financeiro",
  },
  {
    chave: "visualizarFinanceiro",
    titulo: "Visualizar valores",
    descricao: "Ver faturamento, pagamentos, caixa e repasses.",
    grupo: "Financeiro",
  },
  {
    chave: "comissoes",
    titulo: "Comissões",
    descricao: "Acessar módulo de comissões.",
    grupo: "Financeiro",
  },
  {
    chave: "fecharComissao",
    titulo: "Fechar comissão",
    descricao: "Realizar fechamento de comissões.",
    grupo: "Financeiro",
  },
  {
    chave: "operarCaixa",
    titulo: "Operar caixa",
    descricao: "Executar ações operacionais no caixa diário.",
    grupo: "Caixa",
  },
  {
    chave: "abrirCaixa",
    titulo: "Abrir caixa",
    descricao: "Abrir caixa diário e informar saldo inicial.",
    grupo: "Caixa",
  },
  {
    chave: "registrarMovimentacaoCaixa",
    titulo: "Registrar movimentações",
    descricao: "Registrar reforços, sangrias, saídas e entradas manuais.",
    grupo: "Caixa",
  },
  {
    chave: "fecharCaixa",
    titulo: "Fechar caixa",
    descricao: "Fechar caixa diário por modalidade e registrar divergências.",
    grupo: "Caixa",
  },
  {
    chave: "verCreditosDebitosClientes",
    titulo: "Ver créditos/débitos",
    descricao: "Visualizar conta financeira dos clientes.",
    grupo: "Clientes",
  },
  {
    chave: "lancarCreditoCliente",
    titulo: "Lançar crédito",
    descricao: "Registrar crédito manual para cliente.",
    grupo: "Clientes",
  },
  {
    chave: "lancarDebitoCliente",
    titulo: "Lançar débito",
    descricao: "Registrar débito manual para cliente.",
    grupo: "Clientes",
  },
  {
    chave: "abaterDebitoCliente",
    titulo: "Abater débito",
    descricao: "Usar pagamentos ou créditos para baixar débitos do cliente.",
    grupo: "Clientes",
  },
  {
    chave: "finalizarAtendimento",
    titulo: "Finalizar atendimento",
    descricao: "Confirmar presença e concluir atendimento.",
    grupo: "Atendimentos",
  },
  {
    chave: "registrarPagamentoAtendimento",
    titulo: "Registrar pagamento",
    descricao: "Informar pagamentos no fechamento do atendimento.",
    grupo: "Atendimentos",
  },
  {
    chave: "lancarDebitoNoFechamento",
    titulo: "Débito no fechamento",
    descricao: "Transformar saldo pendente em débito do cliente.",
    grupo: "Atendimentos",
  },
  {
    chave: "lancarCreditoNoFechamento",
    titulo: "Crédito no fechamento",
    descricao: "Gerar crédito para o cliente no fechamento do atendimento.",
    grupo: "Atendimentos",
  },
  {
    chave: "reagendarAtendimento",
    titulo: "Reagendar atendimento",
    descricao: "Alterar data e horário.",
    grupo: "Atendimentos",
  },
  {
    chave: "cancelarAtendimento",
    titulo: "Cancelar atendimento",
    descricao: "Cancelar com motivo registrado.",
    grupo: "Atendimentos",
  },
  {
    chave: "relatorios",
    titulo: "Acessar relatórios",
    descricao: "Abrir relatórios gerenciais e financeiros.",
    grupo: "Relatórios",
  },
  {
    chave: "exportarRelatorios",
    titulo: "Exportar relatórios",
    descricao: "Baixar relatórios em PDF, Excel ou formatos futuros.",
    grupo: "Relatórios",
  },
  {
    chave: "gerenciarUsuarios",
    titulo: "Gerenciar usuários",
    descricao: "Criar, editar e inativar usuários.",
    grupo: "Configurações",
  },
  {
    chave: "alterarPermissoes",
    titulo: "Alterar permissões",
    descricao: "Editar permissões de outros usuários.",
    grupo: "Configurações",
  },
  {
    chave: "alterarDadosEmpresa",
    titulo: "Alterar dados da empresa",
    descricao: "Editar nome, contato, endereço e identidade pública.",
    grupo: "Configurações",
  },
  {
    chave: "alterarTemaWhiteLabel",
    titulo: "Alterar tema white-label",
    descricao: "Editar cores, logo e aparência da empresa.",
    grupo: "Configurações",
  },
];

export default function ConfiguracoesPage() {
  const router = useRouter();

  const [empresaId, setEmpresaId] = useState("");
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
  const [modalPermissoesAberto, setModalPermissoesAberto] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mostrarDadosEmpresa, setMostrarDadosEmpresa] = useState(false);

  const [dadosEmpresa, setDadosEmpresa] = useState({
    nome: "",
    slug: "",
    endereco: {
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
      complemento: "",
    },
    telefone: "",
    responsavel: "",
    logoUrl: "",
    instagramUrl: "",
    corPrimaria: TEMA_MARCAE.corPrimaria,
    corSecundaria: TEMA_MARCAE.corSecundaria,
    corSidebar: TEMA_MARCAE.corSidebar,
    mercadoPagoAtivo: false,
    mercadoPagoAccessToken: "",
    mercadoPagoPublicKey: "",
    mercadoPagoModo: "sandbox",
    solicitouIntegracaoMp: false,
  });

  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [usuarioEditandoId, setUsuarioEditandoId] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [loginUsuario, setLoginUsuario] = useState("");
  const [whatsappUsuario, setWhatsappUsuario] = useState("");
  const [senhaUsuario, setSenhaUsuario] = useState("");
  const [perfilUsuario, setPerfilUsuario] = useState("usuario");
  const [ativoUsuario, setAtivoUsuario] = useState(true);
  const [permissoes, setPermissoes] =
    useState<PermissoesUsuario>(permissoesPadrao);
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);

  const totalPermissoesAtivas = useMemo(() => {
    return Object.values(permissoes).filter(Boolean).length;
  }, [permissoes]);

  useEffect(() => {
    function atualizarMobile() {
      setIsMobile(window.innerWidth <= 760);
    }

    atualizarMobile();
    window.addEventListener("resize", atualizarMobile);

    return () => window.removeEventListener("resize", atualizarMobile);
  }, []);

  useEffect(() => {
    const empresaIdLocal = localStorage.getItem("empresaId");
    const empresaLogadaRaw = localStorage.getItem("empresaLogada");

    let empresaLogada = null;

    try {
      empresaLogada = empresaLogadaRaw ? JSON.parse(empresaLogadaRaw) : null;
    } catch {
      empresaLogada = null;
    }

    const id = empresaIdLocal || empresaLogada?.id || "";
    setEmpresaId(id);

    if (empresaLogada) {
      preencherEmpresa(empresaLogada);
    }
  }, []);

  useEffect(() => {
    if (empresaId) {
      carregarEmpresa();
      carregarUsuarios();
    }
  }, [empresaId]);

  useEffect(() => {
    aplicarTemaNoDocumento({
      corPrimaria: dadosEmpresa.corPrimaria,
      corSecundaria: dadosEmpresa.corSecundaria,
      corSidebar: dadosEmpresa.corSidebar,
    });
  }, [
    dadosEmpresa.corPrimaria,
    dadosEmpresa.corSecundaria,
    dadosEmpresa.corSidebar,
  ]);

  function normalizarEndereco(endereco: any) {
    if (typeof endereco === "string") {
      try {
        return JSON.parse(endereco);
      } catch {
        return {
          rua: "",
          numero: "",
          cidade: "",
          estado: "",
          complemento: "",
        };
      }
    }

    const linkAgendamento = dadosEmpresa.slug
      ? montarLinkAgendamento(dadosEmpresa.slug)
      : "";

    const qrCodeUrl = linkAgendamento
      ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
          linkAgendamento,
        )}`
      : "";

    return (
      endereco || {
        rua: "",
        numero: "",
        cidade: "",
        estado: "",
        complemento: "",
      }
    );
  }

  function preencherEmpresa(empresa: any) {
    setDadosEmpresa({
      nome: empresa.nome || "",
      slug: empresa.slug || "",
      endereco: normalizarEndereco(empresa.endereco),
      telefone: empresa.telefone || empresa.whatsapp || "",
      responsavel: empresa.responsavel || "",
      logoUrl: empresa.logoUrl || "",
      instagramUrl: empresa.instagramUrl || "",
      corPrimaria: empresa.corPrimaria || TEMA_MARCAE.corPrimaria,
      corSecundaria: empresa.corSecundaria || TEMA_MARCAE.corSecundaria,
      corSidebar: empresa.corSidebar || TEMA_MARCAE.corSidebar,
      mercadoPagoAtivo: empresa.mercadoPagoAtivo || false,
      mercadoPagoAccessToken: empresa.mercadoPagoAccessToken || "",
      mercadoPagoPublicKey: empresa.mercadoPagoPublicKey || "",
      mercadoPagoModo: empresa.mercadoPagoModo || "sandbox",
      solicitouIntegracaoMp: empresa.solicitouIntegracaoMp || false,
    });
  }

  async function carregarEmpresa() {
    try {
      const res = await fetch(`/api/admin/empresas/${empresaId}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success && data.empresa) {
        preencherEmpresa(data.empresa);

        localStorage.setItem("empresaLogada", JSON.stringify(data.empresa));
        aplicarTemaNoDocumento(data.empresa);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function carregarUsuarios() {
    try {
      const res = await fetch(`/api/admin/empresas/${empresaId}/usuarios`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setUsuarios(data.usuarios || []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function alterarPermissao(chave: keyof PermissoesUsuario) {
    setPermissoes((atual) => ({
      ...atual,
      [chave]: !atual[chave],
    }));
  }

  function limparFormularioUsuario() {
    setUsuarioEditandoId("");
    setNomeUsuario("");
    setLoginUsuario("");
    setWhatsappUsuario("");
    setSenhaUsuario("");
    setPerfilUsuario("usuario");
    setAtivoUsuario(true);
    setPermissoes(permissoesPadrao);
    setModalPermissoesAberto(false);
  }

  function editarUsuario(usuario: UsuarioSistema) {
    setMostrarUsuarios(true);
    setModalPermissoesAberto(true);
    setUsuarioEditandoId(usuario.id);
    setNomeUsuario(usuario.nome || "");
    setLoginUsuario(usuario.email || "");
    setWhatsappUsuario(usuario.whatsapp || "");
    setSenhaUsuario("");
    setPerfilUsuario(usuario.perfil || "usuario");
    setAtivoUsuario(usuario.ativo !== false);

    setPermissoes({
      ...permissoesPadrao,
      ...(usuario.permissoes || {}),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function restaurarTemaMarcae() {
    const confirmar = window.confirm(
      "Deseja restaurar o tema padrão Marcaê? As cores personalizadas serão substituídas pelo padrão lilás premium.",
    );

    if (!confirmar) return;

    const novoTema = {
      corPrimaria: TEMA_MARCAE.corPrimaria,
      corSecundaria: TEMA_MARCAE.corSecundaria,
      corSidebar: TEMA_MARCAE.corSidebar,
    };

    setDadosEmpresa((atual) => ({
      ...atual,
      ...novoTema,
    }));

    aplicarTemaNoDocumento(novoTema);
  }

  function selecionarLogo(arquivo?: File | null) {
    if (!arquivo) return;

    const reader = new FileReader();

    reader.onload = () => {
      setDadosEmpresa((atual) => ({
        ...atual,
        logoUrl: String(reader.result || ""),
      }));
    };

    reader.readAsDataURL(arquivo);
  }

  async function salvarDadosEmpresa() {
    try {
      setSalvandoEmpresa(true);

      const res = await fetch(`/api/admin/empresas/${empresaId}/dados`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: dadosEmpresa.nome,
          endereco: dadosEmpresa.endereco,
          telefone: dadosEmpresa.telefone,
          responsavel: dadosEmpresa.responsavel,
          logoUrl: dadosEmpresa.logoUrl,
          instagramUrl: dadosEmpresa.instagramUrl,
          corPrimaria: dadosEmpresa.corPrimaria,
          corSecundaria: dadosEmpresa.corSecundaria,
          corSidebar: dadosEmpresa.corSidebar,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Erro ao salvar.");
        return;
      }

      localStorage.setItem("empresaLogada", JSON.stringify(data.empresa));
      aplicarTemaNoDocumento(data.empresa);

      alert("Dados atualizados com sucesso!");
    } catch (error) {
      alert("Erro ao salvar.");
    } finally {
      setSalvandoEmpresa(false);
    }
  }

  async function salvarUsuario() {
    if (!whatsappUsuario.trim()) {
      alert(
        "Informe o WhatsApp do usuário. Ele será usado para recuperação de senha.",
      );
      return;
    }

    try {
      setSalvandoUsuario(true);

      const payload: any = {
        id: usuarioEditandoId,
        nome: nomeUsuario,
        email: loginUsuario,
        whatsapp: whatsappUsuario,
        perfil: perfilUsuario,
        ativo: ativoUsuario,
        permissoes: perfilUsuario === "admin" ? null : permissoes,
      };

      if (senhaUsuario) {
        payload.senha = senhaUsuario;
      }

      const res = await fetch(`/api/admin/empresas/${empresaId}/usuarios`, {
        method: usuarioEditandoId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Erro ao salvar usuário.");
        return;
      }

      alert(usuarioEditandoId ? "Usuário atualizado!" : "Usuário criado!");

      limparFormularioUsuario();
      carregarUsuarios();
    } catch (error) {
      alert("Erro ao salvar.");
    } finally {
      setSalvandoUsuario(false);
    }
  }

  const linkAgendamento = dadosEmpresa.slug
    ? montarLinkAgendamento(dadosEmpresa.slug)
    : "";

  const qrCodeUrl = linkAgendamento
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        linkAgendamento,
      )}`
    : "";

  return (
    <PremiumLayout
      empresa={dadosEmpresa}
      usuario={{
        nome: "Administrador",
      }}
    >
      <div className="marcae-config-mobile-ajuste-usuarios" style={page}>
        <style>{`
          @keyframes marcaeFadeUp {
            from {
              opacity: 0;
              transform: translateY(14px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .marcae-premium-card {
            animation: marcaeFadeUp .35s ease both;
          }

          .marcae-premium-input::placeholder {
            color: rgba(203, 213, 225, .55);
          }

          .marcae-premium-input:focus {
            border-color: ${dadosEmpresa.corPrimaria};
            box-shadow: 0 0 0 4px ${dadosEmpresa.corPrimaria}26;
          }

          .marcae-premium-button:hover {
            transform: translateY(-1px);
            filter: brightness(1.06);
          }

          .marcae-ghost-button:hover {
            background: rgba(255,255,255,.12);
          }


          @media (max-width: 760px) {
            .marcae-config-mobile-ajuste-usuarios {
              gap: 12px !important;
              padding-bottom: 118px !important;
              overflow-x: hidden !important;
            }

            .marcae-config-mobile-ajuste-usuarios button,
            .marcae-config-mobile-ajuste-usuarios input,
            .marcae-config-mobile-ajuste-usuarios select,
            .marcae-config-mobile-ajuste-usuarios textarea {
              max-width: 100% !important;
            }

            .marcae-config-mobile-ajuste-usuarios section,
            .marcae-config-mobile-ajuste-usuarios .marcae-premium-card {
              max-width: 100% !important;
              overflow: hidden !important;
            }
          }

          @media (max-width: 900px) {
            .marcae-config-mobile-ajuste-usuarios {
              width: 100%;
            }
          }

          @media (max-width: 760px) {
            .config-hero-preview-mobile {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              height: 58px !important;
              padding: 8px !important;
            }

            .config-hero-preview-mobile > div:first-child {
              display: none !important;
            }

            .config-hero-preview-mobile > div:nth-child(2) {
              width: 100% !important;
              padding: 0 !important;
              justify-content: center !important;
            }

            .config-hero-preview-mobile .config-preview-lines-mobile {
              display: none !important;
            }


            .config-link-publico-mobile {
              grid-template-columns: 1fr !important;
              gap: 12px !important;
            }

            .config-link-publico-mobile > div:last-child {
              width: 100% !important;
            }

            .config-link-linha-mobile {
              grid-template-columns: 1fr !important;
            }

            .config-link-acoes-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 8px !important;
            }

            .config-link-acoes-mobile button,
            .config-link-acoes-mobile a {
              width: 100% !important;
              justify-content: center !important;
              text-align: center !important;
            }

            .config-qr-mobile img {
              width: 132px !important;
              height: 132px !important;
            }
          }
        `}</style>

        <div
          className="config-hero-mobile"
          style={{
            ...hero,
            ...(isMobile ? heroMobile : {}),
            background: `
              radial-gradient(circle at top left, ${dadosEmpresa.corPrimaria}99, transparent 34%),
              radial-gradient(circle at top right, ${dadosEmpresa.corSecundaria}66, transparent 34%),
              linear-gradient(135deg, rgba(15,23,42,.96), rgba(2,6,23,.98) 72%)
            `,
          }}
        >
          <div
            className="config-hero-content-mobile"
            style={{ ...heroContent, ...(isMobile ? heroContentMobile : {}) }}
          >
            <div style={eyebrow}>Painel administrativo</div>

            <h1 style={{ ...title, ...(isMobile ? titleMobile : {}) }}>
              Configurações
            </h1>

            <p style={{ ...subtitle, ...(isMobile ? subtitleMobile : {}) }}>
              Ajuste identidade visual, dados da empresa, recebimento online,
              usuários e permissões em uma tela única.
            </p>

            <div style={{ ...heroChips, ...(isMobile ? heroChipsMobile : {}) }}>
              <span style={heroChip}>White label ativo</span>
              <span style={heroChip}>Multiempresa</span>
              <span style={heroChip}>Permissões granulares</span>
            </div>
          </div>

          <div
            className="config-hero-preview-mobile"
            style={{ ...heroPreview, ...(isMobile ? heroPreviewMobile : {}) }}
          >
            <div
              style={{
                ...previewSidebar,
                background: dadosEmpresa.corSidebar,
              }}
            />

            <div style={previewMain}>
              <div
                style={{
                  ...previewLogo,
                  background: `linear-gradient(135deg, ${dadosEmpresa.corPrimaria}, ${dadosEmpresa.corSecundaria})`,
                }}
              >
                {dadosEmpresa.logoUrl ? (
                  <img
                    src={dadosEmpresa.logoUrl}
                    alt="Logo"
                    style={previewLogoImg}
                  />
                ) : (
                  dadosEmpresa.nome?.charAt(0)?.toUpperCase() || "M"
                )}
              </div>

              <div className="config-preview-lines-mobile" style={previewLines}>
                <div style={previewLineLarge} />
                <div style={previewLineSmall} />
              </div>
            </div>
          </div>

          {!isMobile && (
            <button
              onClick={() => router.push("/admin")}
              style={backButton}
              className="marcae-ghost-button config-hero-back-mobile"
            >
              ← Voltar para o painel
            </button>
          )}
        </div>

        <div style={topStatsGrid}>
          <InfoStat
            titulo="Empresa"
            valor={dadosEmpresa.nome || "Não informado"}
            detalhe="Dados públicos do agendador"
          />
          <InfoStat
            titulo="Recebimento"
            valor={dadosEmpresa.mercadoPagoAtivo ? "Ativo" : "Pendente"}
            detalhe="Mercado Pago"
          />
          <InfoStat
            titulo="Usuários"
            valor={`${usuarios.length}`}
            detalhe="Cadastrados no sistema"
          />
        </div>

        <section style={card} className="marcae-premium-card">
          <div style={sectionHeaderRow}>
            <div>
              <span style={badge}>White Label</span>
              <h2 style={cardTitle}>Aparência da empresa</h2>
              <p style={cardDescription}>
                Personalize as cores que aparecem no menu lateral, dashboard,
                agendador público e identidade visual da empresa.
              </p>
            </div>

            <button
              type="button"
              onClick={restaurarTemaMarcae}
              style={secondaryButton}
              className="marcae-ghost-button"
            >
              Restaurar tema Marcaê
            </button>
          </div>

          <div style={colorGrid}>
            <ColorField
              label="Cor principal"
              description="Usada em botões, destaques e ações."
              value={dadosEmpresa.corPrimaria}
              onChange={(value: string) =>
                setDadosEmpresa({
                  ...dadosEmpresa,
                  corPrimaria: value,
                })
              }
            />

            <ColorField
              label="Cor secundária"
              description="Usada em gradientes e detalhes visuais."
              value={dadosEmpresa.corSecundaria}
              onChange={(value: string) =>
                setDadosEmpresa({
                  ...dadosEmpresa,
                  corSecundaria: value,
                })
              }
            />

            <ColorField
              label="Cor menu lateral"
              description="Base visual do painel administrativo."
              value={dadosEmpresa.corSidebar}
              onChange={(value: string) =>
                setDadosEmpresa({
                  ...dadosEmpresa,
                  corSidebar: value,
                })
              }
            />
          </div>
        </section>

        <section style={card} className="marcae-premium-card">
          <div style={sectionHeaderRow}>
            <div>
              <span style={badge}>Empresa</span>
              <h2 style={cardTitle}>Dados da empresa</h2>
              <p style={cardDescription}>
                Essas informações ficam recolhidas para reduzir o scroll no
                mobile. Abra apenas quando precisar consultar ou editar.
              </p>
            </div>

            <div style={sectionActionsRow}>
              <button
                type="button"
                onClick={() => setMostrarDadosEmpresa(!mostrarDadosEmpresa)}
                style={secondaryButton}
                className="marcae-ghost-button"
              >
                {mostrarDadosEmpresa
                  ? "Ocultar informações"
                  : "Visualizar informações"}
              </button>

              {mostrarDadosEmpresa && (
                <button
                  onClick={salvarDadosEmpresa}
                  style={primaryButtonInline}
                  className="marcae-premium-button"
                >
                  {salvandoEmpresa ? "Salvando..." : "Salvar empresa"}
                </button>
              )}
            </div>
          </div>

          {!mostrarDadosEmpresa ? (
            <div style={empresaResumoCompacto}>
              <div style={empresaResumoLogoBox}>
                {dadosEmpresa.logoUrl ? (
                  <img
                    src={dadosEmpresa.logoUrl}
                    alt="Logo"
                    style={empresaResumoLogo}
                  />
                ) : (
                  <div
                    style={{
                      ...empresaResumoLogoVazio,
                      background: `linear-gradient(135deg, ${dadosEmpresa.corPrimaria}, ${dadosEmpresa.corSecundaria})`,
                    }}
                  >
                    {dadosEmpresa.nome?.charAt(0)?.toUpperCase() || "M"}
                  </div>
                )}
              </div>

              <div style={empresaResumoInfo}>
                <strong style={empresaResumoNome}>
                  {dadosEmpresa.nome || "Empresa não informada"}
                </strong>
                <span style={empresaResumoLinha}>
                  WhatsApp: {dadosEmpresa.telefone || "Não informado"}
                </span>
                <span style={empresaResumoLinha}>
                  {[
                    dadosEmpresa.endereco?.rua,
                    dadosEmpresa.endereco?.numero,
                    dadosEmpresa.endereco?.bairro,
                    dadosEmpresa.endereco?.cidade,
                    dadosEmpresa.endereco?.estado,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Endereço não informado"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMostrarDadosEmpresa(true)}
                style={empresaResumoButton}
                className="marcae-ghost-button"
              >
                Ver e editar
              </button>
            </div>
          ) : (
            <>
              <div style={empresaGrid}>
                <TextField
                  label="Nome da empresa"
                  value={dadosEmpresa.nome}
                  placeholder="Ex: Studio Bella"
                  onChange={(value: string) =>
                    setDadosEmpresa({
                      ...dadosEmpresa,
                      nome: value,
                    })
                  }
                />

                <TextField
                  label="WhatsApp"
                  value={dadosEmpresa.telefone}
                  placeholder="Ex: 75999999999"
                  onChange={(value: string) =>
                    setDadosEmpresa({
                      ...dadosEmpresa,
                      telefone: value,
                    })
                  }
                />

                <TextField
                  label="Instagram"
                  value={dadosEmpresa.instagramUrl}
                  placeholder="https://instagram.com/suaempresa"
                  onChange={(value: string) =>
                    setDadosEmpresa({
                      ...dadosEmpresa,
                      instagramUrl: value,
                    })
                  }
                />

                <TextField
                  label="Responsável"
                  value={dadosEmpresa.responsavel}
                  placeholder="Nome do responsável"
                  onChange={(value: string) =>
                    setDadosEmpresa({
                      ...dadosEmpresa,
                      responsavel: value,
                    })
                  }
                />

                <TextField
                  label="Rua"
                  value={dadosEmpresa.endereco?.rua || ""}
                  placeholder="Rua / Avenida"
                  wide
                  onChange={(value: string) =>
                    setDadosEmpresa({
                      ...dadosEmpresa,
                      endereco: {
                        ...dadosEmpresa.endereco,
                        rua: value,
                      },
                    })
                  }
                />

                <TextField
                  label="Número"
                  value={dadosEmpresa.endereco?.numero || ""}
                  placeholder="123"
                  onChange={(value: string) =>
                    setDadosEmpresa({
                      ...dadosEmpresa,
                      endereco: {
                        ...dadosEmpresa.endereco,
                        numero: value,
                      },
                    })
                  }
                />

                <TextField
                  label="Bairro"
                  value={dadosEmpresa.endereco?.bairro || ""}
                  placeholder="Bairro"
                  onChange={(value: string) =>
                    setDadosEmpresa({
                      ...dadosEmpresa,
                      endereco: {
                        ...dadosEmpresa.endereco,
                        bairro: value,
                      },
                    })
                  }
                />

                <TextField
                  label="Cidade"
                  value={dadosEmpresa.endereco?.cidade || ""}
                  placeholder="Cidade"
                  onChange={(value: string) =>
                    setDadosEmpresa({
                      ...dadosEmpresa,
                      endereco: {
                        ...dadosEmpresa.endereco,
                        cidade: value,
                      },
                    })
                  }
                />

                <TextField
                  label="Estado"
                  value={dadosEmpresa.endereco?.estado || ""}
                  placeholder="UF"
                  onChange={(value: string) =>
                    setDadosEmpresa({
                      ...dadosEmpresa,
                      endereco: {
                        ...dadosEmpresa.endereco,
                        estado: value,
                      },
                    })
                  }
                />

                <TextField
                  label="CEP"
                  value={dadosEmpresa.endereco?.cep || ""}
                  placeholder="00000-000"
                  onChange={(value: string) =>
                    setDadosEmpresa({
                      ...dadosEmpresa,
                      endereco: {
                        ...dadosEmpresa.endereco,
                        cep: value,
                      },
                    })
                  }
                />

                <TextField
                  label="Complemento"
                  value={dadosEmpresa.endereco?.complemento || ""}
                  placeholder="Sala, ponto de referência, bairro..."
                  wide
                  onChange={(value: string) =>
                    setDadosEmpresa({
                      ...dadosEmpresa,
                      endereco: {
                        ...dadosEmpresa.endereco,
                        complemento: value,
                      },
                    })
                  }
                />

                <div style={{ ...field, gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Logo da empresa</label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => selecionarLogo(e.target.files?.[0])}
                    style={input}
                    className="marcae-premium-input"
                  />
                </div>
              </div>

              <div style={logoPreviewBox}>
                {dadosEmpresa.logoUrl ? (
                  <img
                    src={dadosEmpresa.logoUrl}
                    alt="logo"
                    style={logoPreview}
                  />
                ) : (
                  <div
                    style={{
                      ...logoVazio,
                      background: `linear-gradient(135deg, ${dadosEmpresa.corPrimaria}, ${dadosEmpresa.corSecundaria})`,
                    }}
                  >
                    {dadosEmpresa.nome?.charAt(0)?.toUpperCase() || "M"}
                  </div>
                )}

                <div>
                  <strong style={strongText}>Preview da identidade</strong>
                  <p style={cardDescription}>
                    Essa logo será usada no agendador público, comprovantes e
                    pontos visuais do sistema.
                  </p>
                </div>
              </div>

              <button
                onClick={salvarDadosEmpresa}
                style={primaryButton}
                className="marcae-premium-button"
              >
                {salvandoEmpresa
                  ? "Salvando..."
                  : "Salvar alterações da empresa"}
              </button>
            </>
          )}
        </section>

        <section style={card} className="marcae-premium-card">
          <div style={sectionHeaderRow}>
            <div>
              <span style={badge}>Agendador público</span>
              <h2 style={cardTitle}>Link público de agendamento</h2>
              <p style={cardDescription}>
                Compartilhe este link com clientes para que eles escolham
                serviço, profissional, data e horário pelo agendador público da
                empresa.
              </p>
            </div>
          </div>

          <div
            className="config-link-publico-mobile"
            style={linkAgendamentoBox}
          >
            <div style={linkAgendamentoInfo}>
              <div
                className="config-link-linha-mobile"
                style={linkAgendamentoLine}
              >
                <input
                  readOnly
                  value={
                    linkAgendamento ||
                    "Configure o slug da empresa no painel master"
                  }
                  style={input}
                  className="marcae-premium-input"
                />

                <button
                  type="button"
                  disabled={!linkAgendamento}
                  onClick={async () => {
                    if (!linkAgendamento) return;

                    try {
                      await navigator.clipboard.writeText(linkAgendamento);
                      alert("Link do agendador copiado!");
                    } catch {
                      alert("Não foi possível copiar o link automaticamente.");
                    }
                  }}
                  style={{
                    ...secondaryButton,
                    opacity: linkAgendamento ? 1 : 0.55,
                    cursor: linkAgendamento ? "pointer" : "not-allowed",
                  }}
                  className="marcae-ghost-button"
                >
                  Copiar link
                </button>
              </div>

              <div
                className="config-link-acoes-mobile"
                style={linkAgendamentoAcoes}
              >
                <button
                  type="button"
                  disabled={!linkAgendamento}
                  onClick={() => {
                    if (!linkAgendamento) return;
                    window.open(
                      linkAgendamento,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }}
                  style={{
                    ...whatsappButton,
                    opacity: linkAgendamento ? 1 : 0.55,
                    cursor: linkAgendamento ? "pointer" : "not-allowed",
                  }}
                  className="marcae-premium-button"
                >
                  Abrir agendador
                </button>

                <button
                  type="button"
                  disabled={!linkAgendamento}
                  onClick={() => {
                    if (!linkAgendamento) return;

                    const mensagem = `Olá! 😊 Você pode agendar seu horário pelo link: ${linkAgendamento}`;
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(mensagem)}`,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }}
                  style={{
                    ...secondaryButton,
                    opacity: linkAgendamento ? 1 : 0.55,
                    cursor: linkAgendamento ? "pointer" : "not-allowed",
                  }}
                  className="marcae-ghost-button"
                >
                  Compartilhar no WhatsApp
                </button>
              </div>

              <div style={integracaoStatusCard}>
                <div
                  style={{
                    ...statusDot,
                    background: linkAgendamento ? "#10b981" : "#f59e0b",
                  }}
                />

                <div>
                  <strong style={strongText}>
                    {linkAgendamento
                      ? "Link disponível"
                      : "Link ainda não disponível"}
                  </strong>

                  <p style={cardDescription}>
                    {linkAgendamento
                      ? "Esse é o endereço público que pode ir na bio do Instagram, WhatsApp, QR Code e materiais da empresa."
                      : "O link aparece aqui quando a empresa possui slug configurado no painel master."}
                  </p>
                </div>
              </div>
            </div>

            <div className="config-qr-mobile" style={qrCard}>
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code do agendador público"
                  style={qrImage}
                />
              ) : (
                <div style={logoVazio}>QR</div>
              )}

              <div>
                <strong style={strongText}>QR Code público</strong>
                <p style={cardDescription}>
                  Ideal para recepção, balcão, cartão digital e divulgação
                  rápida.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section style={card} className="marcae-premium-card">
          <div style={sectionHeaderRow}>
            <div>
              <span style={badge}>Mercado Pago</span>

              <h2 style={cardTitle}>Recebimento online</h2>

              <p style={cardDescription}>
                Configuração do recebimento online da empresa via Mercado Pago.
                Isso será utilizado para pré-pagamentos, assinaturas e
                automações financeiras.
              </p>
            </div>
          </div>
          <div style={integracaoStatusCard}>
            <div
              style={{
                ...statusDot,
                background: dadosEmpresa.mercadoPagoAtivo
                  ? "#10b981"
                  : "#f59e0b",
              }}
            />

            <div>
              <strong style={strongText}>
                {dadosEmpresa.mercadoPagoAtivo
                  ? "Integração ativa"
                  : "Integração pendente"}
              </strong>

              <p style={cardDescription}>
                {dadosEmpresa.mercadoPagoAtivo
                  ? "Seu sistema já está pronto para receber pagamentos online."
                  : (dadosEmpresa as any).solicitouIntegracaoMp
                    ? "Solicitação enviada. Aguarde a configuração pela equipe Marcaê."
                    : "Solicite sua integração Mercado Pago para liberar pagamentos automáticos."}
              </p>
            </div>
          </div>

          <div style={mercadoPagoGrid}>
            {!dadosEmpresa.mercadoPagoAtivo &&
              !(dadosEmpresa as any).solicitouIntegracaoMp && (
                <div style={solicitacaoMpCard}>
                  <div>
                    <strong style={strongText}>
                      Solicitar integração Mercado Pago
                    </strong>

                    <p style={cardDescription}>
                      A integração será configurada pela equipe Marcaê para
                      garantir segurança e funcionamento correto dos pagamentos
                      online.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/admin/empresas/${empresaId}/dados`,
                          {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              nome: dadosEmpresa.nome,
                              endereco: dadosEmpresa.endereco,
                              telefone: dadosEmpresa.telefone,
                              responsavel: dadosEmpresa.responsavel,
                              logoUrl: dadosEmpresa.logoUrl,
                              instagramUrl: dadosEmpresa.instagramUrl,
                              corPrimaria: dadosEmpresa.corPrimaria,
                              corSecundaria: dadosEmpresa.corSecundaria,
                              corSidebar: dadosEmpresa.corSidebar,
                              solicitouIntegracaoMp: true,
                            }),
                          },
                        );

                        const data = await res.json();

                        if (!data.success) {
                          alert("Erro ao solicitar integração.");
                          return;
                        }

                        setDadosEmpresa((atual: any) => ({
                          ...atual,
                          solicitouIntegracaoMp: true,
                        }));

                        alert("Solicitação enviada com sucesso!");
                      } catch (error) {
                        alert("Erro ao solicitar integração.");
                      }
                    }}
                    style={primaryButton}
                    className="marcae-premium-button"
                  >
                    Solicitar integração
                  </button>
                </div>
              )}

            {!dadosEmpresa.mercadoPagoAtivo &&
              (dadosEmpresa as any).solicitouIntegracaoMp && (
                <div style={integracaoSolicitadaCard}>
                  <strong style={strongText}>Solicitação enviada</strong>

                  <p style={cardDescription}>
                    A equipe Marcaê já recebeu a solicitação de integração.
                    Aguarde a configuração do Mercado Pago no painel master.
                  </p>
                </div>
              )}

            {dadosEmpresa.mercadoPagoAtivo && (
              <>
                <div style={integracaoAtivaCard}>
                  <strong style={strongText}>
                    ✅ Recebimento online disponível
                  </strong>

                  <p style={cardDescription}>
                    Sua integração Mercado Pago já foi configurada. Agora você
                    já pode receber pré-pagamentos pelo agendador público.
                  </p>

                  <p style={{ ...cardDescription, marginTop: 10 }}>
                    Configure agora quais serviços terão pré-pagamento
                    obrigatório no menu Serviços.
                  </p>

                  <div
                    style={{
                      marginTop: 14,
                      display: "inline-flex",
                      padding: "8px 12px",
                      borderRadius: 999,
                      background:
                        dadosEmpresa.mercadoPagoModo === "producao"
                          ? "rgba(16,185,129,.16)"
                          : "rgba(245,158,11,.16)",
                      color:
                        dadosEmpresa.mercadoPagoModo === "producao"
                          ? "#6ee7b7"
                          : "#fcd34d",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    Ambiente:{" "}
                    {dadosEmpresa.mercadoPagoModo === "producao"
                      ? "Produção"
                      : "Sandbox"}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section style={card} className="marcae-premium-card">
          <div style={sectionHeaderRow}>
            <div>
              <span style={badge}>Usuários</span>

              <h2 style={cardTitle}>Usuários e permissões</h2>

              <p style={cardDescription}>
                Controle completo de acessos, permissões e segurança do sistema.
              </p>
            </div>

            <button
              onClick={() => setMostrarUsuarios(!mostrarUsuarios)}
              style={primaryButtonInline}
              className="marcae-premium-button"
            >
              {mostrarUsuarios ? "Fechar gerenciamento" : "Gerenciar usuários"}
            </button>
          </div>

          {!mostrarUsuarios ? (
            <div style={usuariosResumoBox}>
              <div style={usuariosResumoItem}>
                <strong style={usuariosResumoNumero}>{usuarios.length}</strong>
                <span style={usuariosResumoTexto}>usuários cadastrados</span>
              </div>

              <div style={usuariosResumoDivider} />

              <div style={usuariosResumoItem}>
                <strong style={usuariosResumoNumero}>
                  {usuarios.filter((u) => u.ativo !== false).length}
                </strong>
                <span style={usuariosResumoTexto}>usuários ativos</span>
              </div>

              <div style={usuariosResumoDivider} />

              <div style={usuariosResumoItem}>
                <strong style={usuariosResumoNumero}>
                  {usuarios.filter((u) => u.perfil === "admin").length}
                </strong>
                <span style={usuariosResumoTexto}>administradores</span>
              </div>
            </div>
          ) : (
            <div style={usuarioLayoutGrid}>
              <div style={usuarioFormCard}>
                <div style={usuarioFormHeader}>
                  <div>
                    <h3 style={usuarioFormTitle}>
                      {usuarioEditandoId ? "Editar usuário" : "Novo usuário"}
                    </h3>

                    <p style={cardDescription}>
                      Configure acessos individuais para cada colaborador.
                    </p>
                  </div>

                  {usuarioEditandoId && (
                    <button
                      onClick={limparFormularioUsuario}
                      style={ghostButton}
                      className="marcae-ghost-button"
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>

                <div style={usuarioFormGrid}>
                  <TextField
                    label="Nome"
                    value={nomeUsuario}
                    placeholder="Nome do usuário"
                    onChange={(value: string) => setNomeUsuario(value)}
                  />

                  <TextField
                    label="Login / E-mail"
                    value={loginUsuario}
                    placeholder="email@empresa.com"
                    onChange={(value: string) => setLoginUsuario(value)}
                  />

                  <TextField
                    label="WhatsApp para recuperação"
                    value={whatsappUsuario}
                    placeholder="Ex: 75999999999"
                    onChange={(value: string) => setWhatsappUsuario(value)}
                  />

                  <TextField
                    label="Senha"
                    value={senhaUsuario}
                    placeholder={
                      usuarioEditandoId
                        ? "Preencha apenas se desejar alterar"
                        : "Senha de acesso"
                    }
                    type="password"
                    onChange={(value: string) => setSenhaUsuario(value)}
                  />

                  <div style={field}>
                    <label style={labelStyle}>Perfil</label>

                    <select
                      value={perfilUsuario}
                      onChange={(e) => setPerfilUsuario(e.target.value)}
                      style={input}
                    >
                      <option value="usuario">Usuário comum</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>

                <div style={toggleCard}>
                  <div>
                    <strong style={strongText}>Usuário ativo</strong>

                    <p style={toggleDescription}>
                      Usuários inativos não conseguem acessar o sistema.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAtivoUsuario(!ativoUsuario)}
                    style={{
                      ...toggleButton,
                      justifyContent: ativoUsuario ? "flex-end" : "flex-start",
                      background: ativoUsuario
                        ? dadosEmpresa.corPrimaria
                        : "rgba(255,255,255,.12)",
                    }}
                  >
                    <div style={toggleCircle} />
                  </button>
                </div>

                {perfilUsuario !== "admin" && (
                  <div style={permissaoCompactCard}>
                    <div>
                      <strong style={strongText}>Permissões do usuário</strong>

                      <p style={cardDescription}>
                        {totalPermissoesAtivas} permissões ativas. Clique para
                        configurar em uma tela flutuante.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setModalPermissoesAberto(true)}
                      style={secondaryButton}
                      className="marcae-ghost-button"
                    >
                      Configurar permissões
                    </button>
                  </div>
                )}

                <button
                  onClick={salvarUsuario}
                  style={primaryButton}
                  className="marcae-premium-button"
                >
                  {salvandoUsuario
                    ? "Salvando usuário..."
                    : usuarioEditandoId
                      ? "Atualizar usuário"
                      : "Criar usuário"}
                </button>
              </div>

              <div style={usuariosListCard}>
                <div style={usuariosListHeader}>
                  <div>
                    <h3 style={usuarioFormTitle}>Usuários cadastrados</h3>

                    <p style={cardDescription}>
                      Visualize rapidamente quem possui acesso ao sistema.
                    </p>
                  </div>
                </div>

                <div style={usuariosList}>
                  {usuarios.length === 0 ? (
                    <div style={emptyUsers}>Nenhum usuário cadastrado.</div>
                  ) : (
                    usuarios.map((usuario) => (
                      <div key={usuario.id} style={usuarioItem}>
                        <div style={usuarioAvatar}>
                          {usuario.nome?.charAt(0)?.toUpperCase() || "U"}
                        </div>

                        <div style={usuarioInfo}>
                          <div style={usuarioTextoColuna}>
                            <strong style={usuarioNome}>
                              {usuario.nome || "Usuário"}
                            </strong>

                            <span style={usuarioEmail}>{usuario.email}</span>

                            {usuario.whatsapp && (
                              <span style={usuarioWhatsapp}>
                                WhatsApp: {usuario.whatsapp}
                              </span>
                            )}

                            <div style={usuarioBadges}>
                              <span
                                style={{
                                  ...usuarioBadge,
                                  background:
                                    usuario.perfil === "admin"
                                      ? "rgba(124,58,237,.20)"
                                      : "rgba(59,130,246,.20)",
                                  color:
                                    usuario.perfil === "admin"
                                      ? "#c4b5fd"
                                      : "#93c5fd",
                                }}
                              >
                                {usuario.perfil === "admin"
                                  ? "Administrador"
                                  : "Usuário"}
                              </span>

                              <span
                                style={{
                                  ...usuarioBadge,
                                  background:
                                    usuario.ativo !== false
                                      ? "rgba(16,185,129,.18)"
                                      : "rgba(239,68,68,.18)",
                                  color:
                                    usuario.ativo !== false
                                      ? "#6ee7b7"
                                      : "#fca5a5",
                                }}
                              >
                                {usuario.ativo !== false ? "Ativo" : "Inativo"}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => editarUsuario(usuario)}
                            style={editButton}
                            className="marcae-ghost-button"
                          >
                            ✏️ Editar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {modalPermissoesAberto && perfilUsuario !== "admin" && (
        <div style={modalOverlay}>
          <div style={modalPermissoesCard}>
            <div style={modalHeader}>
              <div>
                <span style={badge}>Permissões</span>

                <h2 style={cardTitle}>
                  {usuarioEditandoId
                    ? "Permissões do usuário"
                    : "Permissões do novo usuário"}
                </h2>

                <p style={cardDescription}>
                  Configure acessos por módulo. As alterações serão aplicadas
                  quando você salvar o usuário.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalPermissoesAberto(false)}
                style={modalCloseButton}
                className="marcae-ghost-button"
              >
                Fechar
              </button>
            </div>

            <div style={modalResumoPermissoes}>
              <strong>{totalPermissoesAtivas}</strong>
              <span>permissões ativas</span>
            </div>

            <div style={modalPermissoesScroll}>
              {[
                "Módulos",
                "Financeiro",
                "Caixa",
                "Clientes",
                "Atendimentos",
                "Relatórios",
                "Configurações",
              ].map((grupo) => (
                <div key={grupo} style={permissionGroup}>
                  <div style={permissionGroupHeader}>
                    <h4 style={permissionGroupTitle}>{grupo}</h4>
                  </div>

                  <div style={permissionsGrid}>
                    {permissoesLista
                      .filter((item) => item.grupo === grupo)
                      .map((item) => (
                        <button
                          key={item.chave}
                          type="button"
                          onClick={() => alterarPermissao(item.chave)}
                          style={{
                            ...permissionCard,
                            borderColor: permissoes[item.chave]
                              ? dadosEmpresa.corPrimaria
                              : "rgba(255,255,255,.08)",
                            background: permissoes[item.chave]
                              ? `${dadosEmpresa.corPrimaria}18`
                              : "rgba(255,255,255,.03)",
                          }}
                        >
                          <div
                            style={{
                              ...permissionCheck,
                              background: permissoes[item.chave]
                                ? dadosEmpresa.corPrimaria
                                : "rgba(255,255,255,.08)",
                            }}
                          >
                            {permissoes[item.chave] ? "✓" : ""}
                          </div>

                          <div>
                            <strong style={permissionTitle}>
                              {item.titulo}
                            </strong>

                            <p style={permissionDescription}>
                              {item.descricao}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={modalFooter}>
              <button
                type="button"
                onClick={() => setPermissoes(permissoesPadrao)}
                style={secondaryButton}
                className="marcae-ghost-button"
              >
                Limpar permissões
              </button>

              <button
                type="button"
                onClick={() => setModalPermissoesAberto(false)}
                style={primaryButtonInline}
                className="marcae-premium-button"
              >
                Concluir permissões
              </button>
            </div>
          </div>
        </div>
      )}
    </PremiumLayout>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
  wide = false,
}: any) {
  return (
    <div style={{ ...field, gridColumn: wide ? "1 / -1" : undefined }}>
      <label style={labelStyle}>{label}</label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={input}
        className="marcae-premium-input"
      />
    </div>
  );
}

function ColorField({ label, description, value, onChange }: any) {
  return (
    <div style={colorFieldCard}>
      <div>
        <label style={labelStyle}>{label}</label>
        <p style={miniDescription}>{description}</p>
      </div>

      <div style={colorInputRow}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={colorInput}
        />

        <span style={colorValue}>{value}</span>
      </div>
    </div>
  );
}

function InfoStat({ titulo, valor, detalhe }: any) {
  return (
    <div style={infoStatCard}>
      <span style={infoStatTitle}>{titulo}</span>
      <strong style={infoStatValue}>{valor}</strong>
      <p style={infoStatDetail}>{detalhe}</p>
    </div>
  );
}

const page = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 16,
  width: "100%",
  paddingBottom: 24,
};

const hero = {
  position: "relative" as const,
  overflow: "hidden",
  borderRadius: 24,
  padding: 20,
  color: "#fff",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto auto",
  alignItems: "center",
  gap: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 16px 45px rgba(0,0,0,0.24)",
};

const heroContent = {
  minWidth: 0,
};

const heroMobile = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "stretch",
  gap: 10,
  padding: 13,
  borderRadius: 20,
  overflow: "hidden",
  width: "100%",
};

const heroContentMobile = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
};

const titleMobile = {
  fontSize: 24,
  lineHeight: 1.05,
  maxWidth: "100%",
  wordBreak: "normal" as const,
};

const subtitleMobile = {
  fontSize: 12,
  lineHeight: 1.45,
  maxWidth: "100%",
  width: "100%",
};

const heroChipsMobile = {
  gap: 8,
};

const heroPreviewMobile = {
  width: "100%",
  maxWidth: "100%",
  height: 58,
  flexShrink: 0,
  borderRadius: 16,
};

const backButtonMobile = {
  width: "100%",
  textAlign: "center" as const,
  minHeight: 36,
  padding: "9px 12px",
};

const eyebrow = {
  opacity: 0.82,
  fontSize: 11,
  marginBottom: 6,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

const title = {
  margin: 0,
  fontSize: 32,
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.04em",
};

const subtitle = {
  opacity: 0.86,
  marginTop: 8,
  marginBottom: 0,
  lineHeight: 1.5,
  maxWidth: 680,
  fontSize: 13,
};

const heroChips = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 8,
  marginTop: 12,
};

const heroChip = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.09)",
  border: "1px solid rgba(255,255,255,0.11)",
  color: "#fff",
  fontSize: 11,
  fontWeight: 850,
};

const heroPreview = {
  display: "flex",
  alignItems: "stretch",
  width: 170,
  height: 82,
  borderRadius: 20,
  background: "rgba(15,23,42,0.62)",
  border: "1px solid rgba(255,255,255,0.12)",
  overflow: "hidden",
  boxShadow: "0 12px 28px rgba(0,0,0,0.20)",
};

const previewSidebar = {
  width: 38,
};

const previewMain = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 12,
};

const previewLogo = {
  width: 42,
  height: 42,
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontSize: 18,
  fontWeight: 950,
  overflow: "hidden",
};

const previewLogoImg = {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
};

const previewLines = {
  flex: 1,
  display: "flex",
  flexDirection: "column" as const,
  gap: 10,
};

const previewLineLarge = {
  height: 12,
  width: "100%",
  borderRadius: 999,
  background: "rgba(255,255,255,0.22)",
};

const previewLineSmall = {
  height: 10,
  width: "68%",
  borderRadius: 999,
  background: "rgba(255,255,255,0.14)",
};

const backButton = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: "11px 14px",
  background: "rgba(255,255,255,0.07)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  transition: "all .18s ease",
  whiteSpace: "nowrap" as const,
};

const topStatsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 145px), 1fr))",
  gap: 8,
};

const infoStatCard = {
  padding: 12,
  borderRadius: 18,
  background: "rgba(15,23,42,0.74)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
};

const infoStatTitle = {
  display: "block",
  color: "#94a3b8",
  fontSize: 10,
  fontWeight: 900,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  marginBottom: 6,
};

const infoStatValue = {
  display: "block",
  color: "#f8fafc",
  fontSize: 17,
  fontWeight: 950,
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const infoStatDetail = {
  color: "#94a3b8",
  fontSize: 11,
  margin: "6px 0 0",
  lineHeight: 1.35,
};

const card = {
  background: "rgba(15,23,42,0.80)",
  borderRadius: 22,
  padding: 18,
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 16px 45px rgba(0,0,0,0.20)",
};

const sectionHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 14,
  marginBottom: 16,
  flexWrap: "wrap" as const,
};

const badge = {
  display: "inline-flex",
  padding: "5px 9px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.07)",
  color: "#fff",
  fontSize: 10,
  fontWeight: 900,
  marginBottom: 8,
  border: "1px solid rgba(255,255,255,0.09)",
};

const cardTitle = {
  margin: 0,
  fontSize: 21,
  fontWeight: 950,
  color: "#fff",
  letterSpacing: "-0.03em",
};

const cardDescription = {
  color: "#94a3b8",
  fontSize: 12,
  lineHeight: 1.45,
  margin: "6px 0 0",
};

const colorGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
  gap: 10,
};

const colorFieldCard = {
  padding: 13,
  borderRadius: 17,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const miniDescription = {
  color: "#94a3b8",
  fontSize: 11,
  lineHeight: 1.35,
  margin: "4px 0 10px",
};

const colorInputRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const colorInput = {
  width: 62,
  height: 48,
  border: "none",
  borderRadius: 16,
  background: "transparent",
  cursor: "pointer",
};

const colorValue = {
  color: "#e2e8f0",
  fontSize: 13,
  fontWeight: 800,
  fontFamily: "monospace",
};

const empresaGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
  gap: 12,
};

const field = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
  minWidth: 0,
};

const labelStyle = {
  color: "#cbd5e1",
  fontSize: 12,
  fontWeight: 850,
};

const input = {
  width: "100%",
  padding: "12px 13px",
  borderRadius: 13,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(2,6,23,0.52)",
  color: "#fff",
  outline: "none",
  fontSize: 13,
  boxSizing: "border-box" as const,
  transition: "all .18s ease",
};

const logoPreviewBox = {
  display: "flex",
  alignItems: "center",
  gap: 13,
  padding: 13,
  borderRadius: 17,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginTop: 14,
};

const logoPreview = {
  width: 58,
  height: 58,
  borderRadius: 16,
  objectFit: "cover" as const,
  border: "1px solid rgba(255,255,255,0.12)",
};

const logoVazio = {
  width: 58,
  height: 58,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontSize: 20,
  fontWeight: 950,
  flexShrink: 0,
};

const strongText = {
  color: "#f8fafc",
  fontWeight: 950,
};

const primaryButton = {
  width: "100%",
  border: "none",
  borderRadius: 14,
  padding: "13px 15px",
  background: "var(--marcae-gradient)",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
  marginTop: 14,
  transition: "all .18s ease",
};

const primaryButtonInline = {
  border: "none",
  borderRadius: 14,
  padding: "11px 14px",
  background: "var(--marcae-gradient)",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
  transition: "all .18s ease",
  whiteSpace: "nowrap" as const,
};

const sectionActionsRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap" as const,
};

const empresaResumoCompacto = {
  display: "grid",
  gridTemplateColumns: "52px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 12,
  padding: 12,
  borderRadius: 18,
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const empresaResumoLogoBox = {
  width: 52,
  height: 52,
  borderRadius: 16,
  overflow: "hidden",
};

const empresaResumoLogo = {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
};

const empresaResumoLogoVazio = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontSize: 18,
  fontWeight: 950,
};

const empresaResumoInfo = {
  minWidth: 0,
  display: "grid",
  gap: 3,
};

const empresaResumoNome = {
  color: "#fff",
  fontSize: 14,
  fontWeight: 950,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const empresaResumoLinha = {
  color: "#94a3b8",
  fontSize: 11,
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const empresaResumoButton = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 13,
  padding: "10px 12px",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 950,
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: 16,
  alignItems: "start",
};

const integracaoStatusCard = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: 13,
  borderRadius: 17,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: 12,
};

const statusDot = {
  width: 12,
  height: 12,
  borderRadius: 999,
  marginTop: 6,
  boxShadow: "0 0 0 6px rgba(255,255,255,0.06)",
};

const mercadoPagoGrid = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 16,
};

const toggleCard = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: 13,
  borderRadius: 17,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const toggleDescription = {
  color: "#94a3b8",
  fontSize: 13,
  lineHeight: 1.5,
  margin: "6px 0 0",
};

const toggleButton = {
  width: 58,
  height: 32,
  border: "none",
  borderRadius: 999,
  padding: 4,
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  transition: "all .18s ease",
  flexShrink: 0,
};

const toggleCircle = {
  width: 24,
  height: 24,
  borderRadius: 999,
  background: "#fff",
  boxShadow: "0 4px 12px rgba(0,0,0,.25)",
};

const usuariosResumoBox = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
  gap: 10,
  padding: 13,
  borderRadius: 18,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const usuariosResumoItem = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 4,
};

const usuariosResumoNumero = {
  color: "#f8fafc",
  fontSize: 21,
  fontWeight: 950,
};

const usuariosResumoTexto = {
  color: "#94a3b8",
  fontSize: 11,
  fontWeight: 700,
};

const usuariosResumoDivider = {
  display: "none",
};

const usuarioLayoutGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
  gap: 14,
  alignItems: "start",
};

const usuarioFormCard = {
  padding: 14,
  borderRadius: 19,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const usuarioFormHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 14,
  flexWrap: "wrap" as const,
};

const usuarioFormTitle = {
  margin: 0,
  color: "#f8fafc",
  fontSize: 18,
  fontWeight: 950,
  letterSpacing: "-0.02em",
};

const ghostButton = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: "11px 14px",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontWeight: 850,
  cursor: "pointer",
  transition: "all .18s ease",
};

const usuarioFormGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
  gap: 10,
  marginBottom: 12,
};

const permissionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginTop: 22,
  marginBottom: 16,
};

const permissionCounter = {
  padding: "9px 12px",
  borderRadius: 999,
  background: "var(--marcae-primary-soft)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap" as const,
};

const permissionGroup = {
  marginTop: 18,
};

const permissionGroupHeader = {
  marginBottom: 10,
};

const permissionGroupTitle = {
  color: "#e2e8f0",
  margin: 0,
  fontSize: 14,
  fontWeight: 950,
};

const permissionsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const permissionCard = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  width: "100%",
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  textAlign: "left" as const,
  cursor: "pointer",
  transition: "all .18s ease",
};

const permissionCheck = {
  width: 24,
  height: 24,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontSize: 13,
  fontWeight: 950,
  flexShrink: 0,
};

const permissionTitle = {
  display: "block",
  color: "#f8fafc",
  fontSize: 13,
  fontWeight: 950,
};

const permissionDescription = {
  color: "#94a3b8",
  fontSize: 12,
  lineHeight: 1.45,
  margin: "4px 0 0",
};

const usuariosListCard = {
  padding: 14,
  borderRadius: 19,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const usuariosListHeader = {
  marginBottom: 16,
};

const usuariosList = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 10,
  width: "100%",
};

const emptyUsers = {
  padding: 20,
  borderRadius: 18,
  background: "rgba(255,255,255,0.04)",
  color: "#94a3b8",
  fontWeight: 800,
  textAlign: "center" as const,
};

const usuarioItem = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: 12,
  borderRadius: 17,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const usuarioAvatar = {
  width: 40,
  height: 40,
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--marcae-gradient)",
  color: "#fff",
  fontWeight: 950,
  fontSize: 16,
  flexShrink: 0,
};

const usuarioInfo = {
  minWidth: 0,
  width: "100%",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 12,
};

const usuarioTextoColuna = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column" as const,
  gap: 4,
};

const usuarioNome = {
  display: "block",
  color: "#f8fafc",
  fontSize: 15,
  fontWeight: 950,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const usuarioEmail = {
  display: "block",
  color: "#94a3b8",
  fontSize: 12,
  marginTop: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
  maxWidth: "100%",
};

const usuarioWhatsapp = {
  display: "block",
  color: "#c4b5fd",
  fontSize: 12,
  marginTop: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
  maxWidth: "100%",
};

const usuarioBadges = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 6,
  marginTop: 6,
};

const usuarioBadge = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
};

const editButton = {
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: 12,
  padding: "9px 12px",
  background: "rgba(255,255,255,0.055)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  width: "100%",
  textAlign: "center" as const,
};

const permissaoCompactCard = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: 13,
  borderRadius: 17,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginTop: 12,
  marginBottom: 12,
  flexWrap: "wrap" as const,
};

const modalOverlay = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  background: "rgba(2,6,23,0.78)",
  backdropFilter: "blur(14px)",
};

const modalPermissoesCard = {
  width: "min(1120px, 100%)",
  maxHeight: "88vh",
  overflow: "hidden",
  borderRadius: 30,
  background: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 30px 110px rgba(0,0,0,0.55)",
  padding: 24,
  display: "flex",
  flexDirection: "column" as const,
};

const modalHeader = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 18,
  paddingBottom: 18,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const modalCloseButton = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: "12px 14px",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const modalResumoPermissoes = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  width: "fit-content",
  marginTop: 16,
  padding: "10px 14px",
  borderRadius: 999,
  background: "var(--marcae-primary-soft)",
  color: "#fff",
  fontWeight: 900,
};

const modalPermissoesScroll = {
  overflowY: "auto" as const,
  paddingRight: 6,
  marginTop: 18,
};

const modalFooter = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  paddingTop: 18,
  marginTop: 18,
  borderTop: "1px solid rgba(255,255,255,0.08)",
  flexWrap: "wrap" as const,
};

const linkAgendamentoBox = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 260px",
  gap: 22,
  alignItems: "stretch",
};

const linkAgendamentoInfo = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 16,
};

const linkAgendamentoLine = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 12,
};

const linkAgendamentoAcoes = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 12,
};

const secondaryButton = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: "14px 16px",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
  transition: "all .18s ease",
};

const whatsappButton = {
  border: "none",
  borderRadius: 16,
  padding: "14px 16px",
  background:
    "linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary))",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
  transition: "all .18s ease",
};

const qrCard = {
  padding: 20,
  borderRadius: 24,
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.09)",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
  gap: 12,
};

const qrImage = {
  width: 160,
  height: 160,
  borderRadius: 20,
  background: "#fff",
  padding: 10,
};

const solicitacaoMpCard = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 18,
  padding: 24,
  borderRadius: 22,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const integracaoSolicitadaCard = {
  padding: 24,
  borderRadius: 22,
  background: "rgba(245,158,11,.12)",
  border: "1px solid rgba(245,158,11,.25)",
};

const integracaoAtivaCard = {
  padding: 24,
  borderRadius: 22,
  background: "rgba(16,185,129,.12)",
  border: "1px solid rgba(16,185,129,.25)",
};
