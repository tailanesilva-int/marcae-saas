"use client";

import PremiumLayout from "@/components/layout/PremiumLayout";
import { gerarTemaEmpresa } from "@/app/lib/theme";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type PagamentoFechamento = {
  forma: string;
  valor: number;
};

type FinanceiroData = {
  resumo?: any;
  caixa?: any;
  formasPagamento?: PagamentoFechamento[];
  servicosMaisRentaveis?: any[];
  profissionaisMaisRentaveis?: any[];
  movimentacoesRecentes?: any[];
};

function formatarDataInputLocal(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export default function FinanceiroPage() {
  const hoje = formatarDataInputLocal();

  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvandoCaixa, setSalvandoCaixa] = useState(false);

  const [dataInicio, setDataInicio] = useState(hoje);
  const [dataFim, setDataFim] = useState(hoje);

  const [financeiro, setFinanceiro] = useState<FinanceiroData>({});
  const [saldoSugerido, setSaldoSugerido] = useState(0);
  const [observacaoConferencia, setObservacaoConferencia] = useState("");

  const [formCaixa, setFormCaixa] = useState({
    saldoInicial: "",
    saldoInformado: "",
    saldoDinheiroInformado: "",
    saldoPixInformado: "",
    saldoDebitoInformado: "",
    saldoCreditoInformado: "",
    saldoOutroInformado: "",
    observacao: "",
  });

  const [formMovimento, setFormMovimento] = useState({
    tipo: "entrada",
    categoria: "operacional",
    formaPagamento: "dinheiro",
    valor: "",
    descricao: "",
  });

  useEffect(() => {
    const empresaStorage = localStorage.getItem("empresaLogada");
    const usuarioStorage = localStorage.getItem("usuarioEmpresa");

    if (!empresaStorage || !usuarioStorage) {
      window.location.href = "/login";
      return;
    }

    const empresaLogada = JSON.parse(empresaStorage);
    const usuarioLogado = JSON.parse(usuarioStorage);

    setEmpresa(empresaLogada);
    setUsuario(usuarioLogado);

    carregarFinanceiro(empresaLogada.id, hoje, hoje);
  }, []);

  function usuarioPodeVerFinanceiro() {
    if (!usuario) return false;
    if (usuario.acessoTotal === true) return true;
    if (usuario.perfil === "admin") return true;
    if (usuario.permissoes?.financeiro === true) return true;
    if (usuario.permissoes?.visualizarFinanceiro === true) return true;

    return false;
  }

  function usuarioPodeConferirCaixa() {
    if (!usuario) return false;

    if (usuario.acessoTotal === true) return true;
    if (usuario.perfil === "admin") return true;

    if (usuario.permissoes?.conferirCaixa === true) return true;

    return false;
  }

  function usuarioPodeOperarFinanceiro() {
    if (!usuario) return false;

    if (usuario.acessoTotal === true) return true;
    if (usuario.perfil === "admin") return true;
    if (usuario.permissoes?.financeiro === true) return true;
    if (usuario.permissoes?.operarCaixa === true) return true;
    if (usuario.permissoes?.abrirCaixa === true) return true;
    if (usuario.permissoes?.registrarMovimentacoes === true) return true;
    if (usuario.permissoes?.fecharCaixa === true) return true;

    return false;
  }

  function dinheiro(valor: any) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function numero(valor: any) {
    if (valor === null || valor === undefined || valor === "") return 0;

    if (typeof valor === "number") return Number(valor || 0);

    return Number(String(valor).replace(",", ".")) || 0;
  }

  function corSaldo(valor: any) {
    const saldo = numero(valor);

    if (saldo > 0) return "#22c55e";
    if (saldo < 0) return "#ef4444";

    return "#94a3b8";
  }

  function dinheiroComSinal(valor: any) {
    const saldo = numero(valor);

    if (saldo > 0) return `+${dinheiro(saldo)}`;
    if (saldo < 0) return `-${dinheiro(Math.abs(saldo))}`;

    return dinheiro(0);
  }

  async function carregarFinanceiro(
    empresaId = empresa?.id,
    inicio = dataInicio,
    fim = dataFim,
  ) {
    if (!empresaId) return;

    try {
      setCarregando(true);

      const params = new URLSearchParams({
        empresaId,
        dataInicio: inicio,
        dataFim: fim,
      });

      const res = await fetch(`/api/financeiro/resumo?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Erro ao carregar financeiro.");
        return;
      }

      setFinanceiro({
        resumo: data.resumo || {},
        caixa: data.caixa || null,
        formasPagamento: data.formasPagamento || [],
        servicosMaisRentaveis: data.servicosMaisRentaveis || [],
        profissionaisMaisRentaveis: data.profissionaisMaisRentaveis || [],
        movimentacoesRecentes: data.movimentacoesRecentes || [],
      });

      if (!data.caixa && data.ultimoCaixaFechado) {
        const saldoAnterior = Number(
          data.ultimoCaixaFechado.saldoInformado || 0,
        );

        setSaldoSugerido(saldoAnterior);

        setFormCaixa((prev) => ({
          ...prev,
          saldoInicial:
            prev.saldoInicial && Number(prev.saldoInicial) > 0
              ? prev.saldoInicial
              : String(saldoAnterior),
        }));
      }
    } catch (error) {
      alert("Erro ao carregar financeiro.");
    } finally {
      setCarregando(false);
    }
  }

  function aplicarFiltro() {
    if (!dataInicio || !dataFim) {
      alert("Informe data inicial e final.");
      return;
    }

    if (dataInicio > dataFim) {
      alert("A data inicial não pode ser maior que a data final.");
      return;
    }

    carregarFinanceiro(empresa.id, dataInicio, dataFim);
  }

  function filtrarHoje() {
    setDataInicio(hoje);
    setDataFim(hoje);
    carregarFinanceiro(empresa.id, hoje, hoje);
  }

  function filtrarUltimosDias(dias: number) {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(fim.getDate() - dias + 1);

    const dataInicioFormatada = formatarDataInputLocal(inicio);
    const dataFimFormatada = formatarDataInputLocal(fim);

    setDataInicio(dataInicioFormatada);
    setDataFim(dataFimFormatada);

    carregarFinanceiro(empresa.id, dataInicioFormatada, dataFimFormatada);
  }

  async function abrirCaixa() {
    if (!empresa?.id) return;

    if (!usuarioPodeOperarFinanceiro()) {
      alert("Usuário sem permissão para operar o financeiro.");
      return;
    }

    const confirmar = window.confirm(
      `Deseja abrir o caixa de hoje com saldo inicial de ${dinheiro(
        numero(formCaixa.saldoInicial),
      )}?`,
    );

    if (!confirmar) return;

    try {
      setSalvandoCaixa(true);

      const res = await fetch("/api/financeiro/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: empresa.id,
          acao: "abrir",
          data: hoje,
          saldoInicial: formCaixa.saldoInicial,
          observacao: formCaixa.observacao,
          usuarioId: usuario?.id,
          usuarioNome: usuario?.nome || usuario?.email,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Erro ao abrir caixa.");
        return;
      }

      alert(data.message || "Caixa aberto com sucesso.");
      setFormCaixa({
        saldoInicial: "",
        saldoInformado: "",
        saldoDinheiroInformado: "",
        saldoPixInformado: "",
        saldoDebitoInformado: "",
        saldoCreditoInformado: "",
        saldoOutroInformado: "",
        observacao: "",
      });
      await carregarFinanceiro(empresa.id, dataInicio, dataFim);
    } catch (error) {
      alert("Erro ao abrir caixa.");
    } finally {
      setSalvandoCaixa(false);
    }
  }

  async function registrarMovimentacao() {
    if (!empresa?.id) return;

    if (!usuarioPodeOperarFinanceiro()) {
      alert("Usuário sem permissão para operar o financeiro.");
      return;
    }

    if (!financeiro.caixa || financeiro.caixa.status !== "aberto") {
      alert("Abra o caixa antes de registrar movimentações.");
      return;
    }

    if (numero(formMovimento.valor) <= 0) {
      alert("Informe o valor da movimentação.");
      return;
    }

    if (!formMovimento.descricao.trim()) {
      alert("Informe a descrição da movimentação.");
      return;
    }

    try {
      setSalvandoCaixa(true);

      const res = await fetch("/api/financeiro/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: empresa.id,
          acao: "movimentacao",
          data: hoje,
          tipo: formMovimento.tipo,
          categoria: formMovimento.categoria,
          formaPagamento: formMovimento.formaPagamento,
          valor: formMovimento.valor,
          descricao: formMovimento.descricao,
          usuarioId: usuario?.id,
          usuarioNome: usuario?.nome || usuario?.email,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Erro ao registrar movimentação.");
        return;
      }

      alert(data.message || "Movimentação registrada.");
      setFormMovimento({
        tipo: "entrada",
        categoria: "operacional",
        formaPagamento: "dinheiro",
        valor: "",
        descricao: "",
      });
      await carregarFinanceiro(empresa.id, dataInicio, dataFim);
    } catch (error) {
      alert("Erro ao registrar movimentação.");
    } finally {
      setSalvandoCaixa(false);
    }
  }

  function prepararMovimentacaoCaixa(tipo: string) {
    const configuracoes: Record<string, any> = {
      reforco: {
        categoria: "reforco_caixa",
        formaPagamento: "dinheiro",
        descricao: "Reforço de caixa",
      },
      sangria: {
        categoria: "sangria",
        formaPagamento: "dinheiro",
        descricao: "Sangria de caixa",
      },
      saida: {
        categoria: "despesa_operacional",
        formaPagamento: "dinheiro",
        descricao: "Saída operacional",
      },
      entrada: {
        categoria: "entrada_manual",
        formaPagamento: "dinheiro",
        descricao: "Entrada manual",
      },
    };

    const config = configuracoes[tipo] || configuracoes.entrada;

    setFormMovimento({
      tipo,
      categoria: config.categoria,
      formaPagamento: config.formaPagamento,
      valor: "",
      descricao: config.descricao,
    });
  }

  async function fecharCaixa() {
    if (!empresa?.id) return;

    if (!usuarioPodeOperarFinanceiro()) {
      alert("Usuário sem permissão para operar o financeiro.");
      return;
    }

    if (!financeiro.caixa || financeiro.caixa.status !== "aberto") {
      alert("Não existe caixa aberto.");
      return;
    }

    const totalInformado =
      numero(formCaixa.saldoDinheiroInformado) +
      numero(formCaixa.saldoPixInformado) +
      numero(formCaixa.saldoDebitoInformado) +
      numero(formCaixa.saldoCreditoInformado) +
      numero(formCaixa.saldoOutroInformado);

    const confirmar = window.confirm(
      `Deseja enviar o fechamento às cegas?

Total informado pelo operador: ${dinheiro(totalInformado)}

Os valores esperados e diferenças ficarão disponíveis somente para conferência gerencial.`,
    );

    if (!confirmar) return;

    try {
      setSalvandoCaixa(true);

      const res = await fetch("/api/financeiro/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: empresa.id,
          acao: "fechar",
          data: hoje,
          saldoInformado: totalInformado,
          saldoDinheiroInformado: formCaixa.saldoDinheiroInformado,
          saldoPixInformado: formCaixa.saldoPixInformado,
          saldoDebitoInformado: formCaixa.saldoDebitoInformado,
          saldoCreditoInformado: formCaixa.saldoCreditoInformado,
          saldoOutroInformado: formCaixa.saldoOutroInformado,
          observacao: formCaixa.observacao,
          usuarioId: usuario?.id,
          usuarioNome: usuario?.nome || usuario?.email,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Erro ao fechar caixa.");
        return;
      }

      alert(data.message || "Caixa fechado.");
      setFormCaixa({
        saldoInicial: "",
        saldoInformado: "",
        saldoDinheiroInformado: "",
        saldoPixInformado: "",
        saldoDebitoInformado: "",
        saldoCreditoInformado: "",
        saldoOutroInformado: "",
        observacao: "",
      });
      await carregarFinanceiro(empresa.id, dataInicio, dataFim);
    } catch (error) {
      alert("Erro ao fechar caixa.");
    } finally {
      setSalvandoCaixa(false);
    }
  }

  async function aprovarConferenciaCaixa() {
    if (!empresa?.id) return;

    if (!usuarioPodeConferirCaixa()) {
      alert("Usuário sem permissão para conferir caixa.");
      return;
    }

    if (!financeiro.caixa) {
      alert("Caixa não encontrado.");
      return;
    }

    const confirmar = window.confirm(
      "Deseja aprovar a conferência deste fechamento de caixa?",
    );

    if (!confirmar) return;

    try {
      setSalvandoCaixa(true);

      const res = await fetch("/api/financeiro/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: empresa.id,
          acao: "aprovar_conferencia",
          caixaId: financeiro.caixa.id,
          data: financeiro.caixa?.data
            ? formatarDataInputLocal(new Date(financeiro.caixa.data))
            : hoje,
          observacaoConferencia,
          usuarioId: usuario?.id,
          usuarioNome: usuario?.nome || usuario?.email,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Erro ao aprovar conferência.");
        return;
      }

      alert(data.message || "Conferência aprovada.");
      setObservacaoConferencia("");
      await carregarFinanceiro(empresa.id, dataInicio, dataFim);
    } catch (error) {
      alert("Erro ao aprovar conferência.");
    } finally {
      setSalvandoCaixa(false);
    }
  }

  const tema = gerarTemaEmpresa(empresa || {});

  const chartRecebimentos = useMemo(() => {
    const resumo = financeiro.resumo || {};

    return [
      {
        nome: "Recebido",
        total: numero(resumo.recebidoPeriodo || resumo.recebidoOperacional),
      },
      {
        nome: "Pendente",
        total: numero(resumo.pendenteOperacional),
      },
      {
        nome: "Comissões",
        total: numero(resumo.comissoesPendentes),
      },
      {
        nome: "Débitos clientes",
        total: numero(resumo.debitoClientes),
      },
    ];
  }, [financeiro]);

  const pieData = (financeiro.formasPagamento || []).map((item) => ({
    name: item.forma,
    value: numero(item.valor),
  }));

  if (!empresa || !usuario) {
    return <p style={{ padding: 40 }}>Carregando...</p>;
  }

  if (!usuarioPodeVerFinanceiro()) {
    return (
      <PremiumLayout empresa={empresa} usuario={usuario}>
        <main style={pageShell}>
          <div style={bloqueadoBox}>
            <span style={sectionKicker}>ACESSO RESTRITO</span>
            <h1 style={pageTitle}>Financeiro bloqueado</h1>
            <p style={pageDescription}>
              Seu usuário não possui permissão para visualizar o módulo
              financeiro. Solicite liberação para um administrador.
            </p>
          </div>
        </main>
      </PremiumLayout>
    );
  }

  return (
    <PremiumLayout empresa={empresa} usuario={usuario}>
      <main
        className="financeiro-mobile-safe"
        style={
          {
            ...pageShell,
            "--marcae-primary": tema.primary,
            "--marcae-secondary": tema.secondary,
            "--marcae-sidebar": tema.sidebar,
          } as React.CSSProperties
        }
      >
        <style jsx global>{`
          html,
          body {
            max-width: 100%;
            overflow-x: hidden;
          }

          .financeiro-mobile-safe {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
            box-sizing: border-box;
          }

          .financeiro-mobile-safe *,
          .financeiro-mobile-safe *::before,
          .financeiro-mobile-safe *::after {
            box-sizing: border-box;
          }

          .financeiro-mobile-safe input,
          .financeiro-mobile-safe select,
          .financeiro-mobile-safe textarea,
          .financeiro-mobile-safe button {
            max-width: 100%;
          }

          @media (max-width: 1180px) {
            .financeiro-mobile-safe {
              padding: 14px 12px 112px !important;
            }

            .financeiro-hero-mobile,
            .financeiro-filter-mobile,
            .financeiro-panel-large-mobile,
            .financeiro-panel-side-mobile {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              overflow-x: hidden !important;
            }

            .financeiro-main-grid-mobile,
            .financeiro-charts-grid-mobile,
            .financeiro-bottom-grid-mobile {
              grid-template-columns: 1fr !important;
              width: 100% !important;
              max-width: 100% !important;
              gap: 12px !important;
            }

            .financeiro-filter-mobile,
            .financeiro-caixa-resumo-mobile,
            .financeiro-operacoes-grid-mobile,
            .financeiro-movimento-form-mobile,
            .financeiro-modalidades-grid-mobile,
            .financeiro-fechado-grid-mobile,
            .financeiro-conferencia-grid-mobile,
            .financeiro-resumo-final-mobile,
            .financeiro-fechamento-acoes-mobile,
            .financeiro-form-grid-mobile {
              grid-template-columns: 1fr 1fr !important;
            }

            .financeiro-kpi-mobile {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 8px !important;
              overflow-x: hidden !important;
              padding: 0 !important;
            }

            .financeiro-kpi-mobile > * {
              min-width: 0 !important;
            }

            .financeiro-chart-box-mobile {
              width: 100% !important;
              min-width: 0 !important;
              overflow: hidden !important;
            }
          }

          @media (max-width: 760px) {
            .financeiro-mobile-safe {
              padding: 10px 8px 126px !important;
            }

            .financeiro-hero-mobile {
              padding: 12px !important;
              border-radius: 20px !important;
              align-items: stretch !important;
            }

            .financeiro-hero-mobile h1 {
              font-size: 27px !important;
              line-height: 1.05 !important;
            }

            .financeiro-hero-mobile p {
              font-size: 12.5px !important;
            }

            .financeiro-hero-mobile > div:first-child,
            .financeiro-hero-mobile > div:last-child {
              width: 100% !important;
            }

            .financeiro-hero-mobile > div:last-child {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 8px !important;
            }

            .financeiro-filter-mobile,
            .financeiro-caixa-resumo-mobile,
            .financeiro-operacoes-grid-mobile,
            .financeiro-movimento-form-mobile,
            .financeiro-modalidades-grid-mobile,
            .financeiro-fechado-grid-mobile,
            .financeiro-conferencia-grid-mobile,
            .financeiro-resumo-final-mobile,
            .financeiro-fechamento-acoes-mobile,
            .financeiro-form-grid-mobile {
              grid-template-columns: 1fr !important;
            }

            .financeiro-filter-mobile,
            .financeiro-panel-large-mobile,
            .financeiro-panel-side-mobile {
              padding: 12px !important;
              border-radius: 20px !important;
            }

            .financeiro-filter-mobile > div:first-child,
            .financeiro-filter-mobile > div:last-child {
              display: grid !important;
              grid-template-columns: 1fr !important;
              width: 100% !important;
            }

            .financeiro-panel-header-mobile,
            .financeiro-mobile-safe [style*="justify-content: space-between"] {
              min-width: 0 !important;
            }

            .financeiro-panel-header-mobile {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .financeiro-panel-header-mobile > span {
              width: fit-content !important;
            }

            .financeiro-movimento-form-mobile > div,
            .financeiro-fechamento-acoes-mobile > input,
            .financeiro-fechamento-acoes-mobile > button,
            .financeiro-form-grid-mobile > input,
            .financeiro-form-grid-mobile > button {
              grid-column: auto !important;
              width: 100% !important;
            }

            .financeiro-mobile-safe button {
              min-height: 42px !important;
            }

            .financeiro-modalidades-grid-mobile > *,
            .financeiro-operacoes-grid-mobile > *,
            .financeiro-caixa-resumo-mobile > *,
            .financeiro-fechado-grid-mobile > *,
            .financeiro-conferencia-grid-mobile > *,
            .financeiro-resumo-final-mobile > * {
              min-width: 0 !important;
            }

            .financeiro-ranking-item-mobile,
            .financeiro-timeline-item-mobile {
              grid-template-columns: 1fr !important;
              gap: 8px !important;
              align-items: flex-start !important;
            }

            .financeiro-ranking-item-mobile > span,
            .financeiro-timeline-item-mobile > div:first-child {
              display: none !important;
            }

            .financeiro-ranking-item-mobile b,
            .financeiro-timeline-item-mobile b {
              justify-self: start !important;
            }

            .financeiro-chart-box-mobile {
              height: 200px !important;
            }
          }

          @media (max-width: 430px) {
            .financeiro-hero-mobile > div:last-child {
              grid-template-columns: 1fr !important;
            }

            .financeiro-kpi-mobile {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .financeiro-kpi-mobile > * {
              min-width: 0 !important;
            }
          }
        `}</style>
        <header className="financeiro-hero-mobile" style={heroFinanceiro}>
          <div style={financeiroHeaderLeft}>
            <div style={financeiroHeaderIcon}>💰</div>

            <div style={financeiroHeaderTextBox}>
              <div style={financeiroHeaderMeta}>
                <span style={financeiroMetaBadge}>Financeiro</span>
                <span style={financeiroMetaDot}>•</span>
                <span style={financeiroMetaText}>Caixa & controle diário</span>
              </div>

              <h1 style={pageTitle}>Financeiro</h1>

              <p style={pageDescription}>
                Recebimentos, pendências, caixa e conferência em uma visão
                operacional.
              </p>
            </div>
          </div>

          <div style={financeiroHeaderRight}>
            <div style={financeiroHeaderMiniStat}>
              <strong>
                {dinheiro(
                  financeiro.resumo?.recebidoPeriodo ||
                    financeiro.resumo?.recebidoOperacional,
                )}
              </strong>
              <span>Recebido</span>
            </div>

            <div style={financeiroHeaderMiniStat}>
              <strong>
                {dinheiro(financeiro.resumo?.pendenteOperacional)}
              </strong>
              <span>Pendente</span>
            </div>

            <span
              style={{
                ...financeiroCaixaBadge,
                background:
                  financeiro.caixa?.status === "aberto"
                    ? "rgba(34,197,94,0.14)"
                    : financeiro.caixa?.status === "fechado"
                      ? "rgba(148,163,184,0.14)"
                      : "rgba(245,158,11,0.14)",
                color:
                  financeiro.caixa?.status === "aberto"
                    ? "#86efac"
                    : financeiro.caixa?.status === "fechado"
                      ? "#cbd5e1"
                      : "#fde68a",
                borderColor:
                  financeiro.caixa?.status === "aberto"
                    ? "rgba(34,197,94,0.28)"
                    : financeiro.caixa?.status === "fechado"
                      ? "rgba(148,163,184,0.24)"
                      : "rgba(245,158,11,0.28)",
              }}
            >
              {financeiro.caixa?.status === "aberto"
                ? "Caixa aberto"
                : financeiro.caixa?.status === "fechado"
                  ? "Caixa fechado"
                  : "Caixa não aberto"}
            </span>
          </div>
        </header>

        <section className="financeiro-filter-mobile" style={filterCard}>
          <div style={filterQuickActions}>
            <button onClick={filtrarHoje} style={buttonGhost}>
              Hoje
            </button>
            <button onClick={() => filtrarUltimosDias(7)} style={buttonGhost}>
              7 dias
            </button>
            <button onClick={() => filtrarUltimosDias(30)} style={buttonGhost}>
              30 dias
            </button>
          </div>

          <div style={filterDateGroup}>
            <div>
              <label style={label}>Inicial</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                style={input}
              />
            </div>

            <div>
              <label style={label}>Final</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                style={input}
              />
            </div>

            <button onClick={aplicarFiltro} style={buttonPrimary}>
              Buscar
            </button>
          </div>
        </section>

        {carregando ? (
          <div style={loadingBox}>Carregando dados financeiros...</div>
        ) : (
          <>
            <section className="financeiro-kpi-mobile" style={kpiGrid}>
              <FinanceCard
                titulo="Recebido no período"
                valor={dinheiro(
                  financeiro.resumo?.recebidoPeriodo ||
                    financeiro.resumo?.recebidoOperacional,
                )}
                descricao="Pagamentos confirmados e lançamentos recebidos."
                cor="#22c55e"
              />

              <FinanceCard
                titulo="Pendente operacional"
                valor={dinheiro(financeiro.resumo?.pendenteOperacional)}
                descricao="Valores ainda não quitados em atendimentos."
                cor="#f59e0b"
              />

              <FinanceCard
                titulo="Saldo clientes"
                valor={dinheiroComSinal(financeiro.resumo?.saldoClientes)}
                descricao="Créditos menos débitos ativos dos clientes."
                cor={corSaldo(financeiro.resumo?.saldoClientes)}
              />

              <FinanceCard
                titulo="Comissões pendentes"
                valor={dinheiro(financeiro.resumo?.comissoesPendentes)}
                descricao="Repasse ainda pendente para profissionais."
                cor="#a855f7"
              />
            </section>

            <section className="financeiro-main-grid-mobile" style={mainGrid}>
              <div className="financeiro-panel-large-mobile" style={panelLarge}>
                <div
                  className="financeiro-panel-header-mobile"
                  style={panelHeader}
                >
                  <div>
                    <span style={sectionKicker}>CAIXA OPERACIONAL</span>
                    <h2 style={panelTitle}>Caixa do dia</h2>
                    <p style={panelText}>
                      Abra o caixa, registre reforços, sangrias, saídas e faça o
                      fechamento diário.
                    </p>
                  </div>

                  <span
                    style={{
                      ...statusPill,
                      background:
                        financeiro.caixa?.status === "aberto"
                          ? "rgba(34,197,94,0.14)"
                          : financeiro.caixa?.status === "fechado"
                            ? "rgba(148,163,184,0.14)"
                            : "rgba(245,158,11,0.14)",
                      color:
                        financeiro.caixa?.status === "aberto"
                          ? "#86efac"
                          : financeiro.caixa?.status === "fechado"
                            ? "#cbd5e1"
                            : "#fde68a",
                    }}
                  >
                    {financeiro.caixa?.status === "aberto"
                      ? "Caixa aberto"
                      : financeiro.caixa?.status === "fechado"
                        ? "Caixa fechado"
                        : "Caixa não aberto"}
                  </span>
                </div>

                <div
                  className="financeiro-caixa-resumo-mobile"
                  style={caixaResumoGrid}
                >
                  <ResumoCaixaItem
                    label="Saldo inicial"
                    valor={dinheiro(financeiro.caixa?.saldoInicial)}
                  />
                  <ResumoCaixaItem
                    label="Entradas manuais"
                    valor={dinheiro(financeiro.resumo?.entradasManuais)}
                    positivo
                  />
                  <ResumoCaixaItem
                    label="Saídas/Sangrias"
                    valor={dinheiro(financeiro.resumo?.saidasManuais)}
                    negativo
                  />
                  {usuarioPodeConferirCaixa() ? (
                    <ResumoCaixaItem
                      label="Saldo esperado"
                      valor={dinheiro(financeiro.resumo?.saldoCaixaSistema)}
                      destaque
                    />
                  ) : (
                    <ResumoCaixaItem
                      label="Caixa em operação"
                      valor="Fechamento às cegas"
                      destaque
                    />
                  )}
                </div>

                {financeiro.caixa?.status !== "aberto" && (
                  <div style={actionBox}>
                    <h3 style={actionTitle}>Abrir caixa</h3>
                    <p style={panelText}>
                      Informe o troco inicial para iniciar o controle do dia.
                    </p>

                    {saldoSugerido > 0 && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: "10px 14px",
                          borderRadius: 14,
                          background: "rgba(34,197,94,0.10)",
                          border: "1px solid rgba(34,197,94,0.22)",
                          color: "#bbf7d0",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        Último fechamento encontrado:
                        <strong style={{ marginLeft: 6 }}>
                          {dinheiro(saldoSugerido)}
                        </strong>
                        <div
                          style={{
                            marginTop: 4,
                            color: "#86efac",
                            fontSize: 12,
                          }}
                        >
                          Você pode manter este valor ou alterar antes de abrir
                          o caixa.
                        </div>
                      </div>
                    )}

                    <div
                      className="financeiro-form-grid-mobile"
                      style={formGrid}
                    >
                      <input
                        value={formCaixa.saldoInicial}
                        onChange={(e) =>
                          setFormCaixa({
                            ...formCaixa,
                            saldoInicial: e.target.value,
                          })
                        }
                        placeholder="Saldo inicial"
                        style={input}
                      />

                      <input
                        value={formCaixa.observacao}
                        onChange={(e) =>
                          setFormCaixa({
                            ...formCaixa,
                            observacao: e.target.value,
                          })
                        }
                        placeholder="Observação da abertura"
                        style={input}
                      />

                      <button
                        disabled={salvandoCaixa}
                        onClick={abrirCaixa}
                        style={buttonPrimary}
                      >
                        Abrir caixa
                      </button>
                    </div>
                  </div>
                )}

                {financeiro.caixa?.status === "aberto" && (
                  <>
                    <div style={actionBoxDestaque}>
                      <div style={operacaoHeader}>
                        <div>
                          <span style={sectionKicker}>OPERAÇÕES DO CAIXA</span>
                          <h3 style={actionTitle}>
                            Escolha o tipo de lançamento
                          </h3>
                          <p style={panelText}>
                            Separe reforços, sangrias, saídas e entradas manuais
                            para evitar erro no fechamento.
                          </p>
                        </div>

                        <span style={operacaoBadge}>Caixa aberto</span>
                      </div>

                      <div
                        className="financeiro-operacoes-grid-mobile"
                        style={operacoesCaixaGrid}
                      >
                        <OperacaoCaixaCard
                          ativo={formMovimento.tipo === "reforco"}
                          icone="💰"
                          titulo="Reforço de caixa"
                          descricao="Dinheiro adicionado ao caixa para troco ou operação."
                          cor="#22c55e"
                          onClick={() => prepararMovimentacaoCaixa("reforco")}
                        />

                        <OperacaoCaixaCard
                          ativo={formMovimento.tipo === "sangria"}
                          icone="🔻"
                          titulo="Sangria"
                          descricao="Retirada de dinheiro do caixa durante o expediente."
                          cor="#ef4444"
                          onClick={() => prepararMovimentacaoCaixa("sangria")}
                        />

                        <OperacaoCaixaCard
                          ativo={formMovimento.tipo === "saida"}
                          icone="💸"
                          titulo="Saída operacional"
                          descricao="Pagamento de despesa, fornecedor ou custo interno."
                          cor="#f59e0b"
                          onClick={() => prepararMovimentacaoCaixa("saida")}
                        />

                        <OperacaoCaixaCard
                          ativo={formMovimento.tipo === "entrada"}
                          icone="➕"
                          titulo="Entrada manual"
                          descricao="Entrada avulsa que não veio de atendimento."
                          cor="#06b6d4"
                          onClick={() => prepararMovimentacaoCaixa("entrada")}
                        />
                      </div>

                      <div
                        className="financeiro-movimento-form-mobile"
                        style={movimentoFormBox}
                      >
                        <div>
                          <label style={label}>Tipo selecionado</label>
                          <select
                            value={formMovimento.tipo}
                            onChange={(e) =>
                              prepararMovimentacaoCaixa(e.target.value)
                            }
                            style={input}
                          >
                            <option value="reforco">Reforço de caixa</option>
                            <option value="sangria">Sangria</option>
                            <option value="saida">Saída operacional</option>
                            <option value="entrada">Entrada manual</option>
                          </select>
                        </div>

                        <div>
                          <label style={label}>Categoria</label>
                          <select
                            value={formMovimento.categoria}
                            onChange={(e) =>
                              setFormMovimento({
                                ...formMovimento,
                                categoria: e.target.value,
                              })
                            }
                            style={input}
                          >
                            {formMovimento.tipo === "reforco" && (
                              <option value="reforco_caixa">
                                Reforço de caixa
                              </option>
                            )}

                            {formMovimento.tipo === "sangria" && (
                              <option value="sangria">Sangria</option>
                            )}

                            {formMovimento.tipo === "entrada" && (
                              <option value="entrada_manual">
                                Entrada manual
                              </option>
                            )}

                            {formMovimento.tipo === "saida" && (
                              <>
                                <option value="despesa_operacional">
                                  Despesa operacional
                                </option>
                                <option value="fornecedor">Fornecedor</option>
                                <option value="material">
                                  Material/insumos
                                </option>
                                <option value="manutencao">Manutenção</option>
                                <option value="marketing">Marketing</option>
                                <option value="comissao_manual">
                                  Comissão manual
                                </option>
                                <option value="outros">Outros</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div>
                          <label style={label}>Forma</label>
                          <select
                            value={formMovimento.formaPagamento}
                            onChange={(e) =>
                              setFormMovimento({
                                ...formMovimento,
                                formaPagamento: e.target.value,
                              })
                            }
                            style={input}
                          >
                            <option value="dinheiro">Dinheiro</option>
                            <option value="pix">Pix</option>
                            <option value="debito">Cartão débito</option>
                            <option value="credito">Cartão crédito</option>
                            <option value="outro">Outro</option>
                          </select>
                        </div>

                        <div>
                          <label style={label}>Valor</label>
                          <input
                            value={formMovimento.valor}
                            onChange={(e) =>
                              setFormMovimento({
                                ...formMovimento,
                                valor: e.target.value,
                              })
                            }
                            placeholder="Ex: 50,00"
                            style={input}
                          />
                        </div>

                        <div style={{ gridColumn: "span 2" }}>
                          <label style={label}>Descrição</label>
                          <input
                            value={formMovimento.descricao}
                            onChange={(e) =>
                              setFormMovimento({
                                ...formMovimento,
                                descricao: e.target.value,
                              })
                            }
                            placeholder="Descreva o motivo da movimentação"
                            style={input}
                          />
                        </div>

                        <button
                          disabled={salvandoCaixa}
                          onClick={registrarMovimentacao}
                          style={buttonOperacaoConfirmar}
                        >
                          Registrar{" "}
                          {formMovimento.tipo === "reforco"
                            ? "reforço"
                            : formMovimento.tipo === "sangria"
                              ? "sangria"
                              : formMovimento.tipo === "saida"
                                ? "saída"
                                : "entrada"}
                        </button>
                      </div>
                    </div>

                    <div style={fechamentoModalidadesBox}>
                      <div style={operacaoHeader}>
                        <div>
                          <span style={sectionKicker}>FECHAMENTO ÀS CEGAS</span>
                          <h3 style={actionTitle}>
                            Fechamento do caixa diário
                          </h3>
                          <p style={panelText}>
                            Informe somente os valores contados por modalidade.
                            O esperado e as diferenças ficam disponíveis apenas
                            para conferência gerencial.
                          </p>
                        </div>
                      </div>

                      <div
                        className="financeiro-modalidades-grid-mobile"
                        style={modalidadesFechamentoGrid}
                      >
                        <FechamentoModalidadeItem
                          titulo="Dinheiro"
                          esperado={dinheiro(
                            financeiro.caixa?.saldoDinheiroSistema,
                          )}
                          mostrarEsperado={false}
                          informado={formCaixa.saldoDinheiroInformado}
                          onChange={(valor: string) =>
                            setFormCaixa({
                              ...formCaixa,
                              saldoDinheiroInformado: valor,
                            })
                          }
                          diferenca={dinheiroComSinal(
                            numero(formCaixa.saldoDinheiroInformado) -
                              numero(financeiro.caixa?.saldoDinheiroSistema),
                          )}
                          corDiferenca={corSaldo(
                            numero(formCaixa.saldoDinheiroInformado) -
                              numero(financeiro.caixa?.saldoDinheiroSistema),
                          )}
                        />

                        <FechamentoModalidadeItem
                          titulo="Pix"
                          esperado={dinheiro(financeiro.caixa?.saldoPixSistema)}
                          mostrarEsperado={false}
                          informado={formCaixa.saldoPixInformado}
                          onChange={(valor: string) =>
                            setFormCaixa({
                              ...formCaixa,
                              saldoPixInformado: valor,
                            })
                          }
                          diferenca={dinheiroComSinal(
                            numero(formCaixa.saldoPixInformado) -
                              numero(financeiro.caixa?.saldoPixSistema),
                          )}
                          corDiferenca={corSaldo(
                            numero(formCaixa.saldoPixInformado) -
                              numero(financeiro.caixa?.saldoPixSistema),
                          )}
                        />

                        <FechamentoModalidadeItem
                          titulo="Cartão débito"
                          esperado={dinheiro(
                            financeiro.caixa?.saldoDebitoSistema,
                          )}
                          mostrarEsperado={false}
                          informado={formCaixa.saldoDebitoInformado}
                          onChange={(valor: string) =>
                            setFormCaixa({
                              ...formCaixa,
                              saldoDebitoInformado: valor,
                            })
                          }
                          diferenca={dinheiroComSinal(
                            numero(formCaixa.saldoDebitoInformado) -
                              numero(financeiro.caixa?.saldoDebitoSistema),
                          )}
                          corDiferenca={corSaldo(
                            numero(formCaixa.saldoDebitoInformado) -
                              numero(financeiro.caixa?.saldoDebitoSistema),
                          )}
                        />

                        <FechamentoModalidadeItem
                          titulo="Cartão crédito"
                          esperado={dinheiro(
                            financeiro.caixa?.saldoCreditoSistema,
                          )}
                          mostrarEsperado={false}
                          informado={formCaixa.saldoCreditoInformado}
                          onChange={(valor: string) =>
                            setFormCaixa({
                              ...formCaixa,
                              saldoCreditoInformado: valor,
                            })
                          }
                          diferenca={dinheiroComSinal(
                            numero(formCaixa.saldoCreditoInformado) -
                              numero(financeiro.caixa?.saldoCreditoSistema),
                          )}
                          corDiferenca={corSaldo(
                            numero(formCaixa.saldoCreditoInformado) -
                              numero(financeiro.caixa?.saldoCreditoSistema),
                          )}
                        />

                        <FechamentoModalidadeItem
                          titulo="Outros"
                          esperado={dinheiro(
                            financeiro.caixa?.saldoOutroSistema,
                          )}
                          mostrarEsperado={false}
                          informado={formCaixa.saldoOutroInformado}
                          onChange={(valor: string) =>
                            setFormCaixa({
                              ...formCaixa,
                              saldoOutroInformado: valor,
                            })
                          }
                          diferenca={dinheiroComSinal(
                            numero(formCaixa.saldoOutroInformado) -
                              numero(financeiro.caixa?.saldoOutroSistema),
                          )}
                          corDiferenca={corSaldo(
                            numero(formCaixa.saldoOutroInformado) -
                              numero(financeiro.caixa?.saldoOutroSistema),
                          )}
                        />
                      </div>

                      <div
                        className="financeiro-fechamento-acoes-mobile"
                        style={fechamentoAcoesGrid}
                      >
                        <input
                          value={formCaixa.observacao}
                          onChange={(e) =>
                            setFormCaixa({
                              ...formCaixa,
                              observacao: e.target.value,
                            })
                          }
                          placeholder="Observação do fechamento"
                          style={input}
                        />

                        <button
                          disabled={salvandoCaixa}
                          onClick={fecharCaixa}
                          style={buttonDanger}
                        >
                          Fechar caixa
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {financeiro.caixa?.status === "fechado" && (
                  <div style={closedBox}>
                    <strong>Caixa fechado</strong>
                    <div style={{ color: "#cbd5e1", fontWeight: 800 }}>
                      Fechado por:{" "}
                      <b>
                        {financeiro.caixa?.fechadoPorNome || "Não informado"}
                      </b>
                      {" · "}
                      {financeiro.caixa?.fechadoEm
                        ? new Date(financeiro.caixa.fechadoEm).toLocaleString(
                            "pt-BR",
                          )
                        : "Data/hora não informada"}
                    </div>
                    <span>
                      Informado: {dinheiro(financeiro.caixa?.saldoInformado)} ·
                      Diferença total:{" "}
                      <b
                        style={{
                          color: corSaldo(
                            numero(financeiro.caixa?.saldoInformado) -
                              numero(financeiro.caixa?.saldoSistema),
                          ),
                        }}
                      >
                        {dinheiroComSinal(
                          numero(financeiro.caixa?.saldoInformado) -
                            numero(financeiro.caixa?.saldoSistema),
                        )}
                      </b>
                    </span>

                    <div
                      className="financeiro-fechado-grid-mobile"
                      style={fechamentoFechadoGrid}
                    >
                      <ResumoCaixaItem
                        label="Dinheiro"
                        valor={`${dinheiro(financeiro.caixa?.saldoDinheiroInformado)} / ${dinheiro(financeiro.caixa?.saldoDinheiroSistema)}`}
                        cor={corSaldo(financeiro.caixa?.diferencaDinheiro)}
                      />
                      <ResumoCaixaItem
                        label="Pix"
                        valor={`${dinheiro(financeiro.caixa?.saldoPixInformado)} / ${dinheiro(financeiro.caixa?.saldoPixSistema)}`}
                        cor={corSaldo(financeiro.caixa?.diferencaPix)}
                      />
                      <ResumoCaixaItem
                        label="Débito"
                        valor={`${dinheiro(financeiro.caixa?.saldoDebitoInformado)} / ${dinheiro(financeiro.caixa?.saldoDebitoSistema)}`}
                        cor={corSaldo(financeiro.caixa?.diferencaDebito)}
                      />
                      <ResumoCaixaItem
                        label="Crédito"
                        valor={`${dinheiro(financeiro.caixa?.saldoCreditoInformado)} / ${dinheiro(financeiro.caixa?.saldoCreditoSistema)}`}
                        cor={corSaldo(financeiro.caixa?.diferencaCredito)}
                      />
                      <ResumoCaixaItem
                        label="Outros"
                        valor={`${dinheiro(financeiro.caixa?.saldoOutroInformado)} / ${dinheiro(financeiro.caixa?.saldoOutroSistema)}`}
                        cor={corSaldo(financeiro.caixa?.diferencaOutro)}
                      />
                    </div>

                    {financeiro.caixa?.conferenciaStatus === "aprovado" ? (
                      <div
                        style={{
                          marginTop: 16,
                          padding: 16,
                          borderRadius: 18,
                          background: "rgba(34,197,94,0.12)",
                          border: "1px solid rgba(34,197,94,0.24)",
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <strong style={{ color: "#86efac" }}>
                          Conferência aprovada
                        </strong>

                        <span style={{ color: "#cbd5e1" }}>
                          Conferido por:{" "}
                          <b>
                            {financeiro.caixa?.conferidoPorNome ||
                              "Não informado"}
                          </b>
                        </span>

                        <span style={{ color: "#94a3b8" }}>
                          {financeiro.caixa?.conferidoEm
                            ? new Date(
                                financeiro.caixa.conferidoEm,
                              ).toLocaleString("pt-BR")
                            : ""}
                        </span>

                        {financeiro.caixa?.observacaoConferencia && (
                          <div
                            style={{
                              marginTop: 8,
                              color: "#e2e8f0",
                            }}
                          >
                            Observação: {financeiro.caixa.observacaoConferencia}
                          </div>
                        )}
                      </div>
                    ) : usuarioPodeConferirCaixa() ? (
                      <div
                        style={{
                          marginTop: 18,
                          padding: 12,
                          borderRadius: 20,
                          background: "rgba(168,85,247,0.10)",
                          border: "1px solid rgba(168,85,247,0.22)",
                          display: "grid",
                          gap: 12,
                        }}
                      >
                        <strong style={{ color: "#fff" }}>
                          Conferência gerencial do fechamento
                        </strong>

                        <div
                          className="financeiro-conferencia-grid-mobile"
                          style={conferenciaResumoGrid}
                        >
                          <ResumoCaixaItem
                            label="Dinheiro"
                            valor={`${dinheiro(financeiro.caixa?.saldoDinheiroInformado)} / ${dinheiro(financeiro.caixa?.saldoDinheiroSistema)}`}
                            cor={corSaldo(financeiro.caixa?.diferencaDinheiro)}
                          />
                          <ResumoCaixaItem
                            label="Pix"
                            valor={`${dinheiro(financeiro.caixa?.saldoPixInformado)} / ${dinheiro(financeiro.caixa?.saldoPixSistema)}`}
                            cor={corSaldo(financeiro.caixa?.diferencaPix)}
                          />
                          <ResumoCaixaItem
                            label="Débito"
                            valor={`${dinheiro(financeiro.caixa?.saldoDebitoInformado)} / ${dinheiro(financeiro.caixa?.saldoDebitoSistema)}`}
                            cor={corSaldo(financeiro.caixa?.diferencaDebito)}
                          />
                          <ResumoCaixaItem
                            label="Crédito"
                            valor={`${dinheiro(financeiro.caixa?.saldoCreditoInformado)} / ${dinheiro(financeiro.caixa?.saldoCreditoSistema)}`}
                            cor={corSaldo(financeiro.caixa?.diferencaCredito)}
                          />
                          <ResumoCaixaItem
                            label="Outros"
                            valor={`${dinheiro(financeiro.caixa?.saldoOutroInformado)} / ${dinheiro(financeiro.caixa?.saldoOutroSistema)}`}
                            cor={corSaldo(financeiro.caixa?.diferencaOutro)}
                          />
                        </div>

                        <div
                          className="financeiro-resumo-final-mobile"
                          style={fechamentoResumoFinal}
                        >
                          <ResumoCaixaItem
                            label="Total esperado"
                            valor={dinheiro(financeiro.caixa?.saldoSistema)}
                            destaque
                          />
                          <ResumoCaixaItem
                            label="Total informado"
                            valor={dinheiro(financeiro.caixa?.saldoInformado)}
                            positivo
                          />
                          <ResumoCaixaItem
                            label="Diferença total"
                            valor={dinheiroComSinal(
                              numero(financeiro.caixa?.saldoInformado) -
                                numero(financeiro.caixa?.saldoSistema),
                            )}
                            cor={corSaldo(
                              numero(financeiro.caixa?.saldoInformado) -
                                numero(financeiro.caixa?.saldoSistema),
                            )}
                          />
                        </div>

                        <textarea
                          value={observacaoConferencia}
                          onChange={(e) =>
                            setObservacaoConferencia(e.target.value)
                          }
                          placeholder="Observação da conferência"
                          style={{
                            ...input,
                            minHeight: 90,
                            paddingTop: 14,
                          }}
                        />

                        <button
                          disabled={salvandoCaixa}
                          onClick={aprovarConferenciaCaixa}
                          style={buttonGhostGreen}
                        >
                          Aprovar conferência
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          marginTop: 16,
                          padding: 16,
                          borderRadius: 18,
                          background: "rgba(245,158,11,0.10)",
                          border: "1px solid rgba(245,158,11,0.24)",
                          color: "#fde68a",
                          fontWeight: 800,
                        }}
                      >
                        Aguardando conferência gerencial.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {usuarioPodeConferirCaixa() && (
                <aside
                  className="financeiro-panel-side-mobile"
                  style={panelSide}
                >
                  <span style={sectionKicker}>FORMAS DE PAGAMENTO</span>
                  <h2 style={panelTitle}>Como o dinheiro entrou</h2>

                  {pieData.length === 0 ? (
                    <div style={emptyBox}>
                      Nenhum pagamento encontrado no período.
                    </div>
                  ) : (
                    <>
                      <div
                        className="financeiro-chart-box-mobile"
                        style={{ height: 190 }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={58}
                              outerRadius={86}
                              paddingAngle={4}
                            >
                              {pieData.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={corFormaPagamento(_.name)}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any) => dinheiro(value)}
                              contentStyle={tooltipStyle}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div style={formasList}>
                        {(financeiro.formasPagamento || []).map((item) => (
                          <div key={item.forma} style={formaRow}>
                            <span style={formaLabel}>
                              <i
                                style={{
                                  ...formaColorDot,
                                  background: corFormaPagamento(item.forma),
                                }}
                              />
                              {item.forma}
                            </span>
                            <strong>{dinheiro(item.valor)}</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </aside>
              )}
            </section>

            <section
              className="financeiro-charts-grid-mobile"
              style={chartsGrid}
            >
              <div className="financeiro-panel-large-mobile" style={panelLarge}>
                <div
                  className="financeiro-panel-header-mobile"
                  style={panelHeader}
                >
                  <div>
                    <span style={sectionKicker}>VISÃO DO PERÍODO</span>
                    <h2 style={panelTitle}>Recebido, pendente e obrigações</h2>
                  </div>
                </div>

                <div
                  className="financeiro-chart-box-mobile"
                  style={{ height: 210 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartRecebimentos}>
                      <defs>
                        <linearGradient
                          id="financeiroGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--marcae-primary)"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--marcae-primary)"
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="nome" stroke="rgba(255,255,255,0.45)" />
                      <Tooltip
                        formatter={(value: any) => dinheiro(value)}
                        contentStyle={tooltipStyle}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="var(--marcae-primary)"
                        fillOpacity={1}
                        fill="url(#financeiroGradient)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="financeiro-panel-side-mobile" style={panelSide}>
                <span style={sectionKicker}>CONTA FINANCEIRA CLIENTES</span>
                <h2 style={panelTitle}>Créditos e débitos</h2>

                <div style={clienteFinanceiroBox}>
                  <ResumoCaixaItem
                    label="Créditos ativos"
                    valor={dinheiro(financeiro.resumo?.creditoClientes)}
                    positivo
                  />
                  <ResumoCaixaItem
                    label="Débitos abertos"
                    valor={dinheiro(financeiro.resumo?.debitoClientes)}
                    negativo
                  />
                  <ResumoCaixaItem
                    label="Saldo consolidado"
                    valor={dinheiroComSinal(financeiro.resumo?.saldoClientes)}
                    destaque
                    cor={corSaldo(financeiro.resumo?.saldoClientes)}
                  />
                </div>

                <a href="/clientes" style={{ textDecoration: "none" }}>
                  <button
                    style={{ ...buttonGhost, width: "100%", marginTop: 16 }}
                  >
                    Abrir clientes
                  </button>
                </a>
              </div>
            </section>

            <section
              className="financeiro-bottom-grid-mobile"
              style={bottomGrid}
            >
              <RankingPanel
                titulo="Serviços mais rentáveis"
                subtitulo="Ranking por valor gerado no período"
                itens={financeiro.servicosMaisRentaveis || []}
                dinheiro={dinheiro}
              />

              <RankingPanel
                titulo="Profissionais mais rentáveis"
                subtitulo="Ranking por valor gerado no período"
                itens={financeiro.profissionaisMaisRentaveis || []}
                dinheiro={dinheiro}
              />

              <div className="financeiro-panel-side-mobile" style={panelSide}>
                <span style={sectionKicker}>MOVIMENTAÇÕES RECENTES</span>
                <h2 style={panelTitle}>Linha do tempo</h2>

                {(financeiro.movimentacoesRecentes || []).length === 0 ? (
                  <div style={emptyBox}>Nenhuma movimentação no período.</div>
                ) : (
                  <div style={timelineList}>
                    {(financeiro.movimentacoesRecentes || []).map((item) => (
                      <div
                        key={`${item.origem}-${item.id}`}
                        className="financeiro-timeline-item-mobile"
                        style={timelineItem}
                      >
                        <div
                          style={{
                            ...timelineDot,
                            background:
                              item.tipo === "saida" || item.tipo === "sangria"
                                ? "#ef4444"
                                : "#22c55e",
                          }}
                        />
                        <div>
                          <strong>{item.descricao}</strong>
                          <span>
                            {new Date(item.data).toLocaleString("pt-BR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                        <b
                          style={{
                            color:
                              item.tipo === "saida" || item.tipo === "sangria"
                                ? "#fca5a5"
                                : "#86efac",
                          }}
                        >
                          {item.tipo === "saida" || item.tipo === "sangria"
                            ? `-${dinheiro(item.valor)}`
                            : dinheiro(item.valor)}
                        </b>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </PremiumLayout>
  );
}

function OperacaoCaixaCard({
  ativo,
  icone,
  titulo,
  descricao,
  cor,
  onClick,
}: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...operacaoCaixaCard,
        borderColor: ativo ? `${cor}88` : "rgba(255,255,255,0.08)",
        background: ativo
          ? `linear-gradient(180deg, ${cor}22, rgba(15,23,42,0.88))`
          : "rgba(15,23,42,0.64)",
        boxShadow: ativo ? `0 18px 46px ${cor}22` : "none",
      }}
    >
      <span style={{ ...operacaoIcone, background: `${cor}22`, color: cor }}>
        {icone}
      </span>

      <strong>{titulo}</strong>

      <small style={operacaoDescricao}>{descricao}</small>

      <em style={{ color: cor }}>{ativo ? "Selecionado" : "Selecionar"}</em>
    </button>
  );
}

function FechamentoModalidadeItem({
  titulo,
  esperado,
  informado,
  onChange,
  diferenca,
  corDiferenca,
  mostrarEsperado,
}: any) {
  return (
    <div style={fechamentoModalidadeItem}>
      <div style={fechamentoModalidadeHeader}>
        <strong>{titulo}</strong>

        {mostrarEsperado ? (
          <span>Esperado: {esperado}</span>
        ) : (
          <span
            style={{
              color: "#94a3b8",
              fontSize: 12,
            }}
          >
            Conferência às cegas
          </span>
        )}
      </div>

      <input
        value={informado}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Valor conferido"
        style={input}
      />

      {mostrarEsperado && (
        <small style={{ color: corDiferenca }}>Diferença: {diferenca}</small>
      )}
    </div>
  );
}

function FinanceCard({ titulo, valor, descricao, cor }: any) {
  return (
    <div style={financeCard} title={descricao}>
      <div style={{ ...financeIcon, background: `${cor}22`, color: cor }}>
        ●
      </div>

      <div style={financeCardContent}>
        <span style={financeCardLabel}>{titulo}</span>
        <strong style={{ ...financeCardValue, color: cor }}>{valor}</strong>
      </div>
    </div>
  );
}

function ResumoCaixaItem({
  label,
  valor,
  positivo,
  negativo,
  destaque,
  cor,
}: any) {
  return (
    <div
      style={{
        ...resumoCaixaItem,
        borderColor: destaque
          ? "rgba(168,85,247,0.34)"
          : "rgba(255,255,255,0.08)",
        background: destaque ? "rgba(168,85,247,0.10)" : "rgba(15,23,42,0.60)",
      }}
    >
      <span style={resumoCaixaLabel}>{label}</span>
      <strong
        style={{
          ...resumoCaixaValor,
          color:
            cor || (positivo ? "#22c55e" : negativo ? "#ef4444" : "#f8fafc"),
        }}
      >
        {valor}
      </strong>
    </div>
  );
}

function RankingPanel({ titulo, subtitulo, itens, dinheiro }: any) {
  return (
    <div className="financeiro-panel-side-mobile" style={panelSide}>
      <span style={sectionKicker}>RANKING</span>
      <h2 style={panelTitle}>{titulo}</h2>
      <p style={panelText}>{subtitulo}</p>

      {itens.length === 0 ? (
        <div style={emptyBox}>Sem dados suficientes no período.</div>
      ) : (
        <div style={rankingList}>
          {itens.map((item: any, index: number) => (
            <div key={item.nome} style={rankingItem}>
              <span>{index + 1}</span>
              <div>
                <strong>{item.nome}</strong>
                <small>{item.quantidade} atendimento(s)</small>
              </div>
              <b>{dinheiro(item.valor)}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const mapaCorFormaPagamento: Record<string, string> = {
  Dinheiro: "#22c55e",
  Pix: "#06b6d4",
  "Cartão débito": "#8b5cf6",
  "Cartão crédito": "#f59e0b",
  "Mercado Pago": "#ec4899",
  "Link de pagamento": "#38bdf8",
  Outro: "#94a3b8",
  "Não informado": "#64748b",
};

function corFormaPagamento(nome: string) {
  return mapaCorFormaPagamento[nome] || "#a855f7";
}

const pageShell: React.CSSProperties = {
  minHeight: "100vh",
  padding: 22,
  color: "#f8fafc",
};

const heroFinanceiro: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 22,
  padding: "14px 16px",
  marginBottom: 12,
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 16px 44px rgba(0,0,0,0.26)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
  backdropFilter: "blur(14px)",
};

const financeiroHeaderLeft: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  minWidth: 0,
};

const financeiroHeaderIcon: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary))",
  color: "#fff",
  fontSize: 20,
  boxShadow: "0 10px 20px var(--marcae-glow)",
  flex: "0 0 auto",
};

const financeiroHeaderTextBox: React.CSSProperties = {
  minWidth: 0,
};

const financeiroHeaderMeta: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 5,
};

const financeiroMetaBadge: React.CSSProperties = {
  background: "rgba(124,58,237,0.16)",
  border: "1px solid rgba(124,58,237,0.28)",
  color: "#c4b5fd",
  padding: "5px 9px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 950,
};

const financeiroMetaDot: React.CSSProperties = {
  color: "#475569",
  fontWeight: 950,
};

const financeiroMetaText: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 800,
};

const financeiroHeaderRight: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 10,
  flexWrap: "wrap",
};

const financeiroHeaderMiniStat: React.CSSProperties = {
  minWidth: 96,
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: "8px 10px",
  display: "grid",
  gap: 3,
};

const financeiroCaixaBadge: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 999,
  padding: "7px 10px",
  fontSize: 12,
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const filterQuickActions: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const filterDateGroup: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) auto",
  gap: 10,
  alignItems: "end",
};

const heroGlowA: React.CSSProperties = {
  position: "absolute",
  width: 360,
  height: 360,
  borderRadius: "50%",
  background: "var(--marcae-primary-soft)",
  filter: "blur(90px)",
  top: -180,
  right: -100,
};

const heroGlowB: React.CSSProperties = {
  position: "absolute",
  width: 320,
  height: 320,
  borderRadius: "50%",
  background: "rgba(34,197,94,0.18)",
  filter: "blur(100px)",
  bottom: -200,
  left: -80,
};

const sectionKicker: React.CSSProperties = {
  color: "#c084fc",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: "0.12em",
};

const pageTitle: React.CSSProperties = {
  margin: "4px 0 5px",
  fontSize: 30,
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  color: "#fff",
};

const pageDescription: React.CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  lineHeight: 1.45,
  maxWidth: 620,
  fontWeight: 700,
  fontSize: 13,
};

const heroActions: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const filterCard: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  alignItems: "end",
  gap: 12,
  background: "rgba(15,23,42,0.68)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 22,
  padding: 12,
  marginBottom: 12,
  boxShadow: "0 16px 42px rgba(0,0,0,0.22)",
};

const label: React.CSSProperties = {
  display: "block",
  color: "#cbd5e1",
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 8,
};

const input: React.CSSProperties = {
  width: "100%",
  minHeight: 38,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(2,6,23,0.70)",
  color: "#fff",
  borderRadius: 16,
  padding: "0 14px",
  outline: "none",
  fontWeight: 800,
};

const buttonPrimary: React.CSSProperties = {
  minHeight: 38,
  border: "none",
  borderRadius: 16,
  padding: "0 18px",
  background:
    "linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary))",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 16px 34px var(--marcae-glow)",
};

const buttonGhost: React.CSSProperties = {
  minHeight: 38,
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  padding: "0 16px",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const buttonGhostGreen: React.CSSProperties = {
  ...buttonGhost,
  border: "1px solid rgba(34,197,94,0.25)",
  background: "rgba(34,197,94,0.13)",
  color: "#bbf7d0",
};

const buttonDanger: React.CSSProperties = {
  ...buttonGhost,
  border: "1px solid rgba(239,68,68,0.30)",
  background: "rgba(239,68,68,0.16)",
  color: "#fecaca",
};

const kpiGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 8,
  marginBottom: 12,
};

const financeCard: React.CSSProperties = {
  background: "rgba(15,23,42,0.76)",
  border: "1px solid rgba(255,255,255,0.075)",
  borderRadius: 16,
  padding: 11,
  boxShadow: "0 10px 26px rgba(0,0,0,0.20)",
  display: "grid",
  gridTemplateColumns: "24px minmax(0, 1fr)",
  alignItems: "center",
  gap: 9,
  minHeight: 62,
};

const financeIcon: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 0,
  fontSize: 11,
};

const financeCardContent: React.CSSProperties = {
  display: "grid",
  gap: 2,
  minWidth: 0,
};

const financeCardLabel: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 11,
  fontWeight: 900,
  lineHeight: 1.15,
};

const financeCardValue: React.CSSProperties = {
  display: "block",
  fontSize: 16,
  fontWeight: 950,
  lineHeight: 1.1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const mainGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.5fr 0.8fr",
  gap: 12,
  marginBottom: 14,
};

const chartsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 0.8fr",
  gap: 12,
  marginBottom: 14,
};

const bottomGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 18,
};

const panelLarge: React.CSSProperties = {
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 22,
  padding: 16,
  boxShadow: "0 22px 70px rgba(0,0,0,0.30)",
};

const panelSide: React.CSSProperties = {
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 22,
  padding: 16,
  boxShadow: "0 22px 70px rgba(0,0,0,0.30)",
};

const panelHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  marginBottom: 12,
};

const panelTitle: React.CSSProperties = {
  margin: "6px 0",
  color: "#fff",
  fontSize: 19,
  fontWeight: 950,
  letterSpacing: "-0.04em",
};

const panelText: React.CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  lineHeight: 1.4,
  fontWeight: 700,
};

const statusPill: React.CSSProperties = {
  borderRadius: 999,
  padding: "6px 10px",
  fontWeight: 950,
  fontSize: 12,
  border: "1px solid rgba(255,255,255,0.08)",
};

const caixaResumoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 12,
};

const resumoCaixaItem: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  padding: 10,
  display: "grid",
  gap: 6,
};

const resumoCaixaLabel: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 11,
  fontWeight: 900,
  lineHeight: 1.15,
};

const resumoCaixaValor: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 950,
  lineHeight: 1.15,
  wordBreak: "break-word",
};

const actionBox: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.035)",
  borderRadius: 14,
  padding: 10,
  marginTop: 10,
};

const actionTitle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#fff",
  fontWeight: 950,
  fontSize: 15,
};

const actionBoxDestaque: React.CSSProperties = {
  border: "1px solid rgba(168,85,247,0.20)",
  background:
    "linear-gradient(180deg, rgba(88,28,135,0.18), rgba(15,23,42,0.72))",
  borderRadius: 14,
  padding: 10,
  marginTop: 10,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

const operacaoHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  marginBottom: 10,
};

const operacaoBadge: React.CSSProperties = {
  borderRadius: 999,
  padding: "6px 10px",
  color: "#bbf7d0",
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.24)",
  fontWeight: 950,
  fontSize: 12,
  whiteSpace: "nowrap",
};

const operacoesCaixaGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 8,
  marginTop: 10,
};

const operacaoCaixaCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: 10,
  minHeight: 104,
  textAlign: "left",
  color: "#fff",
  cursor: "pointer",
  display: "grid",
  gap: 5,
  transition: ".2s ease",
  alignContent: "start",
};

const operacaoIcone: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 15,
};

const operacaoDescricao: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 11,
  lineHeight: 1.25,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const movimentoFormBox: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
  marginTop: 10,
  padding: 14,
  borderRadius: 20,
  background: "rgba(2,6,23,0.42)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const buttonOperacaoConfirmar: React.CSSProperties = {
  ...buttonPrimary,
  gridColumn: "span 3",
  minHeight: 42,
};

const fechamentoModalidadesBox: React.CSSProperties = {
  border: "1px solid rgba(239,68,68,0.20)",
  background:
    "linear-gradient(180deg, rgba(127,29,29,0.16), rgba(15,23,42,0.72))",
  borderRadius: 14,
  padding: 10,
  marginTop: 10,
};

const modalidadesFechamentoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 8,
  marginTop: 10,
};

const fechamentoModalidadeItem: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(2,6,23,0.42)",
  borderRadius: 14,
  padding: 10,
  display: "grid",
  gap: 10,
};

const fechamentoModalidadeHeader: React.CSSProperties = {
  display: "grid",
  gap: 4,
  color: "#f8fafc",
};

const fechamentoResumoFinal: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
  marginTop: 10,
};

const conferenciaResumoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 8,
  marginTop: 8,
};

const fechamentoAcoesGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 280px",
  gap: 8,
  marginTop: 10,
};

const fechamentoFechadoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 8,
  marginTop: 8,
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
  marginTop: 10,
};

const closedBox: React.CSSProperties = {
  border: "1px solid rgba(148,163,184,0.18)",
  background: "rgba(148,163,184,0.10)",
  borderRadius: 16,
  padding: 12,
  display: "grid",
  gap: 6,
  color: "#e2e8f0",
};

const formasList: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const formaRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  color: "#e2e8f0",
  fontWeight: 850,
};

const clienteFinanceiroBox: React.CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 10,
};

const rankingList: React.CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 10,
};

const rankingItem: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px 1fr auto",
  gap: 12,
  alignItems: "center",
  padding: 12,
  borderRadius: 18,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const timelineList: React.CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 10,
};

const timelineItem: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "12px 1fr auto",
  gap: 12,
  alignItems: "center",
  paddingBottom: 12,
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const timelineDot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  boxShadow: "0 0 18px currentColor",
};

const emptyBox: React.CSSProperties = {
  background: "rgba(255,255,255,0.035)",
  border: "1px dashed rgba(255,255,255,0.12)",
  borderRadius: 18,
  padding: 12,
  color: "#94a3b8",
  fontWeight: 800,
  marginTop: 14,
};

const loadingBox: React.CSSProperties = {
  background: "rgba(15,23,42,0.82)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 26,
  padding: 22,
  color: "#cbd5e1",
  fontWeight: 900,
};

const bloqueadoBox: React.CSSProperties = {
  maxWidth: 680,
  margin: "80px auto",
  padding: 34,
  borderRadius: 30,
  background: "rgba(15,23,42,0.86)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const tooltipStyle: React.CSSProperties = {
  background: "rgba(2,6,23,0.96)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  color: "#fff",
};

const formaLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const formaColorDot: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  display: "inline-block",
  flexShrink: 0,
};
