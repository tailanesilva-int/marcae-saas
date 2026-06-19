'use client';

import { useEffect, useState } from 'react';
import PremiumLayout from '@/components/layout/PremiumLayout';
import { obterStatusLicencaEmpresa } from '@/app/lib/licencaEmpresa';
import type { CSSProperties } from 'react';

type PlanoTipo = 'basico' | 'premium';

export default function PlanosPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);

  const [salvando, setSalvando] = useState(false);
  const [gerandoPagamento, setGerandoPagamento] = useState(false);
  const [gerandoPix, setGerandoPix] = useState(false);
  const [pixPagamento, setPixPagamento] = useState<any>(null);
  const [statusPix, setStatusPix] = useState<'idle' | 'pendente' | 'aprovado' | 'erro'>('idle');
  const [copiadoPix, setCopiadoPix] = useState(false);
  const [ativandoRecorrencia, setAtivandoRecorrencia] = useState(false);
  const [sincronizandoRecorrencia, setSincronizandoRecorrencia] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [recursosAbertosPlanos, setRecursosAbertosPlanos] = useState<PlanoTipo[]>([]);

  const [configPlanos, setConfigPlanos] = useState({
    valorPlanoBasico: null as number | null,
    valorPlanoPremium: null as number | null,
  });

  useEffect(() => {
    carregarConfiguracaoPlanos();
    carregarDados();
  }, []);

  useEffect(() => {
    function atualizarMobile() {
      setIsMobile(window.innerWidth <= 760);
    }

    atualizarMobile();
    window.addEventListener('resize', atualizarMobile);

    return () => window.removeEventListener('resize', atualizarMobile);
  }, []);

  useEffect(() => {
    if (!empresa?.id || !pixPagamento?.paymentId || statusPix === 'aprovado') return;

    let cancelado = false;

    async function verificar() {
      await consultarStatusPix(cancelado);
    }

    verificar();

    const interval = setInterval(verificar, 5000);

    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [empresa?.id, pixPagamento?.paymentId, statusPix]);

  async function carregarDados() {
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
        alert(data.error || 'Erro ao carregar empresa.');
        return;
      }

      const empresaSincronizada = await sincronizarAssinaturaRecorrente(data.empresa);

      setEmpresa(empresaSincronizada);
      localStorage.setItem('empresaLogada', JSON.stringify(data.empresa));
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar dados da empresa.');
    }
  }

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
        return empresaAtual;
      }

      localStorage.setItem('empresaLogada', JSON.stringify(data.empresa));

      return data.empresa;
    } catch (error) {
      console.error(error);
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

      if (!res.ok) return;

      const data = await res.json();

      const configuracao =
        data?.configuracao ||
        data?.config ||
        data?.configuracaoSaas ||
        data?.planos ||
        data;

      setConfigPlanos({
        valorPlanoBasico: normalizarValorPlano(configuracao?.valorPlanoBasico),
        valorPlanoPremium: normalizarValorPlano(configuracao?.valorPlanoPremium),
      });
    } catch (error) {
      console.error('Erro ao carregar configuração dos planos:', error);
    }
  }

  function normalizarValorPlano(valor: any) {
    if (valor === null || valor === undefined || valor === '') return null;

    if (typeof valor === 'number' && Number.isFinite(valor)) return valor;

    if (typeof valor === 'string') {
      const limpo = valor.replace('R$', '').replace(/\s/g, '').trim();

      const numero = limpo.includes(',')
        ? Number(limpo.replace(/\./g, '').replace(',', '.'))
        : Number(limpo);

      return Number.isFinite(numero) ? numero : null;
    }

    return null;
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

  function formatarMoeda(valor?: number | null) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function textoValorPlano(valor?: number | null) {
    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
      return 'Sob consulta';
    }

    return formatarMoeda(Number(valor));
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

  function planoAtual(): PlanoTipo {
    const planoNormalizado = String(empresa?.plano || 'basico').toLowerCase();

    if (planoNormalizado === 'plus') return 'premium';
    if (planoNormalizado === 'premium') return 'premium';

    return 'basico';
  }

  function planoBasico() {
    return planoAtual() === 'basico';
  }

  function planoPremium() {
    return planoAtual() === 'premium';
  }

  function nomePlanoAtual() {
    if (trialAtivo()) return 'Trial 7 dias';
    if (licencaExpirada()) return 'Licença vencida';
    if (planoPremium()) return 'Premium';
    return 'Básico';
  }

  function textoBadge() {
    if (licencaExpirada()) return 'Licença expirada';
    if (trialAtivo()) return 'Trial ativo';
    if (planoPremium()) return 'Premium ativo';
    return 'Básico ativo';
  }

  function dataAssinaturaExpira() {
    if (trialAtivo()) return empresa?.trialExpiraEm;
    return empresa?.assinaturaExpiraEm;
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

  function planoCardAtivo(plano: PlanoTipo) {
    if (plano === 'premium') return planoPremium() && !trialAtivo();
    return planoBasico() && !trialAtivo();
  }

  function planoCardBloqueadoPorHierarquia(plano: PlanoTipo) {
    if (licencaExpirada()) return true;

    if (plano === 'basico') {
      return planoPremium();
    }

    return false;
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
      console.error(error);
      alert('Erro ao atualizar assinatura.');
    } finally {
      setSalvando(false);
    }
  }

  async function pagarMensalidade() {
    try {
      setGerandoPagamento(true);

      const res = await fetch(`/api/admin/empresas/${empresa.id}/assinatura/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo: 'manual', plano: planoAtual() }),
      });

      const data = await res.json();

      if (!data.success && !data.linkPagamento) {
        alert(data.error || 'Erro ao gerar pagamento da mensalidade.');
        return;
      }

      window.location.href = data.linkPagamento;
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar pagamento da mensalidade.');
    } finally {
      setGerandoPagamento(false);
    }
  }

  async function gerarPixMensalidade() {
    if (!empresa?.id) return;

    try {
      setGerandoPix(true);
      setStatusPix('pendente');
      setCopiadoPix(false);

      const res = await fetch(`/api/admin/empresas/${empresa.id}/assinatura/pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: planoAtual() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setStatusPix('erro');
        alert(data?.error || 'Erro ao gerar Pix da mensalidade.');
        return;
      }

      setPixPagamento(data);
    } catch (error) {
      console.error(error);
      setStatusPix('erro');
      alert('Erro ao gerar Pix da mensalidade.');
    } finally {
      setGerandoPix(false);
    }
  }

  async function consultarStatusPix(cancelado = false) {
    if (!empresa?.id || !pixPagamento?.paymentId) return;

    try {
      const res = await fetch(
        `/api/admin/empresas/${empresa.id}/assinatura/pix/status?paymentId=${pixPagamento.paymentId}`,
        { cache: 'no-store' }
      );

      const data = await res.json().catch(() => null);

      if (cancelado || !data?.success) return;

      if (data.aprovado) {
        setStatusPix('aprovado');

        if (data.empresa) {
          setEmpresa(data.empresa);
          localStorage.setItem('empresaLogada', JSON.stringify(data.empresa));
        }

        setTimeout(() => {
          window.location.reload();
        }, 1400);
      } else {
        setStatusPix('pendente');
      }
    } catch (error) {
      if (!cancelado) {
        console.error('Erro ao consultar status do Pix:', error);
      }
    }
  }

  async function copiarCodigoPix() {
    if (!pixPagamento?.qrCode) return;

    try {
      await navigator.clipboard.writeText(pixPagamento.qrCode);
      setCopiadoPix(true);

      setTimeout(() => {
        setCopiadoPix(false);
      }, 2200);
    } catch (error) {
      alert('Não foi possível copiar o código Pix.');
    }
  }

  async function ativarCobrancaAutomatica(planoSelecionado?: PlanoTipo) {
    if (licencaExpirada()) {
      alert('Regularize sua licença antes de alterar a cobrança.');
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
      console.error(error);
      alert('Erro ao ativar cobrança automática.');
    } finally {
      setAtivandoRecorrencia(false);
    }
  }

  function acaoPlano(plano: PlanoTipo) {
    if (licencaExpirada()) {
      alert('Regularize a licença para alterar o plano.');
      return;
    }

    if (planoCardAtivo(plano)) return;

    if (planoCardBloqueadoPorHierarquia(plano)) {
      alert(
        'Não é permitido regredir para um plano inferior pelo painel da empresa. Alterações de downgrade devem ser feitas pelo painel master.'
      );
      return;
    }

    ativarCobrancaAutomatica(plano);
  }

  function alternarRecursosPlano(plano: PlanoTipo) {
    setRecursosAbertosPlanos((atual) =>
      atual.includes(plano)
        ? atual.filter((item) => item !== plano)
        : [...atual, plano]
    );
  }

  if (!empresa || !usuario) {
    return (
      <PremiumLayout empresa={empresa} usuario={usuario}>
        <div style={loadingBox}>Carregando gerenciamento de planos...</div>
      </PremiumLayout>
    );
  }

  const licencaEmpresa = obterStatusLicencaEmpresa(empresa);
  const sistemaBloqueado = licencaEmpresa.status === 'bloqueio_total';
  const diasParaExpirar = diasRestantes(dataAssinaturaExpira());

  const cobrancaRecorrenteAtiva =
    Boolean(empresa?.assinaturaRecorrenteAtiva) &&
    empresa?.assinaturaStatus === 'ativa';

  const valorPlanoBasico =
    configPlanos.valorPlanoBasico ??
    empresa.valorPlanoBasico ??
    empresa.valorMensalBasico ??
    empresa.precoPlanoBasico ??
    null;

  const valorPlanoPremium =
    configPlanos.valorPlanoPremium ??
    empresa.valorPlanoPremium ??
    empresa.precoPlanoPremium ??
    empresa.valorMensalPremium ??
    empresa.valorMensalPersonalizado ??
    null;

  return (
    <PremiumLayout empresa={empresa} usuario={usuario}>
      <div style={{ ...page, ...(isMobile ? pageMobile : {}) }}>
        <section
          style={{
            ...hero,
            ...(isMobile ? heroMobile : {}),
            background: `
              radial-gradient(circle at top left, ${empresa.corPrimaria || '#7c3aed'}cc, transparent 36%),
              linear-gradient(135deg, ${empresa.corSidebar || '#0f172a'}, #020617 72%)
            `,
          }}
        >
          <div>
            <span style={eyebrow}>Planos e assinatura</span>

            <h1 style={{ ...title, ...(isMobile ? titleMobile : {}) }}>Gerenciamento de Planos</h1>

            <p style={{ ...subtitle, ...(isMobile ? subtitleMobile : {}) }}>
              Visualize o plano atual, acompanhe vencimento, regularize pagamento e gerencie cobrança automática.
            </p>

            <div style={{ ...heroChips, ...(isMobile ? heroChipsMobile : {}) }}>
              <span style={heroChip}>Plano atual: {nomePlanoAtual()}</span>
              <span style={heroChip}>Status: {empresa.assinaturaStatus || 'vencida'}</span>
              <span style={heroChip}>Vencimento: {formatarData(dataAssinaturaExpira())}</span>
            </div>
          </div>

          <div style={{ ...(sistemaBloqueado ? statusCardExpirado : statusCardAtivo), ...(isMobile ? statusCardMobile : {}) }}>
            <strong>{textoBadge()}</strong>
            <span>{textoExpiracao()}</span>
          </div>
        </section>

        {licencaEmpresa.status === 'bloqueio_total' && (
          <section style={{ ...alertaExpirado, ...(isMobile ? alertaExpiradoMobile : {}) }}>
            <div>
              <strong>⚠️ Sua licença está vencida</strong>
              <p>
                As funções ficam indisponíveis até a regularização do pagamento.
              </p>
            </div>

            <button
              disabled={gerandoPagamento}
              onClick={pagarMensalidade}
              style={dangerButton}
            >
              {gerandoPagamento ? 'Gerando pagamento...' : 'Regularizar pagamento'}
            </button>
          </section>
        )}

        {licencaEmpresa.mostrarBanner && (
          <section style={{ ...alertaAviso, ...(isMobile ? alertaAvisoMobile : {}) }}>
            ⚠️ {licencaEmpresa.mensagemCurta}. {licencaEmpresa.mensagemDetalhada}
          </section>
        )}

        <section style={{ ...infoGrid, ...(isMobile ? infoGridMobile : {}) }}>
          <InfoCard titulo="Etapa atual" valor={licencaEmpresa.status === 'ativo' ? 'Ativo' : licencaEmpresa.status === 'aviso' ? 'Aviso' : licencaEmpresa.status === 'bloqueio_parcial' ? 'Bloqueio parcial' : 'Bloqueio total'} />
          <InfoCard titulo="Dias em atraso" valor={String(licencaEmpresa.diasAtraso)} />
          <InfoCard titulo="Recursos bloqueados" valor={licencaEmpresa.status === 'bloqueio_parcial' ? 'Promoções, relatórios e comissões' : licencaEmpresa.status === 'bloqueio_total' ? 'Acesso geral' : 'Nenhum'} />
        </section>

        <section style={{ ...infoGrid, ...(isMobile ? infoGridMobile : {}) }}>
          <InfoCard titulo="Plano atual" valor={nomePlanoAtual()} />
          <InfoCard titulo="Status" valor={empresa.assinaturaStatus || 'vencida'} />
          <InfoCard titulo="Trial expira em" valor={formatarData(empresa.trialExpiraEm)} />
          <InfoCard
            titulo="Assinatura expira em"
            valor={`${formatarData(dataAssinaturaExpira())} (${textoExpiracao()})`}
          />
        </section>

        <section style={{ ...plansGrid, ...(isMobile ? plansGridMobile : {}) }}>
          <PlanoComercialCard
            nome="Básico"
            subtitulo="Essencial"
            destaque="Agenda online"
            valor={textoValorPlano(valorPlanoBasico)}
            cor="#14b8a6"
            ativo={planoCardAtivo('basico')}
            bloqueado={planoCardBloqueadoPorHierarquia('basico')}
            acaoTexto={planoCardAtivo('basico') ? 'Plano atual' : 'Solicitar Básico'}
            bloqueadoTexto={sistemaBloqueado ? 'Regularize para alterar' : 'Plano Premium ativo'}
            isMobile={isMobile}
            recursosAberto={recursosAbertosPlanos.includes('basico')}
            onAlternarRecursos={() => alternarRecursosPlano('basico')}
            onClick={() => acaoPlano('basico')}
            recursos={[
              { texto: 'Dashboard operacional', ativo: true },
              { texto: 'Agenda e controle de agendamentos', ativo: true },
              { texto: 'Cadastro de clientes', ativo: true },
              { texto: 'Cadastro de serviços e profissionais', ativo: true },
              { texto: 'Agendamento online sem pré-pagamento', ativo: true },
              { texto: 'WhatsApp automático', ativo: true },
              { texto: 'Confirmações e lembretes automáticos', ativo: true },
              { texto: 'Pré-pagamento Mercado Pago', ativo: false },
{ texto: 'Financeiro', ativo: false },
{ texto: 'Promoções', ativo: false },
{ texto: 'Relatórios e visão gerencial', ativo: false },
{ texto: 'Controle de repasse de comissão', ativo: false },
{ texto: 'Fluxo de caixa e controle operacional', ativo: false },
{ texto: 'Experiência completa Marcaê', ativo: false },
            ]}
          />

          <PlanoComercialCard
            nome="Premium"
            subtitulo="Completo"
            destaque="Gestão completa"
            valor={textoValorPlano(valorPlanoPremium)}
            cor="#f97316"
            ativo={planoCardAtivo('premium')}
            bloqueado={planoCardBloqueadoPorHierarquia('premium')}
            acaoTexto={planoCardAtivo('premium') ? 'Plano atual' : 'Solicitar Premium'}
            bloqueadoTexto={sistemaBloqueado ? 'Regularize para alterar' : ''}
            isMobile={isMobile}
            recursosAberto={recursosAbertosPlanos.includes('premium')}
            onAlternarRecursos={() => alternarRecursosPlano('premium')}
            onClick={() => acaoPlano('premium')}
            recursos={[
              { texto: 'Tudo do Básico', ativo: true },
              { texto: 'Agendamento com pré-pagamento', ativo: true },
              { texto: 'Financeiro completo', ativo: true },
              { texto: 'Fluxo de caixa e controle operacional', ativo: true },
              { texto: 'Comissões automáticas', ativo: true },
              { texto: 'Controle de repasse de comissão', ativo: true },
              { texto: 'Promoções', ativo: true },
              { texto: 'Relatórios e visão gerencial', ativo: true },
              { texto: 'Experiência completa Marcaê', ativo: true },
            ]}
          />
        </section>

        <section style={{ ...regularizacaoPixBox, ...(isMobile ? regularizacaoPixBoxMobile : {}) }}>
          <div>
            <span style={eyebrowDark}>Regularização rápida</span>
            <h2 style={sectionTitle}>Pague por Pix e libere na hora</h2>
            <p style={sectionDescription}>
              O QR Code é gerado pelo Mercado Pago. Após a confirmação, o Marcaê renova a assinatura automaticamente.
            </p>
          </div>

          <div style={pixGrid}>
            <div style={pixCard}>
              <div style={pixCardHeader}>
                <span style={pixIcon}>💚</span>
                <div>
                  <strong style={pixTitle}>Pix instantâneo</strong>
                  <span style={pixHint}>Recomendado para regularizar agora.</span>
                </div>
              </div>

              {!pixPagamento && (
                <button
                  disabled={gerandoPix}
                  onClick={gerarPixMensalidade}
                  style={primaryButton}
                >
                  {gerandoPix ? 'Gerando Pix...' : 'Gerar QR Code Pix'}
                </button>
              )}

              {pixPagamento && (
                <div style={pixContent}>
                  {pixPagamento.qrCodeBase64 && (
                    <img
                      src={`data:image/png;base64,${pixPagamento.qrCodeBase64}`}
                      alt="QR Code Pix da mensalidade"
                      style={pixQrCode}
                    />
                  )}

                  <strong style={pixStatusText}>
                    {statusPix === 'aprovado'
                      ? '✅ Pagamento confirmado! Liberando acesso...'
                      : statusPix === 'erro'
                        ? '⚠️ Erro ao consultar pagamento'
                        : '⏳ Aguardando pagamento...'}
                  </strong>

                  <textarea
                    readOnly
                    value={pixPagamento.qrCode || ''}
                    style={pixCopiaCola}
                    aria-label="Código Pix copia e cola"
                  />

                  <div style={pixActions}>
                    <button type="button" onClick={copiarCodigoPix} style={secondaryButton}>
                      {copiadoPix ? 'Código copiado!' : 'Copiar Pix'}
                    </button>

                    <button type="button" onClick={() => consultarStatusPix(false)} style={secondaryButton}>
                      Verificar pagamento
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={pixCard}>
              <div style={pixCardHeader}>
                <span style={pixIcon}>💳</span>
                <div>
                  <strong style={pixTitle}>Cartão ou outros meios</strong>
                  <span style={pixHint}>Use o checkout oficial do Mercado Pago.</span>
                </div>
              </div>

              <button
                disabled={gerandoPagamento}
                onClick={pagarMensalidade}
                style={secondaryButton}
              >
                {gerandoPagamento ? 'Gerando checkout...' : 'Pagar com Mercado Pago'}
              </button>
            </div>
          </div>
        </section>

        <section style={{ ...gestaoBox, ...(isMobile ? gestaoBoxMobile : {}) }}>
          <div>
            <span style={eyebrowDark}>Gestão da assinatura</span>

            <h2 style={sectionTitle}>Controle financeiro do plano</h2>

            <p style={sectionDescription}>
              Controle plano, pagamentos, recorrência e recursos disponíveis para esta empresa.
            </p>

            {sincronizandoRecorrencia && (
              <p style={syncText}>Sincronizando assinatura com o Mercado Pago...</p>
            )}

            {cobrancaRecorrenteAtiva && (
              <p style={successText}>
                Cobrança automática ativa
                {empresa?.assinaturaProximaCobrancaEm
                  ? ` · Próxima cobrança: ${formatarData(empresa.assinaturaProximaCobrancaEm)}`
                  : ''}
              </p>
            )}
          </div>

          <div style={acoesGrid}>
            {!sistemaBloqueado && !planoPremium() && (
              <div style={campoAcao}>
                <label style={label}>Escolha o plano desejado</label>

                <select
                  value=""
                  disabled={salvando}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    atualizarAssinatura({ plano: e.target.value });
                  }}
                  style={select}
                >
                  <option value="" disabled>
                    Selecionar plano
                  </option>

                  <option value="premium">Plano Premium</option>
                </select>
              </div>
            )}

            {!sistemaBloqueado && (
              <button
                disabled={ativandoRecorrencia || cobrancaRecorrenteAtiva}
                onClick={() => ativarCobrancaAutomatica(planoAtual())}
                style={{
                  ...primaryButton,
                  opacity: ativandoRecorrencia || cobrancaRecorrenteAtiva ? 0.55 : 1,
                  cursor: ativandoRecorrencia || cobrancaRecorrenteAtiva ? 'not-allowed' : 'pointer',
                }}
              >
                {cobrancaRecorrenteAtiva
                  ? 'Cobrança automática ativa'
                  : ativandoRecorrencia
                  ? 'Ativando cobrança...'
                  : 'Ativar cobrança automática'}
              </button>
            )}

            <button
              disabled={gerandoPagamento}
              onClick={pagarMensalidade}
              style={secondaryButton}
            >
              {gerandoPagamento ? 'Gerando pagamento...' : 'Gerar pagamento mensal'}
            </button>
          </div>
        </section>
      </div>
    </PremiumLayout>
  );
}

