# Exercise 7: Pipeline Insert

**Goal:** Insert a custom stage before an existing named stage.

**Proves you can build:** Seltzer's pipeline modification API.

## Requirements

1. Extend exercise 6's pipeline with a registry of named stages.
2. Implement `before(name: StageName, stage: Stage)` to insert a stage immediately before `name`.
3. Add an auth check stage before `handle` that:
   - Reads `Authorization` header from `ctx.headers`
   - Returns `{ status: 401, body: { error: "Unauthorized" } }` and short-circuits the pipeline if missing
   - Otherwise continues to `handle`
4. Short-circuiting should skip remaining stages and go straight to `send`.

## Scratch

```ts
class Pipeline {
  private stages: Map<StageName, Stage[]> = new Map();

  before(name: StageName, stage: Stage) {
    // Your implementation here
  }

  async run(ctx: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Your implementation here
  }
}
```

## Done when

- A protected route returns `401` without an `Authorization` header.
- You can add a logging stage with one line: `pipeline.before("handle", logStage)`.

## Next

[Exercise 8: Fetch client](./08-fetch-client.md)
