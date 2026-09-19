---
"@citrusworx/juiceui": minor
---

Make `surfaceTone` themeable. Core CSS consumes `--juice-surface-<tone>-bg|border|shadow|blur` with light fallbacks, and ships `soft`, `strong`, and `muted`. Aquaflux, KiwiPress, Citrusmint, Tide, and generated themes bind those roles from existing surface tokens. `borderStrength` and standalone `blur` are not in this cut.
