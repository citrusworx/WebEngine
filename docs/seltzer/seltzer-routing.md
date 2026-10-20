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

`ctx.params` values are `decodeURIComponent`d. `/notes/%31` on `/notes/:id` yields `{ id: "1" }`. `/notes/hello%20world` yields `{ id: "hello world" }`. A malformed sequence such as `/notes/%E0%A4` or `/notes/%ZZ` is **400** `{ error: "Malformed path parameter" }`. The handler does not run, and the process keeps serving. Decoding happens after the path matches, so a bad percent-encoding on a path that matches nothing is still 404.

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

There is no trailing-slash redirect and no trailing-slash normalization. `/notes` and `/notes/` are different paths, including for parametric routes: `/notes/1/` does not match `/notes/:id`. There is no case folding. `method` is case-sensitive (`"GET"`, not `"get"`).

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

## Method mismatch is a 405

`GET /notes` and `POST /notes` are different routes. Register both methods explicitly.

If the path matches at least one registered pattern and the method matches none of them, the `route` stage returns **405** `{ error: "Method Not Allowed" }` with an `Allow` header. `Allow` lists those methods in first-registration order, separated by `", "` (`GET, PUT`). HEAD is not implied by GET. An unknown path is still **404** `{ error: "Not Found" }` and has no `Allow` header.

`parse` runs before `route`. A JSON content type with invalid JSON is 400 even when the method would otherwise be 405.

`OPTIONS` reaches the matcher unless `listen` was given `cors`. With `cors`, `OPTIONS` is 204 before the pipeline and does not hit your routes.

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

`listen(port)` binds `127.0.0.1`. Pass `listen(port, { host })` to choose another address (`"0.0.0.0"` or `"::"` for a public bind). There is no `listen({ port, host })` object overload. It returns the `http.Server`; `server.close()` stops accepting new connections. Header, request, and keep-alive timeouts are on (20s / 30s / 5s) and overridable on the same options object. See [API](./seltzer-api.md).

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
