// The security contract of the SHIPPED package (RRU-102).
//
// DoD #2 of the card is "no dangerous API for convenience". Read literally it
// passes today and always will: the components have never reached for
// `dangerouslySetInnerHTML`, and a spec that only records that fact protects
// nothing. What RRU-102 actually decided is a RULE that outlives the code that
// happens to comply with it, so this spec holds three promises:
//
//   1. no dangerous API in anything that reaches `dist/` (the ESLint ban of the
//      same name fails at the offending LINE during `pnpm lint`; this spec is
//      the second, independent layer that a reviewer, a bisect or a fresh
//      checkout can run without trusting a lint cache);
//   2. no public prop that hands a consumer a raw-HTML or string-eval hatch —
//      the ban has to reach the TYPE, because a component that accepts `html`
//      does not need `innerHTML` to be an XSS;
//   3. every URL the library renders is a reviewed, documented decision, not
//      an accident of whoever wrote the component last.
//
// Why SOURCE and not the DOM: the same argument as `css-contracts.test.ts`.
// These contracts are about code that may not exist yet — a state nobody
// renders, a branch no fixture takes, a prop added in a hurry — and no runtime
// assertion can fail for code that was never written. The cost is stated where
// it exists: this is a TEXT gate, so it cannot see a dangerous API reached
// through a variable (`const sink = "inner" + "HTML"`), only the literal call.
// What it buys is that the dangerous API has to be spelled out, and spelling it
// out is exactly the moment a reviewer asks whether it is necessary.
//
// Two layers, deliberately not one: the lint ban is precise (AST) and fast, this
// spec is blunt (text) and total. The spec does NOT honour `eslint-disable`. An
// inline disable is a local, reviewable decision made where the API is used;
// making this layer honour it too would mean a single comment could silence the
// shipped-artifact guarantee. A component that genuinely needs raw HTML needs an
// ADR and a documented escape hatch — and that ADR updates this file.
import { describe, expect, it } from "vitest";

import { listSourcePaths, readSource } from "./test-support/source.js";

/** One banned construct: what to look for, and what it would cost. */
interface Ban {
  readonly id: string;
  readonly pattern: RegExp;
  readonly because: string;
}

interface Finding {
  readonly ban: string;
  readonly line: number;
  readonly excerpt: string;
}

