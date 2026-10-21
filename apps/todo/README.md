# ToDo

Companion app for [Create a ToDo App using WebEngine](../../docs/webengine/todo-course/README.md).

The API is Seltzer + Nectarine + `createNectarineRoutes` on Postgres. The browser is Sig + Juice, built by Vite. Grapevine describes a droplet, a managed database, and a Spaces static site. It does not boot them from this README.

`kiwi init`, `kiwi dev`, and `kiwi build` are still placeholders. Use the workspace scripts below.

## Postgres

```bash
docker compose -f apps/todo/docker-compose.yml up -d
```

That starts Postgres 16 with user `todo`, password `todo`, database `todo`, on port 5432. The same values are in `apps/todo/back/.env.example`. A local Postgres with those settings works too. Copy the example to `apps/todo/back/.env` only when you need to override them. The server fills any key that is still unset.

## API

From the repository root:

```bash
yarn workspace @citrusworx/todo-back dev
```

`http://127.0.0.1:3001/api/health` returns `{ "ok": true }`.

Production build:

```bash
yarn workspace @citrusworx/todo-back build
yarn workspace @citrusworx/todo-back start
```

## Browser

In a second terminal, from the repository root:

```bash
yarn workspace @citrusworx/todo dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` to port 3001. Leave `VITE_API_BASE` empty for that.

Production build (set the API origin first when the site and API are on different hosts):

```bash
yarn workspace @citrusworx/todo build
```

The static files land in `apps/todo/front/dist`. Seltzer does not serve them.

## Smoke

With the API running:

```bash
bash apps/todo/scripts/smoke.sh
```

## Grapevine

Validate, plan, and status. Do not apply unless the placeholders in `grape.config.yaml` are yours.

```bash
yarn workspace @citrusworx/todo-app validate:grape
yarn workspace @citrusworx/todo-app plan:grape
yarn workspace @citrusworx/todo-app status:grape
```
