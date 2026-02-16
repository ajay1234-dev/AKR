const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration for jsPDF compatibility
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'cjs'],
  resolverMainFields: ['react-native', 'browser', 'main'],
};

module.exports = config;
