# Sig.js Project Status

Current state, roadmap, and future direction of the Sig.js signals-based reactivity library.

## Current Version

**v0.0.1** (Early Development)

Sig.js is in active development. The core APIs are stable and functional, but the library is pre-1.0 and breaking changes may occur.

## What's Included

### Core Functionality ✅

- **Signal System**: Reactive state management with `.get()` and `.set()`
- **Effects**: Side effect tracking with automatic dependency detection
- **Batching**: Group multiple updates to reduce re-renders
- **Memoization**: Cached computed values with `memo()`
- **JSX Runtime**: Direct-to-DOM rendering without virtual DOM
- **Routing**: Built-in client-side router for SPAs
- **TypeScript Support**: Full type definitions included

### Build & Distribution ✅

- TypeScript compilation
- Multiple entry points:
  - Main: `@citrusworx/sigjs`
  - JSX Runtime: `@citrusworx/sigjs/jsx-runtime`
  - JSX Dev Runtime: `@citrusworx/sigjs/jsx-dev-runtime`
  - Router: `@citrusworx/sigjs/sig-router`
- Package exports configured for ES modules

### Testing ✅

- Playwright integration tests
- Signal behavior tests
- Effect lifecycle tests
- Router navigation tests
- JSX rendering tests

## Known Limitations

1. **No Server-Side Rendering (SSR)**
   - Sig.js is client-side only
   - No hydration support
   - Workaround: Use static HTML + Sig.js on the client

2. **No Virtual DOM**
   - Direct DOM manipulation
   - Faster updates but may not suit all use cases
   - Workaround: Keep components small and focused

3. **Limited Debug Tools**
   - No official DevTools extension
   - Basic console logging available
   - Workaround: Use browser DevTools + source maps

4. **No Built-in State Persistence**
   - No localStorage integration
   - No automatic serialization
   - Workaround: User can implement with localStorage API

5. **No Form Integration Library**
   - Forms must be built manually
   - Workaround: See examples in documentation

6. **No Built-in HTTP Client**
   - Use native `fetch()` API
   - Workaround: See API integration examples

## Performance Characteristics

### Strengths

- **Minimal Overhead**: No virtual DOM or reconciliation
- **Direct Updates**: Changes directly modify DOM
- **Fine-grained Reactivity**: Only affected elements re-render
- **Batch Optimization**: Grouped updates reduce DOM writes
- **Memoization**: Computed values cache automatically

### Benchmarks (Relative)

| Operation | Time | Notes |
|-----------|------|-------|
| Signal creation | ~0.1ms | Very fast |
| Signal update | ~0.05ms | Direct |
| Effect registration | ~0.2ms | Depends on tracking |
| JSX mount | ~1-5ms | Depends on component complexity |
| Router navigation | ~2-10ms | Depends on component load |

## Architecture Overview

```
Sig.js Library
├── Core reactivity (signal.ts)
│   ├── Signal: Reactive containers
│   ├── effect: Tracking function
│   ├── batch: Update grouping
│   └── memo: Computation caching
├── JSX Runtime (jsx-runtime.ts)
│   ├── Direct DOM rendering
│   ├── Attribute binding
│   ├── Event handling
│   └── Fragment support
├── Router (sig-router.ts)
│   ├── Route registration
│   ├── Navigation handling
│   ├── History management
│   └── Link interception
└── Type definitions (index.ts)
```

## Roadmap

### Phase 1: Foundation (Current)
- ✅ Core Signal system
- ✅ Effect and batch
- ✅ JSX runtime
- ✅ Router
- ✅ TypeScript support
- ✅ Basic documentation

### Phase 2: Enhancement (0.1.0)
- 🔄 DevTools/debugging tools
- 🔄 Performance monitoring utilities
- 🔄 Preact-style hooks (useSignal, useEffect)
- 🔄 Hydration support
- 🔄 Additional examples
- 🔄 Form helpers library

### Phase 3: Ecosystem (0.2.0)
- 📋 State management library (Sig + storage)
- 📋 HTTP client (fetch wrapper)
- 📋 Validation library
- 📋 Component library (with Juice integration)
- 📋 Testing utilities
- 📋 CLI tools

### Phase 4: Maturity (1.0.0)
- 📋 Server-side rendering (optional)
- 📋 Build optimizations
- 📋 Performance metrics
- 📋 Stable API guarantee
- 📋 Long-term support

