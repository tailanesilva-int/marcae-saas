import { detectarMobilePlatform } from './MobilePlatform';

export type MarcaeMobileCapabilities = {
  podeCompartilhar: boolean;
  podeCopiar: boolean;
  podeUsarClipboard: boolean;
  podeAbrirLinksExternos: boolean;
  suportaStandalone: boolean;
  suportaPwa: boolean;
  suportaNotificacoesWeb: boolean;
  suportaServiceWorker: boolean;
  possuiCapacitor: boolean;
  possuiStatusBarNativa: boolean;
  suportaDeepLinks: boolean;
  suportaIntentAndroid: boolean;
  suportaGeo: boolean;
  suportaPix: boolean;
  suportaMercadoPago: boolean;
  suportaWhatsapp: boolean;
  suportaTelefone: boolean;
  suportaEmail: boolean;
  suportaSms: boolean;
};

export function detectarMobileCapabilities(): MarcaeMobileCapabilities {
  if (typeof window === 'undefined') {
    return {
      podeCompartilhar: false,
      podeCopiar: false,
      podeUsarClipboard: false,
      podeAbrirLinksExternos: false,
      suportaStandalone: false,
      suportaPwa: false,
      suportaNotificacoesWeb: false,
      suportaServiceWorker: false,
      possuiCapacitor: false,
      possuiStatusBarNativa: false,
      suportaDeepLinks: false,
      suportaIntentAndroid: false,
      suportaGeo: false,
      suportaPix: false,
      suportaMercadoPago: false,
      suportaWhatsapp: false,
      suportaTelefone: false,
      suportaEmail: false,
      suportaSms: false,
    };
  }

  const platform = detectarMobilePlatform();
  const capacitor = (window as any).Capacitor;
  const plugins = capacitor?.Plugins || {};
  const isMobileLike = platform.isMobile || platform.isStandalone || platform.isCapacitor;

  return {
    podeCompartilhar: typeof navigator.share === 'function',
    podeCopiar: Boolean(navigator.clipboard?.writeText),
    podeUsarClipboard: Boolean(navigator.clipboard),
    podeAbrirLinksExternos: true,
    suportaStandalone: platform.isStandalone,
    suportaPwa: 'serviceWorker' in navigator,
    suportaNotificacoesWeb: 'Notification' in window,
    suportaServiceWorker: 'serviceWorker' in navigator,
    possuiCapacitor: platform.isCapacitor,
    possuiStatusBarNativa: Boolean(plugins.StatusBar),
    suportaDeepLinks: isMobileLike,
    suportaIntentAndroid: platform.isAndroid,
    suportaGeo: isMobileLike,
    suportaPix: isMobileLike || Boolean(navigator.clipboard?.writeText),
    suportaMercadoPago: isMobileLike,
    suportaWhatsapp: isMobileLike,
    suportaTelefone: isMobileLike,
    suportaEmail: true,
    suportaSms: isMobileLike,
  };
}