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

    it("generates POST joinWaitlist with body contract when create is included", () => {
        const joinWaitlist: ApiOperation = {
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
        };

        const routes = generateRoutes([...waitlistReadOps, joinWaitlist], {
            execute: executeWaitlistRead,
            filter: (operation) =>
                operation.method === "GET" ||
                (operation.method === "POST" && operation.name === "joinWaitlist"),
        });

        expect(routes.map((route) => [route.method, route.path])).toEqual([
            ["GET", "/api/waitlist"],
            ["POST", "/api/waitlist"],
            ["GET", "/api/waitlist/:email"],
        ]);
        expect(routes.find((route) => route.method === "POST")?.contract).toEqual({
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

function writeOp(
    name: string,
    method: ApiOperation["method"],
    path: string,
    query: string,
    body?: Record<string, string>,
    status?: number,
): ApiOperation {
    return {
        resource: "product",
        crud: method === "POST" ? "create" : method === "DELETE" ? "delete" : "update",
        name,
        method,
        path,
        query,
        ...(body ? { body } : {}),
        ...(typeof status === "number" ? { status } : {}),
    };
}

const productWriteOps: ApiOperation[] = [
    writeOp("newProduct", "POST", "/api/products", "newProduct", {
        id: "string.required",
        name: "string.required",
    }),
    writeOp("updateProduct", "PUT", "/api/products/:id", "updateProduct"),
    writeOp(
        "updateProductStatus",
        "PATCH",
        "/api/products/:id/status",
        "updateProductStatus",
        { status: "string.required" },
    ),
    writeOp("deleteProduct", "DELETE", "/api/products/:id", "deleteProduct"),
];

describe("generateRoutes writes", () => {
    it("returns POST/PUT/PATCH/DELETE routes and copies body + optional status", () => {
        const created = writeOp(
            "newProduct",
            "POST",
            "/api/products",
            "newProduct",
            { id: "string.required", name: "string.required" },
            201,
        );
        const routes = generateRoutes([created, ...productWriteOps.slice(1)], {
            execute: () => ({ ok: true }),
        });

        expect(routes.map((route) => [route.method, route.path])).toEqual([
            ["PATCH", "/api/products/:id/status"],
            ["POST", "/api/products"],
            ["PUT", "/api/products/:id"],
            ["DELETE", "/api/products/:id"],
        ]);
        expect(routes.find((route) => route.method === "POST")?.contract).toEqual({
            resource: "product",
            name: "newProduct",
            body: { id: "string.required", name: "string.required" },
            status: 201,
        });
        expect(routes.find((route) => route.method === "DELETE")?.contract).toEqual({
            resource: "product",
            name: "deleteProduct",
        });
    });

    it("serves PUT/PATCH/DELETE with path + body and honors operation.status", async () => {
        const catalog = new Map(products.map((product) => [product.id, { ...product }]));
        const operations: ApiOperation[] = [
            writeOp(
                "newProduct",
                "POST",
                "/api/products",
                "newProduct",
                { id: "string.required", name: "string.required" },
                201,
            ),
            writeOp("updateProduct", "PUT", "/api/products/:id", "updateProduct"),
            writeOp(
                "updateProductStatus",
                "PATCH",
                "/api/products/:id/status",
                "updateProductStatus",
                { status: "string.required" },
            ),
            writeOp("deleteProduct", "DELETE", "/api/products/:id", "deleteProduct"),
        ];

        const app = Seltzer.init();
        for (const route of generateRoutes(operations, {
            execute: ({ query, params, body }) => {
                const payload =
                    body && typeof body === "object" && !Array.isArray(body)
                        ? (body as Record<string, unknown>)
                        : {};
                switch (query) {
                    case "newProduct": {
                        const id = String(payload.id ?? "");
                        const created = {
                            id,
                            name: String(payload.name ?? ""),
                            catalog: "gear",
                            slug: id,
                        };
                        catalog.set(id, created);
                        return created;
                    }
                    case "updateProduct": {
                        const existing = catalog.get(params.id);
                        if (!existing) {
                            return null;
                        }
                        const next = { ...existing, ...payload, id: params.id };
                        catalog.set(params.id, next);
                        return next;
                    }
                    case "updateProductStatus": {
                        const existing = catalog.get(params.id);
                        if (!existing) {
                            return null;
                        }
                        const next = {
                            ...existing,
                            catalog: String(payload.status ?? existing.catalog),
                        };
                        catalog.set(params.id, next);
                        return next;
                    }
                    case "deleteProduct":
                        return catalog.delete(params.id) ? { ok: true, id: params.id } : null;
                    default:
                        return null;
                }
            },
        })) {
            app.route(route);
        }

        const base = await listen(app);

        const created = await fetch(`${base}/api/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: "fuzz", name: "Fuzz Face" }),
        });
        expect(created.status).toBe(201);
        expect(await created.json()).toEqual({
            id: "fuzz",
            name: "Fuzz Face",
            catalog: "gear",
            slug: "fuzz",
        });

        const updated = await fetch(`${base}/api/products/stinkrat`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Stink Rat Deluxe" }),
        });
        expect(updated.status).toBe(200);
        expect(await updated.json()).toMatchObject({
            id: "stinkrat",
            name: "Stink Rat Deluxe",
        });

        const patched = await fetch(`${base}/api/products/daw/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "gear" }),
        });
        expect(patched.status).toBe(200);
        expect(await patched.json()).toMatchObject({ id: "daw", catalog: "gear" });

        const missingPatch = await fetch(`${base}/api/products/daw/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        expect(missingPatch.status).toBe(400);

        const deleted = await fetch(`${base}/api/products/daw`, { method: "DELETE" });
        expect(deleted.status).toBe(200);
        expect(await deleted.json()).toEqual({ ok: true, id: "daw" });

        const missing = await fetch(`${base}/api/products/missing`, { method: "DELETE" });
        expect(missing.status).toBe(404);
        expect(await missing.json()).toEqual({ error: "Not found" });
    });
});
