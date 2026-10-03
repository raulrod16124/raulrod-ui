#!/usr/bin/env node
// Claim checker for DEMO.md (RRU-113).
//
// WHY THIS EXISTS. RRU-113 asks for a demo script and an interview pitch "with
// evidence from the repository". A pitch is the one document in this repo whose
// failure mode is silent: a demo script rots by being *almost* right. It names a
// file that was renamed, quotes a `pnpm` script that was deleted, and asserts
// "72 public exports" after a component was added — and nothing turns red,
// because prose is not compiled.
//
// Every other claim in this repo is already defended by something executable:
// RRU-072's contrast gate, RRU-103's public-API frontier, RRU-111's
// `verify:external`, RRU-129's fill probes, RRU-131's CI job. The demo script
// was the last document making claims with no gate behind it, which made it the
// least trustworthy document in the repository — the opposite of what a portfolio
// artefact is for.
//
// So this script re-derives DEMO.md's factual claims from the tree and fails when
// the document and the repository disagree. It checks three things:
//
//   1. NUMBERS    a claim table maps each label to a derivation over the
//                 filesystem; the value printed in DEMO.md must equal it.
//   2. PATHS      every backticked repository path must exist AND be tracked by
//                 git — a local-only file is not evidence a reviewer can open.
//   3. COMMANDS   every backticked `pnpm …` invocation must name a real root
//                 script, and every external URL must also appear in README.md
//                 so the two documents cannot drift apart.
//
// A check that cannot fail is decoration, so two properties are deliberate:
// deleting a claim from DEMO.md fails the run (the label must be *present*, not
// merely correct when present), and a derivation that cannot read what it needs
// fails loudly instead of being skipped. `--print` reports the derived values
// without asserting them, which is how DEMO.md was written in the first place —
// the numbers in the document came out of this script, not out of a count by hand.
//
// WHAT THIS IS NOT. It is not a link checker for the two live URLs (Storybook on
// GitHub Pages and the npm registry): CI cannot follow them without the network,
// and a network dependency in this job would make it the flakiest gate in the
// repository. It asserts they match README.md instead, which catches the failure
// that actually happens — one document updated and the other not. It also does
// not check the demo page renders; a document gate cannot observe a browser.
//
// WHAT IS DELIBERATELY NOT CHECKED. Counts that change on every commit — unit
// tests, bundle kilobytes, lines of CSS — are not quoted in DEMO.md at all. A
// ratchet on a number that moves whenever the repo is worked on trains people to
// update the number instead of the work, so the document points at the command
// that produces the figure (`pnpm test`, `pnpm perf:baseline`) and lets the reader
// run it. That is why the claim table is short.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEMO = join(ROOT, "DEMO.md");
const README = join(ROOT, "README.md");
const UI_ENTRY = join(ROOT, "packages", "ui", "src", "index.ts");

// --- output ------------------------------------------------------------------

function log(message) {
  process.stdout.write(`${message}\n`);
}

function ok(message) {
  log(`  ✓ ${message}`);
}

function warn(message) {
  process.stderr.write(`  ! ${message}\n`);
}

const failures = [];

function fail(message, hint) {
  failures.push({ message, hint });
  process.stderr.write(`  ✗ ${message}\n`);
  if (hint) process.stderr.write(`    ${hint}\n`);
}

// --- derivations -------------------------------------------------------------
//
// Every one of these reads the tree. None of them reads DEMO.md, which is what
// makes them independent of the thing they judge.

function walk(dir, predicate) {
  if (!existsSync(dir)) {
    fail(
      `No se pudo leer ${dir.slice(ROOT.length + 1)}: el path no existe.`,
      "Renombrado o movido.",
    );
    return [];
  }
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full, predicate));
    else if (predicate(entry.name)) found.push(full);
  }
  return found;
}

function countFiles(dir, predicate) {
  return walk(dir, predicate).length;
}

