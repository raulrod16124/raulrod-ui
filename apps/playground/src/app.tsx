// Root of the playground app (RRU-069).
//
// Composition only: this file owns no behaviour of its own beyond wiring the
// sections, because everything interesting is delegated to the design system.
// The two things that are the APP's responsibility — and that a consumer gets
// wrong most often — are modelled explicitly here:
//
//   1. `ToastProvider` wraps the tree, because `useToast` is imperative and the
//      provider owns the portaled viewport (a toast outside it throws);
//   2. the page has ONE `h1` and every section is a labelled landmark region, so
//      the heading outline a screen reader announces matches the visual layout.
import { Heading, Stack, Text, ToastProvider } from "@raulrod/ui";

import "./app.css";

import { A11yReviewSection } from "./a11y-review-section.js";
import { ConsumerContract } from "./consumer-contract/section.js";
import { FormSection } from "./form-section.js";
import { LayoutPrimitivesSection } from "./layout-primitives-section.js";
import { OverlaysSection } from "./overlays-section.js";
import { ThemeSwitcher } from "./theme-switcher.js";

export function App() {
  return (
    <ToastProvider>
      <div className="pg-shell">
        <header className="pg-header">
          <Heading as="h1" className="pg-header__title">
            RaulRod UI
          </Heading>
          <Text color="color.text.muted">
            Consumer of the public API: the E2E suite drives this page (RRU-069).
          </Text>
          <ThemeSwitcher />
        </header>

        <main>
          <Stack gap="space-8">
            <section aria-labelledby="pg-overlays-title" className="pg-section">
              <Heading as="h2" className="pg-section__title" id="pg-overlays-title">
                Overlays
              </Heading>
              <OverlaysSection />
            </section>

            <section aria-labelledby="pg-form-title" className="pg-section">
              <Heading as="h2" className="pg-section__title" id="pg-form-title">
                Form
              </Heading>
              <FormSection />
            </section>

            {/* The surface the manual a11y review (RRU-071) walks: the sensitive
                components that had no consumer page to review on. Anchor:
                `#a11y-review-section-title`. */}
            <section
              aria-labelledby="a11y-review-section-title"
              className="pg-section"
              id="a11y-review"
            >
              <Heading as="h2" className="pg-section__title" id="a11y-review-section-title">
                A11y review
              </Heading>
              <A11yReviewSection />
            </section>

            {/* What a consumer gets on arrival: the README snippets, rendered
                (RRU-110). Mounts no overlay and reuses no accessible name, so
                the unscoped E2E locators (`getByRole("dialog")`,
                `getByRole("listbox")`) keep pointing at one element. */}
            <section
              aria-labelledby="consumer-contract-title"
              className="pg-section"
              id="consumer-contract"
            >
              <Heading as="h2" className="pg-section__title" id="consumer-contract-title">
                Consumer contract
              </Heading>
              <ConsumerContract />
            </section>

            {/* Probe fixture, not a showcase: the subject the narrow-width E2E
                measures (RRU-136). RRU-144 owns the responsive section of the
                playground; this stays here so the measurement has something to
                measure. */}
            <section
              aria-labelledby="layout-primitives-title"
              className="pg-section"
              id="layout-primitives"
            >
              <Heading as="h2" className="pg-section__title" id="layout-primitives-title">
                Layout primitives
              </Heading>
              <LayoutPrimitivesSection />
            </section>
          </Stack>
        </main>
      </div>
    </ToastProvider>
  );
}
