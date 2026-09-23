import type { HTMLAttributes } from "react";

/**
 * Square size axis of {@link Avatar} (RRU-050). `sm`/`md`/`lg` = 32/40/48px,
 * the Switch (RRU-048) scale — `space-8/10/12` — with the initials font scaled
 * per size (`sm`→`font.size.xs`, `md`→`font.size.sm`, `lg`→`font.size.base`).
 * `md` is the default and lives in the base CSS class (`Stack.gap` /
 * `Button.size` precedent), so an explicit `size` emits the `rr-avatar--size-*`
 * modifier.
 */
export type AvatarSize = "sm" | "md" | "lg";

/**
 * Props of {@link Avatar} (RRU-050): a non-interactive square image, or an
 * initials fallback derived from `name` when there is no image (or the image
 * fails to load). `name` is **required** (IconButton `label` precedent —
 * TS2741 when omitted) because it drives both the initials and the accessible
 * name.
 *
 * The accessible name has a **single source**, `alt ?? name` (DoD — never
 * announced twice): with a valid image the `<img alt>` provides it; without an
 * image (or after an image error) the root gets `role="img"` + `aria-label` and
 * the initials stay `aria-hidden="true"` (decorative). `role`/`aria-label`
 * passed via props are overridden by this contract.
 *
 * `className`, `style`, `data-*`, `aria-*`, `title` and events pass through to
 * the `<span>` root; `className` is appended via `cx`.
 */
export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Full name. REQUIRED: drives the initials fallback and the accessible
   *  name when no `alt` is given. */
  name: string;
  /** Image URL. Omit (or on load error) to render the initials fallback. */
  src?: string;
  /** Alt text for the image / accessible name. Defaults to `name`. */
  alt?: string;
  /** Square size axis; defaults to `md` in the base CSS class. */
  size?: AvatarSize;
}
