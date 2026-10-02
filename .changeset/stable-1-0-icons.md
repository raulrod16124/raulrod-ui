---
"@raulrod/icons": major
---

`1.0.0`, as part of the coordinated stability declaration of the published set (see [ADR-006](../docs/decisions/006-release-strategy.md)).

**This package has no source changes since `0.1.2`.** It is bumped to `1.0.0` deliberately, not incidentally: `@raulrod/ui` declares `@raulrod/icons` as a workspace dependency, so a `1.0.0` UI published against a `0.x` icon set would hand consumers a `0.x` package inside a tree they installed as stable. A one-time alignment of the set at `1.0.0` is what makes the claim honest.

This is a one-time act, not a change of policy. ADR-006 §Versionado independiente por paquete still holds: a change to `@raulrod/ui` or `@raulrod/tokens` does **not** bump `@raulrod/icons` — it moves only when its own re-export surface of `lucide-react` moves.

**Migration.** None. No icon is added, removed, renamed or re-rendered, and the import surface is unchanged.
