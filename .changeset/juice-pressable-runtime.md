---
"@citrusworx/juiceui": patch
---

Add a DOM-first pressable runtime that sets transient `[pressed]` for the duration of a press (`createPressable` / `initPressable` / `startPressableRuntime` / `stopPressableRuntime`). `[pressable-longpress]` opts into `juice:longpress`. A disabled pressable no longer clears an icon-button's latched pressed ring.
