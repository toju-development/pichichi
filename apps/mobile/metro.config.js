const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the shared package in the monorepo
config.watchFolders = [monorepoRoot];

// Resolve modules from both the project and the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Redirect @pichichi/shared to its TypeScript source so Metro doesn't
// attempt to resolve the compiled dist/ output (which is gitignored and
// doesn't exist in EAS Build cloud environments).
const sharedSrc = path.resolve(monorepoRoot, "packages/shared/src/index.ts");
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@pichichi/shared") {
    return { filePath: sharedSrc, type: "sourceFile" };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
