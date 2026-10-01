// The public API frontier as an enforced contract (RRU-103).
//
// RRU-091 built the `exports` maps and verified them once, by hand, from a
// packed tarball in a temp directory. RRU-069 added an ESLint rule so the apps
// could not reach past them. Read literally, this card's DoD was already
// satisfied by the time it was written: the rule exists and the playground is
// clean. What it did not do is make the frontier VERIFIABLE, which is what this
// file is for — a second, independent layer that:
//
//   1. derives the frontier from the `exports` maps (the thing that actually
//      decides what a consumer can resolve) and snapshots it, so widening the
//      public API is a reviewed diff instead of a silent consequence of editing
//      a package manifest;
//   2. refuses an `exports` map that would undo itself — a wildcard subpath, an
//      `internal` subpath, or a target outside `dist/`;
//   3. checks that every `exports` target is a file the build actually emitted,
//      because `exports` is a promise about the artifact and nothing else in the
//      repo reads it;
//   4. keeps every symbol marked `/** @internal */` out of the published
//      declarations — not through the root barrel, and not through a component
//      folder's barrel either, which is how `PopoverContextValue` and
//      `TableContextValue` reached the tarball while their own JSDoc claimed the
//      opposite;
//   5. keeps `src/utils`, `src/test-support` and `src/storybook-support`
//      implementation surfaces out of every barrel, bar the three helpers that
//      are genuinely public;
//   6. asserts the apps consume the frontier and nothing else (DoD #2),
//      enumerated from the filesystem so a second consumer app in EPIC 11 is
//      covered without editing this file.
//
// Two layers on purpose, like RRU-102. `eslint.config.js` is the precise one:
// AST, fails on the offending line during `pnpm lint`, and derives its allowlist
// from the same `exports` maps read here. This one is the blunt one: text over
// manifests, barrels and app sources, runnable by a reviewer, a bisect or a
// fresh checkout without trusting a lint cache, and the only layer that can see
// a TYPE leak — `overlays-public-boundary.test.ts` is structurally blind to it,
// because a missing type export has no runtime presence to observe.
//
// The cost is stated where it exists: this is a TEXT gate. It reads `export`
// statements rather than the type graph, so it sees re-exported names and not
// the full transitive closure. That is the right level for a frontier contract,
// since a name only becomes public API by being re-exported. `readSource` and
// `listSourcePaths` come from the shared harness; the readers below are defined
// here because nothing else needs them yet — same call as `css-rules.ts`.
/// <reference types="node" />
import { access, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, URL as NodeURL } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

import { listSourcePaths, readSource } from "./test-support/source.js";

// Resolved against node:url's own `URL`, not the global one: these suites run in
// happy-dom, whose global `URL` resolves relative paths against the document
// origin and would hand `readFile` an `http:` URL (same trap as `source.ts`).
const packageDir = fileURLToPath(new NodeURL("../", import.meta.url));
const packagesDir = join(packageDir, "..");
const repoDir = join(packagesDir, "..");

/** The published packages, in the order the frontier snapshot lists them. */
const PUBLISHED_PACKAGES = ["ui", "tokens", "icons"] as const;

/**
 * The frontier, written down once.
 *
 * The ENFORCEMENT never reads this list: `eslint.config.js` and the checks below
 * both derive the allowed specifiers from the `exports` maps, so there is no
 * second place to keep in sync. The snapshot exists for the opposite reason —
 * without it, publishing a new subpath would silently widen what every app may
 * import, and the diff of a `package.json` does not look like a public API
 * change. Here it does, because the test moves with it.
 */
const EXPECTED_FRONTIER: readonly string[] = [
  "@raulrod/icons",
  "@raulrod/tokens",
  "@raulrod/tokens/styles.css",
  "@raulrod/ui",
  "@raulrod/ui/styles.css",
];

/**
 * The only names a barrel may re-export out of `src/utils/**`.
 *
 * Everything else in `src/utils` is shared implementation: the focus trap, the
 * dismissable-layer registry, the variant builder, the merge-refs helper, the
 * z-index resolver. The public code calls them, and that is the point — a
 * consumer that imported one directly would be depending on an implementation
 * detail a refactor is free to rename. `cx` and `useId` are the documented
 * exceptions (RRU-030): utilities the system publishes on purpose.
 */
