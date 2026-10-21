# Seltzer Generate Routes

`generateRoutes` maps a flat `ApiOperation[]` list onto object-based Seltzer `Route`s.

Source: `libraries/seltzer/src/generate/**`. Nectarine **does not** generate routes, and Seltzer **does not** import Nectarine. Hosts flatten YAML with `listApiOperations` / `loadApiOperations`, then call this function. You can also build `ApiOperation[]` by hand — no YAML compiler required.

The copy-paste host recipe is [YAML to listen](#recipe-yaml-to-listen).

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
};
```

This is the same shape as `@citrusworx/nectarine/config` `ApiOperation`. `listApiOperations` returns values that are structurally assignable to this type. WebEngine checks that assignment (`engines/webengine/src/kernel/modules/api-operation-assignability.ts`). There is no runtime dependency in either direction.

YAML layout is `resource → crud → operationName → api: { method, endpoint, query?, body? }`. Nectarine maps `endpoint` to `path`. HTTP status is not a YAML field. A payload from the handler is **200**. A different status is `response({ status, body })` — see [HTTP status](#http-status).

`query` on the operation is a **named-query key** passed to the handler (for example `"productById"`). It is not the HTTP search string. HTTP search is `ctx.query`.

## `generateRoutes(operations, options)`

```ts
type OperationHandler = (args: ExecuteArgs) => unknown | Promise<unknown>;

type ExecuteArgs = {
  resource: string;
  query?: string;
  params: Record<string, string>;
  body: unknown;
  ctx: RequestContext;
  operation: ApiOperation;
};

type GenerateRoutesOptions = {
  execute?: OperationHandler;
  handlers?: Readonly<Record<string, OperationHandler>>;
  unbound?: "throw" | "notImplemented";
  notFound?: (args: ExecuteArgs) => ResponseData;
  filter?: (operation: ApiOperation) => boolean;
};
```

`filter` runs first. A filtered-out operation is omitted. It is not unbound and it is not listed in the startup error. Remaining operations are **sorted** by path rank so `/catalog/:catalog` and `/slug/:slug` register before `:id`. `matchRoute` also prefers specificity, so registration order is belt-and-suspenders.

Each selected operation becomes:

```ts
{
  method,
  path,
  contract: { resource, name, body? },
  handler: async (ctx) => { /* binding → ResponseData */ },
}
```

## Handler binding

An operation is **bound** when `handlers[operation.name]` is a function, or when that name is missing and `execute` is set. A named handler wins over `execute`.

| Binding | Covers |
|---|---|
| `handlers: { allProducts, productById }` | those names only |
| `execute` | every selected name that `handlers` does not set |
| both | named handlers win; `execute` binds the rest |

The key is `ApiOperation.name` (`allProducts`, `joinWaitlist`). Two selected operations that share a name share one handler. When names collide across resources, use `execute` and switch on `args.operation.resource`.

`execute` is what Blackwater, MiaMakes, and WebEngine `createNectarineRoutes` / `startSeltzerFromKernel` pass. That catch-all binds every selected operation, so those hosts do not throw and do not pass `unbound`. KiwiPress does not call `generateRoutes`. `exclude` / `filter` on the engine helper drops operations before this check (lesson `byId` stays omitted, not unbound).

### Unbound operations

An operation still in the list with neither a named handler nor `execute` is unbound.

Default (`unbound` omitted or `"throw"`): `generateRoutes` throws `UnboundOperationsError` before it returns routes. The message lists **every** unbound operation, one per line, as `name method path`:

```text
Unbound operations:
countPayloads GET /api/products/count
deleteProduct DELETE /api/products/:id
```

That is startup. Nothing is listening yet.

Opt in to register each unbound operation as **501** `{ error: "Not Implemented" }` instead of throwing:

```ts
generateRoutes(operations, {
  handlers: { allProducts: () => products },
  unbound: "notImplemented",
});
```

The 501 handler is a normal route. The pipeline still runs `parse` → `context` → `route` → `validate` → `handle` → `response` → `send`. A `.required` body that fails `validate` is **400** and the 501 handler does not run. Any other `unbound` value throws `Unknown unbound policy … Expected "throw" or "notImplemented".`

## HTTP status

| Handler return | HTTP result |
|---|---|
| a payload (object, array, string, …) | `{ body: payload }` at **200** |
| `null` or `undefined` | `notFound(args)` or `{ status: 404, body: { error: "Not found" } }` |
| `response({ status?, headers?, body? })` | sent as-is (branded) |

Unbranded `{ status, body }` or `{ body: "copy" }` objects are **payloads**. `execute: () => ({ body: "copy" })` responds with JSON `{ "body": "copy" }`, not the string `"copy"`. Use `response()` when the host needs a transport status other than the default wrap.

```ts
newProduct: ({ body }) => {
  const created = { id: "stinkrat", ...(body as object) };
  return response({ status: 201, body: { id: created.id, payload: created } });
},
deleteProduct: () => response({ status: 204 }),
```

A created JSON document is **201**. A deleted one is **204** (no body). A payload that is not wrapped in `response()` stays **200**, including `{ status: "draft", body: "note text" }` — those fields are application data. Unknown paths stay the router's **404** `{ error: "Not Found" }`. A known path with the wrong method is **405** with `Allow`.

Handlers never write `ctx.json`. They read `ctx.params` / `ctx.query` / `ctx.body`, call the binding, and return `ResponseData`.

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

`execute` binds every operation above. POST `/api/waitlist` without `email` is 400 from default `validate` (`Missing required field: email`) and the handler does not run. The same list can use `handlers` instead of `execute`. A name you leave out throws unless you pass `unbound: "notImplemented"`.

## Recipe: YAML to listen

```yml
product:
  read:
    allProducts:
      api:
        method: GET
        endpoint: /api/products
        query: allProducts
    productById:
      api:
        method: GET
        endpoint: /api/products/:id
        query: payloadById
  create:
    newProduct:
      api:
        method: POST
        endpoint: /api/products
        query: insertPayload
        body:
          id: string.required
          name: string.required
          catalog: string
