import type {
  ColHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

/** Row density axis of {@link Table} (RRU-065, uniform axis §24). `md` is the
 *  CSS base default (the modifier is only emitted when the prop is provided);
 *  `sm` is the dense DataTable meter. Token-derived font sizes: base cells use
 *  `font.size.sm`, `sm` rows drop to `font.size.xs` with tighter padding. */
export type TableSize = "sm" | "md";

/** Horizontal text alignment of a header/cell across its width — a *layout*
 *  keyword, NOT a design token (Stack/Inline alignment precedent, RRU-031):
 *  `text-align` start/center/end. Default `start`. */
export type TableAlign = "start" | "center" | "end";

/** Association scope of a `<th>`, per the HTML spec (4.9.9). `col` links the
 *  header to the column below it; `row` to the row to its right (row labels in
 *  the body). Defaults are context-aware ({@link TableHeaderCellProps}). */
export type TableScope = "col" | "row" | "colgroup" | "rowgroup";

/**
 * Props of {@link Table} (RRU-065), the composition root. Renders a real
 * `<table>` inside a wrapping `<div class="rr-table">` that owns the border,
 * radius and horizontal scroll (responsive overflow, EPIC 6 DoD). The `ref`
 * targets the WRAPPER div (the scrollport): bound its height to constrain the
 * vertical scroll that the sticky header tracks on.
 *
 * State: `loading` keeps the consumer's data mounted-out and replaces the body
 * with `loadingRows` Skeleton rows — announced via `aria-busy` on the `<table>`
 * (skeleton is decorative, RRU-062/067), dropped to `0` to render none.
 *
 * ```
 * <Table size="md" sticky loading caption="Facturas">
 *   <Table.ColGroup><Table.Column style={{ width: 96 }} /></Table.ColGroup>
 *   <Table.Head>…</Table.Head>
 *   <Table.Body empty="Sin resultados">…</Table.Body>
 *   <Table.Foot>…</Table.Foot>
 * </Table>
 * ```
 */
export interface TableProps extends HTMLAttributes<HTMLDivElement> {
  /** Row density: `sm` (dense) vs `md` (default, CSS base). */
  size?: TableSize;
  /** Sticky header: the `thead` cells stick to the top of the `.rr-table`
   *  scroll container while it scrolls (mechanics `position: sticky`, `top:
   *  0`, surface fill so body rows never show through). */
  sticky?: boolean;
  /** Loading state: `aria-busy` on the table + skeleton rows over the body. */
  loading?: boolean;
  /** Number of skeleton rows while `loading` (default `3`). */
  loadingRows?: number;
}

/** Props of the `<Table.Head>` slot: the native `<thead>` section. */
export interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {}

/** Props of the `<Table.Body>` slot: the native `<tbody>` section. `empty`
 *  implements the empty state: when the body has NO rows, a single full-width
 *  row (`colSpan` = the header column count of the table, or the consumer's own
 *  `colSpan` on the fallback) is rendered with the message centered — text.muted,
 *  the already-authorized muted pair. Fail-soft: when real rows exist the
 *  consumer's children win; without an `empty` prop nothing is rendered. */
export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  /** Empty-state content, rendered in a single centered full-width row when the
   *  body has no rows (default `undefined` → no empty row). */
  empty?: ReactNode;
  error?: ReactNode;
}

/** Props of the `<Table.Foot>` slot: the native `<tfoot>` section. */
export interface TableFootProps extends HTMLAttributes<HTMLTableSectionElement> {}

/** Props of the `<Table.Row>` slot: the native `<tr>` row. Hover highlighting
 *  lives on body rows in CSS (sunken fill — pair text.primary/sunken AA,
 *  color.md §6.1). */
export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {}

/** Props of the `<Table.HeaderCell>` slot: a native `<th>`. `scope` is
 *  context-aware — defaults to `col` inside `Table.Head`/`Table.Foot` and to
 *  `row` inside `Table.Body` (spec 4.9.9), always overridable. `numeric`
 *  activates the `font.numeric.tabular-nums` token (typography.md §5) so figure
 *  columns align digit-to-digit. */
export interface TableHeaderCellProps extends Omit<
  ThHTMLAttributes<HTMLTableCellElement>,
  "align" | "scope"
> {
  /** Explicit association scope (default: context-aware, see above). */
  scope?: TableScope;
  /** Horizontal text alignment (layout keyword, default `start`). */
  align?: TableAlign;
  /** Tabular figures for numeric content (`font-variant-numeric: tabular-nums`). */
  numeric?: boolean;
}

/** Props of the `<Table.Cell>` slot: a native `<td>`. Accepts the native
 *  `colSpan`/`rowSpan`; `numeric` behaves like {@link TableHeaderCellProps}. */
export interface TableCellProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, "align"> {
  /** Horizontal text alignment (layout keyword, default `start`). */
  align?: TableAlign;
  /** Tabular figures for numeric content (`font-variant-numeric: tabular-nums`). */
  numeric?: boolean;
}

/** Props of the `<Table.Caption>` slot: a native `<caption>` (WCAG 1.3.1 —
 *  the table's accessible name). MUST be the first child of `<Table>`, as the
 *  HTML parser requires. */
export interface TableCaptionProps extends HTMLAttributes<HTMLTableCaptionElement> {}

/** Props of the `<Table.ColGroup>` slot: a native `<colgroup>` carrying the
 *  column sizing (widths via `style`, `span`, … consumer data — Portal
 *  coordinates precedent). */
export interface TableColGroupProps extends ColHTMLAttributes<HTMLTableColElement> {}

/** Props of the `<Table.Column>` slot: a native `<col>`. */
export interface TableColumnProps extends ColHTMLAttributes<HTMLTableColElement> {}

/**
 * Internal context payload of {@link Table} (RRU-065), consumed by the slots.
 * The ROOT is the source of truth for the "numbers" (the header column count
 * derived during render — it defines the empty/loading `colSpan`), the density,
 * the loading state its body renders and the default `<th>` scope. The sections
 * re-provide the SAME context type with a narrower `scopeDefault` only
 * (Head/Foot → `col`, Body → `row`): a single context per component
 * (ADR-004), nested for the section-aware default. Never styled and never part
 * of the public API.
 * @internal not re-exported from the package root (frontera §24).
 */
export interface TableContextValue {
  /** Number of grid columns (header `<th>` count in the head, or `<col>` count
   *  when there is no head) — the `colSpan` of the empty/loading fallback. */
  colCount: number;
  /** Row density from the root (undefined → CSS base `md`). */
  size: TableSize | undefined;
  /** Loading flag from the root (the body renders skeletons). */
  loading: boolean;
  /** Skeleton rows while loading. */
  loadingRows: number;
  /** Default `<th>` scope of the current section. */
  scopeDefault: TableScope;
}
