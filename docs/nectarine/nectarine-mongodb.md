# Nectarine MongoDB Guide

Using Nectarine with MongoDB for flexible document storage.

## Why MongoDB?

- **Schemaless**: Store any JSON structure
- **Horizontal Scaling**: Built-in sharding
- **JSON-Native**: Perfect for JavaScript/Node
- **Flexible**: Add fields without migrations
- **High Performance**: Optimized for reads

## Installation

### MacOS

```bash
# Using Homebrew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify
mongosh --version
```

### Linux (Ubuntu)

```bash
# Add MongoDB repository
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh --version
```

### Docker

```bash
# Run MongoDB in Docker
docker run --name mongodb -p 27017:27017 -d mongo:latest

# Connect
docker exec -it mongodb mongosh
```

## Configuration

### Environment Variables

```bash
export MONGO_URI=mongodb://localhost:27017
export MONGO_DB=myapp
export MONGO_USER=admin
export MONGO_PASS=password
```

### Connection String

```
mongodb://localhost:27017
mongodb://username:password@host:port/database
mongodb+srv://username:password@cluster.mongodb.net/database  # Atlas
```

## Setup

### Create Database

```bash
# Connect to MongoDB
mongosh

# Create and use database
use myapp

# Create collection (auto-created on first insert)
db.users.insertOne({ username: "admin" })

# List databases
show databases

# List collections
show collections
```

### Create User (Optional)

```bash
# Connect as admin
mongosh admin

# Create admin user
db.createUser({
  user: "admin",
  pwd: "admin_password",
  roles: ["root"]
})

# Create app user
db.createUser({
  user: "app_user",
  pwd: "app_password",
  roles: ["readWrite"]
})

# Exit and reconnect with credentials
mongosh -u admin -p admin_password
```

## Using MongoDB with Nectarine

### Setup in Code

```typescript
import { loadSchema, generateRoutes } from "@citrusworx/nectarine";
import { MongoAdapter } from "@citrusworx/nectarine/adapters/mongo";
import express from "express";

const app = express();
app.use(express.json());

// Configure MongoDB adapter
const mongoAdapter = new MongoAdapter({
  uri: process.env.MONGO_URI || "mongodb://localhost:27017",
  database: process.env.MONGO_DB || "myapp",
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
});

// Load schemas
const schema = loadSchema("schemas/user/userSchema.yml");
const queries = loadSchema("schemas/user/queries.yml");
const api = loadSchema("schemas/user/api.yml");

// Generate routes
const userRoutes = generateRoutes(schema, queries, api);
app.use("/api", userRoutes);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

### Connection Pooling

```typescript
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI, {
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

// Connect once on app start
await client.connect();

// Share client across your app
export const db = client.db(process.env.MONGO_DB);
```

## MongoDB-Specific Features

### Data Types

```yaml
# Numeric
age: int
price: double
quantity: long

# Text
name: string
bio: string

# Date
created_at: date
updated_at: date

# Object/JSON
metadata: object
settings: object

# Arrays
tags: array
comments: array

# Boolean
is_active: boolean

# Auto-generated ID
_id: ObjectId     # Automatic
```

### Schemaless Flexibility

Unlike SQL, MongoDB collections don't enforce schema:

```typescript
// Can insert documents with different structures
db.users.insertOne({ name: "John" });
db.users.insertOne({ name: "Jane", phone: "555-1234" });
db.users.insertOne({ name: "Bob", email: "bob@example.com", age: 30 });
```

### Indexes

```typescript
// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ created_at: -1 });
db.users.createIndex({ status: 1, created_at: -1 });
db.users.createIndex({ tags: 1 });  // Array index

// Text index for search
db.posts.createIndex({ title: "text", content: "text" });

// Compound index
db.orders.createIndex({ 
  customer_id: 1, 
  created_at: -1 
});

// TTL index (auto-delete after time)
db.sessions.createIndex(
  { created_at: 1 }, 
  { expireAfterSeconds: 3600 }
);
```

### Query Examples

```typescript
// Find all users
db.users.find({})

// Find with conditions
db.users.find({ status: "active", role: "admin" })

// Find with operators
db.users.find({ age: { $gt: 18, $lt: 65 } })

// Array contains
db.posts.find({ tags: "javascript" })

// Array operations
db.posts.find({ tags: { $in: ["javascript", "node"] } })

// Text search
db.posts.find({ $text: { $search: "mongodb tutorial" } })

// Projection (select fields)
db.users.find({}, { username: 1, email: 1, _id: 0 })

// Sorting
db.users.find({}).sort({ created_at: -1 }).limit(10)

// Aggregation
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customer_id", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
])
```

### Transactions

```typescript
// MongoDB transactions (version 4.0+)
const session = client.startSession();

