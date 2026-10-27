# Library release gates (before WebEngine kernel)

Standing checklist: what each core library **should be** and **must offer** before we label it ready to release — and before we scaffold a proper WebEngine kernel.

WebEngine owns **sequence**, not capability. Libraries own capability. Until the gates below are green, treat `engines/webengine` as a lifecycle sketch, not a product bootstrap. See [README.md](./README.md), [Make A Web App](./make-a-web-app.md), and [Nectarine <-> kernel contract](./nectarine-kernel-contract.md).

## Rule of thumb

A library is “ready to release” when an outside developer can:

1. Install it from npm (or a published tarball),
2. Follow docs without monorepo tribal knowledge,
3. Ship a thin real surface (page, API, query, or provision),
4. Not discover that a core promise is a silent stub.

**Kernel scaffolding starts when Juice + Sig + Seltzer + Nectarine clear their gates.** Grapevine clears its own infra gate in parallel (optional for kernel v0; required before promising deploy).

## Shared bar (every package)

Nectarine’s own status label is **hostable alpha** at published **0.4.0** ([nectarine-status.md](../nectarine/nectarine-status.md)). These boxes stay open: they apply to every package. Sig’s own record of this list is in section 2. That record does not tick these boxes, and it does not audit Juice or Seltzer.

- [ ] Honest status label in docs (alpha / beta / 0.x) matches the code
- [ ] `package.json` `exports`, README entrypoints, and `dist/` agree
- [ ] Package verify script green (`yarn workspace <pkg> verify` or documented equivalent)
- [ ] Changeset + changelog; no surprise hand-edited versions on publish
- [ ] One golden-path example that runs for a fresh consumer
- [ ] Semver policy written; 0.x breaking changes called out explicitly

---

## 1. Juice — `@citrusworx/juiceui`

**Should be:** CSS-first, attribute-driven styling and composition, shipped themes, and a small set of auto-enhance runtimes (nav / accordion / tabs). Not a large JS component library.

