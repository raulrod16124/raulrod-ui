#!/usr/bin/env node
// External install validation (RRU-111).
//
// WHY THIS EXISTS. Every other gate in the repo answers a question about THIS
// CHECKOUT. Unit tests import the sources; `consumer-contract.test.ts` reads the
// README and the manifests; `published-install.test.ts` packs a tarball and asks
// what it contains; `size-limit` and the bundle baseline ask what a bundler
// resolves locally. All four are necessary and none of them is the question a
// consumer asks, which is:
//
//   "I ran `npm install @raulrod/ui` in a directory I know nothing about, wrote
//    the snippet from the README, and it worked."
//
// That question needs three things this repo cannot offer: a directory with no
// workspace, no `node_modules` shortcut and no tsconfig it wrote; a real
// registry; and a real browser. So the project this script generates lives in
// the OS temp directory, its only knowledge of the design system is its
// `package.json`, and every assertion below is made by something that is not
// part of this repository.
//
// TWO ROUTES, because they answer different questions and neither subsumes the
// other:
//
//   --route=tarball (default)  installs `pnpm pack` output: exactly what the
//                              next release would upload, including work that is
//                              not committed yet.
//   --route=registry           installs `@raulrod/*@latest` from npm: what a
//                              consumer gets today, and the only route that can
//                              be wrong because of something that happened in a
//                              past release rather than in the working tree.
//                              That also makes it the route that can be right
//                              about a DIFFERENT version than the one in the
//                              tree, so it says which version it installed
//                              instead of letting a green run imply otherwise.
//
// A THIRD AXIS, `--react` (RRU-132). The two routes answer "which packages".
// `@raulrod/ui` declares `react/react-dom: ">=18.2.0"` as a PEER, and nothing in
// this repository ever installed anything below `^19.3.0` — the playground, the
// E2E suite, this fixture and the root devDependencies all did. A peer range is
// the one promise in a package's manifest that the package itself cannot keep:
// nothing stops the claim from being published and never once exercised. So the
// fixture installs a React major the repo does not otherwise use, and every React
// API the library touches (`createPortal`, `renderToString`, `createRoot`) exists
// in both majors — the risk was never "does it import", it was whether a hook or a
// renderer differs underneath.
//
// `--react` takes a MAJOR (`18`, `19`) or an EXACT version (`18.2.0`), because
// the peer says `>=18.2.0` and the newest 18.x is not that floor. Testing only
// 18.3.1 would leave the bottom of the declared range as unexercised as it was
// before this flag existed, just further up. Runtime pins what you ask for;
// `@types/react*` follows the MAJOR, because the types packages version
// independently and pairing 18's runtime with 19's types would test a combination
// no consumer can install.
//
// The `workspace:` trap is why the tarball route is packed with pnpm and
// installed with npm. `npm pack` copies `"@raulrod/icons": "workspace:*"` into
// the tarball, and `npm install` answers `EUNSUPPORTEDPROTOCOL` to that — a fact
// measured while writing this card, and the reason `published-install.test.ts`
// packs with pnpm too. Running the install with npm is deliberate: it is the
// package manager a consumer is most likely to use, and it is the one that
// rejects what a workspace link accepts.
//
// WHAT IS ASSERTED, AND WHY EACH ONE IS HERE:
//
//   1. INSTALL      `npm install` succeeds, AND what it fetched is what this run
//                   was supposed to fetch: no nested `@raulrod/*`, no version that
//                   did not come from the tarballs. A transitive range satisfied
//                   from the registry instead would leave a route claiming to
//                   validate the working tree while half of it is a past release.
//   2. TYPES        `tsc --noEmit` in TWO resolution modes. The repo compiles
//                   everything with `moduleResolution: bundler`, which is the
//                   most forgiving mode there is; a consumer whose tsconfig says
//                   `node16`/`nodenext` resolves `exports` strictly and gets a
//                   different answer about whether a types target exists.
//   3. RUNTIME      `import { Button } from "@raulrod/ui"` under plain Node ESM,
//                   rendered with `react-dom/server`. This is what proves React
//                   arrives as a peer and the shipped JavaScript loads with no
//                   sources around it.
//   4. BUILD        `vite build` of a real page. The one thing `tsc` cannot check
//                   is whether a bundler resolves the `./styles.css` subpath, and
//                   the one thing nobody should have to check by hand is whether
//                   the CSS ends up in the output.
//   5. THEME        Chromium reads the computed values in the states of
//                   docs/theming.md §3 AND the §4 bootstrap: expected values are
//                   READ FROM THE EMITTED CSS rather than written here
//                   (ADR-005 §6.3), so a palette change cannot turn this into a
//                   second source of truth for tokens, and the stored-theme states
//                   read the attribute WITHOUT this script writing it — the §4
//                   promise is about timing, and timing is only visible before
//                   anything else has run.
//
// NOT ASSERTED HERE, ON PURPOSE. Bundle size (RRU-092/095 measure it properly
// with a cache), accessibility (jest-axe and the E2E suite cover it against the
// working tree, and RRU-071/072 own the manual review), and the stylebook. This
// script answers "does an outsider get a working install", nothing else.

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE = join(ROOT, "tools", "fixtures", "external-consumer");

