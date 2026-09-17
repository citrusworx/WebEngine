# 05 — Count the right thing, including zero

[Previous](./04-joins.md) · [Course](./README.md) · [Next](./06-writes.md)

**Question:** how many historical loans has each member made? Allow 60 minutes.

## Choose a new grain

The previous report had one row per loan. This report needs one row per member. Grouping combines rows into groups and calculates facts about each group.

Predict Ada 2, Mina 2, Sol 0. The report must retain a person with no loans, so begin with a left join:

```sql
SELECT m.id, m.name, COUNT(l.id) AS total_loans
FROM members AS m
LEFT JOIN loans AS l ON l.member_id = m.id
GROUP BY m.id, m.name
ORDER BY m.id;
```

`COUNT(l.id)` counts non-null loan IDs. `COUNT(*)` counts result rows. Sol's left join contributes one null-extended row: COUNT(*) would report one even though there is no loan. This is a useful bug to predict by hand.

The first query in `04-groups.sql` prints both counts beside each other. Look for the disagreement in Sol's row.

## Group identity by ID, not merely by name

Two members named Ada should not be merged into one report bucket. Grouping on member identity preserves that distinction. Including the displayed name explicitly also makes the query's intent easy to read.

The original rows remain in the database. GROUP BY changes the shape of this answer. It does not compress the storage table into summaries.

## Filter rows before groups or groups afterward

```sql
SELECT member_id, COUNT(*) AS total
FROM loans
GROUP BY member_id
HAVING COUNT(*) >= 2
ORDER BY member_id;
```

WHERE decides which input rows participate. HAVING decides which aggregated groups survive. A condition about the final count belongs after the count is defined at the group level. [PostgreSQL grouping and HAVING](https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-GROUP)

To count only open loans, filter `returned_at IS NULL` before grouping. But if your question includes members with zero open loans, return to the member-preserving join and place the open-loan condition in ON as in Lesson 4.

## Aggregates have empty-set behavior

Counting no qualifying rows gives zero. Other aggregates, such as SUM over an empty set, can produce null. Decide whether your report should show null or a chosen replacement such as zero. Do not change a missing measurement into zero merely because zero is convenient for the UI.

As you add joins, counts can grow unexpectedly. Joining a member's loans and independent member tags can multiply combinations. Fix the grain before aggregating; an apparently plausible total is not evidence that the joins are correct.

## What Nectarine can do now

The compiler supports a scalar COUNT query:

```yaml
CountOpen:
  select: [{ fn: count, as: total }]
  from: loans
  where: { column: returned_at, operator: is_null }
```

This produces one total for the filtered input, not a report grouped by member. The inspected compiler rejects mixed COUNT and ordinary selected columns and does not emit GROUP BY or HAVING. A future grouped grammar needs to validate those relationships rather than treating every select expression as an unrelated string.

Drivers can represent PostgreSQL large integer counts differently in JavaScript. Tests normalize these small fixture counts with `Number(...)`; a real system must consider precision before coercing arbitrarily large values.

## Checkpoint

Why does COUNT(*) give Sol one in the left-join report? How would you ask for members with at least one open loan? Which part of that report is outside today's Nectarine compiler?

[Answers](./answers.md#lesson-05)
