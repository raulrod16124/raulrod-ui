// A11y review surface (RRU-071).
//
// The OVERLAYS section (`overlays-section.tsx`) was written for RRU-069 and
// happens to already host the overlay family the manual review needs. This
// section hosts what that one could NOT: the sensitive components that had no
// surface at all in a consumer app, so the §18 checklist could not be walked
// for them. Same rule as every other file here — composition only, public API
// only (guide §25, enforced by `no-restricted-imports` in the root ESLint
// config), and no state that the design system should own.
//
// Two deliberate constraints, both about not breaking the E2E suite that
// shares this page:
//   1. NO Dialog, Select, DropdownMenu, Popover or Tooltip here. Those specs
//      locate overlays UNSCOPED (`page.getByRole("dialog")` in `dialog.spec.ts:13`
//      and `theme.spec.ts:138`, `getByRole("listbox")`, `getByRole("tooltip")`,
//      `getByRole("button", { name: "Tooltip anchor" })`), so a second instance
//      of any of them would turn a green suite red through strict mode for
//      reasons that have nothing to do with the review.
//   2. No accessible name that already exists elsewhere on the page: "Email",
//      "Beta channel", "Invite teammates", "RaulRod UI", "Notifications".
//
// Each block is a self-contained thing a reviewer can judge on its own, and the
// states that change what a screen reader announces (loading, error, empty,
// long content) are reachable by keyboard from the block that owns them.
import type { DataTableColumn, DataTableSort } from "@raulrod/ui";

import { useState } from "react";

import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  DataTable,
  Heading,
  Inline,
  Progress,
  Radio,
  RadioGroup,
  Skeleton,
  Stack,
  Switch,
  Table,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
  Text,
  VisuallyHidden,
} from "@raulrod/ui";

const TEAM = [
  {
    id: "u1",
    name: "Ada Lovelace",
    role: "Maintainer",
    status: "Active",
    email: "ada@example.com",
    identifier: "f7b8a5d0-9c42-4e86-b9f3-8d62f40ab3f9",
    commits: 1284,
  },
  {
    id: "u2",
    name: "Grace Hopper",
    role: "Reviewer",
    status: "Active",
    email: "grace@example.com",
    identifier: "6b902e73-8c44-46f1-bb80-d90f36af22f0",
    commits: 942,
  },
  {
    id: "u3",
    name: "Alan Turing",
    role: "Contributor",
    status: "Away",
    email: "alan@example.com",
    identifier: "9a407058-dbc9-4d41-b9c4-b25d67113e70",
    commits: 517,
  },
  {
    id: "u4",
    name: "Tim Berners-Lee",
    role: "Maintainer",
    status: "Active",
    email: "tim@example.com",
    identifier: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    commits: 3102,
  },
  {
    id: "u5",
    name: "Barbara Liskov",
    role: "Reviewer",
    status: "Active",
    email: "barbara@example.com",
    identifier: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    commits: 1876,
  },
  {
    id: "u6",
    name: "Dennis Ritchie",
    role: "Contributor",
    status: "Away",
    email: "dennis@example.com",
    identifier: "c3d4e5f6-a7b8-9012-cdef-345678901234",
    commits: 421,
  },
  {
    id: "u7",
    name: "Linus Torvalds",
    role: "Maintainer",
    status: "Active",
    email: "linus@example.com",
    identifier: "d4e5f6a7-b8c9-0123-defa-456789012345",
    commits: 5633,
  },
  {
    id: "u8",
    name: "Margaret Hamilton",
    role: "Reviewer",
    status: "Active",
    email: "margaret@example.com",
    identifier: "e5f6a7b8-c9d0-1234-efab-567890123456",
    commits: 2890,
  },
] as const;

const RELEASES = [
  { id: "r1", version: "0.1.0", published: true, downloads: 1842 },
  { id: "r2", version: "0.2.0", published: false, downloads: 0 },
  { id: "r3", version: "0.3.0", published: true, downloads: 316 },
  { id: "r4", version: "0.4.0", published: true, downloads: 98 },
  { id: "r5", version: "0.5.0", published: false, downloads: 0 },
] as const;

type Release = (typeof RELEASES)[number];

