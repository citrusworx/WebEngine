# Nectarine Status

Honest snapshot of `@citrusworx/nectarine` **0.1.0** against `libraries/nectarine/src`.

The goal is the same as Sig.js and Juice maturity writing: make it easy to answer what is ready today, what is usable but still evolving, and what is still early.

**Early / Alpha.** Adapters and YAML I/O are real. The compiler that would turn query YAML into SQL is not. The workspace index says “Active alpha” because three drivers exist; this page is stricter about *product completeness*.

Do not treat comparison tables vs Prisma / Supabase / Firebase as a capability claim. Those were marketing. Nectarine is a small library in this repo.

Related: [Roadmap](./nectarine-roadmap.md) for direction. [API](./nectarine-api.md) for the surface as it exists.

## Maturity levels

### `Stable-ish`

The feature is usable today, central to the Nectarine experience, and unlikely to change dramatically in basic concept. Alpha still means the package version can move; the *idea* is settled.

### `Emerging`

The feature is useful and present, but the API, conventions, or implementation details are still likely to evolve.

### `Early`

The feature exists, but it is still exploratory, incomplete, or not yet something Nectarine should strongly promise as a finished public surface.

### `Draft`

The feature is more of a direction than a hardened part of the runtime.

## Matrix

| Area | Maturity | Notes |
|---|---|---|
| `parser.yaml` | Stable-ish | `readFileSync` + `js-yaml`, always `console.log`s. No validation. This is the load primitive. |
| `parser.genSQL` | Stable-ish | Returns `doc[type][method][config]`. Throws if missing. Not SQL. |
| `parser.registerRoute` | Emerging | Filename check returns a string; lookup is top-level `method` then `route`; nested fixtures need `parser.yaml`. |
| Postgres `select` / `from` / `where` **convention** | Emerging | Consistent in `models/user/db/pg/user.yml`. Not validated. Not compiled in package. |
| `PgSql` class | Emerging | Connect / query / disconnect work. No pool. `query` swallows errors. `addTable` unused. |
| `Mysql` + `pool` | Early | Thin `mysql2` `execute`. Pool at import. Throws. `mysql2` not declared on the package. |
| `mapInsert` / `mapGetter` / `getValues` | Early | Join lists only. Private interfaces. MySQL fixture update/delete incomplete. |
| Mongo `Mngz` / `insertOne` / `insertMany` | Early | Shared client at import. Helpers close it. No find/update/delete wrappers. |
| `loadMongoConfig` | Draft | `parser.yaml('sql.yml')`, no return. |
| `parser.buildSQL` | Draft | Empty body. Comments describe the intended pipeline. |
| `CCompiler` | Draft | `parse_config` is yaml load; `clean_parse` nesting disagrees with `genSQL`; `buildQuery` empty. |
| `optokens` | Draft | Type only. No runtime map. |
| Example models | Early | User + blog fixtures. Typos, mixed layouts, `queries:` vs `user.get`. Not a published pack. |
| `pgz.example.ts` builders | Early | Not exported. Paths stale. SELECT/INSERT helpers target MySQL-shaped keys. |
| Seltzer importer | Draft | Documented copy of `method` + `path`. No code in either package. |
| Docs and onboarding | Emerging to Stable-ish | Tutorial, topic pages, patterns, anti-patterns now exist next to the API. |
| Express + Zod generation | Draft | Not in `src`. |
| `nectarine.config.yaml` | Draft | Design comment only. |
| GraphQL / auth / GUI / migrations | Draft | Not started. |
| Tests | Draft | `nectarine.test.ts` has no `test()` blocks. |

## What is shipped

| Area | Symbol / file | Notes |
|---|---|---|
| YAML load | `parser.yaml` | `fs.readFileSync` + `js-yaml`, logs to console |
| Named SQL object | `parser.genSQL` | Returns the YAML node |
| Named API object | `parser.registerRoute` | Path must look like `*api.yml` |
| SQL compile | `parser.buildSQL` | **Empty body** |
| Compiler class | `CCompiler` | `parse_config`, `clean_parse` work as lookups; `buildQuery` empty |
| PostgreSQL | `PgSql` | `addDb`, `connect`, `query`, `disconnect`, `addTable` |
| MySQL | `Mysql`, `closeSql`, `pool` | `mysql2/promise` pool |
| MySQL fragments | `mapInsert`, `mapGetter`, `getValues` | Join lists, not full SQL |
| Mongo | `Mngz`, `connectMngz`, `closeMngz`, `createCollection`, `insertOne`, `insertMany`, `mngzClient` | Shared `MongoClient` |
| Mongo config helper | `loadMongoConfig` | Stub (`parser.yaml('sql.yml')`) |
| Example models | `libraries/nectarine/models/**` | User + blog fixtures |
| Example builder | `adapters/pg/pgz.example.ts` | Not exported; does not match PG DSL keys |

## What is not shipped

