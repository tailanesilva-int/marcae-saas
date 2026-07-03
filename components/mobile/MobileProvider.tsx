'use client';

import { useEffect } from 'react';
import { interceptarLinksMobile } from './native/MobileLinks';
import { iniciarNavegacaoMobile } from './native/MobileNavigation';
import { detectarMobilePlatform } from './native/MobilePlatform';
import { configurarMobileStatusBar } from './native/MobileStatusBar';

export default function MobileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const platform = detectarMobilePlatform();

    document.documentElement.dataset.marcaeMobile = platform.isMobile
      ? 'true'
      : 'false';

    document.documentElement.dataset.marcaeStandalone = platform.isStandalone
      ? 'true'
      : 'false';

    document.documentElement.dataset.marcaeCapacitor = platform.isCapacitor
      ? 'true'
      : 'false';

    document.documentElement.dataset.marcaeIos = platform.isIos
      ? 'true'
      : 'false';

    document.documentElement.dataset.marcaeAndroid = platform.isAndroid
      ? 'true'
      : 'false';

    configurarMobileStatusBar();

    const removerInterceptadorLinks = interceptarLinksMobile();
    const removerNavegacaoMobile = iniciarNavegacaoMobile();

    return () => {
      removerInterceptadorLinks();
      removerNavegacaoMobile();
    };
  }, []);

  return <>{children}</>;
}