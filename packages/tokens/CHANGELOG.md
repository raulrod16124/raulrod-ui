# @raulrod/tokens

## 1.0.0

### Major Changes

- [#11](https://github.com/raulrod16124/raulrod-ui/pull/11) [`ba0c98b`](https://github.com/raulrod16124/raulrod-ui/commit/ba0c98bb0a54b24d334d1b92fdef38df9f7e6f9f) Thanks [@raulrod16124](https://github.com/raulrod16124)! - `1.0.0`: the stable surface of the design tokens. Nothing is removed and no token is renamed — this release only _adds_ to the published surface and pins the contrast of everything already in it, so a consumer can treat the token names and the pair ratios behind them as a contract rather than as a moving target.

  **New tokens.** `--rr-color-link-text` and `--rr-color-link-text.hover` give link text its own intent and its own steps, and `--rr-color-border-primary` / `--rr-color-border-primary.hover` give a selected control's _boundary_ a token separate from the fill it is filled with. Both exist because one blue was doing two jobs with different thresholds: a link or a selected-control edge is read against the page behind it and needs **3:1**, while the same blue as a fill is read against white text sitting on it and needs **4.5:1**. Measured against the surface, that blue gave 3.32:1 at rest and fell to 2.33:1 on hover in dark — fine as a fill, not as a boundary. `blue-400` was added to the primitive ramp to supply the lighter dark-mode hover step, since the ramp previously jumped from `blue-500` straight to `blue-600`.

  **Measured, not asserted.** Every governed pair is now checked by a contrast gate that computes its ratio and matches it against an authorized row, so a token pair cannot ship at a ratio the design does not admit. Where a component was relying on a pair that failed, the pair was corrected rather than registered as a known defect: the registry of known defects is empty.

  **Package metadata.** This release is the first that says who owns the code and under what terms: the published manifest now carries `license: "MIT"` (matching the LICENSE at the repository root), a `repository` link pointing at this package's folder, a `homepage`, and a `bugs` tracker — and the license text itself ships inside the tarball, where a consumer unpacking it can read it. Before this, the registry rendered the license of all three packages as `UNKNOWN` and linked to no source.

  **Migration.** None. Both additions are new names, and every existing token keeps its value, its name and its role.

## 0.1.2

### Patch Changes

- [#8](https://github.com/raulrod16124/raulrod-ui/pull/8) [`dc1c298`](https://github.com/raulrod16124/raulrod-ui/commit/dc1c298509317bf1705982443923d47c0a984630) Thanks [@raulrod16124](https://github.com/raulrod16124)! - Add README files to published packages and configure GitHub-linked changelogs.

## 0.1.1

### Patch Changes

- 9fb4f2e: Initial stable release

## 0.1.0

### Minor Changes

- Initial publishable release setup with Changesets independent versioning
