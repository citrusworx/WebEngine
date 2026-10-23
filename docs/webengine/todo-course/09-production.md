# 09 — Production build and config

[Previous](./08-conditionals.md) · [Course](./README.md) · [Next](./10-grapevine.md)

**Goal:** build the API and the static site as two artifacts, and point the browser at the API when they are no longer the same origin.

## What you'll build

No new feature. You will use the scripts and the `VITE_API_BASE` / `CORS_ORIGIN` split the app already has.

## Steps

### 1. The API base URL

`web/src/api.ts`:

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

Every `fetch` prefixes this. Empty means `/api/todos` on the page's own origin. That is correct for `vite` dev, because of the proxy in `web/vite.config.ts`.

`web/.env.example` documents the production value and leaves it commented, so a local build without the variable stays same-origin:

```text
# Empty in dev. Vite proxies /api to the Seltzer server.
# Set the API origin before a production build, with no trailing slash.
# VITE_API_BASE=https://api.todo.example.com
```

Vite inlines `VITE_*` at build time. Changing the variable later does not change `web/dist/` until you build again. Set it in the environment of the build command. Do not commit a real origin if it is only yours. The example stays commented.

### 2. Build the two halves

From the app folder. Stop `npm run dev:api` first if it is still holding port 3001.

The scripts:

```json
    "build:api": "tsc -p api/tsconfig.json",
    "start:api": "node api/dist/server.js",
    "build:web": "vite build --config web/vite.config.ts",
    "preview:web": "vite preview --config web/vite.config.ts",
```

```bash
npm run build:api
npm run start:api
```

```bash
npm run build:web
```

`build:api` compiles TypeScript to `api/dist/server.js`. `start:api` runs that file with Node. The YAML stays next to `nectarine.config.yaml` under `api/src/schemas`. The server resolves the config from `import.meta.url`, so `api/dist/server.js` still finds `../nectarine.config.yaml`, and the config's `./src/schemas/...` paths still resolve. You do not copy the YAML into `dist/`.

`build:web` writes `web/dist`. That folder is static HTML, JS, and CSS. `npm run preview:web` can serve it locally on port 4173. Seltzer will not.

The preview server does not proxy `/api`:

```ts
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
```

A preview on 4173 with an empty `VITE_API_BASE` asks the preview origin for `/api/todos` and gets Vite's 404. Dev is the server with the proxy. A production page sets `VITE_API_BASE` to the API origin before `npm run build:web`.

### 3. CORS when the origins differ

If the static site is `https://todo.example.com` and the API is `https://api.todo.example.com` or `http://<droplet>:3001`, the browser sends a cross-origin `fetch`. The API must answer CORS.

`server.ts` reads `CORS_ORIGIN`. The example file leaves it commented. Uncomment it and set the static site's origin, scheme included, no path. The line in `api/.env.example` is:

```text
# Set this to the static site origin when the browser calls the API
# on another host. Leave it unset in dev (Vite proxies /api).
# CORS_ORIGIN=https://todo.example.com
```

The listen options send that origin when the variable is set, and allow `GET`, `POST`, `PATCH`, `DELETE`, and `OPTIONS` with a `Content-Type` header. Preflight happens because the client sets `Content-Type: application/json`.

Leave `CORS_ORIGIN` unset only when the browser and the API share an origin (the Vite proxy, or a reverse proxy you add later that serves both). Unset means Seltzer reflects whatever `Origin` the request carried. That is convenient and broad. Set the variable in production.

### 4. What you do not get

There is no command that builds both and uploads them. The packages this course installs do not include a kiwi CLI. `@citrusworx/kiwipress` 0.4.3 has no `bin`. The two npm scripts are the build.

The API process needs `PG_*` in its environment when `.env.example` is not the database you want. On a laptop, the example file matches the compose file. On a droplet, export the database values and do not rely on the example password. Lesson 10's Grapevine file does not create a managed database and does not copy `PG_*` onto the droplet.

## Checkpoint

1. `npm run build:api` finishes, and `npm run start:api` answers `GET /api/health` if Postgres is up. Stop the dev server first so port 3001 is free, or the start will fail to bind.
2. `npm run build:web` writes `web/dist/index.html`.
3. Explain why a production page on another host needs both `VITE_API_BASE` at build time and `CORS_ORIGIN` at API runtime.

[Answers](./answers.md#lesson-09).

## What's happening

Vite's dev server is a tool, not part of the Seltzer pipeline. The proxy exists only in `vite.config.ts` `server.proxy`. It is absent from `web/dist` and from `preview`. `apiBase()` is how the built JS finds the API without that proxy.

Seltzer's CORS options are a single object on `listen`. They are not per route. Methods you forget to list fail the preflight, and the browser never sends the PATCH.

Nectarine still reads env at process start. The config file names the keys. The host environment supplies the values. Grapevine does not put those values in this process.

## Gap

**Static files.** A Seltzer static adapter is not in 0.10.1. Do not add a third-party static server inside the API for this course. Two processes is the honest shape: API on the droplet, files on an App Platform static site.

**No kiwi build.** Use the npm scripts in `package.json`.

## Next

[10 — Deploy with Grapevine](./10-grapevine.md)
