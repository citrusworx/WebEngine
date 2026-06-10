# Exercise 5: Structured Response

**Goal:** Handlers return data objects; the runtime writes the HTTP response.

**Proves you can build:** Seltzer's `response` and `send` stages.

## Requirements

1. Define a handler return type:

   ```ts
   type ResponseData = {
     status?: number;
     headers?: Record<string, string>;
     body?: unknown;
   };
   ```

2. Handlers return `ResponseData` (or a Promise of it) instead of calling `res.writeHead` directly.
3. A `send` function applies defaults: status `200`, `Content-Type: application/json` for object bodies.
4. Support async handlers that return Promises.

## Scratch

```ts
type ResponseData = {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
};

function send(res: http.ServerResponse, data: ResponseData) {
  // Your implementation here
}

// Route handler example:
// async () => ({ status: 201, body: { created: true } })
```

## Done when

- Handlers never touch `res` directly except through the runtime's `send`.
- You can articulate why this separates application behavior from protocol serialization.

## Next

[Exercise 6: Pipeline runner](./06-pipeline-runner.md)
