---
"@citrusworx/sigjs": minor
---

`bind` in `@citrusworx/sigjs/juice` now follows icon-button, avatar, and table. Icon-button `state.set` toggles a `[toggle]` host and snaps the signal back when the host refuses the write. Avatar and table are read-only. Table has no Juice API to set sort. On a Juice package that does not export those three start functions, binding one of them throws, and the other runtimes still bind.
