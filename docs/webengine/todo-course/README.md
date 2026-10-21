# Create a ToDo App using WebEngine

Build a small full-stack ToDo app by composing the libraries that exist today, then describe how to deploy it with Grapevine.

WebEngine is the name of the stack and of a class that still does not boot an app. This course does not wait for that class. You wire Nectarine, Seltzer, Sig.js, and Juice yourself, and you use one real WebEngine helper: `createNectarineRoutes`.

The running project is the companion app in [`apps/todo`](../../../apps/todo). Every fenced code block in these lessons is copied from that app. If a lesson and a file disagree, the file is what runs.

## The promise

By the end you should be able to:

- model a `todo` table in Nectarine YAML and turn it into CRUD routes
- serve those routes with Seltzer on Postgres
- render the list in the browser with Sig signals and `bindList`
- style the page with Juice attributes
- build the front end with Vite and describe a DigitalOcean deploy with Grapevine
- say, out loud, which parts of that path are still gaps

## Who it is for

You can read TypeScript, HTML, and a JSON response. You do not need prior WebEngine, Juice, or Sig.js experience. You do need a machine that can run Node and Postgres. The last lesson needs a DigitalOcean account only if you choose to apply infrastructure. Validating the config does not.

Sibling courses if you want the deeper pass first:

- [CSS and design systems through Juice](../../juice/course/README.md)
- [HTTP through Seltzer](../../seltzer/http-course/README.md)
- [SQL through Nectarine](../../nectarine/database-course/README.md)

This course is the composition. Those courses are the subjects.

## Prerequisites

- Node.js 22 and Yarn 4 (this repo pins `packageManager` in the root `package.json`)
- Postgres 16 locally, or Docker so you can start `apps/todo/docker-compose.yml`
- A checkout of this repo. The lessons match `apps/todo` on master at `4edae24` (21 Oct 2026) and the commits that add the course
- Optional, for lesson 10 only: a DigitalOcean account and `DO_TOKEN`. Do not apply the sample config until the placeholders are yours

## What you will run

| Piece | Where | What it is |
|---|---|---|
| API | `apps/todo/back` | Seltzer + Nectarine `pg` adapter + `createNectarineRoutes` |
| Browser | `apps/todo/front` | Vite, Sig, Juice |
| Data | Postgres database `todo` | Created from `todoSchema.yml` on boot |
| Deploy file | `apps/todo/grape.config.yaml` | Droplet + managed Postgres + Spaces/CDN. `validate` / `plan` / `status` only, unless you apply |

From the repository root, after Postgres is up:

```bash
yarn workspace @citrusworx/todo-back dev
```

```bash
yarn workspace @citrusworx/todo dev
```

Open `http://127.0.0.1:5173`. The API is `http://127.0.0.1:3001`. Vite proxies `/api` in dev, so the browser does not talk to port 3001 directly.

The finished page is a centered Tide card: near-black page, Inter, one lagoon accent. The header is the name plus the count. Rows are dividers and a Juice `[checkbox]`, not a stack of mint panels. Lesson 07 names the tokens and the few rules `todo.css` adds because Tide cannot say them.

## Library map

Versions are the workspace manifests on this checkout, not a promise about npm.

| Library | Package | Role in this app |
|---|---|---|
| [Nectarine](../../nectarine/README.md) | `@citrusworx/nectarine` 0.5.0 | YAML schema, queries, API. Postgres through `@citrusworx/nectarine/adapters/pg` |
| [WebEngine](../README.md) | `@citrusworx/webengine` 0.2.1 | `createNectarineRoutes` only. The `WebEngine` class lifecycle is still stubs |
| [Seltzer](../../seltzer/README.md) | `@citrusworx/seltzer` 0.9.0 | HTTP server, routing, `ResponseData`. This checkout is 0.9.0 |
| [Sig.js](../../sigjs/README.md) | `@citrusworx/sigjs` 0.7.0 | `jsx()`, `Signal`, `effect`, `bindList`, `mount` |
| [Juice](../../juice/README.md) | `@citrusworx/juiceui` 0.9.2 | Attribute CSS and the `tide` theme |
| [Grapevine](../../grapevine/README.md) | `@citrusworx/grapevine` 0.2.2 | `grape validate`, `grape plan`, `grape status` against a real DigitalOcean config |

The closest product app is `apps/blackwatersound`: a Vite + Sig + Juice front, and a Seltzer + Nectarine + WebEngine API on Postgres via `pg`. The ToDo app is that wiring with one table.

## Honesty box

