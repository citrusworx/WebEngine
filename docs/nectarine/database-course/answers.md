# Answers and reasoning

[Course](./README.md) · [Fixture](./dataset.md)

Predict before reading these answers. When your result differs, compare the input rows and the meaning of one output row before changing syntax.

## Lesson 00

A fresh fixture makes results repeatable: a previous UPDATE cannot silently change the next exercise. PGlite executes real PostgreSQL statements but does not exercise a network connection, authentication, TLS, connection pooling, or multiple competing clients. A compiler can emit syntactically valid SQL against a missing table, wrong column, or incompatible value; execution adds checks that compilation alone cannot supply.

## Lesson 01

A name describes someone; an ID identifies one member. Two people can share a name. Copying email into every loan creates several places to update when an address changes, unless those copies deliberately represent historical snapshots. Our initial schema does not enforce at most one open loan per physical item. A foreign key proves the referenced item exists, not that it is available.

## Lesson 02

```sql
SELECT id, name FROM items WHERE category = 'video' ORDER BY id;
-- 30, Camera

SELECT name FROM items ORDER BY id DESC;
-- Tripod, Camera, Mixer, Recorder
```

SELECT produces a result without deleting the rows excluded by WHERE. Only ORDER BY establishes the requested result order; insertion order is not a query contract.

## Lesson 03

Returned IDs are 102 and 104 (`returned_at IS NOT NULL`). “Open OR due before September 15, 2026” includes all four loans: 101 and 103 are open; 102 and 104 have earlier due dates. The AND version gives only 101.

An empty string is a value, not absence, and is invalid timestamp input here. To define “today,” decide the relevant time zone and whether overdue means a calendar date boundary or a particular instant. The fixture uses a fixed date so these answers do not change tomorrow.

## Lesson 04

The inner-join result has one row per open loan, with member and item labels attached. The left-join result has one row per matching open loan, plus a null-extended row for each member with no match. It is not one row per member: Ada appears twice.

When only the member equality remains in ON, Mina matches her two returned loans. The subsequent WHERE removes both rows; SQL does not invent a replacement null row. Sol has no matching loans at all, so his null-extended row satisfies `returned_at IS NULL`. A fixture where every member has an open loan would hide this bug.

## Lesson 05

COUNT(*) counts the preserved row for Sol. COUNT(l.id) ignores its null loan ID, correctly yielding zero. To count only open loans and retain everyone before filtering groups:

```sql
SELECT m.id, m.name, COUNT(l.id) AS open_loans
FROM members AS m
LEFT JOIN loans AS l
  ON l.member_id = m.id AND l.returned_at IS NULL
GROUP BY m.id, m.name
HAVING COUNT(l.id) >= 1
ORDER BY m.id;
-- 1, Ada, 2
```

Joins, grouped projections, GROUP BY, and HAVING exceed the current compiler grammar. Its supported scalar COUNT does not imply support for this report.

## Lesson 06

Updating only an item's name preserves its ID, category, details, and referencing loan IDs. Deleting item 10 fails while loans reference it under our foreign-key rules. A WHERE clause can match many rows or identify a row the caller does not own. Correct filtering and authorization require separate reasoning.

## Lesson 07

The bound category `audio' OR TRUE --` returns zero rows because no category equals that complete string. Binding keeps the value separate from the statement structure. Interpolation could turn its punctuation into instructions.

For a two-choice sort selector, map `name` and `id` to two reviewed named queries whose ORDER BY clauses are fixed. Reject unknown choices. A placeholder represents a value; it is not a safe way to choose a column identifier.

## Lesson 08

Parsing may fail on malformed YAML. Selecting/normalizing an operation may fail on an unknown resource or method or unsupported shape. Rendering may reject identifiers, operators, or missing write predicates. Executing may fail on database constraints, types, permissions, or connectivity.

A PostgreSQL column's existence says nothing about whether the compiler supports the requested expression. Test emitted SQL as well as result cardinality. Today's ignored `limit` can be characterized by a regression test; a future strict implementation should reject the unsupported property until it implements the operation. A test expecting only successful compilation misses the defect.

## Lesson 09

The script temporarily closes 101 and creates 105 for Mina. Within the transaction the new open loan is visible; after ROLLBACK, 101 is open again and 105 does not exist. Pinning ensures all commands reach one session, but BEGIN and COMMIT/ROLLBACK still need an owner.

Two clients can both observe availability before either inserts. A unique partial index on item ID for open loans can enforce the rule in PostgreSQL; locking an appropriate item row can serialize a larger decision. Test the chosen policy with independent connections. A single-session rollback test proves neither absence of races nor correct retry behavior.

## Lesson 10

A desired schema cannot infer whether a field was renamed or replaced. An explicit rename preserves the relationship to existing values. Refusing a changed checksum protects the meaning of an already-recorded migration version.

An upgrade test starts from the old schema with representative rows, applies the migration, checks preserved values through the new schema, then reruns to check replay behavior. A fresh-database test has no old data to lose. Both are useful and cover different starting states.

## Lesson 11

Reading four rows sequentially may be cheaper than traversing an index and fetching table rows. An index is an option for the planner, not a command. Adding unique `id` to category order resolves ties and supplies a complete page boundary. Pagination support, including a limit and a stable cursor contract, needs compiler design beyond the current grammar.

JSONB containment asks whether a document contains a structure; `details @> '{"portable":true}'::jsonb` finds items 10 and 30. Text extraction such as `details ->> 'inputs'` returns a text value (or null when absent), suitable for display or an explicitly typed comparison. It is not the same operation as structural containment.

## Lesson 12

| Decision | Owner |
|---|---|
| Reject `banana` as an integer ID | Host validation |
| Keep outside values out of SQL structure | Reviewed compiler definitions plus executor parameter binding |
| Reject an orphan loan | Database foreign-key constraint |
| Choose 404 for an absent item | Host HTTP contract |
| Encode the response as JSON | Seltzer response handling |
| Close the pool during shutdown | Host lifecycle calling the adapter |

The embedded tests cover bound query behavior and foreign-key enforcement. HTTP statuses require requests through the application. Pool lifecycle, TLS, and competing network clients require separate integration tests.

## Lesson 13

These are design exercises, so one spelling of YAML is not the answer. A strong submission names its invariants, separates current capabilities from proposals, and demonstrates a counterexample that its tests catch.

## Lesson 14

For the workshop capstone, one registration row can mean one learner's enrollment in one workshop. If repeated enrollment events or cancellation history matter, model that explicitly before adding uniqueness. Include a workshop with no registrations, two learners with the same name, and a cancellation. Count by IDs and state whether cancelled registrations belong in each report. A capacity check also needs a concurrency policy: a successful single-client demo is not proof that the last seat cannot be double-booked.

Keep joined reports as SQL-lab work unless you actually implement and verify the compiler extension. The goal is a defensible model and observable behavior, not a fictional API that looks complete.
