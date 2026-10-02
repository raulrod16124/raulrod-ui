/// <reference types="node" />
// Installation contract of the playground (RRU-110).
//
// §25 asks the playground to validate the INSTALLATION of the packages, and
// until this spec existed no gate in the repo answered that question. The gap
// is subtler than it looks: the app depends on `workspace:*`, which links the
// packages by PATH in the working tree. Everything the app imports therefore
// resolves out of `dist/` on this checkout — including files that `npm publish`
// would never ship. A consumer installing from the registry could get an
// `exports` target that resolves here and 404s there, and every other gate
// would stay green:
//
//   * RRU-103's `public-api-boundary.test.ts` asks "does each `exports` target
//     exist in `dist/`?" — a question about the working tree;
//   * `consumer-contract.test.ts` asks "does a consumer import every public
//     entrypoint?" — also about the working tree, and about SPECIFIERS rather
//     than files;
//   * `size-limit` and the bundle baseline measure what a bundler resolves
//     locally, again with no tarball anywhere in the picture.
//
// So this spec is the only one that packs the tarball and asks what npm would
// actually upload. It is the executable form of the card's first DoD line,
// "Instalada como paquete (no por path interno)": the second half of that line
// ("not by internal path") is RRU-103's rule, this file covers the first half.
// Installing those tarballs into a throwaway project is RRU-111's job, done by
// `tools/external-install-check.mjs` (needs the network and a browser); what is
// verifiable offline and on every commit is exactly what this file asserts, plus
// the four artifact gates RRU-111 added at the bottom of it.
//
// Four properties carry the whole spec:
//
//   1. DERIVED, NEVER HAND-WRITTEN. The package set comes from walking
//      `packages/` and keeping what declares itself publishable, and the file
//      list comes from the packer itself. A list written here would state the
//      same fact as the manifests and drift away from them in silence — the
//      RRU-103 lesson.
//   2. FAIL LOUD, NEVER NARROWER. A manifest that cannot be read, a `pack` that
//      fails, a derivation that comes back empty: each aborts with its own
//      reason instead of quietly reducing the set of things to check. A gate
//      that checks less without saying so is worse than no gate.
//   3. EVERY DERIVATION IS EVALUATED INSIDE A TEST, never at collection time.
//      `it.each(derive())` throws before the runner has a name to print, which
//      is why the sibling spec substitutes a sentinel row; iterating inside the
//      body keeps the failure inside the assertion that caused it.
//   4. THE TARBALL IS THE ONE THAT SHIPS, not a stand-in for it. RRU-111
//      measured the difference: `npm pack` copies `"@raulrod/icons":
//      "workspace:*"` into the tarball, which no consumer's npm can resolve,
//      while `pnpm pack` rewrites it to a real version — and the rewrite is
//      what `changeset publish` relies on, because changesets resolves the
//      monorepo with `@manypkg/find-root`, which reports a pnpm workspace from
//      the presence of `pnpm-workspace.yaml` (the root `packageManager` field
//      is what stops pnpm from running at all, not what chooses the tool).
//      So the packing here is pnpm's, and the ranges gate at the bottom guards
//      that chain instead of assuming it.
//
// The React assertions are the other half of an install: `@raulrod/ui` renders
// React, so React has to arrive as a PEER. A package listing it as a hard
// dependency installs a second React into the consumer's tree, and the failure
// mode — invalid-hook-call errors from two reconcilers — appears far away from
// the manifest that caused it.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { builtinModules } from "node:module";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

/** Repo root, three levels up from `apps/playground/src/`. */
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
/** This app's manifest — the consumer side of every install assertion. */
const APP_MANIFEST = join(REPO_ROOT, "apps", "playground", "package.json");

/**
 * Files npm includes whether or not `files` lists them — but only WHEN THEY EXIST
 * in the package directory. npm force-includes `package.json` and the `main`
 * target, and picks up README/LICENSE/CHANGELOG if it finds them at the package
 * root; it does not climb the tree looking for them, which is why the LICENSE at
 * the repo root ships to nobody and every package needs its own copy.
 *
 * So this exception only excuses these files from the `files` projection; it does
 * not claim they are there. Whether a package actually ships its license is a
 * different question, asked of the tarball by the RRU-112 block at the bottom.
 */
const ALWAYS_PUBLISHED = ["package.json", "README", "LICENSE", "CHANGELOG"];

/**
 * Mistakes worth naming in the failure message: the generic projection check
 * reports all of them as "not listed in `files`", which is true and useless.
 */
