---
"@citrusworx/juiceui": patch
---

Footer mode on `nav[fixed]` sets `bottom: auto`, so a fixed top bar does not stretch down to the keyboard inset. Other footer hosts stay `position: sticky` with `bottom` set to the inset. `nav[sticky]` is unchanged: a sticky box is sized in flow, and that `bottom` does not stretch it.
