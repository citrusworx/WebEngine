# 10 — Change the shape without losing the meaning

[Previous](./09-transactions.md) · [Course](./README.md) · [Next](./11-performance-json.md)

**Question:** how do we rename a column when a database already contains facts? Allow 60–90 minutes.

## A fresh schema and an existing database are different starting points

Changing `nickname` to `handle` in today's schema file describes the desired shape for a new database. It does not necessarily tell an existing database where its old values should go. Was the old column renamed, removed, or replaced with unrelated data?

A migration records that intention explicitly. “Rename nickname to handle” is more informative than a silent diff that guesses from two snapshots.

For the course's separate `profiles` exercise table, the current migration grammar is:

```yaml
version: "001_profile_handle"
operations:
  - renameColumn:
      table: profiles
      from: nickname
      to: handle
```

Nectarine compiles it to an ALTER statement. The execution test creates a profile containing Ada, runs the migration, then reads Ada through the new column name. This checks data preservation, not merely a changed schema label.

## A ledger makes repeat runs understandable

The migrator records version and checksum in a ledger. An already-applied unchanged migration is skipped. Editing an applied migration under the same version causes a checksum mismatch rather than silently rewriting history.

Keep old applied migrations immutable. Add a new migration for a new change. A version label is an ordered identifier, so use consistent sortable names such as zero-padded numeric prefixes. Do not rely on unpadded numeric strings to sort like numbers.

## Read the actual execution order

The current runner creates its ledger, creates missing tables from the current schema, applies pending versioned operations, performs additive PostgreSQL columns, then creates indexes. Index creation comes after changes that may rename their referenced columns.

This is not a general automatic schema-diff engine. Existing types and constraints are not all reconciled just because a CREATE TABLE includes IF NOT EXISTS. A passing bootstrap against a fresh database is therefore weaker evidence than an upgrade test from a representative old database.

Per-migration operations and ledger insertion run within a transaction on the PostgreSQL pinned connection path. The whole bootstrap sequence is not described as one global atomic migration. If you provide a custom executor, its connection semantics matter.

## Destructive intent must be explicit

The current migration compiler gates drops and type changes using explicit destructive declarations and operation confirmation tokens. The runner can also protect named columns from modification. These mechanisms record intent; they are not a backup or proof that a type conversion will succeed for existing rows.

A text-to-number conversion needs testing against real representative values. “All samples looked numeric” is weaker than checking every relevant row in a rehearsal database. A failing ALTER may also hold locks or affect availability before failing.

MySQL DDL has different transactional behavior: some operations implicitly commit, so an earlier change may remain after a later operation fails. Do not promise PostgreSQL rollback behavior for every adapter.

## What is not yet solved

Do not assume automatic down migrations, deployment-wide locks, perfect drift detection, or zero-downtime compatibility. The course's future-design lesson proposes a migration lock and a preview/rehearsal contract instead of implying those capabilities exist.

Operational recovery requires a tested backup/restore plan. Application rollout may need an expand-and-contract sequence: add a compatible field, migrate data and readers, then remove the old field in a later deployment.

## Checkpoint

Explain why updating a schema file alone may not preserve nickname data. Why refuse an edited applied migration? What test would distinguish a successful fresh installation from a successful upgrade?

[Answers](./answers.md#lesson-10)
