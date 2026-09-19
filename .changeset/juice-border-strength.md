---
"@citrusworx/juiceui": minor
---

Add composable `borderStrength="soft"` and `borderStrength="bold"` utilities. Core CSS consumes `--juice-border-strength-<soft|bold>-width|color` with light fallbacks. Combined with `surfaceTone`, strength refines border width only so tone background, shadow, and blur stay. Aquaflux, KiwiPress, Citrusmint, Tide, and generated themes bind the roles from existing border tokens. Standalone `blur` is not in this cut.
