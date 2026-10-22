import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import {
    MemoryIdempotencyStore,
    Seltzer,
    type IdempotencyStore,
    type ResponseData,
} from "../core/seltzer.js";

const servers: http.Server[] = [];

afterEach(async () => {
    await Promise.all(
        servers.splice(0).map(
            (server) =>
                new Promise<void>((resolve, reject) => {
                    if (!server.listening) {
                        resolve();
                        return;
                    }
                    server.close((error) => (error ? reject(error) : resolve()));
                    server.closeIdleConnections();
                }),
        ),
    );
});

async function listen(app: Seltzer, options: Parameters<Seltzer["listen"]>[1] = {}) {
    const server = app.listen(0, {
        ...options,
        onListening: () => undefined,
    });
    servers.push(server);
    if (!server.listening) {
        await new Promise<void>((resolve, reject) => {
            server.once("listening", () => resolve());
            server.once("error", reject);
        });
    }
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Expected TCP address");
    }
    return `http://127.0.0.1:${address.port}`;
}

async function request(url: string, init: RequestInit = {}) {
    const res = await fetch(url, init);
    const buf = Buffer.from(await res.arrayBuffer());
    const text = buf.toString("utf8");
    let json: unknown;
    try {
        json = text ? JSON.parse(text) : undefined;
    } catch {
        json = undefined;
    }
    return { status: res.status, headers: res.headers, text, json, buf };
}

function call(
    url: string,
    method: string,
    body: string | Buffer | undefined,
    key?: string,
    headers: Record<string, string> = {},
) {
    const requestHeaders = { ...headers };
    if (key !== undefined) {
        requestHeaders["Idempotency-Key"] = key;
    }
    return request(url, {
        method,
        headers: requestHeaders,
        body: body === undefined ? undefined : body,
    });
}

function post(url: string, key: string | undefined, body: string) {
    return call(url, "POST", body, key, { "content-type": "application/json" });
}

async function waitFor(predicate: () => boolean): Promise<void> {
    const start = Date.now();
    while (!predicate()) {
        if (Date.now() - start > 2_000) {
            throw new Error("timed out waiting for the handler");
        }
        await new Promise((resolve) => setTimeout(resolve, 5));
    }
}

