"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import PremiumLayout from "@/components/layout/PremiumLayout";
import { obterStatusLicencaEmpresa } from "@/app/lib/licencaEmpresa";

export default function PromocoesPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [tipoPromocao, setTipoPromocao] = useState("geral");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [mensagemWhatsapp, setMensagemWhatsapp] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tipoDesconto, setTipoDesconto] = useState("percentual");
  const [desconto, setDesconto] = useState("");
  const [status, setStatus] = useState("ativa");
  const [usoUnicoCpf, setUsoUnicoCpf] = useState(false);
  const [servicos, setServicos] = useState<any[]>([]);
  const [servicosSelecionadosIds, setServicosSelecionadosIds] = useState<
    string[]
  >([]);

  const [promocoes, setPromocoes] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    const empresaStorage = localStorage.getItem("empresaLogada");
    const usuarioStorage = localStorage.getItem("usuarioEmpresa");

    if (!empresaStorage || !usuarioStorage) {
      window.location.href = "/login";
      return;
    }

    const emp = JSON.parse(empresaStorage);

    setEmpresa(emp);
    setUsuario(JSON.parse(usuarioStorage));

    carregarPromocoes(emp.id);
    carregarServicos(emp.id);
  }, []);

  const metricas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    function promocaoEstaAtiva(item: any) {
      if (item.status !== "ativa") return false;

      if (!item.dataFim) return true;

      const fim = new Date(item.dataFim);
      fim.setHours(23, 59, 59, 999);

      return fim >= hoje;
    }

    const total = promocoes.length;
    const ativas = promocoes.filter((item) => promocaoEstaAtiva(item)).length;
    const enviadas = promocoes.filter((item) => item.whatsappEnviadoAt).length;

    const totalEnviados = promocoes.reduce(
      (acc, item) => acc + Number(item.whatsappTotalEnviados || 0),
      0,
    );

    const totalErros = promocoes.reduce(
      (acc, item) => acc + Number(item.whatsappTotalErros || 0),
      0,
    );

    return {
      total,
      ativas,
      enviadas,
      totalEnviados,
      totalErros,
    };
  }, [promocoes]);

  async function carregarPromocoes(empresaId: string) {
    const res = await fetch(`/api/promocoes?empresaId=${empresaId}`);
    const data = await res.json();

    if (data.success) {
      setPromocoes(data.promocoes || []);
    }
  }

  async function carregarServicos(empresaId: string) {
    try {
      console.log("Buscando serviços da empresa:", empresaId);

      const res = await fetch(`/api/servicos?empresaId=${empresaId}`, {
        cache: "no-store",
      });

      const text = await res.text();

      console.log("Resposta bruta serviços:", text);

      const data = text ? JSON.parse(text) : {};

      const listaServicos = data.servicos || data.data || data.items || [];

      setServicos(Array.isArray(listaServicos) ? listaServicos : []);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      setServicos([]);
    }
  }

  function sair() {
    localStorage.clear();
    window.location.href = "/login";
  }

  function limparFormulario() {
    setEditandoId(null);
    setTitulo("");
    setDescricao("");
    setMensagemWhatsapp("");
    setDataInicio("");
    setDataFim("");
    setDesconto("");
    setTipoDesconto("percentual");
    setStatus("ativa");
    setUsoUnicoCpf(false);
    setTipoPromocao("geral");
    setServicosSelecionadosIds([]);
    setMostrarFormulario(false);
  }

  function alternarServicoPromocao(servicoId: string) {
    const jaSelecionado = servicosSelecionadosIds.includes(servicoId);

    setServicosSelecionadosIds(
      jaSelecionado
        ? servicosSelecionadosIds.filter((id) => id !== servicoId)
        : [...servicosSelecionadosIds, servicoId],
    );
  }

  async function salvarPromocao() {
    try {
      if (!titulo) {
        if (!dataInicio || !dataFim) {
          alert("Informe a data de início e a data final da promoção.");
          return;
        }
        alert("Informe o título da promoção.");
        return;
      }

      if (tipoPromocao === "servico" && servicosSelecionadosIds.length === 0) {
        alert("Selecione pelo menos um serviço para aplicar o desconto.");
        return;
      }

      setSalvando(true);

      const res = await fetch("/api/promocoes", {
        method: editandoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editandoId,
          empresaId: empresa.id,
          tipoPromocao,
          titulo,
          descricao,
          mensagemWhatsapp,
          dataInicio,
          dataFim,
          tipoDesconto,
          desconto,
          status,
          usoUnicoCpf,
          servicosIds:
            tipoPromocao === "servico" ? servicosSelecionadosIds : [],
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Erro ao salvar promoção.");
        return;
      }

      alert(
        editandoId
          ? "Promoção atualizada com sucesso!"
          : "Promoção salva com sucesso!",
      );

      limparFormulario();
      carregarPromocoes(empresa.id);
    } catch (error) {
      console.error("Erro ao salvar promoção:", error);
      alert("Erro ao salvar promoção.");
    } finally {
      setSalvando(false);
    }
  }

  function editarPromocao(promocao: any) {
    setEditandoId(promocao.id);
    setTipoPromocao(promocao.tipo || "geral");
    setTitulo(promocao.titulo || "");
    setDescricao(promocao.descricao || "");
    setMensagemWhatsapp(promocao.mensagemWhatsapp || "");
    setDataInicio(promocao.dataInicio ? promocao.dataInicio.slice(0, 10) : "");
    setDataFim(promocao.dataFim ? promocao.dataFim.slice(0, 10) : "");
    setTipoDesconto(promocao.tipoDesconto || "percentual");
    setDesconto(promocao.desconto ? String(promocao.desconto) : "");
    setStatus(promocao.status || "ativa");
    setUsoUnicoCpf(Boolean(promocao.usoUnicoCpf));
    setMostrarFormulario(true);
    setServicosSelecionadosIds(
      Array.isArray(promocao.servicos)
        ? promocao.servicos
            .map((item: any) => item.servicoId || item.servico?.id)
            .filter(Boolean)
        : [],
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirPromocao(promocao: any) {
    const confirmar = confirm(
      `Deseja excluir a promoção "${promocao.titulo}"?`,
    );

    if (!confirmar) return;

    const res = await fetch(`/api/promocoes?id=${promocao.id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error || "Erro ao excluir promoção.");
      return;
    }

    alert("Promoção excluída com sucesso!");
    carregarPromocoes(empresa.id);
  }

  async function enviarPromocaoIndividual(promocao: any) {
    try {
      if (!promocao.mensagemWhatsapp) {
        alert("Essa promoção não possui mensagem para WhatsApp.");
        return;
      }

      const confirmar = confirm(
        `Deseja enviar a promoção "${promocao.titulo}" para os clientes cadastrados no WhatsApp?`,
      );

      if (!confirmar) return;

      setEnviandoId(promocao.id);

      const res = await fetch("/api/promocoes/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promocaoId: promocao.id,
          empresaId: empresa.id,
          tipoPromocao: promocao.tipo,
          titulo: promocao.titulo,
          descricao: promocao.descricao,
          mensagemWhatsapp: promocao.mensagemWhatsapp,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Erro ao enviar promoção.");
        return;
      }

      alert(
        `Promoção enviada com sucesso!\n\nEnviados: ${data.enviados}\nErros: ${data.erros}`,
      );

      carregarPromocoes(empresa.id);
    } catch (error) {
      console.error("Erro ao enviar promoção:", error);
      alert("Erro ao enviar promoção.");
    } finally {
      setEnviandoId(null);
    }
  }

  function formatarData(data: string) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function formatarDataHora(data: string) {
    if (!data) return "Ainda não enviada";

    return new Date(data).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function formatarTipo(tipo: string) {
    if (tipo === "servico") return "Desconto por serviço";
    if (tipo === "aniversariantes") return "Aniversariantes";
    return "Promoção geral";
  }

  function formatarDesconto(promocao: any) {
    if (!promocao.desconto) return "Sem desconto";

    if (promocao.tipoDesconto === "valor") {
      return `R$ ${Number(promocao.desconto || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}`;
    }

    return `${promocao.desconto}%`;
  }

  if (!empresa || !usuario) {
    return (
      <main style={loadingPage}>
        <div style={loadingCard}>Carregando módulo de promoções...</div>
      </main>
    );
  }

  const licencaEmpresa = obterStatusLicencaEmpresa(empresa);

  if (licencaEmpresa.bloquearPromocoes) {
    return <LicencaBloqueada empresa={empresa} usuario={usuario} modulo="Promoções" />;
  }

  return (
    <PremiumLayout empresa={empresa} usuario={usuario}>
      <main className="promocoes-mobile-safe" style={page}>
        <style jsx global>{`
          html,
          body {
            max-width: 100%;
            overflow-x: hidden;
          }

          .promocoes-mobile-safe,
          .promocoes-mobile-safe * {
            box-sizing: border-box;
          }

          .promocoes-mobile-safe {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden !important;
          }

          .promocoes-compact-header,
          .promocoes-metricas-grid {
            width: 100%;
            max-width: 100%;
          }

          @media (max-width: 1180px) {
            .promocoes-mobile-safe {
              padding: 22px !important;
              padding-bottom: 112px !important;
            }

            .promocoes-mobile-safe > section {
              width: 100% !important;
              max-width: 100% !important;
            }

            .promocoes-mobile-safe .promocoes-metricas-grid {
              display: grid !important;
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
              gap: 10px !important;
              overflow: visible !important;
              padding-bottom: 0 !important;
              scroll-snap-type: none !important;
            }

            .promocoes-mobile-safe .promocoes-metricas-grid > div {
              min-width: 0 !important;
              width: 100% !important;
              scroll-snap-align: none !important;
            }

            .promocoes-mobile-safe > section:nth-of-type(3) {
              grid-template-columns: 1fr !important;
            }

            .promocoes-mobile-safe > section:nth-of-type(4) > div:last-child {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 900px) {
            .promocoes-mobile-safe .promocoes-compact-header {
              padding: 16px !important;
              border-radius: 22px !important;
              align-items: flex-start !important;
              gap: 12px !important;
            }

            .promocoes-mobile-safe .promocoes-compact-left {
              display: grid !important;
              grid-template-columns: 46px minmax(0, 1fr) !important;
              align-items: center !important;
              gap: 12px !important;
              width: 100% !important;
            }

            .promocoes-mobile-safe .promocoes-compact-icon {
              width: 46px !important;
              min-width: 46px !important;
              max-width: 46px !important;
              height: 46px !important;
              min-height: 46px !important;
              padding: 0 !important;
              border-radius: 16px !important;
              font-size: 21px !important;
            }

            .promocoes-mobile-safe .promocoes-compact-right {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 8px !important;
              width: 100% !important;
            }

            .promocoes-mobile-safe .promocoes-compact-right > div {
              min-width: 0 !important;
              width: 100% !important;
              padding: 9px 10px !important;
              border-radius: 14px !important;
            }

            .promocoes-mobile-safe .promocoes-compact-right button {
              grid-column: 1 / -1 !important;
              width: 100% !important;
              min-height: 40px !important;
              padding: 11px 14px !important;
              border-radius: 14px !important;
            }

            .promocoes-mobile-safe .promocoes-metricas-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 8px !important;
            }

            .promocoes-mobile-safe .promocoes-metricas-grid > div {
              padding: 12px !important;
              border-radius: 16px !important;
            }

            .promocoes-mobile-safe .promocoes-metricas-grid small {
              display: none !important;
            }

            .promocoes-mobile-safe input,
            .promocoes-mobile-safe select,
            .promocoes-mobile-safe textarea,
            .promocoes-mobile-safe button {
              max-width: 100% !important;
            }

            .promocoes-mobile-safe form > div[style*="grid-template-columns"],
            .promocoes-mobile-safe div[style*="gridTemplateColumns: 1fr 1fr"],
            .promocoes-mobile-safe div[style*="grid-template-columns: 1fr 1fr"] {
              grid-template-columns: 1fr !important;
            }

            .promocoes-mobile-safe > section:nth-of-type(3),
            .promocoes-mobile-safe > section:nth-of-type(4) {
              padding: 18px !important;
              border-radius: 24px !important;
              overflow: hidden !important;
            }

            .promocoes-mobile-safe > section:nth-of-type(4) > div:first-child {
              flex-direction: column !important;
              align-items: stretch !important;
            }
          }

          @media (max-width: 760px) {
            .promocoes-mobile-safe {
              padding: 14px !important;
              padding-bottom: 126px !important;
            }

            .promocoes-mobile-safe .promocoes-compact-header {
              padding: 14px !important;
              margin-bottom: 12px !important;
            }

            .promocoes-mobile-safe .promocoes-compact-left {
              grid-template-columns: 44px minmax(0, 1fr) !important;
              gap: 10px !important;
            }

            .promocoes-mobile-safe .promocoes-compact-icon {
              width: 44px !important;
              min-width: 44px !important;
              max-width: 44px !important;
              height: 44px !important;
              min-height: 44px !important;
              border-radius: 15px !important;
              font-size: 20px !important;
            }

            .promocoes-mobile-safe .promocoes-compact-left h1 {
              font-size: 23px !important;
              line-height: 1.05 !important;
            }

            .promocoes-mobile-safe .promocoes-compact-left p {
              font-size: 12px !important;
              line-height: 1.35 !important;
              margin-top: 4px !important;
            }

            .promocoes-mobile-safe label,
            .promocoes-mobile-safe input,
            .promocoes-mobile-safe select,
            .promocoes-mobile-safe textarea {
              width: 100% !important;
            }

            .promocoes-mobile-safe form > div,
            .promocoes-mobile-safe form > label {
              width: 100% !important;
              min-width: 0 !important;
            }

            .promocoes-mobile-safe form div[style*="grid-template-columns"],
            .promocoes-mobile-safe form div[style*="gridTemplateColumns"],
            .promocoes-mobile-safe > section:nth-of-type(4) div[style*="grid-template-columns"],
            .promocoes-mobile-safe > section:nth-of-type(4) div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr !important;
            }

            .promocoes-mobile-safe form > label {
              display: grid !important;
              grid-template-columns: 28px minmax(0, 1fr) !important;
              gap: 12px !important;
            }

            .promocoes-mobile-safe form > label input[type="checkbox"] {
              width: 20px !important;
              height: 20px !important;
            }

            .promocoes-mobile-safe form > div:last-child,
            .promocoes-mobile-safe > section:nth-of-type(4) div[style*="display: flex"] {
              display: grid !important;
              grid-template-columns: 1fr !important;
              width: 100% !important;
              gap: 10px !important;
            }

            .promocoes-mobile-safe form button,
            .promocoes-mobile-safe > section:nth-of-type(4) button {
              width: 100% !important;
              min-width: 0 !important;
              margin-left: 0 !important;
            }
          }

          @media (max-width: 430px) {
            .promocoes-mobile-safe span {
              max-width: 100% !important;
              overflow-wrap: anywhere !important;
            }
          }


          @media (max-width: 760px) {
            .promocoes-mobile-safe {
              padding: 14px !important;
              padding-bottom: 126px !important;
              margin-top: 0 !important;
            }

            .promocoes-mobile-safe .promocoes-compact-header {
              margin-top: 0 !important;
              margin-bottom: 10px !important;
              padding: 12px !important;
              border-radius: 20px !important;
              min-height: auto !important;
              box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22) !important;
            }

            .promocoes-mobile-safe .promocoes-compact-left {
              grid-template-columns: 40px minmax(0, 1fr) !important;
              gap: 10px !important;
              align-items: center !important;
            }

            .promocoes-mobile-safe .promocoes-compact-icon {
              width: 40px !important;
              min-width: 40px !important;
              max-width: 40px !important;
              height: 40px !important;
              min-height: 40px !important;
              border-radius: 14px !important;
              font-size: 19px !important;
              box-shadow: none !important;
            }

            .promocoes-mobile-safe .promocoes-compact-left h1 {
              font-size: 22px !important;
              line-height: 1 !important;
            }

            .promocoes-mobile-safe .promocoes-compact-left p {
              display: block !important;
              font-size: 11.5px !important;
              line-height: 1.25 !important;
              margin-top: 3px !important;
            }

            .promocoes-mobile-safe .promocoes-compact-left div[style*="margin-top: 6"] {
              display: none !important;
            }

            .promocoes-mobile-safe .promocoes-compact-right {
              display: none !important;
            }

            .promocoes-mobile-safe .promocoes-metricas-grid {
              margin-bottom: 10px !important;
              gap: 8px !important;
            }

            .promocoes-mobile-safe .promocoes-metricas-grid > div {
              padding: 10px !important;
              border-radius: 15px !important;
              min-height: 82px !important;
            }

            .promocoes-mobile-safe .promocoes-metricas-grid p {
              margin: 5px 0 3px !important;
              font-size: 10.5px !important;
              line-height: 1.15 !important;
            }

            .promocoes-mobile-safe .promocoes-metricas-grid strong {
              font-size: 22px !important;
              line-height: 1 !important;
            }

            .promocoes-mobile-safe section[style*="rgba(15,23,42,0.86)"] {
              padding: 14px !important;
              border-radius: 20px !important;
              margin-bottom: 12px !important;
            }
          }

        `}</style>

        <div style={backgroundGlowOne} />
        <div style={backgroundGlowTwo} />

        <section
          className="promocoes-compact-header"
          style={{
            ...headerCompact,
            borderColor: `${empresa?.corSidebar || "#d709ab"}22`,
          }}
        >
          <div className="promocoes-compact-left" style={headerCompactLeft}>
            <div
              className="promocoes-compact-icon"
              style={{
                ...compactIcon,
                background: `linear-gradient(135deg,
                  ${empresa?.corSidebar || "#d709ab"},
                  ${empresa?.corSecundaria || "#57f755"}
                )`,
              }}
            >
              📣
            </div>

            <div>
              <div style={compactTitleRow}>
                <h1 style={compactTitle}>Promoções</h1>
                <span style={headerMiniBadge}>Marketing</span>
              </div>

              <p style={compactSubtitle}>
                Campanhas, descontos e relacionamento via WhatsApp.
              </p>

              <div style={headerMiniTop}>
                <span style={headerMiniText}>WhatsApp & CRM</span>
              </div>
            </div>
          </div>

          <div className="promocoes-compact-right" style={headerCompactRight}>
            <div style={miniStatCard}>
              <strong style={miniStatValue}>{metricas.ativas}</strong>
              <span style={miniStatLabel}>Ativas</span>
            </div>

            <div style={miniStatCard}>
              <strong style={miniStatValue}>{metricas.totalEnviados}</strong>
              <span style={miniStatLabel}>Envios</span>
            </div>
          </div>
        </section>

        <section className="promocoes-metricas-grid" style={gridCards}>
          <div style={metricCard}>
            <span style={metricIcon}>📌</span>
            <p style={metricLabel}>Campanhas cadastradas</p>
            <strong style={metricValue}>{metricas.total}</strong>
            <small style={metricHint}>Promoções criadas no sistema</small>
          </div>

          <div style={metricCard}>
            <span style={metricIcon}>✅</span>
            <p style={metricLabel}>Campanhas ativas</p>
            <strong style={metricValue}>{metricas.ativas}</strong>
            <small style={metricHint}>Disponíveis para ações comerciais</small>
          </div>

          <div style={metricCard}>
            <span style={metricIcon}>💬</span>
            <p style={metricLabel}>Campanhas enviadas</p>
            <strong style={metricValue}>{metricas.enviadas}</strong>
            <small style={metricHint}>
              Com disparo registrado via WhatsApp
            </small>
          </div>

          <div style={metricCard}>
            <span style={metricIcon}>🚀</span>
            <p style={metricLabel}>WhatsApps entregues</p>
            <strong style={metricValue}>{metricas.totalEnviados}</strong>
            <small style={metricHint}>
              Erros registrados: {metricas.totalErros}
            </small>
          </div>
        </section>

        {mostrarFormulario || editandoId ? (
          <section id="form-promocao" style={contentGrid}>
            <div style={formPanel}>
              <div style={sectionHeader}>
                <div>
                  <span style={sectionKicker}>
                    {editandoId ? "Edição de campanha" : "Nova campanha"}
                  </span>
                  <h2 style={sectionTitle}>
                    {editandoId ? "Editar promoção" : "Criar promoção"}
                  </h2>
                  <p style={sectionSubtitle}>
                    Configure o tipo de campanha, período, desconto e mensagem
                    que será enviada para seus clientes.
                  </p>
                </div>

                <div style={formHeaderActions}>
                  <span style={statusPill}>
                    {editandoId ? "Editando" : "Criando"}
                  </span>
                  <button
                    type="button"
                    onClick={limparFormulario}
                    style={botaoFecharFormulario}
                    aria-label="Fechar cadastro de promoção"
                  >
                    ×
                  </button>
                </div>
              </div>

              <form style={formGrid}>
                <div>
                  <label style={label}>Tipo de promoção</label>
                  <select
                    style={input}
                    value={tipoPromocao}
                    onChange={(e) => {
                      setTipoPromocao(e.target.value);

                      if (e.target.value !== "servico") {
                        setServicosSelecionadosIds([]);
                      }
                    }}
                  >
                    <option value="geral">Promoção geral</option>
                    <option value="servico">Desconto por serviço</option>
                    <option value="aniversariantes">
                      Promoção para aniversariantes do mês
                    </option>
                  </select>
                </div>

                <div>
                  <label style={label}>Título da promoção</label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Semana da Beleza"
                    style={input}
                  />
                </div>

                {tipoPromocao === "aniversariantes" && (
                  <div style={alertaAniversario}>
                    <strong>🎂 Campanha de aniversário</strong>
                    <span>
                      Esta promoção será enviada apenas para clientes que fazem
                      aniversário no mês atual.
                    </span>
                  </div>
                )}

                {(tipoPromocao === "servico" ||
                  tipoPromocao === "aniversariantes") && (
                  <div style={servicosPromocaoBox}>
                    <div style={servicosPromocaoHeader}>
                      <div>
                        <label style={label}>Serviços com desconto</label>
                        <p style={hint}>
                          Selecione quais serviços receberão o desconto desta
                          promoção no agendador.
                        </p>
                      </div>

                      <span style={badgeQuantidadeServicos}>
                        {servicosSelecionadosIds.length} selecionado(s)
                      </span>
                    </div>

                    {servicos.length === 0 ? (
                      <div style={emptyBox}>
                        Nenhum serviço cadastrado ainda.
                      </div>
                    ) : (
                      <div style={servicosPromocaoGrid}>
                        {servicos.map((servico) => {
                          const selecionado = servicosSelecionadosIds.includes(
                            servico.id,
                          );

                          return (
                            <button
                              key={servico.id}
                              type="button"
                              onClick={() =>
                                alternarServicoPromocao(servico.id)
                              }
                              style={
                                selecionado
                                  ? servicoPromocaoSelecionado
                                  : servicoPromocaoNaoSelecionado
                              }
                            >
                              <strong>{servico.nome}</strong>
                              <span>
                                {servico.duracaoMin || 0} min · R${" "}
                                {Number(servico.valor || 0).toLocaleString(
                                  "pt-BR",
                                  {
                                    minimumFractionDigits: 2,
                                  },
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label style={label}>Descrição da oferta</label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva a oferta, condições e benefícios..."
                    style={{ ...input, minHeight: 108, resize: "vertical" }}
                  />
                </div>

                <div>
                  <label style={label}>Mensagem para WhatsApp</label>
                  <textarea
                    value={mensagemWhatsapp}
                    onChange={(e) => setMensagemWhatsapp(e.target.value)}
                    placeholder="Ex: Olá, {nome}! Temos uma promoção especial para você na {empresa}..."
                    style={{ ...input, minHeight: 118, resize: "vertical" }}
                  />
                  <p style={hint}>
                    Variáveis disponíveis: {"{nome}"}, {"{empresa}"},{" "}
                    {"{titulo}"} e {"{descricao}"}.
                  </p>
                </div>

                <div style={gridDois}>
                  <div>
                    <label style={label}>Data de início</label>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      style={input}
                    />
                  </div>

                  <div>
                    <label style={label}>Data de fim</label>
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      style={input}
                    />
                  </div>
                </div>

                <div style={gridDois}>
                  <div>
                    <label style={label}>Tipo de desconto</label>
                    <select
                      style={input}
                      value={tipoDesconto}
                      onChange={(e) => setTipoDesconto(e.target.value)}
                    >
                      <option value="percentual">Percentual (%)</option>
                      <option value="valor">Valor fixo (R$)</option>
                    </select>
                  </div>

                  <div>
                    <label style={label}>Desconto</label>
                    <input
                      type="text"
                      value={desconto}
                      onChange={(e) => setDesconto(e.target.value)}
                      placeholder="Ex: 20 ou 30,00"
                      style={input}
                    />
                  </div>
                </div>

                <div>
                  <label style={label}>Status</label>
                  <select
                    style={input}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                  </select>
                </div>

                <label style={usoUnicoCard}>
                  <input
                    type="checkbox"
                    checked={usoUnicoCpf}
                    onChange={(e) => setUsoUnicoCpf(e.target.checked)}
                    style={usoUnicoCheckbox}
                  />

                  <div>
                    <strong>Limitar uso da promoção a 1 vez por CPF</strong>
                    <span>
                      Quando ativado, cada CPF só poderá receber este desconto
                      uma única vez. Ideal para campanhas de aquisição,
                      aniversário e cupons especiais.
                    </span>
                  </div>
                </label>

                <div style={actionsRow}>
                  <button
                    type="button"
                    onClick={salvarPromocao}
                    disabled={salvando}
                    style={{
                      ...botaoPrincipal,
                      opacity: salvando ? 0.75 : 1,
                      cursor: salvando ? "not-allowed" : "pointer",
                    }}
                  >
                    {salvando
                      ? "Salvando..."
                      : editandoId
                        ? "Atualizar promoção"
                        : "Salvar promoção"}
                  </button>

                  {editandoId && (
                    <button
                      type="button"
                      onClick={limparFormulario}
                      style={botaoSecundario}
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>
        ) : (
          <section style={quickCreatePanel}>
            <div style={quickCreateLeft}>
              <button
                type="button"
                onClick={() => setMostrarFormulario(true)}
                style={quickCreatePlus}
              >
                +
              </button>

              <div>
                <span style={sectionKicker}>Nova campanha</span>
                <h2 style={quickCreateTitle}>Criar promoção</h2>
                <p style={quickCreateText}>
                  Abra o cadastro somente quando precisar criar uma campanha.
                  Assim a tela fica mais leve para operar no dia a dia.
                </p>
              </div>
            </div>
          </section>
        )}

        <section style={historicoSection}>
          <div style={sectionHeader}>
            <div>
              <span style={sectionKicker}>Histórico de campanhas</span>

              <h2 style={sectionTitle}>Promoções cadastradas</h2>

              <p style={sectionSubtitle}>
                Visualize campanhas criadas, status, métricas de envio e
                gerenciamento completo.
              </p>
            </div>

            <span style={statusPill}>{promocoes.length} campanhas</span>
          </div>

          {promocoes.length === 0 ? (
            <div style={emptyBox}>Nenhuma promoção cadastrada ainda.</div>
          ) : (
            <div style={promocoesGrid}>
              {promocoes.map((promocao) => (
                <div key={promocao.id} style={cardPromocao}>
                  <div style={cardGlow} />

                  <div style={cardTop}>
                    <div>
                      <div style={linhaBadgesCard}>
                        <span style={badgeTipo}>
                          {formatarTipo(promocao.tipo)}
                        </span>

                        <span
                          style={
                            promocao.status === "ativa"
                              ? badgeAtiva
                              : badgeInativa
                          }
                        >
                          {promocao.status}
                        </span>

                        {promocao.usoUnicoCpf && (
                          <span style={badgeUsoUnicoCpf}>1x por CPF</span>
                        )}
                      </div>

                      <h3 style={tituloPromocao}>{promocao.titulo}</h3>

                      <p style={descricaoPromocao}>
                        {promocao.descricao || "Sem descrição cadastrada."}
                      </p>
                    </div>

                    <div style={descontoCard}>
                      <span style={descontoLabel}>Desconto</span>

                      <strong style={descontoValor}>
                        {formatarDesconto(promocao)}
                      </strong>
                    </div>
                  </div>

                  <div style={timelineInfo}>
                    <div style={timelineItem}>
                      <span style={timelineLabel}>Início</span>

                      <strong style={timelineValue}>
                        {formatarData(promocao.dataInicio)}
                      </strong>
                    </div>

                    <div style={timelineDivider} />

                    <div style={timelineItem}>
                      <span style={timelineLabel}>Fim</span>

                      <strong style={timelineValue}>
                        {formatarData(promocao.dataFim)}
                      </strong>
                    </div>
                  </div>

                  {promocao.tipo === "servico" && (
                    <div style={servicosPromocaoLista}>
                      {promocao.servicos?.length > 0 ? (
                        promocao.servicos.map((item: any) => (
                          <span key={item.id} style={badgeServicoPromocao}>
                            {item.servico?.nome || "Serviço"}
                          </span>
                        ))
                      ) : (
                        <span style={badgeSemServico}>
                          Sem serviços vinculados
                        </span>
                      )}
                    </div>
                  )}

                  <div style={whatsappInfoBox}>
                    <div style={whatsappLinha}>
                      <span>Último disparo</span>

                      <strong>
                        {formatarDataHora(promocao.whatsappEnviadoAt)}
                      </strong>
                    </div>

                    <div style={whatsappLinha}>
                      <span>Mensagens enviadas</span>

                      <strong>{promocao.whatsappTotalEnviados || 0}</strong>
                    </div>

                    <div style={whatsappLinha}>
                      <span>Falhas</span>

                      <strong>{promocao.whatsappTotalErros || 0}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const novoStatus =
                        promocao.status === "ativa" ? "inativa" : "ativa";

                      const res = await fetch("/api/promocoes", {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          id: promocao.id,
                          status: novoStatus,
                          alterarSomenteStatus: true,
                        }),
                      });

                      const data = await res.json();

                      if (!data.success) {
                        alert(data.error || "Erro ao alterar status.");

                        return;
                      }

                      carregarPromocoes(empresa.id);
                    }}
                    style={
                      promocao.status === "ativa" ? botaoInativar : botaoAtivar
                    }
                  >
                    {promocao.status === "ativa" ? "Inativar" : "Ativar"}
                  </button>

                  <div style={acoesCard}>
                    <button
                      type="button"
                      onClick={() => enviarPromocaoIndividual(promocao)}
                      disabled={enviandoId === promocao.id}
                      style={botaoWhatsapp}
                    >
                      {enviandoId === promocao.id
                        ? "Enviando..."
                        : "Enviar WhatsApp"}
                    </button>

                    <button
                      type="button"
                      onClick={() => editarPromocao(promocao)}
                      style={botaoEditar}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => excluirPromocao(promocao)}
                      style={botaoExcluir}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </PremiumLayout>
  );
}

const loadingPage = {
  minHeight: "100vh",
  background: "#020617",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
};

const loadingCard = {
  background: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 22,
  padding: 24,
  color: "#e5e7eb",
  fontWeight: 900,
};

const page = {
  minHeight: "100vh",
  background: "#020617",
  padding: "28px",
  position: "relative" as const,
  overflowX: "hidden" as const,
};

const backgroundGlowOne = {
  position: "absolute" as const,
  top: -180,
  right: -120,
  width: 420,
  height: 420,
  borderRadius: "50%",
  background: "rgba(124,58,237,0.26)",
  filter: "blur(90px)",
  pointerEvents: "none" as const,
};

const backgroundGlowTwo = {
  position: "absolute" as const,
  bottom: -180,
  left: -140,
  width: 420,
  height: 420,
  borderRadius: "50%",
  background: "rgba(14,165,233,0.18)",
  filter: "blur(90px)",
  pointerEvents: "none" as const,
};

const headerCompact = {
  position: "relative" as const,
  zIndex: 2,
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 22,
  padding: "12px 14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap" as const,
  marginBottom: 14,
  backdropFilter: "blur(14px)",
  boxShadow: "0 12px 40px rgba(0,0,0,.28)",
};

const headerCompactLeft = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap" as const,
};

const compactIcon = {
  width: 46,
  height: 46,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  color: "#fff",
  fontWeight: 900,
  boxShadow: "0 12px 28px rgba(0,0,0,.25)",
};

const headerMiniTop = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 6,
  flexWrap: "wrap" as const,
};

const compactTitleRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap" as const,
};

const headerMiniBadge = {
  background: "rgba(124,58,237,.16)",
  border: "1px solid rgba(124,58,237,.28)",
  color: "#c4b5fd",
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
};

const headerMiniDivider = {
  color: "#475569",
  fontWeight: 900,
};

const headerMiniText = {
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 700,
};

const compactTitle = {
  margin: 0,
  color: "#fff",
  fontSize: 23,
  fontWeight: 900,
  lineHeight: 1,
};

const compactSubtitle = {
  margin: "6px 0 0",
  color: "#94a3b8",
  fontSize: 13,
  lineHeight: 1.5,
};

const headerCompactRight = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap" as const,
};

const miniStatCard = {
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(255,255,255,.06)",
  borderRadius: 16,
  padding: "10px 14px",
  display: "grid",
  gap: 2,
  minWidth: 78,
};

const miniStatValue = {
  color: "#fff",
  fontSize: 18,
  fontWeight: 900,
  lineHeight: 1,
};

const miniStatLabel = {
  color: "#94a3b8",
  fontSize: 11,
  fontWeight: 700,
};

const newCampaignButton = {
  border: "none",
  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
  color: "#fff",
  borderRadius: 16,
  padding: "12px 16px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(124,58,237,.28)",
};

const headerPremium = {
  position: "relative" as const,
  zIndex: 2,
  background:
    "radial-gradient(circle at top left, rgba(219,39,119,0.55), transparent 34%), radial-gradient(circle at center left, rgba(190,24,93,0.38), transparent 42%), linear-gradient(135deg,#be0fa0 0%,#5b164f 34%,#07111f 72%,#08111f 100%)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 32,
  padding: 32,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 24,
  flexWrap: "wrap" as const,
  marginBottom: 28,
  overflow: "hidden",
  boxShadow:
    "0 24px 70px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.08)",
};

const headerLeft = {
  display: "flex",
  alignItems: "center",
  gap: 22,
  flexWrap: "wrap" as const,
};

const headerMiniCard = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 24,
  padding: 16,
  display: "flex",
  alignItems: "center",
  gap: 14,
  backdropFilter: "blur(12px)",
};

const miniLogo = {
  width: 70,
  height: 70,
  borderRadius: 20,
  overflow: "hidden",
  background: "linear-gradient(135deg,#db2777,#7c3aed)",
  boxShadow: "0 18px 35px rgba(219,39,119,0.32)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontWeight: 900,
  fontSize: 28,
};

const miniCardTitle = {
  display: "block",
  color: "#fff",
  fontSize: 15,
  fontWeight: 900,
};

const miniCardSub = {
  display: "block",
  color: "#94a3b8",
  marginTop: 4,
  fontSize: 13,
};

const badgeOverline = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(139,92,246,0.18)",
  color: "#ddd6fe",
  border: "1px solid rgba(167,139,250,0.34)",
  padding: "8px 14px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 16,
};

const tituloHeader = {
  margin: 0,
  color: "#fff",
  fontSize: 42,
  fontWeight: 900,
  lineHeight: 1,
};

const subtituloHeader = {
  marginTop: 12,
  color: "#94a3b8",
  maxWidth: 720,
  lineHeight: 1.6,
  fontSize: 15,
};

const linhaBadgesHeader = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap" as const,
  marginTop: 20,
};

const badgeEmpresa = {
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: "8px 14px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

const badgeModulo = {
  background: "rgba(14,165,233,0.14)",
  color: "#7dd3fc",
  border: "1px solid rgba(14,165,233,0.28)",
  padding: "8px 14px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

const badgeStatus = {
  background: "rgba(34,197,94,0.14)",
  color: "#86efac",
  border: "1px solid rgba(34,197,94,0.28)",
  padding: "8px 14px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

const headerButtons = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap" as const,
};

const botaoHeaderClaro = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: 16,
  fontWeight: 800,
  cursor: "pointer",
};

const botaoHeaderRoxo = {
  border: "none",
  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: 16,
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 30px rgba(124,58,237,0.35)",
};

const botaoHeaderSair = {
  border: "none",
  background: "rgba(239,68,68,0.16)",
  color: "#fca5a5",
  padding: "12px 18px",
  borderRadius: 16,
  fontWeight: 900,
  cursor: "pointer",
};

const gridCards = {
  position: "relative" as const,
  zIndex: 2,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
  marginBottom: 18,
};

const metricCard = {
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: 14,
  boxShadow: "0 18px 45px rgba(0,0,0,0.30)",
};

const metricIcon = {
  fontSize: 20,
};

const metricLabel = {
  margin: "8px 0 4px",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 800,
};

const metricValue = {
  display: "block",
  color: "#fff",
  fontSize: 24,
  fontWeight: 950,
};

const metricHint = {
  color: "#64748b",
  fontWeight: 700,
};

const contentGrid = {
  position: "relative" as const,
  zIndex: 2,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 24,
  alignItems: "flex-start",
  marginBottom: 24,
};

const formPanel = {
  background: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 28,
  padding: 26,
  boxShadow: "0 20px 55px rgba(0,0,0,0.35)",
};

const sidePanel = {
  display: "grid",
  gap: 18,
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 22,
};

const sectionKicker = {
  display: "inline-block",
  color: "#a78bfa",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase" as const,
  letterSpacing: 0.8,
  marginBottom: 8,
};

const sectionTitle = {
  margin: 0,
  color: "#fff",
  fontSize: 26,
  fontWeight: 950,
};

const sectionSubtitle = {
  margin: "8px 0 0",
  color: "#94a3b8",
  lineHeight: 1.6,
};

const statusPill = {
  background: "rgba(34,197,94,0.14)",
  color: "#86efac",
  border: "1px solid rgba(34,197,94,0.28)",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap" as const,
};

const formHeaderActions = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap" as const,
};

const botaoFecharFormulario = {
  width: 36,
  height: 36,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#e5e7eb",
  fontSize: 22,
  lineHeight: 1,
  fontWeight: 900,
  cursor: "pointer",
};

const quickCreatePanel = {
  position: "relative" as const,
  zIndex: 2,
  background: "rgba(15,23,42,0.86)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 24,
  padding: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap" as const,
  marginBottom: 18,
  boxShadow: "0 16px 42px rgba(0,0,0,0.28)",
};

const quickCreateLeft = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  minWidth: 0,
};

const quickCreatePlus = {
  width: 46,
  height: 46,
  minWidth: 46,
  border: "none",
  borderRadius: 16,
  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
  color: "#fff",
  fontSize: 24,
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(124,58,237,0.30)",
};

const quickCreateTitle = {
  margin: 0,
  color: "#fff",
  fontSize: 22,
  fontWeight: 950,
};

const quickCreateText = {
  margin: "6px 0 0",
  color: "#94a3b8",
  fontSize: 13,
  lineHeight: 1.5,
  maxWidth: 620,
};

const quickCreateButton = {
  border: "none",
  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
  color: "#fff",
  padding: "12px 16px",
  borderRadius: 16,
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(124,58,237,0.28)",
};

const formGrid = {
  display: "grid",
  gap: 16,
};

const label = {
  display: "block",
  color: "#e5e7eb",
  fontSize: 13,
  fontWeight: 900,
  marginBottom: 8,
};

const input = {
  width: "100%",
  background: "rgba(2,6,23,0.72)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#fff",
  borderRadius: 16,
  padding: "13px 14px",
  fontWeight: 700,
  outline: "none",
  boxSizing: "border-box" as const,
};

const hint = {
  margin: "7px 0 0",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 700,
};

const gridDois = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const actionsRow = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap" as const,
};

const botaoPrincipal = {
  flex: 1,
  minWidth: 180,
  border: "none",
  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
  color: "#fff",
  padding: "14px 18px",
  borderRadius: 16,
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 14px 35px rgba(124,58,237,0.35)",
};

const botaoSecundario = {
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#e5e7eb",
  padding: "14px 18px",
  borderRadius: 16,
  fontWeight: 900,
  cursor: "pointer",
};

const sideCard = {
  background: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 28,
  padding: 24,
};

const sideTitle = {
  margin: 0,
  color: "#fff",
  fontSize: 20,
  fontWeight: 950,
};

const analyticsBadge = {
  background: "rgba(34,197,94,0.14)",
  color: "#86efac",
  border: "1px solid rgba(34,197,94,0.28)",
  padding: "7px 11px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const analyticsList = {
  display: "grid",
  gap: 12,
};

const analyticsItem = {
  background: "rgba(2,6,23,0.55)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 18,
  padding: 16,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const analyticsValue = {
  display: "block",
  color: "#fff",
  fontSize: 24,
  fontWeight: 950,
};

const analyticsLabel = {
  display: "block",
  color: "#94a3b8",
  fontSize: 13,
  marginTop: 4,
};

const analyticsEmoji = {
  fontSize: 22,
};

const sideCardGradient = {
  background:
    "linear-gradient(135deg, rgba(124,58,237,0.28), rgba(14,165,233,0.16))",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 28,
  padding: 24,
};

const automationBadge = {
  display: "inline-block",
  background: "rgba(255,255,255,0.10)",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const automationTitle = {
  color: "#fff",
  fontSize: 24,
  fontWeight: 950,
  margin: "18px 0 10px",
};

const automationText = {
  color: "#cbd5e1",
  lineHeight: 1.6,
};

const automationTags = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap" as const,
  marginTop: 18,
};

const automationTag = {
  background: "rgba(255,255,255,0.10)",
  color: "#fff",
  padding: "8px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

const alertaAniversario = {
  background: "rgba(245,158,11,0.14)",
  border: "1px solid rgba(245,158,11,0.28)",
  color: "#fde68a",
  borderRadius: 18,
  padding: 16,
  display: "grid",
  gap: 6,
};

const servicosPromocaoBox = {
  background: "rgba(2,6,23,0.55)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  padding: 16,
};

const servicosPromocaoHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
};

const badgeQuantidadeServicos = {
  background: "rgba(124,58,237,0.16)",
  color: "#c4b5fd",
  border: "1px solid rgba(124,58,237,0.28)",
  padding: "7px 11px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap" as const,
};

const emptyBox = {
  background: "rgba(2,6,23,0.55)",
  border: "1px dashed rgba(255,255,255,0.16)",
  color: "#94a3b8",
  borderRadius: 18,
  padding: 22,
  textAlign: "center" as const,
  fontWeight: 800,
};

const servicosPromocaoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 10,
};

const servicoPromocaoSelecionado = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "flex-start",
  gap: 5,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(124,58,237,0.70)",
  background: "rgba(124,58,237,0.18)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

const servicoPromocaoNaoSelecionado = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "flex-start",
  gap: 5,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(15,23,42,0.75)",
  color: "#cbd5e1",
  cursor: "pointer",
  fontWeight: 800,
};

const historicoSection = {
  position: "relative" as const,
  zIndex: 2,
  background: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 28,
  padding: 26,
  boxShadow: "0 20px 55px rgba(0,0,0,0.35)",
};

const promocoesGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 18,
};

const cardPromocao = {
  position: "relative" as const,
  overflow: "hidden",
  background: "rgba(2,6,23,0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 24,
  padding: 20,
};

const cardGlow = {
  position: "absolute" as const,
  top: -80,
  right: -80,
  width: 180,
  height: 180,
  borderRadius: "50%",
  background: "rgba(124,58,237,0.18)",
  filter: "blur(45px)",
  pointerEvents: "none" as const,
};

const cardTop = {
  position: "relative" as const,
  zIndex: 2,
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
};

const linhaBadgesCard = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap" as const,
  marginBottom: 12,
};

const badgeTipo = {
  background: "rgba(14,165,233,0.14)",
  color: "#7dd3fc",
  border: "1px solid rgba(14,165,233,0.28)",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
};

const badgeAtiva = {
  background: "rgba(34,197,94,0.14)",
  color: "#86efac",
  border: "1px solid rgba(34,197,94,0.28)",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
};

const badgeInativa = {
  background: "rgba(148,163,184,0.14)",
  color: "#cbd5e1",
  border: "1px solid rgba(148,163,184,0.24)",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
};

const tituloPromocao = {
  margin: 0,
  color: "#fff",
  fontSize: 20,
  fontWeight: 950,
};

const descricaoPromocao = {
  margin: "8px 0 0",
  color: "#94a3b8",
  lineHeight: 1.5,
};

const descontoCard = {
  minWidth: 110,
  background: "rgba(124,58,237,0.14)",
  border: "1px solid rgba(124,58,237,0.28)",
  borderRadius: 18,
  padding: 14,
  textAlign: "center" as const,
};

const descontoLabel = {
  display: "block",
  color: "#c4b5fd",
  fontSize: 11,
  fontWeight: 900,
};

const descontoValor = {
  display: "block",
  color: "#fff",
  fontSize: 20,
  fontWeight: 950,
  marginTop: 4,
};

const timelineInfo = {
  position: "relative" as const,
  zIndex: 2,
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: 12,
  marginTop: 18,
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 18,
  padding: 14,
};

const timelineItem = {
  display: "grid",
  gap: 4,
};

const timelineLabel = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 900,
  textTransform: "uppercase" as const,
};

const timelineValue = {
  color: "#e5e7eb",
  fontSize: 13,
  fontWeight: 900,
};

const timelineDivider = {
  width: 1,
  height: 34,
  background: "rgba(255,255,255,0.10)",
};

const servicosPromocaoLista = {
  position: "relative" as const,
  zIndex: 2,
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 8,
  marginTop: 14,
};

const badgeServicoPromocao = {
  background: "rgba(124,58,237,0.16)",
  color: "#c4b5fd",
  border: "1px solid rgba(124,58,237,0.28)",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const badgeSemServico = {
  background: "rgba(239,68,68,0.14)",
  color: "#fca5a5",
  border: "1px solid rgba(239,68,68,0.28)",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const whatsappInfoBox = {
  position: "relative" as const,
  zIndex: 2,
  marginTop: 16,
  display: "grid",
  gap: 8,
};

const whatsappLinha = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  color: "#94a3b8",
  fontSize: 13,
  fontWeight: 800,
};

const acoesCard = {
  position: "relative" as const,
  zIndex: 2,
  display: "flex",
  gap: 10,
  flexWrap: "wrap" as const,
  marginTop: 18,
};

const botaoWhatsapp = {
  border: "none",
  background: "linear-gradient(135deg,#22c55e,#16a34a)",
  color: "#fff",
  padding: "11px 14px",
  borderRadius: 14,
  fontWeight: 950,
  cursor: "pointer",
};

const botaoEditar = {
  border: "none",
  background: "linear-gradient(135deg,#0ea5e9,#2563eb)",
  color: "#fff",
  padding: "11px 14px",
  borderRadius: 14,
  fontWeight: 950,
  cursor: "pointer",
};

const botaoExcluir = {
  border: "none",
  background: "rgba(239,68,68,0.16)",
  color: "#fca5a5",
  padding: "11px 14px",
  borderRadius: 14,
  fontWeight: 950,
  cursor: "pointer",
};
const usoUnicoCard: CSSProperties = {
  gridColumn: "1 / -1",
  display: "flex",
  gap: 14,
  alignItems: "flex-start",
  padding: 18,
  borderRadius: 20,
  background: "rgba(34,197,94,0.08)",
  border: "1px solid rgba(34,197,94,0.18)",
  color: "#dcfce7",
  cursor: "pointer",
};

const usoUnicoCheckbox: CSSProperties = {
  width: 18,
  height: 18,
  marginTop: 3,
  accentColor: "#22c55e",
};

const badgeUsoUnicoCpf: CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(34,197,94,0.13)",
  color: "#bbf7d0",
  border: "1px solid rgba(34,197,94,0.22)",
  fontSize: 11,
  fontWeight: 900,
};

const botaoAtivar = {
  background: "rgba(34,197,94,.15)",
  border: "1px solid rgba(34,197,94,.35)",
  color: "#86efac",
  borderRadius: 14,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const botaoInativar = {
  background: "rgba(239,68,68,.15)",
  border: "1px solid rgba(239,68,68,.35)",
  color: "#fca5a5",
  borderRadius: 14,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};


function LicencaBloqueada({ empresa, usuario, modulo }: any) {
  return (
    <PremiumLayout empresa={empresa} usuario={usuario}>
      <main style={{ minHeight: '100vh', padding: 24, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #020617, #0f172a)' }}>
        <section style={{ width: 'min(560px, 100%)', borderRadius: 28, padding: 28, background: 'linear-gradient(145deg, rgba(15,23,42,0.96), rgba(30,41,59,0.88))', border: '1px solid rgba(248,113,113,0.24)', boxShadow: '0 24px 70px rgba(0,0,0,0.36)', color: '#fff', textAlign: 'center' }}>
          <div style={{ width: 58, height: 58, margin: '0 auto 14px', borderRadius: 20, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #f97316, #7c3aed)', fontSize: 26 }}>🔒</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 28, letterSpacing: '-0.04em' }}>{modulo} bloqueado temporariamente</h1>
          <p style={{ margin: '0 0 18px', color: '#cbd5e1', lineHeight: 1.6, fontWeight: 700 }}>
            Este recurso foi bloqueado devido ao atraso da assinatura. Regularize sua mensalidade para liberar novamente este módulo.
          </p>
          <a href="/planos" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, padding: '0 18px', borderRadius: 16, background: 'linear-gradient(135deg, #f97316, #7c3aed)', color: '#fff', textDecoration: 'none', fontWeight: 950 }}>
            Regularizar pagamento
          </a>
        </section>
      </main>
    </PremiumLayout>
  );
}
