"use client";

import { useEffect, useMemo, useState } from "react";
import { getPublicBaseUrl } from "@/lib/links";
import { APP_CONFIG } from "@/lib/config";

function getBaseUrl() {
  return getPublicBaseUrl();
}

type UsuarioEmpresaResumo = {
  id: string;
  nome: string;
  email: string;
  perfil?: string | null;
  ativo?: boolean | null;
};

type Empresa = {
  id: string;
  nome: string;
  slug: string;
mercadoPagoAtivo?: boolean;
mercadoPagoAccessToken?: string | null;
mercadoPagoPublicKey?: string | null;
mercadoPagoModo?: string | null;
solicitouIntegracaoMp?: boolean | null;
  telefone?: string | null;
  whatsapp?: string | null;
  endereco?: string | null;
  responsavel?: string | null;
  observacoesInternas?: string | null;
  plano?: string | null;
  ativo: boolean;
  trialAtivo: boolean;
  trialExpiraEm?: string | null;
  assinaturaExpiraEm?: string | null;
  assinaturaProximaCobrancaEm?: string | null;
  valorMensalPersonalizado?: number | string | null;
  descontoMensal?: number | string | null;
  statusFinanceiro: string;
  bloqueadoPorInadimplencia: boolean;
  usuarios?: UsuarioEmpresaResumo[];
};

type Resumo = {
  totalEmpresas: number;
  empresasAtivas: number;
  inadimplentes: number;
  emTrial: number;
};

type FormEmpresa = {
  nome: string;
  slug: string;
  responsavel: string;
  whatsapp: string;
  rua: string;
  numero: string;
  estado: string;
  cidade: string;
  complemento: string;
  observacoesInternas: string;
  plano: string;
  valorMensalPersonalizado: string;
};

type HistoricoLog = {
  id: string;
  empresaId: string;
  tipo: string;
  motivo: string;
  criadoEm: string;
};

type HistoricoPagamento = {
  id: string;
  empresaId: string;
  valor: number | string;
  status: string;
  descricao?: string | null;
  criadoEm: string;
};

type HistoricoEmpresa = {
  empresa?: {
    id: string;
    nome: string;
    slug: string;
  };
  logs: HistoricoLog[];
  pagamentos: HistoricoPagamento[];
};

type ConfiguracaoPlanos = {
  valorPlanoBasico: string;
  valorPlanoPlus: string;
  valorPlanoPremium: string;
};

const formInicial: FormEmpresa = {
  nome: "",
  slug: "",
  responsavel: "",
  whatsapp: "",
  rua: "",
  numero: "",
  estado: "",
  cidade: "",
  complemento: "",
  observacoesInternas: "",
  plano: "basico",
  valorMensalPersonalizado: "0",
};

export default function MasterPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [resumo, setResumo] = useState<Resumo>({
    totalEmpresas: 0,
    empresasAtivas: 0,
    inadimplentes: 0,
    emTrial: 0,
  });

  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null);
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);
  const [dadosUltimoUsuario, setDadosUltimoUsuario] = useState<{
    login: string;
    email: string;
    senha: string;
  } | null>(null);

  const [formEmpresa, setFormEmpresa] = useState<FormEmpresa>(formInicial);

  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [empresaHistorico, setEmpresaHistorico] = useState<Empresa | null>(null);
  const [historico, setHistorico] = useState<HistoricoEmpresa>({
    logs: [],
    pagamentos: [],
  });
  const [abaHistorico, setAbaHistorico] = useState<"pagamentos" | "logs">(
    "pagamentos"
  );
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [erroHistorico, setErroHistorico] = useState("");
const [modalRecebimentoAberto, setModalRecebimentoAberto] =
  useState(false);

const [empresaRecebimento, setEmpresaRecebimento] =
  useState<Empresa | null>(null);

const [salvandoRecebimento, setSalvandoRecebimento] =
  useState(false);

const [formRecebimento, setFormRecebimento] = useState({
  ativo: false,
  accessToken: "",
  publicKey: "",
  ambiente: "sandbox",
});

const [configuracaoPlanos, setConfiguracaoPlanos] =
  useState<ConfiguracaoPlanos>({
    valorPlanoBasico: "49,90",
    valorPlanoPlus: "99,90",
    valorPlanoPremium: "149,90",
  });

