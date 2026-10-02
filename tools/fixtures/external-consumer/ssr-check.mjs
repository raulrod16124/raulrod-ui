/* Runtime proof: load the packages the way Node does and render a component.
 *
 * `renderToString` instead of a DOM render because this route has no browser yet
 * and no business having one. What it checks is that the tarball's ESM loads under
 * Node's own resolution and that the React in the tree is the consumer's React: a
 * duplicated React would fail here as an invalid-hook-call long before it showed up
 * as a hydration bug in an app.
 *
 * Lives in the project rather than in a `-e` string so it is reviewable as the
 * file a consumer would write, and so `tsc` ignores it (it is outside `src`).
 */
import { renderToString } from "react-dom/server";
import { createElement } from "react";

import { Button, ChevronDown, Heading } from "@raulrod/ui";
import { contrastRatio } from "@raulrod/tokens";

if (contrastRatio("#ffffff", "#171c22") < 4.5) {
  throw new Error("contrastRatio disagrees with the theme: the token pair is not accessible");
}

const html = renderToString(
  createElement(
    "div",
    null,
    createElement(Heading, { as: "h1" }, "External consumer"),
    createElement(
      Button,
      { type: "button" },
      "Press me",
      createElement(ChevronDown, { "aria-hidden": "true" }),
    ),
  ),
);

// "rr-button" is asserted because it is what Button.tsx actually renders: a
// component that resolved to undefined would render nothing and still "work".
for (const needle of ["<h1", "rr-button", "Press me"]) {
  if (!html.includes(needle)) {
    throw new Error(`the rendered markup is missing "${needle}": ${html.slice(0, 400)}`);
  }
}

process.stdout.write(`${html.slice(0, 120)}\n`);
