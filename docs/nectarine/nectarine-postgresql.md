# Nectarine PostgreSQL Guide

Comprehensive guide to using Nectarine with PostgreSQL.

## Why PostgreSQL?

- **ACID Compliant**: Reliable transactions
- **Powerful Query Language**: Rich SQL features
- **Scalable**: Handles large datasets efficiently
- **Open Source**: No licensing costs
- **Strongly Typed**: Catches data errors
- **Advanced Features**: JSON, arrays, full-text search

## Installation

### MacOS

```bash
# Using Homebrew
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Verify installation
psql --version
```

### Linux (Ubuntu/Debian)

```bash
# Install
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
psql --version
```

### Windows

1. Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer
3. Choose default settings
4. Remember the password for `postgres` user
5. Verify: Open Command Prompt and run `psql --version`

## Configuration

### Environment Variables

```bash
# Connection settings
export PG_USER=postgres          # Default superuser
export PG_HOST=localhost         # Connection host
export PG_PORT=5432             # Default PostgreSQL port
export PG_PASS=your_password    # Your password
export PG_DB=myapp              # Database name
```

### Connection String

```
postgresql://username:password@host:port/database
postgresql://postgres:password@localhost:5432/myapp
```

## Setup

### Create Database

```bash
# Using psql command
createdb myapp

# Or with psql
psql -U postgres
CREATE DATABASE myapp;

# Verify
\l
```

### Create User (Optional but Recommended)

```bash
# Connect as superuser
psql -U postgres

# Create new role
CREATE ROLE myapp_user WITH LOGIN PASSWORD 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE myapp TO myapp_user;

# Exit
\q
```

### Connect

```bash
# As default user
psql -U postgres -d myapp

# As specific user
psql -U myapp_user -d myapp -h localhost

# Using connection string
psql postgresql://myapp_user:password@localhost:5432/myapp
```

## Using PostgreSQL with Nectarine

### Setup in Code

```typescript
import { loadSchema, generateRoutes } from "@citrusworx/nectarine";
import { PostgresAdapter } from "@citrusworx/nectarine/adapters/postgres";
import express from "express";

const app = express();
app.use(express.json());

// Configure PostgreSQL adapter
const pgAdapter = new PostgresAdapter({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  password: process.env.PG_PASS,
  database: process.env.PG_DB || "myapp",
  port: parseInt(process.env.PG_PORT || "5432"),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Load schemas
const schema = loadSchema("schemas/user/userSchema.yml");
const queries = loadSchema("schemas/user/userQueries.yml");
const api = loadSchema("schemas/user/userAPI.yml");

// Generate routes
const userRoutes = generateRoutes(schema, queries, api);
app.use("/api", userRoutes);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

### Connection Pooling

```typescript
import { Pool } from "pg";

// Create connection pool
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  password: process.env.PG_PASS,
  database: process.env.PG_DB,
  port: parseInt(process.env.PG_PORT),
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Connection failed:", err);
  } else {
    console.log("Connected at:", res.rows[0]);
  }
});
```

## PostgreSQL-Specific Features

### Data Types

Nectarine supports all PostgreSQL types:

```yaml
# Numeric
years_experience: int
price: decimal(10, 2)
rating: float

# Text
name: VARCHAR(100)
bio: text
code: char(10)

# Date/Time
birth_date: date
start_time: time
created_at: timestamp

# Boolean
is_active: boolean

# Array
tags: text[]              # Array of text
numbers: int[]            # Array of integers

# JSON
metadata: json            # JSON data
settings: jsonb           # Binary JSON (indexed)

# UUID
id: uuid DEFAULT gen_random_uuid()

# Enum
status: enum(active, inactive)
role: enum(admin, user, guest)
```

### Advanced Queries

#### Full-Text Search

```yaml
# Schema
Post:
  fields:
    title: VARCHAR(255)
    content: text
    search_vector: tsvector

# Query
searchPosts:
  type: SELECT
  table: posts
  where: search_vector @@ plainto_tsquery('english', $1)
  orderBy: ts_rank(search_vector, plainto_tsquery('english', $1)) DESC
```

#### JSON Querying

```yaml
# Schema
User:
  fields:
    preferences: jsonb

# Query - get users with dark mode preference
darkModeUsers:
  type: SELECT
  table: users
  where: preferences->>'theme' = 'dark'
```

#### Array Operations

```yaml
# Schema
Post:
  fields:
    tags: text[]

# Query - posts with specific tag
byTag:
  type: SELECT
  table: posts
  where: $1 = ANY(tags)

# Query - posts with multiple tags
byTags:
  type: SELECT
  table: posts
  where: tags @> $1::text[]  # tags contains array
```

#### Window Functions

```yaml
# Rank posts by views
rankedPosts:
  type: SELECT
  table: posts
  fields: |
    title,
    views,
    ROW_NUMBER() OVER (ORDER BY views DESC) as rank
  orderBy: rank
