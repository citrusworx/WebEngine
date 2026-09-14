# Seltzer Node Exercises

**Contributor elective.** App authors should use [Getting Started](../seltzer-getting-started.md) and the [JSON API tutorial](../seltzer-api-tutorial.md) instead of this folder.

Hands-on checkpoints for the [Seltzer study guide](../courses.md). Complete these in order using plain `node:http` and TypeScript before extending `libraries/seltzer/src/`.

These exercises rebuild (01–03) or **go past** (04–08) the shipped package. Parametric routes, structured handler returns, and pipeline insert are **not** APIs on `@citrusworx/seltzer` 0.2.0. See [Roadmap](../seltzer-roadmap.md).

Write your solution in each file's scratch block, or copy the template into `libraries/seltzer/src/example.ts` and run with:

```bash
yarn workspace @citrusworx/seltzer dev
```

| # | Exercise | Seltzer stage | Shipped? |
|---|---|---|---|
| [01](./01-echo-server.md) | Echo server | — | Learning `node:http` (under the hood of `listen`) |
| [02](./02-json-post-server.md) | JSON POST with stream body | `parse` (design) | You write this **in the handler** today; no parse stage |
| [03](./03-basic-router.md) | Method + path router | Current v0.2 | Rebuilds shipped `listen` matching |
| [04](./04-parametric-router.md) | `/users/:id` params | `route` (design) | **Not shipped** |
| [05](./05-structured-response.md) | Handler returns object; runtime sends | `response`, `send` (design) | **Not shipped** — `listen` ignores return values |
| [06](./06-pipeline-runner.md) | Named stages on shared `ctx` | Pipeline skeleton (design) | **Not shipped** |
| [07](./07-pipeline-insert.md) | Insert stage before `handle` | Pipeline modification (design) | **Not shipped** |
| [08](./08-fetch-client.md) | HTTP client with status checks | Beyond `client.*` | Shipped `client` always `res.json()` and does **not** throw on `!ok` |

Do not use AI for the core logic. Syntax lookup and TypeScript errors are fine.
