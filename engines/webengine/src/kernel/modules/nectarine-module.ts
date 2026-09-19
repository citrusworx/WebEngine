import * as path from "node:path";
import {
    applyMigrations,
    listApiOperations,
    loadMigrationDocuments,
    loadNectarineConfig,
    type ApiOperation,
    type DatabaseVendor,
    type MigrationExecutor,
    type MigrationRunResult,
    type NectarineConfig,
    type ProtectedColumn,
} from "@citrusworx/nectarine";
import type { RequestContext, Route } from "@citrusworx/seltzer";
import type { KernelContext, KernelModule } from "../types.js";
import {
    createNectarineHandleReadRoutes,
    createNectarineHandleRoutes,
    createNectarineHandleWriteRoutes,
    type CreateNectarineReadRoutesOptions,
    type CreateNectarineRoutesOptions,
    type CreateNectarineWriteRoutesOptions,
} from "./nectarine-routes.js";

export const NECTARINE_MODULE_ID = "nectarine";

/**
 * Minimal adapter surface the kernel hosts. SQL adapters expose `query`
 * (+ optional `withTransaction`). Mongo uses connect/disconnect only.
 */
export interface NectarineKernelAdapter {
    connect: () => Promise<unknown>;
    disconnect: () => Promise<void>;
    query?: (
        sql: string,
        params?: readonly unknown[],
    ) => Promise<unknown>;
    withTransaction?: <T>(
        work: (
            query: (
                sql: string,
                params?: readonly unknown[],
            ) => Promise<unknown>,
        ) => Promise<T>,
    ) => Promise<T>;
}

export interface NectarineModuleHandle {
    config: NectarineConfig;
    configPath: string;
    vendor: DatabaseVendor;
    adapter: NectarineKernelAdapter | null;
    query?: NectarineKernelAdapter["query"];
    migrations: MigrationRunResult | null;
    seedFallback: boolean;
    connected: boolean;
    /**
     * Flatten loaded `*API.yml` into operations for Seltzer `generateRoutes`.
     * Prefer {@link createReadRoutes} / {@link createWriteRoutes} when the host
     * wants `Route`s; this stays for hosts that compose `generateRoutes`
     * themselves.
     */
    listApiOperations: (resource?: string) => ApiOperation[];
    /**
     * Opt-in Nectarine → Seltzer GET reads. Uses `listApiOperations` plus
     * compiled `*Queries.yml` / adapter `query` unless the host passes
     * `execute`. HTTP listen stays in Seltzer — call this after bootstrap and
     * `app.route(...)`, or `startSeltzerFromKernel`.
     */
    createReadRoutes: <TContext extends RequestContext = RequestContext>(
        options: CreateNectarineReadRoutesOptions<TContext>,
    ) => Route<TContext>[];
    /**
     * Opt-in POST/PUT/PATCH/DELETE from YAML. Same compiled execute as reads;
     * YAML jsonb-cast document writes bind without a host adapter. Pass
     * `execute` for waitlist join (generated id / allowlist) or merge-on-PUT.
     */
    createWriteRoutes: <TContext extends RequestContext = RequestContext>(
        options: CreateNectarineWriteRoutesOptions<TContext>,
    ) => Route<TContext>[];
    /**
     * Unified generator. Omit `methods` for every op on `resources`; pass
     * `methods` / `include` / `exclude` to filter.
     */
    createRoutes: <TContext extends RequestContext = RequestContext>(
        options: CreateNectarineRoutesOptions<TContext>,
    ) => Route<TContext>[];
}

export interface NectarineModuleOptions {
    /** Absolute path, or path relative to the kiwi project root. */
    configPath?: string;
    /** Defaults to `process.env`. Passed into `loadNectarineConfig`. */
    env?: NodeJS.ProcessEnv;
    /** Defaults to `<nectarine config dir>/migrations` (missing dir is a no-op). */
    migrationsDir?: string;
    /**
     * Injected adapter (tests / host stubs). `undefined` uses config-aware
     * factories (`createPgAdapterFromConfig` / mysql / mongo).
     */
    adapter?: NectarineKernelAdapter | null;
    /** Host JSONB/column protection (e.g. Blackwater `products.payload`). */
    protectedColumns?: readonly ProtectedColumn[];
}