function InfoCard({ titulo, valor }: any) {
  return (
    <div style={infoCard}>
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function PlanoComercialCard({
  nome,
  subtitulo,
  destaque,
  valor,
  cor,
  ativo,
  bloqueado,
  acaoTexto,
  bloqueadoTexto,
  recursos,
  onClick,
  isMobile,
  recursosAberto,
  onAlternarRecursos,
}: any) {
  const totalRecursosAtivos = recursos.filter((recurso: any) => recurso.ativo).length;
  const mostrarRecursos = !isMobile || recursosAberto;

  return (
    <div
      style={{
        ...planoCard,
        ...(isMobile ? planoCardMobile : {}),
        borderColor: ativo ? cor : 'rgba(255,255,255,0.10)',
        boxShadow: ativo ? `0 24px 70px ${cor}33` : '0 20px 60px rgba(0,0,0,.22)',
      }}
    >
      {ativo && (
        <div style={{ ...planoAtualBadge, background: cor }}>
          Plano atual
        </div>
      )}

      <div
        style={{
          ...planoHeader,
          ...(isMobile ? planoHeaderMobile : {}),
          background: `linear-gradient(135deg, ${cor}, ${cor}dd)`,
        }}
      >
        <div>
          <span style={planoSubtitulo}>{subtitulo}</span>
          <h3 style={planoNome}>{nome}</h3>
        </div>

        <span style={{ ...planoDestaque, ...(isMobile ? planoDestaqueMobile : {}) }}>{destaque}</span>
      </div>

      <div style={{ ...planoBody, ...(isMobile ? planoBodyMobile : {}) }}>
        <div style={planoPrecoBox}>
          <strong style={{ ...planoPreco, ...(isMobile ? planoPrecoMobile : {}) }}>{valor}</strong>
          <span style={planoPrecoPeriodo}>/ mês</span>
        </div>

        <div style={planoResumoMobileBox}>
          <span>{totalRecursosAtivos} recurso(s) liberado(s)</span>

          {isMobile && (
            <button type="button" onClick={onAlternarRecursos} style={botaoRecursosPlano}>
              {recursosAberto ? 'Ocultar recursos' : 'Ver recursos'}
            </button>
          )}
        </div>

        {mostrarRecursos && (
          <div style={recursosLista}>
            {recursos.map((recurso: any, index: number) => (
              <div
                key={index}
                style={{
                  ...recursoItem,
                  opacity: recurso.ativo ? 1 : 0.55,
                }}
              >
                <span
                  style={{
                    ...recursoIcone,
                    color: recurso.ativo ? '#22c55e' : '#ef4444',
                  }}
                >
                  {recurso.ativo ? '✓' : '✕'}
                </span>

                <span
                  style={{
                    ...recursoTexto,
                    color: recurso.ativo ? '#e2e8f0' : '#fca5a5',
                  }}
                >
                  {recurso.texto}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          disabled={ativo || bloqueado}
          onClick={onClick}
          style={{
            ...planoButton,
            background: ativo
              ? 'rgba(255,255,255,.08)'
              : `linear-gradient(135deg, ${cor}, ${cor}dd)`,
            opacity: bloqueado ? 0.5 : 1,
            cursor: ativo || bloqueado ? 'not-allowed' : 'pointer',
          }}
        >
          {ativo
            ? 'Plano atual'
            : bloqueado
            ? bloqueadoTexto || 'Indisponível'
            : acaoTexto}
        </button>
      </div>
    </div>
  );
}

const page = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 24,
};

const pageMobile = {
  gap: 12,
  paddingBottom: 116,
};

const heroMobile = {
  flexDirection: 'column' as const,
  padding: 16,
  borderRadius: 22,
  gap: 12,
};

const titleMobile = {
  fontSize: 26,
  lineHeight: 1.05,
};

const subtitleMobile = {
  fontSize: 12,
  lineHeight: 1.45,
  maxWidth: '100%',
};

const heroChipsMobile = {
  gap: 8,
};

const statusCardMobile = {
  width: '100%',
  minWidth: 0,
  padding: 12,
  borderRadius: 18,
};

const alertaExpiradoMobile = {
  flexDirection: 'column' as const,
  alignItems: 'stretch',
};

const alertaAvisoMobile = {
  fontSize: 13,
  lineHeight: 1.5,
};

const infoGridMobile = {
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
};

const plansGridMobile = {
  gridTemplateColumns: '1fr',
  gap: 12,
};

const gestaoBoxMobile = {
  gridTemplateColumns: '1fr',
  padding: 16,
  borderRadius: 22,
  gap: 14,
};

const planoCardMobile = {
  borderRadius: 22,
};

const planoHeaderMobile = {
  flexDirection: 'row' as const,
  alignItems: 'center',
  padding: 16,
  gap: 6,
};

const planoDestaqueMobile = {
  whiteSpace: 'normal' as const,
  width: 'fit-content',
};

const planoBodyMobile = {
  padding: 16,
  gap: 12,
};

const planoPrecoMobile = {
  fontSize: 28,
};

const hero = {
  position: 'relative' as const,
  overflow: 'hidden',
  borderRadius: 26,
  padding: 24,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 24,
  alignItems: 'flex-start',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 30px 90px rgba(0,0,0,.28)',
};

const eyebrow = {
  display: 'inline-flex',
  padding: '6px 10px',
  borderRadius: 999,
  background: 'rgba(255,255,255,.10)',
  color: '#fff',
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 10,
  textTransform: 'uppercase' as const,
  letterSpacing: '.08em',
};

const title = {
  margin: 0,
  color: '#fff',
  fontSize: 34,
  fontWeight: 950,
  letterSpacing: '-0.04em',
};

const subtitle = {
  marginTop: 8,
  color: 'rgba(255,255,255,.82)',
  fontSize: 15,
  lineHeight: 1.7,
  maxWidth: 760,
};

const heroChips = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 8,
  marginTop: 14,
};

const heroChip = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(255,255,255,.10)',
  border: '1px solid rgba(255,255,255,.10)',
  color: '#fff',
  fontSize: 12,
  fontWeight: 900,
};

const statusCardAtivo = {
  minWidth: 210,
  padding: 22,
  borderRadius: 17,
  background: 'rgba(34,197,94,.14)',
  border: '1px solid rgba(34,197,94,.26)',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 8,
  color: '#dcfce7',
};

const statusCardExpirado = {
  minWidth: 210,
  padding: 22,
  borderRadius: 17,
  background: 'rgba(239,68,68,.14)',
  border: '1px solid rgba(239,68,68,.26)',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 8,
  color: '#fecaca',
};

const alertaExpirado = {
  padding: 22,
  borderRadius: 17,
  background: 'rgba(239,68,68,.12)',
  border: '1px solid rgba(239,68,68,.18)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 20,
};

const alertaAviso = {
  padding: 18,
  borderRadius: 20,
  background: 'rgba(245,158,11,.12)',
  border: '1px solid rgba(245,158,11,.18)',
  color: '#fde68a',
  fontWeight: 700,
};

const dangerButton = {
  border: 'none',
  borderRadius: 16,
  padding: '14px 18px',
  background: 'linear-gradient(135deg,#ef4444,#dc2626)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const infoGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 18,
};

const infoCard = {
  padding: 13,
  borderRadius: 17,
  background: 'rgba(15,23,42,.82)',
  border: '1px solid rgba(255,255,255,.10)',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 6,
};

const plansGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
  gap: 14,
};

const planoCard = {
  position: 'relative' as const,
  overflow: 'hidden',
  borderRadius: 22,
  background: 'rgba(15,23,42,.86)',
  border: '1px solid rgba(255,255,255,.10)',
  display: 'flex',
  flexDirection: 'column' as const,
};

const planoAtualBadge = {
  position: 'absolute' as const,
  top: 16,
  right: 16,
  padding: '7px 12px',
  borderRadius: 999,
  color: '#fff',
  fontSize: 11,
  fontWeight: 900,
  zIndex: 2,
};

const planoHeader = {
  padding: 20,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
};

const planoSubtitulo = {
  display: 'block',
  color: 'rgba(255,255,255,.74)',
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 8,
};

const planoNome = {
  margin: 0,
  color: '#fff',
  fontSize: 24,
  fontWeight: 950,
  lineHeight: 1,
};

const planoDestaque = {
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(255,255,255,.12)',
  color: '#fff',
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: 'nowrap' as const,
};

const planoBody = {
  padding: 20,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 16,
};

const planoPrecoBox = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: 6,
};

const planoPreco = {
  color: '#fff',
  fontSize: 32,
  fontWeight: 950,
  lineHeight: 1,
};

const planoPrecoPeriodo = {
  color: '#94a3b8',
  fontSize: 14,
  fontWeight: 700,
};

const recursosLista = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 8,
};

const recursoItem = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 6,
};

