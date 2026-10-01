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

// RRU-102: the reasons live here so every selector of a group carries the same
// explanation, and so "why is this banned" is answered in one place instead of
// being re-derived at each call site.
const rawHtml =
  "Raw HTML injection is banned in this workspace. React escapes everything it renders, and this API is the documented way to opt OUT of that guarantee: any string it receives becomes markup, so a value that reaches the component from a user turns into script. Render it as text or as React nodes. If a component genuinely needs an HTML string, that is a PUBLIC API decision, not an implementation detail: write an ADR and add a narrowly-typed, opt-in escape hatch (ADR-004 composition) instead of disabling this rule.";

const stringCodeExecution =
  "Executing code from a string is banned in this workspace. The code is opaque to review, to the type checker and to every static gate we run, so nothing downstream can tell safe code from unsafe code. Compute the value and pass a function; if dynamic code is truly unavoidable it belongs to the CONSUMER, not to a component library.";

const domWrite =
  "Writing to the DOM as a string bypasses the virtual DOM and React's escaping in a single step. Build nodes with the DOM APIs (createElement/textContent/append) or render them; React owns the DOM inside its own tree.";

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

  // Dangerous-API ban (RRU-102).
  //
  // A design system renders content it did not author, so the cheapest XSS
  // defense is that the library never reaches for a raw-HTML or string-eval API
  // in the first place. Every rule below is a ban on CONVENIENCE: each of these
  // APIs exists to save five lines, and each of them silently opts out of the
  // one guarantee the rest of the system relies on — React escapes what it
  // renders. The library's own components already comply (no
  // `dangerouslySetInnerHTML`, no `html` prop, no generic `as`/`asChild`), so
  // this rule does not fix a bug: it keeps a future convenience from becoming
  // an XSS in a package other people install.
  //
  // It is scoped to EVERY JS/TS file in the workspace — stories, playground and
  // tools included — because those are consumer code too, and because a ban
  // with one documented exception is a gate, whereas a ban with a quiet
  // exception is a suggestion. `packages/ui/src/utils/focusable.test.ts` has the
  // only inline disable in the repo, and it says why in the same line: the
  // fixture needs markup and tests are never published
  // (`tsconfig.build.json` excludes them).
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,mts,cts}"],
    rules: {
      // `eval` as a VALUE (`const run = eval`), which the syntax selectors
      // below cannot see because there is no call to match.
      "no-restricted-globals": ["error", { name: "eval", message: stringCodeExecution }],
      "no-restricted-syntax": [
        "error",
        { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: rawHtml },
        // The spread form (`{...{ dangerouslySetInnerHTML }}}`) and the
        // computed read (`props["dangerouslySetInnerHTML"]`) — a text scan in
        // the security-contracts spec catches those, this catches the typo-free
        // common case with an exact AST match.
        { selector: "MemberExpression[property.name='dangerouslySetInnerHTML']", message: rawHtml },
        { selector: "JSXAttribute[name.name='srcDoc']", message: rawHtml },
        { selector: "CallExpression[callee.name='eval']", message: stringCodeExecution },
        { selector: "CallExpression[callee.name='Function']", message: stringCodeExecution },
        { selector: "NewExpression[callee.name='Function']", message: stringCodeExecution },
        // `setTimeout("code()", 0)` is an eval with a nicer name.
        {
          selector:
            "CallExpression[callee.name=/^(setTimeout|setInterval)$/][arguments.0.type='Literal']",
          message: stringCodeExecution,
        },
        {
          selector: "AssignmentExpression[left.property.name=/^(inner|outer)HTML$/]",
          message: domWrite,
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: domWrite,
        },
        {
          selector: "CallExpression[callee.object.name='document'][callee.property.name='write']",
          message: domWrite,
        },
        // React 19.3 already replaces a `javascript:` URL with a throwing stub,
        // so this is defence in depth rather than the only line: a literal
        // scheme in OUR source is a bug even where the browser would absorb it.
        {
          selector:
            "JSXAttribute[name.name=/^(href|src|action|formAction)$/] Literal[value=/^\\s*javascript:/i]",
          message:
            "A `javascript:` URL literal does not belong in the library source. React neutralizes it at runtime, so this is defence in depth: build the URL from a validated value instead of writing the scheme by hand.",
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
