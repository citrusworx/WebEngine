---
"@citrusworx/juiceui": patch
---

Add pressable chrome (`[pressable]`, `[pressable="scale"]`) and the `--juice-pressable-*` roles. Hover is a 1px inset ring and pressed is a 2px inset ring, both `currentColor`, so the fill behind the text does not change. `[pressed]` is styled here and set by the runtime in slice B. The scale variant is opt-in. No pseudo-element and no position. No runtime. Shipped themes do not bind the roles.
