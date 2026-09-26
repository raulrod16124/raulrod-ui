// The base component pattern (RRU-040) as a TRACKED spec, replacing the
// gitignored `check-pattern.mjs` (RRU-068). It is deliberately cross-cutting —
// one spec that walks every component folder and the whole public surface,
// because that is what the pattern IS: a promise the package makes to consumers
// (file shape, forwardRef, displayName, className merge, pass-through props,
// variant convention) rather than a property of any single component.
//
// Refs/displayNames are asserted on the PUBLIC root re-exports, so this spec also
// fails if a component is implemented but never exported from `src/index.ts`.
import type { ReactElement } from "react";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { readSource } from "./test-support/source.js";

import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  FormField,
  FormFieldControl,
  FormFieldDescription,
  FormFieldError,
  FormFieldLabel,
  Heading,
  IconButton,
  Inline,
  Input,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  Portal,
  Progress,
  Radio,
  RadioGroup,
  Select,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Stack,
  Switch,
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
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
  Text,
  Textarea,
  ToastProvider,
  Tooltip,
  VisuallyHidden,
} from "./index.js";

/** `ref: false` = documented exception: a pure provider root with no own DOM. */
const COMPONENTS = [
  { dir: "stack", pascal: "Stack", css: true, ref: true },
  { dir: "inline", pascal: "Inline", css: true, ref: true },
  { dir: "text", pascal: "Text", css: true, ref: true },
  { dir: "heading", pascal: "Heading", css: true, ref: true },
  { dir: "visually-hidden", pascal: "VisuallyHidden", css: true, ref: true },
  { dir: "button", pascal: "Button", css: true, ref: true },
  { dir: "icon-button", pascal: "IconButton", css: true, ref: true },
  { dir: "input", pascal: "Input", css: true, ref: true },
  { dir: "textarea", pascal: "Textarea", css: true, ref: true },
  { dir: "checkbox", pascal: "Checkbox", css: true, ref: true },
  { dir: "data-table", pascal: "DataTable", css: true, ref: true },
  { dir: "radio", pascal: "Radio", css: true, ref: true },
  { dir: "radio", pascal: "RadioGroup", css: false, ref: true },
  { dir: "switch", pascal: "Switch", css: true, ref: true },
  { dir: "badge", pascal: "Badge", css: true, ref: true },
  { dir: "avatar", pascal: "Avatar", css: true, ref: true },
  { dir: "skeleton", pascal: "Skeleton", css: true, ref: true },
  { dir: "progress", pascal: "Progress", css: true, ref: true },
  { dir: "pagination", pascal: "Pagination", css: true, ref: true },
  { dir: "table", pascal: "Table", css: true, ref: true },
  { dir: "form-field", pascal: "FormField", css: true, ref: true },
  // Dialog (RRU-053): folder has a .css; the ROOT is a provider without a DOM
  // element (the ref convention's exception, in reverse: ref false, css true).
  { dir: "dialog", pascal: "Dialog", css: true, ref: false },
  // Popover (RRU-054): same provider-root exception as Dialog.
  { dir: "popover", pascal: "Popover", css: true, ref: false },
  // DropdownMenu (RRU-055): composite menu; the slots carry the refs.
  { dir: "dropdown-menu", pascal: "DropdownMenu", css: true, ref: false },
  // Select (RRU-057): same provider-root exception — read-only combobox.
  { dir: "select", pascal: "Select", css: true, ref: false },
  // Tabs (RRU-058): same provider-root exception — WAI-ARIA Tabs.
  { dir: "tabs", pascal: "Tabs", css: true, ref: false },
  // Tooltip (RRU-056): SIMPLE API — the root IS the anchor; no exception.
  { dir: "tooltip", pascal: "Tooltip", css: true, ref: true },
  // Toast (RRU-059): pure provider; the portaled viewport carries the DOM.
  { dir: "toast", pascal: "Toast", css: true, ref: false },
  // Portal (RRU-034): JS-only primitive — no .css (0 tokens), no forwardRef
  // (refs belong on the consumer's children).
  { dir: "portal", pascal: "Portal", css: false, ref: false },
] as const;

