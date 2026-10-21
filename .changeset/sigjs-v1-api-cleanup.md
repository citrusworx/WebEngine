---
"@citrusworx/sigjs": minor
---

Remove `captureCleanupScope` from the package root and stop re-exporting `jsxDEV` from `.` (`jsxDEV` stays on `@citrusworx/sigjs/jsx-dev-runtime`). Replace public `any` on `jsx`, `jsxDEV`, `Fragment`, `Child`, and `JSX.IntrinsicElements`. Export the `JSX` namespace from the JSX runtime entries so `jsxImportSource` does not depend on a root import. `Signal.set` remains always-notify, including when the value is unchanged, and that behavior is frozen for v1.
