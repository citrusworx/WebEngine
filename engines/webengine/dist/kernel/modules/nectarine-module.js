import * as path from "node:path";
import { applyMigrations, listApiOperations, loadMigrationDocuments, loadNectarineConfig, } from "@citrusworx/nectarine";
export const NECTARINE_MODULE_ID = "nectarine";
function resolveConfigPath(projectRoot, options, env) {
    const fromOption = options.configPath;
    const fromEnv = env.NECTARINE_CONFIG;
    const relative = fromOption ?? fromEnv ?? "nectarine.config.yaml";
    return path.resolve(projectRoot, relative);
}
function hostAllowsSeedFallback(config, env) {
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
 * Hosts hand the result to Seltzer `generateRoutes`.
 */
export function listNectarineApiOperations(config, resource) {
    if (resource) {
        const loaded = config.getResource(resource);
        return listApiOperations(loaded.name, loaded.api);
    }
    return [...config.resources.values()].flatMap((loaded) => listApiOperations(loaded.name, loaded.api));
}
/**
 * Thin host wrapper around Nectarine `applyMigrations`.
 * Schemas come from loaded `*Schema.yml`; versioned YAML from `migrationsDir`
 * (empty or missing directory is a valid no-op). No SQL in this wrapper.
 */
export async function applyNectarineMigrations(config, execute, options = {}) {
    const vendor = config.getVendor();
    if (vendor === "mongodb") {
        return { applied: [], skipped: [] };
    }
    const migrationsDir = options.migrationsDir ?? path.join(config.rootDir, "migrations");
    const schemas = [...config.resources.values()].map((resource) => resource.schema);
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
async function createAdapterFromConfig(config) {
    const vendor = config.getVendor();
    if (vendor === "postgres") {
        const { createPgAdapterFromConfig } = await import("@citrusworx/nectarine/adapters/pg");
        return createPgAdapterFromConfig(config);
    }
    if (vendor === "mysql") {
        const { createMysqlAdapterFromConfig } = await import("@citrusworx/nectarine/adapters/ms");
        return createMysqlAdapterFromConfig(config);
    }
    const { createMongoAdapterFromConfig } = await import("@citrusworx/nectarine/adapters/mg");
    return createMongoAdapterFromConfig(config);
}
function asMigrationExecutor(adapter) {
    if (typeof adapter.query !== "function") {
        return null;
    }
    return {
        query: adapter.query,
        withTransaction: adapter.withTransaction,
    };
}
export function createNectarineModule(options = {}) {
    return {
        id: NECTARINE_MODULE_ID,
        dependencies: ["core"],
        async scaffold(_ctx) {
            // v1: hosts own nectarine.config.yaml; no filesystem scaffolding
        },
        async bootstrap(ctx) {
            const env = options.env ?? process.env;
            const configPath = resolveConfigPath(ctx.projectRoot, options, env);
            const config = loadNectarineConfig(configPath, { env });
            const vendor = config.getVendor();
            const status = config.credentialStatus();
            let adapter = null;
            let seedFallback = false;
            if (options.adapter !== undefined) {
                adapter = options.adapter;
            }
            else if (status.credentials) {
                adapter = await createAdapterFromConfig(config);
                if (!adapter) {
                    throw new Error(`Nectarine ${vendor} credentials resolved but the config-aware adapter factory returned null`);
                }
            }
            else if (status.present.length > 0) {
                // Partial vendor env is a boot error, not "no database."
                config.requireCredentials();
            }
            else if (hostAllowsSeedFallback(config, env)) {
                seedFallback = true;
            }
            else {
                config.requireCredentials();
            }
            let migrations = null;
            let connected = false;
            if (adapter) {
                try {
                    await adapter.connect();
                    connected = true;
                    const execute = asMigrationExecutor(adapter);
                    if (execute) {
                        const creds = status.credentials;
                        migrations = await applyNectarineMigrations(config, execute, {
                            migrationsDir: options.migrationsDir,
                            protectedColumns: options.protectedColumns,
                            tableSchema: vendor === "mysql" && creds
                                ? creds.database
                                : undefined,
                        });
                    }
                }
                catch (error) {
                    await adapter.disconnect().catch(() => undefined);
                    throw error;
                }
            }
            const handle = {
                config,
                configPath,
                vendor,
                adapter,
                query: adapter?.query,
                migrations,
                seedFallback,
                connected,
                listApiOperations: (resource) => listNectarineApiOperations(config, resource),
            };
            ctx.registerModuleHandle(NECTARINE_MODULE_ID, handle);
        },
        async health(ctx) {
            const handle = ctx.getModuleHandle(NECTARINE_MODULE_ID);
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
            const handle = ctx.getModuleHandle(NECTARINE_MODULE_ID);
            if (handle?.adapter) {
                await handle.adapter.disconnect();
                handle.connected = false;
            }
        },
    };
}
export const nectarineModule = createNectarineModule();
//# sourceMappingURL=nectarine-module.js.map