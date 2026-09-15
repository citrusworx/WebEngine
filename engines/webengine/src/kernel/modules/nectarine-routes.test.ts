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
    createResourceReadRoutes,
    isSingularRead,
    listResourceReadOperations,
    pathBindValues,
    resolveResourceQueries,
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
        expect(operations.map((op) => op.name)).toEqual(["byOrder"]);
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
