# 01 — Model the data with Nectarine

[Previous](./00-setup.md) · [Course](./README.md) · [Next](./02-routes.md)

**Goal:** describe one todo as YAML: the table, the named queries, and the HTTP operations. No SQL in TypeScript.

## What you'll build

Three files under `apps/todo/back/src/schemas/todo/`, plus `nectarine.config.yaml` so Nectarine can find them.

A todo is one row: a client-supplied id, a title, optional notes, a done flag, and a `created_at` the database fills in.

## Steps

### 1. Schema

`apps/todo/back/src/schemas/todo/todoSchema.yml`:

```yaml
Todo:
  table: todos
  description: One task on the learner's list
  fields:
    id: string PRIMARY KEY
    title: string NOT NULL
    notes: string
    done: boolean NOT NULL DEFAULT false
    created_at: timestamp NOT NULL DEFAULT NOW()
  indexes:
    todos_created_idx:
      columns: [created_at]
```

`id` is text, not a serial. Nothing in this file generates a UUID. `notes` is nullable on purpose, so lesson 06 can show a missing PATCH field becoming `NULL`. `title` is `NOT NULL`. `done` defaults to false. `created_at` defaults to `NOW()` and is not in the insert column list, so the client does not send it.

The model name is `Todo`. The table name is `todos`. The Nectarine resource name, in the config below, is `todo`. Those three strings are related and not interchangeable.

### 2. Queries

`apps/todo/back/src/schemas/todo/todoQueries.yml`:

```yaml
# No RETURNING clause. A successful write comes back as
# { ok: true, rowCount: 1 }, not the saved row. The client keeps the
# object it sent, then refetches the list.
todo:
  read:
    allTodos:
      type: SELECT
      table: todos
      fields: '*'
      orderBy: created_at ASC

    byId:
      type: SELECT
      table: todos
      fields: '*'
      where: id = $1

  create:
    createTodo:
      type: INSERT
      table: todos
      fields: [id, title, notes, done]

  update:
    # Every column listed here is bound from the body. A missing key
    # becomes NULL. The client sends title, notes, and done together.
    updateTodo:
      type: UPDATE
      table: todos
      fields: [title, notes, done]
      where: id = $1

  delete:
    deleteTodo:
      type: DELETE
      table: todos
      where: id = $1
```

The compiler turns this into SQL with `$1`, `$2`, … placeholders. You do not write the SQL string. There is no `RETURNING`, so a write that affects rows comes back as an acknowledgement, not the row. That is gap 2, and it is deliberate in this file.

### 3. HTTP operations

`apps/todo/back/src/schemas/todo/todoAPI.yml`:

```yaml
todo:
  read:
    allTodos:
      api:
        method: GET
        endpoint: /api/todos
        query: allTodos

    byId:
      api:
        method: GET
        endpoint: /api/todos/:id
        query: byId

  create:
    createTodo:
      api:
        method: POST
        endpoint: /api/todos
        query: createTodo
        body:
          id: string.required
          title: string.required
          notes: string
          done: boolean

  update:
    updateTodo:
      api:
        method: PATCH
        endpoint: /api/todos/:id
        query: updateTodo
        body:
          title: string.required
          notes: string
          done: boolean.required

  delete:
    deleteTodo:
      api:
        method: DELETE
        endpoint: /api/todos/:id
        query: deleteTodo
```

`endpoint` becomes the route path. `query` is the name in the queries file. `body` is copied onto the Seltzer route contract so the default validate stage can see `.required`.

`string` and `boolean` are labels. Seltzer does not check those types. It checks that a `.required` key is present and, for strings, non-blank. `false` counts as present. A missing `done` is 400. A missing `notes` is allowed, and the update then binds `NULL`.

### 4. Point the config at the files

`apps/todo/back/nectarine.config.yaml` names env keys. It does not contain the password:

```yaml
# ToDo — Nectarine root config.
# Code reads this file. Secrets stay in env; this file names the keys.

version: "0.1"
app: todo
engine: WebEngine

database:
  default: postgres
  postgres:
    env:
      user: PG_USER
      password: PG_PASS
      host: PG_HOST
      port: PG_PORT
      database: PG_DB

transport:
  server: seltzer
  # CRUD routes: listApiOperations → Seltzer generateRoutes via
  # @citrusworx/webengine createNectarineRoutes. Health stays hand-written.
  # There is no sqlite adapter in this package. Postgres is the path.

resources:
  - name: todo
    schema: ./src/schemas/todo/todoSchema.yml
    queries: ./src/schemas/todo/todoQueries.yml
    api: ./src/schemas/todo/todoAPI.yml
```

The loader requires `version`, `database.default`, the postgres env names, and one resource with `name`, `schema`, `queries`, and `api`.

## Checkpoint

Open the three YAML files and the config side by side. Answer without running the server:

- Which query runs for `PATCH /api/todos/:id`?
- Which columns does that update set?
- What is stored if the JSON body has `title` and `done` but no `notes`?

Lesson 03 is when you watch that happen. [Answers](./answers.md#lesson-01).

## What's happening

Nectarine's compiler (`CCompiler`) owns SQL. `loadNectarineConfig` reads the root file, resolves the resource paths, and parses the three YAML documents. The migrator, in the next lesson, turns the schema document into `CREATE TABLE IF NOT EXISTS`. The route helper turns the API document into Seltzer routes and compiles the named query at request time.

Blackwater uses the same triad (`*Schema.yml`, `*Queries.yml`, `*API.yml`) for each resource. ToDo is one resource.

## Gap

**Client ids.** `id: string PRIMARY KEY` has no default. The insert lists `id` as a column. The browser must send one. Coming soon would be a server default or a host `execute` that fills `id` the way Blackwater's waitlist does. This course keeps the generated path and generates the id in the browser.

**POST body.** No `RETURNING` means the handler cannot send the new row back. Adding `RETURNING` would change the response shape. We leave it off so the client code matches today's compiler result.

## Next

[02 — Generate CRUD routes](./02-routes.md)
