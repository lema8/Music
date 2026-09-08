import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration — packages the SoundVault web app as a native
 * Android application (see /android, generated via `npx cap add android`).
 *
 * The app is 100% client-side: IndexedDB / localStorage live in the
 * Android WebView's private data directory, so the native app is fully
 * offline with no backend required.
 */
const config: CapacitorConfig = {
  appId: 'com.soundvault.app',
  appName: 'SoundVault',
  webDir: 'dist',
  backgroundColor: '#11131b',

  android: {
    backgroundColor: '#11131b',
    // Keep the URL simple & offline: no remote content is ever loaded.
    allowMixedContent: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      launchAutoHide: true,
      backgroundColor: '#11131b',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#11131b',
    },
  },

  server: {
    // Never reach out to the network — everything ships inside the APK.
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
