export type DatabaseVendor = "postgres" | "mysql" | "mongodb";

/** Env var *names* declared in YAML (not secret values). */
export type DatabaseEnvKeys = {
    user: string;
    password: string;
    host: string;
    port: string;
    database: string;
};

/** Resolved credential values read from process env. */
export type DatabaseCredentials = {
    user: string;
    password: string;
    host: string;
    port: number;
    database: string;
};

export type ResourceRef = {
    name: string;
    schema: string;
    queries: string;
    api: string;
};

export type NectarineAppDefinition = {
    id: string;
    subdomain: string;
    purpose?: string;
    resources?: string[];
    integration?: string;
};

export type DatabaseVendorConfig = {
    env: DatabaseEnvKeys;
};

export type NectarineConfigFile = {
    version: string;
    app?: string;
    engine?: string;
    database: {
        default: DatabaseVendor;
        postgres?: DatabaseVendorConfig;
        mysql?: DatabaseVendorConfig;
        mongodb?: DatabaseVendorConfig;
    };
    transport?: {
        server?: string;
        [key: string]: unknown;
    };
    fallback?: {
        seed?: boolean;
        [key: string]: unknown;
    };
    apps?: NectarineAppDefinition[];
    resources?: ResourceRef[];
    integrations?: Record<string, unknown>;
    [key: string]: unknown;
};

export type LoadedResource = {
    name: string;
    schema: Record<string, unknown>;
    queries: Record<string, unknown>;
    api: Record<string, unknown>;
    paths: {
        schema: string;
        queries: string;
        api: string;
    };
};

export type LoadNectarineConfigOptions = {
    /** Defaults to `process.env`. */
    env?: NodeJS.ProcessEnv;
    /** When false, resource YAML files are not loaded (paths only). Default true. */
    loadResources?: boolean;
};
