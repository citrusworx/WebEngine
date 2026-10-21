# Answers

Try the checkpoint before you read the matching section.

## Lesson 01

`PATCH /api/todos/:id` runs the query named `updateTodo`. The API operation's `query:` field says so, and the queries file defines `updateTodo` as an `UPDATE` on `todos`.

The columns set are `title`, `notes`, and `done`. `created_at` is not in that list. The `WHERE` is `id = $1`, and the id comes from the path, after the set parameters.

If the JSON has `title` and `done` but no `notes`, validation passes (`notes` is not `.required`) and the compiler binds `notes` as `NULL`.

## Lesson 02

The six paths are `GET /api/health`, `GET /api/todos`, `GET /api/todos/:id`, `POST /api/todos`, `PATCH /api/todos/:id`, and `DELETE /api/todos/:id`. Health is the hand-written route. The other five are the operations in `todoAPI.yml`. There is no `PUT`.

## Lesson 03

Create is status 200 because the generated handler returns `{ body: result }` and does not set `status`. The default is 200.

The body has no title because the insert has no `RETURNING` clause. `pg` reports a row count and no rows. That becomes `{ ok: true, rowCount: 1 }`. The title is in the table. `GET /api/todos` shows it. The script checks that the ack does not have a `title` property:

```js
if (ack.ok !== true || ack.rowCount !== 1 || Object.hasOwn(ack, "title")) {
  throw new Error("POST body " + JSON.stringify(ack));
}
```

## Lesson 06

The form's save path sends `title`, `notes`, and `done` via `todoPatch`. `created_at` is not an update column. The database set it on insert. Sending it would not change the `UPDATE` unless you added it to `fields`, and then you would have to send it every time.

The smoke script's second PATCH omits `notes`. The following read has `notes: null` and `done: true`. The script throws if that is not true:

```js
if (row.notes !== null) throw new Error("expected notes null, got " + JSON.stringify(row));
if (row.done !== true) throw new Error("expected done true");
```

Omitting `title` or `done` is a 400 from the validate stage, not a null write.

## Lesson 09

`VITE_API_BASE` is baked into the static JS when Vite builds. The browser on the CDN origin uses it to find the API. `CORS_ORIGIN` is read by the API process so the browser is allowed to call that other origin. The proxy in `vite.config.ts` exists only for the dev server. It is not in `dist/`.

You need both because they run in different places: one at build time in the front end, one at request time on the API.

## Lesson 10

A valid plan lists one tag, one SSH key, one VPC, database `todo-pg`, droplet `todo-api-01`, one firewall, domain `example.com`, Space `todo-static-example`, certificate `todo-static`, and a CDN custom domain `todo.example.com`. That is 10 resources.

`status` without `DO_TOKEN` does not mean the account is empty. It means the command did not look.

## Lesson 11

A filter that feels right: `Signal` for the mode, `memo` that returns `todos.get().filter(...)`, `bindList` on that memo, and an empty message that distinguishes "no rows at all" from "no rows in this filter". No new route.

A due date that feels right: a nullable or required column, present in the insert and update field lists, sent on every PATCH, rendered as text. If you leave it out of one PATCH, you should be able to predict null or 400 before you reload.

Either way, `bash apps/todo/scripts/smoke.sh` should still print `smoke ok` unless you changed the `notes` contract on purpose.
