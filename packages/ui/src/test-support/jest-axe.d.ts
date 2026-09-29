// Ambient types for `jest-axe` (RRU-068).
//
// The package ships no TypeScript definitions, so the harness declares the
// surface it actually consumes: the pre-configured `axe()` runner and the
// `toHaveNoViolations` matcher map that `expect.extend()` installs (jest-axe
// exports the matcher as an object map, which is why `setup.ts` can pass it
// directly).
//
// This file must stay a *script* (no top-level `import`/`export`): only then is
// `declare module "jest-axe"` an ambient declaration for a package without
// types, instead of an augmentation of an existing module. `import("axe-core")`
// inline types reach the real result shapes without turning the file into a
// module. `axe-core` is a direct devDependency of this package so those types
// resolve under pnpm's strict `node_modules`.
//
// The `toHaveNoViolations` matcher is added to Vitest's assertion types in
// `vitest-matchers.d.ts`, which IS a module on purpose (a `declare module` in a
// script would REPLACE vitest's whole type surface instead of augmenting it).
declare module "jest-axe" {
  /** Pre-configured axe-core runner: `axe(element | html, options?, context?)`. */
  export const axe: (
    html: string | Element,
    options?: import("axe-core").RunOptions,
    context?: import("axe-core").ElementContext,
  ) => Promise<import("axe-core").AxeResults>;

  /** Matcher map consumed by `expect.extend()` in `setup.ts`. The axe results
   *  arrive as the matcher SUBJECT: `expect(await axe(el)).toHaveNoViolations()`. */
  export const toHaveNoViolations: {
    toHaveNoViolations(): {
      pass: boolean;
      actual: import("axe-core").Result[];
      message: () => string;
    };
  };
}