/**
 * Every publishable package, DERIVED FROM THE MANIFESTS rather than written here.
 *
 * A hand-written list of packages is a list that goes stale in exactly the case
 * this script exists to cover: the day a fourth package is made public, this
 * script would keep passing on the three it was told about, and the card's
 * question ("does an outsider get a working install") would quietly stop being
 * asked about that package. The filter is the manifest's own
 * `publishConfig.access`, so a package joins by declaring that it ships.
 */
function publishablePackages() {
  const packagesDir = join(ROOT, "packages");
  const found = [];

  for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const dir = join(packagesDir, entry.name);
    const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));

    if (manifest.publishConfig?.access === "public") {
      found.push({ name: manifest.name, dir, version: manifest.version });
    }
  }

  if (found.length === 0) {
    throw new Error(
      'no package under packages/ declares `publishConfig.access: "public"`, so there is nothing to validate',
    );
  }

  return found.sort((a, b) => a.name.localeCompare(b.name));
}

const PACKAGES = publishablePackages();

/**
 * The two subpath exports a consumer imports, per README §Quick start.
 *
 * They are asserted SEPARATELY because they fail differently, and the difference
 * is the reason the bundler route exists:
 *
 *   - `@raulrod/tokens/styles.css` is one self-contained file, so it arrives
 *     whenever the subpath resolves.
 *   - `@raulrod/ui/styles.css` is a chain of ~28 RELATIVE `@import`s that the
 *     consumer's bundler has to resolve inside `node_modules`. A bundler that
 *     refuses to follow them (or a tarball that forgot to ship them) leaves the
 *     consumer with no component styles at all and no error: the page just looks
 *     unstyled. Nothing inside this repository can catch that, because here the
 *     files are always in place relative to their importer.
 *
 * The markers are PATTERNS, and the token one matches a DECLARATION rather than
 * the bare variable name on purpose: a negative probe (removing the token import
 * from the fixture) showed that the name alone also matches the `var(--rr-…)`
 * references every component stylesheet contains, so the token layer could be
 * entirely absent and this check still pass. Only the `name:` form is written by
 * the token layer.
 */
const STYLESHEETS = [
  {
    subpath: "@raulrod/tokens/styles.css",
    pattern: /--rr-color-action-primary-background\s*:/,
    why: "the token layer never reached the bundle",
  },
  {
    subpath: "@raulrod/ui/styles.css",
    pattern: /\.rr-button\b/,
    why: "the component layer never reached the bundle, or its relative @imports were not followed",
  },
];

/**
 * Tokens the assertions compare, in both themes.
 *
 * `background-default` is what the page paints and `action-primary-background` is
 * what a `Button` paints, which is the pair that would break visibly first if the
 * theme layer stopped reaching the browser.
 */
const PROBE_TOKENS = ["--rr-color-background-default", "--rr-color-action-primary-background"];

const NPM = process.platform === "win32" ? "npm.cmd" : "npm";
const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

/** Ports are ephemeral and bound to loopback: two runs must be able to overlap. */
const HOST = "127.0.0.1";

let stepNumber = 0;

function log(message = "") {
  process.stdout.write(`${message}\n`);
}

function step(message) {
  stepNumber += 1;
  log(`  ${String(stepNumber).padStart(2, "0")}. ${message}`);
}

function ok(message) {
  log(`      ✓ ${message}`);
}

function warn(message) {
  process.stderr.write(`      ! ${message}\n`);
}

/**
 * Every failure exits with the reason AND the route it happened on, because the
 * first thing a reader needs to know is which of the two installs broke.
 */
function fail(route, message, hint) {
  process.stderr.write(`\n✗ [${route}] ${message}\n`);
  if (hint) process.stderr.write(`  ${hint}\n`);
  process.stderr.write("\n");
  process.exit(1);
}

function printHelp() {
  log(`Uso: pnpm verify:external [--route <tarball|registry|both>] [--react <major|version>] [--no-browser]

  --route <r>    Which packages to install. Default: both.
  --react <r>    Which React the consumer installs. Default: 19, the major every
                 other route in this repo already exercises. A major (18) installs
                 the newest release of it; an exact version (18.2.0) pins that
                 one, which is how the DECLARED FLOOR of the ">=18.2.0" peer gets
                 tested rather than the top of the same major.
  --no-browser   skips the Chromium pass. The install, types, runtime and build
                 assertions still run; the theme is then only checked as TEXT in
                 the built CSS, which is weaker and says so.`);
}

