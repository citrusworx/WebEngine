---
"@citrusworx/juiceui": minor
---

Add a DOM-first disclosure runtime that auto-enhances `[disclosure]` (`createDisclosure` / `initDisclosure` / `startDisclosureRuntime` / `stopDisclosureRuntime`): one trigger toggles one panel with `aria-expanded` and native `hidden`, orphans outside the root are ignored, and Escape collapses only the focused or last-opened disclosure.
