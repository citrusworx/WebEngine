const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const nativeRoot = path.resolve(projectRoot, "..");
const workspaceRoot = path.resolve(projectRoot, "../../../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [nativeRoot, workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules")
];

module.exports = config;
