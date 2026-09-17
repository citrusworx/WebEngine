# Source, capability boundaries, and verification

[Course](./README.md)

This course follows the checkout after merge `d25673e`. The local [manifest](../../../libraries/nectarine/package.json) declares Nectarine **0.3.0**; npm reported **0.4.0** on September 16, 2026. The lab uses the local package through a file dependency. It does not claim to validate the separately published 0.4.0 artifact. Seltzer's local package is 0.8.1.

## Follow a question through the code

| Responsibility | Source |
|---|---|
| Public package paths | [package.json](../../../libraries/nectarine/package.json) |
| Parse and compile named operations | [compiler.ts](../../../libraries/nectarine/src/compiler/compiler.ts) |
| Normalize accepted descriptions | [normalize.ts](../../../libraries/nectarine/src/compiler/normalize.ts) |
| Render SQL | [sql.ts](../../../libraries/nectarine/src/compiler/sql.ts) |
| Expression grammar | [fragments.ts](../../../libraries/nectarine/src/compiler/fragments.ts) |
| Validate structural names | [identifiers.ts](../../../libraries/nectarine/src/compiler/identifiers.ts) |
| Generate schema statements | [ddl.ts](../../../libraries/nectarine/src/compiler/ddl.ts) |
| Compile explicit schema changes | [migration.ts](../../../libraries/nectarine/src/compiler/migration.ts) |
| Execute migration sequence | [runner.ts](../../../libraries/nectarine/src/migrate/runner.ts) |
| Resolve application configuration | [loadConfig.ts](../../../libraries/nectarine/src/config/loadConfig.ts) |
| PostgreSQL connection and pinning | [pgz.ts](../../../libraries/nectarine/src/adapters/pg/pgz.ts) |
| MySQL execution and placeholder conversion | [msqlz.ts](../../../libraries/nectarine/src/adapters/ms/msqlz.ts) |
| MongoDB collection access | [mgz.ts](../../../libraries/nectarine/src/adapters/mg/mgz.ts) |
| Course definitions and execution | [queries.yml](./lab/models/queries.yml), [runtime.mjs](./lab/runtime.mjs) |

Adapters have their own package subpaths; they are not all root exports. A library supporting several adapters does not establish identical SQL grammar, migration atomicity, or feature parity between databases.

## Current versus designed

| Capability | Course treatment |
|---|---|
| Named SELECT with filters/order, INSERT, guarded UPDATE/DELETE | Implemented; executed in the lab |
| Scalar COUNT and constrained EXISTS | Implemented; not general grouped reports |
| JSONB containment and supported path expressions | Implemented within the accepted expression grammar |
| Foreign keys and generated CREATE TABLE | Implemented; constraints exercised with invalid writes |
| Versioned migration replay/checksum | Implemented; rename preserves existing data in the lab |
| Connection pinning | Implemented in pg adapter; callback alone does not issue BEGIN/COMMIT |
| Joins, GROUP BY/HAVING, limit/keyset pagination | SQL lessons plus proposed compiler work |
| Strict rejection of every unsupported property | Proposed; ignored `limit` is characterized by a test |
| Partial unique-index DSL, migration locking, general transaction facade | Design exercises, not promised APIs |

## Verification record

Checked September 16, 2026, on Windows with Node 24.11.1 and isolated PGlite 0.5.8:

- All **14 course tests passed**, including SQL result comparisons, constraints, parameter binding, rollback after failure, JSONB, and migration replay/checksum rejection.
- The compiler explorer and first SQL exercise ran successfully through local package entrypoints.
- HTTP smoke checks passed: item list and existing ID return 200, missing ID returns 404, malformed and out-of-range IDs return 400. The list contains the four seeded items.
- Nectarine's existing suite: **196 passed, 1 failed** using the workspace-installed Vitest 3.2.7. The failure compares Blackwater's checked-out CRLF `init.sql` against generated LF SQL. This course does not modify that file or comparison. The library manifest requests a newer Vitest version; the installed runner is recorded here explicitly.
- Library typechecking could not complete because the workspace lacks `mysql2/promise` and its declarations. No library source was changed for this course.

The lab executes PostgreSQL in-process. It does not verify the network pg adapter, TLS, pool contention, multiple-client races, MySQL, MongoDB, or a durable deployment. A green course suite is evidence for these teaching examples, not a production certification.

Reproduce course checks with `npm --prefix docs/nectarine/database-course/lab test` after following [setup](./00-workbench.md). The lab lockfile pins its added teaching dependency without changing the root dependency lockfile.

## Primary references

Use these for deeper reading; the course's fixture and exercises are original:

- [PostgreSQL SQL tutorial](https://www.postgresql.org/docs/current/tutorial-sql.html): basic query and data-change concepts.
- [Table expressions](https://www.postgresql.org/docs/current/queries-table-expressions.html): joins and grouped results.
- [Comparison functions](https://www.postgresql.org/docs/current/functions-comparison.html): null comparisons.
- [Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html): database rules.
- [Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html): transaction boundaries.
- [EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html): understanding execution plans.
- [JSON functions](https://www.postgresql.org/docs/current/functions-json.html): structural operators.
- [LIMIT and OFFSET](https://www.postgresql.org/docs/current/queries-limit.html): ordering and paging.
- [Partial indexes](https://www.postgresql.org/docs/current/indexes-partial.html): conditional index rules.
- [node-postgres transactions](https://node-postgres.com/features/transactions): one client per transaction.
- [PGlite documentation](https://pglite.dev/docs/): the embedded teaching runtime.

The `current` PostgreSQL documentation links move with releases. Recheck behavior against the actual engine and package versions when updating the course.
