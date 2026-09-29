import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";
import { useState } from "react";

import { Tabs, TabsList, TabsPanel, TabsTrigger } from "./index.js";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  args: {
    defaultValue: "account",
  },
  argTypes: {
    defaultValue: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

function ExampleTabs(props: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs {...props}>
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsPanel value="account">Manage your account settings.</TabsPanel>
      <TabsPanel value="security">Update your password and 2FA.</TabsPanel>
      <TabsPanel value="billing">View invoices and payment methods.</TabsPanel>
    </Tabs>
  );
}

export const Playground: Story = {
  render: (args) => <ExampleTabs {...args} />,
};

export const Default: Story = {
  render: () => <ExampleTabs />,
};

export const DisabledTab: Story = {
  render: () => <ExampleTabs defaultValue="account" />,
};

function ControlledTabs() {
  const [value, setValue] = useState("account");
  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      <TabsPanel value="account">Account panel</TabsPanel>
      <TabsPanel value="security">Security panel</TabsPanel>
    </Tabs>
  );
}

export const Controlled: Story = {
  render: () => <ControlledTabs />,
};

export const ManyTabs: Story = {
  render: () => (
    <Tabs defaultValue="1">
      <TabsList>
        {Array.from({ length: 8 }).map((_, i) => (
          <TabsTrigger key={i} value={`${i + 1}`}>
            Tab {i + 1}
          </TabsTrigger>
        ))}
      </TabsList>
      {Array.from({ length: 8 }).map((_, i) => (
        <TabsPanel key={i} value={`${i + 1}`}>
          Content of tab {i + 1}
        </TabsPanel>
      ))}
    </Tabs>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Tabs defaultValue="1">
      <TabsList>
        <TabsTrigger value="1">First</TabsTrigger>
        <TabsTrigger value="2">Second</TabsTrigger>
      </TabsList>
      <TabsPanel value="1">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </TabsPanel>
      <TabsPanel value="2">
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
          nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
          deserunt mollit anim id est laborum.
        </p>
      </TabsPanel>
    </Tabs>
  ),
};

export const Keyboard: Story = {
  render: () => <ExampleTabs onValueChange={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tab = canvas.getByRole("tab", { name: "Account" });
    await userEvent.click(tab);
    await userEvent.keyboard("{arrowright}");
  },
};