| Claim you may have seen | Reality |
|---|---|
| `generateRoutes(schema, queries, api)` | Does not exist |
| `Pgsql()` / `gensql()` function exports | `PgSql` class, `parser.genSQL` |
| Express routes + Zod on every request | Not implemented |
| `nectarine.config.yaml` transport | Design comment only |
| GUI / Sugar / WebEngine Wizard | Planned, no code |
| Pre-built User/Blog/CMS/Store/Banking **packages** | User + blog YAML fixtures only |
| Connection pooling “all adapters” | MySQL has a pool; Postgres creates a `Client` per `connect`; Mongo uses one module-level client |
| Auto indexes, relationships resolver, GraphQL | No |
| MySQL env `MYSQL_*` | Code reads `MS_*` |
| Mongo `MONGO_URI` | Code builds URI from `MG_*` |
| `MS_*` helper functions | Env prefix only; fragments are `mapInsert` / `mapGetter` / `getValues` |
| `models` / `extendModels` package exports | Root `index.ts` is not in the `src` build |
| `buildSQL()` compiles the DSL | Empty function |
| `pgz.example.ts` compiles `db/pg/user.yml` | Wrong node shape |
| WebEngine `modules: ["nectarine"]` loads the library | Config vocabulary, no import |

## Adapter honesty

| Database | Adapter | Query YAML | Guide-complete? |
|---|---|---|---|
| PostgreSQL | `PgSql` — usable | `select` / `from` / `where` DSL in `models/user/db/pg` | Furthest — tutorial builder exists in **docs**, not as an export |
| MySQL | `Mysql()` — usable | Older `type`/`action`/`updates` + `?` | **Early** — write SQL yourself |
| MongoDB | CRUD helpers — usable | `models/user/db/mg/schema.yaml` is a field list | **Early** — no query compiler |

MySQL is not “Active” in the product sense. The adapter is a few dozen lines. This repo has a [MySQL page](./nectarine-mysql.md) that matches that.

## Compiler gap

`CCompiler` comments describe the intended flow:

```ts
const compiler = new CCompiler();
const parse = compiler.parse_config("./nectar/models/user/sql.yml");
const clean = compiler.clean_parse(parse, "get", "user");
const getUserById = compiler.buildQuery(clean, "GetUserById");
```

`buildQuery` does not assign a statement. `parser.buildSQL` lists the steps (validate, tokenize, compile) and stops. `clean_parse(parsed, method, type)` is the opposite nesting of `genSQL(path, type, method, name)`.

`optokens` (`eq`, `gt`, `lt`, …) is exported as a type from the compiler module; nothing consumes it yet.

Until compile lands, status stays Early. Details: [Compiler](./nectarine-compiler.md).

## Strongest areas

- YAML as a git-friendly contract (`parser.yaml` / `genSQL`)
- Postgres adapter as a readable `pg.Client` wrapper
- Postgres DSL convention that a small app builder can compile
- Honesty in this docs set about what is not there

## Most promising emerging

- Flattening API YAML vs teaching `parser.yaml` walks
- One documented compile module in apps (tutorial) that can move into the package
- MySQL pool as a fine socket once env and lifecycle are obvious

## Early or draft

- Mongo beyond insert scripts
- `CCompiler` as a supported path
- Seltzer auto-wiring
- Tests
- Any “generate a backend” story

## Recommended positioning right now

> Nectarine is an Early/Alpha YAML contract folder with thin Postgres, MySQL, and Mongo sockets. You parse named objects, compile SQL in the app, and run it on an adapter. It is not Prisma, not a route generator, and not a SQL compiler yet.

**Less accurate positioning:**

- “Active product databases” as if MySQL/Mongo were compiler-complete
- “Drop in User/Blog/CMS packs”
- “WebEngine module that boots a backend”
- millisecond benchmark tables (none in-tree)

## Practical interpretation

- Adopt for **new CitrusWorx services** that want query names in git and will write a 40-line builder
- Do not block an app on `buildQuery`
- Do not promise Express/Zod generation to a customer
- Contributors: implement compile for `UserById` first, with a test

## Performance / lock-in notes

There are no measured benchmarks in-tree. Do not cite invented millisecond tables.

Transactions, migrations, and auth are application concerns.

## Tests

`libraries/nectarine/nectarine.test.ts` imports Playwright and defines **no tests**. `package.json` runs `playwright test && vitest run`.

Docs can be honest without those tests. A 1.0 claim cannot.

## Integration

**Seltzer.** Complementary in design: Nectarine objects can describe `method` + `path`; Seltzer registers handlers. You copy the fields. See [Integration](./nectarine-integration.md).

**WebEngine.** `webengine.toml` backend snippets in older docs are not implemented in this package.

**Sig.js / Juice.** No client SDK.

## Suggested reading

- [README](./README.md)
- [Tutorial](./nectarine-tutorial.md)
- [Roadmap](./nectarine-roadmap.md)
- [Best practices](./nectarine-best-practices.md)