function resolveConfigPath(
    projectRoot: string,
    options: NectarineModuleOptions,
    env: NodeJS.ProcessEnv,
): string {
    const fromOption = options.configPath;
    const fromEnv = env.NECTARINE_CONFIG;
    const relative = fromOption ?? fromEnv ?? "nectarine.config.yaml";
    return path.resolve(projectRoot, relative);
}

function hostAllowsSeedFallback(
    config: NectarineConfig,
    env: NodeJS.ProcessEnv,
): boolean {
    if (!config.seedFallback) {
        return false;
    }
    if (env.ALLOW_SEED_FALLBACK === "1") {
        return true;
    }
    return env.NODE_ENV !== "production";
}

/**
 * Flatten one resource or every loaded resource's `*API.yml`.
 * Prefer {@link createNectarineRoutes} when the host wants Seltzer `Route`s.
 */
export function listNectarineApiOperations(
    config: NectarineConfig,
    resource?: string,
): ApiOperation[] {
    if (resource) {
        const loaded = config.getResource(resource);
        return listApiOperations(loaded.name, loaded.api);
    }
    return [...config.resources.values()].flatMap((loaded) =>
        listApiOperations(loaded.name, loaded.api),
    );
}

/**
 * Thin host wrapper around Nectarine `applyMigrations`.
 * Schemas come from loaded `*Schema.yml`; versioned YAML from `migrationsDir`
 * (empty or missing directory is a valid no-op). No SQL in this wrapper.
 */
export async function applyNectarineMigrations(
    config: NectarineConfig,
    execute: MigrationExecutor,
    options: {
        migrationsDir?: string;
        protectedColumns?: readonly ProtectedColumn[];
        tableSchema?: string;
    } = {},
): Promise<MigrationRunResult> {
    const vendor = config.getVendor();
    if (vendor === "mongodb") {
        return { applied: [], skipped: [] };
    }

    const migrationsDir =
        options.migrationsDir ?? path.join(config.rootDir, "migrations");
    const schemas = [...config.resources.values()].map(
        (resource) => resource.schema,
    );
    const migrations = loadMigrationDocuments(migrationsDir);

    return applyMigrations({
        execute,
        vendor: vendor === "mysql" ? "mysql" : "postgres",
        schemas,
        migrations,
        tableSchema: options.tableSchema,
        protectedColumns: options.protectedColumns,
    });
}

async function createAdapterFromConfig(
    config: NectarineConfig,
): Promise<NectarineKernelAdapter | null> {
    const vendor = config.getVendor();
    if (vendor === "postgres") {
        const { createPgAdapterFromConfig } = await import(
            "@citrusworx/nectarine/adapters/pg"
        );
        return createPgAdapterFromConfig(config);
    }
    if (vendor === "mysql") {
        const { createMysqlAdapterFromConfig } = await import(
            "@citrusworx/nectarine/adapters/ms"
        );
        return createMysqlAdapterFromConfig(config);
    }
    const { createMongoAdapterFromConfig } = await import(
        "@citrusworx/nectarine/adapters/mg"
    );
    return createMongoAdapterFromConfig(config);
}

function bindQuery(
    adapter: NectarineKernelAdapter,
): NonNullable<NectarineKernelAdapter["query"]> | undefined {
    if (typeof adapter.query !== "function") {
        return undefined;
    }
    return adapter.query.bind(adapter);
}

/**
 * `applyMigrations` calls `execute.query(...)` as a free function. Class
 * adapters (`PgSql`, `MysqlSql`) keep pool state on `this`, so methods must
 * stay bound to the instance.
 */
