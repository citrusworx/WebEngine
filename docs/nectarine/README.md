# Nectarine

Nectarine is a config-driven backend library that empowers developers to define models, schemas, queries, and APIs through YAML — and have a fully functional backend generated from that definition.

Nectarine is a WebEngine native module but is fully independent. It can be used in any project.

**Latest Version**: 0.0.1 (Alpha)

---

## Philosophy

Backend development is repetitive. Models, schemas, queries, and API routes follow predictable patterns that should not require writing the same boilerplate over and over. Nectarine lets you define your backend in YAML and handles the rest.

- **Config driven** — models, schemas, queries, and APIs defined in YAML
- **Database agnostic** — PostgreSQL, MySQL, and MongoDB supported
- **Transport agnostic** — defaults to Express + Zod + Axios, configurable
- **GUI ready** — visual editor planned for no-code backend creation
- **WebEngine integrated** — works seamlessly as a WebEngine backend module

---

## Quick Start

```bash
# Install
yarn add @citrusworx/nectarine

# Define schema (schemas/user/userSchema.yml)
User:
  table: users
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    username: VARCHAR(100) UNIQUE NOT NULL
    email: VARCHAR(100) UNIQUE NOT NULL
    password: VARCHAR(255) NOT NULL

# Generate backend
const userRoutes = generateRoutes(schema, queries, api);
app.use("/api", userRoutes);

# Use API
GET /api/users
POST /api/users
```

**[→ Full Getting Started Guide](./nectarine-getting-started.md)**

---

## Documentation

| Guide | Topic |
|-------|-------|
| [Getting Started](./nectarine-getting-started.md) | Installation, setup, first backend |
| [API Reference](./nectarine-api.md) | Complete API documentation |
| [Schema Guide](./nectarine-schema-guide.md) | Schema definition and field types |
| [Query DSL](./nectarine-query-dsl.md) | Current YAML query DSL shape and conventions |
| [Examples](./nectarine-examples.md) | Real-world examples (blog, store, SaaS, CMS) |
| [PostgreSQL Guide](./nectarine-postgresql.md) | PostgreSQL setup and optimization |
| [MongoDB Guide](./nectarine-mongodb.md) | MongoDB setup and features |
| [Project Status](./nectarine-status.md) | Roadmap, limitations, comparison |

---

## Supported Databases

| Database | Status | Guide |
|----------|--------|-------|
| PostgreSQL | ✓ Active | [PostgreSQL Guide](./nectarine-postgresql.md) |
| MySQL | ✓ Active | Coming soon |
| MongoDB | ✓ Active | [MongoDB Guide](./nectarine-mongodb.md) |

---

## How It Works

Nectarine reads three YAML files per resource and generates a fully functional backend:

```
userSchema.yml    ← Model definitions and table structure
userQueries.yml   ← Query definitions (SELECT, INSERT, UPDATE, DELETE)
userAPI.yml       ← REST endpoint routing
```

These three files define a complete backend resource. Nectarine:
1. Parses the YAML schemas
2. Generates database queries
3. Wires up Express routes
4. Validates data with Zod
5. Exposes a REST API

---

## Installation

```bash
yarn add @citrusworx/nectarine
```

---

## Core Features

✓ **Schema-Driven**: Define backend in YAML, get API automatically
✓ **Database Support**: PostgreSQL, MySQL, MongoDB
✓ **Type Safe**: Zod validation on all routes
✓ **Express Native**: Generates Express routes
✓ **Pre-built Schemas**: User, Blog, CMS, Store, Banking models included
✓ **Query Builder**: SELECT, INSERT, UPDATE, DELETE operations
✓ **Relationships**: Foreign keys and relationships supported
✓ **Flexible**: Extend and override as needed

---

## Example: Blog Backend

Define a blog with posts and comments:

