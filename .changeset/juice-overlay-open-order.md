---
"@citrusworx/juiceui": patch
---

Escape and outside click for popover, menu, and combobox follow open order. The last layer opened handles Escape. An outside pointer closes only that top layer. Closing a dialog closes popovers, menus, and listboxes that were opened above it. An open tooltip still closes on Escape without closing the layer under it, and a toast does not take Escape while a layer is open.
