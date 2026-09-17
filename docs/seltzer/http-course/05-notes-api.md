# 05 — Build the complete Notes API

[Previous](./04-bodies-validation.md) · [Course](./README.md) · [Next](./06-pipeline.md)

**Goal:** connect routing, validation, state, and response design into one application. Allow 90 minutes.

## Define behavior before handlers

A useful API is a set of promises. What will a successful request do? What happens when an ID is missing? What survives a restart?

Our promises are deliberately small:

| Route | Input | Result |
|---|---|---|
| `GET /health` | None | 200 `{ ok: true }` |
| `GET /notes` | Optional `q` | 200 array, possibly empty |
| `GET /notes/stats` | None | 200 `{ count }` |
| `GET /notes/:id` | Note ID | 200 note or 404 |
| `POST /notes` | JSON text field | 201 note with `Location`, or 400 |
| `PATCH /notes/:id` | JSON text field | 200 note, 400 input error, or 404 |
| `DELETE /notes/:id` | Note ID | 204 with no body, or 404 |

An empty list is a successful read, not a missing resource. A missing individual note is 404. PATCH changes only the supported `text` field; this is a purpose-built JSON update format, not an implementation of JSON Patch.

## Read the reference in three passes

Open [notes-app.mjs](./examples/notes-app.mjs).

First, find `createNotesApp`. Each call creates a fresh `Map` and Seltzer instance. The route functions close over that map: they can read it later because JavaScript preserves the surrounding scope. Separate calls do not share notes.

Second, follow `writeNote`. It validates input, checks existence for an edit, chooses an ID, writes to the map, and builds a response. For creation it returns 201 and a URL identifying the new note. For editing it keeps the existing ID. Input validation happens before the existence check, so invalid input for a missing ID gets 400.

Third, inspect delete. `Map.delete` tells us whether a key existed. We turn that fact into 204 or 404. We do not return a JSON body beside 204.

## Why pass in the ID generator?

`createNotesApp({ makeId })` accepts a dependency: a function used to make IDs. In normal runs it defaults to Node's `randomUUID`. Tests pass a predictable function.

This is dependency injection in ordinary JavaScript. No container or decorator is involved. It lets tests assert the returned `Location` without trying to guess randomness. The injected function must produce unique IDs for creates; the example does not enforce that contract itself.

## Application state and request state

The map lives for the lifetime of this application instance. The context object is created for one request. Confusing those lifetimes can produce bugs: storing one visitor's identity on a shared object can expose it to the next visitor.

Seltzer also supports `listen(port, { locals })`. The supplied object is shared across requests to that listener; it is suitable for dependencies such as a repository or pool. It is not automatically a private per-request session. Our first API uses closures to keep this distinction visible.

## Run the full conversation

Start `notes-server.mjs`, then in another terminal:

```sh
node docs/seltzer/http-course/examples/notes-client.mjs
```

The script creates, reads, edits, deletes, then deliberately tries to read the deleted note. Its final 404 is expected. Visit `/notes/stats` afterward; on a fresh server with no other writes, count is zero.

Restart the server. Any notes you created manually are gone. Moving to a database changes the storage dependency and introduces failure modes; it does not change what an HTTP request is. Lesson 9 separates route descriptions from data execution to prepare for that step.

## Developer view: work that is not implemented here

There is no ownership policy, persistence, list pagination, concurrent-write protection, or request-size bound. Do not silently assume a library supplies them. For example, two edits currently overwrite the same map entry in execution order; there is no version check to reject a stale edit.

## Checkpoint

Add `GET /notes/first` to your copy. Return the earliest inserted note, or a note-specific 404 when empty. Verify that it wins over `/notes/:id`. Explain whether deleting a note also removes the route definition.

[Answers](./answers.md#lesson-05)
