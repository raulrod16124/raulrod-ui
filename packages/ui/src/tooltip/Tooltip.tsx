import type { TooltipProps } from "./Tooltip.types.js";
import type { FocusEvent, PointerEvent } from "react";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

import { Portal } from "../portal/index.js";
import { cx } from "../utils/cx.js";
import { mergeRefs } from "../utils/merge-refs.js";
import { useId } from "../utils/use-id.js";
import { usePopoverPosition } from "../utils/use-popover-position.js";

/**
 * Tooltip (RRU-056): a supplementary hover/focus hint floating next to an
 * arbitrary trigger (guide §14, WAI-ARIA Tooltip pattern). SIMPLE API — no
 * provider, no slots: the root renders the ANCHOR itself, a neutral
 * `<span class="rr-tooltip-trigger">` wrapping the consumer's element, and
 * portals a `<div role="tooltip">` to `document.body` while visible.
 *
 * Why a wrapper span and not `asChild`/polymorphism (closed decision RRU-031,
 * ADR-004): the anchor measures/predicts through the wrapper, pointer events
 * and focus (blur/focus) bubble from the real control up to it, and a DISABLED
 * control still triggers the tooltip (the wrapper keeps receiving the events).
 *
 * A11y by construction (card DoD #1, branch "contenido no esencial"):
 *  - content is ALWAYS supplementary — the control carries its own complete
 *    accessible name; no automatic `aria-describedby` (would need reaching
 *    into the consumer's element).
 *  - keyboard: `focusin`/`focusout` on the wrapper open it IMMEDIATELY (no
 *    delay) and close it — a Tab-reachable trigger is fully usable.
 *  - the panel is NOT focusable and there is no trap/lock/Escape: the tooltip
 *    closes when hover OR focus is released (never traps the keyboard).
 *
 * Open/dismiss state machine: hover schedules `openDelay` (default 500ms) via
 * `pointerenter`/`pointerleave`; focus flips state instantly; the panel's own
 * enter/leave keeps it alive while the pointer bridges the gap to the float;
 * moving between trigger and panel never flickers; while focused, hover-close
 * is suppressed. Timers live in refs and are cleared on unmount. All DOM
 * access happens in event handlers/effects → SSR-safe: the panel is mount-
 * gated by the portal, so the server markup contains only the wrapper span.
 */
export const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(function Tooltip(
  {
    content,
    placement = "top",
    openDelay = 500,
    closeDelay = 100,
    open,
    defaultOpen = false,
    onOpenChange,
    className,
    children,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : uncontrolledOpen;

  // Latest-value mirrors (repo pattern: dismissable-layer.ts). The resolved
  // open state feeds the uncontrolled no-op guard inside `setOpen`, and the
  // latest consumer `onOpenChange` is what delayed timers actually call.
  const openRef = useRef(isOpen);
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    openRef.current = isOpen;
    onOpenChangeRef.current = onOpenChange;
  });

  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveringRef = useRef(false);

  const setOpen = useCallback(
    (next: boolean): void => {
      // Uncontrolled no-op guard: hovering again while already open must not
      // re-fire `onOpenChange`. Controlled keeps firing so the consumer owns
      // the gate and sees every intent.
      if (!controlled && next === openRef.current) return;
      openRef.current = next;
      if (!controlled) setUncontrolledOpen(next);
      onOpenChangeRef.current?.(next);
    },
    [controlled],
  );

  const clearTimers = useCallback((): void => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleOpen = useCallback(
    (delay: number): void => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      if (openTimerRef.current !== null) return;
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null;
        setOpen(true);
      }, delay);
    },
    [setOpen],
  );

  const scheduleClose = useCallback(
    (delay: number): void => {
      if (openTimerRef.current !== null) {
        clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
      if (closeTimerRef.current !== null) return;
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        setOpen(false);
      }, delay);
    },
    [setOpen],
  );

  // Unmount cleanup: no pending timer can fire setState on an unmounted tree.
  useEffect(() => clearTimers, [clearTimers]);

  const isTriggerFocused = (): boolean =>
    document.activeElement instanceof Node &&
    triggerRef.current !== null &&
    triggerRef.current.contains(document.activeElement);

  const handlePointerEnter = (event: PointerEvent<HTMLSpanElement>): void => {
    hoveringRef.current = true;
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    scheduleOpen(openDelay);
    onPointerEnter?.(event);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLSpanElement>): void => {
    hoveringRef.current = false;
    const target = event.relatedTarget;
    if (target instanceof Node && panelRef.current?.contains(target) === true) {
      // Pointer moved onto the portaled panel — the panel owns the hover now
      // and must keep it open (bridging the small gap without flicker).
      onPointerLeave?.(event);
      return;
    }
    // While focus holds the tooltip open, letting the pointer go must not
    // close it (either hover OR focus keeps it visible).
    if (!isTriggerFocused()) scheduleClose(closeDelay);
    onPointerLeave?.(event);
  };

  const handlePanelPointerEnter = (): void => {
    hoveringRef.current = true;
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handlePanelPointerLeave = (event: PointerEvent<HTMLDivElement>): void => {
    hoveringRef.current = false;
    const target = event.relatedTarget;
    if (target instanceof Node && triggerRef.current?.contains(target) === true) {
      // Returning to the trigger: its own pointerenter re-arms the hover.
      return;
    }
    if (!isTriggerFocused()) scheduleClose(closeDelay);
  };

  const handleFocus = (event: FocusEvent<HTMLSpanElement>): void => {
    clearTimers();
    setOpen(true);
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLSpanElement>): void => {
    if (!hoveringRef.current) {
      clearTimers();
      setOpen(false);
    }
    onBlur?.(event);
  };

  const contentId = useId("rr-tooltip");

  usePopoverPosition({
    anchorRef: triggerRef,
    panelRef,
    placement,
    /// Tooltips sit close to the trigger: `4px` = `--rr-space-1` (Popover uses
    /// `space-2`; the hint is anchored tighter).
    margin: 4,
    active: isOpen,
  });

  return (
    <>
      <span
        {...props}
        ref={mergeRefs(triggerRef, ref)}
        className={cx("rr-tooltip-trigger", className)}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </span>
      {isOpen ? (
        <Portal>
          <div
            ref={panelRef}
            id={contentId}
            role="tooltip"
            className="rr-tooltip"
            onPointerEnter={handlePanelPointerEnter}
            onPointerLeave={handlePanelPointerLeave}
          >
            {content}
          </div>
        </Portal>
      ) : null}
    </>
  );
});
Tooltip.displayName = "Tooltip";
