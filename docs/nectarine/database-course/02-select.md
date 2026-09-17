# 02 — Describe the result before writing SELECT

[Previous](./01-facts.md) · [Course](./README.md) · [Next](./03-null.md)

**Question:** which items are audio equipment? Allow 45–60 minutes.

## Predict the table you want back

Open [the fixture](./dataset.md). The relevant facts live in `items`. We want only audio rows and only their IDs and names. Predict two rows: 10/Recorder and 20/Mixer.

Use this planning sentence: **from these facts, keep rows meeting this rule, show these fields, arrange them this way.** It is a reasoning sequence, not necessarily the physical order in which a database executes instructions.

```sql
SELECT id, name
FROM items
WHERE category = 'audio'
ORDER BY id;
```

`FROM` names the source. `WHERE` chooses rows. `SELECT` chooses output expressions. `ORDER BY` gives the result a promised ordering. SQL writes SELECT first, but reading from the source outward is often easier for beginners.

## Watch rows and columns change separately

```text
items:                  4 rows, 4 columns
WHERE category=audio:   2 rows, 4 columns
SELECT id,name:         2 rows, 2 columns
ORDER BY id:            2 rows, 2 columns, specified order
```

Filtering changes which rows survive. Projection changes what each result row contains. Neither operation deletes stored data. Running a read twice does not consume rows from the table.

The logical transformation is a way to understand meaning. The query planner can choose a different physical strategy that produces the same result. [PostgreSQL table expressions](https://www.postgresql.org/docs/current/queries-table-expressions.html)

## Run and perturb

```sh
node docs/nectarine/database-course/lab/run.mjs 01-select.sql
```

In a copy of the SQL file, change `audio` to `support`. Predict one row: 40/Tripod. Change it to a nonexistent category: expect zero rows, not an exception. An empty result is a valid answer.

Without ORDER BY, seeing IDs arrive in ascending order today is not a guarantee. The storage layout or execution plan can change. Add a tie-breaker when the leading order expression can repeat: `ORDER BY category, id` gives a deterministic order in this fixture.

## Translate a supported operation into Nectarine

The same question with a variable category becomes:

```yaml
item:
  get:
    ByCategory:
      select: [id, name]
      from: items
      where: { column: category, operator: eq, value: $1 }
      orderBy: [{ column: id, direction: ASC }]
```

`ByCategory` is a name chosen by the author. `$1` marks a value to supply separately. The host binds `["audio"]`; the compiler emits `WHERE category = $1`, leaving the value out of the SQL text.

The course runner shows both routes to the answer. Do not skip inspecting the emitted SQL: YAML is another representation of intent, not a substitute for understanding the query.

## Developer caution: successful syntax is not correctness

`WHERE name = 'audio'` is valid SQL against this schema but asks the wrong question. A test that merely asserts “no exception” would miss the mistake. Assert the expected identities and output shape.

Also decide whether duplicates matter. SQL results can contain repeated values. Selecting just `category` from all four items yields two `audio` entries. `DISTINCT` is a SQL tool for removing duplicate result values, not for fixing a faulty relationship model; do not assume Nectarine has a corresponding option today.

## Checkpoint

Write the desired result and SQL for video items, then for all item names in descending ID order. Explain why a SELECT does not remove stored rows and why physical insertion order is not a sorting contract.

[Answers](./answers.md#lesson-02)
