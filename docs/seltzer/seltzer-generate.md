# Seltzer Generate Routes

`generateRoutes` maps a flat `ApiOperation[]` list onto object-based Seltzer `Route`s.

Source: `libraries/seltzer/src/generate/**`. Nectarine **does not** generate routes. Hosts flatten YAML with `listApiOperations` / `loadApiOperations`, then call this function. You can also build `ApiOperation[]` by hand — no YAML compiler required.

## `ApiOperation`

```ts
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiOperation = {
  resource: string;
  crud: string;
  name: string;
  method: HttpMethod;
  path: string;
  query?: string;
  body?: Record<string, string>;
  status?: number;
};
```

This is the same shape as `@citrusworx/nectarine/config` `ApiOperation`. YAML layout is `resource → crud → operationName → api: { method, endpoint, query?, body? }`. Nectarine maps `endpoint` to `path`.

`query` on the operation is a **named-query key** passed to `execute` (for example `"productById"`). It is not the HTTP search string. HTTP search is `ctx.query`.

## `generateRoutes(operations, options)`

```ts
type ExecuteArgs = {
  resource: string;
  query?: string;
  params: Record<string, string>;
  body: unknown;
  ctx: RequestContext;
  operation: ApiOperation;
};

type GenerateRoutesOptions = {
  execute: (args: ExecuteArgs) => unknown | Promise<unknown>;
  notFound?: (args: ExecuteArgs) => ResponseData;
  filter?: (operation: ApiOperation) => boolean;
};
```

Each selected operation becomes:

```ts
{
  method,
  path,
  contract: { resource, name, body?, status? },
  handler: async (ctx) => { /* execute → ResponseData */ },
}
```

`filter` runs first. Remaining operations are **sorted** by path rank so `/catalog/:catalog` and `/slug/:slug` register before `:id`. `matchRoute` also prefers specificity, so registration order is belt-and-suspenders.

## What `execute` should return

| Return | HTTP result |
|---|---|
| a payload (object, array, string, …) | `{ body: payload }` at 200, or `operation.status` when set |
| `null` or `undefined` | `notFound(args)` or `{ status: 404, body: { error: "Not found" } }` |
| value from `response({ status?, headers?, body? })` | sent as-is (branded) |

`generateRoutes` does not invent write verbs. POST/PUT/PATCH/DELETE in the operation list become routes. YAML `api.status: 201` (copied by Nectarine `listApiOperations`) is the opt-in created-status; omitting it keeps 200 so existing hosts do not change.

Unbranded `{ status, body }` or `{ body: "copy" }` objects are **payloads**. `execute: () => ({ body: "copy" })` responds with JSON `{ "body": "copy" }`, not the string `"copy"`. Use `response()` when the host needs a transport status other than the default wrap.

Handlers never write `ctx.json`. They read `ctx.params` / `ctx.query` / `ctx.body`, call `execute`, and return `ResponseData`.

## Hand-written operations

```ts
import { Seltzer, generateRoutes, type ApiOperation, type ResponseData } from "@citrusworx/seltzer";

const operations: ApiOperation[] = [
  {
    resource: "product",
    crud: "read",
    name: "allProducts",
    method: "GET",
    path: "/api/products",
    query: "allProducts",
  },
  {
    resource: "product",
    crud: "read",
    name: "productById",
    method: "GET",
    path: "/api/products/:id",
    query: "productById",
  },
  {
    resource: "waitlist",
    crud: "create",
    name: "joinWaitlist",
    method: "POST",
    path: "/api/waitlist",
    query: "joinWaitlist",
    body: { name: "string", email: "string.required" },
  },
];

const app = Seltzer.init();
const products = [
  { id: "stinkrat", name: "StinkRat" },
  { id: "daw", name: "DAW" },
];

for (const route of generateRoutes(operations, {
  execute: ({ query, params, body }) => {
    if (query === "productById") {
      return products.find((item) => item.id === params.id) ?? null;
    }
    if (query === "joinWaitlist") {
      return { ok: true, email: (body as { email?: string }).email };
    }
    return products;
  },
  notFound: (): ResponseData => ({ status: 404, body: { error: "Not found" } }),
})) {
  app.route(route);
}
```

POST `/api/waitlist` without `email` is 400 from default `validate` (`Missing required field: email`) and `execute` does not run.

## Flatten from Nectarine YAML

```ts
import { listApiOperations } from "@citrusworx/nectarine/config";
import { generateRoutes } from "@citrusworx/seltzer";

const operations = listApiOperations("product", product.api).filter(
  (operation) => operation.crud === "read" && operation.method === "GET",
);

const routes = generateRoutes(operations, {
  execute: ({ query, params, ctx }) => {
    if (query === "productById") {
      return ctx.locals.products.find((item) => item.id === params.id) ?? null;
    }
    return ctx.locals.products;
  },
});
```

`listApiOperations` also lives at `@citrusworx/nectarine/api`. `loadApiOperations(resource, apiPath)` loads YAML from disk first.

Do **not** reimplement YAML walking in Seltzer docs or apps. Nectarine owns flatten; Seltzer owns `Route[]`.

WebEngine helpers `createNectarineReadRoutes` / `createNectarineWriteRoutes` / `createNectarineRoutes` call this path. Default compiled writes bind YAML columns, skip `{ fn: now }`, and treat a jsonb-cast column missing from the body as the whole JSON document. Waitlist `joinWaitlist` (generated id / allowlist / duplicate UX) and optional merge-on-PUT still pass a host `execute`. Health and KiwiPress content stay hand-registered.

## Mixing generated and hand-written routes

GET list + GET by-email can be generated while POST stays handwritten (or the reverse). Method + path uniqueness still matters: two `GET /api/waitlist` registrations, first wins on a rank tie.

```ts
for (const route of generateRoutes(waitlistReadOps, { execute: executeWaitlistRead })) {
  app.route(route);
}

app.route({
  method: "POST",
  path: "/api/waitlist",
  contract: { body: { email: "string.required" } },
  handler: async (ctx): Promise<ResponseData> => ({
    status: 201,
    body: { ok: true, email: (ctx.body as { email: string }).email },
  }),
});
```

## What `generateRoutes` is not

- Not a YAML compiler
- Not OpenAPI generation
- Not Express codegen
- Not a database layer — `execute` is host data access (adapter, memory, compiler query)
- Not Zod — default `validate` is `.required` presence; richer checks are `replace("validate", …)`

## Related

- [Integration](./seltzer-integration.md)
- [Pipeline](./seltzer-pipeline.md) — `contract` + `validate`
- [Routing](./seltzer-routing.md) — static-prefix preference
- [Nectarine API](../nectarine/nectarine-api.md) — `listApiOperations`
