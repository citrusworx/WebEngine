# Nectarine Query DSL (phonics)

Nectarine assembles SQL **phonics-style**: YAML tokens are the letters; the
compiler is the only place those letters become a statement. App code never
embeds SQL. Adapters never build SQL.

Hard rule and Blackwater inventory: [No hard-coded SQL](./no-hardcoded-sql.md).

## Layers

```
App code          →  named query only (resource + method + name + bind params)
Compiler          →  SELECT | INSERT | UPDATE | DELETE from YAML tokens
Adapter           →  query(sql, params)   // execute only
```

- **App code** calls `CCompiler.buildQuery(...)` (or `parser.genSQL` +
  `parser.buildSQL`) and passes the string plus bind values to an adapter.
  It does not concatenate SQL, interpolate request data, or hand-write
  `SELECT` / `INSERT` / `UPDATE` / `DELETE`.
- **Compiler** validates identifiers, operators, and values. Runtime values
  are `$1`-style placeholders (`$1::jsonb` is an allowlisted Postgres bind
  cast). YAML-authored constants (`true`, `42`, `'published'`) are allowed
  only as tagged `{ const: ... }` or via the closed `where` fragment
  grammar — never via string interpolation of user input.
- **Adapters** (`pg` / `ms` / `mg`) execute `(sql, params)` produced by the
  compiler. They do not assemble statements.

## One phonics model, two YAML surfaces

The **canonical** clause object is what `compileQuery` assembles:

| Method | YAML keys | Example SQL |
|--------|-----------|-------------|
| `get` (`read` is an alias) | `select`, `from`, optional `where`, optional `orderBy` | `SELECT id FROM users WHERE id = $1` |
| `create` | `insert.into`, `insert.columns`, `insert.values`, optional `returning` | `INSERT INTO users (...) VALUES ($1, $2, $3, NOW())` |
| `update` | `table`, `set`, `values`, `where` | `UPDATE users SET name = $1 WHERE id = $2` |
| `delete` | `from`, `where` | `DELETE FROM users WHERE id = $1` |

Blackwater resources (`apps/blackwatersound/back/src/schemas/**/*Queries.yml`)
use a flatter `type: SELECT` surface. The compiler **normalizes** that
surface onto the canonical model — it does not execute the YAML `where`
string as SQL.

```yaml
# Canonical — models/user/db/pg/user.yml
user:
  get:
    UserById:
      select: ['id']
      from: users
      where:
        column: id
        operator: eq
        value: $1

# Blackwater — productQueries.yml (normalized, then compiled)
product:
  read:                    # alias of get
    allProducts:
      type: SELECT
      table: products
      fields: '*'
      where: isActive = true
      orderBy: catalog, category, name
```

Prefer the structured `where` object for new YAML. Keep the Blackwater
surface so existing query files compile without a mechanical rewrite.

## Resource layout

Each resource currently uses three YAML files:

- `*Schema.yml`: data model and table structure (future DDL owner)
- `*Queries.yml` or `user.yml`: query DSL
- `*API.yml`: API endpoint definitions

Top-level pattern:

```yaml
resourceName:
  get:      # or read
    QueryName: ...
  create:
    QueryName: ...
  update:
    QueryName: ...
  delete:
    QueryName: ...
```

## `get` / `read` queries

```yaml
user:
  get:
    AllUsers:
      select: ['*']
      from: users

    UserByEmail:
      select: ['email']
      from: users
      where:
        column: email
        operator: eq
        value: $1
```

Blackwater equivalent:

```yaml
product:
  read:
    productById:
      type: SELECT
      table: products
      fields: '*'
      where: id = $1
```

## `where` — structured (preferred)

```yaml
where:
  column: id
  operator: eq          # eq | neq | gt | gte | lt | lte | in | not_in | is_null | is_not_null
  value: $1
```

AND / OR trees:

```yaml
where:
  and:
    - { column: catalog, operator: eq, value: $1 }
    - { column: isActive, operator: eq, value: { const: true } }
```

`value` rules:

| Form | Compiles to | Allowed? |
|------|-------------|----------|
| `$1`, `$2`, … | bind placeholder | yes — **required** for runtime / user data |
| `{ fn: now }` or `NOW()` | `NOW()` | yes |
| `{ const: true }` / `{ const: 'published' }` | `TRUE` / `'published'` | yes — YAML-authored constants only |
| raw `true` / `1` / `"hello"` | — | **no** (forces parameterization) |

