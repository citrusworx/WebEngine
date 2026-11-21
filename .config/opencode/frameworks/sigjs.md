# Sig.js — Reactive DOM and Routing

Package: `@citrusworx/sigjs` (survey reported 1.1.2; verify current source and dependency graph).

Sig.js supplies standalone signals, JSX-to-DOM rendering, mounting, and client routing. Do **not** assume React, React hooks, a virtual DOM, or React lifecycle rules.

## Rules

- Read `docs/sigjs/signals.md`, `jsx.md`, `lifecycle.md`, `router.md`, `api-surface.md`, `patterns.md`, and `anti-patterns.md` as relevant.
- Verify the exact signal, memo, effect, batching, mounting, router, and cleanup contracts from current exports and tests.
- Keep subscriptions and effects lifecycle-safe; avoid memory leaks and accidental reactivity loops.
- Keep JSX types compatible with Sig.js' own runtime.
- Prefer stable APIs; survey flagged `bindList`/`ListItem` as experimental.
- Juice integration: consult `docs/sigjs/juice-integration.md` and the current binding sheet; the survey reported version-sensitive runtime bindings. Verify supported package combinations rather than assuming compatibility.
