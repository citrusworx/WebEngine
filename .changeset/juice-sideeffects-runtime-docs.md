---
"@citrusworx/juiceui": patch
---

Mark `dist/index.js` as a side-effect entry so auto-start navigation, accordion, and tabs runtimes survive bundler tree-shaking. Depend on a published `@citrusworx/sigjs` caret range so npm consumers do not receive `workspace:^`. Document those runtimes as Emerging in Beta.
