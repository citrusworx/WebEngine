import http from "node:http";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
    AbortError,
    HttpError,
    NetworkError,
    TimeoutError,
    UrlError,
    client,
    createClient,
    resolveRequestUrl,
} from "./client.js";
import { DEFAULT_CLIENT_TIMEOUT_MS, DEFAULT_REQUEST_TIMEOUT_MS, type Endpoint } from "../types.js";

const servers: http.Server[] = [];

afterEach(async () => {
    await Promise.all(
        servers.splice(0).map(
            (server) =>
                new Promise<void>((resolve, reject) => {
                    server.closeAllConnections?.();
                    if (!server.listening) {
                        resolve();
                        return;
                    }
                    server.close((error) => (error ? reject(error) : resolve()));
                }),
        ),
    );
});

function endpoint(requestPath: string, options?: Endpoint["options"]): Endpoint {
    return { path: requestPath, endpoint: requestPath, options };
}

async function listen(
    handler: (req: http.IncomingMessage, res: http.ServerResponse) => void | Promise<void>,
): Promise<string> {
    const server = http.createServer((req, res) => {
        void Promise.resolve(handler(req, res)).catch((error) => {
            if (!res.headersSent) {
                res.statusCode = 500;
            }
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

function readBody(req: http.IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}

function hang(req: http.IncomingMessage, res: http.ServerResponse, hits: { n: number }): void {
    hits.n += 1;
    req.on("close", () => {
        if (!res.writableEnded) {
            res.end();
        }
    });
}

function timeoutCount(): number {
    const getHandles = (process as NodeJS.Process & { _getActiveHandles?: () => unknown[] })._getActiveHandles;
    const handles = getHandles?.call(process) ?? [];
    return handles.filter((handle) => {
        const name = (handle as { constructor?: { name?: string } }).constructor?.name;
        return name === "Timeout";
    }).length;
}

async function settle(): Promise<void> {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
}

async function withoutAbortSignalAny<T>(run: () => Promise<T>): Promise<T> {
    const descriptor = Object.getOwnPropertyDescriptor(AbortSignal, "any");
    Object.defineProperty(AbortSignal, "any", {
        configurable: true,
        writable: true,
        value: undefined,
    });
    try {
        return await run();
    } finally {
        if (descriptor) {
            Object.defineProperty(AbortSignal, "any", descriptor);
        } else {
            Reflect.deleteProperty(AbortSignal, "any");
        }
    }
}

function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) {
            return sourceFiles(full);
        }
        return full.endsWith(".ts") ? [full] : [];
    });
}

describe("client URL join", () => {
    it("normalizes boundary slashes and keeps the base path", async () => {
        const seen: string[] = [];
        const base = await listen((req, res) => {
            seen.push(req.url ?? "");
            res.writeHead(204);
            res.end();
        });

        const cases: Array<[string, string, string]> = [
            [`${base}/api/v1`, "users", "/api/v1/users"],
            [`${base}/api/v1/`, "/users", "/api/v1/users"],
            [`${base}/api/v1///`, "///users", "/api/v1/users"],
            [`${base}/`, "/notes", "/notes"],
            [base, "/notes", "/notes"],
            [`${base}/api/v1`, "users/", "/api/v1/users/"],
            [`${base}/api/v1`, "/items/a%2Fb", "/api/v1/items/a%2Fb"],
        ];

        for (const [baseUrl, requestPath, expected] of cases) {
            await client.get(endpoint(requestPath, { baseUrl, timeout: 1000 }));
            expect(seen.at(-1)).toBe(expected);
        }

        expect(resolveRequestUrl(`${base}/api/v1`, "users")).toBe(`${base}/api/v1/users`);
        expect(resolveRequestUrl(`${base}/api/v1/`, "/users/")).toBe(`${base}/api/v1/users/`);
    });

    it("preserves a base query and appends the path query", async () => {
        let target = "";
        const base = await listen((req, res) => {
            target = req.url ?? "";
            res.writeHead(204);
            res.end();
        });

        await client.get(endpoint("/users?y=2", { baseUrl: `${base}/api?x=1`, timeout: 1000 }));
        const url = new URL(target, base);
        expect(url.pathname).toBe("/api/users");
        expect(url.searchParams.get("x")).toBe("1");
        expect(url.searchParams.get("y")).toBe("2");
    });

    it("encodes query values, repeats arrays, and omits null and undefined", async () => {
        let target = "";
        const base = await listen((req, res) => {
            target = req.url ?? "";
            res.writeHead(204);
            res.end();
        });

        await client.get(
            endpoint("/search", {
                baseUrl: base,
                timeout: 1000,
                query: {
                    tag: ["a", "b", null, undefined],
                    q: "hello world",
                    skip: undefined,
                    empty: null,
                    n: 0,
                    ok: false,
                    blank: "",
                },
            }),
        );

        const url = new URL(target, base);
        expect(url.pathname).toBe("/search");
        expect(url.searchParams.getAll("tag")).toEqual(["a", "b"]);
        expect(url.searchParams.get("q")).toBe("hello world");
        expect(url.searchParams.has("skip")).toBe(false);
        expect(url.searchParams.has("empty")).toBe(false);
        expect(url.searchParams.get("n")).toBe("0");
        expect(url.searchParams.get("ok")).toBe("false");
        expect(url.searchParams.get("blank")).toBe("");
    });

    it("rejects object query values before sending", async () => {
        let hits = 0;
        const base = await listen((_req, res) => {
            hits += 1;
            res.writeHead(204);
            res.end();
        });

        await expect(
            client.get(
                endpoint("/search", {
                    baseUrl: base,
                    query: { filter: { id: 1 } as unknown as string },
                }),
            ),
        ).rejects.toThrow(TypeError);
        expect(hits).toBe(0);
    });

    it("throws on an absolute path unless allowAbsoluteUrl is set", async () => {
        let hits = 0;
        const base = await listen((_req, res) => {
            hits += 1;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ hit: true }));
        });

        const error = await client
            .get(endpoint(`${base}/secret`, { baseUrl: "http://127.0.0.1:1", timeout: 1000 }))
            .catch((err) => err);

        expect(error).toBeInstanceOf(UrlError);
        expect(error.code).toBe("INVALID_URL");
        expect(hits).toBe(0);

        await expect(
            client.get(endpoint("//evil.example/secret", { baseUrl: base, timeout: 1000 })),
        ).rejects.toBeInstanceOf(UrlError);
        expect(hits).toBe(0);

        await expect(
            client.get(
                endpoint(`${base}/secret`, {
                    baseUrl: "http://127.0.0.1:1",
                    allowAbsoluteUrl: true,
                    timeout: 1000,
                }),
            ),
        ).resolves.toEqual({ hit: true });
        expect(hits).toBe(1);

        await expect(
            client.get(endpoint("ftp://127.0.0.1/file", { allowAbsoluteUrl: true })),
        ).rejects.toBeInstanceOf(UrlError);
    });
});

