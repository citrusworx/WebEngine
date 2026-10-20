---
"@citrusworx/seltzer": minor
---

**Breaking:** a thrown handler or hook error is **500** `{ error: "Internal Server Error" }` with no `message` and no stack. The error is logged (`listen({ logger })`, default `console.error`). Stack traces are logged only when `listen({ debug: true })`.

**Breaking:** string bodies send `Content-Type: text/plain; charset=utf-8` unless a content-type header is already set. `Buffer` / `Uint8Array` bodies send `application/octet-stream` unless a content-type header is already set. Objects, arrays, numbers, booleans, and `null` stay JSON.

**Breaking:** status **204** and **304**, and **HEAD** requests, never send a body.

**Breaking:** writing `ctx.res` (`writeHead`, `end`, `write`, `setHeader`, assignment) throws. Calling `ctx.json` or `ctx.send` throws. `replace("send")` throws. Return `ResponseData`.

An invalid handler or hook return is still **500**, and the log line names the route and the returned value.
