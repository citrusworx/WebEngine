---
"@citrusworx/juiceui": minor
---

Add Emerging motion tokens (`--juice-motion-duration-instant|fast|base|slow` and `--juice-motion-ease-standard|enter|exit|linear`). Duration tokens collapse to `0.01ms` under `prefers-reduced-motion: reduce`. Component, animation, and gradient timing reads those tokens. Generated `--jx-*` themes pass the same defaults through. Shipped themes are not retimed.
