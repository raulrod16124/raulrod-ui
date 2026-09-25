import type {
  TableAlign,
  TableBodyProps,
  TableCaptionProps,
  TableCellProps,
  TableColGroupProps,
  TableColumnProps,
  TableContextValue,
  TableFootProps,
  TableHeadProps,
  TableHeaderCellProps,
  TableProps,
  TableRowProps,
  TableSize,
} from "./Table.types.js";
import type { ReactNode } from "react";

import { Children, createContext, forwardRef, isValidElement, useContext } from "react";

import { Skeleton } from "../skeleton/index.js";
import { cx } from "../utils/cx.js";
import { createVariants } from "../utils/variants.js";

/** Exhaustive axis maps (RRU-040 pattern): `size` (density — the CSS base IS
 *  the `md` default, so the modifier is only emitted when the prop is
 *  provided, Stack.gap/Avatar precedent) and `align` (layout keywords — no
 *  tokens, Stack/Inline precedent). Adding a union member breaks compilation
 *  here until its suffix exists — and the authored CSS contract check fails
 *  until the matching `rr-table--*` selector is written. */
const tableSizeModifiers: Readonly<{
  size: Record<TableSize, string>;
}> = {
  size: {
    sm: "size-sm",
    md: "size-md",
  },
};

const tableAlignmentModifiers: Readonly<{
  align: Record<TableAlign, string>;
}> = {
  align: {
    start: "align-start",
    center: "align-center",
    end: "align-end",
  },
};

const tableSizeClasses = createVariants(tableSizeModifiers);
const tableAlignmentClasses = createVariants(tableAlignmentModifiers);

/**
 * Table (RRU-065): a native, SEMANTIC data table — the accessible table model
 * (WCAG 1.3.1) instead of a grid-of-divs. The root renders a `<div
 * class="rr-table">` WRAPPER that owns the border, radius and horizontal
 * scroll (`overflow-x: auto`, the DataTable responsive contract) around a real
 * `<table class="rr-table__table">`; the `ref` targets the wrapper — the
 * scrollport — so a consumer bounds its height to also scroll vertically under
 * the sticky header.
 *
 * A11y by construction (DoD #2): native elements and roles, `scope` on every
 * `<th>` (context-aware: `col` in head/foot, `row` in body — spec 4.9.9), a
 * `<caption>` slot for the accessible name (WCAG 1.3.1), the empty state as a
 * real full-width row (text.muted over the default background, authorized
 * pair) and `aria-busy` on the `<table>` while loading. The loading body
 * replaces the consumer's rows with Skeleton rows (RRU-062) — the skeletons
 * are decorative; the table container announces with `aria-busy` (RRU-067).
 *
 * API: SIMPLE axis props on the root (`size`, `sticky`, `loading`,
 * `loadingRows`) + the COMPOSITE column/header/body/foot slots (guide §15,
 * ADR-004). The number of grid columns (`colCount`) is derived at render
 * (FormField/Tabs precedent: render-phase, side-effect-free → identical SSR
 * and client) from the head — or the `<col>`s when there is no head — and
 * feeds the empty/loading `colSpan` (fail-soft: the consumer can always
 * override via `colSpan` on their own cells).
 */
