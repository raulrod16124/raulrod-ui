import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";

import { Button } from "../button/index.js";
import { Inline } from "../inline/index.js";
import { Input } from "../input/index.js";
import { NarrowContainer, StoryStack } from "../storybook-support/index.js";
import { Text } from "../text/index.js";

import {
  FormField,
  FormFieldControl,
  FormFieldDescription,
  FormFieldError,
  FormFieldLabel,
} from "./index.js";

const meta: Meta<typeof FormField> = {
  title: "Components/FormField",
  component: FormField,
  args: {
    controlId: undefined,
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Playground: Story = {
  render: (args) => (
    <FormField {...args}>
      <FormFieldLabel>Email</FormFieldLabel>
      <FormFieldDescription>We never share your email.</FormFieldDescription>
      <FormFieldControl>
        {(field) => <Input type="email" placeholder="you@example.com" {...field} />}
      </FormFieldControl>
    </FormField>
  ),
};

export const Default: Story = {
  render: () => (
    <FormField>
      <FormFieldLabel>Full name</FormFieldLabel>
      <FormFieldControl>{(field) => <Input placeholder="Jane Doe" {...field} />}</FormFieldControl>
    </FormField>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <FormField>
      <FormFieldLabel>Username</FormFieldLabel>
      <FormFieldDescription>Between 3 and 20 characters.</FormFieldDescription>
      <FormFieldControl>{(field) => <Input placeholder="jane-doe" {...field} />}</FormFieldControl>
    </FormField>
  ),
};

export const Error: Story = {
  render: () => (
    <FormField>
      <FormFieldLabel>Email</FormFieldLabel>
      <FormFieldControl>
        {(field) => <Input type="email" aria-invalid defaultValue="not-an-email" {...field} />}
      </FormFieldControl>
      <FormFieldError>Please enter a valid email address.</FormFieldError>
    </FormField>
  ),
};

export const LongContent: Story = {
  render: () => (
    <FormField>
      <FormFieldLabel>
        {["A very long label that should wrap inside a narrow container without overflowing."]}
      </FormFieldLabel>
      <FormFieldControl>
        {(field) => <Input defaultValue={"a".repeat(80)} {...field} />}
      </FormFieldControl>
    </FormField>
  ),
};

export const Keyboard: Story = {
  render: () => (
    <FormField>
      <FormFieldLabel>Search</FormFieldLabel>
      <FormFieldControl>
        {(field) => <Input placeholder="Type and submit" {...field} />}
      </FormFieldControl>
    </FormField>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.click(input);
    await userEvent.type(input, "hello");
  },
};

export const Responsive: Story = {
  render: () => (
    <StoryStack gap="space-6">
      <NarrowContainer label="field shrinks in a 200px row">
        <Inline>
          <FormField>
            <FormFieldControl>
              {(field) => <Input placeholder="Email" {...field} />}
            </FormFieldControl>
          </FormField>
          <Button>Send</Button>
        </Inline>
      </NarrowContainer>
      <NarrowContainer label="label and error wrap instead of overflowing" width="240px">
        <FormField>
          <FormFieldLabel>A long label that must wrap cleanly</FormFieldLabel>
          <FormFieldDescription>And a description that also wraps.</FormFieldDescription>
          <FormFieldControl>
            {(field) => <Input defaultValue={"a".repeat(40)} {...field} />}
          </FormFieldControl>
          <FormFieldError>This error message is also too long for one line.</FormFieldError>
        </FormField>
      </NarrowContainer>
      <NarrowContainer label="static text wraps with the field" width="240px">
        <Text>
          {[
            "The FormField root is a flex item; it must shrink instead of forcing the page to scroll horizontally.",
          ]}
        </Text>
      </NarrowContainer>
    </StoryStack>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
