import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";

/**
 * Props a control must receive to be wired into a {@link FormField} (RRU-044).
 * Distributed by {@link useFormField} and by `<FormField.Control>` (render-prop
 * or the root as children-as-function). Spread these onto the control element:
 * `id` is what `FormField.Label` points to via `htmlFor`; the ARIA attributes
 * announce the description and the error (`aria-errormessage` is only set —
 * and only valid, per ARIA — when the field is invalid).
 *
 * `aria-invalid` is `true` only when the `<FormField.Error>` slot is present;
 * when there is no error the key is omitted (React drops `undefined`), so Input
 * keeps its default border (Input drives its danger border from the native
 * `aria-invalid`, RRU-043 decision).
 */
export interface FormFieldControlProps {
  /** The generated control id; matched by `FormField.Label#htmlFor`. */
  id: string;
  "aria-describedby"?: string;
  "aria-errormessage"?: string;
  "aria-invalid"?: boolean;
}

/**
 * Internal context payload of {@link FormField} (RRU-044). `field` is what
 * `useFormField()` and the `<FormField.Control>` render-prop receive; the ids
 * are what the `<FormField.Description>` / `<FormField.Error>` slots stamp on
 * their own elements so the control's ARIA references resolve.
 * @internal not part of the public API (not re-exported from the barrel).
 */
export interface FormFieldContextValue {
  field: FormFieldControlProps;
  descriptionId?: string;
  errorId?: string;
}

/**
 * Props of {@link FormField} (RRU-044), the composition root that wires
 * Label–Description–Control–Error. Compound API (component-pattern.mdx §6,
 * guide §13): the root only generates ids + ARIA from the slot PRESENCE in its
 * children tree and exposes that payload through the context; the consumer
 * composes the four slots in any order:
 *
 * ```tsx
 * <FormField>
 *   <FormField.Label>Email</FormField.Label>
 *   <FormField.Description>We never share your email.</FormField.Description>
 *   <FormField.Control>{(field) => <Input {...field} />}</FormField.Control>
 *   <FormField.Error>Invalid email address.</FormField.Error>
 * </FormField>
 * ```
 *
 * The presence of `FormField.Error` drives `aria-invalid` + `aria-errormessage`
 * (and the Announced role comes from the slot itself); the presence of
 * `FormField.Description` includes its id in `aria-describedby`. Slots must be
 * reachable by walking the children tree (direct children, arrays, fragments /
 * conditional `{cond && …}`): a slot wrapped inside an arbitrary component is
 * NOT detected — that will leave the field fully valid and unannounced, so
 * keep slots as leaf siblings.
 *
 * `children` may be a single control-drawing function instead of an explicit
 * `<FormField.Control>` slot; it is called with {@link FormFieldControlProps}
 * and rendered inside the `rr-form-field-control` wrapper.
 */
export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Override the generated control id (defaults to a `useId` value). */
  controlId?: string;
  children?: ReactNode;
}

/** Props of the `<FormField.Label>` slot: a real `<label>` (`htmlFor` is
 *  forced to the control id after the spread so the association can't break). */
export interface FormFieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

/** Props of the `<FormField.Description>` slot: a `<p>` stamped with the
 *  description id (referenced by the control's `aria-describedby`). */
export interface FormFieldDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

/** Props of the `<FormField.Control>` slot: a layout wrapper that, given a
 *  function child, calls it with {@link FormFieldControlProps}. */
export interface FormFieldControlSlotProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  children?: ReactNode | ((field: FormFieldControlProps) => ReactNode);
}

/** Props of the `<FormField.Error>` slot: a `<p role="alert">` stamped with
 *  the error id (announced on mount — DoD "errores anunciados, no solo
 *  visuales" — and referenced by `aria-errormessage`/`aria-describedby`). */
export interface FormFieldErrorProps extends HTMLAttributes<HTMLParagraphElement> {}
