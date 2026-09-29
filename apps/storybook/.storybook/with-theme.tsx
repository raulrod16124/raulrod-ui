import type { Decorator } from "@storybook/react";

import { useEffect } from "react";

type Theme = "light" | "dark" | "system";

/** Apply the selected theme to the document root. "system" removes the override
 *  so the CSS `@media (prefers-color-scheme: dark)` block takes over. */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

/** Storybook decorator that keeps `data-theme` in sync with the global toolbar
 *  and paints the story canvas with the DS background/text tokens. */
export const WithTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme ?? "system") as Theme;

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div
      style={{
        backgroundColor: "var(--rr-color-background-default)",
        color: "var(--rr-color-text-primary)",
        minHeight: "100vh",
      }}
    >
      <Story />
    </div>
  );
};
