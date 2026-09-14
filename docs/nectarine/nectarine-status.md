# Nectarine Project Status

Current state, roadmap, and future direction of Nectarine.

## Current Version: 0.0.1

Nectarine is in **early alpha**. Core concepts are proven, but many features are still in development.

---

## What's Working ✓

### Core Schema System
- ✓ YAML schema definitions
- ✓ Field type support (int, string, varchar, text, date, timestamp, enum, etc.)
- ✓ Constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, DEFAULT, AUTO_INCREMENT)
- ✓ Automatic index creation for PRIMARY/UNIQUE/FOREIGN keys

### Database Adapters
- ✓ PostgreSQL adapter
- ✓ Basic MySQL support
- ✓ MongoDB support (collections and aggregation)
- ✓ Connection pooling (all adapters)

### Query System
- ✓ SELECT queries (filtering, sorting, limiting)
- ✓ INSERT queries (create operations)
- ✓ UPDATE queries (modify operations)
- ✓ DELETE queries (remove operations)
- ✓ Parameter binding ($1, $2 style)
- ✓ WHERE clauses and conditions

### API contracts
- ✓ YAML API definitions (`*API.yml`) per resource
- ✓ WebEngine / Blackwater hosts with Seltzer (`transport.server: seltzer`)
- ✓ HTTP method mapping in API YAML (GET, POST, PUT, PATCH, DELETE)
- ✓ Path parameter shapes (`:id`, `:name`, etc.)
- 🔄 Seltzer route auto-wiring from API YAML (next engine step)
- Express is **not** the generated or default server

### Validation
- Planned: Zod schema validation on the Seltzer-hosted path
- Schema field types (required, unique, enums) are the intended source of those rules
- Hosts register object-based Seltzer routes by hand until auto-wiring lands

### Schema Distribution
- ✓ Pre-built schemas: User, Blog, CMS, Store, Banking
- ✓ Easy schema loading and composition
- ✓ Schema extension and override support

---

## What's In Development 🔄

### Query Compiler
- Current: Phonics compiler — canonical CRUD YAML plus Blackwater `type: SELECT` (normalized), plus schema YAML → `CREATE TABLE` / indexes. Adapters execute `(sql, params)` only. JSONB columns and `$N::jsonb` binds are supported; JSONB is not being dropped.
- Planned: Optimization layer, query planning, JSONB operators (`@>`, `?`, `->>`)

### Schema Registry
- Current: File-based loading
- Planned: Runtime schema registry, schema versioning

### Host pipeline
- Current: WebEngine / Blackwater registers object-based Seltzer `Route` handlers
- Planned: Seltzer pipeline stages (parse, validate with Zod, authorize) plus auto-wiring from API YAML

### Relationship Loading
- Current: Manual join definitions
- Planned: Automatic relationship resolver, nested population

### Advanced Features
- Current: Basic enum and array support
- Planned: Full-text search, geospatial queries, graph relationships

---

## What's Planned 📋

### Immediate (Next 2-4 weeks)

- [ ] **MySQL Full Support**
  - Complete adapter implementation
  - Type coercion for MySQL-specific types
  - Example schemas (e-commerce with MySQL)

- [ ] **Query Optimization**
  - Index usage analysis
  - Query plan explanations
  - Performance recommendations

- [ ] **Relations System**
  - Auto-population of related records
  - Nested query support
  - Circular reference handling

### Short Term (1-3 months)

- [ ] **GraphQL Support**
  - Auto-generate GraphQL schemas from Nectarine schemas
  - GraphQL query resolver generation
  - Mutation support

- [ ] **Caching Layer**
  - Built-in query result caching
  - Cache invalidation strategies
  - Redis integration

- [ ] **Hooks System**
  - Pre/post hooks on CRUD operations
  - Custom business logic integration
  - Audit logging hooks

- [ ] **Real-time Features**
  - WebSocket support
  - Live query subscriptions
  - Change streams

### Medium Term (3-6 months)

- [ ] **Permissions & Authorization**
  - Row-level security
  - Column-level permissions
  - Role-based access control (RBAC)

- [ ] **Audit Logging**
  - Automatic change tracking
  - User action logging
  - Temporal queries (point-in-time)

- [ ] **Multi-tenant Support**
  - Tenant isolation
  - Cross-tenant queries
  - Tenant-aware migrations

- [ ] **API Documentation**
  - Auto-generated OpenAPI/Swagger docs
  - Interactive API explorer
  - API versioning support

### Long Term (6-12 months)

- [ ] **Advanced Query Features**
  - Full-text search
  - Geospatial queries
  - Complex aggregations

- [ ] **Performance Monitoring**
  - Query performance metrics
  - Slowlog integration
  - Index recommendations

- [ ] **Backup & Restore**
  - Automatic backup strategies
  - Point-in-time recovery
  - Cross-database migration

- [ ] **CLI Tools**
  - Schema scaffolding
  - Migration generators
  - Database seeding

---

## Known Limitations

### Current Constraints

1. **Single Table Per Model**
   - Cannot inherit columns from parent models
   - **Workaround**: Use composition with foreign keys

2. **Limited Transaction Support**
   - No cross-adapter transactions
   - **Workaround**: Keep related operations in same adapter

3. **No Built-in Caching**
   - Every request queries the database
   - **Workaround**: Implement Redis in your application