const REF_COMPONENTS: Record<string, unknown> = {
  Stack,
  Inline,
  Text,
  Heading,
  VisuallyHidden,
  Button,
  IconButton,
  Input,
  Textarea,
  Checkbox,
  DataTable,
  Radio,
  RadioGroup,
  Switch,
  Badge,
  Avatar,
  Skeleton,
  Progress,
  Pagination,
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
  FormField,
  FormFieldLabel,
  FormFieldDescription,
  FormFieldControl,
  FormFieldError,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  TabsList,
  TabsTrigger,
  TabsPanel,
  Tooltip,
};

const DISPLAY_NAME_COMPONENTS: Record<string, unknown> = {
  ...REF_COMPONENTS,
  Portal,
  Dialog,
  Popover,
  DropdownMenu,
  DropdownMenuSub,
  Select,
  Tabs,
  ToastProvider,
};

const REF_EXCEPTIONS: Record<string, unknown> = {
  Portal,
  Dialog,
  Popover,
  DropdownMenu,
  DropdownMenuSub,
  Select,
  Tabs,
  ToastProvider,
};

const TYPE_FILES = COMPONENTS.map(({ dir, pascal }) => `${dir}/${pascal}.types.ts`);

const FORWARD_REF = Symbol.for("react.forward_ref");

const markup = (element: ReactElement) => renderToStaticMarkup(element);

describe("pattern: file structure (Playbook §4 Paso 1)", () => {
  it.each(COMPONENTS)(
    "$dir/$pascal has its .tsx, .types.ts and index.ts",
    async ({ dir, pascal }) => {
      for (const file of [`${dir}/${pascal}.tsx`, `${dir}/${pascal}.types.ts`, `${dir}/index.ts`]) {
        await expect(readSource(file), `${file} must exist and be readable`).resolves.toMatch(/\S/);
      }
    },
  );

  it.each(COMPONENTS.filter(({ css }) => css))(
    "$dir/$pascal ships its authored .css",
    async ({ dir, pascal }) => {
      await expect(
        readSource(`${dir}/${pascal}.css`),
        `${dir}/${pascal}.css must exist`,
      ).resolves.toMatch(/\S/);
    },
  );

  it("Portal is the only JS-only primitive: no .css, no DOM of its own", async () => {
    await expect(readSource("portal/Portal.css")).rejects.toThrow();
  });
});

describe("pattern: forwardRef contract", () => {
  it.each(Object.entries(REF_COMPONENTS))("%s is a genuine forwardRef", (name, Component) => {
    expect((Component as { $$typeof: symbol }).$$typeof, `${name} must be a forwardRef`).toBe(
      FORWARD_REF,
    );
  });

  it.each(Object.entries(REF_EXCEPTIONS))(
    "%s is NOT a forwardRef (documented provider/JS-only exception)",
    (name, Component) => {
      expect(
        (Component as { $$typeof: symbol }).$$typeof,
        `${name} must not be a forwardRef`,
      ).not.toBe(FORWARD_REF);
    },
  );
});

describe("pattern: displayName", () => {
  it.each(Object.entries(DISPLAY_NAME_COMPONENTS))("%s names itself", (name, Component) => {
    expect((Component as { displayName?: string }).displayName, `${name} displayName`).toBe(name);
  });
});

