const { readFileSync } = require("node:fs");
const { join } = require("node:path");

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

// RRU-103: the public API frontier of the consumer apps, DERIVED from the
// packages' own `exports` maps instead of being written out by hand.
//
// This list used to be five literals in this file, and it was the same fact
// stated twice: once as the `exports` map that actually decides what a consumer
// can resolve, and once as a hand-maintained allowlist that decides what an app
// is allowed to type. Those two drift silently and in opposite directions — a
// new public subpath would be unreachable from an app until someone remembered
// to edit this file, and a deleted subpath would keep being allowed long after
// it stopped resolving. `exports` is the source of truth (guía §24), so it is
// the only thing read here.
//
// Read through `readFileSync` rather than `require`, and relative rather than
// by package name, because the `exports` maps do not expose `./package.json`:
// resolving `@raulrod/ui/package.json` is itself an import of a subpath the
// frontier denies.
const PUBLISHED_PACKAGES = ["packages/ui", "packages/tokens", "packages/icons"];

function publicEntrypoints() {
  const entrypoints = [];

  for (const packageDir of PUBLISHED_PACKAGES) {
    const manifestPath = join(__dirname, packageDir, "package.json");
    let manifest;

    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch (cause) {
      throw new Error(
        `eslint.config.js cannot derive the public API frontier: ${manifestPath} is unreadable. The app import rule below is built from it, so it cannot be allowed to degrade into "nothing is public".`,
        { cause },
      );
    }

    const subpaths = manifest.exports ? Object.keys(manifest.exports) : [];

    // Fail loud, not open: a package whose `exports` went missing must break the
    // lint run with an explanation, never turn every legitimate app import into a
    // violation and never quietly allow the whole namespace.
    if (subpaths.length === 0) {
      throw new Error(
        `eslint.config.js cannot derive the public API frontier: ${manifest.name} has no \`exports\` map (${manifestPath}). Either declare it or drop the package from PUBLISHED_PACKAGES.`,
      );
    }

    for (const subpath of subpaths) {
      // "." is the root entrypoint; "./styles.css" is a subpath. Nothing else is
      // reachable, and neither form can be resolved by name from inside a
      // workspace link, so the plain string is the only identifier apps use.
      entrypoints.push(subpath === "." ? manifest.name : `${manifest.name}/${subpath.slice(2)}`);
    }
  }

  return entrypoints.sort();
}

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

  // This file is a Node script, but the `page.evaluate` callbacks inside it are
  // serialised and executed in Chromium. They are browser code that lives in a
  // Node file, so the browser globals are declared here rather than silenced with
  // an inline disable on every line.
  {
    files: ["tools/external-install-check.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
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

  // Public API boundary for the consumer apps (RRU-069, enforced by RRU-103).
  //
  // The apps are how the packages are validated: they must reach the system the
  // way a real consumer does — through the package entrypoints — because an E2E
  // suite that imports internals proves something no consumer can rely on. This
  // is the cheapest possible enforcement (declarative, runs in `pnpm lint` and
  // therefore in CI) and it fails on the import, not on a review.
  //
  // The allowlist is derived from the packages' `exports` maps (see
  // `publicEntrypoints`), so it cannot drift from the frontier it protects:
  // anything under `@raulrod/*` that `exports` does not expose is banned, and
  // anything it does expose is allowed without editing this file. A new public
  // subpath (`@raulrod/ui/theme.css`, say) becomes legal the moment it is
  // declared in `package.json`, and stops being legal the moment it is
  // undeclared.
  //
  // Two escapes that used to exist are closed here rather than left to review:
  //
  // - the relative patterns were pinned to two depths (`../../packages/*`,
  //   `../../../packages/*`), so a file nested deeper than the pattern could
  //   reach into a sibling package. `**/packages/**` is depth-agnostic.
  // - the rule only matched TypeScript, so a `.js`/`.mjs` helper in an app (a
  //   Vite plugin, a config module) imported internals with no violation at all.
  {
    files: ["apps/**/*.{js,mjs,cjs,ts,tsx,mts,cts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@raulrod/**", ...publicEntrypoints().map((entry) => `!${entry}`)],
              message:
                "Apps must import the packages through their public entrypoints. The allowed set is derived from each package's `exports` map: a deep path is either an internal, or a subpath that has not been declared public. Fix the import, or — if the app genuinely needs it — declare the subpath in the package's `exports` (guía §24, RRU-091).",
            },
            {
              group: ["**/packages/**"],
              message:
                "Apps must not reach into another package's files. Build the packages and consume their public entrypoints; an app that needs something the API does not expose is evidence of a missing public API, not of a missing escape hatch (guía §25).",
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