/**
 * The React ranges the fixture will ask npm for.
 *
 * Returned rather than interpolated so that `@types/react*` cannot drift from the
 * runtime major: they version independently, so asking for `^18.0.0` types next to
 * an 18 runtime and `^19.0.0` next to a 19 runtime is the only pairing that
 * corresponds to something a consumer can actually install.
 */
function reactRanges(request) {
  const isMajor = /^\d+$/.test(request);
  const major = isMajor ? request : request.split(".")[0];
  const runtime = isMajor ? `^${major}.0.0` : request;

  return { runtime, "react-dom": runtime, typesMajor: major };
}

function parseArgs(args) {
  const options = { route: "both", browser: true, react: "19" };

  // An index loop, not `for..of`: `--route <valor>` consumes the next argument,
  // and `for..of` would then read that value as a flag of its own.
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--no-browser") {
      options.browser = false;
    } else if (arg === "--react") {
      index += 1;
      options.react = args[index];
    } else if (arg.startsWith("--react=")) {
      options.react = arg.slice("--react=".length);
    } else if (arg === "--route") {
      index += 1;
      options.route = args[index];
    } else if (arg.startsWith("--route=")) {
      options.route = arg.slice("--route=".length);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      fail("args", `Flag desconocida: ${arg}`, "Ejecuta `pnpm verify:external -- --help`.");
    }
  }

  if (!["tarball", "registry", "both"].includes(options.route)) {
    fail(
      "args",
      `--route "${options.route}" no es válida (tarball | registry | both).`,
      "Un valor ausente llega aquí también: se avisa del valor, no de la bandera.",
    );
  }

  // React versions this script knows how to ASK FOR. Not "versions that exist":
  // npm is the authority on that, and a range that resolves to nothing fails at
  // `npm install` with npm's own message, which is clearer than a guess here.
  if (!/^\d+(\.\d+){0,2}$/.test(options.react)) {
    fail(
      "args",
      `--react "${options.react}" no es válida (18 | 19 | 18.2.0).`,
      "Un valor ausente llega aquí también: se avisa del valor, no de la bandera.",
    );
  }

  return options;
}

/**
 * Runs a command and returns its output, or throws with stderr attached.
 *
 * `stdio` is piped rather than inherited so the report stays readable: a consumer
 * install that fails can print forty lines, and burying the step it belongs to in
 * the middle of them helps nobody.
 */
function run(command, args, cwd) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, NO_COLOR: "1", ADBLOCK: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.once("error", (error) =>
      rejectRun(new Error(`could not run \`${command}\`: ${error.message}`)),
    );
    child.once("close", (code) => {
      if (code === 0) {
        resolveRun({ stdout, stderr });
        return;
      }

      rejectRun(
        new Error(
          `\`${command} ${args.join(" ")}\` exited ${code}\n${(stderr || stdout).trim().slice(-2000)}`,
        ),
      );
    });
  });
}

/** `pnpm pack` for every published package, into a directory outside the repo. */
async function packInto(destination) {
  const tarballs = {};

  for (const { name, dir } of PACKAGES) {
    const out = await run(PNPM, ["pack", "--pack-destination", destination, "--json"], dir);

    let report;
    try {
      report = JSON.parse(out.stdout);
    } catch {
      fail("tarball", `pnpm pack de ${name} no devolvió JSON.`, out.stdout.slice(0, 400));
    }

    const packed = report?.filename;

    if (typeof packed !== "string" || !existsSync(packed)) {
      fail("tarball", `pnpm pack de ${name} no dejó un tarball en ${destination}.`);
    }

    tarballs[name] = packed;
  }

  return tarballs;
}

/**
 * The consumer's `package.json`.
 *
 * `"type": "module"` because that is what a modern app uses and what the packages
 * declare; React as a direct dependency because that is what a peer means.
 */
function consumerManifest(route, tarballs, react) {
  const dependencies = {
    react: react.runtime,
    "react-dom": react["react-dom"],
  };

  for (const { name } of PACKAGES) {
    dependencies[name] = route === "registry" ? "latest" : `file:${tarballs[name]}`;
  }

  return {
    name: "raulrod-external-consumer",
    private: true,
    version: "0.0.0",
    type: "module",
    dependencies,
    // The `@types/*` packages are here because every TypeScript React consumer has
    // them: leaving them out would test the fixture instead of the packages.
    devDependencies: {
      "@types/react": `^${react.typesMajor}.0.0`,
      "@types/react-dom": `^${react.typesMajor}.0.0`,
      typescript: "^5.9.3",
      vite: "^7.3.6",
    },
  };
}

