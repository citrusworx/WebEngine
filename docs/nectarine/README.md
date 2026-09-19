# Nectarine

Nectarine is a config-driven backend library. Define models, schemas, queries, and APIs in YAML. Nectarine supplies the config loader, query compiler, and database adapters. **Seltzer** is the HTTP transport that hosts those contracts in WebEngine / Blackwater.

Nectarine is a WebEngine native library but is fully independent. It can be used in any project. It does not spin up a server.

**Latest Version**: 0.1.0 on npm (pending Changesets target **0.2.0**)

Production deploy bar for Blackwater + Seltzer: [Production](./production.md).

---

## Philosophy

Backend development is repetitive. Models, schemas, queries, and API routes follow predictable patterns that should not require writing the same boilerplate over and over. Nectarine lets you define data and query contracts in YAML; the host serves them with Seltzer.

- **Config driven** — models, schemas, queries, and APIs defined in YAML
- **Database agnostic** — PostgreSQL, MySQL, and MongoDB supported
- **Library first** — Nectarine supplies config, compiler, and adapters; it does not spin up a server
- **Seltzer transport** — WebEngine / Blackwater hosts HTTP with Seltzer (`transport.server: seltzer`)
- **GUI ready** — visual editor planned for no-code backend creation
- **WebEngine integrated** — works as the WebEngine data/config library, hosted by Seltzer

---

## Quick Start

```bash
# npm (public package)
npm install @citrusworx/nectarine
npm install pg
# plus @citrusworx/seltzer when hosting HTTP in WebEngine / Blackwater

# yarn
yarn add @citrusworx/nectarine pg
```

```yaml
# nectarine.config.yaml
version: "0.1"
transport:
  server: seltzer   # WebEngine / Blackwater default. Do not use Express route generation.
database:
  default: postgres
resources:
  - name: user
    schema: ./schemas/user/userSchema.yml
    queries: ./schemas/user/userQueries.yml
    api: ./schemas/user/userAPI.yml
```

```ts
import { loadNectarineConfig } from "@citrusworx/nectarine";
import { Seltzer } from "@citrusworx/seltzer";
import type { Route } from "@citrusworx/seltzer";

const nectarine = loadNectarineConfig("./nectarine.config.yaml");
const app = Seltzer.init();

// Object-based Seltzer routes. Auto-wiring from *API.yml is the next engine step.
const listUsers: Route = {
  method: "GET",
  path: "/api/users",
  handler: () => ({
    body: { resource: nectarine.getResource("user").name },
  }),
};

app.route(listUsers);
app.listen(3000);
```

