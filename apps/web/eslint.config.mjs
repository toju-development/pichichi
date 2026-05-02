import { defineConfig, globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

// HACK(eslint-config-next@16.2.1): el preset oficial de Vercel referencia
// `next/dist/compiled/babel/eslint-parser`, que ya NO existe en Next 16. Sólo
// importar `eslint-config-next/core-web-vitals` revienta con "Cannot find
// module" antes de correr cualquier regla. Bug oficial del paquete.
//
// Workaround: armamos la flat config a mano con los mismos plugins que el
// preset arrastra, pero usando `typescript-eslint/parser` (la app es 100%
// TS/TSX). Cuando Vercel arregle el paquete, podemos volver a `...nextVitals`.
// TODO(phase-5A): eslint-config-next@16.2.1 roto, revisar al actualizar.
const eslintConfig = defineConfig([
  ...tseslint.configs.recommended,
  {
    name: "pichichi/next-react",
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unknown-property": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
    },
  },
  {
    // Playwright E2E specs use `use(value)` from the fixture API, which
    // ESLint's `react-hooks/rules-of-hooks` mistakenly flags as a React hook
    // call. Disable that rule (and `react/*` rules that don't apply to
    // non-component test files) only inside `tests/e2e/**`.
    name: "pichichi/playwright-e2e",
    files: ["tests/e2e/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // ── Landing READ ONLY ──────────────────────────────────────────────────
    // El sitio público (landing/marketing/legal) es READ ONLY por convención
    // del proyecto: vive en `src/app/{page,layout,faq,terms,privacy-policy}`
    // y `src/components/*`. La PWA real arranca bajo `src/app/app/*` y es lo
    // único que debe pasar por el lint en el flujo de devs de producto. Si
    // alguna vez se reabsorbe la landing al monorepo "vivo", quitar estas
    // entradas y arreglar los warnings que aparezcan.
    "src/app/page.tsx",
    "src/app/layout.tsx",
    "src/app/faq/**",
    "src/app/terms/**",
    "src/app/privacy-policy/**",
    "src/components/**",
  ]),
]);

export default eslintConfig;
