'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { gerarTemaEmpresa } from '@/app/lib/theme';

type Props = {
  children: React.ReactNode;
  empresa?: any;
  usuario?: any;
};

const menu = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/agenda', label: 'Agenda', icon: '📅' },
  { href: '/clientes', label: 'Clientes', icon: '👥' },
  { href: '/servicos', label: 'Serviços', icon: '✂️' },
  { href: '/profissionais', label: 'Profissionais', icon: '🧑‍💼' },
  { href: '/promocoes', label: 'Promoções', icon: '🔥' },
  { href: '/financeiro', label: 'Financeiro', icon: '💳' },
  { href: '/comissoes', label: 'Comissões', icon: '💰' },
  { href: '/relatorios', label: 'Relatórios', icon: '📈' },
  { href: '/planos', label: 'Planos', icon: '💎' },
  { href: '/configuracoes', label: 'Configurações', icon: '⚙️' },
];

  var audioGlobalLiberado = false;
  var audioGlobalContext: AudioContext | null = null;

export default function PremiumLayout({ children, empresa, usuario }: Props) {
  const pathname = usePathname();

  const [mobileMenuAberto, setMobileMenuAberto] = useState(false);
  const [quantidadeNotificacoes, setQuantidadeNotificacoes] = useState(0);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [animandoSino, setAnimandoSino] = useState(false);
  const [painelNotificacoesAberto, setPainelNotificacoesAberto] = useState(false);
  const [notificacoesCarregadas, setNotificacoesCarregadas] = useState(false);

  const ultimoCheckRef = useRef<string | null>(null);
  const notificacoesIdsRef = useRef<Set<string>>(new Set());
  const audioLiberadoRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const tema = gerarTemaEmpresa(empresa || {});
  const corPrimaria = tema.primary;
  const corSecundaria = tema.secondary;
  const corSidebar = tema.sidebar;
  const storageKey = `marcae_notificacoes_${empresa?.id || 'global'}`;

  const cssVars = {
    '--marcae-primary': tema.primary,
    '--marcae-primary-soft': tema.primarySoft,
    '--marcae-primary-medium': tema.primaryMedium,
    '--marcae-primary-strong': tema.primaryStrong,
    '--marcae-secondary': tema.secondary,
    '--marcae-secondary-soft': tema.secondarySoft,
    '--marcae-secondary-medium': tema.secondaryMedium,
    '--marcae-secondary-strong': tema.secondaryStrong,
    '--marcae-sidebar': tema.sidebar,
    '--marcae-sidebar-soft': tema.sidebarSoft,
    '--marcae-sidebar-medium': tema.sidebarMedium,
    '--marcae-bg': tema.bg,
    '--marcae-bg-soft': tema.bgSoft,
    '--marcae-card': tema.card,
    '--marcae-card-strong': tema.cardStrong,
    '--marcae-border': tema.border,
    '--marcae-text': tema.text,
    '--marcae-muted': tema.muted,
    '--marcae-success': tema.success,
    '--marcae-danger': tema.danger,
    '--marcae-warning': tema.warning,
    '--marcae-gradient': tema.gradient,
    '--marcae-gradient-soft': tema.gradientSoft,
    '--marcae-glow': tema.glow,
  } as React.CSSProperties;


  useEffect(() => {
    setMobileMenuAberto(false);
    setPainelNotificacoesAberto(false);
  }, [pathname]);

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

      if (typeof parsed?.quantidade === 'number') {
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
    console.error('Erro ao carregar notificações salvas:', error);

    setNotificacoes([]);
    setQuantidadeNotificacoes(0);
    ultimoCheckRef.current = null;
    notificacoesIdsRef.current = new Set();
  } finally {
    setNotificacoesCarregadas(true);
  }
}, [empresa?.id, storageKey]);