function readJson(...segments) {
  const full = join(ROOT, ...segments);
  if (!existsSync(full)) {
    fail(`No existe ${segments.join("/")}.`, "El paquete se movió o se renombró.");
    return null;
  }
  try {
    return JSON.parse(readFileSync(full, "utf8"));
  } catch (error) {
    fail(`${segments.join("/")} no es JSON válido: ${error.message}`);
    return null;
  }
}

/**
 * Counts the runtime (non-type) exports of `packages/ui/src/index.ts`.
 *
 * WHY PARSE THE SOURCE AND NOT THE BUILD. The honest answer for "how many
 * exports does `@raulrod/ui` have" is the built `dist/index.js`, which needs a
 * build — and a check that needs a build cannot be the first thing you run. The
 * source entry point is the same list one step earlier, and it is what
 * `public-api-boundary.test.ts` (RRU-103) also reads, so the two agree by
 * construction.
 *
 * `export * from "@raulrod/icons"` is counted separately and never as a number:
 * it re-exports the whole lucide catalog, so it is a superset nobody would want
 * a figure for. ADR-007 owns that decision.
 */
function countRuntimeExports() {
  if (!existsSync(UI_ENTRY)) {
    fail("No existe packages/ui/src/index.ts.");
    return null;
  }
  // Strip comments first: index.ts documents the `export *` line in Spanish
  // comments, and a naive scan would read names out of the prose.
  const source = readFileSync(UI_ENTRY, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  const names = [];
  // Two shapes: `export { … } from "…"` possibly spanning lines, and `export *`.
  const blocks = source.matchAll(/export\s+(type\s+)?\{([\s\S]*?)\}\s*from\s*["'][^"']+["'];/g);
  for (const [, typeOnly, body] of blocks) {
    if (typeOnly) continue;
    for (const raw of body.split(",")) {
      const name = raw
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) names.push(name);
    }
  }
  const starReexports = (source.match(/export\s+\*\s+from/g) ?? []).length;

  const unique = new Set(names);
  if (unique.size === 0) {
    fail(
      "El parser no encontró ningún export de runtime en packages/ui/src/index.ts.",
      "El formato del entry point cambió; actualiza countRuntimeExports().",
    );
    return null;
  }
  return { count: unique.size, starReexports };
}

/**
 * Component directories: the top-level folders of `packages/ui/src` that hold a
 * PascalCase implementation file. The four non-component folders are excluded by
 * that shape rather than by a list — `utils`, `docs` and `test-support` have no
 * `.tsx` at all, and `storybook-support` has `index.tsx`, which is lowercase.
 * A hardcoded allowlist of the other 28 would be a list to forget to update.
 */
function countComponentDirectories() {
  const src = join(ROOT, "packages", "ui", "src");
  if (!existsSync(src)) {
    fail("No existe packages/ui/src.");
    return null;
  }
  const dirs = readdirSync(src, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => {
      const inside = readdirSync(join(src, entry.name));
      return inside.some((file) => /^[A-Z].*\.tsx$/.test(file));
    })
    .map((entry) => entry.name);
  if (dirs.length === 0) {
    fail("No se encontró ningún componente en packages/ui/src.");
    return null;
  }
  return dirs.length;
}

function countCiJobs() {
  const workflow = join(ROOT, ".github", "workflows", "ci.yml");
  if (!existsSync(workflow)) {
    fail("No existe .github/workflows/ci.yml.");
    return null;
  }
  const text = readFileSync(workflow, "utf8");
  const jobsSection = text.split(/^jobs:\s*$/m)[1];
  if (!jobsSection) {
    fail("ci.yml no tiene sección `jobs:`.");
    return null;
  }
  const jobs = [...jobsSection.matchAll(/^ {2}([A-Za-z0-9_-]+):\s*$/gm)].map(([, name]) => name);
  return jobs.length;
}

