import type {
  DataTableColumn,
  DataTableProps,
  DataTableRowId,
  DataTableSort,
  DataTableSortDirection,
} from "./DataTable.types.js";
import type { ChangeEvent, ForwardedRef, ReactNode, RefAttributes } from "react";

import { forwardRef, useEffect, useState } from "react";

import { Button } from "../button/index.js";
import { Checkbox } from "../checkbox/index.js";
import { Input } from "../input/index.js";
import { Pagination } from "../pagination/index.js";
import { Table } from "../table/index.js";
import { cx } from "../utils/cx.js";
import { mergeStyles } from "../utils/merge-styles.js";
import { useId as useDesignSystemId } from "../utils/use-id.js";
import { VisuallyHidden } from "../visually-hidden/index.js";

import {
  filterDataTableRows,
  getDataTablePage,
  getDataTablePageCount,
  getNextDataTableSort,
  getVisibleDataTableRows,
  sortDataTableRows,
} from "./data-table.js";

interface DataTableComponent {
  <T, RowId extends DataTableRowId = DataTableRowId>(
    props: DataTableProps<T, RowId> & RefAttributes<HTMLDivElement>,
  ): ReactNode;
  displayName?: string;
}

/** Default localized-English strings: every sentence the component
 *  COMPOSES is overridable per feature config, with these as the compatible
 *  defaults. Plain strings (`label`, `placeholder`, `empty`, `caption`) were
 *  always consumer-owned; only the composed ones needed a function. */

function defaultSortButtonLabel<T>(
  column: DataTableColumn<T>,
  direction: DataTableSortDirection | undefined,
): string {
  return `Sort by ${column.header}, ${
    direction ? `sorted ${direction === "asc" ? "ascending" : "descending"}` : "not sorted"
  }`;
}

function defaultSortAnnouncement<T>(
  sort: DataTableSort<T> | null,
  column: DataTableColumn<T>,
): string {
  return sort
    ? `Sorted by ${column.header} ${sort.direction === "asc" ? "ascending" : "descending"}`
    : "Sorting cleared";
}

function defaultFilterAnnouncement(visibleCount: number, totalCount: number): string {
  return `${visibleCount} of ${totalCount} rows`;
}

function defaultSelectionAnnouncement(selectedCount: number): string {
  return `${selectedCount} ${selectedCount === 1 ? "row" : "rows"} selected`;
}

function defaultPageAnnouncement(page: number, pageCount: number): string {
  return `Page ${page} of ${pageCount}`;
}

function defaultPaginationLabel(caption: string): string {
  return `${caption} pagination`;
}

function defaultRowToggleLabel(rowLabel: string): string {
  return `Select ${rowLabel}`;
}

function defaultAllToggleLabel(allSelected: boolean): string {
  return allSelected ? "Deselect all filtered rows" : "Select all filtered rows";
}

function rowReactKey(rowId: DataTableRowId): string {
  return `${typeof rowId}:${String(rowId)}`;
}

function cellValue(value: unknown): ReactNode {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString();
  }
  if (typeof value === "boolean") return String(value);
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return value;
  }
  return String(value);
}