These are true on this checkout. The lessons work around them or mark them coming soon. They are not fixed in `libraries/` or `engines/`.

1. **PATCH writes null for a column you do not send**, when that key is in the update field list and Seltzer has not already rejected the body. `title` and `done` are `.required`, so omitting them is **400** before SQL runs. `notes` is not required, so a PATCH without `notes` stores SQL `NULL`. The client always sends `title`, `notes`, and `done`.
2. **POST returns `{ ok: true, rowCount: 1 }` with status 200**, not 201 and not the new row. The queries have no `RETURNING`. The client keeps the object it sent, then refetches.
3. **Ids come from the client.** The schema primary key has no default. The browser uses `crypto.randomUUID()`.
4. **Sig has no `<Show>` or `when`.** Empty and edit states flip the `hidden` attribute from an `effect`, or from `hidden={() => ...}`, which is that effect inside the JSX runtime.
5. **Seltzer does not serve static files.** Vite serves the front end in dev and builds `apps/todo/front/dist` for production. The droplet runs the API. The static site is a separate host (Spaces + CDN in the Grapevine file).
6. **`kiwi init`, `kiwi dev`, and `kiwi build` are placeholders.** In `tooling/cli/kiwi/src/main.rs` they print one line and return. Use the Yarn workspace scripts in [`apps/todo/README.md`](../../../apps/todo/README.md).
7. **Juice `[gap]` is numeric.** `gap="1"` and `gap="2"` are real selectors (`1rem`, `2rem`). Names such as `comfortable` exist for padding, not for gap.

More gaps found while building the app:

- **There is no `node:sqlite` adapter** in `libraries/nectarine`. Adapters are `pg`, `mysql2` (MySQL), and `mongodb`. This course does not invent a SQLite path.
- **Sig writes `width` and `style` as DOM properties** when those names are JSX props, so Juice's `[width="100%"]` selector never sees the attribute. Control width lives in `apps/todo/front/src/todo.css`.
- **Tide paints every button as a lagoon gradient**, and that rule lands at the same specificity as `[btn]` after the theme file. `btn="outline"` is not quiet until `todo.css` clears the gradient. The primary action is a flat fill of `--tide-accent`.
- **Author `display` beats `[hidden]`.** `:where([stack])` and `button { display: inline-flex }` keep a node on screen after Sig sets `hidden`. `todo.css` sets `[data-todo] [hidden] { display: none }`.
- **Grapevine apply creates cloud resources. It does not build this repo or upload `dist/`.** `connection_env` is copied onto a droplet only when a `stack` section targets that droplet. This config has no `stack`. `grape status` is an inventory, not a drift diff.
- **Seltzer's default validate stage checks that `.required` keys are present.** The words `string` and `boolean` in a body spec are not type checks.
- **Seltzer `listen` binds `127.0.0.1` unless you pass `host`.** The API passes `"0.0.0.0"` so a droplet can accept traffic.

## Course route

Read in order. Each lesson has a checkpoint you can run.

| Lesson | You add | Library |
|---|---|---|
| [00. Setup](./00-setup.md) | Workspace scripts and Postgres | repo layout |
| [01. Model the data](./01-model.md) | `todo` schema, queries, config | Nectarine |
| [02. Generate CRUD routes](./02-routes.md) | `createNectarineRoutes` | WebEngine |
| [03. Serve the API](./03-seltzer.md) | `listen`, CORS, curl | Seltzer |
| [04. Front-end shell](./04-shell.md) | `jsx()` and `mount` | Sig + Vite |
| [05. Signals and the list](./05-list.md) | `Signal`, `bindList` | Sig |
| [06. Create, toggle, edit, delete](./06-mutations.md) | Whole-todo PATCH, client ids | API client |
| [07. Style with Juice](./07-juice.md) | Attributes, theme, numeric gap | Juice |
| [08. Empty and edit states](./08-conditionals.md) | `effect` and `hidden` | Sig |
| [09. Production build](./09-production.md) | Env, API base URL, static split | Vite + Seltzer |
| [10. Deploy with Grapevine](./10-grapevine.md) | validate, plan, status | Grapevine |
| [11. Capstone](./11-capstone.md) | Filters and due dates, as next work | you |

[Answers](./answers.md) · [Glossary](./glossary.md)

## How to use a lesson

1. **Goal** — what you can do afterward
2. **What you'll build** — the file or behavior this lesson adds
3. **Steps** — the app code, in order
4. **Checkpoint** — a command or a click
5. **What's happening** — which library owns the step
6. **Gap** — when this lesson steps on one of the limits above
7. **Next** — the following lesson only