const [salvandoConfiguracaoPlanos, setSalvandoConfiguracaoPlanos] =
  useState(false);

  useEffect(() => {
    carregar();
    carregarConfiguracaoPlanos();
  }, []);

  function atualizarConfiguracaoPlano(campo: keyof ConfiguracaoPlanos, valor: string) {
    setConfiguracaoPlanos((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function carregarConfiguracaoPlanos() {
    try {
      const res = await fetch("/api/master/configuracoes/planos", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar configuração dos planos.");
      }

      if (data.configuracao) {
        setConfiguracaoPlanos({
          valorPlanoBasico: String(data.configuracao.valorPlanoBasico || 0).replace(".", ","),
          valorPlanoPlus: String(data.configuracao.valorPlanoPlus || 0).replace(".", ","),
          valorPlanoPremium: String(data.configuracao.valorPlanoPremium || 0).replace(".", ","),
        });
      }
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao carregar preços dos planos.");
    }
  }

  async function salvarConfiguracaoPlanos() {
    try {
      setSalvandoConfiguracaoPlanos(true);
      setMensagem("");

      const res = await fetch("/api/master/configuracoes/planos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valorPlanoBasico: configuracaoPlanos.valorPlanoBasico,
          valorPlanoPlus: configuracaoPlanos.valorPlanoPlus,
          valorPlanoPremium: configuracaoPlanos.valorPlanoPremium,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar preços dos planos.");
      }

      setConfiguracaoPlanos({
        valorPlanoBasico: String(data.configuracao.valorPlanoBasico || 0).replace(".", ","),
        valorPlanoPlus: String(data.configuracao.valorPlanoPlus || 0).replace(".", ","),
        valorPlanoPremium: String(data.configuracao.valorPlanoPremium || 0).replace(".", ","),
      });

      setMensagem("Preços dos planos atualizados com sucesso.");
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao salvar preços dos planos.");
    } finally {
      setSalvandoConfiguracaoPlanos(false);
    }
  }

  async function carregar() {
    try {
      setCarregando(true);

      const res = await fetch("/api/master/empresas", {
        cache: "no-store",
      });

      const data = await res.json();

      setEmpresas(data.empresas || []);
      setResumo(
        data.resumo || {
          totalEmpresas: 0,
          empresasAtivas: 0,
          inadimplentes: 0,
          emTrial: 0,
        }
      );
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao carregar empresas.");
    } finally {
      setCarregando(false);
    }
  }

  function obterValorPlano(plano: string) {
  const planoNormalizado = String(plano || "").toLowerCase();

  if (planoNormalizado === "premium") {
    return configuracaoPlanos.valorPlanoPremium || "0";
  }

  if (planoNormalizado === "plus") {
    return configuracaoPlanos.valorPlanoPlus || "0";
  }

  if (planoNormalizado === "trial") {
    return "0";
  }

  return configuracaoPlanos.valorPlanoBasico || "0";
}

function atualizarForm(campo: keyof FormEmpresa, valor: string) {
  setFormEmpresa((atual) => {
    const atualizado = {
      ...atual,
      [campo]: valor,
    };

    if (campo === "plano") {
      atualizado.valorMensalPersonalizado =
        obterValorPlano(valor);
    }

    return atualizado;
  });
}

  function gerarSlugAutomatico(nome: string) {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function lerEndereco(endereco?: string | null) {
    if (!endereco) {
      return {
        rua: "",
        numero: "",
        estado: "",
        cidade: "",
        complemento: "",
      };
    }

    try {
      const dados = JSON.parse(endereco);

      return {
        rua: dados?.rua || "",
        numero: dados?.numero || "",
        estado: dados?.estado || "",
        cidade: dados?.cidade || "",
        complemento: dados?.complemento || "",
      };
    } catch {
      return {
        rua: endereco,
        numero: "",
        estado: "",
        cidade: "",
        complemento: "",
      };
    }
  }

  function formatarEndereco(endereco?: string | null) {
    const dados = lerEndereco(endereco);
    const partes = [
      dados.rua,
      dados.numero,
      dados.cidade,
      dados.estado,
      dados.complemento,
    ].filter(Boolean);

    return partes.length > 0 ? partes.join(", ") : "Endereço não informado";
  }

  function abrirCadastro() {
    setEmpresaEditando(null);
    setDadosUltimoUsuario(null);
    setFormEmpresa(formInicial);
    setModalCadastroAberto(true);
  }

  function abrirEdicao(empresa: Empresa) {
    const endereco = lerEndereco(empresa.endereco);
    const planoAtual =
      empresa.trialAtivo || empresa.plano === "trial"
        ? "trial"
        : empresa.plano || "basico";

    setDadosUltimoUsuario(null);
    setEmpresaEditando(empresa);
    setFormEmpresa({
      nome: empresa.nome || "",
      slug: empresa.slug || "",
      responsavel: empresa.responsavel || "",
      whatsapp: empresa.whatsapp || "",
      rua: endereco.rua,
      numero: endereco.numero,
      estado: endereco.estado,
      cidade: endereco.cidade,
      complemento: endereco.complemento,
      observacoesInternas: empresa.observacoesInternas || "",
      plano: planoAtual,
      valorMensalPersonalizado: String(empresa.valorMensalPersonalizado || 0),
    });
    setModalCadastroAberto(true);
  }

  function fecharModal() {
    setModalCadastroAberto(false);
    setEmpresaEditando(null);
    setFormEmpresa(formInicial);
  }

  function fecharHistorico() {
    setModalHistoricoAberto(false);
    setEmpresaHistorico(null);
    setHistorico({
      logs: [],
      pagamentos: [],
    });
    setErroHistorico("");
    setAbaHistorico("pagamentos");
  }

function abrirRecebimento(empresa: Empresa) {
  setEmpresaRecebimento(empresa);

  setFormRecebimento({
    ativo: empresa.mercadoPagoAtivo || false,
    accessToken: empresa.mercadoPagoAccessToken || "",
    publicKey: empresa.mercadoPagoPublicKey || "",
    ambiente: empresa.mercadoPagoModo || "sandbox",
  });

  setModalRecebimentoAberto(true);
}

function fecharRecebimento() {
  setModalRecebimentoAberto(false);
  setEmpresaRecebimento(null);

  setFormRecebimento({
    ativo: false,
    accessToken: "",
    publicKey: "",
    ambiente: "sandbox",
  });
}

  async function abrirHistorico(empresa: Empresa) {
    try {
      setEmpresaHistorico(empresa);
      setModalHistoricoAberto(true);
      setAbaHistorico("pagamentos");
      setCarregandoHistorico(true);
      setErroHistorico("");
      setHistorico({
        logs: [],
        pagamentos: [],
      });

      const res = await fetch(`/api/master/empresas/${empresa.id}/historico`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar histórico.");
      }

      setHistorico({
        empresa: data.empresa,
        logs: data.logs || [],
        pagamentos: data.pagamentos || [],
      });
    } catch (error: any) {
      console.error(error);
      setErroHistorico(error?.message || "Erro ao carregar histórico.");
    } finally {
      setCarregandoHistorico(false);
    }
  }

  async function salvarEmpresa(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSalvandoEmpresa(true);
      setMensagem("");
      setDadosUltimoUsuario(null);

      const valorNormalizado = String(
  formEmpresa.valorMensalPersonalizado || "0"
)
  .replace(/\./g, "")
  .replace(",", ".");

const payload = {
  ...formEmpresa,
  slug: gerarSlugAutomatico(formEmpresa.slug || formEmpresa.nome),
  valorMensalPersonalizado:
    Number(valorNormalizado) || 0,
};

      const url = empresaEditando
        ? `/api/master/empresas/${empresaEditando.id}`
        : "/api/master/empresas";

      const method = empresaEditando ? "PATCH" : "POST";

      const body = empresaEditando
        ? JSON.stringify({
            acao: "editarCadastro",
            ...payload,
          })
        : JSON.stringify(payload);

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar empresa.");
      }

      if (empresaEditando) {
        setMensagem("Empresa atualizada com sucesso.");
      } else {
        setMensagem("Empresa cadastrada com sucesso.");

        if (data?.usuarioPadrao) {
          setDadosUltimoUsuario(data.usuarioPadrao);
        }
      }

      await carregar();

      if (empresaEditando) {
        fecharModal();
      } else {
        setFormEmpresa(formInicial);
      }
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao salvar empresa.");
    } finally {
      setSalvandoEmpresa(false);
    }
  }

  async function executarAcao(
    empresaId: string,
    acao: string,
    dadosExtras?: Record<string, any>
  ) {
    try {
      setProcessandoId(empresaId);
      setMensagem("");

      const payload: any = {
        acao,
        ...(dadosExtras || {}),
      };

      if (acao === "bloquear" || acao === "inativar") {
        const motivo = window.prompt("Informe o motivo:");

        if (!motivo) {
          setProcessandoId("");
          return;
        }

        payload.motivo = motivo;
      }

      const res = await fetch(`/api/master/empresas/${empresaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao executar ação.");
      }

      setMensagem("Ação realizada com sucesso.");
      await carregar();
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao executar ação.");
    } finally {
      setProcessandoId("");
    }
  }

  async function alterarPlano(empresa: Empresa) {
    const planoAtual =
      empresa.trialAtivo || empresa.plano === "trial"
        ? "trial"
        : empresa.plano || "basico";

    const novoPlano = window.prompt(
      `Informe o novo plano para ${empresa.nome}:\n\nOpções: basico, plus, premium ou trial`,
      planoAtual
    );

    if (!novoPlano) return;

    await executarAcao(empresa.id, "alterarPlano", {
      plano: novoPlano,
    });
  }

  async function alterarValor(empresa: Empresa) {
    const valorAtual = Number(empresa.valorMensalPersonalizado || 0);

    const novoValor = window.prompt(
      `Informe o valor mensal personalizado para ${empresa.nome}:`,
      String(valorAtual)
    );

    if (novoValor === null) return;

    await executarAcao(empresa.id, "alterarValor", {
      valorMensalPersonalizado: Number(novoValor.replace(",", ".")),
    });
  }

  const empresasFiltradas = useMemo(() => {
    if (!busca) return empresas;

    return empresas.filter((e) => {
      const termo = busca.toLowerCase();

      return (
        e.nome?.toLowerCase().includes(termo) ||
        e.slug?.toLowerCase().includes(termo) ||
        e.telefone?.toLowerCase().includes(termo) ||
        e.whatsapp?.toLowerCase().includes(termo) ||
        e.responsavel?.toLowerCase().includes(termo)
      );
    });
  }, [busca, empresas]);

  const faturamento = empresasFiltradas.reduce((total, e) => {
    if (!e.ativo) return total;
    if (e.bloqueadoPorInadimplencia) return total;
    if (e.statusFinanceiro === "inadimplente") return total;
    if (e.trialAtivo || e.plano === "trial") return total;

    return total + Number(e.valorMensalPersonalizado || 0);
  }, 0);

  const totalBasico = empresasFiltradas.filter(
    (e) =>
      String(e.plano || "basico").toLowerCase() === "basico" && !e.trialAtivo
  ).length;

  const totalPlus = empresasFiltradas.filter(
    (e) => String(e.plano || "basico").toLowerCase() === "plus" && !e.trialAtivo
  ).length;

  const totalPremium = empresasFiltradas.filter(
    (e) =>
      String(e.plano || "basico").toLowerCase() === "premium" && !e.trialAtivo
  ).length;

  const totalTrial = empresasFiltradas.filter(
    (e) => e.trialAtivo || String(e.plano || "").toLowerCase() === "trial"
  ).length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>

<div style={styles.badge}>{APP_CONFIG.nome} Master</div>
          <p style={styles.subtitle}>
            Gestão central das empresas, planos, licenças, cobranças e bloqueios.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.btnCadastrar} onClick={abrirCadastro}>
            + Cadastrar empresa
          </button>

          <div style={styles.cardHighlight}>
            <span style={styles.cardLabel}>Receita prevista</span>
            <strong style={styles.cardHighlightValue}>
              {formatarMoeda(faturamento)}
            </strong>
          </div>
        </div>
      </div>

      <div style={styles.cards}>
        <Card
          label="Total de empresas"
          value={resumo.totalEmpresas}
          color="#06b6d4"
        />
        <Card
          label="Empresas ativas"
          value={resumo.empresasAtivas}
          color="#22c55e"
        />
        <Card
          label="Em trial"
          value={resumo.emTrial || totalTrial}
          color="#f59e0b"
        />
        <Card
          label="Inadimplentes"
          value={resumo.inadimplentes}
          color="#ef4444"
        />
        <Card label="Plano Básico" value={totalBasico} color="#10b981" />
        <Card label="Plano Plus" value={totalPlus} color="#3b82f6" />
        <Card label="Plano Premium" value={totalPremium} color="#a855f7" />
      </div>

      <section style={styles.configPlanosPanel}>
        <div style={styles.configPlanosHeader}>
          <div>
            <div style={styles.configPlanosBadge}>Configuração comercial</div>
            <h2 style={styles.configPlanosTitle}>Preços padrão dos planos</h2>
            <p style={styles.configPlanosSubtitle}>
              Defina os valores oficiais exibidos para clientes no painel administrativo.
              Valores personalizados por empresa continuam sendo controlados no cadastro da empresa.
            </p>
          </div>

          <button
            type="button"
            style={{
              ...styles.btnSalvarPrecoPlanos,
              opacity: salvandoConfiguracaoPlanos ? 0.7 : 1,
              cursor: salvandoConfiguracaoPlanos ? "not-allowed" : "pointer",
            }}
            onClick={salvarConfiguracaoPlanos}
            disabled={salvandoConfiguracaoPlanos}
          >
            {salvandoConfiguracaoPlanos ? "Salvando..." : "Salvar preços"}
          </button>
        </div>

        <div style={styles.configPlanosGrid}>
          <div style={styles.configPlanoCard}>
            <span style={styles.configPlanoIcone}>🌱</span>
            <strong style={styles.configPlanoNome}>Básico</strong>
            <small style={styles.configPlanoDescricao}>Entrada para agenda online</small>
            <label style={styles.configPlanoLabel}>Valor mensal</label>
            <div style={styles.configPlanoInputWrap}>
              <span>R$</span>
              <input
                style={styles.configPlanoInput}
                value={configuracaoPlanos.valorPlanoBasico}
                onChange={(e) =>
                  atualizarConfiguracaoPlano("valorPlanoBasico", e.target.value)
                }
                placeholder="49,90"
              />
            </div>
          </div>

          <div style={styles.configPlanoCard}>
            <span style={styles.configPlanoIcone}>🚀</span>
            <strong style={styles.configPlanoNome}>Plus</strong>
            <small style={styles.configPlanoDescricao}>Automações, promoções e recebimentos</small>
            <label style={styles.configPlanoLabel}>Valor mensal</label>
            <div style={styles.configPlanoInputWrap}>
              <span>R$</span>
              <input
                style={styles.configPlanoInput}
                value={configuracaoPlanos.valorPlanoPlus}
                onChange={(e) =>
                  atualizarConfiguracaoPlano("valorPlanoPlus", e.target.value)
                }
                placeholder="99,90"
              />
            </div>
          </div>

          <div style={{ ...styles.configPlanoCard, ...styles.configPlanoPremium }}>
            <div style={styles.configPlanoMaisVendido}>Mais vendido</div>
            <span style={styles.configPlanoIcone}>💎</span>
            <strong style={styles.configPlanoNome}>Premium</strong>
            <small style={styles.configPlanoDescricao}>Gestão completa e visão gerencial</small>
            <label style={styles.configPlanoLabel}>Valor mensal</label>
            <div style={styles.configPlanoInputWrap}>
              <span>R$</span>
              <input
                style={styles.configPlanoInput}
                value={configuracaoPlanos.valorPlanoPremium}
                onChange={(e) =>
                  atualizarConfiguracaoPlano("valorPlanoPremium", e.target.value)
                }
                placeholder="149,90"
              />
            </div>
          </div>
        </div>
      </section>

      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <h2 style={styles.panelTitle}>Empresas cadastradas</h2>
            <p style={styles.panelSubtitle}>
              Acompanhe status, plano, vencimento e execute ações rápidas.
            </p>
          </div>

          <input
            placeholder="Buscar empresa, slug, whatsapp..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={styles.input}
          />
        </div>

        {mensagem && <div style={styles.alert}>{mensagem}</div>}

        {carregando ? (
          <div style={styles.empty}>Carregando empresas...</div>
        ) : empresasFiltradas.length === 0 ? (
          <div style={styles.empty}>Nenhuma empresa encontrada.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Empresa</th>
                  <th style={styles.th}>Plano</th>
                  <th style={styles.th}>Financeiro</th>
                  <th style={styles.th}>Licença</th>
                  <th style={styles.th}>Vencimento</th>
                  <th style={styles.th}>Valor mensal</th>
                  <th style={styles.th}>Acesso</th>
                  <th style={styles.th}>Contato</th>
                  <th style={styles.th}>Recebimento</th>
                  <th style={styles.th}>Ações</th>
                </tr>
              </thead>

              <tbody>
                {empresasFiltradas.map((e) => {
                  const processando = processandoId === e.id;
                  const usuarioPadrao = e.usuarios?.[0];

                  return (
                    <tr key={e.id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong style={styles.companyName}>{e.nome}</strong>
                        <div style={styles.small}>/{e.slug}</div>
                        <div style={styles.linkAcesso}>
                          Link: {getBaseUrl()}/{e.slug}
                        </div>
                        <div style={styles.small}>
                          Endereço: {formatarEndereco(e.endereco)}
                        </div>
                        {e.responsavel && (
                          <div style={styles.small}>Resp.: {e.responsavel}</div>
                        )}
                      </td>

                      <td style={styles.td}>
                        <span style={badgePlano(e.plano, e.trialAtivo)}>
                          {labelPlano(e.plano, e.trialAtivo)}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={badgeFinanceiro(
                            e.statusFinanceiro,
                            e.bloqueadoPorInadimplencia
                          )}
                        >
                          {labelFinanceiro(
                            e.statusFinanceiro,
                            e.bloqueadoPorInadimplencia
                          )}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <strong
                          style={{
                            color: e.ativo ? "#86efac" : "#fca5a5",
                          }}
                        >
                          {e.ativo ? "Ativa" : "Inativa"}
                        </strong>

                        {(e.trialAtivo || e.plano === "trial") && (
                          <div style={styles.warning}>
                            Trial até {formatarData(e.trialExpiraEm)}
                          </div>
                        )}
                      </td>

                      <td style={styles.td}>
                        {formatarData(e.assinaturaExpiraEm)}
                        <div style={styles.small}>
                          Próx.: {formatarData(e.assinaturaProximaCobrancaEm)}
                        </div>
                      </td>

                      <td style={styles.td}>
                        <strong>
                          {formatarMoeda(e.valorMensalPersonalizado)}
                        </strong>
                        {Number(e.descontoMensal || 0) > 0 && (
                          <div style={styles.success}>
                            Desc.: {formatarMoeda(e.descontoMensal)}
                          </div>
                        )}
                      </td>

                      <td style={styles.td}>
                        <div style={styles.smallStrong}>Usuário padrão:</div>
                        <div>{usuarioPadrao?.email || "Não criado"}</div>
                        <div style={styles.small}>Senha padrão: 123456</div>
                      </td>

                      <td style={styles.td}>
                        <div>{e.whatsapp || "WhatsApp não informado"}</div>
                        {e.observacoesInternas && (
                          <div style={styles.small}>
                            Obs.: {e.observacoesInternas}
                          </div>
                        )}
                      </td>

<td style={styles.td}>
  {e.mercadoPagoAtivo &&
  e.mercadoPagoAccessToken ? (
    <div>
      <span
        style={{
          ...styles.badgeBase,
          background: '#065f46',
          color: '#d1fae5',
          marginBottom: 8,
        }}
      >
        Mercado Pago ativo
      </span>

      <div style={styles.small}>
        Ambiente:{' '}
        {e.mercadoPagoModo === 'producao'
          ? 'Produção'
          : 'Sandbox'}
      </div>
    </div>
  ) : (
  <>
    <span
      style={{
        ...styles.badgeBase,
        background: '#7f1d1d',
        color: '#fecaca',
        marginBottom: 8,
      }}
    >
      Não configurado
    </span>

    {e.solicitouIntegracaoMp && (
      <div style={{ marginTop: 8 }}>
        <span
          style={{
            ...styles.badgeBase,
            background: '#1d4ed8',
            color: '#dbeafe',
          }}
        >
          Solicitou integração
        </span>
      </div>
    )}
  </>
)}
</td>

                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button
                            style={styles.btn}
                            disabled={processando}
                            onClick={() => abrirEdicao(e)}
                          >
                            Editar cadastro
                          </button>

<button
  style={styles.btnBlue}
  disabled={processando}
  onClick={() => abrirRecebimento(e)}
>
  Recebimento
</button>

                          <button
                            style={styles.btn}
                            disabled={processando}
                            onClick={() => alterarValor(e)}
                          >
                            Editar valor
                          </button>

                          <button
                            style={styles.btnBlue}
                            disabled={processando}
                            onClick={() => alterarPlano(e)}
                          >
                            Plano
                          </button>

                          <button
                            style={styles.btnGreen}
                            disabled={processando}
                            onClick={() => executarAcao(e.id, "renovar30")}
                          >
                            Renovar +30
                          </button>

                          {e.ativo ? (
                            <button
                              style={styles.btnOrange}
                              disabled={processando}
                              onClick={() => executarAcao(e.id, "inativar")}
                            >
                              Inativar
                            </button>
                          ) : (
                            <button
                              style={styles.btnGreen}
                              disabled={processando}
                              onClick={() => executarAcao(e.id, "ativar")}
                            >
                              Ativar
                            </button>
                          )}

                          {e.bloqueadoPorInadimplencia ||
                          e.statusFinanceiro === "inadimplente" ? (
                            <button
                              style={styles.btnGreen}
                              disabled={processando}
                              onClick={() => executarAcao(e.id, "desbloquear")}
                            >
                              Desbloquear
                            </button>
                          ) : (
                            <button
                              style={styles.btnRed}
                              disabled={processando}
                              onClick={() => executarAcao(e.id, "bloquear")}
                            >
                              Bloquear
                            </button>
                          )}

                          <button
                            style={styles.btn}
                            disabled={processando}
                            onClick={() => abrirHistorico(e)}
                          >
                            Histórico
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalCadastroAberto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  {empresaEditando
                    ? "Editar cadastro da empresa"
                    : "Cadastrar nova empresa"}
                </h2>
                <p style={styles.modalSubtitle}>
                  {empresaEditando
                    ? "Atualize os dados cadastrais, plano, valor e observações internas."
                    : "Crie uma empresa cliente. O sistema também criará um usuário padrão com senha 123456 e permissões conforme o plano escolhido."}
                </p>
              </div>

              <button type="button" style={styles.btnFechar} onClick={fecharModal}>
                ×
              </button>
            </div>

            {dadosUltimoUsuario && (
              <div style={styles.usuarioCriadoBox}>
                <strong>Usuário padrão criado com sucesso:</strong>
                <div>Login sugerido: {dadosUltimoUsuario.login}</div>
                <div>E-mail/login: {dadosUltimoUsuario.email}</div>
                <div>Senha padrão: {dadosUltimoUsuario.senha}</div>
              </div>
            )}

            <form onSubmit={salvarEmpresa} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Nome da empresa *</label>
                  <input
                    style={styles.formInput}
                    value={formEmpresa.nome}
                    onChange={(e) => {
                      const nome = e.target.value;
                      atualizarForm("nome", nome);

                      if (!empresaEditando) {
                        atualizarForm("slug", gerarSlugAutomatico(nome));
                      }
                    }}
                    placeholder="Ex.: Clínica Bella Face"
                    required
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Slug / link de acesso *</label>
                  <input
                    style={styles.formInput}
                    value={formEmpresa.slug}
                    onChange={(e) =>
                      atualizarForm("slug", gerarSlugAutomatico(e.target.value))
                    }
                    placeholder="clinica-bella-face"
                    required
                  />
                  <span style={styles.helperText}>
                    Link público: {getBaseUrl()}/
                    {formEmpresa.slug || "nome-da-empresa"}
                  </span>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Responsável</label>
                  <input
                    style={styles.formInput}
                    value={formEmpresa.responsavel}
                    onChange={(e) => atualizarForm("responsavel", e.target.value)}
                    placeholder="Nome do responsável"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>WhatsApp</label>
                  <input
                    style={styles.formInput}
                    value={formEmpresa.whatsapp}
                    onChange={(e) => atualizarForm("whatsapp", e.target.value)}
                    placeholder="5575999999999"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Rua</label>
                  <input
                    style={styles.formInput}
                    value={formEmpresa.rua}
                    onChange={(e) => atualizarForm("rua", e.target.value)}
                    placeholder="Rua Exemplo"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Número</label>
                  <input
                    style={styles.formInput}
                    value={formEmpresa.numero}
                    onChange={(e) => atualizarForm("numero", e.target.value)}
                    placeholder="123"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Estado</label>
                  <input
                    style={styles.formInput}
                    value={formEmpresa.estado}
                    onChange={(e) => atualizarForm("estado", e.target.value)}
                    placeholder="BA"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Cidade</label>
                  <input
                    style={styles.formInput}
                    value={formEmpresa.cidade}
                    onChange={(e) => atualizarForm("cidade", e.target.value)}
                    placeholder="Santo Antônio de Jesus"
                  />
                </div>

                <div style={styles.fieldFull}>
                  <label style={styles.label}>Complemento</label>
                  <input
                    style={styles.formInput}
                    value={formEmpresa.complemento}
                    onChange={(e) => atualizarForm("complemento", e.target.value)}
                    placeholder="Sala, bairro, ponto de referência..."
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Plano</label>
                  <select
                    style={styles.formInput}
                    value={formEmpresa.plano}
                    onChange={(e) => atualizarForm("plano", e.target.value)}
                  >
                    <option value="basico">Básico</option>
                    <option value="plus">Plus</option>
                    <option value="premium">Premium</option>
                    <option value="trial">Trial 7 dias</option>
                  </select>
                  {formEmpresa.plano === "trial" && (
                    <span style={styles.helperWarning}>
                      Trial libera acesso completo por 7 dias, sem compromisso.
                    </span>
                  )}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Valor mensal</label>
                  <input
                    style={styles.formInput}
                    value={formEmpresa.valorMensalPersonalizado}
                    onChange={(e) =>
                      atualizarForm("valorMensalPersonalizado", e.target.value)
                    }
                    placeholder="99,90"
                    disabled={formEmpresa.plano === "trial"}
                  />
                </div>

                <div style={styles.fieldFull}>
                  <label style={styles.label}>Observação opcional</label>
                  <textarea
                    style={styles.textarea}
                    value={formEmpresa.observacoesInternas}
                    onChange={(e) =>
                      atualizarForm("observacoesInternas", e.target.value)
                    }
                    placeholder="Ex.: cliente com desconto especial, negociação manual, observação interna..."
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.btnCancelar}
                  onClick={fecharModal}
                  disabled={salvandoEmpresa}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={styles.btnSalvar}
                  disabled={salvandoEmpresa}
                >
                  {salvandoEmpresa
                    ? "Salvando..."
                    : empresaEditando
                    ? "Salvar alterações"
                    : "Cadastrar empresa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalHistoricoAberto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalHistorico}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Histórico da empresa</h2>
                <p style={styles.modalSubtitle}>
                  {empresaHistorico?.nome} /{empresaHistorico?.slug}
                </p>
              </div>

              <button
                type="button"
                style={styles.btnFechar}
                onClick={fecharHistorico}
              >
                ×
              </button>
            </div>

            <div style={styles.tabs}>
              <button
                type="button"
                style={
                  abaHistorico === "pagamentos"
                    ? styles.tabAtiva
                    : styles.tab
                }
                onClick={() => setAbaHistorico("pagamentos")}
              >
                Histórico de pagamentos ({historico.pagamentos.length})
              </button>

              <button
                type="button"
                style={abaHistorico === "logs" ? styles.tabAtiva : styles.tab}
                onClick={() => setAbaHistorico("logs")}
              >
                Bloqueios / Inativações ({historico.logs.length})
              </button>
            </div>

            {carregandoHistorico ? (
              <div style={styles.empty}>Carregando histórico...</div>
            ) : erroHistorico ? (
              <div style={styles.alertErro}>{erroHistorico}</div>
            ) : abaHistorico === "pagamentos" ? (
              historico.pagamentos.length === 0 ? (
                <div style={styles.empty}>
                  Nenhum pagamento registrado para esta empresa.
                </div>
              ) : (
                <div style={styles.tableWrap}>
                  <table style={styles.tableHistorico}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Data</th>
                        <th style={styles.th}>Valor</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Descrição</th>
                      </tr>
                    </thead>

                    <tbody>
                      {historico.pagamentos.map((p) => (
                        <tr key={p.id} style={styles.tr}>
                          <td style={styles.td}>{formatarDataHora(p.criadoEm)}</td>
                          <td style={styles.td}>
                            <strong>{formatarMoeda(p.valor)}</strong>
                          </td>
                          <td style={styles.td}>
                            <span style={badgeStatusPagamento(p.status)}>
                              {labelStatusPagamento(p.status)}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {p.descricao || "Sem descrição"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : historico.logs.length === 0 ? (
              <div style={styles.empty}>
                Nenhum bloqueio, desbloqueio, ativação ou inativação registrado.
              </div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.tableHistorico}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Data</th>
                      <th style={styles.th}>Ação</th>
                      <th style={styles.th}>Motivo / Observação</th>
                    </tr>
                  </thead>

                  <tbody>
                    {historico.logs.map((log) => (
                      <tr key={log.id} style={styles.tr}>
                        <td style={styles.td}>{formatarDataHora(log.criadoEm)}</td>
                        <td style={styles.td}>
                          <span style={badgeLog(log.tipo)}>
                            {labelLog(log.tipo)}
                          </span>
                        </td>
                        <td style={styles.td}>{log.motivo || "Não informado"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

{modalRecebimentoAberto && empresaRecebimento && (
  <div style={styles.modalOverlay}>
    <div style={styles.modal}>
      <div style={styles.modalHeader}>
        <div>
          <h2 style={styles.modalTitle}>
            Integração Mercado Pago
          </h2>

          <p style={styles.modalSubtitle}>
            {empresaRecebimento.nome}
          </p>
        </div>

        <button
          type="button"
          style={styles.btnFechar}
          onClick={fecharRecebimento}
        >
          ×
        </button>
      </div>

      <div style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>
            <input
              type="checkbox"
              checked={formRecebimento.ativo}
              onChange={(e) =>
                setFormRecebimento((old) => ({
                  ...old,
                  ativo: e.target.checked,
                }))
              }
            />

            <span style={{ marginLeft: 10 }}>
              Ativar recebimento online
            </span>
          </label>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Access Token
          </label>

          <input
            style={styles.formInput}
            value={formRecebimento.accessToken}
            onChange={(e) =>
              setFormRecebimento((old) => ({
                ...old,
                accessToken: e.target.value,
              }))
            }
            placeholder="APP_USR-..."
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Public Key
          </label>

          <input
            style={styles.formInput}
            value={formRecebimento.publicKey}
            onChange={(e) =>
              setFormRecebimento((old) => ({
                ...old,
                publicKey: e.target.value,
              }))
            }
            placeholder="APP_USR-..."
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Ambiente
          </label>

          <select
            style={styles.formInput}
            value={formRecebimento.ambiente}
            onChange={(e) =>
              setFormRecebimento((old) => ({
                ...old,
                ambiente: e.target.value,
              }))
            }
          >
            <option value="sandbox">
              Sandbox/Teste
            </option>

            <option value="producao">
              Produção
            </option>
          </select>
        </div>

        <div style={styles.modalActions}>
          <button
            type="button"
            style={styles.btnCancelar}
            onClick={fecharRecebimento}
          >
            Cancelar
          </button>

          <button
            type="button"
            style={styles.btnSalvar}
            onClick={async () => {
              try {
                setSalvandoRecebimento(true);

                const res = await fetch(
                  `/api/master/empresas/${empresaRecebimento.id}`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      acao: "mercadoPago",

                      mercadoPagoAtivo:
                        formRecebimento.ativo,

                      mercadoPagoAccessToken:
                        formRecebimento.accessToken,

                      mercadoPagoPublicKey:
                        formRecebimento.publicKey,

                      mercadoPagoModo:
                        formRecebimento.ambiente,
                    }),
                  }
                );

                const data = await res.json();

                if (!res.ok) {
                  throw new Error(
                    data.error || "Erro ao salvar."
                  );
                }

                await carregar();

                fecharRecebimento();

                alert(
                  "Integração salva com sucesso."
                );
              } catch (error: any) {
                alert(error.message);
              } finally {
                setSalvandoRecebimento(false);
              }
            }}
          >
            {salvandoRecebimento
              ? "Salvando..."
              : "Salvar integração"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

function Card({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{ ...styles.card, borderLeft: `5px solid ${color}` }}>
      <span style={styles.cardLabel}>{label}</span>
      <strong style={styles.cardValue}>{value}</strong>
    </div>
  );
}

function formatarData(data?: string | null) {
  if (!data) return "Não informado";
  return new Date(data).toLocaleDateString("pt-BR");
}

function formatarDataHora(data?: string | null) {
  if (!data) return "Não informado";

  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatarMoeda(valor?: string | number | null) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function labelPlano(plano?: string | null, trialAtivo?: boolean) {
  const normalizado = String(plano || "basico").toLowerCase();

  if (trialAtivo || normalizado === "trial") return "Trial";
  if (normalizado === "premium") return "Premium";
  if (normalizado === "plus") return "Plus";
  return "Básico";
}

function labelFinanceiro(status?: string | null, bloqueado?: boolean) {
  if (bloqueado) return "Bloqueado";

  const normalizado = String(status || "em_dia").toLowerCase();

  if (normalizado === "inadimplente") return "Inadimplente";
  if (normalizado === "trial") return "Trial";
  if (normalizado === "cancelado") return "Cancelado";

  return "Em dia";
}

function labelStatusPagamento(status?: string | null) {
  const normalizado = String(status || "").toLowerCase();

  if (normalizado === "pago") return "Pago";
  if (normalizado === "pendente") return "Pendente";
  if (normalizado === "falhou") return "Falhou";
  if (normalizado === "cancelado") return "Cancelado";

  return status || "Não informado";
}

function labelLog(tipo?: string | null) {
  const normalizado = String(tipo || "").toLowerCase();

  if (normalizado === "bloquear") return "Bloqueio";
  if (normalizado === "desbloquear") return "Desbloqueio";
  if (normalizado === "inativar") return "Inativação";
  if (normalizado === "ativar") return "Ativação";
  if (normalizado === "renovar30") return "Renovação +30";
  if (normalizado === "alterarPlano") return "Alteração de plano";
  if (normalizado === "alterarValor") return "Alteração de valor";

  return tipo || "Ação";
}

function badgePlano(plano?: string | null, trialAtivo?: boolean) {
  const normalizado = String(plano || "basico").toLowerCase();

  if (trialAtivo || normalizado === "trial") {
    return { ...styles.badgeBase, background: "#78350f", color: "#fde68a" };
  }

  if (normalizado === "premium") {
    return { ...styles.badgeBase, background: "#581c87", color: "#f5d0fe" };
  }

  if (normalizado === "plus") {
    return { ...styles.badgeBase, background: "#1d4ed8", color: "#dbeafe" };
  }

  return { ...styles.badgeBase, background: "#065f46", color: "#d1fae5" };
}

function badgeFinanceiro(status?: string | null, bloqueado?: boolean) {
  if (bloqueado) {
    return { ...styles.badgeBase, background: "#7f1d1d", color: "#fecaca" };
  }

  const normalizado = String(status || "em_dia").toLowerCase();

  if (normalizado === "inadimplente") {
    return { ...styles.badgeBase, background: "#7f1d1d", color: "#fecaca" };
  }

  if (normalizado === "trial") {
    return { ...styles.badgeBase, background: "#78350f", color: "#fde68a" };
  }

  if (normalizado === "cancelado") {
    return { ...styles.badgeBase, background: "#3f3f46", color: "#e4e4e7" };
  }

  return { ...styles.badgeBase, background: "#065f46", color: "#d1fae5" };
}

function badgeStatusPagamento(status?: string | null) {
  const normalizado = String(status || "").toLowerCase();

  if (normalizado === "pago") {
    return { ...styles.badgeBase, background: "#065f46", color: "#d1fae5" };
  }

  if (normalizado === "pendente") {
    return { ...styles.badgeBase, background: "#78350f", color: "#fde68a" };
  }

  if (normalizado === "falhou" || normalizado === "cancelado") {
    return { ...styles.badgeBase, background: "#7f1d1d", color: "#fecaca" };
  }

  return { ...styles.badgeBase, background: "#1e293b", color: "#e2e8f0" };
}

function badgeLog(tipo?: string | null) {
  const normalizado = String(tipo || "").toLowerCase();

  if (normalizado === "bloquear" || normalizado === "inativar") {
    return { ...styles.badgeBase, background: "#7f1d1d", color: "#fecaca" };
  }

  if (normalizado === "desbloquear" || normalizado === "ativar") {
    return { ...styles.badgeBase, background: "#065f46", color: "#d1fae5" };
  }

  if (normalizado === "renovar30") {
    return { ...styles.badgeBase, background: "#1d4ed8", color: "#dbeafe" };
  }

  return { ...styles.badgeBase, background: "#1e293b", color: "#e2e8f0" };
}

const styles: Record<string, any> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, #1e3a8a 0, #0f172a 36%, #020617 100%)",
    color: "#f8fafc",
    padding: "32px",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: "24px",
    marginBottom: "28px",
  },
  headerActions: {
    display: "flex",
    alignItems: "stretch",
    gap: "14px",
  },
  badge: {
    display: "inline-flex",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "rgba(34, 211, 238, 0.12)",
    border: "1px solid rgba(34, 211, 238, 0.28)",
    color: "#67e8f9",
    fontSize: "12px",
    fontWeight: 800,
    marginBottom: "12px",
  },
  title: {
    fontSize: "34px",
    margin: 0,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: "#f8fafc",
    textShadow: "none",
  },
  subtitle: {
    color: "#cbd5e1",
    marginTop: "10px",
    maxWidth: "760px",
  },
  cardHighlight: {
    minWidth: "220px",
    borderRadius: "22px",
    padding: "22px",
    background: "linear-gradient(135deg, #06b6d4, #2563eb)",
    boxShadow: "0 24px 60px rgba(8, 145, 178, 0.25)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  cardHighlightValue: {
    marginTop: "8px",
    fontSize: "28px",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "22px",
  },
  card: {
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.2)",
  },
  cardLabel: {
    color: "#e2e8f0",
    fontSize: "14px",
    fontWeight: 800,
  },
  cardValue: {
    display: "block",
    marginTop: "10px",
    fontSize: "28px",
  },
  configPlanosPanel: {
    background:
      "radial-gradient(circle at top right, rgba(168, 85, 247, 0.18), transparent 36%), rgba(15, 23, 42, 0.86)",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    borderRadius: "26px",
    padding: "24px",
    marginBottom: "22px",
    boxShadow: "0 24px 70px rgba(0,0,0,0.26)",
  },
  configPlanosHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "18px",
  },
  configPlanosBadge: {
    display: "inline-flex",
    padding: "7px 11px",
    borderRadius: "999px",
    background: "rgba(168, 85, 247, 0.14)",
    border: "1px solid rgba(168, 85, 247, 0.30)",
    color: "#e9d5ff",
    fontSize: "12px",
    fontWeight: 900,
    marginBottom: "10px",
  },
  configPlanosTitle: {
    margin: 0,
    color: "#f8fafc",
    fontSize: "24px",
    fontWeight: 950,
    letterSpacing: "-0.04em",
  },
  configPlanosSubtitle: {
    marginTop: "8px",
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: 1.55,
    maxWidth: "720px",
  },
  btnSalvarPrecoPlanos: {
    border: "1px solid rgba(216, 180, 254, 0.38)",
    background: "linear-gradient(135deg, #7c3aed, #db2777)",
    color: "#fff",
    borderRadius: "16px",
    padding: "13px 18px",
    fontWeight: 950,
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  configPlanosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
  },
  configPlanoCard: {
    position: "relative",
    overflow: "hidden",
    background: "rgba(2, 6, 23, 0.62)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "22px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },
  configPlanoPremium: {
    border: "1px solid rgba(216, 180, 254, 0.42)",
    boxShadow: "0 18px 50px rgba(168, 85, 247, 0.12)",
  },
  configPlanoMaisVendido: {
    position: "absolute",
    top: 14,
    right: 14,
    borderRadius: "999px",
    background: "linear-gradient(135deg, #f59e0b, #db2777)",
    color: "#fff",
    padding: "6px 9px",
    fontSize: "11px",
    fontWeight: 950,
  },
  configPlanoIcone: {
    width: "44px",
    height: "44px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
  },
  configPlanoNome: {
    color: "#f8fafc",
    fontSize: "20px",
    fontWeight: 950,
    letterSpacing: "-0.035em",
  },
  configPlanoDescricao: {
    color: "#cbd5e1",
    fontSize: "13px",
    lineHeight: 1.45,
    minHeight: "36px",
  },
  configPlanoLabel: {
    marginTop: "4px",
    color: "#e2e8f0",
    fontSize: "12px",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  configPlanoInputWrap: {
    height: "48px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderRadius: "15px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "#020617",
    color: "#94a3b8",
    padding: "0 12px",
    fontWeight: 900,
  },
  configPlanoInput: {
    width: "100%",
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#f8fafc",
    fontSize: "18px",
    fontWeight: 950,
  },
  panel: {
    background: "rgba(15, 23, 42, 0.86)",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    borderRadius: "26px",
    padding: "22px",
    boxShadow: "0 24px 70px rgba(0,0,0,0.30)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
  },
  panelTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#f8fafc",
  },
  panelSubtitle: {
    marginTop: "6px",
    color: "#cbd5e1",
    fontSize: "15px",
  },
  input: {
    width: "320px",
    maxWidth: "100%",
    height: "44px",
    borderRadius: "14px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "#020617",
    color: "#f8fafc",
    padding: "0 14px",
    outline: "none",
    fontSize: "15px",
  },
  alert: {
    marginBottom: "16px",
    borderRadius: "16px",
    padding: "12px 14px",
    background: "rgba(34, 211, 238, 0.10)",
    border: "1px solid rgba(34, 211, 238, 0.22)",
    color: "#a5f3fc",
    fontSize: "15px",
  },
  alertErro: {
    marginBottom: "16px",
    borderRadius: "16px",
    padding: "12px 14px",
    background: "rgba(239, 68, 68, 0.10)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    color: "#fecaca",
    fontSize: "15px",
  },
  empty: {
    padding: "34px",
    textAlign: "center",
    color: "#cbd5e1",
    background: "#020617",
    borderRadius: "18px",
    border: "1px solid rgba(148, 163, 184, 0.12)",
    fontSize: "16px",
  },
  tableWrap: {
    overflowX: "auto",
    borderRadius: "18px",
    border: "1px solid rgba(148, 163, 184, 0.14)",
  },
  table: {
    width: "100%",
    minWidth: "1500px",
    borderCollapse: "collapse",
    background: "#020617",
  },
  tableHistorico: {
    width: "100%",
    minWidth: "760px",
    borderCollapse: "collapse",
    background: "#020617",
  },
  th: {
    textAlign: "left",
    padding: "15px",
    color: "#cbd5e1",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    background: "rgba(15, 23, 42, 0.96)",
    borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
  },
  tr: {
    borderBottom: "1px solid rgba(148, 163, 184, 0.10)",
  },
  td: {
    padding: "15px",
    color: "#f1f5f9",
    verticalAlign: "middle",
    fontSize: "15px",
  },
  companyName: {
    color: "#e5e7eb",
    fontWeight: 800,
  },
  small: {
    color: "#cbd5e1",
    fontSize: "13px",
    marginTop: "4px",
  },
  smallStrong: {
    color: "#f8fafc",
    fontSize: "13px",
    fontWeight: 900,
    marginBottom: "4px",
  },
  linkAcesso: {
    color: "#67e8f9",
    fontSize: "13px",
    marginTop: "4px",
    fontWeight: 800,
  },
  helperText: {
    color: "#67e8f9",
    fontSize: "13px",
    fontWeight: 800,
  },
  helperWarning: {
    color: "#fcd34d",
    fontSize: "13px",
    fontWeight: 800,
    marginTop: "4px",
  },
  warning: {
    color: "#fcd34d",
    fontSize: "13px",
    marginTop: "5px",
  },
  success: {
    color: "#86efac",
    fontSize: "13px",
    marginTop: "5px",
  },
  badgeBase: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "7px 11px",
    fontSize: "13px",
    fontWeight: 800,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
  },
  btnCadastrar: {
    border: "1px solid rgba(34, 211, 238, 0.34)",
    background: "linear-gradient(135deg, #0891b2, #2563eb)",
    color: "#fff",
    borderRadius: "18px",
    padding: "0 22px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "15px",
    boxShadow: "0 18px 45px rgba(37, 99, 235, 0.24)",
  },
  btn: {
    border: "1px solid rgba(148, 163, 184, 0.22)",
    background: "#1e293b",
    color: "#fff",
    borderRadius: "10px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },
  btnBlue: {
    border: "1px solid rgba(59, 130, 246, 0.35)",
    background: "#1d4ed8",
    color: "#fff",
    borderRadius: "10px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },
  btnGreen: {
    border: "1px solid rgba(34, 197, 94, 0.35)",
    background: "#15803d",
    color: "#fff",
    borderRadius: "10px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },
  btnOrange: {
    border: "1px solid rgba(251, 146, 60, 0.35)",
    background: "#c2410c",
    color: "#fff",
    borderRadius: "10px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },
  btnRed: {
    border: "1px solid rgba(239, 68, 68, 0.35)",
    background: "#b91c1c",
    color: "#fff",
    borderRadius: "10px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.82)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    zIndex: 999,
  },
  modal: {
    width: "100%",
    maxWidth: "920px",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#111827",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: "26px",
    padding: "26px",
    boxShadow: "0 30px 100px rgba(0,0,0,0.55)",
  },
  modalHistorico: {
    width: "100%",
    maxWidth: "1050px",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#111827",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: "26px",
    padding: "26px",
    boxShadow: "0 30px 100px rgba(0,0,0,0.55)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "22px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "28px",
    color: "#e5e7eb",
    fontWeight: 900,
    textShadow: "none",
  },
  modalSubtitle: {
    marginTop: "8px",
    color: "#cbd5e1",
    fontSize: "15px",
    fontWeight: 500,
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "18px",
  },
  tab: {
    border: "1px solid rgba(148, 163, 184, 0.25)",
    background: "#020617",
    color: "#cbd5e1",
    borderRadius: "14px",
    padding: "11px 14px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "14px",
  },
  tabAtiva: {
    border: "1px solid rgba(34, 211, 238, 0.40)",
    background: "linear-gradient(135deg, #0891b2, #2563eb)",
    color: "#ffffff",
    borderRadius: "14px",
    padding: "11px 14px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "14px",
  },
  usuarioCriadoBox: {
    background: "rgba(34, 197, 94, 0.12)",
    border: "1px solid rgba(34, 197, 94, 0.35)",
    color: "#bbf7d0",
    borderRadius: "16px",
    padding: "14px",
    marginBottom: "16px",
    fontSize: "15px",
    lineHeight: 1.6,
  },
  btnFechar: {
    width: "42px",
    height: "42px",
    borderRadius: "999px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "#020617",
    color: "#f8fafc",
    cursor: "pointer",
    fontSize: "26px",
    lineHeight: 1,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  fieldFull: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    color: "#e5e7eb",
    fontSize: "15px",
    fontWeight: 800,
    textShadow: "none",
  },
  formInput: {
    height: "48px",
    borderRadius: "14px",
    border: "1px solid rgba(148, 163, 184, 0.42)",
    background: "#030712",
    color: "#e5e7eb",
    padding: "0 15px",
    outline: "none",
    fontSize: "16px",
    fontWeight: 600,
    textShadow: "none",
  },
  textarea: {
    minHeight: "92px",
    borderRadius: "14px",
    border: "1px solid rgba(148, 163, 184, 0.42)",
    background: "#030712",
    color: "#e5e7eb",
    padding: "14px 15px",
    outline: "none",
    fontSize: "16px",
    fontWeight: 600,
    resize: "vertical",
    fontFamily: "inherit",
    textShadow: "none",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  btnCancelar: {
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "#1e293b",
    color: "#f8fafc",
    borderRadius: "14px",
    padding: "13px 20px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "15px",
  },
  btnSalvar: {
    border: "1px solid rgba(34, 211, 238, 0.34)",
    background: "linear-gradient(135deg, #0891b2, #2563eb)",
    color: "#fff",
    borderRadius: "14px",
    padding: "13px 20px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "15px",
  },
};