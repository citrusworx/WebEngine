---
"@citrusworx/juiceui": minor
---

Add themeable `overlay="frost"` and `overlay="tint"` utilities. Core CSS consumes `--juice-overlay-<frost|tint>-wash|layer` with light fallbacks and paints via `background-image` so `surfaceTone` fill and `bgColor` stay. Combined with `surfaceTone`, overlay adjusts wash only. Aquaflux, KiwiPress, Citrusmint, Tide, and generated themes bind the roles from existing tokens. Tide stays a dark frost/tint, not a white wash. `variant` is not in this cut.