const recursoIcone = {
  fontSize: 15,
  fontWeight: 900,
  marginTop: 1,
};

const recursoTexto = {
  fontSize: 12,
  lineHeight: 1.5,
  fontWeight: 600,
};

const planoResumoMobileBox = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 16,
  background: 'rgba(2,6,23,.32)',
  border: '1px solid rgba(255,255,255,.08)',
  color: '#cbd5e1',
  fontSize: 12,
  fontWeight: 900,
};

const botaoRecursosPlano = {
  border: '1px solid rgba(255,255,255,.10)',
  borderRadius: 12,
  background: 'rgba(255,255,255,.07)',
  color: '#fff',
  padding: '8px 10px',
  fontSize: 11,
  fontWeight: 950,
  cursor: 'pointer',
  whiteSpace: 'nowrap' as const,
};

const planoButton = {
  border: 'none',
  borderRadius: 15,
  padding: '13px 14px',
  color: '#fff',
  fontWeight: 900,
  transition: 'all .18s ease',
};

const gestaoBox = {
  padding: 20,
  borderRadius: 22,
  background: 'rgba(15,23,42,.86)',
  border: '1px solid rgba(255,255,255,.10)',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 420px)',
  gap: 28,
};

const eyebrowDark = {
  display: 'inline-flex',
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(124,58,237,.14)',
  color: '#c4b5fd',
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 10,
  textTransform: 'uppercase' as const,
};

