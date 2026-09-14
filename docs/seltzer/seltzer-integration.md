# Seltzer Integration

How the early HTTP runtime sits next to the rest of WebEngine.

## Nectarine

Nectarine YAML can list `{ method, endpoint }`. Seltzer can register `{ method, path, handler }`. The names are close; there is no importer.

```ts
import { parser } from "@citrusworx/nectarine";
import { Seltzer } from "@citrusworx/seltzer";

const api = parser.yaml("libraries/nectarine/models/user/userAPI.yml");
const app = Seltzer.init();

for (const [name, node] of Object.entries(api.user.get ?? {})) {
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

Database work stays in Nectarine adapters inside the handler. Seltzer will not call `PgSql` for you. See [Nectarine getting started](../nectarine/nectarine-getting-started.md).

Contract validation as a pipeline stage is [design](./seltzer-design.md), not code.

## Juice + Sig.js

Browsers talk to Seltzer with `fetch` or the Seltzer `client` (the client is isomorphic-enough if `fetch` exists).

```ts
import { Signal, effect } from "@citrusworx/sigjs";
import { client } from "@citrusworx/seltzer";

const health = Signal<string>("…");

effect(() => {
  client
    .get({
      path: "/health",
      endpoint: "/health",
      options: { baseUrl: "http://127.0.0.1:3000" },
    })
    .then((data) => health.set(JSON.stringify(data)))
    .catch((err) => health.set(String(err)));
});
```

Juice styles the page that shows `health`. Neither library starts the Node server.

CORS is not configured by Seltzer. If a Sig app on another origin calls you, set headers on `ctx.res` yourself.

## Grapevine

Grapevine provisions DigitalOcean droplets and related resources. It does not install Node or run `app.listen`. After a droplet exists, you still deploy a process that imports `@citrusworx/seltzer`.

`services:` in a grape config is **not applied** (warning only). Do not expect Grapevine to spawn a Seltzer app from YAML.

## WebEngine

`engines/webengine` is an early scaffold. Seltzer does not read `webengine.toml`. Treat “WebEngine starts Seltzer” as future orchestration, not a current API.

## KiwiEngine / KiwiPress

The design doc talks about KiwiEngine philosophy. That is motivation, not an import. If KiwiPress uses a Seltzer-shaped client elsewhere, that code lives in that package — this library exports `Seltzer` and `client` only.

## Contributor electives

Pipeline stages, `:id` routing, and structured responses are implemented by you against [design](./seltzer-design.md) and [exercises](./exercises/README.md). App builders should not block on those pages.
