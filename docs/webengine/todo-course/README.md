# Create a ToDo App using WebEngine

Build a small full-stack ToDo app from an empty folder. You install the published packages, then wire Nectarine, Seltzer, Sig.js, and Juice yourself.

WebEngine is the name of the stack and of a class. `@citrusworx/webengine` 0.2.1 exports that class and nothing else. `init`, `buildApplication`, and `deployApplication` do not boot this app. This course does not call them. The host turns Nectarine YAML into Seltzer routes with `listApiOperations`, `CCompiler`, and `generateRoutes`.

The running project is [`examples/todo-app`](../../../examples/todo-app). Every fenced code block in these lessons is copied from that folder. If a lesson and a file disagree, the file is what runs. You can also type the same files into a directory you created with `npm init`. The layout is the same either way.

## The promise

By the end you should be able to:

- model a `todo` table in Nectarine YAML and turn it into CRUD routes
- serve those routes with Seltzer on Postgres
- render the list in the browser with Sig signals and `bindList`
- style the page with Juice attributes and the Tide theme
- build the front end with Vite
- validate a DigitalOcean droplet plus an App Platform static site with the published `grape` CLI
- say which parts of that path the published packages still do not do

## Who it is for

You can read TypeScript, HTML, and a JSON response. You do not need prior WebEngine, Juice, or Sig.js experience. You do need a machine that can run Node and Postgres. The last lesson needs a DigitalOcean account only if you choose to apply infrastructure. Validating the config does not.

Sibling courses if you want the deeper pass first:

- [CSS and design systems through Juice](../../juice/course/README.md)
- [HTTP through Seltzer](../../seltzer/http-course/README.md)
- [SQL through Nectarine](../../nectarine/database-course/README.md)

This course is the composition. Those courses are the subjects.

## Prerequisites

- Node.js 22. The packages declare `node >= 18`. This course was checked on Node 22
- npm. The app is one package. It is not a Yarn workspace
- Postgres 16 locally, or Docker so you can start `docker-compose.yml` in the app folder
- Optional, for lesson 10 only: a DigitalOcean account and `DO_TOKEN`. Do not apply the sample config until the placeholders are yours

You do not need a checkout of this repository to build the app. The checkout is one place the finished files already live.

## Published packages

Versions below are what `examples/todo-app/package.json` installs from the npm registry. The other packages are exact pins. `@citrusworx/sigjs` is `^1.0.0`, the stable 1.0 line (`>=1.0.0 <2.0.0`). A clean install resolves **1.0.0**. That release is the **0.7.2** API.

| Package | Version | Role in this app |
|---|---|---|
| `@citrusworx/nectarine` | 0.5.0 | YAML schema, queries, API. Postgres through `@citrusworx/nectarine/adapters/pg`. `pg` is a peer, so the app depends on it directly |
| `@citrusworx/webengine` | 0.2.1 | The `WebEngine` class only. It does not register routes |
| `@citrusworx/seltzer` | 0.10.1 | HTTP server, routing, `ResponseData`, `generateRoutes` |
| `@citrusworx/sigjs` | ^1.0.0 | `jsx()`, `Signal`, `effect`, `memo`, `bindList`, `mount` |
| `@citrusworx/juiceui` | 0.9.2 | Attribute CSS and the Tide theme (`@citrusworx/juiceui/styles/themes/tide`) |
| `@citrusworx/grapevine` | 0.2.2 | DigitalOcean config. The CLI file is `dist/bin/cli.js` |
| `pg` | 8.23.0 | Driver the Nectarine Postgres adapter imports |

Dev dependencies, also pinned: `vite` 8.0.8, `typescript` 5.9.3, `tsx` 4.22.3, `@types/node` 25.6.0, `@types/pg` 8.23.1.

These published packages were inspected and this app does not import them:

| Package | Version | Why it stays out |
|---|---|---|
| `@citrusworx/types` | 0.2.0 | Contracts for the `WebEngine` class. It arrives transitively. The app does not construct a blueprint |
| `@citrusworx/dns` | 0.1.0 | Registrar client. This course does not buy a domain |
| `@citrusworx/stenzil` | 0.1.0 | A separate compiler. The pages are Sig and Juice |
| `@citrusworx/sugar` | 0.2.1 | No `exports` map. Not a runtime for this app |
| `@citrusworx/kiwipress` | 0.4.3 | A CMS library. Its `package.json` has no `bin` |

## What you will run

One package, two folders.

| Piece | Where | What it is |
|---|---|---|
| API | `api/` | Seltzer + Nectarine `pg` adapter. Routes from `listApiOperations` and `generateRoutes` |
| Browser | `web/` | Vite, Sig, Juice Tide |
| Data | Postgres database `todo` | Created from `todoSchema.yml` on boot |
| Deploy file | `grape.config.yaml` | Droplet + App Platform static site. `validate` / `plan` / `status` only, unless you apply |

From the app folder, after Postgres is up:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

Open `http://127.0.0.1:5173`. The API is `http://127.0.0.1:3001`. Vite proxies `/api` in dev, so the browser does not talk to port 3001 directly.

The finished page is a centered Tide card: near-black page, Inter, one lagoon accent. The header is the name plus the count. Rows are dividers and a Juice `[checkbox]`. Lesson 07 names the tokens and the few rules `todo.css` adds because Tide cannot say them.

## Honesty box