## `where` — Blackwater fragment grammar (closed)

`where: isActive = true` is parsed, not spliced. Allowed tokens:

- identifiers (`isActive`, `created_at`)
- operators `=` `!=` `<>` `<` `>` `<=` `>=`
- `$N` placeholders
- `TRUE` / `FALSE` / `NULL`, decimal numbers, single-quoted strings (`''` escape)
- `AND` / `OR`, parentheses
- `IN` / `NOT IN` (`status IN ('requested', 'confirmed')`)
- `IS NULL` / `IS NOT NULL`

Rejected (compile error): comments, semicolons, function calls, subqueries,
double-quoted identifiers, unquoted strings, anything else. This is
intentional: raw SQL in YAML is a footgun.

String literals and booleans in a fragment are **compile-time constants**
from the YAML file. Request data must use `$N` and adapter params.

## `orderBy`

Blackwater: `orderBy: catalog, category, name` or `created_at DESC`.

Canonical: `orderBy: [{ column: created_at, direction: DESC }]`.

Identifiers only; optional `ASC` / `DESC`. Same closed grammar — no raw SQL.

## `create` / INSERT

Canonical:

```yaml
user:
  create:
    NewUser:
      insert:
        into: users
        columns: ['email', 'password', 'name', 'created_at']
        values: [$1, $2, $3, { fn: now }]
```

Blackwater (values default to `$1 … $N` in field order):

```yaml
waitlist:
  create:
    joinWaitlist:
      type: INSERT
      table: waitlist
      fields: [id, name, email, source_app, interest]
      returning: [id, email, created_at]
```

→ `INSERT INTO waitlist (...) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, created_at`

## `update`

Canonical `set` + `values` + structured `where`.

Blackwater `type: UPDATE` with `fields` and no `values` assigns `$1 … $N`
to SET columns, then **remaps** WHERE placeholders so `where: id = $1`
becomes `$N+1`. Bind order is SET fields first, then WHERE params.

```yaml
product:
  update:
    updateProduct:
      type: UPDATE
      table: products
      fields: [name, sub, updated_at]
      where: id = $1
```

→ `UPDATE products SET name = $1, sub = $2, updated_at = $3 WHERE id = $4`

## `delete`

```yaml
user:
  delete:
    User:
      from: users
      where:
        column: id
        operator: eq
        value: $1
```

Blackwater uses `table` instead of `from`; the normalizer maps it.

## Operator tokens

| DSL token | SQL |
|-----------|-----|
| `eq` | `=` |
| `neq` | `!=` |
| `gt` | `>` |
| `gte` | `>=` |
| `lt` | `<` |
| `lte` | `<=` |
| `in` | `IN (...)` |
| `not_in` | `NOT IN (...)` |
| `is_null` | `IS NULL` |
| `is_not_null` | `IS NOT NULL` |

## JSONB

**JSONB is supported; we are not dropping it.** Schema fields may be
`json` / `jsonb` (Blackwater already uses `tags: json`). Query values may
bind JSON with `$1::jsonb` (allowlist: `jsonb`, `json`, `text`).

```yaml
values: [$1, $2::jsonb]
```

```sql
INSERT INTO products (id, payload) VALUES ($1, $2::jsonb)
```

JSONB operators (`@>`, `?`, `->>`, …) are a later phonics item — not
required for this phase. Blackwater’s live `products(id, payload JSONB)`
table is a **document-store pattern**, not a reason to remove JSONB.
Phase 3 can keep JSONB columns, use relational columns, or hybridize.

## Not yet compiled

- blog `queries:` maps (`models/blog/post/sql.yml`)
- joins, `GROUP BY`, `LIMIT` / pagination
- aggregates (`COUNT`), `EXISTS`, `ON CONFLICT`, column aliases
- JSONB operators (`@>`, `?`, `->>`) — columns and `$N::jsonb` binds work today
- DDL / `CREATE TABLE` (schema YAML — phase 3)

## Usage

```ts
import { CCompiler } from "@citrusworx/nectarine/compiler";
import { createPgAdapterFromConfig } from "@citrusworx/nectarine/adapters/pg";

const compiler = new CCompiler();
const parsed = compiler.parse_config("./schemas/product/productQueries.yml");
const reads = compiler.clean_parse(parsed, "product", "read");
const sql = compiler.buildQuery(reads, "productById");
// SELECT * FROM products WHERE id = $1

await pg.query(sql, [id]);
```