const PUBLISH_HAZARDS: readonly { label: string; pattern: RegExp }[] = [
  { label: "a spec", pattern: /(^|\/)[^/]*\.test\.[jt]sx?$/ },
  { label: "a story", pattern: /(^|\/)[^/]*\.stories\.[jt]sx?$/ },
  { label: "a TypeScript config", pattern: /(^|\/)tsconfig[^/]*\.json$/ },
  { label: "a build script", pattern: /(^|\/)tools\// },
  { label: "a fixture suite", pattern: /(^|\/)e2e\// },
  { label: "a dependency tree", pattern: /(^|\/)node_modules\// },
  { label: "a task cache", pattern: /(^|\/)\.turbo\// },
  { label: "a test report", pattern: /(^|\/)playwright-report\// },
];

/** React must not be duplicated across a consumer's tree: it arrives as a peer. */
const REACT_PACKAGES = ["react", "react-dom"];

interface PackageManifest {
  name?: string;
  version?: string;
  type?: string;
  sideEffects?: unknown;
  main?: string;
  types?: string;
  files?: string[];
  exports?: Record<string, unknown>;
  license?: string;
  repository?: { type?: string; url?: string; directory?: string };
  homepage?: string;
  bugs?: { url?: string };
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageManager?: string;
  publishConfig?: { access?: string };
}

interface PublishedPackage {
  /** Path relative to the repo root, e.g. `packages/ui`. */
  dir: string;
  name: string;
  manifest: PackageManifest;
}

function readManifest(path: string): PackageManifest {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as PackageManifest;
  } catch (error) {
    throw new Error(`cannot read ${path} as JSON: ${String(error)}`);
  }
}

/**
 * Every package under `packages/` that declares itself publishable.
 *
 * The filter is the manifest's own `publishConfig.access`, so a package joins
 * this contract by declaring that it ships and leaves it by undeclaring that.
 * Nothing here throws: an empty result is reported by the first test below, in
 * a sentence that names the cause, instead of aborting the run.
 */
function publishedPackages(): PublishedPackage[] {
  const packagesDir = join(REPO_ROOT, "packages");
  const found: PublishedPackage[] = [];

  for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const manifest = readManifest(join(packagesDir, entry.name, "package.json"));

    if (manifest.publishConfig?.access === "public") {
      found.push({
        dir: `packages/${entry.name}`,
        name: manifest.name ?? `packages/${entry.name} (unnamed)`,
        manifest,
      });
    }
  }

  return found.sort((a, b) => a.dir.localeCompare(b.dir));
}

/**
 * Runs an inspection over every published package and returns one line per
 * PROBLEM, prefixed with the package it belongs to. Returning problems instead
 * of throwing on the first one is deliberate: a broken manifest is usually
 * wrong in more than one way, and a gate that reports one fault per run teaches
 * people to re-run it.
 */
function inspectPublished(inspect: (pkg: PublishedPackage) => string[]): string[] {
  return publishedPackages().flatMap((pkg) =>
    inspect(pkg).map((problem) => `${pkg.dir}: ${problem}`),
  );
}

/**
 * One packed tarball: what it ships, and where its contents were extracted so a
 * test can read them.
 *
 * The extraction exists for the RRU-111 gates, which cannot be answered by a
 * file list: whether an import inside the shipped JavaScript is declared, or what
 * values the shipped CSS carries, are questions about CONTENT. `dist/` in the
 * working tree would answer them almost — and that is the trap this suite exists
 * to avoid, because `dist/` is also what a `workspace:*` link resolves, so a
 * wrong range there never shows up.
 */
interface PackedArtifact {
  /** Paths the packer reported, POSIX-style and relative, e.g. `dist/index.js`. */
  files: string[];
  /** Absolute path of the directory the tarball was extracted into. */
  dir: string;
}

/**
 * Per-run scratch directory for the tarballs.
 *
 * Outside the repo on purpose: packing writes files, and the repo is covered by
 * `files`, ESLint and Prettier, none of which should ever see them. Removed in
 * `afterAll`, and the path is printed by the pack failure below so a leaked
 * directory is traceable instead of mysterious.
 */
let scratchDir = "";

/** `pnpm` is a shell script on POSIX and a `.cmd` on Windows (RRU-125 precedent). */
const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

/** Packing is the expensive step here, and it answers the same question twice. */
const packCache = new Map<string, PackedArtifact>();

/**
 * The tarball a consumer installs: packed with pnpm, because that is the tool
 * `changeset publish` uses, and unpacked so its contents can be read.
 *
 * Three details are load-bearing:
 *
 *   * `--pack-destination` keeps the `.tgz` out of the package directory. npm
 *     writes it into the cwd otherwise, where it would be picked up by the next
 *     pack, by `files`, or by a stray commit.
 *   * The reported file list is what the packer says it put in, not a directory
 *     walk, so the assertions compare npm's own answer with the manifests
 *     instead of re-deriving it.
 *   * Failures carry stderr. An error here is a broken package, not a broken
 *     test, and a bare "exit status 1" would hide which one.
 */
function packedArtifact(pkg: PublishedPackage): PackedArtifact {
  const cached = packCache.get(pkg.dir);

  if (cached !== undefined) {
    return cached;
  }

  if (scratchDir === "") {
    // Without this, `join("", dir)` is a RELATIVE path and the pack writes inside
    // the working tree — in a directory shaped like `packages_ui` that no
    // `.gitignore` covers. A negative probe in this very file created exactly
    // that, which is the reason the case is closed here instead of trusted.
    throw new Error(
      `cannot pack ${pkg.dir}: the scratch directory was never created (beforeAll did not run)`,
    );
  }

  const destination = join(scratchDir, pkg.dir.replace(/[\\/]/g, "_"));
  mkdirSync(destination, { recursive: true });

  let tarball: string;
  let files: string[];

  try {
    const stdout = execFileSync(PNPM, ["pack", "--pack-destination", destination, "--json"], {
      cwd: join(REPO_ROOT, pkg.dir),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
    });

    const report = JSON.parse(stdout) as { filename?: string; files?: { path?: string }[] };

    if (report === null || typeof report !== "object" || !Array.isArray(report.files)) {
      throw new Error("pnpm pack --json reported no file list");
    }

    const filename = report.filename ?? "";
    // pnpm reports the tarball it wrote as an absolute path; npm reported a bare
    // name. Both are accepted so the gate keeps working whichever packer produces
    // it, and a path that points at nothing is an error rather than a later
    // confusing "cannot unpack".
    const packed =
      filename === "" ? "" : isAbsolute(filename) ? filename : join(destination, filename);

    if (packed === "" || !existsSync(packed)) {
      throw new Error(`pnpm pack reported "${filename}", which is not in ${destination}`);
    }

    files = report.files.map((file) => file.path ?? "");
    tarball = packed;
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? "";
    throw new Error(`pnpm pack failed in ${pkg.dir}: ${String(error)}\n${stderr}`);
  }

  const extracted = join(destination, "extracted");
  mkdirSync(extracted, { recursive: true });

  try {
    execFileSync("tar", ["-xzf", tarball, "-C", extracted], { stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? "";
    throw new Error(`could not unpack ${tarball}: ${String(error)}\n${stderr}`);
  }

  const artifact: PackedArtifact = { files, dir: join(extracted, "package") };
  packCache.set(pkg.dir, artifact);

  return artifact;
}

/** The file list of the packed tarball, for the assertions about `files`. */
function packedFiles(pkg: PublishedPackage): string[] {
  return packedArtifact(pkg).files;
}

/**
 * The contents of one file inside the tarball.
 *
 * Fails loud rather than returning an empty string: a gate that reads a missing
 * file and finds nothing to complain about is exactly the vacuous gate ADR-005 §5
 * exists to prevent.
 */
function packedText(pkg: PublishedPackage, path: string): string {
  const full = join(packedArtifact(pkg).dir, path);

  if (!existsSync(full)) {
    throw new Error(`${path} is not in the ${pkg.dir} tarball, so there is nothing to read`);
  }

  return readFileSync(full, "utf8");
}

/**
 * The manifest AS PUBLISHED — read from inside the tarball, not from
 * `packages/<name>/package.json`.
 *
 * The difference is the whole point: the packer rewrites the manifest it ships,
 * so the file in the working tree and the file a consumer reads are not the same
 * file. Asserting against the source manifest would be asserting about the input
 * of the transformation instead of its output.
 */
function packedManifest(pkg: PublishedPackage): PackageManifest {
  return readManifest(join(packedArtifact(pkg).dir, "package.json"));
}

/**
 * Every path an `exports` map can point at, walking condition objects and
 * arrays. A consumer resolves one of these strings or nothing, so an `exports`
 * entry whose string never reaches the tarball is a 404 at install time.
 *
 * Paths are normalized and deduplicated on the way out, because a manifest
 * says the same file in three different ways (`./dist/index.js` in `exports`,
 * `./dist/index.js` again in `main`, and again in `types`) while npm reports it
 * once as `dist/index.js`. Comparing the raw strings would report one missing
 * file three times and never match a real one.
 */
function exportTargets(exportsMap: Record<string, unknown>): string[] {
  const targets = new Set<string>();

  const walk = (node: unknown): void => {
    if (typeof node === "string") {
      targets.add(node.replace(/^\.\//, ""));
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
      return;
    }

    if (node !== null && typeof node === "object") {
      for (const value of Object.values(node)) {
        walk(value);
      }
    }
  };

  walk(exportsMap);

  return [...targets].sort();
}

/** `files` entries are paths or directory prefixes, the way npm reads them. */
function isDeclaredInFiles(path: string, files: readonly string[]): boolean {
  const normalized = path.replace(/^\.\//, "");

  return files.some((entry) => {
    const prefix = entry.replace(/^\.\//, "").replace(/\/$/, "");
    return normalized === prefix || normalized.startsWith(`${prefix}/`);
  });
}

/**
 * Ranges a consumer's package manager cannot fetch from a registry (RRU-111).
 *
 * `workspace:` and `link:` are pnpm workspace protocols, `file:` is a path on the
 * publisher's disk. Every one of them is legitimate in a monorepo manifest and
 * fatal in an installed package: `npm install` answers `EUNSUPPORTEDPROTOCOL` to
 * all three. The registry copy of `@raulrod/ui@0.1.2` is the control for this
 * list — it carries `"@raulrod/icons": "0.1.2"`, not `"workspace:*"`, because
 * the packer rewrote it, and nothing but a gate keeps that true.
 */
const NON_REGISTRY_RANGE = /^(workspace|link|file):|^(git|git\+|https?|github):/i;

/**
 * Package names the runtime may import: dependencies and peers of the packed
 * manifest, plus what Node resolves without a manifest at all.
 *
 * `devDependencies` are excluded on purpose. They are the answer to "what did we
 * compile against", and a component that imports one at runtime is precisely the
 * bug this gate exists for: the build passes, the workspace install works, and
 * the consumer gets `ERR_MODULE_NOT_FOUND` from a package nobody declared.
 */
function declaredRuntimePackages(manifest: PackageManifest): Set<string> {
  const names = new Set(builtinModules);

  for (const group of [manifest.dependencies, manifest.peerDependencies]) {
    for (const name of Object.keys(group ?? {})) {
      names.add(packageNameOf(name));
    }
  }

  return names;
}

/** `react/jsx-runtime` is the package `react`; the rest of the specifier is noise. */
function packageNameOf(specifier: string): string {
  if (specifier.startsWith("@")) return specifier.split("/").slice(0, 2).join("/");

  return specifier.split("/")[0] ?? specifier;
}

/**
 * Every bare specifier the shipped JavaScript imports, as `file → specifier`.
 *
 * The four syntactic forms are separate patterns on purpose rather than one
 * clever regex: `import "x"`, `import … from "x"`, `export … from "x"` and
 * `await import("x")` are different sources, and a reader should be able to see
 * which one a failure came from. Comments are not stripped — a specifier named
 * inside a comment is harmless, and an unresolvable comment cannot make the gate
 * red (it only ever adds candidates that must then be declared).
 */
function bareImportsOf(source: string): string[] {
  const patterns = [
    /(?:^|[^\w.])import\s+["']([^"']+)["']/g,
    /(?:^|[^\w.])import\s+[^;]*?\bfrom\s+["']([^"']+)["']/g,
    /(?:^|[^\w.])export\s+[^;]*?\bfrom\s+["']([^"']+)["']/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  ];

  const found = new Set<string>();

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1] ?? "";

      // Relative and absolute specifiers are internal to the package, and a
      // Node builtin is resolved by the runtime. Neither is a dependency.
      if (specifier === "" || specifier.startsWith(".") || specifier.startsWith("/")) continue;

      found.add(specifier);
    }
  }

  return [...found].sort();
}

/** The JavaScript the tarball ships, paired with its path for the failure text. */
function shippedModules(pkg: PublishedPackage): { path: string; source: string }[] {
  return packedFiles(pkg)
    .filter((path) => /\.m?js$/.test(path))
    .map((path) => ({ path, source: packedText(pkg, path) }));
}

/**
 * One `--rr-*` declaration and its value, inside one CSS block.
 *
 * Read from the emitted stylesheet rather than from the token sources on
 * purpose: the question RRU-111 asks is what a consumer's browser receives, and
 * the emitter is free to rename or inline things as long as §29 of the guide
 * holds.
 */
function cssBlock(css: string, selector: string): Map<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = new RegExp(`(?:^|[},])\\s*${escaped}\\s*(?:,[^{]*)?\\{([^}]*)\\}`, "m").exec(css);

  if (block === null) {
    return new Map();
  }

  const declarations = new Map<string, string>();

  for (const match of (block[1] ?? "").matchAll(/(--rr-[\w-]+)\s*:\s*([^;]+);/g)) {
    declarations.set(match[1] ?? "", (match[2] ?? "").trim());
  }

  return declarations;
}

/**
 * The scratch directory is created ONCE per file, at the top level and not
 * inside a `describe`: both suites below pack, and a `beforeAll` scoped to one of
 * them would leave the other packing into a relative path — a directory shaped
 * like `packages_ui` in the working tree, which is exactly what a negative probe
 * created before this was hoisted.
 */
beforeAll(() => {
  scratchDir = mkdtempSync(join(tmpdir(), "raulrod-pack-"));
});

afterAll(() => {
  if (scratchDir !== "") {
    rmSync(scratchDir, { recursive: true, force: true });
    scratchDir = "";
  }
});

describe("published install surface (RRU-110)", () => {
  it("derives the publishable package set, so nothing below can pass on an empty set", () => {
    const derived = publishedPackages();
    const names = derived.map((pkg) => pkg.name);

    // Named on purpose: a derivation that silently returns zero packages would
    // leave every other test in this file with nothing to assert.
    expect(names).toEqual(["@raulrod/icons", "@raulrod/tokens", "@raulrod/ui"]);

    expect(
      derived.length,
      'no package under packages/ declares publishConfig.access === "public": ' +
        "the install contract would be checked against nothing",
    ).toBeGreaterThan(0);
  });

  it("declares, in every manifest, the facts an install depends on", () => {
    const problems = inspectPublished(({ manifest }) => {
      const found: string[] = [];

      if (manifest.type !== "module") {
        // Without it Node reads the emitted `.js` as CommonJS and every consumer
        // import fails on a syntax error about `export`.
        found.push(`type is ${JSON.stringify(manifest.type)}, expected "module"`);
      }

      if (manifest.sideEffects !== false) {
        // A bundler may drop the whole package the moment it looks side-effect
        // free, and the components import no stylesheet themselves, so `false`
        // is the honest claim — it is what keeps the CSS on the consumer's side
        // of the contract (ADR-007).
        found.push(`sideEffects is ${JSON.stringify(manifest.sideEffects)}, expected false`);
      }

      if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
        found.push("no `files` allowlist, so npm would publish the whole working tree");
      }

      if (manifest.exports === undefined || Object.keys(manifest.exports).length === 0) {
        found.push("no `exports` map, so the public API is whatever a bundler happens to find");
      }

      for (const field of ["main", "types"] as const) {
        if (manifest[field] === undefined) {
          found.push(`no \`${field}\` for tooling that does not read \`exports\``);
        }
      }

      if (manifest.version === undefined) {
        found.push("no version, which `npm publish` rejects");
      }

      return found;
    });

    expect(problems).toEqual([]);
  });

  it("ships, in every tarball, every target its manifest promises", () => {
    const problems = inspectPublished((pkg) => {
      const packed = new Set(packedFiles(pkg));

      // `exports` is the modern answer; `main`/`types` are the legacy one that a
      // `moduleResolution: node` consumer still reads. Both are promises, so
      // both are normalized the same way before being compared.
      const promised = [
        ...exportTargets(pkg.manifest.exports ?? {}),
        ...[pkg.manifest.main, pkg.manifest.types]
          .filter((target): target is string => target !== undefined)
          .map((target) => target.replace(/^\.\//, "")),
      ];

      return promised
        .filter((target) => !packed.has(target))
        .map(
          (target) =>
            `promises "${target}" but the tarball does not contain it — a consumer installing ` +
            "from the registry resolves it to nothing (is `dist/` built? Turborepo orders " +
            "`test` after `build`)",
        );
    });

    expect(problems).toEqual([]);
  });

  it("publishes, from every package, only what its `files` allowlist declares", () => {
    const problems = inspectPublished((pkg) => {
      const files = pkg.manifest.files ?? [];

      return packedFiles(pkg)
        .filter((path) => {
          if (ALWAYS_PUBLISHED.some((entry) => path === entry || path.startsWith(entry))) {
            return false;
          }

          return !isDeclaredInFiles(path, files);
        })
        .map(
          (path) =>
            `"${path}" is not covered by \`files\` — consumers install more than the repo declares`,
        );
    });

    expect(problems).toEqual([]);
  });

  it("publishes, from every package, no build-time or test-time file", () => {
    // Redundant with the `files` projection on purpose: the projection answers
    // "was this declared?", this one answers "why does it matter?".
    const problems = inspectPublished((pkg) =>
      packedFiles(pkg).flatMap((path) =>
        PUBLISH_HAZARDS.filter(({ pattern }) => pattern.test(path)).map(
          ({ label }) => `"${path}" is ${label} — it ships to every consumer and stays there`,
        ),
      ),
    );

    expect(problems).toEqual([]);
  });

  it("takes React as a peer everywhere, never as a dependency", () => {
    const problems = inspectPublished((pkg) => {
      const { dependencies = {}, peerDependencies = {} } = pkg.manifest;
      const found: string[] = [];

      for (const name of REACT_PACKAGES) {
        if (dependencies[name] !== undefined) {
          // A hard dependency installs its own React beside the consumer's, and
          // the resulting "invalid hook call" surfaces in the consumer's code
          // with no mention of the manifest that caused it.
          found.push(
            `lists ${name} in \`dependencies\` — the consumer's tree ends up with two copies`,
          );
          continue;
        }

        const range = peerDependencies[name];

        if (range !== undefined && !/^[\^~><=]/.test(range)) {
          // An exact version as a peer turns every consumer on a different patch
          // into a resolution error.
          found.push(
            `pins ${name} to "${range}" as a peer — it has to be a range a consumer can satisfy`,
          );
        }
      }

      return found;
    });

    expect(problems).toEqual([]);
  });

  it("provides the peers this app's dependencies require", () => {
    const app = readManifest(APP_MANIFEST);
    const declared = { ...app.dependencies, ...app.devDependencies };
    const required = new Set(
      publishedPackages().flatMap((pkg) => Object.keys(pkg.manifest.peerDependencies ?? {})),
    );

    // The app is where a peer is satisfied: it is the consumer, and it bundles
    // React into the page, so React belongs in its own manifest rather than
    // arriving inside a dependency.
    const missing = [...required].filter((name) => declared[name] === undefined);

    expect(
      missing,
      `${APP_MANIFEST} must provide the peers its dependencies require; unmet: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("installs the packages as packages, not as paths into the working tree", () => {
    const app = readManifest(APP_MANIFEST);
    const published = publishedPackages();
    const declared = { ...app.dependencies, ...app.devDependencies };
    const installed = app.dependencies ?? {};

    const problems = published.flatMap((pkg) => {
      if (declared[pkg.name] === undefined) {
        return [
          `${pkg.name} is not a dependency of this app, so the app is not the consumer §25 asks for`,
        ];
      }

      // `file:` and `link:` resolve to a directory on disk and publish nothing:
      // the app would go on proving the working tree, which is the failure mode
      // this whole spec exists to close.
      const range = installed[pkg.name];

      return range === undefined || /^workspace:/.test(range)
        ? []
        : [`${pkg.name} is "${range}" — \`file:\`/\`link:\` installs a path, not a package`];
    });

    expect(problems).toEqual([]);
  });
});

// Artifact gates (RRU-111).
//
// RRU-110 proved that the tarball ships the files the manifest promises. The
// four below ask the questions a FILE LIST cannot answer, which is why they
// exist and why they were not part of the first card:
//
//   1. A tarball can contain every file it promises and still be unusable: an
//      `import` of a package nobody declared resolves in this repo and 404s in
//      the consumer's tree.
//   2. The ranges a consumer resolves are the ones the PUBLISHER rewrote, not
//      the ones the repo stores — and the rewrite depends on a tool choice that
//      was, until now, an unwritten assumption. The rewrite and the range have to
//      be asserted TOGETHER: a manifest whose versions were pinned by hand would
//      satisfy "fetchable" while proving nothing about the rewrite.
//   3. Theming is a promise about the emitted CSS, and the emitted CSS is the
//      only thing a consumer can theme with. If the tarball's theme layer is
//      inert, the page renders unstyled-but-plausible and every other gate
//      passes.
//
// The fifth test in this block is not a fifth gate: it is the anti-vacuity check
// that keeps the four from passing on an empty artifact, and it can only fail if
// the packaging itself is broken.
//
// The run that installs these tarballs in an external project, with a network
// and a browser, is `pnpm verify:external` (tools/external-install-check.mjs).
// What lives here is the part of that answer which can be re-checked on every
// commit, offline, in seconds.
describe("packed artifact (RRU-111)", () => {
  it("packs something to inspect, so the gates below cannot pass on an empty artifact", () => {
    const modules = publishedPackages().flatMap(shippedModules);

    expect(
      modules.length,
      "no published package shipped any JavaScript: these gates would read nothing",
    ).toBeGreaterThan(0);
  });

  it("imports, from the shipped JavaScript, only what the packed manifest declares", () => {
    const problems = publishedPackages().flatMap((pkg) => {
      const declared = declaredRuntimePackages(packedManifest(pkg));

      return shippedModules(pkg).flatMap(({ path, source }) =>
        bareImportsOf(source)
          .map((specifier) => packageNameOf(specifier))
          .filter((name) => !declared.has(name))
          .map(
            (name) =>
              `${path} imports "${name}", which the manifest shipped in ${pkg.dir} does not declare ` +
              "in dependencies or peerDependencies — it resolves inside this repo and is not installed " +
              "in a consumer's tree",
          ),
      );
    });

    expect(problems).toEqual([]);
  });

  it("ships only dependency ranges a consumer's package manager can fetch", () => {
    const problems = publishedPackages().flatMap((pkg) => {
      const manifest = packedManifest(pkg);
      const found: string[] = [];

      for (const group of ["dependencies", "peerDependencies"] as const) {
        for (const [name, range] of Object.entries(manifest[group] ?? {})) {
          if (NON_REGISTRY_RANGE.test(range)) {
            found.push(
              `"${name}": "${range}" reaches the tarball as-is — npm answers ` +
                "EUNSUPPORTEDPROTOCOL to it, so every install of this package fails",
            );
          }
        }
      }

      return found.map((problem) => `${pkg.dir}: ${problem}`);
    });

    expect(problems).toEqual([]);
  });

  it("declares internal siblings as `workspace:` and ships them rewritten", () => {
    // The previous test would be a promise, not a fact, without this one, because
    // nothing rewrites `workspace:` except the tool doing the publishing: pnpm
    // does it, and pnpm publishes because changesets resolves the monorepo
    // through `@manypkg/find-root`, which identifies a pnpm workspace by
    // `pnpm-workspace.yaml` rather than by the root `packageManager` field.
    // Pinning the versions by hand in `dependencies` would look like a fix and
    // remove the only thing that exercises the rewrite — so the two manifests
    // are asserted to DISAGREE, which is what keeps a future break of the
    // rewrite from shipping silently.
    //
    // (The other half of the chain, `packageManager: "pnpm@…"`, needs no gate:
    // pnpm refuses to run at all when that field names another manager, so the
    // toolchain fails here long before a manifest could lie.)
    const found: string[] = [];
    let internal = 0;

    for (const pkg of publishedPackages()) {
      const declared = pkg.manifest.dependencies ?? {};
      const shipped = packedManifest(pkg).dependencies ?? {};

      for (const name of Object.keys(declared).filter((dep) => dep.startsWith("@raulrod/"))) {
        internal += 1;

        if (!/^workspace:/.test(declared[name] ?? "")) {
          found.push(
            `${pkg.dir}: "${name}" is declared as "${declared[name]}" instead of a \`workspace:\` ` +
              "range, so the packer no longer has to rewrite anything and this gate stops " +
              "protecting the rewrite",
          );
        }

        if (!/^\d/.test(shipped[name] ?? "")) {
          found.push(
            `${pkg.dir}: "${name}" reaches the tarball as "${shipped[name] ?? "(absent)"}" — the ` +
              "source range was copied through instead of rewritten",
          );
        }
      }
    }

    expect(
      internal,
      "no published package declares an internal dependency, so the rewrite is never exercised " +
        "and the gate above passes without proving anything",
    ).toBeGreaterThan(0);

    expect(found).toEqual([]);
  });

  it("ships a theme layer that stands on its own", () => {
    const tokens = publishedPackages().find((pkg) => pkg.name === "@raulrod/tokens");

    if (tokens === undefined) {
      throw new Error(
        "@raulrod/tokens is not in the publishable set, so its CSS cannot be checked",
      );
    }

    const css = packedText(tokens, "dist/tokens.css");
    const problems: string[] = [];

    const light = cssBlock(css, ":root");
    const dark = cssBlock(css, '[data-theme="dark"]');

    // The three states of docs/theming.md §3, each of which is a different
    // selector and not a value: an implementation that collapsed them into one
    // `prefers-color-scheme` block would lose explicit light on a dark OS.
    for (const [selector, declarations] of [
      [":root", light],
      ['[data-theme="dark"]', dark],
    ] as const) {
      if (declarations.size === 0) {
        problems.push(`"${selector}" declares no --rr-* variable in the packed tokens.css`);
      }
    }

    if (!/@media\s*\(prefers-color-scheme:\s*dark\)/.test(css)) {
      problems.push(
        "packed tokens.css has no prefers-color-scheme block, so 'system' is not a theme",
      );
    }

    if (!css.includes(':root:not([data-theme="light"])')) {
      problems.push(
        'the system-dark block does not exclude :root:not([data-theme="light"]), so an explicit ' +
          '"light" choice would lose to the OS preference',
      );
    }

    // The claim the card makes is that the THEME CHANGES. A `[data-theme="dark"]`
    // block that repeats the light values would satisfy every check above while
    // making the card's sentence false, so at least one semantic color has to
    // actually differ between the two blocks.
    const changed = [...light.keys()].filter(
      (name) => dark.has(name) && dark.get(name) !== light.get(name),
    );

    if (changed.length === 0) {
      problems.push(
        'every --rr-* value in [data-theme="dark"] equals the :root one: the theme attribute is ' +
          "accepted by the cascade and changes nothing",
      );
    }

    expect(problems).toEqual([]);
  });
});

// The two blocks above ask whether a package installs. This one asks what the
// registry page says about it, which is the half of "publishing" a manifest can be
// wrong about on its own — and that `npm view` confirmed was: all three packages
// shipped with no `license` and no `repository`, and no LICENSE in the tarball at
// all, because npm force-includes one only where the file exists and this repo
// keeps its single copy at the root.
//
// Worth a gate rather than a review because of WHEN it has to be found. A published
// version cannot be republished: whatever `license` the 1.0.0 tarball carries is
// what every consumer of 1.0.0 sees, and the repair can only ever arrive as
// 1.0.1 — so the defect ships even though the fix already exists. These assertions
// run inside the job that publishes (`release.yml` runs `pnpm test` before
// `changesets/action`), which makes the check that guards the release part of it.
describe("published license and provenance (RRU-112)", () => {
  /** The repo's license text, and the SPDX id parsed out of its first line. */
  const ROOT_LICENSE = join(REPO_ROOT, "LICENSE");

  /**
   * The license id the root LICENSE states, e.g. `MIT` from `MIT License`.
   *
   * Derived rather than declared: a literal `"MIT"` in this spec would agree with
   * the file right up to the day the license changed, and then this spec would be
   * the stale party while the manifests kept publishing an id the repository no
   * longer grants. Throwing when the first line names no license is deliberate — a
   * gate comparing against a guess is worse than no gate.
   */
  function rootLicenseId(): string {
    const first = readFileSync(ROOT_LICENSE, "utf8").split("\n")[0]?.trim() ?? "";
    const id = /^(\S+)\s+Licen[cs]e\b/.exec(first)?.[1];

    if (id === undefined) {
      throw new Error(
        `the first line of LICENSE reads "${first}", which names no license, so there is nothing ` +
          "for a manifest's `license` field to be checked against",
      );
    }

    return id;
  }

  /** A URL field counts as declared only if it says something. */
  function declared(value: string | undefined): boolean {
    return value !== undefined && value.trim() !== "";
  }

  /**
   * What a consumer sees on the package's page and cannot act on: the license the
   * registry renders, the source link, the documentation, the tracker.
   *
   * Pure, so the self-check below can feed it manifests broken on purpose. An
   * inspection wired straight into `inspectPublished` could only ever be exercised
   * by the repository being wrong, which is the one thing ADR-005 §5 says a gate
   * must not rely on.
   */
  function metadataProblems(manifest: PackageManifest, expectedLicense: string): string[] {
    const problems: string[] = [];

    if (!declared(manifest.license)) {
      problems.push(
        "declares no `license` — the registry renders that as UNKNOWN, and an MIT LICENSE at the " +
          "repo root is not what a consumer reads before installing",
      );
    } else if (manifest.license !== expectedLicense) {
      problems.push(
        `declares \`license: "${manifest.license}"\` while the repo's LICENSE says ${expectedLicense} ` +
          "— the package grants terms the repository does not",
      );
    }

    if (!declared(manifest.repository?.url)) {
      problems.push(
        "declares no `repository.url` — the package page has no link to the source, and no way to " +
          "read what it was built from before depending on it",
      );
    } else if (!declared(manifest.repository?.directory)) {
      problems.push(
        "`repository.url` points at the monorepo with no `directory`, so every package's source " +
          "link lands on the repo root instead of its own folder",
      );
    }

    if (!declared(manifest.homepage)) {
      problems.push(
        "declares no `homepage` — the registry's Documentation link is the first thing a consumer " +
          "looks for, and it would be empty",
      );
    }

    if (!declared(manifest.bugs?.url)) {
      problems.push(
        "declares no `bugs.url` — a consumer who finds a defect gets no tracker to report it in, " +
          "which is the same as losing it",
      );
    }

    return problems;
  }

  /**
   * The license text the tarball carries, compared to the repo's.
   *
   * `shipped === undefined` means the tarball has no LICENSE at all, which is a
   * different defect from one that drifted and is reported as a different thing:
   * the first is what the repo looks like today, the second is what a partial fix
   * would look like.
   */
  function licenseTextProblems(shipped: string | undefined, expected: string): string[] {
    if (shipped === undefined) {
      return [
        "ships no LICENSE — npm includes one only when the file exists in the package directory, " +
          "and the repo's only copy sits at the root, outside `files`, so nothing carries it",
      ];
    }

    if (shipped === expected) {
      return [];
    }

    const headline = (text: string): string => text.split("\n")[0]?.trim() ?? "";

    return [
      `ships a LICENSE headed "${headline(shipped)}" where the repo's says "${headline(expected)}" — ` +
        "the terms in the tarball are not the terms in the repository",
    ];
  }

  it("declares, in every published manifest, the metadata a package page renders", () => {
    const expectedLicense = rootLicenseId();
    const problems: string[] = [];

    for (const pkg of publishedPackages()) {
      // The packed manifest, not the source one: this file's own rule is that the
      // tarball is the artifact under test, and the packer rewrites what it ships.
      const shipped = packedManifest(pkg);

      problems.push(
        ...metadataProblems(shipped, expectedLicense).map((problem) => `${pkg.dir}: ${problem}`),
      );
    }

    expect(problems).toEqual([]);
  });

  it("ships, in every tarball, the license text the repository grants", () => {
    const expected = readFileSync(ROOT_LICENSE, "utf8");
    const problems: string[] = [];

    for (const pkg of publishedPackages()) {
      const packed = new Set(packedFiles(pkg));
      const shipped = packed.has("LICENSE") ? packedText(pkg, "LICENSE") : undefined;

      problems.push(
        ...licenseTextProblems(shipped, expected).map((problem) => `${pkg.dir}: ${problem}`),
      );
    }

    expect(problems).toEqual([]);
  });

  it("reports a package whose license metadata or license text is missing or wrong", () => {
    // The self-check. Every gate above reads the repository, which means the only
    // way to know they can report anything is to hand the same inspections
    // packages that are wrong on purpose and watch them complain. These fixtures
    // stay permanent, on the ADR-005 §5 argument: a gate that has never gone red
    // is a gate asserting something false.
    const expectedText = readFileSync(ROOT_LICENSE, "utf8");
    const expectedId = rootLicenseId();

    const compliant: PackageManifest = {
      license: expectedId,
      repository: {
        type: "git",
        url: "git+https://github.com/raulrod16124/raulrod-ui.git",
        directory: "packages/ui",
      },
      homepage: "https://example.test",
      bugs: { url: "https://example.test/issues" },
    };

    // The compliant row first, so a negative that passes for the wrong reason — an
    // inspection that reports everything, or nothing — fails here instead of
    // counting as evidence that the broken rows are caught.
    expect(metadataProblems(compliant, expectedId)).toEqual([]);
    expect(licenseTextProblems(expectedText, expectedText)).toEqual([]);

    const broken: readonly { label: string; problems: string[] }[] = [
      {
        label: "no `license` field at all",
        problems: metadataProblems({ ...compliant, license: undefined }, expectedId),
      },
      {
        label: "a license the repository does not grant",
        problems: metadataProblems({ ...compliant, license: "Apache-2.0" }, expectedId),
      },
      {
        label: "a repository with no url",
        problems: metadataProblems({ ...compliant, repository: { type: "git" } }, expectedId),
      },
      {
        label: "a repository with no directory",
        problems: metadataProblems(
          { ...compliant, repository: { type: "git", url: "git+https://example.test/x.git" } },
          expectedId,
        ),
      },
      {
        label: "a blank homepage",
        problems: metadataProblems({ ...compliant, homepage: "   " }, expectedId),
      },
      {
        label: "no bugs url",
        problems: metadataProblems({ ...compliant, bugs: undefined }, expectedId),
      },
      {
        label: "a tarball with no license file",
        problems: licenseTextProblems(undefined, expectedText),
      },
      {
        label: "a tarball licensed under something else",
        problems: licenseTextProblems("Apache License\n\nCopyright (c) 2026\n", expectedText),
      },
    ];

    expect(
      broken.filter((row) => row.problems.length === 0).map((row) => row.label),
      "these broken packages are reported as compliant, so the gates above cannot fail",
    ).toEqual([]);
  });
});
