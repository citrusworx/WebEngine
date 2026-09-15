# Seltzer Integration

How the early HTTP runtime sits next to the rest of WebEngine.

Seltzer does not boot Juice, compile Nectarine, or apply Grapevine. Integration is **app code**: copy a method/path, call an adapter inside a handler, `fetch` from a Sig page.

## Nectarine

Nectarine YAML can list `{ method, endpoint }`. Seltzer can register `{ method, path, handler }`. The names are close; there is no importer and no codegen.

### Copy exact-path pairs

Checked-in file: `libraries/nectarine/models/user/userAPI.yml`.

Safe to copy into Seltzer today:

| YAML node | method | endpoint |
|---|---|---|
| `user.get.allUsers.api` | `GET` | `/users` |
| `user.create.user.api` | `POST` | `/users` |
| `post.get.allPosts.api` | `GET` | `/posts` |

Skip (literal `:param` segments — they will not match traffic):

- `GET /users/:id`
- `GET /users/:email`
- `GET /users/:city`
- `GET /users/:state/:city`
- `PUT /users/:id`
- `DELETE /users/:id`

Rewrite those as query routes (`GET /user?id=`) in Seltzer if you need lookup now.

### Walk `parser.yaml` — do not trust `registerRoute` on this fixture

```ts
import { parser } from "@citrusworx/nectarine";
import { Seltzer } from "@citrusworx/seltzer";

const api = parser.yaml("libraries/nectarine/models/user/userAPI.yml");
const app = Seltzer.init();

const getAll = api.user.get.allUsers.api as { method: string; endpoint: string };

app.route({
  method: getAll.method,
  path: getAll.endpoint,
  handler: (ctx) => ctx.json({ users: [] }),
});

app.listen(3000);
```

`parser.registerRoute(path, "get", "allUsers")` indexes `doc["get"]["allUsers"]`. The fixture is nested under `user`, so that lookup misses. The helper also requires the filepath to contain `api.yml`. It never calls `app.route`.

If you loop `Object.entries(api.user.get)`, filter endpoints that include `:` unless you are registering them as **literals** on purpose.

### Adapters stay in the handler

Seltzer will not call `PgSql` / `Mysql` / `Mngz` for you. A handler that lists users still opens a client, runs SQL you built (Nectarine’s compiler does not emit SQL yet), and `ctx.json`s the rows.

```ts
app.route({
  method: "GET",
  path: "/users",
  handler: async (ctx) => {
    try {
      const rows = await loadUsers(); // your adapter call
      return ctx.json(rows);
    } catch (err) {
      console.error(err);
      return ctx.json({ error: "failed" }, 500);
    }
  },
});
```

See [Nectarine getting started](../nectarine/nectarine-getting-started.md). Contract validation as a pipeline stage is [design](./seltzer-design.md), not code.

## Juice + Sig.js

Browsers talk to Seltzer with `fetch` or (if the bundle allows) Seltzer `client`. Juice styles the page. Sig.js owns the live values. Neither library starts the Node server.

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function HealthLine() {
  const text = Signal("checking…");
  const line = <p>{() => text.get()}</p>;

  effect(() => {
    const controller = new AbortController();
    fetch("http://127.0.0.1:3000/health", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { ok?: boolean }) => text.set(data.ok ? "API up" : "API down"))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        text.set(String(err));
      });
    return () => controller.abort();
  });

  return line;
}

mount(<HealthLine />, document.getElementById("root")!);
```

Prefer platform `fetch` in the browser so you do not import `Seltzer.listen`’s `node:http` graph. `client.get` is the same JSON shape when you are already in Node.

CORS is not configured by Seltzer. If a Sig app on another origin calls you, set headers on `ctx.res` **before** `json` — which means you cannot use `ctx.json` as written, because `json` calls `writeHead` with only `Content-Type`. Write the head yourself:

```ts
app.route({
  method: "GET",
  path: "/health",
  handler: (ctx) => {
    ctx.res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "http://localhost:5173",
    });
    ctx.res.end(JSON.stringify({ ok: true }));
  },
});
```

Preflight `OPTIONS` is another exact route you register, or browsers will fail. That is handler code, not a Seltzer plugin.

Juice attributes (`stack`, `card`, `hero`) do not change this HTTP story. See [Sig.js + Juice](../sigjs/sig-juice-integration.md).

## Grapevine

Grapevine provisions DigitalOcean droplets and related resources. It does not install Node or run `app.listen`. After a droplet exists, you still deploy a process that imports `@citrusworx/seltzer`.

`services:` in a grape config is **not applied** (warning only). Do not expect Grapevine to spawn a Seltzer app from YAML.

## WebEngine

`engines/webengine` is an early scaffold. Seltzer does not read `webengine.toml`. Treat “WebEngine starts Seltzer” as future orchestration, not a current API.

## KiwiPress

KiwiPress is a standalone WordPress client plus native CMS, not “Seltzer serving WordPress” and not a WebEngine module.

Outbound: it calls `Seltzer.init().handler({ adapter: "node:http", options: { baseUrl, headers, allowSelfSigned } })` to store origin and auth headers, then `fetch`es `ctx.endpoint` via `requestWordPress` (including `undici` when `allowSelfSigned` is set). Seltzer `client` is not used for those calls.

Inbound: `registerKiwiPressGateway` attaches exact `/__kiwipress` routes onto a Seltzer listener. Item updates use `?id=` because Seltzer has no `:id` matcher.

Transfer: `WPSync` moves WordPress JSON onto Nectarine-shaped records and can persist them through KiwiPress adapters. See [KiwiPress](../kiwipress/README.md).

## Contributor electives

Pipeline stages, `:id` routing, and structured responses are implemented by you against [design](./seltzer-design.md) and [exercises](./exercises/README.md). App builders should not block on those pages. The product tutorial is [Building a Notes JSON API](./seltzer-api-tutorial.md).
