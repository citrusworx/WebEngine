import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { loadKiwiConfigFromPath } from "../../config/index.js";
import {
    createBuiltinRegistry,
    KernelContext,
    runKernelLifecycle,
    shutdownKernel,
    topologicalSortModules,
    computeModuleClosure,
} from "../index.js";
import {
    applyNectarineMigrations,
    createNectarineModule,
    NECTARINE_MODULE_ID,
    nectarineModule,
    type NectarineKernelAdapter,
    type NectarineModuleHandle,
} from "./nectarine-module.js";

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
    const dir = makeTempDir("webengine-nectarine-");
    fs.cpSync(nectarineFixturesRoot, dir, { recursive: true });
    return dir;
}

const completePgEnv = {
    PG_USER: "bw",
    PG_PASS: "secret",
    PG_HOST: "localhost",
    PG_PORT: "5432",
    PG_DB: "blackwater",
};

function createStubAdapter(): NectarineKernelAdapter & {
    connects: number;
    disconnects: number;
    sqls: string[];
} {
    const sqls: string[] = [];
    return {
        connects: 0,
        disconnects: 0,
        sqls,
        async connect() {
            this.connects += 1;
        },
        async disconnect() {
            this.disconnects += 1;
        },
        async query(sql: string) {
            sqls.push(sql);
            return { rows: [] };
        },
        async withTransaction(work) {
            return work((sql, params) => this.query!(sql, params));
        },
    };
}

async function contextFromFixture(project: string): Promise<KernelContext> {
    const loaded = await loadKiwiConfigFromPath(
        path.join(project, "kiwi.config.toml"),
    );
    return new KernelContext(loaded.config, loaded.projectRoot);
}

