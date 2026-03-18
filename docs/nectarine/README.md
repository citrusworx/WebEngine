# Nectarine

Nectarine is a config-driven backend library that empowers developers to define models, schemas, queries, and APIs through YAML — and have a fully functional backend generated from that definition.

Nectarine is a WebEngine native module but is fully independent. It can be used in any project.

---

## Philosophy

Backend development is repetitive. Models, schemas, queries, and API routes follow predictable patterns that should not require writing the same boilerplate over and over. Nectarine lets you define your backend in YAML and handles the rest.

- **Config driven** — models, schemas, queries, and APIs defined in YAML
- **Database agnostic** — PostgreSQL, MySQL, and MongoDB supported
- **Transport agnostic** — defaults to Express + Zod + Axios, configurable
- **GUI ready** — visual editor planned for no-code backend creation
- **WebEngine integrated** — works seamlessly as a WebEngine backend module

---

## Installation

```bash
yarn add @citrusworx/nectarine
```

---

## Supported Databases

| Database | Status |
|----------|--------|
| PostgreSQL | Active development |
| MySQL | Active development |
| MongoDB | Active development |

---

## How It Works

Nectarine reads three YAML files per resource and generates a fully functional backend:

```
userSchema.yml    ← defines the model and table structure
user.yml          ← defines queries (SELECT, INSERT, UPDATE, DELETE)
userAPI.yml       ← defines REST endpoints and HTTP methods
```

These three files are all that is needed to define a complete backend resource. Nectarine reads them, generates SQL or MongoDB queries, wires up routes, and exposes a REST API.

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