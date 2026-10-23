# 06 — Create, toggle, edit, delete

[Previous](./05-list.md) · [Course](./README.md) · [Next](./07-juice.md)

**Goal:** change a todo when POST returns the row, PATCH does not, and a partial PATCH still nulls a column you forgot.

## What you'll build

The database creates the id. The browser sends the whole todo on every update, keeps the POST row, and refetches.

## Steps

### 1. POST returns the row

Inside `submit` in `web/src/TodoForm.tsx`:

```ts
    try {
      const created = await createTodo({ title, notes, done: false });
      // POST returns the row, including the SERIAL id and created_at.
      props.todos.set([created, ...props.todos.get().filter((row) => row.id !== created.id)]);
      form.reset();
      notice.set("");
      props.error.set("");
      props.todos.set(await listTodos());
    } catch (err) {
      notice.set(err instanceof Error ? err.message : "Could not add the todo");
    }
```

The request body is `{ title, notes, done }`. There is no `id`. `createTodo` requires the JSON to be a `Todo`, so `id` is a number and `created_at` is present when the insert's `returning` clause ran. The `set` puts that object on the list. The refetch replaces the array with server rows in `created_at` order. The id matches, so `bindList` keeps the row node.

`done: false` is sent on purpose. A missing key binds SQL `NULL`, and an explicit null does not use `DEFAULT false`. The column is `NOT NULL`. Leaving `done` out would be a 500, not the default.

### 2. PATCH sends every update column

`web/src/api.ts`:

```ts
/** PATCH binds every update column. Send the whole todo, not a diff. */
export function todoPatch(todo: Todo) {
  return {
    title: todo.title,
    notes: todo.notes,
    done: todo.done,
  };
}
```

`updateTodo` JSON.stringifies that object. It does not send `id` in the body. The id is the path. It does not send `created_at`. That column is not in the update field list.

The response is `WriteAck`, not the row. The compiler did not emit `RETURNING` for the update. The client keeps the object it built, then refetches.

Toggle builds a full next todo and passes it through the same function:

```ts
    const current = props.item.get();
    const next: Todo = { ...current, done: !current.done };
```

Save does the same with the input values, still spreading `current` so `done` and `id` survive:

```ts
    const current = props.item.get();
    const next: Todo = {
      ...current,
      title: titleInput.value.trim(),
      notes: notesInput.value.trim(),
    };
```

Empty notes are `""`, a string. That is not SQL `NULL`. The UI will not demonstrate the null gap by itself. The smoke script will.

### 3. Watch the null gap with curl

`scripts/smoke.sh` patches the whole todo, then patches again without `notes`:

```bash
echo "patch whole todo"
curl -sS -X PATCH "$API/api/todos/$ID" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Ship the course","notes":"Write the lessons","done":true}'
echo

echo "patch missing notes"
curl -sS -X PATCH "$API/api/todos/$ID" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Ship the course","done":true}'
echo
```

The second call is 200 and `{ "ok": true, "rowCount": 1 }`. The following GET shows `"notes": null`. The assertion in that script fails the run if `notes` is not null.

Omitting `title` or `done` does not write null. Those keys are `.required`, so Seltzer answers 400 `{ "error": "Missing required field: title" }` or `done`, and the query does not run. The null behavior is for columns in the `UPDATE` field list that validation let through. `notes` is that column.

Delete is `DELETE /api/todos/:id`. The body is the same ack. The client removes the id locally and refetches. Unknown ids are 404 because a zero row count becomes null inside the route host.

## Checkpoint

1. In the browser, add a todo, check it, edit the title, delete it.
2. Run `bash scripts/smoke.sh` and find the GET whose `notes` is `null`.
3. Say which fields the form always sends on save, and why `created_at` and `id` are not in the PATCH body.

[Answers](./answers.md#lesson-06).

## What's happening

The host walks the query's `fields` list and looks up each column on the body. A missing key becomes `null`, and that null is a SQL parameter. The comment on `updateTodo` in the queries file is this rule. The compiler will not omit a column from `SET` because the request forgot it.

Seltzer's validate stage runs first. It only checks `.required` presence. `boolean.required` accepts `false`. It does not accept a missing key.

POST can skip the "keep a copy, hope the id matches" step because `returning` put the row in the body. PATCH still refetches, because the ack has no `created_at` and no `notes`.

## Gap

**PATCH nulls.** Sending the whole todo is the workaround. A future partial update would have to omit columns from the `SET` clause, not bind them as null. The published compiler does not do that.

**PATCH and DELETE acks.** Status 200 and `{ ok, rowCount }` are what this host returns when `rows` is empty and `rowCount` is positive. INSERT avoids that by listing `returning`. UPDATE and DELETE cannot, in 0.5.0.

## Next

[07 — Style with Juice](./07-juice.md)
