# Nectarine Schema Definition Guide

Complete guide to defining data models with Nectarine schemas.

## Overview

A schema in Nectarine is a YAML file that defines your data models, fields, types, and relationships. This file becomes the single source of truth for your backend data structure.

## File Location

```
schemas/
└── modelName/
    ├── schema.yml           # Model definitions
    ├── queries.yml          # Query definitions
    └── api.yml              # Route definitions
```

Example:
```
schemas/
└── user/
    ├── userSchema.yml
    ├── userQueries.yml
    └── userAPI.yml
```

---

## Basic Schema Structure

### Minimal Schema

```yaml
User:
  table: users
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    name: VARCHAR(100) NOT NULL
```

### Complete Schema

```yaml
User:
  table: users
  description: "User accounts"
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    username: VARCHAR(100) UNIQUE NOT NULL
    email: VARCHAR(100) UNIQUE NOT NULL
    password: VARCHAR(255) NOT NULL
    role: enum(admin, author, user) DEFAULT 'user'
    is_active: boolean DEFAULT true
    created_at: timestamp DEFAULT NOW()
    updated_at: timestamp DEFAULT NOW()
  relationships:
    posts: Post[]
    comments: Comment[]
```

### Property Details

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| Model Name | String | ✓ | Name of the model (e.g., "User", "Post") |
| `table` | String | ✓ | Database table name |
| `description` | String | | Documentation for the model |
| `fields` | Object | ✓ | Field definitions |
| `relationships` | Object | | Related models |

---

## Field Definitions

### Field Syntax

```yaml
fieldName: dataType [CONSTRAINTS]

# Examples
id: int PRIMARY KEY AUTO_INCREMENT
username: VARCHAR(50) UNIQUE NOT NULL
role: enum(admin, user) DEFAULT 'user'
is_active: boolean DEFAULT true
created_at: timestamp DEFAULT NOW()
```

### Core Data Types

#### Integer Types

```yaml
# Small quantities (recommended for flags, enums)
small_count: smallint

# Standard integers (IDs, counts)
quantity: int
user_id: int

# Large numbers (big timestamps, big integers)
big_number: bigint

# Decimal numbers (prices, percentages)
price: decimal(10, 2)
percentage: decimal(5, 2)

# Floating point
rating: float
score: float
```

#### Text Types

```yaml
# Fixed-length strings
country_code: char(2)
state_code: char(2)

# Variable-length strings (most common)
username: VARCHAR(50)
email: VARCHAR(100)
password: VARCHAR(255)
title: VARCHAR(255)

# Unlimited text
bio: text
description: text
content: text
body: text

# Generic string (auto VARCHAR(255))
name: string
```

#### Date/Time Types

```yaml
# Date only
birth_date: date
event_date: date

# Time only
start_time: time
end_time: time

# Date and time (most common)
created_at: timestamp
updated_at: timestamp
deleted_at: timestamp

# Alternative timestamp format
publication_date: datetime
expiration_date: datetime
```

#### Boolean Type

```yaml
# Flags and status
is_active: boolean
is_verified: boolean
is_deleted: boolean
is_premium: boolean
```

#### Enum Type

```yaml
# Fixed set of values
status: enum(active, inactive, pending)
role: enum(admin, author, user, guest)
priority: enum(high, medium, low)
difficulty: enum(easy, medium, hard, expert)
```

#### JSON Type (Advanced)

```yaml
# Store structured data (PostgreSQL/MySQL compatible)
metadata: json
settings: json
tags: json
```

---

## Field Constraints

### PRIMARY KEY

Unique identifier for each row (usually ID).

```yaml
id: int PRIMARY KEY AUTO_INCREMENT
```

- Each table needs exactly one
- Usually paired with AUTO_INCREMENT
- Automatically indexed
- Enforces uniqueness

### FOREIGN KEY

Reference to another table.

```yaml
author_id: int FOREIGN KEY REFERENCES users(id)
category_id: int FOREIGN KEY REFERENCES categories(id)
parent_id: int FOREIGN KEY REFERENCES comments(id)
```

**Syntax**: `FOREIGN KEY REFERENCES tableName(fieldName)`

**Use cases**:
- Link users to posts
- Link authors to comments
- Link orders to customers
- Hierarchical relationships

```yaml
# Multi-table example
Post:
  fields:
    author_id: int FOREIGN KEY REFERENCES users(id)
    category_id: int FOREIGN KEY REFERENCES categories(id)

Comment:
  fields:
    post_id: int FOREIGN KEY REFERENCES posts(id)
    author_id: int FOREIGN KEY REFERENCES users(id)
```

