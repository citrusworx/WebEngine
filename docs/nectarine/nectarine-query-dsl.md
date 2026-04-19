# Nectarine Query DSL

Current reference for Nectarine's YAML query DSL.

This document describes the **current SQL-oriented DSL pattern** used by Nectarine for PostgreSQL query definitions. It is intended as a stable working reference while the compiler and validation layers are being built.

## Goals

- Keep SQL intent declarative and config-driven
- Avoid handwritten SQL strings in app code
- Preserve parameterized runtime values such as `$1`, `$2`, etc.
- Give Nectarine a predictable structure that can be validated and compiled

## Design Principles

- Query YAML describes **intent**, not full SQL text
- Runtime values are represented as placeholders such as `$1`
- Operators are normalized to DSL tokens such as `eq`, `gt`, `lte`
- Query shapes should be consistent enough for `buildSQL()` to compile without special cases

## Resource Layout

Each resource currently uses three YAML files:

- `userSchema.yml`: data model and table structure
- `user.yml`: SQL/query DSL definitions
- `userAPI.yml`: API endpoint definitions

## Current Query Shape

The current PostgreSQL DSL is organized by resource name, then CRUD operation, then query name.

```yaml
user:
  get:
    UserById:
      select: ['id']
      from: users
      where:
        column: id
        operator: eq
        value: $1
```

Top-level pattern:

```yaml
resourceName:
  get:
    QueryName: ...
  update:
    QueryName: ...
  create:
    QueryName: ...
  delete:
    QueryName: ...
```

## `get` Queries

Read queries use `select`, `from`, and optional `where`.

```yaml
user:
  get:
    AllUsers:
      select: ['*']
      from: users

    UserByEmail:
      select: ['email']
      from: users
      where:
        column: email
        operator: eq
        value: $1
```

Current fields:

- `select`: array of column names, or `['*']`
- `from`: table name
- `where`: optional predicate object

Current `where` fields:

- `column`: column name
- `operator`: normalized operator token
- `value`: placeholder or literal value

## `update` Queries

Update queries currently separate assignment columns from predicate logic.

```yaml
user:
  update:
    UserById:
      table: users
      set: ['name', 'age', 'updated_at']
      values: [$1, $2, NOW()]
      where:
        column: id
        operator: eq
        value: $3
```

Current fields:

- `table`: target table
- `set`: array of columns to update
- `values`: values corresponding to `set`
- `where`: predicate object

Compilation target:

```sql
UPDATE users
SET name = $1, age = $2, updated_at = NOW()
WHERE id = $3
```

## `create` Queries

Insert queries currently use an `insert` object.

```yaml
user:
  create:
    NewUser:
      insert:
        into: users
        columns: ['email', 'password', 'name', 'created_at']
        values: [$1, $2, $3, NOW()]
```

Current fields:

- `insert.into`: target table
- `insert.columns`: ordered column list
- `insert.values`: ordered value list

Compilation target:

```sql
INSERT INTO users (email, password, name, created_at)
VALUES ($1, $2, $3, NOW())
```

## `delete` Queries

Delete queries currently use `from` plus a required `where`.

```yaml
user:
  delete:
    User:
      from: users
      where:
        column: id
        operator: eq
        value: $1
```

Compilation target:

```sql
DELETE FROM users
WHERE id = $1
```

## Operator Tokens

Current operator tokens:

| DSL token | SQL operator |
|----------|--------------|
| `eq` | `=` |
| `neq` | `!=` |
| `gt` | `>` |
| `gte` | `>=` |
| `lt` | `<` |
| `lte` | `<=` |

These tokens should be translated by the compiler rather than written as raw SQL in YAML.

## Values and Placeholders

Nectarine currently uses positional placeholders for runtime values:

- `$1`
- `$2`
- `$3`

These are intended to be passed separately to the database adapter as query parameters.

Example:

```yaml
where:
  column: email
  operator: eq
  value: $1
```

This should compile into SQL plus params, not string interpolation.

## Allowed SQL-ish Literals

The current DSL examples also use SQL function literals such as `NOW()`.

Example:

```yaml
values: [$1, NOW()]
```

Current expectation:

- placeholders like `$1` are runtime parameters
- literals like `NOW()` are compiler-approved SQL fragments

This area is still evolving. A future version may formalize functions such as:

```yaml
values:
  - $1
  - { fn: now }
```

## Current Example

This reflects the current working pattern in `libraries/nectarine/schemas/user/db/pg/user.yml`.

```yaml
user:
  get:
    UserByAge:
      select: ['id', 'name']
      from: users
      where:
        column: age
        operator: gt
        value: $1

    AllUsers:
      select: ['*']
      from: users

    UserById:
      select: ['id']
      from: users
      where:
        column: id
        operator: eq
        value: $1

  update:
    UserById:
      table: users
      set: ['name', 'age', 'updated_at']
      values: [$1, $2, NOW()]
      where:
        column: id
        operator: eq
        value: $3

  create:
    NewUser:
      insert:
        into: users
        columns: ['email', 'password', 'name', 'created_at']
        values: [$1, $2, $3, NOW()]

  delete:
    User:
      from: users
      where:
        column: id
        operator: eq
        value: $1
```

## Known Constraints

This document describes the **current** DSL, not the final one.

Current limitations:

- `where` currently models a single predicate object
- joins are not yet modeled
- grouping, ordering, limits, and pagination are not yet formalized here
- SQL functions such as `NOW()` are still represented as raw fragments
- there is not yet a strict validation layer enforcing identifier and shape safety

## Next Step

The next engineering step is to lock this DSL into TypeScript types and compile it through `buildSQL()` rather than treating it as loose YAML objects.
