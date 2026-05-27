'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import PremiumLayout from '@/components/layout/PremiumLayout';

export default function ComissoesPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [mostrarFinanceiro, setMostrarFinanceiro] = useState(false);
  const [fechandoComissao, setFechandoComissao] = useState(false);
  const [modalFechamento, setModalFechamento] = useState<any>(null);
  const [observacaoFechamento, setObservacaoFechamento] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [detalhesAbertosIds, setDetalhesAbertosIds] = useState<string[]>([]);
  const [buscaProfissional, setBuscaProfissional] = useState('');

  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [dataInicio, setDataInicio] = useState(
    primeiroDiaMes.toISOString().slice(0, 10)
  );
  const [dataFim, setDataFim] = useState(hoje.toISOString().slice(0, 10));

  useEffect(() => {
    function atualizarMobile() {
      setIsMobile(window.innerWidth <= 760);
    }

    atualizarMobile();
    window.addEventListener('resize', atualizarMobile);

    return () => window.removeEventListener('resize', atualizarMobile);
  }, []);


  useEffect(() => {
    async function iniciar() {
      const empresaStorage = localStorage.getItem('empresaLogada');
      const usuarioStorage = localStorage.getItem('usuarioEmpresa');

      if (!empresaStorage || !usuarioStorage) {
        window.location.href = '/login';
        return;
      }

      const emp = JSON.parse(empresaStorage);
      const user = JSON.parse(usuarioStorage);

      setEmpresa(emp);
      setUsuario(user);

      const periodo = await carregarPeriodoAutomatico(emp.id);

      if (periodo) {
        setDataInicio(periodo.dataInicio);
        setDataFim(periodo.dataFim);

        await carregar(emp.id, periodo.dataInicio, periodo.dataFim);
        return;
      }

      await carregar(emp.id, dataInicio, dataFim);
    }

    iniciar();
  }, []);

  function podeAcessarComissoes(user: any) {
    if (!user) return false;
    if (user.acessoTotal === true) return true;
    if (user.perfil === 'admin') return true;
    return user.permissoes?.comissoes === true;
  }

  function usuarioPodeVerFinanceiro() {
    if (!usuario) return false;
    if (usuario.acessoTotal === true) return true;
    if (usuario.perfil === 'admin') return true;
    if (usuario.permissoes?.visualizarFinanceiro === true) return true;
    if (usuario.permissoes?.financeiro === true) return true;

    return false;
  }

  function usuarioPodeFecharComissao() {
    if (!usuario) return false;
    if (usuario.acessoTotal === true) return true;
    if (usuario.perfil === 'admin') return true;

    return usuario.permissoes?.fecharComissao === true;
  }

  function alternarFinanceiro() {
    if (usuarioPodeVerFinanceiro()) {
      setMostrarFinanceiro(!mostrarFinanceiro);
      return;
    }

    alert(
      'Usuário sem permissão para visualizar valores financeiros. Solicite acesso a um administrador.'
    );
  }

  function alternarDetalhesProfissional(profissionalId: string) {
    setDetalhesAbertosIds((atual) =>
      atual.includes(profissionalId)
        ? atual.filter((id) => id !== profissionalId)
        : [...atual, profissionalId]
    );
  }

  function dinheiro(valor: number) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function valorFinanceiro(valor: number) {
    if (!mostrarFinanceiro) return '••••••';
    return dinheiro(valor);
  }

  function textoComissaoProfissional(profissional: any) {
    const tipo = profissional.tipoComissao;
    const valor = Number(profissional.valorComissaoConfigurado || 0);

    if (!tipo || valor <= 0) {
      return 'Comissão conforme serviços executados';
    }

    if (tipo === 'percentual') {
      return `Comissão padrão: ${valor}%`;
    }

    if (tipo === 'fixo') {
      return `Comissão padrão: ${dinheiro(valor)}`;
    }

    return 'Comissão configurada por serviço';
  }

  function corProfissional(index: number) {
    const cores = [
      {
        fundo:
          'linear-gradient(135deg, var(--marcae-primary-soft), rgba(2,6,23,.22))',
        borda: 'var(--marcae-primary)',
        texto: 'var(--marcae-text)',
        brilho: 'var(--marcae-primary-soft)',
      },
      {
        fundo:
          'linear-gradient(135deg, var(--marcae-secondary-soft), rgba(2,6,23,.22))',
        borda: 'var(--marcae-secondary)',
        texto: 'var(--marcae-text)',
        brilho: 'var(--marcae-secondary-soft)',
      },
      {
        fundo:
          'linear-gradient(135deg, rgba(255,255,255,.07), rgba(2,6,23,.24))',
        borda: 'var(--marcae-border)',
        texto: 'var(--marcae-text)',
        brilho: 'rgba(255,255,255,.08)',
      },
    ];

    return cores[index % cores.length];
  }

  function valorComissaoServico(servico: any) {
    return Number(servico.valorComissao || servico.comissaoCalculada || 0);
  }

  function normalizarTexto(valor: any) {
    return String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function profissionalCombinaComBusca(profissional: any) {
    const termo = normalizarTexto(buscaProfissional);

    if (!termo) return true;

    const textoServicos = Array.isArray(profissional.servicos)
      ? profissional.servicos
          .map((servico: any) =>
            [
              servico.servico,
              servico.cliente,
              servico.data,
              servico.valorServico,
              valorComissaoServico(servico),
            ].join(' ')
          )
          .join(' ')
      : '';

    const textoBusca = [
      profissional.profissionalNome,
      profissional.tipoComissao,
      profissional.valorComissaoConfigurado,
      textoComissaoProfissional(profissional),
      profissional.totalServicos,
      profissional.totalFaturado,
      profissional.totalPendente,
      profissional.totalComissao,
      textoServicos,
    ].join(' ');

    return normalizarTexto(textoBusca).includes(termo);
  }

  function formatarData(data: string) {
    if (!data) return '-';

    if (String(data).includes('-') && String(data).length === 10) {
      const [ano, mes, dia] = String(data).split('-');
      return `${dia}/${mes}/${ano}`;
    }

    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  async function carregarPeriodoAutomatico(empresaId: string) {
    try {
      const res = await fetch(
        `/api/comissoes/periodo-aberto?empresaId=${empresaId}`,
        {
          cache: 'no-store',
        }
      );

      const data = await res.json();

      if (!data.success) return null;

      return {
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
      };
    } catch (error) {
      console.error('Erro ao buscar período automático:', error);
      return null;
    }
  }

  async function carregar(empresaId: string, inicio: string, fim: string) {
    try {
      setCarregando(true);

      const res = await fetch(
        `/api/comissoes?empresaId=${empresaId}&dataInicio=${inicio}&dataFim=${fim}`
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao carregar comissões.');
        return;
      }

      setProfissionais(data.profissionais || []);
    } catch (error) {
      console.error('Erro ao carregar comissões:', error);
      alert('Erro ao carregar comissões.');
    } finally {
      setCarregando(false);
    }
  }

  async function fecharComissao(profissional: any) {
    if (!empresa?.id) return;

    if (!usuarioPodeFecharComissao()) {
      alert('Você não tem permissão para fechar comissão.');
      return;
    }

    const confirmar = window.confirm(
      `Deseja fechar as comissões pendentes de ${profissional.profissionalNome} no período selecionado?`
    );

    if (!confirmar) return;

    try {
      setFechandoComissao(true);

      const res = await fetch('/api/comissoes/fechar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresa.id,
          profissionalId: profissional.profissionalId,
          dataInicio,
          dataFim,
          observacao: observacaoFechamento,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao fechar comissão.');
        return;
      }

      alert(data.message || 'Comissão fechada com sucesso.');

      setModalFechamento(null);
      setObservacaoFechamento('');

      await carregar(empresa.id, dataInicio, dataFim);
    } catch (error) {
      alert('Erro ao fechar comissão.');
    } finally {
      setFechandoComissao(false);
    }
  }

  function filtrar() {
    if (!empresa?.id) return;
    carregar(empresa.id, dataInicio, dataFim);
  }

  if (!empresa || !usuario) {
    return (
  <PremiumLayout empresa={empresa} usuario={usuario}>
    <main style={{ ...page, ...(isMobile ? pageMobile : {}) }}>
        <div style={loadingBox}>Carregando comissões...</div>
          </main>
  </PremiumLayout>
);
  }

  if (!podeAcessarComissoes(usuario)) {
    return (
      <main style={{ ...page, ...(isMobile ? pageMobile : {}) }}>
        <div style={{ ...container, ...(isMobile ? containerMobile : {}) }}>
          <section style={bloqueioBox}>
            <div style={bloqueioIcone}>🔒</div>
            <h1 style={tituloBloqueio}>Acesso bloqueado</h1>
            <p style={textoBloqueio}>
              Você não tem permissão para acessar o módulo de comissões.
            </p>

            <Link href="/dashboard" style={linkSemDecoracao}>
              <button style={botaoPrincipal}>Voltar para o dashboard</button>
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const totalFaturado = profissionais.reduce(
    (total, p) => total + Number(p.totalFaturado || 0),
    0
  );

  const totalComissoes = profissionais.reduce(
    (total, p) => total + Number(p.totalComissao || 0),
    0
  );

  const totalServicos = profissionais.reduce(
    (total, p) => total + Number(p.totalServicos || 0),
    0
  );

  const totalPendente = profissionais.reduce(
    (total, p) => total + Number(p.totalPendente || 0),
    0
  );

  const profissionaisFiltrados = profissionais.filter((profissional) =>
    profissionalCombinaComBusca(profissional)
  );

  return (
  <PremiumLayout empresa={empresa} usuario={usuario}>
    <main style={{ ...page, ...(isMobile ? pageMobile : {}) }}>
      <div style={backgroundGlowUm} />
      <div style={backgroundGlowDois} />

      <div style={{ ...container, ...(isMobile ? containerMobile : {}) }}>
        <header style={{ ...headerPremium, ...(isMobile ? headerPremiumMobile : {}) }}>
          <div style={{ ...headerLeft, ...(isMobile ? headerLeftMobile : {}) }}>
            <div style={headerTitleRow}>
              <div style={headerIcon}>💰</div>

              <div style={headerTitleWrap}>
                <div style={headerEyebrow}>Painel financeiro</div>

                <h1 style={{ ...tituloHeader, ...(isMobile ? tituloHeaderMobile : {}) }}>
                  Comissões
                </h1>

                <p style={{ ...subtituloHeader, ...(isMobile ? subtituloHeaderMobile : {}) }}>
                  Repasses, produção e fechamento por profissional.
                </p>
              </div>
            </div>
          </div>

          <div style={{ ...headerRight, ...(isMobile ? headerRightMobile : {}) }}>
            <div style={headerStats}>
              <div style={headerStat}>
                <strong style={headerStatValue}>{profissionais.length}</strong>
                <span style={headerStatLabel}>Profissionais</span>
              </div>

              <div style={headerStat}>
                <strong style={headerStatValue}>{totalServicos}</strong>
                <span style={headerStatLabel}>Serviços</span>
              </div>

              <div style={headerStat}>
                <strong style={headerStatValue}>{valorFinanceiro(totalPendente)}</strong>
                <span style={headerStatLabel}>Pendente</span>
              </div>
            </div>

            <div style={{ ...headerButtons, ...(isMobile ? headerButtonsMobile : {}) }}>
              <button
                onClick={alternarFinanceiro}
                style={botaoHeaderGlass}
              >
                {mostrarFinanceiro ? '🙈 Ocultar' : '👁 Valores'}
              </button>

              <Link
                href="/comissoes/fechamentos"
                style={linkSemDecoracao}
              >
                <button style={botaoHeaderGlass}>
                  📄 Fechamentos
                </button>
              </Link>
            </div>
          </div>
        </header>

        <section style={{ ...painelPeriodo, ...(isMobile ? painelPeriodoMobile : {}) }}>
          <div style={filtroCompactHeader}>
            <div>
              <span style={sectionEyebrow}>Período aberto</span>
              <h2 style={sectionTitle}>Filtrar comissões</h2>
            </div>

            <span style={periodoPill}>
              {formatarData(dataInicio)} até {formatarData(dataFim)}
            </span>
          </div>

          <div style={{ ...gridFiltro, ...(isMobile ? gridFiltroMobile : {}) }}>
            <div style={campo}>
              <label style={label}>Data inicial</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                style={input}
              />
            </div>

            <div style={campo}>
              <label style={label}>Data final</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                style={input}
              />
            </div>

            <button onClick={filtrar} style={botaoPrincipal}>
              {carregando ? 'Carregando...' : 'Filtrar'}
            </button>
          </div>
        </section>

        <section style={{ ...gridCards, ...(isMobile ? gridCardsMobile : {}) }}>
          <Card
            icone="💳"
            titulo="Total faturado"
            valor={valorFinanceiro(totalFaturado)}
            detalhe="Serviços pagos no período"
          />
          <Card
            icone="💰"
            titulo="Total comissões"
            valor={valorFinanceiro(totalComissoes)}
            detalhe="Valor calculado para repasse"
          />
          <Card
            icone="⏳"
            titulo="Pendente"
            valor={valorFinanceiro(totalPendente)}
            detalhe="Disponível para fechamento"
          />
          <Card
            icone="✨"
            titulo="Serviços"
            valor={totalServicos}
            detalhe={`${profissionais.length} profissional(is)`}
          />
        </section>

        <section style={{ ...box, ...(isMobile ? boxMobile : {}) }}>
          <div style={{ ...sectionHeader, ...(isMobile ? sectionHeaderMobile : {}) }}>
            <div>
              <span style={sectionEyebrow}>Mapa financeiro</span>
              <h2 style={sectionTitle}>Comissões por profissional</h2>
            </div>

            <div style={mapaToolbar}>
              <div style={{ ...periodoPill, ...(isMobile ? periodoPillMobile : {}) }}>
                {formatarData(dataInicio)} até {formatarData(dataFim)}
              </div>

              <label style={buscaProfissionalBox}>
                <span style={buscaIcone}>🔎</span>

                <input
                  type="search"
                  value={buscaProfissional}
                  onChange={(e) => setBuscaProfissional(e.target.value)}
                  placeholder="Pesquisar profissional"
                  style={buscaProfissionalInput}
                />
              </label>
            </div>
          </div>

          {carregando && (
            <div style={emptyBox}>Carregando comissões do período...</div>
          )}

          {!carregando && profissionais.length === 0 && (
            <div style={emptyBox}>
              Nenhum serviço pago encontrado no período selecionado.
            </div>
          )}

          {!carregando && profissionais.length > 0 && profissionaisFiltrados.length === 0 && (
            <div style={emptyBox}>
              Nenhum profissional encontrado para “{buscaProfissional}”.
            </div>
          )}

          <div style={{ ...profissionaisGrid, ...(isMobile ? profissionaisGridMobile : {}) }}>
            {profissionaisFiltrados.map((profissional, index) => {
              const cor = corProfissional(index);

              return (
                <div
                  key={profissional.profissionalId}
                  style={{
                    ...profissionalBox,
                    ...(isMobile ? profissionalBoxMobile : {}),
                    background: cor.fundo,
                    borderColor: `${cor.borda}66`,
                    boxShadow: `0 24px 70px ${cor.brilho}`,
                  }}
                >
                  <div style={{ ...profissionalHeader, ...(isMobile ? profissionalHeaderMobile : {}) }}>
                    <div>
                      <div style={{ ...avatarLinha, ...(isMobile ? avatarLinhaMobile : {}) }}>
                        <div
                          style={{
                            ...avatarProfissional,
                            borderColor: `${cor.borda}88`,
                          }}
                        >
                          {profissional.profissionalNome
                            ?.charAt(0)
                            ?.toUpperCase() || 'P'}
                        </div>

                        <div>
                          <h3 style={{ ...nomeProfissional, color: cor.texto }}>
                            {profissional.profissionalNome}
                          </h3>

                          <p style={descricaoProfissional}>
                            {textoComissaoProfissional(profissional)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ ...valorDestaqueBox, ...(isMobile ? valorDestaqueBoxMobile : {}) }}>
                      <span style={valorDestaqueLabel}>Comissão total</span>
                      <strong style={{ ...valorDestaque, ...(isMobile ? valorDestaqueMobile : {}) }}>
                        {valorFinanceiro(profissional.totalComissao)}
                      </strong>
                    </div>
                  </div>

                  <div style={{ ...miniCards, ...(isMobile ? miniCardsMobile : {}) }}>
                    <Resumo titulo="Serviços" valor={profissional.totalServicos} />
                    <Resumo
                      titulo="Faturado"
                      valor={valorFinanceiro(profissional.totalFaturado)}
                    />
                    <Resumo
                      titulo="Pendente"
                      valor={valorFinanceiro(profissional.totalPendente)}
                    />
                  </div>

                  {Number(profissional.totalPendente || 0) > 0 && (
                    <button
                      onClick={() => setModalFechamento(profissional)}
                      style={botaoFecharComissao}
                    >
                      Fechar comissão pendente
                    </button>
                  )}

                  <div style={servicosArea}>
                    <div style={{ ...servicosHeader, ...(isMobile ? servicosHeaderMobile : {}) }}>
                      <div>
                        <h4 style={servicosTitulo}>Detalhes da comissão</h4>
                        <span style={servicosHint}>
                          {profissional.servicos?.length || 0} serviço(s) no período
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => alternarDetalhesProfissional(profissional.profissionalId)}
                        style={botaoVerDetalhes}
                      >
                        {detalhesAbertosIds.includes(profissional.profissionalId)
                          ? 'Ocultar detalhes'
                          : 'Ver detalhes'}
                      </button>
                    </div>

                    {detalhesAbertosIds.includes(profissional.profissionalId) && (
                      <div style={servicosLista}>
                        {profissional.servicos.map((servico: any) => (
                          <div
                            key={servico.comissaoId || servico.agendamentoId}
                            style={linhaServico}
                          >
                            <div style={servicoInfoPrincipal}>
                              <strong style={servicoNome}>{servico.servico}</strong>
                              <p style={textoPequeno}>
                                {formatarData(servico.data)} · {servico.cliente}
                              </p>
                            </div>

                            <div style={isMobile ? valorServicoMobile : valorServicoBox}>
                              <strong style={servicoValor}>
                                {valorFinanceiro(servico.valorServico)}
                              </strong>
                              <p style={textoPequeno}>
                                Comissão:{' '}
                                {valorFinanceiro(valorComissaoServico(servico))}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {profissional.tipoComissao === 'nao_configurada' && (
                    <Link href="/profissionais" prefetch={false} style={linkSemDecoracao}>
                      <button style={botaoAviso}>
                        Configurar comissão deste profissional
                      </button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {modalFechamento && (
        <div style={{ ...modalOverlay, ...(isMobile ? modalOverlayMobile : {}) }}>
          <div style={{ ...modalBox, ...(isMobile ? modalBoxMobile : {}) }}>
            <div style={modalIcone}>💰</div>

            <h2 style={modalTitulo}>Fechar comissão</h2>

            <p style={modalTexto}>
              Profissional:{' '}
              <strong>{modalFechamento.profissionalNome}</strong>
            </p>

            <div style={{ ...resumoFechamento, ...(isMobile ? resumoFechamentoMobile : {}) }}>
              <Resumo
                titulo="Pendente"
                valor={valorFinanceiro(modalFechamento.totalPendente)}
              />

              <Resumo
                titulo="Período"
                valor={`${formatarData(dataInicio)} até ${formatarData(dataFim)}`}
                           />
            </div>

            <label style={campo}>
              <span style={label}>Observação do repasse</span>

              <textarea
                value={observacaoFechamento}
                onChange={(e) =>
                  setObservacaoFechamento(e.target.value)
                }
                placeholder="Ex: Comissão paga via Pix."
                style={textarea}
              />
            </label>

            <div style={{ ...acoesModal, ...(isMobile ? acoesModalMobile : {}) }}>
              <button
                onClick={() => {
                  setModalFechamento(null);
                  setObservacaoFechamento('');
                }}
                style={botaoCancelar}
              >
                Cancelar
              </button>

              <button
                onClick={() =>
                  fecharComissao(modalFechamento)
                }
                disabled={fechandoComissao}
                style={botaoConfirmar}
              >
                {fechandoComissao
                  ? 'Fechando...'
                  : 'Confirmar fechamento'}
              </button>
            </div>
          </div>
        </div>
      )}
        </main>
  </PremiumLayout>
);
}

function Card({
  icone,
  titulo,
  valor,
  detalhe,
}: any) {
  return (
    <div style={card}>
      <div style={cardTop}>
        <span style={cardIcone}>{icone}</span>

        <div>
          <div style={cardTitulo}>{titulo}</div>
          <strong style={cardValor}>{valor}</strong>
        </div>
      </div>

      <p style={cardDetalhe}>{detalhe}</p>
    </div>
  );
}

function Resumo({ titulo, valor }: any) {
  return (
    <div style={resumoBox}>
      <span style={resumoTitulo}>{titulo}</span>
      <strong style={resumoValor}>{valor}</strong>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, var(--marcae-bg) 0%, var(--marcae-bg-soft) 100%)',
  padding: 24,
  position: 'relative',
  overflowX: 'hidden',
};

const pageMobile: CSSProperties = {
  padding: 12,
  paddingBottom: 118,
  overflowX: 'hidden',
};

const containerMobile: CSSProperties = {
  maxWidth: '100%',
};

const headerPremiumMobile: CSSProperties = {
  padding: 14,
  borderRadius: 22,
  marginBottom: 14,
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 12,
};

const headerLeftMobile: CSSProperties = {
  minWidth: 0,
  width: '100%',
};

const tituloHeaderMobile: CSSProperties = {
  fontSize: 25,
  letterSpacing: '-0.6px',
};

const subtituloHeaderMobile: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.45,
  maxWidth: '100%',
};

const headerRightMobile: CSSProperties = {
  width: '100%',
  justifyContent: 'stretch',
  flexDirection: 'column',
  alignItems: 'stretch',
};

const headerMiniCardMobile: CSSProperties = {
  minWidth: 0,
  width: '100%',
  height: 'auto',
  padding: 16,
};

const headerButtonsMobile: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  width: '100%',
  gap: 8,
};

const painelPeriodoMobile: CSSProperties = {
  padding: 14,
  borderRadius: 20,
  marginBottom: 14,
};

const gridFiltroMobile: CSSProperties = {
  gridTemplateColumns: '1fr',
  gap: 14,
};

const gridCardsMobile: CSSProperties = {
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
  marginBottom: 14,
};

const boxMobile: CSSProperties = {
  padding: 14,
  borderRadius: 22,
};

const sectionHeaderMobile: CSSProperties = {
  alignItems: 'stretch',
};

const periodoPillMobile: CSSProperties = {
  width: '100%',
  textAlign: 'center',
  borderRadius: 16,
};

const profissionaisGridMobile: CSSProperties = {
  gap: 12,
};

const profissionalBoxMobile: CSSProperties = {
  padding: 14,
  borderRadius: 20,
};

const profissionalHeaderMobile: CSSProperties = {
  flexDirection: 'column',
  alignItems: 'stretch',
};

const avatarLinhaMobile: CSSProperties = {
  alignItems: 'flex-start',
};

const valorDestaqueBoxMobile: CSSProperties = {
  textAlign: 'left',
  width: '100%',
  padding: 12,
  borderRadius: 16,
  background: 'rgba(2,6,23,.30)',
  border: '1px solid var(--marcae-border)',
};

const valorDestaqueMobile: CSSProperties = {
  fontSize: 22,
};

const miniCardsMobile: CSSProperties = {
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 6,
};

const servicosHeaderMobile: CSSProperties = {
  alignItems: 'stretch',
  gap: 10,
  flexDirection: 'column',
};

const linhaServicoMobile: CSSProperties = {
  flexDirection: 'column',
  alignItems: 'stretch',
};

const valorServicoMobile: CSSProperties = {
  textAlign: 'left',
  minWidth: 0,
};

const modalOverlayMobile: CSSProperties = {
  alignItems: 'flex-end',
  padding: 12,
};

const modalBoxMobile: CSSProperties = {
  maxWidth: '100%',
  borderRadius: 26,
  padding: 20,
  maxHeight: '92vh',
  overflowY: 'auto',
};

const resumoFechamentoMobile: CSSProperties = {
  gridTemplateColumns: '1fr',
};

const acoesModalMobile: CSSProperties = {
  flexDirection: 'column',
};

const backgroundGlowUm: CSSProperties = {
  position: 'fixed',
  width: 360,
  height: 360,
  borderRadius: '50%',
  background: 'var(--marcae-primary-soft)',
  filter: 'blur(110px)',
  top: -140,
  right: -110,
  zIndex: 0,
  pointerEvents: 'none',
};

const backgroundGlowDois: CSSProperties = {
  position: 'fixed',
  width: 320,
  height: 320,
  borderRadius: '50%',
  background: 'var(--marcae-secondary-soft)',
  filter: 'blur(110px)',
  bottom: -140,
  left: -100,
  zIndex: 0,
  pointerEvents: 'none',
};

const container: CSSProperties = {
  width: '100%',
  maxWidth: 1600,
  margin: '0 auto',
  position: 'relative',
  zIndex: 1,
};

const loadingBox: CSSProperties = {
  maxWidth: 500,
  margin: '120px auto',
  background: 'var(--marcae-card)',
  border: '1px solid var(--marcae-border)',
  color: '#fff',
  padding: 30,
  borderRadius: 28,
  textAlign: 'center',
  fontSize: 18,
  fontWeight: 700,
  backdropFilter: 'blur(18px)',
};

const bloqueioBox: CSSProperties = {
  background: 'var(--marcae-card)',
  border: '1px solid var(--marcae-border)',
  borderRadius: 30,
  padding: 50,
  textAlign: 'center',
  color: '#fff',
  maxWidth: 650,
  margin: '80px auto',
  backdropFilter: 'blur(20px)',
};

const bloqueioIcone: CSSProperties = {
  fontSize: 64,
  marginBottom: 20,
};

const tituloBloqueio: CSSProperties = {
  margin: 0,
  fontSize: 36,
  fontWeight: 900,
};

const textoBloqueio: CSSProperties = {
  color: 'var(--marcae-muted)',
  marginTop: 14,
  marginBottom: 28,
  fontSize: 16,
};

const linkSemDecoracao: CSSProperties = {
  textDecoration: 'none',
};

const headerTitleRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
};

const headerTitleWrap: CSSProperties = {
  minWidth: 0,
};

const headerIcon: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 16,
  background: 'var(--marcae-gradient)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
  boxShadow: '0 12px 28px var(--marcae-primary-soft)',
  flexShrink: 0,
};

const headerStats: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8,
  minWidth: 310,
};

const headerStat: CSSProperties = {
  background: 'rgba(255,255,255,.045)',
  border: '1px solid rgba(255,255,255,.07)',
  borderRadius: 15,
  padding: '9px 10px',
  display: 'grid',
  gap: 3,
};

const headerStatValue: CSSProperties = {
  color: '#fff',
  fontSize: 15,
  fontWeight: 950,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const headerStatLabel: CSSProperties = {
  color: 'var(--marcae-muted)',
  fontSize: 10,
  fontWeight: 800,
};

const headerPremium: CSSProperties = {
  width: '100%',
  background: 'rgba(15,23,42,.78)',
  borderRadius: 24,
  padding: 18,
  marginBottom: 16,
  border: '1px solid var(--marcae-border)',
  boxShadow: '0 14px 42px rgba(0,0,0,.24)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  position: 'relative',
  overflow: 'hidden',
  backdropFilter: 'blur(16px)',
};

const headerConteudo: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 26,
  flex: 1,
  minWidth: 320,
};

const logoHeader: CSSProperties = {
  width: 110,
  height: 110,
  borderRadius: 32,
  overflow: 'hidden',
  background: 'rgba(255,255,255,.14)',
  border: '1px solid rgba(255,255,255,.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 40,
  fontWeight: 900,
  color: '#fff',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 20px 50px rgba(0,0,0,.18)',
};

const badgeBoasVindas: CSSProperties = {
  display: 'inline-flex',
  padding: '8px 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,.14)',
  color: '#fff',
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 12,
};

const tituloHeader: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 28,
  fontWeight: 950,
  lineHeight: 1,
  letterSpacing: '-0.9px',
};

const subtituloHeader: CSSProperties = {
  margin: '6px 0 0',
  color: 'var(--marcae-muted)',
  maxWidth: 560,
  fontSize: 13,
  lineHeight: 1.45,
  fontWeight: 700,
};

const linhaBadgesHeader: CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  marginTop: 22,
};

const badgeEmpresa: CSSProperties = {
  background: 'rgba(255,255,255,.14)',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  backdropFilter: 'blur(10px)',
};

const badgeModulo: CSSProperties = {
  background: 'var(--marcae-secondary-soft)',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const badgeStatus: CSSProperties = {
  background: 'rgba(34,197,94,.16)',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const acoesHeader: CSSProperties = {
  display: 'flex',
  gap: 14,
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
};

const botaoHeaderGlass: CSSProperties = {
  height: 38,
  padding: '0 13px',
  borderRadius: 13,
  border: '1px solid rgba(255,255,255,.10)',
  background: 'rgba(255,255,255,.06)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
  backdropFilter: 'blur(14px)',
  fontSize: 12,
};

const botaoHeaderBranco: CSSProperties = {
  height: 56,
  padding: '0 24px',
  borderRadius: 18,
  border: 'none',
  background: '#fff',
  color: 'var(--marcae-primary)',
  fontWeight: 900,
  cursor: 'pointer',
  fontSize: 14,
  boxShadow: '0 18px 40px rgba(255,255,255,.18)',
};

const filtroCompactHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
};

const painelPeriodo: CSSProperties = {
  background: 'var(--marcae-card)',
  border: '1px solid var(--marcae-border)',
  borderRadius: 22,
  padding: 18,
  marginBottom: 16,
  backdropFilter: 'blur(16px)',
  boxShadow: '0 14px 40px rgba(0,0,0,.22)',
};

const sectionHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 16,
};

const mapaToolbar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 10,
  flexWrap: 'wrap',
  width: '100%',
  maxWidth: 560,
};

const buscaProfissionalBox: CSSProperties = {
  minHeight: 38,
  flex: 1,
  minWidth: 220,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  borderRadius: 999,
  border: '1px solid var(--marcae-border)',
  background: 'rgba(2,6,23,.34)',
  padding: '0 12px',
};

const buscaIcone: CSSProperties = {
  fontSize: 13,
  opacity: 0.9,
};

const buscaProfissionalInput: CSSProperties = {
  width: '100%',
  height: 36,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: '#fff',
  fontSize: 12,
  fontWeight: 800,
};

const sectionEyebrow: CSSProperties = {
  color: 'var(--marcae-secondary)',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
};

const sectionTitle: CSSProperties = {
  margin: '5px 0 0',
  color: '#fff',
  fontSize: 22,
  fontWeight: 950,
};

const sectionDescription: CSSProperties = {
  margin: '6px 0 0',
  color: 'var(--marcae-muted)',
  fontSize: 13,
  lineHeight: 1.5,
};

const periodoPill: CSSProperties = {
  padding: '8px 11px',
  borderRadius: 999,
  background: 'var(--marcae-primary-soft)',
  border: '1px solid var(--marcae-primary-medium)',
  color: '#fff',
  fontWeight: 900,
  fontSize: 12,
};

const gridFiltro: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 150px',
  gap: 10,
  alignItems: 'end',
  marginTop: 14,
};

const campo: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const label: CSSProperties = {
  color: '#cbd5e1',
  fontWeight: 800,
  fontSize: 13,
};

const input: CSSProperties = {
  height: 42,
  borderRadius: 13,
  border: '1px solid var(--marcae-border)',
  background: 'var(--marcae-card-strong)',
  color: '#fff',
  padding: '0 12px',
  outline: 'none',
};

const gridCards: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 10,
  marginBottom: 16,
};

const card: CSSProperties = {
  background: 'rgba(15,23,42,.70)',
  border: '1px solid var(--marcae-border)',
  borderRadius: 18,
  padding: 14,
  backdropFilter: 'blur(16px)',
};

const cardTop: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
};

const cardIcone: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 13,
  background: 'var(--marcae-primary-soft)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 17,
};

