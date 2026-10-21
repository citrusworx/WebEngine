import http from "node:http";
import https from "node:https";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { Seltzer } from "./seltzer.js";
import type { ResponseData } from "./response.js";
import {
    DEFAULT_HEADERS_TIMEOUT_MS,
    DEFAULT_KEEP_ALIVE_TIMEOUT_MS,
    DEFAULT_REQUEST_TIMEOUT_MS,
} from "./types.js";

/**
 * HTTPS uses the committed TEST ONLY fixture under ./fixtures.
 * node:crypto can read an X.509 certificate. It cannot create one.
 */

const servers: Array<http.Server | https.Server> = [];

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

function track<T extends http.Server>(server: T): T {
    servers.push(server);
    return server;
}

async function listen(app: Seltzer, options: Parameters<Seltzer["listen"]>[1] = {}) {
    const server = track(
        app.listen(0, {
            ...options,
            onListening: options.onListening ?? (() => undefined),
        }),
    );
    if (!server.listening) {
        await once(server, "listening");
    }
    return server;
}

function mount(listener: http.RequestListener): http.Server {
    const server = track(http.createServer(listener));
    return server;
}

async function listenOnLoopback(server: http.Server): Promise<void> {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
}

function portOf(server: http.Server): number {
    const address = server.address() as AddressInfo | null;
    if (!address || typeof address === "string") {
        throw new Error("Expected TCP address");
    }
    return address.port;
}

