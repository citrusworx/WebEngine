# Seltzer Node Exercises

Hands-on checkpoints for the [Seltzer study guide](../courses.md). Complete these in order using plain `node:http` and TypeScript before extending `libraries/seltzer/src/`.

Write your solution in each file's scratch block, or copy the template into `libraries/seltzer/src/example.ts` and run with:

```bash
yarn workspace @citrusworx/seltzer dev
```

| # | Exercise | Seltzer stage |
|---|---|---|
| [01](./01-echo-server.md) | Echo server | — |
| [02](./02-json-post-server.md) | JSON POST with stream body | `parse` |
| [03](./03-basic-router.md) | Method + path router | Current v0.2 |
| [04](./04-parametric-router.md) | `/users/:id` params | `route` |
| [05](./05-structured-response.md) | Handler returns object; runtime sends | `response`, `send` |
| [06](./06-pipeline-runner.md) | Named stages on shared `ctx` | Pipeline skeleton |
| [07](./07-pipeline-insert.md) | Insert stage before `handle` | Pipeline modification |
| [08](./08-fetch-client.md) | HTTP client with status checks | Seltzer client |

Do not use AI for the core logic. Syntax lookup and TypeScript errors are fine.
