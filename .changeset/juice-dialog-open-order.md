---
"@citrusworx/juiceui": patch
---

Escape and outside click for modal, drawer, and sheet follow open order. The last of those dialogs to open handles Escape. A backdrop press closes only the top dialog; other outside presses do not. A non-modal sheet on top suspends the focus trap until it closes. Replacing an open dialog closes layers above it.