const cardTitulo: CSSProperties = {
  color: 'var(--marcae-muted)',
  fontSize: 13,
};

const cardValor: CSSProperties = {
  display: 'block',
  marginTop: 2,
  color: '#fff',
  fontSize: 20,
  fontWeight: 950,
  lineHeight: 1.08,
};

const cardDetalhe: CSSProperties = {
  margin: '8px 0 0',
  color: 'var(--marcae-muted)',
  fontSize: 11,
  lineHeight: 1.35,
};

const box: CSSProperties = {
  background: 'var(--marcae-card)',
  border: '1px solid var(--marcae-border)',
  borderRadius: 22,
  padding: 18,
  backdropFilter: 'blur(16px)',
};

const profissionaisGrid: CSSProperties = {
  display: 'grid',
  gap: 12,
};

const profissionalBox: CSSProperties = {
  border: '1px solid',
  borderRadius: 22,
  padding: 16,
  backdropFilter: 'blur(18px)',
};

const profissionalHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'center',
  flexWrap: 'wrap',
};

const avatarLinha: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
};

const avatarProfissional: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 16,
  border: '1px solid',
  background: 'rgba(15,23,42,.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: 20,
  fontWeight: 900,
  flexShrink: 0,
};

const nomeProfissional: CSSProperties = {
  margin: 0,
  fontSize: 19,
  fontWeight: 950,
};

