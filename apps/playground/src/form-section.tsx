// Form section of the playground (RRU-069).
//
// It is the flow the E2E suite submits, so it is a REAL form with a REAL
// validation round trip: the design system ships no validation (it is not a form
// library — RRU-043/044 deliberately leave `aria-invalid` to the native
// attribute and the presence of the `FormField.Error` slot), which is exactly
// the integration a consumer has to get right.
//
// Two things a form consumer always needs and that the E2E proves:
//   - the error slot appears only when invalid, and the control's
//     `aria-invalid` + `aria-errormessage` point at it automatically;
//   - a successful submit is announced (`role="status"` toast), not silently
//     swallowed.
import type { FormEvent } from "react";

import { useState } from "react";

import {
  Button,
  Checkbox,
  FormField,
  FormFieldControl,
  FormFieldDescription,
  FormFieldError,
  FormFieldLabel,
  Heading,
  Inline,
  Input,
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Switch,
  Text,
  Textarea,
  useToast,
} from "@raulrod/ui";

const PLANS = [
  { value: "hobby", label: "Hobby" },
  { value: "team", label: "Team" },
  { value: "enterprise", label: "Enterprise" },
] as const;

// Deliberately simple and readable: the E2E asserts the MECHANISM (slot
// presence → aria-invalid/aria-errormessage → announced error), not a
// particular validation library.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FormSection() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [beta, setBeta] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    toast({
      tone: "success",
      title: "Workspace created",
      description: `${email} · ${plan === "" ? "no plan" : plan}`,
    });
  }

  return (
    <form data-testid="signup-form" noValidate onSubmit={handleSubmit}>
      <Stack gap="space-6">
        <FormField className="pg-field" controlId="playground-email">
          <FormFieldLabel>Email</FormFieldLabel>
          <FormFieldControl>
            {(field) => (
              <Input
                {...field}
                name="email"
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
            )}
          </FormFieldControl>
          <FormFieldDescription>We never share your email.</FormFieldDescription>
          {error !== null && <FormFieldError data-testid="email-error">{error}</FormFieldError>}
        </FormField>

        <FormField className="pg-field" controlId="playground-plan">
          <FormFieldLabel>Plan</FormFieldLabel>
          <FormFieldControl>
            {(field) => (
              <Select onValueChange={setPlan} value={plan}>
                <SelectTrigger {...field} data-testid="plan-trigger">
                  <SelectValue>Choose a plan…</SelectValue>
                  <SelectIcon />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormFieldControl>
        </FormField>

        <FormField className="pg-field" controlId="playground-notes">
          <FormFieldLabel>Notes</FormFieldLabel>
          <FormFieldControl>
            {(field) => <Textarea {...field} name="notes" rows={3} />}
          </FormFieldControl>
        </FormField>

        <Inline className="pg-row" wrap>
          <Checkbox data-testid="terms" id="playground-terms" name="terms" />
          <label className="pg-label" htmlFor="playground-terms">
            I accept the terms
          </label>
          <FormField controlId="playground-beta">
            <FormFieldControl>
              {(field) => (
                <Switch
                  {...field}
                  checked={beta}
                  name="beta"
                  onChange={(event) => setBeta(event.currentTarget.checked)}
                >
                  Beta channel
                </Switch>
              )}
            </FormFieldControl>
          </FormField>
        </Inline>

        <Inline className="pg-row">
          <Button data-testid="submit" type="submit">
            Create workspace
          </Button>
          <Button onClick={() => setEmail("")} type="button" variant="ghost">
            Clear email
          </Button>
        </Inline>

        <Heading as="h3">Last payload</Heading>
        <Text data-testid="form-state">
          {`email=${email || "-"} plan=${plan || "-"} beta=${beta ? "on" : "off"}`}
        </Text>
      </Stack>
    </form>
  );
}
