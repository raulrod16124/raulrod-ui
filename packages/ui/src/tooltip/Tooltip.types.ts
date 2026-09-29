import type { PopoverPlacement } from "../utils/popover.js";
import type { HTMLAttributes, ReactNode } from "react";

/** Shared floating `placement` union (single source in `utils/popover.ts`,
 *  RRU-054) — the Tooltip consumes the same flip/overflow geometry. Re-exported
 *  under its canonical name for discoverability. */
export type { PopoverPlacement } from "../utils/popover.js";

/**
 * Props of {@link Tooltip} (RRU-056). SIMPLE API (guide §15 anti-dogma,
 * ADR-004 "render-prop only for DOM wiring"): the composition root also IS the
 * anchor — a `<span class="rr-tooltip-trigger">` that wraps the consumer's
 * element, so no `asChild`/polymorphism is needed (closed decision RRU-031).
 *
 * A11y contract: the tooltip content is ALWAYS SUPPLEMENTARY / non-essential
 * (card DoD branch). The underlying control must carry its own complete
 * accessible name (e.g. IconButton's required `label`, RRU-042); the tooltip
 * is a hover/focus hint and is NOT automatically wired via `aria-describedby`
 * (that relationship would require reaching into the consumer's element,
 * which the no-asChild boundary forbids).
 *
 * Keyboard access: the wrapper opens on `focusin` (bubbled from the real
 * control) WITHOUT delay and closes on `focusout`, so Tab-reachable triggers
 * are fully usable. Pointer access applies the hover delay. While either
 * hover OR focus is held the tooltip stays open (WAI-ARIA Tooltip pattern).
 * Non-interactive triggers (plain text, no tabindex) are hover-only.
 */
export interface TooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "content"> {
  /** The tooltip payload. Contract: supplementary info only — never the sole
   *  carrier of a control's meaning or a duplicated interactive affordance. */
  content: ReactNode;
  /** Side + alignment relative to the trigger (default `"top"`, centered).
   *  Mirrors to the opposite side and clamps to the viewport when space runs
   *  out (shared `computePopoverPosition` geometry, RRU-054). */
  placement?: PopoverPlacement;
  /** Hover open delay in ms (default `500`). Focus opens WITHOUT delay — a
   *  keyboard user must never wait. */
  openDelay?: number;
  /** Close delay in ms after pointer-leave (default `100`, lets the pointer
   *  bridge the small gap to the panel without flickering). */
  closeDelay?: number;
  /** Controlled open state; when provided the tooltip is controlled (parity
   *  with the overlay family, §15). */
  open?: boolean;
  /** Initial open state for the uncontrolled variant (default `false`). */
  defaultOpen?: boolean;
  /** Fired whenever the resolved open state changes (hover, focus, blur). */
  onOpenChange?: (open: boolean) => void;
}
