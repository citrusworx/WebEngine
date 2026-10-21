# 11 — Capstone and next steps

[Previous](./10-grapevine.md) · [Course](./README.md)

**Goal:** change the app in one direction you choose, and name which library owns the change. This lesson does not add a second sample app.

## What you'll build

Either a client-side filter or a due date. Do one. Write down the gap you hit, if you hit one. The finished course app does not include the filter or the column. You are extending `apps/todo`, not reading a hidden answer file that already implements them.

## Choice A — filter the list

The array in the `todos` signal is every row. A filter is another signal, for example `"all" | "open" | "done"`, and a derived list.

`memo` is exported from `@citrusworx/sigjs`. It is `{ get() }`, which is a legal `bindList` source. Read both the filter signal and `todos` inside the memo so both subscribe. Point `bindList` at the memo instead of at `todos`.

Keep the empty state honest. "Nothing on the list yet" is the wrong sentence when the user has finished todos and the filter is "open". Read `phase`, the raw length, and the filtered length in the effect in `EmptyState`. Remember lesson 08: a signal you do not read on a run is a signal you will not hear.

Do not rebuild `<App />` when the filter changes. `bindList` already adds and removes rows by id.

This stays in the browser. The API does not need a new query. `done` is already on the row.

## Choice B — due dates

Add a column beside the fields you already have:

```yaml
    id: string PRIMARY KEY
    title: string NOT NULL
    notes: string
    done: boolean NOT NULL DEFAULT false
    created_at: timestamp NOT NULL DEFAULT NOW()
```

A due date belongs in that list, in `todoQueries.yml` insert and update fields, and in `todoAPI.yml` if the client must send it. Then teach the client the lesson 06 rule again: if the column is in the update `fields` list, every PATCH must send it, or the value becomes null (or a 400, if you mark it `.required`).

`applyMigrations` adds a new Postgres column with `ADD COLUMN IF NOT EXISTS` on a later boot. You do not drop the database for an additive column. A rename or a type change needs a versioned migration document. That machinery exists (`@citrusworx/nectarine/migrate`) and this app does not ship a migration file yet. An additive column is the change that matches the boot path you have.

Show the due date with a function child, the same way the row shows `created_at`. Do not invent a date picker component. An `<input type="date">` is enough.

## Checkpoint

Demo the change to yourself:

- Filter: three todos, one done. Switching the filter changes which rows are mounted and does not lose the text you were typing in a row that stayed.
- Due date: create a todo with a date, reload, and see the date come back from `GET /api/todos`. PATCH the title without the date and write down what happened to the column. That note is the gap, not a failure of your demo.

Then answer in a short paragraph: which library owned the change, and which gap from the [hub](./README.md#honesty-box) you stepped on or avoided.

[Answers](./answers.md#lesson-11) sketches one reading of each choice. Your UI can differ.

## What's happening

You are repeating the course at a smaller scale. A filter is Sig. A column is Nectarine, then the same route helper, then the same client rule about whole-todo writes. Juice is only involved if you add a control and need a `gap` or a `row`. Grapevine does not change because the droplet and the Space do not care about a column.

## Where to go next

- [Juice course](../../juice/course/README.md) if the attributes felt like a list to memorize
- [Seltzer HTTP course](../../seltzer/http-course/README.md) if you want the pipeline under `listen`
- [Nectarine database course](../../nectarine/database-course/README.md) if you want the SQL the compiler is emitting
- [Grapevine getting started](../../grapevine/grapevine-getting-started.md) and the blueprint README under `libraries/grapevine/examples/blueprints/` before you apply anything
- [WebEngine reality check](../README.md) if you want to see what the lifecycle class is still waiting to become

## Gap

There is no capstone grader in the repo. The smoke script does not know about your filter or your column. Keep `bash apps/todo/scripts/smoke.sh` green unless you intentionally changed the null-notes behavior. If you mark `notes` required, update the smoke script in the same change and say so. Do not "fix" the null by pretending the PATCH merged your old notes. That bug is still in the route helper.
