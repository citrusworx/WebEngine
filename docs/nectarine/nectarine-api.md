# Nectarine API Reference

Complete API reference for Nectarine config, schemas, queries, and host integration.

## Table of Contents

- [Schema Definition](#schema-definition)
- [Query Types](#query-types)
- [API Routes](#api-routes)
- [Field Types](#field-types)
- [Core Functions](#core-functions) (`loadNectarineConfig`, `listApiOperations`, `applyMigrations`, hosting with Seltzer)
- [TypeScript Types](#typescript-types)

---

## Schema Definition

### Schema Structure

```yaml
ModelName:
  table: table_name              # Database table name
  description: "Model description"
  fields:
    fieldName: dataType
  relationships:
    relationshipName: RelatedModel
```

### Example: User Schema

```yaml
User:
  table: users
  description: "User accounts with authentication"
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    username: VARCHAR(100) UNIQUE NOT NULL
    email: VARCHAR(100) UNIQUE NOT NULL
    password: VARCHAR(255) NOT NULL
    first_name: VARCHAR(50)
    last_name: VARCHAR(50)
    role: enum(admin, author, user) DEFAULT 'user'
    is_active: boolean DEFAULT true
    created_at: timestamp DEFAULT NOW()
    updated_at: timestamp DEFAULT NOW()
  relationships:
    posts: Post[]
    comments: Comment[]
```

---

## Field Types

### Numeric Types

| Type | Range | Use Case |
|------|-------|----------|
| `int` | -2^31 to 2^31-1 | IDs, counts, integers |
| `bigint` | -2^63 to 2^63-1 | Large numbers, timestamps |
| `smallint` | -32,768 to 32,767 | Small integers |
| `float` | Floating point | Decimals, measurements |
| `decimal(p,s)` | Precise decimals | Money, percentages |

### Text Types

| Type | Characteristics | Use Case |
|------|-----------------|----------|
| `VARCHAR(n)` | String up to n chars | Names, emails, usernames |
| `char(n)` | Fixed-length string | Codes, abbreviations |
| `text` | Unlimited text | Descriptions, content |
| `string` | Auto VARCHAR(255) | Generic text fields |

### Date/Time Types

| Type | Format | Use Case |
|------|--------|----------|
| `date` | YYYY-MM-DD | Birth dates, events |
| `time` | HH:MM:SS | Time of day |
| `timestamp` | YYYY-MM-DD HH:MM:SS | Created/updated times |
| `datetime` | YYYY-MM-DD HH:MM:SS | Date and time together |

### Boolean Type

| Type | Values | Use Case |
|------|--------|----------|
| `boolean` | true/false | Flags, active status |

### Enum Type

```yaml
# Define fixed set of values
role: enum(admin, author, user, guest)
status: enum(active, inactive, pending)
priority: enum(high, medium, low)
```

### Special Modifiers

| Modifier | Description | Example |
|----------|-------------|---------|
| `PRIMARY KEY` | Unique identifier | `id: int PRIMARY KEY` |
| `UNIQUE` | Unique constraint | `email: VARCHAR(100) UNIQUE` |
| `NOT NULL` | Required field | `name: VARCHAR(50) NOT NULL` |
| `DEFAULT value` | Default value | `role: enum(...) DEFAULT 'user'` |
| `AUTO_INCREMENT` | Auto-increment ID | `id: int PRIMARY KEY AUTO_INCREMENT` |
| `FOREIGN KEY` | Reference another table | `author_id: int FOREIGN KEY REFERENCES users(id)` |

---

## Query Types

### SELECT (Read)

```yaml
queries:
  getAllUsers:
    type: SELECT
    table: users
    fields: '*'  # Or specific fields
    where: optional_condition
    join: optional_join
    orderBy: id DESC
    limit: 100
```

**Example**:
```yaml
getAllUsers:
  type: SELECT
  table: users
  fields: [id, username, email, role]
  orderBy: created_at DESC

getUserById:
  type: SELECT
  table: users
  fields: '*'
  where: id = $1

getActiveUsers:
  type: SELECT
  table: users
  fields: '*'
  where: is_active = true
  orderBy: username ASC

countUsers:
  type: SELECT
  table: users
  count: true

emailExists:
  type: SELECT
  table: waitlist
  exists: true
  where: email = $1
```

`join` and `limit` in older examples are **not compiled**. Use `count: true` / `exists: true` / JSONB `payload->>'key'` instead of host SQL.

### INSERT (Create)

```yaml
queries:
  createUser:
    type: INSERT
    table: users
    fields: [username, email, password]
    returning: id, username, email
```

**Example**:
```yaml
createUser:
  type: INSERT
  table: users
  fields: [username, email, password, role]
  returning: '*'

createPost:
  type: INSERT
  table: posts
  fields: [title, content, author_id]
  returning: [id, title, created_at]
```

### UPDATE (Modify)

```yaml
queries:
  updateUser:
    type: UPDATE
    table: users
    fields: [username, email, role]
    where: id = $1
    returning: '*'
```

**Example**:
```yaml
updateUser:
  type: UPDATE
  table: users
  where: id = $1
  fields: [username, email, first_name, last_name]
  returning: '*'

updateUserRole:
  type: UPDATE
  table: users
  where: id = $1
  fields: [role]
  returning: [id, username, role]

activateUser:
  type: UPDATE
  table: users
  where: id = $1
  fields: [is_active]
```

### DELETE (Remove)

```yaml
queries:
  deleteUser:
    type: DELETE
    table: users
    where: id = $1
    returning: id
```

**Example**:
```yaml
deleteUser:
  type: DELETE
  table: users
  where: id = $1
  returning: '*'

deleteUserPosts:
  type: DELETE
  table: posts
  where: author_id = $1
```

---

## API Routes

### Route Structure

```yaml
modelName:
  operationType:     # read, create, update, delete
    queryName:       # Name from queries.yml
      api:
        method: HTTP_METHOD
        endpoint: /path/:param
        middleware: []
        validation: true
```

### HTTP Methods

| Method | Purpose | Query Type | Use Case |
|--------|---------|-----------|----------|
| `GET` | Retrieve data | SELECT | Fetch single record/list |
| `POST` | Create data | INSERT | New record |
| `PUT` | Replace data | UPDATE | Full update |
| `PATCH` | Partial update | UPDATE | Partial update |
| `DELETE` | Remove data | DELETE | Delete record |

### Route Examples

```yaml
user:
  read:
    allUsers:
      api:
        method: GET
        endpoint: /users
    
    userById:
      api:
        method: GET
        endpoint: /users/:id
    
    userByEmail:
      api:
        method: GET
        endpoint: /users/search/:email

  create:
    newUser:
      api:
        method: POST
        endpoint: /users
  
  update:
    updateUser:
      api:
        method: PUT
        endpoint: /users/:id
    
    activateUser:
      api:
        method: PATCH
        endpoint: /users/:id/activate
  
  delete:
    deleteUser:
      api:
        method: DELETE
        endpoint: /users/:id
```

### Route Parameters

**Path Parameters** (in URL):
```yaml
endpoint: /users/:id          # Single parameter
endpoint: /posts/:id/comments # Multiple
endpoint: /search/:query      # Search term
```

**Query Parameters** (in query string):
```yaml
# GET /users?page=1&limit=10&sort=created_at

# Defined in query YAML:
limit: 10
offset: $query.offset
orderBy: $query.sort
```

---

## Core Functions

### loadNectarineConfig()

Load a project `nectarine.config.yaml`, resolve resource paths, parse resource triads, and resolve vendor database credentials from env key names declared in YAML.

This is the supported config entrypoint. Apps should not write their own YAML bootstrap helpers.

**Signature**:
```typescript
function loadNectarineConfig(
  configPath: string,
  options?: {
    env?: NodeJS.ProcessEnv;
    loadResources?: boolean;
  }
): NectarineConfig
```

**Example**:
```typescript
import { loadNectarineConfig } from "@citrusworx/nectarine";

const config = loadNectarineConfig("./nectarine.config.yaml");
const creds = config.resolveCredentials(); // uses PG_* / MS_* / MG_* from YAML
const product = config.getResource("product");
const app = config.getAppBySubdomain("courses");
```

Also available as `@citrusworx/nectarine/config`.

### loadSchema() / loadYaml()

Load and parse a single YAML file.

**Signature**:
```typescript
function loadSchema<T>(filepath: string): T
function loadYaml<T>(filepath: string): T
```

**Parameters**:
- `filepath` - Path to YAML file

**Returns**: Parsed schema object

**Example**:
```typescript
import { loadSchema } from "@citrusworx/nectarine";

const userSchema = loadSchema("schemas/user/userSchema.yml");
const userQueries = loadSchema("schemas/user/userQueries.yml");
const userAPI = loadSchema("schemas/user/userAPI.yml");
```

### listApiOperations() / loadApiOperations()

Flatten a resource `*API.yml` into HTTP operations for Seltzer hosts / auto-wiring consumers. YAML `endpoint` maps to `ApiOperation.path`. Nectarine does **not** generate Seltzer `Route` objects — SeltzerBot owns that wiring.

Also available as `@citrusworx/nectarine/config` and `@citrusworx/nectarine/api`.

**Signature**:
```typescript
type ApiHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiOperation = {
  resource: string;
  crud: string;
  name: string;
  method: ApiHttpMethod;
  path: string;
  query?: string;
  body?: Record<string, string>;
  status?: number;
};

function listApiOperations(
  resource: string,
  api: Record<string, unknown>
): ApiOperation[];

function loadApiOperations(
  resource: string,
  apiPath: string
): ApiOperation[];
```

**Example**:
```typescript
import { loadNectarineConfig, listApiOperations } from "@citrusworx/nectarine/config";

const nectarine = loadNectarineConfig("./nectarine.config.yaml");
const product = nectarine.getResource("product");
const ops = listApiOperations("product", product.api);
// [{ resource: "product", crud: "read", name: "productById",
//    method: "GET", path: "/api/products/:id", query: "productById" }, ...]
```

### Hosting with Seltzer

Nectarine does **not** export `generateRoutes` and does not spin up a server. WebEngine / Blackwater hosts with **Seltzer**. Flatten `*API.yml` with Nectarine `listApiOperations`; Seltzer `generateRoutes` maps those operations onto `Route`s (copying `body` field specs and optional `status` onto `Route.contract`). Engine helpers `createNectarineReadRoutes` / `createNectarineWriteRoutes` / `createNectarineRoutes` call that path. Default compiled writes bind jsonb-cast columns from the HTTP body (`insertPayload` / `updatePayload` / `deleteProduct`) so the catalog document stays in `payload`. Product **reads** that remap `query:` names onto JSONB (`payloadsByCatalog`, `payloadsBySlug`, `countPayloads`) and waitlist `joinWaitlist` (generated id, `emailExists` duplicate UX, `source_app` allowlist, file-store fallback) still use a thin host `execute` on the same helper; health and KiwiPress content stay hand-registered. Default Seltzer `validate` enforces `.required` keys; Nectarine can later `replace("validate", …)` for Zod.

Set `transport.server: seltzer` in `nectarine.config.yaml`. Do not use Express route generation.

**Example**:
```typescript
import { loadNectarineConfig, listApiOperations } from "@citrusworx/nectarine/config";
import { Seltzer, generateRoutes } from "@citrusworx/seltzer";

const nectarine = loadNectarineConfig("./nectarine.config.yaml");
const ops = listApiOperations("product", nectarine.getResource("product").api);
const app = Seltzer.init();

for (const route of generateRoutes(
  ops.filter((operation) => operation.crud === "read" && operation.method === "GET"),
  {
    execute: ({ query, params, ctx }) => {
      if (query === "productById") {
        return ctx.locals.products.find((item) => item.id === params.id) ?? null;
      }
      return ctx.locals.products;
    },
  },
)) {
  app.route(route);
}

app.listen(3000);
```

See Blackwater (`apps/blackwatersound/back/src/server.ts`) for the current host pattern.

### compileSchema()

Compile schema to database-specific SQL.

**Signature**:
```typescript
function compileSchema(
  schema: SchemaDefinition | string,
  driver: "postgres" | "mysql"
): string
```

**Parameters**:
- `schema` - Parsed schema object or filesystem path to `*Schema.yml`
- `driver` - Target database (`postgres` default). `mongodb` is rejected (not SQL CREATE TABLE).

**Returns**: `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` SQL. Pass `{ additive: true }` on Postgres for `ADD COLUMN IF NOT EXISTS`. Rename / drop / type change use `applyMigrations`, not this helper.

**Example**:
```typescript
import { compileSchema, loadSchema } from "@citrusworx/nectarine";
import { CCompiler } from "@citrusworx/nectarine/compiler";

const userSchema = loadSchema("schemas/user/userSchema.yml");
const sql = compileSchema(userSchema, "postgres");
console.log(sql); // CREATE TABLE IF NOT EXISTS users (...)

const compiler = new CCompiler();
const ddl = compiler.buildDdl(compiler.parse_config("schemas/product/productSchema.yml"));
```

### applyMigrations()

Apply current schema YAML plus pending versioned migration YAML through an adapter `query()`. Creates `nectarine_schema_migrations`, `CREATE TABLE IF NOT EXISTS`, applies rename / drop / type-change ops (each pending migration in a Postgres transaction), then additive `ADD COLUMN IF NOT EXISTS`, then `CREATE INDEX`.

Not Flyway: no down migrations, no raw SQL scripts, no silent schema-diff. Destructive ops require `destructive: true` and `confirm: dropColumn` / `confirm: changeType`. Postgres `changeType` uses `USING CAST(column AS <compiled type>)`.

Pass a Postgres adapter (`createPgAdapter`) as `execute` so `withTransaction` pins one pool client — `BEGIN`/`COMMIT` are otherwise not atomic on `pg.Pool.query()`. MySQL DDL implicit-commits; wrapping `START TRANSACTION` cannot roll back an earlier `ALTER`.

**Signature**:
```typescript
async function applyMigrations(options: {
  execute: { query: (sql: string, params?: readonly unknown[]) => Promise<unknown> };
  vendor?: "postgres" | "mysql";
  schemas?: unknown[];
  migrations?: unknown[];
  tableSchema?: string;
  protectedColumns?: ReadonlyArray<{ table: string; column: string }>;
}): Promise<{ applied: string[]; skipped: string[] }>
```

**Example**:
```typescript
import { applyMigrations, compileMigration, loadMigrationDocuments } from "@citrusworx/nectarine/migrate";
import { createPgAdapterFromConfig } from "@citrusworx/nectarine/adapters/pg";

const pg = createPgAdapterFromConfig(config)!;
await pg.connect();

await applyMigrations({
  execute: pg,
  vendor: "postgres",
  schemas: [userSchema],
  migrations: loadMigrationDocuments("./db/migrations"),
  protectedColumns: [{ table: "products", column: "payload" }],
});
```

`compileMigration(doc)` compiles one YAML document to ALTER statements (for tests or inspection). `CCompiler.buildMigration` is the same entry.

There is no `migrateDown`. Restore a previous shape with a new forward migration.

### extendSchema()

Extend existing schema with overrides.

**Signature**:
```typescript
function extendSchema(
  baseSchema: SchemaDefinition,
  overrides: Partial<SchemaDefinition>
): SchemaDefinition
```

**Parameters**:
- `baseSchema` - Base schema
- `overrides` - Fields to override/add

**Returns**: Merged schema

**Example**:
```typescript
import { extendSchema, loadSchema } from "@citrusworx/nectarine";

const base = loadSchema("schemas/user/userSchema.yml");

const extended = extendSchema(base, {
  User: {
    ...base.User,
    fields: {
      ...base.User.fields,
      phone: "VARCHAR(20)"
    }
  }
});
```

### validateData()

Validate data against schema. **Zod** is the planned validator on the Seltzer-hosted path; this helper is the intended contract, not a finished generate-routes pipeline.

**Signature**:
```typescript
function validateData(
  model: string,
  data: any,
  schema: SchemaDefinition
): ValidationResult
```

**Parameters**:
- `model` - Model name (e.g., "User")
- `data` - Data to validate
- `schema` - Schema definition

**Returns**: Validation result

**Example**:
```typescript
import { validateData } from "@citrusworx/nectarine";

const result = validateData("User", {
  username: "john",
  email: "john@example.com",
  password: "secret"
}, userSchema);

if (!result.valid) {
  console.error("Validation errors:", result.errors);
}
```

---

## TypeScript Types

### SchemaDefinition

```typescript
interface SchemaDefinition {
  [modelName: string]: {
    table: string;
    description?: string;
    fields: {
      [fieldName: string]: string;
    };
    relationships?: {
      [relName: string]: string;
    };
  };
}
```

### QueryDefinition

```typescript
interface QueryDefinition {
  [modelName: string]: {
    read?: Record<string, SelectQuery>;
    create?: Record<string, InsertQuery>;
    update?: Record<string, UpdateQuery>;
    delete?: Record<string, DeleteQuery>;
  };
}
```

### APIDefinition

```typescript
interface APIDefinition {
  [modelName: string]: {
    read?: Record<string, RouteDefinition>;
    create?: Record<string, RouteDefinition>;
    update?: Record<string, RouteDefinition>;
    delete?: Record<string, RouteDefinition>;
  };
}
```

### RouteDefinition

```typescript
interface RouteDefinition {
  api: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    endpoint: string;
    query?: string;
    body?: Record<string, string>;
    middleware?: string[];
    validation?: boolean;
  };
}
```

### ApiOperation

Flattened HTTP operation from `listApiOperations`. YAML `endpoint` is mapped to `path`. Optional `api.status` becomes `status` for Seltzer `generateRoutes`.

```typescript
type ApiHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiOperation = {
  resource: string;
  crud: string;
  name: string;
  method: ApiHttpMethod;
  path: string;
  query?: string;
  body?: Record<string, string>;
  status?: number;
};
```

---

## Error Handling

### Common Errors

```typescript
// Validation Error
{
  type: "VALIDATION_ERROR",
  field: "email",
  message: "Invalid email format"
}

// Not Found
{
  type: "NOT_FOUND",
  message: "User with ID 123 not found"
}

// Database Error
{
  type: "DATABASE_ERROR",
  message: "Connection failed",
  code: "ECONNREFUSED"
}

// Constraint Error
{
  type: "CONSTRAINT_ERROR",
  field: "username",
  message: "Unique constraint violated"
}
```

### Error Responses

Seltzer handlers should return standard HTTP status codes:

| Code | Type | Example |
|------|------|---------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation failed |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Unique constraint |
| 500 | Server Error | Database error |