function httpBase(server: http.Server): string {
    return `http://127.0.0.1:${portOf(server)}`;
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

const COMPARE_HEADERS = [
    "content-type",
    "content-length",
    "x-mark",
    "access-control-allow-origin",
    "access-control-allow-credentials",
    "access-control-allow-methods",
    "access-control-allow-headers",
    "access-control-max-age",
    "vary",
    "allow",
];

function functionNameInStack(): never {
    throw new Error("precedence-secret");
}

describe("app.adapter()", () => {
    it("stores options on ctx and returns the app", async () => {
        const app = Seltzer.init();
        const returned = app.adapter({
            adapter: "node:http",
            options: {
                baseUrl: "https://first.example",
                headers: { "X-App": "1" },
            },
        });
        expect(returned).toBe(app);

        app.adapter({
            adapter: "memory",
            options: {
                baseUrl: "https://stash.example",
                headers: { "X-App": "notes" },
            },
        }).route({
            method: "GET",
            path: "/opts",
            handler: (ctx): ResponseData => ({ body: ctx.options ?? null }),
        });

        const listener = app.handler();
        expect(typeof listener).toBe("function");
        expect(listener).not.toBe(app);

        const server = mount(listener);
        await listenOnLoopback(server);
        const res = await request(`${httpBase(server)}/opts`);
        expect(res.status).toBe(200);
        expect(res.json).toEqual({
            baseUrl: "https://stash.example",
            headers: { "X-App": "notes" },
        });
    });
});

describe("app.handler()", () => {
    it("returns a request listener and does not emit the config deprecation", () => {
        const calls: unknown[] = [];
        const original = process.emitWarning;
        process.emitWarning = ((warning: string | Error) => {
            calls.push(warning);
        }) as typeof process.emitWarning;
        try {
            const listener = Seltzer.init().handler();
            expect(typeof listener).toBe("function");
            expect(listener.length).toBe(2);
            const server = track(http.createServer(listener));
            expect(server).toBeInstanceOf(http.Server);
            expect(calls).toEqual([]);
        } finally {
            process.emitWarning = original;
        }
    });

    it("forwards handler(config) to adapter and warns once per process", async () => {
        const calls: Array<{ message: unknown; options: unknown }> = [];
        const original = process.emitWarning;
        process.emitWarning = ((message: string | Error, options?: { type?: string; code?: string }) => {
            calls.push({ message, options });
        }) as typeof process.emitWarning;

        try {
            const app = Seltzer.init()
                .handler({
                    adapter: "node:http",
                    options: {
                        baseUrl: "https://first.example",
                        headers: { "X-App": "1" },
                    },
                })
                .handler({
                    adapter: "memory",
                    options: {
                        baseUrl: "https://second.example",
                        headers: { "X-App": "2" },
                    },
                })
                .route({
                    method: "GET",
                    path: "/opts",
                    handler: (ctx): ResponseData => ({ body: ctx.options ?? null }),
                });

            Seltzer.init().handler({
                adapter: "other",
                options: { baseUrl: "https://third.example" },
            });

            expect(calls).toHaveLength(1);
            expect(String(calls[0]?.message)).toContain("app.adapter(config)");
            expect(String(calls[0]?.message)).toContain("next minor after 0.10.0");
            expect(calls[0]?.options).toEqual({
                type: "DeprecationWarning",
                code: "SELTZER_DEP_HANDLER_CONFIG",
            });

            const server = mount(app.handler());
            await listenOnLoopback(server);
            const res = await request(`${httpBase(server)}/opts`);
            expect(res.status).toBe(200);
            expect(res.json).toEqual({
                baseUrl: "https://second.example",
                headers: { "X-App": "2" },
            });
        } finally {
            process.emitWarning = original;
        }
    });

    it("serves routes registered after the listener was created", async () => {
        const app = Seltzer.init();
        const server = mount(app.handler());
        await listenOnLoopback(server);
        app.route({
            method: "GET",
            path: "/later",
            handler: (): ResponseData => ({ body: { later: true } }),
        });

        expect((await request(`${httpBase(server)}/later`)).json).toEqual({ later: true });
    });

    it("leaves timeouts on a host-owned server until the host sets them", () => {
        const app = Seltzer.init().route({
            method: "GET",
            path: "/",
            handler: (): ResponseData => ({ body: { ok: true } }),
        });
        const plain = track(http.createServer());
        const hosted = mount(app.handler());

        expect(hosted.headersTimeout).toBe(plain.headersTimeout);
        expect(hosted.requestTimeout).toBe(plain.requestTimeout);
        expect(hosted.keepAliveTimeout).toBe(plain.keepAliveTimeout);

        hosted.headersTimeout = DEFAULT_HEADERS_TIMEOUT_MS;
        hosted.requestTimeout = DEFAULT_REQUEST_TIMEOUT_MS;
        hosted.keepAliveTimeout = DEFAULT_KEEP_ALIVE_TIMEOUT_MS;

        expect(hosted.headersTimeout).toBe(DEFAULT_HEADERS_TIMEOUT_MS);
        expect(hosted.requestTimeout).toBe(DEFAULT_REQUEST_TIMEOUT_MS);
        expect(hosted.keepAliveTimeout).toBe(DEFAULT_KEEP_ALIVE_TIMEOUT_MS);
    });

    it("still applies loopback and timeout defaults from listen", async () => {
        const server = await listen(Seltzer.init());
        const address = server.address();
        expect(address).toMatchObject({ address: "127.0.0.1" });
        expect(server.headersTimeout).toBe(DEFAULT_HEADERS_TIMEOUT_MS);
        expect(server.requestTimeout).toBe(DEFAULT_REQUEST_TIMEOUT_MS);
        expect(server.keepAliveTimeout).toBe(DEFAULT_KEEP_ALIVE_TIMEOUT_MS);
    });
});

describe("init options and listen overrides", () => {
    it("throws at init for credentials with origin * and for a bad bodyLimit or maxAge", () => {
        expect(() => Seltzer.init({ cors: { origin: "*", credentials: true } })).toThrow(
            /Seltzer\.init cors credentials: true cannot be combined with origin "\*"/,
        );
        expect(() => Seltzer.init({ bodyLimit: -1 })).toThrow(
            /Seltzer\.init bodyLimit must be a non-negative integer/,
        );
        expect(() => Seltzer.init({ bodyLimit: 1.5 })).toThrow(
            /Seltzer\.init bodyLimit must be a non-negative integer/,
        );
        expect(() => Seltzer.init({ cors: { maxAge: 1.5 } })).toThrow(
            /Seltzer\.init cors maxAge must be a non-negative integer/,
        );
    });

    it("still throws at listen when that call passes an invalid override", () => {
        const app = Seltzer.init({
            bodyLimit: 4,
            cors: { origin: "https://ok.example" },
        });

        expect(() => app.listen(0, { cors: { origin: "*", credentials: true } })).toThrow(
            /Seltzer\.listen cors credentials: true cannot be combined with origin "\*"/,
        );
        expect(() => app.listen(0, { bodyLimit: -1 })).toThrow(
            /Seltzer\.listen bodyLimit must be a non-negative integer/,
        );
        expect(() => app.listen(0, { cors: { maxAge: -1 } })).toThrow(
            /Seltzer\.listen cors maxAge must be a non-negative integer/,
        );
    });

    it("uses init values when listen omits them, and listen replaces a passed field", async () => {
        const initLogs: string[] = [];
        const listenLogs: string[] = [];
        const app = Seltzer.init({
            bodyLimit: 4,
            cors: {
                origin: "https://init.example",
                credentials: true,
                maxAge: 12,
                methods: ["GET"],
            },
            locals: { who: "init" },
            debug: true,
            logger: (message) => initLogs.push(message),
        })
            .route({
                method: "POST",
                path: "/upload",
                handler: (ctx): ResponseData => ({ body: { bytes: String(ctx.body).length } }),
            })
            .route({
                method: "GET",
                path: "/who",
                handler: (ctx): ResponseData => ({ body: ctx.locals }),
            })
            .route({
                method: "GET",
                path: "/boom",
                handler: (): ResponseData => functionNameInStack(),
            })
            .route({
                method: "GET",
                path: "/items",
                handler: (): ResponseData => ({ body: { ok: true } }),
            });

        const viaInit = await listen(app);
        const viaListen = await listen(app, {
            bodyLimit: 10,
            cors: { origin: "https://listen.example" },
            locals: { who: "listen" },
            debug: false,
            logger: (message) => listenLogs.push(message),
        });
        const hosted = mount(app.handler());
        await listenOnLoopback(hosted);

        const initBase = httpBase(viaInit);
        const listenBase = httpBase(viaListen);
        const hostBase = httpBase(hosted);

        expect(
            (
                await request(`${initBase}/upload`, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: "12345",
                })
            ).status,
        ).toBe(413);
        expect(
            (
                await request(`${hostBase}/upload`, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: "12345",
                })
            ).status,
        ).toBe(413);
        expect(
            (
                await request(`${listenBase}/upload`, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: "12345",
                })
            ).json,
        ).toEqual({ bytes: 5 });
        expect(
            (
                await request(`${listenBase}/upload`, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: "12345678901",
                })
            ).status,
        ).toBe(413);

        expect((await request(`${initBase}/who`)).json).toEqual({ who: "init" });
        expect((await request(`${hostBase}/who`)).json).toEqual({ who: "init" });
        expect((await request(`${listenBase}/who`)).json).toEqual({ who: "listen" });

        const initOrigin = {
            headers: { Origin: "https://init.example" },
        };
        const listenOrigin = {
            headers: { Origin: "https://listen.example" },
        };
        const initCors = await request(`${initBase}/items`, initOrigin);
        const hostCors = await request(`${hostBase}/items`, initOrigin);
        const replaced = await request(`${listenBase}/items`, listenOrigin);
        const notMerged = await request(`${listenBase}/items`, initOrigin);

        expect(initCors.headers.get("access-control-allow-origin")).toBe("https://init.example");
        expect(initCors.headers.get("access-control-allow-credentials")).toBe("true");
        expect(initCors.headers.get("access-control-max-age")).toBe("12");
        expect(initCors.headers.get("access-control-allow-methods")).toBe("GET");
        expect(hostCors.headers.get("access-control-allow-origin")).toBe("https://init.example");
        expect(hostCors.headers.get("access-control-allow-credentials")).toBe("true");
        expect(hostCors.headers.get("access-control-max-age")).toBe("12");

        expect(replaced.headers.get("access-control-allow-origin")).toBe("https://listen.example");
        expect(replaced.headers.get("access-control-allow-credentials")).toBeNull();
        expect(replaced.headers.get("access-control-max-age")).toBeNull();
        expect(replaced.headers.get("access-control-allow-methods")).toBe(
            "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        );
        expect(notMerged.headers.get("access-control-allow-origin")).toBeNull();

        initLogs.length = 0;
        listenLogs.length = 0;
        const initBoom = await request(`${initBase}/boom`);
        const hostBoom = await request(`${hostBase}/boom`);
        const listenBoom = await request(`${listenBase}/boom`);
        expect(initBoom.json).toEqual({ error: "Internal Server Error" });
        expect(hostBoom.json).toEqual({ error: "Internal Server Error" });
        expect(listenBoom.json).toEqual({ error: "Internal Server Error" });
        expect(initBoom.text).not.toContain("precedence-secret");
        expect(hostBoom.text).not.toContain("precedence-secret");
        expect(listenBoom.text).not.toContain("precedence-secret");

        expect(initLogs.join("\n")).toContain("precedence-secret");
        expect(initLogs.join("\n")).toContain("functionNameInStack");
        expect(listenLogs.join("\n")).toContain("precedence-secret");
        expect(listenLogs.join("\n")).not.toContain("functionNameInStack");
        expect(initLogs.length).toBe(2);
        expect(listenLogs).toHaveLength(1);
    });

    it("keeps a valid init cors when a later listen override throws", async () => {
        const app = Seltzer.init({ cors: { origin: "https://ok.example" } }).route({
            method: "GET",
            path: "/items",
            handler: (): ResponseData => ({ body: { ok: true } }),
        });

        expect(() => app.listen(0, { cors: { origin: "*", credentials: true } })).toThrow(
            /Seltzer\.listen/,
        );

        const hosted = mount(app.handler());
        await listenOnLoopback(hosted);
        const res = await request(`${httpBase(hosted)}/items`, {
            headers: { Origin: "https://ok.example" },
        });
        expect(res.headers.get("access-control-allow-origin")).toBe("https://ok.example");
    });
});

