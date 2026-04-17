import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.caffedifiore.loyalty',
  appName: 'CaffeDiFiore',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://caffedifiore-loyalty.web.app',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: '#0A0908',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    backgroundColor: '#0A0908',
  },
};

export default config;
