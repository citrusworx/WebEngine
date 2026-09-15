# Exercise 6: Pipeline Runner

**Goal:** Run named stages in order on a shared context object.

**Proves you can rebuild:** The shipped pipeline skeleton (`pipeline/index.ts`).

**Shipped:** `parse` → `context` → `route` → `validate` → `handle` → `response` → `send` already runs on every `listen` request. This exercise reconstructs that runner.

## Requirements

1. Define stage names: `parse`, `context`, `route`, `validate`, `handle`, `response`, `send`.
2. Each stage mutates `ctx` and returns `void | ResponseData`. **Do not** `return ctx` (0.8.x mutates in place).
3. A `Pipeline.run(ctx)` executes them sequentially.
4. Returning `ResponseData` skips remaining stages except builtin `send`.
5. Thrown errors become JSON 500 and also jump to `send`.
6. Wire the pipeline into your server from exercise 5.

## Scratch

```ts
type StageName =
  | "parse"
  | "context"
  | "route"
  | "validate"
  | "handle"
  | "response"
  | "send";

type Stage = (ctx: Record<string, unknown>) => void | ResponseData | Promise<void | ResponseData>;

class Pipeline {
  constructor(private entries: { name: StageName; stage: Stage; builtin?: boolean }[]) {}

  async run(ctx: Record<string, unknown>): Promise<void> {
    // Your implementation here
  }
}
```

## Done when

- You can trace one request on paper: which stage sets which field on `ctx`.
- The server callback is only: build initial ctx → run pipeline.
- Your order matches `STAGE_NAMES` in `pipeline/types.ts`.

## Next

[Exercise 7: Pipeline insert](./07-pipeline-insert.md)
