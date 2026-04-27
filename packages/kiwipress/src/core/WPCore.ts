export type WPCoreConfig = {
    url: string;
    apiBase: string;
    username?: string;
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
        token: maybeProcess.env.WP_TOKEN?.trim(),
        apiKey: maybeProcess.env.WP_API_KEY?.trim()
    };
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
            token,
            apiKey,
            headers
        };
    }

    protected createAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            ...this.config.headers
        };

        if (this.config.token) {
            headers.Authorization = `Bearer ${this.config.token}`;
        }

        if (this.config.apiKey) {
            headers["X-API-Key"] = this.config.apiKey;
        }

        if (this.config.username) {
            headers["X-WP-User"] = this.config.username;
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
