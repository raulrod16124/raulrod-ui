// Vitest assertion augmentation for the `jest-axe` matcher (RRU-068).
//
// This file is a MODULE (`import type` + no runtime code), so the
// `declare module "vitest"` block below is an AUGMENTATION: it adds
// `toHaveNoViolations` to the matcher surface without hiding vitest's own
// exports. Declaring it inside a script `.d.ts` (like `jest-axe.d.ts` must be)
// would replace the module's types and break every `import { it } from
// "vitest"` in the package.
declare module "vitest" {
  /** `expect(await axe(container)).toHaveNoViolations()` — the results are the subject. */
  interface Assertion<T = unknown> {
    toHaveNoViolations(): void;
  }

  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

export {};
