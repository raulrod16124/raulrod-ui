import type { Preview } from "@storybook/react";

/* eslint-disable no-restricted-imports -- RRU-091: subpath exports replace these two paths. */
import "@raulrod/tokens/dist/tokens.css";
import "@raulrod/ui/dist/styles.css";
/* eslint-enable no-restricted-imports */

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