function asMigrationExecutor(
    adapter: NectarineKernelAdapter,
): MigrationExecutor | null {
    const query = bindQuery(adapter);
    if (!query) {
        return null;
    }
    return {
        query,
        withTransaction:
            typeof adapter.withTransaction === "function"
                ? adapter.withTransaction.bind(adapter)
                : undefined,
    };
}

export function createNectarineModule(
    options: NectarineModuleOptions = {},
): KernelModule {
    return {
        id: NECTARINE_MODULE_ID,
        dependencies: ["core"],
        async scaffold(_ctx) {
            // v1: hosts own nectarine.config.yaml; no filesystem scaffolding
        },
        async bootstrap(ctx: KernelContext) {
            const env = options.env ?? process.env;
            const configPath = resolveConfigPath(ctx.projectRoot, options, env);
            const config = loadNectarineConfig(configPath, { env });
            const vendor = config.getVendor();
            const status = config.credentialStatus();

            let adapter: NectarineKernelAdapter | null = null;
            let seedFallback = false;

            if (options.adapter !== undefined) {
                adapter = options.adapter;
            } else if (status.credentials) {
                adapter = await createAdapterFromConfig(config);
                if (!adapter) {
                    throw new Error(
                        `Nectarine ${vendor} credentials resolved but the config-aware adapter factory returned null`,
                    );
                }
            } else if (status.present.length > 0) {
                // Partial vendor env is a boot error, not "no database."
                config.requireCredentials();
            } else if (hostAllowsSeedFallback(config, env)) {
                seedFallback = true;
            } else {
                config.requireCredentials();
            }

            let migrations: MigrationRunResult | null = null;
            let connected = false;

            if (adapter) {
                try {
                    await adapter.connect();
                    connected = true;
                    const execute = asMigrationExecutor(adapter);
                    if (execute) {
                        const creds = status.credentials;
                        migrations = await applyNectarineMigrations(
                            config,
                            execute,
                            {
                                migrationsDir: options.migrationsDir,
                                protectedColumns: options.protectedColumns,
                                tableSchema:
                                    vendor === "mysql" && creds
                                        ? creds.database
                                        : undefined,
                            },
                        );
                    }
                } catch (error) {
                    await adapter.disconnect().catch(() => undefined);
                    throw error;
                }
            }

            const handle: NectarineModuleHandle = {
                config,
                configPath,
                vendor,
                adapter,
                query: adapter ? bindQuery(adapter) : undefined,
                migrations,
                seedFallback,
                connected,
                listApiOperations: (resource) =>
                    listNectarineApiOperations(config, resource),
                createReadRoutes: (options) =>
                    createNectarineHandleReadRoutes(handle, options),
                createWriteRoutes: (options) =>
                    createNectarineHandleWriteRoutes(handle, options),
                createRoutes: (options) =>
                    createNectarineHandleRoutes(handle, options),
            };
            ctx.registerModuleHandle(NECTARINE_MODULE_ID, handle);
        },
        async health(ctx) {
            const handle = ctx.getModuleHandle<NectarineModuleHandle>(
                NECTARINE_MODULE_ID,
            );
            if (!handle?.config) {
                return { ok: false, detail: "nectarine handle missing" };
            }
            if (handle.seedFallback) {
                return {
                    ok: true,
                    detail: "nectarine.config.yaml loaded (seed fallback; database not connected)",
                };
            }
            if (handle.connected) {
                return {
                    ok: true,
                    detail: `nectarine.config.yaml loaded; ${handle.vendor} connected`,
                };
            }
            return {
                ok: false,
                detail: "nectarine config loaded but database is not connected",
            };
        },
        async shutdown(ctx) {
            const handle = ctx.getModuleHandle<NectarineModuleHandle>(
                NECTARINE_MODULE_ID,
            );
            if (handle?.adapter) {
                await handle.adapter.disconnect();
                handle.connected = false;
            }
        },
    };
}

export const nectarineModule: KernelModule = createNectarineModule();
