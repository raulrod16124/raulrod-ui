// Three-state theme switcher (RRU-069).
//
// A segmented control, not a two-state switch, because the theming model has
// THREE states and collapsing "system" into an off/on toggle would make the
// dark-on-light-OS case unreachable. Each option is a real `Button` with
// `aria-pressed`, so a screen reader announces "System, toggle button, pressed"
// and the keyboard gets native button semantics for free.
import { useState } from "react";

import { Button, Inline } from "@raulrod/ui";

import { applyTheme, readThemeChoice, type ThemeChoice } from "./theme.js";

const CHOICES: readonly ThemeChoice[] = ["system", "light", "dark"];

const LABELS: Record<ThemeChoice, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

export function ThemeSwitcher() {
  const [choice, setChoice] = useState<ThemeChoice>(readThemeChoice);

  function select(next: ThemeChoice) {
    setChoice(next);
    applyTheme(next);
  }

  return (
    <Inline className="pg-theme-switch" data-testid="theme-switcher">
      {CHOICES.map((option) => (
        <Button
          key={option}
          aria-pressed={choice === option}
          data-testid={`theme-${option}`}
          onClick={() => select(option)}
          size="sm"
          variant={choice === option ? "primary" : "outline"}
        >
          {LABELS[option]}
        </Button>
      ))}
    </Inline>
  );
}
