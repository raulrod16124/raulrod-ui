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
  Heading,
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
  useToast,
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

      <NarrowContentProbe />
    </Stack>
  );
}

/**
 * The 500-character case, as three real surfaces (RRU-137, EPIC-12).
 *
 * A floating panel is `position: fixed` with no intrinsic width, so before this
 * card its size was shrink-to-fit against the viewport: a paragraph long enough
 * opened WIDER THAN THE SCREEN, and nothing in the DOM reported it — the panel
 * stayed present, visible and correctly labelled. Only the geometry was wrong.
 *
 * Each control keeps a real accessible name, because the E2E asserts on the name
 * a user would read and never on an index or an `rr-*` class (`e2e/helpers.ts`
 * rules 1 and 3). The `data-testid`s are on the triggers, which DO have an
 * accessible identity of their own.
 *
 * The three are deliberately different cases, because they take different paths
 * through the fix: the Popover is unbounded prose (it needs the block scrollport),
 * the menu is a bounded set of labels plus enough items to exceed a 320px screen
 * (its items are focusable, so the scrollport is reachable by keyboard), and the
 * Tooltip is the one that must NOT have a scrollport — it wraps instead, because
 * a scrollport it cannot be focused into is content no keyboard user can reach
 * (see the deviation documented in Tooltip.css).
 *
 * RRU-138 adds a fourth: the `Select`, whose panel is bounded like the first two
 * AND has to be the width of its own trigger, which is the one claim in this
 * section that CSS alone cannot express.
 */