const TableRoot = forwardRef<HTMLDivElement, TableProps>(function Table(
  { size, sticky = false, loading = false, loadingRows = 3, className, children, ...props },
  ref,
) {
  const colCount = collectColumnCount(children);

  const table: TableContextValue = {
    colCount,
    size,
    loading,
    loadingRows,
    scopeDefault: "col",
  };

  return (
    <TableContext.Provider value={table}>
      <div
        {...props}
        ref={ref}
        className={cx(
          "rr-table",
          tableSizeClasses("rr-table", { size }),
          sticky && "rr-table--sticky",
          className,
        )}
      >
        <table className="rr-table__table" aria-busy={loading || undefined}>
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
});
TableRoot.displayName = "Table";

/** `Table.Head` slot: the native `<thead>` section. Its `<th>` default to
 *  `scope="col"` (narrower provider over the same TableContext). */
export const TableHead = forwardRef<HTMLTableSectionElement, TableHeadProps>(function TableHead(
  { className, children, ...props },
  ref,
) {
  const table = useTableContext();
  return (
    <TableContext.Provider value={{ ...table, scopeDefault: "col" }}>
      <thead {...props} ref={ref} className={cx("rr-table__head", className)}>
        {children}
      </thead>
    </TableContext.Provider>
  );
});
TableHead.displayName = "TableHead";

/** `Table.Body` slot: the native `<tbody>` section. Its `<th>` (row labels)
 *  default to `scope="row"`. While the root is loading, the body is REPLACED
 *  by `loadingRows` skeleton rows (Skeleton composition, `colCount` columns);
 *  otherwise, when it has no rows and `empty` is provided, a single full-width
 *  empty-state row is rendered (fail-soft: real rows always win). */
export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody(
  { empty, error, className, children, ...props },
  ref,
) {
  const table = useTableContext();

  const skeletonRows = Array.from({ length: Math.max(table.loadingRows, 0) }, (_, i) => (
    <TableRow key={`rr-table-skeleton-${i}`}>
      {Array.from({ length: Math.max(table.colCount, 1) }, (_, j) => (
        <TableCell key={j}>
          <Skeleton />
        </TableCell>
      ))}
    </TableRow>
  ));

  const hasRows = countRows(children) > 0;
  const isEmptyRow =
    !hasRows && empty !== undefined ? (
      <TableRow>
        <TableCell
          className="rr-table__empty"
          colSpan={table.colCount > 0 ? table.colCount : undefined}
        >
          {empty}
        </TableCell>
      </TableRow>
    ) : null;

  const hasError = error !== undefined && error !== null && error !== false;
  const errorRow = hasError ? (
    <TableRow>
      <TableCell colSpan={Math.max(table.colCount, 1)} className="rr-table__error">
        <div role="alert">{error}</div>
      </TableCell>
    </TableRow>
  ) : null;

  return (
    <TableContext.Provider value={{ ...table, scopeDefault: "row" }}>
      <tbody {...props} ref={ref} className={cx("rr-table__body", className)}>
        {table.loading ? skeletonRows : hasError ? errorRow : hasRows ? children : isEmptyRow}
      </tbody>
    </TableContext.Provider>
  );
});
TableBody.displayName = "TableBody";

/** `Table.Foot` slot: the native `<tfoot>` section. Its `<th>` labels default
 *  to `scope="col"` (totals under a column). */
export const TableFoot = forwardRef<HTMLTableSectionElement, TableFootProps>(function TableFoot(
  { className, children, ...props },
  ref,
) {
  const table = useTableContext();
  return (
    <TableContext.Provider value={{ ...table, scopeDefault: "col" }}>
      <tfoot {...props} ref={ref} className={cx("rr-table__foot", className)}>
        {children}
      </tfoot>
    </TableContext.Provider>
  );
});
TableFoot.displayName = "TableFoot";

/** `Table.Row` slot: the native `<tr>` row. Hover highlighting lives on BODY
 *  rows in CSS (`.rr-table__body .rr-table__row:hover` → sunken fill; pair
 *  `text.primary`/`background.sunken`, AA — color.md §6.1). */
export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { className, ...props },
  ref,
) {
  return <tr {...props} ref={ref} className={cx("rr-table__row", className)} />;
});
TableRow.displayName = "TableRow";

/** `Table.HeaderCell` slot: a native `<th>` with an explicit, context-aware
 *  `scope` (consumer `scope` wins, else the section default) and optional
 *  `align` / `numeric` (tabular-nums, typography.md §5). */
export const TableHeaderCell = forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  function TableHeaderCell({ scope, align, numeric, className, ...props }, ref) {
    const table = useTableContext();
    return (
      <th
        {...props}
        ref={ref}
        scope={scope ?? table.scopeDefault}
        className={cx(
          "rr-table__header",
          tableAlignmentClasses("rr-table__header", { align }),
          numeric && "rr-table__header--numeric",
          className,
        )}
      />
    );
  },
);
TableHeaderCell.displayName = "TableHeaderCell";

/** `Table.Cell` slot: a native `<td>` with optional `align` / `numeric`.
 *  `colSpan`/`rowSpan` pass through natively. */
export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { align, numeric, className, ...props },
  ref,
) {
  return (
    <td
      {...props}
      ref={ref}
      className={cx(
        "rr-table__cell",
        tableAlignmentClasses("rr-table__cell", { align }),
        numeric && "rr-table__cell--numeric",
        className,
      )}
    />
  );
});
TableCell.displayName = "TableCell";

