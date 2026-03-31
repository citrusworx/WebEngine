# Nectarine API Reference

Complete API reference for Nectarine backend generation.

## Table of Contents

- [Schema Definition](#schema-definition)
- [Query Types](#query-types)
- [API Routes](#api-routes)
- [Field Types](#field-types)
- [Core Functions](#core-functions)
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
```

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

### loadSchema()

Load and parse a YAML schema file.

**Signature**:
```typescript
function loadSchema<T>(filepath: string): T
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

### generateRoutes()

Generate Express routes from schemas.

**Signature**:
```typescript
function generateRoutes(
  schema: SchemaDefinition,
  queries: QueryDefinition,
  api: APIDefinition
): Express.Router
```

**Parameters**:
- `schema` - Schema definitions
- `queries` - Query definitions
- `api` - API route definitions

**Returns**: Express Router instance

**Example**:
```typescript
import { generateRoutes } from "@citrusworx/nectarine";
import express from "express";

const app = express();
const userRoutes = generateRoutes(userSchema, userQueries, userAPI);

app.use("/api", userRoutes);
```

### compileSchema()

Compile schema to database-specific SQL.

**Signature**:
```typescript
function compileSchema(
  schema: SchemaDefinition,
  driver: "postgres" | "mysql" | "mongodb"
): string
```

**Parameters**:
- `schema` - Schema definition
- `driver` - Target database

**Returns**: SQL or MongoDB schema

**Example**:
```typescript
import { compileSchema } from "@citrusworx/nectarine";

const sql = compileSchema(userSchema, "postgres");
console.log(sql); // CREATE TABLE users (...)

const mongoSchema = compileSchema(userSchema, "mongodb");
```

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

### migrateUp()

Apply schema migrations to database.

**Signature**:
```typescript
async function migrateUp(
  schema: SchemaDefinition,
  driver: "postgres" | "mysql" | "mongodb"
): Promise<void>
```

**Parameters**:
- `schema` - Schema to apply
- `driver` - Database type

**Returns**: Promise resolving when complete

**Example**:
```typescript
import { migrateUp } from "@citrusworx/nectarine";

await migrateUp(userSchema, "postgres");
console.log("Tables created");
```

### migrateDown()

Rollback schema migrations.

**Signature**:
```typescript
async function migrateDown(
  schema: SchemaDefinition,
  driver: "postgres" | "mysql" | "mongodb"
): Promise<void>
```

**Parameters**:
- `schema` - Schema to rollback
- `driver` - Database type

**Example**:
```typescript
import { migrateDown } from "@citrusworx/nectarine";

await migrateDown(userSchema, "postgres");
console.log("Tables dropped");
```

### validateData()

Validate data against schema using Zod.

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
    middleware?: string[];
    validation?: boolean;
  };
}
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

Nectarine returns standard HTTP status codes:

| Code | Type | Example |
|------|------|---------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation failed |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Unique constraint |
| 500 | Server Error | Database error |