describe("idempotency stage", () => {
    it("replays the same POST body once and sets Idempotent-Replayed", async () => {
        let calls = 0;
        const app = Seltzer.init().route({
            method: "POST",
            path: "/items",
            handler: (): ResponseData => {
                calls += 1;
                return {
                    status: 201,
                    headers: { "X-Created": "1" },
                    body: { id: calls, name: "widget" },
                };
            },
        });
        const base = await listen(app);
        const body = JSON.stringify({ name: "widget" });

        const first = await post(`${base}/items`, "key-1", body);
        const second = await post(`${base}/items`, "key-1", body);

        expect(first.status).toBe(201);
        expect(first.headers.get("idempotent-replayed")).toBeNull();
        expect(first.headers.get("x-created")).toBe("1");
        expect(first.json).toEqual({ id: 1, name: "widget" });
        expect(second.status).toBe(201);
        expect(second.headers.get("idempotent-replayed")).toBe("true");
        expect(second.headers.get("x-created")).toBe("1");
        expect(second.json).toEqual(first.json);
        expect(second.text).toBe(first.text);
        expect(calls).toBe(1);
    });

    it("returns 409 for a concurrent duplicate and then replays the winner", async () => {
        let entered = 0;
        let release = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const app = Seltzer.init().route({
            method: "POST",
            path: "/items",
            handler: async (): Promise<ResponseData> => {
                entered += 1;
                if (entered === 1) {
                    await gate;
                }
                return { status: 201, body: { ok: true } };
            },
        });
        const base = await listen(app);
        const body = JSON.stringify({ name: "widget" });
        const first = post(`${base}/items`, "same", body);
        try {
            await waitFor(() => entered === 1);
            const second = await post(`${base}/items`, "same", body);
            expect(second.status).toBe(409);
            expect(second.json).toEqual({ error: "Idempotency key is already in progress" });
            expect(second.headers.get("idempotent-replayed")).toBeNull();
        } finally {
            release();
        }

        const done = await first;
        expect(done.status).toBe(201);
        expect(entered).toBe(1);
        const replay = await post(`${base}/items`, "same", body);
        expect(replay.status).toBe(201);
        expect(replay.headers.get("idempotent-replayed")).toBe("true");
        expect(replay.json).toEqual({ ok: true });
        expect(entered).toBe(1);
    });

    it("returns 422 when the same key is reused with a different body", async () => {
        let calls = 0;
        let release = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const app = Seltzer.init().route({
            method: "POST",
            path: "/items",
            handler: async (): Promise<ResponseData> => {
                calls += 1;
                if (calls === 1) {
                    await gate;
                }
                return { status: 201, body: { n: calls } };
            },
        });
        const base = await listen(app);
        const original = '{"a":1}';
        const spaced = '{"a": 1}';
        const first = post(`${base}/items`, "key-1", original);
        try {
            await waitFor(() => calls === 1);
            const inflight = await post(`${base}/items`, "key-1", spaced);
            expect(inflight.status).toBe(422);
            expect(inflight.json).toEqual({
                error: "Idempotency key was used with a different request body",
            });
        } finally {
            release();
        }

        expect((await first).status).toBe(201);
        const mismatch = await post(`${base}/items`, "key-1", spaced);
        expect(mismatch.status).toBe(422);
        expect(mismatch.json).toEqual({
            error: "Idempotency key was used with a different request body",
        });
        const replay = await post(`${base}/items`, "key-1", original);
        expect(replay.headers.get("idempotent-replayed")).toBe("true");
        expect(replay.json).toEqual({ n: 1 });
        expect(calls).toBe(1);
    });

    it("ignores GET, PUT, and DELETE even when they carry a key", async () => {
        const calls: string[] = [];
        const app = Seltzer.init();
        for (const method of ["GET", "PUT", "DELETE"] as const) {
            app.route({
                method,
                path: "/items",
                handler: (): ResponseData => {
                    calls.push(method);
                    return { body: { method } };
                },
            });
        }
        const base = await listen(app);
        const longKey = "k".repeat(256);

        for (const method of ["GET", "PUT", "DELETE"]) {
            const first = await call(
                `${base}/items`,
                method,
                method === "GET" ? undefined : "{}",
                longKey,
                method === "GET" ? {} : { "content-type": "application/json" },
            );
            const second = await call(
                `${base}/items`,
                method,
                method === "GET" ? undefined : '{"other":true}',
                "key-1",
                method === "GET" ? {} : { "content-type": "application/json" },
            );
            expect(first.status).toBe(200);
            expect(second.status).toBe(200);
            expect(first.headers.get("idempotent-replayed")).toBeNull();
            expect(second.headers.get("idempotent-replayed")).toBeNull();
        }

        expect(calls).toEqual(["GET", "GET", "PUT", "PUT", "DELETE", "DELETE"]);
    });

    it("ignores POST and PATCH requests that omit the header", async () => {
        let calls = 0;
        const app = Seltzer.init()
            .route({
                method: "POST",
                path: "/items",
                handler: (): ResponseData => {
                    calls += 1;
                    return { body: { n: calls } };
                },
            })
            .route({
                method: "PATCH",
                path: "/items",
                handler: (): ResponseData => {
                    calls += 1;
                    return { body: { n: calls } };
                },
            });
        const base = await listen(app);

        const postFirst = await post(`${base}/items`, undefined, "{}");
        const postSecond = await post(`${base}/items`, undefined, "{}");
        const patch = await call(`${base}/items`, "PATCH", "{}", undefined, {
            "content-type": "application/json",
        });

        expect(postFirst.headers.get("idempotent-replayed")).toBeNull();
        expect(postSecond.headers.get("idempotent-replayed")).toBeNull();
        expect(patch.headers.get("idempotent-replayed")).toBeNull();
        expect(postSecond.json).toEqual({ n: 2 });
        expect(calls).toBe(3);
    });

    it("does not collide across paths, methods, or the query string", async () => {
        const calls: string[] = [];
        const app = Seltzer.init()
            .route({
                method: "POST",
                path: "/a",
                handler: (): ResponseData => {
                    calls.push("POST /a");
                    return { body: { at: "a" } };
                },
            })
            .route({
                method: "POST",
                path: "/b",
                handler: (): ResponseData => {
                    calls.push("POST /b");
                    return { body: { at: "b" } };
                },
            })
            .route({
                method: "PATCH",
                path: "/a",
                handler: (): ResponseData => {
                    calls.push("PATCH /a");
                    return { body: { at: "patch" } };
                },
            });
        const base = await listen(app);
        const body = '{"n":1}';

        const pathA = await post(`${base}/a`, "shared", body);
        const pathB = await post(`${base}/b`, "shared", body);
        const patch = await call(`${base}/a`, "PATCH", body, "shared", {
            "content-type": "application/json",
        });
        const query = await post(`${base}/a?x=1`, "shared", body);

        expect(pathA.json).toEqual({ at: "a" });
        expect(pathB.json).toEqual({ at: "b" });
        expect(patch.json).toEqual({ at: "patch" });
        expect(pathA.headers.get("idempotent-replayed")).toBeNull();
        expect(pathB.headers.get("idempotent-replayed")).toBeNull();
        expect(patch.headers.get("idempotent-replayed")).toBeNull();
        expect(query.headers.get("idempotent-replayed")).toBe("true");
        expect(query.json).toEqual({ at: "a" });
        expect(calls).toEqual(["POST /a", "POST /b", "PATCH /a"]);
    });

    it("expires a stored response when the injected clock passes ttlMs", async () => {
        let now = 1_000;
        let calls = 0;
        const store = new MemoryIdempotencyStore({ now: () => now });
        const app = Seltzer.init({ idempotency: { ttlMs: 50, store } }).route({
            method: "POST",
            path: "/items",
            handler: (): ResponseData => {
                calls += 1;
                return { body: { n: calls } };
            },
        });
        const base = await listen(app);

        expect((await post(`${base}/items`, "key-1", "{}")).json).toEqual({ n: 1 });
        now = 1_049;
        const still = await post(`${base}/items`, "key-1", "{}");
        expect(still.headers.get("idempotent-replayed")).toBe("true");
        expect(still.json).toEqual({ n: 1 });
        expect(calls).toBe(1);

        now = 1_050;
        const expired = await post(`${base}/items`, "key-1", "{}");
        expect(expired.headers.get("idempotent-replayed")).toBeNull();
        expect(expired.json).toEqual({ n: 2 });
        expect(calls).toBe(2);
    });

    it("does not cache a 5xx or a thrown error", async () => {
        const lines: string[] = [];
        let mode: "status" | "throw" | "ok" = "status";
        let calls = 0;
        const app = Seltzer.init().route({
            method: "POST",
            path: "/items",
            handler: (): ResponseData => {
                calls += 1;
                if (mode === "status") {
                    return { status: 500, body: { error: "nope" } };
                }
                if (mode === "throw") {
                    throw new Error("boom");
                }
                return { status: 200, body: { ok: true, calls } };
            },
        });
        const base = await listen(app, { logger: (line) => lines.push(line) });

        const first = await post(`${base}/items`, "key-1", "{}");
        const second = await post(`${base}/items`, "key-1", "{}");
        expect(first.status).toBe(500);
        expect(second.status).toBe(500);
        expect(first.headers.get("idempotent-replayed")).toBeNull();
        expect(second.headers.get("idempotent-replayed")).toBeNull();
        expect(calls).toBe(2);

        mode = "throw";
        const thrown = await post(`${base}/items`, "key-1", "{}");
        expect(thrown.status).toBe(500);
        expect(thrown.json).toEqual({ error: "Internal Server Error" });
        expect(lines.some((line) => line.includes("boom"))).toBe(true);

        mode = "ok";
        const recovered = await post(`${base}/items`, "key-1", "{}");
        const replay = await post(`${base}/items`, "key-1", "{}");
        expect(recovered.status).toBe(200);
        expect(recovered.headers.get("idempotent-replayed")).toBeNull();
        expect(replay.headers.get("idempotent-replayed")).toBe("true");
        expect(replay.json).toEqual(recovered.json);
        expect(calls).toBe(4);
    });

    it("caches a 4xx from the handler and skips it on replay", async () => {
        let calls = 0;
        const app = Seltzer.init().route({
            method: "POST",
            path: "/items",
            handler: (): ResponseData => {
                calls += 1;
                return { status: 409, headers: { "X-Reason": "taken" }, body: { error: "taken" } };
            },
        });
        const base = await listen(app);
        const first = await post(`${base}/items`, "key-1", "{}");
        const second = await post(`${base}/items`, "key-1", "{}");

        expect(first.status).toBe(409);
        expect(second.status).toBe(409);
        expect(second.headers.get("idempotent-replayed")).toBe("true");
        expect(second.headers.get("x-reason")).toBe("taken");
        expect(second.json).toEqual({ error: "taken" });
        expect(calls).toBe(1);
    });

    it("does not reserve a key when validate rejects the body", async () => {
        let calls = 0;
        const app = Seltzer.init().route({
            method: "POST",
            path: "/items",
            contract: { body: { email: "string.required" } },
            handler: (): ResponseData => {
                calls += 1;
                return { status: 201, body: { ok: true } };
            },
        });
        const base = await listen(app);

        const missing = await post(`${base}/items`, "key-1", "{}");
        expect(missing.status).toBe(400);
        expect(calls).toBe(0);

        const created = await post(`${base}/items`, "key-1", JSON.stringify({ email: "a@b.co" }));
        const replay = await post(`${base}/items`, "key-1", JSON.stringify({ email: "a@b.co" }));
        expect(created.status).toBe(201);
        expect(replay.headers.get("idempotent-replayed")).toBe("true");
        expect(calls).toBe(1);
    });

    it("returns 400 for an empty or overlong key and does not run the handler", async () => {
        let calls = 0;
        const app = Seltzer.init().route({
            method: "POST",
            path: "/items",
            handler: (): ResponseData => {
                calls += 1;
                return { body: { ok: true } };
            },
        });
        const base = await listen(app);

        for (const key of ["", "x".repeat(256)]) {
            const res = await post(`${base}/items`, key, "{}");
            expect(res.status).toBe(400);
            expect(res.json).toEqual({ error: "Idempotency-Key must be 1-255 characters" });
        }

        const ok = await post(`${base}/items`, "x".repeat(255), "{}");
        expect(ok.status).toBe(200);
        expect(calls).toBe(1);
    });

    it("disables the stage with idempotency: false on init or listen", async () => {
        let calls = 0;
        const handler = (): ResponseData => {
            calls += 1;
            return { body: { n: calls } };
        };
        const fromInit = Seltzer.init({ idempotency: false }).route({
            method: "POST",
            path: "/items",
            handler,
        });
        const initBase = await listen(fromInit);
        const first = await post(`${initBase}/items`, "key-1", "{}");
        const second = await post(`${initBase}/items`, "key-1", "{}");
        expect(first.json).toEqual({ n: 1 });
        expect(first.headers.get("idempotent-replayed")).toBeNull();
        expect(second.headers.get("idempotent-replayed")).toBeNull();
        expect(second.json).toEqual({ n: 2 });

        calls = 0;
        const fromListen = Seltzer.init().route({
            method: "POST",
            path: "/items",
            handler,
        });
        const listenBase = await listen(fromListen, { idempotency: false });
        await post(`${listenBase}/items`, "key-1", "{}");
        const again = await post(`${listenBase}/items`, "key-1", "{}");
        expect(again.headers.get("idempotent-replayed")).toBeNull();
        expect(again.json).toEqual({ n: 2 });
        expect(calls).toBe(2);
    });

    it("lets listen override ttlMs without dropping the init store, and re-enable a disabled app", async () => {
        let now = 0;
        let calls = 0;
        const store = new MemoryIdempotencyStore({ now: () => now });
        const app = Seltzer.init({ idempotency: { store, ttlMs: 10 } }).route({
            method: "POST",
            path: "/items",
            handler: (): ResponseData => {
                calls += 1;
                return { body: { n: calls } };
            },
        });
        const base = await listen(app, { idempotency: { ttlMs: 40 } });

        await post(`${base}/items`, "key-1", "{}");
        now = 10;
        const kept = await post(`${base}/items`, "key-1", "{}");
        expect(kept.headers.get("idempotent-replayed")).toBe("true");
        now = 40;
        const expired = await post(`${base}/items`, "key-1", "{}");
        expect(expired.headers.get("idempotent-replayed")).toBeNull();
        expect(calls).toBe(2);

        let enabledCalls = 0;
        const disabled = Seltzer.init({ idempotency: false }).route({
            method: "POST",
            path: "/items",
            handler: (): ResponseData => {
                enabledCalls += 1;
                return { body: { n: enabledCalls } };
            },
        });
        const enabled = await listen(disabled, { idempotency: { ttlMs: 1_000 } });
        await post(`${enabled}/items`, "key-1", "{}");
        const replay = await post(`${enabled}/items`, "key-1", "{}");
        expect(replay.headers.get("idempotent-replayed")).toBe("true");
        expect(enabledCalls).toBe(1);
    });

    it("uses a custom store and scopes the key by method and path", async () => {
        const keys: string[] = [];
        const inner = new MemoryIdempotencyStore();
        const store: IdempotencyStore = {
            begin(key, fingerprint, ttlMs) {
                keys.push(key);
                return inner.begin(key, fingerprint, ttlMs);
            },
            complete(key, fingerprint, response) {
                return inner.complete(key, fingerprint, response);
            },
            release(key, fingerprint) {
                return inner.release(key, fingerprint);
            },
        };
        let calls = 0;
        const app = Seltzer.init({ idempotency: { store } }).route({
            method: "PATCH",
            path: "/items/:id",
            handler: (): ResponseData => {
                calls += 1;
                return { body: { n: calls } };
            },
        });
        const base = await listen(app);
        const body = '{"op":"add"}';

        const first = await call(`${base}/items/7`, "PATCH", body, "abc", {
            "content-type": "application/json",
        });
        const second = await call(`${base}/items/7`, "PATCH", body, "abc", {
            "content-type": "application/json",
        });

        expect(first.json).toEqual({ n: 1 });
        expect(second.headers.get("idempotent-replayed")).toBe("true");
        expect(second.json).toEqual({ n: 1 });
        expect(calls).toBe(1);
        expect(keys[0]).toBe(JSON.stringify(["PATCH", "/items/7", "abc"]));
    });

    it("replays a Buffer body byte for byte", async () => {
        let calls = 0;
        const payload = Buffer.from([1, 2, 3, 255]);
        const app = Seltzer.init().route({
            method: "POST",
            path: "/bytes",
            handler: (): ResponseData => {
                calls += 1;
                return {
                    status: 201,
                    headers: { "X-Bytes": "1", "Content-Type": "application/octet-stream" },
                    body: payload,
                };
            },
        });
        const base = await listen(app);
        const requestBody = Buffer.from("payload");

        const first = await call(`${base}/bytes`, "POST", requestBody, "bin", {
            "content-type": "application/octet-stream",
        });
        const second = await call(`${base}/bytes`, "POST", requestBody, "bin", {
            "content-type": "application/octet-stream",
        });

        expect(first.status).toBe(201);
        expect(first.headers.get("idempotent-replayed")).toBeNull();
        expect(Buffer.from(first.buf).equals(payload)).toBe(true);
        expect(second.status).toBe(201);
        expect(second.headers.get("idempotent-replayed")).toBe("true");
        expect(second.headers.get("x-bytes")).toBe("1");
        expect(second.headers.get("content-type")).toMatch(/application\/octet-stream/);
        expect(Buffer.from(second.buf).equals(payload)).toBe(true);
        expect(calls).toBe(1);
    });

    it("keeps a separate memory store on each app", async () => {
        let left = 0;
        let right = 0;
        const make = (tick: () => number) =>
            Seltzer.init().route({
                method: "POST",
                path: "/items",
                handler: (): ResponseData => {
                    const n = tick();
                    return { body: { n } };
                },
            });
        const a = await listen(make(() => ++left));
        const b = await listen(make(() => ++right));

        expect((await post(`${a}/items`, "key-1", "{}")).json).toEqual({ n: 1 });
        expect((await post(`${b}/items`, "key-1", "{}")).json).toEqual({ n: 1 });
        expect((await post(`${a}/items`, "key-1", "{}")).headers.get("idempotent-replayed")).toBe("true");
        expect(left).toBe(1);
        expect(right).toBe(1);
    });

    it("rejects a bad ttlMs or store before binding", () => {
        expect(() => Seltzer.init({ idempotency: { ttlMs: 0 } })).toThrow(
            /Seltzer\.init idempotency\.ttlMs must be a positive integer/,
        );
        expect(() => Seltzer.init({ idempotency: { ttlMs: 1.5 } })).toThrow(
            /Seltzer\.init idempotency\.ttlMs must be a positive integer/,
        );
        expect(() => Seltzer.init({ idempotency: { store: {} as IdempotencyStore } })).toThrow(
            /Seltzer\.init idempotency\.store must implement begin, complete, and release/,
        );
        expect(() => Seltzer.init().listen(0, { idempotency: { ttlMs: -5 } })).toThrow(
            /Seltzer\.listen idempotency\.ttlMs must be a positive integer/,
        );
    });
});
