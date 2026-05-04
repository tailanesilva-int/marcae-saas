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

  const [dadosEmpresa, setDadosEmpresa] = useState({
    nome: '',
    endereco: '',
    telefone: '',
    responsavel: '',
  });

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

        setEmpresa(data.empresa);
        localStorage.setItem('empresaLogada', JSON.stringify(data.empresa));

        setDadosEmpresa({
          nome: data.empresa.nome || '',
          endereco: data.empresa.endereco || '',
          telefone: data.empresa.telefone || '',
          responsavel: data.empresa.responsavel || '',
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
    if (trialAtivo()) return 'Trial 7 dias';
    if (licencaExpirada() && planoPremium()) return 'Premium expirado';
    if (licencaExpirada() && planoPlus()) return 'Plus expirado';
    if (licencaExpirada()) return 'Básico vencido';
    if (planoPremium()) return 'Premium';
    if (planoPlus()) return 'Plus';
    return 'Básico';
  }

  function textoBadge() {
    if (trialAtivo()) return 'Trial ativo';
    if (licencaExpirada()) return 'Licença expirada';
    if (planoPremium()) return 'Premium ativo';
    if (planoPlus()) return 'Plus ativo';
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

  if (!empresa || !usuario) {
    return <p style={{ padding: 40 }}>Carregando...</p>;
  }

  const diasParaExpirar = diasRestantes(dataAssinaturaExpira());
  const premiumAtivo = temPremium();
  const plusOuPremiumAtivo = temPlusOuPremium();
  const trialEstaAtivo = trialAtivo();
  const sistemaBloqueado = licencaExpirada();
  const planoPremiumExpirado = premiumExpirado();

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

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', padding: 30 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={header}>
          <div>
            <h1 style={{ margin: 0 }}>Administração</h1>
            <p style={{ marginTop: 8 }}>
              {usuario.nome} · {empresa.nome}
            </p>

            <div style={{ marginTop: 12 }}>
              <span style={estiloBadge()}>{textoBadge()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() =>
                acaoBloqueadaPorLicencaOuPermissao('configuracoes', () => {
                  window.location.href = '/configuracoes';
                })
              }
              style={configuracoesBloqueado ? botaoBrancoBloqueado : botaoBranco}
            >
              ⚙️ Configurações
            </button>

            <button
              onClick={() =>
                acaoBloqueadaPorLicencaOuPermissao('dashboard', () => {
                  window.location.href = '/dashboard';
                })
              }
              style={dashboardBloqueado ? botaoBrancoBloqueado : botaoBranco}
            >
              Dashboard
            </button>

            <button onClick={sair} style={botaoBranco}>
              Sair
            </button>
          </div>
        </header>

        {podeVerResumoFinanceiro && financeiro && (
          <section style={boxPremium}>
            <div style={tituloLinha}>
              <div>
                <h2 style={{ margin: 0 }}>Dashboard premium</h2>
                <p style={{ color: '#64748b', margin: '6px 0 0' }}>
                  Visão financeira do mês com faturamento, comissões e lucro estimado.
                </p>
              </div>

              <button
                onClick={() => (window.location.href = '/comissoes')}
                style={botaoPequenoRoxo}
              >
                Ver comissões
              </button>
            </div>

            <div style={gridFinanceiroPremium}>
              <CardFinanceiro
                titulo="Faturamento bruto"
                valor={formatarMoeda(financeiro.faturamentoBruto)}
                descricao="Pagamentos recebidos no mês"
                cor="#16a34a"
              />

              <CardFinanceiro
                titulo="Total de comissões"
                valor={formatarMoeda(financeiro.totalComissoes)}
                descricao="Custo variável gerado"
                cor="#dc2626"
              />

              <CardFinanceiro
                titulo="Comissões pagas"
                valor={formatarMoeda(financeiro.comissoesPagas)}
                descricao="Repasses já realizados"
                cor="#2563eb"
              />

              <CardFinanceiro
                titulo="Comissões pendentes"
                valor={formatarMoeda(financeiro.comissoesPendentes)}
                descricao="Valor ainda em aberto"
                cor="#f59e0b"
              />

              <CardFinanceiro
                titulo="Líquido estimado"
                valor={formatarMoeda(financeiro.liquidoEstimado)}
                descricao="Faturamento menos comissões"
                cor="#7c3aed"
              />
            </div>
          </section>
        )}

        {!podeVerResumoFinanceiro && !sistemaBloqueado && (
          <section style={boxResumoBloqueado}>
            <strong>🔒 Dashboard premium</strong>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>
              Ative o plano Premium para liberar 🚀🔥
            </p>
          </section>
        )}

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

        <section style={box}>
          <div>
            <h2 style={{ marginTop: 0 }}>Link de agendamento</h2>
            <p style={{ color: '#64748b', marginTop: 4 }}>
              Compartilhe esse link com seus clientes para agendamento online.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <input
              value={linkAgendamento}
              readOnly
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                fontWeight: 700,
                background: '#f8fafc',
              }}
            />

            <button
              onClick={() => {
                navigator.clipboard.writeText(linkAgendamento);
                alert('Link copiado!');
              }}
              style={botaoPrincipal}
            >
              Copiar
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
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
              style={{
                ...botaoPrincipal,
                background: '#16a34a',
              }}
            >
              📲 Compartilhar no WhatsApp
            </button>
          </div>

          <div id="qr-print-area" style={qrPrintArea}>
            <p style={{ fontWeight: 800, marginBottom: 10 }}>
              Escaneie para agendar
            </p>

            <img
              id="qr-image"
              src={qrCodeUrl}
              alt="QR Code"
              style={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: 8,
                background: '#fff',
              }}
            />

            <h2 style={{ margin: '12px 0 4px', color: '#0f172a' }}>
              {empresa.nome}
            </h2>

            <p style={{ margin: 0, color: '#475569', fontWeight: 700 }}>
              {linkAgendamento}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'center' }}>
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
              style={{
                ...botaoPrincipal,
                background: '#0ea5e9',
              }}
            >
              🖼️ Salvar imagem
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
              style={{
                ...botaoPrincipal,
                background: '#ef4444',
              }}
            >
              📄 Gerar PDF / Imprimir
            </button>
          </div>
        </section>

        <section style={configuracoesBloqueado ? boxBloqueado : box}>
          <div>
            <h2 style={{ marginTop: 0 }}>Dados da empresa</h2>
            <p style={{ color: '#64748b', marginTop: 4 }}>
              Esses dados aparecerão nas mensagens enviadas pelo WhatsApp.
            </p>
          </div>

          <div style={gridInputs}>
            <InputCampo
              titulo="Nome"
              value={dadosEmpresa.nome}
              disabled={configuracoesBloqueado}
              onChange={(value: string) =>
                setDadosEmpresa({ ...dadosEmpresa, nome: value })
              }
            />

            <InputCampo
              titulo="Endereço"
              value={dadosEmpresa.endereco}
              disabled={configuracoesBloqueado}
              onChange={(value: string) =>
                setDadosEmpresa({ ...dadosEmpresa, endereco: value })
              }
            />

            <InputCampo
              titulo="Telefone"
              value={dadosEmpresa.telefone}
              disabled={configuracoesBloqueado}
              onChange={(value: string) =>
                setDadosEmpresa({ ...dadosEmpresa, telefone: value })
              }
            />

            <InputCampo
              titulo="Responsável"
              value={dadosEmpresa.responsavel}
              disabled={configuracoesBloqueado}
              onChange={(value: string) =>
                setDadosEmpresa({ ...dadosEmpresa, responsavel: value })
              }
            />
          </div>

          <button
            onClick={salvarDadosEmpresa}
            disabled={salvandoEmpresa || configuracoesBloqueado}
            style={{
              ...(configuracoesBloqueado ? botaoBloqueado : botaoPrincipal),
              marginTop: 18,
            }}
          >
            {configuracoesBloqueado
              ? 'Indisponível'
              : salvandoEmpresa
              ? 'Salvando...'
              : 'Salvar dados'}
          </button>
        </section>

        <section style={box}>
          <div>
            <h2 style={{ marginTop: 0 }}>Plano e assinatura</h2>
            <p style={{ color: '#64748b', marginTop: 4 }}>
              Controle o plano da empresa, trial gratuito e status da assinatura.
            </p>
          </div>

          <div style={sistemaBloqueado ? planoResumoExpirado : planoResumo}>
            <div>
              <span style={estiloBadge()}>{textoBadge()}</span>
              <h3 style={{ margin: '12px 0 6px' }}>{nomePlanoAtual()}</h3>
              <p style={{ color: '#64748b', margin: 0 }}>{descricaoPlano()}</p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>
                {planoPremium()
                  ? 'Plano Premium'
                  : planoPlus()
                  ? 'Plano Plus'
                  : 'Plano Básico'}
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>
                {planoPremium()
                  ? 'Completo'
                  : planoPlus()
                  ? 'Intermediário'
                  : 'Entrada'}
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                {planoPremium()
                  ? 'Financeiro, comissões, promoções e dashboard premium'
                  : planoPlus()
                  ? 'Pré-pagamento, WhatsApp automático e lembretes'
                  : 'Agenda, serviços e envio manual'}
              </div>
            </div>
          </div>

          <div style={gridInfo}>
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

          <div style={beneficiosBox}>
            <h3 style={{ marginTop: 0 }}>Recursos do plano Básico</h3>

            <div style={gridBeneficios}>
              <Beneficio texto="Agenda e controle de agendamentos" ativo={true} />
              <Beneficio texto="Cadastro de serviços e profissionais" ativo={true} />
              <Beneficio texto="Comprovante manual por WhatsApp" ativo={true} />
              <Beneficio texto="Botão Google Agenda" ativo={true} />
            </div>
          </div>

          <div style={beneficiosBox}>
            <h3 style={{ marginTop: 0 }}>Recursos do plano Plus</h3>

            <div style={gridBeneficios}>
              <Beneficio texto="Agenda e controle de agendamentos" ativo={true} />
              <Beneficio texto="Cadastro de serviços e profissionais" ativo={true} />
              <Beneficio texto="Comprovante manual por WhatsApp" ativo={true} />
              <Beneficio texto="Botão Google Agenda" ativo={true} />

              <Beneficio
                texto="Pré-pagamento pelo Mercado Pago"
                ativo={!sistemaBloqueado && plusOuPremiumAtivo}
                cor="azul"
                bloqueioTexto="Ative o plano Plus para liberar 🚀🔥"
              />
              <Beneficio
                texto="Confirmação automática pelo WhatsApp"
                ativo={!sistemaBloqueado && plusOuPremiumAtivo}
                cor="azul"
                bloqueioTexto="Ative o plano Plus para liberar 🚀🔥"
              />
              <Beneficio
                texto="Lembretes automáticos via WhatsApp"
                ativo={!sistemaBloqueado && plusOuPremiumAtivo}
                cor="azul"
                bloqueioTexto="Ative o plano Plus para liberar 🚀🔥"
              />
              <Beneficio
                texto="Comprovantes automáticos"
                ativo={!sistemaBloqueado && plusOuPremiumAtivo}
                cor="azul"
                bloqueioTexto="Ative o plano Plus para liberar 🚀🔥"
              />
            </div>
          </div>

          <div style={beneficiosBox}>
            <h3 style={{ marginTop: 0 }}>Recursos do plano Premium</h3>

            <div style={gridBeneficios}>
              <Beneficio texto="Agenda e controle de agendamentos" ativo={true} />
              <Beneficio texto="Cadastro de serviços e profissionais" ativo={true} />
              <Beneficio texto="Comprovante manual por WhatsApp" ativo={true} />
              <Beneficio texto="Botão Google Agenda" ativo={true} />

              <Beneficio texto="Pré-pagamento pelo Mercado Pago" ativo={!sistemaBloqueado && plusOuPremiumAtivo} />
              <Beneficio texto="Confirmação automática pelo WhatsApp" ativo={!sistemaBloqueado && plusOuPremiumAtivo} />
              <Beneficio texto="Lembretes automáticos via WhatsApp" ativo={!sistemaBloqueado && plusOuPremiumAtivo} />
              <Beneficio texto="Comprovantes automáticos" ativo={!sistemaBloqueado && plusOuPremiumAtivo} />

              <Beneficio
                texto="Dashboard premium financeiro"
                ativo={!sistemaBloqueado && premiumAtivo}
                cor="azul"
                bloqueioTexto="Ative o plano Premium para liberar 🚀🔥"
              />
              <Beneficio
                texto="Comissões automáticas"
                ativo={!sistemaBloqueado && premiumAtivo}
                cor="azul"
                bloqueioTexto="Ative o plano Premium para liberar 🚀🔥"
              />
              <Beneficio
                texto="Controle de repasse de comissão"
                ativo={!sistemaBloqueado && premiumAtivo}
                cor="azul"
                bloqueioTexto="Ative o plano Premium para liberar 🚀🔥"
              />
              <Beneficio
                texto="Envio de promoções via WhatsApp"
                ativo={!sistemaBloqueado && premiumAtivo}
                cor="azul"
                bloqueioTexto="Ative o plano Premium para liberar 🚀🔥"
              />
            </div>
          </div>

          {!sistemaBloqueado && (!planoPremium() || trialEstaAtivo) && (
            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>
                {trialEstaAtivo
                  ? 'Escolher plano após o trial'
                  : planoPlus()
                  ? 'Fazer upgrade de plano'
                  : 'Alterar plano'}
              </label>

              <select
                value=""
                disabled={salvando}
                onChange={(e) => {
                  if (!e.target.value) return;
                  atualizarAssinatura({ plano: e.target.value });
                }}
                style={selectPlano}
              >
                <option value="" disabled>
                  {trialEstaAtivo
                    ? 'Escolha um plano após o trial'
                    : planoPlus()
                    ? 'Subir para o Plano Premium'
                    : 'Escolha o plano para upgrade'}
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
            <div style={gridBotoesBasico}>
              {!trialEstaAtivo && (
                <button
                  disabled={salvando}
                  onClick={() => atualizarAssinatura({ acao: 'ativar_trial' })}
                  style={botaoSecundario}
                >
                  Ativar trial 7 dias
                </button>
              )}

              {trialEstaAtivo && (
                <button
                  disabled={salvando}
                  onClick={() => atualizarAssinatura({ acao: 'encerrar_trial' })}
                  style={botaoCinza}
                >
                  Encerrar trial
                </button>
              )}

              <button
                disabled={gerandoPagamento}
                onClick={pagarMensalidade}
                style={botaoPagamento}
              >
                {gerandoPagamento ? 'Gerando pagamento...' : 'Pagar mensalidade'}
              </button>
            </div>
          )}

          {!sistemaBloqueado &&
            empresa.modoPagamentoAssinatura !== 'recorrente' && (
              <div style={gridBotoesBasico}>
                <button
                  disabled={gerandoPagamento}
                  onClick={pagarMensalidade}
                  style={botaoPagamento}
                >
                  {gerandoPagamento ? 'Gerando pagamento...' : 'Renovar mensalidade'}
                </button>
              </div>
            )}

          {sistemaBloqueado && (
            <div style={gridBotoesBasico}>
              <button
                disabled={gerandoPagamento}
                onClick={pagarMensalidade}
                style={botaoPagamento}
              >
                {gerandoPagamento ? 'Gerando pagamento...' : 'Regularizar pagamento'}
              </button>
            </div>
          )}

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

  function textoBotaoBloqueado() {
    if (motivoBloqueio === 'premium') {
      return 'Ative Premium para liberar 🚀🔥';
    }

    if (motivoBloqueio === 'licenca') {
      return 'Regularize para liberar';
    }

    return 'Sem permissão';
  }

  return (
    <div style={bloqueado ? cardBloqueado : card}>
      <h2 style={{ marginTop: 0 }}>
        {bloqueado ? '🔒 ' : ''}
        {titulo}
      </h2>
      <p style={{ color: '#64748b', minHeight: 48 }}>{descricao}</p>

      {bloqueado ? (
        <button style={botaoBloqueado} onClick={mensagemBloqueio}>
          {textoBotaoBloqueado()}
        </button>
      ) : (
        <a href={href}>
          <button style={botaoPrincipal}>Acessar</button>
        </a>
      )}
    </div>
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
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 18,
  marginBottom: 24,
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
  background: 'linear-gradient(135deg, #f8fafc, #eef2ff)',
  border: '1px solid #c7d2fe',
  borderRadius: 20,
  padding: 18,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'center',
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
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 14,
  marginTop: 18,
};

const gridBotoesBasico = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
  marginTop: 20,
};

const gridBeneficios = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 10,
};

const beneficiosBox = {
  marginTop: 18,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 18,
};

const beneficioAtivo = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  background: '#ecfdf5',
  border: '1px solid #bbf7d0',
  color: '#166534',
  borderRadius: 12,
  padding: 10,
  fontWeight: 700,
};

const beneficioAzul = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  background: '#eff6ff',
  border: '1px solid #93c5fd',
  color: '#1d4ed8',
  borderRadius: 12,
  padding: 10,
  fontWeight: 700,
};

const beneficioInativo = {
  display: 'flex',
  gap: 8,
  alignItems: 'flex-start',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#64748b',
  borderRadius: 12,
  padding: 10,
  fontWeight: 700,
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
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
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