function NarrowContentProbe() {
  return (
    <Stack gap="space-4">
      <Heading as="h3">Narrow-viewport overlays</Heading>
      <Text>
        Three floating panels carrying content that does not fit a 320px screen. Each one is bounded
        by the viewport: the prose scrolls, the menu scrolls through its own focus order, and the
        tooltip wraps.
      </Text>

      <Inline className="pg-row" wrap>
        <Popover>
          <PopoverTrigger data-testid="narrow-popover-trigger">Filter details</PopoverTrigger>
          <PopoverContent>
            <PopoverTitle>Filter details</PopoverTitle>
            <Text>{LONG_OVERLAY_CONTENT}</Text>
            <Button data-testid="narrow-popover-action" type="button" variant="outline">
              Apply filters
            </Button>
          </PopoverContent>
        </Popover>
      </Inline>

      <Inline className="pg-row" wrap>
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="narrow-menu-trigger">Bulk actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Move to archive</DropdownMenuItem>
            <DropdownMenuItem>Export as CSV with every visible column included</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem>Transfer ownership</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Delete permanently</DropdownMenuItem>
            <DropdownMenuItem>Delete and empty the recycle bin afterwards</DropdownMenuItem>
            <DropdownMenuItem>Cancel and keep every change</DropdownMenuItem>
            <DropdownMenuItem>Print the selected rows</DropdownMenuItem>
            <DropdownMenuItem>Share a read-only link</DropdownMenuItem>
            <DropdownMenuItem>Watch this item</DropdownMenuItem>
            <DropdownMenuItem>Report as incorrect</DropdownMenuItem>
            <DropdownMenuItem>Pin to the top of the list</DropdownMenuItem>
            <DropdownMenuItem>Add to a collection</DropdownMenuItem>
            <DropdownMenuItem>Restore the previous version</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Inline>

      <Inline className="pg-row" wrap>
        <Tooltip content={LONG_OVERLAY_CONTENT}>
          <Button data-testid="narrow-tooltip-trigger" type="button" variant="outline">
            What does this do?
          </Button>
        </Tooltip>
      </Inline>

      <Stack gap="space-2">
        <Heading as="h4">
          The listbox is the fourth case, and the only one with a bound of its own
        </Heading>
        <Text>
          A <code>Select</code> panel is <code>position: fixed</code> with no width of its own, so
          it was shrink-to-fit: one long option opened a panel wider than both the screen and the
          field it belongs to. It also needs its twelve options, because a listbox is the one
          bounded panel whose scrollport IS reachable — every option takes the roving tabindex, so{" "}
          <kbd>ArrowDown</kbd> walks it.
        </Text>
        <Select defaultValue="team">
          <SelectTrigger data-testid="narrow-select-trigger">
            <SelectValue>Pick a plan…</SelectValue>
            <SelectIcon />
          </SelectTrigger>
          <SelectContent>
            {NARROW_PLANS.map((plan) => (
              <SelectItem key={plan.value} value={plan.value}>
                {plan.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Stack>

      <NarrowViewportPanels />
    </Stack>
  );
}

/**
 * The two surfaces that measure the VIEWPORT instead of their container
 * (RRU-139, EPIC-12): a modal `Dialog` and the `Toast` stack.
 *
 * These two are the documented exception of ADR-008 — `@media` is reserved for
 * them precisely because their coordinate space IS the viewport — so they are
 * also the two where a width defect is not a "responsive" question at all but a
 * plain bug that only shows up when the window is narrow. Each fixture below
 * reproduces one:
 *
 *  - the Dialog carries **three footer buttons with long labels**, which is the
 *    case a `flex` footer without `wrap` cannot lay out at 320px;
 *  - the same Dialog carries **more content than the viewport is tall**, which
 *    is the case where a height cap and the overlay's own padding have to agree
 *    — before the card they did not, and part of the panel sat off the screen;
 *  - the Toast carries a **long title and description**, because the stack is a
 *    fixed column whose height nothing bounded before this section, and a single
 *    long toast was measured rendering 422px tall in a 360px viewport — with no
 *    scrollport, so the tail of the description was simply unreachable.
 *
 * It raises **two** long toasts, and the second one is load-bearing for a claim
 * the first cannot carry. The stack orders newest-first, so the toast raised
 * FIRST ends up at the BOTTOM of the column — far enough down that its dismiss
 * button opens outside the viewport entirely. That control is what
 * `viewport-panels.spec.ts` tabs to: "the stack scrolls" would otherwise have
 * nothing below the fold to reveal, and the reachability claim the DoD asks for
 * has to be made against a focusable element that starts off-screen.
 *
 * The content length is load-bearing and is not taste: `viewport-panels.spec.ts`
 * re-asserts it with `blockOverflowPx > 0`, the fixture-validity guard RRU-136
 * introduced, so a viewport tall enough for the content to fit naturally cannot
 * make every "it scrolls" assertion pass in a vacuum.
 */
function NarrowViewportPanels() {
  const { toast } = useToast();
  return (
    <Stack gap="space-4">
      <Heading as="h3">Dialog and Toast at a narrow viewport</Heading>
      <Text>
        The two components whose geometry is the viewport itself. The dialog below carries three
        long-labelled actions and more text than a 360px-tall screen is tall, which are the two
        cases that put content outside the screen before this section existed.
      </Text>

      <Inline className="pg-row" wrap>
        <Dialog>
          <DialogTrigger data-testid="narrow-dialog-trigger">Open the narrow dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review the billing change</DialogTitle>
              <DialogDescription>
                This dialog is deliberately taller than a narrow viewport and carries three actions,
                so the height cap and the footer have to cope with a phone.
              </DialogDescription>
            </DialogHeader>

            <Stack gap="space-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Text key={index}>{LONG_OVERLAY_CONTENT}</Text>
              ))}
            </Stack>

            <DialogFooter>
              <Button data-testid="narrow-dialog-cancel" type="button" variant="outline">
                Keep the current plan
              </Button>
              <Button data-testid="narrow-dialog-schedule" type="button" variant="secondary">
                Schedule for later
              </Button>
              <Button data-testid="narrow-dialog-confirm" type="button" variant="destructive">
                Change the plan now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          data-testid="narrow-toast-trigger"
          type="button"
          variant="outline"
          onClick={() => {
            // Raised first, so it renders LAST: the stack is newest-first, and
            // `viewport-panels.spec.ts` needs this card's dismiss button to open
            // below the stack's block bound to show the scrollport being reached by
            // focus. `duration: null` keeps both on screen long enough to measure.
            toast({
              title: "Card details still need a review",
              description: LONG_OVERLAY_CONTENT,
              tone: "warning",
              duration: null,
            });
            toast({
              title: "Your billing details were updated",
              description: LONG_OVERLAY_CONTENT,
              tone: "info",
              duration: null,
            });
          }}
        >
          Raise a long toast
        </Button>
      </Inline>
    </Stack>
  );
}

/**
 * The twelve options the narrow `Select` opens (RRU-138, EPIC-12).
 *
 * Two of them are load-bearing and neither is obvious from the markup:
 *
 *  - `annual-prorated` is a label of exactly **40 characters** with no unbreakable
 *    run, which is what the card's DoD names: it is the option whose shrink-to-fit
 *    width pushed the panel off a 320px screen before the listbox was bounded.
 *  - the count is **twelve**, because the block claim needs a list that genuinely
 *    exceeds the clamp. Eleven short options render at ~370px and the clamp at a
 *    360px-tall viewport is `100dvh - 32px` = 328px, so a shorter list would pass
 *    every "it scrolls" assertion in `overlays-narrow.spec.ts` in a vacuum. The
 *    spec re-asserts this with `blockOverflowPx > 0` rather than trusting the
 *    count.
 *
 * `defaultValue="team"` is load-bearing in the same way: with no selection the
 * listbox opens with focus on the LAST option (the WAI-ARIA "focus the selected
 * option, or the last one" rule), so an ArrowDown walk would start at the end and
 * prove nothing. Focusing the second option gives the spec an origin it can walk
 * *down* out of the scrollport.
 */
const NARROW_PLANS = [
  { value: "starter", label: "Starter" },
  { value: "team", label: "Team" },
  { value: "business", label: "Business" },
  { value: "annual-prorated", label: "Annual billing with prorated seat change" },
  { value: "enterprise", label: "Enterprise" },
  { value: "starter-annual", label: "Starter, billed annually" },
  { value: "team-annual", label: "Team, billed annually" },
  { value: "business-annual", label: "Business, billed annually" },
  { value: "enterprise-annual", label: "Enterprise, billed annually" },
  { value: "payg", label: "Pay as you go" },
  { value: "unlimited", label: "Annual plan with unlimited seats" },
  { value: "custom", label: "Custom" },
] as const;

/**
 * One paragraph of ~500 characters: the width the card's DoD names, and a length
 * no consumer writes on purpose. At 320px it is what makes every one of the three
 * panels exceed the screen if the bound is missing.
 */
const LONG_OVERLAY_CONTENT =
  "Billing runs on the first of every month and charges the workspace owner for each active seat. " +
  "Changing the plan mid-cycle takes effect at the next renewal rather than immediately, so the " +
  "current invoice is never repriced: the proration appears as a credit on the following one, and " +
  "seats added after the invoice was issued are billed pro rata for the days remaining in the period.";
