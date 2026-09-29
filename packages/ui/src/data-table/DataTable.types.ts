import type { TableAlign, TableSize } from "../table/index.js";
import type { HTMLAttributes, ReactNode } from "react";

export type DataTableRowId = string | number;

export type DataTableKey<T> = Extract<keyof T, string>;

export type DataTableSortDirection = "asc" | "desc";

export interface DataTableSort<T> {
  key: DataTableKey<T>;
  direction: DataTableSortDirection;
}

export interface DataTableColumn<T> {
  key: DataTableKey<T>;
  header: string;
  render?: (row: T) => ReactNode;
  align?: TableAlign;
  numeric?: boolean;
  sortable?: boolean;
}

export interface DataTableSorting<T> {
  value?: DataTableSort<T> | null;
  defaultValue?: DataTableSort<T> | null;
  onChange?: (value: DataTableSort<T> | null) => void;
}

export interface DataTableFiltering<T> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  getValue?: (row: T) => string;
  label?: string;
  placeholder?: string;
}

export interface DataTablePagination {
  pageSize: number;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  label?: string;
}

export interface DataTableRowSelection<T, RowId extends DataTableRowId> {
  getRowLabel: (row: T) => string;
  selectedRowIds?: ReadonlySet<RowId>;
  defaultSelectedRowIds?: Iterable<RowId>;
  onChange?: (selectedRowIds: ReadonlySet<RowId>) => void;
}

export interface DataTableProps<T, RowId extends DataTableRowId = DataTableRowId> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  data: readonly T[];
  columns: readonly DataTableColumn<T>[];
  getRowId: (row: T) => RowId;
  caption: string;
  sorting?: DataTableSorting<T>;
  filtering?: DataTableFiltering<T>;
  pagination?: DataTablePagination;
  rowSelection?: DataTableRowSelection<T, RowId>;
  loading?: boolean;
  loadingRows?: number;
  empty?: ReactNode;
  error?: ReactNode;
  size?: TableSize;
  sticky?: boolean;
}
