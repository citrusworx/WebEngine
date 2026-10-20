import http from "node:http";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Seltzer, type SeltzerLogger } from "./seltzer.js";
import type { ResponseData } from "./response.js";
import { STAGE_NAMES } from "../pipeline/index.js";

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

function waitListening(server: http.Server): Promise<void> {
    if (server.listening) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        server.once("listening", () => resolve());
        server.once("error", reject);
    });
}

async function listen(app: Seltzer, options: Parameters<Seltzer["listen"]>[1] = {}) {
    const server = app.listen(0, {
        ...options,
        onListening: options.onListening ?? (() => undefined),
    });
    servers.push(server);
    await waitListening(server);
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Expected TCP address");
    }
    return `http://127.0.0.1:${address.port}`;
}

async function request(url: string, init: RequestInit = {}) {
    const res = await fetch(url, init);
    const bytes = Buffer.from(await res.arrayBuffer());
    const text = bytes.toString("utf8");
    let json: unknown;
    try {
        json = text ? JSON.parse(text) : undefined;
    } catch {
        json = undefined;
    }
    return { status: res.status, headers: res.headers, text, json, bytes };
}

function gate3DebugFrame(): never {
    throw new Error("gate3-debug-secret");
}

function walkTs(dir: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) {
            files.push(...walkTs(full));
            continue;
        }
        if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
            files.push(full);
        }
    }
    return files;
}

