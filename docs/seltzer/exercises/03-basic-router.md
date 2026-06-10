# Exercise 3: Basic Router

**Goal:** Register routes and match by method + exact path.

**Proves you can build:** Current Seltzer v0.2 behavior.

## Requirements

1. Define a `Route` type: `{ method: string; path: string; handler: (ctx) => unknown }`.
2. Register routes with `.route(route)` on a small app class (mirror `Seltzer.init().route(...)`).
3. Match incoming requests by method and pathname.
4. Return `404` JSON `{ error: "Not Found" }` when no route matches.
5. Implement at least `GET /health` → `{ ok: true }` and `GET /users` → `{ users: [] }`.

## Scratch

```ts
import http from "node:http";

type Route = {
  method: string;
  path: string;
  handler: (ctx: { req: http.IncomingMessage; res: http.ServerResponse }) => void;
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

- You can explain every line in `libraries/seltzer/dist/core/seltzer.js` and your router does the same thing plus your extra routes.

## Next

[Exercise 4: Parametric router](./04-parametric-router.md)