useEffect(() => {
    if (typeof window !== 'undefined') {
      audioLiberadoRef.current =
        sessionStorage.getItem('marcae_audio_notificacoes_liberado') === 'true';
    }

    const liberarAudio = () => {
      audioLiberadoRef.current = true;
audioGlobalLiberado = true;

      try {
        sessionStorage.setItem('marcae_audio_notificacoes_liberado', 'true');

        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;

        if (AudioContextClass && !audioContextRef.current) {
          audioContextRef.current = new AudioContextClass();
        }

        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
      } catch (error) {
        console.warn('Áudio de notificação ainda não liberado:', error);
      }
    };

    window.addEventListener('click', liberarAudio);
    window.addEventListener('touchstart', liberarAudio);
    window.addEventListener('keydown', liberarAudio);

    return () => {
      window.removeEventListener('click', liberarAudio);
      window.removeEventListener('touchstart', liberarAudio);
      window.removeEventListener('keydown', liberarAudio);
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

    if (contexto.state === 'suspended') {
      contexto.resume().catch(() => {});
    }

    const tocarBeep = (
      frequencia: number,
      inicio: number,
      duracao: number,
      volume: number
    ) => {
      const oscilador = contexto.createOscillator();
      const ganho = contexto.createGain();

      oscilador.type = 'sine';

      oscilador.frequency.setValueAtTime(
        frequencia,
        contexto.currentTime + inicio
      );

      ganho.gain.setValueAtTime(
        0.0001,
        contexto.currentTime + inicio
      );

      ganho.gain.exponentialRampToValueAtTime(
        volume,
        contexto.currentTime + inicio + 0.015
      );

      ganho.gain.exponentialRampToValueAtTime(
        0.0001,
        contexto.currentTime + inicio + duracao
      );

      oscilador.connect(ganho);
      ganho.connect(contexto.destination);

      oscilador.start(contexto.currentTime + inicio);

      oscilador.stop(
        contexto.currentTime + inicio + duracao
      );
    };

    tocarBeep(660, 0, 0.07, 0.22);
tocarBeep(880, 0.11, 0.07, 0.2);
tocarBeep(1040, 0.23, 0.12, 0.18);

  } catch (error) {
    console.warn(
      'Não foi possível tocar o som da notificação:',
      error
    );
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
          params.set('ultimoCheck', ultimoCheckRef.current);
        }

        const response = await fetch(
          `/api/notificacoes/agendamentos?${params.toString()}`,
          {
            cache: 'no-store',
          }
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

  setNotificacoes((prev) => [
    ...novosRecebidos,
    ...prev,
  ].slice(0, 12));

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
        console.error('Erro ao verificar notificações:', error);
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
      })
    );
  } catch (error) {
    console.error('Erro ao salvar notificações:', error);
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
      const ultimoAcesso = localStorage.getItem('marcae_ultimo_acesso');

      if (!ultimoAcesso) {
        localStorage.setItem('marcae_ultimo_acesso', Date.now().toString());
        return;
      }

      const agora = Date.now();
      const diferenca = agora - Number(ultimoAcesso);

      if (diferenca > SESSION_TIMEOUT) {
        localStorage.removeItem('empresaLogada');
        localStorage.removeItem('usuarioEmpresa');
        localStorage.removeItem('marcae_ultimo_acesso');

        window.location.href = '/login';
        return;
      }

      localStorage.setItem('marcae_ultimo_acesso', agora.toString());
    }

    validarSessao();

    const interval = setInterval(validarSessao, 60000);

    const atualizarAtividade = () => {
      localStorage.setItem('marcae_ultimo_acesso', Date.now().toString());
    };

    window.addEventListener('click', atualizarAtividade);
    window.addEventListener('keydown', atualizarAtividade);
    window.addEventListener('mousemove', atualizarAtividade);
    window.addEventListener('scroll', atualizarAtividade);
    window.addEventListener('touchstart', atualizarAtividade);

    return () => {
      clearInterval(interval);

      window.removeEventListener('click', atualizarAtividade);
      window.removeEventListener('keydown', atualizarAtividade);
      window.removeEventListener('mousemove', atualizarAtividade);
      window.removeEventListener('scroll', atualizarAtividade);
      window.removeEventListener('touchstart', atualizarAtividade);
    };
  }, []);

  function ativo(href: string) {
    return pathname === href;
  }

  function sair() {
    localStorage.removeItem('empresaLogada');
    localStorage.removeItem('usuarioEmpresa');
    window.location.href = '/login';
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
                      alt={empresa?.nome || 'Marcaê'}
                      style={logoImage}
                    />
                  ) : (
                    <span>{empresa?.nome?.charAt(0)?.toUpperCase() || 'M'}</span>
                  )}
                </div>

                <div>
                  <strong style={empresaNome}>{empresa?.nome || 'Marcaê'}</strong>
                  <span style={empresaPlano}>SaaS Premium Enterprise</span>
                </div>
              </div>

              <div style={empresaStatusCard}>
                <div style={empresaStatusHeader}>
                  <div style={onlineDot} />
                  <span>Sistema operacional ativo</span>
                </div>

                <strong style={empresaStatusTitle}>Gestão inteligente do negócio</strong>

                <p style={empresaStatusText}>
                  Analytics, financeiro, agenda, CRM e automações em um único painel.
                </p>
              </div>
            </div>

            <nav style={navGrid}>
              {menu.map((item) => {
                const isActive = ativo(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      ...menuItem,
                      background: isActive
                        ? `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`
                        : 'rgba(255,255,255,0.02)',
                      border: isActive
                        ? `1px solid ${corPrimaria}66`
                        : '1px solid rgba(255,255,255,0.04)',
                      color: isActive ? '#fff' : '#cbd5e1',
                      boxShadow: isActive ? `0 18px 35px ${corPrimaria}40` : 'none',
                    }}
                  >
                    <span style={menuIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                    {isActive && <div style={activeGlow} />}
                  </Link>
                );
              })}
            </nav>

            <div style={{ flex: 1 }} />

            <div style={sidebarBottom}>
              <button type="button" onClick={sair} style={logoutSidebarButton}>
                <span>🚪</span>
                <span>Sair</span>
              </button>

              <div style={userCard}>
                <div style={userAvatar}>
                  {(usuario?.nome || 'U').charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <strong style={userName}>{usuario?.nome || 'Usuário'}</strong>
                  <span style={userRole}>{usuario?.perfil || 'Administrador'}</span>
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
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPainelNotificacoesAberto((aberto) => !aberto);
                      setQuantidadeNotificacoes(0);
                    }}
                    style={{
                      ...topbarIconButton,
                      position: 'relative',
                      transform: animandoSino ? 'scale(1.08) rotate(-8deg)' : 'scale(1)',
                      transition: '.25s',
                      boxShadow: animandoSino
                        ? `0 0 30px ${corPrimaria}99`
                        : 'none',
                    }}
                    title="Notificações de novos agendamentos"
                  >
                    🔔

                    {quantidadeNotificacoes > 0 && (
                      <div style={notificationBadge}>
                        {quantidadeNotificacoes > 99
                          ? '99+'
                          : quantidadeNotificacoes}
                      </div>
                    )}
                  </button>

                  {painelNotificacoesAberto && (
                    <div className="marcae-notification-panel-mobile" style={notificationPanel}>
                      <div style={notificationPanelHeader}>
                        <div>
                          <strong style={notificationPanelTitle}>Notificações</strong>
                          <span style={notificationPanelSub}>
                            Novos agendamentos recebidos
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPainelNotificacoesAberto(false)}
                          style={notificationCloseButton}
                        >
                          ×
                        </button>
                      </div>

                      {notificacoes.length === 0 ? (
                        <div style={notificationEmpty}>
                          Nenhum novo agendamento desde que você abriu o painel.
                        </div>
                      ) : (
                        <div className="marcae-notification-list-mobile" style={notificationList}>
                          {notificacoes.map((item) => (
                            <div key={item.id} style={notificationItem}>
                              <div style={notificationItemIcon}>📅</div>

                              <div style={{ flex: 1 }}>
                                <strong style={notificationItemTitle}>
                                  {item.cliente?.nome ||
                                    item.nomeCliente ||
                                    item.clienteNome ||
                                    'Novo cliente'}
                                </strong>

                                <span style={notificationItemText}>
                                  {item.servico?.nome || 'Serviço'} ·{' '}
                                  {item.profissional?.nome || 'Sem profissional'}
                                </span>

                                <span style={notificationItemDate}>
                                  {item.dataHoraInicio
                                    ? new Date(item.dataHoraInicio).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : 'Horário não informado'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button style={topbarIconButton}>💬</button>

                <div className="marcae-empresa-mini-card" style={empresaMiniCard}>
                  <div style={empresaMiniAvatar}>
                    {empresa?.nome?.charAt(0)?.toUpperCase() || 'M'}
                  </div>

                  <div>
                    <strong style={empresaMiniNome}>{empresa?.nome || 'Marcaê'}</strong>
                    <span style={empresaMiniPlano}>Premium</span>
                  </div>
                </div>
              </div>
            </header>

            <main style={mainContent}>{children}</main>
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
                        src={empresa.logoUrl || empresa.logo || empresa.imagemUrl}
                        alt={empresa?.nome || 'Marcaê'}
                        style={logoImage}
                      />
                    ) : (
                      <span>{empresa?.nome?.charAt(0)?.toUpperCase() || 'M'}</span>
                    )}
                  </div>

                  <div>
                    <strong style={{ ...empresaNome, fontSize: 18 }}>
                      {empresa?.nome || 'Marcaê'}
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

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuAberto(false)}
                      style={{
                        ...mobileDrawerItem,
                        background: isActive
                          ? `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`
                          : 'rgba(255,255,255,0.035)',
                        border: isActive
                          ? `1px solid ${corPrimaria}66`
                          : '1px solid rgba(255,255,255,0.06)',
                        color: isActive ? '#fff' : '#cbd5e1',
                        boxShadow: isActive ? `0 14px 32px ${corPrimaria}33` : 'none',
                      }}
                    >
                      <span style={menuIcon}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={sair}
                style={logoutMobileDrawerButton}
              >
                🚪 Sair do sistema
              </button>

              <div style={mobileDrawerUser}>
                <div style={userAvatar}>
                  {(usuario?.nome || 'U').charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <strong style={userName}>{usuario?.nome || 'Usuário'}</strong>
                  <span style={userRole}>{usuario?.perfil || 'Administrador'}</span>
                </div>
              </div>
            </aside>
          </div>
        )}

        <div className="marcae-mobile-menu" style={mobileMenu}>
          {menu.slice(0, 5).map((item) => {
            const isActive = ativo(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setMobileMenuAberto(false);
                  setPainelNotificacoesAberto(false);
                }}
                style={{
                  ...mobileMenuItem,
                  background: isActive
                    ? `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`
                    : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                  boxShadow: isActive ? `0 10px 30px ${corPrimaria}55` : 'none',
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

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
              overflow-x: hidden !important;
              padding: 10px 8px 120px !important;
              box-sizing: border-box !important;
            }

            .marcae-topbar {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              top: 10px !important;
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

            .marcae-notification-list-mobile {
              max-height: calc(100dvh - 285px) !important;
              overflow-y: auto !important;
              padding-right: 2px !important;
            }

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
  minHeight: '100dvh',
  position: 'relative',
  overflowX: 'hidden',
  overflowY: 'visible',
  background: 'linear-gradient(135deg, var(--marcae-bg) 0%, var(--marcae-bg-soft) 48%, var(--marcae-sidebar) 100%)',
  color: 'var(--marcae-text)',
};

const backgroundGlowPrimary: React.CSSProperties = {
  position: 'fixed',
  top: -300,
  left: -180,
  width: 700,
  height: 700,
  borderRadius: '50%',
  background: 'var(--marcae-primary-soft)',
  filter: 'blur(140px)',
  pointerEvents: 'none',
};

const backgroundGlowSecondary: React.CSSProperties = {
  position: 'fixed',
  top: -200,
  right: -160,
  width: 620,
  height: 620,
  borderRadius: '50%',
  background: 'var(--marcae-secondary-soft)',
  filter: 'blur(130px)',
  pointerEvents: 'none',
};

const backgroundGlowThird: React.CSSProperties = {
  position: 'fixed',
  bottom: -260,
  left: '35%',
  width: 580,
  height: 580,
  borderRadius: '50%',
  background: 'var(--marcae-secondary-soft)',
  filter: 'blur(150px)',
  pointerEvents: 'none',
};

const layoutFlex: React.CSSProperties = {
  display: 'flex',
  minHeight: '100dvh',
  position: 'relative',
  zIndex: 2,
};

const sidebarStyle: React.CSSProperties = {
  width: 300,
  margin: 18,
  padding: 22,
  display: 'flex',
  flexDirection: 'column',
  position: 'sticky',
  top: 18,
  height: 'calc(100vh - 36px)',
  borderRadius: 32,
  background: 'linear-gradient(180deg, var(--marcae-sidebar-soft), rgba(2,6,23,0.96))',
  border: '1px solid var(--marcae-border)',
  backdropFilter: 'blur(24px)',
  boxShadow: '0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
};

const sidebarTop: React.CSSProperties = { marginBottom: 24 };

const brandRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  marginBottom: 22,
};

const logoBox: React.CSSProperties = {
  width: 68,
  height: 68,
  borderRadius: 22,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 26,
  fontWeight: 900,
  color: '#fff',
};

const logoImage: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const empresaNome: React.CSSProperties = {
  display: 'block',
  color: '#fff',
  fontSize: 22,
  fontWeight: 900,
  letterSpacing: '-0.03em',
};

const empresaPlano: React.CSSProperties = {
  color: 'var(--marcae-muted)',
  fontSize: 13,
  fontWeight: 700,
};

const empresaStatusCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--marcae-border)',
  borderRadius: 24,
  padding: 18,
};

const empresaStatusHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
  color: '#dbeafe',
  fontSize: 12,
  fontWeight: 800,
};

const onlineDot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: 'var(--marcae-success)',
  boxShadow: '0 0 18px var(--marcae-success)',
};

const empresaStatusTitle: React.CSSProperties = {
  display: 'block',
  color: '#fff',
  fontSize: 15,
  marginBottom: 8,
};

const empresaStatusText: React.CSSProperties = {
  color: 'var(--marcae-muted)',
  fontSize: 13,
  lineHeight: 1.6,
  margin: 0,
};

const navGrid: React.CSSProperties = { display: 'grid', gap: 10 };

const menuItem: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '14px 16px',
  borderRadius: 20,
  textDecoration: 'none',
  overflow: 'hidden',
  fontWeight: 800,
  transition: '.25s',
};

