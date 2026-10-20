---
"@citrusworx/webengine": patch
---

`startSeltzerFromKernel` forwards an optional `host` to Seltzer `listen`. Omit it and the server binds `127.0.0.1`. Pass `host: "0.0.0.0"` when the process must accept connections from other machines.
