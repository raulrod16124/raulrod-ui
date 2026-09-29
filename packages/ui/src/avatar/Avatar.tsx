import type { AvatarProps, AvatarSize } from "./Avatar.types.js";

import { forwardRef, useState } from "react";

import { cx } from "../utils/cx.js";
import { getInitials } from "../utils/initials.js";
import { createVariants } from "../utils/variants.js";

/** Exhaustive axis maps (RRU-040 pattern): adding an `AvatarSize` member breaks
 *  compilation here until its suffix exists — and the authored CSS contract
 *  check fails until the matching `rr-avatar--size-*` selector is written. */
const avatarModifiers: Readonly<{
  size: Record<AvatarSize, string>;
}> = {
  size: {
    sm: "size-sm",
    md: "size-md",
    lg: "size-lg",
  },
};

const avatarClasses = createVariants(avatarModifiers);

/**
 * User avatar (RRU-050). Non-interactive square `inline-flex` `<span>` that
 * renders an image (`src`) or a decorative initials fallback derived from
 * `name` (single word → first letter; two+ words → first + last; uppercased;
 * empty → "?"). Sizes sm/md/lg = 32/40/48px (Switch RRU-048 scale,
 * `space-8/10/12`); `md` is the CSS base default (`Button.size` precedent).
 * Styling lives entirely in `Avatar.css` (`rr-*` classes over CSS custom
 * properties, ADR-003). Non-interactive by design (Badge precedent): no
 * `:hover`/`:focus`/`:disabled` — a static avatar must not afford interaction;
 * a clickable avatar is composed by the consumer wrapping it.
 *
 * Accessible name single source (DoD — never duplicated): the image `alt`
 * (default `name`) when the image renders, otherwise `role="img"` +
 * `aria-label` on the root; the initials span is always `aria-hidden="true"`
 * (decorative text). The fallback stays in the DOM and the image covers it
 * (Radix-style) — no layout shift between states, SSR-stable.
 *
 * Image error (client-only, SSR-safe): `failedSrc` is keyed by the `src`
 * value (`failedSrc !== src` retries automatically on a new URL), so there is
 * no `useEffect` / set-state-in-effect (RRU-034 finding). The consumer's
 * `onError` stays on the root `<span>` via props spread (React error events
 * bubble); the fallback switch itself is internal and automatic.
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { name, src, alt, size, className, ...props },
  ref,
) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const accessibleName = alt ?? name;
  const hasImage = Boolean(src) && failedSrc !== src;

  return (
    <span
      {...props}
      ref={ref}
      role={hasImage ? undefined : "img"}
      aria-label={hasImage ? undefined : accessibleName}
      className={cx("rr-avatar", avatarClasses("rr-avatar", { size }), className)}
    >
      {hasImage && (
        <img
          src={src}
          alt={accessibleName}
          data-rr-avatar-image
          onError={() => {
            setFailedSrc(src ?? null);
          }}
        />
      )}
      <span aria-hidden="true" className="rr-avatar__fallback">
        {getInitials(name)}
      </span>
    </span>
  );
});
Avatar.displayName = "Avatar";
