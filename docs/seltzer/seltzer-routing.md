# Seltzer Routing

Method + path matching as implemented in `pipeline/router.ts` and the `route` pipeline stage.

This is not Express routing. Parametric `:id` **is** shipped. Static prefixes are preferred over params.

## The matcher

Each `.route()` call runs `compileRoute`: the path is split on `/`, `:name` segments become `([^/]+)` capture groups, and static segments are regex-escaped. Matching is `route.method === method` plus `regex.test(path)`.

If several compiled routes match, `matchRoute` picks the **most specific** path, not merely the first registration:

1. more static segments win
2. then fewer param segments
3. then longer paths
4. then earlier registration if rank ties

That is why `/items/new` wins over `/items/:id`, and `/api/products/catalog/:catalog` wins over `/api/products/:id`, even when `:id` was registered first.

If nothing matches, the `route` stage returns `{ status: 404, body: { error: "Not Found" } }` and the pipeline jumps to `send`.

## Registering routes

```ts
app.route({
  method: "GET",
  path: "/notes/:id",
  handler: (ctx): ResponseData => ({ body: { id: ctx.params.id } }),
});
```

`.route` compiles, pushes, and returns `this`. There is no `.get` / `.post` sugar. `method` and `path` are plain strings. `"get"` will not match Node’s `"GET"`.

`ctx.params` values are `decodeURIComponent`d. `/notes/%31` on `/notes/:id` yields `{ id: "1" }`.

## Pathname details

The `context` stage builds `new URL(req.url || "/", \`http://${host}\`)` and sets `ctx.path` to `url.pathname`. Query is `ctx.query`, not part of the match.

| Request URL | `ctx.path` | Matches |
|---|---|---|
| `/notes` | `/notes` | `/notes` |
| `/notes?limit=10` | `/notes` | `/notes` (`ctx.query.limit === "10"`) |
| `/notes/` | `/notes/` | `/notes/` only |
| `/notes/1` | `/notes/1` | `/notes/:id` → `{ id: "1" }` |
| `/notes/:id` | `/notes/:id` | only a route whose path is the literal `/notes/:id` |
| `/` | `/` | `/` |

There is no trailing-slash redirect. There is no case folding.

## Static prefix vs `:id`

```ts
app.route({
  method: "GET",
  path: "/items/:id",
  handler: (): ResponseData => ({ body: { route: "param" } }),
});

app.route({
  method: "GET",
  path: "/items/new",
  handler: (): ResponseData => ({ body: { route: "static" } }),
});
```

`GET /items/new` hits the static handler. `GET /items/42` hits `:id`. Registration order does not matter for that pair.

`generateRoutes` also **sorts** operations so `/catalog/:catalog` and `/slug/:slug` register before `:id`. The matcher would still prefer them; the sort keeps first-match mental models safe.

## Duplicate exact routes

Two identical `GET /health` registrations: rank ties, so **earlier** registration wins. Seltzer does not warn. The second is dead code.

## Method mismatch is a 404

`GET /notes` and `POST /notes` are different routes. A GET-only collection will 404 a POST rather than 405. Register both methods explicitly.

`OPTIONS` never reaches the matcher when `listen` is used: CORS/`OPTIONS` 204 runs first.

## Nectarine YAML and this matcher

`*API.yml` may list both exact and parametric endpoints. **Register them.** `/users/:id` matches `/users/42`. That was a 0.2.0 myth.

```yaml
allUsers:    { method: GET,  endpoint: /users }
usersById:   { method: GET,  endpoint: /users/:id }
create.user: { method: POST, endpoint: /users }
```

Flatten with Nectarine `listApiOperations` (it maps `endpoint` → `ApiOperation.path`) and pass the list to `generateRoutes`. Do not rewrite lookups as `?id=` unless you prefer query strings.

Walking YAML and registering every `endpoint` as a **literal** without compiling params would be wrong — `.route()` compiles `:id` for you.

## Host, port, and origin

The matcher does not look at host. Virtual hosts are your `ctx.headers.host` check.

`listen(port)` binds the default host for `server.listen(port)`. There is no `listen({ host, port })` overload. It **does** return the `http.Server`.

## No middleware, no router groups, no unroute

There is no `app.use`, no mounted sub-app, no `Router()`, and no way to remove a route. Grouping is functions that call `app.route`:

```ts
function mountNotes(app: Seltzer) {
  app.route({ method: "GET", path: "/notes", handler: listNotes });
  app.route({ method: "POST", path: "/notes", handler: createNote });
  app.route({ method: "GET", path: "/notes/:id", handler: getNote });
}
```

Cross-cutting auth is `before("handle", …)`, not a sub-router. See [Pipeline](./seltzer-pipeline.md).

## Related

- [Request and response](./seltzer-request-response.md)
- [Generate routes](./seltzer-generate.md)
- [JSON API tutorial](./seltzer-api-tutorial.md)
- [Anti-patterns](./seltzer-anti-patterns.md)