const menuIcon: React.CSSProperties = { fontSize: 18 };

const activeGlow: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(255,255,255,0.06)',
  pointerEvents: 'none',
};

const sidebarBottom: React.CSSProperties = { display: 'grid', gap: 16 };

const logoutSidebarButton: React.CSSProperties = {
  width: '100%',
  height: 50,
  borderRadius: 18,
  border: '1px solid rgba(239,68,68,.20)',
  background: 'rgba(239,68,68,.08)',
  color: '#fca5a5',
  fontWeight: 900,
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  transition: '.2s',
};

const logoutMobileDrawerButton: React.CSSProperties = {
  width: '100%',
  minHeight: 52,
  borderRadius: 16,
  border: '1px solid rgba(239,68,68,.20)',
  background: 'rgba(239,68,68,.08)',
  color: '#fca5a5',
  fontWeight: 900,
  fontSize: 14,
  cursor: 'pointer',
  marginTop: 14,
};

const userCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: 16,
  borderRadius: 22,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--marcae-border)',
};

const userAvatar: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: '50%',
  background: 'var(--marcae-gradient)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: 900,
};

const userName: React.CSSProperties = { display: 'block', color: '#fff', fontSize: 14 };
const userRole: React.CSSProperties = { color: 'var(--marcae-muted)', fontSize: 12 };
const userArrow: React.CSSProperties = { color: 'var(--marcae-muted)', fontSize: 20 };

