import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { loadNectarineConfig } from "@citrusworx/nectarine";
import type { RequestContext } from "@citrusworx/seltzer";
import { afterEach, describe, expect, it } from "vitest";
import { loadKiwiConfigFromPath } from "../../config/index.js";
import { KernelContext } from "../index.js";
import {
    createNectarineModule,
    NECTARINE_MODULE_ID,
    type NectarineKernelAdapter,
    type NectarineModuleHandle,
} from "./nectarine-module.js";
import {
    compileResourceQuery,
    createCompiledNectarineExecute,
    createNectarineReadRoutes,
    createNectarineRoutes,
    createNectarineWriteRoutes,
    createResourceReadRoutes,
    createResourceWriteRoutes,
    isSingularRead,
    isWriteOperation,
    listResourceReadOperations,
    listResourceWriteOperations,
    namedQuerySpec,
    pathBindValues,
    resolveResourceQueries,
    writeBindValues,
    bindJsonbDocument,
} from "./nectarine-routes.js";

const nectarineFixturesRoot = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "__fixtures__",
    "nectarine-project",
);

const tempDirs: string[] = [];

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

function makeTempDir(prefix: string): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    tempDirs.push(dir);
    return dir;
}

function copyNectarineFixture(): string {
    const dir = makeTempDir("webengine-nectarine-routes-");
    fs.cpSync(nectarineFixturesRoot, dir, { recursive: true });
    return dir;
}

function loadFixtureConfig() {
    return loadNectarineConfig(
        path.join(nectarineFixturesRoot, "nectarine.config.yaml"),
    );
}

const completePgEnv = {
    PG_USER: "bw",
    PG_PASS: "secret",
    PG_HOST: "localhost",
    PG_PORT: "5432",
    PG_DB: "blackwater",
};

function createStubAdapter(): NectarineKernelAdapter & {
    sqls: { sql: string; params?: readonly unknown[] }[];
} {
    const sqls: { sql: string; params?: readonly unknown[] }[] = [];
    return {
        sqls,
        async connect() {
            return undefined;
        },
        async disconnect() {
            return undefined;
        },
        async query(sql: string, params?: readonly unknown[]) {
            sqls.push({ sql, params });
            if (/FROM courses\b/i.test(sql)) {
                if (sql.includes("WHERE id = $1")) {
                    return {
                        rows: [
                            {
                                id: params?.[0],
                                title: "Fuzz",
                                status: "published",
                            },
                        ],
                    };
                }
                return {
                    rows: [{ id: "c1", title: "Fuzz", status: "published" }],
                };
            }
            return { rows: [] };
        },
    };
}

/** Class adapter: query/withTransaction read `this.pool` like PgSql / MySQL. */
class ReceiverAdapter implements NectarineKernelAdapter {
    pool: { connected: boolean } | null = { connected: true };
    sqls: { sql: string; params?: readonly unknown[] }[] = [];

    async connect() {
        this.pool = { connected: true };
    }

    async disconnect() {
        this.pool = null;
    }

    async query(sql: string, params?: readonly unknown[]) {
        if (!this.pool) {
            throw new Error(
                "Postgres adapter is not connected. Call connect() before query()",
            );
        }
        this.sqls.push({ sql, params });
        if (/FROM courses\b/i.test(sql) && sql.includes("WHERE id = $1")) {
            return {
                rows: [
                    { id: params?.[0], title: "Fuzz", status: "published" },
                ],
            };
        }
        return { rows: [] };
    }

    async withTransaction<T>(
        work: (
            query: (
                sql: string,
                params?: readonly unknown[],
            ) => Promise<unknown>,
        ) => Promise<T>,
    ): Promise<T> {
        if (!this.pool) {
            throw new Error(
                "Postgres adapter is not connected. Call connect() before withTransaction()",
            );
        }
        return work((sql, params) => this.query(sql, params));
    }
}

function fakeCtx(
    params: Record<string, string> = {},
    body: unknown = undefined,
): RequestContext {
    return {
        params,
        body,
        query: {},
        headers: {},
        method: "GET",
        path: "/",
        req: {} as RequestContext["req"],
        res: {} as RequestContext["res"],
        locals: {},
    };
}

