import type { ProgressProps } from "./Progress.types.js";

import { forwardRef } from "react";

import { cx } from "../utils/cx.js";

const MIN_VALUE = 0;
const MAX_VALUE = 100;
const INDETERMINATE_WIDTH = 35;

function normalizeValue(value: number): number {
  if (!Number.isFinite(value)) return MIN_VALUE;
  return Math.min(MAX_VALUE, Math.max(MIN_VALUE, value));
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { label, value, indeterminate = false, className, ...props },
  ref,
) {
  const normalizedValue = normalizeValue(value ?? MIN_VALUE);

  return (
    <div
      {...props}
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuemin={MIN_VALUE}
      aria-valuemax={MAX_VALUE}
      aria-valuenow={indeterminate ? undefined : normalizedValue}
      className={cx("rr-progress", indeterminate && "rr-progress--indeterminate", className)}
    >
      <span
        aria-hidden="true"
        className="rr-progress__indicator"
        style={{ width: `${indeterminate ? INDETERMINATE_WIDTH : normalizedValue}%` }}
      />
    </div>
  );
});
Progress.displayName = "Progress";
