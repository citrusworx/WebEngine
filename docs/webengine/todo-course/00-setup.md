# 00 — Setup

[Course](./README.md) · [Next](./01-model.md)

**Goal:** create one npm package, install the published libraries, and start Postgres.

## What you'll build

A folder named `todo-app` with its own `package.json`, its own lockfile, and two directories: `api/` and `web/`. Nothing in that folder points at a monorepo. There is no `workspace:` dependency and no `file:` dependency.

The finished copy in this repository is [`examples/todo-app`](../../../examples/todo-app). Follow the steps here, or read that folder. The files are the same.

## Steps

### 1. Start from an empty directory

```bash
mkdir todo-app
cd todo-app
npm init -y
npm install @citrusworx/grapevine@0.2.2 @citrusworx/juiceui@0.9.2 @citrusworx/nectarine@0.5.0 @citrusworx/seltzer@0.10.1 @citrusworx/sigjs@0.7.0 @citrusworx/webengine@0.2.1 pg@8.23.0
npm install -D @types/node@25.6.0 @types/pg@8.23.1 tsx@4.22.3 typescript@5.9.3 vite@8.0.8
```

`npm init -y` writes a `package.json` named after the folder. Replace it with the one this course runs. `"type": "module"` matters: the API and the Vite config are ES modules.

```json
{
  "name": "todo-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "dev:api": "tsx watch api/src/server.ts",
    "dev:web": "vite --config web/vite.config.ts",
    "build:api": "tsc -p api/tsconfig.json",
    "start:api": "node api/dist/server.js",
    "build:web": "vite build --config web/vite.config.ts",
    "preview:web": "vite preview --config web/vite.config.ts",
    "typecheck": "tsc -p api/tsconfig.json --noEmit && tsc -p web/tsconfig.json --noEmit",
    "validate:grape": "node ./node_modules/@citrusworx/grapevine/dist/bin/cli.js validate -c grape.config.yaml",
    "plan:grape": "node ./node_modules/@citrusworx/grapevine/dist/bin/cli.js plan -c grape.config.yaml",
    "status:grape": "node ./node_modules/@citrusworx/grapevine/dist/bin/cli.js status -c grape.config.yaml"
  },
  "dependencies": {
    "@citrusworx/grapevine": "0.2.2",
    "@citrusworx/juiceui": "0.9.2",
    "@citrusworx/nectarine": "0.5.0",
    "@citrusworx/seltzer": "0.10.1",
    "@citrusworx/sigjs": "0.7.0",
    "@citrusworx/webengine": "0.2.1",
    "pg": "8.23.0"
  },
  "devDependencies": {
    "@types/node": "25.6.0",
    "@types/pg": "8.23.1",
    "tsx": "4.22.3",
    "typescript": "5.9.3",
    "vite": "8.0.8"
  }
}
```

`pg` is listed because `@citrusworx/nectarine` declares it as a peer. The adapter imports `pg`. npm does not install peers for you.

There is no kiwi command in this install. The scripts above are how the app starts.

### 2. Start Postgres

From the app folder:

```bash
docker compose up -d
```

That compose file is the local database:

```yaml
# Local Postgres for the ToDo course. Matches api/.env.example.
name: todo-app

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: todo
      POSTGRES_PASSWORD: todo
      POSTGRES_DB: todo
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U todo -d todo"]
      interval: 5s
      timeout: 5s
      retries: 10
```

Any Postgres 16 with those credentials works. The API reads the same names from env.

### 3. Let the server fill local env

`api/.env.example` is safe to commit. It is the local default, not a production secret:

```text
PORT=3001
PG_USER=todo
PG_PASS=todo
PG_HOST=127.0.0.1
PG_PORT=5432
PG_DB=todo
# Set this to the static site origin when the browser calls the API
# on another host. Leave it unset in dev (Vite proxies /api).
# CORS_ORIGIN=https://todo.example.com
```

On boot the server loads `api/.env` if you created one, then fills any key that is still missing from `.env.example`. A variable already set in the process is left alone. There is no `dotenv` dependency. Copy `.env.example` to `.env` only when you need different values.

`web/.env.example` is the front-end note. Leave `VITE_API_BASE` commented until lesson 09.

```text
# Empty in dev. Vite proxies /api to the Seltzer server.
# Set the API origin before a production build, with no trailing slash.
# VITE_API_BASE=https://api.todo.example.com
```

### 4. Remember the two dev commands

```bash
npm run dev:api
```

```bash
npm run dev:web
```

Leave both for the later lessons. This lesson only needs the database to exist. Lesson 03 is the first time the API must answer.

## Checkpoint

Connect to database `todo` as user `todo` on `127.0.0.1` port `5432` and run a one-row select. You should get a row back. The `todos` table does not exist yet. Lesson 01 describes it. Lesson 03 creates it on boot.

In `node_modules/@citrusworx/*/package.json`, the `version` fields are the table in the [hub](./README.md#published-packages). None of those folders are symlinks into another checkout.

## What's happening

npm installs the tarballs from the registry into this folder's `node_modules`. Nectarine does not open Postgres by itself. The host reads `nectarine.config.yaml`, resolves `PG_*`, and constructs the `pg` adapter. That host code arrives in lesson 02.

## Gap

**No scaffolder.** The packages you installed do not include a CLI that writes `api/` and `web/`. You create the files. Lesson 10 is the one CLI, and it talks to DigitalOcean.

**No SQLite adapter.** Published Nectarine adapters are Postgres, MySQL, and MongoDB. Postgres is the course path.

## Next

[01 — Model the data with Nectarine](./01-model.md)
