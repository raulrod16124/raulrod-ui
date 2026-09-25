import type { DataTableColumn, DataTableKey, DataTableSort } from "./DataTable.types.js";

function stringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString();
  }
  try {
    return String(value);
  } catch {
    return "";
  }
}

function missingValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "number" && Number.isNaN(value)) ||
    (value instanceof Date && Number.isNaN(value.getTime()))
  );
}

function textCompare(left: string, right: string): number {
  const normalizedLeft = left.toLowerCase();
  const normalizedRight = right.toLowerCase();
  if (normalizedLeft < normalizedRight) return -1;
  if (normalizedLeft > normalizedRight) return 1;
  return 0;
}

function valueCompare(left: unknown, right: unknown): number {
  if (typeof left === "number" && typeof right === "number") {
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }
  if (typeof left === "bigint" && typeof right === "bigint") {
    return left < right ? -1 : left > right ? 1 : 0;
  }
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime();
  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }
  return textCompare(stringValue(left), stringValue(right));
}

function normalizePageSize(pageSize: number): number {
  return Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 10;
}

export function filterDataTableRows<T>(
  rows: readonly T[],
  query: string,
  columns: readonly DataTableColumn<T>[],
  getValue?: (row: T) => string,
): readonly T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [...rows];

  return rows.filter((row) => {
    const value = getValue
      ? getValue(row)
      : columns.map((column) => stringValue(row[column.key])).join(" ");
    return stringValue(value).toLowerCase().includes(normalizedQuery);
  });
}

export function sortDataTableRows<T>(
  rows: readonly T[],
  sort: DataTableSort<T> | null,
): readonly T[] {
  if (!sort) return [...rows];

  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const leftMissing = missingValue(left.row[sort.key]);
      const rightMissing = missingValue(right.row[sort.key]);
      if (leftMissing || rightMissing) {
        if (leftMissing && rightMissing) return left.index - right.index;
        return leftMissing ? 1 : -1;
      }

      const compared = valueCompare(left.row[sort.key], right.row[sort.key]);
      if (compared !== 0) return sort.direction === "asc" ? compared : -compared;
      return left.index - right.index;
    })
    .map(({ row }) => row);
}

export function getDataTablePageCount(totalRows: number, pageSize: number): number {
  const total = Number.isFinite(totalRows) ? Math.max(0, totalRows) : 0;
  return Math.max(1, Math.ceil(total / normalizePageSize(pageSize)));
}

export function getDataTablePage(page: number, pageCount: number): number {
  const safePageCount = Number.isFinite(pageCount) ? Math.max(1, Math.floor(pageCount)) : 1;
  const safePage = Number.isFinite(page) ? Math.floor(page) : 1;
  return Math.min(Math.max(safePage, 1), safePageCount);
}

export function getVisibleDataTableRows<T>(
  rows: readonly T[],
  page: number,
  pageSize: number,
): readonly T[] {
  const size = normalizePageSize(pageSize);
  const start = (getDataTablePage(page, getDataTablePageCount(rows.length, size)) - 1) * size;
  return rows.slice(start, start + size);
}

export function getNextDataTableSort<T>(
  current: DataTableSort<T> | null,
  key: DataTableKey<T>,
): DataTableSort<T> | null {
  if (current?.key !== key) return { key, direction: "asc" };
  if (current.direction === "asc") return { key, direction: "desc" };
  return null;
}
