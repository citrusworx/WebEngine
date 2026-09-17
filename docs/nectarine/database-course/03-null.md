# 03 — Missing is not false, empty, or zero

[Previous](./02-select.md) · [Course](./README.md) · [Next](./04-joins.md)

**Question:** which loans are still open, and which are overdue? Allow 60 minutes.

## First agree on what missing means

For this model, a null `returned_at` means no return event has been recorded. It does not mean the item was returned at midnight or that the timestamp is the empty string. A different domain may give null a different interpretation, so document your convention.

Predict open loan IDs from the fixture: 101 and 103. This SQL is tempting but wrong:

```sql
SELECT id FROM loans WHERE returned_at = NULL;
```

Ordinary equality involving null produces an unknown result. WHERE keeps rows whose condition is true; unknown does not qualify. Use a null test:

```sql
SELECT id FROM loans WHERE returned_at IS NULL ORDER BY id;
```

This is a distinction in SQL's truth rules, not a quirk of Nectarine. [PostgreSQL comparison and null predicates](https://www.postgresql.org/docs/current/functions-comparison.html)

## Add a second condition

“Overdue” means open **and** due before our fixed evaluation date:

```sql
SELECT id FROM loans
WHERE returned_at IS NULL
  AND due_on < DATE '2026-09-15'
ORDER BY id;
```

Loan 101 qualifies. Loan 103 is open but not due yet. Loan 104 was due earlier but has already been returned. Using OR instead of AND would answer a different question and include returned or not-yet-due loans.

Run `02-null.sql` to see the wrong equality, correct null test, and overdue query as three separate results.

## A tiny truth table

| A | B | A AND B | A OR B |
|---|---|---|---|
| true | unknown | unknown | true |
| false | unknown | false | unknown |
| unknown | unknown | unknown | unknown |

You do not need to memorize every combination immediately. Ask whether available information proves the predicate true, false, or neither. `NOT unknown` remains unknown.

A common later trap is `NOT IN` against a set containing null: the comparison can become unknown instead of proving absence. A carefully correlated `NOT EXISTS` often expresses an absence question more clearly. The course's compiler supports a specific EXISTS shape, not arbitrary SQL subqueries; that broader SQL topic stays in the SQL track.

## Nectarine's supported description

```yaml
where:
  and:
    - { column: returned_at, operator: is_null }
    - { column: due_on, operator: lt, value: $1 }
```

The `Overdue` query binds the date as a value. A caller must still define which date/time zone belongs to the business rule. Here `due_on` is a date. Nectarine's `timestamp` schema token emits PostgreSQL `TIMESTAMPTZ` for `returned_at`; the seed supplies explicit UTC offsets. Inspect that emitted type rather than assuming the YAML token is copied literally. A global lending service must still decide whose local date determines “overdue.”

## Checkpoint

Predict IDs for “returned” and “open OR due before the reference date.” Explain why an empty string in `returned_at` is not a harmless replacement for null. What decision must you make before saying an item is overdue “today”?

[Answers](./answers.md#lesson-03)
