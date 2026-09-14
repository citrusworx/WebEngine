# Seltzer Examples

Longer showcases against `Seltzer` and `client` as exported today. These are the same primitives as the [tutorial](./seltzer-api-tutorial.md), written as copyable slices rather than a guided build.

For smaller recipes see [Patterns](./seltzer-patterns.md).

## Health + static JSON

```ts
import { Seltzer } from "@citrusworx/seltzer";

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/health",
  handler: (ctx) => ctx.json({ ok: true, uptime: process.uptime() }),
});

app.listen(3000);
```

## Notes collection (exact paths + query lookup)

In-memory resource with list, create, and `?id=` lookup. This is the shape the tutorial builds.

```ts
import { Seltzer } from "@citrusworx/seltzer";

type Note = { id: string; text: string };
const notes = new Map<string, Note>();

async function readJson(req: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : null;
}

function queryId(req: import("node:http").IncomingMessage) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  return url.searchParams.get("id");
}

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/notes",
  handler: (ctx) => ctx.json([...notes.values()]),
});

app.route({
  method: "POST",
  path: "/notes",
  handler: async (ctx) => {
    try {
      const body = (await readJson(ctx.req)) as { text?: string };
      if (!body?.text) return ctx.json({ error: "text required" }, 400);
      const note = { id: String(notes.size + 1), text: body.text };
      notes.set(note.id, note);
      return ctx.json(note, 201);
    } catch {
      return ctx.json({ error: "invalid json" }, 400);
    }
  },
});

app.route({
  method: "GET",
  path: "/note",
  handler: (ctx) => {
    const id = queryId(ctx.req);
    if (!id) return ctx.json({ error: "id required" }, 400);
    const note = notes.get(id);
    return note ? ctx.json(note) : ctx.json({ error: "Not Found" }, 404);
  },
});

app.listen(3000);
```

`/notes/:id` is not a matcher. A concrete `/notes/1` route only ever serves `"1"`. Prefer `/note?id=`.

## Users collection with the same helper

```ts
type User = { id: string; email: string };
const users = new Map<string, User>();

app.route({
  method: "GET",
  path: "/users",
  handler: (ctx) => ctx.json([...users.values()]),
});

app.route({
  method: "POST",
  path: "/users",
  handler: async (ctx) => {
    const body = (await readJson(ctx.req)) as { email?: string };
    if (!body?.email) return ctx.json({ error: "email required" }, 400);
    const user = { id: String(users.size + 1), email: body.email };
    users.set(user.id, user);
    return ctx.json(user, 201);
  },
});

app.route({
  method: "GET",
  path: "/user",
  handler: (ctx) => {
    const id = queryId(ctx.req);
    const user = id ? users.get(id) : undefined;
    return user ? ctx.json(user) : ctx.json({ error: "Not Found" }, 404);
  },
});
```

## Text response (bypass `ctx.json`)

```ts
app.route({
  method: "GET",
  path: "/robots.txt",
  handler: (ctx) => {
    ctx.res.writeHead(200, { "Content-Type": "text/plain" });
    ctx.res.end("User-agent: *\nDisallow:\n");
  },
});
```

## Client against that server

```ts
import { client, type Endpoint } from "@citrusworx/seltzer";

const notesApi: Endpoint = {
  path: "/notes",
  endpoint: "/notes",
  options: {
    baseUrl: "http://127.0.0.1:3000",
    headers: { Accept: "application/json" },
  },
};

await client.post(notesApi, { text: "Review the deploy window" });
const all = await client.get(notesApi);
console.log(all);

const one = await client.get({
  ...notesApi,
  path: "/note?id=1",
  endpoint: "/note",
});
console.log(one);
```

`put` / `patch` / `delete` follow the same `Endpoint` shape. `delete` and `get` send no body.

`client` does not throw on status 404. `{ error: "Not Found" }` is a parsed object.

## Nectarine-shaped registration (copy, no codegen)

From `libraries/nectarine/models/user/userAPI.yml` — only exact paths:

```ts
import { parser } from "@citrusworx/nectarine";
import { Seltzer } from "@citrusworx/seltzer";

const api = parser.yaml("./userAPI.yml");
const spec = api.user.get.allUsers.api as { method: string; endpoint: string };

const app = Seltzer.init();
app.route({
  method: spec.method,
  path: spec.endpoint,
  handler: (ctx) => ctx.json({ users: [] }),
});
app.listen(3000);
```

The YAML does not create the handler. You do. Do not register `usersById` (`/users/:id`) expecting `/users/42` to hit it.

Equivalent copy without the parser:

```ts
const allUsers = { method: "GET", endpoint: "/users" };
const createUser = { method: "POST", endpoint: "/users" };
```

## Sig.js consumer (browser `fetch`)

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function NotesPreview() {
  const label = Signal("loading…");

  effect(() => {
    fetch("http://127.0.0.1:3000/notes")
      .then((res) => res.json())
      .then((rows: { text: string }[]) =>
        label.set(`${rows.length} notes`),
      )
      .catch((err: unknown) => label.set(String(err)));
  });

  return <p>{() => label.get()}</p>;
}

mount(<NotesPreview />, document.getElementById("root")!);
```

Juice can wrap that in a `card`. CORS is your `writeHead`, not a Seltzer flag. See [Integration](./seltzer-integration.md).

## What not to paste from the design doc

```ts
// Not APIs
app.pipeline.insert("auth").before("handle");
ctx.params.id;
ctx.body;
return { status: 200, body: { ok: true } }; // listen will not serialize this
```
