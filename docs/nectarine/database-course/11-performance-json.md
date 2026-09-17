# 11 — Think about cost, pages, and flexible data

[Previous](./10-migrations.md) · [Course](./README.md) · [Next](./12-integration.md)

**Question:** how do useful answers remain predictable when the library grows? Allow 75–90 minutes.

## An index is another structure to maintain

Our schema creates an index on `loans.member_id`. An index can help locate matching rows without examining every row, but costs storage and maintenance during writes. It is not a switch that makes every query fast.

Run `09-plan.sql`. EXPLAIN shows the planner's selected strategy. With only four loans, a sequential scan can be sensible. Do not make the lesson test insist on an index scan just because an index exists. Plans depend on statistics, data distribution, and cost estimates. [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)

EXPLAIN ANALYZE actually executes the statement to measure it. That distinction matters for writes: a diagnostic command is not automatically non-mutating. Use a disposable lab when learning execution plans.

Read plans from the work performed upward. Compare estimated versus actual rows when measurements are available. A badly estimated join can matter more than shaving characters off a SQL string. A compiler assembles a statement; PostgreSQL's planner chooses its execution plan.

## Pages need a stable ordering contract

```sql
SELECT id, name FROM items
ORDER BY category, id
LIMIT 2 OFFSET 2;
```

Predict Tripod then Camera. The tie-breaker `id` makes ordering within a category deterministic. Without a complete order, “page two” is not a dependable slice.

Offset pagination can shift under concurrent inserts/deletes and can require skipping many rows. A keyset query instead continues after the last observed sort key:

```sql
SELECT id, name FROM items
WHERE (category, id) > ('audio', 20)
ORDER BY category, id
LIMIT 2;
```

Run `05-pages.sql` to compare both approaches on stable data. Keyset pagination still needs defined sort direction, null handling, and cursor validation. Neither approach magically promises a snapshot across changing requests.

These are SQL labs. The current Nectarine compiler does not emit LIMIT/OFFSET or this tuple comparison. Do not attach a pagination property to a query and trust that it is enforced.

## Flexible details do not erase relational structure

An item's identity, name, and category are columns. Details that vary across equipment types live in a JSONB column. For example, a mixer has an input count and a camera has a resolution.

```sql
SELECT id, name FROM items
WHERE details @> '{"portable":true}'::jsonb
ORDER BY id;
```

Predict Recorder and Camera. `@>` asks about containment of the JSON structure. `->>` extracts a JSON field as text; `details->>'inputs'` returns text values such as `"2"`, not a numeric SQL column. See [PostgreSQL JSON operators](https://www.postgresql.org/docs/current/functions-json.html).

The lab's `WithDetails` named query compiles the containment form with a bound JSONB value. Host code serializes validated data and supplies it separately; the compiler emits the allowlisted cast.

## Choose columns and documents by their job

A JSONB column can hold many shapes, but your application still has a contract. If every important query requires the same field, a dedicated column may make constraints, indexing, and type semantics clearer. Conversely, forcing every optional device detail into a universal wide table can make a simple model awkward.

Do not call JSONB “MongoDB inside PostgreSQL.” It is PostgreSQL data with PostgreSQL operators and transaction behavior. Nectarine's MongoDB adapter is a different execution path, not a translator for arbitrary SQL.

## Checkpoint

Why might a four-row table use a sequential scan despite an index? Why include `id` in the page order? Compare JSON containment with text extraction, and identify which pagination features require a future compiler design.

[Answers](./answers.md#lesson-11)
