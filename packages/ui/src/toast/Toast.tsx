// Toast — notification system (RRU-059).
//
// Architecture (ADR-004, alternative D): Toast is the DS's OWN `aria-live`
// channel — a composable provider + imperative hook, NOT a global manager.
// `<ToastProvider>` is a pure provider (no element of its own, documented
// exception to the ref convention like Dialog/Popover/Select); the visible
// stack lives in a viewport portaled to `document.body` via `Portal`
// (mount-gated → the server markup contains ONLY the app children, SSR-safe).
//
// A11y (DoD #1 + #2):
//  - ONE role per toast, derived from intent: info/success → `status`
//    (polite), warning/destructive → `alert` (assertive). Never both, never a
//    shared `aria-live` on the viewport (that would re-announce the whole
//    stack on every change).
//  - Each toast is its own live-region SUBTREE: a new insert announces once
//    and dismissing one toast never re-announces its siblings (controlled
//    announcement — the SR gets exactly the new content).
//  - Auto-dismiss is tone-gated: status tones default to the provider
//    `duration`; alert tones default to persistent so the reader is never
//    cut off mid-sentence. Timers PAUSE while the pointer is over the viewport
//    OR while focus is inside a toast (hover/focus pause, DoD).
//  - The toast never steals document focus; the close button is the reachable
//    control (real `<button aria-label="Dismiss">`). Escape while the close
//    button holds focus dismisses that toast only — no global listener.
//
// Timing: deadline-based per-toast timers (`Date.now() + remaining`). Pause
// recomputes the remaining time from the stored deadline (no full reset), then
// clears the timer; resume re-arms with the leftover. All timer access happens
// inside handlers/effects → SSR-safe: no `document` on the server path.

import type {
  ToastContextValue,
  ToastEntry,
  ToastInput,
  ToastProviderProps,
  ToastRole,
  ToastTone,
} from "./Toast.types.js";
import type { LucideIcon } from "@raulrod/icons";
import type { FocusEvent as ReactFocusEvent } from "react";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CircleCheck, CircleX, Info, TriangleAlert, X } from "@raulrod/icons";

import { Portal } from "../portal/index.js";

/** Accent icon per tone (ADR-007: decorative, `aria-hidden` at render time). */
const TONE_ICONS: Record<ToastTone, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  destructive: CircleX,
};

/** Alert tones → `role="alert"`/assertive; the rest → `role="status"`/polite.
 *  Single source of the DoD #1 mapping (a tone can never be both). */
