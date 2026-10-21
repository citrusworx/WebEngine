# 00 — Setup and workspace

[Course](./README.md) · [Next](./01-model.md)

**Goal:** start Postgres and know which Yarn script runs which half of the app.

## What you'll build

Nothing new yet. You will point at the monorepo layout and boot the database the later lessons assume.

WebEngine projects in this repo live under `apps/`, `libraries/`, `engines/`, and `packages/`. The ToDo app is three workspaces:

| Path | Package | Job |
|---|---|---|
| `apps/todo` | `@citrusworx/todo-app` | Grapevine scripts and the deploy file |
| `apps/todo/back` | `@citrusworx/todo-back` | API |
| `apps/todo/front` | `@citrusworx/todo` | Vite app |

Root `package.json` already includes `apps/*` and `apps/*/*`, so those folders are workspaces without a new glob.

## Steps

### 1. Do not use the Kiwi CLI to scaffold this

`kiwi init`, `kiwi dev`, and `kiwi build` are still placeholders. The Rust CLI prints a line and returns. **Coming soon:** a CLI that scaffolds `apps/` and starts these processes. Until then, the scripts below are the path. They are listed in [`apps/todo/README.md`](../../../apps/todo/README.md).

### 2. Start Postgres

From the repository root:

```bash
docker compose -f apps/todo/docker-compose.yml up -d
```

That compose file is the local database:

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: todo
      POSTGRES_PASSWORD: todo
      POSTGRES_DB: todo
    ports:
      - "5432:5432"
```

Any Postgres 16 with those credentials works. The API reads the same names from env.

### 3. Let the server fill local env

`apps/todo/back/.env.example` is safe to commit. It is the local default, not a production secret:

```
PORT=3001
PG_USER=todo
PG_PASS=todo
PG_HOST=127.0.0.1
PG_PORT=5432
PG_DB=todo
```

On boot the server loads `back/.env` if you created one, then fills any key that is still missing from `.env.example`. A variable already set in the process is left alone. There is no `dotenv` dependency. Copy `.env.example` to `.env` only when you need different values.

### 4. Remember the two dev commands

```bash
yarn workspace @citrusworx/todo-back dev
```

```bash
yarn workspace @citrusworx/todo dev
```

Leave both for the later lessons. This lesson only needs the database to exist. Lesson 03 is the first time the API must answer.

## Checkpoint

Connect to database `todo` as user `todo` on `127.0.0.1` port `5432` and run a one-row select. You should get a row back. The `todos` table does not exist yet. Lesson 01 describes it. Lesson 03 creates it on boot.

## What's happening

Yarn workspaces are how this repo shares `@citrusworx/nectarine`, `@citrusworx/seltzer`, `@citrusworx/webengine`, `@citrusworx/sigjs`, and `@citrusworx/juiceui` without publishing them first. The app `package.json` files depend on `workspace:*`.

Nectarine does not open Postgres by itself. The host reads `nectarine.config.yaml`, resolves `PG_*`, and constructs the `pg` adapter. That host code arrives in lesson 02.

## Gap

**Kiwi CLI.** `kiwi init` / `dev` / `build` do not build this app. Use Yarn.

**No SQLite adapter.** A scratch experiment outside this repo used `node:sqlite`. `libraries/nectarine` does not ship that adapter. Postgres is the course path. MySQL and MongoDB adapters exist and are out of scope here.

## Next

[01 — Model the data with Nectarine](./01-model.md)
