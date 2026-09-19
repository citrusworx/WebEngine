---
"@citrusworx/juiceui": minor
---

Add a DOM-first popover runtime that auto-enhances valid `[popover-root]` markup. Openers pair through `aria-controls` to the root id. Closed vs open uses the native `hidden` attribute. The panel is a non-modal dialog (`role="dialog"`, no `aria-modal`): focus moves in on open, Tab cycles inside the panel, and focus restores to the opener on close. Escape dismisses unless an open `[modal-overlay]` or `[drawer-overlay]` exists. Click outside the root and opener dismisses; `[popover-close]` dismisses. Opening one managed popover closes the others. Placement is dependency-free (`top` / `bottom` / `left` / `right`, default `bottom`) with a single opposite-side flip when the preferred side overflows.