function roleForTone(tone: ToastTone): ToastRole {
  return tone === "warning" || tone === "destructive" ? "alert" : "status";
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;
const VIEWPORT_LABEL = "Notifications";

/**
 * Toast (RRU-059) — access to the notification system. Must be rendered inside
 * a {@link ToastProvider} (throws otherwise, fail-loud with a helpful message).
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === null) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

// Internal resize guard: the viewport is never mounted on the server.
/**
 * ToastProvider (RRU-059) — the notification root. Renders `children` and
 * portals the toast viewport. Pure provider: no DOM of its own → no
 * `forwardRef` (documented exception, same family as Dialog/Popover/Select).
 * All toast state lives here; consumers only ever touch it through
 * {@link useToast}.
 */
export function ToastProvider({ children, duration = DEFAULT_DURATION }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  // Latest-value mirrors: the schedulers run outside React (timers, pause
  // handlers) and must read the current stack without stale closure capture.
  // Same ref-mirror pattern as dismissable-layer.ts (RRU-052).
  const toastsRef = useRef(toasts);
  const durationRef = useRef(duration);
  useEffect(() => {
    toastsRef.current = toasts;
    durationRef.current = duration;
  });

  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const deadlinesRef = useRef<Map<string, number>>(new Map());
  const pausedRef = useRef(false);
  const nextIdRef = useRef(0);

  const clearTimer = useCallback((id: string): void => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    deadlinesRef.current.delete(id);
  }, []);

  const removeToast = useCallback(
    (id: string): void => {
      clearTimer(id);
      const entry = toastsRef.current.find((t) => t.id === id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
      entry?.onDismiss?.();
    },
    [clearTimer],
  );

  const schedule = useCallback(
    (id: string, remaining: number): void => {
      if (pausedRef.current) return;
      if (timersRef.current.has(id)) return;
      deadlinesRef.current.set(id, Date.now() + remaining);
      timersRef.current.set(
        id,
        setTimeout(() => {
          timersRef.current.delete(id);
          deadlinesRef.current.delete(id);
          removeToast(id);
        }, remaining),
      );
    },
    [removeToast],
  );

  const push = useCallback(
    (input: ToastInput): string => {
      const id = `toast-${nextIdRef.current++}`;
      const tone = input.tone ?? "info";
      const role = roleForTone(tone);
      // DoD #2: alert tones are persistent by default; status tones default to
      // the provider duration. An explicit `duration` (incl. null) always wins.
      const resolved =
        input.duration !== undefined
          ? input.duration
          : role === "alert"
            ? null
            : durationRef.current;
      const entry: ToastEntry = {
        id,
        tone,
        title: input.title,
        description: input.description,
        onDismiss: input.onDismiss,
        remaining: resolved,
      };
      setToasts((prev) => [entry, ...prev]);
      if (resolved !== null) schedule(id, resolved);
      return id;
    },
    [schedule],
  );

  const dismiss = useCallback(
    (id: string): void => {
      removeToast(id);
    },
    [removeToast],
  );

  const dismissAll = useCallback((): void => {
    const entries = toastsRef.current;
    for (const entry of entries) {
      clearTimer(entry.id);
      entry.onDismiss?.();
    }
    setToasts([]);
  }, [clearTimer]);

  const doPause = useCallback((): void => {
    // Freeze every armed timer and store the remaining time on the entry.
    // Deadline is read BEFORE the timer is cleared (clearTimer deletes it);
    // the setToasts updater stays pure (no ref side effects inside it —
    // React may invoke updaters twice under StrictMode).
    const leftovers = new Map<string, number>();
    for (const entry of toastsRef.current) {
      if (entry.remaining === null) continue;
      const deadline = deadlinesRef.current.get(entry.id);
      const left = deadline !== undefined ? Math.max(deadline - Date.now(), 0) : entry.remaining;
      leftovers.set(entry.id, left);
      clearTimer(entry.id);
    }
    setToasts((prev) =>
      prev.map((entry) => {
        if (entry.remaining === null) return entry;
        const left = leftovers.get(entry.id);
        return left !== undefined ? { ...entry, remaining: left } : entry;
      }),
    );
  }, [clearTimer]);

  const doResume = useCallback((): void => {
    // Re-arm the remaining time on every toast that still has some left.
    for (const entry of toastsRef.current) {
      if (entry.remaining !== null) schedule(entry.id, entry.remaining);
    }
  }, [schedule]);

  // Hover/focus pause state machine. Two independent signals (pointer over the
  // viewport, any focus inside it) merged into one paused flag; leaving the
  // viewport with focus on a toast keeps it paused until both release.
  const hoveringRef = useRef(false);
  const focusInsideRef = useRef(false);

  const syncPause = useCallback((): void => {
    const next = hoveringRef.current || focusInsideRef.current;
    if (next === pausedRef.current) return;
    if (next) {
      pausedRef.current = true;
      doPause();
    } else {
      // Only the first doResume matters: re-arm each entry exactly once.
      pausedRef.current = false;
      doResume();
    }
  }, [doPause, doResume]);

  const handlePointerEnter = (): void => {
    hoveringRef.current = true;
    syncPause();
  };

  const handlePointerLeave = (): void => {
    hoveringRef.current = false;
    syncPause();
  };

  const handleFocus = (): void => {
    focusInsideRef.current = true;
    syncPause();
  };

  const handleBlur = (event: ReactFocusEvent<HTMLDivElement>): void => {
    const related = event.relatedTarget;
    if (related instanceof Node && event.currentTarget.contains(related)) return;
    focusInsideRef.current = false;
    syncPause();
  };

  // Unmount: no timer may fire setState on an unmounted tree.
  useEffect(() => {
    const timers = timersRef.current;
    const deadlines = deadlinesRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
      deadlines.clear();
    };
  }, []);

  const api = useMemo<ToastContextValue>(
    () => ({ toast: push, dismiss, dismissAll }),
    [push, dismiss, dismissAll],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Portal>
        <div
          className="rr-toast-viewport"
          role="region"
          aria-label={VIEWPORT_LABEL}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onFocusCapture={handleFocus}
          onBlur={handleBlur}
        >
          {toasts.map((entry) => {
            const Icon = TONE_ICONS[entry.tone];
            const role = roleForTone(entry.tone);
            return (
              <div
                key={entry.id}
                className={`rr-toast rr-toast--${entry.tone}`}
                role={role}
                data-tone={entry.tone}
              >
                <Icon aria-hidden={true} className="rr-toast__icon" />
                <div className="rr-toast__body">
                  <p className="rr-toast__title">{entry.title}</p>
                  {entry.description !== undefined ? (
                    <p className="rr-toast__description">{entry.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="rr-toast__close"
                  aria-label="Dismiss"
                  onClick={() => dismiss(entry.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") dismiss(entry.id);
                  }}
                >
                  <X aria-hidden={true} className="rr-toast__close-icon" />
                </button>
              </div>
            );
          })}
        </div>
      </Portal>
    </ToastContext.Provider>
  );
}

ToastProvider.displayName = "ToastProvider";
