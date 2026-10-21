---
"@citrusworx/seltzer": minor
---

`app.handler()` returns a Node request listener so a host can mount Seltzer on its own `http.Server` or `https.Server`. `listen` stays `http.createServer` with the loopback and timeout defaults. `init` accepts `bodyLimit`, `cors`, `logger`, `debug`, and `locals`; a field passed to `listen` replaces the init value for that server (`cors` is replaced as a whole object).

`app.adapter(config)` stores `{ adapter, options }` and returns the app (`options` is copied onto `ctx.options`). `app.handler(config)` is a deprecated alias of `adapter(config)`: it forwards, and the first call in a process emits one `process.emitWarning` with code `SELTZER_DEP_HANDLER_CONFIG`. That alias will be removed in the next minor after 0.10.0.
