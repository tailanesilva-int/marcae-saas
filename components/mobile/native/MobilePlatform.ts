export type MarcaeMobilePlatform = {
  isAndroid: boolean;
  isIos: boolean;
  isIphone: boolean;
  isIpad: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  isStandalone: boolean;
  isPwa: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isEdge: boolean;
  isFirefox: boolean;
  isCapacitor: boolean;
};

export function detectarMobilePlatform(): MarcaeMobilePlatform {
  if (typeof window === 'undefined') {
    return {
      isAndroid: false,
      isIos: false,
      isIphone: false,
      isIpad: false,
      isMobile: false,
      isDesktop: true,
      isStandalone: false,
      isPwa: false,
      isSafari: false,
      isChrome: false,
      isEdge: false,
      isFirefox: false,
      isCapacitor: false,
    };
  }

  const userAgent = window.navigator.userAgent || '';
  const lowerUserAgent = userAgent.toLowerCase();

  const isAndroid = /android/.test(lowerUserAgent);
  const isIphone = /iphone/.test(lowerUserAgent);
  const isIpad =
    /ipad/.test(lowerUserAgent) ||
    (window.navigator.platform === 'MacIntel' &&
      window.navigator.maxTouchPoints > 1);

  const isIos = isIphone || isIpad;
  const isMobile = isAndroid || isIos;
  const isDesktop = !isMobile;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  const isPwa = isStandalone;

  const isEdge = /edg\//.test(lowerUserAgent) || /edgios/.test(lowerUserAgent);
  const isFirefox = /firefox/.test(lowerUserAgent) || /fxios/.test(lowerUserAgent);
  const isChrome =
    /chrome/.test(lowerUserAgent) ||
    /crios/.test(lowerUserAgent) ||
    /chromium/.test(lowerUserAgent);

  const isSafari =
    /safari/.test(lowerUserAgent) &&
    !isChrome &&
    !isEdge &&
    !isFirefox;

  const isCapacitor =
    Boolean((window as any).Capacitor) ||
    lowerUserAgent.includes('capacitor') ||
    lowerUserAgent.includes('wv');

  return {
    isAndroid,
    isIos,
    isIphone,
    isIpad,
    isMobile,
    isDesktop,
    isStandalone,
    isPwa,
    isSafari,
    isChrome,
    isEdge,
    isFirefox,
    isCapacitor,
  };
}