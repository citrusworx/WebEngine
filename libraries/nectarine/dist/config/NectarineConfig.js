"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NectarineConfig = void 0;
const node_path_1 = __importDefault(require("node:path"));
const yaml_js_1 = require("./yaml.js");
const VENDORS = ["postgres", "mysql", "mongodb"];
function assertConfigShape(raw, configPath) {
    if (!raw.version) {
        throw new Error(`Nectarine config missing "version": ${configPath}`);
    }
    if (!raw.database?.default) {
        throw new Error(`Nectarine config missing "database.default": ${configPath}`);
    }
    if (!VENDORS.includes(raw.database.default)) {
        throw new Error(`Nectarine config database.default must be one of ${VENDORS.join(", ")}: ${configPath}`);
    }
}
function resolveResourcePaths(rootDir, ref) {
    return {
        name: ref.name,
        schema: node_path_1.default.resolve(rootDir, ref.schema),
        queries: node_path_1.default.resolve(rootDir, ref.queries),
        api: node_path_1.default.resolve(rootDir, ref.api),
    };
}
function loadResource(ref) {
    return {
        name: ref.name,
        schema: (0, yaml_js_1.loadYaml)(ref.schema),
        queries: (0, yaml_js_1.loadYaml)(ref.queries),
        api: (0, yaml_js_1.loadYaml)(ref.api),
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
class NectarineConfig {
    constructor(configPath, raw, resourceRefs, resources, env) {
        this.configPath = configPath;
        this.rootDir = node_path_1.default.dirname(configPath);
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
    static load(configPath, options = {}) {
        const absolutePath = node_path_1.default.resolve(configPath);
        const raw = (0, yaml_js_1.loadYaml)(absolutePath);
        assertConfigShape(raw, absolutePath);
        const rootDir = node_path_1.default.dirname(absolutePath);
        const refs = (raw.resources ?? []).map((ref) => {
            if (!ref?.name || !ref.schema || !ref.queries || !ref.api) {
                throw new Error(`Nectarine resource entries require name, schema, queries, and api: ${absolutePath}`);
            }
            return resolveResourcePaths(rootDir, ref);
        });
        const loadResources = options.loadResources !== false;
        const resources = new Map();
        if (loadResources) {
            for (const ref of refs) {
                if (resources.has(ref.name)) {
                    throw new Error(`Duplicate Nectarine resource "${ref.name}" in ${absolutePath}`);
                }
                resources.set(ref.name, loadResource(ref));
            }
        }
        return new NectarineConfig(absolutePath, raw, refs, resources, options.env ?? process.env);
    }
    get version() {
        return this.raw.version;
    }
    get app() {
        return this.raw.app;
    }
    get transportServer() {
        return this.raw.transport?.server;
    }
    get seedFallback() {
        return Boolean(this.raw.fallback?.seed);
    }
    getVendor(vendor) {
        return vendor ?? this.raw.database.default;
    }
    /** Env key names from YAML for the active (or given) vendor. */
    getEnvKeys(vendor) {
        const name = this.getVendor(vendor);
        const block = this.raw.database[name];
        if (!block?.env) {
            throw new Error(`Nectarine config missing database.${name}.env in ${this.configPath}`);
        }
        const { user, password, host, port, database } = block.env;
        if (!user || !password || !host || !port || !database) {
            throw new Error(`Nectarine database.${name}.env must define user, password, host, port, database`);
        }
        return { user, password, host, port, database };
    }
    /**
     * Read credential values from env using YAML-declared key names.
     * Returns null when any required value is missing (seed/fallback path).
     */
    resolveCredentials(vendor, env = this.env) {
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
            throw new Error(`Nectarine env ${keys.port} must be a number, got "${portRaw}"`);
        }
        return { user, password, host, port, database };
    }
    isDatabaseConfigured(vendor, env = this.env) {
        return this.resolveCredentials(vendor, env) !== null;
    }
    getResource(name) {
        const resource = this.resources.get(name);
        if (!resource) {
            throw new Error(`Nectarine resource "${name}" is not loaded. Check resources in ${this.configPath}`);
        }
        return resource;
    }
    hasResource(name) {
        return this.resources.has(name) || this.resourceRefs.some((ref) => ref.name === name);
    }
    getApp(id) {
        return this.apps.find((app) => app.id === id);
    }
    getAppBySubdomain(subdomain) {
        return this.apps.find((app) => app.subdomain === subdomain);
    }
    getAppsForResource(resourceName) {
        return this.apps.filter((app) => app.resources?.includes(resourceName));
    }
    getIntegration(name) {
        return this.raw.integrations?.[name];
    }
}
exports.NectarineConfig = NectarineConfig;
//# sourceMappingURL=NectarineConfig.js.map