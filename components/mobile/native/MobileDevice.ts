type MarcaeDeviceOrientacao = 'portrait' | 'landscape';

type MarcaeDeviceTipoConexao =
  | 'bluetooth'
  | 'cellular'
  | 'ethernet'
  | 'mixed'
  | 'none'
  | 'other'
  | 'unknown'
  | 'wifi'
  | 'wimax'
  | string
  | null;

type MarcaeDeviceConnection = {
  effectiveType?: string;
  type?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: EventListener) => void;
  removeEventListener?: (type: string, listener: EventListener) => void;
};

type MarcaeNavigatorComConexao = Navigator & {
  connection?: MarcaeDeviceConnection;
  mozConnection?: MarcaeDeviceConnection;
  webkitConnection?: MarcaeDeviceConnection;
};

export type MarcaeDeviceInfo = {
  plataforma: string;
  idioma: string;
  idiomas: string[];
  fusoHorario: string;
  online: boolean;
  tipoConexao: MarcaeDeviceTipoConexao;
  tipoConexaoEfetiva: string | null;
  economiaDados: boolean;
  larguraTela: number;
  alturaTela: number;
  larguraViewport: number;
  alturaViewport: number;
  densidadePixel: number;
  orientacao: MarcaeDeviceOrientacao;
  touch: boolean;
  standalone: boolean;
  userAgent: string;
};

export type MarcaeDeviceConexaoInfo = {
  online: boolean;
  tipoConexao: MarcaeDeviceTipoConexao;
  tipoConexaoEfetiva: string | null;
  economiaDados: boolean;
  downlink: number | null;
  rtt: number | null;
};

export type MarcaeDeviceListenerRemover = () => void;

const ambienteBrowserDisponivel = (): boolean => {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
};

const obterNavigatorComConexao = (): MarcaeNavigatorComConexao | null => {
  if (!ambienteBrowserDisponivel()) {
    return null;
  }

  return navigator as MarcaeNavigatorComConexao;
};

const obterConexaoNavigator = (): MarcaeDeviceConnection | null => {
  const navegador = obterNavigatorComConexao();

  if (!navegador) {
    return null;
  }

  return navegador.connection ?? navegador.mozConnection ?? navegador.webkitConnection ?? null;
};

const obterUserAgent = (): string => {
  if (!ambienteBrowserDisponivel()) {
    return '';
  }

  return navigator.userAgent || '';
};

const detectarPlataformaMobile = (): string => {
  if (!ambienteBrowserDisponivel()) {
    return 'server';
  }

  const userAgent = obterUserAgent().toLowerCase();

  if (userAgent.includes('android')) {
    return 'android';
  }

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }

  if (userAgent.includes('mac')) {
    return 'macos';
  }

  if (userAgent.includes('win')) {
    return 'windows';
  }

  if (userAgent.includes('linux')) {
    return 'linux';
  }

  return 'web';
};

const verificarStandaloneMobile = (): boolean => {
  if (!ambienteBrowserDisponivel()) {
    return false;
  }

  const navigatorStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const mediaStandalone =
    typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;

  return navigatorStandalone || mediaStandalone;
};

const verificarTouchMobile = (): boolean => {
  if (!ambienteBrowserDisponivel()) {
    return false;
  }

  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const verificarOnlineMobile = (): boolean => {
  if (!ambienteBrowserDisponivel()) {
    return false;
  }

  return navigator.onLine;
};

export const obterIdiomaMobile = (): string => {
  if (!ambienteBrowserDisponivel()) {
    return 'pt-BR';
  }

  return navigator.language || 'pt-BR';
};

export const obterIdiomasMobile = (): string[] => {
  if (!ambienteBrowserDisponivel()) {
    return ['pt-BR'];
  }

  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return [...navigator.languages];
  }

  return [obterIdiomaMobile()];
};

export const obterFusoHorarioMobile = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
};

export const obterOrientacaoMobile = (): MarcaeDeviceOrientacao => {
  if (!ambienteBrowserDisponivel()) {
    return 'portrait';
  }

  const largura = window.innerWidth || window.screen?.width || 0;
  const altura = window.innerHeight || window.screen?.height || 0;

  if (largura > altura) {
    return 'landscape';
  }

  return 'portrait';
};