describe("client timeout and abort", () => {
    it("uses the same 30s default as the server request timeout", async () => {
        expect(DEFAULT_CLIENT_TIMEOUT_MS).toBe(30_000);
        expect(DEFAULT_CLIENT_TIMEOUT_MS).toBe(DEFAULT_REQUEST_TIMEOUT_MS);

        const base = await listen((_req, res) => {
            res.writeHead(204);
            res.end();
        });
        const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
        try {
            await client.get(endpoint("/health", { baseUrl: base }));
            const delays = setTimeoutSpy.mock.calls.map((call) => call[1]);
            expect(delays).toContain(DEFAULT_CLIENT_TIMEOUT_MS);
        } finally {
            setTimeoutSpy.mockRestore();
        }
    });

    it("lets the client and the call override the deadline, and 0 disables it", async () => {
        const hits = { n: 0 };
        const base = await listen((req, res) => hang(req, res, hits));
        const slow = createClient({ timeout: 5_000, baseUrl: base });

        const timed = await slow.get(endpoint("/slow", { timeout: 40 })).catch((err) => err);
        expect(timed).toBeInstanceOf(TimeoutError);
        expect(timed.code).toBe("TIMEOUT");
        expect(timed.timeoutMs).toBe(40);
        expect(hits.n).toBe(1);

        const open = createClient({ timeout: 0, baseUrl: base });
        const stopper = new AbortController();
        let settled = false;
        const pending = open
            .get(endpoint("/open", { signal: stopper.signal }))
            .then(
                () => {
                    settled = true;
                },
                () => {
                    settled = true;
                },
            );
        await new Promise((resolve) => setTimeout(resolve, 60));
        expect(settled).toBe(false);
        stopper.abort();
        await pending;

        const perCall = createClient({ baseUrl: base });
        const callStop = new AbortController();
        let callSettled = false;
        const callPending = perCall
            .get(endpoint("/per-call", { timeout: 0, signal: callStop.signal }))
            .then(
                () => {
                    callSettled = true;
                },
                () => {
                    callSettled = true;
                },
            );
        await new Promise((resolve) => setTimeout(resolve, 60));
        expect(callSettled).toBe(false);
        callStop.abort();
        await callPending;

        const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
        try {
            const early = new AbortController();
            const skipped = client.get(endpoint("/zero", { baseUrl: base, timeout: 0, signal: early.signal }));
            early.abort();
            await skipped.catch(() => undefined);
            const delays = setTimeoutSpy.mock.calls.map((call) => call[1]);
            expect(delays).not.toContain(DEFAULT_CLIENT_TIMEOUT_MS);
        } finally {
            setTimeoutSpy.mockRestore();
        }
    });

    it("times out while waiting for headers and while waiting for the body", async () => {
        const base = await listen((req, res) => {
            req.on("close", () => {
                if (!res.writableEnded) {
                    res.end();
                }
            });
            if (req.url === "/body") {
                res.writeHead(200, { "Content-Type": "application/json" });
            }
        });

        const headers = await client.get(endpoint("/headers", { baseUrl: base, timeout: 40 })).catch((err) => err);
        expect(headers).toBeInstanceOf(TimeoutError);
        expect(headers).not.toBeInstanceOf(HttpError);
        expect(headers).not.toBeInstanceOf(AbortError);
        expect(headers).not.toBeInstanceOf(NetworkError);

        const body = await client.get(endpoint("/body", { baseUrl: base, timeout: 40 })).catch((err) => err);
        expect(body).toBeInstanceOf(TimeoutError);
        expect(body.code).toBe("TIMEOUT");
    });

    it("reports caller abort separately, including when the signal is already aborted", async () => {
        const hits = { n: 0 };
        const base = await listen((req, res) => hang(req, res, hits));
        const controller = new AbortController();
        const pending = client.get(
            endpoint("/wait", { baseUrl: base, timeout: 5_000, signal: controller.signal }),
        );
        await new Promise((resolve) => setTimeout(resolve, 30));
        expect(hits.n).toBe(1);
        controller.abort(new Error("stop"));
        const error = await pending.catch((err) => err);

        expect(error).toBeInstanceOf(AbortError);
        expect(error.code).toBe("ABORTED");
        expect(error.reason).toBeInstanceOf(Error);
        expect(error.message).toBe("stop");
        expect(error).not.toBeInstanceOf(TimeoutError);
        expect(hits.n).toBe(1);

        const early = new AbortController();
        early.abort("done");
        const skipped = await client
            .get(endpoint("/never", { baseUrl: base, signal: early.signal, timeout: 5_000 }))
            .catch((err) => err);
        expect(skipped).toBeInstanceOf(AbortError);
        expect(skipped.reason).toBe("done");
        expect(hits.n).toBe(1);
    });

    it("merges the caller signal when AbortSignal.any is missing", async () => {
        const hits = { n: 0 };
        const base = await listen((req, res) => hang(req, res, hits));

        await withoutAbortSignalAny(async () => {
            expect(AbortSignal.any).toBeUndefined();
            const controller = new AbortController();
            const pending = client.get(
                endpoint("/legacy", { baseUrl: base, timeout: 5_000, signal: controller.signal }),
            );
            setTimeout(() => controller.abort(), 20);
            const error = await pending.catch((err) => err);
            expect(error).toBeInstanceOf(AbortError);
            expect(error.code).toBe("ABORTED");

            const timed = await client
                .get(endpoint("/legacy-timeout", { baseUrl: base, timeout: 40, signal: new AbortController().signal }))
                .catch((err) => err);
            expect(timed).toBeInstanceOf(TimeoutError);
        });
    });

    it("clears the deadline timer after success, timeout, and abort", async () => {
        const base = await listen((req, res) => {
            if (req.url === "/ok") {
                res.writeHead(204);
                res.end();
                return;
            }
            req.on("close", () => {
                if (!res.writableEnded) {
                    res.end();
                }
            });
        });

        const before = timeoutCount();
        await client.get(endpoint("/ok", { baseUrl: base, timeout: 5_000 }));
        await settle();
        expect(timeoutCount()).toBe(before);

        await client.get(endpoint("/hang", { baseUrl: base, timeout: 30 })).catch((err) => err);
        await settle();
        expect(timeoutCount()).toBe(before);

        const controller = new AbortController();
        const pending = client.get(endpoint("/hang", { baseUrl: base, timeout: 5_000, signal: controller.signal }));
        controller.abort();
        await pending.catch(() => undefined);
        await settle();
        expect(timeoutCount()).toBe(before);

        const done = new AbortController();
        await client.get(endpoint("/ok", { baseUrl: base, timeout: 5_000, signal: done.signal }));
        done.abort();
        await settle();
        expect(timeoutCount()).toBe(before);
    });
});

