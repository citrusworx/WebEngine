import http from "node:http";
import net from "node:net";
import { once } from "node:events";
import { afterEach, describe, expect, it } from "vitest";
import { Seltzer } from "./seltzer.js";
import type { ResponseData } from "./response.js";
import { DEFAULT_BODY_LIMIT_BYTES } from "./types.js";
import { parseStage } from "../pipeline/stages.js";
import type { PipelineContext } from "../pipeline/types.js";

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
    return server;
}

function httpBase(server: http.Server): string {
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Expected TCP address");
    }
    return `http://127.0.0.1:${address.port}`;
}

function portOf(server: http.Server): number {
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Expected TCP address");
    }
    return address.port;
}

async function request(
    url: string,
    init: RequestInit = {},
): Promise<{ status: number; headers: Headers; text: string; json: unknown }> {
    const res = await fetch(url, init);
    const text = await res.text();
    let json: unknown;
    try {
        json = text ? JSON.parse(text) : undefined;
    } catch {
        json = undefined;
    }
    return { status: res.status, headers: res.headers, text, json };
}

function itemsApp() {
    let handled = 0;
    const app = Seltzer.init()
        .route({
            method: "GET",
            path: "/items/new",
            handler: (): ResponseData => {
                handled += 1;
                return { body: { route: "static" } };
            },
        })
        .route({
            method: "GET",
            path: "/items/:id",
            handler: (ctx): ResponseData => {
                handled += 1;
                return { body: { route: "param", id: ctx.params.id } };
            },
        })
        .route({
            method: "POST",
            path: "/items",
            handler: (ctx): ResponseData => {
                handled += 1;
                return {
                    body: {
                        route: "create",
                        body: ctx.body === undefined ? { missing: true } : ctx.body,
                    },
                };
            },
        })
        .route({
            method: "PUT",
            path: "/items/:id",
            handler: (ctx): ResponseData => {
                handled += 1;
                return { body: { route: "replace", id: ctx.params.id, body: ctx.body ?? null } };
            },
        });

    return { app, handled: () => handled };
}

describe("parametric routes", () => {
    it("decodes parameters and prefers a static prefix over :id", async () => {
        const { app } = itemsApp();
        const base = httpBase(await listen(app));

        expect((await request(`${base}/items/new`)).json).toEqual({ route: "static" });
        expect((await request(`${base}/items/hello%20world`)).json).toEqual({
            route: "param",
            id: "hello world",
        });
        expect((await request(`${base}/items/%C3%A9`)).json).toEqual({ route: "param", id: "é" });
    });

    it("returns 400 for a malformed parameter encoding and keeps serving", async () => {
        const { app, handled } = itemsApp();
        const base = httpBase(await listen(app));

        for (const path of ["/items/%E0%A4", "/items/%ZZ", "/items/%", "/items/%80"]) {
            const res = await request(`${base}${path}`);
            expect(res.status, path).toBe(400);
            expect(res.headers.get("content-type")).toMatch(/application\/json/);
            expect(res.json).toEqual({ error: "Malformed path parameter" });
        }

        expect(handled()).toBe(0);
        expect((await request(`${base}/items/42`)).json).toEqual({ route: "param", id: "42" });
    });

    it("treats a trailing slash as a different path", async () => {
        const { app, handled } = itemsApp();
        const base = httpBase(await listen(app));

        expect((await request(`${base}/items/42`)).status).toBe(200);
        const slashed = await request(`${base}/items/42/`);
        expect(slashed.status).toBe(404);
        expect(slashed.json).toEqual({ error: "Not Found" });
        expect((await request(`${base}/items/`)).status).toBe(404);
        expect(handled()).toBe(1);
    });

    it("returns 405 and Allow when the path is known but the method is not", async () => {
        const { app, handled } = itemsApp();
        const base = httpBase(await listen(app));

        const mismatch = await request(`${base}/items/42`, { method: "DELETE" });
        expect(mismatch.status).toBe(405);
        expect(mismatch.headers.get("allow")).toBe("GET, PUT");
        expect(mismatch.json).toEqual({ error: "Method Not Allowed" });

        const missing = await request(`${base}/missing`, { method: "DELETE" });
        expect(missing.status).toBe(404);
        expect(missing.headers.get("allow")).toBeNull();

        expect(handled()).toBe(0);
    });
});

