const { getDefaultConfig } = require("@expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// Extend the default asset extensions to include additional file types
defaultConfig.resolver.assetExts.push(
  "bin",
  "txt",
  "jpg",
  "png",
  "json",
  "gif",
  "webp",
  "svg",
  "mp3", // For audio files
  "aac", // For audio files
  "wav" // For audio files
);

// Force Metro to bind to all interfaces and use correct host
defaultConfig.server = {
  ...defaultConfig.server,
  host: "0.0.0.0",
};

// Define the full configuration
const config = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
  },
  server: {
    ...defaultConfig.server,
    enhanceMiddleware: (middleware) => {
      return middleware;
    },
  },
};

module.exports = config;
