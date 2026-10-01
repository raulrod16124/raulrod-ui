const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const reactHooks = require("eslint-plugin-react-hooks");
const jsxA11y = require("eslint-plugin-jsx-a11y");
const importX = require("eslint-plugin-import-x");
const { createNodeResolver } = importX;
const eslintConfigPrettier = require("eslint-config-prettier");
const globals = require("globals");

const importOrder = {
  groups: ["builtin", "type", "external", "internal", "parent", "sibling", "index", "object"],
  "newlines-between": "always",
  alphabetize: { order: "asc", caseInsensitive: true },
  pathGroups: [{ pattern: "@raulrod/**", group: "internal", position: "before" }],
  pathGroupsExcludedImportTypes: ["type", "builtin"],
};

module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/dist-tree-shake/**",
      "**/dist-bundle-baseline-*/**",
      "**/.bundle-baseline/**",
      "**/.turbo/**",
      "coverage/**",
      "**/storybook-static/**",
    ],
  },

  {
    files: ["**/*.{js,mjs,cjs}"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node,
    },
  },

  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.es2022,
        ...globals.browser,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      "import-x": importX,
    },
    settings: {
      "import-x/internal-regex": "^@raulrod/",
      "import-x/resolver-next": [
        createNodeResolver({
          extensions: [".mjs", ".cjs", ".js", ".json", ".node", ".ts", ".mts", ".cts", ".tsx"],
          extensionAlias: {
            ".js": [".ts", ".tsx", ".js"],
            // Root-level ESM config shared by the test harness (vitest.preset.mts,
            // RRU-068) is imported from package configs with the emitted extension.
            ".mjs": [".mts", ".mjs"],
          },
        }),
      ],
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      ...reactHooks.configs.flat.recommended.rules,
      ...importX.flatConfigs.recommended.rules,
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "import-x/order": ["error", importOrder],
    },
  },

  // Public API boundary for the consumer apps (RRU-069, precursor of RRU-103).
  //
  // The apps are how the packages are validated: they must reach the system the
  // way a real consumer does — through the package entrypoints — because an E2E
  // suite that imports internals proves something no consumer can rely on. This
  // is the cheapest possible enforcement (declarative, runs in `pnpm lint` and
  // therefore in CI) and it fails on the import, not on a review.
  //
  // RRU-091 formalized the public subpath exports for the stylesheets
  // (`@raulrod/ui/styles.css` and `@raulrod/tokens/styles.css`). Any other deep
  // path under `@raulrod/*` is an internal and must not be imported from apps.
  {
    files: ["apps/**/*.{ts,tsx,mts,cts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@raulrod/**",
                "!@raulrod/ui",
                "!@raulrod/ui/styles.css",
                "!@raulrod/tokens",
                "!@raulrod/tokens/styles.css",
                "!@raulrod/icons",
              ],
              message:
                "Apps must import the packages through their public entrypoints (@raulrod/ui, @raulrod/tokens, @raulrod/icons). Deep paths are the `exports` frontier that RRU-091 formalizes and RRU-103 will enforce.",
            },
            {
              group: ["../../packages/*", "../../../packages/*"],
              message:
                "Apps must not reach into another package's files. Build the packages and consume their public entrypoints.",
            },
          ],
        },
      ],
    },
  },

  // Ambient declaration files cannot use top-level `import` (that would turn them
  // into modules, and `declare module` would become an augmentation of a package
  // that has no types), so they must reference external types with `import()`
  // type annotations — exactly what the rule below forbids everywhere else.
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },

  eslintConfigPrettier,
];