describe("JSON and raw bodies", () => {
    it("returns 400 JSON for an invalid JSON content type and leaves an empty body undefined", async () => {
        const { app, handled } = itemsApp();
        const base = httpBase(await listen(app));

        const bad = await request(`${base}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: "{not-json",
        });
        expect(bad.status).toBe(400);
        expect(bad.headers.get("content-type")).toMatch(/application\/json/);
        expect(bad.json).toEqual({ error: "Invalid JSON body" });
        expect(handled()).toBe(0);

        const empty = await request(`${base}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        expect(empty.status).toBe(200);
        expect(empty.json).toEqual({ route: "create", body: { missing: true } });

        const parsedNull = await request(`${base}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "null",
        });
        expect(parsedNull.status).toBe(200);
        expect(parsedNull.json).toEqual({ route: "create", body: null });
    });

    it("passes non-JSON bodies through as a UTF-8 string", async () => {
        const { app } = itemsApp();
        const base = httpBase(await listen(app));

        const form = await request(`${base}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "a=1&b=two",
        });
        expect(form.status).toBe(200);
        expect(form.json).toEqual({ route: "create", body: "a=1&b=two" });

        const webhook = await request(`${base}/items/7`, {
            method: "PUT",
            headers: { "Content-Type": "text/plain" },
            body: "{not-json",
        });
        expect(webhook.status).toBe(200);
        expect(webhook.json).toEqual({ route: "replace", id: "7", body: "{not-json" });

        const untyped = await request(`${base}/items`, {
            method: "POST",
            body: "raw",
        });
        expect(untyped.status).toBe(200);
        expect(untyped.json).toEqual({ route: "create", body: "raw" });
    });

    it("defaults the body limit to 1 MB, rejects the next byte with 413, and stops reading", async () => {
        let handled = 0;
        const app = Seltzer.init().route({
            method: "POST",
            path: "/upload",
            handler: (): ResponseData => {
                handled += 1;
                return { body: { ok: true } };
            },
        });
        const server = await listen(app);
        const port = portOf(server);

        const socket = net.connect(port, "127.0.0.1");
        await once(socket, "connect");
        const declared = DEFAULT_BODY_LIMIT_BYTES + 1;
        socket.write(
            `POST /upload HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: application/octet-stream\r\nContent-Length: ${declared}\r\n\r\n`,
        );
        socket.write("x".repeat(32));

        const raw = await new Promise<string>((resolve, reject) => {
            let data = "";
            socket.on("data", (chunk) => {
                data += chunk.toString();
                if (data.includes("\r\n\r\n") && data.includes("Payload Too Large")) {
                    resolve(data);
                }
            });
            socket.on("error", reject);
            setTimeout(() => reject(new Error(`timed out waiting for 413: ${data}`)), 2000);
        });

        expect(raw).toMatch(/HTTP\/1\.1 413/);
        expect(raw).toMatch(/"error":"Payload Too Large"/);
        expect(handled).toBe(0);
        socket.destroy();

        const base = httpBase(server);
        const underOverride = await request(`${base}/upload`, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: "tiny",
        });
        expect(underOverride.status).toBe(200);
    });

    it("honors bodyLimit, including 0 as unlimited", async () => {
        let seen = "";
        const app = Seltzer.init().route({
            method: "POST",
            path: "/upload",
            handler: (ctx): ResponseData => {
                seen = String(ctx.body);
                return { body: { bytes: seen.length } };
            },
        });

        const limited = httpBase(await listen(app, { bodyLimit: 4 }));
        const over = await request(`${limited}/upload`, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: "12345",
        });
        expect(over.status).toBe(413);
        expect(over.json).toEqual({ error: "Payload Too Large" });
        expect(seen).toBe("");

        const exact = await request(`${limited}/upload`, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: "1234",
        });
        expect(exact.status).toBe(200);
        expect(exact.json).toEqual({ bytes: 4 });

        const unlimited = Seltzer.init().route({
            method: "POST",
            path: "/upload",
            handler: (ctx): ResponseData => ({ body: { bytes: String(ctx.body).length } }),
        });
        const open = httpBase(await listen(unlimited, { bodyLimit: 0 }));
        const big = "z".repeat(DEFAULT_BODY_LIMIT_BYTES + 8);
        const accepted = await request(`${open}/upload`, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: big,
        });
        expect(accepted.status).toBe(200);
        expect(accepted.json).toEqual({ bytes: big.length });
    });

    it("stops pulling chunks once the running total passes the limit", async () => {
        let pulls = 0;
        const chunks = [Buffer.alloc(8), Buffer.alloc(8), Buffer.alloc(8)];
        const req = {
            method: "POST",
            headers: { "content-type": "application/octet-stream" },
            destroyed: false,
            destroy() {
                this.destroyed = true;
                return this;
            },
            on() {
                return this;
            },
            async *[Symbol.asyncIterator]() {
                for (const chunk of chunks) {
                    pulls += 1;
                    yield chunk;
                }
            },
        };
        const res = {
            writableFinished: false,
            destroyed: false,
            once() {
                return this;
            },
        };

        const result = await parseStage({
            req: req as unknown as PipelineContext["req"],
            res: res as unknown as PipelineContext["res"],
            method: "POST",
            path: "/upload",
            query: {},
            params: {},
            body: undefined,
            headers: {},
            locals: {},
            bodyLimit: 10,
        });

        expect(result).toEqual({ status: 413, body: { error: "Payload Too Large" } });
        expect(pulls).toBe(2);
    });

    it("does not read a body whose Content-Length already exceeds the limit", async () => {
        let pulls = 0;
        const req = {
            method: "POST",
            headers: { "content-type": "text/plain", "content-length": "100" },
            destroyed: false,
            destroy() {
                this.destroyed = true;
                return this;
            },
            on() {
                return this;
            },
            async *[Symbol.asyncIterator]() {
                pulls += 1;
                yield Buffer.from("nope");
            },
        };
        const res = {
            writableFinished: false,
            destroyed: false,
            once() {
                return this;
            },
        };

        const result = await parseStage({
            req: req as unknown as PipelineContext["req"],
            res: res as unknown as PipelineContext["res"],
            method: "POST",
            path: "/upload",
            query: {},
            params: {},
            body: undefined,
            headers: {},
            locals: {},
            bodyLimit: 10,
        });

        expect(result).toEqual({ status: 413, body: { error: "Payload Too Large" } });
        expect(pulls).toBe(0);
    });

    it("rejects a non-integer bodyLimit before binding", () => {
        expect(() => Seltzer.init().listen(0, { bodyLimit: 1.5 })).toThrow(
            /bodyLimit must be a non-negative integer/,
        );
        expect(() => Seltzer.init().listen(0, { bodyLimit: -1 })).toThrow(
            /bodyLimit must be a non-negative integer/,
        );
    });
});

