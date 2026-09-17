# Course source map and maintenance notes

[Course](./README.md)

Baseline: Seltzer workspace version **0.8.1**, inspected after merge `d25673e`. This page records source ownership so a future editor can update a lesson when behavior changes. It does not infer readiness from an npm version alone.

## Implementation map

| Concern | Source | Lessons |
|---|---|---|
| Package exports, Node minimum | [package.json](../../../libraries/seltzer/package.json), [index.ts](../../../libraries/seltzer/src/index.ts) | 00, 06 |
| Listener, CORS, OPTIONS, config | [core/seltzer.ts](../../../libraries/seltzer/src/core/seltzer.ts) | 02, 08, 10 |
| Public types, locals, route contracts | [core/types.ts](../../../libraries/seltzer/src/core/types.ts) | 03–06 |
| Encoding and response branding | [core/response.ts](../../../libraries/seltzer/src/core/response.ts) | 02, 09 |
| Stage insertion, replacement, early exits | [pipeline/index.ts](../../../libraries/seltzer/src/pipeline/index.ts) | 06, 11 |
| Context and stage types | [pipeline/types.ts](../../../libraries/seltzer/src/pipeline/types.ts) | 06 |
| Body parsing, normalization, presence checks | [pipeline/stages.ts](../../../libraries/seltzer/src/pipeline/stages.ts) | 03, 04, 06 |
| Matching, ranking, parameter decoding | [pipeline/router.ts](../../../libraries/seltzer/src/pipeline/router.ts) | 03 |
| Client, error response handling, decoding | [core/client/client.ts](../../../libraries/seltzer/src/core/client/client.ts) | 07 |
| Generated routes and executor wrapping | [generate/generate-routes.ts](../../../libraries/seltzer/src/generate/generate-routes.ts), [types.ts](../../../libraries/seltzer/src/generate/types.ts) | 09 |

`src/core/server/server.ts` is a separate hello-world remnant, not the listener implementation used by `Seltzer.listen`. The course raw server is a teaching example, not an endorsement of that file as the runtime entrypoint.

`.handler(config)` currently stores configuration and exposes options on the context. Its adapter name does not automatically choose a database or execute a route. The course does not invent additional semantics for it.

## Capability boundaries

| Implemented in this baseline | Host responsibility or future design |
|---|---|
| Object routes and path parameters | Ownership and permissions |
| JSON/raw body collection | Bounded bodies, form and multipart parsing |
| Presence-only `.required` checks | Full types, formats, coercion policies |
| Named `before` / `replace` stages | Universal response finalization, `after` / removal APIs |
| Structured responses and buffered bytes | Explicit streaming and backpressure |
| CORS headers and OPTIONS shortcut | Authentication and CSRF policy |
| Node HTTP listener returned to host | Host binding option, native TLS policy, integrated drain |
| Fetch wrapper and `HttpError` | Deadlines, cancellation, URL-joining contract |
| Operation-list route generation | Actual data execution and persistence |

The right column is not a promise to put every feature into Seltzer. Some responsibilities should remain in the host or another package.

## Verification commands

From the repository root, with dependencies installed:

```sh
node --test docs/seltzer/http-course/examples/course.test.mjs
yarn workspace @citrusworx/seltzer test
yarn workspace @citrusworx/seltzer typecheck
```

The first is the course's public-entrypoint HTTP suite. The others are the library's own checks and may require dependencies matching the checkout's lockfile. A passed course suite is not a substitute for every library or application test.

The browser lesson is an additional manual experiment: a Node fetch test can inspect CORS headers but does not enforce a browser's cross-origin rules.

### Verification of this course draft

Checked on September 15, 2026, with Node 24.11.1:

- All 12 course HTTP tests passed against the workspace's public `dist/index.js` entrypoint.
- All 56 existing Seltzer tests passed using the installed Vitest 3.2.7 runner. The manifest requests a newer runner; this result describes the installed environment, not a fresh lockfile installation.
- The Seltzer TypeScript no-emit check passed with the root-installed compiler.
- Raw HTTP, hello, and generated-server entrypoints answered their smoke requests.
- A headless Chromium check verified the browser page's cross-origin read and create operations and rejection of response access from a different origin.
- All nine example modules passed JavaScript syntax checks; all 111 course-relative links, including answer anchors, resolved.

The standalone npm installation path is documented but was not independently reinstalled for this check. No production deployment or database integration was tested.

## Primary protocol references

- [HTTP Semantics, RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html): authoritative semantics for messages, methods, and responses.
- [Node HTTP API](https://nodejs.org/api/http.html): server, request, response, and lifecycle primitives.
- [Node streams](https://nodejs.org/api/stream.html): data consumption and flow control.
- [WHATWG Fetch standard](https://fetch.spec.whatwg.org/): fetch and browser cross-origin behavior.

Follow the section links in individual lessons for the concept being studied. External Node documentation can describe a newer version than your installed runtime; compare version availability before using a newly introduced API. Course examples were checked on Node 24.11.1.

## Maintaining this course

When Seltzer changes, update the behavioral table, corresponding lesson, and course test together. Move a proposal into the implemented track only after checking source and usable package exports. Keep remaining design choices labeled proposed.

If publishing this material into a learning platform, preserve lesson order, executable files, checkpoint answers, and version labels. Do not turn a source-reading exercise into an instruction to edit a production library. Keep the short application tutorial and this longer HTTP course as separate entrypoints.