const descricaoProfissional: CSSProperties = {
  margin: '4px 0 0',
  color: '#cbd5e1',
  fontSize: 12,
  lineHeight: 1.35,
};

const valorDestaqueBox: CSSProperties = {
  textAlign: 'right',
};

const valorDestaqueLabel: CSSProperties = {
  display: 'block',
  color: 'var(--marcae-muted)',
  fontSize: 12,
  marginBottom: 6,
};

const valorDestaque: CSSProperties = {
  color: '#fff',
  fontSize: 25,
  fontWeight: 950,
};

const miniCards: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
  gap: 8,
  marginTop: 12,
};

const resumoBox: CSSProperties = {
  background: 'rgba(2,6,23,.32)',
  border: '1px solid var(--marcae-border)',
  borderRadius: 15,
  padding: 10,
  minWidth: 0,
  overflow: 'hidden',
};

const resumoTitulo: CSSProperties = {
  display: 'block',
  color: 'var(--marcae-muted)',
  fontSize: 11,
  fontWeight: 800,
};

const resumoValor: CSSProperties = {
  display: 'block',
  marginTop: 5,
  color: '#fff',
  fontSize: 14,
  fontWeight: 950,
  lineHeight: 1.15,
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
};

const botaoFecharComissao: CSSProperties = {
  width: '100%',
  marginTop: 12,
  height: 42,
  borderRadius: 14,
  border: 'none',
  background: 'linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary))',
  color: '#fff',
  fontWeight: 950,
  fontSize: 13,
  cursor: 'pointer',
  boxShadow: '0 12px 28px var(--marcae-primary-soft)',
};

