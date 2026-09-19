---
"@citrusworx/juiceui": minor
---

Add a DOM-first drawer dialog runtime that auto-enhances valid `[drawer-overlay]` markup. Openers pair through `aria-controls` to the overlay id. Closed vs open uses the native `hidden` attribute. The runtime fills safe dialog ARIA, traps focus while open, restores focus to the opener, closes on Escape and backdrop click (`drawer-overlay="static"` opts out), and keeps one drawer open at a time.