const mainWrapper: React.CSSProperties = {
  flex: 1,
  minHeight: '100dvh',
  overflowX: 'hidden',
  overflowY: 'visible',
  WebkitOverflowScrolling: 'touch',
  padding: '18px 22px 120px',
};

const topbar: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 20,
  alignItems: 'center',
  marginBottom: 22,
  position: 'sticky',
  top: 18,
  zIndex: 500,
  padding: 18,
  borderRadius: 28,
  background: 'rgba(5,10,25,0.72)',
  border: '1px solid var(--marcae-border)',
  backdropFilter: 'blur(24px)',
};

const topbarSearch: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 18px',
  borderRadius: 20,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--marcae-border)',
};

const searchIcon: React.CSSProperties = { color: 'var(--marcae-muted)', fontSize: 18 };

const searchInput: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: '#fff',
  fontSize: 14,
};

const shortcutBadge: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid var(--marcae-border)',
  borderRadius: 12,
  padding: '6px 10px',
  color: 'var(--marcae-muted)',
  fontSize: 12,
  fontWeight: 800,
};

const topbarActions: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
};

const topbarIconButton: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 18,
  border: '1px solid var(--marcae-border)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 18,
};

const notificationBadge: React.CSSProperties = {
  position: 'absolute',
  top: -6,
  right: -6,
  minWidth: 24,
  height: 24,
  borderRadius: 999,
  background: '#ef4444',
  color: '#fff',
  fontSize: 11,
  fontWeight: 900,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 6px',
  border: '2px solid rgba(5,10,25,0.95)',
  boxShadow: '0 0 18px rgba(239,68,68,0.65)',
};

