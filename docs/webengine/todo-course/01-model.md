# 01 — Model the data with Nectarine

[Previous](./00-setup.md) · [Course](./README.md) · [Next](./02-routes.md)

**Goal:** describe one todo as YAML: the table, the named queries, and the HTTP operations. No SQL in TypeScript.

## What you'll build

Three files under `api/src/schemas/todo/`, plus `api/nectarine.config.yaml` so Nectarine can find them.

A todo is one row: a serial id, a title, optional notes, a done flag, and a `created_at` the database fills in.

## Steps

### 1. Schema

`api/src/schemas/todo/todoSchema.yml`:

```yaml
Todo:
  table: todos
  description: One task on the learner's list
  fields:
    # integer AUTO_INCREMENT compiles to SERIAL on Postgres.
    # A string default of gen_random_uuid() is rejected by the compiler.
    id: integer PRIMARY KEY AUTO_INCREMENT
    title: string NOT NULL
    notes: string
    done: boolean NOT NULL DEFAULT false
    created_at: timestamp NOT NULL DEFAULT NOW()
  indexes:
    todos_created_idx:
      columns: [created_at]
```

`id: integer PRIMARY KEY AUTO_INCREMENT` compiles to `SERIAL` on Postgres. The compiler rejects `DEFAULT gen_random_uuid()`. `notes` is nullable on purpose, so lesson 06 can show a missing PATCH field becoming `NULL`. `title` is `NOT NULL`. `done` defaults to false. `created_at` defaults to `NOW()` and is not in the insert column list, so the client does not send it.

The model name is `Todo`. The table name is `todos`. The Nectarine resource name, in the config below, is `todo`. Those three strings are related and not interchangeable.

### 2. Queries

`api/src/schemas/todo/todoQueries.yml`:

```yaml
# INSERT omits id. SERIAL fills it. `returning: '*'` is compiled, so POST
# comes back as the saved row.
# UPDATE and DELETE ignore `returning` in @citrusworx/nectarine 0.5.0.
# Every column in the update field list is bound. A missing key becomes NULL.
# The client sends title, notes, and done together.
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
      fields: [title, notes, done]
      returning: '*'

  update:
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

The compiler turns this into SQL with `$1`, `$2`, … placeholders. You do not write the SQL string.

`createTodo` lists `returning: '*'`, so a successful insert comes back as the row, including `id` and `created_at`. `updateTodo` and `deleteTodo` do not get a `RETURNING` clause even if you add the key. Lesson 02 shows what the host does with an empty `rows` array.

The update lists `title`, `notes`, and `done`. A missing key is bound as `NULL`. That is gap 1, and it is the compiler's `SET` list plus the host binder.

### 3. HTTP operations

`api/src/schemas/todo/todoAPI.yml`:

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

`string` and `boolean` are labels. Seltzer does not check those types. It checks that a `.required` key is present and, for strings, non-blank. `false` counts as present. A missing `done` on PATCH is 400. A missing `notes` is allowed, and the update then binds `NULL`.

POST does not require `id`. The column is `SERIAL`.

### 4. Point the config at the files

`api/nectarine.config.yaml` names env keys. It does not contain the password:

```yaml
# ToDo — Nectarine root config.
# Code reads this file. Secrets stay in env; this file names the keys.
# `engine: WebEngine` is a label. @citrusworx/webengine 0.2.1 does not
# read this file or register routes.

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
  # CRUD routes: listApiOperations, then Seltzer generateRoutes.
  # Health stays hand-written. Adapters in this package are pg, mysql, and
  # mongodb. There is no sqlite adapter.

resources:
  - name: todo
    schema: ./src/schemas/todo/todoSchema.yml
    queries: ./src/schemas/todo/todoQueries.yml
    api: ./src/schemas/todo/todoAPI.yml
```

The loader requires `version`, `database.default`, the postgres env names, and one resource with `name`, `schema`, `queries`, and `api`. `engine: WebEngine` is stored on the document. Loading the file does not construct `WebEngine`.

## Checkpoint

Open the three YAML files and the config side by side. Answer without running the server:

- Which query runs for `PATCH /api/todos/:id`?
- Which columns does that update set?
- What is stored if the JSON body has `title` and `done` but no `notes`?
- Which columns does `createTodo` insert, and which column fills `id`?

Lesson 03 is when you watch that happen. [Answers](./answers.md#lesson-01).

## What's happening

Nectarine's compiler (`CCompiler`) owns SQL. `loadNectarineConfig` reads the root file, resolves the resource paths, and parses the three YAML documents. The migrator, in the next lesson, turns the schema document into `CREATE TABLE IF NOT EXISTS`. The route host turns the API document into Seltzer routes and compiles the named query at request time.

## Gap

**No UUID default.** `gen_random_uuid()` is an unsupported `DEFAULT`. `SERIAL` is the published server-side id. The browser does not send one.

**UPDATE and DELETE drop `returning`.** Adding the key to those queries does not change the SQL. POST is the query that can return a row.

## Next

[02 — Generate CRUD routes](./02-routes.md)
