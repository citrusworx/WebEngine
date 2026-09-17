import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { Seltzer, client, HttpError, generateRoutes, response } from "@citrusworx/seltzer";
import { createNotesApp } from "./notes-app.mjs";
import { createGeneratedApp } from "./generated-server.mjs";

async function serve(t, app, options = {}) {
  const server = app.listen(0, { ...options, onListening: () => {} });
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  if (!server.listening) await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}

async function request(base, path, init) {
  const res = await fetch(base + path, { signal: AbortSignal.timeout(5000), ...init });
  const text = await res.text();
  return { status: res.status, headers: res.headers, text, body: text ? JSON.parse(text) : undefined };
}
const json = (body, method = "POST") => ({
  method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

test("Notes CRUD preserves identity, searches, and sends an empty delete response", async (t) => {
  const { app } = createNotesApp({ makeId: () => "note-1" });
  const base = await serve(t, app);
  const created = await request(base, "/notes", json({ text: " Learn HTTP " }));
  assert.equal(created.status, 201);
  assert.equal(created.headers.get("location"), "/notes/note-1");
  assert.deepEqual(created.body, { id: "note-1", text: "Learn HTTP" });
  assert.match(created.headers.get("content-type"), /application\/json/);
  assert.deepEqual((await request(base, "/notes/note-1")).body, created.body);
  assert.equal((await request(base, "/notes?q=http")).body.length, 1);
  assert.deepEqual((await request(base, "/notes?q=absent")).body, []);
  const edited = await request(base, "/notes/note-1", json({ text: "Understand HTTP" }, "PATCH"));
  assert.equal(edited.status, 200);
  assert.deepEqual(edited.body, { id: "note-1", text: "Understand HTTP" });
  const deleted = await request(base, "/notes/note-1", { method: "DELETE" });
  assert.equal(deleted.status, 204);
  assert.equal(deleted.text, "");
  assert.equal((await request(base, "/notes/note-1")).status, 404);
  assert.equal((await request(base, "/notes/note-1", { method: "DELETE" })).status, 404);
});

test("Application validation rejects non-string, blank, missing and oversized text", async (t) => {
  const base = await serve(t, createNotesApp().app);
  for (const body of [{}, null, [], { text: 42 }, { text: false }, { text: " " }, { text: "x".repeat(201) }]) {
    const result = await request(base, "/notes", json(body));
    assert.equal(result.status, 400, JSON.stringify(body));
  }
  assert.deepEqual((await request(base, "/notes")).body, []);
});

test("Malformed JSON returns 400 before unmatched routing; plain unknown paths return 404", async (t) => {
  const base = await serve(t, createNotesApp().app);
  const result = await request(base, "/missing", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: '{"text":',
  });
  assert.equal(result.status, 400);
  assert.equal(result.body.error, "Invalid JSON body");
  assert.equal((await request(base, "/missing")).status, 404);
});

test("Static routes win; trailing slash and method mismatches stay distinct", async (t) => {
  const base = await serve(t, createNotesApp().app);
  assert.deepEqual((await request(base, "/notes/stats")).body, { count: 0 });
  assert.equal((await request(base, "/notes/")).status, 404);
  assert.equal((await request(base, "/notes", { method: "PUT" })).status, 404);
});

test("0.8.1 keeps the last query value and maps malformed parameter decoding to 500", async (t) => {
  const app = Seltzer.init().route({ method: "GET", path: "/echo/:id", handler: (ctx) => ({ body: { params: ctx.params, query: ctx.query } }) });
  const base = await serve(t, app);
  const result = await request(base, "/echo/hello%20world?q=one&q=two");
  assert.deepEqual(result.body, { params: { id: "hello world" }, query: { q: "two" } });
  assert.equal((await request(base, "/echo/%ZZ")).status, 500);
});

test("Built-in string.required enforces presence, not string type", async (t) => {
  const app = Seltzer.init().route({
    method: "POST", path: "/presence", contract: { body: { text: "string.required" } },
    handler: (ctx) => ({ body: ctx.body }),
  });
  const base = await serve(t, app);
  assert.equal((await request(base, "/presence", json({ text: 0 }))).status, 200);
  assert.equal((await request(base, "/presence", json({ text: false }))).status, 200);
  assert.equal((await request(base, "/presence", json({ text: " " }))).status, 400);
});

test("An early response bypasses inserted before-send stages", async (t) => {
  const app = Seltzer.init();
  let lateRuns = 0;
  app.before("handle", (ctx) => {
    if (ctx.path === "/blocked") return { status: 403, body: { error: "Blocked" } };
  });
  app.before("send", (ctx) => {
    lateRuns++;
    ctx.response.headers = { ...ctx.response.headers, "X-Late": "yes" };
  });
  for (const path of ["/ok", "/blocked"]) app.route({ method: "GET", path, handler: () => ({ body: { ok: true } }) });
  const base = await serve(t, app);
  assert.equal((await request(base, "/ok")).headers.get("x-late"), "yes");
  const blocked = await request(base, "/blocked");
  assert.equal(blocked.status, 403);
  assert.equal(blocked.headers.get("x-late"), null);
  assert.equal(lateRuns, 1);
});

test("Bare handler payloads fail the response shape check", async (t) => {
  const app = Seltzer.init().route({ method: "GET", path: "/bad", handler: () => ({ message: "wrong wrapper" }) });
  const base = await serve(t, app);
  assert.equal((await request(base, "/bad")).status, 500);
});

test("CORS headers do not authorize requests and OPTIONS bypasses route matching", async (t) => {
  const base = await serve(t, createNotesApp().app, { cors: { origin: "http://127.0.0.1:4000" } });
  const allowed = await request(base, "/notes", { headers: { Origin: "http://127.0.0.1:4000" } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://127.0.0.1:4000");
  const other = await request(base, "/notes", { headers: { Origin: "http://example.invalid" } });
  assert.equal(other.status, 200);
  assert.equal(other.headers.get("access-control-allow-origin"), null);
  const options = await request(base, "/unknown", { method: "OPTIONS" });
  assert.equal(options.status, 204);
});

test("Generated example serves static, parametric and missing reads", async (t) => {
  const base = await serve(t, createGeneratedApp());
  assert.equal((await request(base, "/notes")).body.length, 1);
  assert.equal((await request(base, "/notes/intro")).body.id, "intro");
  const stats = await request(base, "/notes/stats");
  assert.deepEqual(stats.body, { count: 1 });
  assert.equal(stats.headers.get("x-example"), "generated");
  assert.equal((await request(base, "/notes/missing")).status, 404);
});

test("Generated executors distinguish business data, explicit responses and absent results", async (t) => {
  const app = Seltzer.init();
  const operations = ["payload", "empty", "deleted", "absent"].map((name) => ({ resource: "note", crud: "read", name, method: "GET", path: `/${name}`, query: name }));
  for (const route of generateRoutes(operations, {
    execute: ({ query }) => {
      if (query === "payload") return { status: "draft", body: "text" };
      if (query === "empty") return [];
      if (query === "deleted") return response({ status: 204 });
      return undefined;
    },
  })) app.route(route);
  const base = await serve(t, app);
  assert.deepEqual((await request(base, "/payload")).body, { status: "draft", body: "text" });
  assert.deepEqual((await request(base, "/empty")).body, []);
  assert.equal((await request(base, "/deleted")).status, 204);
  assert.equal((await request(base, "/absent")).status, 404);
});

test("Seltzer client decodes CRUD results and throws HttpError for a missing note", async (t) => {
  const baseUrl = await serve(t, createNotesApp({ makeId: () => "client-note" }).app);
  const endpoint = (path) => ({ path, endpoint: path, options: { baseUrl } });
  const note = await client.post(endpoint("/notes"), { text: "Client test" });
  assert.equal(note.id, "client-note");
  assert.deepEqual(await client.get(endpoint("/notes/client-note")), note);
  assert.equal(await client.delete(endpoint("/notes/client-note")), undefined);
  await assert.rejects(client.get(endpoint("/notes/client-note")), (error) => {
    assert.ok(error instanceof HttpError);
    assert.equal(error.status, 404);
    assert.deepEqual(JSON.parse(error.body), { error: "Note not found" });
    return true;
  });
});