### UNIQUE

Ensure no duplicate values.

```yaml
username: VARCHAR(100) UNIQUE
email: VARCHAR(100) UNIQUE NOT NULL
user_code: VARCHAR(20) UNIQUE
```

**Common uses**:
- Usernames
- Email addresses
- Account numbers
- Unique codes

### NOT NULL

Field value is required.

```yaml
username: VARCHAR(100) NOT NULL
email: VARCHAR(100) NOT NULL
created_at: timestamp DEFAULT NOW() NOT NULL
```

**Without NOT NULL** - field is optional:
```yaml
middle_name: VARCHAR(50)        # Optional
phone: VARCHAR(20)              # Optional
bio: text                       # Optional
```

### AUTO_INCREMENT

Automatically increment integer.

```yaml
id: int PRIMARY KEY AUTO_INCREMENT
```

**Only works with**:
- PRIMARY KEY fields
- Integer types

**Example**:
```yaml
User:
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    username: VARCHAR(100) UNIQUE NOT NULL

# Creating users automatically increments ID
POST /users {"username": "john"}
# Response: {"id": 1, "username": "john"}

POST /users {"username": "jane"}
# Response: {"id": 2, "username": "jane"}
```

### DEFAULT

Use a default value when not provided.

```yaml
# Static defaults
role: enum(admin, author, user) DEFAULT 'user'
is_active: boolean DEFAULT true
priority: enum(high, medium, low) DEFAULT 'medium'

# Dynamic defaults (database functions)
created_at: timestamp DEFAULT NOW()
updated_at: timestamp DEFAULT NOW()

# Literal defaults
status: VARCHAR(20) DEFAULT 'active'
views: int DEFAULT 0
```

**Example**:
```yaml
User:
  fields:
    role: enum(admin, author, user) DEFAULT 'user'
    is_active: boolean DEFAULT true
    created_at: timestamp DEFAULT NOW()

# Creating user without role
POST /users {"username": "john", "email": "john@example.com"}
# Automatically gets role='user', is_active=true, and current timestamp
```

---

## Complete Example: Blog Schema

```yaml
User:
  table: users
  description: "Blog authors"
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    username: VARCHAR(100) UNIQUE NOT NULL
    email: VARCHAR(100) UNIQUE NOT NULL
    password: VARCHAR(255) NOT NULL
    first_name: VARCHAR(50)
    last_name: VARCHAR(50)
    bio: text
    is_active: boolean DEFAULT true
    created_at: timestamp DEFAULT NOW()
    updated_at: timestamp DEFAULT NOW()
  relationships:
    posts: Post[]
    comments: Comment[]

Post:
  table: posts
  description: "Blog posts"
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    title: VARCHAR(255) NOT NULL
    slug: VARCHAR(255) UNIQUE NOT NULL
    content: text NOT NULL
    excerpt: VARCHAR(500)
    author_id: int FOREIGN KEY REFERENCES users(id) NOT NULL
    category_id: int FOREIGN KEY REFERENCES categories(id)
    status: enum(draft, published, archived) DEFAULT 'draft'
    views: int DEFAULT 0
    likes: int DEFAULT 0
    featured: boolean DEFAULT false
    published_at: timestamp
    created_at: timestamp DEFAULT NOW()
    updated_at: timestamp DEFAULT NOW()
  relationships:
    author: User
    comments: Comment[]
    tags: Tag[]

Comment:
  table: comments
  description: "Comments on posts"
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    content: text NOT NULL
    post_id: int FOREIGN KEY REFERENCES posts(id) NOT NULL
    author_id: int FOREIGN KEY REFERENCES users(id) NOT NULL
    parent_id: int FOREIGN KEY REFERENCES comments(id)
    likes: int DEFAULT 0
    is_approved: boolean DEFAULT false
    created_at: timestamp DEFAULT NOW()
    updated_at: timestamp DEFAULT NOW()
  relationships:
    post: Post
    author: User
    replies: Comment[]

Category:
  table: categories
  description: "Post categories"
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    name: VARCHAR(100) UNIQUE NOT NULL
    slug: VARCHAR(100) UNIQUE NOT NULL
    description: text
    icon: VARCHAR(255)
    color: VARCHAR(7)
    created_at: timestamp DEFAULT NOW()
  relationships:
    posts: Post[]

Tag:
  table: tags
  description: "Post tags"
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    name: VARCHAR(100) UNIQUE NOT NULL
    slug: VARCHAR(100) UNIQUE NOT NULL
    created_at: timestamp DEFAULT NOW()
  relationships:
    posts: Post[]
```

