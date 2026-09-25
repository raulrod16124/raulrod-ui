import type {
  DataTableColumn,
  DataTableProps,
  DataTableRowSelection,
  DataTableSort,
  DataTableSorting,
} from "./DataTable.types.js";
import type { ReactElement } from "react";
import type { Root } from "react-dom/client";

import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import {
  filterDataTableRows,
  getDataTablePage,
  getDataTablePageCount,
  getNextDataTableSort,
  getVisibleDataTableRows,
  sortDataTableRows,
} from "./data-table.js";

import { DataTable } from "./index.js";

interface User {
  id: number;
  name: string;
  role: string;
  score: number;
  active: boolean;
}

const users: readonly User[] = [
  { id: 3, name: "Zoe", role: "Design", score: 20, active: true },
  { id: 1, name: "Ada", role: "Engineering", score: 10, active: true },
  { id: 2, name: "Bea", role: "Engineering", score: 30, active: false },
];

const columns: readonly DataTableColumn<User>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "role", header: "Role" },
  { key: "score", header: "Score", align: "end", numeric: true },
];

const getUserId = (user: User): number => user.id;
const getUserLabel = (user: User): string => user.name;

function userTable(overrides: Partial<DataTableProps<User, number>> = {}): ReactElement {
  return (
    <DataTable {...overrides} data={users} columns={columns} getRowId={getUserId} caption="Users" />
  );
}

function render(element: ReactElement): string {
  return renderToStaticMarkup(element);
}

function textRows(): string[] {
  return Array.from(document.querySelectorAll("tbody tr"), (row) => row.textContent ?? "");
}

function click(element: Element): void {
  act(() => {
    if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
      element.click();
    }
  });
}

