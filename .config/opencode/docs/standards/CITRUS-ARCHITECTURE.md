# CitrusWorx Architecture Standard

**CW-JS / Architecture & Composition**  
**Status:** Draft 0.1 — proposed, not yet enforced  
**Date:** 2026-11-16

> A component should be understandable on its own, predictable in a system, and replaceable at a clear boundary.

This guide applies to WebEngine's libraries, engines, packages, applications, and any independent CitrusWorx JavaScript/TypeScript project. Read alongside [CITRUS-JS.md](CITRUS-JS.md) and [CITRUS-QUALITY.md](CITRUS-QUALITY.md).

## 1. Architecture principles

1. **Clear ownership:** each module owns a coherent responsibility and state boundary.
2. **Explicit contracts:** public interfaces state inputs, outputs, side effects, failures, and lifecycle.
3. **Composition first:** prefer small cooperating objects/functions over inheritance depth or global registries by default.
4. **Dependency direction:** lower-level libraries MUST NOT depend on consuming applications or runtime orchestrators.
5. **Minimal platform coupling:** keep reusable domain logic separate from Node, browser, provider, and framework adapters.
6. **Controlled side effects:** imports SHOULD NOT trigger network access, initialization, or global registration.
7. **Operational lifecycle:** resource creation, ownership, health, and disposal must be deliberate.
8. **Stable public surfaces:** exports and extension points are intentional commitments, not accidents.

## 2. Ecosystem layering

The WebEngine README describes four tiers:

| Tier | Responsibility | Dependency expectation |
|---|---|---|
| Libraries (`libraries/`) | Reusable primitives and integrations: Sig.js, Juice, Seltzer, Nectarine, GrapeVine, DNS, Stenzil, shared types | SHOULD be usable without an application or engine |
| Engines (`engines/`) | Runtime orchestration and lifecycle | Compose libraries; keep reusable domain logic outside the engine |
| Packages (`packages/`) | Domain-specific integrated capabilities, such as KiwiPress | Consume libraries and engine contracts as needed |
| Apps (`apps/`) | Products and experiences | Compose lower-level capabilities without becoming their dependencies |

`tooling/` contains development tooling and CLIs; its dependency direction should be explicit. These tiers describe responsibilities, not a rule that each package must depend on the tier immediately below it. A library can depend on another library if no cycle is introduced.

## 3. The Citrus Contract

Every published API MUST make the following discoverable, through types, documentation, or tests:

| Question | Contract detail |
|---|---|
| What can I pass? | Input types, validation and defaults |
| What comes back? | Return value, async behavior and invariants |
| What changes? | Mutations, external side effects, persistence |
| What can fail? | Error classes/codes or result variants |
| Who owns resources? | Instantiation, sharing, cleanup and cancellation |
| What can vary? | Supported extension/adaptation points and compatibility |

Explicit contracts do not require excessive abstraction. A two-line pure function can be fully clear from its type signature.

## 4. Module boundaries and dependencies

- MUST separate reusable policy/domain behavior from provider-specific implementation where there are multiple providers or a credible near-term need.
- SHOULD inject IO dependencies through constructor arguments, factory options, or small interfaces rather than mandatory containers.
- MUST NOT import private source paths from other published packages unless an explicit workspace-only agreement exists.
- SHOULD keep dependency graphs acyclic and detect cycles during development.
- MUST avoid dependencies on app-specific configuration from foundational libraries.
- SHOULD prefer built-in platform capabilities when they satisfy requirements, but dependency count is not a proxy for quality or security.

```typescript
export interface ObjectStore {
    read(key: string): Promise<Uint8Array | null>;
    write(key: string, value: Uint8Array): Promise<void>;
}

export class AssetService {
    constructor(private readonly store: ObjectStore) {}

    async loadAsset(id: string): Promise<Uint8Array | null> {
        return this.store.read(id);
    }
}
```

## 5. The Citrus Boundary

At each external boundary, MUST define:

1. Input trust level and validation strategy.
2. Supported runtime and environmental assumptions.
3. Error translation and retry/cancellation behavior, where applicable.
4. Ownership of authentication, authorization, and secrets.
5. Stable surface exposed to the rest of the system.

Examples include database drivers, cloud provisioners, HTTP clients, DNS registrars, WordPress adapters, and filesystem operations. Internal code SHOULD depend on the boundary contract rather than incidental vendor response shapes.

