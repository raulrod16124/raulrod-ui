// Behavioral spec for Table (RRU-065). The SSR contract (structure, scope,
// column math, empty/loading rows, axis props, className merge) is asserted
// over static markup; the DOM behavior (loading lifecycle, data swap, ref
// target) is exercised on happy-dom as user-visible state (Pagination.test.tsx
// precedent).
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { auditA11y } from "../test-support/axe.js";
import { expectTokenLineage, readComponentCss, stripCssComments } from "../test-support/css.js";

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

const ssr = (element: React.ReactElement) => renderToStaticMarkup(element);

describe("Table SSR contract (semantic grid listed high on the server)", () => {
  it("the root renders the scroll WRAPPER around a real semantic table", () => {
    const markup = ssr(grid());
    expect(markup).toMatch(/^<div class="rr-table"><table class="rr-table__table">/);
    expect(markup).toContain('<thead class="rr-table__head">');
    expect(markup).toContain('<tbody class="rr-table__body">');
  });

  it("<th scope> is explicit and context-aware — col in the head, row in the body", () => {
    const headFirst = ssr(
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
    const override = ssr(
      <Table>
        <Table.Body>
          <Table.Row>{th("R-1", { scope: "col" })}</Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(override).toContain('<th scope="col" class="rr-table__header">R-1</th>');
  });

  it("column math: the head defines the grid (a colgroup is a sizing hint, never double-counted)", () => {
    const withBoth = ssr(
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
    const markup = ssr(grid());
    expect(markup).toContain(
      '<td colSpan="2" class="rr-table__cell rr-table__empty">Sin resultados</td>',
    );

    // colgroup-only tables derive the span from the <col> count
    const colGroupLife = ssr(
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
    const withRows = ssr(grid({}, <Table.Row>{cell("real")}</Table.Row>));
    expect(withRows).toContain('<td class="rr-table__cell">real</td>');
    expect(withRows).not.toContain("rr-table__empty");

    const loading = ssr(
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
    const failed = ssr(
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

    const loading = ssr(
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
    const markup = ssr(
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
    expect(ssr(grid())).not.toContain("aria-busy");
    const none = ssr(
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
    const markup = ssr(
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
    const markup = ssr(
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
    const markup = ssr(
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
    const markup = ssr(
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
  it("the ref targets the WRAPPER (the scrollport), not the table", () => {
    const wrap: { node: HTMLDivElement | null } = { node: null };
    render(
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
    const { rerender, container } = render(
      <Table loading>
        <Table.Body>
          <Table.Row>{cell("real")}</Table.Row>
        </Table.Body>
      </Table>,
    );

    expect(container.querySelector("table")).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector("tbody")).toHaveTextContent("");
    // default loadingRows = 3, one skeleton per column of the (absent) head grid
    expect(container.querySelectorAll(".rr-skeleton")).toHaveLength(3);

    rerender(
      <Table>
        <Table.Body>
          <Table.Row>{cell("real")}</Table.Row>
        </Table.Body>
      </Table>,
    );

    expect(container.querySelector("table")).not.toHaveAttribute("aria-busy");
    expect(container.querySelector(".rr-table__cell")).toHaveTextContent("real");
  });

  it("the empty state gives way to the data rows the moment they arrive", () => {
    const { rerender, container } = render(
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
    const emptyRow = container.querySelector(".rr-table__empty");
    expect(emptyRow).toHaveTextContent("Sin resultados");
    expect(emptyRow).toHaveAttribute("colspan", "2");

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

    expect(container.querySelector(".rr-table__empty")).toBeNull();
    expect(container.querySelectorAll("tbody .rr-table__row")).toHaveLength(1);
  });

  it("error clears back to data rows without leaving the empty state behind", () => {
    const { rerender, container } = render(
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

    expect(screen.getByRole("alert")).toHaveTextContent("Failed");

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

    expect(screen.queryByRole("alert")).toBeNull();
    expect(container.querySelector("tbody")).toHaveTextContent("xy");
  });

  it("row span (colSpan) stays honored on the consumer's own cells", () => {
    const { container } = render(
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

    expect(container.querySelector("td")).toHaveAttribute("colspan", "2");
  });

  it("has no axe violations in the data, empty and error shapes", async () => {
    const data = render(grid({}, <Table.Row>{cell("x")}</Table.Row>));
    await expect(auditA11y(data.container)).resolves.toHaveNoViolations();
    data.unmount();

    const empty = render(grid());
    await expect(auditA11y(empty.container)).resolves.toHaveNoViolations();
    empty.unmount();

    const failed = render(
      <Table>
        <Table.Head>
          <Table.Row>{th("a")}</Table.Row>
        </Table.Head>
        <Table.Body error="Failed" />
      </Table>,
    );
    await expect(auditA11y(failed.container)).resolves.toHaveNoViolations();
  });
});

describe("Table authored CSS contract", () => {
  it("the wrapper owns the horizontal scroll and the container frame", async () => {
    const wrapper =
      /\.rr-table\s*\{([^}]*)\}/.exec(await readComponentCss("table/Table.css"))?.[1] ?? "";

    expect(wrapper).toMatch(/overflow-x:\s*auto/);
    expect(wrapper).toMatch(/border:\s*1px solid var\(--rr-color-border-default\)/);
    expect(wrapper).toMatch(/border-radius:\s*var\(--rr-radius-md\)/);
  });

  it("the table fills the wrapper and collapses its hairlines", async () => {
    const table =
      /\.rr-table__table\s*\{([^}]*)\}/.exec(await readComponentCss("table/Table.css"))?.[1] ?? "";

    expect(table).toMatch(/width:\s*100%/);
    expect(table).toMatch(/border-collapse:\s*collapse/);
    expect(table).toMatch(/font-family:\s*var\(--rr-font-family-sans\)/);
    expect(table).toMatch(/background-color:\s*var\(--rr-color-background-default\)/);
  });

  it("the md density pairs space-2/space-3 padding with a start-aligned hairline row", async () => {
    const base =
      /\.rr-table__cell\s*\{([^}]*)\}/.exec(await readComponentCss("table/Table.css"))?.[1] ?? "";

    expect(base).toMatch(/padding:\s*var\(--rr-space-2\) var\(--rr-space-3\)/);
    expect(base).toMatch(/color:\s*var\(--rr-color-text-primary\)/);
    expect(base).toMatch(/text-align:\s*start/);
    expect(base).toMatch(/border-bottom:\s*1px solid var\(--rr-color-border-default\)/);
  });

  it("the head paints a strong bound over the surface fill so a sticky header reads", async () => {
    const css = await readComponentCss("table/Table.css");
    const head = /\.rr-table__head \.rr-table__header\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";

    expect(head).toMatch(/background-color:\s*var\(--rr-color-background-surface\)/);
    expect(head).toMatch(/border-bottom:\s*1px solid var\(--rr-color-border-strong\)/);
    // the weight firm-up is on the bare class; the fill only inside the head
    expect(
      /\.rr-table__header\s*\{[^}]*font-weight:\s*var\(--rr-font-weight-semibold\)/.test(css),
    ).toBe(true);
  });

  it("sticky authors the documented mechanics: top 0, z-index 1", async () => {
    const sticky =
      /\.rr-table--sticky \.rr-table__head \.rr-table__header\s*\{([^}]*)\}/.exec(
        await readComponentCss("table/Table.css"),
      )?.[1] ?? "";

    expect(sticky).toMatch(/position:\s*sticky/);
    expect(sticky).toMatch(/top:\s*0/);
    expect(sticky).toMatch(/z-index:\s*1/);
  });

  it("the hover pair is text.primary on background.sunken", async () => {
    const hover =
      /\.rr-table__body \.rr-table__row:hover\s*\{([^}]*)\}/.exec(
        await readComponentCss("table/Table.css"),
      )?.[1] ?? "";

    expect(hover).toMatch(/background-color:\s*var\(--rr-color-background-sunken\)/);
  });

  it("the sm density tightens padding and steps the font down", async () => {
    const sm =
      /\.rr-table--size-sm \.rr-table__(?:header|cell)\s*\{([^}]*)\}/.exec(
        await readComponentCss("table/Table.css"),
      )?.[1] ?? "";

    expect(sm).toMatch(/padding:\s*var\(--rr-space-1\) var\(--rr-space-2\)/);
    expect(sm).toMatch(/font-size:\s*var\(--rr-font-size-xs\)/);
  });

  it("alignment axes author the logical keywords, not left/right", async () => {
    const css = await readComponentCss("table/Table.css");

    expect(css).toMatch(/--align-center\s*\{\s*text-align:\s*center/);
    expect(css).toMatch(/--align-end\s*\{\s*text-align:\s*end/);
    expect(css).not.toMatch(/text-align:\s*(left|right)/);
  });

  it("numeric columns use the tabular-nums token (typography.md §5)", async () => {
    const numeric =
      /\.rr-table__cell--numeric\s*\{([^}]*)\}/.exec(
        await readComponentCss("table/Table.css"),
      )?.[1] ?? "";

    expect(numeric).toMatch(/font-variant-numeric:\s*var\(--rr-font-numeric-tabular-nums\)/);
  });

  it("empty and error messages share the space-8 breathing room, centered", async () => {
    const css = await readComponentCss("table/Table.css");
    const empty = /\.rr-table__empty\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    const error = /\.rr-table__error\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";

    expect(empty).toMatch(/padding:\s*var\(--rr-space-8\)/);
    expect(empty).toMatch(/color:\s*var\(--rr-color-text-muted\)/);
    expect(empty).toMatch(/text-align:\s*center/);
    expect(error).toMatch(/padding:\s*var\(--rr-space-8\)/);
    expect(error).toMatch(/color:\s*var\(--rr-color-text-danger\)/);
    expect(error).toMatch(/text-align:\s*center/);
  });

  it("the caption un-centers the browser default", async () => {
    const caption =
      /\.rr-table__caption\s*\{([^}]*)\}/.exec(await readComponentCss("table/Table.css"))?.[1] ??
      "";

    expect(caption).toMatch(/text-align:\s*start/);
    expect(caption).toMatch(/color:\s*var\(--rr-color-text-primary\)/);
  });

  it("the last body/foot row drops its hairline (the wrapper owns the bottom border)", async () => {
    expect(await readComponentCss("table/Table.css")).toMatch(
      /\.rr-table__body tr:last-child > \.rr-table__(?:header|cell)[^{]*,\s*\n[^}]*border-bottom:\s*0;/,
    );
  });

  it("a static table authors no motion, no cursor, no focus ring (no interaction to style)", async () => {
    const css = stripCssComments(await readComponentCss("table/Table.css"));

    expect(css).not.toMatch(/transition/);
    expect(css).not.toMatch(/cursor:/);
    expect(css).not.toMatch(/@keyframes/);
    expect(css).not.toMatch(/:focus-visible\s*\{/);
  });

  it("holds the token-only color rule: no hex, and the only px are hairlines", async () => {
    const css = stripCssComments(await readComponentCss("table/Table.css"));
    // `1px` is the documented hairline for collapsed borders; anything wider
    // would be an un-tokenized design value
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css.match(/\b\d+px\b/g) ?? []).not.toContain("2px");
    for (const [, value] of css.matchAll(/\b(\d+(?:\.\d+)?)px\b/g)) {
      expect(["0", "1"]).toContain(value);
    }
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("table/Table.css"));
  });
});
