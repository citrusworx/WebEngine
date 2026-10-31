---
"@citrusworx/juiceui": patch
---

Keep the sheet grab handle's 44px hit target inside the sheet. `[sheet] { overflow: hidden }` was clipping the part of that target above the top edge. The visible bar and the sheet layout are unchanged.
