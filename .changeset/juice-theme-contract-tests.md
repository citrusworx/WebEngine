---
"@citrusworx/juiceui": patch
---

Lock the Theme Contract required `--juice-*` binds with automated tests. `yarn workspace @citrusworx/juiceui verify` now fails if aquaflux, kiwipress, citrusmint, tide, or the theme generator drops a required accordion, tabs, surface-tone, or border-strength bind.
