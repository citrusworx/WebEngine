import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { ResponseData } from "@citrusworx/seltzer";
import { afterEach, describe, expect, it } from "vitest";
import { loadKiwiConfigFromPath } from "../../config/index.js";
import {
    KernelContext,
    runKernelLifecycle,
    shutdownKernel,
} from "../index.js";
import {
    createNectarineModule,
    NECTARINE_MODULE_ID,
    type NectarineKernelAdapter,
    type NectarineModuleHandle,
} from "./nectarine-module.js";
import {
    defaultNectarineHttpResources,
    resolveSeltzerListenPort,
    serveNectarineHttp,
    startSeltzerFromKernel,
    type SeltzerHttpHandle,
} from "./seltzer-http.js";

const nectarineFixturesRoot = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "__fixtures__",
    "nectarine-project",
);

const projectFixturesRoot = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "__fixtures__",
    "project",
);

const tempDirs: string[] = [];
const httpHandles: SeltzerHttpHandle[] = [];

afterEach(async () => {
    for (const handle of httpHandles.splice(0)) {
        await handle.close().catch(() => undefined);
    }
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
    const dir = makeTempDir("webengine-seltzer-http-");
    fs.cpSync(nectarineFixturesRoot, dir, { recursive: true });
    return dir;
}

function copyProjectFixture(): string {
    const dir = makeTempDir("webengine-seltzer-http-web-");
    fs.cpSync(projectFixturesRoot, dir, { recursive: true });
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

async function request(
    url: string,
    init: RequestInit = {},
): Promise<{ status: number; headers: Headers; json: unknown }> {
    const res = await fetch(url, init);
    const text = await res.text();
    let json: unknown;
    try {
        json = text ? JSON.parse(text) : undefined;
    } catch {
        json = undefined;
    }
    return { status: res.status, headers: res.headers, json };
}

describe("resolveSeltzerListenPort", () => {
    it("prefers options, then kiwi webengine.port, then web runtime network.port", async () => {
        const project = copyNectarineFixture();
        const loaded = await loadKiwiConfigFromPath(
            path.join(project, "kiwi.config.toml"),
        );
        const ctx = new KernelContext(loaded.config, loaded.projectRoot);
        ctx.webRuntime = { network: { port: 4010 } };

        expect(resolveSeltzerListenPort(ctx, 0)).toBe(0);
        expect(resolveSeltzerListenPort(ctx, 3333)).toBe(3333);
        expect(resolveSeltzerListenPort(ctx)).toBe(9091);

        const withoutKiwiPort = new KernelContext(
            {
                ...loaded.config,
                webengine: {
                    ...loaded.config.webengine,
                    port: undefined as unknown as number,
                },
            },
            loaded.projectRoot,
        );
        withoutKiwiPort.webRuntime = { network: { port: 4010 } };
        expect(resolveSeltzerListenPort(withoutKiwiPort)).toBe(4010);
    });
});

describe("startSeltzerFromKernel", () => {
    it("requires a bootstrapped nectarine handle", async () => {
        const project = copyProjectFixture();
        const result = await runKernelLifecycle(project);
        await expect(
            startSeltzerFromKernel(result.context, {
                port: 0,
                onListening: () => undefined,
            }),
        ).rejects.toThrow(/Nectarine module is not bootstrapped/);
        await shutdownKernel(result.modulesInOrder, result.context);
    });

    it("does not listen during kernel bootstrap", async () => {
        const project = copyNectarineFixture();
        const result = await runKernelLifecycle(project);
        expect(result.healthSummary.allOk).toBe(true);
        expect(result.context.getModuleHandle(NECTARINE_MODULE_ID)).toBeDefined();
        const src = fs.readFileSync(
            path.join(
                path.dirname(fileURLToPath(import.meta.url)),
                "nectarine-module.ts",
            ),
            "utf8",
        );
        expect(src).not.toMatch(/\.listen\(/);
        expect(src).not.toMatch(/from "\.\/seltzer-http/);
        await shutdownKernel(result.modulesInOrder, result.context);
    });

    it("listens on an ephemeral port and smokes GET /api/products (seed fallback)", async () => {
        const project = copyNectarineFixture();
        const result = await runKernelLifecycle(project);
        const http = await startSeltzerFromKernel(result, {
            port: 0,
            onListening: () => undefined,
        });
        httpHandles.push(http);

        expect(http.port).toBeGreaterThan(0);
        expect(http.port).not.toBe(9091);
        expect(http.app).toBeDefined();
        expect(http.server.listening).toBe(true);

        const res = await request(`http://127.0.0.1:${http.port}/api/products`);
        expect(res.status).toBe(200);
        expect(res.json).toEqual([]);

        await http.close();
        await shutdownKernel(result.modulesInOrder, result.context);
    });

    it("serveNectarineHttp is the same helper", () => {
        expect(serveNectarineHttp).toBe(startSeltzerFromKernel);
    });

    it("registers extra health routes, CORS, and compiled course reads", async () => {
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
        expect(defaultNectarineHttpResources(handle!)).toEqual([
            "product",
            "course",
            "waitlist",
            "order",
        ]);

        const http = await startSeltzerFromKernel(ctx, {
            port: 0,
            resources: ["course"],
            cors: {
                origin: "http://localhost:5173",
                methods: ["GET", "OPTIONS"],
                headers: ["Content-Type"],
            },
            routes: [
                {
                    method: "GET",
                    path: "/health",
                    handler: (): ResponseData => ({
                        body: { ok: true, service: "nectarine-fixture" },
                    }),
                },
            ],
            onListening: () => undefined,
        });
        httpHandles.push(http);

        const health = await request(`http://127.0.0.1:${http.port}/health`);
        expect(health.status).toBe(200);
        expect(health.json).toEqual({
            ok: true,
            service: "nectarine-fixture",
        });

        const course = await request(
            `http://127.0.0.1:${http.port}/api/courses/c1`,
        );
        expect(course.status).toBe(200);
        expect(course.json).toEqual({
            id: "c1",
            title: "Fuzz",
            status: "published",
        });

        const preflight = await request(
            `http://127.0.0.1:${http.port}/api/courses`,
            {
                method: "OPTIONS",
                headers: { Origin: "http://localhost:5173" },
            },
        );
        expect(preflight.status).toBe(204);
        expect(preflight.headers.get("access-control-allow-origin")).toBe(
            "http://localhost:5173",
        );

        const missing = await request(
            `http://127.0.0.1:${http.port}/api/products`,
        );
        expect(missing.status).toBe(404);

        await http.close();
        await mod.shutdown?.(ctx);
    });

    it("defaults resources from nectarine config apps when listed", async () => {
        const project = copyNectarineFixture();
        const configPath = path.join(project, "nectarine.config.yaml");
        const yaml = fs.readFileSync(configPath, "utf8");
        fs.writeFileSync(
            configPath,
            `${yaml}\napps:\n  - id: studio\n    subdomain: studio\n    resources:\n      - course\n`,
            "utf8",
        );

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
        expect(defaultNectarineHttpResources(handle!)).toEqual(["course"]);

        const http = await startSeltzerFromKernel(ctx, {
            port: 0,
            onListening: () => undefined,
        });
        httpHandles.push(http);

        const courses = await request(
            `http://127.0.0.1:${http.port}/api/courses`,
        );
        expect(courses.status).toBe(200);
        expect(courses.json).toEqual([
            { id: "c1", title: "Fuzz", status: "published" },
        ]);

        const products = await request(
            `http://127.0.0.1:${http.port}/api/products`,
        );
        expect(products.status).toBe(404);

        await http.close();
        await mod.shutdown?.(ctx);
    });

    it("contains no hard-coded SQL and does not invent Express", () => {
        const src = fs.readFileSync(
            path.join(
                path.dirname(fileURLToPath(import.meta.url)),
                "seltzer-http.ts",
            ),
            "utf8",
        );
        expect(src).toContain("Seltzer.init");
        expect(src).toContain("createRoutes");
        expect(src).toContain("listen");
        expect(src).not.toMatch(/\bSELECT\b/);
        expect(src).not.toMatch(/\bexpress\b/i);
        expect(src).not.toContain("nectarine serve");
    });
});
