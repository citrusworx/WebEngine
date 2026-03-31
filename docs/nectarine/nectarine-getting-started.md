# Nectarine Getting Started

Quick introduction to Nectarine backend generation and schema-driven development.

## What is Nectarine?

Nectarine is a config-driven backend library that empowers developers to define models, schemas, queries, and APIs through YAML — and have a fully functional backend generated from that definition.

**Key Philosophy**:
- Backend development should not require repetitive boilerplate
- Models, schemas, queries, and APIs follow predictable patterns
- Define your data model once, generate Express routes and database queries automatically
- Work with any database: PostgreSQL, MySQL, or MongoDB
- Start building features, not infrastructure

## Installation

```bash
yarn add @citrusworx/nectarine
```

## Prerequisites

### Choose Your Database

Nectarine works with:
- **PostgreSQL** 12+ (recommended for production)
- **MySQL** 5.7+ 
- **MongoDB** 4.4+

Install one and set connection environment variables.

### Environment Setup

```bash
# For PostgreSQL
export PG_USER=postgres
export PG_HOST=localhost
export PG_PASS=password
export PG_DB=myapp
export PG_PORT=5432

# For MySQL
export MYSQL_USER=root
export MYSQL_HOST=localhost
export MYSQL_PASS=password
export MYSQL_DB=myapp
export MYSQL_PORT=3306

# For MongoDB
export MONGO_URI=mongodb://localhost:27017
export MONGO_DB=myapp
```

## Core Concepts

### Schema Files

Define your data model in YAML:

```yaml
# userSchema.yml
User:
  table: users
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    username: VARCHAR(50) UNIQUE NOT NULL
    email: VARCHAR(100) UNIQUE NOT NULL
    password: VARCHAR(255) NOT NULL
    created_at: timestamp DEFAULT NOW()
    role: enum(admin, author, user) DEFAULT 'user'
```

### Query Definition

Define database operations:

```yaml
# userQueries.yml
queries:
  getAllUsers:
    type: SELECT
    table: users
  
  getUserById:
    type: SELECT
    table: users
    where: id = $1
  
  createUser:
    type: INSERT
    table: users
    fields: [username, email, password]
```

### API Routes

Map operations to HTTP endpoints:

```yaml
# userAPI.yml
routes:
  getAllUsers:
    path: /users
    method: GET
    query: getAllUsers
  
  getUserById:
    path: /users/:id
    method: GET
    query: getUserById
  
  createUser:
    path: /users
    method: POST
    query: createUser
```

## Your First Backend

### Step 1: Define Your Schema

Create `schemas/user/userSchema.yml`:

```yaml
User:
  table: users
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    username: VARCHAR(100) UNIQUE NOT NULL
    email: VARCHAR(100) UNIQUE NOT NULL
    password: VARCHAR(255) NOT NULL
    created_at: timestamp DEFAULT NOW()
    role: enum(admin, author, user) DEFAULT 'user'

Post:
  table: posts
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    title: VARCHAR(255) NOT NULL
    content: text NOT NULL
    author_id: int FOREIGN KEY REFERENCES users(id)
    created_at: timestamp DEFAULT NOW()
    updated_at: timestamp DEFAULT NOW()
```

### Step 2: Define Your Queries

Create `schemas/user/userQueries.yml`:

```yaml
user:
  read:
    allUsers:
      type: SELECT
      fields: '*'
    
    userById:
      type: SELECT
      where: id = $1
    
    userByEmail:
      type: SELECT
      where: email = $1
  
  create:
    newUser:
      type: INSERT
      fields: [username, email, password]
  
  update:
    updateUser:
      type: UPDATE
      where: id = $1
      fields: [username, email, role]
  
  delete:
    deleteUser:
      type: DELETE
      where: id = $1
```

### Step 3: Define Your API

Create `schemas/user/userAPI.yml`:

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
  
  delete:
    deleteUser:
      api:
        method: DELETE
        endpoint: /users/:id
```

### Step 4: Generate Backend

```typescript
import { loadSchema, generateRoutes } from "@citrusworx/nectarine";
import express from "express";

const app = express();

// Load schema
const userSchema = loadSchema("schemas/user/userSchema.yml");
const userQueries = loadSchema("schemas/user/userQueries.yml");
const userAPI = loadSchema("schemas/user/userAPI.yml");

// Generate and register routes
const userRoutes = generateRoutes(userSchema, userQueries, userAPI);
app.use("/api", userRoutes);

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
```

## Key Features

### Database Agnostic

Same schema definitions work across databases:

```yaml
# PostgreSQL, MySQL, or MongoDB - just change adapter
adapter: postgres
# or
adapter: mysql
# or
adapter: mongodb
```

### Type Safety with Zod

Automatic validation on all routes:

```typescript
// Automatically generated from schema
POST /users
{
  "username": "john_doe",    // Required
  "email": "john@example.com", // Unique, required
  "password": "secure123"     // Required
}
// Returns 400 if validation fails
```

### Relationships

Define and query relationships:

```yaml
Post:
  table: posts
  fields:
    id: int PRIMARY KEY
    title: string NOT NULL
    author_id: int FOREIGN KEY REFERENCES users(id)
    created_at: timestamp

# Query with joins
getPostsWithAuthor:
  type: SELECT
  table: posts
  join: users ON posts.author_id = users.id
  fields: [posts.*, users.username]
```

### Enums

Support for enum types:

```yaml
User:
  fields:
    role: enum(admin, author, user) DEFAULT 'user'

# Valid values only
POST /users { "role": "admin" }     ✓ OK
POST /users { "role": "superuser" } ✗ Invalid
```

### Timestamps

Automatic timestamp handling:

```yaml
created_at: timestamp DEFAULT NOW()
updated_at: timestamp DEFAULT NOW() ON UPDATE NOW()

# Automatically set on creation
# Automatically updated on edits
```

## Next Steps

1. **Read the API Reference** - [nectarine-api.md](./nectarine-api.md)
2. **Learn Query Definition** - [nectarine-queries.md](./nectarine-queries.md)
3. **Explore Examples** - [nectarine-examples.md](./nectarine-examples.md)
4. **Database Guides**:
   - [PostgreSQL Guide](./nectarine-postgresql.md)
   - [MySQL Guide](./nectarine-mysql.md)
   - [MongoDB Guide](./nectarine-mongodb.md)
5. **See all Schemas** - [nectarine-schemas.md](./nectarine-schemas.md)

## Common Tasks

### Connect to PostgreSQL

```bash
export PG_USER=postgres
export PG_HOST=localhost
export PG_PASS=mypassword
export PG_DB=myapp
export PG_PORT=5432
```

### Create Database

```bash
# PostgreSQL
createdb myapp

# MySQL
mysql -u root -p
CREATE DATABASE myapp;

# MongoDB
# Auto-created on first write
```

### Run Migrations

```bash
# Generate tables from schema
yarn run migrate:up

# Rollback changes
yarn run migrate:down
```

### Test API

```bash
# Start server
yarn dev

# Test endpoint
curl http://localhost:3000/api/users

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"secret"}'
```

## Troubleshooting

### "Cannot connect to database"

- Verify database is running
- Check connection environment variables
- Ensure database exists
- Check firewall/network access

### "Type validation failed"

- Check schema field types match data
- Review Zod validation rules
- See validation error message for details

### "Query not found"

- Verify query is defined in queries YAML
- Check spelling matches exactly
- Ensure file is loaded before use