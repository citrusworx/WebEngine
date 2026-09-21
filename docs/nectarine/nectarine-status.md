# Nectarine Project Status

What an outside reader can rely on. Capability claims in this file were checked against `libraries/nectarine/src`, its tests, and the published npm tarball. If another doc disagrees, this page wins.

## Current published version: 0.4.0

| | |
|---|---|
| npm `@citrusworx/nectarine` | **0.4.0** (published 2026-09-15; also 0.0.2, 0.1.0, 0.2.0, 0.3.0) |
| Workspace `libraries/nectarine/package.json` | **0.4.0** |
| Maturity | **Hostable alpha** |

Hostable alpha means a WebEngine or Blackwater host can load YAML, compile named DML/DDL, migrate, and query Postgres without embedding SQL. It does not mean a finished ORM, joins, or a stable 1.0 API.

The workspace manifest was restored to **0.4.0** because that version was published without committing the bump. `libraries/nectarine/CHANGELOG.md` in git still ends at **0.3.0** for the same reason. Do not publish 0.4.0 again.

**Git may be ahead of the npm 0.4.0 tarball.** INSERT `onConflict` (Postgres `ON CONFLICT`; MySQL rejects it) is in this checkout and is not in the 0.4.0 pack. Pending Changesets are left in place so the next intentional `yarn version-packages` — not this docs pass — becomes **0.5.0**:

- minor: `nectarine-on-conflict.md` (the unreleased surface)
- minor: `nectarine-compiler-ops.md` (COUNT / EXISTS / JSONB `@>` / `?` / `->>`, already inside the 0.4.0 tarball, never consumed)
- patches: `nectarine-on-conflict-dist.md`, `nectarine-mysql-json-escape.md`, `nectarine-ops-review-fixes.md`, `nectarine-align-npm-0-4-0.md`

The 0.5.0 changelog will repeat the COUNT/EXISTS/JSONB note because that changeset was not consumed at publish. That is bookkeeping, not a second feature. Do not run full-monorepo `yarn version-packages` to “clean this up”; master has unrelated pending changesets.

`0.x` minors can break import paths. Adapters are not exported from the package root (that split landed in 0.2.0).

---

## What's working

### Config

- `loadNectarineConfig` reads `nectarine.config.yaml` and resource triads (`*Schema.yml`, `*Queries.yml`, `*API.yml`).
- YAML names environment **keys**. `resolveCredentials()` reads values from the environment and returns null when a vendor’s keys are incomplete. `requireCredentials()` throws and lists the missing keys. Secrets are not written into the YAML.

### Phonics compiler

Adapters do not build SQL. The compiler does.

- Canonical CRUD YAML (`select` / `insert` / `update` / `delete`) and Blackwater `type: SELECT` (normalized onto the same model). `read` and `get` resolve to the same method map.
- Filtering and `orderBy`. Placeholders are `$1`, `$2`, … Mixed-case identifiers are quoted.
- `COUNT(*)` (`{ fn: count }` / `count: true`) and `EXISTS` (`exists: true`). These are in npm **0.4.0**.
- JSONB columns, `$N::jsonb` binds, and JSONB `@>` / `?` / `->>`. These are in npm **0.4.0**. JSONB is not being removed.
- DDL from schema YAML: `CREATE TABLE`, column `PRIMARY KEY` / `UNIQUE` / `NOT NULL` / `DEFAULT` / `REFERENCES`, and `CREATE INDEX` **only for indexes declared in the schema**. Postgres `ADD COLUMN IF NOT EXISTS` for new fields. There is no automatic `CREATE INDEX` for foreign keys. A schema `relationships:` block is not DDL.
- Field types the DDL compiler accepts include int/integer, smallint, bigint, string/text/varchar/char, boolean, date/time/timestamp, json/jsonb, serial, sized decimal/numeric, and `enum(...)` (Postgres `CHECK`, MySQL `ENUM`).

**Not compiled:** `LIMIT` / offset, joins, `GROUP BY`, JSONB `||` / `jsonb_set`, blog `queries:` maps (`models/blog/**/sql.yml`), arbitrary SQL casts. A `limit` key in YAML is not a paging clause.

### INSERT `onConflict` (git only, not npm 0.4.0)

`onConflict` compiles to Postgres `ON CONFLICT … DO NOTHING` or `DO UPDATE SET col = EXCLUDED.col`. The MySQL adapter throws at `query()` instead of emitting `ON DUPLICATE KEY UPDATE`. This ships in the next publish (**0.5.0**), not in 0.4.0.

### Migrator

`applyMigrations` (npm since **0.3.0**):

1. Ledger table `nectarine_schema_migrations`
2. `CREATE TABLE IF NOT EXISTS` from current `*Schema.yml`
3. Pending versioned migration YAML, in order
4. Additive Postgres `ADD COLUMN IF NOT EXISTS`
5. `CREATE INDEX` after renames

Ops are `renameColumn`, `dropColumn`, and `changeType`. `dropColumn` and `changeType` require `destructive: true` and a matching `confirm` token. There is no down migration.

### Adapters

Optional peers, imported from subpaths. The package root does not load them (`src/index.ts`, `src/package-exports.test.ts`).

