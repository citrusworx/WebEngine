# Exercise 1: Echo Server

**Goal:** Prove you understand the basic `createServer` callback.

**Proves you can build:** Basic `IncomingMessage` / `ServerResponse` handling.

## Requirements

1. Create an HTTP server on port `3000`.
2. Log the request method, path, and headers to the console.
3. Respond with `200` and plain text: `method path` (e.g. `GET /health`).

## Scratch

```ts
import http from "node:http";

// Your implementation here
```

## Done when

- `curl http://localhost:3000/test` prints request info in the server console and returns `GET /test`.
- You can explain what `req` and `res` are without looking them up.

## Next

[Exercise 2: JSON POST server](./02-json-post-server.md)
