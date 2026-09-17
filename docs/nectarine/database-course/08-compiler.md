# 08 — Read the compiler as a translator

[Previous](./07-parameters.md) · [Course](./README.md) · [Next](./09-transactions.md)

**Question:** what exactly happens between naming a query and receiving rows? Allow 60–90 minutes.

## Four responsibilities, four different failures

```text
YAML loader -> query selection -> SQL compiler -> executor / database
```

The loader turns a file into a JavaScript value. Query selection finds a resource, CRUD method, and operation name. The compiler validates supported shapes and emits SQL. The executor sends SQL plus values to a database. The database resolves actual tables, types, and constraints and returns results.

A misspelled filename, missing query name, unsupported operator, and missing database column are therefore different failures. Calling all of them “a database error” hides where to look.

## Trace the public API

The course helper contains these steps:

```js
const compiler = new CCompiler();
const parsed = compiler.parse_config(queryPath);
const cleaned = compiler.clean_parse(parsed, "item", "get");
const sql = compiler.buildQuery(cleaned, "ByCategory");
const result = await db.query(sql, ["audio"]);
```

`parse_config` expects a file path, not YAML text. `clean_parse` takes **resource first, method second**. Its result carries the CRUD method so an incomplete read cannot accidentally be inferred as a delete. `read` is an alias for `get`.

Run the compiler explorer and compare each statement with its YAML entry. Identify exactly where the runtime values will go. The compiler output is a string; it does not open a database connection.

## The implemented grammar is intentionally smaller than SQL

Canonical query YAML describes `select/from/where`, inserts, updates, and deletes. Another supported shape uses `type: SELECT`, `table`, and `fields`; normalization translates it into the same underlying model.

Supported building blocks include structured AND/OR predicates, comparisons, IN lists, null checks, ordering, COUNT, a constrained EXISTS form, JSONB predicates, selected casts, and INSERT conflict handling. This does not imply support for every combination or every SQL feature.

Examples of deliberate restrictions include allowlisted value functions and casts. A SQL function that PostgreSQL supports may still be rejected by Nectarine. A database engine's capabilities and a compiler grammar's capabilities are separate sets.

## A missing option can be worse than an error

For the inspected canonical select path, this object compiles without a limit:

```js
compileQuery({ select: ["id"], from: "items", limit: 1 });
// Current result: SELECT id FROM items
```

The unknown field is not a supported pagination API. The course test records this limitation so readers do not mistake successful compilation for feature support. A future strict-shape validator should reject unsupported keys instead of silently ignoring intent.

Do not teach invented YAML for JOIN, GROUP BY, or LIMIT as if it works. Keep those SQL lessons separate until an explicit compiler extension and behavior tests establish support.

## Developer reading order

Start with [compiler.ts](../../../libraries/nectarine/src/compiler/compiler.ts), which exposes the public operations. Then read [normalize.ts](../../../libraries/nectarine/src/compiler/normalize.ts), [sql.ts](../../../libraries/nectarine/src/compiler/sql.ts), and [identifiers.ts](../../../libraries/nectarine/src/compiler/identifiers.ts). Follow only the ByCategory path on the first pass.

On a second pass, trace Overdue's AND tree and NewItem's JSONB cast. Compare a rejected operator with a permitted one. The question is not merely “where is the string assembled?” but “which input shapes are trusted, validated, normalized, or refused?”

The [source map](./source-map.md) connects the rest of the code, including schema compilation and migrations.

## Checkpoint

Explain what each of the four steps can fail to do. Why does an existing PostgreSQL column not guarantee Nectarine accepts a query about it? What regression test would detect a silently ignored pagination property?

[Answers](./answers.md#lesson-08)
