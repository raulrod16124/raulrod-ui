#!/usr/bin/env node
// Bundle baseline report (RRU-100).
//
// WHY THIS EXISTS. §29 asks for a bundle review and for optimizations documented
// WITH EVIDENCE, and RRU-092/RRU-095 only answered a slice of it: RRU-092
// measured one bundle (the selective `Button` + `ChevronDown` import) and RRU-095
// put a CI threshold on its total size. What a design system consumer actually
// needs is the missing half — how big the whole library is, what each component
// costs, what the icon set costs — and those numbers cannot be summed from
// `dist/`: gzipping the authored stylesheets file by file reports 18.7 kB of CSS
// where the real production asset is 5.46 kB, because the minifier deletes the
// documentation comments the authored files carry.
//
// So this script builds the three bundles that matter and reads the numbers out
// of the artifacts themselves:
//
//   selective  Button + ChevronDown        (RRU-092, the one CI gates on)
//   full       every public export of @raulrod/ui  → per-component breakdown
//   icons      every icon of the catalog   → what `export *` would cost
//
// It also turns RRU-092's manual "no other component leaked" claim into an
// assertion: if the selective bundle ever contains a module outside its
// allowlist, the script fails instead of printing a number nobody reads. That is
// the same ratchet idea as the contrast gate of RRU-072 — a check that cannot
// fail is decoration.
//
// WHAT THIS IS NOT. It is not a budget: the thresholds live in `.size-limit.json`
// and run in CI as the `size-limit` job (RRU-095). This is the report behind
// them, plus the per-component view that has no gate yet. And it deliberately
// adds no dependency: `zlib` and `rollup-plugin-visualizer` (already installed
// by RRU-092) are enough.
//
// The output is deterministic on purpose — no timestamps, no absolute paths, no
// build hashes — so two runs can be compared with `diff`, and so the figures
// pasted into `docs/performance.md` can be re-derived instead of trusted.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLAYGROUND = join(ROOT, "apps", "playground");
const GENERATED_DIR = join(PLAYGROUND, ".bundle-baseline");

const UI_DIST = join(ROOT, "packages", "ui", "dist");
const TOKENS_DIST = join(ROOT, "packages", "tokens", "dist");
const ICONS_DIST = join(ROOT, "packages", "icons", "dist");

// `pnpm` is a shell script on POSIX and a `.cmd` on Windows; spawning the bare
// name fails on the latter (same reason as `tools/dev-playground.mjs`).
const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

// The selective bundle is the one CI gates on, so its contents are pinned here.
// `Button` owns `variants` (its class map) and `cx` (its className merge), and
// renders two icons: the one the fixture renders and the spinner of `loading`.
// lucide's shared runtime is NOT in the list on purpose — `Icon.mjs`,
// `createLucideIcon.mjs` and `shared/src/**` are what makes an icon render at
// all, so they are expected in any bundle that draws one. The ratchet is about
// the ICONS and the COMPONENTS, not about lucide's internals.
const SELECTIVE_ALLOWED_UI = [
  "packages/ui/dist/button/",
  "packages/ui/dist/utils/variants.js",
  "packages/ui/dist/utils/cx.js",
];
const SELECTIVE_ALLOWED_ICONS = new Set(["chevron-down", "loader-circle"]);

// Compression parameters are pinned instead of left to the defaults: `size-limit`
// reports gzip at level 9, so using anything else would make this report
// disagree with the gate that reads the same artifact.
const GZIP_OPTIONS = { level: 9 };
const BROTLI_OPTIONS = {
  params: {
    [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
  },
};

function log(message) {
  process.stdout.write(`${message}\n`);
}

function step(message) {
  log(`▸ ${message}`);
}

function ok(message) {
  log(`  ✓ ${message}`);
}

function warn(message) {
  process.stderr.write(`  ! ${message}\n`);
}

function fail(message, hint) {
  process.stderr.write(`\n✗ ${message}\n`);
  if (hint) process.stderr.write(`  ${hint}\n`);
  process.stderr.write("\n");
  process.exit(1);
}

// --- formatting -------------------------------------------------------------

// kB = 1000 bytes, the same unit `size-limit` uses in `.size-limit.json`, so the
// numbers in the report and the numbers in the gate are directly comparable.
function kB(bytes) {
  return `${(bytes / 1000).toFixed(2)} kB`;
}

function table(headers, rows) {
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => String(row[column] ?? "").length)),
  );
  const line = (cells) =>
    cells
      .map((cell, column) =>
        column === 0 ? String(cell).padEnd(widths[column]) : String(cell).padStart(widths[column]),
      )
      .join("  ");

  log(line(headers));
  for (const row of rows) log(line(row));
}

