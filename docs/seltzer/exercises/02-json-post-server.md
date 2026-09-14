# Exercise 2: JSON POST Server

**Contributor elective.** Product code does this **inside a `.route` handler** today — there is no shipped `parse` stage. App authors: [tutorial step 3](../seltzer-api-tutorial.md).

**Goal:** Collect a request body from a stream and parse JSON.

**Proves you can build:** The foundation for Seltzer's **design-doc** `parse` stage (not in `libraries/seltzer/src` yet).

## Requirements

1. Accept `POST` requests with a JSON body.
2. Collect body chunks from the request stream (`data`, `end`, `error`).
3. Parse JSON and echo the parsed object back as JSON.
4. Return `400` with an error message if JSON is invalid.
5. Return `405` for non-POST methods on `/echo`.

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
- You can explain why `req.body` is not available synchronously.

## Next

[Exercise 3: Basic router](./03-basic-router.md)
