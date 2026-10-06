#!/usr/bin/env node
// Changeset gate: the release step's own validation, run on the PR
// (incident rru-141/142/143, 2026-10-06).
//
// WHY THIS EXISTS. `.changeset/*.md` is plain markdown until something parses
// it, and on the happy path the first parser is `changesets/action` in
// release.yml — which runs on push to main, AFTER the merge. Three files born
// without their opening "---" (rru-141/142/143) rode every check green into
// `main` and only exploded there, killing the release job with no Release PR
// and nothing published.
//
// WHY NOT `changeset status`. It was the obvious gate and it failed twice.
// (1) It parses, and then runs `git merge-base` against
// `.changeset/config.json`'s `baseBranch` ("main") — a shallow, detached PR
// checkout has no such ref, so the guard died before validating anything. (2)
// Its policy half — "packages have been changed but no changesets were found"
// — is false BY CONSTRUCTION on the Release PR: `changeset version` has
// consumed every changeset precisely so the versions can bump (PR #25). A
// gate that rejects the PR that publishes is worse than no gate. This repo
// has learned that shape of lesson before: an exact-version claim in DEMO.md
// turned the 1.0.1 release PR red, and `check:demo`'s answer was that a claim
// must survive the PR that changes the thing it describes
// (`checkReleaseCoherence`).
//
// WHAT THIS DOES instead: replays the version step's inputs as a pure
// function of the working tree — readConfig (config validity),
// readChangesets (frontmatter, YAML, bump types), assembleReleasePlan
// (package exists in the workspace, ignored/mixed rules) — through the same
// libraries `changeset version` itself uses, and prints the plan that would
// be released. While this is green, `changeset version` cannot fail for
// input reasons when the PR merges.
//
// TWO DELIBERATE OMISSIONS. No git: branch topology is not a property of the
// changesets. And no "changed packages must have a changeset" policy: that
// half broke the Release PR, and the discipline lives in §0 of the board —
// `pnpm changeset status` remains available as a manual, non-gating check.
// Version computation and publishing stay with `changesets/action`, the only
// step allowed to write a commit and talk to the registry.

import fs from "node:fs/promises";
import path from "node:path";
import { assembleReleasePlan } from "@changesets/assemble-release-plan";
import { readConfig } from "@changesets/config";
import { parseChangesetFile } from "@changesets/parse";
import { readPreState } from "@changesets/pre";
import { readChangesets } from "@changesets/read";
import { getPackages } from "@manypkg/get-packages";

// Mirrors @changesets/read's selection so the attribution pass below never
// reports a file the release would not read (README.md is not a changeset).
const IGNORED = [/^README\.md$/i, "AGENTS.md", "CLAUDE.md", "GEMINI.md"];

function isChangesetCandidate(entry) {
  const base = path.basename(entry);
  return (
    !base.startsWith(".") &&
    base.endsWith(".md") &&
    !IGNORED.some((pattern) =>
      typeof pattern === "string" ? pattern === base : pattern.test(base),
    )
  );
}

// readChangesets parses the directory as one Promise.all, so its error has no
// filename — and finding WHICH files were broken in the original incident
// cost hexdumps over three commits. Re-parse file by file and name every
// offender, first line of the message only (the full parse error repeats
// example content per file).
async function nameMalformedFiles(rootDir, fallback) {
  const dir = path.join(rootDir, ".changeset");
  const entries = await fs.readdir(dir);
  try {
    const pre = await fs.readdir(path.join(dir, "pre"));
    entries.push(...pre.map((entry) => path.join("pre", entry)));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  const failures = [];
  for (const entry of entries) {
    if (!isChangesetCandidate(entry)) continue;
    try {
      await parseChangesetFile(await fs.readFile(path.join(dir, entry), "utf8"));
    } catch (err) {
      failures.push(`  .changeset/${entry}: ${String(err.message).split("\n")[0]}`);
    }
  }
  console.error("check:changesets: malformed changeset(s):");
  console.error(failures.length > 0 ? failures.join("\n") : `  ${fallback}`);
}

const cwd = process.cwd();

try {
  const packages = await getPackages(cwd);

  const { config, warnings, errors } = await readConfig(cwd, packages);
  for (const warning of warnings ?? [])
    console.warn(`check:changesets: config warning: ${warning}`);
  if (errors != null && errors.length > 0) {
    console.error("check:changesets: .changeset/config.json is invalid:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  let changesets;
  try {
    changesets = await readChangesets(packages.rootDir);
  } catch (err) {
    await nameMalformedFiles(packages.rootDir, String(err.message).split("\n")[0]);
    process.exit(1);
  }

  const preState = await readPreState(packages.rootDir);
  const plan = assembleReleasePlan(changesets, packages, config, preState ?? null);
  const releases = plan.releases.filter((release) => release.type !== "none");

  console.log(`check:changesets: ${changesets.length} changeset(s) parse OK`);
  if (releases.length === 0) {
    console.log(
      "  no releases planned (empty or all-ignored — the Release PR consumes changesets)",
    );
  }
  for (const release of releases) {
    console.log(
      `  ${release.name}: ${release.oldVersion} -> ${release.newVersion} (${release.type})`,
    );
  }
} catch (err) {
  console.error(`check:changesets: ${err.message}`);
  process.exit(1);
}