try {
  await session.withTransaction(async () => {
    const usersCollection = db.collection("users");
    const walletsCollection = db.collection("wallets");
    
    // Debit wallet
    await walletsCollection.updateOne(
      { user_id: userId },
      { $inc: { balance: -amount } },
      { session }
    );
    
    // Credit wallet
    await walletsCollection.updateOne(
      { user_id: recipientId },
      { $inc: { balance: amount } },
      { session }
    );
  });
} finally {
  await session.endSession();
}
```

### Aggregation Pipeline

```yaml
# Complex queries using aggregation
topAuthors:
  type: AGGREGATE
  pipeline:
    - $match: { status: "published" }
    - $group:
        _id: $author_id
        post_count: { $sum: 1 }
        total_views: { $sum: $views }
    - $sort: { total_views: -1 }
    - $limit: 10
    - $lookup:
        from: "users"
        localField: "_id"
        foreignField: "_id"
        as: "author"
```

## Nectarine Schema for MongoDB

### Schema Definition

```yaml
User:
  collection: users    # MongoDB collection name
  fields:
    _id: ObjectId
    username: string UNIQUE NOT NULL
    email: string UNIQUE NOT NULL
    password: string NOT NULL
    profile:
      first_name: string
      last_name: string
      avatar: string
    tags: array
    status: enum(active, inactive, suspended) DEFAULT 'active'
    created_at: date DEFAULT NOW()
    updated_at: date DEFAULT NOW()

Post:
  collection: posts
  fields:
    _id: ObjectId
    title: string NOT NULL
    content: string NOT NULL
    author_id: ObjectId REFERENCES users._id
    comments: array
    tags: array
    metadata:
      views: int
      likes: int
    created_at: date DEFAULT NOW()
```

### Query Definition

```yaml
user:
  read:
    all:
      type: FIND
      collection: users
      fields: { username: 1, email: 1, created_at: 1 }
      sort: { created_at: -1 }
    
    byId:
      type: FIND_ONE
      collection: users
      filter: { _id: $1 }
    
    activeUsers:
      type: FIND
      collection: users
      filter: { status: "active" }
  
  create:
    new:
      type: INSERT_ONE
      collection: users
  
  update:
    updateProfile:
      type: UPDATE_ONE
      collection: users
      filter: { _id: $1 }
      update: { $set: { profile: $2 } }
  
  delete:
    remove:
      type: DELETE_ONE
      collection: users
      filter: { _id: $1 }
```

## Best Practices

✓ **Do**:
- Use indexes on frequently queried fields
- Use connection pooling
- Set TTL indexes for temporary data
- Validate data with schemas (Zod)
- Use transactions for related operations
- Organize documents logically
- Monitor indexes with `db.collection.getIndexes()`

✗ **Don't**:
- Store massive arrays (embed limit: 16MB)
- Ignore indexes
- Connect without pooling
- Use text search without indexes
- Store unrelated data in one collection

## Backup and Restore

```bash
# Backup
mongodump --db myapp --out ./backup

# Backup with compression
mongodump --db myapp --archive=myapp.archive --gzip

# Restore
mongorestore ./backup/myapp

# Restore from archive
mongorestore --archive=myapp.archive --gzip
```

## Monitoring

```bash
# Connect to MongoDB
mongosh

# Check collection stats
db.users.stats()

# Check database stats
db.stats()

# List indexes
db.users.getIndexes()

# Check query plan
db.users.find({ email: "test@example.com" }).explain("executionStats")

# Monitor operations
db.currentOp()
```

## Common Issues

### Connection Timeout

```typescript
// Increase timeout
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});
```

### Memory Issues

```typescript
// Limit results
db.collection.find({}).limit(1000)

// Use aggregation with $limit
db.collection.aggregate([
  { $match: { status: "active" } },
  { $limit: 1000 }
])
```

### Slow Queries

```bash
# Enable profiling
db.setProfilingLevel(1, { slowms: 100 })

# View slow queries
db.system.profile.find().sort({ ts: -1 }).limit(10)
```

## Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Node Driver](https://www.mongodb.com/docs/drivers/node/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Mongoosh Documentation](https://docs.mongodb.com/mongodb-shell/)