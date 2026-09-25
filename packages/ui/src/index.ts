/* eslint-disable import-x/export -- `export *` from @raulrod/icons intentionally
   overlaps the local exports: ESM gives explicit exports precedence over star
   exports, so `Heading`/`Text` resolve to OUR components and the same-named
   lucide icons stay reachable via @raulrod/icons (ADR-007, RRU-041). */
export { cx } from "./utils/cx.js";
export type { CxValue } from "./utils/cx.js";
export { useId } from "./utils/use-id.js";
export { Inline } from "./inline/index.js";
export type { InlineProps } from "./inline/index.js";
export { Stack } from "./stack/index.js";
export type { StackProps } from "./stack/index.js";
export { Heading } from "./heading/index.js";
export type { HeadingLevel, HeadingProps } from "./heading/index.js";
export { Text } from "./text/index.js";
export type { TextProps } from "./text/index.js";
export { VisuallyHidden } from "./visually-hidden/index.js";
export type { VisuallyHiddenProps } from "./visually-hidden/index.js";
export { Portal } from "./portal/index.js";
export type { PortalProps } from "./portal/index.js";
export { Button } from "./button/index.js";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./button/index.js";
export { IconButton } from "./icon-button/index.js";
export type { IconButtonProps, IconButtonSize, IconButtonVariant } from "./icon-button/index.js";
export { Input } from "./input/index.js";
export type { InputProps, InputSize } from "./input/index.js";
export { Textarea } from "./textarea/index.js";
export type { TextareaProps, TextareaSize } from "./textarea/index.js";
export { Checkbox } from "./checkbox/index.js";
export type { CheckboxProps, CheckboxSize } from "./checkbox/index.js";
export { Radio, RadioGroup } from "./radio/index.js";
export type {
  RadioGroupOrientation,
  RadioGroupProps,
  RadioProps,
  RadioSize,
} from "./radio/index.js";
export { Switch } from "./switch/index.js";
export type { SwitchProps, SwitchSize } from "./switch/index.js";
export { Badge } from "./badge/index.js";
export type { BadgeProps, BadgeVariant } from "./badge/index.js";
export { Avatar } from "./avatar/index.js";
export type { AvatarProps, AvatarSize } from "./avatar/index.js";
export { Skeleton } from "./skeleton/index.js";
export type { SkeletonProps, SkeletonVariant } from "./skeleton/index.js";
export { Pagination } from "./pagination/index.js";
export type { PaginationProps } from "./pagination/index.js";
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColGroup,
  TableColumn,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "./table/index.js";
export type {
  TableAlign,
  TableBodyProps,
  TableCaptionProps,
  TableCellProps,
  TableColGroupProps,
  TableColumnProps,
  TableFootProps,
  TableHeadProps,
  TableHeaderCellProps,
  TableProps,
  TableRowProps,
  TableScope,
  TableSize,
} from "./table/index.js";
export { DataTable } from "./data-table/index.js";
export type {
  DataTableColumn,
  DataTableFiltering,
  DataTableKey,
  DataTablePagination,
  DataTableProps,
  DataTableRowId,
  DataTableRowSelection,
  DataTableSort,
  DataTableSortDirection,
  DataTableSorting,
} from "./data-table/index.js";
export {
  FormField,
  FormFieldControl,
  FormFieldDescription,
  FormFieldError,
  FormFieldLabel,
  useFormField,
} from "./form-field/index.js";
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog/index.js";
export { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "./popover/index.js";
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu/index.js";
export { Tooltip } from "./tooltip/index.js";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select/index.js";
export { Tabs, TabsList, TabsPanel, TabsTrigger } from "./tabs/index.js";
export { ToastProvider, useToast } from "./toast/index.js";
export type {
  ToastApi,
  ToastInput,
  ToastProviderProps,
  ToastRole,
  ToastTone,
} from "./toast/index.js";
export type {
  DialogContentProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogProps,
  DialogTitleProps,
  DialogTriggerProps,
} from "./dialog/index.js";
export type {
  PopoverContentProps,
  PopoverPlacement,
  PopoverProps,
  PopoverTitleProps,
  PopoverTriggerProps,
} from "./popover/index.js";
export type {
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuPlacement,
  DropdownMenuProps,
  DropdownMenuSeparatorProps,
  DropdownMenuSubContentProps,
  DropdownMenuSubProps,
  DropdownMenuSubTriggerProps,
  DropdownMenuTriggerProps,
} from "./dropdown-menu/index.js";
export type { TooltipProps } from "./tooltip/index.js";
export type {
  SelectContentProps,
  SelectGroupProps,
  SelectIconProps,
  SelectItemProps,
  SelectLabelProps,
  SelectPlacement,
  SelectProps,
  SelectSize,
  SelectTriggerProps,
  SelectValueProps,
} from "./select/index.js";
export type {
  TabsContextValue,
  TabsIdEntry,
  TabsListProps,
  TabsPanelProps,
  TabsProps,
  TabsRovingItem,
  TabsTriggerProps,
} from "./tabs/index.js";
export type {
  FormFieldControlProps,
  FormFieldControlSlotProps,
  FormFieldDescriptionProps,
  FormFieldErrorProps,
  FormFieldLabelProps,
  FormFieldProps,
} from "./form-field/index.js";
// ADR-007 / decisión de producto #2: el entry point público re-exporta todo el
// set de iconos para que los consumidores no dependan de lucide-react
// directamente (RRU-041, sesión 2026-09-23).
export * from "@raulrod/icons";
