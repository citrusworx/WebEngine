# 09 — Production build and config

[Previous](./08-conditionals.md) · [Course](./README.md) · [Next](./10-grapevine.md)

**Goal:** build the API and the static site as two artifacts, and point the browser at the API when they are no longer the same origin.

## What you'll build

No new feature. You will use the scripts and the `VITE_API_BASE` / `CORS_ORIGIN` split the app already has.

## Steps

### 1. The API base URL

`apps/todo/front/src/api.ts`:

```ts
/** Dev is same-origin through the Vite proxy. Production sets VITE_API_BASE. */
export function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE;
  if (typeof raw !== "string") {
    return "";
  }
  return raw.replace(/\/$/, "");
}
```

Every `fetch` prefixes this. Empty means `/api/todos` on the page's own origin. That is correct for `vite` dev, because of the proxy in `vite.config.ts`.

`apps/todo/front/.env.example` documents the production value and leaves it commented, so a local build without the variable stays same-origin:

```
# Empty in dev. Vite proxies /api to the Seltzer server.
# Set the droplet origin before a production build, with no trailing slash.
# VITE_API_BASE=https://api.todo.example.com
```

Vite inlines `VITE_*` at build time. Changing the variable later does not change `dist/` until you build again. Set it in the environment of the build command, or in `apps/todo/front/.env.production`. Do not commit a real origin if it is only yours. The example stays commented.

### 2. Build the two halves

From the repository root:

```bash
yarn workspace @citrusworx/todo-back build
yarn workspace @citrusworx/todo-back start
```

```bash
yarn workspace @citrusworx/todo build
```

`back` compiles TypeScript to `apps/todo/back/dist/server.js`. `start` runs that file with Node. The YAML stays next to `nectarine.config.yaml` under `src/schemas`. The server resolves the config from `import.meta.url`, so `dist/server.js` still finds `../nectarine.config.yaml`, and the config's `./src/schemas/...` paths still resolve. You do not copy the YAML into `dist/`.

`front` writes `apps/todo/front/dist`. That folder is static HTML, JS, and CSS. `vite preview` can serve it locally. Seltzer will not.

### 3. CORS when the origins differ

If the static site is `https://todo.example.com` and the API is `https://api.todo.example.com` or `http://<droplet>:3001`, the browser sends a cross-origin `fetch`. The API must answer CORS.

`server.ts` reads `CORS_ORIGIN`. The example file leaves it commented. Uncomment it and set the static site's origin, scheme included, no path. The line in `apps/todo/back/.env.example` is:

```
# CORS_ORIGIN=https://todo.example.com
```

The listen options send that origin when the variable is set, and allow `GET`, `POST`, `PATCH`, `DELETE`, and `OPTIONS` with a `Content-Type` header. Preflight happens because the client sets `Content-Type: application/json`.

Leave `CORS_ORIGIN` unset only when the browser and the API share an origin (the Vite proxy, or a reverse proxy you add later that serves both). Unset means Seltzer reflects whatever `Origin` the request carried. That is convenient and broad. Set the variable in production.

### 4. What you do not get

There is no command that builds both and uploads them. `kiwi build` prints `Building project...` and exits. The two Yarn scripts are the build.

The API process needs `PG_*` in its environment when `.env.example` is not the database you want. On a laptop, the example file matches the compose file. On a droplet, export the managed database values and do not rely on the example password.

## Checkpoint

1. `yarn workspace @citrusworx/todo-back build` finishes, and `yarn workspace @citrusworx/todo-back start` answers `GET /api/health` if Postgres is up. Stop the dev server first so port 3001 is free, or the start will fail to bind.
2. `yarn workspace @citrusworx/todo build` writes `apps/todo/front/dist/index.html`.
3. Explain why a production page on another host needs both `VITE_API_BASE` at build time and `CORS_ORIGIN` at API runtime.

[Answers](./answers.md#lesson-09).

## What's happening

Vite's dev server is a tool, not part of the Seltzer pipeline. The proxy exists only in `vite.config.ts` `server.proxy`. It is absent from `dist/`. `apiBase()` is how the built JS finds the API without that proxy.

Seltzer's CORS options are a single object on `listen`. They are not per route. Methods you forget to list fail the preflight, and the browser never sends the PATCH.

Nectarine still reads env at process start. The config file names the keys. The host environment supplies the values. Lesson 10's Grapevine database can create those values in DigitalOcean. It does not, by itself, put them in this process.

## Gap

**Static files.** Coming soon would be a Seltzer static adapter. It is not in 0.9.0. Do not add a third-party static server inside the API for this course. Two processes is the honest shape: API on the droplet, files on a static host.

**`kiwi build`.** Placeholder. Use the workspace scripts.

## Next

[10 — Deploy with Grapevine](./10-grapevine.md)