const servicosArea: CSSProperties = {
  marginTop: 14,
};

const servicosHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
};

const servicosTitulo: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 14,
  fontWeight: 950,
};

const servicosHint: CSSProperties = {
  display: 'block',
  marginTop: 4,
  color: 'var(--marcae-muted)',
  fontSize: 11,
  fontWeight: 800,
};

const botaoVerDetalhes: CSSProperties = {
  minHeight: 36,
  borderRadius: 13,
  border: '1px solid var(--marcae-border)',
  background: 'rgba(255,255,255,.07)',
  color: '#fff',
  padding: '0 14px',
  fontSize: 12,
  fontWeight: 950,
  cursor: 'pointer',
};


const servicosBadge: CSSProperties = {
  background: 'rgba(255,255,255,.08)',
  borderRadius: 999,
  padding: '8px 12px',
  color: '#cbd5e1',
  fontSize: 12,
  fontWeight: 800,
};

const servicosLista: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
  gap: 8,
};

const linhaServico: CSSProperties = {
  background: 'rgba(2,6,23,.30)',
  border: '1px solid var(--marcae-border)',
  borderRadius: 14,
  padding: 11,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'center',
};


const servicoInfoPrincipal: CSSProperties = {
  minWidth: 0,
};

const valorServicoBox: CSSProperties = {
  textAlign: 'right',
  minWidth: 120,
};

