# 13 — Design the compiler and runtime you wish you had

[Previous](./12-integration.md) · [Course](./README.md) · [Next](./14-capstone.md)

**Goal:** turn a database question that today's library cannot fully express into a precise, testable feature proposal. Allow 90–150 minutes for one design.

All candidate APIs on this page are **proposed**, not supported syntax, not a release schedule, and not features implemented by this course. Start with observable behavior, then choose a representation. Do not start by adding a convenient YAML key and hoping its meaning becomes clear later.

## A. Strict query shapes and useful diagnostics

**Observed problem:** a canonical select containing `limit: 1` currently emits an unbounded SELECT. A reader can mistake a successfully compiled query for a supported feature.

**Proposed contract:** reject unknown keys before compilation, with resource name, CRUD method, query name, offending property, and a useful suggestion. Normalize supported alternate spellings first, then validate against one explicit intermediate representation. Avoid rejecting a legitimate legacy alias merely because it is not canonical.

Strictness should cover nested keys too. Misspelling `operator` or adding a string fragment where a structured identifier is expected should not silently change behavior. Errors should report location without echoing credentials or runtime values.

**Compatibility decision:** a strict default will break configurations that previously carried ignored metadata. Introduce a documented metadata namespace or a versioned strict mode, rather than making arbitrary unknown properties meaningful by accident.

**Acceptance tests:** unknown top-level and nested keys fail; canonical and supported legacy queries still compile; an unknown limit never produces executable unbounded SQL; diagnostics identify the operation; runtime values never appear in compiler errors.

## B. Joins, grouping, and an explicit result shape

**Observed problem:** “loan count by member including zero” needs joins and grouping that the current compiler does not emit.

A candidate representation, **not valid current Nectarine**, could be:

```yaml
# PROPOSED ONLY
MemberLoanCounts:
  from: { table: members, as: m }
  joins:
    - kind: left
      table: loans
      as: l
      on: { leftColumn: m.id, operator: eq, rightColumn: l.member_id }
  select:
    - { column: m.id, as: member_id }
    - { column: m.name, as: member_name }
    - { aggregate: count, column: l.id, as: total }
  groupBy: [m.id, m.name]
  orderBy: [{ column: m.id, direction: ASC }]
```

Separate a column reference from a runtime bind. In an ON condition, `l.member_id` is another column, not a string value to quote as text. Allowlist join kinds, verify aliases, and reject ambiguous output column names. A join that compiles but silently overwrites two returned `name` fields is not a complete design.

Grouping needs semantic validation: selected non-aggregate expressions must be legal at the chosen grain. Decide whether the compiler relies on database functional-dependency rules or enforces a simpler portable rule. HAVING needs expression types distinct from a row-level WHERE.

**Rejected shortcut:** raw SQL fragments for joins. They bypass the closed grammar and undermine identifier/bind handling precisely where expressions become more complex.

**Acceptance tests:** the four-row left join preserves Mina and Sol; grouped counts produce 2/2/0; predicates in ON remain in ON; invalid aliases fail; self joins use distinct aliases; output names are stable; values remain bound; MySQL/PostgreSQL support is separately tested or explicitly gated.

## C. Bounded reads and cursor contracts

**Observed problem:** an application can ask for every row accidentally; pagination properties are not yet compiled.

Start with the promised behavior: a maximum page size, a deterministic sort, and a continuation token tied to the query's filter and ordering. Then choose YAML syntax for limit and cursor input. Do not merely pass user-controlled text into LIMIT or ORDER BY.

For keyset pagination, a cursor must include every ordering component, including a unique tie-breaker. Validate types, direction, null positioning, and query identity. Opaque encoding is not tamper protection; decide whether the host signs cursors or treats them as untrusted parsed input.

Adding pagination also changes the response contract. Is there one extra fetched row to determine `hasMore`? Is a total count required, optional, or deliberately omitted because it can be costly? How do deletes or changing sort keys affect continuation?

**Acceptance tests:** zero/negative/excessive limits handled deliberately; duplicate sort values do not skip records; a forged cursor is rejected or safely validated; filters cannot be changed while reusing an incompatible cursor; declared bounds appear in SQL and hold on execution.

**Compatibility:** never silently impose a new default on existing exports intended to retrieve all rows. Version the behavior or require explicit bounded and bulk-read modes.