```bash
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
| [Query DSL](./nectarine-query-dsl.md) | Phonics YAML query DSL (canonical + Blackwater) |
| [No hard-coded SQL](./no-hardcoded-sql.md) | Hard rule, assembly model, Blackwater SQL inventory |
| [Production](./production.md) | Deploy-today bar: env, migrate, JSONB seed, Seltzer host, non-goals |
| [Examples](./nectarine-examples.md) | Real-world examples (blog, store, SaaS, CMS) |
| [PostgreSQL Guide](./nectarine-postgresql.md) | PostgreSQL setup and optimization |
| [MongoDB Guide](./nectarine-mongodb.md) | MongoDB setup and features |
| [Project Status](./nectarine-status.md) | Roadmap, limitations, comparison |
| [Nectarine kernel contract](../webengine/nectarine-kernel-contract.md) | Host rules: YAML, migrate, `createRoutes`, opt-in listen |
| [Dual-process FE + API](../webengine/dual-process.md) | Separate Vite/React/Sig.js process against `startSeltzerFromKernel` |

---

## Supported Databases

| Database | Status | Guide |
|----------|--------|-------|
| PostgreSQL | ✓ Active | [PostgreSQL Guide](./nectarine-postgresql.md) |
| MySQL | ✓ Active | Coming soon |
| MongoDB | ✓ Active | [MongoDB Guide](./nectarine-mongodb.md) |

---

## How It Works

Nectarine reads three YAML files per resource. The host serves HTTP with Seltzer:

```
userSchema.yml    ← Model definitions and table structure
userQueries.yml   ← Query definitions (SELECT, INSERT, UPDATE, DELETE)
userAPI.yml       ← REST endpoint routing
```

These three files define a complete backend resource. Nectarine:
1. Parses the YAML schemas
2. Compiles named database queries
3. Supplies adapters (PostgreSQL, MySQL, MongoDB)

The host (WebEngine / Blackwater) runs **Seltzer**:
4. Registers object-based Seltzer routes (resource **reads and YAML writes** plus waitlist POST `joinWaitlist` auto-wire from `*API.yml` via `generateRoutes`)
5. Default `validate` checks `.required` body fields; Zod lands later via `replace("validate", …)`

---

## Installation

```bash
yarn add @citrusworx/nectarine @citrusworx/seltzer
```

---

## Core Features

✓ **Schema-Driven**: Define models, queries, and APIs in YAML
✓ **Database Support**: PostgreSQL, MySQL, MongoDB
✓ **Seltzer Hosted**: WebEngine / Blackwater serves HTTP with Seltzer
✓ **Validation Intent**: Zod is the planned validation layer on the hosted path
✓ **Pre-built Schemas**: User, Blog, CMS, Store, Banking models included
✓ **Query Compiler**: SELECT, INSERT, UPDATE, DELETE from query YAML; CREATE TABLE from schema YAML; versioned ALTER from migration YAML
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

Those YAML files are the CRUD contracts. The compiler emits named queries; Seltzer hosts matching routes (auto-wiring from API YAML is next):
- 3 CREATE operations (users, posts, comments)
- 3 READ operations (get all, get by ID)
- 3 UPDATE operations
- 3 DELETE operations
- REST endpoints defined in API YAML; Zod validation planned on the hosted path

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
- Query compiler
- `nectarine.config.yaml` loader
- Seltzer as the WebEngine / Blackwater HTTP transport
- Zod as planned route validation
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

- Node.js 18+ (MongoDB adapter: Node 20.19+ for `mongodb@7`)
- `@citrusworx/seltzer` when hosting as WebEngine / Blackwater
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

APIs define REST endpoints for each resource. Hosts register matching object-based Seltzer `Route` definitions today. Auto-wiring those routes from `*API.yml` is the next engine step.

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

Nectarine reads a query definition from YAML and the **compiler** assembles SQL. App code must not concatenate tokens into a statement.

```ts
import { CCompiler } from "@citrusworx/nectarine/compiler";
import { createPgAdapterFromConfig } from "@citrusworx/nectarine/adapters/pg";

const compiler = new CCompiler();
const parsed = compiler.parse_config("user.yml");
const sql = compiler.buildQuery(compiler.clean_parse(parsed, "user", "get"), "UserById");
// SELECT id FROM users WHERE id = $1

const user = await pg.query(sql, [id]);
```

No SQL is written by hand. The query structure, fields, table, and conditions all come from the YAML definition. See [No hard-coded SQL](./no-hardcoded-sql.md).

### PostgreSQL

```ts
import { loadNectarineConfig } from "@citrusworx/nectarine";
import { createPgAdapter, createPgAdapterFromConfig } from "@citrusworx/nectarine/adapters/pg";

const config = loadNectarineConfig("./nectarine.config.yaml");
const pg = createPgAdapterFromConfig(config)
    ?? createPgAdapter(config.resolveCredentials("postgres")!);

await pg.connect();
const result = await pg.query(sql, [param]);
await pg.disconnect();
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
import { loadNectarineConfig } from "@citrusworx/nectarine";
import { createMysqlAdapter, createMysqlAdapterFromConfig } from "@citrusworx/nectarine/adapters/ms";

