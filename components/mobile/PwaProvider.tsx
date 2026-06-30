'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type PwaContextValue = {
  podeInstalar: boolean;
  instalado: boolean;
  instalar: () => Promise<void>;
};

const PwaContext = createContext<PwaContextValue>({
  podeInstalar: false,
  instalado: false,
  instalar: async () => {},
});

export function usePwa() {
  return useContext(PwaContext);
}

export default function PwaProvider({ children }: { children: React.ReactNode }) {
  const [eventoInstalacao, setEventoInstalacao] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setInstalado(standalone);

    function capturarEvento(event: Event) {
      event.preventDefault();
      setEventoInstalacao(event as BeforeInstallPromptEvent);
    }

    function marcarInstalado() {
      setInstalado(true);
      setEventoInstalacao(null);
    }

    window.addEventListener('beforeinstallprompt', capturarEvento);
    window.addEventListener('appinstalled', marcarInstalado);

    return () => {
      window.removeEventListener('beforeinstallprompt', capturarEvento);
      window.removeEventListener('appinstalled', marcarInstalado);
    };
  }, []);

  async function instalar() {
    if (!eventoInstalacao) return;

    await eventoInstalacao.prompt();
    const escolha = await eventoInstalacao.userChoice;

    if (escolha.outcome === 'accepted') {
      setInstalado(true);
    }

    setEventoInstalacao(null);
  }

  const valor = useMemo(
    () => ({
      podeInstalar: Boolean(eventoInstalacao) && !instalado,
      instalado,
      instalar,
    }),
    [eventoInstalacao, instalado]
  );

  return <PwaContext.Provider value={valor}>{children}</PwaContext.Provider>;
}