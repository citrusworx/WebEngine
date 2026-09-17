# HTTP, understood through Seltzer

Build a small web API, understand what happens to every request, and learn to design the pieces a runtime still needs.

This course assumes you can write JavaScript functions, use objects and arrays, and read an `if` statement. It assumes **no HTTP, server, database, or TypeScript experience**. Each lesson starts with a plain-language explanation, makes it concrete with an experiment, then opens the relevant Seltzer implementation for developers who want to go deeper.

Our running project is a Notes API. A client can create, list, read, edit, and delete notes. Its storage is deliberately an in-memory `Map`: restarting the process loses the notes. This keeps our attention on HTTP before introducing persistence.

## What you will learn

By the end, you should be able to explain an HTTP exchange, build and test a Seltzer API, trace failures through its stages, and propose a runtime feature with a precise contract and useful tests.

Three labels distinguish what you can use from what you can design:

- **Implemented — 0.8.1:** behavior present in the source inspected for this course.
- **Application code:** code we write around existing APIs; it is not a built-in feature.
- **Proposed:** a design exercise, not a callable API, release commitment, or delivery prediction.

The baseline is `libraries/seltzer` **0.8.1**, inspected after local merge `d25673e`. A package version alone does not prove that source and published artifacts are identical. [The source map](./source-map.md) identifies the implementation behind the lessons. Examples use the public package entrypoint.

## Course route

Allow roughly 12–18 hours including experiments. This is a planning estimate. Read in order on your first pass; experienced developers can skim Lessons 1–3 and concentrate on 6–12.

| Lesson | Learn | Produce |
|---|---|---|
| [00. Your workbench](./00-workbench.md) | Processes, modules, promises | A running server |
| [01. HTTP messages](./01-http-messages.md) | URLs, methods, headers, bodies | An annotated exchange |
| [02. Your first server](./02-first-server.md) | Node HTTP and `ResponseData` | Two hello servers |
| [03. Routing](./03-routing.md) | Paths, parameters, queries, ranking | Read and search endpoints |
| [04. Bodies and validation](./04-bodies-validation.md) | Streams, JSON, runtime checks | A validated create operation |
| [05. The Notes API](./05-notes-api.md) | CRUD, state, dependencies | A working API |
| [06. The pipeline](./06-pipeline.md) | Order, early exits, extensions | A traced request |
| [07. The client](./07-client.md) | Fetch, `HttpError`, failures | An API consumer |
| [08. Browser boundaries](./08-browser-boundaries.md) | CORS and identity | A browser experiment |
| [09. Generated routes](./09-generated-routes.md) | Operations and executors | Generated note reads |
| [10. Testing and operations](./10-testing-operations.md) | Regression tests and lifecycle | A tested service |
| [11. Future design](./11-future-design.md) | Limits, cancellation, validation | A feature proposal |
| [12. Capstone](./12-capstone.md) | Independent implementation | An API and design review |

Each lesson has a checkpoint. Try it before reading [the answer guide](./answers.md). Keep [the glossary](./glossary.md) nearby.

## Plain language and developer depth

The plain-language explanations are part of the technical material. Explaining which message failed and where is the foundation of debugging. The developer sections connect that explanation to actual functions and expose rough edges in the implementation.

The [runnable examples](./examples/README.md) include complete JavaScript files, a client, and HTTP tests. They are reference solutions, not snippets that depend on an unexplained variable from another page. The lessons explain how to build toward them.

After Lessons 6–7, the existing [Node exercises](../exercises/README.md) offer extra practice reconstructing shipped internals. Keep those experiments separate from the application and library source. The [existing reference docs](../README.md) remain useful for API lookup.

This course is Markdown-first. Lessons have objectives, experiments, and assessments so they can later be adapted into a course application without changing the technical narrative.
