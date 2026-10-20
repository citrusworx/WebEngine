---
"@citrusworx/seltzer": minor
---

**Breaking:** a request whose path matches a registered route but whose method does not is **405** with an `Allow` header, not 404. Unknown paths stay 404.

**Breaking:** request bodies default to 1 MB (`bodyLimit`, `1048576`). A larger body is **413** and is not read to completion. `bodyLimit: 0` is unlimited. Non-JSON content types are still the raw UTF-8 string (not 415).

**Breaking:** `OPTIONS` is answered with 204 before the pipeline only when `listen` is passed `cors`. Without `cors`, `OPTIONS` is an ordinary method.

Malformed percent-encoding in a matched path parameter (for example `/items/%E0%A4`) is **400**, not 500. `cors.credentials: true` with `origin: "*"` throws when `listen` is called. `Vary: Origin` is set when the allow-origin value is a specific origin, and omitted when it is `*`. `maxAge` sets `Access-Control-Max-Age`.