const RELEASE_COLUMNS: readonly DataTableColumn<Release>[] = [
  { key: "version", header: "Version", sortable: true },
  { key: "published", header: "Status", render: (row) => (row.published ? "Published" : "Draft") },
  { key: "downloads", header: "Downloads", align: "end", numeric: true, sortable: true },
];

export function A11yReviewSection() {
  const [tableState, setTableState] = useState<"rows" | "loading" | "error" | "empty">("rows");
  const [progress, setProgress] = useState(64);
  const [role, setRole] = useState("maintainer");
  const [audits, setAudits] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [releaseQuery, setReleaseQuery] = useState("");
  const [releaseSort, setReleaseSort] = useState<DataTableSort<Release> | null>(null);
  const [page, setPage] = useState(1);

  return (
    <Stack gap="space-8">
      {/* Tabs — the composite whose keyboard lives in a single onKeyDown on the
          list (roving tabindex + automatic activation). The first panel holds
          ONLY text: whether the panel is reachable with Tab, or requires
          arrowing first, is exactly the kind of thing axe cannot see. */}
      <div data-testid="a11y-tabs">
        <Heading as="h3">Tabs</Heading>
        <Text color="color.text.muted">
          Tab into the list, then ArrowLeft/ArrowRight (the disabled tab is skipped), Home/End, and
          Tab again to leave the list.
        </Text>
        <Tabs defaultValue="overview">
          <TabsList aria-label="Documentation">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger disabled value="api">
              API (coming soon)
            </TabsTrigger>
          </TabsList>
          <TabsPanel value="overview">
            <Text>
              This panel contains text only — no focusable child. Notice where Tab lands after the
              tab list.
            </Text>
          </TabsPanel>
          <TabsPanel value="usage">
            <Inline className="pg-row" wrap>
              <Button variant="outline">Read the guide</Button>
              <a href="#a11y-review-section-title">Back to the section title</a>
            </Inline>
          </TabsPanel>
        </Tabs>
      </div>

      {/* Table — the static family. Four states live here because each one
          changes what is announced: rows, `aria-busy` loading, a row-level
          `role="alert"` error, and the empty row. */}
      <div data-testid="a11y-table">
        <Heading as="h3">Table states</Heading>
        <Text color="color.text.muted">
          The state switcher is a real control: activate it with the keyboard and listen to what
          changes (or does not) for a screen reader.
        </Text>
        <Inline className="pg-row" wrap>
          {(["rows", "loading", "error", "empty"] as const).map((state) => (
            <Button
              key={state}
              aria-pressed={tableState === state}
              onClick={() => setTableState(state)}
              size="sm"
              variant={tableState === state ? "primary" : "outline"}
            >
              {state}
            </Button>
          ))}
        </Inline>

        <Table
          className="pg-table-scrollport"
          loading={tableState === "loading"}
          loadingRows={3}
          size="sm"
          sticky
        >
          <Table.Caption>Maintainers and their commit count</Table.Caption>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Role</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Identifier</Table.HeaderCell>
              <Table.HeaderCell align="end">Commits</Table.HeaderCell>
            </Table.Row>
          </Table.Head>
          <Table.Body
            empty="No maintainers yet."
            error={tableState === "error" ? "Could not load the team. Try again." : undefined}
          >
            {tableState === "rows" || tableState === "loading"
              ? TEAM.map((member) => (
                  <Table.Row key={member.id}>
                    <Table.HeaderCell scope="row">{member.name}</Table.HeaderCell>
                    <Table.Cell>{member.role}</Table.Cell>
                    <Table.Cell>{member.status}</Table.Cell>
                    <Table.Cell>{member.email}</Table.Cell>
                    <Table.Cell>
                      <span style={{ whiteSpace: "nowrap" }}>{member.identifier}</span>
                    </Table.Cell>
                    <Table.Cell align="end" numeric>
                      {member.commits.toLocaleString("en-US")}
                    </Table.Cell>
                  </Table.Row>
                ))
              : null}
          </Table.Body>
        </Table>
      </div>

      {/* DataTable — the composed family: sorting buttons inside `<th>`,
          filtering, row selection and pagination. The manual pass has to answer
          whether any of those three actions is announced, because the result set
          changes without the focus moving. */}
      <div data-testid="a11y-data-table">
        <Heading as="h3">DataTable</Heading>
        <Text color="color.text.muted">
          Sort a column, type in the filter, select a row and change page. Listen for an
          announcement on each.
        </Text>
        <DataTable
          caption="Releases"
          columns={RELEASE_COLUMNS}
          data={RELEASES}
          filtering={{
            value: releaseQuery,
            onChange: setReleaseQuery,
            getValue: (row) => `${row.version} ${row.published ? "published" : "draft"}`,
            label: "Filter releases",
            placeholder: "Version or status",
          }}
          getRowId={(row) => row.id}
          pagination={{ page, pageSize: 3, onPageChange: setPage, label: "Releases" }}
          rowSelection={{
            getRowLabel: (row) => `version ${row.version}`,
            onChange: () => undefined,
          }}
          size="sm"
          sorting={{
            value: releaseSort,
            onChange: setReleaseSort,
          }}
        />
      </div>

      {/* Progress + Skeleton — one announces its own value, the other is
          decorative on purpose (no ARIA: a placeholder that announced itself
          would be noise). The two are shown together on purpose. */}
      <div data-testid="a11y-progress">
        <Heading as="h3">Progress and Skeleton</Heading>
        <Text color="color.text.muted">
          A determinate bar, an indeterminate one, and a decorative placeholder.
        </Text>
        <Stack gap="space-3">
          <Progress label="Migration progress" value={progress} />
          <Progress indeterminate label="Uploading" />
          <Inline className="pg-row" wrap>
            <Button
              onClick={() => setProgress((value) => (value >= 100 ? 0 : value + 12))}
              size="sm"
            >
              Advance
            </Button>
            <Skeleton className="pg-skeleton" />
            <Skeleton className="pg-skeleton" variant="circle" />
          </Inline>
        </Stack>
      </div>

      {/* Radio + Switch + Checkbox — the native-control family. The whole
          contract is native keyboard behaviour, which is why nothing here needs
          a single JS handler. */}
      <div data-testid="a11y-native-controls">
        <Heading as="h3">Radio, Switch and Checkbox</Heading>
        <Text color="color.text.muted">
          Arrow keys move between radios; Space toggles the switch and the checkbox.
        </Text>
        <Stack gap="space-3">
          <RadioGroup
            aria-label="Reviewer role"
            onValueChange={setRole}
            orientation="horizontal"
            value={role}
          >
            <Radio value="maintainer">Maintainer</Radio>
            <Radio value="reviewer">Reviewer</Radio>
            <Radio disabled value="owner">
              Owner (unavailable)
            </Radio>
          </RadioGroup>

          <Inline className="pg-row" wrap>
            <Switch checked={audits} onChange={(event) => setAudits(event.currentTarget.checked)}>
              Security audits
            </Switch>
            <Checkbox
              checked={agreed}
              id="a11y-review-agreement"
              onChange={(event) => setAgreed(event.currentTarget.checked)}
            />
            <label className="pg-label" htmlFor="a11y-review-agreement">
              I reviewed the announcements above
            </label>
          </Inline>
        </Stack>
      </div>

      {/* Non-interactive presentation + the focusable skip-link recipe. */}
      <div data-testid="a11y-presentation">
        <Heading as="h3">Static components and skip link</Heading>
        <Text color="color.text.muted">
          Badges, an avatar and a VisuallyHidden skip link. The link is invisible until it takes
          focus.
        </Text>
        <Inline className="pg-row" wrap>
          <a className="pg-skip-link" href="#a11y-review-presentation">
            <VisuallyHidden focusable>Skip to the review details</VisuallyHidden>
          </a>
          <Badge>Draft</Badge>
          <Badge variant="success">Green</Badge>
          <Badge variant="warning">Degraded</Badge>
          <Badge variant="destructive">Failed</Badge>
          <Badge variant="info">Beta</Badge>
          <Avatar name="Ada Lovelace" size="md" />
          <Avatar name="Grace Hopper" size="lg" />
        </Inline>
        <Stack gap="space-2">
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button variant="link">Link button</Button>
        </Stack>
      </div>
    </Stack>
  );
}
