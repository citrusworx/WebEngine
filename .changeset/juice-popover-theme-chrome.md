---
"@citrusworx/juiceui": minor
---

Add themeable popover chrome roles (`--juice-popover-*`). Core CSS paints an anchored floating panel (`[popover-root]` / `[popover-panel]` / optional `[popover-header]` / `[popover-body]` / `[popover-close]`) with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated themes bind those roles from existing tokens. Names avoid the native HTML `popover` attribute (`popover=""` would activate the platform Popover API). Placement is `bottom` by default, or `top` / `left` / `right`. Popover is not a modal dialog, not a drawer, and not a toast stack. Popover runtime is not in this cut.
