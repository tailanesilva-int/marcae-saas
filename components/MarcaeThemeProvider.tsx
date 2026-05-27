'use client';

import { useEffect } from 'react';
import { aplicarTemaNoDocumento, TEMA_PADRAO_MARCAE } from '@/app/lib/theme';

export default function MarcaeThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    try {
      const empresaStorage = localStorage.getItem('empresaLogada');

      if (!empresaStorage) {
        aplicarTemaNoDocumento({
          corPrimaria: TEMA_PADRAO_MARCAE.primary,
          corSecundaria: TEMA_PADRAO_MARCAE.secondary,
          corSidebar: TEMA_PADRAO_MARCAE.sidebar,
        });

        return;
      }

      const empresa = JSON.parse(empresaStorage);

      aplicarTemaNoDocumento(empresa);
    } catch (error) {
      console.warn('Não foi possível carregar tema da empresa:', error);

      aplicarTemaNoDocumento({
        corPrimaria: TEMA_PADRAO_MARCAE.primary,
        corSecundaria: TEMA_PADRAO_MARCAE.secondary,
        corSidebar: TEMA_PADRAO_MARCAE.sidebar,
      });
    }
  }, []);

  return <>{children}</>;
}