const sectionTitle = {
  margin: 0,
  color: '#fff',
  fontSize: 30,
  fontWeight: 950,
};

const sectionDescription = {
  marginTop: 12,
  color: '#94a3b8',
  fontSize: 14,
  lineHeight: 1.7,
};

const syncText = {
  marginTop: 14,
  color: '#facc15',
  fontSize: 13,
  fontWeight: 700,
};

const successText = {
  marginTop: 14,
  color: '#4ade80',
  fontSize: 13,
  fontWeight: 700,
};

const loadingBox = {
  padding: 28,
  borderRadius: 17,
  background: 'rgba(15,23,42,.86)',
  border: '1px solid rgba(255,255,255,.10)',
  color: '#fff',
  fontWeight: 900,
};

const acoesGrid = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 14,
};

const campoAcao = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 8,
};

const label = {
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 900,
};

const select = {
  width: '100%',
  padding: '15px 16px',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(2,6,23,0.55)',
  color: '#fff',
  outline: 'none',
  fontSize: 14,
  boxSizing: 'border-box' as const,
};

const primaryButton = {
  border: 'none',
  borderRadius: 16,
  padding: '16px 18px',
  background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
};

const secondaryButton = {
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16,
  padding: '16px 18px',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
};


const regularizacaoPixBox = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
  gap: 18,
  alignItems: 'start',
  marginBottom: 18,
  padding: 22,
  borderRadius: 26,
  background: 'linear-gradient(145deg, rgba(15,23,42,0.86), rgba(15,23,42,0.64))',
  border: '1px solid rgba(34,197,94,0.18)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
};