describe("client errors, bodies, and retries", () => {
    it("throws HttpError with status, headers, and a parsed body", async () => {
        const base = await listen((req, res) => {
            if (req.url === "/bytes") {
                res.writeHead(415, { "Content-Type": "application/octet-stream", "X-Request-Id": "abc" });
                res.end(Buffer.from([9, 8, 7]));
                return;
            }
            if (req.url === "/text") {
                res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
                res.end("nope");
                return;
            }
            if (req.url === "/bad-json") {
                res.writeHead(502, { "Content-Type": "application/problem+json" });
                res.end("{");
                return;
            }
            res.writeHead(404, { "Content-Type": "application/vnd.api+json", "X-Request-Id": "note" });
            res.end(JSON.stringify({ error: "missing" }));
        });

        const missing = await client.get(endpoint("/missing", { baseUrl: base, timeout: 1000 })).catch((err) => err);
        expect(missing).toBeInstanceOf(HttpError);
        expect(missing.code).toBe("HTTP_ERROR");
        expect(missing.status).toBe(404);
        expect(missing.body).toEqual({ error: "missing" });
        expect(missing.headers["x-request-id"]).toBe("note");
        expect(missing.headers["content-type"]).toMatch(/application\/vnd\.api\+json/);

        const text = await client.get(endpoint("/text", { baseUrl: base, timeout: 1000 })).catch((err) => err);
        expect(text).toBeInstanceOf(HttpError);
        expect(text.body).toBe("nope");

        const bytes = await client.get(endpoint("/bytes", { baseUrl: base, timeout: 1000 })).catch((err) => err);
        expect(bytes).toBeInstanceOf(HttpError);
        expect(bytes.status).toBe(415);
        expect(bytes.body).toBeInstanceOf(Uint8Array);
        expect([...(bytes.body as Uint8Array)]).toEqual([9, 8, 7]);
        expect(bytes.headers["x-request-id"]).toBe("abc");

        const bad = await client.get(endpoint("/bad-json", { baseUrl: base, timeout: 1000 })).catch((err) => err);
        expect(bad).toBeInstanceOf(HttpError);
        expect(bad.status).toBe(502);
        expect(bad.body).toBe("{");
    });

    it("parses success bodies by content type, including 204 and HEAD", async () => {
        const base = await listen((req, res) => {
            if (req.method === "HEAD") {
                res.writeHead(200, { "Content-Type": "application/json", "Content-Length": "2" });
                res.end();
                return;
            }
            if (req.url === "/json") {
                res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
                res.end(JSON.stringify({ ok: true }));
                return;
            }
            if (req.url === "/plus") {
                res.writeHead(200, { "Content-Type": "application/vnd.custom+json" });
                res.end(JSON.stringify({ plus: 1 }));
                return;
            }
            if (req.url === "/text") {
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end("<p>hi</p>");
                return;
            }
            if (req.url === "/bytes") {
                res.writeHead(200, { "Content-Type": "application/octet-stream" });
                res.end(Buffer.from([4, 5]));
                return;
            }
            if (req.url === "/empty") {
                res.writeHead(204, { "Content-Type": "application/json" });
                res.end();
                return;
            }
            if (req.url === "/reset") {
                res.writeHead(205);
                res.end();
                return;
            }
            if (req.url === "/sniff") {
                res.writeHead(200);
                res.end(JSON.stringify({ sniffed: true }));
                return;
            }
            if (req.url === "/sniff-text") {
                res.writeHead(200);
                res.end("plain");
                return;
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end("{");
        });

        await expect(client.get(endpoint("/json", { baseUrl: base, timeout: 1000 }))).resolves.toEqual({ ok: true });
        await expect(client.get(endpoint("/plus", { baseUrl: base, timeout: 1000 }))).resolves.toEqual({ plus: 1 });
        await expect(client.get(endpoint("/text", { baseUrl: base, timeout: 1000 }))).resolves.toBe("<p>hi</p>");
        const bytes = await client.get(endpoint("/bytes", { baseUrl: base, timeout: 1000 }));
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect([...(bytes as Uint8Array)]).toEqual([4, 5]);
        await expect(client.get(endpoint("/empty", { baseUrl: base, timeout: 1000 }))).resolves.toBeUndefined();
        await expect(client.delete(endpoint("/reset", { baseUrl: base, timeout: 1000 }))).resolves.toBeUndefined();
        await expect(client.head(endpoint("/json", { baseUrl: base, timeout: 1000 }))).resolves.toBeUndefined();
        await expect(client.get(endpoint("/sniff", { baseUrl: base, timeout: 1000 }))).resolves.toEqual({
            sniffed: true,
        });
        await expect(client.get(endpoint("/sniff-text", { baseUrl: base, timeout: 1000 }))).resolves.toBe("plain");
        const badJson = await client.get(endpoint("/bad", { baseUrl: base, timeout: 1000 })).catch((err) => err);
        expect(badJson).toBeInstanceOf(SyntaxError);
        expect(badJson).not.toBeInstanceOf(HttpError);
    });

    it("encodes request bodies and forwards Idempotency-Key once", async () => {
        const seen: Array<{ method: string; type: string; body: string; key: string }> = [];
        const base = await listen(async (req, res) => {
            const body = await readBody(req);
            seen.push({
                method: req.method ?? "",
                type: String(req.headers["content-type"] ?? ""),
                body: body.toString("utf8"),
                key: String(req.headers["idempotency-key"] ?? ""),
            });
            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ n: seen.length }));
        });

        await client.post(
            endpoint("/items", {
                baseUrl: base,
                timeout: 1000,
                headers: { "Idempotency-Key": "key-1", "content-type": "application/json; charset=utf-8" },
            }),
            { name: "widget" },
        );
        await client.post(endpoint("/items", { baseUrl: base, timeout: 1000 }), "hello");
        await client.put(endpoint("/items", { baseUrl: base, timeout: 1000 }), new Uint8Array([1, 2]));
        await client.patch(endpoint("/items", { baseUrl: base, timeout: 1000 }), null);

        expect(seen.map((entry) => entry.method)).toEqual(["POST", "POST", "PUT", "PATCH"]);
        expect(seen[0]).toMatchObject({
            type: "application/json; charset=utf-8",
            body: JSON.stringify({ name: "widget" }),
            key: "key-1",
        });
        expect(seen[1]).toMatchObject({ type: "text/plain; charset=utf-8", body: "hello", key: "" });
        expect(seen[2]?.type).toBe("application/octet-stream");
        expect(Buffer.from(seen[2]?.body ?? "", "utf8").equals(Buffer.from([1, 2]))).toBe(true);
        expect(seen[3]).toMatchObject({ type: "application/json", body: "null" });
    });

    it("does not retry a failed response, a timeout, or a connection failure", async () => {
        let hits = 0;
        const base = await listen((req, res) => {
            hits += 1;
            if (req.url === "/hang") {
                req.on("close", () => {
                    if (!res.writableEnded) {
                        res.end();
                    }
                });
                return;
            }
            res.writeHead(503, { "Content-Type": "text/plain" });
            res.end("down");
        });

        const httpError = await client.get(endpoint("/down", { baseUrl: base, timeout: 1000 })).catch((err) => err);
        expect(httpError).toBeInstanceOf(HttpError);
        expect(httpError.status).toBe(503);
        expect(hits).toBe(1);

        const timed = await client.get(endpoint("/hang", { baseUrl: base, timeout: 40 })).catch((err) => err);
        expect(timed).toBeInstanceOf(TimeoutError);
        expect(hits).toBe(2);

        const closed = http.createServer();
        await new Promise<void>((resolve, reject) => {
            closed.listen(0, "127.0.0.1", () => resolve());
            closed.once("error", reject);
        });
        const address = closed.address();
        if (!address || typeof address === "string") {
            throw new Error("Expected TCP address");
        }
        await new Promise<void>((resolve, reject) => {
            closed.close((error) => (error ? reject(error) : resolve()));
        });

        const network = await client
            .get(endpoint("/", { baseUrl: `http://127.0.0.1:${address.port}`, timeout: 1000 }))
            .catch((err) => err);
        expect(network).toBeInstanceOf(NetworkError);
        expect(network.code).toBe("NETWORK");
        expect(network).not.toBeInstanceOf(HttpError);
        expect(network).not.toBeInstanceOf(TimeoutError);
        expect(network).not.toBeInstanceOf(AbortError);
        expect(hits).toBe(2);
    });

    it("applies client baseUrl and headers, with the call winning", async () => {
        let seen = { url: "", app: "", auth: "" };
        const base = await listen((req, res) => {
            seen = {
                url: req.url ?? "",
                app: String(req.headers["x-app"] ?? ""),
                auth: String(req.headers.authorization ?? ""),
            };
            res.writeHead(204);
            res.end();
        });

        const api = createClient({
            baseUrl: `${base}/api/v1`,
            headers: { "X-App": "seltzer", Authorization: "Bearer old" },
            timeout: 1000,
        });
        await api.get(
            endpoint("users", {
                headers: { Authorization: "Bearer next" },
            }),
        );
        expect(seen).toEqual({ url: "/api/v1/users", app: "seltzer", auth: "Bearer next" });
    });

    it("has no undici dependency and does not import it", () => {
        const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
        const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
            dependencies?: Record<string, string>;
            peerDependencies?: Record<string, string>;
            peerDependenciesMeta?: Record<string, unknown>;
            engines?: { node?: string };
        };
        expect(pkg.dependencies ?? {}).toEqual({});
        expect(pkg.peerDependencies ?? {}).toEqual({});
        expect(pkg.peerDependenciesMeta ?? {}).toEqual({});
        expect(pkg.engines?.node).toBe(">=18");

        const src = path.join(root, "src");
        const offenders = sourceFiles(src).filter((file) => {
            if (file.endsWith(".test.ts")) {
                return false;
            }
            return readFileSync(file, "utf8").includes("undici");
        });
        expect(offenders).toEqual([]);
    });
});