## D. A transaction owner with an honest name

**Observed problem:** `PgSql.withTransaction` pins a client but does not own transaction boundaries. Ordinary app authors can infer stronger guarantees from the name than it supplies.

One proposed public shape is:

```ts
// PROPOSED ONLY: not an available Nectarine API.
await repository.transaction(async tx => {
  await tx.execute("loan.update.MarkReturned", [returnedAt, oldLoanId]);
  await tx.execute("loan.create.NewLoan", [newId, memberId, itemId, dueDate]);
});
```

The owner begins once on a pinned connection, commits on successful callback completion, rolls back on failure, and releases exactly once. The executor passed into the callback must stay pinned; accidentally calling a pool-level method inside should be difficult or detectable.

Decide nested behavior explicitly: reject nesting, join the outer transaction, or use savepoints with documented semantics. Do not casually nest BEGIN statements. Decide how isolation levels, deadlines, and cancellation are requested and validated.

A rollback failure must not replace the original application error without preserving it. A damaged connection should not be returned as healthy. If serialization failures are retried, define which callback side effects are safe to repeat; a sent email is not rolled back.

**Compatibility:** retain the existing migrator's pinned-session protocol until it is intentionally migrated. Adding automatic BEGIN to the existing helper without checking callers could create conflicting transaction owners.

**Acceptance tests:** second write failure restores the first; both statements use the same connection; begin/commit/rollback errors release resources correctly; nested calls follow the stated policy; concurrent borrowers are tested on separate real server connections.

## E. Schema invariants beyond basic fields

**Observed problem:** our current schema permits two open loans for one physical item. PostgreSQL can enforce a uniqueness condition on a subset of rows, but the course does not assume the current schema grammar expresses it.

The database-level target is a unique partial index on item ID where the return timestamp is null. This constrains the stored state even when callers race. [PostgreSQL partial indexes](https://www.postgresql.org/docs/current/indexes-partial.html)

A future schema grammar should represent composite constraints, partial predicates, and relevant index methods as structured data. It should distinguish portability from feature availability. A PostgreSQL-only invariant should fail clearly when targeting a dialect that cannot implement the chosen semantics, not degrade into an ordinary non-unique index.

Before applying the new constraint, scan for existing violations and define a repair process. A schema upgrade should not arbitrarily delete duplicate open loans to make the index succeed.

**Acceptance tests:** two simultaneous attempts yield one accepted open loan under the chosen application flow; returned history remains permitted; existing invalid data causes a clear migration failure; capability checks prevent false cross-database guarantees.

## F. Migration locking, previews, and dialect capabilities

**Observed problem:** a migration ledger records history, but that alone does not coordinate two deployers or prove every dialect has identical DDL semantics.

Propose a runner-level lock acquired on a pinned session, with a defined timeout and cleanup policy. PostgreSQL advisory locks are one possible implementation. State whether the lock is session-level or transaction-level, what key identifies the database/schema, and how recovery works after a killed process. A lease table is an alternative with its own expiry/clock considerations.

A preview should show the ordered statements, classified effects, and required capabilities without mutating the target. It should distinguish “will create a missing table” from “will rewrite a populated column,” and report when actual catalog state is required to know the outcome.

Track explicit adapter capabilities for RETURNING, conflict syntax, transactional DDL, JSON operations, and affected-row semantics. Placeholder rewriting is not a declaration that every statement is portable. Test the emitted form on each advertised engine.

**Acceptance tests:** one of two concurrent runners waits or fails clearly; a lock is released on success and failure; edited migrations still fail checksum checks; preview performs no writes; a PostgreSQL DDL rollback test is not reused as proof of MySQL atomicity; unsupported features fail before mutation.

## Choose a sequence based on observed risk

For this codebase I would evaluate strict query validation and transaction API clarity first: both prevent misleading success. Bounded reads follow closely. Join/group support is valuable once its result-shape and dialect contracts are explicit. Migration coordination should be addressed before allowing independent deployers to race.

This is a reasoned course recommendation, not an approved project roadmap. Pick one feature, write down a concrete bad outcome it prevents, and specify tests another developer can implement without guessing your intent.

[Review guidance](./answers.md#lesson-13)