function changeInput(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (!setter) throw new Error("HTMLInputElement value setter is unavailable");
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("DataTable pure data operations", () => {
  it("filters every typed column without mutating the source", () => {
    const source = [...users];
    const result = filterDataTableRows(source, "  ENGINEERING ", columns);
    expect(result.map(getUserId)).toEqual([1, 2]);
    expect(source).toEqual(users);
  });

  it("supports an explicit row-to-search-value transform", () => {
    const result = filterDataTableRows(users, "design", columns, (user) => user.role);
    expect(result.map(getUserId)).toEqual([3]);
  });

  it("uses the same deterministic ISO representation for Date display and filtering", () => {
    const rows = [
      { id: 1, value: new Date("2026-01-02T03:04:05.000Z") },
      { id: 2, value: new Date(Number.NaN) },
    ];
    const dateColumns: DataTableColumn<{ id: number; value: Date }>[] = [
      { key: "value", header: "Date" },
    ];
    expect(filterDataTableRows(rows, "2026-01-02", dateColumns).map((row) => row.id)).toEqual([1]);
    expect(filterDataTableRows(rows, "Invalid Date", dateColumns).map((row) => row.id)).toEqual([
      2,
    ]);
  });

  it("sorts stably, numerically and with missing values last in both directions", () => {
    const rows = [
      { id: 1, name: "Same", score: 2 },
      { id: 2, name: "Same", score: 2 },
      { id: 3, name: "Missing", score: null },
      { id: 4, name: "Ten", score: 10 },
    ];
    const ascending = sortDataTableRows(rows, { key: "score", direction: "asc" });
    const descending = sortDataTableRows(rows, { key: "score", direction: "desc" });
    expect(ascending.map((row) => row.id)).toEqual([1, 2, 4, 3]);
    expect(descending.map((row) => row.id)).toEqual([4, 1, 2, 3]);
  });

  it("cycles sort state ascending, descending and unsorted", () => {
    const ascending = getNextDataTableSort<User>(null, "name");
    expect(ascending).toEqual({ key: "name", direction: "asc" });
    expect(getNextDataTableSort(ascending, "name")).toEqual({
      key: "name",
      direction: "desc",
    });
    expect(getNextDataTableSort({ key: "name", direction: "desc" }, "name")).toBeNull();
    expect(getNextDataTableSort<User>(null, "role")).toEqual({
      key: "role",
      direction: "asc",
    });
  });

  it("normalizes page counts, clamps pages and slices visible rows", () => {
    expect(getDataTablePageCount(0, 10)).toBe(1);
    expect(getDataTablePageCount(5, 2)).toBe(3);
    expect(getDataTablePageCount(5, 0)).toBe(5);
    expect(getDataTablePage(0, 3)).toBe(1);
    expect(getDataTablePage(99, 3)).toBe(3);
    expect(getDataTablePage(Number.NaN, 3)).toBe(1);
    expect(getDataTablePageCount(Number.NaN, 2)).toBe(1);
    expect(getDataTablePage(1, Number.NaN)).toBe(1);
    expect(getVisibleDataTableRows(users, 2, 2).map(getUserId)).toEqual([2]);
  });
});

describe("DataTable SSR and type contract", () => {
  it("keeps column keys and callbacks typed against the row model", () => {
    expectTypeOf<DataTableColumn<User>["key"]>().toEqualTypeOf<
      "id" | "name" | "role" | "score" | "active"
    >();
    expectTypeOf<DataTableColumn<User>["key"]>().not.toMatchTypeOf<"missing">();
    expectTypeOf<NonNullable<DataTableColumn<User>["render"]>>().parameter(0).toEqualTypeOf<User>();
    expectTypeOf<DataTableSorting<User>["value"]>().toEqualTypeOf<
      DataTableSort<User> | null | undefined
    >();
    expectTypeOf<DataTableRowSelection<User, number>["selectedRowIds"]>().toEqualTypeOf<
      ReadonlySet<number> | undefined
    >();
  });

  it("renders a semantic responsive table from generic column definitions", () => {
    const markup = render(userTable());
    expect(markup).toMatch(/^<div class="rr-data-table">/);
    expect(markup).toContain('<div class="rr-table rr-table--size-sm">');
    expect(markup).toContain('<caption class="rr-table__caption">Users</caption>');
    expect(markup).toContain('<th scope="col" class="rr-table__header">Name</th>');
    expect(markup).toContain('<td class="rr-table__cell">Ada</td>');
    expect(markup).not.toContain('role="grid"');
    expect(markup).not.toMatch(/tabindex|onkeydown/i);
    expect(
      render(
        <DataTable<User> data={users} columns={columns} getRowId={getUserId} caption="Users" />,
      ),
    ).toContain(">Ada<");
  });

  it("serializes filtering, sorting and row selection controls accessibly", () => {
    const markup = render(
      userTable({
        filtering: { defaultValue: "engineering", label: "Find users" },
        sorting: { defaultValue: { key: "name", direction: "asc" } },
        rowSelection: {
          getRowLabel: getUserLabel,
          defaultSelectedRowIds: [1],
        },
      }),
    );
    expect(markup).toContain('<label class="rr-data-table__filter-label"');
    expect(markup).toContain('type="search"');
    expect(markup).toContain('value="engineering"');
    expect(markup).toContain('aria-sort="ascending"');
    expect(markup).toContain('aria-label="Sort by Name, sorted ascending"');
    expect(markup).toContain('aria-label="Select all filtered rows"');
    expect(markup).toContain('aria-checked="mixed"');
    expect(markup).toContain('aria-label="Select Ada"');
  });

  it("applies loading before error, error before rows and rows before empty", () => {
    const loading = render(userTable({ loading: true, loadingRows: 2, error: "Failed" }));
    expect(loading).toContain('aria-busy="true"');
    expect(loading.match(/rr-skeleton--rectangle/g)).toHaveLength(6);
    expect(loading).not.toContain('role="alert"');

    const failed = render(userTable({ error: "Failed", empty: "Nothing" }));
    expect(failed).toContain('role="alert"');
    expect(failed).toContain("Failed");
    expect(failed).toContain('class="rr-table__cell rr-table__error"');
    expect(failed).not.toContain(">Ada<");

    const empty = render(
      <DataTable<User, number>
        data={[]}
        columns={columns}
        getRowId={getUserId}
        caption="Users"
        empty="Nothing"
      />,
    );
    expect(empty).toContain("Nothing");
    expect(empty).not.toContain(">Ada<");

    const noError = render(userTable({ error: false }));
    expect(noError).toContain(">Ada<");
    expect(noError).not.toContain('role="alert"');

    const loadingWithPagination = render(userTable({ loading: true, pagination: { pageSize: 2 } }));
    expect(loadingWithPagination).toContain('aria-busy="true"');
    expect(loadingWithPagination).not.toContain("rr-pagination");
  });

  it("merges root props, stays a forwardRef and hides single-page pagination", () => {
    const markup = render(
      userTable({
        className: "probe",
        id: "users",
        title: "Team",
        pagination: { pageSize: 10 },
      }),
    );
    expect(markup).toContain('id="users"');
    expect(markup).toContain('title="Team"');
    expect(markup).toContain('class="rr-data-table probe"');
    expect(markup).not.toContain("rr-pagination");
    expect(Reflect.get(DataTable, "$$typeof")).toBe(Symbol.for("react.forward_ref"));
    expect(DataTable.displayName).toBe("DataTable");
  });
});

describe("DataTable behavior", () => {
  let host: HTMLDivElement | null = null;
  let root: Root | null = null;

  function mount(element: ReactElement): void {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => root?.render(element));
  }

  function rerender(element: ReactElement): void {
    act(() => root?.render(element));
  }

  function unmount(): void {
    act(() => root?.unmount());
    root = null;
    host?.remove();
    host = null;
  }

  afterEach(() => {
    unmount();
  });

  it("sorts uncontrolled on repeated header activation and retains focus", () => {
    const onChange = vi.fn();
    mount(userTable({ sorting: { onChange } }));
    const button = document.querySelector<HTMLButtonElement>("thead button");
    expect(button).not.toBeNull();
    button?.focus();

    click(button as HTMLButtonElement);
    expect(onChange).toHaveBeenLastCalledWith({ key: "name", direction: "asc" });
    expect(document.querySelector("th")?.getAttribute("aria-sort")).toBe("ascending");
    expect(textRows().map((row) => row.replace("Engineering", "").replace("Design", ""))).toEqual([
      "Ada10",
      "Bea30",
      "Zoe20",
    ]);
    expect(document.activeElement).toBe(button);

    click(button as HTMLButtonElement);
    expect(onChange).toHaveBeenLastCalledWith({ key: "name", direction: "desc" });
    expect(document.querySelector("th")?.getAttribute("aria-sort")).toBe("descending");
    expect(textRows()[0]).toContain("Zoe");

    click(button as HTMLButtonElement);
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(document.querySelector("th")?.hasAttribute("aria-sort")).toBe(false);
  });

  it("filters uncontrolled and resets pagination to page one", () => {
    const onFilterChange = vi.fn();
    const onPageChange = vi.fn();
    mount(
      userTable({
        filtering: { defaultValue: "", onChange: onFilterChange },
        pagination: { pageSize: 2, defaultPage: 99, onPageChange },
      }),
    );
    expect(textRows()[0]).toContain("Bea");

    const input = document.querySelector<HTMLInputElement>('input[type="search"]');
    expect(input).not.toBeNull();
    changeInput(input as HTMLInputElement, "engineering");
    expect(onFilterChange).toHaveBeenLastCalledWith("engineering");
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    expect(textRows()).toHaveLength(2);
    expect(textRows().every((row) => row.includes("Engineering"))).toBe(true);
    expect(document.querySelector(".rr-pagination")).toBeNull();

    rerender(
      userTable({
        filtering: { value: "" },
        pagination: { pageSize: 2, onPageChange },
      }),
    );
    expect(textRows()[0]).toContain("Zoe");
    expect(document.querySelector('[role="status"]')?.textContent).toBe("Page 1 of 2");
  });

  it("normalizes an uncontrolled page when the data shrinks and grows again", () => {
    const pagedTable = (rows: readonly User[]) => (
      <DataTable<User, number>
        data={rows}
        columns={columns}
        getRowId={getUserId}
        caption="Users"
        pagination={{ pageSize: 2 }}
      />
    );
    mount(pagedTable(users));
    click(document.querySelector('[aria-label="Next page"]') as HTMLButtonElement);
    expect(document.querySelector('[role="status"]')?.textContent).toBe("Page 2 of 2");

    rerender(pagedTable(users.slice(0, 1)));
    rerender(pagedTable(users));
    expect(document.querySelector('[role="status"]')?.textContent).toBe("Page 1 of 2");
  });

  it("keeps controlled filtering and sorting gated by props", () => {
    const onFilterChange = vi.fn();
    const onSortChange = vi.fn();
    mount(
      userTable({
        filtering: { value: "engineering", onChange: onFilterChange },
        sorting: { value: { key: "name", direction: "asc" }, onChange: onSortChange },
      }),
    );
    const input = document.querySelector<HTMLInputElement>('input[type="search"]');
    changeInput(input as HTMLInputElement, "ada");
    expect(onFilterChange).toHaveBeenLastCalledWith("ada");
    expect(textRows()).toHaveLength(2);

    click(document.querySelector("thead button") as HTMLButtonElement);
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "name", direction: "desc" });
    expect(document.querySelector("th")?.getAttribute("aria-sort")).toBe("ascending");

    rerender(
      userTable({
        filtering: { value: "ada", onChange: onFilterChange },
        sorting: { value: { key: "name", direction: "desc" }, onChange: onSortChange },
      }),
    );
    expect(textRows()).toHaveLength(1);
    expect(textRows()[0]).toContain("Ada");
    expect(document.querySelector("th")?.getAttribute("aria-sort")).toBe("descending");
  });

  it("paginates uncontrolled and leaves controlled pages consumer-gated", () => {
    const onPageChange = vi.fn();
    mount(userTable({ pagination: { pageSize: 2, onPageChange } }));
    expect(textRows()).toHaveLength(2);
    expect(textRows()[0]).toContain("Zoe");

    const next = document.querySelector<HTMLButtonElement>('[aria-label="Next page"]');
    click(next as HTMLButtonElement);
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    expect(textRows()).toHaveLength(1);
    expect(textRows()[0]).toContain("Bea");

    const controlledChange = vi.fn();
    rerender(userTable({ pagination: { pageSize: 2, page: 1, onPageChange: controlledChange } }));
    click(document.querySelector('[aria-label="Next page"]') as HTMLButtonElement);
    expect(controlledChange).toHaveBeenLastCalledWith(2);
    expect(textRows()).toHaveLength(2);
    expect(document.querySelector('[role="status"]')?.textContent).toBe("Page 1 of 2");
  });

  it("supports partial, row-level and select-all selection while preserving IDs", () => {
    const onChange = vi.fn();
    mount(
      userTable({
        rowSelection: {
          getRowLabel: getUserLabel,
          defaultSelectedRowIds: [1],
          onChange,
        },
      }),
    );
    const selectAll = document.querySelector<HTMLInputElement>(
      '[aria-label="Select all filtered rows"]',
    );
    expect(selectAll?.getAttribute("aria-checked")).toBe("mixed");
    expect(document.querySelector<HTMLInputElement>('[aria-label="Select Ada"]')?.checked).toBe(
      true,
    );

    click(document.querySelector('[aria-label="Select Bea"]') as HTMLInputElement);
    expect([...(onChange.mock.lastCall?.[0] ?? [])]).toEqual([1, 2]);
    expect(document.querySelector<HTMLInputElement>('[aria-label="Select Bea"]')?.checked).toBe(
      true,
    );

    click(document.querySelector('[aria-label="Select all filtered rows"]') as HTMLInputElement);
    expect([...(onChange.mock.lastCall?.[0] ?? [])]).toEqual([1, 2, 3]);
    expect(
      document.querySelector<HTMLInputElement>('[aria-label="Deselect all filtered rows"]'),
    ).toHaveProperty("checked", true);
  });

  it("selects only filtered rows and keeps controlled selection gated by props", () => {
    const onChange = vi.fn();
    mount(
      userTable({
        filtering: { defaultValue: "engineering" },
        rowSelection: { getRowLabel: getUserLabel, onChange },
      }),
    );
    click(document.querySelector('[aria-label="Select all filtered rows"]') as HTMLInputElement);
    expect([...(onChange.mock.lastCall?.[0] ?? [])]).toEqual([1, 2]);
    expect(document.querySelector('[aria-label="Select Zoe"]')).toBeNull();

    const controlledChange = vi.fn();
    rerender(
      userTable({
        filtering: { defaultValue: "engineering" },
        rowSelection: {
          getRowLabel: getUserLabel,
          selectedRowIds: new Set([1]),
          onChange: controlledChange,
        },
      }),
    );
    click(document.querySelector('[aria-label="Select Bea"]') as HTMLInputElement);
    expect([...(controlledChange.mock.lastCall?.[0] ?? [])]).toEqual([1, 2]);
    expect(document.querySelector<HTMLInputElement>('[aria-label="Select Bea"]')?.checked).toBe(
      false,
    );

    rerender(
      userTable({
        filtering: { defaultValue: "engineering" },
        rowSelection: {
          getRowLabel: getUserLabel,
          selectedRowIds: new Set([1, 2]),
          onChange: controlledChange,
        },
      }),
    );
    expect(document.querySelector<HTMLInputElement>('[aria-label="Select Bea"]')?.checked).toBe(
      true,
    );
  });

  it("forwards the public ref to the DataTable root", () => {
    const ref: { current: HTMLDivElement | null } = { current: null };
    mount(
      <DataTable<User, number>
        ref={(element) => {
          ref.current = element;
        }}
        data={users}
        columns={columns}
        getRowId={getUserId}
        caption="Users"
      />,
    );
    expect(ref.current?.className).toContain("rr-data-table");
    expect(ref.current?.querySelector(".rr-table")).not.toBeNull();
  });
});
