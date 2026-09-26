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

import { FormSection } from "./form-section.js";
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
          </Stack>
        </main>
      </div>
    </ToastProvider>
  );
}
