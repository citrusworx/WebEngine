import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { client, HttpError } from "./client.js";
import type { Endpoint } from "../types.js";

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

function endpoint(path: string, options?: Endpoint["options"]): Endpoint {
    return { path, endpoint: path, options };
}

async function listen(
    handler: (req: http.IncomingMessage, res: http.ServerResponse) => void | Promise<void>,
): Promise<string> {
    const server = http.createServer((req, res) => {
        void Promise.resolve(handler(req, res)).catch((error) => {
            res.statusCode = 500;
            res.end(error instanceof Error ? error.message : "error");
        });
    });
    servers.push(server);

    await new Promise<void>((resolve, reject) => {
        server.listen(0, "127.0.0.1", () => resolve());
        server.once("error", reject);
    });

    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Expected TCP address");
    }

    return `http://127.0.0.1:${address.port}`;
}

function readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

describe("seltzer HTTP client", () => {
    it("parses successful JSON responses", async () => {
        const base = await listen((_req, res) => {
            res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ ok: true }));
        });

        await expect(client.get(endpoint("/items", { baseUrl: base }))).resolves.toEqual({ ok: true });
    });

    it("parses JSON when Content-Type is omitted but the body is JSON", async () => {
        const base = await listen((_req, res) => {
            res.writeHead(200);
            res.end(JSON.stringify({ fallback: true }));
        });

        await expect(client.get(endpoint("/", { baseUrl: base }))).resolves.toEqual({ fallback: true });
    });

    it("returns text when Content-Type is not JSON", async () => {
        const base = await listen((_req, res) => {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("plain");
        });

        await expect(client.get(endpoint("/note", { baseUrl: base }))).resolves.toBe("plain");
    });

    it("joins baseUrl + path and forwards headers", async () => {
        let seen = { url: "", auth: "", accept: "" };
        const base = await listen((req, res) => {
            seen = {
                url: req.url ?? "",
                auth: String(req.headers.authorization ?? ""),
                accept: String(req.headers.accept ?? ""),
            };
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ path: req.url }));
        });

        const result = await client.get(
            endpoint("/v1/posts", {
                baseUrl: base,
                headers: {
                    Authorization: "Bearer test",
                    Accept: "application/json",
                },
            }),
        );

        expect(seen.url).toBe("/v1/posts");
        expect(seen.auth).toBe("Bearer test");
        expect(seen.accept).toBe("application/json");
        expect(result).toEqual({ path: "/v1/posts" });
    });

    it("POSTs JSON and uses caller headers over the default Content-Type", async () => {
        let seen = { method: "", type: "", body: "" };
        const base = await listen(async (req, res) => {
            seen = {
                method: req.method ?? "",
                type: String(req.headers["content-type"] ?? ""),
                body: await readBody(req),
            };
            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ created: true }));
        });

        const result = await client.post(
            endpoint("/items", {
                baseUrl: base,
                headers: { "Content-Type": "application/json; charset=utf-8" },
            }),
            { name: "widget" },
        );

        expect(seen.method).toBe("POST");
        expect(seen.type).toBe("application/json; charset=utf-8");
        expect(JSON.parse(seen.body)).toEqual({ name: "widget" });
        expect(result).toEqual({ created: true });
    });

    it("throws HttpError with status and body snippet on 4xx", async () => {
        const base = await listen((_req, res) => {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "missing" }));
        });

        const error = await client.get(endpoint("/missing", { baseUrl: base })).catch((err) => err);

        expect(error).toBeInstanceOf(HttpError);
        expect(error.status).toBe(404);
        expect(error.statusText).toBe("Not Found");
        expect(error.body).toContain("missing");
        expect(error.message).toMatch(/HTTP 404 Not Found/);
        expect(error.message).toContain("missing");
    });

    it("throws HttpError on 5xx and snippets a long body", async () => {
        const long = "boom".repeat(80);
        const base = await listen((_req, res) => {
            res.writeHead(503);
            res.end(long);
        });

        const error = await client.get(endpoint("/down", { baseUrl: base })).catch((err) => err);

        expect(error).toBeInstanceOf(HttpError);
        expect(error.status).toBe(503);
        expect(error.body).toBe(long);
        expect(error.message.endsWith("…")).toBe(true);
        expect(error.message.length).toBeLessThan(long.length);
    });

    it("PUT / PATCH / DELETE keep Endpoint options and throw on !ok", async () => {
        const seen: string[] = [];
        const base = await listen(async (req, res) => {
            seen.push(`${req.method} ${req.url}`);
            if (req.method === "DELETE") {
                res.writeHead(204);
                res.end();
                return;
            }
            if (req.url === "/items/1") {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ method: req.method, body: JSON.parse(await readBody(req)) }));
                return;
            }
            res.writeHead(409, { "Content-Type": "text/plain" });
            res.end("conflict");
        });

        await expect(
            client.put(endpoint("/items/1", { baseUrl: base }), { name: "a" }),
        ).resolves.toEqual({ method: "PUT", body: { name: "a" } });
        await expect(
            client.patch(endpoint("/items/1", { baseUrl: base }), { name: "b" }),
        ).resolves.toEqual({ method: "PATCH", body: { name: "b" } });
        await expect(client.delete(endpoint("/items/1", { baseUrl: base }))).resolves.toBeUndefined();

        const conflict = await client
            .put(endpoint("/items/2", { baseUrl: base }), { name: "c" })
            .catch((err) => err);
        expect(conflict).toBeInstanceOf(HttpError);
        expect(conflict.status).toBe(409);
        expect(conflict.message).toContain("conflict");
        expect(seen).toEqual(["PUT /items/1", "PATCH /items/1", "DELETE /items/1", "PUT /items/2"]);
    });

    it("does not load undici for allowSelfSigned on http URLs", async () => {
        const base = await listen((_req, res) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ tls: false }));
        });

        await expect(
            client.get(endpoint("/", { baseUrl: base, allowSelfSigned: true })),
        ).resolves.toEqual({ tls: false });
    });
});
