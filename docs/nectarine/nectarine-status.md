# Nectarine Status

Honest snapshot of `@citrusworx/nectarine` **0.1.0** against `libraries/nectarine/src`.

## Maturity

**Early / Alpha.** Adapters and YAML I/O are real. The compiler that would turn query YAML into SQL is not. The workspace index says “Active alpha” because three drivers exist; this page is stricter about *product completeness*.

Do not treat comparison tables vs Prisma / Supabase / Firebase as a capability claim. Those were marketing. Nectarine is a small library in this repo.

## What is shipped

| Area | Symbol / file | Notes |
|---|---|---|
| YAML load | `parser.yaml` | `fs.readFileSync` + `js-yaml`, logs to console |
| Named SQL object | `parser.genSQL` | Returns the YAML node |
| Named API object | `parser.registerRoute` | Path must look like `*api.yml` |
| SQL compile | `parser.buildSQL` | **Empty body** |
| Compiler class | `CCompiler` | `parse_config`, `clean_parse` work; `buildQuery` empty |
| PostgreSQL | `PgSql` | `addDb`, `connect`, `query`, `disconnect`, `addTable` |
| MySQL | `Mysql`, `closeSql`, `pool` | `mysql2/promise` pool |
| MySQL fragments | `mapInsert`, `mapGetter`, `getValues` | Join lists, not full SQL |
| Mongo | `Mngz`, `connectMngz`, `closeMngz`, `createCollection`, `insertOne`, `insertMany`, `mngzClient` | Shared `MongoClient` |
| Mongo config helper | `loadMongoConfig` | Stub (`parser.yaml('sql.yml')`) |
| Example models | `libraries/nectarine/models/**` | User + blog fixtures |
| Example builder | `adapters/pg/pgz.example.ts` | Not exported |

## What older docs claimed that is not in source

| Claim | Reality |
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

## Adapter honesty

| Database | Adapter | Query YAML | Guide-complete? |
|---|---|---|---|
| PostgreSQL | `PgSql` — usable | `select` / `from` / `where` DSL in `models/user/db/pg` | Furthest — example builder exists |
| MySQL | `Mysql()` — usable | Older `type`/`action`/`updates` + `?` | **Early** — write SQL yourself |
| MongoDB | CRUD helpers — usable | `models/user/db/mg/schema.yaml` is a field list | **Early** — no query compiler |

MySQL is not “Active” in the product sense. The adapter is a few dozen lines. This repo now has a [MySQL page](./nectarine-mysql.md) that matches that.

## Compiler gap

`CCompiler` comments describe the intended flow:

```ts
const compiler = new CCompiler();
const parse = compiler.parse_config("./nectar/models/user/sql.yml");
const clean = compiler.clean_parse(parse, "get", "user");
const getUserById = compiler.buildQuery(clean, "GetUserById");
```

`buildQuery` does not assign a statement. `parser.buildSQL` lists the steps (validate, tokenize, compile) and stops.

`optokens` (`eq`, `gt`, `lt`, …) is exported as a type from the compiler module; nothing consumes it yet.

## Performance / lock-in notes

There are no measured benchmarks in-tree. Do not cite invented millisecond tables.

Transactions, migrations, and auth are application concerns.

## Integration

**Seltzer.** Complementary in design: Nectarine objects can describe `method` + `path`; Seltzer registers handlers. You copy the fields. See [Seltzer integration](../seltzer/seltzer-integration.md).

**WebEngine.** `webengine.toml` backend snippets in older docs are not implemented in this package.

**Sig.js / Juice.** No client SDK.

## Roadmap (direction)

1. Implement `buildSQL` / `buildQuery` for the Postgres DSL
2. Stop requiring app-side string concat
3. Optionally map `*API.yml` onto Seltzer routes
4. Then talk about validation and a config file

Until (1), status stays Early.

## Suggested reading

- [README](./README.md)
- [Getting Started](./nectarine-getting-started.md)
- [Best practices](./nectarine-best-practices.md)
