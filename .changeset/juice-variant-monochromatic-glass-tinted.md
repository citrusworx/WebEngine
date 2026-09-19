---
"@citrusworx/juiceui": minor
---

Add composable `variant="monochromatic"`, `variant="glass"`, and `variant="tinted"` recipes. Core CSS wires existing overlay, blur, borderStrength, and surface shadow roles with light fallbacks — no new required `--juice-variant-*` binds. Combined with `surfaceTone`, each recipe applies only its properties so tone fill stays. Finer `overlay` / `blur` / `borderStrength` / `shadowTone` attrs win their property. Tide stays dark via existing overlay and surface tokens.
