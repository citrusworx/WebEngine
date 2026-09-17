# 09 — An operation can require several statements

[Previous](./08-compiler.md) · [Course](./README.md) · [Next](./10-migrations.md)

**Question:** how do we return the recorder from Ada and lend it to Mina without recording half a transfer? Allow 75–90 minutes.

## Think in terms of a business operation

The transfer requires marking loan 101 returned and creating loan 105. If the second statement fails because Mina's ID is wrong, leaving only the first change is misleading. A transaction groups these writes so the work can commit together or roll back.

The `07-transaction.sql` lab demonstrates the idea:

```sql
BEGIN;
UPDATE loans SET returned_at = TIMESTAMPTZ '2026-09-15 12:00:00+00'
WHERE id = 101;
INSERT INTO loans (id, member_id, item_id, due_on)
VALUES (105, 2, 10, DATE '2026-09-25');
ROLLBACK;
```

The teaching script includes a read before rollback and another afterward. Predict 105/Mina inside the transaction and 101/Ada after rollback. The test suite also causes a real foreign-key error on the second write and verifies the first change is rolled back. [PostgreSQL transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)

## “All or nothing” is not the whole concurrency story

Atomicity addresses partial completion. Isolation addresses what concurrent transactions can observe and how their operations interact. Two callers can both read “no open loan,” then both try to insert one. Wrapping each caller's work in a transaction does not automatically enforce the missing business rule.

Our initial schema does not prevent two open loans for one item. PostgreSQL can express that invariant using a unique partial index on item ID where `returned_at IS NULL`. A design can also lock an appropriate row while making decisions. The correct choice depends on the operation and isolation policy; a read-then-write precheck alone is insufficient.

The embedded lab is useful for rollback semantics. It is not a multi-client lock-contention test environment. Claims about concurrent borrowers need integration tests with independent network connections.

## A pool is not one connection

Pool-level queries can run on different connections. Sending BEGIN with one pool query and later statements with unrelated pool queries does not reliably create one transaction. Transactional work must use one checked-out client. [node-postgres transaction guidance](https://node-postgres.com/features/transactions)

This matters when reading Nectarine's API. Its PostgreSQL `withTransaction(work)` **pins and releases a client**, but does not itself issue BEGIN, COMMIT, or ROLLBACK. The migration runner sends those commands through the pinned callback. The method name alone would be a misleading guide to behavior.

For ordinary application transactions, do not pretend a callback automatically rolls back. Use an explicitly reviewed transaction-owning layer. Our lab tests use PGlite's transaction callback, whose semantics are different, and do not present it as an existing Nectarine application API.

## Constraint failure changes the control flow

After an error within a PostgreSQL transaction, the transaction is normally in an aborted state until rollback, unless a savepoint-based recovery was deliberately arranged. Catching a JavaScript exception does not itself repair the database transaction.

Release resources in `finally`, but do not confuse release with rollback. A healthy reusable connection should not return to the pool with an accidental open or aborted transaction.

## Recovery versus reversal

Rollback affects uncommitted transactional work. It does not undo an email already sent or an external payment request. A database transaction cannot make arbitrary external side effects atomic. Later application designs may need an outbox or explicit compensation; those are outside this beginner lab's implementation.

## Checkpoint

Predict the transfer script's before/after results. Explain why a pinned connection is necessary but not sufficient for a transaction. Describe the race in “check availability, then insert,” and name what additional invariant or locking decision would close it.

[Answers](./answers.md#lesson-09)
