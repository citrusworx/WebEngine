# The database lab

[Course](../README.md) · [Workbench](../00-workbench.md)

The lab runs PostgreSQL semantics in PGlite 0.5.8 with a fresh in-memory database per invocation. Nectarine compiles the schema and named queries. SQL files are educational experiments; the HTTP host uses named operations instead of SQL strings.

## Install inside this repository

From the repository root:

```sh
npm install --prefix docs/nectarine/database-course/lab --workspaces=false --ignore-scripts --no-audit --no-fund
node docs/nectarine/database-course/lab/run.mjs 01-select.sql
node docs/nectarine/database-course/lab/compile.mjs
node --test docs/nectarine/database-course/lab/course.test.mjs
```

Use `npm.cmd` on Windows if needed. The lab owns its package-lock file and dependencies; it is not a new root workspace. Its Nectarine/Seltzer dependencies are file links to local packages. Root Yarn dependencies and the checked-in library build outputs must be available for those linked packages. The lab install does not rebuild them or change the root Yarn lockfile.

## SQL experiments

Pass a filename from `sql/` to `run.mjs`:

| File | Observe |
|---|---|
| `01-select.sql` | Audio items; comparison with named Nectarine query |
| `02-null.sql` | Wrong null equality, open loans, overdue loans |
| `03-joins.sql` | Borrower/item names and all-member left join |
| `04-groups.sql` | Correct zero counts and HAVING |
| `05-pages.sql` | Offset and keyset pages |
| `06-writes.sql` | INSERT/UPDATE/DELETE with rollback |
| `07-transaction.sql` | Transfer observed before and after rollback |
| `08-json.sql` | JSONB containment and text extraction |
| `09-plan.sql` | An execution plan, with no forced index-scan claim |

`seed.sql` initializes the fixture; do not run it again as a lesson against the already-seeded database. Duplicate-key failures would be expected. The runner accepts filenames only and never reads application credentials or connects to an external server.

## Explore the implementation

`runtime.mjs` exports `openLab`, `compileNamed`, and `runNamed`, which are **course helpers**, not Nectarine APIs. `compile.mjs` prints compiled schema and queries. `course.test.mjs` checks meaningful results against the engine, including constraints and migrations.

Run `http-server.mjs` for the optional Seltzer bridge on port 3001. Request `/items`, `/items/10`, `/items/999`, and `/items/banana`; expect 200, 200, 404, and 400. Stop with Ctrl+C. This server has no authentication or durable storage and is a local study example.

## Copying the lab outside the monorepo

Copy the whole lab directory, including `models/` and `sql/`, but not its `node_modules` or repository-specific lockfile. Replace the two `file:` dependencies in the copied package.json with explicit published versions, such as Nectarine `0.4.0` and Seltzer `0.8.1`, then run npm install there.

That is a separate package baseline from the local source links tested here. Rerun the course tests before assuming identical behavior. The current repository manifest/source mismatch is documented in [the source map](../source-map.md), not hidden by a version bump.

## Limits of this verification

PGlite exercises a PostgreSQL engine, including DDL, constraints, JSONB, and rollback. It does not test Nectarine's `pg` network adapter, real pool checkout behavior, TLS, multi-client contention, MySQL, MongoDB, or production data migrations. Those require separate integration environments. A rollback test in this lab is not evidence of MySQL transactional DDL.