const DataTableRoot = forwardRef(function DataTable<T, RowId extends DataTableRowId>(
  {
    data,
    columns,
    getRowId,
    caption,
    sorting,
    filtering,
    pagination,
    rowSelection,
    loading = false,
    loadingRows = 3,
    empty = "No results",
    error,
    size = "sm",
    sticky = false,
    styles,
    style,
    classNames,
    className,
    ...props
  }: DataTableProps<T, RowId>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const id = useDesignSystemId("rr-data-table");
  const filterControlled = filtering?.value !== undefined;
  const sortControlled = sorting?.value !== undefined;
  const pageControlled = pagination?.page !== undefined;
  const selectionControlled = rowSelection?.selectedRowIds !== undefined;
  const [uncontrolledFilterValue, setUncontrolledFilterValue] = useState(
    filtering?.defaultValue ?? "",
  );
  const [uncontrolledSort, setUncontrolledSort] = useState<DataTableSort<T> | null>(
    sorting?.defaultValue ?? null,
  );
  const [uncontrolledPage, setUncontrolledPage] = useState(pagination?.defaultPage ?? 1);
  const [uncontrolledSelection, setUncontrolledSelection] = useState<ReadonlySet<RowId>>(
    () => new Set(rowSelection?.defaultSelectedRowIds ?? []),
  );
  // Polite live-region sentence of the LAST user action (sort, filter, selection
  // or page change). Action-driven by design: an external change of controlled
  // props or data never announces — only what the user did through the table's
  // own controls. `null` until the first action, so the region mounts SILENT
  // (never announces the initial state on load). Reset to page one by a filter
  // is part of the filter announcement's result, not a separate sentence.
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const filterValue = filtering
    ? filterControlled
      ? (filtering.value ?? "")
      : uncontrolledFilterValue
    : "";
  const activeSort = sorting ? (sortControlled ? (sorting.value ?? null) : uncontrolledSort) : null;
  const selectedRowIds = selectionControlled
    ? (rowSelection?.selectedRowIds ?? new Set<RowId>())
    : uncontrolledSelection;

  const filteredRows = filtering
    ? filterDataTableRows(data, filterValue, columns, filtering.getValue)
    : data;
  const sortedRows = sortDataTableRows(filteredRows, activeSort);
  const pageSize = pagination?.pageSize ?? 10;
  const pageCount = pagination ? getDataTablePageCount(sortedRows.length, pageSize) : 1;
  const page = pagination ? getDataTablePage(pagination.page ?? uncontrolledPage, pageCount) : 1;
  const visibleRows = pagination ? getVisibleDataTableRows(sortedRows, page, pageSize) : sortedRows;
  const hasError = error !== undefined && error !== null && error !== false;
  const selectedFilteredCount = filteredRows.reduce(
    (count, row) => count + (selectedRowIds.has(getRowId(row)) ? 1 : 0),
    0,
  );
  const allFilteredSelected =
    filteredRows.length > 0 && selectedFilteredCount === filteredRows.length;
  const someFilteredSelected = selectedFilteredCount > 0 && !allFilteredSelected;

  useEffect(() => {
    if (pageControlled) return;
    const normalizedPage = getDataTablePage(uncontrolledPage, pageCount);
    if (normalizedPage !== uncontrolledPage) setUncontrolledPage(normalizedPage);
  }, [pageControlled, pageCount, uncontrolledPage]);

  const commitPage = (nextPage: number): void => {
    const normalized = getDataTablePage(nextPage, pageCount);
    if (normalized === page) return;
    if (!pageControlled) setUncontrolledPage(normalized);
    setAnnouncement(
      (pagination?.getAnnouncement ?? defaultPageAnnouncement)(normalized, pageCount),
    );
    pagination?.onPageChange?.(normalized);
  };

  const resetPage = (): void => {
    if (!pagination) return;
    const storedPage = pageControlled ? pagination.page : uncontrolledPage;
    if (storedPage === 1) return;
    if (!pageControlled) setUncontrolledPage(1);
    pagination.onPageChange?.(1);
  };

  const commitSort = (nextSort: DataTableSort<T> | null, column: DataTableColumn<T>): void => {
    if (!sortControlled) setUncontrolledSort(nextSort);
    setAnnouncement((sorting?.getAnnouncement ?? defaultSortAnnouncement)(nextSort, column));
    sorting?.onChange?.(nextSort);
  };

  const commitSelection = (nextSelection: ReadonlySet<RowId>): void => {
    if (!selectionControlled) setUncontrolledSelection(nextSelection);
    setAnnouncement(
      (rowSelection?.getAnnouncement ?? defaultSelectionAnnouncement)(nextSelection.size),
    );
    rowSelection?.onChange?.(nextSelection);
  };

  const changeFilter = (event: ChangeEvent<HTMLInputElement>): void => {
    const nextValue = event.currentTarget.value;
    if (!filterControlled) setUncontrolledFilterValue(nextValue);
    const nextVisibleCount = filtering
      ? filterDataTableRows(data, nextValue, columns, filtering.getValue).length
      : data.length;
    setAnnouncement(
      (filtering?.getAnnouncement ?? defaultFilterAnnouncement)(nextVisibleCount, data.length),
    );
    filtering?.onChange?.(nextValue);
    resetPage();
  };

  const changeRowSelection = (rowId: RowId, checked: boolean): void => {
    const nextSelection = new Set(selectedRowIds);
    if (checked) nextSelection.add(rowId);
    else nextSelection.delete(rowId);
    commitSelection(nextSelection);
  };

  const changeFilteredSelection = (checked: boolean): void => {
    const nextSelection = new Set(selectedRowIds);
    for (const row of filteredRows) {
      const rowId = getRowId(row);
      if (checked) nextSelection.add(rowId);
      else nextSelection.delete(rowId);
    }
    commitSelection(nextSelection);
  };

  const tableRows = visibleRows.map((row, rowIndex) => {
    const rowId = getRowId(row);
    return (
      <Table.Row key={rowReactKey(rowId)}>
        {rowSelection && (
          <Table.Cell align="center" className="rr-data-table__selection-cell">
            <Checkbox
              id={`${id}-row-${rowIndex}`}
              name={`${id}-selection`}
              size="sm"
              checked={selectedRowIds.has(rowId)}
              aria-label={(rowSelection.getRowToggleLabel ?? defaultRowToggleLabel)(
                rowSelection.getRowLabel(row),
              )}
              onChange={(event) => changeRowSelection(rowId, event.currentTarget.checked)}
            />
          </Table.Cell>
        )}
        {columns.map((column) => (
          <Table.Cell key={column.key} align={column.align} numeric={column.numeric}>
            {column.render ? column.render(row) : cellValue(row[column.key])}
          </Table.Cell>
        ))}
      </Table.Row>
    );
  });

  return (
    <div
      {...props}
      ref={ref}
      style={mergeStyles(styles, style)}
      className={cx("rr-data-table", classNames?.root, className)}
    >
      {filtering && (
        <div className={cx("rr-data-table__toolbar", classNames?.toolbar)}>
          <div className={cx("rr-data-table__filter", classNames?.filter)}>
            <label className="rr-data-table__filter-label" htmlFor={`${id}-filter`}>
              {filtering.label ?? "Filter rows"}
            </label>
            <Input
              id={`${id}-filter`}
              type="search"
              size="sm"
              autoComplete="off"
              value={filterValue}
              placeholder={filtering.placeholder}
              onChange={changeFilter}
            />
          </div>
        </div>
      )}
      <Table size={size} sticky={sticky} loading={loading} loadingRows={loadingRows}>
        <Table.Caption>{caption}</Table.Caption>
        <Table.Head>
          <Table.Row>
            {rowSelection && (
              <Table.HeaderCell align="center" className="rr-data-table__selection-cell">
                <Checkbox
                  id={`${id}-select-all`}
                  name={`${id}-selection`}
                  size="sm"
                  checked={allFilteredSelected}
                  indeterminate={someFilteredSelected}
                  disabled={loading || hasError || filteredRows.length === 0}
                  aria-label={(rowSelection.getAllToggleLabel ?? defaultAllToggleLabel)(
                    allFilteredSelected,
                  )}
                  onChange={(event) => changeFilteredSelection(event.currentTarget.checked)}
                />
              </Table.HeaderCell>
            )}
            {columns.map((column) => {
              const sortable = column.sortable === true && sorting !== undefined;
              const direction = activeSort?.key === column.key ? activeSort.direction : undefined;
              const ariaSort =
                direction === "asc" ? "ascending" : direction === "desc" ? "descending" : undefined;
              return (
                <Table.HeaderCell
                  key={column.key}
                  align={column.align}
                  numeric={column.numeric}
                  aria-sort={ariaSort}
                  className={sortable ? "rr-data-table__header--sortable" : undefined}
                >
                  {sortable ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rr-data-table__sort-button"
                      aria-label={(sorting?.getSortButtonLabel ?? defaultSortButtonLabel)(
                        column,
                        direction,
                      )}
                      onClick={() =>
                        commitSort(getNextDataTableSort(activeSort, column.key), column)
                      }
                    >
                      <span>{column.header}</span>
                      {direction && (
                        <span className="rr-data-table__sort-indicator" aria-hidden="true">
                          {direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  ) : (
                    column.header
                  )}
                </Table.HeaderCell>
              );
            })}
          </Table.Row>
        </Table.Head>
        <Table.Body empty={empty} error={error}>
          {tableRows}
        </Table.Body>
      </Table>
      {pagination && pageCount > 1 && !loading && !hasError && (
        <div className={cx("rr-data-table__footer", classNames?.footer)}>
          <Pagination
            className="rr-data-table__pagination"
            page={page}
            pageCount={pageCount}
            onPageChange={commitPage}
            aria-label={
              pagination.label ?? (pagination.getLabel ?? defaultPaginationLabel)(caption)
            }
            announcePageChange={false}
          />
        </div>
      )}
      {/* The table's ONE announcement channel (RRU-119): always mounted at the
          root — it survives the pagination bar unmounting (single page,
          loading, error), which is exactly when the user needs to hear what
          happened. The composed Pagination keeps its own region OFF. */}
      <VisuallyHidden role="status" aria-live="polite">
        {announcement}
      </VisuallyHidden>
    </div>
  );
});
DataTableRoot.displayName = "DataTable";

export const DataTable = DataTableRoot as DataTableComponent;
