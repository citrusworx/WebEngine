# 00 — A database you can experiment with

[Course](./README.md) · [Next](./01-facts.md)

**Goal:** run the same question twice with the same starting facts. Allow 30–45 minutes.

## Remove the installation distraction

A network database normally involves a running server, credentials, connections, and persistent files. Those are important operational concerns, but they can obscure a beginner's first question about rows.

Our lab uses **PGlite**, an embedded PostgreSQL build running through WebAssembly. Each invocation opens a fresh in-memory database, compiles the course's schema with Nectarine, inserts fixed sample data, executes the selected SQL file, and closes. It is a real SQL engine rather than an imitation of `SELECT` using JavaScript arrays. It is not Nectarine's `pg` network adapter. [PGlite documentation](https://pglite.dev/docs/)

No Docker service, database password, or production database is required. The course does not start or reset your application's database.

## Repository setup

From the repository root:

```sh
node --version
npm install --prefix docs/nectarine/database-course/lab --workspaces=false --ignore-scripts --no-audit --no-fund
node docs/nectarine/database-course/lab/run.mjs
```

Use `npm.cmd` if Windows PowerShell blocks the npm script launcher. This install is isolated in the course lab, with its own manifest and lockfile; do not run a root npm install in the Yarn monorepo.

The lab pins PGlite and links the local Nectarine and Seltzer packages. The library's built `dist/` entrypoints must exist. If you intentionally change library source, build that library using the repository's Yarn scripts before comparing results. The course verification environment uses Node 24.11.1.

You should see two rows:

| id | name |
|---:|---|
| 10 | Recorder |
| 20 | Mixer |

The runner then asks the same question through Nectarine's named `ByCategory` query with the value `audio`. Its rows should match.

## What the runner does

Read [runtime.mjs](./lab/runtime.mjs) and [run.mjs](./lab/run.mjs). The separation is intentional:

```text
schema YAML -> Nectarine compiler -> CREATE TABLE / index statements
fixed seed SQL -> sample facts
lesson SQL or compiled named query -> embedded PostgreSQL -> result rows
```

`db.exec` runs a teaching script with potentially several statements. `db.query(sql, params)` executes one parameterized statement. They are different interfaces; the script runner is not the place to splice user input.

Try:

```sh
node docs/nectarine/database-course/lab/run.mjs 02-null.sql
node docs/nectarine/database-course/lab/compile.mjs
node --test docs/nectarine/database-course/lab/course.test.mjs
```

The compiler explorer prints SQL without connecting to an external database. Printing a valid query does not prove it will succeed against every database schema; execution tests answer that separate question.

## A reproducible “today”

Lessons about overdue items use **September 15, 2026** as an explicit reference date. We do not compare against the wall clock. Otherwise a correct expected answer could become wrong simply because you studied next month.

A fresh invocation resets the learning database. Run a multi-step experiment in one SQL file or one test when it depends on earlier changes. Changes in one invocation do not appear in the next.

## Troubleshooting

Package-not-found errors usually mean the isolated install or local library build is missing. An unknown column is a schema/query mismatch, not an npm problem. A constraint violation means the database understood the operation and rejected its effect. Learn to name the layer before changing the command.

The [lab README](./lab/README.md) also explains how to copy the course outside this monorepo. Its published-package setup is a separate baseline from local linked source.

## Checkpoint

Why is a fresh fixture useful? What does this lab fail to test about a network PostgreSQL deployment? Why can successful compilation and successful execution disagree?

[Answers](./answers.md#lesson-00)
