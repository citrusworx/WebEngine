# Seltzer Examples

Longer showcases against `Seltzer` and `client` as exported in **0.8.1**. These are the same primitives as the [tutorial](./seltzer-api-tutorial.md), written as copyable slices rather than a guided build.

For smaller recipes see [Patterns](./seltzer-patterns.md).

## Health + static JSON

```ts
import { Seltzer } from "@citrusworx/seltzer";
import type { ResponseData } from "@citrusworx/seltzer";

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/health",
  handler: (): ResponseData => ({
    body: { ok: true, uptime: process.uptime() },
  }),
});

app.listen(3000);
```

## Notes collection (`:id` + JSON body)

In-memory resource with list, create, and by-id lookup.

```ts
import { Seltzer } from "@citrusworx/seltzer";
import type { ResponseData } from "@citrusworx/seltzer";

type Note = { id: string; text: string };
const notes = new Map<string, Note>();

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/notes",
  handler: (ctx): ResponseData => {
    const q = ctx.query.q?.toLowerCase();
    const all = [...notes.values()];
    const items = q ? all.filter((n) => n.text.toLowerCase().includes(q)) : all;
    return { body: items };
  },
});

app.route({
  method: "POST",
  path: "/notes",
  contract: { body: { text: "string.required" } },
  handler: (ctx): ResponseData => {
    const body = ctx.body as { text: string };
    const note = { id: String(notes.size + 1), text: body.text };
    notes.set(note.id, note);
    return { status: 201, body: note };
  },
});

app.route({
  method: "GET",
  path: "/notes/:id",
  handler: (ctx): ResponseData => {
    const note = notes.get(ctx.params.id);
    return note ? { body: note } : { status: 404, body: { error: "Not Found" } };
  },
});

app.listen(3000, {
  cors: { origin: "http://localhost:5173" },
});
```

## Auth stage

```ts
import type { Stage } from "@citrusworx/seltzer";

const requireAuth: Stage = (ctx) => {
  if (!ctx.headers.authorization) {
    return { status: 401, body: { error: "Unauthorized" } };
  }
};

const app = Seltzer.init().before("handle", requireAuth);
```

## Text response

```ts
app.route({
  method: "GET",
  path: "/robots.txt",
  handler: (): ResponseData => ({
    headers: { "Content-Type": "text/plain" },
    body: "User-agent: *\nDisallow:\n",
  }),
});
```

## Client against that server

```ts
import { client, HttpError, type Endpoint } from "@citrusworx/seltzer";

const notesApi: Endpoint = {
  path: "/notes",
  endpoint: "/notes",
  options: {
    baseUrl: "http://127.0.0.1:3000",
    headers: { Accept: "application/json" },
  },
};

try {
  await client.post(notesApi, { text: "Review the deploy window" });
  const all = await client.get(notesApi);
  console.log(all);

  const one = await client.get({
    ...notesApi,
    path: "/notes/1",
    endpoint: "/notes/:id",
  });
  console.log(one);
} catch (err) {
  if (err instanceof HttpError) {
    console.error(err.status, err.body);
  }
}
```

## Generated product reads

Same shape as `generateRoutes` tests (catalog/slug before `:id`):

```ts
import { Seltzer, generateRoutes, type ApiOperation } from "@citrusworx/seltzer";

const productReadOps: ApiOperation[] = [
  { resource: "product", crud: "read", name: "allProducts", method: "GET", path: "/api/products", query: "allProducts" },
  { resource: "product", crud: "read", name: "productsByCatalog", method: "GET", path: "/api/products/catalog/:catalog", query: "productsByCatalog" },
  { resource: "product", crud: "read", name: "productById", method: "GET", path: "/api/products/:id", query: "productById" },
  { resource: "product", crud: "read", name: "productBySlug", method: "GET", path: "/api/products/slug/:slug", query: "productBySlug" },
];

const products = [
  { id: "stinkrat", name: "StinkRat", catalog: "gear", slug: "stink-rat" },
];

const app = Seltzer.init();
for (const route of generateRoutes(productReadOps, {
  execute: ({ query, params }) => {
    switch (query) {
      case "allProducts":
        return products;
      case "productsByCatalog":
        return products.filter((p) => p.catalog === params.catalog);
      case "productById":
        return products.find((p) => p.id === params.id) ?? null;
      case "productBySlug":
        return products.find((p) => p.slug === params.slug) ?? null;
      default:
        return null;
    }
  },
})) {
  app.route(route);
}
```

`GET /api/products/catalog/gear` is not stolen by `:id`.

## Nectarine flatten (host code)

```ts
import { listApiOperations } from "@citrusworx/nectarine/config";
import { generateRoutes } from "@citrusworx/seltzer";

const ops = listApiOperations("product", product.api).filter(
  (operation) => operation.crud === "read" && operation.method === "GET",
);

for (const route of generateRoutes(ops, { execute })) {
  app.route(route);
}
```

Nectarine does not call `app.route`. You do.

## Sig.js consumer (browser `fetch`)

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function NotesPreview() {
  const label = Signal("loading…");

  effect(() => {
    fetch("http://127.0.0.1:3000/notes")
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((rows: { text: string }[]) => label.set(`${rows.length} notes`))
      .catch((err: unknown) => label.set(String(err)));
  });

  return <p>{() => label.get()}</p>;
}

mount(<NotesPreview />, document.getElementById("root")!);
```

Juice can wrap that in a `card`. CORS is `listen({ cors })`. See [Integration](./seltzer-integration.md).

## What not to paste from 0.2.0 docs

```ts
// Not APIs
ctx.json({ ok: true });
ctx.params; // exists — but not if you never registered :id
// Returning { ok: true } without { body }
app.pipeline.insert("auth");
```