describe("strict ResponseData", () => {
    it("keeps the named pipeline and does not import WebEngine or Blackwater", () => {
        expect([...STAGE_NAMES]).toEqual([
            "parse",
            "context",
            "route",
            "validate",
            "handle",
            "response",
            "send",
        ]);

        const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
        const sources = walkTs(srcRoot).map((file) => readFileSync(file, "utf8"));
        expect(sources.length).toBeGreaterThan(0);
        for (const source of sources) {
            expect(source).not.toMatch(/@citrusworx\/(webengine|blackwater)/);
            expect(source).not.toMatch(/from\s+["'][^"']*blackwater/i);
            expect(source).not.toMatch(/require\(\s*["'][^"']*blackwater/i);
        }
        expect(walkTs(srcRoot).join("\n").toLowerCase()).not.toContain("blackwater");
    });

    it("serializes string, JSON values, and bytes, and honors status and headers", async () => {
        const app = Seltzer.init()
            .route({
                method: "GET",
                path: "/object",
                handler: (): ResponseData => ({ body: { a: 1, b: "x" } }),
            })
            .route({
                method: "GET",
                path: "/array",
                handler: (): ResponseData => ({ body: [1, "x", null] }),
            })
            .route({
                method: "GET",
                path: "/number",
                handler: (): ResponseData => ({ body: 0 }),
            })
            .route({
                method: "GET",
                path: "/boolean",
                handler: (): ResponseData => ({ body: false }),
            })
            .route({
                method: "GET",
                path: "/null",
                handler: (): ResponseData => ({ body: null }),
            })
            .route({
                method: "GET",
                path: "/text",
                handler: (): ResponseData => ({ body: "héllo" }),
            })
            .route({
                method: "GET",
                path: "/text-html",
                handler: (): ResponseData => ({
                    headers: { "Content-Type": "text/html; charset=utf-8" },
                    body: "<b>hi</b>",
                }),
            })
            .route({
                method: "GET",
                path: "/text-csv",
                handler: (): ResponseData => ({
                    headers: { "content-type": "text/csv" },
                    body: "a,b",
                }),
            })
            .route({
                method: "GET",
                path: "/json-type",
                handler: (): ResponseData => ({
                    headers: { "Content-Type": "application/vnd.custom+json" },
                    body: { ok: true },
                }),
            })
            .route({
                method: "GET",
                path: "/bytes",
                handler: (): ResponseData => ({ body: Buffer.from([1, 2, 3, 255]) }),
            })
            .route({
                method: "GET",
                path: "/bytes-view",
                handler: (): ResponseData => ({ body: Uint8Array.from([9, 8, 7]) }),
            })
            .route({
                method: "GET",
                path: "/png",
                handler: (): ResponseData => ({
                    headers: { "Content-Type": "image/png" },
                    body: Buffer.from([137, 80]),
                }),
            })
            .route({
                method: "POST",
                path: "/created",
                handler: (): ResponseData => ({
                    status: 201,
                    headers: { "X-Custom": "yes", "X-Other": "2" },
                    body: { ok: true },
                }),
            })
            .route({
                method: "GET",
                path: "/empty",
                handler: (): ResponseData => ({}),
            });

        const base = await listen(app);

        const object = await request(`${base}/object`);
        expect(object.status).toBe(200);
        expect(object.headers.get("content-type")).toBe("application/json");
        expect(object.json).toEqual({ a: 1, b: "x" });

        const array = await request(`${base}/array`);
        expect(array.headers.get("content-type")).toBe("application/json");
        expect(array.text).toBe('[1,"x",null]');

        const number = await request(`${base}/number`);
        expect(number.headers.get("content-type")).toBe("application/json");
        expect(number.text).toBe("0");

        const boolean = await request(`${base}/boolean`);
        expect(boolean.headers.get("content-type")).toBe("application/json");
        expect(boolean.text).toBe("false");

        const nullBody = await request(`${base}/null`);
        expect(nullBody.headers.get("content-type")).toBe("application/json");
        expect(nullBody.text).toBe("null");

        const text = await request(`${base}/text`);
        expect(text.headers.get("content-type")).toBe("text/plain; charset=utf-8");
        expect(text.text).toBe("héllo");

        const html = await request(`${base}/text-html`);
        expect(html.headers.get("content-type")).toBe("text/html; charset=utf-8");
        expect(html.text).toBe("<b>hi</b>");

        const csv = await request(`${base}/text-csv`);
        expect(csv.headers.get("content-type")).toBe("text/csv");
        expect(csv.text).toBe("a,b");

        const custom = await request(`${base}/json-type`);
        expect(custom.headers.get("content-type")).toBe("application/vnd.custom+json");
        expect(custom.text).toBe('{"ok":true}');

        const bytes = await request(`${base}/bytes`);
        expect(bytes.headers.get("content-type")).toBe("application/octet-stream");
        expect([...bytes.bytes]).toEqual([1, 2, 3, 255]);

        const view = await request(`${base}/bytes-view`);
        expect(view.headers.get("content-type")).toBe("application/octet-stream");
        expect([...view.bytes]).toEqual([9, 8, 7]);

        const png = await request(`${base}/png`);
        expect(png.headers.get("content-type")).toBe("image/png");
        expect([...png.bytes]).toEqual([137, 80]);

        const created = await request(`${base}/created`, { method: "POST" });
        expect(created.status).toBe(201);
        expect(created.headers.get("x-custom")).toBe("yes");
        expect(created.headers.get("x-other")).toBe("2");
        expect(created.headers.get("content-type")).toBe("application/json");
        expect(created.json).toEqual({ ok: true });

        const empty = await request(`${base}/empty`);
        expect(empty.status).toBe(200);
        expect(empty.text).toBe("");
        expect(empty.headers.get("content-type")).toBeNull();
    });

    it("omits the body for 204, 304, and HEAD", async () => {
        const app = Seltzer.init()
            .route({
                method: "DELETE",
                path: "/item",
                handler: (): ResponseData => ({
                    status: 204,
                    headers: { "X-Gone": "1" },
                    body: { secret: "nope-204" },
                }),
            })
            .route({
                method: "GET",
                path: "/cached",
                handler: (): ResponseData => ({
                    status: 304,
                    headers: { ETag: "abc" },
                    body: { secret: "nope-304" },
                }),
            })
            .route({
                method: "HEAD",
                path: "/doc",
                handler: (): ResponseData => ({
                    headers: { "X-Head": "1" },
                    body: { a: 1 },
                }),
            })
            .route({
                method: "GET",
                path: "/doc",
                handler: (): ResponseData => ({ body: { a: 1 } }),
            })
            .route({
                method: "HEAD",
                path: "/note",
                handler: (): ResponseData => ({ body: "héllo" }),
            });

        const base = await listen(app);

        const gone = await request(`${base}/item`, { method: "DELETE" });
        expect(gone.status).toBe(204);
        expect(gone.text).toBe("");
        expect(gone.text).not.toContain("nope-204");
        expect(gone.headers.get("content-type")).toBeNull();
        expect(gone.headers.get("x-gone")).toBe("1");

        const cached = await request(`${base}/cached`);
        expect(cached.status).toBe(304);
        expect(cached.text).toBe("");
        expect(cached.text).not.toContain("nope-304");
        expect(cached.headers.get("content-type")).toBeNull();
        expect(cached.headers.get("etag")).toBe("abc");

        const head = await request(`${base}/doc`, { method: "HEAD" });
        expect(head.status).toBe(200);
        expect(head.text).toBe("");
        expect(head.headers.get("content-type")).toBe("application/json");
        expect(head.headers.get("content-length")).toBe(String(Buffer.byteLength('{"a":1}')));
        expect(head.headers.get("x-head")).toBe("1");

        const get = await request(`${base}/doc`);
        expect(get.text).toBe('{"a":1}');

        const headText = await request(`${base}/note`, { method: "HEAD" });
        expect(headText.text).toBe("");
        expect(headText.headers.get("content-type")).toBe("text/plain; charset=utf-8");
        expect(headText.headers.get("content-length")).toBe(String(Buffer.byteLength("héllo")));
    });

    it("short-circuits when a before hook returns ResponseData", async () => {
        const ran: string[] = [];
        const app = Seltzer.init()
            .before("handle", (ctx) => {
                ran.push("auth");
                if (ctx.path === "/secret") {
                    return {
                        status: 401,
                        headers: { "X-From": "hook" },
                        body: { error: "Unauthorized" },
                    };
                }
            })
            .before("response", () => {
                ran.push("response-hook");
            })
            .before("send", () => {
                ran.push("send-hook");
            })
            .route({
                method: "GET",
                path: "/secret",
                handler: (): ResponseData => {
                    ran.push("handler");
                    return { body: { ok: true } };
                },
            })
            .route({
                method: "GET",
                path: "/open",
                handler: (): ResponseData => {
                    ran.push("open");
                    return { body: { ok: true } };
                },
            });

        const base = await listen(app);
        const blocked = await request(`${base}/secret`);
        expect(blocked.status).toBe(401);
        expect(blocked.headers.get("x-from")).toBe("hook");
        expect(blocked.json).toEqual({ error: "Unauthorized" });
        expect(ran).toEqual(["auth"]);

        const open = await request(`${base}/open`);
        expect(open.status).toBe(200);
        expect(open.json).toEqual({ ok: true });
        expect(ran).toEqual(["auth", "auth", "open", "response-hook", "send-hook"]);
    });

    it("returns 500 and logs the route and value for an invalid handler return", async () => {
        const logs: string[] = [];
        const logger: SeltzerLogger = (message) => {
            logs.push(message);
        };
        const app = Seltzer.init()
            .route({
                method: "GET",
                path: "/missing",
                handler: () => undefined as unknown as ResponseData,
            })
            .route({
                method: "GET",
                path: "/bare",
                handler: () => ({ ok: true }) as unknown as ResponseData,
            })
            .route({
                method: "GET",
                path: "/list",
                handler: () => [1, 2] as unknown as ResponseData,
            })
            .route({
                method: "GET",
                path: "/text",
                handler: () => "ok" as unknown as ResponseData,
            })
            .route({
                method: "GET",
                path: "/bad-status",
                handler: () => ({ status: "nope" }) as unknown as ResponseData,
            })
            .route({
                method: "GET",
                path: "/items/:id",
                handler: (ctx) => ({ id: ctx.params.id }) as unknown as ResponseData,
            })
            .route({
                method: "GET",
                path: "/ok",
                handler: (): ResponseData => ({ body: { ok: true } }),
            });

        const base = await listen(app, { logger });

        const missing = await request(`${base}/missing`);
        expect(missing.status).toBe(500);
        expect(missing.json).toEqual({
            error: "Internal Server Error",
            message:
                "Handler must return ResponseData ({ status?, headers?, body? }). Bare values are not wrapped.",
        });
        expect(logs.splice(0).join("\n")).toMatch(/GET \/missing returned undefined/);

        const bare = await request(`${base}/bare`);
        expect(bare.status).toBe(500);
        expect(bare.text).not.toContain("ok");
        expect(logs.splice(0).join("\n")).toMatch(/GET \/bare returned object \{ ok: true \}/);

        const list = await request(`${base}/list`);
        expect(list.status).toBe(500);
        expect(logs.splice(0).join("\n")).toMatch(/GET \/list returned array/);

        const text = await request(`${base}/text`);
        expect(text.status).toBe(500);
        expect(logs.splice(0).join("\n")).toMatch(/GET \/text returned string 'ok'/);

        const badStatus = await request(`${base}/bad-status`);
        expect(badStatus.status).toBe(500);
        expect(logs.splice(0).join("\n")).toContain("nope");

        const item = await request(`${base}/items/42`);
        expect(item.status).toBe(500);
        const itemLog = logs.splice(0).join("\n");
        expect(itemLog).toContain("GET /items/:id (request /items/42)");
        expect(itemLog).toContain("42");
        expect(itemLog).toContain("ResponseData");

        const ok = await request(`${base}/ok`);
        expect(ok.status).toBe(200);
        expect(ok.json).toEqual({ ok: true });
        expect(logs).toEqual([]);
    });

    it("returns 500 when a hook returns a value that is not ResponseData", async () => {
        const logs: string[] = [];
        let handled = false;
        const app = Seltzer.init()
            .before("handle", () => ({ ok: true }) as unknown as ResponseData)
            .route({
                method: "GET",
                path: "/secret",
                handler: (): ResponseData => {
                    handled = true;
                    return { body: { ok: true } };
                },
            });

        const base = await listen(app, { logger: (message) => logs.push(message) });
        const res = await request(`${base}/secret`);
        expect(handled).toBe(false);
        expect(res.status).toBe(500);
        expect(res.json).toMatchObject({ error: "Internal Server Error" });
        expect(logs.join("\n")).toMatch(/GET \/secret hook "handle" returned object \{ ok: true \}/);
    });

    it("logs a thrown handler error without putting the message or stack on the body", async () => {
        const logs: string[] = [];
        const app = Seltzer.init().route({
            method: "GET",
            path: "/boom",
            handler: () => {
                gate3DebugFrame();
            },
        });

        const quiet = await listen(app, { logger: (message) => logs.push(message) });
        const res = await request(`${quiet}/boom`);
        expect(res.status).toBe(500);
        expect(res.json).toEqual({ error: "Internal Server Error" });
        expect(res.text).not.toContain("gate3-debug-secret");
        expect(res.text).not.toContain("gate3DebugFrame");
        const line = logs.join("\n");
        expect(line).toContain('GET /boom stage "handle" threw: gate3-debug-secret');
        expect(line).not.toContain("gate3DebugFrame");

        logs.length = 0;
        const verbose = await listen(app, {
            debug: true,
            logger: (message) => logs.push(message),
        });
        const debugRes = await request(`${verbose}/boom`);
        expect(debugRes.json).toEqual({ error: "Internal Server Error" });
        expect(debugRes.text).not.toContain("gate3DebugFrame");
        expect(debugRes.text).not.toContain("gate3-debug-secret");
        expect(logs.join("\n")).toContain("gate3DebugFrame");
    });

    it("defaults the logger to console.error and lets listen replace it", async () => {
        const app = Seltzer.init().route({
            method: "GET",
            path: "/bare",
            handler: () => ({ ok: true }) as unknown as ResponseData,
        });
        const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
        try {
            const base = await listen(app);
            const res = await request(`${base}/bare`);
            expect(res.status).toBe(500);
            expect(spy).toHaveBeenCalled();
            expect(spy.mock.calls.map((call) => String(call[0])).join("\n")).toContain("GET /bare");
        } finally {
            spy.mockRestore();
        }

        const custom: string[] = [];
        const overridden = vi.spyOn(console, "error").mockImplementation(() => undefined);
        try {
            const base = await listen(app, { logger: (message) => custom.push(message) });
            await request(`${base}/bare`);
            expect(custom.join("\n")).toContain("GET /bare");
            expect(overridden).not.toHaveBeenCalled();
        } finally {
            overridden.mockRestore();
        }
    });

    it("throws when a handler or hook writes the raw response, or calls ctx.json / ctx.send", async () => {
        const logs: string[] = [];
        let handled = false;
        const app = Seltzer.init()
            .before("handle", (ctx) => {
                if (ctx.path === "/hook-write") {
                    ctx.res.writeHead(201);
                    ctx.res.end("hook-leaked");
                }
            })
            .route({
                method: "GET",
                path: "/hook-write",
                handler: (): ResponseData => {
                    handled = true;
                    return { body: { ok: true } };
                },
            })
            .route({
                method: "GET",
                path: "/write-head",
                handler: (ctx) => {
                    ctx.res.writeHead(201, { "X-Leak": "1" });
                    ctx.res.end("leaked");
                    return { body: { ok: true } };
                },
            })
            .route({
                method: "GET",
                path: "/set-header",
                handler: (ctx) => {
                    ctx.res.setHeader("X-Leak", "1");
                    return { status: 201, body: { ok: true } };
                },
            })
            .route({
                method: "GET",
                path: "/assign",
                handler: (ctx) => {
                    ctx.res.statusCode = 201;
                    return { body: { ok: true } };
                },
            })
            .route({
                method: "GET",
                path: "/json",
                handler: (ctx) => {
                    (ctx as { json: (body: unknown) => void }).json({ ok: true });
                    return { body: { ok: true } };
                },
            })
            .route({
                method: "GET",
                path: "/send",
                handler: (ctx) => {
                    (ctx as { send: (body: unknown) => void }).send({ body: { ok: true } });
                    return { body: { ok: true } };
                },
            });

        const base = await listen(app, { logger: (message) => logs.push(message) });

        const hookWrite = await request(`${base}/hook-write`);
        expect(handled).toBe(false);
        expect(hookWrite.status).toBe(500);
        expect(hookWrite.text).not.toContain("hook-leaked");
        expect(hookWrite.json).toEqual({ error: "Internal Server Error" });
        expect(logs.splice(0).join("\n")).toContain("ctx.res.writeHead");

        const writeHead = await request(`${base}/write-head`);
        expect(writeHead.status).toBe(500);
        expect(writeHead.text).not.toContain("leaked");
        expect(writeHead.headers.get("x-leak")).toBeNull();
        expect(writeHead.json).toEqual({ error: "Internal Server Error" });
        expect(logs.splice(0).join("\n")).toContain("ctx.res.writeHead");

        const setHeader = await request(`${base}/set-header`);
        expect(setHeader.status).toBe(500);
        expect(setHeader.headers.get("x-leak")).toBeNull();
        expect(logs.splice(0).join("\n")).toContain("ctx.res.setHeader");

        const assigned = await request(`${base}/assign`);
        expect(assigned.status).toBe(500);
        expect(assigned.json).toEqual({ error: "Internal Server Error" });
        expect(logs.splice(0).join("\n")).toContain("Writing to the raw response");

        const json = await request(`${base}/json`);
        expect(json.status).toBe(500);
        expect(json.json).toEqual({ error: "Internal Server Error" });
        expect(json.text).not.toContain("ctx.json");
        expect(logs.splice(0).join("\n")).toContain("ctx.json was removed");

        const send = await request(`${base}/send`);
        expect(send.status).toBe(500);
        expect(send.json).toEqual({ error: "Internal Server Error" });
        expect(logs.splice(0).join("\n")).toContain("ctx.send is not a Seltzer API");
    });

    it("refuses to replace the send stage", () => {
        const app = Seltzer.init();
        expect(() => app.replace("send", () => undefined)).toThrow(
            'Cannot replace pipeline stage "send"',
        );
        expect(() =>
            app.replace("send", () => {
                return { status: 200, body: { ok: true } };
            }),
        ).toThrow(/Seltzer writes the HTTP response/);
    });
});
