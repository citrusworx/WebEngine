# Runnable course examples

[Course](../README.md) · [Setup](../00-workbench.md)

These JavaScript modules use the public `@citrusworx/seltzer` entrypoint. They do not modify the library or require a database. Run from the repository root with dependencies installed:

```sh
node docs/seltzer/http-course/examples/hello.mjs
```

Stop that server with Ctrl+C before starting another on port 3000.

| File | Purpose | Run |
|---|---|---|
| `raw-http.mjs` | The Node primitive | `node docs/seltzer/http-course/examples/raw-http.mjs` |
| `hello.mjs` | First Seltzer route | `node docs/seltzer/http-course/examples/hello.mjs` |
| `notes-app.mjs` | App factory; no listener on import | Imported by server and tests |
| `notes-server.mjs` | Notes API and shutdown | `node docs/seltzer/http-course/examples/notes-server.mjs` |
| `notes-client.mjs` | CRUD requests | `node docs/seltzer/http-course/examples/notes-client.mjs` |
| `browser-server.mjs` | Browser client on port 4000 | `node docs/seltzer/http-course/examples/browser-server.mjs` |
| `generated-server.mjs` | Generated app factory | Imported by runner and tests |
| `run-generated.mjs` | Generated read API | `node docs/seltzer/http-course/examples/run-generated.mjs` |
| `course.test.mjs` | HTTP-level verification | Command below |

Run the Notes server before the client. Its output should show a created note, a read, an edit, `Deleted: undefined`, then an intentional 404 from reading the deleted note. IDs vary. The browser lesson needs both the Notes server and browser server.

For generated reads, stop Notes, start `run-generated.mjs`, then request `/notes`, `/notes/intro`, `/notes/stats`, and `/notes/missing`. Expected statuses: 200, 200, 200, 404.

Run all course tests without starting any server yourself:

```sh
node --test docs/seltzer/http-course/examples/course.test.mjs
```

Tests allocate ephemeral ports and close their servers. For the standalone setup, copy all `.mjs` files together and use `node --test course.test.mjs`.

The reference API stores notes only in memory and has no access control. It is for local study, not an internet deployment. There are no pretend future methods in these executable examples; proposed APIs appear only in the design lesson.