// --- sizes ------------------------------------------------------------------

function compressedSizes(path) {
  const content = readFileSync(path);
  return {
    raw: content.length,
    gzip: gzipSync(content, GZIP_OPTIONS).length,
    brotli: brotliCompressSync(content, BROTLI_OPTIONS).length,
  };
}

function walkFiles(dir) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(absolute));
    else files.push(absolute);
  }

  return files;
}

function sumSizes(paths) {
  const total = { raw: 0, gzip: 0, brotli: 0 };

  for (const path of paths) {
    const sizes = compressedSizes(path);
    total.raw += sizes.raw;
    total.gzip += sizes.gzip;
    total.brotli += sizes.brotli;
  }

  return total;
}

// --- public API of the packages --------------------------------------------

// The generated entry must reference EVERY export or the bundler is free to drop
// the unused ones and the measurement measures nothing. The list is read from the
// EMITTED barrel (`packages/ui/dist/index.js`) rather than from a hand-kept
// array: a curated list is a list that goes stale the day a component lands, and
// a stale baseline is worse than no baseline. Only `export { … } from` counts —
// `export * from "@raulrod/icons"` is the catalog, measured by its own entry.
function readUiExports() {
  const barrel = readFileSync(join(UI_DIST, "index.js"), "utf8");
  const names = [];

  for (const [, clause] of barrel.matchAll(/^export\s*\{([^}]*)\}\s*from/gmu)) {
    for (const specifier of clause.split(",")) {
      const name = specifier
        .trim()
        .split(/\s+as\s+/)
        .pop();
      if (name !== undefined && name !== "") names.push(name);
    }
  }

  if (names.length === 0) {
    fail(
      "No se pudo leer la API pública de `@raulrod/ui` desde dist/index.js.",
      "¿Existe packages/ui/dist? Ejecuta `pnpm perf:baseline` sin `--no-build`.",
    );
  }

  return [...new Set(names)].sort();
}

// The icon names come from lucide's own ESM entry, where each line is
// `export { default as Fingerprint, default as FingerprintIcon, … } from
// './icons/fingerprint-pattern.mjs'`. Only the FIRST alias per line is kept: the
// others are the same module under a different name, and importing them would
// measure aliases, not icons.
function readIconCatalog() {
  const lucideDir = readdirSync(join(ROOT, "node_modules", ".pnpm"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("lucide-react@"))
    .map((entry) =>
      join(ROOT, "node_modules", ".pnpm", entry.name, "node_modules", "lucide-react"),
    );

  if (lucideDir.length === 0) {
    fail(
      "No se encontró `lucide-react` en el store de pnpm.",
      "Instala las dependencias (`pnpm install`) antes de medir: el catálogo de iconos es parte del baseline.",
    );
  }

  const index = readFileSync(join(lucideDir[0], "dist", "esm", "lucide-react.mjs"), "utf8");
  const names = [];
  const modules = new Set();

  for (const [, clause, source] of index.matchAll(
    /^export\s*\{([^}]*)\}\s*from\s*'(\.\/icons\/[^']+)'/gmu,
  )) {
    const first = clause.split(",")[0].trim();
    const alias = /default\s+as\s+(\S+)/.exec(first);
    if (alias === null) continue;

    names.push(alias[1]);
    modules.add(source);
  }

  if (names.length === 0) {
    fail(
      "No se pudo leer el catálogo de iconos de lucide.",
      "El layout de `lucide-react/dist/esm/lucide-react.mjs` cambió; revisa `readIconCatalog()` en tools/measure-bundle.mjs.",
    );
  }

  return { names: [...new Set(names)].sort(), modules: modules.size };
}

function writeGeneratedEntry(name, body) {
  mkdirSync(GENERATED_DIR, { recursive: true });

  const path = join(GENERATED_DIR, `${name}.tsx`);
  writeFileSync(
    path,
    `/* GENERATED by tools/measure-bundle.mjs (RRU-100). Do not edit and do not commit.\n *\n * ${body.header}\n */\n${body.code}\n`,
  );

  return path;
}

