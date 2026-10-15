# MiaMakes gap audit

MiaMakes (`apps/miamakes`) is Nectarine’s non-Blackwater golden host: Seltzer HTTP, `@citrusworx/nectarine` on Postgres, Sig.js and Juice on the front. This audit uses that host as the test bench for what Nectarine still lacks or makes awkward. No library code changed with this document.

Audited tree: `origin/master` at `21a5773f` (merged PRs **#241**, **#244**, **#245**, plus the unpublished compiler commit `6fac3e46` from **#243**). Published npm is **`@citrusworx/nectarine@0.5.0`** (2026-10-04). #243 is in git and is not in that tarball.

**v1-blocker** in the table means: MiaMakes cannot keep growing on the public API without embedding SQL, or a YAML key compiles to the wrong statement. It does not mean “blocks the Christmas kitchen.”

Hard rules held while judging: no hard-coded SQL in app code, Seltzer (not Express) for HTTP, JSONB stays first-class.

## What MiaMakes already does with Nectarine

| Piece | Where | Public API |
| --- | --- | --- |
| Root config | `apps/miamakes/back/nectarine.config.yaml` | `loadNectarineConfig` from `@citrusworx/nectarine/config` |
| Schema, queries, API | `apps/miamakes/back/src/schemas/recipe/` | `CCompiler`, `schemaJsonColumns`, `compileSchemas` / `compileSchemasPlan` from `@citrusworx/nectarine/compiler` |
| Boot migrate | `apps/miamakes/back/src/db/named-ddl.ts`, `src/migrate.ts` | `applyMigrations`, `loadMigrationDocuments` from `@citrusworx/nectarine/migrate` |
| Postgres | `apps/miamakes/back/src/db/postgres.ts` | `createPgAdapter` from `@citrusworx/nectarine/adapters/pg` |
| HTTP | `apps/miamakes/back/src/server.ts`, `src/routes/recipes.ts` | Seltzer `Seltzer.init()` plus WebEngine `createNectarineRoutes` |

Recipe CRUD is named YAML. `ingredients` and `steps` are `jsonb`. After #243 the host passes arrays; schema columns stamp `::jsonb`, and the Postgres adapter encodes those binds. `updateRecipe` is one `UPDATE … RETURNING *`. Runtime code under `apps/miamakes/back/src` does not embed SQL. `queries.test.ts` asserts the compiled text.

`category` filter plus `created_at DESC` already compiles (`listByCategory`). Column `UNIQUE` on `slug`, btree indexes, `DEFAULT NOW()` on timestamps, and `ADD COLUMN IF NOT EXISTS` for `category` / `before_you_begin` already compile. Evidence: `apps/miamakes/back/src/queries.test.ts`.

## Golden-host check

MiaMakes imports Nectarine only through package exports:

- `@citrusworx/nectarine/config`
- `@citrusworx/nectarine/compiler`
- `@citrusworx/nectarine/migrate`
- `@citrusworx/nectarine/adapters/pg`

No file under `apps/miamakes` imports `libraries/nectarine/src` or a `dist/` path. Blackwater’s backend is the same shape (`apps/blackwatersound/back/src`). The golden-host rule holds in git.

The current MiaMakes query file does **not** run correctly on npm 0.5.0. Details are in [Fresh install](#fresh-install-npm-050).

## Glue both hosts re-implement

These are copied host patterns, not domain rules. Slug formatting, recipe validation, and the in-memory seed list stay in MiaMakes.

| Glue | MiaMakes | Blackwater | Belongs in |
| --- | --- | --- | --- |
| Production / partial-env boot policy | `apps/miamakes/back/src/context.ts` (`resolveBootCredentials`, `processRequiresDatabase`) | `apps/blackwatersound/back/src/context.ts` (same function, same env flags) | Nectarine or WebEngine, next to `credentialStatus()` / `fallback.seed` |
| Pool singleton, `runCompiledQuery`, disconnect swallow | `apps/miamakes/back/src/db/postgres.ts` | `apps/blackwatersound/back/src/db/postgres.ts` | A small host helper beside `createPgAdapter` |
| `COUNT(*)` string-to-number (`int8`) | `readCount` in MiaMakes `postgres.ts` | `readCount` in Blackwater `postgres.ts` | Adapter or a documented result helper |
| “Count rows, then loop `ON CONFLICT DO NOTHING` inserts” | `seedRecipesIfEmpty` | `seedProductsIfEmpty` | A seed document runner |
| Named-query compile map | `apps/miamakes/back/src/db/named-queries.ts` calls `CCompiler.buildQuery` and passes `schemaJsonColumns` | `apps/blackwatersound/back/src/db/named-queries.ts` calls WebEngine `compileResourceQuery` | WebEngine `compileResourceQuery` (`engines/webengine/src/kernel/modules/nectarine-routes.ts`) calls `buildQuery` with no options, so it cannot stamp schema JSON casts. MiaMakes forked the helper. Blackwater still writes `{ value: $N, cast: jsonb }` in YAML, so the fork is invisible there. |
| Explicit `updated_at = NOW()` on every update | `recipeQueries.yml` `updateRecipe` value `{ fn: now }` | `productQueries.yml` `updatePayload` | Schema, if we want a touch token. `{ fn: now }` already exists; both hosts have to remember the column. |

Host `execute` in `apps/miamakes/back/src/routes/recipes.ts` is still required, and it should stay: mint `rec_` ids, slugify, keep the memory fallback when `PG_*` is unset, validate lists. That is application policy. The awkward part is the parallel `writeParams` / `updateParams` arrays in `postgres.ts`, which must stay in lockstep with the 15-column YAML lists in `recipeQueries.yml`.

`recipeFromRow` (`apps/miamakes/back/src/domain/recipe.ts`) coerces `Record<string, unknown>`. Named query results and bind lists are untyped. `*API.yml` body specs are checked by Seltzer only for `.required` (`libraries/seltzer/src/pipeline/stages.ts`).

`uniqueSlug` issues up to 50 `bySlug` reads, then inserts. The `UNIQUE` constraint is the real guard. A concurrent insert surfaces as a raw `pg` error (SQLSTATE 23505). Nothing in `libraries/nectarine/src` maps constraint failures. The route’s `catch` handles `RecipeInputError` only, so the unique race becomes a 500.

## Feature probe

Probed with the workspace compiler (`libraries/nectarine/dist`, post-#243) and, where noted, with npm 0.5.0 against PostgreSQL 16.

### Already expressible without host SQL

| Need | Evidence |
| --- | --- |
| Category filter + fixed order | `listByCategory` compiles to `SELECT * FROM recipes WHERE category = $1 ORDER BY created_at DESC` (`queries.test.ts`). `orderBy` is compile-time. A request-chosen sort column would be a different named query, which is the safe shape. |
| JSONB containment (“recipes containing an ingredient”) | `where: ingredients @> $1::jsonb` and `operator: contains` both compile to `ingredients @> $1::jsonb`. Blackwater already ships this as `payloadsContaining` in `productQueries.yml`. Bind a JSON array (`["peach"]`). |
| JSONB key / text path | `?` and `->>` are in the fragment grammar (`libraries/nectarine/src/compiler/fragments.ts`). |
| Joins avoided for the first cookbook / author reads | `where: cookbook_id = $1` and `where: author_id = $1` need no join. Inline `FOREIGN KEY REFERENCES` compiles (`cookbook_id TEXT REFERENCES cookbooks(id)`). The `relationships:` block on `recipeSchema.yml` does not: `ddl.ts` never reads it. |
| Unique slug, composite unique | `slug TEXT NOT NULL UNIQUE`. `indexes.*.unique: true` emits `CREATE UNIQUE INDEX` on a column list. |
| Btree indexes in schema YAML | `recipes_created_at_idx`, `recipes_category_idx`. |
| Timestamps default | `timestamp` emits `TIMESTAMPTZ`. `DEFAULT NOW()` and `CURRENT_TIMESTAMP` work. Inserts that omit `created_at` / `updated_at` pick up the default. |
| Add a column on a live table | Postgres plan emits `ALTER TABLE … ADD COLUMN IF NOT EXISTS`. MiaMakes asserts this for `category` and `before_you_begin`. npm 0.5.0 did the same on a live `recipes` table in the fresh-install probe (`category` appeared; `applyMigrations` still returned `{ applied: [], skipped: [] }` because additive DDL is not a ledger version). |
| Seed idempotency | `onConflict: { target: id, do: nothing }` compiles on 0.5.0 and in git. |
| Soft-delete predicate | `where: deleted_at IS NULL AND category = $1` compiles. A nullable `timestamp` column compiles. |
| Users / sessions tables | Ordinary schema YAML. Blackwater’s `sessions` table is a studio booking (`apps/blackwatersound/back/src/schemas/session/sessionSchema.yml`), not a login session. MiaMakes login is a layout stub (`apps/miamakes/front/src/pages/Login.tsx`). Password hashes fit in `text`. Nectarine should not grow cookie, password, or session middleware. |
| App-level `AND` / `OR` | Structured `or` / `and` trees compile. |

### Not expressible, or expressible only as the wrong SQL

| Attempt | Workspace compiler result |
| --- | --- |
| `where: name ILIKE $1` and `name LIKE $1` | `QueryCompileError: Invalid where fragment: expected operator after name` |
| `operator: ilike` | `Unknown operator: ilike`. `OP_TOKENS` in `libraries/nectarine/src/compiler/sql.ts` is `eq`, `gt`, `lt`, `lte`, `gte`, `neq`, `in`, `not_in`, `is_null`, `is_not_null`, `contains`, `has_key`. |
| `to_tsvector(...) @@ plainto_tsquery($1)` | Fragment rejected (function call). `uuid`, `tsvector`, and `bytea` are unknown field types. |
| `limit` / `offset` on a `type: SELECT` | **Compiles and drops the keys.** `SELECT * FROM recipes ORDER BY created_at DESC` with no `LIMIT`. `normalizeSelect` never copies `limit` (`libraries/nectarine/src/compiler/normalize.ts`). |
| `join:` | **Dropped.** `SELECT * FROM recipes`. |
| `groupBy:` | **Dropped.** `SELECT category FROM recipes` with no `GROUP BY`. |
| Index `using: gin` and `where: deleted_at IS NULL` | **Dropped.** `parseIndexEntry` keeps `columns` and `unique` only (`libraries/nectarine/src/compiler/ddl.ts`). A declared GIN index becomes a btree. A partial unique index becomes a full unique index, including on a column the table does not have. |
| `DEFAULT NOW() ON UPDATE NOW()` | `Unknown field constraint: ON UPDATE NOW()`. |
| Multi-statement transaction | `PgSql.withTransaction` pins a pooled client and does not issue `BEGIN` / `COMMIT` / `ROLLBACK` (`libraries/nectarine/src/adapters/pg/pgz.ts`). The migrator sends those strings itself (`libraries/nectarine/src/migrate/runner.ts`, `runInTransaction`). A host that copies that pattern embeds SQL. There is no public `transaction()` that owns the bracketing. One named query is one statement. |
| Versioned `addColumn` | Migration ops are `renameColumn`, `dropColumn`, `changeType` only (`libraries/nectarine/src/compiler/migration.ts`). New columns go through additive schema DDL, which already works. |

`limit`, `join`, `groupBy`, and index `using` / `where` are the dangerous set: the compiler accepts them and emits SQL that does not do what the YAML says.

## Fresh install (npm 0.5.0)

Outside the monorepo: `npm install @citrusworx/nectarine@0.5.0 pg@8`, then `loadNectarineConfig` + `CCompiler` + `applyMigrations` + `createPgAdapter` against PostgreSQL 16. A minimal `nectarine.config.yaml`, `recipeSchema.yml`, and `recipeQueries.yml` did create `recipes`, insert a JSONB ingredient list, and select it back.

What worked on 0.5.0:

- Public exports match the git package map: `.`, `./config`, `./api`, `./compiler`, `./migrate`, `./adapters/pg`, `./adapters/ms`, `./adapters/mg`, `./util`. Adapters are not on the package root (`createPgAdapter` is absent from `@citrusworx/nectarine`). That split is documented and correct.
- `pg` is an optional peer. Importing `@citrusworx/nectarine/adapters/pg` without installing `pg` fails with `MODULE_NOT_FOUND: Cannot find module 'pg'`.
- Explicit `{ value: $3, cast: jsonb }` plus `JSON.stringify` on the array round-trips. `RETURNING *` on **INSERT** returns the row. `ingredients` comes back as a parsed array.
- `ON CONFLICT` is in the 0.5.0 compiler.
- Additive `ADD COLUMN IF NOT EXISTS` alters a live table.
- `js-yaml` is a real dependency. Types ship as `dist/*.d.ts`. There is no `bin`.

Friction:

| Friction | What happened |
| --- | --- |
| #243 is unpublished | 0.5.0 `compileUpdate` returns ``UPDATE … WHERE …`` and never appends `RETURNING`. `normalizeUpdate` drops a `returning` key with no error. `schemaJsonColumns` is not exported. `dist/adapters/pg/json-binds.js` does not exist. Passing a JavaScript array for `$3::jsonb` fails with `invalid input syntax for type json`. MiaMakes now passes arrays and expects `UPDATE … RETURNING *` (`apps/miamakes/back/src/queries.test.ts`). That file does not run on the published package. |
| README inside the tarball is the 0.4.0 text | It says npm 0.4.0 is current and that `onConflict` is **not** in the tarball. 0.5.0 contains `onConflict`. `docs/nectarine/nectarine-getting-started.md` and `docs/nectarine/README.md` still describe 0.4.0. |
| Getting-started query shape does not compile | The doc’s `queries: / getAllUsers: / type: SELECT` fails on 0.5.0: `SQL configuration not found for type: queries, method: read`. The compiler wants `resource.read.QueryName` or the canonical `resource.get.QueryName`. |
| No CLI | Migrate and “run this named query” are a short script. That is acceptable. `nectarine serve` stays deferred. |
| Docs are not in the tarball | `files` is `["dist"]`. Guides are GitHub links. Fine if those guides match the version. They do not. |
| No generated client | Hosts write the compile-and-bind script by hand. Expected at this size. The missing piece is a current minimal example that uses the real triad (`*Schema.yml`, `*Queries.yml`, `*API.yml`) and the Postgres adapter. |

## Prioritized gaps

| Gap | Evidence | Impact | Proposed fix | Size | v1-blocker |
| --- | --- | --- | --- | --- | --- |
| Unknown query and index keys compile to different SQL | Workspace probe: `limit`, `join`, and `groupBy` are stripped in `normalizeSelect` (`libraries/nectarine/src/compiler/normalize.ts`). Index `using` and `where` are stripped in `parseIndexEntry` (`libraries/nectarine/src/compiler/ddl.ts`). npm 0.5.0 likewise drops UPDATE `returning`. | A category page with `limit: 20` returns every row. A GIN index on `ingredients` is created as a btree. A partial unique slug (soft delete) becomes a full unique index. The YAML looks done. | Reject unknown keys on query objects, index objects, and (already done for `onConflict`) nested clauses. Ship this before `limit` or `using: gin`, so a typo cannot succeed. | S | yes |
| No host transaction that owns `BEGIN` / `COMMIT` / `ROLLBACK` | `PgSql.withTransaction` only pins a client (`libraries/nectarine/src/adapters/pg/pgz.ts`). `BEGIN` / `COMMIT` live in `runInTransaction` (`libraries/nectarine/src/migrate/runner.ts`) and are not exported. Cookbook create-plus-recipes is on the MiaMakes roadmap (`apps/miamakes/README.md`). | The hard rule forbids the host from pasting `BEGIN`. A cookbook and its recipes cannot be one atomic unit. A crash between statements leaves a half-written cookbook. The same hole makes `seedRecipesIfEmpty` non-atomic. | Public `transaction(work)` on the Postgres adapter: pin a client, `BEGIN`, run compiler SQL, `COMMIT`, `ROLLBACK` on throw. Migrator should call that instead of sending the words itself. MySQL stays documented as DDL-implicit-commit. | S | yes |
| npm 0.5.0 cannot host current MiaMakes, and the shared compile helper ignores schema JSON columns | #243 (`6fac3e46`) adds UPDATE/DELETE `RETURNING`, `schemaJsonColumns`, and `encodePgJsonBinds`. Absent from the 0.5.0 tarball (fresh install). MiaMakes `named-queries.ts` passes `jsonColumns` because `compileResourceQuery` (`engines/webengine/src/kernel/modules/nectarine-routes.ts`) calls `buildQuery` with no options. Published README still describes 0.4.0. | The golden host depends on unpublished compiler behavior. The second consumer had to fork the one helper Blackwater uses. Anyone following the npm README will not find `schemaJsonColumns`. | Publish the #243 compiler when a release is intended. Do not publish from this audit. Teach `compileResourceQuery` (and the default compiled execute) to take `schemaJsonColumns` from the resource schema. Correct the tarball README and `docs/nectarine/nectarine-status.md` in that release. | S | yes |
| `LIMIT` / `OFFSET` are not phonics | Same silent drop as the unknown-key row. Status doc already says paging is not compiled (`docs/nectarine/nectarine-status.md`). `listRecipes` and `listByCategory` have no page clause. | Category shelves and search results will load the whole table. Mia’s kitchen is small today; the API shape has nowhere to put `page`. | After unknown keys fail closed, add `limit` and `offset` as a placeholder or a non-negative integer constant. No user-supplied identifier. | S | no |
| Search: no `ILIKE` / `LIKE`, no full text | Fragment grammar and `OP_TOKENS` (`libraries/nectarine/src/compiler/sql.ts`, `fragments.ts`). Probe errors above. Roadmap item “Polish — search” (`apps/miamakes/README.md`). | Name and description search cannot be a named query. Hosts would otherwise write SQL. | Add `ilike` (and `like`) to the closed grammar, right-hand side a `$N` only. Keep full text (`tsvector`, `@@`, ranking) off this slice. Ingredient search is already `@>`. | S | no |
| JSONB containment has no GIN phonics | `using: gin` dropped. `@>` itself works (probe and Blackwater `payloadsContaining`). | Correct queries, sequential scans. Fine for a family recipe box. Wrong index if someone copies a GIN example into schema YAML before unknown keys fail. | After the fail-closed index parser: `using: gin` on `json` / `jsonb` columns only. Partial indexes (`where:`) are the soft-delete follow-on, not this slice. | M | no |
| Unique and foreign-key failures are raw driver errors | `slug TEXT NOT NULL UNIQUE` compiles. `uniqueSlug` in `apps/miamakes/back/src/routes/recipes.ts` pre-reads `bySlug` in a loop. No `23505` mapping under `libraries/nectarine/src`. | Accounts (unique email) and slugs race into a 500. The pre-check is an extra round trip and still loses the race. | Adapter error type for unique violation and FK violation, carrying table/constraint when the driver provides them. Host maps that to 409. Do not hide other errors. | S | no |
| Positional binds and untyped rows | `writeParams` / `updateParams` in `apps/miamakes/back/src/db/postgres.ts` mirror YAML column order. `runNamed<Record<string, unknown>>`. `recipeFromRow` re-parses every field. `createRecipe` and `seedRecipe` repeat the same 15 columns. `COUNT(*)` is a string on the wire (both hosts’ `readCount`). | A column inserted in the middle of the YAML list silently shifts every value. TypeScript does not notice. | Named bind objects keyed by column (`{ ingredients: recipe.ingredients }`) assembled in order by the compiler metadata. Leave Zod out. Schema-derived row types are a later, larger slice. | M | no |
| `updated_at` does not move unless the query says so | `ON UPDATE` rejected. Both hosts set `{ fn: now }` on the update query. | Easy to ship an update that leaves `updated_at` stale. Inserts are fine via `DEFAULT NOW()`. | Optional field token `touch: true` (or a documented convention the update compiler fills when the column exists and the query omits it). Keep `{ fn: now }` working. | S | no |
| Seed and boot glue are copied | `seedRecipesIfEmpty` / `seedProductsIfEmpty`. `resolveBootCredentials` duplicated in both `context.ts` files. Adapter singleton duplicated in both `postgres.ts` files. | The next resource (users, cookbooks) will copy the same loop. A crash mid-seed leaves `count > 0` and skips the rest. | Seed YAML (rows or a document list) applied inside `transaction()`. One boot helper for “partial env throws, empty env plus `fallback.seed` returns null”. | M | no |
| `relationships:` reads as foreign keys | `recipeSchema.yml` says the block is documentation. `ddl.ts` has no `relationships` handling. Inline `FOREIGN KEY REFERENCES` is the real DDL. Blackwater schemas repeat the comment. | Cookbook week will add `relationships:` and get no FK, or will discover the inline form only at review. | Compiler error if `relationships:` is present, pointing at `FOREIGN KEY REFERENCES`. Or compile a documented subset. Prefer the error until the subset is real. | S | no |
| Joins and `GROUP BY` | Dropped today (see unknown keys). One statement is a stated limitation (`docs/nectarine/nectarine-status.md`). | “Recipes in this cookbook” and “this author’s recipes” do not need a join. “Cookbook with its recipes” or “count per category” does. The host can issue two named queries and stitch in TypeScript, which is not hard-coded SQL. | Do not add open joins in the next slice. After unknown keys fail, a later slice can add a closed `join` (one parent, equality on identifiers) and `groupBy` with `count`. | L | no |
| Soft delete is a column plus a predicate, not a mode | `deleted_at IS NULL` compiles. Partial unique index does not (it silently becomes a full unique index). | A deleted recipe still occupies `slug`. Every named query must remember the predicate. | Column stays host-owned. Partial unique indexes are the fix, after index keys fail closed. No global soft-delete filter. | M | no |
| Optional filters are a new named query per combination | `listRecipes` and `listByCategory` are two queries. There is no “omit this predicate when the param is absent”. | Search plus category plus page becomes a matrix of YAML names, or one query with dummy `OR $2 = ''` predicates the grammar can already express but the host must invent. | Not a v1 slice. Revisit after `ilike` and `limit` exist. A closed `optional` predicate is enough if the matrix shows up in the kitchen. | M | no |

## Deferred on purpose

Checked against MiaMakes. None of these are the next slice.

| Idea | Why it stays deferred |
| --- | --- |
| GraphQL | No consumer. HTTP is Seltzer routes from `recipeAPI.yml`. |
| Caching / Redis | Recipe reads are small. No cache bug in the host. |
| Zod inside Nectarine | MiaMakes validation is domain rules (slug length, list caps) in `parseRecipeWrite`. Seltzer already enforces `.required`. A Nectarine Zod layer would not replace that. |
| MySQL `ON DUPLICATE KEY` | MiaMakes is Postgres. The MySQL adapter correctly rejects `ON CONFLICT`. |
| Down migrations | Forward-only is the design. MiaMakes has an empty `src/db/migrations/` and uses additive columns. |
| `nectarine serve` | `src/server.ts` is Seltzer. A server inside Nectarine would blur the split. |
| Auth middleware, password hashing, session cookies | Users and sessions tables are ordinary schema. The login page is a stub. Auth stays in the host. |

## Top 5 next slices

1. **Fail closed on unknown query and index keys.** One compiler change plus tests. Stops `limit`, `join`, `groupBy`, `using`, and index `where` from compiling into a different statement. Do this before any new clause.
2. **`transaction()` on the Postgres adapter.** The helper issues `BEGIN` / `COMMIT` / `ROLLBACK` on the pinned client. Cookbook-plus-recipes and a safer seed can stay named queries. Hosts do not paste transaction SQL.
3. **Publish #243 and point the shared compile helper at schema JSON columns.** UPDATE/DELETE `RETURNING`, `schemaJsonColumns`, and JSON bind encoding are what MiaMakes already uses. `compileResourceQuery` should pass `jsonColumns` so MiaMakes can delete its private compiler wrapper. Fix the 0.5.0 README in that release. Do not publish as part of the audit.
4. **`limit` and `offset`.** Category shelves and, later, search pages. Integers and placeholders only. Depends on slice 1 so a misspelled `limt` fails the build.
5. **`ilike` in the closed `where` grammar.** Recipe search on `name` and `description` (roadmap polish). Ingredient containment stays JSONB `@>`. Full text, GIN, and joins wait until a kitchen page actually needs ranking or a single joined row.

## Covered, not gaps

Recorded so the next pass does not re-open them.

- Golden host uses only public exports. No `libraries/nectarine/src` imports.
- JSONB columns, `@>` / `?` / `->>`, schema-driven `::jsonb` casts, and array encoding (git, post-#243).
- INSERT `ON CONFLICT`, INSERT `RETURNING` (also on npm 0.5.0).
- UPDATE and DELETE `RETURNING` in git. MiaMakes update uses it. Delete still uses `rowCount`, which is enough.
- `CREATE TABLE`, column `UNIQUE`, composite unique indexes, btree indexes, `DEFAULT NOW()`, inline foreign keys, `ADD COLUMN IF NOT EXISTS` on a live table (git and npm 0.5.0).
- Category equality filter and `orderBy`.
- Seltzer as the only HTTP server. Express is not on the MiaMakes backend.
- Empty versioned migration directory. Protected `ingredients` / `steps` in `named-ddl.ts`.
