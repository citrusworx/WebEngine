import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { Seltzer, type StageName } from "./seltzer.js";
import type { ResponseData } from "./response.js";
import {
    DEFAULT_HEADERS_TIMEOUT_MS,
    DEFAULT_KEEP_ALIVE_TIMEOUT_MS,
    DEFAULT_REQUEST_TIMEOUT_MS,
} from "./types.js";

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

    const host = address.address === "0.0.0.0" ? "127.0.0.1" : address.address;
    return `http://${host}:${address.port}`;
}

async function request(url: string): Promise<{ status: number; json: unknown }> {
    const res = await fetch(url);
    const text = await res.text();
    let json: unknown;
    try {
        json = text ? JSON.parse(text) : undefined;
    } catch {
        json = undefined;
    }
    return { status: res.status, json };
}

describe("core API conformance", () => {
    it("init returns a fresh app", async () => {
        const first = Seltzer.init().route({
            method: "GET",
            path: "/only-first",
            handler: (): ResponseData => ({ body: { app: "first" } }),
        });
        const second = Seltzer.init();

        expect(second).not.toBe(first);

        const firstServer = await listen(first);
        const secondServer = await listen(second);

        expect((await request(`${httpBase(firstServer)}/only-first`)).json).toEqual({
            app: "first",
        });
        expect((await request(`${httpBase(secondServer)}/only-first`)).status).toBe(404);
    });

    it("route compiles params and ranks a static prefix ahead of :id", async () => {
        const app = Seltzer.init()
            .route({
                method: "GET",
                path: "/items/:id",
                handler: (ctx): ResponseData => ({
                    body: { route: "param", id: ctx.params.id },
                }),
            })
            .route({
                method: "GET",
                path: "/items/new",
                handler: (): ResponseData => ({ body: { route: "static" } }),
            });

        const server = await listen(app);
        const base = httpBase(server);

        expect((await request(`${base}/items/new`)).json).toEqual({ route: "static" });
        expect((await request(`${base}/items/42`)).json).toEqual({ route: "param", id: "42" });
    });

    it("listen returns an http.Server on 127.0.0.1 with default timeouts, and close() stops it", async () => {
        let reportedPort = -1;
        const app = Seltzer.init().route({
            method: "GET",
            path: "/",
            handler: (): ResponseData => ({ body: { ok: true } }),
        });

        const server = await listen(app, {
            onListening: (port) => {
                reportedPort = port;
            },
        });

        expect(server).toBeInstanceOf(http.Server);
        const address = server.address();
        expect(address).toMatchObject({ address: "127.0.0.1", family: "IPv4" });
        if (!address || typeof address === "string") {
            throw new Error("Expected TCP address");
        }
        expect(reportedPort).toBe(address.port);
        expect(reportedPort).toBeGreaterThan(0);
        expect(server.headersTimeout).toBe(DEFAULT_HEADERS_TIMEOUT_MS);
        expect(server.requestTimeout).toBe(DEFAULT_REQUEST_TIMEOUT_MS);
        expect(server.keepAliveTimeout).toBe(DEFAULT_KEEP_ALIVE_TIMEOUT_MS);

        expect((await request(`http://127.0.0.1:${address.port}/`)).status).toBe(200);

        await new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
            server.closeIdleConnections();
        });
        servers.splice(servers.indexOf(server), 1);

        expect(server.listening).toBe(false);
        await expect(request(`http://127.0.0.1:${address.port}/`)).rejects.toThrow();
    });

    it("listen host and timeout options override the defaults", async () => {
        const server = await listen(Seltzer.init(), {
            host: "0.0.0.0",
            headersTimeout: 8_000,
            requestTimeout: 12_000,
            keepAliveTimeout: 1_000,
        });

        expect(server.address()).toMatchObject({ address: "0.0.0.0" });
        expect(server.headersTimeout).toBe(8_000);
        expect(server.requestTimeout).toBe(12_000);
        expect(server.keepAliveTimeout).toBe(1_000);
    });

    it("listen rejects an empty host and unsafe timeouts before binding", () => {
        const app = Seltzer.init();

        expect(() => app.listen(0, { host: "   " })).toThrow(
            /Seltzer\.listen host must be a non-empty address/,
        );
        expect(() => app.listen(0, { headersTimeout: 1.5 })).toThrow(
            /headersTimeout must be a non-negative integer/,
        );
        expect(() =>
            app.listen(0, { headersTimeout: 1_000, requestTimeout: 1_000, keepAliveTimeout: 1_000 }),
        ).toThrow(/keepAliveTimeout must be less than headersTimeout/);
        expect(() => app.listen(0, { headersTimeout: 10_000, requestTimeout: 5_000 })).toThrow(
            /requestTimeout must be 0 \(disabled\) or greater than or equal to headersTimeout/,
        );
    });

    it("before inserts and replace swaps stages, and unknown names throw", async () => {
        const app = Seltzer.init();

        expect(() => app.before("auth" as StageName, () => undefined)).toThrow(
            'Unknown pipeline stage "auth"',
        );
        expect(() => app.replace("nope" as StageName, () => undefined)).toThrow(
            'Unknown pipeline stage "nope"',
        );

        const ran: string[] = [];
        app.before("validate", () => {
            ran.push("before");
        })
            .replace("validate", () => {
                ran.push("replaced");
            })
            .route({
                method: "GET",
                path: "/",
                handler: (): ResponseData => {
                    ran.push("handle");
                    return { body: { ok: true } };
                },
            });

        const server = await listen(app);
        const res = await request(`${httpBase(server)}/`);

        expect(res.status).toBe(200);
        expect(ran).toEqual(["before", "replaced", "handle"]);
    });
});