4. **No Authentication Out-of-Box**
   - No JWT/session handling (yet)
   - **Workaround**: Guard Seltzer handlers (or a future pipeline stage) on the host

5. **No Authorization Rules**
   - All routes accessible if specified
   - **Workaround**: Add checks in the Seltzer `Route` handler until host middleware/pipeline stages exist

6. **Limited Aggregation**
   - Basic aggregations only
   - **Workaround**: Use raw MongoDB/SQL for complex queries

7. **No Migration History**
   - Migrations are schema snapshots
   - **Workaround**: Version control your schema files

### Database-Specific Limitations

**PostgreSQL**:
- Array types partially supported
- JSONB is first-class: named query YAML can select `payload` and bind `{ value: $N, cast: jsonb }`
- Window functions need custom query definitions

**MySQL**:
- Limited transaction features
- JSON support varies by version
- Full-text search not yet integrated

**MongoDB**:
- Cannot query across collections easily
- Transactions have limitations (single shard)
- Schema enforcement is optional

---

## Performance Characteristics

### Query Performance

- **Small databases** (< 1M rows): All queries < 10ms
- **Medium databases** (1M-100M rows): Needs indexes, < 100ms
- **Large databases** (> 100M rows): Requires query optimization

### Connection Overhead

- Pool initialization: ~100-500ms
- Connection acquisition: < 1ms (cached)
- Query execution: Depends on complexity

### Memory Usage

- Base server: ~50MB
- Connection pool (20 connections): ~5-10MB
- Worker process: ~30-40MB per

---

## Comparison with Similar Tools

### vs. Prisma

| Feature | Nectarine | Prisma |
|---------|-----------|--------|
| Config Format | YAML | JavaScript |
| Databases | 3+ | 10+ |
| Schema Generation | Automatic | Manual |
| Speed to First Query | Minutes | Hours |
| Maturity | Alpha | Production |
| Learning Curve | Shallow | Moderate |

**Choose Nectarine if**: You want rapid backend prototyping with YAML config

**Choose Prisma if**: You need production-grade ORM with extensive features

### vs. Supabase

| Feature | Nectarine | Supabase |
|---------|-----------|----------|
| Deployment | Self-hosted | Cloud |
| Setup Time | Minutes | Minutes |
| Cost | $0 (self-hosted) | $25-1000/month |
| GraphQL | Planned | Built-in |
| Auth | Manual | Built-in |
| Real-time | Planned | Built-in |

**Choose Nectarine if**: You want control and no vendor lock-in

**Choose Supabase if**: You want managed infrastructure and auth

### vs. Firebase

| Feature | Nectarine | Firebase |
|---------|-----------|----------|
| Data Model | Relational | NoSQL |
| SQL | Yes | No |
| Transactions | Limited | Good |
| Authentication | Manual | Built-in |
| Cost | $0 | Pay-per-use |
| Vendor Lock-in | No | Yes |

**Choose Nectarine if**: You prefer relational databases and cheap hosting

**Choose Firebase if**: You want managed infrastructure and real-time

---

## Contributing

Nectarine is actively developed. Areas where help is needed:

### Documentation
- Add more schema examples
- Database-specific guides for MySQL
- Performance tuning guides
- Video tutorials

### Testing
- Add comprehensive unit tests
- Performance benchmarks
- Database compatibility tests
- Edge case coverage

### Features
- MySQL full support
- GraphQL adapter
- Caching layer
- Permission system

### Database Support
- TypeORM plugin
- SQLite support
- Oracle support
- Elasticsearch integration

---

## Roadmap Summary

```
v0.0.1 (Current)
├─ Core schema system ✓
├─ PostgreSQL adapter ✓
├─ MongoDB adapter ✓
├─ Basic query compiler ✓
├─ nectarine.config.yaml ✓
└─ Seltzer hosting (WebEngine / Blackwater) ✓
   Route auto-wiring from API YAML → next engine step

v0.1.0
├─ MySQL full support
├─ Query optimization
├─ Relationship loader
└─ Enhanced documentation

v0.2.0
├─ Auto-wired Seltzer routes from API YAML
├─ Zod validation on the hosted path
├─ GraphQL support (later)
└─ Caching layer
```

---

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Documentation**: See other guides in this folder
- **Examples**: Check `nectarine-examples.md` for real-world usage
- **Database Guides**: 
  - PostgreSQL: `nectarine-postgresql.md`
  - MongoDB: `nectarine-mongodb.md`

---

## Version History

### v0.0.1 (Current)
- Initial alpha release
- Basic schema definitions
- PostgreSQL & MongoDB support
- Config loader (`nectarine.config.yaml`, `transport.server: seltzer`)
- Seltzer as the WebEngine / Blackwater HTTP transport (not Express)
- Zod planned as validation on the hosted path

---

## Next Steps

1. **Read the Getting Started Guide**: [nectarine-getting-started.md](./nectarine-getting-started.md)
2. **Review Real Examples**: [nectarine-examples.md](./nectarine-examples.md)
3. **Choose Your Database**: PostgreSQL or MongoDB guide
4. **Build Your First Backend**: Follow the getting started guide
5. **Join the Community**: Contribute feedback and improvements

---

## Feedback & Suggestions

If you're using Nectarine, we'd love to hear:
- What's working well
- What's missing
- What needs improvement
- Real-world use cases
- Performance metrics
- Bug reports

Your feedback helps guide development priorities!