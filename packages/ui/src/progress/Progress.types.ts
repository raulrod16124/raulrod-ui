import type { Styles } from "../style-tokens.generated.js";
import type { HTMLAttributes } from "react";

type ProgressNativeProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-label" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "children" | "role"
>;

type ProgressBaseProps = ProgressNativeProps & {
  label: string;
  /** Token overrides for this component instance. Keys are the CSS tokens the component consumes. */
  styles?: Styles<"progress">;
};

export type ProgressProps =
  | (ProgressBaseProps & {
      indeterminate?: false;
      value: number;
    })
  | (ProgressBaseProps & {
      indeterminate: true;
      value?: never;
    });
