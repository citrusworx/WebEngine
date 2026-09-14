# Nectarine + Seltzer and WebEngine

How Nectarine sits next to the HTTP runtime and the engine scaffold. This is the integration story that exists in **code and sibling docs** — not a plugin, not `webengine.toml` loading, and not a generated Express app.

Related:

- [Tutorial](./nectarine-tutorial.md) — a catalog that actually queries inside Seltzer handlers
- [Seltzer getting started](../seltzer/seltzer-getting-started.md)
- [Seltzer integration](../seltzer/seltzer-integration.md)
- [API Reference](./nectarine-api.md) — `registerRoute` lookup rules

## The split

| Package | Owns |
|---|---|
| Nectarine | YAML contracts, named objects, thin DB sockets |
| Seltzer | `http.createServer`, exact `method` + `path`, `ctx.json` |
| WebEngine | Early scaffold / config vocabulary |
| Sig.js / Juice | Browser UI — no Nectarine client |

Nothing in `libraries/seltzer` imports `@citrusworx/nectarine`. Nothing in `engines/webengine` does either. `packages/kiwipress` lists the dependency and does not import it. Integration is **you copying fields**.

## Seltzer: copy method and path

Nectarine API YAML stores `{ method, endpoint }`. Seltzer registers `{ method, path, handler }`. The names are close; there is no importer.

```ts
import { parser } from "@citrusworx/nectarine";
import { Seltzer } from "@citrusworx/seltzer";

const api = parser.yaml("./models/user/api.yml");
const app = Seltzer.init();

for (const [name, node] of Object.entries(api.get ?? {})) {
  const spec = (node as { api?: { method: string; endpoint: string } }).api;
  if (!spec) continue;
  app.route({
    method: spec.method,
    path: spec.endpoint,
    handler: (ctx) => ctx.json({ resource: name, todo: true }),
  });
}

app.listen(3000);
```

Database work stays in Nectarine adapters **inside** the handler. Seltzer will not call `PgSql` for you.

### Exact paths

Seltzer matches pathname only. `/users` matches `/users?id=1`. `/users/:id` is a **literal** path; it does not match `/users/1`.

Checked-in `userAPI.yml` uses `/users/:id`, `/users/:email`, `/users/:state/:city`. Those strings are honest as documentation of intent. They are not a working Seltzer route table. The tutorial uses `/user-by-id` plus `url.searchParams` instead.

Seltzer has no `ctx.params`, `ctx.query`, or `ctx.body`. Read `ctx.req.url` and the request stream yourself — [Seltzer getting started](../seltzer/seltzer-getting-started.md).

### Nested vs flat API files

`parser.registerRoute(path, method, route)` indexes `doc[method][route]`.

`libraries/nectarine/models/user/userAPI.yml` is nested:

```yaml
user:
  get:
    allUsers:
      api:
        method: GET
        endpoint: /users
```

For that file, call `parser.yaml` and walk `api.user.get.allUsers.api`. Flatten the YAML if you want `registerRoute` to work. The path must contain `api.yml` or end with `api.yaml`, or `registerRoute` returns a **string** error instead of throwing.

### Contract validation

A pipeline stage that validates requests against Nectarine models is [Seltzer design](../seltzer/seltzer-design.md), not code. Do not wait on it.

## WebEngine

Older notes described `webengine.toml` backend snippets and `modules: ["nectarine"]` as if the engine started this library.

Today:

- `engines/webengine` does not import Nectarine
- listing a module name in config vocabulary does not `require` the package
- Grapevine does not install Node or run `app.listen`

Treat “WebEngine starts Nectarine” as future orchestration. Run a process that imports `@citrusworx/nectarine` yourself.

## Sig.js and Juice

There is no Nectarine browser client. A Juice page that lists users `fetch`es a Seltzer route whose handler called `PgSql`. Sig.js holds the JSON in a `Signal`. That composition is real and entirely in app code — see the fetch pattern in [Sig.js](../sigjs/README.md).

## KiwiPress

`packages/kiwipress` declares `@citrusworx/nectarine` in `package.json`. There is no TypeScript import in that package today. Do not treat the dependency as a working integration.

## What would be a real importer

Not shipped. If it is built, the honest shape is:

1. `parser.yaml` on a chosen API file
2. walk nested or flat nodes
3. `app.route` for each `{ method, endpoint }` that Seltzer can actually match
4. a handler factory that looks up a `genSQL` name and runs **your** builder + adapter

Until that exists, copy the tutorial’s two routes. Do not document `generateRoutes`.
