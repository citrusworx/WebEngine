# ToDo

Companion app for [Create a ToDo App using WebEngine](../../docs/webengine/todo-course/README.md).

This folder is not a workspace of the monorepo. It installs the published npm packages. There are no `workspace:` or `file:` dependencies.

The API is Seltzer + Nectarine on Postgres. The browser is Sig + Juice, built by Vite. `@citrusworx/webengine` 0.2.1 is installed so you can see that it exports the `WebEngine` class and no route helper. Grapevine describes a droplet and an App Platform static site. It does not boot them from this README.

## From an empty folder

```bash
mkdir todo-app
cd todo-app
npm init -y
npm install @citrusworx/grapevine@0.2.2 @citrusworx/juiceui@0.9.2 @citrusworx/nectarine@0.5.0 @citrusworx/seltzer@0.10.1 @citrusworx/sigjs@^1.0.0 @citrusworx/webengine@0.2.1 pg@8.23.0
npm install -D @types/node@25.6.0 @types/pg@8.23.1 tsx@4.22.3 typescript@5.9.3 vite@8.0.8
```

`package.json` in this folder is that install plus the scripts below. `"type"` is `"module"`.

## Install

```bash
npm install
```

The versions are in `package.json`. `@citrusworx/sigjs` is `^1.0.0`, the stable 1.0 line (`>=1.0.0 <2.0.0`). A clean install resolves 1.0.0. The other packages stay exact pins.

The `grape` name npm puts on `PATH` exits without printing. `@citrusworx/grapevine` 0.2.2 runs its CLI only when `node` is pointed at `dist/bin/cli.js` itself. The `validate:grape`, `plan:grape`, and `status:grape` scripts do that.

## Postgres

```bash
docker compose up -d
```

That starts Postgres 16 with user `todo`, password `todo`, database `todo`, on port 5432. The same values are in `api/.env.example`. A local Postgres with those settings works too. Copy the example to `api/.env` only when you need to override them. The server fills any key that is still unset.

## API

```bash
npm run dev:api
```

`http://127.0.0.1:3001/api/health` returns `{ "ok": true }`.

Production build:

```bash
npm run build:api
npm run start:api
```

## Browser

In a second terminal, from this folder:

```bash
npm run dev:web
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` to port 3001. Leave `VITE_API_BASE` empty for that.

Production build (set the API origin first when the site and API are on different hosts):

```bash
npm run build:web
```

The static files land in `web/dist`. Seltzer does not serve them. `npm run preview:web` serves that folder on port 4173. The preview server does not proxy `/api`.

## Smoke

With the API running:

```bash
bash scripts/smoke.sh
```

## WebEngine exports

```bash
node scripts/webengine-exports.mjs
```

The printed name is `WebEngine`.

## Grapevine

Validate, plan, and status. Do not apply unless the placeholders in `grape.config.yaml` are yours.

```bash
npm run validate:grape
npm run plan:grape
npm run status:grape
```
