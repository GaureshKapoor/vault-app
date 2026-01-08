const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the shared folder for changes (symlinked in apps/ios/shared -> ../shared)
config.watchFolders = [
  path.resolve(monorepoRoot, 'shared'),
];

// Ensure shared folder can resolve modules from ios project's node_modules AND root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Map modules that shared folder needs to ios project's node_modules
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@supabase/supabase-js': path.resolve(projectRoot, 'node_modules/@supabase/supabase-js'),
  '@react-native-async-storage/async-storage': path.resolve(projectRoot, 'node_modules/@react-native-async-storage/async-storage'),
  'expo-constants': path.resolve(projectRoot, 'node_modules/expo-constants'),
};

// Prefer .native.js files over .js for React Native
config.resolver.sourceExts = ['native.js', ...config.resolver.sourceExts];

module.exports = config;
