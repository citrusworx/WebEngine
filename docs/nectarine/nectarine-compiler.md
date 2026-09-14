# Compiler

How `CCompiler` and `parser.buildSQL` actually work in `libraries/nectarine/src`. This is the mental model for **the unfinished compile step** — not a SQL generator, not a query planner, and not something to call in production.

Related:

- [Query DSL](./nectarine-query-dsl.md) — the objects a compiler would consume
- [Tutorial](./nectarine-tutorial.md) — the hand-built compiler you should use today
- [Status](./nectarine-status.md) — Early until `buildQuery` emits a string

## What the compiler is

A class plus one function whose comments describe a pipeline:

1. Validate shape
2. Validate semantics (required keys, operator set)
3. Tokenize
4. Normalize YAML → SQL
5. Compile a statement

The comments are the spec. The bodies are empty.

```ts
import { parser, CCompiler, type optokens } from "@citrusworx/nectarine";

parser.buildSQL(parser.genSQL("./user.yml", "user", "get", "UserById"));
// undefined

const compiler = new CCompiler();
const parsed = compiler.parse_config("./user.yml"); // parser.yaml
const clean = compiler.clean_parse(parsed, "get", "user");
const sql = compiler.buildQuery(clean, "UserById");
// sql is undefined
```

Passing `undefined` into `PgSql.query` is how an app that “uses the compiler” fails quietly.

## What each method does

### `parser.buildSQL(genSQL)`

Declared on the `parser` object in `util.ts`. The body is comments only. Return value is `undefined`.

It does not tokenize. It does not consult `optokens`. It does not look at `select` / `from` / `where`.

### `CCompiler.parse_config(config)`

Despite the parameter name `config`, this is a **filepath**. It delegates to `parser.yaml` and returns the whole tree. The declared return type `Record<string, string>` is wrong at runtime — you get nested objects.

### `CCompiler.clean_parse(parsedConfig, method, type)`

Returns `parsedConfig[method][type]`.

`parser.genSQL` indexes `sql_obj[type][method][config]` — **resource, then verb, then name**.

The class comment shows:

```ts
const parse = compiler.parse_config("./nectar/models/user/sql.yml");
const clean = compiler.clean_parse(parse, "get", "user");
```

That looks up `parse.get.user`. The checked-in Postgres file is `user.get.UserById`. `clean_parse` and `genSQL` do not agree on argument order or nesting. Treat `clean_parse` as unfinished, not as an alternate lookup.

### `CCompiler.buildQuery(cleanedConfig, query)`

Reads `cleanedConfig[query]` into a local `qobj` and returns nothing. The comment says “Craft the proper SQL statement.” There is no craft.

### `optokens`

```ts
export type optokens = {
  eq: "=";
  gt: ">";
  lt: "<";
  lte: "<=";
  gte: ">=";
  neq: "!=";
};
```

This is a **type**. Nothing in `src/` uses it as a value. A hand-built compiler copies the same map as a `Record<string, string>` — that is the [tutorial](./nectarine-tutorial.md) `OPS` object.

## A compact picture

```text
intended:

  yaml ── parse_config ── clean_parse ── buildQuery ── SQL string ── adapter

today:

  yaml ── parse_config ── whole tree (and a console.log)
          genSQL       ── one node (and a console.log)
          buildSQL     ── undefined
          buildQuery   ── undefined

honest:

  yaml ── genSQL ── your builder ── SQL string ── PgSql.query / Mysql
```

## Why it exists anyway

The class is the slot where CitrusWorx wants compile to live so app code stops concatenating strings. Shipping the slot without the body is how the library stays honest: the API is visible, the gap is visible, and docs can teach the workaround without inventing `generateRoutes`.

What that means for authors:

- Do not wrap `buildQuery` and hope.
- Do put compile in one module in the app (the tutorial’s `buildSelect` / `buildInsert`) so it can be deleted when the package grows a real compiler.
- Do keep YAML shapes consistent enough that a future `buildSQL` could consume them — see [Query DSL](./nectarine-query-dsl.md).

## What a real compiler would need

Not a promise. A punch list against current fixtures:

1. **One nesting.** Either `resource.verb.Name` (`genSQL`) or `verb.resource` (`clean_parse`), not both.
2. **One `get` shape.** `select` + `from` + `where`, or the MySQL `type` / `fields` / `table` / `conditions` shape — not both silently.
3. **Operator allow-list** at runtime, not only as `optokens`.
4. **Placeholder policy.** `$1` vs `?` vs `{ fn: now }`.
5. **Identifier safety.** Refuse `from: "users; drop table users"`.
6. **Tests.** `nectarine.test.ts` currently has no `test()` blocks.

Until those exist, status stays Early. [Roadmap](./nectarine-roadmap.md) puts this first.

## Practices

- Call `parser.genSQL` for lookup. Call your builder for SQL. Call the adapter for I/O.
- Never pass the return of `buildSQL` / `buildQuery` to a driver.
- Do not document `CCompiler` as the supported compile path in app READMEs.
- If you contribute compile, start with the Postgres `get` shape in `models/user/db/pg/user.yml` and a test that `UserById` becomes `SELECT id FROM users WHERE id = $1`.
