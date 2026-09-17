# 04 — Put related facts together

[Previous](./03-null.md) · [Course](./README.md) · [Next](./05-groups.md)

**Question:** who has which item right now? Allow 60–75 minutes.

**Capability label:** this is a SQL lab. Joins are not emitted by the inspected Nectarine query compiler. A proposed join grammar appears later, clearly marked as a design.

## IDs are enough for storage, not for a useful report

The open-loan rows say member 1 has items 10 and 30. To display names, match member 1 with the member table and each item ID with the item table.

Predict this result before running anything:

| id | borrower | item |
|---:|---|---|
| 101 | Ada | Recorder |
| 103 | Ada | Camera |

Here is the query:

```sql
SELECT l.id, m.name AS borrower, i.name AS item
FROM loans AS l
JOIN members AS m ON m.id = l.member_id
JOIN items AS i ON i.id = l.item_id
WHERE l.returned_at IS NULL
ORDER BY l.id;
```

`l`, `m`, and `i` are aliases: short names used within this query. `AS borrower` names a result column. It does not rename a stored column.

Conceptually, a join pairs rows that meet its ON condition. The planner can use more efficient algorithms than trying every possible pair. [PostgreSQL join tutorial](https://www.postgresql.org/docs/current/tutorial-join.html)

## Count pairs, not just people

Ada appears twice because she has two matching loan events. The join did not accidentally duplicate her. Our chosen result has one row per open loan. This is called its **grain**.

Always ask, “What does one output row mean?” If you expected one row per member but joined every loan, the repeated names are a modeling clue. Adding DISTINCT might hide the symptom without answering the intended question.

An inner join omits rows with no match. That is appropriate for the first question, but not for “list every member and any open loans.”

## Preserve the people with no match

```sql
SELECT m.id, m.name, l.id AS loan_id
FROM members AS m
LEFT JOIN loans AS l
  ON l.member_id = m.id AND l.returned_at IS NULL
ORDER BY m.id, l.id;
```

Predict four result rows:

| id | name | loan_id |
|---:|---|---:|
| 1 | Ada | 101 |
| 1 | Ada | 103 |
| 2 | Mina | NULL |
| 3 | Sol | NULL |

A left join keeps each left-side member, supplying nulls when no eligible loan matches. Mina has historical loans but none open. Sol has never borrowed. This result intentionally treats both as “no current matching loan.”

## ON and WHERE are not interchangeable

Move `l.returned_at IS NULL` from ON to WHERE while joining all loans. Mina now matches her returned loans, then those matched rows fail WHERE. She disappears. Sol has no match and receives a null-extended row, which still passes the null test.

The revised query therefore does not mean “all members and their open loans.” Placement changed the meaning, not merely the optimizer's workload. This is one reason the fixture includes both Mina and Sol.

Run `03-joins.sql`, then make that change in a copy and predict the difference before executing it.

## Developer translation boundary

Do not add `joins:` to a supported Nectarine select object and assume it is honored. Unknown properties are not uniformly rejected in the current compiler, and a query may compile without the intended feature. Inspect the SQL and assert the result.

For production code following the repository's named-query convention, join support needs an explicit compiler extension or another reviewed data-access design. The teaching SQL is not permission to hide raw joins inside an HTTP handler and call them generated queries.

## Checkpoint

State the grain of both results. Explain why Mina disappears in the moved-WHERE version but Sol can remain. What test fixture would fail to reveal this bug?

[Answers](./answers.md#lesson-04)
