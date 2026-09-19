---
"@citrusworx/juiceui": minor
---

Add a DOM-first toast / snackbar runtime that auto-enhances valid `[toast-region]` markup. Authors place the region and toast nodes; closed vs open uses the native `hidden` attribute on each `[toast]`. `[toast-close]` dismisses that toast. Auto-dismiss defaults to 5000ms, overridden per toast with `toast-duration` (`"0"` / `"Infinity"` / negative is sticky), and pauses while the toast is hovered or focused. Toast is not a dialog: no focus trap, no `aria-modal`, and stacking is allowed. Escape dismisses the most recent visible toast only when no open `[modal-overlay]` or `[drawer-overlay]` exists.
