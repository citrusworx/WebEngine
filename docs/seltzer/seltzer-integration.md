# Seltzer Integration

How the 0.8.x HTTP runtime sits next to the rest of WebEngine.

Seltzer does not boot Juice, compile Nectarine YAML, or apply Grapevine. Integration is **app or engine code**: flatten operations, call `generateRoutes`, run adapters inside `execute` or a handler, `fetch` from a Sig page.

## Nectarine

Nectarine is library-first. It does not spin up a server and does not export `generateRoutes`.

The join that shipped:

1. YAML `*API.yml` → Nectarine `listApiOperations` / `loadApiOperations` → `ApiOperation[]`
2. Seltzer `generateRoutes(operations, { execute })` → `Route[]`
3. `app.route(route)` for each
4. Default `validate` enforces `.required` keys copied onto `Route.contract`
5. Hosts that want Zod later call `app.replace("validate", …)`

WebEngine helpers `createNectarineReadRoutes` / `createNectarineWriteRoutes` / `createNectarineRoutes` wrap that path. Blackwater product JSONB catalog and waitlist GET + POST `joinWaitlist` pass a host `execute` into `createNectarineRoutes`. Health and KiwiPress content stay hand-registered.

```ts
import { loadNectarineConfig, listApiOperations } from "@citrusworx/nectarine/config";
import { Seltzer, generateRoutes } from "@citrusworx/seltzer";

const nectarine = loadNectarineConfig("./nectarine.config.yaml");
const ops = listApiOperations("product", nectarine.getResource("product").api);
const app = Seltzer.init();

for (const route of generateRoutes(
  ops.filter((operation) => operation.crud === "read" && operation.method === "GET"),
  {
    execute: ({ query, params, ctx }) => {
      if (query === "productById") {
        return ctx.locals.products.find((item) => item.id === params.id) ?? null;
      }
      return ctx.locals.products;
    },
  },
)) {
  app.route(route);
}

app.listen(3000, { locals: { products } });
```

Set `transport.server: seltzer` in `nectarine.config.yaml`. Do not use Express route generation for WebEngine / Blackwater.

Parametric YAML (`/api/products/:id`, `/api/products/catalog/:catalog`) **should** be registered. The matcher prefers static prefixes. See [Generate routes](./seltzer-generate.md).

Adapters still run in **your** `execute` / handler. Seltzer will not call Postgres for you.

## Juice + Sig.js

Browsers talk to Seltzer with `fetch`. Juice styles the page. Sig.js owns the live values. Neither library starts the Node server.

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

Prefer platform `fetch` in the browser so you do not import `Seltzer.listen`’s `node:http` graph. `client.get` is the same JSON shape when you are already in Node (and throws `HttpError` on non-2xx).

CORS is configured on `listen`:

```ts
app.listen(3000, {
  cors: { origin: "http://localhost:5173" },
});
```

You do not need per-route `OPTIONS` handlers or extra headers on every `ResponseData` for the simple Vite-dev case. `OPTIONS` is 204 before the pipeline.

Juice attributes (`stack`, `card`, `hero`) do not change this HTTP story. See [Sig.js + Juice](../sigjs/sig-juice-integration.md).

## Grapevine

Grapevine provisions DigitalOcean droplets and related resources. It does not install Node or run `app.listen`. After a droplet exists, you still deploy a process that imports `@citrusworx/seltzer`.

Do not expect Grapevine to spawn a Seltzer app from YAML.

## WebEngine

`engines/webengine` can host Nectarine through Seltzer (`transport.server: seltzer`, kernel helpers that call `generateRoutes`). After nectarine bootstrap, `startSeltzerFromKernel` (alias `serveNectarineHttp`) is the opt-in `Seltzer.init()` + `createRoutes` + `listen`. Kernel bootstrap still does not auto-listen. A standalone app can still call `Seltzer.init()` itself (Blackwater today). Seltzer does not read `webengine.toml`.

A separate Vite/React/Sig.js process against that listener is the [dual-process frontend + API](../webengine/dual-process.md) path. Seltzer still does not serve the UI.

See [WebEngine](../webengine/README.md) and [Nectarine kernel contract](../webengine/nectarine-kernel-contract.md).

## KiwiPress

KiwiPress is a WordPress REST **client**. It may call `Seltzer.init().handler({ adapter: "node:http", options: { baseUrl, headers, allowSelfSigned } })` to store origin and auth headers.

Seltzer `client` now honors `allowSelfSigned` on `https://` via optional `undici`. KiwiPress may still use its own `fetch` helper (`requestWordPress`) for WordPress-specific behavior. Do not document KiwiPress as “Seltzer serving WordPress.” It is Seltzer types plus a separate request path.

## Contributor electives

[Design](./seltzer-design.md) and [exercises](./exercises/README.md) rebuild the shipped pipeline from `node:http`. App builders should not block on those pages. The product tutorial is [Building a Notes JSON API](./seltzer-api-tutorial.md).
