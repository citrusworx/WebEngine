# 01 — Decide what one row means

[Previous](./00-workbench.md) · [Course](./README.md) · [Next](./02-select.md)

**Question:** how do we record lending without losing history? Allow 45–60 minutes.

## Begin with facts, not tables

Write three sentences: “Ada is a member.” “The recorder is an item.” “Ada borrowed the recorder in a particular borrowing event.” Those are different kinds of facts. If you put everything into one row and overwrite the borrower whenever an item moves, you erase earlier events.

We use a member row for a person, an item row for an object, and a loan row for an event connecting them. A table is a collection of similarly shaped facts. A schema describes their structure and permitted values.

JavaScript objects can also hold facts, but a database adds shared query execution, integrity rules, transactions, and storage machinery. Persistence alone is not the whole reason to use one: a JSON file can persist without supplying those other guarantees.

## Identity should survive a spelling change

The member's `id` is their primary key. Their name is a label. If Ada changes her display name, loan 101 should still refer to the same member. Its `member_id` therefore stores 1, not a copy of `Ada` as the connection.

A primary key prevents duplicate identities and null identity values. A foreign key requires a referenced identity to exist. A unique constraint on email states a different rule: two members cannot use the same email under this database's comparison behavior. None of these proves the email belongs to that person. [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)

Predict what happens if a loan points to member 999. The database rejects the write rather than creating a dangling reference. That protects the rule even if a caller bypasses the HTTP server.

## Draw the relationships

```text
members.id  <-- loans.member_id
items.id    <-- loans.item_id

One member can have many loan events.
One item can appear in many historical loan events.
Each loan references one member and one item.
```

The arrows describe references, not copies. A query can later combine these facts. That is what joins do.

This separation avoids update anomalies. If a member's email were copied into every loan row, changing it might require many coordinated updates. Keeping one authoritative member record reduces the ways those copies can disagree. Normalization is the practice of choosing structures that reduce such redundancy, not a command that automatically designs your domain.

## Express a piece in SQL and YAML

The SQL idea is:

```sql
CREATE TABLE members (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);
```

The implemented Nectarine description is:

```yaml
Member:
  table: members
  fields:
    id: int PRIMARY KEY
    name: text NOT NULL
    email: text NOT NULL UNIQUE
```

The lab uses the latter and asks `CCompiler.buildDdl` to emit schema SQL. Nectarine's compiler is not the database: the database still enforces the resulting constraints.

Inspect the printed DDL with `node docs/nectarine/database-course/lab/compile.mjs`. Find the loan foreign keys. The compiler orders table creation using references so parents can exist before dependents.

## Challenge your model

Is one item row a product model or one physical unit? In this course it means one physical unit. If the library owns three identical recorders, give them separate identities. Otherwise two simultaneous loans of “Recorder” are impossible to reason about accurately.

Likewise, not-null only rejects null. An empty string can still fit a required text column. Database constraints and application validation answer overlapping but different questions.

## Checkpoint

Explain why two members can share a name but not an ID. Identify the redundancy introduced by copying a member email into every loan. State one business rule our schema does not yet enforce.

[Answers](./answers.md#lesson-01)
