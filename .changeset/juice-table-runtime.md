---
"@citrusworx/juiceui": minor
---

Add a DOM-first table sort runtime that auto-enhances `th[sortable]` inside `[table]` (`createTable` / `initTable` / `startTableRuntime` / `stopTableRuntime`). Activating a header cycles ascending, descending, and none, sets `aria-sort`, and reorders each `tbody`. A canceled `juice:sort` updates that state without reordering.
