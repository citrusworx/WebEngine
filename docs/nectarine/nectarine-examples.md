# Nectarine Examples

Real-world examples using Nectarine schemas and queries.

## Table of Contents

- [Simple Blog](#simple-blog)
- [E-Commerce Store](#e-commerce-store)
- [SaaS Application](#saas-application)
- [CMS System](#cms-system)

---

## Simple Blog

A complete blog with users, posts, comments, and categories.

### Schema: blogSchema.yml

```yaml
User:
  table: users
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    username: VARCHAR(100) UNIQUE NOT NULL
    email: VARCHAR(100) UNIQUE NOT NULL
    password: VARCHAR(255) NOT NULL
    bio: text
    avatar: VARCHAR(255)
    is_verified: boolean DEFAULT false
    created_at: timestamp DEFAULT NOW()

Post:
  table: posts
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
    published_at: timestamp
    created_at: timestamp DEFAULT NOW()
    updated_at: timestamp DEFAULT NOW()

Category:
  table: categories
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    name: VARCHAR(100) UNIQUE NOT NULL
    slug: VARCHAR(100) UNIQUE NOT NULL
    description: text
    color: VARCHAR(7) DEFAULT '#0066cc'

Comment:
  table: comments
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    content: text NOT NULL
    post_id: int FOREIGN KEY REFERENCES posts(id) NOT NULL
    author_id: int FOREIGN KEY REFERENCES users(id) NOT NULL
    is_approved: boolean DEFAULT false
    likes: int DEFAULT 0
    created_at: timestamp DEFAULT NOW()
```

### Queries: blogQueries.yml

```yaml
user:
  read:
    all:
      type: SELECT
      table: users
      fields: [id, username, email, bio, avatar, is_verified, created_at]
      orderBy: created_at DESC
    
    byId:
      type: SELECT
      table: users
      fields: '*'
      where: id = $1
    
    byUsername:
      type: SELECT
      table: users
      fields: [id, username, email, bio, avatar]
      where: username = $1
  
  create:
    new:
      type: INSERT
      table: users
      fields: [username, email, password, bio]
      returning: [id, username, email]
  
  update:
    profile:
      type: UPDATE
      table: users
      where: id = $1
      fields: [bio, avatar]
      returning: '*'

post:
  read:
    published:
      type: SELECT
      table: posts
      fields: [id, title, slug, excerpt, author_id, category_id, views, published_at]
      where: status = 'published'
      orderBy: published_at DESC
    
    bySlug:
      type: SELECT
      table: posts
      fields: '*'
      where: slug = $1
  
  create:
    new:
      type: INSERT
      table: posts
      fields: [title, slug, content, excerpt, author_id, category_id, status]
      returning: '*'
  
  update:
    publish:
      type: UPDATE
      table: posts
      where: id = $1
      fields: [status, published_at]
      returning: '*'

comment:
  read:
    byPost:
      type: SELECT
      table: comments
      fields: '*'
      where: post_id = $1 AND is_approved = true
      orderBy: created_at DESC
  
  create:
    new:
      type: INSERT
      table: comments
      fields: [content, post_id, author_id]
      returning: '*'
  
  update:
    approve:
      type: UPDATE
      table: comments
      where: id = $1
      fields: [is_approved]
      returning: '*'
```

### API Routes: blogAPI.yml

```yaml
user:
  read:
    all:
      api:
        method: GET
        endpoint: /users
    
    byId:
      api:
        method: GET
        endpoint: /users/:id
    
    byUsername:
      api:
        method: GET
        endpoint: /users/@:username
  
  create:
    new:
      api:
        method: POST
        endpoint: /users

post:
  read:
    published:
      api:
        method: GET
        endpoint: /posts
    
    bySlug:
      api:
        method: GET
        endpoint: /posts/:slug
  
  create:
    new:
      api:
        method: POST
        endpoint: /posts
  
  update:
    publish:
      api:
        method: PATCH
        endpoint: /posts/:id/publish

comment:
  read:
    byPost:
      api:
        method: GET
        endpoint: /posts/:postId/comments
  
  create:
    new:
      api:
        method: POST
        endpoint: /posts/:postId/comments
  
  update:
    approve:
      api:
        method: PATCH
        endpoint: /comments/:id/approve
```

### Usage Example

```typescript
import express from "express";
import { loadSchema, generateRoutes } from "@citrusworx/nectarine";

const app = express();
app.use(express.json());

// Load schemas
const schema = loadSchema("schemas/blog/blogSchema.yml");
const queries = loadSchema("schemas/blog/blogQueries.yml");
const api = loadSchema("schemas/blog/blogAPI.yml");

// Generate routes
const routes = generateRoutes(schema, queries, api);
app.use("/api", routes);

// Test API
app.listen(3000, () => {
  console.log("Blog API running on http://localhost:3000");
  console.log("GET http://localhost:3000/api/posts");
  console.log("POST http://localhost:3000/api/users");
});
```

### Example API Calls

```bash
# Get all published posts
curl http://localhost:3000/api/posts

# Get post by slug
curl http://localhost:3000/api/posts/my-first-post

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","email":"john@example.com","password":"secret"}'

# Get user by ID
curl http://localhost:3000/api/users/1

# Create post
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title":"My First Post",
    "slug":"my-first-post",
    "content":"This is my content",
    "author_id":1,
    "status":"published"
  }'

# Get comments on post
curl http://localhost:3000/api/posts/1/comments

# Create comment
curl -X POST http://localhost:3000/api/posts/1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content":"Great post!",
    "author_id":2
  }'
```

---

## E-Commerce Store

A complete e-commerce system with products, orders, and inventory.

### Schema: storeSchema.yml

```yaml
Customer:
  table: customers
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    email: VARCHAR(100) UNIQUE NOT NULL
    password: VARCHAR(255) NOT NULL
    first_name: VARCHAR(50) NOT NULL
    last_name: VARCHAR(50) NOT NULL
    phone: VARCHAR(20)
    is_premium: boolean DEFAULT false
    total_spent: decimal(12, 2) DEFAULT 0
    created_at: timestamp DEFAULT NOW()

Product:
  table: products
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    name: VARCHAR(255) NOT NULL
    slug: VARCHAR(255) UNIQUE NOT NULL
    description: text
    price: decimal(10, 2) NOT NULL
    cost: decimal(10, 2)
    stock: int DEFAULT 0
    category_id: int FOREIGN KEY REFERENCES categories(id)
    sku: VARCHAR(100) UNIQUE NOT NULL
    image_url: VARCHAR(255)
    is_active: boolean DEFAULT true
    views: int DEFAULT 0
    created_at: timestamp DEFAULT NOW()

Category:
  table: categories
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    name: VARCHAR(100) UNIQUE NOT NULL
    description: text
    image_url: VARCHAR(255)

Order:
  table: orders
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    customer_id: int FOREIGN KEY REFERENCES customers(id) NOT NULL
    status: enum(pending, processing, shipped, delivered, cancelled) DEFAULT 'pending'
    subtotal: decimal(12, 2) NOT NULL
    tax: decimal(10, 2) DEFAULT 0
    shipping: decimal(10, 2) DEFAULT 10
    total: decimal(12, 2) NOT NULL
    payment_method: enum(credit_card, paypal, bank_transfer) NOT NULL
    shipping_address: text
    created_at: timestamp DEFAULT NOW()
    shipped_at: timestamp
    delivered_at: timestamp

OrderItem:
  table: order_items
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    order_id: int FOREIGN KEY REFERENCES orders(id) NOT NULL
    product_id: int FOREIGN KEY REFERENCES products(id) NOT NULL
    quantity: int NOT NULL
    price: decimal(10, 2) NOT NULL
    discount: decimal(10, 2) DEFAULT 0

Review:
  table: reviews
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    product_id: int FOREIGN KEY REFERENCES products(id) NOT NULL
    customer_id: int FOREIGN KEY REFERENCES customers(id) NOT NULL
    rating: int NOT NULL
    title: VARCHAR(255)
    content: text
    helpful: int DEFAULT 0
    created_at: timestamp DEFAULT NOW()
```

### Common Queries

```yaml
customer:
  read:
    active:
      type: SELECT
      table: customers
      fields: [id, email, first_name, last_name, total_spent]
      orderBy: total_spent DESC

product:
  read:
    featured:
      type: SELECT
      table: products
      fields: '*'
      where: is_active = true
      orderBy: views DESC
      limit: 10
    
    byCategory:
      type: SELECT
      table: products
      where: category_id = $1 AND is_active = true
      orderBy: name ASC

order:
  read:
    byCustomer:
      type: SELECT
      table: orders
      where: customer_id = $1
      orderBy: created_at DESC
    
    pending:
      type: SELECT
      table: orders
      where: status = 'pending'
  
  create:
    new:
      type: INSERT
      table: orders
      fields: [customer_id, subtotal, tax, shipping, total, payment_method, status]
      returning: '*'

review:
  read:
    byProduct:
      type: SELECT
      table: reviews
      where: product_id = $1
      orderBy: helpful DESC
  
  create:
    new:
      type: INSERT
      table: reviews
      fields: [product_id, customer_id, rating, title, content]
      returning: '*'
```

---

## SaaS Application

Multi-tenant SaaS with workspaces, teams, and billing.

### Schema: saasSchema.yml

```yaml
Account:
  table: accounts
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    email: VARCHAR(100) UNIQUE NOT NULL
    password: VARCHAR(255) NOT NULL
    first_name: VARCHAR(50)
    last_name: VARCHAR(50)
    avatar: VARCHAR(255)
    created_at: timestamp DEFAULT NOW()

Workspace:
  table: workspaces
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    name: VARCHAR(255) NOT NULL
    slug: VARCHAR(255) UNIQUE NOT NULL
    logo: VARCHAR(255)
    plan: enum(free, starter, pro, enterprise) DEFAULT 'free'
    status: enum(active, paused, cancelled) DEFAULT 'active'
    owner_id: int FOREIGN KEY REFERENCES accounts(id) NOT NULL
    users_limit: int DEFAULT 5
    storage_limit: int DEFAULT 1024
    created_at: timestamp DEFAULT NOW()

WorkspaceUser:
  table: workspace_users
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    workspace_id: int FOREIGN KEY REFERENCES workspaces(id) NOT NULL
    account_id: int FOREIGN KEY REFERENCES accounts(id) NOT NULL
    role: enum(admin, member, viewer) DEFAULT 'member'
    joined_at: timestamp DEFAULT NOW()

Invite:
  table: invites
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    workspace_id: int FOREIGN KEY REFERENCES workspaces(id) NOT NULL
    email: VARCHAR(100) NOT NULL
    role: enum(admin, member, viewer) DEFAULT 'member'
    token: VARCHAR(255) UNIQUE NOT NULL
    expires_at: timestamp NOT NULL
    created_at: timestamp DEFAULT NOW()
    accepted_at: timestamp

Billing:
  table: billing
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    workspace_id: int FOREIGN KEY REFERENCES workspaces(id) NOT NULL
    plan: VARCHAR(50) NOT NULL
    status: enum(active, past_due, cancelled) DEFAULT 'active'
    monthly_cost: decimal(10, 2) NOT NULL
    next_billing_date: date
    card_last4: VARCHAR(4)
    created_at: timestamp DEFAULT NOW()
```

### API Routes Example

```yaml
workspace:
  read:
    list:
      api:
        method: GET
        endpoint: /workspaces
    
    byId:
      api:
        method: GET
        endpoint: /workspaces/:id

invite:
  create:
    send:
      api:
        method: POST
        endpoint: /workspaces/:id/invites

billing:
  read:
    current:
      api:
        method: GET
        endpoint: /workspaces/:id/billing
  
  update:
    upgrade:
      api:
        method: POST
        endpoint: /workspaces/:id/billing/upgrade
```

---

## CMS System

Flexible content management system with pages, media, and publishing.

### Schema: cmsSchema.yml

```yaml
Page:
  table: pages
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    title: VARCHAR(255) NOT NULL
    slug: VARCHAR(255) UNIQUE NOT NULL
    content: text NOT NULL
    seo_title: VARCHAR(255)
    seo_description: VARCHAR(500)
    meta_keywords: VARCHAR(255)
    featured_image_id: int FOREIGN KEY REFERENCES media(id)
    author_id: int FOREIGN KEY REFERENCES users(id) NOT NULL
    status: enum(draft, published, scheduled) DEFAULT 'draft'
    published_at: timestamp
    scheduled_for: timestamp
    view_count: int DEFAULT 0
    created_at: timestamp DEFAULT NOW()
    updated_at: timestamp DEFAULT NOW()

Media:
  table: media
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    filename: VARCHAR(255) NOT NULL
    url: VARCHAR(255) NOT NULL
    mime_type: VARCHAR(50)
    size: int
    width: int
    height: int
    alt_text: VARCHAR(255)
    uploaded_by: int FOREIGN KEY REFERENCES users(id)
    uploaded_at: timestamp DEFAULT NOW()

Navigation:
  table: navigation
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    label: VARCHAR(100) NOT NULL
    url: VARCHAR(255)
    page_id: int FOREIGN KEY REFERENCES pages(id)
    parent_id: int FOREIGN KEY REFERENCES navigation(id)
    order: int DEFAULT 0
    is_visible: boolean DEFAULT true

Menu:
  table: menus
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    name: VARCHAR(100) UNIQUE NOT NULL
    items: int DEFAULT 0

Widget:
  table: widgets
  fields:
    id: int PRIMARY KEY AUTO_INCREMENT
    page_id: int FOREIGN KEY REFERENCES pages(id)
    type: enum(text, image, video, cta, about, testimonial) NOT NULL
    content: json
    order: int DEFAULT 0
```

### Common Patterns

```yaml
# Get published pages
page:
  read:
    published:
      type: SELECT
      table: pages
      where: status = 'published'
      orderBy: published_at DESC

# Get page with media
page:
  read:
    withImage:
      type: SELECT
      table: pages
      join: media ON pages.featured_image_id = media.id
      where: pages.slug = $1

# Get navigation tree
navigation:
  read:
    byMenu:
      type: SELECT
      table: navigation
      where: parent_id IS NULL
      orderBy: order ASC
```

---

## Tips for Building Schemas

1. **Start Simple**: Begin with basic schemas, add complexity as needed
2. **Think in Relations**: Consider how data relates to each other
3. **Use Enums**: For fixed sets of values (status, role, type)
4. **Add Timestamps**: Always include `created_at` and `updated_at`
5. **Normalize When Needed**: Use foreign keys for relationships
6. **Index Frequently Queried Fields**: Use UNIQUE for lookups
7. **Size Fields Appropriately**: Don't use VARCHAR(5000) for usernames
8. **Plan for Growth**: Consider pagination and filtering early
9. **Test Queries**: Make sure your queries are efficient
10. **Document Your Schema**: Add descriptions for clarity