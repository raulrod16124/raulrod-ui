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
// Installing the packed tarballs into a throwaway project is RRU-111's job,
// with a real registry and a real app; what is verifiable offline and on every
// commit is exactly what this file asserts.
//
// Three properties carry the whole spec:
//
//   1. DERIVED, NEVER HAND-WRITTEN. The package set comes from walking
//      `packages/` and keeping what declares itself publishable, and the file
//      list comes from `npm pack` itself. A list written here would state the
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
//
// The React assertions are the other half of an install: `@raulrod/ui` renders
// React, so React has to arrive as a PEER. A package listing it as a hard
// dependency installs a second React into the consumer's tree, and the failure
// mode — invalid-hook-call errors from two reconcilers — appears far away from
// the manifest that caused it.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/** Repo root, three levels up from `apps/playground/src/`. */
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
/** This app's manifest — the consumer side of every install assertion. */
const APP_MANIFEST = join(REPO_ROOT, "apps", "playground", "package.json");

/**
 * Files npm includes whether or not `files` lists them. Asserting the `files`
 * projection without this exception would fail on the manifest itself.
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
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
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

/** Packing is the expensive step here, and it answers the same question twice. */
const packCache = new Map<string, string[]>();

/**
 * The file list `npm publish` would upload, straight from npm.
 *
 * `--dry-run` writes no tarball. `--json` makes the output machine-readable, so
 * the assertions compare npm's own answer with the manifests instead of parsing
 * prose. Failures carry stderr: an npm error here is a broken package, not a
 * broken test, and a bare "exit status 1" would hide which one.
 */
function packedFiles(pkg: PublishedPackage): string[] {
  const cached = packCache.get(pkg.dir);

  if (cached !== undefined) {
    return cached;
  }

  let paths: string[];

  try {
    const stdout = execFileSync("npm", ["pack", "--dry-run", "--json"], {
      cwd: join(REPO_ROOT, pkg.dir),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
    });

    const [tarball] = JSON.parse(stdout) as { files?: { path?: string }[] }[];

    if (tarball === undefined || !Array.isArray(tarball.files)) {
      throw new Error("npm pack --json reported no file list");
    }

    paths = (tarball.files ?? []).map((file) => file.path ?? "");
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? "";
    throw new Error(`npm pack --dry-run failed in ${pkg.dir}: ${String(error)}\n${stderr}`);
  }

  packCache.set(pkg.dir, paths);

  return paths;
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
