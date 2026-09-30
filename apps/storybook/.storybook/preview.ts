import type { Preview } from "@storybook/react";

// Public subpath exports for the design-system stylesheets (RRU-091).
import "@raulrod/tokens/styles.css";
import "@raulrod/ui/styles.css";

import { WithTheme } from "./with-theme.js";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Global theme for stories",
      defaultValue: "system",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
          { value: "system", title: "System", icon: "browser" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [WithTheme],
  parameters: {
    // The theme decorator paints the story canvas with the DS background token,
    // so Storybook's own background addon is disabled to avoid conflict.
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
