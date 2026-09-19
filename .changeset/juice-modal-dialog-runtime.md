---
"@citrusworx/juiceui": minor
---

Add a DOM-first modal dialog runtime that auto-enhances valid `[modal-overlay]` markup. Openers pair through `aria-controls` to the overlay id. Closed vs open uses the native `hidden` attribute. The runtime fills safe dialog ARIA, traps focus while open, restores focus to the opener, closes on Escape and backdrop click (`modal-overlay="static"` opts out), and keeps one dialog open at a time.
