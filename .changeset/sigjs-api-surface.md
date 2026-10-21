---
"@citrusworx/sigjs": patch
---

Tag `bindList` and `ListItem` as experimental and `captureCleanupScope` as internal. Add explicit return types on the public functions that were missing them. `memo().get()` is now declared as `T`, matching the API page; declaration emit previously inferred `T | undefined` from the uninitialized cache. No export was added, removed, or renamed.
