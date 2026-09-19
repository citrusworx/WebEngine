---
"@citrusworx/juiceui": patch
---

Document and honor the icon authoring contract: default `[icon]` size is `1rem`, `iconSize` (`xxs`…`xxl`) is first-class, and `width` / `height` remain the custom-size escape hatch. Remove the mobile `[icon]` size remaps so author sizing is not clobbered at small viewports.
