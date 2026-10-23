# Answers

Try the checkpoint before you read the matching section.

## Lesson 01

`PATCH /api/todos/:id` runs the query named `updateTodo`. The API operation's `query:` field says so, and the queries file defines `updateTodo` as an `UPDATE` on `todos`.

The columns set are `title`, `notes`, and `done`. `created_at` is not in that list. The `WHERE` is `id = $1` in the YAML. The compiler shifts it to `$4` after the three `SET` placeholders. The id comes from the path.

If the JSON has `title` and `done` but no `notes`, validation passes (`notes` is not `.required`) and the host binds `notes` as `NULL`.

## Lesson 02

The six paths are `GET /api/health`, `GET /api/todos`, `GET /api/todos/:id`, `POST /api/todos`, `PATCH /api/todos/:id`, and `DELETE /api/todos/:id`. Health is the hand-written route. The other five are the operations in `todoAPI.yml`. There is no `PUT`.

`createNectarineRoutes` is not one of them. `@citrusworx/webengine` 0.2.1 exports `WebEngine`. `listApiOperations` plus `generateRoutes` is the host in `api/src/routes.ts`.

## Lesson 03

Create is status 200 because the generated handler returns `{ body: result }` and does not set `status`. The default is 200. `response({ status: 201, body })` exists. This app does not call it.

The JSON includes the title because `createTodo` lists `returning: '*'`. `pg` returns the inserted row, including the `SERIAL` id. The smoke script checks that:

```js
if (status !== "200") throw new Error("POST status " + status);
if (typeof created.id !== "number" || created.title !== "Ship the course") {
  throw new Error("POST body " + JSON.stringify(created));
}
if (created.notes !== "Write the lessons" || created.done !== false) {
  throw new Error("POST row " + JSON.stringify(created));
```

`UPDATE` and `DELETE` do not get that clause. Their responses are the ack in lesson 06.

## Lesson 06

The form's save path sends `title`, `notes`, and `done` via `todoPatch`. `created_at` is not an update column. The database set it on insert. Sending it would not change the `UPDATE` unless you added it to `fields`, and then you would have to send it every time. `id` is the path, not a `SET` column.

The smoke script's second PATCH omits `notes`. The following read has `notes: null` and `done: true`. The script throws if that is not true:

```js
if (row.notes !== null) throw new Error("expected notes null, got " + JSON.stringify(row));
if (row.done !== true) throw new Error("expected done true");
if (row.id !== created.id) throw new Error("id changed " + JSON.stringify(row));
if (deleted.ok !== true || deleted.rowCount !== 1) throw new Error("DELETE " + JSON.stringify(deleted));
```

Omitting `title` or `done` is a 400 from the validate stage, not a null write. The words `string` and `boolean` in the API YAML are not type checks. `false` counts as present. A blank string does not.

## Lesson 09

`VITE_API_BASE` is baked into the static JS when Vite builds. The browser on the static origin uses it to find the API. `CORS_ORIGIN` is read by the API process so the browser is allowed to call that other origin. The proxy in `web/vite.config.ts` exists only for the dev server. It is not in `web/dist`, and `preview` does not copy it.

You need both because they run in different places: one at build time in the front end, one at request time on the API.

## Lesson 10

A valid plan lists one tag (`todo`), one SSH key (`todo`), one VPC (`todo`), droplet `todo-api-01`, firewall `todo-api`, and App Platform app `todo-web`. That is 6 resources.

It does not list a managed database, a Space, a certificate, or a CDN host. Those kinds are not in `@citrusworx/grapevine` 0.2.2. Unknown keys would have been stripped, and the count would still have said valid.

`status` without `DO_TOKEN` does not mean the account is empty. It prints `DO_TOKEN is not set` and `Live account skipped (token not set).`

## Lesson 11

A filter that feels right: `Signal` for the mode, `memo` that returns `todos.get().filter(...)`, `bindList` on that memo, and an empty message that distinguishes "no rows at all" from "no rows in this filter". No new route.

A due date that feels right: a nullable or required column, present in the insert and update field lists, sent on every PATCH, rendered as text. If you leave it out of one PATCH, you should be able to predict null or 400 before you reload. Keep the id as `SERIAL`.

Either way, `bash scripts/smoke.sh` should still print `smoke ok` unless you changed the `notes` contract on purpose.