describe("isSingularRead / pathBindValues", () => {
    it("treats unique lookups as singular and collections as lists", () => {
        expect(isSingularRead("byId")).toBe(true);
        expect(isSingularRead("bySlug")).toBe(true);
        expect(isSingularRead("byEmail")).toBe(true);
        expect(isSingularRead("productById")).toBe(true);
        expect(isSingularRead("entryByEmail")).toBe(true);
        expect(isSingularRead("byClient")).toBe(false);
        expect(isSingularRead("byCourse")).toBe(false);
        expect(isSingularRead("allPublished")).toBe(false);
        expect(isSingularRead("byCatalog")).toBe(false);
    });

    it("binds path params in path order", () => {
        expect(
            pathBindValues("/api/courses/:courseId/lessons/:slug", {
                courseId: "fuzz",
                slug: "bias",
            }),
        ).toEqual(["fuzz", "bias"]);
        expect(pathBindValues("/api/courses/:id", { id: "  " })).toBeNull();
        expect(pathBindValues("/api/courses", {})).toEqual([]);
    });
});

describe("createNectarineReadRoutes", () => {
    it("registers GET reads from API.yml and skips writes", () => {
        const nectarine = loadFixtureConfig();
        const routes = createNectarineReadRoutes(nectarine, {
            resources: ["course", "waitlist", "order", "order_item"],
        });

        const keys = routes.map((route) => `${route.method} ${route.path}`);
        expect(keys).toEqual(
            expect.arrayContaining([
                "GET /api/courses",
                "GET /api/courses/:id",
                "GET /api/courses/slug/:slug",
                "GET /api/waitlist",
                "GET /api/waitlist/:email",
                "GET /api/orders/:id",
                "GET /api/orders/catalog/:catalog",
                "GET /api/orders/:orderId/items",
            ]),
        );
        expect(keys).not.toContain("POST /api/courses");
        expect(keys).not.toContain("POST /api/waitlist");
        expect(
            keys.some(
                (key) =>
                    key.startsWith("POST ") ||
                    key.startsWith("PUT ") ||
                    key.startsWith("PATCH "),
            ),
        ).toBe(false);
    });

    it("includes waitlist POST joinWaitlist when asked, with YAML body contract", () => {
        const nectarine = loadFixtureConfig();
        const routes = createNectarineReadRoutes(nectarine, {
            resources: ["waitlist"],
            include: (operation) =>
                operation.method === "POST" &&
                operation.crud === "create" &&
                operation.name === "joinWaitlist",
        });

        expect(routes.map((route) => `${route.method} ${route.path}`)).toEqual([
            "GET /api/waitlist",
            "POST /api/waitlist",
            "GET /api/waitlist/:email",
        ]);

        const join = routes.find(
            (route) => route.method === "POST" && route.path === "/api/waitlist",
        );
        expect(join?.contract).toEqual({
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

    it("ranks static prefixes ahead of :id", () => {
        const nectarine = loadFixtureConfig();
        const routes = createNectarineReadRoutes(nectarine, {
            resources: ["course", "order"],
        });

        const coursePaths = routes
            .filter((route) => route.path.startsWith("/api/courses"))
            .map((route) => route.path);
        expect(coursePaths.indexOf("/api/courses/slug/:slug")).toBeLessThan(
            coursePaths.indexOf("/api/courses/:id"),
        );

        const orderPaths = routes
            .filter((route) => route.path.startsWith("/api/orders"))
            .map((route) => route.path);
        expect(orderPaths.indexOf("/api/orders/catalog/:catalog")).toBeLessThan(
            orderPaths.indexOf("/api/orders/:id"),
        );
    });

    it("honors exclude", () => {
        const nectarine = loadFixtureConfig();
        const routes = createNectarineReadRoutes(nectarine, {
            resources: ["course"],
            exclude: [{ resource: "course", name: "byId" }],
        });
        const keys = routes.map((route) => `${route.method} ${route.path}`);
        expect(keys).toContain("GET /api/courses");
        expect(keys).not.toContain("GET /api/courses/:id");
    });

    it("compiles sibling order_item from the order Queries.yml document", () => {
        const nectarine = loadFixtureConfig();
        const operations = listResourceReadOperations(nectarine, "order_item");
        expect(operations.map((op) => op.name)).toEqual(["byOrder", "newItem"]);
        expect(
            listResourceWriteOperations(nectarine, "order_item").map(
                (op) => `${op.method} ${op.name}`,
            ),
        ).toEqual(["POST newItem"]);
        expect(
            compileResourceQuery(
                resolveResourceQueries(nectarine, "order_item"),
                "order_item",
                "read",
                "byOrder",
            ),
        ).toBe("SELECT * FROM order_items WHERE order_id = $1");
    });
});

describe("compiled execute", () => {
    it("returns empty collections and null unique lookups without a database", async () => {
        const nectarine = loadFixtureConfig();
        const execute = createCompiledNectarineExecute({
            config: nectarine,
            connected: false,
        });
        const routes = createNectarineReadRoutes(nectarine, {
            resources: ["course"],
            execute,
        });

        const all = routes.find(
            (route) => route.method === "GET" && route.path === "/api/courses",
        );
        const byId = routes.find(
            (route) =>
                route.method === "GET" && route.path === "/api/courses/:id",
        );

        await expect(all!.handler(fakeCtx())).resolves.toEqual({ body: [] });
        await expect(byId!.handler(fakeCtx({ id: "missing" }))).resolves.toEqual(
            {
                status: 404,
                body: { error: "Not found" },
            },
        );
    });

    it("compiles YAML and runs adapter.query with path binds", async () => {
        const nectarine = loadFixtureConfig();
        const sqls: { sql: string; params?: readonly unknown[] }[] = [];
        const routes = createNectarineReadRoutes(nectarine, {
            resources: ["course"],
            query: async (sql, params) => {
                sqls.push({ sql, params });
                return { rows: [{ id: "c1", title: "Fuzz" }] };
            },
            connected: true,
        });

        const byId = routes.find(
            (route) =>
                route.method === "GET" && route.path === "/api/courses/:id",
        );
        const all = routes.find(
            (route) => route.method === "GET" && route.path === "/api/courses",
        );

        await expect(byId!.handler(fakeCtx({ id: "c1" }))).resolves.toEqual({
            body: { id: "c1", title: "Fuzz" },
        });
        await expect(all!.handler(fakeCtx())).resolves.toEqual({
            body: [{ id: "c1", title: "Fuzz" }],
        });

        expect(sqls[0]).toEqual({
            sql: "SELECT * FROM courses WHERE id = $1",
            params: ["c1"],
        });
        expect(sqls[1]?.sql).toMatch(/^SELECT \* FROM courses/);
        expect(sqls[1]?.sql).not.toMatch(/\bWHERE id = \$1\b/);
    });

    it("createResourceReadRoutes forwards a host execute", async () => {
        const nectarine = loadFixtureConfig();
        const routes = createResourceReadRoutes(
            nectarine,
            "course",
            async () => ({ host: true }),
        );
        const all = routes.find(
            (route) => route.method === "GET" && route.path === "/api/courses",
        );
        await expect(all!.handler(fakeCtx())).resolves.toEqual({
            body: { host: true },
        });
    });
});

describe("createNectarineWriteRoutes", () => {
    it("registers YAML writes and skips GET reads", () => {
        const nectarine = loadFixtureConfig();
        const routes = createNectarineWriteRoutes(nectarine, {
            resources: ["course", "order", "order_item", "waitlist", "product"],
        });
        const keys = routes.map((route) => `${route.method} ${route.path}`);
        expect(keys).toEqual(
            expect.arrayContaining([
                "POST /api/courses",
                "PUT /api/courses/:id",
                "DELETE /api/courses/:id",
                "POST /api/orders",
                "PATCH /api/orders/:id/status",
                "POST /api/orders/:orderId/items",
                "POST /api/waitlist",
                "POST /api/products",
                "PUT /api/products/:id",
                "DELETE /api/products/:id",
            ]),
        );
        expect(keys.some((key) => key.startsWith("GET "))).toBe(false);
        expect(
            routes.find(
                (route) =>
                    route.method === "POST" && route.path === "/api/waitlist",
            )?.contract?.name,
        ).toBe("joinWaitlist");
    });

    it("honors exclude for JSONB / join specials", () => {
        const nectarine = loadFixtureConfig();
        const routes = createNectarineWriteRoutes(nectarine, {
            resources: ["course", "waitlist"],
            exclude: [{ resource: "waitlist", name: "joinWaitlist" }],
        });
        const keys = routes.map((route) => `${route.method} ${route.path}`);
        expect(keys).toContain("POST /api/courses");
        expect(keys).not.toContain("POST /api/waitlist");
    });

    it("createNectarineRoutes without methods includes reads and writes", () => {
        const nectarine = loadFixtureConfig();
        const routes = createNectarineRoutes(nectarine, {
            resources: ["course"],
        });
        const keys = routes.map((route) => `${route.method} ${route.path}`);
        expect(keys).toEqual(
            expect.arrayContaining([
                "GET /api/courses",
                "POST /api/courses",
                "PUT /api/courses/:id",
                "DELETE /api/courses/:id",
            ]),
        );
    });
});

describe("writeBindValues", () => {
    it("binds create columns from body, including camelCase path params", () => {
        const nectarine = loadFixtureConfig();
        const item = listResourceWriteOperations(nectarine, "order_item")[0];
        const spec = namedQuerySpec(
            resolveResourceQueries(nectarine, "order_item"),
            "order_item",
            "create",
            "newItem",
        );
        expect(
            writeBindValues(
                item,
                { orderId: "ord-1" },
                { id: "it-1", product_id: "p1", quantity: 2 },
                spec,
            ),
        ).toEqual(["it-1", "ord-1", "p1", 2]);
    });

    it("binds update SET from body then path id (compiler remap)", () => {
        const nectarine = loadFixtureConfig();
        const update = listResourceWriteOperations(nectarine, "course").find(
            (operation) => operation.name === "updateCourse",
        );
        const spec = namedQuerySpec(
            resolveResourceQueries(nectarine, "course"),
            "course",
            "update",
            "updateCourse",
        );
        expect(
            writeBindValues(
                update!,
                { id: "c1" },
                { slug: "fuzz", title: "Fuzz", line: "gear", status: "published" },
                spec,
            ),
        ).toEqual(["fuzz", "Fuzz", "gear", "published", "c1"]);
    });

    it("leaves waitlist join id null when the host does not send one", () => {
        const nectarine = loadFixtureConfig();
        const join = listResourceWriteOperations(nectarine, "waitlist").find(
            (operation) => operation.name === "joinWaitlist",
        );
        expect(isWriteOperation(join!)).toBe(true);
        const spec = namedQuerySpec(
            resolveResourceQueries(nectarine, "waitlist"),
            "waitlist",
            "create",
            "joinWaitlist",
        );
        expect(
            writeBindValues(
                join!,
                {},
                { name: "Ada", email: "ada@example.com", source_app: "www" },
                spec,
            ),
        ).toEqual([null, "Ada", "ada@example.com", "www", null]);
    });

    it("binds JSONB document writes from the HTTP body and skips { fn: now }", () => {
        const nectarine = loadFixtureConfig();
        const writes = listResourceWriteOperations(nectarine, "product");
        const insert = writes.find((operation) => operation.name === "newProduct");
        const update = writes.find((operation) => operation.name === "updateProduct");
        const remove = writes.find((operation) => operation.name === "deleteProduct");
        const document = { id: "fuzz", name: "Fuzz Face", catalog: "gear" };

        expect(insert?.status).toBe(201);
        expect(
            writeBindValues(
                insert!,
                {},
                document,
                namedQuerySpec(
                    resolveResourceQueries(nectarine, "product"),
                    "product",
                    "create",
                    "insertPayload",
                ),
            ),
        ).toEqual(["fuzz", bindJsonbDocument(document)]);
        expect(
            writeBindValues(
                update!,
                { id: "fuzz" },
                document,
                namedQuerySpec(
                    resolveResourceQueries(nectarine, "product"),
                    "product",
                    "update",
                    "updatePayload",
                ),
            ),
        ).toEqual([bindJsonbDocument(document), "fuzz"]);
        expect(writeBindValues(remove!, { id: "fuzz" }, undefined)).toEqual([
            "fuzz",
        ]);
    });
});

describe("compiled write execute", () => {
    it("returns 404 without a database", async () => {
        const nectarine = loadFixtureConfig();
        const routes = createNectarineWriteRoutes(nectarine, {
            resources: ["course"],
            connected: false,
        });
        const create = routes.find(
            (route) => route.method === "POST" && route.path === "/api/courses",
        );
        await expect(
            create!.handler(
                fakeCtx({}, { id: "c1", title: "Fuzz", slug: "fuzz" }),
            ),
        ).resolves.toEqual({
            status: 404,
            body: { error: "Not found" },
        });
    });

    it("compiles YAML and runs adapter.query for POST/PUT/DELETE", async () => {
        const nectarine = loadFixtureConfig();
        const sqls: { sql: string; params?: readonly unknown[] }[] = [];
        const routes = createNectarineWriteRoutes(nectarine, {
            resources: ["course"],
            query: async (sql, params) => {
                sqls.push({ sql, params });
                if (/^INSERT /i.test(sql)) {
                    return {
                        rows: [
                            {
                                id: params?.[0],
                                slug: params?.[1],
                                title: params?.[2],
                                line: params?.[3],
                                status: params?.[4],
                            },
                        ],
                    };
                }
                return { rows: [], rowCount: 1 };
            },
            connected: true,
        });

        const create = routes.find(
            (route) => route.method === "POST" && route.path === "/api/courses",
        );
        const update = routes.find(
            (route) =>
                route.method === "PUT" && route.path === "/api/courses/:id",
        );
        const remove = routes.find(
            (route) =>
                route.method === "DELETE" &&
                route.path === "/api/courses/:id",
        );

        await expect(
            create!.handler(
                fakeCtx(
                    {},
                    {
                        id: "c1",
                        slug: "fuzz",
                        title: "Fuzz",
                        line: "gear",
                        status: "published",
                    },
                ),
            ),
        ).resolves.toEqual({
            body: {
                id: "c1",
                slug: "fuzz",
                title: "Fuzz",
                line: "gear",
                status: "published",
            },
        });
        await expect(
            update!.handler(
                fakeCtx(
                    { id: "c1" },
                    {
                        slug: "fuzz",
                        title: "Fuzz",
                        line: "gear",
                        status: "draft",
                    },
                ),
            ),
        ).resolves.toEqual({ body: { ok: true, rowCount: 1 } });
        await expect(
            remove!.handler(fakeCtx({ id: "c1" })),
        ).resolves.toEqual({ body: { ok: true, rowCount: 1 } });

        expect(sqls[0]).toEqual({
            sql: "INSERT INTO courses (id, slug, title, line, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, slug, title, line, status",
            params: ["c1", "fuzz", "Fuzz", "gear", "published"],
        });
        expect(sqls[1]).toEqual({
            sql: "UPDATE courses SET slug = $1, title = $2, line = $3, status = $4 WHERE id = $5",
            params: ["fuzz", "Fuzz", "gear", "draft", "c1"],
        });
        expect(sqls[2]).toEqual({
            sql: "DELETE FROM courses WHERE id = $1",
            params: ["c1"],
        });
    });

    it("compiles PATCH status and sibling order_item create", async () => {
        const nectarine = loadFixtureConfig();
        const sqls: { sql: string; params?: readonly unknown[] }[] = [];
        const routes = createNectarineWriteRoutes(nectarine, {
            resources: ["order", "order_item"],
            query: async (sql, params) => {
                sqls.push({ sql, params });
                return { rows: [{ id: params?.[0] }], rowCount: 1 };
            },
            connected: true,
        });

        const patch = routes.find(
            (route) =>
                route.method === "PATCH" &&
                route.path === "/api/orders/:id/status",
        );
        const item = routes.find(
            (route) =>
                route.method === "POST" &&
                route.path === "/api/orders/:orderId/items",
        );

        await patch!.handler(fakeCtx({ id: "ord-1" }, { status: "paid" }));
        await item!.handler(
            fakeCtx(
                { orderId: "ord-1" },
                { id: "it-1", product_id: "p1", quantity: 2 },
            ),
        );

        expect(sqls[0]).toEqual({
            sql: "UPDATE orders SET status = $1 WHERE id = $2",
            params: ["paid", "ord-1"],
        });
        expect(sqls[1]?.sql).toMatch(/^INSERT INTO order_items/);
        expect(sqls[1]?.params).toEqual(["it-1", "ord-1", "p1", 2]);
    });

    it("createResourceWriteRoutes forwards a host execute", async () => {
        const nectarine = loadFixtureConfig();
        const routes = createResourceWriteRoutes(
            nectarine,
            "waitlist",
            async () => ({ ok: true, duplicate: false }),
        );
        const join = routes.find(
            (route) => route.method === "POST" && route.path === "/api/waitlist",
        );
        await expect(join!.handler(fakeCtx({}, { email: "a@b.c" }))).resolves.toEqual({
            body: { ok: true, duplicate: false },
        });
    });

    it("compiles JSONB document POST/PUT/DELETE without a host execute", async () => {
        const nectarine = loadFixtureConfig();
        const sqls: { sql: string; params?: readonly unknown[] }[] = [];
        const document = { id: "fuzz", name: "Fuzz Face", catalog: "gear" };
        const routes = createNectarineWriteRoutes(nectarine, {
            resources: ["product"],
            query: async (sql, params) => {
                sqls.push({ sql, params });
                if (/^INSERT /i.test(sql)) {
                    return { rows: [{ payload: document }] };
                }
                return { rows: [], rowCount: 1 };
            },
            connected: true,
        });

        const create = routes.find(
            (route) => route.method === "POST" && route.path === "/api/products",
        );
        const update = routes.find(
            (route) =>
                route.method === "PUT" && route.path === "/api/products/:id",
        );
        const remove = routes.find(
            (route) =>
                route.method === "DELETE" &&
                route.path === "/api/products/:id",
        );

        expect(create?.contract?.status).toBe(201);
        await expect(create!.handler(fakeCtx({}, document))).resolves.toEqual({
            status: 201,
            body: document,
        });
        await expect(
            update!.handler(fakeCtx({ id: "fuzz" }, document)),
        ).resolves.toEqual({ body: { ok: true, rowCount: 1 } });
        await expect(remove!.handler(fakeCtx({ id: "fuzz" }))).resolves.toEqual({
            body: { ok: true, rowCount: 1 },
        });

        expect(sqls[0]).toEqual({
            sql: "INSERT INTO products (id, payload) VALUES ($1, $2::jsonb) RETURNING payload",
            params: ["fuzz", bindJsonbDocument(document)],
        });
        expect(sqls[1]).toEqual({
            sql: "UPDATE products SET payload = $1::jsonb, updated_at = NOW() WHERE id = $2",
            params: [bindJsonbDocument(document), "fuzz"],
        });
        expect(sqls[2]).toEqual({
            sql: "DELETE FROM products WHERE id = $1",
            params: ["fuzz"],
        });
    });

    it("compiles write queries from YAML without host SQL", () => {
        const nectarine = loadFixtureConfig();
        expect(
            compileResourceQuery(
                resolveResourceQueries(nectarine, "course"),
                "course",
                "create",
                "newCourse",
            ),
        ).toMatch(/^INSERT INTO courses /);
        expect(
            compileResourceQuery(
                resolveResourceQueries(nectarine, "course"),
                "course",
                "update",
                "updateCourse",
            ),
        ).toMatch(/^UPDATE courses SET /);
        expect(
            compileResourceQuery(
                resolveResourceQueries(nectarine, "course"),
                "course",
                "delete",
                "deleteCourse",
            ),
        ).toBe("DELETE FROM courses WHERE id = $1");
        expect(
            compileResourceQuery(
                resolveResourceQueries(nectarine, "product"),
                "product",
                "create",
                "insertPayload",
            ),
        ).toBe(
            "INSERT INTO products (id, payload) VALUES ($1, $2::jsonb) RETURNING payload",
        );
        expect(
            compileResourceQuery(
                resolveResourceQueries(nectarine, "product"),
                "product",
                "update",
                "updatePayload",
            ),
        ).toBe(
            "UPDATE products SET payload = $1::jsonb, updated_at = NOW() WHERE id = $2",
        );
    });
});

describe("kernel handle createReadRoutes", () => {
    it("is registered on the nectarine handle and uses adapter.query", async () => {
        const project = copyNectarineFixture();
        const loaded = await loadKiwiConfigFromPath(
            path.join(project, "kiwi.config.toml"),
        );
        const ctx = new KernelContext(loaded.config, loaded.projectRoot);
        const adapter = createStubAdapter();
        const mod = createNectarineModule({
            env: completePgEnv,
            adapter,
        });
        await mod.bootstrap(ctx);
        const handle = ctx.getModuleHandle<NectarineModuleHandle>(
            NECTARINE_MODULE_ID,
        );
        expect(handle?.createReadRoutes).toEqual(expect.any(Function));

        const routes = handle!.createReadRoutes({ resources: ["course"] });
        const byId = routes.find(
            (route) =>
                route.method === "GET" && route.path === "/api/courses/:id",
        );
        await expect(byId!.handler(fakeCtx({ id: "c1" }))).resolves.toEqual({
            body: { id: "c1", title: "Fuzz", status: "published" },
        });
        expect(
            adapter.sqls.some(
                (entry) =>
                    /FROM courses\b/i.test(entry.sql) &&
                    Array.isArray(entry.params) &&
                    entry.params[0] === "c1",
            ),
        ).toBe(true);

        await mod.shutdown?.(ctx);
    });

    it("keeps class adapter.query bound so compiled reads see this.pool", async () => {
        const project = copyNectarineFixture();
        const loaded = await loadKiwiConfigFromPath(
            path.join(project, "kiwi.config.toml"),
        );
        const ctx = new KernelContext(loaded.config, loaded.projectRoot);
        const adapter = new ReceiverAdapter();
        const mod = createNectarineModule({
            env: completePgEnv,
            adapter,
        });
        await mod.bootstrap(ctx);
        const handle = ctx.getModuleHandle<NectarineModuleHandle>(
            NECTARINE_MODULE_ID,
        );

        await expect(
            handle!.query!("SELECT 1", []),
        ).resolves.toEqual({ rows: [] });

        const routes = handle!.createReadRoutes({ resources: ["course"] });
        const byId = routes.find(
            (route) =>
                route.method === "GET" && route.path === "/api/courses/:id",
        );
        await expect(byId!.handler(fakeCtx({ id: "c1" }))).resolves.toEqual({
            body: { id: "c1", title: "Fuzz", status: "published" },
        });

        await mod.shutdown?.(ctx);
    });

    it("registers createWriteRoutes and createRoutes on the handle", async () => {
        const project = copyNectarineFixture();
        const loaded = await loadKiwiConfigFromPath(
            path.join(project, "kiwi.config.toml"),
        );
        const ctx = new KernelContext(loaded.config, loaded.projectRoot);
        const adapter = createStubAdapter();
        const mod = createNectarineModule({
            env: completePgEnv,
            adapter,
        });
        await mod.bootstrap(ctx);
        const handle = ctx.getModuleHandle<NectarineModuleHandle>(
            NECTARINE_MODULE_ID,
        );
        expect(handle?.createWriteRoutes).toEqual(expect.any(Function));
        expect(handle?.createRoutes).toEqual(expect.any(Function));

        const writes = handle!.createWriteRoutes({ resources: ["course"] });
        expect(
            writes.map((route) => `${route.method} ${route.path}`),
        ).toEqual(
            expect.arrayContaining([
                "POST /api/courses",
                "PUT /api/courses/:id",
                "DELETE /api/courses/:id",
            ]),
        );
        expect(
            writes.some((route) => route.method === "GET"),
        ).toBe(false);

        const all = handle!.createRoutes({ resources: ["course"] });
        expect(all.map((route) => route.method)).toEqual(
            expect.arrayContaining(["GET", "POST", "PUT", "DELETE"]),
        );

        await mod.shutdown?.(ctx);
    });
});

describe("compileResourceQuery cache", () => {
    it("does not reuse SQL across distinct loaded query documents", () => {
        const courses = {
            course: {
                read: {
                    byId: {
                        type: "SELECT",
                        table: "courses",
                        fields: "*",
                        where: "id = $1",
                    },
                },
            },
        };
        const other = {
            course: {
                read: {
                    byId: {
                        type: "SELECT",
                        table: "other_courses",
                        fields: "*",
                        where: "id = $1",
                    },
                },
            },
        };

        expect(compileResourceQuery(courses, "course", "read", "byId")).toBe(
            "SELECT * FROM courses WHERE id = $1",
        );
        expect(compileResourceQuery(other, "course", "read", "byId")).toBe(
            "SELECT * FROM other_courses WHERE id = $1",
        );
        expect(compileResourceQuery(courses, "course", "read", "byId")).toBe(
            "SELECT * FROM courses WHERE id = $1",
        );
    });
});

describe("no hard-coded SQL in route helper", () => {
    it("compiles through CCompiler and generateRoutes only", () => {
        const src = fs.readFileSync(
            path.join(
                path.dirname(fileURLToPath(import.meta.url)),
                "nectarine-routes.ts",
            ),
            "utf8",
        );
        expect(src).toContain("generateRoutes");
        expect(src).toContain("CCompiler");
        expect(src).toContain("buildQuery");
        expect(src).not.toMatch(/\bSELECT\b/);
        expect(src).not.toMatch(/\bCREATE TABLE\b/);
        expect(src).not.toMatch(/\bINSERT INTO\b/);
    });
});
