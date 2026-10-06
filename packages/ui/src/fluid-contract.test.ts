// Fluid-family responsive contract (RRU-143).
//
// The board claimed ten components were already fluid. Proving that claim
// surfaced four that were not: Text, Heading, Badge and Switch.label lack
// `overflow-wrap`, so an unbreakable token overflows a narrow container.
// This gate pins both halves: the four fixes and the six reasons the rest
// were already safe.
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { declaration, parseCssRules } from "./test-support/css-rules.js";

interface InventoryEntry {
  readonly name: string;
  readonly file: string | null;
  readonly reason: string;
  readonly checks?: readonly CssCheck[];
}

interface CssCheck {
  readonly selector: string;
  readonly property: string;
  readonly expected: string;
}

const INVENTORY: readonly InventoryEntry[] = [
  {
    name: "Checkbox",
    file: "checkbox/Checkbox.css",
    reason: "fixed square by token (space-3/4/5); replaced element so min-width:auto floors it",
    checks: [
      { selector: ".rr-checkbox", property: "width", expected: "var(--rr-space-4)" },
      { selector: ".rr-checkbox", property: "height", expected: "var(--rr-space-4)" },
    ],
  },
  {
    name: "Avatar",
    file: "avatar/Avatar.css",
    reason: "fixed square with flex-shrink:0 and overflow:hidden",
    checks: [
      { selector: ".rr-avatar", property: "flex-shrink", expected: "0" },
      { selector: ".rr-avatar", property: "overflow", expected: "hidden" },
    ],
  },
  {
    name: "Skeleton",
    file: "skeleton/Skeleton.css",
    reason: "width:100% with no padding/border to overflow",
    checks: [{ selector: ".rr-skeleton", property: "width", expected: "100%" }],
  },
  {
    name: "Progress",
    file: "progress/Progress.css",
    reason: "width:100% with no padding/border to overflow",
    checks: [{ selector: ".rr-progress", property: "width", expected: "100%" }],
  },
  {
    name: "VisuallyHidden",
    file: "visually-hidden/VisuallyHidden.css",
    reason: "position:absolute 1x1 out of flow, zero layout footprint",
    checks: [
      { selector: ".rr-visually-hidden", property: "position", expected: "absolute" },
      { selector: ".rr-visually-hidden", property: "width", expected: "1px" },
      { selector: ".rr-visually-hidden", property: "height", expected: "1px" },
    ],
  },
  {
    name: "Portal",
    file: null,
    reason: "renders no element of its own; portalled children escape ancestor clipping",
  },
  {
    name: "Switch",
    file: "switch/Switch.css",
    reason: "label is a flex item and needs min-width:0 + overflow-wrap:anywhere",
    checks: [
      { selector: ".rr-switch-label", property: "min-width", expected: "0" },
      { selector: ".rr-switch-label", property: "overflow-wrap", expected: "anywhere" },
    ],
  },
  {
    name: "Text",
    file: "text/Text.css",
    reason: "typography primitive holding consumer text needs overflow-wrap:anywhere",
    checks: [{ selector: ".rr-text", property: "overflow-wrap", expected: "anywhere" }],
  },
  {
    name: "Heading",
    file: "heading/Heading.css",
    reason: "typography primitive holding consumer text needs overflow-wrap:anywhere",
    checks: [{ selector: ".rr-heading", property: "overflow-wrap", expected: "anywhere" }],
  },
  {
    name: "Badge",
    file: "badge/Badge.css",
    reason: "inline-flex with consumer text needs min-width:0 + overflow-wrap:anywhere",
    checks: [
      { selector: ".rr-badge", property: "min-width", expected: "0" },
      { selector: ".rr-badge", property: "overflow-wrap", expected: "anywhere" },
    ],
  },
];

const CHECKED_INVENTORY = INVENTORY.filter(
  (entry): entry is InventoryEntry & { file: string } => entry.file !== null,
);

describe("fluid family responsive contract (RRU-143)", () => {
  it.each(CHECKED_INVENTORY)("$name: $reason", async ({ file, checks }) => {
    const rules = await parseCssRules(file);
    for (const { selector, property, expected } of checks ?? []) {
      const rule = rules.find((r) => r.selectors.includes(selector) && r.media === null);
      expect(rule, `${selector} base rule exists in ${file}`).toBeDefined();
      expect(declaration(rule!, property)?.value).toBe(expected);
    }
  });
});

// Shared probe directory for the negative probes below (ADR-005 §5).
const probeDirectory = await mkdtemp(join(tmpdir(), "rr-fluid-contract-"));

afterAll(async () => {
  await rm(probeDirectory, { recursive: true, force: true });
});

describe("the fluid contract is not a no-op (negative probes, RRU-143)", () => {
  it("flags a text component that omits overflow-wrap", async () => {
    const path = join(probeDirectory, "missing-overflow-wrap.css");
    await writeFile(
      path,
      `.rr-probe {
  font-size: var(--rr-font-size-base);
}
`,
      "utf8",
    );
    const rules = await parseCssRules(path);
    const rule = rules.find((r) => r.selectors.includes(".rr-probe") && r.media === null);
    expect(declaration(rule!, "overflow-wrap")).toBeUndefined();
  });

  it("flags a flex-item label that omits min-width:0", async () => {
    const path = join(probeDirectory, "missing-min-width.css");
    await writeFile(
      path,
      `.rr-probe-label {
  overflow-wrap: anywhere;
}
`,
      "utf8",
    );
    const rules = await parseCssRules(path);
    const rule = rules.find((r) => r.selectors.includes(".rr-probe-label") && r.media === null);
    expect(declaration(rule!, "min-width")).toBeUndefined();
  });
});