describe("CORS", () => {
    it("sends no CORS headers and routes OPTIONS when cors is omitted", async () => {
        let optionsHandled = 0;
        const app = Seltzer.init()
            .route({
                method: "GET",
                path: "/items",
                handler: (): ResponseData => ({ body: { ok: true } }),
            })
            .route({
                method: "OPTIONS",
                path: "/items",
                handler: (): ResponseData => {
                    optionsHandled += 1;
                    return { status: 204, headers: { "X-Custom-Options": "1" } };
                },
            });
        const base = httpBase(await listen(app));

        const get = await request(`${base}/items`, {
            headers: { Origin: "https://app.example" },
        });
        expect(get.status).toBe(200);
        expect(get.headers.get("access-control-allow-origin")).toBeNull();
        expect(get.headers.get("vary")).toBeNull();

        const options = await request(`${base}/items`, { method: "OPTIONS" });
        expect(options.status).toBe(204);
        expect(options.headers.get("x-custom-options")).toBe("1");
        expect(options.headers.get("access-control-allow-origin")).toBeNull();
        expect(optionsHandled).toBe(1);

        const unknown = await request(`${base}/missing`, { method: "OPTIONS" });
        expect(unknown.status).toBe(404);
    });

    it("answers a configured preflight with 204 and the allow headers", async () => {
        let handled = 0;
        const app = Seltzer.init().route({
            method: "POST",
            path: "/items",
            handler: (): ResponseData => {
                handled += 1;
                return { body: { ok: true } };
            },
        });
        const base = httpBase(
            await listen(app, {
                cors: {
                    origin: "https://app.example",
                    methods: ["GET", "POST", "OPTIONS"],
                    headers: ["Content-Type", "X-Request-Id"],
                    maxAge: 600,
                    credentials: true,
                },
            }),
        );

        const preflight = await request(`${base}/items`, {
            method: "OPTIONS",
            headers: {
                Origin: "https://app.example",
                "Access-Control-Request-Method": "POST",
            },
        });
        expect(preflight.status).toBe(204);
        expect(preflight.text).toBe("");
        expect(preflight.headers.get("access-control-allow-origin")).toBe("https://app.example");
        expect(preflight.headers.get("access-control-allow-methods")).toBe("GET,POST,OPTIONS");
        expect(preflight.headers.get("access-control-allow-headers")).toBe(
            "Content-Type,X-Request-Id",
        );
        expect(preflight.headers.get("access-control-max-age")).toBe("600");
        expect(preflight.headers.get("access-control-allow-credentials")).toBe("true");
        expect(preflight.headers.get("vary")).toBe("Origin");
        expect(handled).toBe(0);

        const actual = await request(`${base}/items`, {
            method: "POST",
            headers: {
                Origin: "https://app.example",
                "Content-Type": "application/json",
            },
            body: "{}",
        });
        expect(actual.status).toBe(200);
        expect(actual.headers.get("access-control-allow-origin")).toBe("https://app.example");
        expect(actual.headers.get("vary")).toBe("Origin");
    });

    it("reflects Origin with Vary, and uses * without Vary", async () => {
        const app = Seltzer.init().route({
            method: "GET",
            path: "/",
            handler: (): ResponseData => ({ body: { ok: true } }),
        });

        const reflected = httpBase(await listen(app, { cors: { maxAge: 0 } }));
        const mirrored = await request(`${reflected}/`, {
            headers: { Origin: "https://one.example" },
        });
        expect(mirrored.headers.get("access-control-allow-origin")).toBe("https://one.example");
        expect(mirrored.headers.get("vary")).toBe("Origin");
        expect(mirrored.headers.get("access-control-max-age")).toBe("0");
        expect(mirrored.headers.get("access-control-allow-methods")).toBe(
            "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        );

        const wildcard = Seltzer.init().route({
            method: "GET",
            path: "/",
            handler: (): ResponseData => ({ body: { ok: true } }),
        });
        const star = httpBase(await listen(wildcard, { cors: { origin: "*" } }));
        const anyOrigin = await request(`${star}/`, {
            headers: { Origin: "https://two.example" },
        });
        expect(anyOrigin.headers.get("access-control-allow-origin")).toBe("*");
        expect(anyOrigin.headers.get("vary")).toBeNull();
        expect(anyOrigin.headers.get("access-control-allow-credentials")).toBeNull();
    });

    it("throws at listen when credentials are combined with origin *", () => {
        const app = Seltzer.init();
        expect(() => app.listen(0, { cors: { origin: "*", credentials: true } })).toThrow(
            /credentials: true cannot be combined with origin "\*"/,
        );
        expect(() => app.listen(0, { cors: { maxAge: -1 } })).toThrow(
            /maxAge must be a non-negative integer/,
        );
    });
});
