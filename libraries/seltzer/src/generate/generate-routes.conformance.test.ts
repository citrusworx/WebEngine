import { readdirSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Seltzer } from "../core/seltzer.js";
import { STAGE_NAMES } from "../pipeline/index.js";
import { generateRoutes, UnboundOperationsError } from "./generate-routes.js";
import type { ApiOperation } from "./types.js";

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

async function listen(app: Seltzer): Promise<string> {
    const server = app.listen(0, {
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

    expect(address.address).toBe("127.0.0.1");
    return `http://127.0.0.1:${address.port}`;
}

function op(
    name: string,
    method: ApiOperation["method"],
    routePath: string,
    extra: Partial<ApiOperation> = {},
): ApiOperation {
    return {
        resource: "product",
        crud: method === "GET" ? "read" : "create",
        name,
        method,
        path: routePath,
        query: name,
        ...extra,
    };
}

const catalogOps: ApiOperation[] = [
    op("allProducts", "GET", "/api/products"),
    op("newProduct", "POST", "/api/products", {
        crud: "create",
        body: { id: "string.required", name: "string.required" },
    }),
    op("countPayloads", "GET", "/api/products/count"),
];

function walk(dir: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) {
            files.push(...walk(full));
            continue;
        }
        files.push(full);
    }
    return files;
}

describe("generateRoutes bindings", () => {
    it("keeps the pipeline order", () => {
        expect([...STAGE_NAMES]).toEqual([
            "parse",
            "context",
            "route",
            "validate",
            "handle",
            "response",
            "send",
        ]);
    });

    it("does not import Nectarine", () => {
        const src = path.resolve(import.meta.dirname, "..");
        const sources = walk(src).filter((file) => file.endsWith(".ts"));
        const offenders = sources.filter((file) => {
            const text = readFileSync(file, "utf8");
            return (
                /from\s+["']@citrusworx\/nectarine/.test(text) ||
                /import\(\s*["']@citrusworx\/nectarine/.test(text) ||
                /require\(\s*["']@citrusworx\/nectarine/.test(text)
            );
        });

        expect(offenders).toEqual([]);

        const pkg = JSON.parse(
            readFileSync(path.resolve(src, "../package.json"), "utf8"),
        ) as {
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
            peerDependencies?: Record<string, string>;
        };
        expect(pkg.dependencies ?? {}).not.toHaveProperty("@citrusworx/nectarine");
        expect(pkg.devDependencies ?? {}).not.toHaveProperty("@citrusworx/nectarine");
        expect(pkg.peerDependencies ?? {}).not.toHaveProperty("@citrusworx/nectarine");
    });

    it("throws at generation time listing every unbound name, method, and path", () => {
        expect(() =>
            generateRoutes(catalogOps, {
                handlers: {
                    allProducts: () => [],
                },
            }),
        ).toThrow(UnboundOperationsError);

        try {
            generateRoutes(catalogOps, {
                handlers: {
                    allProducts: () => [],
                },
            });
            throw new Error("expected UnboundOperationsError");
        } catch (error) {
            expect(error).toBeInstanceOf(UnboundOperationsError);
            const unbound = error as UnboundOperationsError;
            expect(unbound.message).toBe(
                [
                    "Unbound operations:",
                    "newProduct POST /api/products",
                    "countPayloads GET /api/products/count",
                ].join("\n"),
            );
            expect(unbound.operations.map((operation) => operation.name)).toEqual([
                "newProduct",
                "countPayloads",
            ]);
        }
    });

    it("does not list operations removed by filter", () => {
        const routes = generateRoutes(catalogOps, {
            handlers: {
                allProducts: () => [],
            },
            filter: (operation) => operation.name === "allProducts",
        });

        expect(routes.map((route) => route.path)).toEqual(["/api/products"]);
    });

    it("treats execute as a binding for every operation the handlers map skips", () => {
        const seen: string[] = [];
        const routes = generateRoutes(catalogOps, {
            execute: ({ operation }) => {
                seen.push(`execute:${operation.name}`);
                return { from: "execute" };
            },
            handlers: {
                allProducts: ({ operation }) => {
                    seen.push(`handler:${operation.name}`);
                    return { from: "handler" };
                },
            },
        });

        expect(routes).toHaveLength(3);
        expect(seen).toEqual([]);
    });

    it("lets a named handler win over execute", async () => {
        let executed = false;
        const app = Seltzer.init();
        for (const route of generateRoutes(
            [op("allProducts", "GET", "/api/products")],
            {
                execute: () => {
                    executed = true;
                    return { from: "execute" };
                },
                handlers: {
                    allProducts: () => ({ from: "handler" }),
                },
            },
        )) {
            app.route(route);
        }

        const base = await listen(app);
        const res = await fetch(`${base}/api/products`);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ from: "handler" });
        expect(executed).toBe(false);
    });

    it("rejects an unknown unbound policy before registering routes", () => {
        expect(() =>
            generateRoutes(catalogOps, {
                execute: () => [],
                unbound: "skip" as "throw",
            }),
        ).toThrow(
            'Unknown unbound policy "skip". Expected "throw" or "notImplemented".',
        );
    });

    it("registers unbound operations as 501 when asked, after .required validation", async () => {
        let executed = false;
        const app = Seltzer.init();
        for (const route of generateRoutes(catalogOps, {
            unbound: "notImplemented",
            handlers: {
                allProducts: () => {
                    executed = true;
                    return [{ id: "stinkrat" }];
                },
            },
        })) {
            app.route(route);
        }

        const base = await listen(app);

        const missing = await fetch(`${base}/api/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: "stinkrat" }),
        });
        expect(missing.status).toBe(400);
        expect(await missing.json()).toEqual({ error: "Missing required field: name" });

        const unimplemented = await fetch(`${base}/api/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: "stinkrat", name: "StinkRat" }),
        });
        expect(unimplemented.status).toBe(501);
        expect(await unimplemented.json()).toEqual({ error: "Not Implemented" });

        const count = await fetch(`${base}/api/products/count`);
        expect(count.status).toBe(501);
        expect(await count.json()).toEqual({ error: "Not Implemented" });

        const list = await fetch(`${base}/api/products`);
        expect(list.status).toBe(200);
        expect(await list.json()).toEqual([{ id: "stinkrat" }]);
        expect(executed).toBe(true);
    });
});
