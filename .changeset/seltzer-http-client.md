---
"@citrusworx/seltzer": minor
---

Harden outbound HTTP `client`: throw `HttpError` (status + body snippet) on non-2xx, parse JSON only for JSON successes, and support optional `allowSelfSigned` via undici Agent (KiwiPress pattern).
