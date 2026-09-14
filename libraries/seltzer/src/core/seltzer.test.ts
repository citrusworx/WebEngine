import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { Seltzer } from "./seltzer.js";
import type { ResponseData } from "./response.js";

const servers: http.Server[] = [];

afterEach(async () => {
    await Promise.all(
        servers.splice(0).map(
            (server) =>
                new Promise<void>((resolve, reject) => {
                    server.close((error) => (error ? reject(error) : resolve()));
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

describe("Seltzer default pipeline", () => {
    it("serves JSON ResponseData with default 200", async () => {
        const app = Seltzer.init().route({
            method: "GET",
            path: "/",
            handler: (): ResponseData => ({
                body: [{ message: "Hello World!" }],
            }),
        });

        const base = await listen(app);
        const res = await request(`${base}/`);

        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toMatch(/application\/json/);
        expect(res.json).toEqual([{ message: "Hello World!" }]);
    });

    it("extracts params, query, and JSON body", async () => {
        const app = Seltzer.init().route({
            method: "POST",
            path: "/items/:id",
            handler: (ctx): ResponseData => ({
                status: 201,
                headers: { "X-Created": "1" },
                body: {
                    id: ctx.params.id,
                    q: ctx.query.q,
                    name: (ctx.body as { name: string }).name,
                },
            }),
        });

        const base = await listen(app);
        const res = await request(`${base}/items/42?q=search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "widget" }),
        });

        expect(res.status).toBe(201);
        expect(res.headers.get("x-created")).toBe("1");
        expect(res.json).toEqual({ id: "42", q: "search", name: "widget" });
    });

    it("returns 404 for unmatched routes", async () => {
        const app = Seltzer.init().route({
            method: "GET",
            path: "/only",
            handler: (): ResponseData => ({ body: { ok: true } }),
        });

        const base = await listen(app);
        const res = await request(`${base}/missing`);

        expect(res.status).toBe(404);
        expect(res.json).toEqual({ error: "Not Found" });
    });

    it("returns 400 for invalid JSON bodies", async () => {
        const app = Seltzer.init().route({
            method: "POST",
            path: "/items",
            handler: (): ResponseData => ({ body: { ok: true } }),
        });

        const base = await listen(app);
        const res = await request(`${base}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{not-json",
        });

        expect(res.status).toBe(400);
        expect(res.json).toEqual({ error: "Invalid JSON body" });
    });

    it("returns 500 when a handler does not return ResponseData", async () => {
        const app = Seltzer.init().route({
            method: "GET",
            path: "/bad",
            handler: () => ({ ok: true }) as unknown as ResponseData,
        });

        const base = await listen(app);
        const res = await request(`${base}/bad`);

        expect(res.status).toBe(500);
        expect(res.json).toMatchObject({
            error: "Internal Server Error",
            message: expect.stringContaining("Handler must return ResponseData"),
        });
    });

    it("returns 500 when a handler throws", async () => {
        const app = Seltzer.init().route({
            method: "GET",
            path: "/boom",
            handler: () => {
                throw new Error("nope");
            },
        });

        const base = await listen(app);
        const res = await request(`${base}/boom`);

        expect(res.status).toBe(500);
        expect(res.json).toEqual({
            error: "Internal Server Error",
            message: "nope",
        });
    });

    it("applies CORS headers and answers OPTIONS with 204", async () => {
        const app = Seltzer.init().route({
            method: "GET",
            path: "/",
            handler: (): ResponseData => ({ body: { ok: true } }),
        });

        const base = await listen(app, {
            cors: {
                origin: "http://localhost:5173",
                methods: ["GET", "POST", "OPTIONS"],
                headers: ["Content-Type"],
            },
        });

        const options = await request(`${base}/`, {
            method: "OPTIONS",
            headers: { Origin: "http://localhost:5173" },
        });

        expect(options.status).toBe(204);
        expect(options.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
        expect(options.headers.get("access-control-allow-methods")).toBe("GET,POST,OPTIONS");
        expect(options.text).toBe("");

        const get = await request(`${base}/`, {
            headers: { Origin: "http://localhost:5173" },
        });
        expect(get.status).toBe(200);
        expect(get.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
        expect(get.json).toEqual({ ok: true });
    });

    it("does not parse a GET body", async () => {
        const app = Seltzer.init().route({
            method: "GET",
            path: "/",
            handler: (ctx): ResponseData => ({ body: { body: ctx.body ?? null } }),
        });

        const base = await listen(app);
        const res = await request(`${base}/`);
        expect(res.json).toEqual({ body: null });
    });

    it("passes listen locals through to handlers", async () => {
        const app = Seltzer.init().route({
            method: "GET",
            path: "/",
            handler: (ctx): ResponseData => ({
                body: { service: (ctx.locals as { service: string }).service },
            }),
        });

        const base = await listen(app, { locals: { service: "blackwater" } });
        const res = await request(`${base}/`);
        expect(res.json).toEqual({ service: "blackwater" });
    });
});

describe("Seltzer#before", () => {
    it("short-circuits with 401 before handle when Authorization is missing", async () => {
        let handled = false;
        const app = Seltzer.init()
            .before("handle", (ctx) => {
                if (!ctx.headers.authorization) {
                    return { status: 401, body: { error: "Unauthorized" } };
                }
            })
            .route({
                method: "GET",
                path: "/secret",
                handler: (): ResponseData => {
                    handled = true;
                    return { body: { ok: true } };
                },
            });

        const base = await listen(app);
        const res = await request(`${base}/secret`);

        expect(handled).toBe(false);
        expect(res.status).toBe(401);
        expect(res.json).toEqual({ error: "Unauthorized" });
    });

    it("continues to handle when Authorization is present", async () => {
        const app = Seltzer.init()
            .before("handle", (ctx) => {
                if (!ctx.headers.authorization) {
                    return { status: 401, body: { error: "Unauthorized" } };
                }
            })
            .route({
                method: "GET",
                path: "/secret",
                handler: (): ResponseData => ({ body: { ok: true } }),
            });

        const base = await listen(app);
        const res = await request(`${base}/secret`, {
            headers: { Authorization: "Bearer test" },
        });

        expect(res.status).toBe(200);
        expect(res.json).toEqual({ ok: true });
    });
});
