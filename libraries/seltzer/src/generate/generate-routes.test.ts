import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { Seltzer } from "../core/seltzer.js";
import type { ResponseData } from "../core/response.js";
import { generateRoutes } from "./generate-routes.js";
import { listApiOperations } from "./list-api-operations.js";
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

async function request(url: string): Promise<{ status: number; json: unknown }> {
    const res = await fetch(url);
    const text = await res.text();
    return { status: res.status, json: text ? JSON.parse(text) : undefined };
}

const products = [
    { id: "stinkrat", name: "StinkRat", catalog: "gear", slug: "stink-rat" },
    { id: "daw", name: "DAW", catalog: "software", slug: "daw" },
];

const productReadOps = listApiOperations({
    product: {
        read: {
            allProducts: {
                api: { method: "GET", endpoint: "/api/products", query: "allProducts" },
            },
            productsByCatalog: {
                api: {
                    method: "GET",
                    endpoint: "/api/products/catalog/:catalog",
                    query: "productsByCatalog",
                },
            },
            productById: {
                api: { method: "GET", endpoint: "/api/products/:id", query: "productById" },
            },
            productBySlug: {
                api: {
                    method: "GET",
                    endpoint: "/api/products/slug/:slug",
                    query: "productBySlug",
                },
            },
        },
        create: {
            newProduct: {
                api: { method: "POST", endpoint: "/api/products", query: "newProduct" },
            },
        },
    },
}).filter((operation) => operation.crud === "read");

function executeProductRead({ query, params }: { query?: string; params: Record<string, string> }) {
    switch (query) {
        case "allProducts":
            return products;
        case "productsByCatalog":
            return products.filter((product) => product.catalog === params.catalog);
        case "productById":
            return products.find((product) => product.id === params.id) ?? null;
        case "productBySlug":
            return products.find((product) => product.slug === params.slug) ?? null;
        default:
            return null;
    }
}

describe("generateRoutes", () => {
    it("returns object-based Route definitions for the selected operations", () => {
        const routes = generateRoutes(productReadOps, { execute: executeProductRead });

        expect(routes.map((route) => [route.method, route.path])).toEqual([
            ["GET", "/api/products"],
            ["GET", "/api/products/catalog/:catalog"],
            ["GET", "/api/products/:id"],
            ["GET", "/api/products/slug/:slug"],
        ]);
    });

    it("serves list/by-id/catalog/slug reads as ResponseData", async () => {
        const app = Seltzer.init();
        for (const route of generateRoutes(productReadOps, { execute: executeProductRead })) {
            app.route(route);
        }

        const base = await listen(app);

        await expect(request(`${base}/api/products`)).resolves.toEqual({
            status: 200,
            json: products,
        });
        await expect(request(`${base}/api/products/stinkrat`)).resolves.toEqual({
            status: 200,
            json: products[0],
        });
        await expect(request(`${base}/api/products/catalog/software`)).resolves.toEqual({
            status: 200,
            json: [products[1]],
        });
        await expect(request(`${base}/api/products/slug/stink-rat`)).resolves.toEqual({
            status: 200,
            json: products[0],
        });
    });

    it("returns 404 when a by-id read finds nothing", async () => {
        const app = Seltzer.init();
        for (const route of generateRoutes(productReadOps, { execute: executeProductRead })) {
            app.route(route);
        }

        const base = await listen(app);
        await expect(request(`${base}/api/products/missing`)).resolves.toEqual({
            status: 404,
            json: { error: "Not found" },
        });
    });

    it("lets the host customize notFound and pass through ResponseData", async () => {
        const operations: ApiOperation[] = [
            {
                resource: "product",
                crud: "read",
                name: "productById",
                method: "GET",
                path: "/api/products/:id",
                query: "productById",
            },
        ];

        const app = Seltzer.init();
        for (const route of generateRoutes(operations, {
            execute: ({ params }): ResponseData | null => {
                if (params.id === "teapot") {
                    return { status: 418, body: { error: "teapot" } };
                }
                return null;
            },
            notFound: () => ({ status: 404, body: { error: "Product not found" } }),
        })) {
            app.route(route);
        }

        const base = await listen(app);
        await expect(request(`${base}/api/products/missing`)).resolves.toEqual({
            status: 404,
            json: { error: "Product not found" },
        });
        await expect(request(`${base}/api/products/teapot`)).resolves.toEqual({
            status: 418,
            json: { error: "teapot" },
        });
    });

    it("passes params, body, and the named query key to execute", async () => {
        const seen: unknown[] = [];
        const operations: ApiOperation[] = [
            {
                resource: "product",
                crud: "create",
                name: "newProduct",
                method: "POST",
                path: "/api/products",
                query: "newProduct",
            },
        ];

        const app = Seltzer.init();
        for (const route of generateRoutes(operations, {
            execute: (args) => {
                seen.push({
                    resource: args.resource,
                    query: args.query,
                    params: args.params,
                    body: args.body,
                    search: args.ctx.query,
                });
                return { ok: true };
            },
        })) {
            app.route(route);
        }

        const base = await listen(app);
        const res = await fetch(`${base}/api/products?source=test`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "StinkRat" }),
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });
        expect(seen).toEqual([
            {
                resource: "product",
                query: "newProduct",
                params: {},
                body: { name: "StinkRat" },
                search: { source: "test" },
            },
        ]);
    });
});