const servicoNome: CSSProperties = {
  color: '#fff',
  fontSize: 13,
  fontWeight: 900,
};

const servicoValor: CSSProperties = {
  color: '#fff',
  fontSize: 14,
  fontWeight: 950,
};

const textoPequeno: CSSProperties = {
  margin: '4px 0 0',
  color: 'var(--marcae-muted)',
  fontSize: 11,
  lineHeight: 1.35,
};

const botaoAviso: CSSProperties = {
  width: '100%',
  marginTop: 18,
  height: 52,
  borderRadius: 16,
  border: '1px solid rgba(251,191,36,.24)',
  background: 'rgba(245,158,11,.14)',
  color: '#fde68a',
  fontWeight: 900,
  cursor: 'pointer',
};

const emptyBox: CSSProperties = {
  background: 'rgba(2,6,23,.36)',
  border: '1px dashed var(--marcae-border)',
  borderRadius: 22,
  padding: 28,
  color: 'var(--marcae-muted)',
  textAlign: 'center',
};

const botaoPrincipal: CSSProperties = {
  height: 42,
  borderRadius: 13,
  border: 'none',
  background: 'var(--marcae-gradient)',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
  boxShadow: '0 12px 28px var(--marcae-primary-soft)',
};

const modalOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(2,6,23,.78)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  zIndex: 999,
};

