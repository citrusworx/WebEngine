# Nectarine API YAML Helpers

`loadNectarineApi` walks Nectarine API documents into a flat `{ method, endpoint }` list. It does **not** register Seltzer routes and it does **not** drive the WordPress client.

Source: `packages/kiwipress/src/nectarine/api.ts`. Tests: `api.test.ts`.

Related: [Seltzer generate routes](../seltzer/seltzer-generate.md), [Nectarine](../nectarine/README.md).

## Why this exists

Nectarine ships nested YAML (`user.get.allUsers.api`). KiwiPress needed a walker before Seltzer grew `listApiOperations` + `generateRoutes`. The walker is still exported and tested. New hosts that already flatten YAML with Nectarine should prefer that path and keep this helper for documents they parse themselves.

## `loadNectarineApi(data)`

Accepts a parsed object (or Nectarine `YAMLdata`).

**Nested** (a resource key whose children look like CRUD operations):

```yaml
user:
  get:
    allUsers:
      api:
        method: GET
        endpoint: /users
    usersByEmail:
      api:
        method: GET
        endpoint: /users/:email
  create:
    user:
      api:
        method: POST
        endpoint: /users
```

becomes:

```ts
[
  { resource: "user", operation: "get", name: "allUsers", method: "GET", endpoint: "/users" },
  { resource: "user", operation: "get", name: "usersByEmail", method: "GET", endpoint: "/users/:email" },
  { resource: "user", operation: "create", name: "user", method: "POST", endpoint: "/users" }
]
```

Recognized operation keys: `get`, `create`, `update`, `delete`, `post`, `put`, `patch`.

If the node *is* the `{ method, endpoint }` (or `{ api: { method, endpoint } }`) without named children, `name` equals `operation`.

**Flat** (no resource layer) uses `resource: "resource"`:

```ts
loadNectarineApi({
  get: { allPosts: { api: { method: "GET", endpoint: "/posts" } } }
});
// [{ resource: "resource", operation: "get", name: "allPosts", method: "GET", endpoint: "/posts" }]
```

Nodes without both `method` and `endpoint` strings are skipped.

## `loadNectarineApiFile(filepath)`

```ts
import { loadNectarineApiFile } from "@citrusworx/kiwipress";

const routes = loadNectarineApiFile("libraries/nectarine/models/user/userAPI.yml");
```

This calls Nectarine `parser.yaml(filepath)`. That parser **`console.log`s the document**. Prefer `loadNectarineApi(object)` in tests.

## What to do with the result

Copy `method` + `endpoint` onto Seltzer `.route` handlers you write, or map into `ApiOperation[]` for `generateRoutes`. KiwiPress does not do that mapping.

The live WordPress client still uses static `routes.ts` files. WordPress query aliases (`?slug=`) are not in Nectarine YAML. Native CMS HTTP, if you want it, is `registerKiwiPressGateway` or your own `ResponseData` routes — not this walker.

## What this is not

- `listApiOperations` (Nectarine)
- `generateRoutes` (Seltzer)
- a schema validator
- a replacement for `Posts` / `Pages` route tables