| Import | Driver | What it is |
|---|---|---|
| `@citrusworx/nectarine/adapters/pg` | peer `pg` | `pg.Pool`, `connect()` / `disconnect()`, `query(sql, params)` |
| `@citrusworx/nectarine/adapters/ms` | peer `mysql2` | Pool on `connect()`. Rewrites `$N` and JSONB operators at `query()`. Rejects `ON CONFLICT`. |
| `@citrusworx/nectarine/adapters/mg` | peer `mongodb` | `MongoClient` collection helpers. Not the SQL compiler. |

Postgres and MySQL use driver pools. MongoDB uses one `MongoClient` (the driver pools sockets). Nectarine does not add a fourth pool implementation.

### Hosting (Seltzer via WebEngine / Blackwater)

Nectarine does not listen on HTTP and does not export `generateRoutes`.

- `listApiOperations` / `loadApiOperations` flatten `*API.yml` for a host.
- WebEngine `createNectarineRoutes` (and the read/write helpers) map those operations onto Seltzer routes. Blackwater product and waitlist routes use that path; lesson `byId`, health, and KiwiPress content routes stay hand-written.
- Seltzer’s default `validate` stage checks `.required` body fields. Zod is not wired. A host can `replace("validate", …)` later. That replacement is not shipped here.

### Examples

- Showcase: `libraries/nectarine/examples/showcase.ts` (`yarn workspace @citrusworx/nectarine example`) loads the fixture config and compiles canonical user CRUD. Dry-run does not need a database. `NECTARINE_EXAMPLE_LIVE=1` runs `SELECT 1`, not the named queries.
- `libraries/nectarine/models/user` is the canonical compiler fixture. `models/blog` is sample YAML; its `queries:` maps are not compiled.
- There are no CMS, Store, or Banking schema packs, and no schema-extend/override API.

---

## In development

Nothing in this list is an active milestone. Do not read it as “landing in the next few weeks.”

- Query planner, joins, `GROUP BY`, `LIMIT`
- Richer validation on the Seltzer path (Zod or similar) via `replace("validate", …)` — not started in Nectarine
- Runtime schema registry beyond file loading (versioned **migrations** already exist; a registry does not)

---

## Planned

Still ideas. Not scheduled, not started.

- GraphQL generated from schema YAML
- Result caching / Redis
- Pre/post CRUD hooks, audit log, row-level permissions, multi-tenant isolation
- Real-time subscriptions
- OpenAPI export, full-text search, geospatial queries
- CLI scaffolding and down migrations

MySQL and MongoDB stay peer adapters. “Full MySQL parity” (including `ON DUPLICATE KEY`) is not a committed milestone.

---

## Known limitations

1. **One statement, no joins.** Related rows are a separate named query. Foreign keys are `REFERENCES` clauses, not an automatic loader.
2. **No `LIMIT`.** Paging is not compiled.
3. **Forward-only migrations.** Ship a new versioned file to undo a shape. Destructive ops need `destructive` plus `confirm`.
4. **No cross-adapter transactions.**
5. **No caching, auth, or authorization inside Nectarine.** Hosts guard Seltzer handlers themselves.
6. **Blog `queries:` YAML is not the compiler grammar.**
7. **`ON CONFLICT` is Postgres-only** and, until 0.5.0 is published, is source-tree only.
8. **MongoDB does not run the SQL compiler.**

---

## Version history

### 0.2.0 (npm, 2026-09-14)

- `listApiOperations` / `loadApiOperations`
- Blackwater `type: SELECT` normalized onto the phonics compiler
- JSONB bind casts; MySQL `$N` → `?` rewrite
- `CREATE TABLE` / indexes from `*Schema.yml`
- Adapters removed from the package root; `pg` / `mysql2` / `mongodb` are optional peers
- MIT license and public package metadata

### 0.3.0 (npm, 2026-09-15)

- `applyMigrations`, ledger, versioned `renameColumn` / `dropColumn` / `changeType`
- Destructive ops require `destructive` and `confirm`

### 0.4.0 (npm, 2026-09-15) — current published version

The 0.4.0 tarball’s compiler comments include `COUNT`, `EXISTS`, and JSONB `@>` / `?` / `->>`. They do **not** include `ON CONFLICT`. Git never received the version or changelog commit for this publish.

### Unreleased (this git tree → next publish 0.5.0)

- INSERT `onConflict` and the rebuilt `dist` that carries it
- Changeset bookkeeping for the 0.4.0 compiler ops, which will be written into the 0.5.0 changelog when those files are finally consumed

### Older npm tags

0.0.2 and 0.1.0 are historical publish tags. They are not the current product.

---

## Roadmap summary

```
0.2.0   listApiOperations, DDL, JSONB binds, MySQL placeholder rewrite, adapter subpaths
0.3.0   applyMigrations
0.4.0   COUNT / EXISTS / JSONB operators   ← npm latest; workspace manifest matches
0.5.0   ON CONFLICT (pending Changesets; not published)
later   joins, GROUP BY, LIMIT, Zod-backed validate — not scheduled
```

1.0 is not the next tag. The release-gate label for kernel work is **0.4+ hostable alpha**. 1.0 waits on migrations plus a non-Blackwater consumer staying dull, and on the gaps above staying documented instead of implied.

---

## Where to read next

- [Getting started](./nectarine-getting-started.md)
- [Production (Blackwater)](./production.md)
- [Release checklist](./release-checklist.md)
- [Library release gates](../webengine/library-release-gates.md)
- Package README: `libraries/nectarine/README.md`
