# Seltzer Node Exercises

**Contributor elective.** App authors should use [Getting Started](../seltzer-getting-started.md) and the [JSON API tutorial](../seltzer-api-tutorial.md) instead of this folder.

Hands-on checkpoints for the [Seltzer study guide](../courses.md). Complete these in order using plain `node:http` and TypeScript **to rebuild shipped 0.8.x internals**, then compare with `libraries/seltzer/src/`.

These exercises are not “implement the missing stage.” Parametric routes, structured handler returns, the named pipeline, `before` / `replace`, and `HttpError` **already ship** on `@citrusworx/seltzer` 0.8.1. See [Status](../seltzer-status.md).

Write your solution in each file's scratch block, or copy the template into `libraries/seltzer/src/example.ts` and run with:

```bash
yarn workspace @citrusworx/seltzer dev
yarn workspace @citrusworx/seltzer test
```

| # | Exercise | Seltzer stage | Shipped? |
|---|---|---|---|
| [01](./01-echo-server.md) | Echo server | — | Learning `node:http` (under the hood of `listen`) |
| [02](./02-json-post-server.md) | JSON POST with stream body | `parse` | **Shipped** — rebuild `parseStage` |
| [03](./03-basic-router.md) | Method + path router | `route` (exact subset) | **Shipped** — then add params in 04 |
| [04](./04-parametric-router.md) | `/users/:id` params + static prefix | `route` | **Shipped** |
| [05](./05-structured-response.md) | Handler returns object; runtime sends | `response`, `send` | **Shipped** |
| [06](./06-pipeline-runner.md) | Named stages on shared `ctx` | Pipeline skeleton | **Shipped** |
| [07](./07-pipeline-insert.md) | `before` / `replace` / short-circuit | Pipeline modification | **Shipped** |
| [08](./08-fetch-client.md) | HTTP client with `HttpError` | Seltzer `client` | **Shipped** |

Do not use AI for the core logic. Syntax lookup and TypeScript errors are fine.