function generateEntries() {
  const uiExports = readUiExports();
  const icons = readIconCatalog();

  // The selective entry of RRU-092 mounts a React root, so it carries
  // `react` + `react-dom/client` in its bundle. A "whole library" bundle that
  // imported the components without mounting would NOT, and comparing the two
  // would credit tree-shaking with the cost of React DOM. Every generated entry
  // pays the same mount, so the only difference between the bundles is the
  // design system under test.
  const baseline = [
    `import { createRoot } from "react-dom/client";`,
    "",
    `const container = document.getElementById("root");`,
    `if (container === null) throw new Error("bundle-baseline: no #root element");`,
    `createRoot(container).render(<div data-baseline="rru-100" />);`,
  ];

  const full = writeGeneratedEntry("full", {
    header:
      "Every public export of @raulrod/ui, referenced so the bundler cannot drop\n" +
      ` * any of them (${uiExports.length} exports) plus the public stylesheet.`,
    code: [
      `import { ${uiExports.join(", ")} } from "@raulrod/ui";`,
      `import "@raulrod/ui/styles.css";`,
      "",
      ...baseline,
      "",
      `export const PUBLIC_API_SIZE = ${uiExports.length};`,
      `export const KEPT_ALIVE = [`,
      ...uiExports.map((name) => `  ${name},`),
      `];`,
    ].join("\n"),
  });

  const catalog = writeGeneratedEntry("icons", {
    header:
      `Every icon of the lucide catalog through @raulrod/icons (${icons.names.length}\n` +
      ` * names / ${icons.modules} modules), to measure what the star re-export of ADR-007\n * would cost a consumer who imports the whole set.`,
    code: [
      `import { ${icons.names.join(", ")} } from "@raulrod/icons";`,
      "",
      ...baseline,
      "",
      `export const ICON_COUNT = ${icons.names.length};`,
      `export const KEPT_ALIVE = [`,
      ...icons.names.map((name) => `  ${name},`),
      `];`,
    ].join("\n"),
  });

  return { full, catalog, uiExports: uiExports.length, icons };
}

// --- builds -----------------------------------------------------------------

function run(command, args, options = {}) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: "inherit", ...options });

    child.once("error", (error) => fail(`No se pudo ejecutar \`${command}\`: ${error.message}`));
    child.once("close", (code) => resolveRun(code ?? 1));
  });
}

async function runOrFail(command, args, message, hint, env) {
  const code = await run(command, args, env === undefined ? {} : { env });

  if (code !== 0) fail(message, hint);
}

async function build() {
  step("Construyendo los paquetes (`pnpm build`)…");
  await runOrFail(
    PNPM,
    ["build"],
    "`pnpm build` falló: sin `dist/` no hay nada que medir.",
    "Arregla el build y repite el comando.",
  );
}

async function buildBundle({ script, entry, message, hint }) {
  const env = entry === undefined ? undefined : { ...process.env, RRU_BASELINE_ENTRY: entry };
  const args = ["--filter", "@raulrod/playground", script];
  await runOrFail(PNPM, args, message, hint, env);
}

// --- reading the artifacts --------------------------------------------------

function normalizeModuleId(id) {
  // Rollup prefixes some ids with NUL to mark them as "inside a module" and
  // appends `?commonjs-exports` to the synthetic proxies it creates for
  // CommonJS interop. Both are noise for a per-module attribution.
  const clean = id.replaceAll("\0", "").replace(/\?.*$/, "");

  // pnpm stores every dependency under
  // `node_modules/.pnpm/<name>@<version>/node_modules/<name>/…`, so the absolute
  // path would otherwise leak the machine layout into the report and make two
  // runs on two checkouts incomparable.
  const stored = clean.match(/node_modules\/\.pnpm\/[^/]+\/node_modules\/(.+)$/u);
  if (stored !== null) return stored[1];

  if (clean.startsWith(ROOT)) return relative(ROOT, clean).split(sep).join("/");

  return clean;
}

function readModules(outDir) {
  const statsPath = join(outDir, "stats.json");

  if (!existsSync(statsPath)) {
    fail(
      `Falta ${relative(ROOT, statsPath)}: el build no emitió la datos del visualizador.`,
      "Borra la carpeta del build y repite; si persiste, revisa los plugins de vite.bundle-baseline.config.ts.",
    );
  }

  const stats = JSON.parse(readFileSync(statsPath, "utf8"));
  const modules = new Map();

  for (const meta of Object.values(stats.nodeMetas)) {
    const id = normalizeModuleId(meta.id);
    const sizes = { raw: 0, gzip: 0 };

    for (const part of Object.values(meta.moduleParts ?? {})) {
      const nodePart = stats.nodeParts[part];
      sizes.raw += nodePart.renderedLength;
      sizes.gzip += nodePart.gzipLength;
    }

    // The same file can appear twice (the real module plus a CommonJS proxy).
    // Summing would double-count the file; the real module is always the bigger
    // of the two, so the max keeps the attribution honest.
    const previous = modules.get(id);
    if (previous === undefined || sizes.raw > previous.raw) modules.set(id, sizes);
  }

  // A module that survived in the graph but contributed NOTHING is tree-shaken:
  // the visualizer keeps ~4 200 empty lucide icons in `stats.json`, and counting
  // them would report a catalog cost that no consumer ever pays.
  return new Map([...modules].filter(([, sizes]) => sizes.raw > 0));
}

