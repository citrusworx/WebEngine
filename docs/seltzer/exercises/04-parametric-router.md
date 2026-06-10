# Exercise 4: Parametric Router

**Goal:** Match dynamic path segments like `/users/:id`.

**Proves you can build:** Seltzer's `route` stage with `ctx.params`.

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