const notificationPanel: React.CSSProperties = {
  position: 'absolute',
  top: 60,
  right: 0,
  width: 360,
  maxWidth: 'calc(100vw - 32px)',
  borderRadius: 24,
  padding: 16,
  background: 'rgba(5,10,25,0.96)',
  border: '1px solid var(--marcae-border)',
  boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
  backdropFilter: 'blur(24px)',
  zIndex: 2000,
};

const notificationPanelHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  paddingBottom: 12,
  borderBottom: '1px solid var(--marcae-border)',
};

const notificationPanelTitle: React.CSSProperties = {
  display: 'block',
  color: '#fff',
  fontSize: 15,
  fontWeight: 900,
};

const notificationPanelSub: React.CSSProperties = {
  display: 'block',
  marginTop: 4,
  color: 'var(--marcae-muted)',
  fontSize: 12,
  fontWeight: 700,
};

const notificationCloseButton: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 999,
  border: '1px solid var(--marcae-border)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 18,
  lineHeight: 1,
};

const notificationEmpty: React.CSSProperties = {
  padding: 18,
  color: 'var(--marcae-muted)',
  fontSize: 13,
  lineHeight: 1.5,
};

const notificationList: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 12,
  maxHeight: 380,
  overflowY: 'auto',
};

const notificationItem: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  padding: 12,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--marcae-border)',
};

