# Exercise 2: JSON POST Server

**Goal:** Collect a request body from a stream and parse JSON.

**Proves you can rebuild:** Seltzer's shipped `parse` stage (`parseStage` in `pipeline/stages.ts`).

**Shipped:** `@citrusworx/seltzer` already sets `ctx.body` and returns 400 `{ error: "Invalid JSON body" }` for bad JSON when `Content-Type` includes `application/json`. This exercise reconstructs that loop so you never cargo-cult it.

## Requirements

1. Accept `POST` requests with a JSON body.
2. Collect body chunks from the request stream (`for await` of `req`, or `data` / `end` / `error`).
3. Parse JSON and echo the parsed object back as `{ body: parsed }` JSON (status 200).
4. Return `400` with `{ error: "Invalid JSON body" }` if JSON is invalid.
5. Return `405` for non-POST methods on `/echo` (the real runtime would 404 unmatched methods instead — that difference is fine here).
6. Skip reading a body on GET/HEAD if you add those routes.

## Scratch

```ts
import http from "node:http";

function collectBody(req: http.IncomingMessage): Promise<string> {
  // Your implementation here
}

// Your server here
```

## Done when

- `curl -X POST http://localhost:3000/echo -H "Content-Type: application/json" -d '{"name":"test"}'` returns the same JSON.
- You can explain why `req.body` is not available synchronously, and why the shipped runtime does this *before* the handler.

## Next

[Exercise 3: Basic router](./03-basic-router.md)