const PUBLIC_UTILS: readonly string[] = ["cx", "CxValue", "useId"];

/** Folders under `src/` whose contents are implementation, never API. */
const IMPLEMENTATION_SURFACES: readonly string[] = ["utils", "test-support", "storybook-support"];

/** Reads a file as UTF-8. The seam every reader below goes through. */
type Read = (path: string) => Promise<string>;

const readHere: Read = readSource;

/** Every file under `root`, as POSIX paths relative to it, sorted. */
async function walkFiles(root: string, directory = root): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        return walkFiles(root, path);
      }
      return relative(root, path).split(sep).join("/");
    }),
  );
  return nested.flat().sort();
}

// ---------------------------------------------------------------------------
// Reading the manifests: the source of truth for the frontier
// ---------------------------------------------------------------------------

interface Manifest {
  readonly name: string;
  /** `exports` keys, verbatim, so a wildcard or an `internal` subpath is visible. */
  readonly subpaths: readonly string[];
  /** Every target, flattened: a conditional map repeats one target per condition. */
  readonly targets: readonly string[];
}

async function readManifest(packageName: string): Promise<Manifest> {
  const raw = await readFile(join(packagesDir, packageName, "package.json"), "utf8");
  const parsed: unknown = JSON.parse(raw);

  // Reading fields off `unknown` needs the guard, and a manifest that changed
  // shape should fail here naming the file, not as four undefined-property
  // errors further down.
  if (typeof parsed !== "object" || parsed === null) {
    throw new TypeError(`packages/${packageName}/package.json is not an object`);
  }
  const { name, exports: exportMap } = parsed as { name?: unknown; exports?: unknown };
  if (typeof name !== "string" || typeof exportMap !== "object" || exportMap === null) {
    throw new TypeError(
      `packages/${packageName}/package.json has no \`name\`/\`exports\` to derive a frontier from`,
    );
  }

  const subpaths = Object.keys(exportMap);
  const targets = subpaths.flatMap((subpath) => {
    const entry: unknown = (exportMap as Record<string, unknown>)[subpath];
    return (typeof entry === "string" ? [entry] : Object.values(entry as object)).filter(
      (target): target is string => typeof target === "string",
    );
  });

  return { name, subpaths, targets };
}

/** `"."` → the package itself; `"./styles.css"` → `@raulrod/ui/styles.css`. */
function entrypointFor(name: string, subpath: string): string {
  return subpath === "." ? name : `${name}/${subpath.slice(2)}`;
}

/**
 * Everything wrong with one `exports` map, as human-readable strings.
 *
 * The wildcard rule is the load-bearing one: a `"./dist/*"` subpath would make
 * every file the build emits part of the public API again — precisely the
 * frontier `exports` exists to draw (guía §24) — without changing a line of
 * this file or of `eslint.config.js`.
 */
function frontierProblems(packageName: string, manifest: Manifest): string[] {
  const problems: string[] = [];

  for (const subpath of manifest.subpaths) {
    if (subpath.includes("*")) {
      problems.push(
        `${packageName}: subpath \`${subpath}\` is a wildcard — it would expose every emitted file as public API`,
      );
    }
    if (/(^|\/)internal(\/|$)/.test(subpath)) {
      problems.push(
        `${packageName}: subpath \`${subpath}\` publishes internals; an internal must not be resolvable by a consumer`,
      );
    }
  }

  for (const target of manifest.targets) {
    if (!target.startsWith("./dist/")) {
      problems.push(
        `${packageName}: \`${target}\` is exported but lives outside \`dist/\` — the published surface is the build output`,
      );
    }
  }

  return problems;
}

// ---------------------------------------------------------------------------
// Reading the source: `@internal` markers and barrel re-exports
// ---------------------------------------------------------------------------

const DOC_BLOCK =
  /\/\*\*((?:(?!\*\/)[\s\S])*?)\*\/\s*export\s+(?:declare\s+)?(?:function|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;
const RE_EXPORT = /\bexport\s+(?:type\s+)?\{([^}]*)\}\s+from\s*["'](\.[^"']+)["']/g;

/**
 * Comments are blanked, not deleted, and every replacement keeps the original
 * length, so offsets stay valid. The `(^|[^:])` guard on line comments keeps a
 * URL's `//` from being read as a comment. Needed before any `export` is read as
 * code: several components explain in prose WHY a symbol is not public API, and
 * prose about the gate must never be able to satisfy it.
 */
function blankComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(
      /(^|[^:])\/\/[^\n]*/g,
      (match, lead: string) => lead + " ".repeat(match.length - lead.length),
    );
}

/**
 * Every symbol whose own JSDoc carries the `@internal` tag, as
 * `name → declaring file`.
 *
 * The marker is the codebase's own declaration of intent, so reading it is what
 * makes the gate agree with the code instead of with a hand-written list the
 * code could contradict.
 *
 * The tag only counts when its JSDoc block sits IMMEDIATELY before the
 * declaration, which is what makes prose immune. The first version of this
 * reader searched every doc comment for the string and looked 400 characters
 * ahead for a declaration; it failed on its own header, because this file
 * documents the tag. Adjacency is not a workaround for that, it is the correct
 * reading of the tag: it annotates the declaration it is attached to, not a
 * paragraph, so nothing else can claim it.
 */
async function findInternalSymbols(
  paths: readonly string[],
  read: Read,
): Promise<Map<string, string>> {
  const internals = new Map<string, string>();

  for (const path of paths) {
    if (!path.endsWith(".ts") && !path.endsWith(".tsx")) {
      continue;
    }
    const source = await read(path);

    for (const match of source.matchAll(DOC_BLOCK)) {
      const [, docBlock, declared] = match;
      if (docBlock === undefined || declared === undefined || !docBlock.includes("@internal")) {
        continue;
      }
      internals.set(declared, path);
    }
  }

  return internals;
}

interface ReExport {
  /** The barrel that re-exports it (`popover/index.ts`). */
  readonly barrel: string;
  /** The barrel-relative module, extension stripped (`utils/cx`, `popover/Popover`). */
  readonly module: string;
  /** What the barrel publishes, per name in the export clause. */
  readonly names: readonly PublishedName[];
}

interface PublishedName {
  /** The name in the target module — where an `@internal` marker would sit. */
  readonly local: string;
  /** The name the barrel binds it to; equals `local` when there is no alias. */
  readonly published: string;
}

/**
 * Every relative re-export of every barrel: `src/index.ts` (the public API) and
 * `src/<component>/index.ts` (the folder boundary). Both are read, because both
 * end up in the emitted declarations while only the first is covered by what the
 * `@internal` JSDoc promises.
 */