const notificationItemIcon: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 14,
  background: 'var(--marcae-gradient)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const notificationItemTitle: React.CSSProperties = {
  display: 'block',
  color: '#fff',
  fontSize: 13,
  fontWeight: 900,
};

const notificationItemText: React.CSSProperties = {
  display: 'block',
  marginTop: 4,
  color: '#cbd5e1',
  fontSize: 12,
  fontWeight: 700,
};

const notificationItemDate: React.CSSProperties = {
  display: 'block',
  marginTop: 4,
  color: 'var(--marcae-muted)',
  fontSize: 11,
  fontWeight: 700,
};

const empresaMiniCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  borderRadius: 20,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--marcae-border)',
};

const empresaMiniAvatar: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: 'var(--marcae-gradient)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  color: '#fff',
};

const empresaMiniNome: React.CSSProperties = { display: 'block', color: '#fff', fontSize: 13 };
const empresaMiniPlano: React.CSSProperties = { color: 'var(--marcae-muted)', fontSize: 11 };

const mainContent: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
};


const mobileMenuButton: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 18,
  border: '1px solid var(--marcae-border)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 22,
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const mobileOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 3000,
  display: 'flex',
  justifyContent: 'flex-start',
};

const mobileOverlayBackdrop: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  border: 'none',
  background: 'rgba(2,6,23,0.72)',
  backdropFilter: 'blur(10px)',
  cursor: 'pointer',
};

const mobileDrawer: React.CSSProperties = {
  position: 'relative',
  width: 'min(390px, calc(100vw - 28px))',
  height: 'calc(100vh - 24px)',
  margin: 12,
  padding: 18,
  borderRadius: 28,
  background: 'linear-gradient(180deg, var(--marcae-sidebar-soft), rgba(2,6,23,0.98))',
  border: '1px solid var(--marcae-border)',
  boxShadow: '0 34px 90px rgba(0,0,0,0.62)',
  overflowY: 'auto',
};

const mobileDrawerHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 16,
};

const mobileDrawerClose: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 16,
  border: '1px solid var(--marcae-border)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 24,
  lineHeight: 1,
  flexShrink: 0,
};

const mobileDrawerStatus: React.CSSProperties = {
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid var(--marcae-border)',
  borderRadius: 22,
  padding: 14,
  marginBottom: 16,
};

const mobileDrawerNav: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  paddingBottom: 18,
};

const mobileDrawerItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '13px 12px',
  borderRadius: 18,
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 900,
  minHeight: 50,
};

const mobileDrawerUser: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: 14,
  borderRadius: 20,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--marcae-border)',
};

const mobileMenu: React.CSSProperties = {
  position: 'fixed',
  left: 12,
  right: 12,
  bottom: 12,
  display: 'none',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 10,
  padding: 12,
  borderRadius: 26,
  background: 'rgba(5,10,25,0.88)',
  border: '1px solid var(--marcae-border)',
  backdropFilter: 'blur(24px)',
  zIndex: 999,
};

const mobileMenuItem: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  padding: '10px 6px',
  borderRadius: 18,
  textDecoration: 'none',
  fontSize: 11,
  fontWeight: 800,
};
