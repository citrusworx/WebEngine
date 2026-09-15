# Exercise 7: Pipeline Insert

**Goal:** Insert a custom stage before an existing named builtin, and replace a builtin.

**Proves you can rebuild:** Seltzer's shipped `before` / `replace` API.

**Shipped:** `Seltzer#before` and `Seltzer#replace` already exist. This is not a design-doc fiction.

## Requirements

1. Extend exercise 6's pipeline with builtin vs inserted entries.
2. Implement `before(name: StageName, stage: Stage)` to insert a stage immediately before the **builtin** named `name`.
3. Implement `replace(name: StageName, stage: Stage)` to swap that builtin; later `before` still finds it.
4. Add an auth check stage before `handle` that:
   - Reads `Authorization` from `ctx.headers` (lowercased keys, as `contextStage` does)
   - Returns `{ status: 401, body: { error: "Unauthorized" } }` and short-circuits if missing
   - Otherwise continues to `handle`
5. Short-circuiting should skip remaining stages and go straight to builtin `send`.

## Scratch

```ts
class Pipeline {
  private entries: { name: StageName; stage: Stage; builtin?: boolean }[] = [];

  before(name: StageName, stage: Stage) {
    // splice in front of the builtin named `name`
  }

  replace(name: StageName, stage: Stage) {
    // swap the builtin; keep builtin: true
  }

  async run(ctx: Record<string, unknown>): Promise<void> {
    // Your implementation here
  }
}
```

## Done when

- A protected route returns `401` without an `Authorization` header.
- You can add a logging stage with one line: `pipeline.before("handle", logStage)`.
- `pipeline.replace("validate", customValidate)` swaps the builtin validate stage.
- `before` then `replace` still runs the inserted stage first (see `pipeline.test.ts`).

## Next

[Exercise 8: Fetch client](./08-fetch-client.md)