async function readBarrelReExports(paths: readonly string[], read: Read): Promise<ReExport[]> {
  const barrels = paths.filter((path) => path === "index.ts" || path.endsWith("/index.ts"));
  const reExports: ReExport[] = [];

  for (const barrel of barrels) {
    const source = blankComments(await read(barrel));

    for (const match of source.matchAll(RE_EXPORT)) {
      const [, nameList, specifier] = match;
      if (nameList === undefined || specifier === undefined) {
        continue;
      }
      const module = specifier.replace(/^\.\//, "").replace(/\.(?:js|mjs|cjs|ts|tsx)$/, "");
      const names = nameList
        .split(",")
        .map((entry) => entry.trim().replace(/^type\s+/, ""))
        .filter((entry) => entry.length > 0)
        // Both names are kept because they answer different questions.
        // `Local as Published` is published AS `Published`, so that is the name
        // the public-utility allowlist has to judge; but `Local` is where an
        // `@internal` marker was declared, so it is the name that decides
        // whether an internal symbol is escaping. Keeping only one of the two
        // lets an alias launder a leak past this gate.
        .map((entry): PublishedName => {
          const [local = "", alias] = entry.split(/\s+as\s+/);
          return { local, published: alias ?? local };
        });

      reExports.push({ barrel, module, names });
    }
  }

  return reExports;
}

/** `"utils/cx"` → `"utils"`; `"popover/Popover"` → null (a component module). */
function implementationSurfaceOf(module: string): string | null {
  const [folder] = module.split("/");
  return IMPLEMENTATION_SURFACES.find((surface) => surface === folder) ?? null;
}

/** Everything a barrel publishes that must not escape, as readable findings. */
function barrelLeaks(
  reExports: readonly ReExport[],
  internals: ReadonlyMap<string, string>,
): string[] {
  const allowed = new Set(PUBLIC_UTILS);
  const leaks: string[] = [];

  for (const { barrel, module, names } of reExports) {
    for (const { local, published } of names) {
      const declaredIn = internals.get(local);
      if (declaredIn !== undefined) {
        const as = published === local ? "" : ` as \`${published}\``;
        leaks.push(
          `\`${local}\`${as} is marked \`@internal\` in ${declaredIn} but is re-exported by ${barrel}`,
        );
        continue;
      }
      if (implementationSurfaceOf(module) === "utils" && !allowed.has(published)) {
        leaks.push(
          `${barrel} re-exports \`${published}\` from ${module}, which is internal implementation`,
        );
      }
    }
  }

  return leaks;
}

/** Barrels that re-export the test or Storybook harnesses, which publish nothing. */
function harnessLeaks(reExports: readonly ReExport[]): string[] {
  const leaks: string[] = [];

  for (const { barrel, module } of reExports) {
    const surface = implementationSurfaceOf(module);
    if (surface !== null && surface !== "utils") {
      leaks.push(
        `${barrel} re-exports from \`${module}\`; \`${surface}/\` supports only the test and Storybook harnesses`,
      );
    }
  }

  return leaks;
}

// ---------------------------------------------------------------------------
// Reading the apps: DoD #2
// ---------------------------------------------------------------------------

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts", ".js", ".mjs", ".cjs"] as const;
const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "storybook-static",
  ".turbo",
  "coverage",
  "playwright-report",
  "test-results",
]);
/** `import "x"`, `from "x"` and `import("x")` — the three shapes a specifier takes. */
const SPECIFIER = /\b(?:from\s*|import\s*|import\s*\(\s*)["']([^"']+)["']/g;

interface AppImport {
  readonly file: string;
  readonly specifier: string;
}

async function sourceFilesIn(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name);
      if (entry.isDirectory()) {
        return IGNORED_DIRECTORIES.has(entry.name) ? [] : sourceFilesIn(path);
      }
      return SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension)) ? [path] : [];
    }),
  );
  return nested.flat().sort();
}

/**
 * Every `@raulrod/*` specifier the apps import, with the file it is in.
 *
 * Filesystem enumeration on purpose (the argument in `listSourcePaths`): this
 * closes DoD #2 for the playground, and EPIC 11 will add consumer apps. A list
 * of app paths written by hand would keep passing while covering less — the
 * failure mode that makes a gate decorative.
 *
 * `labelRoot` is separate from the scanned directory because the reported paths
 * must read repo-relative for the real scan (`apps/playground/...`) while a
 * probe's fixture lives outside the repo entirely. It is a required argument so
 * neither call site inherits that assumption by accident.
 */
async function readAppImports(appsDir: string, labelRoot: string): Promise<AppImport[]> {
  const apps = (await readdir(appsDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const imports: AppImport[] = [];

  for (const file of (
    await Promise.all(apps.map((app) => sourceFilesIn(join(appsDir, app))))
  ).flat()) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(SPECIFIER)) {
      const specifier = match[1];
      if (specifier !== undefined && specifier.startsWith("@raulrod/")) {
        imports.push({ file: relative(labelRoot, file).split(sep).join("/"), specifier });
      }
    }
  }

  return imports;
}

/**
 * The app imports a consumer could not resolve — one human-readable line each.
 *
 * A predicate shared by the real gate and its probe on purpose. The probe has to
 * run this logic rather than a re-implementation of it, or it would only prove
 * that a copy in a test file works.
 */
function unresolvableAppImports(
  imports: readonly AppImport[],
  allowed: ReadonlySet<string>,
): string[] {
  return imports
    .filter(({ specifier }) => !allowed.has(specifier))
    .map(
      ({ file, specifier }) =>
        `${file} imports \`${specifier}\`, which no \`exports\` map declares — a consumer could not resolve it`,
    );
}

// ---------------------------------------------------------------------------
// The real repository
// ---------------------------------------------------------------------------

const manifests = await Promise.all(PUBLISHED_PACKAGES.map(readManifest));
const sourcePaths = await listSourcePaths();

/** The allowed app-facing specifiers, derived from the manifests. */
const frontier = manifests
  .flatMap((manifest) => manifest.subpaths.map((subpath) => entrypointFor(manifest.name, subpath)))
  .sort();

