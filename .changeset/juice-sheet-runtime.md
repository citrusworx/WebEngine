---
"@citrusworx/juiceui": patch
---

Add the sheet runtime (`createSheet` / `initSheet` / `startSheetRuntime` / `stopSheetRuntime`). It opens and closes `[sheet-overlay]`, traps focus for modal sheets, snaps `sheet-detents`, and follows a drag on the handle, header, or top of the body. `juice:change` reports `{ open, detent, dragging, modal }`. An open sheet counts as a dialog overlay. While `html[keyboard-open]` is set, the sheet max-height still shrinks by the keyboard inset and the footer no longer pads by that inset a second time. The grab handle keeps its visible bar and gains a 44px hit target.
