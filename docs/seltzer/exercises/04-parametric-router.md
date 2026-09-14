# Exercise 4: Parametric Router

**Contributor elective — not shipped.** `@citrusworx/seltzer` 0.2.0 matches exact pathnames only. `/users/:id` in `.route({ path })` is the literal string `"/users/:id"`. Product path uses query strings (`/user?id=`) — [Routing](../seltzer-routing.md).

**Goal:** Match dynamic path segments like `/users/:id`.

**Proves you can build:** Seltzer's **design-doc** `route` stage with `ctx.params` (not in source).

## Requirements

1. Extend exercise 3's router to support `:param` segments in route paths.
2. Extract matched values into `ctx.params` (e.g. `{ id: "42" }`).
3. `GET /users/:id` returns `{ id: "<value>" }`.
4. Exact routes still take precedence over parametric ones when both could match.

## Scratch

```ts
function matchRoute(
  pattern: string,
  pathname: string
): Record<string, string> | null {
  // Your implementation here
}
```

## Done when

- `GET /users/42` returns `{ id: "42" }`.
- `GET /users` (no id) still 404s unless you registered a collection route.

## Next

[Exercise 5: Structured response](./05-structured-response.md)