Checked against the published tarballs above. Lessons work around these or mark them coming soon.

1. **PATCH writes null for a column you do not send**, when that key is in the update field list and Seltzer has not already rejected the body. The compiler emits `SET` for every field. The host binds a missing key as `null`. `title` and `done` are `.required`, so omitting them is **400** before SQL runs. `notes` is not required, so a PATCH without `notes` stores SQL `NULL`. The client always sends `title`, `notes`, and `done`. An explicit `null` on INSERT also skips the column `DEFAULT`, which is why create sends `done: false`.
2. **UPDATE and DELETE ignore `returning`.** `@citrusworx/nectarine` 0.5.0 compiles `returning` on INSERT only. A PATCH or DELETE with rows affected comes back as `{ ok: true, rowCount: 1 }` at status 200, because the host shapes `pg`'s `rowCount` and `generateRoutes` wraps a payload as `{ body }` at 200. POST is different: the insert lists `returning: '*'` and the response is the saved row, still at 200. `response({ status: 201, body })` exists in Seltzer. This app does not call it.
3. **Sig has no `<Show>` or `when`.** Empty and edit states flip the `hidden` attribute from an `effect`, or from `hidden={() => ...}`.
4. **Seltzer does not serve static files.** Nothing in the 0.10.1 package reads a directory. Vite serves the front end in dev and builds `web/dist` for production. The droplet runs the API. The static site is a separate App Platform app.
5. **There is no kiwi CLI in the packages this course installs.** `@citrusworx/kiwipress` 0.4.3 has no `bin`. npm scripts start and build the app. `grape` is the CLI that ships, and it manages DigitalOcean resources.
6. **Juice `[gap]` is numeric.** `gap="1"` and `gap="2"` are real selectors (`1rem`, `2rem`). Names such as `comfortable` exist for padding, not for gap.
7. **`@citrusworx/webengine` 0.2.1 exports `WebEngine` only.** `createNectarineRoutes` is not in the package. Lesson 02 is the host code that used to live in that helper.
8. **The `grape` bin npm links is silent.** `dist/bin/cli.js` runs only when `import.meta.url` is the same path as `process.argv[1]`. npm's `.bin/grape` symlink fails that check, prints nothing, and exits 0. The npm scripts call `node ./node_modules/@citrusworx/grapevine/dist/bin/cli.js` instead.
9. **Grapevine 0.2.2 has no Spaces, no certificate resource, no CDN endpoint, and no `resources.databases`.** Those keys are stripped. `grape validate` still says valid and counts only the keys it knows. `networking.cdn: true` is accepted and not applied. There is no `stack` and no `connection_env`. The static site in this file is `resources.apps[].spec.static_sites`, which apply forwards to App Platform. Apply does not upload `web/dist` and does not install Node on the droplet. The inner App Platform keys are not checked by the Zod schema.

More limits found while building the app:

- **There is no `node:sqlite` adapter.** Published adapters are `@citrusworx/nectarine/adapters/pg`, `./adapters/ms` (MySQL), and `./adapters/mg` (MongoDB). This course uses Postgres.
- **A string primary key cannot default to `gen_random_uuid()`.** The schema compiler rejects that default. `integer PRIMARY KEY AUTO_INCREMENT` compiles to `SERIAL` on Postgres, so this app does not mint ids in the browser.
- **Path parameters arrive as strings.** `WHERE id = $1` against a `SERIAL` column errors if the bind is text (`integer = text`). The host passes an all-digit segment as a number.
- **Sig writes `width` and `style` as DOM properties** when those names are JSX props, so Juice's `[width="100%"]` selector never sees the attribute. Control width lives in `web/src/todo.css`.
- **Tide paints every button as a lagoon gradient**, and that rule lands at the same specificity as `[btn]` after the theme file. `btn="outline"` is not quiet until `todo.css` clears the gradient. The primary action is a flat fill of `--tide-accent`.
- **Author `display` beats `[hidden]`.** `:where([stack])` and `button { display: inline-flex }` keep a node on screen after Sig sets `hidden`. `todo.css` sets `[data-todo] [hidden] { display: none }`.
- **Seltzer's default validate stage checks that `.required` keys are present.** The words `string` and `boolean` in a body spec are not type checks. `false` counts as present. A blank string does not.
- **Seltzer `listen` binds `127.0.0.1` unless you pass `host`.** The API passes `"0.0.0.0"` so a droplet can accept traffic.

## Course route

Read in order. Each lesson has a checkpoint you can run.

| Lesson | You add | Library |
|---|---|---|
| [00. Setup](./00-setup.md) | npm package and Postgres | published packages |
| [01. Model the data](./01-model.md) | `todo` schema, queries, config | Nectarine |
| [02. Generate CRUD routes](./02-routes.md) | `listApiOperations` and `generateRoutes` | Nectarine + Seltzer |
| [03. Serve the API](./03-seltzer.md) | `listen`, CORS, curl | Seltzer |
| [04. Front-end shell](./04-shell.md) | `jsx()` and `mount` | Sig + Vite |
| [05. Signals and the list](./05-list.md) | `Signal`, `bindList` | Sig |
| [06. Create, toggle, edit, delete](./06-mutations.md) | SERIAL ids, whole-todo PATCH | API client |
| [07. Style with Juice](./07-juice.md) | Attributes, Tide, numeric gap | Juice |
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
