---
"@citrusworx/seltzer": minor
---

**Breaking:** `listen(port)` binds `127.0.0.1` instead of every interface. Pass `host: "0.0.0.0"` or `host: "::"` to accept connections from other machines. An empty `host` throws.

Header, request, and keep-alive timeouts are on by default (20s, 30s, and 5s). Override them with `headersTimeout`, `requestTimeout`, and `keepAliveTimeout`; `0` disables that timer. `keepAliveTimeout` must be less than `headersTimeout` when the headers timer is on, and `requestTimeout` must be `0` or at least `headersTimeout`.

`listen` still returns the Node `http.Server`. `server.close()` stops accepting new connections. `onListening` receives the bound port, including when the requested port is `0`. The leftover hello-world `src/core/server/server.ts` is removed.