describe("listen and handler parity", () => {
    it("returns the same response for the same request", async () => {
        const app = Seltzer.init({
            bodyLimit: 4,
            cors: { origin: "https://app.example", credentials: true },
            locals: { who: "shared" },
            logger: () => undefined,
        })
            .before("handle", (ctx) => {
                if (ctx.path === "/gated") {
                    return { status: 401, body: { error: "Unauthorized" } };
                }
            })
            .route({
                method: "GET",
                path: "/hello",
                handler: (ctx): ResponseData => ({
                    headers: { "X-Mark": "seltzer" },
                    body: { ok: true, who: (ctx.locals as { who: string }).who },
                }),
            })
            .route({
                method: "POST",
                path: "/echo",
                handler: (ctx): ResponseData => ({ status: 201, body: ctx.body }),
            })
            .route({
                method: "GET",
                path: "/plain",
                handler: (): ResponseData => ({ body: "hi" }),
            })
            .route({
                method: "GET",
                path: "/empty",
                handler: (): ResponseData => ({ status: 204 }),
            })
            .route({
                method: "GET",
                path: "/boom",
                handler: (): ResponseData => {
                    throw new Error("parity-secret");
                },
            })
            .route({
                method: "GET",
                path: "/bare",
                handler: () => ({ ok: true }) as unknown as ResponseData,
            })
            .route({
                method: "POST",
                path: "/need",
                contract: { body: { email: "string.required" } },
                handler: (): ResponseData => ({ body: { ok: true } }),
            })
            .route({
                method: "POST",
                path: "/upload",
                handler: (ctx): ResponseData => ({ body: { bytes: String(ctx.body).length } }),
            })
            .route({
                method: "GET",
                path: "/gated",
                handler: (): ResponseData => ({ body: { leaked: true } }),
            });

        const viaListen = httpBase(await listen(app));
        const hosted = mount(app.handler());
        await listenOnLoopback(hosted);
        const viaHandler = httpBase(hosted);

        const cases: RequestInit[] = [
            {},
            { headers: { Origin: "https://app.example" } },
        ];

        async function expectSame(path: string, init: RequestInit = {}) {
            const left = await request(`${viaListen}${path}`, init);
            const right = await request(`${viaHandler}${path}`, init);
            expect(right.status).toBe(left.status);
            expect(right.text).toBe(left.text);
            for (const name of COMPARE_HEADERS) {
                expect(right.headers.get(name)).toBe(left.headers.get(name));
            }
        }

        await expectSame("/hello");
        for (const init of cases) {
            await expectSame("/hello", init);
        }
        await expectSame("/echo", {
            method: "POST",
            headers: { "Content-Type": "application/json", Origin: "https://app.example" },
            body: JSON.stringify({ n: 1 }),
        });
        await expectSame("/plain");
        await expectSame("/empty");
        await expectSame("/missing");
        await expectSame("/hello", { method: "POST" });
        await expectSame("/hello", {
            method: "OPTIONS",
            headers: { Origin: "https://app.example" },
        });
        await expectSame("/gated");
        await expectSame("/boom");
        await expectSame("/bare");
        await expectSame("/need", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        await expectSame("/upload", {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: "12345",
        });
        await expectSame("/upload", {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: "1234",
        });

        const sample = await request(`${viaHandler}/hello`, {
            headers: { Origin: "https://app.example" },
        });
        expect(sample.status).toBe(200);
        expect(sample.json).toEqual({ ok: true, who: "shared" });
        expect(sample.headers.get("access-control-allow-origin")).toBe("https://app.example");
        expect(sample.headers.get("access-control-allow-credentials")).toBe("true");
        const missing = await request(`${viaHandler}/missing`);
        expect(missing.status).toBe(404);
        const wrongMethod = await request(`${viaHandler}/hello`, { method: "POST" });
        expect(wrongMethod.status).toBe(405);
        expect(wrongMethod.headers.get("allow")).toBe("GET");
        const preflight = await request(`${viaHandler}/hello`, {
            method: "OPTIONS",
            headers: { Origin: "https://app.example" },
        });
        expect(preflight.status).toBe(204);
        expect(preflight.text).toBe("");
        const boom = await request(`${viaHandler}/boom`);
        expect(boom.status).toBe(500);
        expect(boom.json).toEqual({ error: "Internal Server Error" });
        expect(boom.text).not.toContain("parity-secret");
        const bare = await request(`${viaHandler}/bare`);
        expect(bare.status).toBe(500);
        expect(bare.text).toContain("ResponseData");
        const need = await request(`${viaHandler}/need`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        expect(need.status).toBe(400);
        expect(need.json).toEqual({ error: "Missing required field: email" });
        const gated = await request(`${viaHandler}/gated`);
        expect(gated.status).toBe(401);
    });
});

describe("HTTPS recipe", () => {
    it("mounts app.handler() on https.createServer with the test-only certificate", async () => {
        const key = readFileSync(new URL("./fixtures/test-only-localhost-key.pem", import.meta.url));
        const cert = readFileSync(
            new URL("./fixtures/test-only-localhost-cert.pem", import.meta.url),
        );
        expect(key.toString("utf8")).toContain("TEST ONLY");
        expect(cert.toString("utf8")).toContain("TEST ONLY");

        const app = Seltzer.init({
            cors: { origin: "https://app.example" },
        }).route({
            method: "GET",
            path: "/hello",
            handler: (): ResponseData => ({ body: { ok: true } }),
        });

        const server = track(
            https.createServer({ key, cert }, app.handler()),
        );
        expect(server.headersTimeout).not.toBe(DEFAULT_HEADERS_TIMEOUT_MS);
        server.headersTimeout = DEFAULT_HEADERS_TIMEOUT_MS;
        server.requestTimeout = DEFAULT_REQUEST_TIMEOUT_MS;
        server.keepAliveTimeout = DEFAULT_KEEP_ALIVE_TIMEOUT_MS;
        server.listen(0, "127.0.0.1");
        await once(server, "listening");

        const port = portOf(server);
        const body = await new Promise<{ status: number; text: string; allowOrigin: string | undefined }>(
            (resolve, reject) => {
                const req = https.request(
                    {
                        host: "127.0.0.1",
                        port,
                        path: "/hello",
                        method: "GET",
                        rejectUnauthorized: false,
                        servername: "localhost",
                        headers: { Origin: "https://app.example" },
                    },
                    (res) => {
                        const chunks: Buffer[] = [];
                        res.on("data", (chunk: Buffer) => chunks.push(chunk));
                        res.on("end", () => {
                            const allow = res.headers["access-control-allow-origin"];
                            resolve({
                                status: res.statusCode ?? 0,
                                text: Buffer.concat(chunks).toString("utf8"),
                                allowOrigin: Array.isArray(allow) ? allow[0] : allow,
                            });
                        });
                    },
                );
                req.on("error", reject);
                req.end();
            },
        );

        expect(server.headersTimeout).toBe(DEFAULT_HEADERS_TIMEOUT_MS);
        expect(server.requestTimeout).toBe(DEFAULT_REQUEST_TIMEOUT_MS);
        expect(server.keepAliveTimeout).toBe(DEFAULT_KEEP_ALIVE_TIMEOUT_MS);
        expect(body.status).toBe(200);
        expect(JSON.parse(body.text)).toEqual({ ok: true });
        expect(body.allowOrigin).toBe("https://app.example");
    });
});
