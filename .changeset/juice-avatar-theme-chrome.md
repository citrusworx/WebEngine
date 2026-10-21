---
"@citrusworx/juiceui": minor
---

Add avatar chrome (`[avatar]`, `[avatar="square"]`, `[scale]`, `[status="online|away|busy|offline"]`, `[avatar-group]`, `[avatar-more]`) and core `--juice-avatar-*` roles. Defaults come from the muted surface, inherited ink, and banner status hues. KiwiPress and Aquaflux need no overrides. Tide lifts `--juice-avatar-status-away` so the warning dot stays visible on the dark muted surface. The status color transition uses `--juice-motion-*` and stops under `prefers-reduced-motion`.
