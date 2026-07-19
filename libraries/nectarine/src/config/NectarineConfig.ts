import path from "node:path";
import { loadYaml } from "./yaml.js";
import type {
    DatabaseCredentials,
    DatabaseEnvKeys,
    DatabaseVendor,
    LoadedResource,
    LoadNectarineConfigOptions,
    NectarineAppDefinition,
    NectarineConfigFile,
    ResourceRef,
} from "./types.js";

const VENDORS: DatabaseVendor[] = ["postgres", "mysql", "mongodb"];

function assertConfigShape(raw: NectarineConfigFile, configPath: string): void {
    if (!raw.version) {
        throw new Error(`Nectarine config missing "version": ${configPath}`);
    }

    if (!raw.database?.default) {
        throw new Error(`Nectarine config missing "database.default": ${configPath}`);
    }

    if (!VENDORS.includes(raw.database.default)) {
        throw new Error(
            `Nectarine config database.default must be one of ${VENDORS.join(", ")}: ${configPath}`,
        );
    }
}

function resolveResourcePaths(rootDir: string, ref: ResourceRef): ResourceRef {
    return {
        name: ref.name,
        schema: path.resolve(rootDir, ref.schema),
        queries: path.resolve(rootDir, ref.queries),
        api: path.resolve(rootDir, ref.api),
    };
}

function loadResource(ref: ResourceRef): LoadedResource {
    return {
        name: ref.name,
        schema: loadYaml(ref.schema),
        queries: loadYaml(ref.queries),
        api: loadYaml(ref.api),
        paths: {
            schema: ref.schema,
            queries: ref.queries,
            api: ref.api,
        },
    };
}

/**
 * Parsed, path-resolved Nectarine project config.
 * Created via {@link NectarineConfig.load} / {@link loadNectarineConfig}.
 */
export class NectarineConfig {
    readonly configPath: string;
    readonly rootDir: string;
    readonly raw: NectarineConfigFile;
    readonly resources: ReadonlyMap<string, LoadedResource>;
    readonly resourceRefs: readonly ResourceRef[];
    readonly apps: readonly NectarineAppDefinition[];

    private readonly env: NodeJS.ProcessEnv;

    private constructor(
        configPath: string,
        raw: NectarineConfigFile,
        resourceRefs: ResourceRef[],
        resources: Map<string, LoadedResource>,
        env: NodeJS.ProcessEnv,
    ) {
        this.configPath = configPath;
        this.rootDir = path.dirname(configPath);
        this.raw = raw;
        this.resourceRefs = resourceRefs;
        this.resources = resources;
        this.apps = raw.apps ?? [];
        this.env = env;
    }

    /**
     * Load `nectarine.config.yaml` (or any path), resolve resource paths,
     * and optionally parse each resource triad.
     */
    static load(configPath: string, options: LoadNectarineConfigOptions = {}): NectarineConfig {
        const absolutePath = path.resolve(configPath);
        const raw = loadYaml<NectarineConfigFile>(absolutePath);
        assertConfigShape(raw, absolutePath);

        const rootDir = path.dirname(absolutePath);
        const refs = (raw.resources ?? []).map((ref) => {
            if (!ref?.name || !ref.schema || !ref.queries || !ref.api) {
                throw new Error(
                    `Nectarine resource entries require name, schema, queries, and api: ${absolutePath}`,
                );
            }
            return resolveResourcePaths(rootDir, ref);
        });

        const loadResources = options.loadResources !== false;
        const resources = new Map<string, LoadedResource>();

        if (loadResources) {
            for (const ref of refs) {
                if (resources.has(ref.name)) {
                    throw new Error(`Duplicate Nectarine resource "${ref.name}" in ${absolutePath}`);
                }
                resources.set(ref.name, loadResource(ref));
            }
        }

        return new NectarineConfig(
            absolutePath,
            raw,
            refs,
            resources,
            options.env ?? process.env,
        );
    }

    get version(): string {
        return this.raw.version;
    }

    get app(): string | undefined {
        return this.raw.app;
    }

    get transportServer(): string | undefined {
        return this.raw.transport?.server;
    }

    get seedFallback(): boolean {
        return Boolean(this.raw.fallback?.seed);
    }

    getVendor(vendor?: DatabaseVendor): DatabaseVendor {
        return vendor ?? this.raw.database.default;
    }

    /** Env key names from YAML for the active (or given) vendor. */
    getEnvKeys(vendor?: DatabaseVendor): DatabaseEnvKeys {
        const name = this.getVendor(vendor);
        const block = this.raw.database[name];

        if (!block?.env) {
            throw new Error(
                `Nectarine config missing database.${name}.env in ${this.configPath}`,
            );
        }

        const { user, password, host, port, database } = block.env;
        if (!user || !password || !host || !port || !database) {
            throw new Error(
                `Nectarine database.${name}.env must define user, password, host, port, database`,
            );
        }

        return { user, password, host, port, database };
    }

    /**
     * Read credential values from env using YAML-declared key names.
     * Returns null when any required value is missing (seed/fallback path).
     */
    resolveCredentials(
        vendor?: DatabaseVendor,
        env: NodeJS.ProcessEnv = this.env,
    ): DatabaseCredentials | null {
        const keys = this.getEnvKeys(vendor);
        const user = env[keys.user]?.trim();
        const password = env[keys.password]?.trim();
        const host = env[keys.host]?.trim();
        const portRaw = env[keys.port]?.trim();
        const database = env[keys.database]?.trim();

        if (!user || !password || !host || !portRaw || !database) {
            return null;
        }

        const port = Number(portRaw);
        if (!Number.isFinite(port)) {
            throw new Error(
                `Nectarine env ${keys.port} must be a number, got "${portRaw}"`,
            );
        }

        return { user, password, host, port, database };
    }

    isDatabaseConfigured(
        vendor?: DatabaseVendor,
        env: NodeJS.ProcessEnv = this.env,
    ): boolean {
        return this.resolveCredentials(vendor, env) !== null;
    }

    getResource(name: string): LoadedResource {
        const resource = this.resources.get(name);
        if (!resource) {
            throw new Error(
                `Nectarine resource "${name}" is not loaded. Check resources in ${this.configPath}`,
            );
        }
        return resource;
    }

    hasResource(name: string): boolean {
        return this.resources.has(name) || this.resourceRefs.some((ref) => ref.name === name);
    }

    getApp(id: string): NectarineAppDefinition | undefined {
        return this.apps.find((app) => app.id === id);
    }

    getAppBySubdomain(subdomain: string): NectarineAppDefinition | undefined {
        return this.apps.find((app) => app.subdomain === subdomain);
    }

    getAppsForResource(resourceName: string): NectarineAppDefinition[] {
        return this.apps.filter((app) => app.resources?.includes(resourceName));
    }

    getIntegration(name: string): unknown {
        return this.raw.integrations?.[name];
    }
}
