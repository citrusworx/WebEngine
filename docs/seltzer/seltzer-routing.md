# Seltzer Routing

Exact method + pathname matching as implemented in `Seltzer.listen`.

This is not Express routing. It is not the parametric matcher in [exercise 4](./exercises/04-parametric-router.md). If you need `/users/:id`, you do not have it.

## The matcher

```ts
const url = new URL(req.url || "/", `http://${req.headers.host}`);
const match = this.routes.find(
  (route) => route.method === req.method && route.path === url.pathname,
);
```

That is the entire router.

| Compared | Source | Notes |
|---|---|---|
| Method | `req.method` | Typically `"GET"`, `"POST"`, … Node’s uppercase tokens |
| Path | `url.pathname` | No query, no hash |
| Equality | `===` | No prefix, no glob, no `:param` |
| Winner | `Array.find` | **First registered** route that matches |

If nothing matches, `ctx.json({ error: "Not Found" }, 404)`.

## Registering routes

```ts
app.route({
  method: "GET",
  path: "/notes",
  handler: (ctx) => ctx.json([]),
});
```

`.route` pushes and returns `this`, so you can chain. There is no `.get` / `.post` sugar. There is no router tree. Order is insertion order.

`method` and `path` are plain strings. `"get"` will not match Node’s `"GET"`. `"/Notes"` will not match `"/notes"`.

## Pathname details

`new URL(req.url || "/", \`http://${host}\`)` is used only to split pathname from search.

| Request URL | `pathname` | Matches a route registered as |
|---|---|---|
| `/notes` | `/notes` | `/notes` |
| `/notes?limit=10` | `/notes` | `/notes` |
| `/notes/` | `/notes/` | `/notes/` only |
| `/notes/1` | `/notes/1` | `/notes/1` only |
| `/notes/:id` | `/notes/:id` | `/notes/:id` (literal colon) |
| `/` | `/` | `/` |

There is no trailing-slash redirect. There is no case folding. There is no decode step beyond what `URL` already does for percent-encoding (`/notes/%31` is pathname `/notes/1`).

## First match wins

```ts
app.route({
  method: "GET",
  path: "/health",
  handler: (ctx) => ctx.json({ from: "first" }),
});

app.route({
  method: "GET",
  path: "/health",
  handler: (ctx) => ctx.json({ from: "second" }),
});
```

Every `GET /health` hits the first handler. The second is dead code. Seltzer does not warn.

Register specific concrete paths **before** a catch-all only if you invent a catch-all yourself (you cannot: there is no `*` matcher). With the shipped matcher, overlapping routes are always a mistake.

## Method mismatch is a 404

`GET /notes` and `POST /notes` are different routes. A GET-only collection will 404 a POST rather than 405.

```ts
app.route({
  method: "GET",
  path: "/notes",
  handler: (ctx) => ctx.json([...notes.values()]),
});

app.route({
  method: "POST",
  path: "/notes",
  handler: async (ctx) => {
    /* create */
  },
});
```

If you want 405, check `ctx.req.method` inside one handler — but then you would have to match on a path regardless of method, which this matcher cannot do. Two routes is the honest shape.

## What to do instead of `:id`

**Query string** (recommended for product code):

```ts
app.route({
  method: "GET",
  path: "/note",
  handler: (ctx) => {
    const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host}`);
    const id = url.searchParams.get("id");
    // …
  },
});
```

**Concrete paths** for fixtures or tiny static sets:

```ts
app.route({
  method: "GET",
  path: "/notes/1",
  handler: (ctx) => ctx.json(notes.get("1") ?? { error: "Not Found" }),
});
```

**Manual prefix parse** is a trap if you still register `/notes`. The matcher will never give you `/notes/42` on a `/notes` route. You would need a different matcher. That matcher is the parametric exercise, not this package.

## Nectarine YAML and this matcher

`libraries/nectarine/models/user/userAPI.yml` contains both exact and parametric endpoints:

```yaml
allUsers:    { method: GET,  endpoint: /users }
usersById:   { method: GET,  endpoint: /users/:id }
create.user: { method: POST, endpoint: /users }
```

Copy `/users` GET and POST. Skip `/users/:id`, `/users/:email`, `/users/:city`, `/users/:state/:city` until parametric matching exists — or rewrite those lookups as `/user?id=` in **your** routes, keeping the YAML as documentation of a future contract.

Walking YAML and registering every `endpoint` blindly will add literal `"/users/:id"` routes that never match real traffic.

## Host, port, and origin

The matcher does not look at host. `http://127.0.0.1:3000/health` and `http://localhost:3000/health` hit the same route if they share a process. Virtual hosts are your `ctx.req.headers.host` check.

`listen(port)` binds the default host for `server.listen(port)`. There is no `listen({ host, port })` overload.

## No middleware, no router groups, no unroute

There is no `app.use`, no mounted sub-app, no `Router()`, and no way to remove a route. Grouping is functions you call that `app.route` themselves:

```ts
function mountNotes(app: Seltzer) {
  app.route({ method: "GET", path: "/notes", handler: listNotes });
  app.route({ method: "POST", path: "/notes", handler: createNote });
}
```

That is app structure, not a Seltzer API.

## Related

- [Request and response](./seltzer-request-response.md)
- [JSON API tutorial](./seltzer-api-tutorial.md)
- [Anti-patterns](./seltzer-anti-patterns.md) — treating `:id` as shipped
- [Design](./seltzer-design.md) — intended `route` stage
