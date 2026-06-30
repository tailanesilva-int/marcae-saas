import type { MetadataRoute } from 'next';

import { APP_CONFIG } from '@/lib/config';

export default function manifest(): MetadataRoute.Manifest {
  const nomeApp = APP_CONFIG.nome || 'Marcaê';

  return {
    name: nomeApp,
    short_name: 'Marcaê',
    description: 'Sistema de agendamento online para empresas de serviços.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#080B16',
    theme_color: '#6D28D9',
    categories: ['business', 'productivity'],
    lang: 'pt-BR',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}