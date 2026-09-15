---
"@citrusworx/nectarine": minor
---

Compile INSERT `onConflict` phonics to Postgres `ON CONFLICT … DO NOTHING` / `DO UPDATE SET col = EXCLUDED.col` (MySQL rejects this subset at query time).
