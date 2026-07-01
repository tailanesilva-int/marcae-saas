import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.marcaeapp.app',

  appName: 'Marcaê',

  webDir: 'capacitor-web',

  server: {
    url: 'https://www.marcaeapp.com.br',
    cleartext: false,
    androidScheme: 'https',
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;