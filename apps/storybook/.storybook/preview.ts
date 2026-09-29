import type { Preview } from "@storybook/react";

/* eslint-disable no-restricted-imports -- RRU-091: subpath exports replace these two paths. */
import "@raulrod/tokens/dist/tokens.css";
import "@raulrod/ui/dist/styles.css";
/* eslint-enable no-restricted-imports */

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
