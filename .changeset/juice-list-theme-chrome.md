---
"@citrusworx/juiceui": minor
---

Add list chrome (`[list]` on `ul` / `ol` / `div`, `[divided]`, `[dense]`, `[list-item]`, `[list-leading]`, `[list-content]`, `[list-secondary]`, `[list-trailing]`, `[selected]` / `aria-current`) and core `--juice-list-*` roles. Defaults mix inherited ink for the divider, secondary line, and hover / selected washes, so shipped themes do not need per-theme binds. Interactive rows use the 2px `currentColor` focus outline. Their background transition uses `--juice-motion-*` and stops under `prefers-reduced-motion`.
