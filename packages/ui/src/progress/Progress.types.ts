import type { HTMLAttributes } from "react";

type ProgressNativeProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-label" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "children" | "role"
>;

type ProgressBaseProps = ProgressNativeProps & {
  label: string;
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