## 6. The Citrus Lifecycle

When a component owns a subscription, server, connection, worker, file handle, audio resource, or other disposable resource, it MUST provide a predictable cleanup path. Lifecycle hooks MUST be idempotent where practical, or document when calls are invalid.

WebEngine's current kernel supplies a useful reference shape:

```typescript
export interface KernelModule {
    id: string;
    dependencies?: string[];
    scaffold?: (ctx: KernelContext) => void | Promise<void>;
    bootstrap: (ctx: KernelContext) => void | Promise<void>;
    health: (ctx: KernelContext) => HealthResult | Promise<HealthResult>;
    shutdown?: (ctx: KernelContext) => void | Promise<void>;
}
```

This is a **reference**, not a universal interface requirement. Sig.js effects, database connections, browser components, and engine modules can express lifecycle differently.

WebEngine also tears down modules in reverse order during shutdown. This is the SHOULD default for resources with dependency-ordered initialization. When startup partially fails, cleanup SHOULD attempt to release successfully acquired resources without hiding the original error. Callers MUST understand whether cleanup errors are aggregated, logged, or propagated.

## 7. State and concurrency

- MUST document which component owns mutable state.
- SHOULD derive read-only views from source state rather than duplicate it unnecessarily.
- MUST not expose internal mutable collections as writable public API unless intentional.
- MUST define concurrency expectations for re-entrant operations, overlapping requests, and repeated lifecycle calls.
- SHOULD offer cancellation (`AbortSignal` on suitable async APIs) for potentially long-running operations.
- MUST use explicit semantics for mutations; names and docs should not imply a non-mutating operation when it mutates.

## 8. Framework-specific composition

### Sig.js

- Reactive derivations SHOULD be pure; effects own side effects.
- Subscriptions and other effects MUST have a disposal owner.
- Components SHOULD keep state close to the consumers that need it.
- Extensions MUST preserve the public JSX/runtime contract.

### Juice

- Presentation SHOULD use design-system tokens and established composition primitives.
- Business logic SHOULD NOT be embedded in theme or style definitions.
- Optional JavaScript behaviors MUST document initialization and cleanup.

### WebEngine / Nectarine / GrapeVine / KiwiPress

- Engine code SHOULD orchestrate operations supplied by libraries, rather than duplicate implementation details.
- Configuration MUST be validated before being treated as trusted domain state.
- Provider-specific differences MUST be modeled at adapter boundaries.
- Domain packages SHOULD expose operations around meaningful responsibilities instead of leaking transport plumbing.

These are proposed extension principles and should be refined with package maintainers before enforcement.

## 9. Package contracts and versioning

Published packages MUST specify:

- Package name, runtime/module format, supported environments and entrypoints.
- Correct `exports` and declaration paths, including any deliberate subpath exports.
- Dependencies, peers, and optional integrations.
- Build, type-check, and test commands.
- Semantic compatibility policy and breaking-change migration notes.

Internal files are not public API simply because they exist in the repository. Deprecation SHOULD precede breaking removal where feasible. Package side effects MUST be declared accurately for bundlers.

## 10. Architectural decisions

Use a lightweight Architecture Decision Record (ADR) for choices that affect multiple packages or make migration expensive. Each ADR SHOULD include: context, decision, alternatives, consequences, owner, status, and date. Exceptions to a MUST-level architecture rule require an ADR or equivalent documented rationale and an owner.

## 11. Evidence and status

- [WebEngine README](https://github.com/citrusworx/WebEngine/blob/master/README.md) — four-tier monorepo and orchestration model.
- [Kernel types](https://github.com/citrusworx/WebEngine/blob/master/engines/webengine/src/kernel/types.ts) — explicit dependencies, lifecycle and health.
- [Kernel orchestrator](https://github.com/citrusworx/WebEngine/blob/master/engines/webengine/src/kernel/orchestrator.ts) — dependency ordering and reverse-order shutdown.
- [Sig.js package contract](https://github.com/citrusworx/WebEngine/blob/master/libraries/sig/package.json) — ESM and declared subpath exports.

**Adoption work remaining:** ratify package boundaries, document lifecycle semantics for each major library, introduce ADR templates, and audit public exports and provider boundaries. No repository mutation is implied.