/** `Table.Caption` slot: a native `<caption>` giving the table its accessible
 *  name (WCAG 1.3.1). Must be the FIRST child of `<Table>`, as the HTML parser
 *  requires (React does not reorder children). */
export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  function TableCaption({ className, ...props }, ref) {
    return <caption {...props} ref={ref} className={cx("rr-table__caption", className)} />;
  },
);
TableCaption.displayName = "TableCaption";

/** `Table.ColGroup` slot: a native `<colgroup>` carrying the column SIZING
 *  (widths via `style`/`span`, consumer data). */
export const TableColGroup = forwardRef<HTMLTableColElement, TableColGroupProps>(
  function TableColGroup({ className, ...props }, ref) {
    return <colgroup {...props} ref={ref} className={cx("rr-table__colgroup", className)} />;
  },
);
TableColGroup.displayName = "TableColGroup";

/** `Table.Column` slot: a native `<col>` (one per grid column). */
export const TableColumn = forwardRef<HTMLTableColElement, TableColumnProps>(function TableColumn(
  { className, ...props },
  ref,
) {
  return <col {...props} ref={ref} className={cx("rr-table__col", className)} />;
});
TableColumn.displayName = "TableColumn";

// Slots mounted as properties of the root (ADR-004 §Decision mecánica):
// `<Table.Caption>`, `<Table.ColGroup>`, `<Table.Column>`, `<Table.Head>`,
// `<Table.Body>`, `<Table.Foot>`, `<Table.Row>`, `<Table.HeaderCell>`,
// `<Table.Cell>`. The root is a `forwardRef` (unlike the dialog-family
// providers) so `Object.assign` stamps the slots onto its type — the first
// forwardRef root with mounted statics (RRU-065).
export const Table = Object.assign(TableRoot, {
  Caption: TableCaption,
  ColGroup: TableColGroup,
  Column: TableColumn,
  Head: TableHead,
  Body: TableBody,
  Foot: TableFoot,
  Row: TableRow,
  HeaderCell: TableHeaderCell,
  Cell: TableCell,
});

const TableContext = createContext<TableContextValue | null>(null);
TableContext.displayName = "TableContext";

function useTableContext(): TableContextValue {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error("Table slots must be used within a <Table> root");
  }
  return context;
}

/** Grid column detection (ADR-004, Dialog `collectSlots` precedent): the
 *  number of columns — the `<th>` count inside the HEAD when there is one
 *  (spec 4.9.9: a header row defines the grid columns), else the `<col>` count
 *  of the `<colgroup>`. One source wins: the colgroup `<col>`s are sizing
 *  HINTS for the same grid, so a head present makes them redundant — counting
 *  both would over-span the empty/loading row. Body row headers
 *  (`scope="row"`, N per row) are per-row labels and are deliberately
 *  excluded; `aria-busy` skeletons and the empty row span `colCount`.
 *  Render-phase + side-effect free → identical on server and client. */
function collectColumnCount(children: ReactNode): number {
  let hasHead = false;
  let headCells = 0;
  let cols = 0;

  const countCols = (node: ReactNode): void => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === TableColumn) cols += 1;
      countCols((child.props as { children?: ReactNode }).children);
    });
  };

  const walk = (node: ReactNode): void => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === TableHead) {
        hasHead = true;
        walk((child.props as { children?: ReactNode }).children);
        return;
      }
      if (child.type === TableColGroup) {
        countCols((child.props as { children?: ReactNode }).children);
        return;
      }
      if (child.type === TableBody || child.type === TableFoot) return;
      if (child.type === TableHeaderCell) {
        headCells += 1;
        return;
      }
      walk((child.props as { children?: ReactNode }).children);
    });
  };

  walk(children);
  return hasHead ? headCells : cols;
}

/** Row detection for the empty state (same walk): the body renders its
 *  `empty` slot only when it has NO `<Table.Row>` descendants (arrays,
 *  fragments and conditional expressions honored) — consumer data always wins
 *  (fail-soft). */
function countRows(children: ReactNode): number {
  let rows = 0;

  const walk = (node: ReactNode): void => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === TableRow) {
        rows += 1;
        return;
      }
      walk((child.props as { children?: ReactNode }).children);
    });
  };

  walk(children);
  return rows;
}
