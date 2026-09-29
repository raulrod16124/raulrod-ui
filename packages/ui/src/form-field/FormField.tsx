import type {
  FormFieldControlProps,
  FormFieldContextValue,
  FormFieldControlSlotProps,
  FormFieldDescriptionProps,
  FormFieldErrorProps,
  FormFieldLabelProps,
  FormFieldProps,
} from "./FormField.types.js";
import type { ReactNode } from "react";

import { Children, createContext, forwardRef, isValidElement, useContext } from "react";

import { cx } from "../utils/cx.js";
import { useId } from "../utils/use-id.js";

/**
 * FormField (RRU-044): composition root that associates Label–Description–
 * Control–Error and wires the ids/ARIA automatically (guide §13). The root is
 * a pure provider: it generates the control id with `useId` (RRU-030), derives
 * the description/error ids from it, and computes the ARIA payload by walking
 * its children tree for the slot element types — so the exact same markup
 * renders server-side and client-side (no effects, SSR-safe), and conditional
 * slots (`{cond && <FormField.Error/>}`) toggle the wiring naturally.
 *
 * The payload is a {@link FormFieldControlProps} object (id + relationship
 * attributes) consumed by the `<FormField.Control>` render-prop; slots receive
 * ids through the context. The error is announced because the
 * `FormField.Error` slot renders with `role="alert"`; `aria-invalid` comes
 * from that slot's presence too (single source of truth — no redundant
 * `error`/`invalid` prop).
 *
 * API rationale: compound (component-pattern.mdx §6, ADR-004 pendiente,
 * RRU-051) because it is a 4-element structure; simple while expressive — the
 * root stores no duplication, the consumer keeps full layout control.
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(function FormField(
  { controlId, className, children, ...props },
  ref,
) {
  const generated = useId("rr-field");
  const id = controlId ?? generated;

  const [descriptionSlot, errorSlot] = collectSlots(children);
  const descriptionId = descriptionSlot ? `${id}-description` : undefined;
  const errorId = errorSlot ? `${id}-error` : undefined;
  const invalid = errorSlot;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  const field: FormFieldControlProps = {
    id,
    ...(describedBy !== undefined && { "aria-describedby": describedBy }),
    ...(invalid && { "aria-errormessage": errorId, "aria-invalid": true }),
  };

  const context: FormFieldContextValue = { field, descriptionId, errorId };

  return (
    <FormFieldContext.Provider value={context}>
      <div {...props} ref={ref} className={cx("rr-form-field", className)}>
        {children}
      </div>
    </FormFieldContext.Provider>
  );
});
FormField.displayName = "FormField";

/**
 * Public hook of {@link FormField} (RRU-044): returns the
 * {@link FormFieldControlProps} payload to spread onto a custom control that
 * cannot be drawn through `<FormField.Control>`'s render-prop. Must be called
 * inside the provider (i.e. inside a component rendered under `<FormField>`).
 */
export function useFormField(): FormFieldControlProps {
  return useFieldContext().field;
}

/** `FormField.Label` slot: binds the control via native `htmlFor` (forced after
 *  the spread so the association cannot be broken by consumer props). */
export const FormFieldLabel = forwardRef<HTMLLabelElement, FormFieldLabelProps>(
  function FormFieldLabel({ className, ...props }, ref) {
    const { field } = useFieldContext();
    return (
      <label
        {...props}
        ref={ref}
        className={cx("rr-form-field-label", className)}
        htmlFor={field.id}
      />
    );
  },
);
FormFieldLabel.displayName = "FormFieldLabel";

/** `FormField.Description` slot: carries the description id referenced by the
 *  control's `aria-describedby`. Rendered as a `<p>`. */
export const FormFieldDescription = forwardRef<HTMLParagraphElement, FormFieldDescriptionProps>(
  function FormFieldDescription({ className, ...props }, ref) {
    const { descriptionId } = useFieldContext();
    return (
      <p
        {...props}
        ref={ref}
        id={descriptionId}
        className={cx("rr-form-field-description", className)}
      />
    );
  },
);
FormFieldDescription.displayName = "FormFieldDescription";

/** `FormField.Control` slot: optional layout wrapper around the control. When
 *  `children` is a function it is called with {@link FormFieldControlProps} —
 *  the idiomatic way to bind a single control (`{(field) => <Input {...field}/>}`). */
export const FormFieldControl = forwardRef<HTMLDivElement, FormFieldControlSlotProps>(
  function FormFieldControl({ className, children, ...props }, ref) {
    const { field } = useFieldContext();
    const content = typeof children === "function" ? children(field) : children;
    return (
      <div {...props} ref={ref} className={cx("rr-form-field-control", className)}>
        {content}
      </div>
    );
  },
);
FormFieldControl.displayName = "FormFieldControl";

/** `FormField.Error` slot: stamps the error id and announces on mount with
 *  `role="alert"` (DoD: errors announced, not just visual). Its PRESENCE drives
 *  `aria-invalid` + `aria-errormessage` on the control. */
export const FormFieldError = forwardRef<HTMLParagraphElement, FormFieldErrorProps>(
  function FormFieldError({ className, ...props }, ref) {
    const { errorId } = useFieldContext();
    return (
      <p
        {...props}
        ref={ref}
        id={errorId}
        role="alert"
        className={cx("rr-form-field-error", className)}
      />
    );
  },
);
FormFieldError.displayName = "FormFieldError";

const FormFieldContext = createContext<FormFieldContextValue | null>(null);
FormFieldContext.displayName = "FormFieldContext";

function useFieldContext(): FormFieldContextValue {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error("FormField slots and useFormField() must be used within a <FormField>");
  }
  return context;
}

/**
 * Walks the children tree (recursively, honoring arrays, fragments and
 * conditional expressions) looking for the Description/Error slot types. The
 * COMPONENTS are the reference: a consumer wrapping a slot in a custom
 * component opts out of automatic wiring by definition (documented in
 * FormFieldProps). The recursion is render-phase and side-effect free, so the
 * whole wiring is deterministic under SSR.
 */
function collectSlots(children: ReactNode): [boolean, boolean] {
  let description = false;
  let error = false;

  const walk = (node: ReactNode): void => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === FormFieldDescription) {
        description = true;
      } else if (child.type === FormFieldError) {
        error = true;
      }
      const nested = (child.props as { children?: ReactNode }).children;
      if (nested !== undefined) walk(nested);
    });
  };

  walk(children);
  return [description, error];
}
