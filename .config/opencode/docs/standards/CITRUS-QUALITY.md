# CitrusWorx Engineering Quality Standard

**CW-JS / Quality, Testing & Delivery**  
**Status:** Draft 0.1 — proposed, not yet enforced  
**Date:** 2026-11-16

> Quality is a release contract: correctness, safety, accessibility, performance, and maintainability should be demonstrable.

This document works with [CITRUS-JS.md](CITRUS-JS.md) and [CITRUS-ARCHITECTURE.md](CITRUS-ARCHITECTURE.md). Requirements apply to new and materially changed code once adopted. Existing packages need a staged baseline, not a surprise blanket failure.

## 1. Quality principles

- **Verifiable:** assertions and tests support important behavior.
- **Risk-weighted:** the most critical workflows receive the strongest verification.
- **Reproducible:** builds and checks can run on clean CI workers.
- **Secure by default:** untrusted input, credentials and permissions are handled deliberately.
- **Accessible by design:** interactive interfaces remain usable with assistive technologies.
- **Observable:** failures are actionable without leaking sensitive data.
- **Reviewable:** a change explains intent, compatibility, and evidence.

## 2. Minimum pull-request gates

For affected packages, CI SHOULD eventually enforce the following as required gates:

| Gate | Required outcome | Notes |
|---|---|---|
| Formatting | Formatter check passes | Adopt common configuration first |
| Lint | No errors under adopted preset | Warnings can be budgeted during migration |
| Type checking | Strict type check passes | Use package-specific tsconfig and appropriate test tsconfig |
| Build | Clean build succeeds | Package artifacts and declarations where published |
| Unit tests | Relevant tests pass | Regression coverage for bug fixes |
| Integration / contract tests | Pass when external boundaries change | Prefer deterministic fixtures and test services |
| Package validation | Export paths and types resolve as published | Test consumer installation, not only workspace aliases |
| Security checks | No unresolved critical findings | Triage exceptions with owner and expiry |
| Release notes | Breaking and user-facing changes documented | Changesets or equivalent |

MUST-level release gates only become binding after a package has an agreed CI implementation. Do not claim these are all present today.

## 3. Testing strategy

1. **Unit tests:** deterministic tests for pure logic, parsing, guards, state transitions, and error cases.
2. **Integration tests:** test real interaction among modules, adapters, databases, runtimes, or HTTP boundaries.
3. **Contract tests:** verify package exports, adapter conformance, API behavior, and schema compatibility.
4. **End-to-end tests:** exercise critical user journeys rather than every implementation detail.
5. **Regression tests:** every meaningful fixed defect SHOULD get a test demonstrating the previous failure.

Tests MUST be isolated and repeatable. They MUST NOT require production secrets or modify production systems. Time, randomness, network calls, and external services SHOULD be controlled where deterministic execution matters. No universal percentage coverage target is proposed: risk-based assertions and important branch coverage are more useful than one arbitrary number.

WebEngine currently uses package-specific testing, including Vitest in GrapeVine and Playwright for Sig.js, so the standard SHOULD govern outcomes instead of mandating one testing framework.

## 4. Security and trust boundaries

- MUST validate all untrusted external data at runtime before applying domain assumptions.
- MUST distinguish authentication from authorization and check authorization at the operation boundary.
- MUST NOT commit credentials or include them in logs, errors, fixtures, or screenshots.
- MUST use parameterized database queries or equivalent safe APIs; never construct commands or queries by unsafe string concatenation.
- MUST treat HTML, URLs, shell arguments, file paths, YAML/JSON, and provider payloads as context-specific trust boundaries.
- MUST apply least-privilege permissions to cloud adapters, CI tokens, and runtime identities.
- SHOULD use bounded timeouts, cancellation, retry limits, and backoff for external operations.
- SHOULD audit dependencies and document acceptance of known vulnerabilities, including remediation owner and expiry.
- SHOULD include adversarial tests for parsers, permissions, external commands, and destructive operations.

## 5. Reliability and errors

- MUST preserve useful error context without exposing secrets.
- MUST define behavior for partial failure and cleanup of acquired resources.
- MUST not silently turn unexpected errors into success responses.
- SHOULD implement idempotency for retryable operations where feasible.
- SHOULD separate expected failure results from exceptional faults.
- SHOULD test cancellation, double initialization, repeated shutdown, and concurrent operations when relevant.
- SHOULD avoid unbounded queues, retries, recursive behavior, and in-memory caches.

## 6. Performance

