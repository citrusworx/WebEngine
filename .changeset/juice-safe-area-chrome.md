---
"@citrusworx/juiceui": patch
---

Add safe-area chrome (`[safe-area]`, `[safe-area="top"]`, `[safe-area="bottom"]`, `[safe-area="x"]`, `[safe-area="y"]`) and the `--juice-safe-area-pad` role on `:root`. Each edge is `max(var(--juice-safe-area-pad), env(safe-area-inset-*))`, so a device with no inset still keeps the base pad. No runtime. Shipped themes do not bind the role. `viewport-fit=cover` is required on the viewport meta tag for the insets to be non-zero.
