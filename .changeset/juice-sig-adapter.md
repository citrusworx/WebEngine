---
"@citrusworx/juiceui": minor
---

Add an optional `@citrusworx/juiceui/sig` adapter. `bind(host, runtime?)` returns a Sig signal kept in sync with that runtime's `getState()`, plus `dispose` to drop the listeners. Juice runtimes and the main entry do not import Sig.
