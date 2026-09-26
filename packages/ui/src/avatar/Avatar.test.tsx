// Behavioral spec for Avatar (RRU-050, tracked in RRU-068).
// The card's DoD is a single accessible name: `alt ?? name`, carried by the
// `<img>` when the image renders and by `role="img"` + `aria-label` on the root
// when the initials fallback shows — never both. The image-error flip used to
// be manual-only; the DOM makes it testable, so the fallback-on-error path is
// covered here too.
import type { AvatarSize } from "./Avatar.types.js";

import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Avatar } from "../index.js";
import { auditA11y } from "../test-support/axe.js";
import { expectTokenLineage, readComponentCss, stripCssComments } from "../test-support/css.js";
import { getInitials } from "../utils/initials.js";

const sizes: AvatarSize[] = ["sm", "md", "lg"];

describe("getInitials", () => {
  it.each([
    ["Raúl Ortiz", "RO"],
    ["Solo", "S"],
    ["  María   José  ", "MJ"],
    ["ana lopez", "AL"],
  ])('turns "%s" into "%s"', (name, initials) => {
    expect(getInitials(name)).toBe(initials);
  });

  it.each(["", "   "])('falls back to "?" for %j', (name) => {
    expect(getInitials(name)).toBe("?");
  });
});

describe("Avatar rendered markup", () => {
  it("falls back to decorative initials with the name as the accessible name", () => {
    expect(renderToStaticMarkup(<Avatar name="Ana López" />)).toBe(
      '<span role="img" aria-label="Ana López" class="rr-avatar"><span aria-hidden="true" class="rr-avatar__fallback">AL</span></span>',
    );
  });

  it("lets alt override the accessible name on the fallback", () => {
    expect(renderToStaticMarkup(<Avatar name="Ana López" alt="Perfil de Ana" />)).toBe(
      '<span role="img" aria-label="Perfil de Ana" class="rr-avatar"><span aria-hidden="true" class="rr-avatar__fallback">AL</span></span>',
    );
  });

  it("keeps its own aria-label over a consumer one, so the name is never duplicated", () => {
    expect(renderToStaticMarkup(<Avatar name="Ana López" aria-label="a vender" />)).toBe(
      '<span aria-label="Ana López" role="img" class="rr-avatar"><span aria-hidden="true" class="rr-avatar__fallback">AL</span></span>',
    );
  });

  it("moves the accessible name onto the image when it renders", () => {
    const withImage = renderToStaticMarkup(<Avatar name="Ana López" src="/ana.png" />);

    expect(withImage).toMatch(
      /<span class="rr-avatar"><img src="\/ana\.png" alt="Ana López" data-rr-avatar-image="true"\/><span aria-hidden="true" class="rr-avatar__fallback">AL<\/span><\/span>$/,
    );
    expect(
      renderToStaticMarkup(<Avatar name="Ana López" src="/ana.png" alt="Foto de Ana" />),
    ).toMatch(/<img src="\/ana\.png" alt="Foto de Ana" data-rr-avatar-image="true"\/>/);
  });

  it.each(sizes)('size="%s" emits its modifier, md included when explicit', (size) => {
    expect(renderToStaticMarkup(<Avatar name="A" size={size} />)).toContain(
      `class="rr-avatar rr-avatar--size-${size}"`,
    );
  });

  it("omits the size modifier when it is not set (md lives in the CSS base)", () => {
    expect(renderToStaticMarkup(<Avatar name="A" />)).toContain('class="rr-avatar"');
  });

  it("merges className and preserves pass-through attributes", () => {
    expect(
      renderToStaticMarkup(
        <Avatar name="Ana López" className="probe" id="a" title="t" data-x="1" />,
      ),
    ).toBe(
      '<span id="a" title="t" data-x="1" role="img" aria-label="Ana López" class="rr-avatar probe"><span aria-hidden="true" class="rr-avatar__fallback">AL</span></span>',
    );
  });

  it("stays a forwardRef with a displayName for dev tooling", () => {
    expect(Avatar.$$typeof).toBe(Symbol.for("react.forward_ref"));
    expect(Avatar.displayName).toBe("Avatar");
  });
});

describe("Avatar behavior", () => {
  it("announces the name exactly once with the image", async () => {
    const { container } = render(<Avatar name="Ana López" src="/ana.png" />);

    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(container.querySelector("img")).toHaveAttribute("alt", "Ana López");
    expect(container.querySelector(".rr-avatar__fallback")).toHaveAttribute("aria-hidden", "true");

    await expect(auditA11y(container)).resolves.toHaveNoViolations();
  });

  it("falls back to the initials when the image fails to load", () => {
    const { container } = render(<Avatar name="Ana López" src="/missing.png" />);

    expect(container.querySelector("img")).toBeInTheDocument();

    fireEvent.error(container.querySelector("img") as HTMLImageElement);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".rr-avatar__fallback")).toHaveTextContent("AL");
    expect(screen.getByRole("img", { name: "Ana López" })).toBeInTheDocument();
  });
});

describe("Avatar authored CSS contract", () => {
  it("is a disc of space-scale squares, reusing the sunken + muted pair", async () => {
    const css = await readComponentCss("avatar/Avatar.css");

    expect(css).toMatch(/\.rr-avatar\s*\{[^}]*border-radius:\s*var\(--rr-radius-full\)/);
    expect(css).toMatch(/\.rr-avatar\s*\{[^}]*width:\s*var\(--rr-space-10\)/);
    expect(css).toMatch(/\.rr-avatar\s*\{[^}]*background:\s*var\(--rr-color-background-sunken\)/);
    expect(css).toMatch(/\.rr-avatar\s*\{[^}]*color:\s*var\(--rr-color-text-muted\)/);
  });

  it("squares every size on the space scale", async () => {
    const css = await readComponentCss("avatar/Avatar.css");

    for (const [size, step] of [
      ["sm", "--rr-space-8"],
      ["md", "--rr-space-10"],
      ["lg", "--rr-space-12"],
    ]) {
      expect(css, `size ${size}`).toMatch(
        new RegExp(`\\.rr-avatar--size-${size}\\s*\\{[^}]*width:\\s*var\\(${step}\\)`),
      );
      expect(css, `size ${size}`).toMatch(
        new RegExp(`\\.rr-avatar--size-${size}\\s*\\{[^}]*height:\\s*var\\(${step}\\)`),
      );
    }
  });

  it("lets the image fill the disc", async () => {
    const css = await readComponentCss("avatar/Avatar.css");

    expect(css).toMatch(/\.rr-avatar img\s*\{[^}]*object-fit:\s*cover/);
    expect(css).toMatch(/\.rr-avatar img\s*\{[^}]*width:\s*100%/);
  });

  it("affords no interaction, no hardcoded hex and no display:none fallback", async () => {
    const css = stripCssComments(await readComponentCss("avatar/Avatar.css"));

    expect(css).not.toMatch(/:(hover|focus|active|disabled)\s*\{/);
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css, "the preloaded initials must stay in the tree").not.toMatch(/display:\s*none/);
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("avatar/Avatar.css"));
  });
});
