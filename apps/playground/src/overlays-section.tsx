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
