# @citrusworx/seltzer

## 0.7.0

### Minor Changes

- Default `validate` stage enforces `.required` keys from `Route.contract.body` (YAML `email: string.required`) on `ctx.body`. Missing or empty → `{ status: 400, body: { error: … } }`. Routes without body specs stay a no-op.
- `generateRoutes` copies `operation.resource`, `operation.name`, and `operation.body` onto `Route.contract` so `ctx.route` after the route stage carries what validate needs.
- New public API: `Seltzer#replace(name, stage)` / `Pipeline#replace` swaps a builtin stage. `before` still inserts immediately before it. Nectarine hangs richer contracts with `replace("validate", …)`.

## 0.6.0

### Minor Changes

- 632d20f: `generateRoutes` maps Nectarine `ApiOperation[]` (from `listApiOperations`) onto object-based `Route`s. Handlers call host `execute` and return `ResponseData` (404 when a read finds nothing). Explicit transport results use `response(...)`. Static-prefix paths win over `:id`. Compatible with the Seltzer 0.5 pipeline.
- 2150bb9: Named HTTP request pipeline (`parse` → `context` → `route` → `validate` → `handle` → `response` → `send`) with `Seltzer#before(name, stage)` for inserting stages. `validate` is a no-op stub. Default listen/handle behavior is unchanged for `init().route().listen()`.
- 12ec2bc: Handlers return ResponseData; the runtime sends the HTTP response. Removed the writing ctx.json helper from RequestContext (breaking).

## 0.6.0

### Minor Changes

- `generateRoutes(operations, { execute })` maps Nectarine `ApiOperation[]` (`listApiOperations`) onto object-based `Route`s that return `ResponseData`. `null`/`undefined` from `execute` becomes 404. Explicit transport results use `response(...)`.
- Generated routes and `matchRoute` prefer static prefixes over `:param` (so `/api/products/catalog/:catalog` wins over `/api/products/:id`). Compatible with the 0.5 named pipeline.

## 0.5.0

### Minor Changes

- Named HTTP request pipeline: `parse` → `context` → `route` → `validate` → `handle` → `response` → `send`.
- New public API: `Seltzer#before(name, stage)` inserts a stage immediately before a named builtin stage. Returning `ResponseData` short-circuits to `send`.
- `validate` is a named no-op stub (reserved for Nectarine).
- Default `init().route().listen()` behavior matches 0.4.0 (params, body, ResponseData, CORS, OPTIONS 204, errors).

## 0.4.0

### Minor Changes

- **Breaking:** Handlers must return `ResponseData` (`{ status?, headers?, body? }` or a Promise of it). The runtime `send`s the HTTP response. Bare objects/strings/arrays are not wrapped — invalid returns are a 500.
- **Breaking:** Removed the writing `ctx.json` helper from `RequestContext`. `req` / `res` remain on ctx for now, but normal responses should not touch `res`.
- Internal 404/400/500 paths use the same `send` path. Object/array bodies default to JSON with status `200` when omitted.

## 0.3.0

### Minor Changes

- Server listen supports parametric routes, JSON body parsing, async handlers, CORS options, and `locals` for app context
- Routes remain object-based via `.route({ method, path, handler })`

## 0.2.0

### Minor Changes

- Updates

## 0.1.0

### Minor Changes

- Added READMEs to each

## 0.0.2

### Patch Changes

- e7a1584: Release preparation
- e7a1584: Standardize library package manifests for independent publishing, align build outputs with published entrypoints, and add Changesets-based release automation for the monorepo.