const BANNED_APIS: readonly Ban[] = [
  {
    id: "raw-html",
    pattern: /\b(?:dangerouslySetInnerHTML|insertAdjacentHTML|srcDoc)\b/,
    because: "turns a string into markup, opting out of React's escaping",
  },
  {
    id: "dom-string-write",
    pattern: /\.(?:inner|outer)HTML\b/,
    because: "bypasses the virtual DOM and React's escaping in one step",
  },
  {
    id: "string-code-execution",
    // `\bFunction\s*\(` cannot match `someFunction(` (no word boundary before
    // `F`) nor `React.FunctionComponent<` (no `(` after the name).
    pattern: /\beval\s*\(|\bnew\s+Function\b|\bFunction\s*\(/,
    because: "code from a string is opaque to review, types and every static gate",
  },
  {
    id: "document-write",
    pattern: /\bdocument\s*\.\s*write\s*\(/,
    because: "writes the document while the parser owns it",
  },
  {
    id: "javascript-url",
    pattern: /["'`][^"'`\n]*javascript:/i,
    because: "React 19 neutralizes the scheme at runtime, but a literal is a bug in our source",
  },
];

/**
 * Public props that would hand a consumer an escape hatch. `as` is NOT here:
 * `Heading.as` is a bounded union of `h1`…`h6` (ADR-004, bounded polymorphism),
 * and `component`/`asChild` are the unbounded forms this package closed.
 */
const BANNED_PROPS: readonly Ban[] = [
  {
    id: "prop-html",
    pattern:
      /^[\s]*(?:readonly\s+)?(?:html|dangerouslySetInnerHTML|innerHTML|outerHTML|srcDoc)\??\s*:/m,
    because: "a component that accepts a raw-HTML string is the XSS, not its renderer",
  },
  {
    id: "prop-polymorphic",
    pattern: /^[\s]*(?:readonly\s+)?(?:asChild|component)\??\s*:/m,
    because: "unbounded polymorphism is the escape hatch ADR-004 closed",
  },
];

/**
 * URL attributes rendered by a component. Each hit has to be a reviewed
 * decision: `href`/`src` are forwarded verbatim by contract (see
 * `Button.types.ts` and the URL policy in SECURITY.md §Content and URLs), so a NEW one is a new
 * public promise about untrusted input, not an implementation detail.
 */
const URL_ATTRIBUTES = /\b(?:href|src|srcSet|action|formAction|poster|xlinkHref)=/;

/**
 * Reviewer-approved URL surfaces. Adding a component here means asserting that
 * its URL prop is forwarded verbatim, is documented as such, and — for
 * `target="_blank"` — that it sets a safe `rel` (Button, RRU-102).
 */
const REVIEWED_URL_SURFACES: readonly string[] = ["avatar/Avatar.tsx", "button/Button.tsx"];

/** Files whose contents become the published `dist/` (tsconfig.build.json). */
function isShippedSource(path: string): boolean {
  if (!/\.tsx?$/.test(path) || path.endsWith(".d.ts")) return false;
  if (path.startsWith("test-support/")) return false;
  return !/\.(?:test|stories)\.tsx?$/.test(path);
}

/**
 * Comments are removed before any pattern runs, and blanked rather than
 * deleted: prose about `innerHTML` (several components explain WHY they do not
 * use it) must neither satisfy a gate nor trip one. Deleting would also shift
 * line numbers and make a finding point at the wrong line.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (_match, lead: string) => lead);
}

function scan(source: string, bans: readonly Ban[]): Finding[] {
  const code = stripComments(source);
  return code
    .split("\n")
    .flatMap((text, index) =>
      bans.flatMap((ban) =>
        ban.pattern.test(text) ? [{ ban: ban.id, line: index + 1, excerpt: text.trim() }] : [],
      ),
    );
}

const shippedSources = async (): Promise<string[]> =>
  (await listSourcePaths()).filter(isShippedSource);

describe("shipped sources use no dangerous API (RRU-102)", () => {
  it("the enumeration is not empty — otherwise every assertion below is vacuous", async () => {
    const paths = await shippedSources();
    expect(paths.length).toBeGreaterThan(50);
    expect(paths).toContain("button/Button.tsx");
    expect(paths).toContain("index.ts");
  });

  it("no shipped source reaches for a dangerous API", async () => {
    const findings: string[] = [];

    for (const path of await shippedSources()) {
      for (const finding of scan(await readSource(path), BANNED_APIS)) {
        findings.push(
          `${path}:${finding.line} [${finding.ban}] ${finding.excerpt} — ${BANNED_APIS.find((ban) => ban.id === finding.ban)?.because}`,
        );
      }
    }

    expect(
      findings,
      `dangerous API in a shipped source (${findings.length}). Content is rendered as TEXT or as React nodes; an HTML string, if a component ever needs one, is an ADR + a documented escape hatch, not an implementation detail:\n${findings.join("\n")}`,
    ).toEqual([]);
  });

  it("no public prop type exposes a raw-HTML or unbounded-polymorphism hatch", async () => {
    const typeFiles = (await shippedSources()).filter((path) => path.endsWith(".types.ts"));
    expect(typeFiles.length).toBeGreaterThan(20);

    const findings: string[] = [];
    for (const path of typeFiles) {
      for (const finding of scan(await readSource(path), BANNED_PROPS)) {
        findings.push(`${path}:${finding.line} [${finding.ban}] ${finding.excerpt}`);
      }
    }

    expect(
      findings,
      `escape hatch in the public API (${findings.length}). A consumer who can pass markup or a component type into our components owns the XSS, whatever our internals do:\n${findings.join("\n")}`,
    ).toEqual([]);
  });

  it("every rendered URL attribute is a reviewed decision", async () => {
    const rendered: string[] = [];

    for (const path of await shippedSources()) {
      if (URL_ATTRIBUTES.test(stripComments(await readSource(path)))) rendered.push(path);
    }

    expect([...rendered].sort()).toEqual([...REVIEWED_URL_SURFACES].sort());
  });
});

describe("the contract is not a no-op (negative probes, ADR-005 §5)", () => {
  it("flags each banned API when it is present", async () => {
    const probes: readonly [string, string][] = [
      ["raw-html", `const el = <div dangerouslySetInnerHTML={{ __html }} />;`],
      ["dom-string-write", `host.innerHTML = markup;`],
      ["string-code-execution", `const n = eval("1 + 1");`],
      ["string-code-execution", `const make = new Function("a", "return a");`],
      ["document-write", `document.write(markup);`],
      ["javascript-url", `const href = "javascript:alert(1)";`],
    ];

    for (const [expected, source] of probes) {
      expect(
        scan(source, BANNED_APIS).map((finding) => finding.ban),
        `probe must be flagged: ${source}`,
      ).toContain(expected);
    }
  });

  it("flags a dangerous prop even when the component never renders it", async () => {
    const findings = scan(
      `export interface WidgetProps {\n  /** Content. */\n  html?: string;\n  asChild?: never;\n}`,
      BANNED_PROPS,
    );
    expect(findings.map((finding) => finding.ban).sort()).toEqual([
      "prop-html",
      "prop-polymorphic",
    ]);
  });

  it("reports the line a finding is on, and blanks comments instead of deleting them", () => {
    const source = ["// mentions innerHTML in prose", "const safe = 1;", "eval(x);"].join("\n");
    const findings = scan(source, BANNED_APIS);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.line).toBe(3);
    expect(findings[0]?.excerpt).toBe("eval(x);");
  });

  it("reports nothing on a clean source, so the flags above mean something", async () => {
    for (const path of await shippedSources()) {
      expect(
        scan(await readSource(path), [...BANNED_APIS, ...BANNED_PROPS]),
        `${path} must be free of every banned construct`,
      ).toEqual([]);
    }
  });
});
