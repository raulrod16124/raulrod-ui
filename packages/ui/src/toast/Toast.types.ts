import type { ReactNode } from "react";

/**
 * Semantic tone of a toast (RRU-059), coherent with {@link Badge} variants
 * (RRU-049) and the alert-tint tokens `color.text.*`/`color.background.*`
 * (color.md §5.3). The tone decides BOTH the role (DoD #1) and the accent icon.
 */
export type ToastTone = "info" | "success" | "warning" | "destructive";

/**
 * The single `aria-live` role a toast may carry (DoD #1 — never both at once).
 * `status` = polite (announced asynchronously, non-essential feedback);
 * `alert` = assertive (announced immediately, important). The role is DERIVED
 * from the tone (info/success → `status`, warning/destructive → `alert`), so the
 * consumer cannot produce an invalid combination.
 */
export type ToastRole = "status" | "alert";

/**
 * Payload accepted by {@link ToastApi.toast}. Object-parameter convention
 * (docs/typescript.md §5). `title` is REQUIRED — a toast always carries a piece
 * of content the reader announces (compile-time help, precedent IconButton
 * `label` RRU-042 / Avatar `name` RRU-050).
 */
export interface ToastInput {
  /** Semantic tone; defaults to `info`. Drives role + accent icon. */
  tone?: ToastTone;
  /** The announced content. Required — a toast without content announces nothing. */
  title: ReactNode;
  /** Optional secondary line, rendered quieter than the title. */
  description?: ReactNode;
  /** Auto-dismiss delay in ms. `null` keeps the toast until dismissed.
   *  Defaults are tone-driven (DoD #2): status tones default to the provider
   *  `duration`, alert tones to `null` (persistent) unless explicitly given. */
  duration?: number | null;
  /** Fired whenever the toast is dismissed (auto-dismiss, close button,
   *  `dismiss`/`dismissAll`, Escape). */
  onDismiss?: () => void;
}

/**
 * Props of {@link ToastProvider} (RRU-059), the composition root of the
 * notification system (ADR-004). A pure provider: it renders no element of its
 * own (documented exception to the ref convention) — the portaled viewport and
 * the toasts are its internal runtime model. The system STARTING STATE is
 * always empty; toasts enter imperatively through {@link useToast}.
 */
export interface ToastProviderProps {
  /** The app tree that may emit toasts through {@link useToast}. */
  children?: ReactNode;
  /** Default auto-dismiss delay for STATUS tones (info/success), in ms.
   *  Alert tones (warning/destructive) default to persistent (`null`) per DoD
   *  #2 — their content must not be yanked away before the reader catches it.
   *  A per-toast `duration` always wins. Default `5000`. */
  duration?: number;
}

/**
 * Imperative API returned by {@link useToast}. The methods are stable for the
 * provider lifetime (ref-based state machine), safe to call from event
 * handlers and async flows (e.g. after a fetch).
 */
export interface ToastApi {
  /** Pushes a toast onto the stack and returns its id (for `dismiss`). The
   *  newest toast renders at the top of the viewport. */
  toast: (input: ToastInput) => string;
  /** Removes the toast with the given id (fires its `onDismiss`). */
  dismiss: (id: string) => void;
  /** Removes every visible toast (fires each `onDismiss`). */
  dismissAll: () => void;
}

/** Internal live model of one toast. NEVER part of the public API. */
export interface ToastEntry {
  id: string;
  tone: ToastTone;
  title: ReactNode;
  description?: ReactNode;
  onDismiss?: () => void;
  /** Remaining ms until auto-dismiss; `null` = persistent (no timer). */
  remaining: number | null;
}

/** Context shape flowing from the provider to {@link useToast}. Internal. */
export type ToastContextValue = ToastApi;
