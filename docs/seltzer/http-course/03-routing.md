# 03 — An address becomes a handler

[Previous](./02-first-server.md) · [Course](./README.md) · [Next](./04-bodies-validation.md)

**Goal:** distinguish path parameters from query inputs and predict which route wins. Allow 45–60 minutes.

## Think of a directory, not a folder on disk

An HTTP path is an application address. `/notes/42` does not require a directory named `notes` or a file named `42`. Our program decides that it means “retrieve the note whose ID is 42.”

A route pairs a method and path pattern with a function. Both parts matter: `GET /notes` and `POST /notes` are separate entries.

Start the reference Notes server:

```sh
node docs/seltzer/http-course/examples/notes-server.mjs
```

Request `/notes`. Initially it returns `[]`. Request `/notes/stats`; it returns `{"count":0}`. Request `/notes/unknown`; it returns a note-specific 404.

## Three places to find inputs

For `GET /notes/42?view=compact`, the normalized context contains:

```js
ctx.path      // "/notes/42"
ctx.params.id // "42" after matching /notes/:id
ctx.query.view // "compact"
```

The path is the literal pathname. `:id` is part of the registered pattern, not part of the client's URL. The query can influence a read without changing which route it matches.

All these parameter values are strings. If a route needs an integer, the application must parse and validate it. `Number("banana")` gives `NaN`; a conversion alone is not validation.

In [notes-app.mjs](./examples/notes-app.mjs), the list handler lowercases `ctx.query.q` and matches it against note text. Missing `q` becomes an empty string, which matches every note. This is application search logic, not a Seltzer query language.

## Static paths and parameter paths can overlap

The pattern `/notes/:id` can match the word `stats`. Our app also registers `/notes/stats`. Which wins?

In 0.8.1, Seltzer compares matching route ranks: more static segments first, fewer parameters next, then more segments. Tied ranks use registration order. `/notes/stats` therefore wins even though the reference app registers `/notes/:id` first.

That is a design choice, not a universal framework rule. Read [router.ts](../../../libraries/seltzer/src/pipeline/router.ts) to see `compilePath`, `rankPath`, `matchRoute`, and `paramsFromMatch`.

Compilation turns a parameter segment into a regular-expression capture. Literal segments are escaped, and the expression is anchored to the entire path. After matching, captures are decoded and stored under their parameter names.

## Details that affect real requests

| Request | Current behavior |
|---|---|
| `/notes?q=one&q=two` | `ctx.query.q` is `"two"`; repeated values are overwritten |
| `/notes/` | Distinct from `/notes`; no automatic trailing-slash normalization |
| `PUT /notes` | 404 unless explicitly registered |
| `/notes/hello%20world` | `ctx.params.id` becomes `"hello world"` |
| `/notes/%ZZ` | Parameter decoding throws; the pipeline currently turns that into 500 |

The malformed-encoding case is a candidate for improvement, not a recommended response policy. The course tests pin it so future changes are visible.

## Build it yourself

In a copy of the hello app, add an in-memory `Map` containing one note. Register `GET /notes/:id`. Use `ctx.params.id` to look it up; return either `{ body: note }` or a structured 404. Then add `/notes/stats` after the parameter route and verify that it still wins.

## Checkpoint

Explain why `/notes?q=stats` does not call `/notes/stats`. Predict the result of `/notes?q=red&q=blue`. Finally, distinguish a 404 from “no route matched” and a 404 from “a route matched but the note did not exist.”

[Answers](./answers.md#lesson-03)
