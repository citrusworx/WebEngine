# Dual-process frontend + API

Run a **separate frontend** (Vite, React, Sig.js, or anything else that speaks HTTP) against a **Seltzer JSON API** bootstrapped by the WebEngine kernel and Nectarine.

Two processes. One HTTP conversation. No Blackwater-specific host glue, no in-process SPA, no Express.

The libraries stay standalone-first:

| Piece | Job |
|---|---|
| **WebEngine** | Orchestration: `kiwi.config.toml`, kernel modules, Nectarine bootstrap |
| **Nectarine** | YAML + DB. Does not listen. There is no `nectarine serve`. |
| **Seltzer** | HTTP: `init` → object routes → `listen`. CORS/`OPTIONS` 204 live here. |
| **Frontend** | Out of process. Talks to the API origin with platform `fetch`. |

Kernel bootstrap still does **not** auto-listen. After `runKernelLifecycle`, the host calls `startSeltzerFromKernel` (alias `serveNectarineHttp`). That helper is the opt-in `Seltzer.init()` + `handle.createRoutes` + `listen` from `@citrusworx/webengine`.

This page is the developer path. YAML, migrations, and `createRoutes` stay in the [Nectarine kernel contract](./nectarine-kernel-contract.md). CORS, `ResponseData`, and the outbound `client` stay in the [Seltzer docs](../seltzer/README.md).

## Architecture

```
Frontend process                         API process
Vite / React / Sig.js                    runKernelLifecycle
e.g. http://localhost:5173               startSeltzerFromKernel / serveNectarineHttp
                                         port: options → kiwi webengine.port → network.port

        fetch("http://127.0.0.1:<api-port>/health")
        Origin: http://localhost:5173
                     │
                     ▼
        Seltzer listen({ cors })  →  OPTIONS 204, then the pipeline
```

The frontend origin and the API origin are different. Pass `cors` on the helper so the browser preflight succeeds. You do not register per-route `OPTIONS` handlers for the Vite-dev case.

Seltzer does not serve the UI, `index.html`, or a `dist/` folder. Vite (or the equivalent) is the frontend process.

## Minimal API boot

Enable Nectarine on the kernel and keep a project `nectarine.config.yaml`:

```toml
# kiwi.config.toml
[kernel]
modules = ["core", "web", "nectarine"]

[webengine]
port = 8080
```

Then the one-liner path:

```ts
import {
  runKernelLifecycle,
  startSeltzerFromKernel,
} from "@citrusworx/webengine";

const result = await runKernelLifecycle(process.cwd());
const http = await startSeltzerFromKernel(result, {
  // options.port → kiwi webengine.port → web runtime network.port
  cors: { origin: "http://localhost:5173" },
  routes: [
    {
      method: "GET",
      path: "/health",
      handler: () => ({ body: { ok: true } }),
    },
  ],
});

// http.port is the bound TCP port (`options.port: 0` is ephemeral).
console.log(`Seltzer API on http://127.0.0.1:${http.port}`);
```

Leave the process running. On shutdown:

```ts
await http.close();
await shutdownKernel(result.modulesInOrder, result.context);
```

`serveNectarineHttp` is the same function. The first argument is a `KernelContext` or the `KernelRunResult` from `runKernelLifecycle`.

Without a bootstrapped nectarine handle the helper throws: enable `kernel.modules` `nectarine`, run the lifecycle, then call it.

### What the helper does

1. `Seltzer.init()`
2. Registers `options.routes` first (health, KiwiPress, other host-owned paths)
3. Registers `handle.createRoutes({ resources, … })` — resources from options, else unique `apps[].resources` in `nectarine.config.yaml`, else every loaded resource
4. `listen` with `cors`, `locals`, and `onListening`

Default `onListening` logs `Seltzer server listening on port <bound>`.

Returns `{ app, server, port, close }`. `close()` shuts the `http.Server`. Pair it with `shutdownKernel` so adapters disconnect.

### Port

`resolveSeltzerListenPort` (used by the helper):

1. `options.port` — including `0` for an ephemeral test port
2. kiwi `[webengine] port`
3. web runtime `network.port` (`webengine.config.json5`)

If none of those is a number, listen fails with a port error. There is no Express, and Seltzer does not pick a free port on `EADDRINUSE`.

### Helper options

`StartSeltzerFromKernelOptions` is the `createRoutes` bag plus listen fields:

| Option | Role |
|---|---|
| `resources` | Names passed to `handle.createRoutes` |
| `port` | Listen port; `0` ephemeral |
| `cors` | Seltzer `CorsOptions` (`origin`, `methods`, `headers`) |
| `locals` | Becomes `ctx.locals` |
| `routes` | Extra `Route`s, registered before generated ones |
| `onListening` | Bound-port callback |
| `execute` / `query` / `connected` / `exclude` / `include` / `methods` / `notFound` | Forwarded to `createRoutes` |

Hand-register health. Do not invent a static-file route to paper over the missing SPA server.

Hosts that want the Blackwater-today shape can still `Seltzer.init()` → `app.route(...)` → `app.listen(port)` themselves. See the [kernel contract](./nectarine-kernel-contract.md).

## Frontend

Point the UI at the **API origin**, not at the Vite origin:

```ts
const API = "http://127.0.0.1:8080";

