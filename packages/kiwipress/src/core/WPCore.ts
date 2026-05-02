export type WPCoreConfig = {
    url: string;
    apiBase: string;
    username?: string;
    appPassword?: string;
    token?: string;
    apiKey?: string;
    headers?: Record<string, string>;
};

export type RouteParams = Record<string, string | number>;

function loadNodeEnvConfig(): Partial<WPCoreConfig> {
    const maybeProcess = typeof process !== "undefined" ? process : undefined;

    if (!maybeProcess?.versions?.node) {
        return {};
    }

    try {
        const nodeRequire = Function("return typeof require !== 'undefined' ? require : null;")() as NodeRequire | null;

        if (nodeRequire) {
            const path = nodeRequire("node:path");
            const dotenv = nodeRequire("dotenv");
            const envPath = path.resolve(maybeProcess.cwd(), "packages/kiwipress/.env");
            dotenv.config({ path: envPath });
        }
    } catch {
        // Ignore env bootstrapping failures when running outside Node.
    }

    return {
        url: maybeProcess.env.WP_URL?.trim(),
        apiBase: maybeProcess.env.WP_API?.trim(),
        username: maybeProcess.env.WP_USER?.trim(),
        appPassword: maybeProcess.env.WP_APP_PASSWORD?.trim(),
        token: maybeProcess.env.WP_TOKEN?.trim(),
        apiKey: maybeProcess.env.WP_API_KEY?.trim()
    };
}

function encodeBase64(value: string): string {
    const maybeBuffer = typeof Buffer !== "undefined" ? Buffer : undefined;

    if (maybeBuffer) {
        return maybeBuffer.from(value).toString("base64");
    }

    if (typeof btoa !== "undefined") {
        return btoa(value);
    }

    throw new Error("Unable to encode WordPress credentials.");
}

export class WPCore {
    protected readonly config: WPCoreConfig;

    constructor(config?: Partial<WPCoreConfig>) {
        this.config = this.createConfig(config);
    }

    protected createConfig(overrides?: Partial<WPCoreConfig>): WPCoreConfig {
        const envConfig = loadNodeEnvConfig();
        const url = overrides?.url ?? envConfig.url ?? "";
        const apiBase = overrides?.apiBase ?? envConfig.apiBase ?? "wp-json/v2";
        const username = overrides?.username ?? envConfig.username;
        const appPassword = overrides?.appPassword ?? envConfig.appPassword;
        const token = overrides?.token ?? envConfig.token;
        const apiKey = overrides?.apiKey ?? envConfig.apiKey;
        const headers = overrides?.headers ?? {};

        if (!url) {
            throw new Error("WPCore requires WP_URL to be defined in packages/kiwipress/.env.");
        }

        return {
            url: url.replace(/\/+$/, ""),
            apiBase: apiBase.replace(/^\/+/, "").replace(/\/+$/, ""),
            username,
            appPassword,
            token,
            apiKey,
            headers
        };
    }

    protected createAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            ...this.config.headers
        };

        if (this.config.username && this.config.appPassword) {
            headers.Authorization = `Basic ${encodeBase64(`${this.config.username}:${this.config.appPassword}`)}`;
        } else if (this.config.token) {
            headers.Authorization = `Bearer ${this.config.token}`;
        }

        if (this.config.apiKey) {
            headers["X-API-Key"] = this.config.apiKey;
        }
        return headers;
    }

    protected interpolatePath(routePath: string, params: RouteParams = {}): string {
        return Object.entries(params).reduce((resolvedPath, [key, value]) => {
            return resolvedPath.replace(`:${key}`, encodeURIComponent(String(value)));
        }, routePath);
    }

    protected getConfig(): WPCoreConfig {
        return this.config;
    }
}
