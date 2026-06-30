import './globals.css';

import { APP_CONFIG } from '@/lib/config';
import MarcaeThemeProvider from '@/components/theme/MarcaeThemeProvider';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';

export const metadata = {
  title: APP_CONFIG.nome,
  description: 'Sistema de agendamento online para empresas de serviços.',
  applicationName: APP_CONFIG.nome,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: APP_CONFIG.nome,
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport = {
  themeColor: '#6D28D9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <ServiceWorkerRegister />
        <MarcaeThemeProvider>{children}</MarcaeThemeProvider>
      </body>
    </html>
  );
}