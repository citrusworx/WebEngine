---
"@citrusworx/juiceui": minor
---

Add themeable toast chrome roles (`--juice-toast-*`). Core CSS paints a non-modal stack (`[toast-region]`) and notification panel (`[toast]` / `[toast-body]` / optional `[toast-title]` / `[toast-close]`) with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated themes bind those roles from existing tokens. Status is `[toast="success|error|info|warning"]` (bare `[toast]` is neutral): accent bar plus optional soft panel tint. Region position is `top-right` by default, or `top-left` / `bottom-right` / `bottom-left`. Toast is not a dialog overlay and not `overlay="frost|tint"`. Toast runtime is not in this cut.
