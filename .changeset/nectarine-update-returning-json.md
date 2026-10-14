---
"@citrusworx/nectarine": minor
---

Compile `returning` on UPDATE and DELETE (Postgres `RETURNING`; MySQL rejects it at query time, same as `ON CONFLICT`). Schema `json` / `jsonb` columns can cast bare binds, and the Postgres adapter JSON-encodes objects and arrays on `$N::json` / `$N::jsonb` so JavaScript arrays are not sent as Postgres arrays.
