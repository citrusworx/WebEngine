import { type ApiOperation, type DatabaseVendor, type MigrationExecutor, type MigrationRunResult, type NectarineConfig, type ProtectedColumn } from "@citrusworx/nectarine";
import type { RequestContext, Route } from "@citrusworx/seltzer";
import type { KernelModule } from "../types.js";
import { type CreateNectarineReadRoutesOptions } from "./nectarine-routes.js";
export declare const NECTARINE_MODULE_ID = "nectarine";
/**
 * Minimal adapter surface the kernel hosts. SQL adapters expose `query`
 * (+ optional `withTransaction`). Mongo uses connect/disconnect only.
 */
export interface NectarineKernelAdapter {
    connect: () => Promise<unknown>;
    disconnect: () => Promise<void>;
    query?: (sql: string, params?: readonly unknown[]) => Promise<unknown>;
    withTransaction?: <T>(work: (query: (sql: string, params?: readonly unknown[]) => Promise<unknown>) => Promise<T>) => Promise<T>;
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
     * Prefer {@link createReadRoutes} when the host wants `Route`s; this stays
     * for hosts that compose `generateRoutes` themselves.
     */
    listApiOperations: (resource?: string) => ApiOperation[];
    /**
     * Opt-in Nectarine → Seltzer route generation. Uses `listApiOperations`
     * plus compiled `*Queries.yml` / adapter `query` unless the host passes
     * `execute`. HTTP listen stays in Seltzer — call this after bootstrap and
     * `app.route(...)`.
     */
    createReadRoutes: <TContext extends RequestContext = RequestContext>(options: CreateNectarineReadRoutesOptions<TContext>) => Route<TContext>[];
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
/**
 * Flatten one resource or every loaded resource's `*API.yml`.
 * Prefer {@link createNectarineReadRoutes} when the host wants Seltzer `Route`s.
 */
export declare function listNectarineApiOperations(config: NectarineConfig, resource?: string): ApiOperation[];
/**
 * Thin host wrapper around Nectarine `applyMigrations`.
 * Schemas come from loaded `*Schema.yml`; versioned YAML from `migrationsDir`
 * (empty or missing directory is a valid no-op). No SQL in this wrapper.
 */
export declare function applyNectarineMigrations(config: NectarineConfig, execute: MigrationExecutor, options?: {
    migrationsDir?: string;
    protectedColumns?: readonly ProtectedColumn[];
    tableSchema?: string;
}): Promise<MigrationRunResult>;
export declare function createNectarineModule(options?: NectarineModuleOptions): KernelModule;
export declare const nectarineModule: KernelModule;