```

```ts
import { listApiOperations, loadYaml } from "@citrusworx/nectarine/config";
import {
  Seltzer,
  generateRoutes,
  response,
  type ResponseData,
} from "@citrusworx/seltzer";

type Payload = { id: string; name: string; catalog?: string };

const operations = listApiOperations("product", loadYaml("./productAPI.yml"));
const documents: Payload[] = [];

const app = Seltzer.init();

for (const route of generateRoutes(operations, {
  handlers: {
    allProducts: () => documents.map((doc) => ({ ...doc })),
    productById: ({ params }) => documents.find((doc) => doc.id === params.id) ?? null,
    newProduct: ({ body }) => {
      const record = body as Payload;
      const payload: Payload = { id: record.id, name: record.name, catalog: record.catalog };
      documents.push(payload);
      // JSON document in `payload` — 201, not the default 200 wrap.
      return response({ status: 201, body: { id: payload.id, payload } });
    },
  },
})) {
  app.route(route);
}

// Default host is 127.0.0.1. Port 0 picks an ephemeral port (tests).
const server = app.listen(3000);
```

`listApiOperations` also lives at `@citrusworx/nectarine/api`. `loadApiOperations(resource, apiPath)` loads YAML from disk first.

Do **not** reimplement YAML walking in Seltzer. Nectarine owns flatten; Seltzer owns `Route[]`. Seltzer's own tests pass a hand-written array. The HTTP proof of this recipe (fixture `productAPI.yml`, loopback listen, reads, JSONB-shaped writes, 404, 405 `Allow`, `.required` 400, unbound throw, `unbound: "notImplemented"`) lives in `engines/webengine`, which already depends on both packages.

WebEngine helpers `createNectarineReadRoutes` / `createNectarineWriteRoutes` / `createNectarineRoutes` call this path and always pass `execute`, so every selected operation is bound. Blackwater product JSONB catalog and waitlist GET + POST `joinWaitlist` pass a host `execute` into `createNectarineRoutes`. Health and KiwiPress content stay hand-registered.

### Plug `replace("validate")`

Default `validate` is presence-only `.required` on `contract.body`. It leaves `ctx.valid` unset. Replacing the stage **turns those checks off**. The replacement is the whole validate stage. Dispatch on `ctx.route.contract.name`. Zod is an application dependency, not a Seltzer dependency; the same `safeParse` shape is [Pipeline → Replacement validate](./seltzer-pipeline.md#replacement-validate). This plug uses `validationError` and no extra package:

```ts
import { validationError } from "@citrusworx/seltzer";

const app = Seltzer.init().replace("validate", (ctx) => {
  if (ctx.route?.contract?.name !== "newProduct") {
    return;
  }

  const body = ctx.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return validationError([{ path: [], message: "Expected an object" }]);
  }

  const name = (body as { name?: unknown }).name;
  if (typeof name !== "string" || name.trim() === "") {
    return validationError([{ path: ["name"], message: "Required" }]);
  }
  if (name.trim() === "bad") {
    return validationError([{ path: ["name"], message: "Name is not allowed" }]);
  }

  ctx.valid = { body: { ...(body as object), name: name.trim() } };
});
```

A rejected name is **400** `{ error: "Validation failed", issues: [{ path: ["name"], message: "Name is not allowed" }] }` and the handler does not run. A accepted body is on `ctx.valid.body`. `ctx.body` stays the raw JSON. Routes the replacement ignores continue with `ctx.valid` unset, including when their YAML spec says `.required`.

To keep the builtin presence check, do not call `replace("validate")`. POST `/api/products` without `name` is then **400** `{ error: "Missing required field: name" }`.

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
- Not a database layer — the handler is host data access (adapter, memory, compiler query)
- Not Zod — default `validate` is `.required` presence; richer checks are `replace("validate", …)`
- Not a silent skip — an operation you listed and did not bind throws, unless you opt into 501

## Related

- [Integration](./seltzer-integration.md)
- [Pipeline](./seltzer-pipeline.md) — `contract` + `validate`
- [Routing](./seltzer-routing.md) — static-prefix preference
- [Nectarine API](../nectarine/nectarine-api.md) — `listApiOperations`