const config = loadNectarineConfig("./nectarine.config.yaml");
const mysql = createMysqlAdapterFromConfig(config)
    ?? createMysqlAdapter(config.resolveCredentials("mysql")!);

await mysql.connect();
const result = await mysql.query(sql, [param]); // compiler `$1` or MySQL `?`
await mysql.disconnect();
```

YAML declares the env **key names** (typically `MS_USER`, `MS_HOST`, `MS_PASS`, `MS_DB`, `MS_PORT`). `NectarineConfig.resolveCredentials("mysql")` reads the values; the adapter does not read `process.env` itself. The compiler is still Postgres-first (`$1`); the MySQL adapter rewrites `$1` / `$N::jsonb` to `?` / `CAST(? AS JSON)` at `query()` time.

### MongoDB

```ts
import { loadNectarineConfig } from "@citrusworx/nectarine";
import { createMongoAdapter, createMongoAdapterFromConfig } from "@citrusworx/nectarine/adapters/mg";

const config = loadNectarineConfig("./nectarine.config.yaml");
const creds = config.resolveCredentials("mongodb");
if (!creds) {
    throw new Error("MongoDB env is incomplete");
}

const mg = createMongoAdapterFromConfig(config) ?? createMongoAdapter(creds);
await mg.connect();
const result = await mg.collection("users").find(query).toArray();
await mg.disconnect();
```

YAML declares the env key names (typically `MG_USER`, `MG_HOST`, `MG_PASS`, `MG_DB`, `MG_PORT`). The adapter receives resolved credentials and does not read `process.env` itself.

---

## Default Transport

Nectarine does **not** spin up an HTTP server. It is a library: config, compiler, and adapters.

WebEngine / Blackwater hosts with **Seltzer**. Blackwater's `nectarine.config.yaml` sets `transport.server: seltzer` and tells hosts not to use Express route generation.

```yaml
# nectarine.config.yaml
version: "0.1"

transport:
  server: seltzer
  # Object-based Seltzer Route definitions. Do not use Express route generation.
  validation: zod       # planned on the hosted path
  # client: axios       # optional; not part of the default stack

database:
  default: postgres     # postgres | mysql | mongodb

resources:
  - name: user
    schema: ./user/userSchema.yml
    queries: ./user/user.yml
    api: ./user/userAPI.yml
```

Express may remain a historical or optional note. It is not what Nectarine does by default, and Nectarine does not generate or listen as an Express app. Route auto-wiring from `*API.yml` onto Seltzer is the next engine step.

---

## Usage with WebEngine

Nectarine is the WebEngine data/config library. The host process runs **Seltzer**; Nectarine does not start its own server.

Blackwater's backend (`apps/blackwatersound/back`) is the current pattern:

```ts
import { loadNectarineConfig } from "@citrusworx/nectarine/config";
import { Seltzer } from "@citrusworx/seltzer";

const nectarine = loadNectarineConfig("./nectarine.config.yaml");
const app = Seltzer.init();

for (const route of routes) {
  app.route(route);
}

app.listen(port, { locals, onListening });
```

See [Seltzer](../seltzer/README.md) for the HTTP runtime. Kernel-hosted listen without writing `Seltzer.init()` yourself is `startSeltzerFromKernel` / `serveNectarineHttp` — [Nectarine kernel contract](../webengine/nectarine-kernel-contract.md), [dual-process frontend + API](../webengine/dual-process.md).

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
       nectarine.config.yaml (transport.server: seltzer)
v0.2  ← Seltzer hosting as the WebEngine / Blackwater default
       Auto-wired Seltzer routes from API YAML (next engine step)
       Zod validation on the hosted path
v0.3  ← Optional / historical alternate transports (e.g. Express)
       GraphQL support
v0.4  ← GUI (powered by Sugar)
v1.0  ← stable API
```

---

## Status

Nectarine is in active development. The database adapters, YAML definition system, and config loader are functional. WebEngine / Blackwater hosts with Seltzer. Route auto-wiring from API YAML is the next engine step.