```

### Indexes

```yaml
# Nectarine automatically indexes:
# - PRIMARY KEY
# - UNIQUE fields
# - FOREIGN KEY fields

# For other fields, add manually in PostgreSQL:

User:
  fields:
    email: VARCHAR(100) UNIQUE          # AUTO-indexed
    created_at: timestamp               # Consider indexing
    status: enum(active, inactive)      # Consider indexing

# In PostgreSQL:
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_status ON users(status) WHERE is_active = true;
```

### Transactions

```typescript
import { Pool } from "pg";

const pool = new Pool();

async function transferMoney(fromUserId, toUserId, amount) {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    // Debit from_user
    await client.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2",
      [amount, fromUserId]
    );
    
    // Credit to_user
    await client.query(
      "UPDATE users SET balance = balance + $1 WHERE id = $2",
      [amount, toUserId]
    );
    
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
```

### Migrations

```bash
# Create migration file
cat > migrations/001_create_users.sql << 'EOF'
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
EOF

# Run migration
psql -U postgres -d myapp -f migrations/001_create_users.sql

# With Nectarine
yarn run migrate:up
yarn run migrate:down
```

### Backup and Restore

```bash
# Backup database
pg_dump -U postgres myapp > backup.sql

# Backup to compressed format (faster)
pg_dump -U postgres -F c myapp > backup.dump

# Restore from SQL
psql -U postgres -d myapp < backup.sql

# Restore from dump
pg_restore -U postgres -d myapp backup.dump

# Backup specific schema
pg_dump -U postgres -n public myapp > schema_backup.sql
```

## Performance Tuning

### Query Optimization

```yaml
# BAD: Selects all columns (slow)
getAllUsers:
  type: SELECT
  table: users
  fields: '*'

# GOOD: Select only needed columns
getActiveUsers:
  type: SELECT
  table: users
  fields: [id, username, email]
  where: is_active = true

# GOOD: Add LIMIT for large datasets
recentUsers:
  type: SELECT
  table: users
  fields: [id, username, created_at]
  orderBy: created_at DESC
  limit: 100
```

### Connection Pool Size

```typescript
// Tune based on your app
const pool = new Pool({
  max: 20,        // Production: 20-40
  // Not too high (wastes memory)
  // Not too low (connection wait)
  idleTimeoutMillis: 30000,
});
```

### Enable Query Logging

```typescript
// Log slow queries
import { Pool } from "pg";

const pool = new Pool();
const originalQuery = pool.query;

pool.query = async function(...args) {
  const start = Date.now();
  const result = await originalQuery.apply(this, args);
  const duration = Date.now() - start;
  
  if (duration > 1000) {
    console.warn("Slow query detected:", {
      query: args[0],
      duration: `${duration}ms`
    });
  }
  
  return result;
};
```

### Vacuum and Analyze

```bash
# Clean up dead rows
psql -U postgres -d myapp -c "VACUUM;"

# Update statistics for query planner
psql -U postgres -d myapp -c "ANALYZE;"

# Combined (full maintenance)
psql -U postgres -d myapp -c "VACUUM ANALYZE;"
```

## Common Issues

### Connection Refused

```bash
# Verify PostgreSQL is running
pg_isready -U postgres

# Start service
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux

# Check port
netstat -an | grep 5432
```

### Authentication Failed

```bash
# Check PostgreSQL is listening on network
grep listen_addresses /usr/local/var/postgres/postgresql.conf

# Should be: listen_addresses = '*'

# Check pg_hba.conf for authentication method
# For local connections, use: local all postgres trust

# Restart PostgreSQL after changes
```

### Out of Memory

```typescript
// Too many large queries in pool
const pool = new Pool({
  max: 5,  // Reduce connection count
  idleTimeoutMillis: 10000,  // Close idle connections faster
});
```

### Disk Space

```bash
# Check database size
psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('myapp'));"

# Check table sizes
psql -U postgres -d myapp -c "\dt+"

# Clean up logs/backups
rm -f pg_log/*.log
rm -f backups/old_*.dump
```

## Best Practices

✓ **Do**:
- Use connection pooling
- Create appropriate indexes
- Add LIMIT to queries
- Use prepared statements (Nectarine does this)
- Regular backups
- Monitor slow queries
- Use transactions for related operations
- Set appropriate data types

✗ **Don't**:
- Connect to PostgreSQL without pooling
- SELECT * in production
- Store passwords in code
- Skip backups
- Run expensive queries without LIMIT
- Use VARCHAR(5000) for usernames

## Resources

- [PostgreSQL Official Docs](https://www.postgresql.org/docs/)
- [PostgreSQL Query Performance](https://www.postgresql.org/docs/current/sql-explain.html)
- [Connection Pooling](https://www.postgresql.org/docs/current/warm-standby.html)
- [pg NPM Package](https://node-postgres.com/)