const [internals, reExports, appImports] = await Promise.all([
  findInternalSymbols(sourcePaths, readHere),
  readBarrelReExports(sourcePaths, readHere),
  readAppImports(join(repoDir, "apps"), repoDir),
]);

describe("the `exports` maps ARE the frontier (RRU-103, DoD #1)", () => {
  it("reads three published packages with a non-empty frontier", () => {
    // Anti-vacuity, first: every other assertion here is "this is absent" or
    // "this equals a list", and empty inputs satisfy all of them.
    expect(manifests).toHaveLength(3);
    expect(frontier.length).toBeGreaterThanOrEqual(3);
    expect(internals.size, "the `@internal` scan read no markers").toBeGreaterThanOrEqual(8);
    expect([...internals.keys()]).toEqual(
      expect.arrayContaining(["sanitizeId", "DialogContextValue"]),
    );
  });

  it("derives exactly the documented frontier", () => {
    expect(frontier).toEqual([...EXPECTED_FRONTIER]);
  });

  it("declares no subpath that would re-expose the build or the internals", () => {
    const problems = manifests.flatMap((manifest) => frontierProblems(manifest.name, manifest));
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("resolves every exported target to a file the build actually emitted", async () => {
    // `exports` is a promise about the artifact and nothing else reads it. If
    // `copy-css.mjs` or the `tsc` output layout moves, this is the check that
    // notices — here, instead of in a consumer's bundler.
    const missing: string[] = [];

    for (const manifest of manifests) {
      const packageDir = join(packagesDir, manifest.name.replace("@raulrod/", ""));
      for (const target of manifest.targets) {
        const path = join(packageDir, target);
        const exists = await access(path).then(
          () => true,
          () => false,
        );
        if (!exists) {
          missing.push(
            `${manifest.name}: \`${target}\` is declared in \`exports\` but is not in the build output`,
          );
        }
      }
    }

    expect(missing, missing.join("\n")).toEqual([]);
  });
});

describe("nothing internal is reachable through a barrel (guía §24)", () => {
  it("reads a real, non-trivial barrel graph", () => {
    expect(reExports.length, "no relative re-export was read").toBeGreaterThan(30);
    expect(reExports.some(({ barrel }) => barrel === "index.ts")).toBe(true);
  });

  it("keeps every `@internal` symbol out of every barrel", () => {
    // Stronger than "out of the root barrel", because that is all the
    // `@internal` JSDoc promises and it was not enough: `popover/index.ts` and
    // `table/index.ts` re-exported their context types, so `dist/popover/
    // index.d.ts` and `dist/table/index.d.ts` shipped `PopoverContextValue` and
    // `TableContextValue` — internal by every written signal, published anyway.
    const leaks = barrelLeaks(reExports, internals);
    expect(leaks, leaks.join("\n")).toEqual([]);
  });

  it("keeps the implementation surfaces out of every barrel but three helpers", () => {
    expect(PUBLIC_UTILS).toContain("cx");
    const leaks = barrelLeaks(reExports, new Map());
    expect(leaks, leaks.join("\n")).toEqual([]);
  });

  it("never re-exports the test or Storybook harnesses", () => {
    const leaks = harnessLeaks(reExports);
    expect(leaks, leaks.join("\n")).toEqual([]);
  });
});

describe("the apps consume the frontier and nothing else (RRU-103, DoD #2)", () => {
  it("found the apps to check", () => {
    // `readAppImports` returns `[]` if the apps directory moved, and an empty
    // list passes every subset assertion below.
    expect(appImports.length, "no `@raulrod/*` import was found in apps/").toBeGreaterThanOrEqual(
      5,
    );
    expect([...new Set(appImports.map(({ file }) => file.split("/")[1] ?? ""))].sort()).toEqual([
      "playground",
      "storybook",
    ]);
  });

  it("imports only specifiers the `exports` maps declare public", () => {
    const violations = unresolvableAppImports(appImports, new Set(frontier));
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("keeps the playground off the internals", () => {
    // Named on purpose so a failure says WHICH app broke the promise: DoD #2 is
    // about the playground, while the rule above is deliberately broader.
    const playground = appImports.filter(({ file }) => file.startsWith("apps/playground/"));
    expect(playground.length, "the playground imports nothing from the DS").toBeGreaterThanOrEqual(
      3,
    );
    for (const { specifier } of playground) {
      expect(frontier, `\`${specifier}\` is outside the declared frontier`).toContain(specifier);
    }
  });
});

// ---------------------------------------------------------------------------
// Negative probes — ADR-005 §5
// ---------------------------------------------------------------------------

// A gate that cannot fail is decoration. Each probe writes a fixture and audits
// it with the SAME reader used against the real repository above, so the probe
// exercises the production code path instead of a re-implementation of it. The
// last probe is COMPLIANT: without it, a reader that flagged everything would
// pass this block.
const probeDirectory = await mkdtemp(join(tmpdir(), "rr-api-boundary-"));

afterAll(async () => {
  await rm(probeDirectory, { recursive: true, force: true });
});

async function writeFixture(
  name: string,
  files: Readonly<Record<string, string>>,
): Promise<string> {
  const root = join(probeDirectory, name);
  for (const [path, contents] of Object.entries(files)) {
    const file = join(root, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, contents, "utf8");
  }
  return root;
}

const readerFor =
  (root: string): Read =>
  (path) =>
    readFile(join(root, path), "utf8");

describe("the contract is not a no-op (negative probes, ADR-005)", () => {
  it("flags a wildcard subpath that would re-expose the whole build", () => {
    const problems = frontierProblems("@raulrod/probe", {
      name: "@raulrod/probe",
      subpaths: [".", "./dist/*"],
      targets: ["./dist/index.js", "./dist/index.d.ts"],
    });

    expect(problems.join("\n")).toContain("is a wildcard");
  });

  it("flags an `internal` subpath published as if it were API", () => {
    const problems = frontierProblems("@raulrod/probe", {
      name: "@raulrod/probe",
      subpaths: [".", "./internal/*"],
      targets: ["./dist/index.js", "./dist/internal/thing.js"],
    });

    expect(problems.join("\n")).toContain("publishes internals");
  });

  it("flags a target outside `dist/`", () => {
    const problems = frontierProblems("@raulrod/probe", {
      name: "@raulrod/probe",
      subpaths: ["."],
      targets: ["./dist/index.js", "./src/index.ts"],
    });

    expect(problems.join("\n")).toContain("lives outside `dist/`");
  });

  it("flags a barrel that re-exports an `@internal` symbol", async () => {
    const root = await writeFixture("internal-leak", {
      "index.ts": 'export { cx, mergeRefs } from "./utils/index.js";\n',
      "utils/index.ts": [
        'export { cx } from "./cx.js";',
        'export { mergeRefs } from "./merge-refs.js";',
        "",
      ].join("\n"),
      "utils/merge-refs.ts": [
        "/**",
        " * @internal not exported from any barrel.",
        " */",
        "export function mergeRefs() {}",
      ].join("\n"),
    });

    const paths = await walkFiles(root);
    const [probeInternals, probeReExports] = await Promise.all([
      findInternalSymbols(paths, readerFor(root)),
      readBarrelReExports(paths, readerFor(root)),
    ]);

    expect([...probeInternals.keys()]).toEqual(["mergeRefs"]);
    // The leak is only caught when the internal set is passed in, which is why
    // the production assertion combines the two readers rather than either alone.
    expect(barrelLeaks(probeReExports, probeInternals).join("\n")).toContain(
      "`mergeRefs` is marked `@internal`",
    );
    // And the same barrel leaks `mergeRefs` as implementation even if the marker
    // is forgotten, because it comes out of `utils/`.
    expect(barrelLeaks(probeReExports, new Map()).join("\n")).toContain(
      "is internal implementation",
    );
  });

  it("does not let an alias launder an `@internal` symbol into the public API", async () => {
    // `mergeRefs as cx` publishes a name that IS public while carrying a symbol
    // that is NOT. Judging only the published name is the mistake this pins
    // down: the barrel would look clean while shipping an internal.
    const root = await writeFixture("aliased-leak", {
      "index.ts": 'export { cx } from "./utils/index.js";\n',
      "utils/index.ts": 'export { mergeRefs as cx } from "./merge-refs.js";\n',
      "utils/merge-refs.ts": [
        "/**",
        " * @internal re-exported under a public alias.",
        " */",
        "export function mergeRefs() {}",
      ].join("\n"),
    });

    const paths = await walkFiles(root);
    const [probeInternals, probeReExports] = await Promise.all([
      findInternalSymbols(paths, readerFor(root)),
      readBarrelReExports(paths, readerFor(root)),
    ]);

    expect(barrelLeaks(probeReExports, probeInternals).join("\n")).toContain(
      "`mergeRefs` as `cx` is marked `@internal`",
    );
  });

  it("reads a marker only when it annotates a declaration, never from prose", async () => {
    // Regression, from a bug this file actually had. The first reader scanned
    // every doc comment for the tag string and looked ahead for a declaration,
    // so it failed on its own header — which documents the tag. A comment that
    // merely TALKS about the marker must not register a symbol, and the
    // declaration that follows prose must still be read normally.
    const root = await writeFixture("marker-prose", {
      "index.ts": [
        "/**",
        " * Nothing marked `@internal` lives here; the tag appears in this prose.",
        " */",
        'export { cx } from "./utils/cx.js";',
        "",
      ].join("\n"),
      "utils/cx.ts": "export function cx() {}\n",
    });

    const paths = await walkFiles(root);
    const [probeInternals, probeReExports] = await Promise.all([
      findInternalSymbols(paths, readerFor(root)),
      readBarrelReExports(paths, readerFor(root)),
    ]);

    expect([...probeInternals.keys()]).toEqual([]);
    // The prose also quotes an export clause; blanking comments keeps the barrel
    // reader from believing it and reporting a phantom module.
    expect(probeReExports).toEqual([
      { barrel: "index.ts", module: "utils/cx", names: [{ local: "cx", published: "cx" }] },
    ]);
    expect(barrelLeaks(probeReExports, probeInternals)).toEqual([]);
  });

  it("flags a barrel that re-exports the test harness", async () => {
    const root = await writeFixture("harness-leak", {
      "index.ts": 'export { Placeholder } from "./storybook-support/index.js";\n',
      "storybook-support/index.ts": "export function Placeholder() {}\n",
    });

    const paths = await walkFiles(root);
    const leaks = harnessLeaks(await readBarrelReExports(paths, readerFor(root)));
    expect(leaks.join("\n")).toContain("supports only the test and Storybook harnesses");
  });

  it("flags app imports that no `exports` map declares, deep subpaths included", async () => {
    const root = await writeFixture("app-import", {
      "playground/src/app.tsx": [
        'import { Button } from "@raulrod/ui";',
        'import "@raulrod/ui/dist/styles.css";',
        'import { mergeRefs } from "@raulrod/ui/utils/merge-refs.js";',
      ].join("\n"),
    });

    const violations = unresolvableAppImports(await readAppImports(root, root), new Set(frontier));

    // Two distinct failures, not one: a deep subpath is the mistake this gate
    // exists to catch, and a reach into `dist/` is a second way to make the same
    // mistake. Both are named so a regression in either is visible.
    expect(violations).toHaveLength(2);
    expect(violations.join("\n")).toContain(
      "playground/src/app.tsx imports `@raulrod/ui/utils/merge-refs.js`",
    );
    expect(violations.join("\n")).toContain(
      "playground/src/app.tsx imports `@raulrod/ui/dist/styles.css`",
    );
  });

  it("does not flag a compliant barrel, manifest or app import", async () => {
    // The control for every probe above.
    expect(
      frontierProblems("@raulrod/probe", {
        name: "@raulrod/probe",
        subpaths: [".", "./styles.css"],
        targets: ["./dist/index.js", "./dist/styles.css"],
      }),
    ).toEqual([]);

    const root = await writeFixture("compliant", {
      "index.ts": 'export { cx } from "./utils/index.js";\n',
      "utils/index.ts": 'export { cx } from "./cx.js";\n',
      "utils/cx.ts": "export function cx() {}\n",
      "playground/src/app.tsx": 'import { Button } from "@raulrod/ui";\n',
    });

    const paths = await walkFiles(root);
    const [probeInternals, probeReExports] = await Promise.all([
      findInternalSymbols(paths, readerFor(root)),
      readBarrelReExports(paths, readerFor(root)),
    ]);

    expect(probeInternals.size).toBe(0);
    expect(barrelLeaks(probeReExports, probeInternals)).toEqual([]);
    expect(harnessLeaks(probeReExports)).toEqual([]);
    expect(unresolvableAppImports(await readAppImports(root, root), new Set(frontier))).toEqual([]);
  });
});
