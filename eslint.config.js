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
  { ignores: ["**/node_modules/**", "**/dist/**", "**/.turbo/**", "coverage/**"] },

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
            ".js": [".ts", ".js"],
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

  eslintConfigPrettier,
];