```yaml
# userSchema.yml
User:
  table: users
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    username: VARCHAR(100) UNIQUE NOT NULL
    email: VARCHAR(100) UNIQUE NOT NULL

Post:
  table: posts
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    title: VARCHAR(255) NOT NULL
    content: text NOT NULL
    author_id: int FOREIGN KEY REFERENCES users(id)

Comment:
  table: comments
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    content: text NOT NULL
    post_id: int FOREIGN KEY REFERENCES posts(id)
    author_id: int FOREIGN KEY REFERENCES users(id)
```

Nectarine automatically generates:
- 3 CREATE operations (users, posts, comments)
- 3 READ operations (get all, get by ID)
- 3 UPDATE operations
- 3 DELETE operations
- Full CRUD API with validation

**[See full blog example →](./nectarine-examples.md#simple-blog)**

---

## Use Cases

✓ **Rapid Prototyping**: Build backends in minutes, not days
✓ **Startups**: Bootstrap quickly with minimal code
✓ **GraphQL to REST**: Take GraphQL schema, generate REST API
✓ **CMS Backends**: Content management with any database
✓ **APIs**: Build CRUD APIs without repeating patterns
✓ **Microservices**: Lightweight backends for microservice architecture

---

## What's Included

- Schema definition system
- Query builder
- Express route generation
- Zod validation
- PostgreSQL adapter
- MongoDB adapter
- MySQL adapter
- Pre-built model schemas
- Connection pooling

---

## What's Planned

- [ ] GraphQL support
- [ ] Caching layer
- [ ] Authorization system
- [ ] Audit logging
- [ ] Real-time updates
- [ ] Multi-tenant support
- [ ] CLI tools

**[See full roadmap →](./nectarine-status.md#roadmap-summary)**

---

## Next Steps

1. **[Get Started](./nectarine-getting-started.md)** — Installation and first backend
2. **[Learn the Concepts](./nectarine-schema-guide.md)** — Understand schemas
3. **[See Examples](./nectarine-examples.md)** — Real-world backends
4. **[Choose Your Database](./nectarine-postgresql.md)** — Setup guide
5. **[Build Your Backend](./nectarine-getting-started.md)** — Create your first API

---

## Requirements

- Node.js 14+
- Express.js
- One of: PostgreSQL, MySQL, MongoDB

---

## License

MIT - Use freely in any project

---

## Schema Definition

Schemas define your models and database table structure.

```yaml
# userSchema.yml
User:
  table: users
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    username: VARCHAR(50) UNIQUE NOT NULL
    email: VARCHAR(100) UNIQUE NOT NULL
    password: VARCHAR(50) NOT NULL
    created_at: timestamp DEFAULT NOW()
    role: enum(admin, author, user) DEFAULT 'user'

Post:
  table: posts
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    title: string NOT NULL
    content: text NOT NULL
    author_id: int FOREIGN KEY REFERENCES users(id)
    created_at: timestamp DEFAULT NOW()
    updated_at: timestamp DEFAULT NOW()
```

---

## Query Definition

Queries define the SQL or MongoDB operations for each resource. Nectarine generates the actual query statements from these definitions.

```yaml
# user.yml
user:
  get:
    AllUsers:
      type: SELECT
      table: users
      action: FROM
      fields: '*'

    UserById:
      type: SELECT
      table: users
      fields: id
      conditions:
        condition: WHERE
        column: id
        operator: '='
        value: $1

  create:
    NewUser:
      type: INSERT
      action: INTO
      table: users
      updates:
        column:
          - email
          - password
          - name
          - created_at
        values:
          - $1
          - $2
          - $3
          - NOW()

  update:
    UserById:
      type: UPDATE
      table: users
      updates:
        column: name, age
        value: $1, $2
      conditions:
        condition: WHERE
        column: id
        operator: '='
        value: $3

  delete:
    User:
      type: DELETE
      action: FROM
      table: users
      conditions:
        condition: WHERE
        column: id
        operator: '='
        value: $1
```

---

## API Definition

APIs define the REST endpoints for each resource. Nectarine generates the routes and wires them to the appropriate queries.

```yaml
# userAPI.yml
user:
  get:
    allUsers:
      api:
        method: GET
        endpoint: /users
    usersById:
      api:
        method: GET
        endpoint: /users/:id
    usersByEmail:
      api:
        method: GET
        endpoint: /users/:email

  create:
    user:
      api:
        method: POST
        endpoint: /users

  update:
    user:
      api:
        method: PUT
        endpoint: /users/:id

  delete:
    user:
      api:
        method: DELETE
        endpoint: /users/:id
```

---

## Database Adapters

Nectarine includes adapters for each supported database. All connection details are sourced from environment variables. SQL statements are never hardcoded — they are built dynamically from the YAML query definitions at runtime.

### Query Generation

Nectarine reads a query definition from YAML and constructs the SQL statement dynamically:

```ts
import { gensql } from "@citrusworx/nectarine";
import { Pgsql } from "@citrusworx/nectarine";

// Load query definition from YAML
const getUserById = gensql("user.yml", "user", "get", "UserById");

// Build SQL dynamically from the definition
const sql = `${getUserById.type} ${getUserById.fields} ${getUserById.action} ${getUserById.table} ${getUserById.conditions.condition} ${getUserById.conditions.column} ${getUserById.conditions.operator} $1`;

// Execute against the database
const user = await Pgsql(sql, [id]);
```

No SQL is written by hand. The query structure, fields, table, and conditions all come from the YAML definition.

### PostgreSQL

```ts
import { Pgsql } from "@citrusworx/nectarine";

const result = await Pgsql(sql, [param]);
```

Environment variables:
```
PG_USER
PG_HOST
PG_PASS
PG_DB
PG_PORT
```

### MySQL

```ts
import { Mysql } from "@citrusworx/nectarine";

const result = await Mysql(sql, [param]);
```

Environment variables:
```
MS_USER
MS_HOST
MS_PASS
MS_DB
MS_PORT
```

### MongoDB

```ts
import { Mngz } from "@citrusworx/nectarine";

await Mngz(async (client) => {
  const db = client.db(process.env.MG_DB);
  const result = await db.collection(collection).find(query).toArray();
});
```

Environment variables:
```
MG_USER
MG_HOST
MG_PASS
MG_DB
MG_PORT
```

---

## Default Transport

Nectarine's default transport stack is **Express + Zod + Axios**. This is configurable via `nectarine.config.yaml`.

```yaml
# nectarine.config.yaml (design phase)
version: "0.1"

transport:
  server: express       # express | fastify | hono
  validation: zod
  client: axios

database:
  default: postgres     # postgres | mysql | mongodb

resources:
  - name: user
    schema: ./user/userSchema.yml
    queries: ./user/user.yml
    api: ./user/userAPI.yml
```

---

## Usage with WebEngine

When used as a WebEngine module, Nectarine is declared in `webengine.toml`:

```toml
[stack]
backend = { lib = "nectarine", entry = "apps/server" }
```

WebEngine starts Nectarine as part of the application stack, wires telemetry, and exposes Nectarine's API endpoints through the kernel.

---

## GUI

A visual editor for Nectarine is planned — allowing developers and creators to define models, schemas, and APIs without writing YAML by hand. This will be powered by Sugar and integrated into the WebEngine Wizard.

---

## Roadmap

```
v0.1  ← PostgreSQL, MySQL, MongoDB adapters       🔧 Active
       YAML-driven query generation
       YAML-driven API/route definition
       YAML-driven schema definition
v0.2  ← nectarine.config.yaml
       Express + Zod + Axios transport
       Auto-generated routes from API YAML
v0.3  ← Fastify + Hono transport options
       GraphQL support
v0.4  ← GUI (powered by Sugar)
v1.0  ← stable API
```

---

## Status

Nectarine is in active development. The database adapters and YAML definition system are functional. The config system and transport layer are in design phase.
