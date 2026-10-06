"@raulrod/ui": patch
---

fix(ui): stop form controls from overflowing narrow rows (RRU-142)

- Input: declare `min-width: 0` on `.rr-input` so the replaced element can shrink below the UA's intrinsic `size=20` floor when composed as a flex/grid item.
- Textarea: declare `min-width: 0` on `.rr-textarea` and on `.rr-textarea-autosize`, covering both the bare control and the autosize grid wrapper.
- Radio: make `.rr-radio-group--horizontal` wrap with `flex-wrap: wrap`, and let `.rr-radio-label` shrink with `min-width: 0` and break long words with `overflow-wrap: anywhere`.
- FormField: declare `min-width: 0` on `.rr-form-field` and `.rr-form-field-control`, without adding `width: 100%` to avoid changing composition inside `Inline` rows. Width remains a consumer decision.
- Add `Responsive` stories for Input, Textarea, Radio and FormField (which previously had no stories file). Document the current named-slot exports in `FormField.mdx` and note the missing dot-notation API as a future API-facing decision.
- Add `*.responsive-contract.test.ts` source-level gates for all four components, plus a `form-responsive-section.tsx` playground fixture and a geometric E2E spec at 320px and 1280px. The E2E uses fixed 200px frames and asserts that inputs shrink below their intrinsic floor, textareas stay inside the frame, horizontal radio groups wrap, and FormField shrinks as a flex item. No public API change.