Legend:
- ✅ Complete
- 🔄 In Progress
- 📋 Planned

## Integration with Other Libraries

### Juice Design System

Sig.js works seamlessly with Juice for styling:

```tsx
import { Signal } from "@citrusworx/sigjs";
import "@citrusworx/juice/dist/juice.css";

function StyledComponent() {
  const isActive = Signal(false);

  return (
    <button
      stack="horizontal"
      gap="md"
      padding="lg"
      onClick={() => isActive.set(!isActive.get())}
      className={() => isActive.get() ? "bg-primary" : "bg-gray"}
    >
      {() => (isActive.get() ? "Active" : "Inactive")}
    </button>
  );
}
```

### Nectarine Schema Library

Using Nectarine schemas with Sig.js signals:

```tsx
import { Signal } from "@citrusworx/sigjs";
import { BlogSchema } from "@citrusworx/nectarine";

function BlogEditor() {
  const post = Signal<BlogSchema>({
    title: "",
    content: "",
    published: false,
  });

  return (
    <form>
      <input
        type="text"
        value={() => post.get().title}
        onInput={(e) =>
          post.set({ ...post.get(), title: (e.target as HTMLInputElement).value })
        }
      />
    </form>
  );
}
```

### Grapevine Infrastructure

Building infrastructure dashboards with Sig.js:

```tsx
import { Signal, effect } from "@citrusworx/sigjs";
import { GrapevineClient } from "@citrusworx/grapevine";

function InfraDashboard() {
  const services = Signal([]);
  const client = new GrapevineClient();

  effect(async () => {
    const data = await client.listServices();
    services.set(data);
  });

  return (
    <div>
      {() =>
        services.get().map((service) => (
          <div key={service.id}>
            <h3>{service.name}</h3>
            <p>Status: {service.status}</p>
          </div>
        ))
      }
    </div>
  );
}
```

## Community & Support

### Documentation

- [Getting Started Guide](./sig-getting-started.md) - Quick start
- [API Reference](./sig-api.md) - Complete API documentation
- [Router Guide](./sig-router.md) - SPA routing
- [Examples](./sig-examples.md) - Real-world patterns

### Testing & Quality

Tests are located in the source directory:
- `signal.test.ts` - Signal behavior
- `router.test.ts` - Router functionality
- Run with: `npm test` or via CI/CD pipeline

### Contributing

Sig.js welcomes contributions:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request
5. Ensure all tests pass

### Bug Reports

If you find an issue:

1. Check existing issues to avoid duplicates
2. Create a minimal reproduction case
3. Include:
   - Sig.js version
   - Browser/Node version
   - Steps to reproduce
   - Expected vs actual behavior

## Version History

### v0.0.1 (Current)
- Initial release
- Core reactivity system
- JSX runtime
- Router
- TypeScript support

### Future: v0.1.0
- Performance improvements
- DevTools integration
- Hook-style APIs

### Future: v1.0.0
- Stable API
- Long-term support
- Large ecosystem

## Comparison with Other Frameworks

| Feature | Sig.js | React | Vue | Solid |
|---------|--------|-------|-----|-------|
| Size | ~3KB | ~42KB | ~34KB | ~8KB |
| Virtual DOM | No | Yes | Yes | No |
| Fine-grained | Yes | No | Partial | Yes |
| JSX | Yes | Yes | No* | Yes |
| Direct DOM | Yes | No | No | Yes |
| Learning Curve | Low | Med | Med | Low |
| Maturity | Early | Mature | Mature | Mature |
| Production Ready | Beta | Yes | Yes | Yes |

*Vue uses templates, not JSX (though JSX is supported)

## Getting Help

### Quick Questions

1. Check the [getting started guide](./sig-getting-started.md)
2. Review [examples](./sig-examples.md)
3. Check [API reference](./sig-api.md)

### Troubleshooting

See [Router Guide - Troubleshooting](./sig-router.md#troubleshooting) for common issues.

### Deeper Issues

Check GitHub issues or create a new one with:
- Description of the issue
- Minimal reproduction code
- Expected vs actual behavior
- Environment details

## Next Steps

To get started with Sig.js:

1. **Read**: [Getting Started Guide](./sig-getting-started.md)
2. **Learn**: Review [API Reference](./sig-api.md)
3. **Explore**: Check [Examples](./sig-examples.md)
4. **Build**: Start with a small project
5. **Share**: Tell us what you're building!