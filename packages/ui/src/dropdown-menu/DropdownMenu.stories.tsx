import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./index.js";

const meta: Meta<typeof DropdownMenu> = {
  title: "Components/DropdownMenu",
  component: DropdownMenu,
  args: {
    defaultOpen: false,
  },
  argTypes: {
    defaultOpen: { control: "boolean" },
    open: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

function ExampleMenu(props: React.ComponentProps<typeof DropdownMenu>) {
  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={fn()}>Copy</DropdownMenuItem>
        <DropdownMenuItem onSelect={fn()}>Paste</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={fn()} disabled>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const Playground: Story = {
  render: (args) => <ExampleMenu {...args} />,
};

export const Default: Story = {
  render: () => <ExampleMenu />,
};

export const OpenByDefault: Story = {
  render: () => <ExampleMenu defaultOpen />,
};

export const WithSubmenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Cut</DropdownMenuItem>
        <DropdownMenuItem>Copy</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const LongContent: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger>Long menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        {Array.from({ length: 12 }).map((_, i) => (
          <DropdownMenuItem key={i}>Menu item {i + 1}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const Keyboard: Story = {
  render: () => <ExampleMenu />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Open menu" });
    await userEvent.click(trigger);
    await userEvent.keyboard("{arrowdown}");
    await userEvent.keyboard("{enter}");
  },
};

/**
 * The 320px case, open on load (RRU-137).
 *
 * Fourteen items and one long label, because those are the two ways this panel
 * used to leave the screen: the item count exceeds a phone's height (the menu
 * scrolls, and every item is a `menuitem`, so ArrowDown walks the scrollport) and
 * the label is what pushes the INLINE bound. Opened on load so the position
 * measurement is visible without a click; `mobile1` is 320px wide.
 */
export const Responsive: Story = {
  render: () => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        {Array.from({ length: 14 }).map((_, i) => (
          <DropdownMenuItem key={i}>
            {i === 3 ? "Export as CSV with every visible column included" : `Menu item ${i + 1}`}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