const regularizacaoPixBoxMobile = {
  gridTemplateColumns: '1fr',
  padding: 16,
  borderRadius: 22,
};

const pixGrid = {
  display: 'grid',
  gap: 12,
};

const pixCard = {
  display: 'grid',
  gap: 14,
  padding: 16,
  borderRadius: 20,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.10)',
};

const pixCardHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const pixIcon = {
  width: 42,
  height: 42,
  borderRadius: 15,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(34,197,94,0.13)',
  border: '1px solid rgba(34,197,94,0.22)',
};

const pixTitle = {
  display: 'block',
  color: '#fff',
  fontSize: 14,
  fontWeight: 950,
};

const pixHint = {
  display: 'block',
  marginTop: 3,
  color: '#cbd5e1',
  fontSize: 12,
  fontWeight: 750,
};

const pixContent = {
  display: 'grid',
  gap: 10,
};

const pixQrCode = {
  width: 190,
  height: 190,
  maxWidth: '100%',
  margin: '0 auto',
  padding: 10,
  borderRadius: 18,
  background: '#fff',
};

const pixStatusText: CSSProperties = {
  color: '#ffffff',
  textAlign: 'center',
  fontSize: 14,
  fontWeight: 700,
};

const pixCopiaCola = {
  width: '100%',
  minHeight: 74,
  resize: 'none',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(2,6,23,0.58)',
  color: '#e2e8f0',
  padding: 10,
  fontSize: 11,
  lineHeight: 1.45,
  outline: 'none',
};

const pixActions = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
};
