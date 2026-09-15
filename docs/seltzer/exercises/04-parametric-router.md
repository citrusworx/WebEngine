# Exercise 4: Parametric Router

**Goal:** Match dynamic path segments like `/users/:id`, and prefer static prefixes.

**Proves you can rebuild:** Seltzer's shipped `route` stage with `ctx.params` (`pipeline/router.ts`).

**Shipped:** This is not a future feature. Compare your matcher to `compilePath` / `matchRoute` / `comparePathRank`.

## Requirements

1. Extend exercise 3's router to support `:param` segments in route paths.
2. Extract matched values into `ctx.params` (e.g. `{ id: "42" }`), percent-decoded.
3. `GET /users/:id` returns `{ body: { id: "<value>" } }`.
4. Static routes take precedence over parametric ones when both could match (`/items/new` vs `/items/:id`), **regardless of registration order**.

## Scratch

```ts
function compilePath(routePath: string): { keys: string[]; regex: RegExp } {
  // Your implementation here
}

function rankPath(path: string): { staticCount: number; paramCount: number; segments: number } {
  // Your implementation here
}
```

## Done when

- `GET /users/42` returns `{ id: "42" }`.
- `GET /users` (no id) still 404s unless you registered a collection route.
- `GET /items/new` hits `/items/new` even if `/items/:id` was registered first.

## Next

[Exercise 5: Structured response](./05-structured-response.md)
