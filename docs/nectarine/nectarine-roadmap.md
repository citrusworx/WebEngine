# Nectarine Roadmap

## Current position

Nectarine is no longer just an idea for “YAML that becomes a backend.”

It is a small, implemented library with five visible layers:

- `parser.yaml` / `genSQL` / `registerRoute` in `util.ts`
- a `CCompiler` slot whose `buildQuery` is still empty
- `PgSql` as a `pg.Client` wrapper
- `Mysql` as a module-level `mysql2` pool
- Mongo helpers around one `MongoClient`

The strongest part of Nectarine today is still the contract folder: tables, named queries, and route names as data you can grep. The next strongest area is Postgres as a socket plus a DSL convention a short app function can compile.

The weakest areas are still:

- SQL compile in the package (`buildSQL` / `buildQuery`)
- one nesting and one query shape
- MySQL / Mongo beyond thin drivers
- tests
- HTTP generation

Early / Alpha is the honest label. The core is real enough to teach in depth; it is not a compiler, and it is not frozen.

---

## What is already true

### 1. YAML load and named lookup are a finished idea, not a sketch

`parser.yaml(path)` returns the tree. `parser.genSQL(path, type, method, name)` returns one node or throws. That loop is small and the identity of the library.

What that means for the roadmap: Nectarine does not need a new config format. It needs compile, validation, and less surprising route lookup around this one.

### 2. Adapters are sockets, and that is a feature

`PgSql.query({ sql, params })`, `Mysql(sql, values)`, `insertOne(client, collection, doc)` do not plan queries. They run what you pass.

A future ORM-shaped `db.user.find` would be a different product. The roadmap should put a compiler *in front of* these sockets, not replace them with magic.

### 3. The Postgres DSL is consistent enough to compile by hand

`select` / `from` / `where` / `insert` / `set` in `models/user/db/pg/user.yml` is a real convention. The tutorial builder is ~30 lines because the shape is small.

What that means for the roadmap: implement `buildSQL` for **that** file first. Do not wait for joins, OR trees, or a unified MySQL+PG AST.

### 4. HTTP is a sibling, not a child

`*API.yml` stores `{ method, endpoint }`. Seltzer stores `{ method, path, handler }`. Copying fields works. An importer would be a small function, not a framework.

It is not Express, not Zod, and not `/users/:id` on Seltzer.

### 5. Honesty is now part of the product surface

Older docs claimed `generateRoutes`, `MYSQL_*`, published CMS packs, and a compiler. This docs set matches `libraries/nectarine/src`.

The roadmap should keep that lock. The easiest way to look more mature is to fake compile in prose. Do not.

---

## What is still holding Nectarine back

### 1. The compiler is comments

`parser.buildSQL` and `CCompiler.buildQuery` describe validate → tokenize → compile and then stop. App authors who call them fail quietly via `PgSql.query`.

Until a `UserById` node becomes `SELECT id FROM users WHERE id = $1` in-package, every tutorial must teach a hand-built compiler. That is correct. It is also the ceiling.

### 2. Two nestings, two query shapes, two example builders

`genSQL` uses `[resource][verb][name]`. `clean_parse` uses `[verb][resource]`. Blog `post/sql.yml` uses `queries:`. `pgz.example.ts` builds from `type` / `fields` / `table`. PG fixtures use `select` / `from` / `where`.

A compiler that “supports the repo” would be a pile of special cases. Pick the user-bundle PG layout. Migrate or isolate the rest.

### 3. `registerRoute` does not understand the fixtures

Checked-in `userAPI.yml` is `user.get.allUsers`. The helper indexes top-level `get.allUsers`. Filename checks return a string. This is teachable and sharp.

### 4. Adapter edges are easy to misuse

- `PgSql.query` swallows errors
- MySQL pool dies if you `closeSql` per request
- Mongo helpers close the shared client
- `mysql2` is undeclared
- env prefixes are easy to guess wrong

Docs can cover this (this pass). A 1.0 claim wants fewer footguns in code.

### 5. Tests do not pin the parser

`nectarine.test.ts` has no `test()` blocks. There is nothing that fails if `genSQL` changes nesting or `buildQuery` starts returning a number.

Docs can be honest without those tests. A 1.0 claim cannot.

---

## Revised status

If Nectarine is viewed as a data layer, its current maturity looks roughly like this:

- YAML load and named lookup: strong
- Postgres socket: useful and thin
- Postgres DSL convention: strong enough to teach, not compiled
- MySQL / Mongo sockets: useful and early
- Compiler class: a labeled hole
- Docs as product surface: much stronger after the tutorial and topic pages
- Generated HTTP / validation / migrations: not started
- Production-hardened ORM: not the goal yet

In practical terms:

- Nectarine already feels like a real contract folder for CitrusWorx services
- Nectarine does not yet feel like a complete alternative to Prisma, and it should not try to until compile and tests exist

That is a strong place to be.

---

## Priorities

### Priority 1. Keep the parse → compile → adapter model obvious

The next work that helps the most is not a new database. It is:

- a guided tutorial that compiles YAML by hand and runs it
- topic pages for schema, DSL, compiler, adapters
- patterns / anti-patterns for Prisma habits

This docs set is that work. Keep it aligned with `libraries/nectarine/src` when the code moves.

### Priority 2. Implement `buildSQL` / `buildQuery` for the Postgres `get` shape

If the core is opened:

1. Lock `resource.verb.Name` as the only nesting (`genSQL` already does this)
2. Compile `select` + `from` + optional `where` with the `optokens` map at **runtime**
3. Return a `{ sql, params }` (or a string + documented params) — do not swallow
4. Refuse unknown operators and non-identifier names

Do not compile MySQL and Mongo in the same change. Do not document joins until they exist.

### Priority 3. Make lookup harder to misuse

Useful increments, if they are built:

- `registerRoute` walks `resource.verb.name` **or** documents a flatten-only contract and ships a fixture that matches
- throw (not return a string) on bad API filenames
- `clean_parse` argument order matches `genSQL` or the method is removed

### Priority 4. Harden adapter edges

Two honest options for Postgres errors:

1. Keep swallow + `undefined`, and keep teaching `if (!result)` (docs already do)
2. Throw like `Mysql`, which is easier to `try/catch` in Seltzer handlers

Pick one and test it. Same for Mongo: helpers that close a shared client should be documented as scripts (they are) or should stop closing.

Declare `mysql2` if MySQL remains a public adapter. Drop unused `dotenv` require.

### Priority 5. Test the parser you document

Highest value tests:

- `genSQL` returns the `UserById` node from `models/user/db/pg/user.yml`
- `genSQL` throws on a missing name
- `registerRoute` on nested `userAPI.yml` throws (or succeeds, if you change lookup — pin whichever you choose)
- `buildSQL` / `buildQuery` remain empty **or** emit the expected `SELECT` once implemented
- `PgSql.query` parameterized round-trip against a test container, when CI can afford it

### Priority 6. Stay complementary to Seltzer

Nectarine should not grow `app.listen`, Zod, or a theme. If a pattern needs HTTP, the answer is copy `method` + `endpoint` onto `Seltzer.route`. An optional `mountApi(app, yaml, handlers)` is a maybe. `generateRoutes` that pretends validation exists is a no.

---

## Recommended build order

1. Keep docs and examples locked to source (ongoing).
2. Runtime `optokens` + `buildQuery` for Postgres `get`.
3. Parser tests for `genSQL` / `registerRoute`.
4. Align `clean_parse` or delete it.
5. Adapter error-policy and MySQL packaging.
6. Only then: `create` / `update` / `delete` compile, Seltzer mount helper, MySQL DSL unification — not all at once.

---

## What would not move Nectarine upward

- Documenting a compiler that still returns `undefined`
- Prisma compatibility APIs
- GraphQL before `SELECT … WHERE` compiles
- Publishing User/Blog/CMS packs from fixtures that contain `DEAFULT`
- Merging Nectarine and Seltzer into one “backend framework” package
- WebEngine auto-start before a process can import the parser
- Benchmark tables with no measurements

Those would blur the split that justifies the library: **contracts in git, sockets in adapters, HTTP next door.**

---

## Summary

Nectarine is in a meaningfully stronger place than a prototype.

It now has:

- a credible YAML lookup core
- three thin drivers
- a Postgres intent convention you can compile by hand
- a documented split with Seltzer
- a guided tutorial and topic depth that match that split

The next stage is not inventing Nectarine from scratch.

The next stage is refinement:

- make `buildQuery` emit SQL for the DSL you already have
- test lookup
- make adapters less sharp
- keep the parse → compile → adapter promise

That is a strong place to be. Until those land, the docs stay with [Status](./nectarine-status.md) and the APIs in `libraries/nectarine/src`.
