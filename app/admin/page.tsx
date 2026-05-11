'use client';

import { useEffect, useState } from 'react';
import { planoTemRecurso } from '../lib/planos';
import { montarMensagemConviteAgendamento } from '@/lib/templatesWhatsapp';
import { montarLinkAgendamento } from '@/lib/links';

type PermissoesUsuario = {
  dashboard: boolean;
  agenda: boolean;
  servicos: boolean;
  profissionais: boolean;
  promocoes: boolean;
  configuracoes: boolean;
  comissoes: boolean;
  financeiro?: boolean;
};

export default function AdminPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [financeiro, setFinanceiro] = useState<any>(null);

  const [salvando, setSalvando] = useState(false);
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);
  const [gerandoPagamento, setGerandoPagamento] = useState(false);
  const [ativandoRecorrencia, setAtivandoRecorrencia] = useState(false);
  const [sincronizandoRecorrencia, setSincronizandoRecorrencia] = useState(false);
  const [configPlanos, setConfigPlanos] = useState({
    valorPlanoBasico: null as number | null,
    valorPlanoPlus: null as number | null,
    valorPlanoPremium: null as number | null,
  });

  const [dadosEmpresa, setDadosEmpresa] = useState({
    nome: '',
    endereco: '',
    telefone: '',
    responsavel: '',
  });

  async function sincronizarAssinaturaRecorrente(empresaAtual: any) {
    if (!empresaAtual?.id || !empresaAtual?.mercadoPagoAssinaturaId) {
      return empresaAtual;
    }

    try {
      setSincronizandoRecorrencia(true);

      const res = await fetch('/api/assinaturas/recorrente/sincronizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtual.id,
          mercadoPagoAssinaturaId: empresaAtual.mercadoPagoAssinaturaId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !data?.empresa) {
        console.warn(
          'Não foi possível sincronizar assinatura recorrente:',
          data?.error || res.status
        );

        return empresaAtual;
      }

      localStorage.setItem('empresaLogada', JSON.stringify(data.empresa));

      return data.empresa;
    } catch (error) {
      console.error('Erro ao sincronizar assinatura recorrente:', error);

      return empresaAtual;
    } finally {
      setSincronizandoRecorrencia(false);
    }
  }

  async function carregarConfiguracaoPlanos() {
    try {
      const res = await fetch('/api/master/configuracoes/planos', {
        cache: 'no-store',
      });

      if (!res.ok) {
        console.warn('Configuração de planos não encontrada:', res.status);
        return;
      }

      const data = await res.json();

      const configuracao =
        data?.configuracao ||
        data?.config ||
        data?.configuracaoSaas ||
        data?.planos ||
        data;

      function normalizarValorPlano(valor: any) {
        if (valor === null || valor === undefined || valor === '') {
          return null;
        }

        if (typeof valor === 'number' && Number.isFinite(valor)) {
          return valor;
        }

        if (typeof valor === 'string') {
          const limpo = valor
            .replace('R$', '')
            .replace(/\s/g, '')
            .trim();

          const numero = limpo.includes(',')
            ? Number(limpo.replace(/\./g, '').replace(',', '.'))
            : Number(limpo);

          return Number.isFinite(numero) ? numero : null;
        }

        return null;
      }

      setConfigPlanos({
        valorPlanoBasico: normalizarValorPlano(configuracao?.valorPlanoBasico),
        valorPlanoPlus: normalizarValorPlano(configuracao?.valorPlanoPlus),
        valorPlanoPremium: normalizarValorPlano(configuracao?.valorPlanoPremium),
      });
    } catch (error) {
      console.error('Erro ao carregar configuração dos planos:', error);
    }
  }

  useEffect(() => {
    async function carregarDadosAtualizados() {
      const empresaStorage = localStorage.getItem('empresaLogada');
      const usuarioStorage = localStorage.getItem('usuarioEmpresa');

      if (!empresaStorage || !usuarioStorage) {
        window.location.href = '/login';
        return;
      }

      const empresaSalva = JSON.parse(empresaStorage);
      const usuarioSalvo = JSON.parse(usuarioStorage);

      setUsuario(usuarioSalvo);

      try {
        const res = await fetch(`/api/admin/empresas/${empresaSalva.id}`, {
          cache: 'no-store',
        });

        const data = await res.json();

        if (!data.success) {
          alert(data.error || 'Erro ao buscar dados atualizados da empresa.');
          return;
        }

        const empresaSincronizada = await sincronizarAssinaturaRecorrente(data.empresa);

        setEmpresa(empresaSincronizada);
        localStorage.setItem('empresaLogada', JSON.stringify(empresaSincronizada));

        setDadosEmpresa({
          nome: empresaSincronizada.nome || '',
          endereco: empresaSincronizada.endereco || '',
          telefone: empresaSincronizada.telefone || '',
          responsavel: empresaSincronizada.responsavel || '',
        });

        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
          .toISOString()
          .split('T')[0];

        const fimMes = hoje.toISOString().split('T')[0];

        const resFinanceiro = await fetch(
          `/api/financeiro/relatorio?empresaId=${empresaSalva.id}&dataInicio=${inicioMes}&dataFim=${fimMes}`,
          { cache: 'no-store' }
        );

        if (resFinanceiro.ok) {
          const dataFinanceiro = await resFinanceiro.json();

          if (dataFinanceiro.success) {
            setFinanceiro(dataFinanceiro.resumo);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar empresa atualizada:', error);
        alert('Erro ao carregar dados atualizados da empresa.');
      }
    }

    carregarConfiguracaoPlanos();
    carregarDadosAtualizados();
  }, []);

  function sair() {
    localStorage.clear();
    window.location.href = '/login';
  }

  function dataValida(data?: string | null) {
    if (!data) return false;
    return new Date(data).getTime() >= Date.now();
  }

  function formatarData(data?: string | null) {
    if (!data) return 'Não definida';

    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatarMoeda(valor?: number) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function trialAtivo() {
    return dataValida(empresa?.trialExpiraEm);
  }

  function assinaturaAtiva() {
    return (
      empresa?.assinaturaStatus === 'ativa' &&
      Boolean(empresa?.assinaturaExpiraEm) &&
      dataValida(empresa?.assinaturaExpiraEm)
    );
  }

  function licencaAtiva() {
    return trialAtivo() || assinaturaAtiva();
  }

  function licencaExpirada() {
    return !licencaAtiva();
  }

  function planoAtual() {
    if (empresa?.plano === 'plus') return 'plus';
    if (empresa?.plano === 'premium') return 'premium';
    return 'basico';
  }

  function planoBasico() {
    return planoAtual() === 'basico';
  }

  function planoPlus() {
    return planoAtual() === 'plus';
  }

  function planoPremium() {
    return planoAtual() === 'premium';
  }

  function premiumExpirado() {
    return planoPremium() && licencaExpirada();
  }

  function recursoLiberado(recurso: any) {
    if (trialAtivo()) return true;
    if (!assinaturaAtiva()) return false;

    return planoTemRecurso(planoAtual(), recurso);
  }

  function temPremium() {
    return trialAtivo() || (planoPremium() && assinaturaAtiva());
  }

  function temPlusOuPremium() {
    return trialAtivo() || (assinaturaAtiva() && (planoPlus() || planoPremium()));
  }

  function temPermissao(modulo: keyof PermissoesUsuario) {
    if (!usuario) return false;

    if (usuario.acessoTotal === true) return true;
    if (usuario.perfil === 'admin') return true;

    if (!usuario.permissoes) return false;

    return usuario.permissoes?.[modulo] === true;
  }

  function nomePlanoAtual() {
  if (planoPremium()) return 'Premium';
  if (planoPlus()) return 'Plus';
  if (trialAtivo()) return 'Trial 7 dias';
  if (licencaExpirada()) return 'Básico vencido';
  return 'Básico';
}

  function textoBadge() {
  if (licencaExpirada()) return 'Licença expirada';
  if (planoPremium()) return 'Premium ativo';
  if (planoPlus()) return 'Plus ativo';
  if (trialAtivo()) return 'Trial ativo';
  return 'Básico ativo';
}

  function estiloBadge() {
    if (trialAtivo()) return badgeTrial;
    if (licencaExpirada()) return badgeExpirado;
    if (planoPremium()) return badgePremium;
    if (planoPlus()) return badgePlus;
    return badgeBasicoAtivo;
  }

  function dataAssinaturaExpira() {
    if (trialAtivo()) return empresa.trialExpiraEm;
    return empresa.assinaturaExpiraEm;
  }

  function diasRestantes(data?: string | null) {
    if (!data) return null;

    const diff = new Date(data).getTime() - Date.now();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return dias > 0 ? dias : 0;
  }

  function textoExpiracao() {
    const data = dataAssinaturaExpira();
    const dias = diasRestantes(data);

    if (dias === null) return 'Não definida';
    if (dias === 0) return 'Expira hoje';
    if (dias === 1) return 'Expira amanhã';

    return `${dias} dias restantes`;
  }

  function descricaoPlano() {
    if (trialAtivo()) {
      return 'Você está usando o período gratuito com acesso aos recursos Premium.';
    }

    if (licencaExpirada()) {
      return 'Sua licença expirou. As funções do sistema ficam indisponíveis até a regularização do pagamento.';
    }

    if (planoPremium()) {
      return 'Plano Premium ativo com todos os recursos liberados.';
    }

    if (planoPlus()) {
      return 'Plano Plus ativo com pré-pagamento, WhatsApp automático e lembretes.';
    }

    return 'Plano Básico ativo com recursos essenciais para agenda e atendimento manual.';
  }

  function recursoBloqueado() {
    alert('Função indisponível. Regularize o pagamento para liberar o acesso.');
  }

  function permissaoBloqueada() {
    alert('Você não tem permissão para acessar esta área.');
  }

  function acaoBloqueadaPorLicencaOuPermissao(
    modulo: keyof PermissoesUsuario,
    acao: () => void
  ) {
    if (licencaExpirada()) {
      recursoBloqueado();
      return;
    }

    if (!temPermissao(modulo)) {
      permissaoBloqueada();
      return;
    }

    acao();
  }

  async function salvarDadosEmpresa() {
    if (licencaExpirada()) {
      recursoBloqueado();
      return;
    }

    if (!temPermissao('configuracoes')) {
      permissaoBloqueada();
      return;
    }

    try {
      setSalvandoEmpresa(true);

      const res = await fetch(`/api/admin/empresas/${empresa.id}/dados`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosEmpresa),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao salvar dados da empresa.');
        return;
      }

      setEmpresa(data.empresa);
      localStorage.setItem('empresaLogada', JSON.stringify(data.empresa));

      alert('Dados atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error);
      alert('Erro ao salvar dados da empresa.');
    } finally {
      setSalvandoEmpresa(false);
    }
  }

  async function atualizarAssinatura(payload: any) {
    try {
      setSalvando(true);

      const res = await fetch(`/api/admin/empresas/${empresa.id}/assinatura`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao atualizar assinatura.');
        return;
      }

      setEmpresa(data.empresa);
      localStorage.setItem('empresaLogada', JSON.stringify(data.empresa));

      alert('Informações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      alert('Erro ao atualizar assinatura.');
    } finally {
      setSalvando(false);
    }
  }

  async function pagarMensalidade() {
    try {
      setGerandoPagamento(true);

      const res = await fetch(
        `/api/admin/empresas/${empresa.id}/assinatura/pagar`,
        { method: 'POST' }
      );

      const data = await res.json();

      if (!data.success && !data.linkPagamento) {
        alert(data.error || 'Erro ao gerar pagamento da mensalidade.');
        return;
      }

      window.location.href = data.linkPagamento;
    } catch (error) {
      console.error('Erro ao gerar pagamento da mensalidade:', error);
      alert('Erro ao gerar pagamento da mensalidade.');
    } finally {
      setGerandoPagamento(false);
    }
  }

  async function ativarCobrancaAutomatica(planoSelecionado?: 'basico' | 'plus' | 'premium') {
    if (sistemaBloqueado) {
      recursoBloqueado();
      return;
    }

    try {
      setAtivandoRecorrencia(true);

      const planoAssinatura = planoSelecionado || planoAtual();

      const res = await fetch('/api/assinaturas/recorrente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresa.id,
          plano: planoAssinatura,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.linkPagamento) {
        alert(data.error || 'Erro ao criar assinatura recorrente.');
        return;
      }

      window.location.href = data.linkPagamento;
    } catch (error) {
      console.error('Erro ao ativar cobrança automática:', error);
      alert('Erro ao ativar cobrança automática.');
    } finally {
      setAtivandoRecorrencia(false);
    }
  }

  if (!empresa || !usuario) {
    return <p style={{ padding: 40 }}>Carregando...</p>;
  }

  const diasParaExpirar = diasRestantes(dataAssinaturaExpira());
  const premiumAtivo = temPremium();
  const plusOuPremiumAtivo = temPlusOuPremium();
  const trialEstaAtivo = trialAtivo();
  const sistemaBloqueado = licencaExpirada();
  const planoPremiumExpirado = premiumExpirado();
  const cobrancaRecorrenteAtiva =
    Boolean(empresa?.assinaturaRecorrenteAtiva) &&
    empresa?.assinaturaStatus === 'ativa';

  const dashboardBloqueado = sistemaBloqueado || !temPermissao('dashboard');
  const agendaBloqueada = sistemaBloqueado || !temPermissao('agenda');
  const servicosBloqueado = sistemaBloqueado || !temPermissao('servicos');
  const profissionaisBloqueado =
    sistemaBloqueado || !temPermissao('profissionais');
  const promocoesBloqueado =
    sistemaBloqueado || !premiumAtivo || !temPermissao('promocoes');
  const configuracoesBloqueado =
    sistemaBloqueado || !temPermissao('configuracoes');
  const comissoesBloqueado =
    sistemaBloqueado || !premiumAtivo || !temPermissao('comissoes');

  const podeVerResumoFinanceiro =
    !sistemaBloqueado &&
    premiumAtivo &&
    (temPermissao('dashboard') ||
      temPermissao('financeiro') ||
      temPermissao('comissoes'));

  const linkAgendamento = montarLinkAgendamento(empresa.slug);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    linkAgendamento
  )}`;


  const valorPlanoBasico =
    configPlanos.valorPlanoBasico ??
    empresa.valorPlanoBasico ??
    empresa.valorMensalBasico ??
    empresa.precoPlanoBasico ??
    null;

  const valorPlanoPlus =
    configPlanos.valorPlanoPlus ??
    empresa.valorPlanoPlus ??
    empresa.valorMensalPlus ??
    empresa.precoPlanoPlus ??
    null;

  const valorPlanoPremium =
    configPlanos.valorPlanoPremium ??
    empresa.valorPlanoPremium ??
    empresa.valorMensalPremium ??
    empresa.precoPlanoPremium ??
    empresa.valorMensalPersonalizado ??
    null;

  function textoValorPlano(valor?: number | null) {
    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
      return 'Sob consulta';
    }

    return formatarMoeda(Number(valor));
  }

  function planoCardAtivo(plano: 'basico' | 'plus' | 'premium') {
    if (plano === 'premium') return planoPremium();
    if (plano === 'plus') return planoPlus();
    return planoBasico() && !trialEstaAtivo;
  }

  function planoCardBloqueadoPorHierarquia(plano: 'basico' | 'plus' | 'premium') {
    if (sistemaBloqueado) return true;

    if (plano === 'basico') {
      return planoPlus() || planoPremium();
    }

    if (plano === 'plus') {
      return planoPremium();
    }

    return false;
  }

  function acaoPlano(plano: 'basico' | 'plus' | 'premium') {
    if (sistemaBloqueado) {
      recursoBloqueado();
      return;
    }

    if (planoCardAtivo(plano)) return;

    if (planoCardBloqueadoPorHierarquia(plano)) {
      alert('Não é permitido regredir para um plano inferior pelo painel da empresa. Alterações de downgrade devem ser feitas pelo painel master para evitar perda de recursos do cliente.');
      return;
    }

    ativarCobrancaAutomatica(plano);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', padding: 30 }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <header
  style={{
    background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
    borderRadius: 28,
    padding: 36,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(79,70,229,0.25)',
  }}
>
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background:
        'radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent 30%)',
      pointerEvents: 'none',
    }}
  />

  <div
    style={{
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 24,
      flexWrap: 'wrap',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: 24,
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.12)',
          border: '2px solid rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
        }}
      >
        {empresa?.logo ? (
          <img
            src={empresa.logo}
            alt="Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: '#fff',
            }}
          >
            {empresa?.nome?.charAt(0) || 'M'}
          </span>
        )}
      </div>

      <div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 10,
            backdropFilter: 'blur(10px)',
          }}
        >
          👋 Bem-vindo(a) de volta, {usuario?.nome}
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 42,
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1,
          }}
        >
          Administração
        </h1>

        <p
          style={{
            marginTop: 10,
            color: 'rgba(255,255,255,0.82)',
            fontSize: 16,
            fontWeight: 500,
          }}
        >
          Gestão completa do seu estúdio e configurações da empresa.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            marginTop: 18,
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.12)',
              padding: '8px 13px',
              borderRadius: 999,
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              backdropFilter: 'blur(10px)',
            }}
          >
            🏢 {empresa?.nome}
          </div>

          <div
            style={{
              background: planoPremium()
                ? '#f59e0b'
                : planoPlus()
                ? '#0ea5e9'
                : '#22c55e',
              padding: '8px 13px',
              borderRadius: 999,
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            🚀 Plano {nomePlanoAtual()}
          </div>

          <div
            style={{
              background: sistemaBloqueado ? '#ef4444' : '#22c55e',
              padding: '8px 13px',
              borderRadius: 999,
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            {sistemaBloqueado ? '🔒 Bloqueado' : '✅ Ativo'}
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.12)',
              padding: '8px 13px',
              borderRadius: 999,
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              backdropFilter: 'blur(10px)',
            }}
          >
            📅 Vencimento: {formatarData(dataAssinaturaExpira())}
          </div>
        </div>
      </div>
    </div>

    <div
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <button
        onClick={() =>
          acaoBloqueadaPorLicencaOuPermissao('configuracoes', () => {
            window.location.href = '/configuracoes';
          })
        }
        style={{
          background: '#fff',
          color: '#4f46e5',
          border: 'none',
          borderRadius: 14,
          padding: '14px 18px',
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        ⚙️ Configurações
      </button>

      <button
        onClick={() =>
          acaoBloqueadaPorLicencaOuPermissao('dashboard', () => {
            window.location.href = '/dashboard';
          })
        }
        style={{
          background: '#fff',
          color: '#4f46e5',
          border: 'none',
          borderRadius: 14,
          padding: '14px 18px',
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        📊 Dashboard
      </button>

      <button
        onClick={sair}
        style={{
          background: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          padding: '14px 18px',
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        🚪 Sair
      </button>
    </div>
  </div>
</header>


        {sistemaBloqueado && (
          <section style={alertaPlanoExpirado}>
            <div>
              <strong>⚠️ Sua licença expirou</strong>
              <p style={{ margin: '6px 0 0' }}>
                As funções do sistema estão indisponíveis até a regularização
                do pagamento. Para voltar a usar o Marcaê, regularize sua licença.
              </p>
            </div>

            <button
              disabled={gerandoPagamento}
              onClick={pagarMensalidade}
              style={botaoPagamentoMenor}
            >
              {gerandoPagamento ? 'Gerando pagamento...' : 'Regularizar pagamento'}
            </button>
          </section>
        )}

        {!sistemaBloqueado && usuario.perfil !== 'admin' && (
          <section style={avisoPermissoes}>
            <strong>Permissões do usuário</strong>
            <p style={{ margin: '6px 0 0' }}>
              Você verá apenas os módulos liberados pelo administrador.
            </p>
          </section>
        )}

        <section style={gridCards}>
          <Card
            titulo="Dashboard"
            descricao="Acompanhe métricas, faturamento e agendamentos."
            href="/dashboard"
            bloqueado={dashboardBloqueado}
            motivoBloqueio={sistemaBloqueado ? 'licenca' : 'permissao'}
          />

          <Card
            titulo="Agenda"
            descricao="Visualize os horários em formato calendário."
            href="/agenda"
            bloqueado={agendaBloqueada}
            motivoBloqueio={sistemaBloqueado ? 'licenca' : 'permissao'}
          />

          <Card
            titulo="Serviços"
            descricao="Cadastre valores, duração e pré-pagamento."
            href="/servicos"
            bloqueado={servicosBloqueado}
            motivoBloqueio={sistemaBloqueado ? 'licenca' : 'permissao'}
          />

          <Card
            titulo="Profissionais"
            descricao="Cadastre e gerencie profissionais da empresa."
            href="/profissionais"
            bloqueado={profissionaisBloqueado}
            motivoBloqueio={sistemaBloqueado ? 'licenca' : 'permissao'}
          />

<Card
  titulo="Clientes"
  descricao="Cadastre clientes e inicie agendamentos."
  href="/clientes"
  bloqueado={sistemaBloqueado}
  motivoBloqueio={sistemaBloqueado ? 'licenca' : 'permissao'}
/>
          <Card
            titulo="Promoções"
            descricao="Crie campanhas e envie por WhatsApp."
            href="/promocoes"
            bloqueado={promocoesBloqueado}
            motivoBloqueio={
              sistemaBloqueado
                ? 'licenca'
                : !premiumAtivo
                ? 'premium'
                : 'permissao'
            }
          />

          <Card
            titulo="Comissões"
            descricao="Acompanhe valores de comissão por profissional e período."
            href="/comissoes"
            bloqueado={comissoesBloqueado}
            motivoBloqueio={
              sistemaBloqueado
                ? 'licenca'
                : !premiumAtivo
                ? 'premium'
                : 'permissao'
            }
          />
        </section>

        <section style={boxPlanosPremium}>
          <div style={planosHeader}>
            <div>
              <span style={planosEyebrow}>Planos e assinatura</span>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: 28, letterSpacing: '-0.05em' }}>
                Escolha o plano ideal para sua empresa
              </h2>
              <p style={{ color: '#64748b', margin: '8px 0 0', lineHeight: 1.6 }}>
                Visualize recursos, acompanhe vencimento e gerencie a assinatura do Marcaê.
              </p>
            </div>

            <div style={sistemaBloqueado ? planoStatusExpirado : planoStatusAtivo}>
              <strong>{textoBadge()}</strong>
              <span>{textoExpiracao()}</span>
            </div>
          </div>

          <div style={gridInfoPlanos}>
            <Info titulo="Plano atual" valor={nomePlanoAtual()} />
            <Info titulo="Status" valor={empresa.assinaturaStatus || 'vencida'} />
            <Info titulo="Trial expira em" valor={formatarData(empresa.trialExpiraEm)} />
            <Info
              titulo="Assinatura expira em"
              valor={`${formatarData(dataAssinaturaExpira())} (${textoExpiracao()})`}
            />
          </div>

          {!sistemaBloqueado &&
            diasParaExpirar !== null &&
            diasParaExpirar <= 3 && (
              <div style={alertaExpiracao}>
                ⚠️ Seu plano está prestes a expirar. Evite interrupções nos
                agendamentos, mensagens e recursos contratados.
              </div>
            )}

          {sistemaBloqueado && (
            <div style={alertaExpirado}>
              🔒 Sua licença está vencida. As funções ficam indisponíveis até a
              regularização do pagamento.
            </div>
          )}

          <div style={planosGridPremium}>
            <PlanoComercialCard
              nome="Básico"
              subtitulo="Essencial"
              destaque="Agendador simplificado"
              valor={textoValorPlano(valorPlanoBasico)}
              cor="#14b8a6"
              ativo={planoCardAtivo('basico')}
              bloqueado={planoCardBloqueadoPorHierarquia('basico')}
              acaoTexto={planoCardAtivo('basico') ? 'Plano atual' : 'Solicitar Básico'}
              bloqueadoTexto={sistemaBloqueado ? 'Regularize para alterar' : 'Plano superior ativo'}
              onClick={() => acaoPlano('basico')}
              recursos={[
                { texto: 'Agenda e controle de agendamentos', ativo: true },
                { texto: 'Cadastro de serviços e profissionais', ativo: true },
                { texto: 'Comprovante manual por WhatsApp', ativo: true },
                { texto: 'Botão Google Agenda', ativo: true },
                { texto: 'Pré-pagamento Mercado Pago', ativo: false },
                { texto: 'WhatsApp automático', ativo: false },
                { texto: 'Comissões e financeiro premium', ativo: false },
              ]}
            />

            <PlanoComercialCard
              nome="Plus"
              subtitulo="Crescimento"
              destaque="Pagamentos e automações"
              valor={textoValorPlano(valorPlanoPlus)}
              cor="#2563eb"
              ativo={planoCardAtivo('plus')}
              bloqueado={planoCardBloqueadoPorHierarquia('plus')}
              acaoTexto={planoCardAtivo('plus') ? 'Plano atual' : 'Solicitar Plus'}
              bloqueadoTexto={sistemaBloqueado ? 'Regularize para alterar' : 'Plano superior ativo'}
              onClick={() => acaoPlano('plus')}
              recursos={[
                { texto: 'Tudo do Básico', ativo: true },
                { texto: 'Comissões básicas por profissional', ativo: true },
                { texto: 'Promoções de aniversário, por serviço e campanhas gerais com envio facilitado via WhatsApp', ativo: true },
                { texto: 'Comprovantes automáticos via WhatsApp', ativo: true },
                { texto: 'Confirmação de agendamento e lembretes automáticos 1h antes via API WhatsApp', ativo: true },
                { texto: 'Recebimentos de agendamento online via API Mercado Pago', ativo: true },
              ]}
            />

            <PlanoComercialCard
              nome="Premium"
              subtitulo="Completo"
              destaque="Gestão avançada"
              valor={textoValorPlano(valorPlanoPremium)}
              cor="#f97316"
              ativo={planoCardAtivo('premium')}
              bloqueado={planoCardBloqueadoPorHierarquia('premium')}
              acaoTexto={planoCardAtivo('premium') ? 'Plano atual' : 'Solicitar Premium'}
              bloqueadoTexto={sistemaBloqueado ? 'Regularize para alterar' : ''}
              onClick={() => acaoPlano('premium')}
              recursos={[
                { texto: 'Tudo do Plus', ativo: true },
                { texto: 'Inclusão de serviços em agendamentos realizados e fechamento de atendimento com controle de caixa', ativo: true },
                { texto: 'Dashboard premium financeiro', ativo: true },
                { texto: 'Comissões automáticas', ativo: true },
                { texto: 'Controle de repasse de comissão', ativo: true },
                { texto: 'Envio de promoções via API WhatsApp', ativo: true },
                { texto: 'Relatórios e visão gerencial', ativo: true },
                { texto: 'Experiência completa Marcaê', ativo: true },
              ]}
            />
          </div>

          <div style={planosAcoesBox}>
            <div>
              <strong style={tituloGestaoAssinatura}>Gestão da assinatura</strong>
              <p style={descricaoGestaoAssinatura}>
                Controle o plano, pagamentos e recursos premium da empresa em um só lugar.
              </p>

              {sincronizandoRecorrencia && (
                <p style={{ margin: '8px 0 0', color: '#92400e', fontSize: 13, fontWeight: 900 }}>
                  Sincronizando assinatura com o Mercado Pago...
                </p>
              )}

              {cobrancaRecorrenteAtiva && (
                <p style={{ margin: '8px 0 0', color: '#166534', fontSize: 13, fontWeight: 900 }}>
                  Cobrança automática ativa
                  {empresa?.assinaturaProximaCobrancaEm
                    ? ` · Próxima cobrança: ${formatarData(empresa.assinaturaProximaCobrancaEm)}`
                    : ''}
                </p>
              )}
            </div>

            <div style={planosAcoesGrid}>
              {!sistemaBloqueado && (!planoPremium() || trialEstaAtivo) && (
                <div style={campoPlanoAcao}>
                  <label style={labelPlanoAcao}>
                    Escolha o plano desejado
                  </label>

                  <select
                    value=""
                    disabled={salvando}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      atualizarAssinatura({ plano: e.target.value });
                    }}
                    style={selectPlanoCompacto}
                  >
                    <option value="" disabled>
                      Selecionar plano
                    </option>

                    {trialEstaAtivo && (
                      <>
                        <option value="plus">Plano Plus</option>
                        <option value="premium">Plano Premium</option>
                      </>
                    )}

                    {!trialEstaAtivo && planoBasico() && (
                      <>
                        <option value="plus">Plano Plus</option>
                        <option value="premium">Plano Premium</option>
                      </>
                    )}

                    {!trialEstaAtivo && planoPlus() && (
                      <option value="premium">Plano Premium</option>
                    )}
                  </select>
                </div>
              )}

              {!sistemaBloqueado && (
                <button
                  disabled={ativandoRecorrencia || cobrancaRecorrenteAtiva}
                  onClick={() => ativarCobrancaAutomatica(planoAtual())}
                  style={{
                    ...botaoPagamentoCompacto,
                    background: cobrancaRecorrenteAtiva
                      ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                      : botaoPagamentoCompacto.background,
                    cursor:
                      ativandoRecorrencia || cobrancaRecorrenteAtiva
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  {ativandoRecorrencia
                    ? 'Criando assinatura...'
                    : sincronizandoRecorrencia
                    ? 'Sincronizando assinatura...'
                    : cobrancaRecorrenteAtiva
                    ? '✅ Cobrança automática ativa'
                    : '🚀 Ativar cobrança automática'}
                </button>
              )}

              {!sistemaBloqueado && !trialEstaAtivo && (
                <button
                  disabled={salvando}
                  onClick={() => atualizarAssinatura({ acao: 'ativar_trial' })}
                  style={botaoSecundarioCompacto}
                >
                  ✨ Ativar trial 7 dias
                </button>
              )}

              {!sistemaBloqueado && trialEstaAtivo && (
                <button
                  disabled={salvando}
                  onClick={() => atualizarAssinatura({ acao: 'encerrar_trial' })}
                  style={botaoCinzaCompacto}
                >
                  Encerrar trial
                </button>
              )}

              {sistemaBloqueado && (
                <button
                  disabled={ativandoRecorrencia}
                  onClick={() => ativarCobrancaAutomatica(planoAtual())}
                  style={botaoPagamentoCompacto}
                >
                  {ativandoRecorrencia
                    ? 'Criando assinatura...'
                    : '🔓 Regularizar com cobrança automática'}
                </button>
              )}
            </div>
          </div>

          {!premiumAtivo && (
            <div style={upgradeBox}>
              <strong>
                {sistemaBloqueado
                  ? '🔒 Licença expirada'
                  : planoPremiumExpirado
                  ? '🔒 Premium expirado'
                  : '🚀 Upgrade disponível'}
              </strong>
              <p style={{ margin: '6px 0 0', color: '#92400e' }}>
                {sistemaBloqueado
                  ? 'Regularize o pagamento para liberar novamente as funções do sistema.'
                  : planoBasico()
                  ? 'Suba para o Plus para liberar pré-pagamento, WhatsApp automático e lembretes. Ou vá para o Premium para liberar financeiro completo.'
                  : 'Suba para o Premium para liberar comissões, repasses, relatórios financeiros e promoções.'}
              </p>
            </div>
          )}
        </section>

        <section style={linkAgendamentoCompactoBox}>
          <div style={linkAgendamentoHeader}>
            <div>
              <span style={linkAgendamentoEyebrow}>Compartilhamento</span>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: 22 }}>
                Link de agendamento
              </h2>
              <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 13 }}>
                Use este link ou QR Code para divulgar a agenda online da empresa.
              </p>
            </div>

            <div style={qrMiniBox}>
              <img
                id="qr-image"
                src={qrCodeUrl}
                alt="QR Code"
                style={qrMiniImage}
              />
            </div>
          </div>

          <div style={linkAgendamentoLine}>
            <input
              value={linkAgendamento}
              readOnly
              style={linkAgendamentoInput}
            />

            <button
              onClick={() => {
                navigator.clipboard.writeText(linkAgendamento);
                alert('Link copiado!');
              }}
              style={linkAgendamentoBotaoRoxo}
            >
              Copiar
            </button>
          </div>

          <div id="qr-print-area" style={qrPrintAreaCompacto}>
            <p style={{ fontWeight: 900, margin: '0 0 8px', color: '#0f172a' }}>
              Escaneie para agendar
            </p>
            <img
              src={qrCodeUrl}
              alt="QR Code"
              style={{ width: 150, height: 150, borderRadius: 16, background: '#fff', padding: 8 }}
            />
            <h2 style={{ margin: '10px 0 3px', color: '#0f172a' }}>
              {empresa.nome}
            </h2>
            <p style={{ margin: 0, color: '#475569', fontWeight: 700, wordBreak: 'break-all' }}>
              {linkAgendamento}
            </p>
          </div>

          <div style={linkAgendamentoAcoes}>
            <button
              onClick={() => {
                const mensagem = montarMensagemConviteAgendamento({
                  nomeEmpresa: empresa.nome,
                  slugEmpresa: empresa.slug,
                  whatsappEmpresa: empresa.whatsapp || empresa.telefone,
                  enderecoEmpresa: empresa.endereco,
                });

                const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

                window.open(url, '_blank');
              }}
              style={linkAgendamentoBotaoVerde}
            >
              📲 WhatsApp
            </button>

            <button
              onClick={() => {
                const img = document.getElementById('qr-image') as HTMLImageElement;

                if (!img?.src) {
                  alert('QR Code não encontrado.');
                  return;
                }

                const link = document.createElement('a');
                link.href = img.src;
                link.download = `qrcode-${empresa.slug}.png`;
                link.click();
              }}
              style={linkAgendamentoBotaoAzul}
            >
              🖼️ Baixar QR
            </button>

            <button
              onClick={() => {
                const conteudo = document.getElementById('qr-print-area')?.innerHTML;
                const janela = window.open('', '_blank');

                if (!janela || !conteudo) return;

                janela.document.write(`
                  <html>
                    <head>
                      <title>QR Code - ${empresa.nome}</title>
                    </head>
                    <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:Arial,sans-serif;background:#f8fafc;">
                      <div style="text-align:center;background:#fff;padding:40px;border-radius:24px;border:1px solid #e2e8f0;">
                        ${conteudo}
                      </div>
                    </body>
                  </html>
                `);

                janela.document.close();
                janela.print();
              }}
              style={linkAgendamentoBotaoVermelho}
            >
              📄 Imprimir
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({ titulo, valor }: any) {
  return (
    <div style={infoBox}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{titulo}</div>
      <div style={{ fontWeight: 800, color: '#0f172a' }}>{valor}</div>
    </div>
  );
}

function InputCampo({ titulo, value, onChange, disabled }: any) {
  return (
    <div>
      <label style={labelStyle}>{titulo}</label>
      <input
        style={disabled ? inputBloqueado : input}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Card({ titulo, descricao, href, bloqueado, motivoBloqueio }: any) {
  const config: any = {
    Dashboard: {
      icone: '📊',
      tag: 'Financeiro',
      cor: '#7c3aed',
      fundo: '#ede9fe',
    },
    Administração: {
      icone: '🛡️',
      tag: 'Sistema',
      cor: '#16a34a',
      fundo: '#dcfce7',
    },
    Agenda: {
      icone: '📅',
      tag: 'Agenda',
      cor: '#2563eb',
      fundo: '#dbeafe',
    },
    Serviços: {
      icone: '✂️',
      tag: 'Operacional',
      cor: '#f59e0b',
      fundo: '#fef3c7',
    },
    Profissionais: {
      icone: '👥',
      tag: 'Equipe',
      cor: '#4f46e5',
      fundo: '#e0e7ff',
    },
    Clientes: {
      icone: '👤',
      tag: 'CRM',
      cor: '#f97316',
      fundo: '#ffedd5',
    },
    Promoções: {
      icone: '📣',
      tag: 'Marketing',
      cor: '#f43f5e',
      fundo: '#ffe4e6',
    },
    Comissões: {
      icone: '💰',
      tag: 'Financeiro',
      cor: '#0891b2',
      fundo: '#cffafe',
    },
  };

  const item = config[titulo] || {
    icone: '✨',
    tag: 'Módulo',
    cor: '#4f46e5',
    fundo: '#eef2ff',
  };

  function mensagemBloqueio() {
    if (motivoBloqueio === 'licenca') {
      alert('Função indisponível. Regularize o pagamento para liberar.');
      return;
    }

    if (motivoBloqueio === 'premium') {
      alert('Ative o plano Premium para liberar 🚀🔥');
      return;
    }

    alert('Você não tem permissão para acessar esta área.');
  }

  function textoBloqueio() {
    if (motivoBloqueio === 'premium') return 'Premium';
    if (motivoBloqueio === 'licenca') return 'Bloqueado';
    return 'Sem permissão';
  }

  function abrirModulo() {
    if (bloqueado) {
      mensagemBloqueio();
      return;
    }

    window.location.href = href;
  }

  return (
    <button
      type="button"
      onClick={abrirModulo}
      style={{
        ...cardModuloPremium,
        opacity: bloqueado ? 0.74 : 1,
        cursor: bloqueado ? 'not-allowed' : 'pointer',
      }}
    >
      <div
        style={{
          ...glowModulo,
          background: item.fundo,
        }}
      />

      <div style={iconeModuloBox(item.fundo, item.cor)}>
        {bloqueado ? '🔒' : item.icone}
      </div>

      <div style={conteudoModuloCompacto}>
        <h2 style={tituloCardModulo}>{titulo}</h2>

        <span
          style={{
            ...tagModulo,
            background: item.fundo,
            color: item.cor,
          }}
        >
          {item.tag}
        </span>

      </div>

      <div style={rodapeModuloCompacto}>
        <span style={bloqueado ? statusModuloBloqueado : statusModuloAtivo}>
          {bloqueado ? textoBloqueio() : 'Acessar'}
        </span>

        <span
          style={{
            ...setaModulo,
            background: bloqueado ? '#cbd5e1' : item.cor,
          }}
        >
          →
        </span>
      </div>
    </button>
  );
}

function Beneficio({ texto, ativo, cor, bloqueioTexto }: any) {
  const estiloAtivo = cor === 'azul' ? beneficioAzul : beneficioAtivo;

  return (
    <div style={ativo ? estiloAtivo : beneficioInativo}>
      <span>{ativo ? '✅' : '🔒'}</span>

      <div>
        <div>{texto}</div>

        {!ativo && bloqueioTexto && (
          <div style={textoBloqueioRecurso}>{bloqueioTexto}</div>
        )}
      </div>
    </div>
  );
}

function PlanoComercialCard({
  nome,
  subtitulo,
  destaque,
  valor,
  cor,
  recursos,
  ativo,
  bloqueado,
  acaoTexto,
  bloqueadoTexto,
  onClick,
}: any) {
  return (
    <div
      style={{
        ...planoCardPremium,
        borderColor: ativo ? cor : '#e2e8f0',
        boxShadow: ativo
          ? `0 24px 60px ${cor}2f`
          : '0 16px 42px rgba(15,23,42,0.07)',
      }}
    >
      {ativo && <div style={{ ...planoCardAtualBadge, background: cor }}>Plano atual</div>}

      <div
        style={{
          ...planoCardTopo,
          background: `linear-gradient(135deg, ${cor}, ${cor}cc)`,
        }}
      >
        <span>{subtitulo}</span>
        <strong>{nome}</strong>
      </div>

      <div style={planoCardBody}>
        <div style={planoCardDestaque}>{destaque}</div>

        <div style={planoCardPrecoLinha}>
          <strong>{valor}</strong>
          <span>/mês</span>
        </div>

        <div style={planoCardRecursos}>
          {recursos.map((recurso: any) => (
            <RecursoPlano
              key={recurso.texto}
              texto={recurso.texto}
              ativo={recurso.ativo}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onClick}
          disabled={ativo || bloqueado}
          style={{
            ...planoCardBotao,
            background: ativo || bloqueado ? '#cbd5e1' : cor,
            cursor: ativo || bloqueado ? 'not-allowed' : 'pointer',
          }}
        >
          {ativo ? 'Plano atual' : bloqueado ? bloqueadoTexto || acaoTexto : acaoTexto}
        </button>
      </div>
    </div>
  );
}

function RecursoPlano({ texto, ativo }: any) {
  return (
    <div style={ativo ? recursoPlanoAtivo : recursoPlanoInativo}>
      <span style={{ fontWeight: 950 }}>{ativo ? '✓' : '×'}</span>
      <p style={{ margin: 0 }}>{texto}</p>
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

const header = {
  background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
  color: '#fff',
  borderRadius: 24,
  padding: 30,
  marginBottom: 24,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const avisoPermissoes = {
  background: '#eef2ff',
  border: '1px solid #c7d2fe',
  color: '#3730a3',
  borderRadius: 18,
  padding: 16,
  marginBottom: 24,
};

const gridCards = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(138px, 1fr))',
  gap: 14,
  marginBottom: 22,
};

const box = {
  background: '#fff',
  borderRadius: 24,
  padding: 24,
  marginBottom: 24,
  boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
  border: '1px solid #e2e8f0',
};

const boxPremium = {
  ...box,
  background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
};

const boxResumoBloqueado = {
  ...box,
  background: '#f8fafc',
  opacity: 0.88,
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
  gridTemplateColumns: 'repeat(5, 1fr)',
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

const boxBloqueado = {
  ...box,
  opacity: 0.78,
  background: '#f8fafc',
};

const planoResumo = {
  marginTop: 18,
  background:
    'radial-gradient(circle at top right, rgba(124,58,237,0.12), transparent 34%), linear-gradient(135deg, #ffffff, #f8fafc)',
  border: '1px solid #e0e7ff',
  borderRadius: 26,
  padding: 22,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'center',
  boxShadow: '0 16px 40px rgba(15,23,42,0.06)',
};

const planoResumoExpirado = {
  ...planoResumo,
  background: 'linear-gradient(135deg, #fff7ed, #fee2e2)',
  border: '1px solid #f97316',
};

const gridInputs = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 12,
  marginTop: 18,
};

const gridInfo = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  marginTop: 16,
};

const gridBotoesBasico = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
  marginTop: 20,
};

const gridBeneficios = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: 8,
  marginTop: 14,
};

const beneficiosBox = {
  marginTop: 12,
  background: 'rgba(255,255,255,0.78)',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 14,
  boxShadow: '0 10px 26px rgba(15,23,42,0.04)',
};

const beneficiosSummary = {
  cursor: 'pointer',
  listStyle: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  color: '#0f172a',
  fontSize: 15,
  fontWeight: 950,
};

const beneficiosSummaryHint = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 800,
};

const beneficioAtivo = {
  display: 'flex',
  gap: 7,
  alignItems: 'center',
  background: '#ecfdf5',
  border: '1px solid #bbf7d0',
  color: '#166534',
  borderRadius: 999,
  padding: '8px 10px',
  fontWeight: 800,
  fontSize: 12,
};

const beneficioAzul = {
  display: 'flex',
  gap: 7,
  alignItems: 'center',
  background: '#eff6ff',
  border: '1px solid #93c5fd',
  color: '#1d4ed8',
  borderRadius: 999,
  padding: '8px 10px',
  fontWeight: 800,
  fontSize: 12,
};

const beneficioInativo = {
  display: 'flex',
  gap: 7,
  alignItems: 'flex-start',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#64748b',
  borderRadius: 999,
  padding: '8px 10px',
  fontWeight: 800,
  fontSize: 12,
};

const textoBloqueioRecurso = {
  marginTop: 4,
  fontSize: 12,
  color: '#f97316',
  fontWeight: 900,
};

const alertaExpiracao = {
  marginTop: 16,
  background: '#fee2e2',
  border: '1px solid #ef4444',
  color: '#7f1d1d',
  borderRadius: 14,
  padding: 14,
  fontWeight: 700,
};

const alertaExpirado = {
  marginTop: 16,
  background: '#fff7ed',
  border: '1px solid #f97316',
  color: '#9a3412',
  borderRadius: 14,
  padding: 14,
  fontWeight: 700,
};

const alertaPlanoExpirado = {
  background: 'linear-gradient(135deg, #fff7ed, #fee2e2)',
  border: '1px solid #fb923c',
  color: '#7c2d12',
  borderRadius: 22,
  padding: 22,
  marginBottom: 24,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'center',
  boxShadow: '0 10px 30px rgba(249,115,22,0.15)',
};

const qrPrintArea = {
  marginTop: 20,
  textAlign: 'center' as const,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 18,
};

const infoBox = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 14,
  boxShadow: '0 10px 24px rgba(15,23,42,0.04)',
};

const card = {
  background: '#fff',
  borderRadius: 20,
  padding: 22,
  boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
  border: '1px solid #e2e8f0',
};

const cardBloqueado = {
  ...card,
  opacity: 0.82,
  background: '#f8fafc',
};

const labelStyle = {
  display: 'block',
  fontWeight: 700,
  marginBottom: 8,
};

const input = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  fontWeight: 700,
  boxSizing: 'border-box' as const,
};

const inputBloqueado = {
  ...input,
  background: '#e2e8f0',
  color: '#64748b',
  cursor: 'not-allowed',
};

const selectPlano = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  fontWeight: 700,
};

const botaoPrincipal = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: 'none',
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const botaoBloqueado = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: 'none',
  background: '#f97316',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const botaoSecundario = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: 'none',
  background: '#16a34a',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const botaoCinza = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: 'none',
  background: '#64748b',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const botaoPagamento = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: 'none',
  background: '#f59e0b',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const botaoPagamentoMenor = {
  padding: '12px 18px',
  borderRadius: 12,
  border: 'none',
  background: '#f59e0b',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
  whiteSpace: 'nowrap' as const,
};

const botaoBranco = {
  padding: '10px 16px',
  borderRadius: 12,
  border: 'none',
  background: '#fff',
  color: '#4f46e5',
  fontWeight: 700,
  cursor: 'pointer',
};

const botaoBrancoBloqueado = {
  ...botaoBranco,
  opacity: 0.65,
  cursor: 'not-allowed',
};

const badgePremium = {
  display: 'inline-block',
  background: '#dcfce7',
  color: '#166534',
  padding: '6px 12px',
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 13,
};

const badgePlus = {
  display: 'inline-block',
  background: '#fef3c7',
  color: '#92400e',
  padding: '6px 12px',
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 13,
};

const badgeTrial = {
  display: 'inline-block',
  background: '#e0e7ff',
  color: '#3730a3',
  padding: '6px 12px',
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 13,
};

const badgeBasicoAtivo = {
  display: 'inline-block',
  background: '#dbeafe',
  color: '#1e40af',
  padding: '6px 12px',
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 13,
};

const badgeExpirado = {
  display: 'inline-block',
  background: '#ffedd5',
  color: '#9a3412',
  padding: '6px 12px',
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 13,
};

const upgradeBox = {
  marginTop: 20,
  background: '#fef3c7',
  border: '1px solid #f59e0b',
  color: '#78350f',
  borderRadius: 16,
  padding: 16,
};

const cardModuloPremium = {
  width: '100%',
  minHeight: 142,
  background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
  borderRadius: 24,
  padding: 16,
  boxShadow: '0 14px 34px rgba(15,23,42,0.06)',
  border: '1px solid #e2e8f0',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  textAlign: 'center' as const,
  position: 'relative' as const,
  overflow: 'hidden',
  transition: '0.22s ease',
};

const glowModulo = {
  position: 'absolute' as const,
  top: -44,
  right: -44,
  width: 112,
  height: 112,
  borderRadius: 999,
  opacity: 0.55,
};

const iconeModuloBox = (fundo: string, cor: string) => ({
  width: 52,
  height: 52,
  borderRadius: 18,
  background: fundo,
  color: cor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 25,
  fontWeight: 900,
  position: 'relative' as const,
  zIndex: 2,
  boxShadow: '0 10px 22px rgba(15,23,42,0.06)',
});

const conteudoModuloCompacto = {
  position: 'relative' as const,
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: 7,
};

const tituloCardModulo = {
  margin: 0,
  color: '#0f172a',
  fontSize: 17,
  fontWeight: 950,
  letterSpacing: '-0.045em',
};

const tagModulo = {
  borderRadius: 999,
  padding: '5px 9px',
  fontSize: 10,
  fontWeight: 950,
};

const descricaoCardModulo = {
  color: '#64748b',
  margin: 0,
  lineHeight: 1.4,
  fontSize: 12,
  fontWeight: 700,
};

const rodapeModuloCompacto = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  position: 'relative' as const,
  zIndex: 2,
  marginTop: 2,
};

const statusModuloAtivo = {
  color: '#475569',
  fontSize: 12,
  fontWeight: 900,
};

const statusModuloBloqueado = {
  color: '#f97316',
  fontSize: 12,
  fontWeight: 950,
};

const setaModulo = {
  width: 30,
  height: 30,
  minWidth: 30,
  borderRadius: 12,
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 15,
  fontWeight: 950,
};


const boxPlanosPremium = {
  background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
  borderRadius: 28,
  padding: 24,
  marginBottom: 24,
  boxShadow: '0 16px 42px rgba(15,23,42,0.08)',
  border: '1px solid #e2e8f0',
};

const planosHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 18,
  flexWrap: 'wrap' as const,
  marginBottom: 18,
};

const planosEyebrow = {
  display: 'block',
  color: '#7c3aed',
  fontSize: 12,
  fontWeight: 950,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: 7,
};

const planoStatusAtivo = {
  minWidth: 150,
  borderRadius: 18,
  padding: 14,
  background: '#ecfdf5',
  border: '1px solid #bbf7d0',
  color: '#166534',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 3,
  fontSize: 13,
};

const planoStatusExpirado = {
  ...planoStatusAtivo,
  background: '#fff7ed',
  border: '1px solid #fed7aa',
  color: '#9a3412',
};

const gridInfoPlanos = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  marginBottom: 18,
};

const planosGridPremium = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 18,
  alignItems: 'stretch',
};

const planoCardPremium = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 28,
  overflow: 'hidden',
  position: 'relative' as const,
};

const planoCardAtualBadge = {
  position: 'absolute' as const,
  top: 12,
  right: 12,
  zIndex: 3,
  color: '#fff',
  borderRadius: 999,
  padding: '7px 10px',
  fontSize: 11,
  fontWeight: 950,
};

const planoCardTopo = {
  minHeight: 116,
  padding: '24px 22px',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  clipPath: 'polygon(0 0, 100% 0, 100% 78%, 50% 100%, 0 78%)',
};

const planoCardBody = {
  padding: '24px 22px 22px',
};

const planoCardDestaque = {
  color: '#64748b',
  fontSize: 13,
  fontWeight: 900,
  marginBottom: 14,
};

const planoCardPrecoLinha = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: 5,
  marginBottom: 18,
};

const planoCardRecursos = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 12,
  minHeight: 300,
};

const recursoPlanoAtivo = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  color: '#166534',
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.42,
};

const recursoPlanoInativo = {
  ...recursoPlanoAtivo,
  color: '#991b1b',
};

const planoCardBotao = {
  width: '100%',
  marginTop: 20,
  height: 46,
  border: 'none',
  borderRadius: 16,
  color: '#fff',
  fontWeight: 950,
};

const planosAcoesBox = {
  marginTop: 22,
  borderRadius: 28,
  padding: 22,
  background:
    'radial-gradient(circle at top right, rgba(245,158,11,0.12), transparent 34%), linear-gradient(135deg, #ffffff, #f8fafc)',
  border: '1px solid #e2e8f0',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(360px, 1fr)',
  gap: 20,
  alignItems: 'center',
  boxShadow: '0 16px 42px rgba(15,23,42,0.06)',
};

const tituloGestaoAssinatura = {
  display: 'block',
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 950,
  letterSpacing: '-0.035em',
};

const descricaoGestaoAssinatura = {
  margin: '6px 0 0',
  color: '#64748b',
  fontSize: 13,
  lineHeight: 1.5,
};

const planosAcoesGrid = {
  display: 'grid',
  gridTemplateColumns: 'minmax(180px, 1fr) minmax(180px, 1fr)',
  gap: 12,
  alignItems: 'end',
};

const campoPlanoAcao = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 7,
};

const labelPlanoAcao = {
  color: '#475569',
  fontSize: 12,
  fontWeight: 950,
};

const botaoSecundarioCompacto = {
  minHeight: 48,
  borderRadius: 16,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#475569',
  fontWeight: 950,
  cursor: 'pointer',
  boxShadow: '0 10px 22px rgba(15,23,42,0.04)',
};

const botaoCinzaCompacto = {
  ...botaoSecundarioCompacto,
  background: '#f8fafc',
  color: '#64748b',
  boxShadow: 'none',
};

const botaoPagamentoCompacto = {
  minHeight: 48,
  borderRadius: 16,
  border: 'none',
  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
  color: '#ffffff',
  fontWeight: 950,
  cursor: 'pointer',
  boxShadow: '0 14px 30px rgba(249,115,22,0.22)',
};

const selectPlanoCompacto = {
  minHeight: 48,
  borderRadius: 16,
  border: '1px solid #cbd5e1',
  background: '#fff',
  padding: '0 14px',
  fontWeight: 900,
  color: '#0f172a',
  boxShadow: '0 10px 22px rgba(15,23,42,0.04)',
  outline: 'none',
};

const linkAgendamentoCompactoBox = {
  background: '#ffffff',
  borderRadius: 26,
  padding: 20,
  marginBottom: 24,
  boxShadow: '0 14px 34px rgba(15,23,42,0.06)',
  border: '1px solid #e2e8f0',
};

const linkAgendamentoHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 14,
};

const linkAgendamentoEyebrow = {
  display: 'block',
  color: '#7c3aed',
  fontSize: 11,
  fontWeight: 950,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: 5,
};

const qrMiniBox = {
  width: 92,
  height: 92,
  borderRadius: 18,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const qrMiniImage = {
  width: 76,
  height: 76,
  borderRadius: 12,
};

const linkAgendamentoLine = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 130px',
  gap: 10,
};

const linkAgendamentoInput = {
  width: '100%',
  minWidth: 0,
  padding: '12px 13px',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#f8fafc',
  fontWeight: 800,
  color: '#0f172a',
  boxSizing: 'border-box' as const,
};

const linkAgendamentoBotaoRoxo = {
  border: 'none',
  borderRadius: 14,
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
};

const linkAgendamentoAcoes = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 10,
  marginTop: 12,
};

const linkAgendamentoBotaoVerde = {
  minHeight: 42,
  border: 'none',
  borderRadius: 14,
  background: '#16a34a',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
};

const linkAgendamentoBotaoAzul = {
  ...linkAgendamentoBotaoVerde,
  background: '#0ea5e9',
};

const linkAgendamentoBotaoVermelho = {
  ...linkAgendamentoBotaoVerde,
  background: '#ef4444',
};

const qrPrintAreaCompacto = {
  display: 'none',
};