describe("nectarine builtin module", () => {
    it("is registered and sorts after core", () => {
        const registry = createBuiltinRegistry();
        expect(registry.get(NECTARINE_MODULE_ID)).toBe(nectarineModule);
        const closure = computeModuleClosure(["nectarine"], registry);
        const sorted = topologicalSortModules(closure, registry);
        expect(sorted.indexOf("core")).toBeLessThan(
            sorted.indexOf(NECTARINE_MODULE_ID),
        );
    });

    it("loads nectarine.config.yaml and reports healthy on seed fallback", async () => {
        const project = copyNectarineFixture();
        const result = await runKernelLifecycle(project);
        expect(result.sortedModuleIds).toEqual(["core", "nectarine", "web"]);
        expect(result.healthSummary.allOk).toBe(true);
        const handle = result.context.getModuleHandle<NectarineModuleHandle>(
            NECTARINE_MODULE_ID,
        );
        expect(handle?.config.app).toBe("webengine-nectarine-fixture");
        expect(handle?.vendor).toBe("postgres");
        expect(handle?.seedFallback).toBe(true);
        expect(handle?.connected).toBe(false);
        expect(handle?.adapter).toBeNull();
        expect(handle?.listApiOperations("product")).toEqual([
            {
                resource: "product",
                crud: "read",
                name: "allProducts",
                method: "GET",
                path: "/api/products",
                query: "allProducts",
            },
            {
                resource: "product",
                crud: "create",
                name: "newProduct",
                method: "POST",
                path: "/api/products",
                query: "insertPayload",
                status: 201,
                body: {
                    id: "string.required",
                    name: "string.required",
                },
            },
            {
                resource: "product",
                crud: "update",
                name: "updateProduct",
                method: "PUT",
                path: "/api/products/:id",
                query: "updatePayload",
            },
            {
                resource: "product",
                crud: "delete",
                name: "deleteProduct",
                method: "DELETE",
                path: "/api/products/:id",
                query: "deleteProduct",
            },
        ]);
        const nectarineHealth = result.healthSummary.modules.find(
            (m) => m.id === NECTARINE_MODULE_ID,
        );
        expect(nectarineHealth?.ok).toBe(true);
        expect(nectarineHealth?.detail).toMatch(/seed fallback/i);
        await shutdownKernel(result.modulesInOrder, result.context);
    });

    it("treats partial vendor env as a boot error", async () => {
        const project = copyNectarineFixture();
        const ctx = await contextFromFixture(project);
        const mod = createNectarineModule({
            env: { PG_USER: "only-user" },
        });
        await expect(mod.bootstrap(ctx)).rejects.toThrow(/incomplete|Missing/i);
    });

    it("connects, runs applyMigrations on an empty migrations dir, then disconnects", async () => {
        const project = copyNectarineFixture();
        const ctx = await contextFromFixture(project);
        const adapter = createStubAdapter();
        const mod = createNectarineModule({
            env: completePgEnv,
            adapter,
        });

        await mod.bootstrap(ctx);
        const handle = ctx.getModuleHandle<NectarineModuleHandle>(
            NECTARINE_MODULE_ID,
        );
        expect(adapter.connects).toBe(1);
        expect(handle?.connected).toBe(true);
        expect(handle?.seedFallback).toBe(false);
        expect(typeof handle?.query).toBe("function");
        expect(handle?.query).not.toBe(adapter.query);
        expect(handle?.migrations).toEqual({ applied: [], skipped: [] });
        expect(adapter.sqls.length).toBeGreaterThan(0);

        const health = await mod.health(ctx);
        expect(health.ok).toBe(true);
        expect(health.detail).toMatch(/postgres connected/);

        await mod.shutdown?.(ctx);
        expect(adapter.disconnects).toBe(1);
        expect(handle?.connected).toBe(false);
    });

    it("applyNectarineMigrations is a no-op when the migrations directory is missing", async () => {
        const project = copyNectarineFixture();
        const ctx = await contextFromFixture(project);
        const adapter = createStubAdapter();
        const mod = createNectarineModule({
            env: completePgEnv,
            adapter,
        });
        await mod.bootstrap(ctx);
        const handle = ctx.getModuleHandle<NectarineModuleHandle>(
            NECTARINE_MODULE_ID,
        );
        expect(handle?.config).toBeDefined();

        const sqls: string[] = [];
        const result = await applyNectarineMigrations(
            handle!.config,
            {
                query: async (sql) => {
                    sqls.push(sql);
                    return { rows: [] };
                },
            },
            {
                migrationsDir: path.join(
                    project,
                    "does-not-exist-migrations",
                ),
            },
        );
        expect(result).toEqual({ applied: [], skipped: [] });
        expect(sqls.length).toBeGreaterThan(0);
    });

    it("fails boot when nectarine.config.yaml is missing", async () => {
        const dir = makeTempDir("webengine-no-nectarine-");
        fs.writeFileSync(
            path.join(dir, "kiwi.config.toml"),
            `version = "0.1.0"\n\n[kernel]\nmodules = ["core", "nectarine"]\n\n[webengine]\napp_name = "x"\nhost = "localhost"\nport = 1\n`,
            "utf8",
        );
        await expect(runKernelLifecycle(dir)).rejects.toThrow(
            /Nectarine YAML not found/,
        );
    });

    it("refuses seed fallback in production without ALLOW_SEED_FALLBACK", async () => {
        const project = copyNectarineFixture();
        const ctx = await contextFromFixture(project);
        const mod = createNectarineModule({
            env: { NODE_ENV: "production" },
        });
        await expect(mod.bootstrap(ctx)).rejects.toThrow(/incomplete|Missing/i);
    });

    it("binds class-adapter query/withTransaction so applyMigrations keeps instance state", async () => {
        const project = copyNectarineFixture();
        const ctx = await contextFromFixture(project);

        class ClassAdapter implements NectarineKernelAdapter {
            connected = false;
            sqls: string[] = [];
            async connect() {
                this.connected = true;
            }
            async disconnect() {
                this.connected = false;
            }
            async query(sql: string) {
                if (!this.connected) {
                    throw new Error("adapter is not connected");
                }
                this.sqls.push(sql);
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
                if (!this.connected) {
                    throw new Error("adapter is not connected");
                }
                return work((sql, params) => this.query(sql, params));
            }
        }

        const adapter = new ClassAdapter();
        const mod = createNectarineModule({
            env: completePgEnv,
            adapter,
        });

        await mod.bootstrap(ctx);
        const handle = ctx.getModuleHandle<NectarineModuleHandle>(
            NECTARINE_MODULE_ID,
        );
        expect(adapter.sqls.length).toBeGreaterThan(0);
        expect(handle?.migrations).toEqual({ applied: [], skipped: [] });
        await handle!.query!("/* handle query ping */");
        expect(adapter.sqls.at(-1)).toBe("/* handle query ping */");
        await mod.shutdown?.(ctx);
        expect(adapter.connected).toBe(false);
    });

    it("shuts down already-bootstrapped nectarine when a later module fails", async () => {
        const project = copyNectarineFixture();
        fs.rmSync(path.join(project, "webengine.config.json5"));
        const originalShutdown = nectarineModule.shutdown;
        let shutdowns = 0;
        nectarineModule.shutdown = async (ctx) => {
            shutdowns += 1;
            await originalShutdown?.(ctx);
        };
        try {
            await expect(runKernelLifecycle(project)).rejects.toThrow(
                /Web runtime config not readable/,
            );
            expect(shutdowns).toBe(1);
        } finally {
            nectarineModule.shutdown = originalShutdown;
        }
    });

    it("contains no hard-coded SQL", () => {
        const dir = path.dirname(fileURLToPath(import.meta.url));
        for (const file of ["nectarine-module.ts", "nectarine-routes.ts"]) {
            const src = fs.readFileSync(path.join(dir, file), "utf8");
            expect(src, file).not.toMatch(/\bSELECT\b/);
            expect(src, file).not.toMatch(/\bCREATE TABLE\b/);
            expect(src, file).not.toMatch(/\bINSERT INTO\b/);
        }
        const moduleSrc = fs.readFileSync(
            path.join(dir, "nectarine-module.ts"),
            "utf8",
        );
        expect(moduleSrc).toContain("applyMigrations");
        expect(moduleSrc).toContain("loadMigrationDocuments");
        expect(moduleSrc).toContain("createPgAdapterFromConfig");
        expect(moduleSrc).toContain("createReadRoutes");
        expect(moduleSrc).toContain("createWriteRoutes");
    });
});
