# 07 — Keep values separate from instructions

[Previous](./06-writes.md) · [Course](./README.md) · [Next](./08-compiler.md)

**Question:** what happens when a user supplies a category containing quotes or SQL-looking text? Allow 60 minutes.

## A query has structure and data

The operation is “find items whose category equals this value.” The user should control the value, not the meaning of equals, the table name, or the rest of the statement.

An unsafe host can accidentally turn value text into syntax by concatenating it into SQL. The course instead compiles fixed query structure with placeholders:

```text
SQL:    SELECT id, name FROM items WHERE category = $1 ORDER BY id ASC
params: ["audio"]
```

The parameter array travels separately to the execution API. A value such as `audio' OR TRUE --` remains a category string. With our fixture it matches nothing; it does not become a new condition. This behavior is tested against the embedded engine.

## The compiler does not know the user's value

```js
const sql = compileNamed("item", "get", "ByCategory");
const result = await db.query(sql, [requestedCategory]);
```

This is the same compiler output for every category. The database binds the supplied value. `compileNamed` is our small course helper around `CCompiler`; it is not a new Nectarine method.

In schema/query YAML, `{ const: ... }` represents a trusted author-selected constant. It is not a way to insert unchecked request data into a configuration object and declare it safe. Treat configuration authorship and request input as different trust boundaries.

## Parameters cannot stand for arbitrary SQL structure

`$1` is not a general replacement for a table, column, operator, or sort direction. To offer selectable sorting, map a user-facing choice to a small set of reviewed named query definitions. Do not accept a user-supplied expression and paste it into `orderBy`.

Nectarine validates and quotes identifiers, including mixed-case names. Quoting an identifier makes it an identifier; it does not grant permission to query every table that exists.

The fragment form of WHERE is also a closed grammar. A string such as `returned_at IS NULL` is parsed, not simply appended as arbitrary SQL. General function calls, comments, semicolon-separated statements, and subqueries do not become supported because they fit in a YAML string.

## Validation remains necessary

Binding protects the structure/data separation. It does not establish that a value has the correct domain meaning. An ID still needs parsing, range checks, and ownership policy. A timestamp still needs a defined format and time convention.

The database can reject an impossible type or violated constraint. Decide which errors your host translates into user-facing validation results and which represent internal failures. Do not return raw connection strings or driver diagnostics to HTTP clients.

## Compiler, adapter, engine

Nectarine's PostgreSQL adapter accepts SQL plus parameters and uses a pool. Its MySQL adapter rewrites supported PostgreSQL-style binds to MySQL placeholders and reorders values when necessary. That is more than replacing every dollar sign: placeholders inside string literals, repeated binds, and JSON expressions require syntax-aware handling.

It is also less than complete dialect translation. Supporting a placeholder does not mean every PostgreSQL statement, type, RETURNING clause, or upsert is portable to MySQL. MongoDB does not execute this SQL at all; it has a separate adapter surface.

## Checkpoint

Predict the result of ByCategory with `audio' OR TRUE --`. Explain why binding that value differs from interpolating it. Design a safe two-choice sort selector without letting clients submit column expressions.

[Answers](./answers.md#lesson-07)
