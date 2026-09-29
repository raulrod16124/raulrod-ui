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
  /** Accessible name of each sortable column's sort button (2.5.3/4.1.2).
   *  Defaults to `Sort by {header}, sorted ascending|descending` and
   *  `Sort by {header}, not sorted`. */
  getSortButtonLabel?: (
    column: DataTableColumn<T>,
    direction: DataTableSortDirection | undefined,
  ) => string;
  /** Sentence the table's polite live region announces after each sort commit.
   *  Defaults to `Sorted by {header} ascending|descending`, and to
   *  `Sorting cleared` when the third activation removes the sort. */
  getAnnouncement?: (sort: DataTableSort<T> | null, column: DataTableColumn<T>) => string;
}

export interface DataTableFiltering<T> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  getValue?: (row: T) => string;
  label?: string;
  placeholder?: string;
  /** Sentence the table's polite live region announces after each filter
   *  change. Defaults to `{visibleCount} of {totalCount} rows`. */
  getAnnouncement?: (visibleCount: number, totalCount: number) => string;
}

export interface DataTablePagination {
  pageSize: number;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  label?: string;
  /** Composes the pagination landmark's `aria-label` from the table `caption`.
   *  Defaults to `{caption} pagination`; a full `label` override still wins. */
  getLabel?: (caption: string) => string;
  /** Sentence the table's polite live region announces after each page commit.
   *  Defaults to `Page {page} of {pageCount}`. */
  getAnnouncement?: (page: number, pageCount: number) => string;
}

export interface DataTableRowSelection<T, RowId extends DataTableRowId> {
  getRowLabel: (row: T) => string;
  selectedRowIds?: ReadonlySet<RowId>;
  defaultSelectedRowIds?: Iterable<RowId>;
  onChange?: (selectedRowIds: ReadonlySet<RowId>) => void;
  /** Accessible name of each row's selection checkbox (4.1.2). Defaults to
   *  `Select {getRowLabel(row)}`. */
  getRowToggleLabel?: (rowLabel: string) => string;
  /** Accessible name of the select-all checkbox. Defaults to
   *  `Select all filtered rows` / `Deselect all filtered rows`. */
  getAllToggleLabel?: (allSelected: boolean) => string;
  /** Sentence the table's polite live region announces after each selection
   *  commit (row toggle or select-all). Defaults to
   *  `{selectedCount} row|rows selected`. */
  getAnnouncement?: (selectedCount: number) => string;
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
