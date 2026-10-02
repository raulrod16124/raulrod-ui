# @raulrod/icons

## 1.0.0

### Major Changes

- [#11](https://github.com/raulrod16124/raulrod-ui/pull/11) [`ba0c98b`](https://github.com/raulrod16124/raulrod-ui/commit/ba0c98bb0a54b24d334d1b92fdef38df9f7e6f9f) Thanks [@raulrod16124](https://github.com/raulrod16124)! - `1.0.0`, as part of the coordinated stability declaration of the published set. ADR-006 fixes per-package versioning and rejects versioning the set as one; this release deviates from it on purpose, and only for this one release.

  **This package has no source changes since `0.1.2`.** It is bumped to `1.0.0` deliberately, not incidentally: `@raulrod/ui` declares `@raulrod/icons` as a workspace dependency, so a `1.0.0` UI published against a `0.x` icon set would hand consumers a `0.x` package inside a tree they installed as stable. A one-time alignment of the set at `1.0.0` is what makes the claim honest.

  This is a one-time act, not a change of policy. ADR-006 §Versionado independiente por paquete still holds: a change to `@raulrod/ui` or `@raulrod/tokens` does **not** bump `@raulrod/icons` — it moves only when its own re-export surface of `lucide-react` moves.

  **Package metadata.** Despite having no source changes, this is also the release in which the package stops publishing an anonymous license: the manifest now carries `license: "MIT"` (matching the LICENSE at the repository root), a `repository` link pointing at this package's folder, a `homepage`, and a `bugs` tracker, and the license text ships inside the tarball. The registry rendered all three packages as `UNKNOWN` before it.

  **Migration.** None. No icon is added, removed, renamed or re-rendered, and the import surface is unchanged.

## 0.1.2

### Patch Changes

- [#8](https://github.com/raulrod16124/raulrod-ui/pull/8) [`dc1c298`](https://github.com/raulrod16124/raulrod-ui/commit/dc1c298509317bf1705982443923d47c0a984630) Thanks [@raulrod16124](https://github.com/raulrod16124)! - Add README files to published packages and configure GitHub-linked changelogs.

## 0.1.1

### Patch Changes

- 9fb4f2e: Initial stable release

## 0.1.0

### Minor Changes

- Initial publishable release setup with Changesets independent versioning
