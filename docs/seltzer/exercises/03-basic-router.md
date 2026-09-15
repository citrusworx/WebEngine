# Exercise 3: Basic Router

**Contributor elective.** This rebuilds the matcher that **already shipped** in `Seltzer.listen`. App authors should call `.route()` / `.listen()` instead of reimplementing it — [Getting Started](../seltzer-getting-started.md).

**Goal:** Register routes and match by method + exact path.

**Proves you can rebuild:** The exact-match subset of Seltzer’s `route` stage (before params in exercise 4).

**Shipped:** `@citrusworx/seltzer` 0.8.1 already matches method + compiled path (including `:id`). This exercise is the simpler `===` matcher so you understand first-wins before rank.

## Requirements

1. Define a `Route` type: `{ method: string; path: string; handler: (ctx) => ResponseData }`.
2. Register routes with `.route(route)` on a small app class (mirror `Seltzer.init().route(...)`).
3. Match incoming requests by method and pathname (`url.pathname`).
4. Return `404` JSON `{ error: "Not Found" }` when no route matches.
5. Implement at least `GET /health` → `{ body: { ok: true } }` and `GET /users` → `{ body: { users: [] } }`.

## Scratch

```ts
import http from "node:http";

type ResponseData = {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
};

type Route = {
  method: string;
  path: string;
  handler: (ctx: { req: http.IncomingMessage; res: http.ServerResponse }) => ResponseData;
};

class App {
  private routes: Route[] = [];

  route(route: Route) {
    this.routes.push(route);
    return this;
  }

  listen(port: number) {
    // Your implementation here
  }
}
```

## Done when

- You can explain how `libraries/seltzer/src/pipeline/router.ts` goes *beyond* this exact matcher.
- Your router 404s unknown paths with JSON.

## Next

[Exercise 4: Parametric router](./04-parametric-router.md)