const modalBox: CSSProperties = {
  width: '100%',
  maxWidth: 560,
  background: 'var(--marcae-card-strong)',
  border: '1px solid var(--marcae-border)',
  borderRadius: 30,
  padding: 30,
  boxShadow: '0 40px 120px rgba(0,0,0,.45)',
};

const modalIcone: CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 22,
  background: 'rgba(34,197,94,.16)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 34,
  marginBottom: 18,
};

const modalTitulo: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 30,
  fontWeight: 900,
};

const modalTexto: CSSProperties = {
  color: 'var(--marcae-muted)',
  marginTop: 10,
  lineHeight: 1.7,
};

const resumoFechamento: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
  margin: '24px 0',
};

const textarea: CSSProperties = {
  width: '100%',
  minHeight: 120,
  borderRadius: 18,
  border: '1px solid var(--marcae-border)',
  background: 'rgba(2,6,23,.36)',
  color: '#fff',
  padding: 16,
  marginTop: 8,
  resize: 'none',
  outline: 'none',
};

const acoesModal: CSSProperties = {
  display: 'flex',
  gap: 14,
  marginTop: 24,
};

const botaoCancelar: CSSProperties = {
  flex: 1,
  height: 54,
  borderRadius: 16,
  border: '1px solid var(--marcae-border)',
  background: 'transparent',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const botaoConfirmar: CSSProperties = {
  flex: 1,
  height: 54,
  borderRadius: 16,
  border: 'none',
  background: 'linear-gradient(135deg, var(--marcae-primary), var(--marcae-secondary))',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: 'var(--marcae-glow)',
};

const headerLeft: CSSProperties = {
  flex: 1,
  minWidth: 280,
};

const headerRight: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const headerEyebrow: CSSProperties = {
  display: 'block',
  color: 'var(--marcae-secondary)',
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: 0.9,
  textTransform: 'uppercase',
  marginBottom: 5,
};

const headerMiniCard: CSSProperties = {
  minWidth: 260,
  height: 96,
  borderRadius: 24,
  background: 'var(--marcae-card-strong)',
  border: '1px solid var(--marcae-border)',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: 18,
  boxShadow: 'var(--marcae-shadow)',
};

const miniLogo: CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: 18,
  background: 'var(--marcae-gradient)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
  fontWeight: 900,
};

const miniCardTitle: CSSProperties = {
  color: '#fff',
  fontSize: 15,
  fontWeight: 900,
  maxWidth: 160,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const miniCardSub: CSSProperties = {
  color: 'var(--marcae-muted)',
  fontSize: 12,
  marginTop: 4,
  fontWeight: 700,
};

const headerButtons: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};