import type { DatabaseCredentials, DatabaseEnvKeys, DatabaseVendor, LoadedResource, LoadNectarineConfigOptions, NectarineAppDefinition, NectarineConfigFile, ResourceRef } from "./types.js";
/**
 * Parsed, path-resolved Nectarine project config.
 * Created via {@link NectarineConfig.load} / {@link loadNectarineConfig}.
 */
export declare class NectarineConfig {
    readonly configPath: string;
    readonly rootDir: string;
    readonly raw: NectarineConfigFile;
    readonly resources: ReadonlyMap<string, LoadedResource>;
    readonly resourceRefs: readonly ResourceRef[];
    readonly apps: readonly NectarineAppDefinition[];
    private readonly env;
    private constructor();
    /**
     * Load `nectarine.config.yaml` (or any path), resolve resource paths,
     * and optionally parse each resource triad.
     */
    static load(configPath: string, options?: LoadNectarineConfigOptions): NectarineConfig;
    get version(): string;
    get app(): string | undefined;
    get transportServer(): string | undefined;
    get seedFallback(): boolean;
    getVendor(vendor?: DatabaseVendor): DatabaseVendor;
    /** Env key names from YAML for the active (or given) vendor. */
    getEnvKeys(vendor?: DatabaseVendor): DatabaseEnvKeys;
    /**
     * Read credential values from env using YAML-declared key names.
     * Returns null when any required value is missing (seed/fallback path).
     */
    resolveCredentials(vendor?: DatabaseVendor, env?: NodeJS.ProcessEnv): DatabaseCredentials | null;
    isDatabaseConfigured(vendor?: DatabaseVendor, env?: NodeJS.ProcessEnv): boolean;
    getResource(name: string): LoadedResource;
    hasResource(name: string): boolean;
    getApp(id: string): NectarineAppDefinition | undefined;
    getAppBySubdomain(subdomain: string): NectarineAppDefinition | undefined;
    getAppsForResource(resourceName: string): NectarineAppDefinition[];
    getIntegration(name: string): unknown;
}
