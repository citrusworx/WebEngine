---
"@citrusworx/seltzer": minor
---

Add a builtin `idempotency` pipeline stage for POST and PATCH requests that send `Idempotency-Key`. A matching replay returns the stored response with `Idempotent-Replayed: true`. The same key in flight is 409. A different body is 422. Status 200–499 is cached. 5xx and thrown errors release the key. Disable with `init({ idempotency: false })`, or pass `{ ttlMs, store }` to customize. `IdempotencyStore` is the swap point. The client still does not retry.
