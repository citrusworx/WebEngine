# 06 — Create, toggle, edit, delete

[Previous](./05-list.md) · [Course](./README.md) · [Next](./07-juice.md)

**Goal:** change a todo without pretending the API returns the row, generates ids, or merges a partial PATCH.

## What you'll build

The browser creates the id, sends the whole todo on every update, keeps its own copy when POST answers with an ack, and refetches.

## Steps

### 1. The id is created in the browser

Inside `submit` in `apps/todo/front/src/TodoForm.tsx`:

```ts
    const todo: Todo = {
      id: crypto.randomUUID(),
      title,
      notes,
      done: false,
    };
```

`crypto.randomUUID()` needs a secure context. `http://localhost` and `http://127.0.0.1` are secure contexts. A random `file://` page is not. That is why the app is served by Vite.

The API file marks `id` as `string.required` on POST. The schema does not default it. If you omit `id`, Seltzer returns 400. If you send an id the table already has, Postgres rejects the primary key and the request is a 500. Generate a new one per create.

### 2. POST does not give the row back

The same function, after the request:

```ts
      const ack = await createTodo(todo);
      if (ack.rowCount < 1) {
        notice.set("The API did not store a row.");
        return;
      }
      // POST does not return the row. Keep this object, then refetch.
      props.todos.set([todo, ...props.todos.get().filter((row) => row.id !== todo.id)]);
      form.reset();
      notice.set("");
      props.error.set("");
      props.todos.set(await listTodos());
```

`createTodo` posts `{ id, title, notes, done }` and requires the JSON to be a `WriteAck`. The optimistic `set` puts your object on the list immediately. The refetch replaces the array with server rows, including `created_at`. The id matches, so `bindList` keeps the row node.

### 3. PATCH sends every update column

`apps/todo/front/src/api.ts`:

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

Toggle builds a full next todo and passes it through the same function:

```ts
    const current = props.item.get();
    const next: Todo = { ...current, done: !current.done };
```

Save does the same with the input values, still spreading `current` so `done` and `id` survive:

```ts
    const next: Todo = {
      ...current,
      title: titleInput.value.trim(),
      notes: notesInput.value.trim(),
    };
```

Empty notes are `""`, a string. That is not SQL `NULL`. The UI will not demonstrate the null gap by itself. The smoke script will.

### 4. Watch the null gap with curl

`apps/todo/scripts/smoke.sh` patches the whole todo, then patches again without `notes`:

```bash
echo "patch whole todo"
curl -sS -X PATCH "$API/api/todos/$ID" \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Ship the course\",\"notes\":\"Write the lessons\",\"done\":true}"
echo

echo "patch missing notes"
curl -sS -X PATCH "$API/api/todos/$ID" \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Ship the course\",\"done\":true}"
echo
```

The second call is 200 and `{ "ok": true, "rowCount": 1 }`. The following GET shows `"notes": null`. The assertion in that script fails the run if `notes` is not null.

Omitting `title` or `done` does **not** write null. Those keys are `.required`, so Seltzer answers 400 `{ "error": "Missing required field: title" }` or `done`, and the query does not run. The null behavior is for columns in the `UPDATE` field list that validation let through. `notes` is that column.

Delete is `DELETE /api/todos/:id`. The body is the same ack. The client removes the id locally and refetches. Unknown ids are 404 because a zero row count becomes null inside the route helper.

## Checkpoint

1. In the browser, add a todo, check it, edit the title, delete it.
2. Run `bash apps/todo/scripts/smoke.sh` and find the GET whose `notes` is `null`.
3. Say which fields the form always sends on save, and why `created_at` is not one of them.

[Answers](./answers.md#lesson-06).

## What's happening

`writeBindValues` walks the query's `fields` list and looks up each column on the body (`notes` or `note` camel-case). A missing key becomes `null`, and that null is a SQL parameter. The comment on `updateTodo` in the queries file is this rule.

Seltzer's validate stage runs first. It only checks `.required` presence. `boolean.required` accepts `false`. It does not accept a missing key.

The client keeps a copy because the ack is not a row, then refetches because `created_at` and any server-side normalization are not in the ack. Both steps are the workaround. Neither one is a 201.

## Gap

**PATCH nulls.** Sending the whole todo is the workaround, not a fix in the compiler. A future partial update would have to omit columns from the `SET` clause, not bind them as null.

**POST ack.** Status 200 and `{ ok, rowCount }` are what `mutationResult` returns without `RETURNING`. Coming soon would be a 201 and the row. The client code would then be able to stop keeping its own object. It does not today.

**Client ids.** `crypto.randomUUID()` is the workaround for a primary key with no default. A host `execute` could generate the id. This app does not, so the generated route path stays visible.

## Next

[07 — Style with Juice](./07-juice.md)