Performance should be measured against representative workloads; optimization must preserve correctness and readability.

- MUST avoid obvious unbounded work and resource leaks.
- SHOULD budget for initialization time, bundle size, memory, request latency, and rendering behavior at package-appropriate boundaries.
- SHOULD benchmark performance-sensitive code before and after nontrivial optimization.
- MUST document any observable semantic tradeoff introduced by caching, batching, lazy loading, or concurrency.
- SHOULD keep foundational browser bundles small, avoid unnecessary runtime dependencies, and ensure tree-shaking metadata accurately reflects side effects.

Package maintainers SHOULD specify actual numerical budgets in their own documentation; no invented monorepo-wide thresholds are imposed here.

## 7. Accessibility and user-facing quality

For web and app interfaces:

- MUST use semantic controls and accessible names.
- MUST support keyboard interaction and visible focus for interactive features.
- MUST manage focus appropriately for dialogs, overlays, and route changes.
- MUST consider reduced-motion preferences, contrast, and readable error feedback.
- SHOULD use automated accessibility checks together with keyboard and assistive-technology spot checks.
- SHOULD use Juice tokens and established component behavior consistently.

Accessibility criteria for a product SHOULD reference an agreed WCAG target and supported platform matrix; this document does not falsely assert that current products have passed such an audit.

## 8. Documentation and review

Every published package MUST provide a README covering installation, minimum usage, important exports, runtime compatibility, and the way to run checks. Public APIs MUST document non-obvious contracts and breaking changes. Complex or cross-package decisions SHOULD use ADRs.

PR descriptions SHOULD cover:

```markdown
## Why
Describe the problem and intended outcome.

## What changed
List significant behavior and API changes.

## Verification
List checks run, test cases added, and limitations.

## Compatibility / migration
List breaking changes, configuration updates, and upgrade steps.

## Risks and rollback
Describe operational risks and a safe reversal path, if applicable.
```

Reviewers SHOULD evaluate behavior, API clarity, compatibility, threat boundaries, tests, and observability rather than formatting that a tool can verify automatically.

## 9. Releases and compatibility

- MUST identify public breaking changes and communicate migration steps.
- MUST verify published export paths and declaration resolution using a consumer-like environment.
- MUST ensure package versioning and release notes match changed behavior.
- SHOULD use Changesets or an equivalent auditable mechanism.
- SHOULD maintain a supported-runtime matrix, including Node and browser targets as appropriate.
- SHOULD release experimental extension points explicitly as unstable instead of accidentally promising compatibility.

## 10. Enforcement plan

### Phase 0 — Baseline

Inventory package scripts, existing test coverage, formatter differences, dependency cycles, and published exports. Establish check commands and a clear list of exemptions. Do not mass-reformat application code in the same PR as behavior changes.

### Phase 1 — Shared tooling

Introduce proposed packages or configurations such as `@citrusworx/eslint-config`, `@citrusworx/prettier-config`, and `@citrusworx/tsconfig` only after choosing ownership and maintenance strategy. Add scripts for `format:check`, `lint`, `typecheck`, `test`, and `build` in supported packages.

### Phase 2 — Progressive adoption

Enable gates on changed files or selected packages; address existing violations in small batches. Keep any exceptions narrow, documented, owned, and time-limited.

### Phase 3 — Release enforcement

Make required checks blocking for stable packages, validate package consumers, and track regressions. Revisit lint rules and architecture guidance through a documented proposal process.

## 11. Evidence and current gaps

- [Root package scripts](https://github.com/citrusworx/WebEngine/blob/master/package.json) — Turbo build scripts and Changesets; no root `lint` script in inspected file.
- [Repository README](https://github.com/citrusworx/WebEngine/blob/master/README.md) — contributor PR expectations and referenced `yarn turbo run lint`.
- [GrapeVine package](https://github.com/citrusworx/WebEngine/blob/master/libraries/grapevine/package.json) — Vitest scripts.
- [Sig.js package](https://github.com/citrusworx/WebEngine/blob/master/libraries/sig/package.json) — Playwright tests and build scripts.
- [Base TypeScript configuration](https://github.com/citrusworx/WebEngine/blob/master/tsconfig.base.json) — strict type checking and declaration output.

An inspection of the tracked repository tree did not identify a centralized ESLint, Prettier, Biome, or `CONTRIBUTING.md` file. This draft specifies **desired gates**, not already-verified repository-wide enforcement. No CI, package, or repository changes are made by this document.
