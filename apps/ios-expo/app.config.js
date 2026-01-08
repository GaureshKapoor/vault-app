require('dotenv').config({ path: '../../.env' });

module.exports = {
  expo: {
    name: 'Vault iOS',
    slug: 'vault-ios',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'vault',
    splash: {
      image: './assets/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#09090b',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'build.vault.app',
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/icon.png',
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
