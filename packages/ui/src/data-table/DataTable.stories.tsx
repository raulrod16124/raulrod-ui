import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";
import { useState } from "react";

import { StoryStack } from "../storybook-support/index.js";

import { DataTable } from "./DataTable.js";

interface Row {
  id: number;
  name: string;
  role: string;
  hours: number;
}

const rows: Row[] = [
  { id: 1, name: "Ada Lovelace", role: "Engineer", hours: 120 },
  { id: 2, name: "Grace Hopper", role: "Admiral", hours: 145 },
  { id: 3, name: "Tim Berners-Lee", role: "Inventor", hours: 90 },
];

const columns = [
  { key: "name" as const, header: "Name" },
  { key: "role" as const, header: "Role" },
  { key: "hours" as const, header: "Hours", numeric: true },
];

const meta: Meta<typeof DataTable<Row>> = {
  title: "Components/DataTable",
  component: DataTable,
  args: {
    caption: "Team hours",
    data: rows,
    columns,
    getRowId: (row) => row.id,
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md"] },
    sticky: { control: "boolean" },
    loading: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable<Row>>;

export const Playground: Story = {};

export const Default: Story = {};

export const Sortable: Story = {
  args: {
    sorting: {
      defaultValue: { key: "hours", direction: "desc" },
      onChange: fn(),
    },
  },
};

export const Filterable: Story = {
  args: {
    filtering: {
      defaultValue: "",
      onChange: fn(),
      getValue: (row) => `${row.name} ${row.role}`,
      label: "Filter by name or role",
      placeholder: "Search…",
    },
  },
};

export const Selectable: Story = {
  args: {
    rowSelection: {
      getRowLabel: (row) => row.name,
      defaultSelectedRowIds: [1],
      onChange: fn(),
    },
  },
};

export const Pagination: Story = {
  args: {
    data: Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      role: "Member",
      hours: (i + 1) * 10,
    })),
    pagination: {
      pageSize: 5,
      defaultPage: 1,
      onPageChange: fn(),
    },
  },
};

export const Empty: Story = {
  args: {
    data: [],
    empty: "No team members found.",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    loadingRows: 5,
  },
};

export const LongContent: Story = {
  args: {
    data: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Team member ${i + 1} with a very long name`,
      role: "Senior engineer",
      hours: (i + 1) * 100,
    })),
    pagination: {
      pageSize: 10,
      defaultPage: 1,
    },
  },
};

function SelectableDataTable() {
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set([1]));
  return (
    <DataTable
      caption="Team hours"
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      rowSelection={{
        getRowLabel: (row) => row.name,
        selectedRowIds: selected,
        onChange: setSelected,
      }}
    />
  );
}

export const Keyboard: Story = {
  render: () => <SelectableDataTable />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "Select Grace Hopper" });
    await userEvent.click(checkbox);
  },
};

export const Responsive: Story = {
  args: {
    columns,
    data: Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: i === 0 ? 'Very Long Person Name That Should Wrap Gracefully' : `Person ${i + 1}`,
      role: i === 2 ? 'Very Long Role Title That May Need Wrapping' : 'Member',
      hours: (i + 1) * 10,
    })),
    caption: 'Team hours',
    filtering: {
      defaultValue: '',
      onChange: () => undefined,
      getValue: (row) => `${row.name} ${row.role}`,
      label: 'Filter by name or role',
      placeholder: 'Search users...',
    },
    pagination: {
      pageSize: 5,
      defaultPage: 1,
      onPageChange: () => undefined,
    },
    getRowId: (row) => row.id,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
