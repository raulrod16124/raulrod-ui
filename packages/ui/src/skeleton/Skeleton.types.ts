import type { HTMLAttributes } from "react";

/**
 * Shape axis of {@link Skeleton} (RRU-062). `rectangle` = a block placeholder
 * (default, `radius-sm`); `circle` = a disc for avatar/image placeholders
 * (`radius-full`, 32px default square — `space-8`, the Avatar `sm` scale — so a
 * bare `<Skeleton variant="circle" />` stays a proper disc without consumer
 * CSS). There is deliberately no `text`/`inline` variant yet: the card only
 * asks for a shimmer placeholder and §9 forbids speculative shapes — if Table /
 * DataTable (RRU-065/066) need a distinct text-line shape it is added
 * backward-compatibly, like Badge's deferred `size`.
 */
export type SkeletonVariant = "rectangle" | "circle";

/**
 * Props of {@link Skeleton} (RRU-062): a static, non-interactive loading
 * placeholder (Badge precedent). `variant` defaults to `rectangle` in JS
 * (Badge `variant` precedent — the modifier is always emitted, so the authored
 * CSS contract can fail loud until the matching `rr-skeleton--<v>` selector
 * exists).
 *
 * No ARIA by design: a skeleton is decorative and must stay noiseless for
 * screen readers — the loading state is announced by the container that
 * composes it (`aria-busy`, shared in RRU-067) or by `Progress` (RRU-063), not
 * by the placeholder itself.
 *
 * `className`, `style`, `data-*`, `title`, ARIA and events pass through to the
 * `<span>` root; `className` is appended via `cx` (the consumer sizes/overrides
 * a skeleton from its side of the ADR-003 override contract).
 */
export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /** Placeholder shape; defaults to `rectangle` (JS default, Badge precedent). */
  variant?: SkeletonVariant;
}
