import './globals.css';

import { APP_CONFIG } from '@/lib/config';
import MarcaeThemeProvider from '@/components/theme/MarcaeThemeProvider';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';

import {
  InstallPrompt,
  MobileProvider,
  PwaProvider,
  SplashScreen,
} from '@/components/mobile';

const APP_DESCRIPTION = 'Sistema de agendamento online para empresas de serviços.';
const APP_URL = 'https://www.marcaeapp.com.br';
const APP_OG_IMAGE = '/icons/og-image.png';

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: APP_CONFIG.nome,
  description: APP_DESCRIPTION,
  applicationName: APP_CONFIG.nome,
  manifest: '/manifest.webmanifest',

  appleWebApp: {
    capable: true,
    title: APP_CONFIG.nome,
    statusBarStyle: 'black-translucent',
  },

  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false,
  },

  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],

    apple: [
      {
        url: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },

  openGraph: {
    title: APP_CONFIG.nome,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_CONFIG.nome,
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: APP_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${APP_CONFIG.nome} - Sistema de agendamento online`,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: APP_CONFIG.nome,
    description: APP_DESCRIPTION,
    images: [APP_OG_IMAGE],
  },

  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': APP_CONFIG.nome,
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#09090B',
    'msapplication-tap-highlight': 'no',
    'color-scheme': 'dark',
  },
};

export const viewport = {
  themeColor: '#09090B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  userScalable: false,
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

        <PwaProvider>
          <MobileProvider>
            <SplashScreen />

            <InstallPrompt />

            <MarcaeThemeProvider>{children}</MarcaeThemeProvider>
          </MobileProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
