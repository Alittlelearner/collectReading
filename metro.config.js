const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');
config.resolver.blockList = [
  /.*[\/\\]\.git[\/\\].*/,
  /.*[\/\\]\.expo[\/\\].*/,
  /.*[\/\\]\.npm-cache[\/\\].*/,
  /.*[\/\\]\.codex-verify[\/\\].*/,
  /.*[\/\\]\.agents[\/\\].*/,
  /.*[\/\\]android[\/\\].*/,
];

module.exports = config;