describe("pattern: className merge + pass-through props", () => {
  it("Stack appends the consumer class after the base and keeps id/data-*", () => {
    expect(
      markup(
        <Stack className="probe" id="s" data-kind-of-layout="true">
          hi
        </Stack>,
      ),
    ).toBe('<div id="s" data-kind-of-layout="true" class="rr-stack probe">hi</div>');
  });

  it("Inline merges on the div and keeps aria-hidden", () => {
    expect(
      markup(
        <Inline className="probe" aria-hidden="true">
          hi
        </Inline>,
      ),
    ).toBe('<div aria-hidden="true" class="rr-inline probe">hi</div>');
  });

  it("Text merges base + size modifier before the consumer class", () => {
    expect(
      markup(
        <Text className="probe" title="t" size="font.size.lg">
          hi
        </Text>,
      ),
    ).toBe('<span title="t" class="rr-text rr-text--size-lg probe">hi</span>');
  });

  it("Heading merges and defaults to the h2 level", () => {
    expect(
      markup(
        <Heading className="probe" id="h" data-x="1">
          hi
        </Heading>,
      ),
    ).toBe('<h2 id="h" data-x="1" class="rr-heading rr-heading--size-3xl probe">hi</h2>');
  });

  it("VisuallyHidden merges on its span and keeps title", () => {
    expect(
      markup(
        <VisuallyHidden className="probe" title="t">
          hi
        </VisuallyHidden>,
      ),
    ).toBe('<span title="t" class="rr-visually-hidden probe">hi</span>');
  });

  it("Button merges base + default variant and keeps id/data-*", () => {
    expect(
      markup(
        <Button className="probe" id="b" data-x="1">
          go
        </Button>,
      ),
    ).toBe('<button id="b" data-x="1" class="rr-button rr-button--primary probe">go</button>');
  });

  it("IconButton merges and forces the accessible name before the class", () => {
    expect(markup(<IconButton label="x" className="probe" id="i" data-x="1" />)).toMatch(
      /^<button id="i" data-x="1" aria-label="x" class="rr-icon-button rr-icon-button--primary probe">/,
    );
  });

  it("Input merges on the native input and keeps pass-through", () => {
    expect(markup(<Input className="probe" id="i" data-x="1" />)).toBe(
      '<input id="i" data-x="1" class="rr-input probe"/>',
    );
  });

  it("Textarea merges on the native textarea", () => {
    expect(markup(<Textarea className="probe" id="t" data-x="1" />)).toBe(
      '<textarea id="t" data-x="1" class="rr-textarea probe"></textarea>',
    );
  });

  it("Checkbox merges and forces type=checkbox", () => {
    expect(markup(<Checkbox className="probe" id="c" data-x="1" />)).toBe(
      '<input type="checkbox" id="c" data-x="1" class="rr-checkbox probe"/>',
    );
  });

  it("RadioGroup merges on the radiogroup div and defaults to vertical", () => {
    expect(
      markup(
        <RadioGroup className="probe" id="g" data-x="1">
          <Radio value="a">A</Radio>
        </RadioGroup>,
      ),
    ).toMatch(
      /^<div role="radiogroup" id="g" data-x="1" class="rr-radio-group rr-radio-group--vertical probe">/,
    );
  });

  it("Radio merges on the label row", () => {
    expect(
      markup(
        <Radio className="probe" value="x" data-x="1" title="t">
          hi
        </Radio>,
      ),
    ).toMatch(/^<label data-x="1" title="t" class="rr-radio probe">/);
  });

  it("Switch merges on the label row with role=switch and the implicit label", () => {
    expect(
      markup(
        <Switch className="probe" title="t" data-x="1">
          on
        </Switch>,
      ),
    ).toBe(
      '<label title="t" data-x="1" class="rr-switch probe"><input type="checkbox" role="switch" class="rr-switch-input"/><span class="rr-switch-label">on</span></label>',
    );
  });

  it("Badge merges base + default variant", () => {
    expect(
      markup(
        <Badge className="probe" title="t" data-x="1" id="b">
          live
        </Badge>,
      ),
    ).toBe(
      '<span title="t" data-x="1" id="b" class="rr-badge rr-badge--neutral probe">live</span>',
    );
  });

  it("Avatar merges and derives the fallback initials from the name", () => {
    expect(markup(<Avatar name="Raúl Ortiz" className="probe" data-x="1" id="a" />)).toBe(
      '<span data-x="1" id="a" role="img" aria-label="Raúl Ortiz" class="rr-avatar probe"><span aria-hidden="true" class="rr-avatar__fallback">RO</span></span>',
    );
  });

  it("Skeleton merges base + default variant and renders empty", () => {
    expect(markup(<Skeleton className="probe" title="t" data-x="1" id="s" />)).toBe(
      '<span title="t" data-x="1" id="s" class="rr-skeleton rr-skeleton--rectangle probe"></span>',
    );
  });

  it("Progress merges and serializes the full ARIA contract", () => {
    const probe = markup(
      <Progress label="Loading" value={40} className="probe" id="p" data-x="1" />,
    );

    expect(probe).toMatch(/^<div id="p" data-x="1" role="progressbar"/);
    expect(probe).toMatch(
      /role="progressbar" aria-label="Loading" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40"/,
    );
    expect(probe).toMatch(/class="rr-progress__indicator" style="width:40%"/);
    expect(probe).toMatch(/class="rr-progress probe"/);
  });

  it("Progress omits the current value when indeterminate", () => {
    expect(markup(<Progress label="Loading" indeterminate />)).not.toMatch(/aria-valuenow/);
  });

  it("Pagination merges on the nav and lets the consumer override the landmark name", () => {
    expect(
      markup(<Pagination className="probe" id="p" data-x="1" aria-label="Results" pageCount={3} />),
    ).toMatch(/^<nav id="p" data-x="1" aria-label="Results" class="rr-pagination probe">/);
    expect(markup(<Pagination pageCount={3} defaultPage={2} />)).toMatch(/aria-current="page"/);
  });

  it("Table merges on the scroll wrapper and keeps the semantic grid", () => {
    const probe = markup(
      <Table className="probe" id="t" data-x="1">
        <TableHead>
          <TableRow>
            <TableHeaderCell>a</TableHeaderCell>
            <TableHeaderCell>b</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody empty="Sin resultados" />
      </Table>,
    );

    expect(probe).toMatch(/^<div id="t" data-x="1" class="rr-table probe">/);
    expect(probe).toMatch(/<table class="rr-table__table">/);
    expect(probe).toMatch(/<th scope="col" class="rr-table__header">a<\/th>/);
    expect(probe).toMatch(
      /<td colSpan="2" class="rr-table__cell rr-table__empty">Sin resultados<\/td>/,
    );
  });

  it("DataTable composes Table and keeps the caption as the accessible name", () => {
    const probe = markup(
      <DataTable
        className="probe"
        id="users"
        data-x="1"
        caption="Users"
        data={[{ id: 1, name: "Ada" }]}
        columns={[{ key: "name", header: "Name" }]}
        getRowId={(user: { id: number }) => user.id}
      />,
    );

    expect(probe).toMatch(/^<div id="users" data-x="1" class="rr-data-table probe">/);
    expect(probe).toMatch(/<table class="rr-table__table">/);
    expect(probe).toMatch(/<caption class="rr-table__caption">Users<\/caption>/);
    expect(probe).toMatch(/<th scope="col" class="rr-table__header">Name<\/th>/);
    expect(probe).toMatch(/<td class="rr-table__cell">Ada<\/td>/);
  });

  it("FormField merges on its wrapper div", () => {
    expect(
      markup(
        <FormField className="probe" id="f" data-x="1">
          x
        </FormField>,
      ),
    ).toBe('<div id="f" data-x="1" class="rr-form-field probe">x</div>');
  });

  it("Portal serializes nothing: it has no element of its own", () => {
    // Portal takes no DOM props BY DESIGN: it renders no element of its own,
    // only its children in the container.
    expect(markup(<Portal container={undefined}>x</Portal>)).toBe("");
  });

  it("Dialog: provider root, always-mounted Trigger with the dialog ARIA contract", () => {
    const probe = markup(
      <Dialog>
        <DialogTrigger className="probe">open</DialogTrigger>
      </Dialog>,
    );

    expect(probe).toMatch(/rr-dialog-trigger probe/);
    expect(probe).toMatch(/aria-haspopup="dialog"/);
    expect(probe).toMatch(/aria-expanded="false"/);
    expect(probe).not.toMatch(/role="dialog"/);
  });

  it("Popover: Trigger carries haspopup/expanded/controls; content is mount-gated", () => {
    const probe = markup(
      <Popover>
        <PopoverTrigger className="probe">open</PopoverTrigger>
      </Popover>,
    );

    expect(probe).toMatch(/rr-popover-trigger probe/);
    expect(probe).toMatch(/aria-haspopup="dialog"/);
    expect(probe).toMatch(/aria-expanded="false"/);
    expect(probe).toMatch(/aria-controls="/);
    expect(probe).not.toMatch(/role="dialog"/);
  });

  it("DropdownMenu: Trigger carries the menu contract; content is mount-gated", () => {
    const probe = markup(
      <DropdownMenu>
        <DropdownMenuTrigger className="probe">open</DropdownMenuTrigger>
      </DropdownMenu>,
    );

    expect(probe).toMatch(/rr-dropdown-trigger probe/);
    expect(probe).toMatch(/aria-haspopup="menu"/);
    expect(probe).toMatch(/aria-expanded="false"/);
    expect(probe).toMatch(/aria-controls="/);
    expect(probe).not.toMatch(/role="menu"/);
  });

  it("Tooltip: the root IS the anchor; the panel is mount-gated", () => {
    const probe = markup(
      <Tooltip className="probe" id="t" data-x="1" content="tip">
        trigger
      </Tooltip>,
    );

    expect(probe).toBe('<span id="t" data-x="1" class="rr-tooltip-trigger probe">trigger</span>');
    expect(probe).not.toMatch(/role="tooltip"/);
    expect(probe).not.toMatch(/hint/);
  });

  it("Select: Trigger is a read-only combobox serialized before hydration", () => {
    const probe = markup(
      <Select>
        <SelectTrigger className="probe" id="s" data-x="1">
          <SelectValue>Pick a city…</SelectValue>
        </SelectTrigger>
      </Select>,
    );

    expect(probe).toMatch(/rr-select-trigger[^"]*\bprobe\b/);
    expect(probe).toMatch(/id="s"/);
    expect(probe).toMatch(/role="combobox"/);
    expect(probe).toMatch(/aria-haspopup="listbox"/);
    expect(probe).toMatch(/aria-expanded="false"/);
    expect(probe).toMatch(/aria-controls="rr-select-/);
    expect(probe).toMatch(/Pick a city…/);
    expect(probe).not.toMatch(/role="listbox"/);
  });

  it("Tabs: panels stay MOUNTED so the APG tab order exists in the first markup", () => {
    const probe = markup(
      <Tabs defaultValue="one">
        <TabsList className="probe" id="list" data-x="1">
          <TabsTrigger value="one" className="probe-t" id="t1" data-x="2">
            One
          </TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsPanel value="one" className="probe-p" id="p1" data-x="3">
          One content
        </TabsPanel>
        <TabsPanel value="two">Two content</TabsPanel>
      </Tabs>,
    );

    expect(probe).toMatch(/class="rr-tabs-list probe"/);
    expect(probe).toMatch(/id="list"/);
    expect(probe).toMatch(/role="tablist"/);
    expect(probe).toMatch(/role="tab"/);
    expect(probe).toMatch(/role="tabpanel"/);
    expect(probe).toMatch(/aria-selected="true"/);
    expect(probe).toMatch(/aria-selected="false"/);
    expect(probe).toMatch(/aria-controls="rr-tabs-/);
    expect(probe).toMatch(/aria-labelledby="rr-tabs-/);
    expect(probe).toMatch(/tabindex="0"/);
    expect(probe).toMatch(/hidden=""/);
    expect(probe).toMatch(/class="rr-tabs-trigger probe-t"/);
    expect(probe).toMatch(/class="rr-tabs-panel probe-p"/);
  });

  it("Toast: the provider serializes only the app children", () => {
    const probe = markup(
      <ToastProvider>
        <Text>app</Text>
      </ToastProvider>,
    );

    expect(probe).toBe('<span class="rr-text">app</span>');
    expect(probe).not.toMatch(/rr-toast/);
    expect(probe).not.toMatch(/role=/);
  });
});

describe("pattern: variant convention (§15) and internal helper boundary", () => {
  it.each(TYPE_FILES)("%s exposes no kind/dimension-named prop", async (file) => {
    await expect(readSource(file), `${file} must be readable`).resolves.not.toMatch(
      /^\s*(kind|dimension)\??\s*:/m,
    );
  });

  it("utils/variants stays internal: the package root does not re-export it", async () => {
    await expect(readSource("index.ts")).resolves.not.toMatch(/utils\/variants/);
  });

  it.each(["utils/flex.ts", "utils/typography.ts"])(
    "%s derives its props through the createVariants helper",
    async (file) => {
      const source = await readSource(file);

      expect(source, `${file} uses createVariants(`).toMatch(/createVariants\(/);
      expect(source, `${file} derives its props from the maps`).toMatch(/VariantProps</);
    },
  );

  it("utils/variants.ts exposes exactly the type surface the convention needs", async () => {
    const source = await readSource("utils/variants.ts");

    for (const token of [
      "export type VariantMaps",
      "export type VariantProps",
      "export function createVariants",
    ]) {
      expect(source, `variants.ts exposes ${token}`).toContain(token);
    }
  });
});
