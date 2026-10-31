---
"@citrusworx/juiceui": patch
---

Add sheet chrome (`[sheet-overlay]` > `[sheet]`, with `[sheet-handle]`, `[sheet-header]`, `[sheet-body]`, `[sheet-footer]`, and `[sheet-close]`). Detents are `peek`, `half`, and `full` (`sheet-detents`, default half full; current detent is `[detent]`). `sheet-overlay="none"` is non-modal. `sheet-overlay="static"` keeps the backdrop. Open and closed follow drawer (`hidden`, `data-motion-state`) with a bottom slide and a backdrop fade. Layout roles live on `:root`. Color falls back through optional `--juice-sheet-*` roles to `--juice-drawer-*`. No runtime. Shipped themes are not edited.