function publishedPackages() {
  const dir = join(ROOT, "packages");
  if (!existsSync(dir)) {
    fail("No existe packages/.");
    return null;
  }
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readJson("packages", entry.name, "package.json"))
    .filter(
      (manifest) =>
        manifest && manifest.private !== true && /^@raulrod\//.test(manifest.name ?? ""),
    );
}

function uiVersion() {
  const manifest = readJson("packages", "ui", "package.json");
  return manifest?.version ?? null;
}

function reactFloor() {
  const manifest = readJson("packages", "ui", "package.json");
  // `>=18.2.0` → `18.2.0`. The floor is the claim RRU-132 verified at both ends,
  // so it is the one version string in the repository worth gating.
  const range = manifest?.peerDependencies?.react;
  const match = typeof range === "string" && range.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

const CLAIMS = [
  {
    label: "Published packages",
    derive: () => publishedPackages().length,
  },
  {
    label: "Runtime exports of @raulrod/ui",
    derive: () => countRuntimeExports()?.count ?? null,
  },
  {
    label: "Story files",
    derive: () =>
      countFiles(join(ROOT, "packages", "ui", "src"), (n) => n.endsWith(".stories.tsx")),
  },
  {
    label: "Story files",
    derive: () =>
      countFiles(join(ROOT, "packages", "ui", "src"), (n) => n.endsWith(".stories.tsx")),
  },
  {
    label: "Components",
    derive: () => countComponentDirectories(),
  },
  {
    label: "Architecture Decision Records",
    derive: () => countFiles(join(ROOT, "docs", "decisions"), (n) => n.endsWith(".md")),
  },
  {
    label: "Playwright E2E specs",
    derive: () =>
      countFiles(join(ROOT, "apps", "playground", "e2e"), (n) => n.endsWith(".spec.ts")),
  },
  {
    label: "CI jobs",
    derive: () => countCiJobs(),
  },
  {
    label: "Published version",
    derive: () => uiVersion(),
  },
  {
    label: "React peer floor",
    derive: () => reactFloor(),
  },
];

// --- claim table -------------------------------------------------------------

/**
 * Reads `| <label> | <value> |` out of the "Repository at a glance" table.
 * A label that is absent resolves to `null`, which fails: deleting a claim must
 * not be a way to stop asserting it.
 */
function readClaimTable(markdown) {
  const values = new Map();
  for (const line of markdown.split("\n")) {
    const row = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/);
    if (!row) continue;
    values.set(row[1], row[2]);
  }
  return values;
}

function checkClaims(markdown) {
  const table = readClaimTable(markdown);
  let checked = 0;

  for (const claim of CLAIMS) {
    const expected = claim.derive();
    if (expected === null || expected === undefined) {
      fail(
        `No se pudo derivar "${claim.label}".`,
        "La derivación falló arriba; no se salta el claim.",
      );
      continue;
    }
    const printed = table.get(claim.label);
    if (printed === undefined) {
      fail(
        `DEMO.md ya no afirma "${claim.label}".`,
        "Si el claim se retira a propósito, bórralo también de CLAIMS en este script.",
      );
      continue;
    }
    if (printed !== String(expected)) {
      fail(
        `"${claim.label}": DEMO.md dice ${printed}, el repo dice ${expected}.`,
        "Corrige el documento o el repo; no los dos.",
      );
      continue;
    }
    ok(`${claim.label}: ${expected}`);
    checked += 1;
  }

  return checked;
}

// --- paths -------------------------------------------------------------------

const PATH_SHAPE = /^[A-Za-z0-9._@/-]+$/;
// Build and cache output. These are never in the repository by construction, so
// citing one is a category error rather than a stale reference — the equivalent of
// pointing at a screenshot instead of the code.
const GENERATED =
  /^(dist|coverage|node_modules|storybook-static|playwright-report|test-results|\.turbo)(\/|$)/;
