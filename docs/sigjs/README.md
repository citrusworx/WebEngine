# Sig.js

Sig.js updates the DOM a node at a time. Signals hold values. Effects and JSX getters write the nodes that read them. The rest of the page is created once and left alone.

Use it when a page is mostly static and only a few values change: a counter, a form field, a list, a route. It is not a component framework. It does not ship widgets, server rendering, or a form library.

**1.0.0** is the stable release (npm, 2026-10-29). The public API is the **0.7.2** API with no additions. `Signal.set` always notifies, including when the value is unchanged. `bindList` stays experimental.

## Start here

| Page | What it covers |
|---|---|
| [Getting started](./sig-getting-started.md) | Install, JSX, first page, Juice, WebEngine |
| [Page tutorial](./sig-page-tutorial.md) | One Juice page: tally, disclosure, queue, form, route |
| [What's new in 1.0](./sig-whats-new.md) | What the stable release freezes |
| [Migrating from 0.x](./sig-migrating.md) | Breaks from 0.2 through 0.7.2 |

## Concepts

| Page | What it covers |
|---|---|
| [Signals](./sig-signals.md) | `Signal`, `get`, `set`, identity |
| [Derived values](./sig-memo.md) | `memo` |
| [Effects](./sig-effects.md) | Tracking, cleanup, dynamic dependencies |
| [Batching](./sig-batch.md) | `batch` |
| [Templating](./sig-jsx.md) | JSX, text children, live props, lists |
| [Lifecycle](./sig-lifecycle.md) | `mount`, `disposeTree`, component cleanup |
| [Router](./sig-router.md) | Exact paths, `:param`, `"*"` |

## API reference

| Page | What it covers |
|---|---|
| [API reference](./sig-api.md) | Every public export: signature, parameters, example, edge cases |
| [API surface](./api-surface.md) | Stable, experimental, and internal classification |
| [TypeScript](./sig-typescript.md) | `jsxImportSource`, events, and the types that are not exported |

## Guides

| Page | What it covers |
|---|---|
| [Patterns](./sig-patterns.md) | Forms, lists, fetch, routes |
| [Examples](./sig-examples.md) | Longer pages built from those patterns |
| [Best practices](./sig-best-practices.md) | How to keep a Sig page small |
| [Anti-patterns](./sig-anti-patterns.md) | Snapshot reads, element children, in-place mutation |
| [Troubleshooting](./sig-troubleshooting.md) | Why a `set` did not update the DOM |

## Integration

| Page | What it covers |
|---|---|
| [Sig.js + Juice](./sig-juice-integration.md) | Attributes, and `bind` against Juice 0.9.1–0.9.5 |
| [Juice](../juice/README.md) | Layout and themes |
| [WebEngine](../webengine/webengine-getting-started.md) | Why the engine does not bootstrap Sig |

## Reference

| Page | What it covers |
|---|---|
| [Status](./sig-status.md) | What is stable, emerging, or absent |
| [Roadmap](./sig-roadmap.md) | What would change the library, and what would not |
| [Release checklist](./release-checklist.md) | Semver and publish rules |

## Mental model

| You want | Use |
|---|---|
| A reactive value | `Signal(initial)` |
| Live text | `{() => signal.get()}` |
| One live attribute | `className={() => ...}`, `hidden={() => ...}` |
| Several writes, or a rebuilt list | An element plus `effect` |
| Keyed rows | `bindList` |
| One flush for several writes | `batch` |
| A cached derivation | `memo` |
| A tree on the page | `mount(node, target)` |
| Client routes | `new SigRouter("#root")` |

Component functions run once per mount. They build DOM. They are not render functions. `{count.get()}` without a function wrapper is frozen at that moment.

## What is not in 1.0.0

| Not shipped | What to do instead |
|---|---|
| Virtual DOM, `<For>`, `<Show>` | Function children for text. `hidden`, `replaceChildren`, or `bindList` for structure |
| SSR or hydration | Client DOM only |
| `useState`, `peek`, `update` | `Signal(value)` and `get` / `set` |
| Two-way inputs | Read the event. Write `value` back from an effect if you need a controlled field |
| Live `style={{}}` objects | A `style` string works. An object is in the types and does not apply CSS |
| Error boundaries, DevTools | Not implemented |

## Status

Workspace `@citrusworx/sigjs` is **1.1.0**, not published yet. npm `latest` is **1.0.0**. Core reactivity, the JSX factory, `mount`, and `SigRouter` match that published cut. `bindList` and `ListItem` are experimental.

The optional Juice adapter in this workspace binds 31 runtime names, through keyboard-avoider. npm **1.0.0** binds 28. `sheet` binding waits until juiceui publishes it. See [Status](./sig-status.md) for the matrix.

Sibling libraries: [Juice](../juice/README.md), [Nectarine](../nectarine/README.md), [Seltzer](../seltzer/README.md), [Grapevine](../grapevine/README.md).
