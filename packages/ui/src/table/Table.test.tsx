// Behavioral spec for Table (RRU-065). The SSR contract (structure, scope,
// column math, empty/loading rows, axis props, className merge) is asserted
// over static markup; the DOM behavior (loading lifecycle, data swap, ref
// target) is exercised on happy-dom as user-visible state (Pagination.test.tsx
// precedent).
import { type ReactElement, act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { Table } from "./index.js";

const th = (label: string, props?: Record<string, unknown>) => (
  <Table.HeaderCell {...props}>{label}</Table.HeaderCell>
);
const cell = (label: string, props?: Record<string, unknown>) => (
  <Table.Cell {...props}>{label}</Table.Cell>
);

const grid = (overrides: Record<string, unknown> = {}, body?: React.ReactNode) => (
  <Table {...overrides}>
    <Table.Head>
      <Table.Row>
        {th("Cant.")}
        {th("Total")}
      </Table.Row>
    </Table.Head>
    <Table.Body empty="Sin resultados">{body}</Table.Body>
  </Table>
);

const render = (element: React.ReactElement) => renderToStaticMarkup(element);

describe("Table SSR contract (semantic grid listed high on the server)", () => {
  it("the root renders the scroll WRAPPER around a real semantic table", () => {
    const markup = render(grid());
    expect(markup).toMatch(/^<div class="rr-table"><table class="rr-table__table">/);
    expect(markup).toContain('<thead class="rr-table__head">');
    expect(markup).toContain('<tbody class="rr-table__body">');
  });

  it("<th scope> is explicit and context-aware — col in the head, row in the body", () => {
    const headFirst = render(
      <Table>
        <Table.Head>
          <Table.Row>{th("Cant.")}</Table.Row>
        </Table.Head>
        <Table.Body>
          <Table.Row>{th("R-1")}</Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(headFirst).toContain('<th scope="col" class="rr-table__header">Cant.</th>');
    expect(headFirst).toContain('<th scope="row" class="rr-table__header">R-1</th>');

    // the consumer scope always wins over the section default
    const override = render(
      <Table>
        <Table.Body>
          <Table.Row>{th("R-1", { scope: "col" })}</Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(override).toContain('<th scope="col" class="rr-table__header">R-1</th>');
  });

  it("column math: the head defines the grid (a colgroup is a sizing hint, never double-counted)", () => {
    const withBoth = render(
      <Table loading loadingRows={2}>
        <Table.ColGroup>
          <Table.Column style={{ width: 96 }} />
          <Table.Column style={{ width: 96 }} />
        </Table.ColGroup>
        <Table.Head>
          <Table.Row>
            {th("a")}
            {th("b")}
          </Table.Row>
        </Table.Head>
        <Table.Body />
      </Table>,
    );
    // 2 head columns, NOT head(2) + col(2): skeleton row = 2 cells (2 rows × 2)
    expect(withBoth.match(/rr-skeleton--rectangle/g)).toHaveLength(4);
  });

  it("the empty state is a real full-width row spanning the column count", () => {
    const markup = render(grid());
    expect(markup).toContain(
      '<td colSpan="2" class="rr-table__cell rr-table__empty">Sin resultados</td>',
    );

    // colgroup-only tables derive the span from the <col> count
    const colGroupLife = render(
      <Table>
        <Table.ColGroup>
          <Table.Column />
          <Table.Column />
        </Table.ColGroup>
        <Table.Body empty="nada" />
      </Table>,
    );
    expect(colGroupLife).toContain('<td colSpan="2" class="rr-table__cell rr-table__empty">');
  });

  it("fail-soft: real rows always win over the empty slot (and loading over both)", () => {
    const withRows = render(grid({}, <Table.Row>{cell("real")}</Table.Row>));
    expect(withRows).toContain('<td class="rr-table__cell">real</td>');
    expect(withRows).not.toContain("rr-table__empty");

    const loading = render(
      <Table loading>
        <Table.Body empty="Sin resultados">
          <Table.Row>{cell("real")}</Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(loading).not.toContain("rr-table__empty");
    expect(loading).not.toContain(">real<");
  });

  it("error is a shared full-width alert row with loading precedence", () => {
    const failed = render(
      <Table>
        <Table.Head>
          <Table.Row>
            {th("a")}
            {th("b")}
          </Table.Row>
        </Table.Head>
        <Table.Body empty="Nothing" error="Failed">
          <Table.Row>{cell("real")}</Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(failed).toContain(
      '<td colSpan="2" class="rr-table__cell rr-table__error"><div role="alert">Failed</div></td>',
    );
    expect(failed).not.toContain(">real<");
    expect(failed).not.toContain("Nothing");

    const loading = render(
      <Table loading>
        <Table.Head>
          <Table.Row>
            {th("a")}
            {th("b")}
          </Table.Row>
        </Table.Head>
        <Table.Body error="Failed" />
      </Table>,
    );
    expect(loading).toContain('<table class="rr-table__table" aria-busy="true">');
    expect(loading.match(/rr-skeleton--rectangle/g)).toHaveLength(6);
    expect(loading).not.toContain('role="alert"');
  });

  it("loading announces aria-busy on the table and swaps the body for skeleton rows", () => {
    const markup = render(
      <Table loading loadingRows={3}>
        <Table.Head>
          <Table.Row>
            {th("a")}
            {th("b")}
          </Table.Row>
        </Table.Head>
        <Table.Body />
      </Table>,
    );
    expect(markup).toContain('<table class="rr-table__table" aria-busy="true">');
    expect(markup.match(/rr-skeleton--rectangle/g)).toHaveLength(6); // 3 rows × 2 cols
    expect(markup).not.toContain('aria-busy="false"');
  });

  it("an idle table carries no aria-busy at all, and loadingRows=0 renders no skeletons", () => {
    expect(render(grid())).not.toContain("aria-busy");
    const none = render(
      <Table loading loadingRows={0}>
        <Table.Head>
          <Table.Row>{th("a")}</Table.Row>
        </Table.Head>
        <Table.Body />
      </Table>,
    );
    expect(none).not.toMatch(/rr-skeleton/);
  });

  it("axis props: size=sm and sticky modifiers land on the wrapper", () => {
    const markup = render(
      <Table size="sm" sticky>
        <Table.Head>
          <Table.Row>{th("a")}</Table.Row>
        </Table.Head>
        <Table.Body />
      </Table>,
    );
    expect(markup).toContain('<div class="rr-table rr-table--size-sm rr-table--sticky">');
  });

  it("align + numeric modifiers land on header and cell, and colSpan passes through", () => {
    const markup = render(
      <Table>
        <Table.Head>
          <Table.Row>{th("a", { align: "end", numeric: true })}</Table.Row>
        </Table.Head>
        <Table.Body>
          <Table.Row>{cell("1", { align: "center", numeric: true, colSpan: 2 })}</Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(markup).toContain(
      '<th scope="col" class="rr-table__header rr-table__header--align-end rr-table__header--numeric">a</th>',
    );
    expect(markup).toContain(
      '<td colSpan="2" class="rr-table__cell rr-table__cell--align-center rr-table__cell--numeric">1</td>',
    );
  });

  it("merges className and passes props through the wrapper (scrollport)", () => {
    const markup = render(
      <Table id="t" data-x="1" title="invoices" className="probe">
        <Table.Head>
          <Table.Row>{th("a")}</Table.Row>
        </Table.Head>
        <Table.Body />
      </Table>,
    );
    expect(markup).toContain('<div id="t" data-x="1" title="invoices" class="rr-table probe">');
  });

  it("the caption slot serializes as the first child of the table (WCAG 1.3.1)", () => {
    const markup = render(
      <Table>
        <Table.Caption>Facturas</Table.Caption>
        <Table.Head>
          <Table.Row>{th("a")}</Table.Row>
        </Table.Head>
        <Table.Body />
      </Table>,
    );
    expect(markup).toContain(
      '<table class="rr-table__table"><caption class="rr-table__caption">Facturas</caption><thead',
    );
  });

  it("a slot OUTSIDE the root throws (fail loud, never a silent table)", () => {
    expect(() => render(<Table.HeaderCell>a</Table.HeaderCell>)).toThrow(
      /Table slots must be used within a <Table> root/,
    );
  });

  it("root and every slot are genuine forwardRefs with displayNames + slots mount", () => {
    for (const [name, Component] of [
      ["Table", Table],
      ["Table.Caption", Table.Caption],
      ["Table.ColGroup", Table.ColGroup],
      ["Table.Column", Table.Column],
      ["Table.Head", Table.Head],
      ["Table.Body", Table.Body],
      ["Table.Foot", Table.Foot],
      ["Table.Row", Table.Row],
      ["Table.HeaderCell", Table.HeaderCell],
      ["Table.Cell", Table.Cell],
    ] as const) {
      expect(Component.$$typeof, `${name} forwardRef`).toBe(Symbol.for("react.forward_ref"));
      expect(Component.displayName, `${name} displayName`).toBe(name.replace("Table.", "Table"));
    }
  });
});

describe("Table behavior (happy-dom, user-visible state)", () => {
  let host: HTMLDivElement | null = null;
  let root: Root | null = null;

  const mount = (ui: ReactElement) => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => root!.render(ui));
  };

  const rerender = (ui: ReactElement) => {
    act(() => root!.render(ui));
  };

  const unmount = () => {
    act(() => root?.unmount());
    root = null;
    host?.remove();
    host = null;
  };

  afterEach(() => {
    unmount();
  });

  it("the ref targets the WRAPPER (the scrollport), not the table", () => {
    const wrap: { node: HTMLDivElement | null } = { node: null };
    mount(
      <Table
        ref={(node) => {
          wrap.node = node;
        }}
      >
        <Table.Head>
          <Table.Row>{th("a")}</Table.Row>
        </Table.Head>
        <Table.Body />
      </Table>,
    );
    expect(wrap.node?.className).toContain("rr-table");
    expect(wrap.node?.querySelector("table")).not.toBeNull();
  });

  it("flipping loading swaps body rows to skeletons and back (aria-busy lifecycle)", () => {
    mount(
      <Table loading>
        <Table.Body>
          <Table.Row>{cell("real")}</Table.Row>
        </Table.Body>
      </Table>,
    );
    let table = document.querySelector("table");
    expect(table?.getAttribute("aria-busy")).toBe("true");
    expect(table?.querySelector("tbody")?.textContent).toBe("");

    rerender(
      <Table>
        <Table.Body>
          <Table.Row>{cell("real")}</Table.Row>
        </Table.Body>
      </Table>,
    );
    table = document.querySelector("table");
    expect(table?.hasAttribute("aria-busy")).toBe(false);
    expect(table?.querySelector("tbody .rr-table__cell")?.textContent).toBe("real");
  });

  it("the empty state gives way to the data rows the moment they arrive", () => {
    mount(
      <Table>
        <Table.Head>
          <Table.Row>
            {th("a")}
            {th("b")}
          </Table.Row>
        </Table.Head>
        <Table.Body empty="Sin resultados" />
      </Table>,
    );
    // empty render: the body shows the empty message row
    const emptyRow = document.querySelector(".rr-table__empty");
    expect(emptyRow?.textContent).toBe("Sin resultados");
    expect(emptyRow?.getAttribute("colspan")).toBe("2");

    rerender(
      <Table>
        <Table.Head>
          <Table.Row>
            {th("a")}
            {th("b")}
          </Table.Row>
        </Table.Head>
        <Table.Body empty="Sin resultados">
          <Table.Row>
            {cell("x")}
            {cell("y")}
          </Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(document.querySelector(".rr-table__empty")).toBeNull();
    expect(document.querySelectorAll("tbody .rr-table__row")).toHaveLength(1);
  });

  it("error clears back to data rows without leaving the empty state behind", () => {
    mount(
      <Table>
        <Table.Head>
          <Table.Row>
            {th("a")}
            {th("b")}
          </Table.Row>
        </Table.Head>
        <Table.Body empty="Nothing" error="Failed">
          <Table.Row>
            {cell("x")}
            {cell("y")}
          </Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(document.querySelector('[role="alert"]')?.textContent).toBe("Failed");

    rerender(
      <Table>
        <Table.Head>
          <Table.Row>
            {th("a")}
            {th("b")}
          </Table.Row>
        </Table.Head>
        <Table.Body empty="Nothing">
          <Table.Row>
            {cell("x")}
            {cell("y")}
          </Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(document.querySelector("tbody")?.textContent).toBe("xy");
  });

  it("row span (colSpan) stays honored on the consumer's own cells", () => {
    mount(
      <Table>
        <Table.Head>
          <Table.Row>
            {th("a")}
            {th("b")}
          </Table.Row>
        </Table.Head>
        <Table.Body>
          <Table.Row>{cell("wide", { colSpan: 2 })}</Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(document.querySelector("td")?.getAttribute("colspan")).toBe("2");
  });
});
