# 06 — A write changes facts, not just a screen

[Previous](./05-groups.md) · [Course](./README.md) · [Next](./07-parameters.md)

**Question:** how do we add equipment, correct a label, and record a return? Allow 60–75 minutes.

## Predict the before and after

A read returns a representation. A write changes stored state. Before writing a statement, identify the rows it should affect and the facts that should remain unchanged.

```sql
INSERT INTO items (id, name, category, details)
VALUES (50, 'Headphones', 'audio', '{}')
RETURNING id, name;

UPDATE items SET name = 'Studio headphones'
WHERE id = 50
RETURNING id, name;

DELETE FROM items WHERE id = 50 RETURNING id;
```

INSERT creates one item. UPDATE changes its name while preserving identity. DELETE removes that row. The `06-writes.sql` lab surrounds the experiment with a transaction and rollback, then verifies the original four items remain.

RETURNING is a PostgreSQL feature that returns affected rows. It is not a separate SELECT issued by your application. Nectarine's current INSERT compiler supports RETURNING, but its UPDATE and DELETE emitters do not emit it. Learn the SQL capability without assuming feature parity in the compiler.

## What protects a write?

The primary key rejects a duplicate ID. The member email constraint rejects a duplicate email. A loan's foreign key rejects an unknown item. A required field rejects null. These checks occur in the database, regardless of which client issued the statement.

Try to delete an item still referenced by historical loans. Our schema's foreign key prevents it. A UI's “delete” button cannot decide the referential policy by itself. You might instead retire the item, retain history, or deliberately choose a reviewed cascade policy in another design.

## Nectarine requires a write predicate, but that is not authorization

For recording a return:

```yaml
loan:
  update:
    MarkReturned:
      table: loans
      set: [returned_at]
      values: [$1]
      where: { column: id, operator: eq, value: $2 }
```

The host passes `[returnTimestamp, loanId]`. The order is part of the named operation's contract. Swapping values is not fixed by valid YAML.

The current compiler refuses UPDATE and DELETE without a WHERE clause. This is a helpful guard, but a broad predicate can still affect many rows. A predicate also does not prove the caller owns those rows. A production operation might include a member or tenant predicate as well as the record ID.

An affected-row count of zero is not necessarily an error from the database. It may mean the target no longer exists or an optimistic concurrency condition did not match. The host must translate that outcome into its application contract.

## Upserts do not remove the need for a model

Nectarine supports an INSERT conflict target with `DO NOTHING` or a constrained update using EXCLUDED values. `EnsureItem` in the lab uses `DO NOTHING` on item ID.

The conflict target needs an appropriate unique constraint or index. “Ensure this ID exists” is different from “overwrite the record with my submitted values.” Retrying a create after a lost response still needs an explicit identity/idempotency policy; conflict handling should not accidentally overwrite someone else's data.

## Developer experiment

Run the write file. Then use the named `NewItem`, `MarkReturned`, and delete queries in tests. Observe both returned rows and the subsequent state. A compiler-output assertion alone cannot prove foreign keys or uniqueness are enforced by an engine.

## Checkpoint

What stays unchanged when updating an item's name? Why might a delete fail even with a correct ID? Explain why “has WHERE” does not mean “affects one authorized row.”

[Answers](./answers.md#lesson-06)