/**
 * Everything the consumer's `node_modules` holds under an `@raulrod/*` name.
 *
 * Walks the whole tree instead of reading the top level, because the failure it
 * exists to catch is precisely a package at a DEEPER level.
 */
function installedRaulrodPackages(dir) {
  const found = [];

  /**
   * `scope` is the package name the current directory sits under (`""` or
   * `"@raulrod/"`), and the descent into each package's OWN `node_modules` is the
   * part that matters: a nested copy lands at
   * `node_modules/@raulrod/ui/node_modules/@raulrod/icons`, which a walk that only
   * reads the top level never sees. A negative probe caught exactly that — the
   * check reported a clean install while npm had fetched a second `@raulrod/icons`
   * from the registry to satisfy a pinned transitive range.
   */
  const walk = (modulesDir, scope) => {
    let entries;

    try {
      entries = readdirSync(modulesDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

      const full = join(modulesDir, entry.name);

      if (entry.name.startsWith("@")) {
        walk(full, `${scope}${entry.name}/`);
        continue;
      }

      const name = `${scope}${entry.name}`;

      if (name.startsWith("@raulrod/") && existsSync(join(full, "package.json"))) {
        found.push({ name, at: relative(dir, full).split(sep).join("/") });
      }

      walk(join(full, "node_modules"), "");
    }
  };

  walk(join(dir, "node_modules"), "");

  return found;
}

/**
 * The install is only the answer if it is the install we asked for.
 *
 * `pnpm pack` REWRITES `workspace:` to a concrete version, so `@raulrod/ui`'s
 * tarball asks npm for `@raulrod/icons@<that version>`. When the consumer's own
 * `file:` entry already satisfies it, npm dedupes and nothing else is fetched —
 * but the day the two versions diverge (a package bumped without the other), npm
 * is free to satisfy the transitive range FROM THE REGISTRY instead. Nothing
 * downstream would notice: the install succeeds, the types resolve, the page
 * renders, and the route claims to have validated the working tree while half of
 * it came from a published artifact.
 *
 * So the tree is inspected rather than trusted. A nested copy, or a version that
 * is not the one packed, means the tarballs were not the whole story.
 */
function checkInstallProvenance(dir, route, tarballs) {
  const problems = [];

  for (const { name, at } of installedRaulrodPackages(dir)) {
    const top = `node_modules/${name}`;
    const installed = JSON.parse(readFileSync(join(dir, at, "package.json"), "utf8")).version;

    if (at !== top) {
      problems.push(
        `${at} is a NESTED copy of ${name}@${installed}: npm fetched a second ${name} to satisfy a ` +
          "dependency range, so this install is not only what was packed",
      );
      continue;
    }

    if (route !== "tarball") continue;

    const packed = PACKAGES.find((pkg) => pkg.name === name)?.version;

    if (packed !== undefined && installed !== packed) {
      problems.push(
        `${name} installed as ${installed} while the tarball declares ${packed} (${tarballs[name]})`,
      );
    }
  }

  if (problems.length > 0) {
    fail(
      route,
      `the install did not come from what this route was supposed to install.\n  - ${problems.join("\n  - ")}`,
    );
  }
}

/**
 * Which version is actually being tested.
 *
 * The registry route answers "what does a consumer get TODAY", which is not the
 * same question as "does the working tree work". When npm resolves `latest` to a
 * version older than the one in `packages/`, the run is still valid — and it is
 * validating something other than what the reader came to check. Saying so out
 * loud is the difference between a green run that means something and one that
 * merely stops.
 */
function reportInstalledVersions(route, installed) {
  for (const { name, version: want } of PACKAGES) {
    const got = installed[name];

    if (got === want) continue;

    if (route === "registry") {
      warn(
        `${name}@latest resolved to ${got}, not the ${want} in packages/: this route tested what is ` +
          "PUBLISHED, not the working tree. Use --route=tarball to validate uncommitted work.",
      );
    } else {
      warn(`${name} installed as ${got} from a tarball built from a manifest declaring ${want}`);
    }
  }
}

/**
 * Which React actually got installed, next to the peer range that asked for it.
 *
 * The reason this exists is the same as `reportInstalledVersions`, applied to the
 * third axis: a green run that merely printed "--react=18" would prove nothing if
 * npm had resolved something else, and "React 18 works" is exactly the claim
 * RRU-132 exists to be able to make. So the version comes from
 * `node_modules/react/package.json` — the file npm wrote — and never from the
 * range this script asked for.
 *
 * The peer range is read from the INSTALLED `@raulrod/ui`, not from `packages/`,
 * because on the registry route those are two different versions and the manifest
 * a consumer reads is the published one.
 */
function reportReact(dir, react, uiManifestPath) {
  const installedPath = join(dir, "node_modules", "react", "package.json");
  const installed = JSON.parse(readFileSync(installedPath, "utf8")).version;
  const wantedMajor = react.typesMajor;

  if (!installed.startsWith(`${wantedMajor}.`)) {
    warn(
      `this run asked for React ${react.runtime} but node_modules/react is ${installed}: the result says ` +
        "nothing about the major that was requested.",
    );
  }

  const peers = JSON.parse(readFileSync(uiManifestPath, "utf8")).peerDependencies ?? {};

  return `React ${installed} (peer declarado: ${peers.react ?? "sin declarar"})`;
}

/** Installs the packages with npm, on purpose. See the header. */
async function install(dir, route, tarballs, react) {
  try {
    await run(NPM, ["install", "--no-audit", "--no-fund", "--loglevel=warn"], dir);
  } catch (error) {
    fail(route, "npm install failed.", String(error.message));
  }

  const installed = {};

  for (const { name } of PACKAGES) {
    const manifestPath = join(dir, "node_modules", name, "package.json");

    if (!existsSync(manifestPath)) {
      fail(route, `${name} is not in node_modules after a successful install.`);
    }

    installed[name] = JSON.parse(readFileSync(manifestPath, "utf8")).version;
  }

  checkInstallProvenance(dir, route, tarballs);
  reportInstalledVersions(route, installed);

  const reactSummary = reportReact(
    dir,
    react,
    join(dir, "node_modules", "@raulrod", "ui", "package.json"),
  );

  return { installed, reactSummary };
}

/**
 * Type resolution, in the two modes, using the CONSUMER'S OWN `typescript`.
 *
 * Installed rather than borrowed from this repository on purpose: the question is
 * "does a consumer's compiler understand these types", and a `tsc` pinned by the
 * repo that publishes them would answer a different one.
 */
async function typecheck(dir, route) {
  const tsc = join(dir, "node_modules", ".bin", "tsc");

  if (!existsSync(tsc)) {
    fail(route, "the consumer project has no local tsc to run.");
  }

  // Both configs, in the order of leniency: `bundler` is what this repository uses
  // everywhere, `node16` is the strict one that honours `exports` as Node does.
  for (const config of ["tsconfig.json", "tsconfig.node16.json"]) {
    try {
      await run(tsc, ["--noEmit", "-p", join(dir, config)], dir);
    } catch (error) {
      fail(
        route,
        `\`${config}\` did not compile against the installed packages.`,
        String(error.message),
      );
    }
  }
}

/**
 * Runtime proof: `node ssr-check.mjs` inside the consumer project.
 *
 * The script is a FILE in the fixture rather than a `-e` string, which is not a
 * style choice: it is reviewable exactly as a consumer would write it, it cannot
 * be broken by quoting inside a template literal, and `tsc` ignores it because it
 * lives outside `src`.
 */
async function renderOnServer(dir, route) {
  try {
    const { stdout } = await run(process.execPath, ["ssr-check.mjs"], dir);
    return stdout.trim();
  } catch (error) {
    fail(
      route,
      "the packages could not be imported and rendered under plain Node ESM.",
      String(error.message),
    );
  }
}

/**
 * Every stylesheet the build emitted, concatenated.
 *
 * All of them, not the first one: Vite splits CSS per chunk, so a page that
 * emitted two files could easily have the token layer in the second. Reading
 * `assets/*.css`[0] and calling the result "the CSS a browser receives" would
 * then report the token layer as missing — a false failure at best, and at worst
 * a false pass on whichever chunk happened to be sorted first.
 */
function builtStylesheet(dir) {
  const assets = join(dir, "dist", "assets");

  if (!existsSync(assets)) {
    fail("build", `the build produced no dist/assets in ${dir}.`);
  }

  const css = readdirSync(assets)
    .filter((file) => extname(file) === ".css")
    .sort();

  if (css.length === 0) {
    fail(
      "build",
      "the build produced no stylesheet: the CSS subpath exports did not reach the bundle.",
    );
  }

  return css.map((file) => `/* ${file} */\n${readFileSync(join(assets, file), "utf8")}`).join("\n");
}

/**
 * Minifiers remove quotes around attribute values (`[data-theme=dark]`), so the
 * theme assertions see a normalized view where every `data-theme` value is
 * quoted. This keeps the rest of the code readable without hardcoding the
 * minifier's output format.
 */
function normalizeThemeCss(css) {
  return css
    .replace(/\[\s*data-theme\s*=\s*([^"'\]\s]+?)\s*\]/g, '[data-theme="$1"]')
    .replace(
      /:root\s*:\s*not\s*\(\s*\[\s*data-theme\s*=\s*([^"'\]\s]+?)\s*\]\s*\)/g,
      ':root:not([data-theme="$1"])',
    );
}

/**
 * One `--rr-*` value inside a selector, read from text.
 *
 * The expected values come from here rather than from a constant in this file: a
 * hardcoded hex would make this script a second source of truth for the palette,
 * and it would go red the day someone changes a token (ADR-005 §6.3).
 */
function cssValue(css, selector, variable) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = new RegExp(`(?:^|[},])\\s*${escaped}\\s*(?:,[^{]*)?\\{([^}]*)\\}`, "m").exec(css);

  if (block === null) {
    return null;
  }

  const declaration = new RegExp(`${variable}\\s*:\\s*([^;]+);`).exec(block[1] ?? "");

  return declaration === null ? null : (declaration[1] ?? "").trim();
}

/** `#rrggbb` → `rgb(r, g, b)`, the form `getComputedStyle` returns. */
function toRgb(value) {
  const hex = /^#([\da-f]{6})$/i.exec(value ?? "");

  if (hex === null) return null;

  const int = Number.parseInt(hex[1], 16);

  return `rgb(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255})`;
}

/**
 * A static file server for the built page.
 *
 * `node:http` instead of `vite preview` on purpose: the point of this script is
 * that NOTHING of the design system participates in serving the page. A Vite
 * preview server would share Vite's resolution with the Vite build, and a
 * difference between them would be invisible.
 */
function serve(dir) {
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

  const server = createServer((request, response) => {
    const url = (request.url ?? "/").split("?")[0];
    const target = url === "/" ? "index.html" : url.replace(/^\//, "");
    const file = join(dir, target);

    if (!existsSync(file)) {
      response.writeHead(404).end("not found");
      return;
    }

    response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    response.end(readFileSync(file));
  });

  return new Promise((resolveServer) => {
    server.listen(0, HOST, () => {
      const { port } = server.address();
      resolveServer({ server, url: `http://${HOST}:${port}/` });
    });
  });
}

/**
 * The theme, in a real browser, in the states of docs/theming.md §3 AND §4.
 *
 * Chromium is borrowed from the workspace rather than installed: a second browser
 * download in a script about installing packages would be absurd, and the
 * repository already owns this exact revision for the E2E suite. Resolved by path
 * from `apps/playground`, because `@playwright/test` is that app's dependency.
 */
async function checkThemeInBrowser(dir, css) {
  const require = createRequire(join(ROOT, "package.json"));
  const entry = require.resolve("@playwright/test", { paths: [join(ROOT, "apps", "playground")] });
  const { chromium } = require(entry);

  const expected = {
    light: PROBE_TOKENS.map((variable) => cssValue(css, ":root", variable)),
    dark: PROBE_TOKENS.map((variable) => cssValue(css, '[data-theme="dark"]', variable)),
  };

  for (const theme of ["light", "dark"]) {
    for (const [index, value] of expected[theme].entries()) {
      if (value === null) {
        fail(
          "theme",
          `${PROBE_TOKENS[index]} is not declared in the built CSS for the ${theme} theme.`,
        );
      }
    }
  }

  const { server, url } = await serve(join(dir, "dist"));
  const browser = await chromium.launch();
  const failures = [];

  /**
   * `stored` is seeded with `addInitScript`, not set after `goto`, and that is
   * the whole point: docs/theming.md §4 promises the attribute is written by a
   * blocking script in `<head>` BEFORE the first paint. A check that set
   * `data-theme` after the page had loaded would pass with the script deleted
   * from `index.html`, because the cascade it inspects would still be right —
   * the promise being tested is the timing, and timing is only observable by
   * looking before anything else runs.
   */
  const openPage = async (colorScheme, theme, stored) => {
    const context = await browser.newContext({ colorScheme });

    if (stored !== undefined) {
      await context.addInitScript((value) => {
        localStorage.setItem("rr-theme", value);
      }, stored);
    }

    const page = await context.newPage();
    await page.goto(url, { waitUntil: "load" });

    if (theme !== null) {
      await page.evaluate((value) => {
        document.documentElement.setAttribute("data-theme", value);
      }, theme);
    }

    const probe = await page.evaluate((variables) => {
      const styles = getComputedStyle(document.documentElement);
      const app = document.querySelector(".app");
      const button = document.querySelector("button");
      return {
        attribute: document.documentElement.getAttribute("data-theme"),
        tokens: variables.map((variable) => styles.getPropertyValue(variable).trim()),
        appBackground: app === null ? null : getComputedStyle(app).backgroundColor,
        buttonBackground: button === null ? null : getComputedStyle(button).backgroundColor,
      };
    }, PROBE_TOKENS);

    await context.close();

    return probe;
  };

  // 1. System on a light OS. 2. System on a dark OS. 3. Explicit dark over a
  // light OS. 4. Explicit light over a dark OS — the precedence that the whole
  // `:root:not([data-theme="light"])` machinery exists for. 5 and 6 are the §4
  // bootstrap: a stored choice that must be on `<html>` WITHOUT this script
  // touching it, in both directions so neither branch of the guard goes unasked.
  const states = [
    {
      label: "system, light OS",
      context: "light",
      theme: null,
      stored: undefined,
      want: expected.light,
    },
    {
      label: "system, dark OS",
      context: "dark",
      theme: null,
      stored: undefined,
      want: expected.dark,
    },
    {
      label: "dark over a light OS",
      context: "light",
      theme: "dark",
      stored: undefined,
      want: expected.dark,
    },
    {
      label: "light over a dark OS",
      context: "dark",
      theme: "light",
      stored: undefined,
      want: expected.light,
    },
    {
      label: "stored dark over a light OS",
      context: "light",
      theme: null,
      stored: "dark",
      want: expected.dark,
    },
    {
      label: "stored light over a dark OS",
      context: "dark",
      theme: null,
      stored: "light",
      want: expected.light,
    },
  ];

  for (const state of states) {
    const probe = await openPage(state.context, state.theme, state.stored);

    // What `<html>` must carry is not always `state.theme`: in a stored state the
    // attribute is written by the fixture's own `<head>` script and nobody else,
    // so the expected value is the stored choice. Asserting against `theme` there
    // would compare `"dark"` against `null` and fail on a page doing exactly what
    // docs/theming.md §4 documents — a gate that cannot go green is worse than no
    // gate, because it gets ignored.
    const wantAttribute = state.theme ?? state.stored ?? null;

    if (probe.attribute !== wantAttribute) {
      failures.push(
        `${state.label}: <html> carries data-theme="${probe.attribute}" after asking for ` +
          `"${wantAttribute}"${state.stored === undefined ? "" : " (written by the fixture's <head> script, not by this check)"}`,
      );
    }

    for (const [index, value] of state.want.entries()) {
      if (probe.tokens[index] !== value) {
        failures.push(
          `${state.label}: ${PROBE_TOKENS[index]} computed as "${probe.tokens[index]}", expected "${value}"`,
        );
      }
    }

    const appBackground = probe.appBackground;
    const buttonBackground = probe.buttonBackground;
    const painted = appBackground === toRgb(state.want[0]);
    const buttonPainted = buttonBackground === toRgb(state.want[1]);

    if (!painted || !buttonPainted) {
      failures.push(
        `${state.label}: the page paints app "${appBackground}" and button "${buttonBackground}", ` +
          `expected "${toRgb(state.want[0])}" and "${toRgb(state.want[1])}" — the tokens resolved but the components are not reading them`,
      );
    }
  }

  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));

  if (failures.length > 0) {
    fail("theme", `the theme does not change as documented.\n  - ${failures.join("\n  - ")}`);
  }
}

/** Both stylesheet subpaths are in the served CSS, and neither arrived empty. */
function checkStylesheets(css) {
  return STYLESHEETS.filter(({ pattern }) => !pattern.test(css)).map(
    ({ subpath, why }) => `${subpath} is absent from the built CSS: ${why}`,
  );
}

/** The theme contract as TEXT, for `--no-browser` and as the browser's premise. */
function checkThemeInCss(css) {
  const problems = [];

  if (!/@media\s*\(prefers-color-scheme:\s*dark\)/.test(css)) {
    problems.push("no prefers-color-scheme block in the built CSS");
  }

  if (!css.includes(':root:not([data-theme="light"])')) {
    problems.push(
      'no :root:not([data-theme="light"]) guard, so explicit light cannot win over the OS',
    );
  }

  const light = cssValue(css, ":root", PROBE_TOKENS[0]);
  const dark = cssValue(css, '[data-theme="dark"]', PROBE_TOKENS[0]);

  if (light === null || dark === null) {
    problems.push(`${PROBE_TOKENS[0]} is not declared in both themes in the built CSS`);
  } else if (light === dark) {
    problems.push(
      `${PROBE_TOKENS[0]} is "${light}" in both themes, so the theme attribute changes nothing`,
    );
  }

  return problems;
}

/** One whole route: a project outside the repo, installed and exercised. */
async function runRoute(route, options) {
  const react = reactRanges(options.react);

  log(
    `\n▸ Ruta ${route}${route === "registry" ? "  (npm install @raulrod/*@latest)" : "  (pnpm pack → npm install)"}  ·  React ${react.runtime}`,
  );

  const baseDir = mkdtempSync(join(tmpdir(), `raulrod-external-${route}-`));
  log(`  proyecto desechable: ${baseDir}`);

  try {
    const tarballs = route === "tarball" ? await packInto(join(baseDir, "tarballs")) : {};

    // The consumer project is COPIED from tools/fixtures/external-consumer, so the
    // page under test is a real file that can be read, reviewed and edited as any
    // other source, not a string assembled here. Only `package.json` is generated,
    // because it is the one file whose content depends on the route.
    //
    // `dir` is a NON-EXISTENT subdirectory: `cpSync` copies `FIXTURE` to exactly
    // that path. If `dir` already existed, Node would copy `FIXTURE` *into* it,
    // producing `dir/external-consumer/...` and breaking every path below.
    const dir = join(baseDir, "consumer");
    cpSync(FIXTURE, dir, { recursive: true });
    writeFileSync(
      join(dir, "package.json"),
      `${JSON.stringify(consumerManifest(route, tarballs, react), null, 2)}\n`,
    );

    step(
      `npm install (${route === "registry" ? "desde el registro" : "desde los tarballs locales"})`,
    );
    const { installed: versions, reactSummary } = await install(dir, route, tarballs, react);
    ok(`instalado: ${PACKAGES.map(({ name }) => `${name}@${versions[name]}`).join(", ")}`);
    ok(reactSummary);

    step("tsc --noEmit (moduleResolution: bundler y node16)");
    await typecheck(dir, route);
    ok("los tipos públicos resuelven en los dos modos, con los `exports` de cada paquete");

    step("import { Button } + renderToString() bajo Node ESM");
    const html = await renderOnServer(dir, route);
    ok(`renderizado en el servidor: ${html.slice(0, 60).replace(/\s+/g, " ")}…`);

    step("vite build de la página");
    try {
      await run(join(dir, "node_modules", ".bin", "vite"), ["build"], dir);
    } catch (error) {
      fail(route, "vite build failed.", String(error.message));
    }

    const css = normalizeThemeCss(builtStylesheet(dir));
    const cssProblems = [...checkStylesheets(css), ...checkThemeInCss(css)];

    if (cssProblems.length > 0) {
      fail(route, `the built CSS is not a usable theme layer.\n  - ${cssProblems.join("\n  - ")}`);
    }

    ok(`CSS servido: ${(css.length / 1024).toFixed(1)} kB con los tres estados de tema`);

    if (options.browser) {
      step("Chromium: los seis estados de tema sobre la página construida");
      await checkThemeInBrowser(dir, css);
      ok(
        "system/light/dark resuelven por la cascada, el bootstrap de localStorage escribe el atributo " +
          "antes del paint y los componentes leen los tokens",
      );
    } else {
      warn("--no-browser: el tema solo se ha comprobado como texto en el CSS construido");
    }
  } finally {
    rmSync(baseDir, { recursive: true, force: true });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const routes = options.route === "both" ? ["tarball", "registry"] : [options.route];

  log("\nValidación de instalación externa (RRU-111)");
  log("El proyecto vive fuera del repo y no sabe nada del monorepo: sin alias,");
  log("sin tsconfig del repo y sin acceso a packages/*/src.\n");

  for (const route of routes) {
    await runRoute(route, options);
  }

  log(
    `\n✓ ${routes.length === 1 ? "Ruta" : "Rutas"} ${routes.join(", ")} verificada${routes.length === 1 ? "" : "s"} con React ${options.react}.`,
  );

  // The summary reports what ran, not what would have run. A run that skipped the
  // browser has not checked a theme in Chromium, and saying it did is exactly the
  // kind of green that teaches someone to trust a pass they did not get.
  const claims = options.browser
    ? "instala, tipos en dos resoluciones, runtime en Node, build con bundler y tema en Chromium"
    : "instala, tipos en dos resoluciones, runtime en Node, build con bundler y el tema como TEXTO en el CSS";

  log(`  ${claims}.\n`);

  // A run on one React major says nothing about another, so the scope line names
  // the one it covered. Without it, a `--react=18` green and a `--react=19` green
  // print the same sentence and the reader has to remember which one they ran.
  if (options.react !== "19") {
    log(
      `  Nota: esto cubre React ${options.react} en esta major, no la otra. Para el rango completo del peer\n` +
        "  hace falta una ejecución por major; se registra en docs/design-system-jira.md.\n",
    );
  }
}

try {
  await main();
} catch (error) {
  process.stderr.write(`\n✗ [tool] ${error instanceof Error ? error.message : String(error)}\n`);
  process.stderr.write("  Esto es un fallo de la herramienta, no del paquete validado.\n");
  if (process.env.EXTERNAL_CHECK_TRACE) {
    process.stderr.write(`${error instanceof Error ? (error.stack ?? "") : ""}\n`);
  }
  process.exit(1);
}
