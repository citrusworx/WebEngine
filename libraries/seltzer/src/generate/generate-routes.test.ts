import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { Seltzer } from "../core/seltzer.js";
import { response, type ResponseData } from "../core/response.js";
import { generateRoutes } from "./generate-routes.js";
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

function readOp(
    name: string,
    path: string,
    query: string,
): ApiOperation {
    return {
        resource: "product",
        crud: "read",
        name,
        method: "GET",
        path,
        query,
    };
}

/** Nectarine `listApiOperations("product", api)` shape — YAML order for product reads. */
const productReadOps: ApiOperation[] = [
    readOp("allProducts", "/api/products", "allProducts"),
    readOp("productsByCatalog", "/api/products/catalog/:catalog", "productsByCatalog"),
    readOp("productById", "/api/products/:id", "productById"),
    readOp("productBySlug", "/api/products/slug/:slug", "productBySlug"),
];

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
            ["GET", "/api/products/catalog/:catalog"],
            ["GET", "/api/products/slug/:slug"],
            ["GET", "/api/products"],
            ["GET", "/api/products/:id"],
        ]);
        expect(routes.map((route) => route.contract)).toEqual([
            { resource: "product", name: "productsByCatalog" },
            { resource: "product", name: "productBySlug" },
            { resource: "product", name: "allProducts" },
            { resource: "product", name: "productById" },
        ]);
    });

    it("registers catalog/slug ahead of :id even when productById is listed first", () => {
        const hostile: ApiOperation[] = [
            readOp("productById", "/api/products/:id", "productById"),
            readOp("productsByCatalog", "/api/products/catalog/:catalog", "productsByCatalog"),
            readOp("productBySlug", "/api/products/slug/:slug", "productBySlug"),
        ];

        expect(generateRoutes(hostile, { execute: executeProductRead }).map((route) => route.path)).toEqual([
            "/api/products/catalog/:catalog",
            "/api/products/slug/:slug",
            "/api/products/:id",
        ]);
    });

    it("does not treat catalog/slug segments as :id", async () => {
        const app = Seltzer.init();
        for (const route of generateRoutes(
            [
                readOp("productById", "/api/products/:id", "productById"),
                readOp("productsByCatalog", "/api/products/catalog/:catalog", "productsByCatalog"),
                readOp("productBySlug", "/api/products/slug/:slug", "productBySlug"),
            ],
            { execute: executeProductRead },
        )) {
            app.route(route);
        }

        const base = await listen(app);
        await expect(request(`${base}/api/products/catalog/software`)).resolves.toEqual({
            status: 200,
            json: [products[1]],
        });
        await expect(request(`${base}/api/products/slug/stink-rat`)).resolves.toEqual({
            status: 200,
            json: products[0],
        });
        await expect(request(`${base}/api/products/stinkrat`)).resolves.toEqual({
            status: 200,
            json: products[0],
        });
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

    it("lets the host customize notFound and pass through branded ResponseData", async () => {
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
                    return response({ status: 418, body: { error: "teapot" } });
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

    it("wraps unbranded ResponseData-shaped payloads as body", async () => {
        const operations: ApiOperation[] = [
            {
                resource: "product",
                crud: "read",
                name: "allProducts",
                method: "GET",
                path: "/api/products",
                query: "allProducts",
            },
        ];

        const app = Seltzer.init();
        for (const route of generateRoutes(operations, {
            execute: () => ({ body: "copy" }),
        })) {
            app.route(route);
        }

        const base = await listen(app);
        await expect(request(`${base}/api/products`)).resolves.toEqual({
            status: 200,
            json: { body: "copy" },
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

    it("copies operation.body onto Route.contract for validate", () => {
        const operations: ApiOperation[] = [
            {
                resource: "waitlist",
                crud: "create",
                name: "joinWaitlist",
                method: "POST",
                path: "/api/waitlist",
                query: "joinWaitlist",
                body: {
                    name: "string",
                    email: "string.required",
                    source_app: "string",
                    interest: "string",
                },
            },
        ];

        const [route] = generateRoutes(operations, { execute: () => ({ ok: true }) });
        expect(route.contract).toEqual({
            resource: "waitlist",
            name: "joinWaitlist",
            body: {
                name: "string",
                email: "string.required",
                source_app: "string",
                interest: "string",
            },
        });
    });

    it("returns 400 when a generated write is missing a .required body field", async () => {
        let executed = false;
        const operations: ApiOperation[] = [
            {
                resource: "waitlist",
                crud: "create",
                name: "joinWaitlist",
                method: "POST",
                path: "/api/waitlist",
                query: "joinWaitlist",
                body: {
                    name: "string",
                    email: "string.required",
                },
            },
        ];

        const app = Seltzer.init();
        for (const route of generateRoutes(operations, {
            execute: () => {
                executed = true;
                return { ok: true };
            },
        })) {
            app.route(route);
        }

        const base = await listen(app);
        const missing = await fetch(`${base}/api/waitlist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Ada" }),
        });
        const present = await fetch(`${base}/api/waitlist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "ada@example.com" }),
        });

        expect(missing.status).toBe(400);
        expect(await missing.json()).toEqual({ error: "Missing required field: email" });
        expect(present.status).toBe(200);
        expect(await present.json()).toEqual({ ok: true });
        expect(executed).toBe(true);
    });
});

const waitlist = [
    { id: "wl_1", name: "Ada", email: "ada@example.com" },
    { id: "wl_2", name: "Bob", email: "bob@example.com" },
];

function waitlistReadOp(name: string, path: string, query: string): ApiOperation {
    return {
        resource: "waitlist",
        crud: "read",
        name,
        method: "GET",
        path,
        query,
    };
}

/** Nectarine `listApiOperations("waitlist", api)` GET ops — YAML order. */
const waitlistReadOps: ApiOperation[] = [
    waitlistReadOp("allEntries", "/api/waitlist", "allEntries"),
    waitlistReadOp("entryByEmail", "/api/waitlist/:email", "entryByEmail"),
];

function executeWaitlistRead({ query, params }: { query?: string; params: Record<string, string> }) {
    switch (query) {
        case "allEntries":
            return waitlist;
        case "entryByEmail":
            return waitlist.find((entry) => entry.email === params.email) ?? null;
        default:
            return null;
    }
}

describe("generateRoutes waitlist reads", () => {
    it("returns GET list and by-email routes without inventing POST join", () => {
        const joinWaitlist: ApiOperation = {
            resource: "waitlist",
            crud: "create",
            name: "joinWaitlist",
            method: "POST",
            path: "/api/waitlist",
            query: "joinWaitlist",
        };

        const routes = generateRoutes([...waitlistReadOps, joinWaitlist], {
            execute: executeWaitlistRead,
            filter: (operation) => operation.crud === "read" && operation.method === "GET",
        });

        expect(routes.map((route) => [route.method, route.path])).toEqual([
            ["GET", "/api/waitlist"],
            ["GET", "/api/waitlist/:email"],
        ]);
        expect(routes.map((route) => route.contract)).toEqual([
            { resource: "waitlist", name: "allEntries" },
            { resource: "waitlist", name: "entryByEmail" },
        ]);
    });

    it("serves allEntries and entryByEmail as ResponseData", async () => {
        const app = Seltzer.init();
        for (const route of generateRoutes(waitlistReadOps, {
            execute: executeWaitlistRead,
            notFound: (): ResponseData => ({ status: 404, body: { error: "Waitlist entry not found" } }),
        })) {
            app.route(route);
        }

        const base = await listen(app);
        await expect(request(`${base}/api/waitlist`)).resolves.toEqual({
            status: 200,
            json: waitlist,
        });
        await expect(request(`${base}/api/waitlist/${encodeURIComponent("ada@example.com")}`)).resolves.toEqual({
            status: 200,
            json: waitlist[0],
        });
        await expect(request(`${base}/api/waitlist/${encodeURIComponent("missing@example.com")}`)).resolves.toEqual({
            status: 404,
            json: { error: "Waitlist entry not found" },
        });
    });

    it("keeps a hand-written POST join beside generated GET routes", async () => {
        const app = Seltzer.init();
        for (const route of generateRoutes(waitlistReadOps, { execute: executeWaitlistRead })) {
            app.route(route);
        }
        app.route({
            method: "POST",
            path: "/api/waitlist",
            handler: async () => ({ body: { ok: true } }),
        });

        const base = await listen(app);
        const res = await fetch(`${base}/api/waitlist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "ada@example.com" }),
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });
        await expect(request(`${base}/api/waitlist`)).resolves.toEqual({
            status: 200,
            json: waitlist,
        });
    });
});
