# Exercise 5: Structured Response

**Goal:** Handlers return data objects; the runtime writes the HTTP response.

**Proves you can rebuild:** Seltzer's shipped `response` and `send` stages (`core/response.ts`).

**Shipped:** Handlers must return `ResponseData`. Bare objects are **not** wrapped (500 in the real runtime). There is no `ctx.json`.

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
3. A `send` function applies defaults: status `200`, `Content-Type: application/json` for object/array bodies.
4. Reject values that are not `ResponseData` (extra keys, arrays, strings) with 500.
5. Support async handlers that return Promises.

## Scratch

```ts
type ResponseData = {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
};

function isResponseData(value: unknown): value is ResponseData {
  // Your implementation here — keys only status/headers/body
}

function send(res: http.ServerResponse, data: ResponseData) {
  // Your implementation here
}

// Route handler example:
// async () => ({ status: 201, body: { created: true } })
```

## Done when

- Handlers never touch `res` directly except through the runtime's `send`.
- You can articulate why this separates application behavior from protocol serialization.
- You know why `{ ok: true }` is not `ResponseData`.

## Next

[Exercise 6: Pipeline runner](./06-pipeline-runner.md)