// `pnpm …` spans are handled by checkCommands; package specifiers and URLs are
// not paths; a leading `~` means "roughly here" and is not a citation.
function looksLikePath(span) {
  if (!span.includes("/")) return false;
  if (span.startsWith("@") || span.startsWith("~")) return false;
  if (GENERATED.test(span)) return false;
  if (!PATH_SHAPE.test(span)) return false;
  return true;
}

/**
 * Files a commit would contain, from git rather than from the filesystem.
 *
 * WHY NOT `existsSync`. This gate runs in CI, where the working tree is a fresh
 * checkout, and locally, where it is a working copy with two dozen untracked
 * files under `docs/` (the guides, the board and the reports are gitignored by
 * RRU-014). A filesystem check would therefore be green on the author's machine
 * and red in CI the first time DEMO.md cited `docs/design-system-guide.md` — the
 * worst possible failure mode for a gate, because it teaches you to ignore it.
 *
 * `--others --exclude-standard` is what keeps the two ends in agreement: it adds
 * the new files a commit is about to contain while still excluding the ignored
 * ones, so a file written minutes before the check is judged exactly as it will
 * be judged once it is committed. Requiring a path to be committable is also the
 * semantically right rule for a public document: a file the repository does not
 * carry cannot be evidence that the repository is well made, so a local-only path
 * is rejected with its own message instead of a generic "not found".
 */
function trackedFiles() {
  const result = spawnSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    {
      cwd: ROOT,
      encoding: "utf8",
    },
  );
  if (result.status !== 0) {
    fail(
      "No se pudo ejecutar `git ls-files`.",
      result.stderr?.trim() || "Comprueba que git esté disponible.",
    );
    return null;
  }
  return new Set(result.stdout.split("\0").filter(Boolean));
}

function isTracked(tracked, span) {
  const normalized = span.endsWith("/") ? span.slice(0, -1) : span;
  if (tracked.has(normalized)) return true;
  // Directory citation: tracked when something lives under it.
  for (const file of tracked) {
    if (file.startsWith(`${normalized}/`)) return true;
  }
  return false;
}

function checkPaths(markdown) {
  const tracked = trackedFiles();
  if (tracked === null) return 0;

  const spans = [...markdown.matchAll(/`([^`\n]+)`/g)].map(([, span]) => span);
  const seen = new Set();
  let checked = 0;

  for (const span of spans) {
    if (!looksLikePath(span)) continue;
    if (seen.has(span)) continue;
    seen.add(span);
    const normalized = span.endsWith("/") ? span.slice(0, -1) : span;

    if (!isTracked(tracked, normalized)) {
      if (existsSync(join(ROOT, normalized))) {
        fail(
          `DEMO.md cita \`${span}\`, que existe en disco pero NO está trackeado.`,
          "Un fichero local no puede ser evidencia pública: /docs está gitignored (RRU-014). Cita el ADR, el README o el script que lo demuestra.",
        );
      } else {
        fail(
          `DEMO.md cita \`${span}\`, que no existe en el repositorio.`,
          "Path renombrado, movido o escrito de memoria.",
        );
      }
      continue;
    }
    checked += 1;
  }

  ok(`${checked} rutas referenciadas existen y están trackeadas`);
  return checked;
}

// --- commands ----------------------------------------------------------------

// Subcommands pnpm resolves itself, or that belong to another tool quoted in the
// document. Anything else must be a root script, so a typo cannot read as a
// command that works.
const PNPM_BUILTINS = new Set(["install", "add", "audit", "exec", "dlx", "why", "ls"]);

