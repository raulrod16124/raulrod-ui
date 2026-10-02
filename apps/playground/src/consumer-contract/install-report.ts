// What this app installs, stated where a consumer can read it (RRU-110).
//
// The playground is the repo's proof that the packages are installable, and
// until this module existed that proof only existed as a passing test nobody
// but the CI log could see. This is the same fact in the page: the three
// packages and the exact public specifiers this app imports from each, which is
// what a consumer's own `package.json` + imports end up saying.
//
// It is a MIRROR, and mirrors are the thing this repo distrusts most, so the
// rule is that nothing here is trusted: `consumer-contract.test.ts` derives the
// published packages from the manifests and fails if this list disagrees with
// them, names a specifier the manifests do not declare, or advertises an
// entrypoint no source file imports. A panel that can print an unverified claim
// is worse than no panel.
//
// Two things are deliberately absent:
//
//   * VERSIONS. `changeset version` rewrites the manifests' `version` on every
//     release, so a copy here would be red the first time a package shipped and
//     would train everyone to ignore the gate. The manifests are the single
//     source; this panel answers "what do I import", not "which build is it".
//   * FILE PATHS. The whole point of the card is that a consumer names a
//     package, never a file inside the monorepo. Printing `dist/index.js` here
//     would model the opposite habit.

/** One published package, as this app consumes it. */
export interface InstalledPackage {
  /** The package name exactly as a consumer writes it. */
  readonly name: string;
  /** What it contributes here, in one line. */
  readonly role: string;
  /** Public specifiers imported from it, in the order the app imports them. */
  readonly entrypoints: readonly string[];
}

/**
 * The install surface of this app.
 *
 * `@raulrod/tokens` appears twice on purpose: its types are what type the
 * spacing of this very section, and its stylesheet is what paints the page. The
 * pair is the clearest statement of the tokens contract — 0 kB of runtime JS
 * from a package that is nevertheless fully wired.
 */
export const INSTALLED_PACKAGES: readonly InstalledPackage[] = [
  {
    name: "@raulrod/ui",
    role: "React components; its stylesheet styles every component below",
    entrypoints: ["@raulrod/ui", "@raulrod/ui/styles.css"],
  },
  {
    name: "@raulrod/tokens",
    role: "tokens as CSS custom properties, and the types that type token props",
    entrypoints: ["@raulrod/tokens", "@raulrod/tokens/styles.css"],
  },
  {
    name: "@raulrod/icons",
    role: "lucide-react re-export, also reachable through @raulrod/ui (ADR-007)",
    entrypoints: ["@raulrod/icons"],
  },
];
