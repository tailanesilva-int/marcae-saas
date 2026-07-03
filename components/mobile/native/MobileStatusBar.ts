import { detectarMobileCapabilities } from './MobileCapabilities';
import { detectarMobilePlatform } from './MobilePlatform';

const MARCAE_STATUS_BAR_COLOR = '#09090B';

function atualizarMetaThemeColor(color: string) {
  if (typeof document === 'undefined') return;

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }

  meta.content = color;
}

function aplicarCssStatusBar(color: string) {
  if (typeof document === 'undefined') return;

  document.documentElement.style.setProperty('--marcae-status-bar-color', color);
  document.documentElement.style.setProperty('--marcae-app-background', color);
}

async function aplicarStatusBarCapacitor(color: string) {
  if (typeof window === 'undefined') return;

  const capabilities = detectarMobileCapabilities();

  if (!capabilities.possuiStatusBarNativa) return;

  try {
    const statusBar = (window as any).Capacitor?.Plugins?.StatusBar;

    if (!statusBar) return;

    if (typeof statusBar.setBackgroundColor === 'function') {
      await statusBar.setBackgroundColor({ color });
    }

    if (typeof statusBar.setStyle === 'function') {
      await statusBar.setStyle({ style: 'DARK' });
    }

    if (typeof statusBar.setOverlaysWebView === 'function') {
      await statusBar.setOverlaysWebView({ overlay: false });
    }
  } catch (error) {
    console.warn('Não foi possível aplicar Status Bar nativa:', error);
  }
}

export async function configurarMobileStatusBar() {
  if (typeof window === 'undefined') return;

  const platform = detectarMobilePlatform();

  atualizarMetaThemeColor(MARCAE_STATUS_BAR_COLOR);
  aplicarCssStatusBar(MARCAE_STATUS_BAR_COLOR);

  if (platform.isCapacitor) {
    await aplicarStatusBarCapacitor(MARCAE_STATUS_BAR_COLOR);
  }
}