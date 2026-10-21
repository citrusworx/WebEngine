---
"@citrusworx/seltzer": minor
---

`app.handler()` returns a Node request listener so a host can mount Seltzer on its own `http.Server` or `https.Server`. `listen` stays `http.createServer` with the loopback and timeout defaults. `init` accepts `bodyLimit`, `cors`, `logger`, `debug`, and `locals`; a field passed to `listen` replaces the init value for that server (`cors` is replaced as a whole object).
