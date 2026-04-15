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
//
// Also handles internal .js imports within the shared package — TypeScript
// uses .js extensions for Node compatibility, but Metro can't resolve them.
// We strip the .js extension and let Metro find the .ts file instead.
const sharedSrc = path.resolve(monorepoRoot, "packages/shared/src");
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect the package itself
  if (moduleName === "@pichichi/shared") {
    return { filePath: path.join(sharedSrc, "index.ts"), type: "sourceFile" };
  }
  // Strip .js extension from imports inside the shared package so Metro
  // resolves them as .ts files (e.g. './types/index.js' → './types/index.ts')
  if (
    context.originModulePath.includes("packages/shared/src") &&
    moduleName.endsWith(".js")
  ) {
    const stripped = moduleName.slice(0, -3); // remove .js
    return context.resolveRequest(context, stripped, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
