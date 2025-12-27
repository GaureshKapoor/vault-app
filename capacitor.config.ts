import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gaureshkapoor.vault',
  appName: 'Vault',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    // Match light mode background - #FAFAFC (hsl 230 60% 99%)
    backgroundColor: '#FAFAFC'
    // scrollEnabled removed - let pages control their own scrolling
  },
  server: {
    // Allow loading from Supabase
    allowNavigation: ['*.supabase.co']
  },
  plugins: {
    App: {
      // Deep link handling for OAuth callbacks
    },
    StatusBar: {
      // Don't overlay - let status bar have its own space with matching background
      overlaysWebView: false,
      style: 'DARK'
    }
  }
};

export default config;
