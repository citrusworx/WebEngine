---
"@citrusworx/juiceui": minor
---

Add themeable `shadowTone="cool"` and `shadowTone="warm"` utilities. Core CSS consumes `--juice-shadow-tone-<cool|warm>-color|shadow` with light fallbacks. Combined with `surfaceTone`, shadowTone paints shadow cast only so tone background, border, and blur stay. With existing `shadow` / `depth`, it sets `--shadow-color` and leaves geometry to `depth`. Aquaflux, KiwiPress, Citrusmint, Tide, and generated themes bind the roles from existing tokens. `overlay` and `variant` are not in this cut.