**Observation:** done on master, unpublished versus the live npm cut. The twenty-eight interactive runtimes expose `getState()`, and they publish changes through `juice:change` (native `input` / `change` for select, input, and textarea). Icon button is the twenty-sixth, avatar is the twenty-seventh, and table is the twenty-eighth. None of them is in the published npm 0.9.2 release. Skeleton is CSS-only loading chrome on master, not in that npm cut, and it is not part of this observation contract. List is CSS-only stacked rows on master, not in that npm cut, and it is not part of this observation contract. Badge is CSS-only label chrome. The base layout shipped in npm 0.9.2. Core `--juice-badge-*` roles are on master and are not in that cut. It is not part of this observation contract. Safe area is CSS-only inset chrome on master, not in that npm cut, and it is not part of this observation contract. That contract is DOM. Juice works without Sig. The table is [juice-runtime-behavior.md](../juice/juice-runtime-behavior.md#juicechange).

**Ready when:**

- [ ] Promises in [juice-beta.md](../juice/juice-beta.md) are true and gated by `yarn workspace @citrusworx/juiceui verify`
- [ ] Core areas remain **Stable** per [juice-maturity-matrix.md](../juice/juice-maturity-matrix.md): layout, spacing, color, typography, icons
- [ ] Shipped themes (`aquaflux`, `kiwipress`, `citrusmint`, `tide`, `retro-afterburn`, `retro-arcade-glow`, `retro-boardwalk`, `retro-denim-dial`, `retro-forest-radio`, `retro-orchard-club`, `retro-poolside-pop`, `retro-signal-garden`, `retro-sunset-motel`, `retro-violet-parlor`) install via documented entrypoints; `_draft` themes are never in public `exports` / tarball
- [ ] Navigation, accordion, and tabs auto-enhance are documented and tested; `sideEffects` includes the JS entry so bundlers do not drop auto-start
- [ ] Artifact budgets and runtime/e2e tests pass ([release-checklist.md](../juice/release-checklist.md))
- [ ] Forms, cards, and responsive behavior are labeled **Emerging** with known limits (no fake “complete design system” claim)
- [ ] Theme authoring contract is documented; config-driven branding stays **Draft** until it is a real contract

**Release label:** stay on **Beta** until forms + nav feel settled; **1.0** only if attribute contracts freeze.

---

## 2. Sig — `@citrusworx/sigjs`

**Should be:** a tiny client UI runtime (signals, JSX to real DOM, client router) that Juice composes with. No VDOM requirement; no SSR requirement for release.

**Ready when:**

- [x] `Signal` / `effect` / `batch` / `memo` / `mount` / `disposeTree` are documented and tested (**Stable** per [sig-status.md](../sigjs/sig-status.md); `memo` is `{ get }` only, no public dispose)
- [x] JSX factory + `jsxImportSource` recipes work for Vite and `tsc` from a fresh install
- [x] `SigRouter` supports exact paths, `:param` segments, optional `*`, and dispose-on-navigate; Juice attributes survive `setProp` (`jsx.test.ts`)
- [x] An example under `libraries/sig/examples/` (or a Juice+Sig shell) runs without monorepo-only magic ([counter](../../libraries/sig/examples/counter) pins `@citrusworx/sigjs@^0.7.0` from npm). `npm view @citrusworx/sigjs@^0.7.0 version` lists **0.7.0**, **0.7.1**, and **0.7.2**. A fresh `npm install` of that range resolved **0.7.2**; `tsc --noEmit` and `vite build` exited 0
- [x] Non-goals are explicit in docs: no SSR, no `<For>` / `<Show>` (function children stay text-only; conditionals are `hidden` or `replaceChildren`)
- [x] List story is decided. `bindList` is the keyed helper (array with a key function, or `Map` in iteration order). A kept key reuses its node; `render` gets a per-row getter; row effects dispose with the row and with the list. `replaceChildren` stays the simple non-keyed rewrite. No `<For>` / `<Show>`. See [sig-patterns.md](../sigjs/sig-patterns.md#keyed-todo-list-bindlist) and [sig-roadmap.md](../sigjs/sig-roadmap.md).
- [x] npm `@citrusworx/sigjs@0.7.2` is the current publish (2026-10-27, `gitHead` `c794c06f`, the PR #295 merge). **0.7.0** was published 2026-10-21 (`gitHead` `747f2f71`). **0.7.1** (2026-10-27, `gitHead` `b2f2b287`) is a stale build: its published `dist/juice.d.ts` does not name icon-button, avatar, or table, so it lacks PR #295. **0.7.2** does. Workspace `libraries/sig/package.json` is still **0.7.0**. `libraries/sig/CHANGELOG.md` still opens on **0.7.0** and still says that version is not published and that npm latest is **0.6.0**. **0.6.0** (2026-10-21, `gitHead` `3055fe2e`) remains the unversioned local build; `package.json` never recorded it. `0.4.0` was 2026-10-16. `0.3.0` was 2026-09-18. Further publishes follow [sigjs release-checklist.md](../sigjs/release-checklist.md)
- [x] v1 API surface is frozen per [api-surface.md](../sigjs/api-surface.md): stable names stay, `bindList` and `ListItem` stay experimental, `captureCleanupScope` is not exported, and `jsxDEV` is only on `./jsx-dev-runtime`. `Signal.set` always notifies, including when the value is unchanged, and that is frozen for v1. Public `any` is gone from `jsx`, `jsxDEV`, `Fragment`, `Child`, and `JSX.IntrinsicElements`. `./jsx-runtime` and `./jsx-dev-runtime` export the `JSX` namespace. Guarded by `libraries/sig/src/exports.test.ts` and `libraries/sig/src/jsx-namespace.test.ts`

**Juice hookup:** shipped in `@citrusworx/sigjs@0.4.0`. `@citrusworx/sigjs/juice` exports `bind(host, runtime?)` → `{ state, dispose }`. `JuiceRuntimeName` is twenty-eight names. Write-back is switch, checkbox, disclosure, modal, and icon-button (`pressed`, `[toggle]` hosts only; a refused write snaps the signal back). Avatar and table are read-only. PR #295, in npm **0.7.2** and in `libraries/sig/src/juice.ts` on master, added those three. The three start functions are feature-detected. On Juice builds that do not export `startIconButtonRuntime`, `startAvatarRuntime`, or `startTableRuntime` (published `@citrusworx/juiceui` **0.9.1** and **0.9.2**; those exports are on Juice master only), the module still loads, and binding one of those three throws `needs a newer @citrusworx/juiceui`. The other runtimes still bind. The peer range stays `>=0.9.1 <1`. A bind during Sig render disposes on unmount. The main entry does not import Juice, and Juice does not require this subpath. Guide: [Sig.js + Juice](../sigjs/sig-juice-integration.md#runtime-binding). Proven by `libraries/sig/src/juice.test.ts` (icon-button, avatar, and table seed, infer, dispose, write-back, and read-only) and `libraries/sig/src/juice-legacy.test.ts` (`older Juice still imports the adapter, binds switch, and refuses the three new runtimes`).

**Release label:** **Alpha.** Workspace `libraries/sig/package.json` is **0.7.0**. npm latest is **0.7.2** (2026-10-27). **0.7.0** is published (2026-10-21). It is not an unpublished release candidate. The v1 surface cleanup in 0.7.0 was a minor bump because root exports were removed (`captureCleanupScope`, and `jsxDEV` off `.`). The ready-when list above is checked. `bindList` stays experimental. **1.0** is the publish that ships this surface, not a claim that 1.0 is already on npm. The list story stays `bindList` for keyed rows, `replaceChildren` for a rewrite, and `hidden` / `replaceChildren` for conditionals. Icon-button, avatar, and table `bind` in npm **0.7.2** still need a Juice publish that exports `startIconButtonRuntime`, `startAvatarRuntime`, and `startTableRuntime`. Published `@citrusworx/juiceui@0.9.2` does not.

**Shared bar (Sig only):** the boxes under [Shared bar](#shared-bar-every-package) stay open. That list is for every package. This record is Sig, checked 2026-10-27. It does not tick Juice, Seltzer, Nectarine, or Grapevine.

- Honest status label: **met**. [sig-status.md](../sigjs/sig-status.md) and [docs/sigjs/README.md](../sigjs/README.md) say **Alpha**. That matches pre-1.0 code. Workspace `libraries/sig/package.json` is **0.7.0**. npm latest is **0.7.2** (`npm view @citrusworx/sigjs version`, 2026-10-27). The release label above says the same.
- `exports` / README / `dist`: **met**. `libraries/sig/package.json` `exports` are `.`, `./jsx-runtime`, `./jsx-dev-runtime`, `./sig-router`, and `./juice`, each with `types` and `default` pointing at `dist/*.d.ts` and `dist/*.js`. Those five pairs are on disk. `libraries/sig/src/exports.test.ts` (`package exports and their public names match the v1 snapshot`) is the guard. The README subpath table names the same entries, including the `JSX` namespace on both JSX runtimes and icon-button write-back on `./juice`.
- Package verify: **met**. There is no `verify` script on `@citrusworx/sigjs`. The documented equivalent is `yarn workspace @citrusworx/sigjs build` (`tsc`) and `yarn workspace @citrusworx/sigjs test` (Playwright project `sigjs`). This pass: build exit 0, **101 passed**, including `exports.test.ts`, `jsx-namespace.test.ts` (`jsxImportSource typechecks without importing the package root`), `juice.test.ts`, and `juice-legacy.test.ts` (`older Juice still imports the adapter, binds switch, and refuses the three new runtimes`). `node libraries/sig/scripts/check-no-nested-sigjs.mjs` and `node libraries/sig/scripts/check-foreign-jsx-build.mjs` also exited 0. Those two scripts are what Juice Package CI runs for Sig. That workflow does not run the Sig Playwright project.
- Changeset + changelog, no surprise hand-edited versions: **not met**. `libraries/sig/package.json` is **0.7.0**. `libraries/sig/CHANGELOG.md` still opens on **0.7.0** and still says "Not published. npm latest is **0.6.0**". npm has **0.7.0** (2026-10-21, `gitHead` `747f2f71`), **0.7.1** (2026-10-27, `gitHead` `b2f2b287`; published `dist/juice.d.ts` does not name icon-button, avatar, or table), and **0.7.2** (2026-10-27, `gitHead` `c794c06f`; that `dist/juice.d.ts` names all three). **0.6.0** (`gitHead` `3055fe2e`) was an unversioned local build; the changelog says `package.json` never recorded `0.6.0`. `.changeset/sig-juice-icon-avatar-table.md` is still unconsumed (`"@citrusworx/sigjs": minor`) for work **0.7.2** already published. This pass does not edit `package.json` and does not run `yarn version-packages`. `yarn changeset status --since=origin/master` exits 1 when `libraries/sig` markdown changes and the diff adds no changeset that names the package, so this pass adds `.changeset/sigjs-npm-072-docs.md` (`patch`). That file does not bump the manifest. The version drift above stays open.
- Golden-path example: **met**. `libraries/sig/examples/counter/package.json` pins `@citrusworx/sigjs` to `^0.7.0`. `npm view @citrusworx/sigjs@^0.7.0 version` lists **0.7.0**, **0.7.1**, and **0.7.2**. A copy of that folder, `npm install`, resolved **0.7.2**. `tsc --noEmit` and `vite build` exited 0. The committed `libraries/sig/examples/counter/package-lock.json` does not record `@citrusworx/sigjs`, so `npm ci` there fails (`Missing: @citrusworx/sigjs@0.7.2 from lock file`). That lock was not refreshed in this docs pass.
- Semver policy, 0.x breaking changes called out: **met**. [release-checklist.md](../sigjs/release-checklist.md#semver) states patch, minor, and major, and states that before 1.0 a breaking change ships as a minor. `0.7.0` removed `captureCleanupScope` from the package root and stopped re-exporting `jsxDEV` from `.`. `^0.6.0` does not install it. `libraries/sig/README.md` points at that section.

---

## 3. Seltzer — `@citrusworx/seltzer`

**Should be:** a small Node `http` runtime with object routes, `ResponseData` handlers, and a named pipeline. Nectarine joins via `generateRoutes` / `ApiOperation[]`. Not Express.

**Ready when:**

- [x] `init` / `route` / `listen` / `before` / `replace` match the status matrix (**Stable** core per [seltzer-status.md](../seltzer/seltzer-status.md)). Proven by `libraries/seltzer/src/core/core-api.conformance.test.ts`: `init` returns a fresh app, `route` compiles params and ranks `/items/new` ahead of `/items/:id`, `listen` returns `http.Server` on `127.0.0.1` with default timeouts and a working `close()`, and `before` / `replace` insert or swap stages and throw `Unknown pipeline stage "…"` on an unknown name. Public bind is the `host` option. Leftover `src/core/server/server.ts` is deleted
- [x] Parametric routes, static-prefix ranking, JSON parse + 400, and CORS / OPTIONS are documented and tested. Proven by `libraries/seltzer/src/core/http-surface.conformance.test.ts`: params are `decodeURIComponent` and `/items/new` beats `/items/:id`; `/items/%E0%A4` (and `%ZZ`, `%`, `%80`) is 400 `{ error: "Malformed path parameter" }`, not 500, and the next request still succeeds; a trailing slash is a different path (`/items/42/` is 404); a known path with the wrong method is 405 with `Allow` (registration order, `", "`), and an unknown path stays 404. Invalid `application/json` is 400 `{ error: "Invalid JSON body" }`; an empty body is `undefined`; `null` parses as `null`; non-JSON content types (form bodies, `text/plain`, no special case) are a UTF-8 string, not 415. The default body limit is `DEFAULT_BODY_LIMIT_BYTES` (1_048_576). `bodyLimit` overrides it, `0` is unlimited, and a larger body is 413 `{ error: "Payload Too Large" }` without reading the rest (`Content-Length` is rejected before the first chunk; a running total stops further pulls). CORS is off unless `listen({ cors })` (no CORS headers; `OPTIONS` is routed). A configured preflight is 204 with `Access-Control-Allow-Origin` / `Methods` / `Headers`, `Access-Control-Max-Age` when `maxAge` is set, and `Access-Control-Allow-Credentials` when `credentials` is true. `Vary: Origin` is set when the allow-origin is a specific origin (configured or reflected) and omitted for `origin: "*"`. `credentials: true` with `origin: "*"` throws at `listen`, before bind. `startSeltzerFromKernel` still forwards `cors` (`engines/webengine/src/kernel/modules/seltzer-http.test.ts`)
- [x] Handlers must return `ResponseData`; bare values are 500; no live `ctx.json` write API. Proven by `libraries/seltzer/src/core/response-data.conformance.test.ts`: an invalid handler return (`undefined`, bare object, array, string, or a wrong shape such as non-numeric `status`) is 500 `{ error: "Internal Server Error", message: "Handler must return ResponseData …" }` and one log line names the route (`GET /items/:id (request /items/42)`) plus the returned value. A hook that returns a non-`ResponseData` value is the same 500 and does not run the handler. `{}` is valid `ResponseData` (200, empty body). Strings are `text/plain; charset=utf-8`; objects, arrays, numbers, booleans, and `null` are `application/json`; `Buffer` / `Uint8Array` are raw bytes with `application/octet-stream`, unless `headers` already set `Content-Type` (any casing). Status and the other headers are written as given. 204 and 304 send no body and no content-type derived from a discarded body. HEAD sends no body and still sets `Content-Type` and `Content-Length`. A `before` hook that returns `ResponseData` skips the handler and later hooks, including `before("send")`. A thrown error is 500 `{ error: "Internal Server Error" }` with no message and no stack; the error is logged, and the stack is logged only when `listen({ debug: true })`. `logger` defaults to `console.error` and can be replaced. `ctx.res.writeHead` / `end` / `setHeader` / assignment and calls to `ctx.json` / `ctx.send` throw; the client still gets that generic 500. `replace("send")` throws. The pipeline stays `parse` → `context` → `route` → `validate` → `idempotency` → `handle` → `response` → `send`. Seltzer source does not import WebEngine or Blackwater
- [x] Default `validate` (`.required`) is documented; Zod (or richer) validation is shown as `replace("validate")`. Proven by `libraries/seltzer/src/core/validate.conformance.test.ts` and `libraries/seltzer/src/pipeline/stages.test.ts`. The builtin is not a stub: it reads `ctx.route.contract.body`, treats a spec containing `.required` as presence-only (numbers, booleans, objects, and arrays count; `null`, missing, and blank strings do not; the word `string` is not a type check), and returns 400 `{ error: "Missing required field: …" }` / `{ error: "Missing required fields: …" }` in spec key order, or `{ error: "Request body must be an object" }`. No specs → no-op. It does not read or write `ctx.valid` (normally `undefined`; an earlier hook's value is left in place) and it does not change `ctx.body`. `validationError(issues)` is the replacement 400 `{ error: "Validation failed", issues: [{ path, message }] }` with `path` as `(string | number)[]` (`[]`, `["email"]`, `["items", 0, "qty"]`). A hand-written `safeParse` (`{ success: true, data }` or `{ success: false, error: { issues } }`) exercises that shape; Zod is not installed. Valid input reaches the handler with `ctx.valid` set and `ctx.body` / `ctx.params` / `ctx.query` still raw. Invalid input is that 400 and the handler does not run. A throw is 500 `{ error: "Internal Server Error" }` with no message, logged (`hook "validate"`), stack only when `debug: true`. A non-`ResponseData` return is 500 with the ResponseData message and a log line. `Route` and `generateRoutes` have no schema field (`contract.body` stays YAML strings); the replacement dispatches on `` `${method} ${path}` `` or `contract.name`, and a route with no schema continues even when `.required` would have failed. `generateRoutes` without a replacement still applies `.required` and leaves `ctx.valid` unset. Pipeline order stays `parse` → `context` → `route` → `validate` → `idempotency` → `handle` → `response` → `send`. Seltzer source does not import WebEngine, Blackwater, or Zod, and `package.json` has no `zod` and no `dependencies`
- [x] `generateRoutes` + Nectarine `listApiOperations` is a published recipe with a test. Proven by `libraries/seltzer/src/generate/generate-routes.conformance.test.ts` (hand-written `ApiOperation[]`; Seltzer source and package.json do not import or depend on Nectarine) and `engines/webengine/src/kernel/modules/generate-routes.recipe.test.ts` (fixture `engines/webengine/src/__fixtures__/generate-routes/productAPI.yml` → `loadYaml` → `listApiOperations` → `generateRoutes` → `listen` on `127.0.0.1` with an ephemeral port → real HTTP). `ApiOperation` is exported from Seltzer. Nectarine's operation is the same structure: `engines/webengine/src/kernel/modules/api-operation-assignability.ts` assigns `listApiOperations` results to Seltzer's type and fails `tsc` if either side gains or drops a field. There is no runtime import either direction. The recipe in [seltzer-generate.md](../seltzer/seltzer-generate.md#recipe-yaml-to-listen) and the Seltzer README shows handler binding (`handlers[name]`, catch-all `execute`), HTTP status (`response({ status: 201 })` for a JSONB-shaped create; a bare payload is 200; 204 for delete), and `replace("validate")` via `validationError` (that replacement turns `.required` off). HTTP coverage: catalog/id reads, JSONB-shaped product create/update/delete, unknown path 404 `{ error: "Not Found" }`, wrong method 405 with `Allow` (`GET, POST` on `/api/products`, `GET, PUT, DELETE` on `/api/products/:id`), `.required` 400 `{ error: "Missing required field: name" }` and the handler does not run, unbound generation throws `UnboundOperationsError` listing every `name method path`, and `unbound: "notImplemented"` is 501 `{ error: "Not Implemented" }`. A `.required` failure is still 400 before that 501. Pipeline order stays `parse` → `context` → `route` → `validate` → `idempotency` → `handle` → `response` → `send`. `execute` still binds every selected operation, so Blackwater, MiaMakes, KiwiPress, `createNectarineRoutes`, and `startSeltzerFromKernel` did not need the 501 opt-in (`exclude` / `filter` still omit operations before the check). No package gained a dependency
- [x] Outbound `client.*` is hardened (URL join, timeout/abort). Proven by `libraries/seltzer/src/core/client/client.conformance.test.ts` against `node:http` on `127.0.0.1` with an ephemeral port: boundary slashes collapse and a base path is kept (`/api/v1` + `users` → `/api/v1/users`, trailing slash on the relative path stays, `%2F` is not rewritten); base and path queries are preserved and `options.query` is encoded (`null` / `undefined` omitted, arrays repeat the key, `0` / `false` / `""` sent, a nested object throws before any request). An absolute `path` throws `UrlError` (`INVALID_URL`) and sends nothing unless `allowAbsoluteUrl` is set, which then ignores `baseUrl`; `ftp:` and protocol-relative URLs still throw. The default timer is `DEFAULT_CLIENT_TIMEOUT_MS` (30000), equal to `DEFAULT_REQUEST_TIMEOUT_MS`. `createClient({ timeout })` and per-call `options.timeout` override it, and `0` does not arm the 30s timer. Header delay and body delay both throw `TimeoutError` (`TIMEOUT`). A caller `AbortSignal` throws `AbortError` (`ABORTED`) and wins over the deadline, including a signal that is already aborted (no request). `AbortSignal.any` is used when present; the same abort and timeout results hold when it is missing (Node 18 combine). Timers are cleared after success, timeout, and abort (`_getActiveHandles` Timeout count returns to baseline, and aborting the signal after success does not throw). Non-2xx throws `HttpError` (`HTTP_ERROR`) with `status`, lowercase `headers`, and a parsed body (`+json` object, `text/*` string, `application/octet-stream` `Uint8Array`; invalid JSON on an error status keeps the raw string). Success parsing matches: JSON / `+json` object, `text/*` string, other types `Uint8Array`, missing Content-Type sniffs JSON then string, `204` / `205` / `HEAD` are `undefined`, and successful invalid JSON is `SyntaxError`. Request bodies: object JSON, string `text/plain; charset=utf-8`, `Uint8Array` bytes, caller `Content-Type` wins, `Idempotency-Key` is forwarded. A 503, a timeout, and `ECONNREFUSED` (`NetworkError`, `NETWORK`) are each one attempt. `package.json` has no `dependencies`, no `peerDependencies`, and `engines.node` `>=18`. Non-test Seltzer source does not import or mention `undici`. The client does not retry and does not implement idempotency storage. Matrix value is **Emerging** in [seltzer-status.md](../seltzer/seltzer-status.md): this conformance file covers join, query encoding, the deadline, abort, error classes, and a single attempt, and it does not cover every sentence of [seltzer-client.md](../seltzer/seltzer-client.md) (ignored `endpoint`, `FormData` rejection, `Buffer` bodies, the error snippet). The result type is still `unknown`
- [x] Non-goals are explicit in the package [README](../../libraries/seltzer/README.md#non-goals) and linked from the maturity matrix ([seltzer-status.md](../seltzer/seltzer-status.md)). Hard non-goals: no `app.use` (the extension model is `parse` → `context` → `route` → `validate` → `idempotency` → `handle` → `response` → `send` with `before` / `replace`); no built-in HTTPS `listen` (terminate TLS at a proxy, or mount `https.createServer(tlsOptions, app.handler())`; `listen` always calls `http.createServer`; `handleRequest` stays private); no form or multipart parsing (non-JSON bodies stay a UTF-8 string; `application/x-www-form-urlencoded` is a host `URLSearchParams` recipe in [seltzer-request-response.md](../seltzer/seltzer-request-response.md#form-urlencoded), proven by `libraries/seltzer/src/core/form-urlencoded.recipe.test.ts` against `listen` on `127.0.0.1`; multipart and other binary inbound bytes are out of scope); no templating, sessions, cookies, or static files (host app, or Juice / Sig for the browser); no client retries (the caller owns retry policy; a server-side idempotency stage is planned and not shipped); no ORM (Nectarine plus the host). Streaming responses and WebSockets are **Not yet**, not a refusal. Zero runtime dependencies is the stance: `package.json` has no `dependencies`. Docs that called HTTPS listen, `app.use`, or form bodies Draft or "still open", and KiwiPress docs that said the gateway calls `ctx.json`, were updated to match `ResponseData` and these non-goals
- [x] Docs on the default branch match the shipped version (no obsolete 0.2 essays describing current APIs). npm `@citrusworx/seltzer@0.9.0` (2026-10-21) was that HTTP-core cut: README, `dist`, and `package.json`, no dependencies, no `undici`, Non-goals present, `handleRequest` still private on that tarball. `libraries/seltzer/src/docs-drift.test.ts` fails if the README install snippet disagrees with `package.json` or if a name in the README public-name table is missing from the public source. [make-a-web-app.md](./make-a-web-app.md) describes the shipped runtime. `CHANGELOG.md` is listed in `package.json` `files`. npm `@citrusworx/seltzer@0.10.0` (2026-10-21) is the current publish, and the workspace manifest matches it. 0.10.0 adds no-arg `app.handler()` (Stable) and `app.adapter(config)` for the options stash (Emerging). `handler(config)` is a deprecated alias of `adapter(config)` (one process warning, code `SELTZER_DEP_HANDLER_CONFIG`), removed in the next minor after 0.10.0. `handleRequest` stays private. The published 0.9.0 matrix row for a public listener was **Not yet**

**Release label:** **0.10.0** is published (2026-10-21). **0.9.0** remains the HTTP-core cut: listen defaults, timeouts, and `generateRoutes` are covered by conformance tests. 0.10.0 adds no-arg `app.handler()` and `app.adapter(config)` (`handler.conformance.test.ts`). `handler(config)` is a deprecated alias, removed in the next minor after 0.10.0. **1.0** still waits on matrix rows that stay Emerging or Draft. The client stays Emerging. `handleRequest` stays private.

---

## 4. Nectarine — `@citrusworx/nectarine`

**Should be:** YAML config + phonics compiler + DB adapters + migrator. App/kernel code never embeds SQL. Nectarine does **not** listen on HTTP.

**Ready when:** (see [production.md](../nectarine/production.md), [release-checklist.md](../nectarine/release-checklist.md), [nectarine-kernel-contract.md](./nectarine-kernel-contract.md))

- [x] `loadNectarineConfig` is the only Nectarine bootstrap: YAML names env **keys**; secrets stay in the environment (`libraries/nectarine/src/config/loadConfig.ts`, `NectarineConfig.resolveCredentials` / `requireCredentials`, `loadConfig.test.ts`). Incomplete env returns null. Partial env is a boot error in the kernel module and in Blackwater (`engines/webengine/src/kernel/modules/nectarine-module.ts`, `apps/blackwatersound/back/src/context.ts`)
- [x] Named DML from `*Queries.yml` and DDL from `*Schema.yml` go through the compiler. Postgres and MySQL adapters only `query(sql, params)` (`compiler/sql.ts`, `compiler/ddl.ts`, `compiler/no-hardcoded-sql.test.ts`, `adapters/pg/pgz.ts`, `adapters/ms/msqlz.ts`). MongoDB is collection helpers (`adapters/mg/mgz.ts`), not a SQL compiler
- [x] `applyMigrations` ledger + versioned phonics migrations; destructive ops require `destructive` + `confirm` (`src/migrate/runner.ts`, `src/compiler/migration.ts`, `runner.test.ts`, `migration.test.ts`). Forward-only — no down migrations
- [x] Postgres path uses a `pg.Pool` with connect checkout, idle-client errors, and `disconnect` (`adapters/pg/pgz.ts`). Partial vendor env fails boot (kernel + Blackwater, above). MySQL and MongoDB are peer subpath exports (`package.json` `exports`), not loaded from the package root
- [x] `listApiOperations` is exported for Seltzer / WebEngine (`src/config/api.ts`, engine `createNectarineRoutes`). Adapters are **not** loaded from the package root (`src/index.ts`, `src/package-exports.test.ts`)
- [ ] `yarn verify:nectarine` (typecheck, build, tests, pack dry-run) is green **on master CI**. Local run on this honesty branch: exit 0, 197 tests passed, pack dry-run of `@citrusworx/nectarine@0.4.0`. The only `Nectarine Package` run on `master` (2026-09-15, run 35019588809, commit `da3d9ce7`) failed at `yarn install --immutable` before verify. Later green runs were on `cursor/blackwater-phase0-backend`, not `master`. This box stays open until a master workflow run is green
- [x] Showcase dry-run compiles the named-query path (`libraries/nectarine/examples/showcase.ts`; `yarn workspace @citrusworx/nectarine example` printed user CRUD SQL, exit 0). Live mode is `SELECT 1` and was not run. Blackwater is the host reference (`apps/blackwatersound/back/src/db/postgres.ts`, `named-ddl.ts`). Compiler fixtures for that YAML passed inside the nectarine suite (`compiler.blackwater.test.ts`, `compiler.blackwater.ddl.test.ts`). This box does not claim the Blackwater app’s own Vitest suite or a separate host CI job
- [x] Status docs do not oversell. Label is **hostable alpha** at published **0.4.0** ([nectarine-status.md](../nectarine/nectarine-status.md)), not “early alpha” / 0.0.1. CREATE, `applyMigrations`, named query, and credential boot exist. Joins, `GROUP BY`, `LIMIT`, GraphQL, and Zod-on-the-hosted-path do not. INSERT `onConflict` is in git and not in the npm 0.4.0 tarball (next publish 0.5.0)

**Release label:** **0.4+ hostable alpha** for kernel work; **1.0** after migrations + a non-Blackwater consumer.

---

## 5. Grapevine — `@citrusworx/grapevine`

**Should be:** DigitalOcean provisioning library + `grape` CLI. Not multi-cloud theater. Not the app HTTP server.

**Ready when:** (see [grapevine-roadmap.md](../grapevine/grapevine-roadmap.md))

- [ ] Schema `provider` is DigitalOcean-only; other clouds are rejected
- [ ] `grape validate` / `plan` / `apply` / `destroy` / `status` / `init` match the README; dry-run does not bill by accident
- [ ] Apply order and same-apply name maps are documented; create vs update / idempotency gaps are labeled honestly
- [ ] Blueprint examples (`01`–`04`) smoke in a real or recorded fixture path
- [ ] Schema fields that do not provision are marked **not implemented** (no fake product surface)
- [ ] Generated private keys never print key material (paths only)
- [ ] `kiwi --grape` is documented as shell-out to `grape` when present on `PATH`

**Release label:** **0.3+ DO provisioner**; multi-cloud out of scope until a second `providers/` adapter exists.

---

## Kernel gate (start proper WebEngine scaffolding)

Start kernel scaffolding only when **all** of the following are true:

1. **Juice + Sig** — a multi-route Juice shell can be built without weekly API thrash
2. **Seltzer + Nectarine** - config -> migrate -> `generateRoutes` -> `listen` is a copy-pasteable host recipe
3. **Kernel contract** — [nectarine-kernel-contract.md](./nectarine-kernel-contract.md) remains the only blessed join (no second YAML bootstrap, no Express, no SQL in host wrappers)
4. **Types** — `Blueprint` / `Environment` / `DeploymentManifest` match what kernel methods will actually accept
5. **Grapevine** — optional for kernel v0 (`buildEnvironment` may stub); required before promising `deployApplication`

### Kernel v0 scope (honest)

- Module registry + Nectarine handle + start Seltzer from kernel (as sketched in the contract)
- Lifecycle methods that call real library entrypoints **or** throw “not implemented” — no silent success stubs
- Do not treat compiled leftovers under `dist/kernel/` / fictional `kiwi.config.toml` loaders as public API unless they exist in current `src/`

### Kernel v0 non-goals

Full PaaS, multi-cloud, CMS, auto SSL — those stay in libraries (Grapevine, DNS, KiwiPress, etc.).

---

## Suggested sequencing

1. Freeze the **Seltzer <-> Nectarine** join (largest kernel dependency)
2. Land a **Juice + Sig** shell golden path
3. Grapevine apply/destroy smoke (parallel is fine)
4. Scaffold WebEngine kernel against the contract

## Related docs

- [WebEngine README (reality check)](./README.md)
- [Make A Web App](./make-a-web-app.md)
- [Nectarine <-> kernel contract](./nectarine-kernel-contract.md)
- [Juice release checklist](../juice/release-checklist.md)
- [Nectarine release checklist](../nectarine/release-checklist.md)
