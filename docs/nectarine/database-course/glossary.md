# Vocabulary you can use

[Course](./README.md)

| Term | Meaning in this course |
|---|---|
| Database | Stored facts together with an engine that queries and protects them. |
| Table | Facts organized into rows with defined columns. |
| Row grain | Exactly what one row represents: one person, physical item, or loan event. |
| Schema | Definitions of tables, fields, and rules; PostgreSQL also uses this word for a namespace. |
| Type | The kind of value a column or expression accepts. |
| Primary key | The unique, non-null identity of a row. |
| Foreign key | A rule requiring a reference to identify an existing related row. |
| Constraint | A database-enforced rule about allowed state. |
| Normalization | Organizing facts to reduce redundant copies and inconsistent updates. |
| NULL | An absent or unknown value, distinct from zero and empty text. |
| Predicate | A condition used to choose matching rows. |
| Projection | The columns or expressions selected for the result. |
| Join | Combining rows using a relationship condition. |
| Left join | Keeping every left-side row, supplying nulls if nothing on the right matches. |
| Aggregate | A calculation across rows, such as COUNT or SUM. |
| GROUP BY | Defining which rows contribute to each aggregate result. |
| HAVING | Filtering groups after grouping. |
| Parameter | A value supplied separately from a statement's structure. |
| Placeholder | A statement position such as `$1` where a parameter belongs. |
| Identifier | A structural name such as a table or column name. |
| DSL | A limited language for describing a domain; Nectarine uses YAML query descriptions. |
| Compiler | Code translating an accepted description into executable statements. |
| Adapter | Code connecting application operations to a particular database driver. |
| Pool | Reusable database connections managed for multiple operations. |
| Pinned connection | One reserved connection used throughout a unit of work. |
| Transaction | A unit of database work with explicit completion or rollback semantics. |
| Atomicity | Committing all a transaction's changes together or none of them. |
| Isolation | Rules governing what concurrent transactions can see and how they interact. |
| Invariant | A condition that must remain true across every permitted operation. |
| Migration | An explicit change from an existing database shape to another. |
| Ledger | The record of applied migration versions and checksums. |
| Checksum | A fingerprint used to detect changed migration content. |
| DDL | Statements defining or changing database structure, such as CREATE and ALTER. |
| Index | An additional structure that can make some lookups faster at storage and write cost. |
| Query plan | The engine's chosen strategy for executing a query. |
| Cursor/keyset page | A page selected after a particular ordered boundary. |
| JSONB | PostgreSQL's binary representation of JSON, with structural query operators. |
| Fixture | A known dataset used to make examples and tests repeatable. |

When a term seems abstract, attach it to a fixture fact: `loans.item_id` is a foreign key; “one physical item has at most one open loan” is an invariant that our initial schema does not yet enforce.
