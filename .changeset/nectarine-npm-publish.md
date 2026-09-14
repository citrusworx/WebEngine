---
"@citrusworx/nectarine": minor
---

Prepare an honest public 0.2.0: MIT license and package metadata, `js-yaml` as a runtime dependency, optional `pg` / `mysql2` / `mongodb` peers, and stop re-exporting adapters from the package root so installing `@citrusworx/nectarine` does not require a database driver. Import adapters from `@citrusworx/nectarine/adapters/pg`, `/ms`, or `/mg`.
