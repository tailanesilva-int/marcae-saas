'use client';

import { useEffect } from 'react';

function corValida(cor: any) {
  if (!cor || typeof cor !== 'string') return false;
  return /^#([0-9A-F]{3}){1,2}$/i.test(cor.trim());
}

export default function MarcaeThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    try {
      const empresaStorage = localStorage.getItem('empresaLogada');

      if (!empresaStorage) return;

      const empresa = JSON.parse(empresaStorage);

      const corPrincipal =
        empresa?.corPrincipal ||
        empresa?.primaryColor ||
        empresa?.temaCorPrincipal;

      if (corValida(corPrincipal)) {
        document.documentElement.style.setProperty(
          '--marcae-primary',
          corPrincipal
        );
      }
    } catch (error) {
      console.warn('Não foi possível carregar tema da empresa:', error);
    }
  }, []);

  return <>{children}</>;
}