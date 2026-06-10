# Exercise 6: Pipeline Runner

**Goal:** Run named stages in order on a shared context object.

**Proves you can build:** The pipeline skeleton for Seltzer.

## Requirements

1. Define stage names: `parse`, `context`, `route`, `validate`, `handle`, `response`, `send`.
2. Each stage is `(ctx) => ctx | Promise<ctx>`.
3. A `runPipeline(stages, ctx)` executes them sequentially.
4. Stub each stage with minimal logic (e.g. `parse` sets `ctx.rawBody`, `context` sets `ctx.method`).
5. Wire the pipeline into your server from exercise 5.

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

type Stage = (ctx: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>;

async function runPipeline(
  stages: Stage[],
  ctx: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Your implementation here
}
```

## Done when

- You can trace one request on paper: which stage sets which field on `ctx`.
- The server callback is only: build initial ctx → run pipeline.

## Next

[Exercise 7: Pipeline insert](./07-pipeline-insert.md)
