---
"@citrusworx/nectarine": patch
---

MySQL-escape JSONB `@>` string constants so backslashes survive CAST(... AS JSON).