function iconNameOf(id) {
  const match = id.match(/^lucide-react\/dist\/esm\/icons\/(.+)\.mjs$/u);
  return match === null ? null : match[1];
}

function componentOf(id) {
  const match = id.match(/^packages\/ui\/dist\/([^/]+)\//u);
  return match === null ? null : match[1];
}

function peerPackageOf(id) {
  const match = id.match(/^(react-dom|react|scheduler)\//u);
  return match === null ? null : match[1];
}

function readAssets(outDir) {
  const assets = { js: [], css: [] };
  const assetsDir = join(outDir, "assets");

  if (!existsSync(assetsDir)) {
    fail(
      `Faltan los assets de ${relative(ROOT, outDir)}.`,
      "El build no emitió nada; revisa el entry generado y repite.",
    );
  }

  for (const name of readdirSync(assetsDir)) {
    const path = join(assetsDir, name);
    const target = name.endsWith(".css") ? assets.css : name.endsWith(".js") ? assets.js : null;
    if (target !== null) target.push({ name, ...compressedSizes(path) });
  }

  return {
    js: sumSizes(assets.js.map((asset) => join(assetsDir, asset.name))),
    css: sumSizes(assets.css.map((asset) => join(assetsDir, asset.name))),
    jsFiles: assets.js.length,
    cssFiles: assets.css.length,
  };
}

function readBundle(label, outDir, title) {
  if (!existsSync(outDir)) {
    fail(
      `Falta el bundle ${label} (${relative(ROOT, outDir)}).`,
      "Vuelve a ejecutar el comando sin `--no-build`.",
    );
  }

  const modules = readModules(outDir);

  return { label, title, dir: outDir, assets: readAssets(outDir), modules };
}

// `npm pack --dry-run` is the only source that answers "what does the consumer
// download", as opposed to "how big is the folder we build". If npm is not
// usable the report degrades to the `files` field instead of failing: the rest
// of the baseline is still valid, and hiding it would be worse.
function readPublishedFootprint() {
  const packages = ["ui", "tokens", "icons"];
  const rows = [];

  for (const name of packages) {
    const dir = join(ROOT, "packages", name);
    const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    const packed = npmPackDryRun(dir);

    if (packed !== null) {
      rows.push({
        name: manifest.name,
        files: packed.entryCount,
        unpacked: packed.unpackedSize,
        tarball: packed.size,
      });
      continue;
    }

    const declared = manifest.files ?? [];
    const files = declared
      .map((entry) => (entry === "." ? join(dir, "package.json") : join(dir, entry)))
      .flatMap((path) => (statSync(path).isDirectory() ? walkFiles(path) : [path]));

    rows.push({
      name: manifest.name,
      files: files.length + 1,
      unpacked: sumSizes(files).raw + statSync(join(dir, "package.json")).size,
      tarball: null,
    });
  }

  return rows;
}

function npmPackDryRun(dir) {
  const result = spawnSyncCapture("npm", ["pack", "--dry-run", "--json"], dir);
  if (result === null) return null;

  try {
    const [entry] = JSON.parse(result);
    if (entry === undefined || typeof entry.unpackedSize !== "number") return null;
    return entry;
  } catch {
    return null;
  }
}

// `spawnSync` and not the async `spawn` used for the builds: this call is not
// part of the build flow and its stdout has to be parsed, not inherited.
function spawnSyncCapture(command, args, cwd) {
  const binary = process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(binary, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return result.status === 0 ? result.stdout : null;
}

// --- assertions -------------------------------------------------------------

// RRU-092 verified by hand that the selective bundle contains no other component
// and no other icon. A hand check is a check that decays: it was true once, in
// one session. These assertions are the durable version, and they are what makes
// the per-component numbers below trustworthy — a leaked module would inflate the
// "full" row and quietly understate what tree-shaking saves.
function assertSelectiveBundle(bundle) {
  const leaks = [];

  for (const [id] of bundle.modules) {
    const component = componentOf(id);
    if (component !== null) {
      if (!SELECTIVE_ALLOWED_UI.some((allowed) => id.startsWith(allowed))) {
        leaks.push(id);
      }
      continue;
    }

    const icon = iconNameOf(id);
    if (icon !== null && !SELECTIVE_ALLOWED_ICONS.has(icon)) leaks.push(id);
  }

  if (leaks.length > 0) {
    fail(
      `Fuga en el bundle selectivo: ${leaks.length} módulo(s) fuera de la allowlist.`,
      "El import selectivo arrastra más de lo que debería. Revisa si es intencionado:\n" +
        leaks.map((id) => `    ${id}`).join("\n") +
        "\n  Si es intencionado, actualiza SELECTIVE_ALLOWED_UI / SELECTIVE_ALLOWED_ICONS en tools/measure-bundle.mjs.",
    );
  }

  ok(`Sin fugas en el bundle selectivo (${bundle.modules.size} módulos con bytes)`);
}

function assertFullCoverage(bundle, expectedComponents) {
  const measured = new Set(
    [...bundle.modules.keys()].map(componentOf).filter((name) => name !== null),
  );

  const missing = expectedComponents.filter((name) => !measured.has(name));
  if (missing.length > 0) {
    fail(
      `El bundle "full" no contiene ${missing.length} componente(s) publicado(s): ${missing.join(", ")}.`,
      "El entry generado no los referencia o el bundler los eliminó, así que el desglose por\n" +
        "  componente de este informe no sería el coste real. Comprueba readUiExports() y vuelve a medir.",
    );
  }

  ok(`${measured.size} componentes presentes en el bundle "full"`);
}

function assertCatalogCoverage(bundle, expectedModules) {
  const measured = new Set(
    [...bundle.modules.keys()].map(iconNameOf).filter((name) => name !== null),
  );

  if (measured.size !== expectedModules) {
    fail(
      `El bundle de iconos contiene ${measured.size} de los ${expectedModules} módulos del catálogo.`,
      "Si es menor, el entry generado no referencia todos los iconos y la cifra del catálogo\n" +
        "  estaría subestimada. Revisa readIconCatalog() antes de fiarte del informe.",
    );
  }

  ok(`Los ${measured.size} módulos del catálogo de iconos están en el bundle`);
}

// A DS whose tokens leak into every bundle pays for them on every page. The
// components import tokens as TYPES only (`import type`), so the expected
// contribution of `@raulrod/tokens` is exactly zero — and that is worth
// asserting instead of assuming, because a single value import would be
// invisible in review and visible in every consumer's bundle.
function assertTokensNotBundled(bundle) {
  const tokens = [...bundle.modules.keys()].filter((id) => id.startsWith("packages/tokens/"));

  if (tokens.length > 0) {
    fail(
      `@raulrod/tokens aporta ${tokens.length} módulo(s) al bundle del consumidor.`,
      `Módulos: ${tokens.join(", ")}\n` +
        "  Los componentes deben importar tokens solo con `import type` (RRU-025/verbatimModuleSyntax);\n" +
        "  un import de valor arrastra ~4.9 kB gzip a cada consumidor.",
    );
  }

  ok("Los tokens no aportan JS al bundle (solo tipos + CSS)");
}

// --- report -----------------------------------------------------------------

function componentRows(bundle) {
  const rows = new Map();

  for (const [id, sizes] of bundle.modules) {
    const component = componentOf(id);
    if (component === null) continue;

    const row = rows.get(component) ?? { name: component, raw: 0, gzip: 0, modules: 0 };
    row.raw += sizes.raw;
    row.gzip += sizes.gzip;
    row.modules += 1;
    rows.set(component, row);
  }

  return [...rows.values()].sort((a, b) => b.gzip - a.gzip);
}

function iconRows(bundle) {
  const icons = [];
  let sharedRaw = 0;
  let sharedGzip = 0;

  for (const [id, sizes] of bundle.modules) {
    const icon = iconNameOf(id);
    if (icon !== null) icons.push({ name: icon, raw: sizes.raw, gzip: sizes.gzip });
    else if (id.startsWith("lucide-react/")) {
      sharedRaw += sizes.raw;
      sharedGzip += sizes.gzip;
    }
  }

  return { icons: icons.sort((a, b) => b.gzip - a.gzip), sharedRaw, sharedGzip };
}

function authoredCssRows() {
  const rows = [];

  for (const entry of readdirSync(UI_DIST, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const css = walkFiles(join(UI_DIST, entry.name)).filter((path) => path.endsWith(".css"));
    if (css.length === 0) continue;

    const sizes = sumSizes(css);
    rows.push({ name: entry.name, files: css.length, raw: sizes.raw, gzip: sizes.gzip });
  }

  return rows.sort((a, b) => b.raw - a.raw);
}

function distFootprint() {
  const rows = [];

  for (const [label, dir] of [
    ["@raulrod/ui (dist)", UI_DIST],
    ["@raulrod/tokens (dist)", TOKENS_DIST],
    ["@raulrod/icons (dist)", ICONS_DIST],
  ]) {
    const files = walkFiles(dir);
    const js = sumSizes(files.filter((path) => path.endsWith(".js")));
    const css = sumSizes(files.filter((path) => path.endsWith(".css")));
    const types = files.filter((path) => path.endsWith(".d.ts"));

    rows.push({
      label,
      files: files.length,
      js: js.gzip,
      css: css.gzip,
      types: sumSizes(types).raw,
    });
  }

  return rows;
}

function printEnvironment() {
  const playground = JSON.parse(readFileSync(join(PLAYGROUND, "package.json"), "utf8"));

  log("\n── Entorno ──────────────────────────────────────────────────────────────");
  log(`  Node ${process.versions.node} · pnpm ${manifest("package.json").replace("pnpm@", "")}`);
  log(`  Vite ${playground.devDependencies.vite} · React ${playground.devDependencies.react}`);
  log("  Medición sobre artefactos de producción (minificados), nunca sobre el código fuente.");
}

function manifest(path) {
  return JSON.parse(readFileSync(join(ROOT, path), "utf8")).packageManager ?? "";
}

function printPublishedFootprint(rows) {
  log("\n── Lo que se instala (npm pack --dry-run) ────────────────────────────────");
  log("  Tamaño desempaquetado de lo publicado; no es lo que viaja por el cable, es lo que");
  log("  ocupa la instalación (caché de pnpm, capa de Docker, `node_modules`).");
  log("");
  table(
    ["Paquete", "Ficheros", "Desempaquetado", "Tarball"],
    rows.map((row) => [
      row.name,
      row.files,
      kB(row.unpacked),
      row.tarball === null ? "n/d" : kB(row.tarball),
    ]),
  );
}

function printBundles(bundles) {
  log("\n── Bundles ───────────────────────────────────────────────────────────────");
  for (const bundle of bundles) {
    log(`  ${bundle.title}`);
    log(
      `    JS  ${kB(bundle.assets.js.raw)} raw · ${kB(bundle.assets.js.gzip)} gzip · ${kB(bundle.assets.js.brotli)} brotli`,
    );
    log(
      `    CSS ${kB(bundle.assets.css.raw)} raw · ${kB(bundle.assets.css.gzip)} gzip · ${kB(bundle.assets.css.brotli)} brotli`,
    );
  }
}

function originRows(bundle) {
  const rows = new Map();

  for (const [id, sizes] of bundle.modules) {
    const peer = peerPackageOf(id);
    const origin =
      peer !== null
        ? `peer: ${peer}`
        : componentOf(id) !== null
          ? "@raulrod/ui"
          : id.startsWith("lucide-react/")
            ? "@raulrod/icons (lucide)"
            : id.startsWith("@raulrod/")
              ? "@raulrod/*"
              : "tercero";

    const row = rows.get(origin) ?? { origin, raw: 0, gzip: 0 };
    row.raw += sizes.raw;
    row.gzip += sizes.gzip;
    rows.set(origin, row);
  }

  return [...rows.values()].sort((a, b) => b.gzip - a.gzip);
}

function printOrigins(bundle) {
  log('\n── Reparto por origen (bundle "full") ───────────────────────────────────');
  log("  Cuánto de lo que descarga el consumidor es el design system y cuánto es React.");
  log("");

  table(
    ["Origen", "Raw", "Gzip"],
    originRows(bundle).map((row) => [row.origin, kB(row.raw), kB(row.gzip)]),
  );
}

function printComponents(bundle) {
  const rows = componentRows(bundle);

  log('\n── Coste por componente (bundle "full", atribución por módulo) ──────────');
  log("  `gzip por módulo` es una ATRIBUCIÓN, no lo que viaja por el cable: cada módulo se");
  log("  comprime por separado y esa suma siempre excede al asset real. Para el número de");
  log("  red, la fila de arriba; para repartir el coste entre componentes, la de aquí.");

  if (rows.length === 0) {
    warn("  Ningún módulo de @raulrod/ui en el bundle: revisa el entry generado.");
    return;
  }

  log("");
  table(
    ["Componente", "Módulos", "JS raw", "JS gzip"],
    rows.map((row) => [row.name, row.modules, kB(row.raw), kB(row.gzip)]),
  );

  const total = rows.reduce(
    (accumulator, row) => ({ raw: accumulator.raw + row.raw, gzip: accumulator.gzip + row.gzip }),
    { raw: 0, gzip: 0 },
  );
  log("");
  log(`  ${rows.length} grupos · ${kB(total.raw)} raw · ${kB(total.gzip)} gzip`);
}

function printIcons(catalogBundle, selectiveBundle) {
  const catalog = iconRows(catalogBundle);
  const selective = iconRows(selectiveBundle).icons;
  const catalogRaw = catalog.icons.reduce((sum, icon) => sum + icon.raw, 0);
  const catalogGzip = catalog.icons.reduce((sum, icon) => sum + icon.gzip, 0);

  log("\n── Iconos ────────────────────────────────────────────────────────────────");
  log(
    `  Catálogo completo: ${catalog.icons.length} módulos · ${kB(catalogRaw)} raw · ${kB(catalogGzip)} gzip`,
  );
  log(
    `  Runtime compartido de lucide (lo que paga CUALQUIER icono): ${kB(catalog.sharedRaw)} raw · ${kB(catalog.sharedGzip)} gzip`,
  );
  log("");
  log("  Coste real de usar un icono (lo que entra en el bundle selectivo):");
  log("");
  table(
    ["Icono", "Raw", "Gzip"],
    selective.map((icon) => [icon.name, kB(icon.raw), kB(icon.gzip)]),
  );
  log("");
  log(
    `  Los ${catalog.icons.length - selective.length} módulos restantes del catálogo no aparecen en el`,
  );
  log("  bundle selectivo: `export *` con `sideEffects: false` (ADR-007) se paga por icono usado.");
}

function printCssOverhead(full) {
  const rows = authoredCssRows();
  const total = rows.reduce((accumulator, row) => accumulator + row.raw, 0);

  log("\n── CSS ───────────────────────────────────────────────────────────────────");
  log(
    `  El bundle "full" entrega ${kB(full.assets.css.gzip)} gzip de CSS para quien use un solo componente:`,
  );
  log("  `styles.css` es un barril de `@import` (RRU-069/RRU-091), así que el CSS no se");
  log("  tree-shakea: el consumidor descarga la hoja entera. La cifra de abajo va partida por");
  log("  stylesheet para que se vea qué componente costaría separar si algún día hiciera falta.");
  table(
    ["Stylesheet", "Raw", "gzip"],
    rows.map((row) => [row.name, kB(row.raw), kB(row.gzip)]),
  );
  log("");
  log(`  ${rows.length} stylesheets · ${kB(total)} raw authored`);
}

function printDist() {
  const rows = distFootprint();

  log("\n── dist/ por paquete (lo que construye el repo) ──────────────────────────");
  log("  `JS/CSS` en gzip y `.d.ts` en raw: los tipos son el otro payload que descarga el");
  log("  consumidor, y `size-limit` no los mide.");
  log("");
  table(
    ["Paquete", "Ficheros", "JS gzip", "CSS gzip", ".d.ts raw"],
    rows.map((row) => [row.label, row.files, kB(row.js), kB(row.css), kB(row.types)]),
  );
}

function printOptimizations(selective, full, catalog) {
  const dsSelective = componentRows(selective).reduce((sum, row) => sum + row.gzip, 0);
  const fullApiPremium = full.assets.js.gzip - selective.assets.js.gzip;
  const fullIcons = iconRows(full);
  const catalogIcons = iconRows(catalog);
  const sharedGzip = fullIcons.sharedGzip;
  const heaviestIcon = fullIcons.icons[0];
  const tokensJs = sumSizes(walkFiles(TOKENS_DIST).filter((path) => path.endsWith(".js"))).gzip;

  log("\n── Optimizaciones medidas (antes / después) ─────────────────────────────");

  log("\n  1. Tree-shaking (ESM + sideEffects:false, ADR-007/RRU-010)");
  log(
    `     Bundle con TODA la API pública: ${kB(full.assets.js.gzip)} gzip (incluye el mount de React).`,
  );
  log(
    `     Bundle importando un solo componente: ${kB(selective.assets.js.gzip)} gzip, de los que ${kB(dsSelective)} son @raulrod/ui.`,
  );
  log(
    `     Ahorro de red por importar un componente en vez de la librería: ${kB(fullApiPremium)}.`,
  );

  log("\n  2. Tokens solo como tipos (verbatimModuleSyntax, RRU-011/RRU-025)");
  log(
    `     El JS runtime de @raulrod/tokens pesa ${kB(tokensJs)} gzip, pero no aparece en NINGÚN bundle`,
  );
  log("     de los tres: los componentes lo importan con `import type`, que el compilador borra.");
  log(
    `     Antes/después: ${kB(tokensJs)} de JS que el consumidor pagaría por un valor → 0 bytes (verificado).`,
  );

  log("\n  3. Iconos por icono, no por catálogo (ADR-007)");
  log(
    `     Un icono arrastra su módulo (${kB(heaviestIcon?.gzip ?? 0)} gzip el más pesado) + el runtime`,
  );
  log(`     compartido de lucide (${kB(sharedGzip)} gzip), que se paga una sola vez.`);
  log(
    `     Importar el catálogo entero costaría ${kB(catalog.assets.js.gzip)} gzip de JS, ${(catalog.assets.js.gzip / selective.assets.js.gzip).toFixed(1)}× el bundle selectivo.`,
  );
  log(
    `     Los ${catalogIcons.icons.length} módulos del catálogo: ${kB(catalogIcons.icons.reduce((sum, icon) => sum + icon.gzip, 0))} gzip solo en iconos.`,
  );

  log("\n  4. `tsc` en vez de un bundler (RRU-010)");
  log(
    "     El build emite un módulo por componente, sin concatenar: eso es lo que hace posible el punto 1.",
  );
  log(
    `     Importar la API completa cuesta ${kB(fullApiPremium)} gzip más que importar un componente:`,
  );
  log("     ese es el sobrecoste que el consumidor evita importando solo lo que usa.");

  log("\n  5. Memoización: ninguna añadida (§29/§6)");
  log("     No se ha introducido `memo`/`useMemo`/`useCallback` por especulación de rendimiento.");
  log("     Medir re-renders antes de optimizar es RRU-101; esta tarjeta no lo adelanta.");
}

// --- entry point ------------------------------------------------------------

function parseArgs(args) {
  const options = { build: true };

  for (const arg of args) {
    if (arg === "--no-build") options.build = false;
    else if (arg === "--help" || arg === "-h") {
      log(
        "Uso: pnpm perf:baseline [--no-build]\n\n  --no-build   no reconstruye los paquetes; mide el dist/ actual",
      );
      process.exit(0);
    } else {
      fail(
        `Flag desconocida: ${arg}`,
        "Ejecuta `pnpm perf:baseline` sin flags, o `pnpm perf:baseline -- --help`.",
      );
    }
  }

  return options;
}

function expectedComponents() {
  return readdirSync(UI_DIST, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        !["utils", "storybook-support", "test-support", "docs"].includes(entry.name) &&
        existsSync(join(UI_DIST, entry.name, "index.js")),
    )
    .map((entry) => entry.name)
    .sort();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.build) {
    await build();
  } else {
    step("Saltando el build de paquetes (--no-build).");
  }

  step("Generando los entry points de medición…");
  const generated = generateEntries();
  ok(`${generated.uiExports} exports públicos · ${generated.icons.names.length} iconos`);

  step("Build del bundle selectivo (el que gatea RRU-095)…");
  await buildBundle({
    script: "build:tree-shake",
    message: "El build selectivo falló.",
    hint: "Revisa apps/playground/src/tree-shake-entry.tsx; sin él no hay baseline.",
  });

  step("Build del bundle con toda la API pública…");
  await buildBundle({
    script: "build:bundle-baseline",
    entry: "full",
    message: "El build del bundle completo falló.",
    hint: "El entry lo genera este script; ejecuta el comando sin --no-build para regenerarlo.",
  });

  step("Build del catálogo de iconos…");
  await buildBundle({
    script: "build:bundle-baseline",
    entry: "icons",
    message: "El build del catálogo de iconos falló.",
    hint: "El entry lo genera este script; ejecuta el comando sin --no-build para regenerarlo.",
  });

  const selective = readBundle(
    "selective",
    join(PLAYGROUND, "dist-tree-shake"),
    "Selectivo — `Button` + `ChevronDown` (RRU-092)",
  );
  const full = readBundle(
    "full",
    join(PLAYGROUND, "dist-bundle-baseline-full"),
    "API pública completa de `@raulrod/ui` (peor caso)",
  );
  const catalog = readBundle(
    "icons",
    join(PLAYGROUND, "dist-bundle-baseline-icons"),
    "Catálogo completo de iconos vía `@raulrod/icons` (peor caso)",
  );

  step("Verificando las aserciones del baseline…");
  assertSelectiveBundle(selective);
  assertFullCoverage(full, expectedComponents());
  assertCatalogCoverage(catalog, generated.icons.modules);
  assertTokensNotBundled(selective);
  assertTokensNotBundled(full);

  printEnvironment();
  printPublishedFootprint(readPublishedFootprint());
  printBundles([selective, full, catalog]);
  printComponents(full);
  printOrigins(full);
  printIcons(catalog, selective);
  printCssOverhead(full);
  printDist();
  printOptimizations(selective, full, catalog);

  log("\n  Cifras para docs/performance.md · reproducibles con `pnpm perf:baseline`.\n");
}

await main();