const res = await fetch(`${API}/health`);
const data = (await res.json()) as { ok?: boolean };
```

A Vite-dev CORS example that matches the helper:

```ts
const http = await startSeltzerFromKernel(result, {
  cors: { origin: "http://localhost:5173" },
});
```

Seltzer CORS runs **before** the pipeline. `OPTIONS` is 204. If `cors.origin` is set, it must equal the request `Origin`; otherwise the request origin is reflected. No `Origin` header means no CORS headers. Details: [Seltzer API](../seltzer/seltzer-api.md), [Getting started](../seltzer/seltzer-getting-started.md), [Integration](../seltzer/seltzer-integration.md).

Sig.js, React, and vanilla DOM all use the same `fetch`. A Sig `effect` that hits `/health` is in [Seltzer integration](../seltzer/seltzer-integration.md#juice--sigjs). Juice styles the page. Neither library starts this Node process.

### Seltzer `client` is not the SPA

`client.get` / `client.post` / … are outbound `fetch` helpers for **server** code (same JSON shape, `HttpError` on non-2xx). The root `@citrusworx/seltzer` module also exports `Seltzer`, which imports `node:http`.

Use platform `fetch` in the browser so the bundle never pulls the listen graph. `client` is not a browser SPA framework and does not replace Vite, React, or Sig.js.

## What this is not

- **Not a Blackwater migration.** `apps/blackwatersound` still calls `Seltzer.init()` / `listen` itself. It can move to `startSeltzerFromKernel` later. This page does not invent a Blackwater bridge or a custom host to paper over library gaps.
- **Not a Sig.js frontend runtime.** Sig.js stays a standalone UI library. WebEngine does not mount or bundle the page.
- **Not static file serving.** Seltzer has no Express, no `app.use(express.static)`, and no built-in SPA server. The frontend process owns HTML/JS/CSS.
- **Not kernel auto-listen.** The nectarine module stops after connect + `applyMigrations`. HTTP is opt-in.
- **Not `nectarine serve`.** Nectarine does not generate `Route`s or bind a port.

## Related

- [WebEngine](./README.md) — kiwi kernel, public API, current status
- [Nectarine kernel contract](./nectarine-kernel-contract.md) — YAML, migrations, `createRoutes`, helper rules
- [Seltzer](../seltzer/README.md) — HTTP runtime
- [Seltzer integration](../seltzer/seltzer-integration.md) — Nectarine join, Juice/Sig `fetch`, CORS on `listen`
- [Seltzer client](../seltzer/seltzer-client.md) — outbound Node `client.*`; browser vs Node
- [Nectarine](../nectarine/README.md) — library-first data layer
