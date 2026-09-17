# The community equipment library

[Course](./README.md)

Use these tables to predict answers before executing SQL. IDs identify facts; names are labels that may change. Fixed evaluation date: **2026-09-15**.

## Members

| id | name | email |
|---:|---|---|
| 1 | Ada | ada@example.test |
| 2 | Mina | mina@example.test |
| 3 | Sol | sol@example.test |

## Items

| id | name | category | details |
|---:|---|---|---|
| 10 | Recorder | audio | `{"portable":true,"inputs":2}` |
| 20 | Mixer | audio | `{"portable":false,"inputs":8}` |
| 30 | Camera | video | `{"portable":true,"resolution":"4k"}` |
| 40 | Tripod | support | `{}` |

## Loans

| id | member_id | item_id | due_on | returned_at |
|---:|---:|---:|---|---|
| 101 | 1 | 10 | 2026-09-10 | NULL |
| 102 | 2 | 20 | 2026-09-12 | 2026-09-12 10:00:00 |
| 103 | 1 | 30 | 2026-09-20 | NULL |
| 104 | 2 | 10 | 2026-09-01 | 2026-09-01 09:00:00 |

`NULL` means no return has been recorded under this model. It is not the string `"NULL"`. A loan row describes one borrowing event, not the current status of an item for all time. Item 10 has two historical borrowing events; only one is open.

## Expected results to keep nearby

| Question | Expected answer |
|---|---|
| Audio item IDs | 10, 20 |
| Open loan IDs | 101, 103 |
| Overdue open loans on the reference date | 101 |
| Current borrowers | Ada has Recorder and Camera |
| Total historical loans by member | Ada 2, Mina 2, Sol 0 |
| Members without an open loan | Mina, Sol |
| Portable items according to JSON details | Recorder, Camera |
| Items after the first audio page, ordered by category then ID | Tripod, Camera |

The stored schema enforces primary keys, member email uniqueness, required fields, and foreign keys. It **does not** currently enforce “only one open loan per item.” That business rule is an explicit transaction/concurrency and future-design topic, not a capability we silently assume.

Source: [schema YAML](./lab/models/schema.yml), [seed SQL](./lab/sql/seed.sql). Seed values are fixed teaching literals, not a pattern for interpolating request input into SQL.