export const obterTipoConexaoMobile = (): MarcaeDeviceTipoConexao => {
  const conexao = obterConexaoNavigator();

  if (!conexao) {
    return verificarOnlineMobile() ? 'unknown' : 'none';
  }

  return conexao.type ?? conexao.effectiveType ?? (verificarOnlineMobile() ? 'unknown' : 'none');
};

export const obterInformacoesConexaoMobile = (): MarcaeDeviceConexaoInfo => {
  const conexao = obterConexaoNavigator();

  return {
    online: verificarOnlineMobile(),
    tipoConexao: obterTipoConexaoMobile(),
    tipoConexaoEfetiva: conexao?.effectiveType ?? null,
    economiaDados: conexao?.saveData === true,
    downlink: typeof conexao?.downlink === 'number' ? conexao.downlink : null,
    rtt: typeof conexao?.rtt === 'number' ? conexao.rtt : null,
  };
};

export const obterInformacoesDispositivoMobile = (): MarcaeDeviceInfo => {
  const conexao = obterInformacoesConexaoMobile();

  if (!ambienteBrowserDisponivel()) {
    return {
      plataforma: 'server',
      idioma: 'pt-BR',
      idiomas: ['pt-BR'],
      fusoHorario: obterFusoHorarioMobile(),
      online: false,
      tipoConexao: null,
      tipoConexaoEfetiva: null,
      economiaDados: false,
      larguraTela: 0,
      alturaTela: 0,
      larguraViewport: 0,
      alturaViewport: 0,
      densidadePixel: 1,
      orientacao: 'portrait',
      touch: false,
      standalone: false,
      userAgent: '',
    };
  }

  return {
    plataforma: detectarPlataformaMobile(),
    idioma: obterIdiomaMobile(),
    idiomas: obterIdiomasMobile(),
    fusoHorario: obterFusoHorarioMobile(),
    online: conexao.online,
    tipoConexao: conexao.tipoConexao,
    tipoConexaoEfetiva: conexao.tipoConexaoEfetiva,
    economiaDados: conexao.economiaDados,
    larguraTela: window.screen?.width ?? window.innerWidth ?? 0,
    alturaTela: window.screen?.height ?? window.innerHeight ?? 0,
    larguraViewport: window.innerWidth ?? 0,
    alturaViewport: window.innerHeight ?? 0,
    densidadePixel: window.devicePixelRatio || 1,
    orientacao: obterOrientacaoMobile(),
    touch: verificarTouchMobile(),
    standalone: verificarStandaloneMobile(),
    userAgent: obterUserAgent(),
  };
};

export const escutarMudancaConexaoMobile = (
  callback: (info: MarcaeDeviceConexaoInfo) => void,
): MarcaeDeviceListenerRemover => {
  if (!ambienteBrowserDisponivel()) {
    return () => undefined;
  }

  const notificar = () => {
    callback(obterInformacoesConexaoMobile());
  };

  window.addEventListener('online', notificar);
  window.addEventListener('offline', notificar);

  const conexao = obterConexaoNavigator();

  if (conexao?.addEventListener) {
    conexao.addEventListener('change', notificar);
  }

  return () => {
    window.removeEventListener('online', notificar);
    window.removeEventListener('offline', notificar);

    if (conexao?.removeEventListener) {
      conexao.removeEventListener('change', notificar);
    }
  };
};

export const escutarMudancaOrientacaoMobile = (
  callback: (orientacao: MarcaeDeviceOrientacao) => void,
): MarcaeDeviceListenerRemover => {
  if (!ambienteBrowserDisponivel()) {
    return () => undefined;
  }

  const notificar = () => {
    callback(obterOrientacaoMobile());
  };

  window.addEventListener('resize', notificar);
  window.addEventListener('orientationchange', notificar);

  return () => {
    window.removeEventListener('resize', notificar);
    window.removeEventListener('orientationchange', notificar);
  };
};

export const removerEscutaConexaoMobile = (remover?: MarcaeDeviceListenerRemover): void => {
  if (typeof remover === 'function') {
    remover();
  }
};

export const removerEscutaOrientacaoMobile = (remover?: MarcaeDeviceListenerRemover): void => {
  if (typeof remover === 'function') {
    remover();
  }
};