function checkCommands(markdown) {
  const root = readJson("package.json");
  const scripts = new Set(Object.keys(root?.scripts ?? {}));
  const spans = [...markdown.matchAll(/`([^`\n]+)`/g)].map(([, span]) => span);
  const seen = new Set();
  let checked = 0;

  for (const span of spans) {
    if (!span.startsWith("pnpm ")) continue;
    if (seen.has(span)) continue;
    seen.add(span);

    const tokens = span
      .slice("pnpm ".length)
      .split(/\s+/)
      // `--filter=@raulrod/ui` is a flag; a bare `--filter @raulrod/ui` is not,
      // and both forms appear in documentation.
      .filter((token) => token.length > 0);
    let subcommand = null;
    for (const token of tokens) {
      if (token.startsWith("-")) continue;
      if (tokens[tokens.indexOf(token) - 1] === "--filter") continue;
      subcommand = token;
      break;
    }

    if (subcommand === null) {
      fail(`\`${span}\` no nombra ningún subcomando.`);
      continue;
    }
    if (PNPM_BUILTINS.has(subcommand)) continue;
    if (!scripts.has(subcommand)) {
      fail(
        `\`pnpm ${subcommand}\` no es un script de package.json.`,
        "Scripts disponibles: " + [...scripts].sort().join(", "),
      );
      continue;
    }
    checked += 1;
  }

  ok(`${checked} comandos \`pnpm\` resuelven a scripts reales`);
  return checked;
}

// --- urls --------------------------------------------------------------------

/**
 * Every external URL in DEMO.md must also be in README.md.
 *
 * The alternative — fetching them — is what would make this the least reliable
 * job in the repository. Two hardcoded URLs that cannot drift apart is the whole
 * requirement; whether GitHub Pages is up is not this gate's business.
 */
function checkUrls(markdown) {
  if (!existsSync(README)) {
    fail("No existe README.md.");
    return 0;
  }
  const readme = readFileSync(README, "utf8");
  const urls = new Set(
    // No capture group in the pattern, so the whole match is the URL.
    [...markdown.matchAll(/https?:\/\/[^\s)>`"']+/g)].map(([url]) => url),
  );
  let checked = 0;

  for (const url of urls) {
    if (!readme.includes(url)) {
      fail(
        `\`${url}\` aparece en DEMO.md pero no en README.md.`,
        "Actualiza los dos, o deja el link solo en README.md.",
      );
      continue;
    }
    checked += 1;
  }

  if (urls.size === 0) warn("DEMO.md no contiene URLs externas; ¿es lo esperado?");

  ok(`${checked} URLs coinciden con README.md`);
  return checked;
}

// --- main --------------------------------------------------------------------

function main() {
  // `--print` runs before the document is required: it is how DEMO.md was
  // written, so it has to work on a tree where DEMO.md does not exist yet.
  const printOnly = process.argv.includes("--print");

  const derived = CLAIMS.map((claim) => ({ label: claim.label, value: claim.derive() }));
  if (printOnly) {
    log("Valores derivados del repositorio (para escribir DEMO.md):\n");
    for (const { label, value } of derived) log(`  | ${label} | ${value} |`);
    const exports_ = countRuntimeExports();
    if (exports_) {
      const icons = readJson("packages", "icons", "package.json");
      log(
        `\n  export * re-exports: ${exports_.starReexports} (${icons?.name ?? "@raulrod/icons"})`,
      );
    }
    log("");
    process.exit(failures.length > 0 ? 1 : 0);
  }

  if (!existsSync(DEMO)) {
    fail("No existe DEMO.md.", "RRU-113 lo entrega en la raíz del repositorio.");
    process.exit(1);
  }

  const markdown = readFileSync(DEMO, "utf8");

  log("Verificando las afirmaciones de DEMO.md (RRU-113)…\n");

  log("▸ Cifras declaradas");
  const claims = checkClaims(markdown);

  log("▸ Rutas referenciadas");
  const paths = checkPaths(markdown);

  log("▸ Comandos");
  const commands = checkCommands(markdown);

  log("▸ URLs externas");
  const urls = checkUrls(markdown);

  const total = claims + paths + commands + urls;
  if (failures.length > 0) {
    process.stderr.write(`\n✗ ${failures.length} afirmación(es) de DEMO.md no se sostienen.\n\n`);
    process.exit(1);
  }

  log(`\n✓ ${total} afirmaciones de DEMO.md verificadas contra el repositorio.\n`);
}

main();
