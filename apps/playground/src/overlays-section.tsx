// Overlay section of the playground (RRU-069).
//
// Every overlay of the system in ONE place, composed the way a consumer would:
// the E2E suite needs to open them, and the manual a11y review (RRU-071) needs
// them reachable with the keyboard. The nesting is deliberate and is the
// interesting part — a `Popover`/`Select` opened from inside a `Dialog` is the
// case where the overlay STACK has to behave (only the topmost layer consumes an
// Escape), which no isolated component demo can show.
import { useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  IconButton,
  Info,
  Inline,
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Settings,
  Stack,
  Text,
  Tooltip,
  Trash2,
} from "@raulrod/ui";

// `disabled` is part of the data on purpose: the keyboard contract of a listbox
// ("a disabled option is never focusable") can only be proven if the app has one.
const CITIES = [
  { value: "berlin", label: "Berlin" },
  { value: "oaxaca", label: "Oaxaca" },
  { value: "lisbon", label: "Lisbon", disabled: true },
  { value: "tbilisi", label: "Tbilisi" },
] as const;

export function OverlaysSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourDone, setTourDone] = useState(false);
  const [city, setCity] = useState("");
  const [lastAction, setLastAction] = useState("none");

  return (
    <Stack gap="space-6">
      <Inline className="pg-row" wrap>
        <Tooltip content="Opens the confirmation dialog">
          <IconButton label="Tooltip anchor" variant="outline">
            <Info />
          </IconButton>
        </Tooltip>

        <Popover>
          <PopoverTrigger data-testid="popover-trigger">Filters</PopoverTrigger>
          <PopoverContent>
            <PopoverTitle>Filters</PopoverTitle>
            <Text>Only starred projects are shown.</Text>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger data-testid="menu-trigger">Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setLastAction("duplicate")}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => setLastAction("archive")}>
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setLastAction("delete-requested");
                    setDeleteOpen(true);
                  }}
                >
                  Delete project…
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </Inline>

      <Text data-testid="last-action">Last action: {lastAction}</Text>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger data-testid="dialog-trigger">Open dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite teammates</DialogTitle>
            <DialogDescription>
              Overlays opened from here stack on top of the dialog: the first Escape closes only the
              child overlay.
            </DialogDescription>
          </DialogHeader>

          <Stack gap="space-4">
            <Select onValueChange={setCity} value={city}>
              <SelectTrigger aria-label="City" data-testid="dialog-select-trigger">
                <SelectValue>Pick a city…</SelectValue>
                <SelectIcon />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((option) => (
                  <SelectItem
                    disabled={"disabled" in option}
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger data-testid="dialog-popover-trigger">Advanced</PopoverTrigger>
              <PopoverContent>
                <PopoverTitle>Advanced</PopoverTitle>
                <Text>Nested popover inside a dialog.</Text>
                {/* The popover has REAL interactive children: a dialog trap that
                    skipped portaled panels would drop these from the Tab cycle
                    (RRU-116). The link + button also give the manual a11y pass
                    a keyboard-reachable surface to audit. */}
                <a data-testid="dialog-popover-link" href="/advanced">
                  Read the docs
                </a>
                <Button data-testid="dialog-popover-apply" type="button" variant="outline">
                  Apply
                </Button>
              </PopoverContent>
            </Popover>

            <Text data-testid="dialog-selection">
              {city === "" ? "No city selected yet." : `Selected city: ${city}`}
            </Text>
          </Stack>

          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)} type="button" variant="outline">
              Close
            </Button>
            <Button data-testid="dialog-close" onClick={() => setDialogOpen(false)}>
              Send invites
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* The confirmation of the menu action lives HERE, as a sibling of the
          menu, not inside the menu content: selecting the item closes and
          unmounts the whole menu tree, so a dialog rendered in there would be
          unmounted in the same commit that opened it. This is the real-world
          version of "an action that opens something else", and the suite checks
          that the dialog takes focus over the layer the menu just released. */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeleteOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              data-testid="dialog-confirm"
              onClick={() => setDeleteOpen(false)}
              variant="destructive"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* The discriminating surface for RRU-117. The "start" button unmounts
          ITSELF on click and opens this dialog in the same commit, so the
          dialog has NO trigger left to restore to: the capture of the open
          event can only be a node that is already gone. The delete-dialog above
          does NOT reproduce the bug — React runs passive-effect destroys before
          creates, so the menu's restoration runs before this dialog's capture
          and hands it a live node to remember. This one-shot surface is the one
          the E2E and the manual a11y review use to prove the fallback rule
          (focus returns to the first focusable of the document, never the
          no-op `<body>.focus()`). */}
      {!tourDone ? (
        <Button
          data-testid="tour-trigger"
          onClick={() => {
            setTourDone(true);
            setTourOpen(true);
          }}
          type="button"
          variant="outline"
        >
          Start keyboard tour
        </Button>
      ) : null}

      {tourOpen ? (
        <Dialog open={tourOpen} onOpenChange={setTourOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Keyboard tour</DialogTitle>
              <DialogDescription>
                This dialog has no trigger: the button that opened it unmounted itself on click, so
                closing it cannot focus a trigger that no longer exists. The fallback (RRU-117) puts
                the focus on the first focusable of the page instead — in this app, the theme
                switcher in the header.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                data-testid="tour-close"
                onClick={() => setTourOpen(false)}
                type="button"
                variant="outline"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      <Inline className="pg-row" wrap>
        <IconButton label="Delete project" variant="destructive">
          <Trash2 />
        </IconButton>
        <IconButton label="Project settings" variant="outline">
          <Settings />
        </IconButton>
      </Inline>
    </Stack>
  );
}
