/// <reference types="node" />
// Server-rendering smoke of the playground (RRU-110, closing RRU-024's debt).
//
// RRU-024 closed its SSR/SSG criterion — "works in SSR/SSG without a hydration
// error" — with static CSS that cannot touch `window`, and left one sentence
// behind: "runtime SSR verification arrives with the playground". This is that
// sentence, paid.
//
// The playground is a Vite SPA and proves nothing about SSR by itself. What it
// can do, and what nobody had done, is take the app's real component graph and
// run it through `react-dom/server` in an environment with NO DOM globals: this
// suite's `environment` is `node`, inherited from `vitest.config.ts`, so
// `document`, `window` and `localStorage` do not exist. A component that reads
// one of them while rendering throws here instead of in a consumer's server
// render, where the stack points at the design system instead of at the app.
//
// Determinism is the second half, and it is the half that actually predicts
// hydration: React re-renders the same tree on the client and warns when the
// two markups disagree. Anything non-deterministic in a render — `Date.now()`,
// `Math.random()`, an id seeded outside React — produces a mismatch that only
// shows up as a console warning in someone's console. Rendering twice and
// comparing the strings catches it here, in a test, with a diff.
//
// Scope note: this proves the app's graph is renderable on a server and
// deterministic. It is not a substitute for RRU-111 (installing the packed
// tarballs in an external project) nor for RRU-114 (a real app on a real
// framework, where `hydrateRoot` is what actually reconciles the two trees).
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { App } from "./app.js";
import { readThemeChoice } from "./theme.js";

describe("server rendering (RRU-110)", () => {
  it("has no DOM globals to hide behind", () => {
    // Anti-vacuity. In a jsdom/happy-dom environment the render below could pass
    // while reading `document`, which is exactly the bug this suite exists to
    // catch — so the premise is asserted, not assumed.
    expect(typeof document).toBe("undefined");
    expect(typeof window).toBe("undefined");
    expect(typeof localStorage).toBe("undefined");
  });

  it("renders the whole app to a string with no browser global involved", () => {
    const html = renderToString(<App />);

    // Not `toBeTruthy()`: the markup has to be the app a consumer sees, which
    // is what distinguishes "it rendered" from "it rendered nothing".
    expect(html).toContain("RaulRod UI");
    expect(html).toContain("Consumer contract");
  });

  it("renders the same markup twice, so a hydration mismatch cannot be latent", () => {
    expect(renderToString(<App />)).toBe(renderToString(<App />));
  });

  it("reads the persisted theme without a storage, as a server render must", () => {
    // `readThemeChoice` is the app's own theme read, called during the very
    // first render of `ThemeSwitcher`. Server-side there is no storage and no
    // `localStorage` binding at all, so the fallback is the only correct answer
    // — and it has to match what the blocking script in `index.html` decided,
    // which is also "system" when nothing valid is stored.
    expect(readThemeChoice()).toBe("system");
  });
});
