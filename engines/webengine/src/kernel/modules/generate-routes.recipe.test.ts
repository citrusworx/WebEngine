import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listApiOperations, loadYaml } from "@citrusworx/nectarine";
import {
    Seltzer,
    UnboundOperationsError,
    generateRoutes,
    response,
    validationError,
    type ExecuteArgs,
} from "@citrusworx/seltzer";
import { afterEach, describe, expect, it } from "vitest";
import {
    nectarineApiOperationMatchesSeltzer,
    routesFromListApiOperations,
} from "./api-operation-assignability.js";

const productApiPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "__fixtures__",
    "generate-routes",
    "productAPI.yml",
);

type Payload = {
    id: string;
    name: string;
    catalog?: string;
};

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

function loadProductOperations() {
    return listApiOperations("product", loadYaml(productApiPath));
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function payloadFrom(body: unknown): Payload {
    const record = isRecord(body) ? body : {};
    const payload: Payload = {
        id: String(record.id),
        name: String(record.name),
    };
    if (typeof record.catalog === "string") {
        payload.catalog = record.catalog;
    }
    return payload;
}

function catalogHandlers(documents: Payload[]) {
    return {
        allProducts: () => documents.map((doc) => ({ ...doc })),
        productsByCatalog: ({ params }: ExecuteArgs) =>
            documents
                .filter((doc) => doc.catalog === params.catalog)
                .map((doc) => ({ ...doc })),
        productById: ({ params }: ExecuteArgs) =>
            documents.find((doc) => doc.id === params.id) ?? null,
        countPayloads: () => ({ count: documents.length }),
        newProduct: ({ body }: ExecuteArgs) => {
            const payload = payloadFrom(body);
            documents.push(payload);
            return response({
                status: 201,
                body: { id: payload.id, payload: { ...payload } },
            });
        },
        updateProduct: ({ params, body }: ExecuteArgs) => {
            const existing = documents.find((doc) => doc.id === params.id);
            if (!existing) {
                return null;
            }
            const record = isRecord(body) ? body : {};
            if (typeof record.name === "string") {
                existing.name = record.name;
            }
            if (typeof record.catalog === "string") {
                existing.catalog = record.catalog;
            }
            return { id: existing.id, payload: { ...existing } };
        },
        deleteProduct: ({ params }: ExecuteArgs) => {
            const index = documents.findIndex((doc) => doc.id === params.id);
            if (index < 0) {
                return null;
            }
            documents.splice(index, 1);
            return response({ status: 204 });
        },
    };
}

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

async function request(
    url: string,
    init?: RequestInit,
): Promise<{ status: number; allow: string | null; text: string; json: unknown }> {
    const res = await fetch(url, init);
    const text = await res.text();
    return {
        status: res.status,
        allow: res.headers.get("allow"),
        text,
        json: text ? JSON.parse(text) : undefined,
    };
}

describe("Nectarine ApiOperation → Seltzer ApiOperation", () => {
    it("is the same structure, and listApiOperations is accepted by generateRoutes", () => {
        expect(nectarineApiOperationMatchesSeltzer).toBe(true);

        const operations = loadProductOperations();
        const routes = routesFromListApiOperations("product", loadYaml(productApiPath));
        expect(routes.map((route) => route.contract?.name).sort()).toEqual(
            operations.map((operation) => operation.name).sort(),
        );
    });
});

describe("productAPI.yml → listApiOperations → generateRoutes → listen", () => {
    it("serves reads, JSONB-shaped writes, 404, 405, and .required 400", async () => {
        const operations = loadProductOperations();
        expect(operations.map((operation) => operation.query)).toEqual([
            "allProducts",
            "payloadsByCatalog",
            "payloadById",
            "countPayloads",
            "insertPayload",
            "updatePayload",
            "deleteProduct",
        ]);

        const documents: Payload[] = [];
        const app = Seltzer.init();
        for (const route of generateRoutes(operations, {
            handlers: catalogHandlers(documents),
        })) {
            app.route(route);
        }

        const base = await listen(app);

        const created = await request(`${base}/api/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: "stinkrat", name: "StinkRat", catalog: "gear" }),
        });
        expect(created.status).toBe(201);
        expect(created.json).toEqual({
            id: "stinkrat",
            payload: { id: "stinkrat", name: "StinkRat", catalog: "gear" },
        });

        const listed = await request(`${base}/api/products`);
        expect(listed).toMatchObject({
            status: 200,
            json: [{ id: "stinkrat", name: "StinkRat", catalog: "gear" }],
        });

        const byCatalog = await request(`${base}/api/products/catalog/gear`);
        expect(byCatalog.status).toBe(200);
        expect(byCatalog.json).toEqual([
            { id: "stinkrat", name: "StinkRat", catalog: "gear" },
        ]);

        const updated = await request(`${base}/api/products/stinkrat`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "StinkRat 2" }),
        });
        expect(updated).toMatchObject({
            status: 200,
            json: {
                id: "stinkrat",
                payload: { id: "stinkrat", name: "StinkRat 2", catalog: "gear" },
            },
        });

        const byId = await request(`${base}/api/products/stinkrat`);
        expect(byId.json).toEqual({
            id: "stinkrat",
            name: "StinkRat 2",
            catalog: "gear",
        });

        const counted = await request(`${base}/api/products/count`);
        expect(counted.json).toEqual({ count: 1 });

        const removed = await request(`${base}/api/products/stinkrat`, { method: "DELETE" });
        expect(removed.status).toBe(204);
        expect(removed.text).toBe("");

        const missing = await request(`${base}/api/products/stinkrat`);
        expect(missing).toMatchObject({
            status: 404,
            json: { error: "Not found" },
        });

        const unknown = await request(`${base}/api/no-such-path`);
        expect(unknown).toMatchObject({
            status: 404,
            json: { error: "Not Found" },
        });

        const wrongMethod = await request(`${base}/api/products`, { method: "PATCH" });
        expect(wrongMethod.status).toBe(405);
        expect(wrongMethod.allow).toBe("GET, POST");
        expect(wrongMethod.json).toEqual({ error: "Method Not Allowed" });

        const wrongItemMethod = await request(`${base}/api/products/stinkrat`, { method: "PATCH" });
        expect(wrongItemMethod.status).toBe(405);
        expect(wrongItemMethod.allow).toBe("GET, PUT, DELETE");

        const missingName = await request(`${base}/api/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: "daw" }),
        });
        expect(missingName).toMatchObject({
            status: 400,
            json: { error: "Missing required field: name" },
        });
        expect(documents).toEqual([]);
    });

    it("throws at startup listing every unbound operation", () => {
        const operations = loadProductOperations();
        const { countPayloads: _count, deleteProduct: _delete, ...handlers } = catalogHandlers([]);

        expect(() => generateRoutes(operations, { handlers })).toThrow(UnboundOperationsError);

        try {
            generateRoutes(operations, { handlers });
        } catch (error) {
            expect(error).toBeInstanceOf(UnboundOperationsError);
            expect((error as UnboundOperationsError).message).toBe(
                [
                    "Unbound operations:",
                    "countPayloads GET /api/products/count",
                    "deleteProduct DELETE /api/products/:id",
                ].join("\n"),
            );
        }
    });

    it("registers unbound operations as 501 when unbound is notImplemented", async () => {
        const operations = loadProductOperations();
        const handlers = catalogHandlers([]);
        const { countPayloads: _count, ...bound } = handlers;

        const app = Seltzer.init();
        for (const route of generateRoutes(operations, {
            handlers: bound,
            unbound: "notImplemented",
        })) {
            app.route(route);
        }

        const base = await listen(app);
        const count = await request(`${base}/api/products/count`);
        expect(count).toMatchObject({
            status: 501,
            json: { error: "Not Implemented" },
        });

        const list = await request(`${base}/api/products`);
        expect(list).toMatchObject({ status: 200, json: [] });
    });

    it("plugs replace(\"validate\") and leaves the default .required stage off", async () => {
        const operations = loadProductOperations();
        let executed = false;
        const app = Seltzer.init().replace("validate", (ctx) => {
            if (ctx.route?.contract?.name !== "newProduct") {
                return;
            }

            const body = ctx.body;
            if (typeof body !== "object" || body === null || Array.isArray(body)) {
                return validationError([{ path: [], message: "Expected an object" }]);
            }

            const record = body as { id?: unknown; name?: unknown };
            if (typeof record.name !== "string" || record.name.trim() === "") {
                return validationError([{ path: ["name"], message: "Required" }]);
            }
            if (record.name.trim() === "bad") {
                return validationError([{ path: ["name"], message: "Name is not allowed" }]);
            }

            ctx.valid = { body: { id: record.id, name: record.name.trim() } };
        });

        for (const route of generateRoutes(operations, {
            filter: (operation) =>
                operation.name === "newProduct" || operation.name === "allProducts",
            handlers: {
                allProducts: () => [],
                newProduct: ({ ctx }) => {
                    executed = true;
                    return response({ status: 201, body: ctx.valid?.body });
                },
            },
        })) {
            app.route(route);
        }

        const base = await listen(app);
        const rejected = await request(`${base}/api/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: "stinkrat", name: "bad" }),
        });
        expect(rejected).toMatchObject({
            status: 400,
            json: {
                error: "Validation failed",
                issues: [{ path: ["name"], message: "Name is not allowed" }],
            },
        });
        expect(executed).toBe(false);

        const created = await request(`${base}/api/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: "stinkrat", name: "  StinkRat  " }),
        });
        expect(created).toMatchObject({
            status: 201,
            json: { id: "stinkrat", name: "StinkRat" },
        });
        expect(executed).toBe(true);
    });
});