---

## Relationships

### One-to-Many

One user has many posts:

```yaml
User:
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    username: VARCHAR(100)
  relationships:
    posts: Post[]

Post:
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    author_id: int FOREIGN KEY REFERENCES users(id)
    title: VARCHAR(255)
```

### Many-to-Many

Posts have many tags, tags have many posts:

```yaml
Post:
  fields:
    id: int PRIMARY KEY
    title: VARCHAR(255)
  relationships:
    tags: Tag[]

Tag:
  fields:
    id: int PRIMARY KEY
    name: VARCHAR(100)
  relationships:
    posts: Post[]

# Join table auto-created
PostTag:
  table: posts_tags
  fields:
    post_id: int FOREIGN KEY REFERENCES posts(id)
    tag_id: int FOREIGN KEY REFERENCES tags(id)
```

### Self-referential

Comments can have reply comments:

```yaml
Comment:
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    content: text
    parent_id: int FOREIGN KEY REFERENCES comments(id)
  relationships:
    parent: Comment
    replies: Comment[]
```

---

## Best Practices

### Naming Conventions

```yaml
# Table names: lowercase, plural
users, posts, comments, categories

# Column names: lowercase, snake_case
user_id, post_title, created_at, is_active

# Enum values: lowercase
status: enum(active, inactive, pending)
role: enum(admin, author, user)
```

### Field Organization

```yaml
User:
  fields:
    # 1. Identifiers
    id: int PRIMARY KEY AUTO_INCREMENT
    
    # 2. Core data
    username: VARCHAR(100) UNIQUE NOT NULL
    email: VARCHAR(100) UNIQUE NOT NULL
    password: VARCHAR(255) NOT NULL
    
    # 3. Optional data
    first_name: VARCHAR(50)
    bio: text
    
    # 4. Status/flags
    is_active: boolean DEFAULT true
    role: enum(admin, user)
    
    # 5. Timestamps
    created_at: timestamp DEFAULT NOW()
    updated_at: timestamp DEFAULT NOW()
```

### Avoid Common Mistakes

❌ **No**: Don't use boolean as string
```yaml
is_active: VARCHAR(10)  # ❌ Wrong
is_active: boolean      # ✓ Correct
```

❌ **No**: Don't make everything UNIQUE
```yaml
User:
  fields:
    email: VARCHAR(100) UNIQUE      # ✓ Good
    name: VARCHAR(100) UNIQUE       # ❌ Probably wrong
```

❌ **No**: Don't forget timestamps
```yaml
Post:
  fields:
    title: VARCHAR(255)
    # ❌ Missing created_at, updated_at
```

✓ **Yes**: Always include timestamps
```yaml
Post:
  fields:
    title: VARCHAR(255)
    created_at: timestamp DEFAULT NOW()
    updated_at: timestamp DEFAULT NOW()
```

### Performance Tips

```yaml
# Index frequently queried fields
username: VARCHAR(100) UNIQUE              # AUTO-indexed
email: VARCHAR(100) UNIQUE                 # AUTO-indexed
status: enum(...) DEFAULT 'active'         # Consider indexing

# Don't over-normalize
# Usually OK to store denormalized data
user:
  fields:
    username: VARCHAR(100)                 # Store here
    author_email: VARCHAR(100)             # Also store here for performance

# Use appropriate field sizes
# Don't: VARCHAR(5000) for usernames
username: VARCHAR(100)                     # ✓ Appropriate
# Do: VARCHAR(100) for most text fields
```

---

## Testing Your Schema

### Create Test Schema

```yaml
# schemas/store/productSchema.yml
Product:
  table: products
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    name: VARCHAR(255) NOT NULL
    price: decimal(10, 2) NOT NULL
    stock: int DEFAULT 0
    is_active: boolean DEFAULT true

Order:
  table: orders
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    customer_id: int NOT NULL
    total: decimal(10, 2)
    created_at: timestamp DEFAULT NOW()
```

### Validate Schema

```typescript
import { loadSchema, compileSchema } from "@citrusworx/nectarine";

const schema = loadSchema("schemas/store/productSchema.yml");
const sql = compileSchema(schema, "postgres");

console.log(sql);
// CREATE TABLE products (
//   id SERIAL PRIMARY KEY,
//   name VARCHAR(255) NOT NULL,
//   ...
// )
```